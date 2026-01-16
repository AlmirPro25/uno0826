package observability

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================
// HTTP HANDLERS - Observability Dashboard
// ========================================

var (
	globalTracer   *Tracer
	memoryExporter *InMemoryExporter
)

// InitObservability inicializa o sistema de observabilidade
func InitObservability(serviceName string) {
	globalTracer = NewTracer(serviceName)
	memoryExporter = NewInMemoryExporter(10000) // Últimos 10k spans
	
	globalTracer.AddExporter(memoryExporter)
	globalTracer.AddExporter(&ConsoleExporter{})
	
	// Usar ratio sampler em produção (10% das traces)
	globalTracer.SetSampler(NewRatioSampler(0.1))
	
	// Inicializar métricas comuns
	InitCommonMetrics()
}

// GetTracer retorna o tracer global
func GetTracer() *Tracer {
	return globalTracer
}

// RegisterRoutes registra as rotas de observabilidade
func RegisterRoutes(r *gin.RouterGroup) {
	obs := r.Group("/observability")
	{
		// Traces
		obs.GET("/traces", listTraces)
		obs.GET("/traces/:trace_id", getTrace)
		
		// Metrics
		obs.GET("/metrics", getMetrics)
		obs.GET("/metrics/prometheus", getPrometheusMetrics)
		
		// Health & Status
		obs.GET("/status", getSystemStatus)
		obs.GET("/dependencies", getDependencies)
	}
}

// ========================================
// TRACE HANDLERS
// ========================================

func listTraces(c *gin.Context) {
	if memoryExporter == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "observability not initialized"})
		return
	}

	spans := memoryExporter.GetSpans()
	
	// Agrupar por trace_id
	traces := make(map[TraceID][]*Span)
	for _, span := range spans {
		traces[span.TraceID] = append(traces[span.TraceID], span)
	}

	// Converter para lista
	var traceList []map[string]interface{}
	for traceID, traceSpans := range traces {
		// Encontrar root span
		var rootSpan *Span
		for _, s := range traceSpans {
			if s.ParentSpanID == "" {
				rootSpan = s
				break
			}
		}

		traceInfo := map[string]interface{}{
			"trace_id":   traceID,
			"span_count": len(traceSpans),
		}

		if rootSpan != nil {
			traceInfo["operation"] = rootSpan.OperationName
			traceInfo["service"] = rootSpan.ServiceName
			traceInfo["duration_ms"] = rootSpan.Duration.Milliseconds()
			traceInfo["status"] = rootSpan.Status
			traceInfo["start_time"] = rootSpan.StartTime
		}

		traceList = append(traceList, traceInfo)
	}

	c.JSON(http.StatusOK, gin.H{
		"traces": traceList,
		"total":  len(traceList),
	})
}

func getTrace(c *gin.Context) {
	traceID := TraceID(c.Param("trace_id"))
	
	if memoryExporter == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "observability not initialized"})
		return
	}

	spans := memoryExporter.GetTrace(traceID)
	if len(spans) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "trace not found"})
		return
	}

	// Construir árvore de spans
	spanMap := make(map[SpanID]*Span)
	for _, s := range spans {
		spanMap[s.SpanID] = s
	}

	c.JSON(http.StatusOK, gin.H{
		"trace_id": traceID,
		"spans":    spans,
		"count":    len(spans),
	})
}

// ========================================
// METRICS HANDLERS
// ========================================

func getMetrics(c *gin.Context) {
	metrics := GetRegistry().GetAllMetrics()
	c.JSON(http.StatusOK, gin.H{
		"metrics":   metrics,
		"timestamp": time.Now(),
	})
}

func getPrometheusMetrics(c *gin.Context) {
	c.String(http.StatusOK, GetRegistry().PrometheusFormat())
}

// ========================================
// STATUS HANDLERS
// ========================================

type SystemStatus struct {
	Status       string                 `json:"status"`
	Uptime       time.Duration          `json:"uptime"`
	Version      string                 `json:"version"`
	Services     map[string]ServiceStatus `json:"services"`
	Metrics      map[string]float64     `json:"metrics"`
	LastChecked  time.Time              `json:"last_checked"`
}

type ServiceStatus struct {
	Name      string        `json:"name"`
	Status    string        `json:"status"`
	Latency   time.Duration `json:"latency_ms"`
	LastCheck time.Time     `json:"last_check"`
	Error     string        `json:"error,omitempty"`
}

var startTime = time.Now()

func getSystemStatus(c *gin.Context) {
	status := SystemStatus{
		Status:      "healthy",
		Uptime:      time.Since(startTime),
		Version:     "2.0.0-enterprise",
		Services:    make(map[string]ServiceStatus),
		Metrics:     make(map[string]float64),
		LastChecked: time.Now(),
	}

	// Coletar métricas principais
	if HTTPRequestsTotal != nil {
		status.Metrics["http_requests_total"] = HTTPRequestsTotal.Value()
	}
	if HTTPRequestsInFlight != nil {
		status.Metrics["http_requests_in_flight"] = HTTPRequestsInFlight.Value()
	}
	if DBConnectionsActive != nil {
		status.Metrics["db_connections_active"] = DBConnectionsActive.Value()
	}
	if UsersActive != nil {
		status.Metrics["users_active"] = UsersActive.Value()
	}

	c.JSON(http.StatusOK, status)
}

// Dependency representa uma dependência do sistema
type Dependency struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Status      string `json:"status"`
	Latency     int64  `json:"latency_ms"`
	Required    bool   `json:"required"`
	Description string `json:"description"`
}

func getDependencies(c *gin.Context) {
	// Lista de dependências do sistema
	dependencies := []Dependency{
		{
			Name:        "PostgreSQL (Neon)",
			Type:        "database",
			Status:      "healthy",
			Required:    true,
			Description: "Primary database",
		},
		{
			Name:        "Cloudflare",
			Type:        "cdn",
			Status:      "healthy",
			Required:    false,
			Description: "CDN and DDoS protection",
		},
		{
			Name:        "Google OAuth",
			Type:        "auth",
			Status:      "healthy",
			Required:    true,
			Description: "Authentication provider",
		},
		{
			Name:        "Stripe",
			Type:        "payment",
			Status:      "healthy",
			Required:    false,
			Description: "Payment processing",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"dependencies": dependencies,
		"total":        len(dependencies),
		"healthy":      len(dependencies), // Simplificado
	})
}

// ========================================
// TRACING MIDDLEWARE
// ========================================

// TracingMiddleware adiciona tracing a cada request
func TracingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if globalTracer == nil {
			c.Next()
			return
		}

		// Extrair trace context de headers (se existir)
		traceID, parentSpanID := ExtractHTTP(c.Request.Header)
		
		ctx := c.Request.Context()
		
		// Se já existe trace, criar span filho
		if traceID != "" && parentSpanID != "" {
			parentSpan := &Span{
				TraceID: traceID,
				SpanID:  parentSpanID,
			}
			ctx = ContextWithSpan(ctx, parentSpan)
		}

		// Iniciar span
		operationName := c.Request.Method + " " + c.FullPath()
		ctx, span := globalTracer.StartSpan(ctx, operationName)
		
		// Adicionar tags
		span.SetTag("http.method", c.Request.Method)
		span.SetTag("http.url", c.Request.URL.String())
		span.SetTag("http.host", c.Request.Host)
		span.SetTag("http.user_agent", c.Request.UserAgent())

		// Propagar contexto
		c.Request = c.Request.WithContext(ctx)
		
		// Injetar headers para propagação
		InjectHTTP(span, c.Writer.Header())

		// Processar request
		c.Next()

		// Finalizar span
		span.SetTag("http.status_code", string(rune(c.Writer.Status())))
		
		if c.Writer.Status() >= 400 {
			span.Status = SpanStatusError
			span.SetTag("error", "true")
		}

		globalTracer.FinishSpan(span)

		// Atualizar métricas
		if HTTPRequestsTotal != nil {
			HTTPRequestsTotal.Inc()
		}
	}
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// MarshalJSON helper para serialização
func (s *Span) MarshalJSON() ([]byte, error) {
	type Alias Span
	return json.Marshal(&struct {
		*Alias
		DurationMs int64 `json:"duration_ms"`
	}{
		Alias:      (*Alias)(s),
		DurationMs: s.Duration.Milliseconds(),
	})
}
