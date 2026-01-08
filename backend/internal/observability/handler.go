package observability

import (
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================
// OBSERVABILITY HANDLER - Fase 22
// "Endpoints de health e metrics"
// ========================================

// Version info - set at build time
var (
	Version   = "1.0.0"
	GitCommit = "dev"
)

// SetVersion sets version info (call from main)
func SetVersion(version, commit string) {
	Version = version
	GitCommit = commit
}

// ========================================
// HEALTH ENDPOINT (22.1)
// "Sem dependências externas"
// ========================================

type HealthResponse struct {
	Status    string `json:"status"`
	UptimeSec int64  `json:"uptime_sec"`
	Version   string `json:"version"`
}

// Health returns simple health status without external dependencies
// GET /health
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:    "ok",
		UptimeSec: int64(time.Since(GetMetrics().StartTime).Seconds()),
		Version:   GitCommit,
	})
}

// ========================================
// READY ENDPOINT (22.2)
// "Valida dependências"
// ========================================

type ReadyChecker interface {
	CheckDB() error
	CheckSecrets() error
}

type ReadyResponse struct {
	Status   string            `json:"status"`
	Checks   map[string]string `json:"checks"`
}

// Ready validates dependencies
// GET /ready
func Ready(checker ReadyChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		checks := make(map[string]string)
		status := "ok"

		// Check DB
		if err := checker.CheckDB(); err != nil {
			checks["database"] = "error: " + err.Error()
			status = "not_ready"
		} else {
			checks["database"] = "ok"
		}

		// Check Secrets
		if err := checker.CheckSecrets(); err != nil {
			checks["secrets"] = "error: " + err.Error()
			status = "not_ready"
		} else {
			checks["secrets"] = "ok"
		}

		statusCode := http.StatusOK
		if status != "ok" {
			statusCode = http.StatusServiceUnavailable
		}

		c.JSON(statusCode, ReadyResponse{
			Status: status,
			Checks: checks,
		})
	}
}

// ========================================
// METRICS ENDPOINT (22.3)
// "Contadores simples em JSON"
// ========================================

type MetricsResponse struct {
	AuditEventsTotal     int64 `json:"audit_events_total"`
	AppEventsTotal       int64 `json:"app_events_total"`
	AppEventsFailedTotal int64 `json:"app_events_failed_total"`
	RequestsTotal        int64 `json:"requests_total"`
	ErrorsTotal          int64 `json:"errors_total"`
	UptimeSeconds        int64 `json:"uptime_seconds"`
	GoRoutines           int   `json:"go_routines"`
	MemoryMB             uint64 `json:"memory_mb"`
}

// MetricsBasic returns basic metrics
// GET /metrics/basic
func MetricsBasic(c *gin.Context) {
	snapshot := GetMetrics().Snapshot()

	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	c.JSON(http.StatusOK, MetricsResponse{
		AuditEventsTotal:     snapshot.AuditEventsTotal,
		AppEventsTotal:       snapshot.AppEventsTotal,
		AppEventsFailedTotal: snapshot.AppEventsFailedTotal,
		RequestsTotal:        snapshot.RequestsTotal,
		ErrorsTotal:          snapshot.ErrorsTotal,
		UptimeSeconds:        snapshot.UptimeSeconds,
		GoRoutines:           runtime.NumGoroutine(),
		MemoryMB:             memStats.Alloc / 1024 / 1024,
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterObservabilityRoutes registers observability endpoints
func RegisterObservabilityRoutes(r *gin.Engine, checker ReadyChecker) {
	// Public endpoints (no auth)
	r.GET("/health", Health)
	r.GET("/ready", Ready(checker))
	r.GET("/metrics/basic", MetricsBasic)
}
