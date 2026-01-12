package warobs

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================
// HTTP HANDLER
// "Endpoints para ver o sistema respirar"
// ========================================

// Handler provides HTTP endpoints for war observability
type Handler struct {
	obs *WarObservability
}

// NewHandler creates a new handler
func NewHandler(obs *WarObservability) *Handler {
	return &Handler{obs: obs}
}

// RegisterRoutes registers war observability routes
func (h *Handler) RegisterRoutes(r *gin.RouterGroup, authMiddleware, adminMiddleware gin.HandlerFunc) {
	warobs := r.Group("/warobs")
	warobs.Use(authMiddleware, adminMiddleware)
	{
		// Dashboard
		warobs.GET("/dashboard", h.GetDashboard)
		warobs.GET("/health", h.GetHealthSummary)
		
		// RED Metrics
		warobs.GET("/red/global", h.GetGlobalStats)
		warobs.GET("/red/endpoints", h.GetAllEndpoints)
		warobs.GET("/red/top", h.GetTopEndpoints)
		warobs.GET("/red/slowest", h.GetSlowestEndpoints)
		warobs.GET("/red/errors", h.GetErrorEndpoints)
		
		// Pressure
		warobs.GET("/pressure", h.GetPressure)
		warobs.GET("/pressure/history", h.GetPressureHistory)
		
		// SLO
		warobs.GET("/slo/status", h.GetSLOStatus)
		warobs.GET("/slo/budget", h.GetErrorBudget)
		
		// Tracing
		warobs.GET("/traces", h.GetRecentTraces)
		warobs.GET("/traces/:id", h.GetTrace)
		warobs.GET("/traces/errors", h.GetErrorTraces)
		warobs.GET("/traces/slow", h.GetSlowTraces)
		warobs.GET("/traces/stats", h.GetTracerStats)
	}
}

// Dashboard endpoints
func (h *Handler) GetDashboard(c *gin.Context) {
	dashboard := h.obs.GetDashboard()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    dashboard,
	})
}

func (h *Handler) GetHealthSummary(c *gin.Context) {
	summary := h.obs.GetHealthSummary()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}

// RED Metrics endpoints
func (h *Handler) GetGlobalStats(c *gin.Context) {
	stats := h.obs.RED.GetGlobalStats()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

func (h *Handler) GetAllEndpoints(c *gin.Context) {
	stats := h.obs.RED.GetAllStats()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

func (h *Handler) GetTopEndpoints(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}
	
	stats := h.obs.RED.GetTopEndpoints(limit)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

func (h *Handler) GetSlowestEndpoints(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}
	
	stats := h.obs.RED.GetSlowestEndpoints(limit)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

func (h *Handler) GetErrorEndpoints(c *gin.Context) {
	threshold := 5.0
	if t := c.Query("threshold"); t != "" {
		if parsed, err := strconv.ParseFloat(t, 64); err == nil {
			threshold = parsed
		}
	}
	
	stats := h.obs.RED.GetErrorEndpoints(threshold)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// Pressure endpoints
func (h *Handler) GetPressure(c *gin.Context) {
	pressure := h.obs.Pressure.GetCurrentPressure()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pressure,
	})
}

func (h *Handler) GetPressureHistory(c *gin.Context) {
	history := h.obs.Pressure.GetHistory()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    history,
	})
}

// SLO endpoints
func (h *Handler) GetSLOStatus(c *gin.Context) {
	status := h.obs.SLO.GetSLOStatus()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

func (h *Handler) GetErrorBudget(c *gin.Context) {
	budget := h.obs.SLO.GetErrorBudgetSummary()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    budget,
	})
}

// Tracing endpoints
func (h *Handler) GetRecentTraces(c *gin.Context) {
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}
	
	traces := h.obs.Tracer.GetRecentTraces(limit)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    traces,
	})
}

func (h *Handler) GetTrace(c *gin.Context) {
	traceID := c.Param("id")
	trace := h.obs.Tracer.GetTrace(traceID)
	
	if trace == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Trace not found",
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    trace,
	})
}

func (h *Handler) GetErrorTraces(c *gin.Context) {
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}
	
	traces := h.obs.Tracer.GetErrorTraces(limit)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    traces,
	})
}

func (h *Handler) GetSlowTraces(c *gin.Context) {
	threshold := time.Second
	if t := c.Query("threshold_ms"); t != "" {
		if parsed, err := strconv.Atoi(t); err == nil {
			threshold = time.Duration(parsed) * time.Millisecond
		}
	}
	
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}
	
	traces := h.obs.Tracer.GetSlowTraces(threshold, limit)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    traces,
	})
}

func (h *Handler) GetTracerStats(c *gin.Context) {
	stats := h.obs.Tracer.GetStats()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
