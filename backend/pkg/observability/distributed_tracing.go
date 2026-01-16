package observability

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// ========================================
// DISTRIBUTED TRACING - Nível Google/Netflix
// "Rastrear cada request através de todos os serviços"
// ========================================

// TraceID é um identificador único de 128 bits para uma trace
type TraceID string

// SpanID é um identificador único de 64 bits para um span
type SpanID string

// Span representa uma unidade de trabalho dentro de uma trace
type Span struct {
	TraceID      TraceID                `json:"trace_id"`
	SpanID       SpanID                 `json:"span_id"`
	ParentSpanID SpanID                 `json:"parent_span_id,omitempty"`
	OperationName string                `json:"operation_name"`
	ServiceName  string                 `json:"service_name"`
	StartTime    time.Time              `json:"start_time"`
	EndTime      time.Time              `json:"end_time,omitempty"`
	Duration     time.Duration          `json:"duration_ms,omitempty"`
	Status       SpanStatus             `json:"status"`
	Tags         map[string]string      `json:"tags,omitempty"`
	Logs         []SpanLog              `json:"logs,omitempty"`
	Baggage      map[string]string      `json:"baggage,omitempty"`
}

type SpanStatus string

const (
	SpanStatusOK       SpanStatus = "OK"
	SpanStatusError    SpanStatus = "ERROR"
	SpanStatusTimeout  SpanStatus = "TIMEOUT"
	SpanStatusCanceled SpanStatus = "CANCELED"
)

type SpanLog struct {
	Timestamp time.Time         `json:"timestamp"`
	Event     string            `json:"event"`
	Fields    map[string]string `json:"fields,omitempty"`
}

// Tracer gerencia traces distribuídas
type Tracer struct {
	serviceName string
	spans       map[TraceID][]*Span
	mu          sync.RWMutex
	exporters   []SpanExporter
	sampler     Sampler
}

// SpanExporter exporta spans para backends (Jaeger, Zipkin, etc)
type SpanExporter interface {
	Export(spans []*Span) error
	Name() string
}

// Sampler decide se uma trace deve ser amostrada
type Sampler interface {
	ShouldSample(traceID TraceID) bool
}

// AlwaysSampler sempre amostra
type AlwaysSampler struct{}

func (s *AlwaysSampler) ShouldSample(traceID TraceID) bool { return true }

// RatioSampler amostra uma porcentagem das traces
type RatioSampler struct {
	ratio float64
}

func NewRatioSampler(ratio float64) *RatioSampler {
	if ratio < 0 {
		ratio = 0
	}
	if ratio > 1 {
		ratio = 1
	}
	return &RatioSampler{ratio: ratio}
}

func (s *RatioSampler) ShouldSample(traceID TraceID) bool {
	// Usar último byte do traceID para decisão determinística
	if len(traceID) < 2 {
		return true
	}
	lastByte := traceID[len(traceID)-2:]
	val, _ := hex.DecodeString(string(lastByte))
	if len(val) == 0 {
		return true
	}
	return float64(val[0])/255.0 < s.ratio
}

// NewTracer cria um novo tracer
func NewTracer(serviceName string) *Tracer {
	return &Tracer{
		serviceName: serviceName,
		spans:       make(map[TraceID][]*Span),
		exporters:   []SpanExporter{},
		sampler:     &AlwaysSampler{},
	}
}

// SetSampler define o sampler
func (t *Tracer) SetSampler(s Sampler) {
	t.sampler = s
}

// AddExporter adiciona um exportador
func (t *Tracer) AddExporter(e SpanExporter) {
	t.exporters = append(t.exporters, e)
}

// GenerateTraceID gera um novo TraceID
func GenerateTraceID() TraceID {
	b := make([]byte, 16)
	rand.Read(b)
	return TraceID(hex.EncodeToString(b))
}

// GenerateSpanID gera um novo SpanID
func GenerateSpanID() SpanID {
	b := make([]byte, 8)
	rand.Read(b)
	return SpanID(hex.EncodeToString(b))
}

// StartSpan inicia um novo span
func (t *Tracer) StartSpan(ctx context.Context, operationName string) (context.Context, *Span) {
	var traceID TraceID
	var parentSpanID SpanID

	// Verificar se já existe uma trace no contexto
	if existingSpan := SpanFromContext(ctx); existingSpan != nil {
		traceID = existingSpan.TraceID
		parentSpanID = existingSpan.SpanID
	} else {
		traceID = GenerateTraceID()
	}

	span := &Span{
		TraceID:       traceID,
		SpanID:        GenerateSpanID(),
		ParentSpanID:  parentSpanID,
		OperationName: operationName,
		ServiceName:   t.serviceName,
		StartTime:     time.Now(),
		Status:        SpanStatusOK,
		Tags:          make(map[string]string),
		Logs:          []SpanLog{},
		Baggage:       make(map[string]string),
	}

	// Copiar baggage do parent
	if existingSpan := SpanFromContext(ctx); existingSpan != nil {
		for k, v := range existingSpan.Baggage {
			span.Baggage[k] = v
		}
	}

	return ContextWithSpan(ctx, span), span
}

// FinishSpan finaliza um span
func (t *Tracer) FinishSpan(span *Span) {
	span.EndTime = time.Now()
	span.Duration = span.EndTime.Sub(span.StartTime)

	// Verificar se deve amostrar
	if !t.sampler.ShouldSample(span.TraceID) {
		return
	}

	// Armazenar span
	t.mu.Lock()
	t.spans[span.TraceID] = append(t.spans[span.TraceID], span)
	t.mu.Unlock()

	// Exportar para backends
	for _, exporter := range t.exporters {
		go exporter.Export([]*Span{span})
	}
}

// Context keys
type contextKey string

const spanContextKey contextKey = "span"

// ContextWithSpan adiciona span ao contexto
func ContextWithSpan(ctx context.Context, span *Span) context.Context {
	return context.WithValue(ctx, spanContextKey, span)
}

// SpanFromContext extrai span do contexto
func SpanFromContext(ctx context.Context) *Span {
	if span, ok := ctx.Value(spanContextKey).(*Span); ok {
		return span
	}
	return nil
}

// SetTag adiciona uma tag ao span
func (s *Span) SetTag(key, value string) *Span {
	s.Tags[key] = value
	return s
}

// SetError marca o span como erro
func (s *Span) SetError(err error) *Span {
	s.Status = SpanStatusError
	s.Tags["error"] = "true"
	s.Tags["error.message"] = err.Error()
	return s
}

// Log adiciona um log ao span
func (s *Span) Log(event string, fields map[string]string) *Span {
	s.Logs = append(s.Logs, SpanLog{
		Timestamp: time.Now(),
		Event:     event,
		Fields:    fields,
	})
	return s
}

// SetBaggage adiciona baggage (propagado para spans filhos)
func (s *Span) SetBaggage(key, value string) *Span {
	s.Baggage[key] = value
	return s
}

// ========================================
// HTTP PROPAGATION - W3C Trace Context
// ========================================

const (
	TraceParentHeader = "traceparent"
	TraceStateHeader  = "tracestate"
	BaggageHeader     = "baggage"
)

// InjectHTTP injeta trace context em headers HTTP
func InjectHTTP(span *Span, headers http.Header) {
	// W3C Trace Context format: version-traceid-spanid-flags
	traceParent := fmt.Sprintf("00-%s-%s-01", span.TraceID, span.SpanID)
	headers.Set(TraceParentHeader, traceParent)

	// Baggage
	if len(span.Baggage) > 0 {
		var baggage string
		for k, v := range span.Baggage {
			if baggage != "" {
				baggage += ","
			}
			baggage += fmt.Sprintf("%s=%s", k, v)
		}
		headers.Set(BaggageHeader, baggage)
	}
}

// ExtractHTTP extrai trace context de headers HTTP
func ExtractHTTP(headers http.Header) (TraceID, SpanID) {
	traceParent := headers.Get(TraceParentHeader)
	if traceParent == "" {
		return "", ""
	}

	// Parse W3C format: 00-traceid-spanid-flags
	var version, traceID, spanID, flags string
	_, err := fmt.Sscanf(traceParent, "%2s-%32s-%16s-%2s", &version, &traceID, &spanID, &flags)
	if err != nil {
		return "", ""
	}

	return TraceID(traceID), SpanID(spanID)
}

// ========================================
// CONSOLE EXPORTER (para desenvolvimento)
// ========================================

type ConsoleExporter struct{}

func (e *ConsoleExporter) Export(spans []*Span) error {
	for _, span := range spans {
		fmt.Printf("[TRACE] %s | %s | %s | %v | %s\n",
			span.TraceID[:8],
			span.ServiceName,
			span.OperationName,
			span.Duration,
			span.Status,
		)
	}
	return nil
}

func (e *ConsoleExporter) Name() string { return "console" }

// ========================================
// IN-MEMORY EXPORTER (para testes/dashboard)
// ========================================

type InMemoryExporter struct {
	spans []*Span
	mu    sync.RWMutex
	limit int
}

func NewInMemoryExporter(limit int) *InMemoryExporter {
	return &InMemoryExporter{
		spans: make([]*Span, 0),
		limit: limit,
	}
}

func (e *InMemoryExporter) Export(spans []*Span) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.spans = append(e.spans, spans...)

	// Manter apenas os últimos N spans
	if len(e.spans) > e.limit {
		e.spans = e.spans[len(e.spans)-e.limit:]
	}

	return nil
}

func (e *InMemoryExporter) Name() string { return "in-memory" }

func (e *InMemoryExporter) GetSpans() []*Span {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return append([]*Span{}, e.spans...)
}

func (e *InMemoryExporter) GetTrace(traceID TraceID) []*Span {
	e.mu.RLock()
	defer e.mu.RUnlock()

	var result []*Span
	for _, span := range e.spans {
		if span.TraceID == traceID {
			result = append(result, span)
		}
	}
	return result
}
