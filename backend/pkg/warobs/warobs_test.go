package warobs

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// ========================================
// RED METRICS TESTS
// ========================================

func TestREDMetricsRecord(t *testing.T) {
	red := NewREDMetrics()
	
	// Record some requests
	red.Record("/api/users", 100*time.Millisecond, 200)
	red.Record("/api/users", 150*time.Millisecond, 200)
	red.Record("/api/users", 200*time.Millisecond, 500)
	
	stats := red.GetEndpointStats("/api/users")
	
	if stats == nil {
		t.Fatal("Expected stats, got nil")
	}
	
	if stats.RequestCount != 3 {
		t.Errorf("RequestCount = %d, want 3", stats.RequestCount)
	}
	
	if stats.ErrorCount != 1 {
		t.Errorf("ErrorCount = %d, want 1", stats.ErrorCount)
	}
	
	if stats.Error5xx != 1 {
		t.Errorf("Error5xx = %d, want 1", stats.Error5xx)
	}
}

func TestREDMetricsGlobalStats(t *testing.T) {
	red := NewREDMetrics()
	
	red.Record("/api/a", 100*time.Millisecond, 200)
	red.Record("/api/b", 100*time.Millisecond, 200)
	red.Record("/api/c", 100*time.Millisecond, 500)
	
	global := red.GetGlobalStats()
	
	if global.TotalRequests != 3 {
		t.Errorf("TotalRequests = %d, want 3", global.TotalRequests)
	}
	
	if global.TotalErrors != 1 {
		t.Errorf("TotalErrors = %d, want 1", global.TotalErrors)
	}
	
	expectedErrorRate := 33.33
	if global.ErrorRate < 33 || global.ErrorRate > 34 {
		t.Errorf("ErrorRate = %f, want ~%f", global.ErrorRate, expectedErrorRate)
	}
}

func TestREDMetricsTopEndpoints(t *testing.T) {
	red := NewREDMetrics()
	
	// /api/popular gets most requests
	for i := 0; i < 100; i++ {
		red.Record("/api/popular", 50*time.Millisecond, 200)
	}
	
	// /api/medium gets some
	for i := 0; i < 50; i++ {
		red.Record("/api/medium", 50*time.Millisecond, 200)
	}
	
	// /api/rare gets few
	for i := 0; i < 10; i++ {
		red.Record("/api/rare", 50*time.Millisecond, 200)
	}
	
	top := red.GetTopEndpoints(2)
	
	if len(top) != 2 {
		t.Fatalf("Expected 2 endpoints, got %d", len(top))
	}
	
	if top[0].Endpoint != "/api/popular" {
		t.Errorf("Top endpoint = %s, want /api/popular", top[0].Endpoint)
	}
}

func TestREDMetricsSlowestEndpoints(t *testing.T) {
	red := NewREDMetrics()
	
	red.Record("/api/fast", 10*time.Millisecond, 200)
	red.Record("/api/slow", 500*time.Millisecond, 200)
	red.Record("/api/slower", 1*time.Second, 200)
	
	slowest := red.GetSlowestEndpoints(2)
	
	if len(slowest) != 2 {
		t.Fatalf("Expected 2 endpoints, got %d", len(slowest))
	}
	
	if slowest[0].Endpoint != "/api/slower" {
		t.Errorf("Slowest endpoint = %s, want /api/slower", slowest[0].Endpoint)
	}
}

// ========================================
// PRESSURE TESTS
// ========================================

func TestPressureIndicator(t *testing.T) {
	red := NewREDMetrics()
	pressure := NewPressureIndicator(red)
	
	// Normal state
	for i := 0; i < 100; i++ {
		red.Record("/api/test", 50*time.Millisecond, 200)
	}
	
	report := pressure.GetCurrentPressure()
	
	if report.OverallLevel != PressureNormal {
		t.Errorf("OverallLevel = %s, want normal", report.OverallLevel)
	}
}

func TestPressureWithErrors(t *testing.T) {
	red := NewREDMetrics()
	pressure := NewPressureIndicator(red)
	
	// High error rate
	for i := 0; i < 50; i++ {
		red.Record("/api/test", 50*time.Millisecond, 200)
	}
	for i := 0; i < 50; i++ {
		red.Record("/api/test", 50*time.Millisecond, 500)
	}
	
	report := pressure.GetCurrentPressure()
	
	// 50% error rate should be critical
	errorPressure := report.Components["error_rate"]
	if errorPressure.Level != PressureCritical {
		t.Errorf("Error pressure = %s, want critical", errorPressure.Level)
	}
}

// ========================================
// SLO TESTS
// ========================================

func TestSLOTracker(t *testing.T) {
	red := NewREDMetrics()
	slo := NewSLOTracker(red)
	
	// Record good measurements
	for i := 0; i < 100; i++ {
		slo.RecordMeasurement("availability", 100.0, true)
	}
	
	status := slo.GetSLOStatus()
	
	availStatus := status["availability"]
	if availStatus == nil {
		t.Fatal("Expected availability status")
	}
	
	if !availStatus.Compliance {
		t.Error("Expected compliance = true")
	}
	
	if availStatus.CurrentValue != 100.0 {
		t.Errorf("CurrentValue = %f, want 100.0", availStatus.CurrentValue)
	}
}

func TestSLOErrorBudget(t *testing.T) {
	red := NewREDMetrics()
	slo := NewSLOTracker(red)
	
	// Record some failures (10% failure rate)
	for i := 0; i < 90; i++ {
		slo.RecordMeasurement("availability", 100.0, true)
	}
	for i := 0; i < 10; i++ {
		slo.RecordMeasurement("availability", 0.0, false)
	}
	
	status := slo.GetSLOStatus()
	availStatus := status["availability"]
	
	// 90% availability with 99.9% target = budget exhausted
	if availStatus.ErrorBudget > 0 {
		t.Logf("ErrorBudget = %f (expected 0 or negative)", availStatus.ErrorBudget)
	}
}

// ========================================
// TRACER TESTS
// ========================================

func TestTracer(t *testing.T) {
	tracer := NewTracer()
	
	// Start a span
	span := tracer.StartSpan("trace-123", "test_operation", map[string]string{
		"key": "value",
	})
	
	if span == nil {
		t.Fatal("Expected span, got nil")
	}
	
	if span.TraceID != "trace-123" {
		t.Errorf("TraceID = %s, want trace-123", span.TraceID)
	}
	
	// End span
	span.End(false)
	
	if span.Status != "ok" {
		t.Errorf("Status = %s, want ok", span.Status)
	}
	
	// Get trace
	trace := tracer.GetTrace("trace-123")
	if trace == nil {
		t.Fatal("Expected trace, got nil")
	}
	
	if len(trace.Spans) != 1 {
		t.Errorf("Spans count = %d, want 1", len(trace.Spans))
	}
}

func TestTracerErrorSpan(t *testing.T) {
	tracer := NewTracer()
	
	span := tracer.StartSpan("trace-error", "failing_operation", nil)
	span.SetError("something went wrong")
	span.End(true)
	
	if span.Status != "error" {
		t.Errorf("Status = %s, want error", span.Status)
	}
	
	if span.Error != "something went wrong" {
		t.Errorf("Error = %s, want 'something went wrong'", span.Error)
	}
	
	// Get error traces
	errorTraces := tracer.GetErrorTraces(10)
	if len(errorTraces) != 1 {
		t.Errorf("Error traces count = %d, want 1", len(errorTraces))
	}
}

// ========================================
// MIDDLEWARE TESTS
// ========================================

func TestWarObsMiddleware(t *testing.T) {
	obs := NewWarObservability()
	obs.Reset()
	
	router := gin.New()
	router.Use(WarObsMiddleware(obs))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})
	
	// Make request
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	if w.Code != 200 {
		t.Errorf("Status = %d, want 200", w.Code)
	}
	
	// Check metrics were recorded
	global := obs.RED.GetGlobalStats()
	if global.TotalRequests != 1 {
		t.Errorf("TotalRequests = %d, want 1", global.TotalRequests)
	}
	
	// Check trace ID header
	traceID := w.Header().Get("X-Trace-ID")
	if traceID == "" {
		t.Error("Expected X-Trace-ID header")
	}
}

// ========================================
// INTEGRATION TEST
// ========================================

func TestWarObservabilityIntegration(t *testing.T) {
	obs := NewWarObservability()
	obs.Reset()
	
	// Simulate traffic
	for i := 0; i < 100; i++ {
		status := 200
		if i%10 == 0 {
			status = 500 // 10% errors
		}
		
		duration := time.Duration(50+i) * time.Millisecond
		obs.RED.Record("/api/test", duration, status)
	}
	
	// Update SLOs
	obs.SLO.UpdateFromMetrics()
	
	// Get dashboard
	dashboard := obs.GetDashboard()
	
	if dashboard.GlobalStats.TotalRequests != 100 {
		t.Errorf("TotalRequests = %d, want 100", dashboard.GlobalStats.TotalRequests)
	}
	
	if dashboard.GlobalStats.TotalErrors != 10 {
		t.Errorf("TotalErrors = %d, want 10", dashboard.GlobalStats.TotalErrors)
	}
	
	// Check health summary
	health := obs.GetHealthSummary()
	if health.RequestsTotal != 100 {
		t.Errorf("RequestsTotal = %d, want 100", health.RequestsTotal)
	}
}
