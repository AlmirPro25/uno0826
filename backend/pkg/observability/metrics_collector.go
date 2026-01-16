package observability

import (
	"fmt"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

// ========================================
// METRICS COLLECTOR - Prometheus-style
// "Métricas são os olhos do sistema"
// ========================================

// MetricType define o tipo de métrica
type MetricType string

const (
	MetricTypeCounter   MetricType = "counter"
	MetricTypeGauge     MetricType = "gauge"
	MetricTypeHistogram MetricType = "histogram"
	MetricTypeSummary   MetricType = "summary"
)

// Labels são pares chave-valor para dimensionar métricas
type Labels map[string]string

func (l Labels) String() string {
	if len(l) == 0 {
		return ""
	}
	keys := make([]string, 0, len(l))
	for k := range l {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	
	result := "{"
	for i, k := range keys {
		if i > 0 {
			result += ","
		}
		result += fmt.Sprintf(`%s="%s"`, k, l[k])
	}
	result += "}"
	return result
}

// Metric representa uma métrica genérica
type Metric struct {
	Name        string     `json:"name"`
	Type        MetricType `json:"type"`
	Help        string     `json:"help"`
	Labels      Labels     `json:"labels,omitempty"`
	Value       float64    `json:"value"`
	Timestamp   time.Time  `json:"timestamp"`
}

// Counter é uma métrica que só aumenta
type Counter struct {
	name   string
	help   string
	labels Labels
	value  uint64
}

func (c *Counter) Inc() {
	atomic.AddUint64(&c.value, 1)
}

func (c *Counter) Add(delta float64) {
	if delta < 0 {
		return // Counters não podem diminuir
	}
	atomic.AddUint64(&c.value, uint64(delta))
}

func (c *Counter) Value() float64 {
	return float64(atomic.LoadUint64(&c.value))
}

// Gauge é uma métrica que pode subir ou descer
type Gauge struct {
	name   string
	help   string
	labels Labels
	value  int64
}

func (g *Gauge) Set(value float64) {
	atomic.StoreInt64(&g.value, int64(value*1000))
}

func (g *Gauge) Inc() {
	atomic.AddInt64(&g.value, 1000)
}

func (g *Gauge) Dec() {
	atomic.AddInt64(&g.value, -1000)
}

func (g *Gauge) Add(delta float64) {
	atomic.AddInt64(&g.value, int64(delta*1000))
}

func (g *Gauge) Value() float64 {
	return float64(atomic.LoadInt64(&g.value)) / 1000
}

// Histogram coleta observações em buckets
type Histogram struct {
	name    string
	help    string
	labels  Labels
	buckets []float64
	counts  []uint64
	sum     uint64
	count   uint64
	mu      sync.Mutex
}

func NewHistogram(name, help string, labels Labels, buckets []float64) *Histogram {
	sort.Float64s(buckets)
	return &Histogram{
		name:    name,
		help:    help,
		labels:  labels,
		buckets: buckets,
		counts:  make([]uint64, len(buckets)+1), // +1 para +Inf
	}
}

func (h *Histogram) Observe(value float64) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Encontrar bucket
	for i, bound := range h.buckets {
		if value <= bound {
			h.counts[i]++
			break
		}
	}
	// +Inf bucket
	h.counts[len(h.buckets)]++

	atomic.AddUint64(&h.sum, uint64(value*1000))
	atomic.AddUint64(&h.count, 1)
}

func (h *Histogram) Sum() float64 {
	return float64(atomic.LoadUint64(&h.sum)) / 1000
}

func (h *Histogram) Count() uint64 {
	return atomic.LoadUint64(&h.count)
}

// ========================================
// METRICS REGISTRY
// ========================================

type MetricsRegistry struct {
	counters   map[string]*Counter
	gauges     map[string]*Gauge
	histograms map[string]*Histogram
	mu         sync.RWMutex
}

var globalRegistry = &MetricsRegistry{
	counters:   make(map[string]*Counter),
	gauges:     make(map[string]*Gauge),
	histograms: make(map[string]*Histogram),
}

// GetRegistry retorna o registry global
func GetRegistry() *MetricsRegistry {
	return globalRegistry
}

// NewCounter cria ou retorna um counter existente
func (r *MetricsRegistry) NewCounter(name, help string, labels Labels) *Counter {
	key := name + labels.String()
	
	r.mu.Lock()
	defer r.mu.Unlock()

	if c, exists := r.counters[key]; exists {
		return c
	}

	c := &Counter{name: name, help: help, labels: labels}
	r.counters[key] = c
	return c
}

// NewGauge cria ou retorna um gauge existente
func (r *MetricsRegistry) NewGauge(name, help string, labels Labels) *Gauge {
	key := name + labels.String()
	
	r.mu.Lock()
	defer r.mu.Unlock()

	if g, exists := r.gauges[key]; exists {
		return g
	}

	g := &Gauge{name: name, help: help, labels: labels}
	r.gauges[key] = g
	return g
}

// NewHistogram cria ou retorna um histogram existente
func (r *MetricsRegistry) NewHistogram(name, help string, labels Labels, buckets []float64) *Histogram {
	key := name + labels.String()
	
	r.mu.Lock()
	defer r.mu.Unlock()

	if h, exists := r.histograms[key]; exists {
		return h
	}

	h := NewHistogram(name, help, labels, buckets)
	r.histograms[key] = h
	return h
}

// GetAllMetrics retorna todas as métricas
func (r *MetricsRegistry) GetAllMetrics() []Metric {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var metrics []Metric
	now := time.Now()

	for _, c := range r.counters {
		metrics = append(metrics, Metric{
			Name:      c.name,
			Type:      MetricTypeCounter,
			Help:      c.help,
			Labels:    c.labels,
			Value:     c.Value(),
			Timestamp: now,
		})
	}

	for _, g := range r.gauges {
		metrics = append(metrics, Metric{
			Name:      g.name,
			Type:      MetricTypeGauge,
			Help:      g.help,
			Labels:    g.labels,
			Value:     g.Value(),
			Timestamp: now,
		})
	}

	for _, h := range r.histograms {
		metrics = append(metrics, Metric{
			Name:      h.name + "_sum",
			Type:      MetricTypeHistogram,
			Help:      h.help,
			Labels:    h.labels,
			Value:     h.Sum(),
			Timestamp: now,
		})
		metrics = append(metrics, Metric{
			Name:      h.name + "_count",
			Type:      MetricTypeHistogram,
			Help:      h.help,
			Labels:    h.labels,
			Value:     float64(h.Count()),
			Timestamp: now,
		})
	}

	return metrics
}

// PrometheusFormat exporta métricas em formato Prometheus
func (r *MetricsRegistry) PrometheusFormat() string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result string

	for _, c := range r.counters {
		result += fmt.Sprintf("# HELP %s %s\n", c.name, c.help)
		result += fmt.Sprintf("# TYPE %s counter\n", c.name)
		result += fmt.Sprintf("%s%s %v\n", c.name, c.labels.String(), c.Value())
	}

	for _, g := range r.gauges {
		result += fmt.Sprintf("# HELP %s %s\n", g.name, g.help)
		result += fmt.Sprintf("# TYPE %s gauge\n", g.name)
		result += fmt.Sprintf("%s%s %v\n", g.name, g.labels.String(), g.Value())
	}

	for _, h := range r.histograms {
		result += fmt.Sprintf("# HELP %s %s\n", h.name, h.help)
		result += fmt.Sprintf("# TYPE %s histogram\n", h.name)
		result += fmt.Sprintf("%s_sum%s %v\n", h.name, h.labels.String(), h.Sum())
		result += fmt.Sprintf("%s_count%s %v\n", h.name, h.labels.String(), h.Count())
	}

	return result
}

// ========================================
// COMMON METRICS - Pré-definidas
// ========================================

var (
	// HTTP Metrics
	HTTPRequestsTotal     *Counter
	HTTPRequestDuration   *Histogram
	HTTPRequestsInFlight  *Gauge
	HTTPResponseSize      *Histogram

	// Database Metrics
	DBQueriesTotal        *Counter
	DBQueryDuration       *Histogram
	DBConnectionsActive   *Gauge
	DBConnectionsIdle     *Gauge

	// Business Metrics
	UsersActive           *Gauge
	EventsProcessed       *Counter
	RulesEvaluated        *Counter
	BillingRevenue        *Counter
)

// InitCommonMetrics inicializa métricas comuns
func InitCommonMetrics() {
	reg := GetRegistry()

	// HTTP
	HTTPRequestsTotal = reg.NewCounter("http_requests_total", "Total HTTP requests", nil)
	HTTPRequestDuration = reg.NewHistogram("http_request_duration_seconds", "HTTP request duration",
		nil, []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10})
	HTTPRequestsInFlight = reg.NewGauge("http_requests_in_flight", "Current HTTP requests being processed", nil)
	HTTPResponseSize = reg.NewHistogram("http_response_size_bytes", "HTTP response size",
		nil, []float64{100, 1000, 10000, 100000, 1000000})

	// Database
	DBQueriesTotal = reg.NewCounter("db_queries_total", "Total database queries", nil)
	DBQueryDuration = reg.NewHistogram("db_query_duration_seconds", "Database query duration",
		nil, []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1})
	DBConnectionsActive = reg.NewGauge("db_connections_active", "Active database connections", nil)
	DBConnectionsIdle = reg.NewGauge("db_connections_idle", "Idle database connections", nil)

	// Business
	UsersActive = reg.NewGauge("users_active", "Currently active users", nil)
	EventsProcessed = reg.NewCounter("events_processed_total", "Total events processed", nil)
	RulesEvaluated = reg.NewCounter("rules_evaluated_total", "Total rules evaluated", nil)
	BillingRevenue = reg.NewCounter("billing_revenue_cents", "Total revenue in cents", nil)
}
