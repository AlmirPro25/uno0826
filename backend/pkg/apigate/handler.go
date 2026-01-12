package apigate

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ========================================
// HTTP HANDLER
// "Endpoints para monitorar o API Gate"
// ========================================

// Handler provides HTTP endpoints for API Gate
type Handler struct {
	gate *APIGate
}

// NewHandler creates a new handler
func NewHandler(gate *APIGate) *Handler {
	return &Handler{gate: gate}
}

// RegisterRoutes registers API Gate routes
func (h *Handler) RegisterRoutes(r *gin.RouterGroup, authMiddleware, adminMiddleware gin.HandlerFunc) {
	gateGroup := r.Group("/apigate")
	gateGroup.Use(authMiddleware, adminMiddleware)
	{
		gateGroup.GET("/metrics", h.GetMetrics)
		gateGroup.GET("/config", h.GetConfig)
		gateGroup.POST("/reset-metrics", h.ResetMetrics)
		gateGroup.GET("/status", h.GetStatus)
	}
}

// GetMetrics returns current gate metrics
func (h *Handler) GetMetrics(c *gin.Context) {
	metrics := h.gate.GetMetrics()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    metrics,
	})
}

// GetConfig returns current gate configuration
func (h *Handler) GetConfig(c *gin.Context) {
	config := h.gate.config
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"max_body_size":        config.MaxBodySize,
			"max_json_depth":       config.MaxJSONDepth,
			"max_array_length":     config.MaxArrayLength,
			"max_string_length":    config.MaxStringLength,
			"max_field_count":      config.MaxFieldCount,
			"enable_sanitization":  config.EnableSanitization,
			"enable_schema_check":  config.EnableSchemaCheck,
			"strict_mode":          config.StrictMode,
			"endpoint_limits":      config.EndpointLimits,
		},
	})
}


// ResetMetrics resets all metrics
func (h *Handler) ResetMetrics(c *gin.Context) {
	h.gate.ResetMetrics()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Metrics reset successfully",
	})
}

// GetStatus returns gate status
func (h *Handler) GetStatus(c *gin.Context) {
	metrics := h.gate.GetMetrics()
	
	// Calculate health status
	status := "healthy"
	blockRate := metrics["block_rate_percent"].(float64)
	if blockRate > 50 {
		status = "under_attack"
	} else if blockRate > 20 {
		status = "elevated"
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":      status,
			"block_rate":  blockRate,
			"total":       metrics["total_requests"],
			"blocked":     metrics["blocked_requests"],
			"gate_active": true,
		},
	})
}

// ========================================
// GLOBAL INSTANCE
// ========================================

var globalGate *APIGate

// GetGlobalGate returns the global API Gate instance
func GetGlobalGate() *APIGate {
	if globalGate == nil {
		globalGate = NewAPIGate(DefaultConfig())
	}
	return globalGate
}

// SetGlobalGate sets the global API Gate instance
func SetGlobalGate(gate *APIGate) {
	globalGate = gate
}

// GateMiddleware returns the global gate middleware
func GateMiddleware() gin.HandlerFunc {
	return GetGlobalGate().GateMiddleware()
}
