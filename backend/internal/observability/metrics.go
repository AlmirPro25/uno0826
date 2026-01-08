package observability

import (
	"sync/atomic"
	"time"
)

// ========================================
// METRICS - Fase 22
// "Contadores simples, sem labels, sem histogramas"
// ========================================

// Metrics holds all application counters
type Metrics struct {
	// Audit events
	AuditEventsTotal int64
	
	// App events (external apps)
	AppEventsTotal       int64
	AppEventsFailedTotal int64
	
	// HTTP requests
	RequestsTotal int64
	ErrorsTotal   int64
	
	// Start time for uptime calculation
	StartTime time.Time
}

// Global metrics instance
var metrics = &Metrics{
	StartTime: time.Now(),
}

// GetMetrics returns the global metrics instance
func GetMetrics() *Metrics {
	return metrics
}

// ========================================
// INCREMENT FUNCTIONS (thread-safe)
// ========================================

func IncrementAuditEvents() {
	atomic.AddInt64(&metrics.AuditEventsTotal, 1)
}

func IncrementAppEvents() {
	atomic.AddInt64(&metrics.AppEventsTotal, 1)
}

func IncrementAppEventsFailed() {
	atomic.AddInt64(&metrics.AppEventsFailedTotal, 1)
}

func IncrementRequests() {
	atomic.AddInt64(&metrics.RequestsTotal, 1)
}

func IncrementErrors() {
	atomic.AddInt64(&metrics.ErrorsTotal, 1)
}

// ========================================
// SNAPSHOT (for reading)
// ========================================

type MetricsSnapshot struct {
	AuditEventsTotal     int64  `json:"audit_events_total"`
	AppEventsTotal       int64  `json:"app_events_total"`
	AppEventsFailedTotal int64  `json:"app_events_failed_total"`
	RequestsTotal        int64  `json:"requests_total"`
	ErrorsTotal          int64  `json:"errors_total"`
	UptimeSeconds        int64  `json:"uptime_seconds"`
}

func (m *Metrics) Snapshot() MetricsSnapshot {
	return MetricsSnapshot{
		AuditEventsTotal:     atomic.LoadInt64(&m.AuditEventsTotal),
		AppEventsTotal:       atomic.LoadInt64(&m.AppEventsTotal),
		AppEventsFailedTotal: atomic.LoadInt64(&m.AppEventsFailedTotal),
		RequestsTotal:        atomic.LoadInt64(&m.RequestsTotal),
		ErrorsTotal:          atomic.LoadInt64(&m.ErrorsTotal),
		UptimeSeconds:        int64(time.Since(m.StartTime).Seconds()),
	}
}
