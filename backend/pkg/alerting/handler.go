package alerting

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================
// HTTP HANDLERS
// "API para gerenciar alertas"
// ========================================

// AlertHandler handles alert-related HTTP requests
type AlertHandler struct {
	engine *AlertEngine
}

// NewAlertHandler creates a new alert handler
func NewAlertHandler(engine *AlertEngine) *AlertHandler {
	return &AlertHandler{engine: engine}
}

// GetActiveAlerts returns all active alerts
// GET /api/v1/alerts
func (h *AlertHandler) GetActiveAlerts(c *gin.Context) {
	alerts := h.engine.GetActiveAlerts()

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"count":  len(alerts),
	})
}

// GetAlert returns a specific alert
// GET /api/v1/alerts/:id
func (h *AlertHandler) GetAlert(c *gin.Context) {
	alertID := c.Param("id")

	alert := h.engine.GetAlert(alertID)
	if alert == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		return
	}

	c.JSON(http.StatusOK, alert)
}

// AcknowledgeAlert acknowledges an alert
// POST /api/v1/alerts/:id/ack
func (h *AlertHandler) AcknowledgeAlert(c *gin.Context) {
	alertID := c.Param("id")

	var req struct {
		AckedBy string `json:"acked_by" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "acked_by is required"})
		return
	}

	if h.engine.Acknowledge(alertID, req.AckedBy) {
		c.JSON(http.StatusOK, gin.H{"message": "Alert acknowledged"})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found or already resolved"})
	}
}

// ResolveAlert resolves an alert
// POST /api/v1/alerts/:id/resolve
func (h *AlertHandler) ResolveAlert(c *gin.Context) {
	alertID := c.Param("id")

	if h.engine.Resolve(alertID) {
		c.JSON(http.StatusOK, gin.H{"message": "Alert resolved"})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
	}
}

// GetAlertHistory returns alert history
// GET /api/v1/alerts/history
func (h *AlertHandler) GetAlertHistory(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 1000 {
		limit = 50
	}

	history := h.engine.GetHistory(limit)

	c.JSON(http.StatusOK, gin.H{
		"history": history,
		"count":   len(history),
	})
}

// GetAlertStats returns alerting statistics
// GET /api/v1/alerts/stats
func (h *AlertHandler) GetAlertStats(c *gin.Context) {
	stats := h.engine.GetStats()
	c.JSON(http.StatusOK, stats)
}

// GetAlertsBySeverity returns alerts filtered by severity
// GET /api/v1/alerts/severity/:severity
func (h *AlertHandler) GetAlertsBySeverity(c *gin.Context) {
	severity := AlertSeverity(c.Param("severity"))

	// Validate severity
	validSeverities := map[AlertSeverity]bool{
		SeverityInfo:      true,
		SeverityWarning:   true,
		SeverityCritical:  true,
		SeverityEmergency: true,
	}

	if !validSeverities[severity] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid severity"})
		return
	}

	alerts := h.engine.GetAlertsBySeverity(severity)

	c.JSON(http.StatusOK, gin.H{
		"alerts":   alerts,
		"count":    len(alerts),
		"severity": severity,
	})
}

// GetAlertsByType returns alerts filtered by type
// GET /api/v1/alerts/type/:type
func (h *AlertHandler) GetAlertsByType(c *gin.Context) {
	alertType := AlertType(c.Param("type"))

	// Validate type
	validTypes := map[AlertType]bool{
		AlertTypePressure:    true,
		AlertTypeSLO:         true,
		AlertTypeErrorRate:   true,
		AlertTypeLatency:     true,
		AlertTypeAttack:      true,
		AlertTypeCircuitOpen: true,
		AlertTypeQuarantine:  true,
		AlertTypeMemory:      true,
		AlertTypeCustom:      true,
	}

	if !validTypes[alertType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert type"})
		return
	}

	alerts := h.engine.GetAlertsByType(alertType)

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"count":  len(alerts),
		"type":   alertType,
	})
}

// ========================================
// RULE MANAGEMENT HANDLERS
// ========================================

// GetRules returns all alerting rules
// GET /api/v1/alerts/rules
func (h *AlertHandler) GetRules(c *gin.Context) {
	rules := h.engine.GetRules()

	c.JSON(http.StatusOK, gin.H{
		"rules": rules,
		"count": len(rules),
	})
}

// GetRule returns a specific rule
// GET /api/v1/alerts/rules/:name
func (h *AlertHandler) GetRule(c *gin.Context) {
	name := c.Param("name")

	rule := h.engine.GetRule(name)
	if rule == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rule not found"})
		return
	}

	c.JSON(http.StatusOK, rule)
}

// CreateRule creates a new alerting rule
// POST /api/v1/alerts/rules
func (h *AlertHandler) CreateRule(c *gin.Context) {
	var req struct {
		Name      string            `json:"name" binding:"required"`
		Type      AlertType         `json:"type" binding:"required"`
		Condition string            `json:"condition" binding:"required"`
		Threshold float64           `json:"threshold" binding:"required"`
		Severity  AlertSeverity     `json:"severity" binding:"required"`
		Cooldown  int               `json:"cooldown_seconds"` // seconds
		Tags      map[string]string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if rule already exists
	if h.engine.GetRule(req.Name) != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Rule already exists"})
		return
	}

	cooldown := time.Duration(req.Cooldown) * time.Second
	if cooldown == 0 {
		cooldown = 5 * time.Minute
	}

	rule := &AlertRule{
		Name:      req.Name,
		Type:      req.Type,
		Condition: req.Condition,
		Threshold: req.Threshold,
		Severity:  req.Severity,
		Cooldown:  cooldown,
		Enabled:   true,
		Tags:      req.Tags,
	}

	h.engine.AddRule(rule)

	c.JSON(http.StatusCreated, rule)
}

// EnableRule enables a rule
// POST /api/v1/alerts/rules/:name/enable
func (h *AlertHandler) EnableRule(c *gin.Context) {
	name := c.Param("name")

	if h.engine.EnableRule(name) {
		c.JSON(http.StatusOK, gin.H{"message": "Rule enabled"})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rule not found"})
	}
}

// DisableRule disables a rule
// POST /api/v1/alerts/rules/:name/disable
func (h *AlertHandler) DisableRule(c *gin.Context) {
	name := c.Param("name")

	if h.engine.DisableRule(name) {
		c.JSON(http.StatusOK, gin.H{"message": "Rule disabled"})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rule not found"})
	}
}

// ========================================
// TEST ENDPOINT
// ========================================

// TestAlert fires a test alert
// POST /api/v1/alerts/test
func (h *AlertHandler) TestAlert(c *gin.Context) {
	var req struct {
		Type      AlertType         `json:"type"`
		Severity  AlertSeverity     `json:"severity"`
		Title     string            `json:"title"`
		Message   string            `json:"message"`
		Value     float64           `json:"value"`
		Threshold float64           `json:"threshold"`
		Tags      map[string]string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		// Use defaults
		req.Type = AlertTypeCustom
		req.Severity = SeverityInfo
		req.Title = "Test Alert"
		req.Message = "This is a test alert"
	}

	alert := h.engine.Fire(
		req.Type,
		req.Severity,
		req.Title,
		req.Message,
		"test",
		req.Value,
		req.Threshold,
		req.Tags,
	)

	if alert != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "Test alert fired",
			"alert":   alert,
		})
	} else {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"message": "Alert deduplicated (cooldown active)",
		})
	}
}

// ========================================
// DASHBOARD ENDPOINT
// ========================================

// GetDashboard returns a complete alerting dashboard
// GET /api/v1/alerts/dashboard
func (h *AlertHandler) GetDashboard(c *gin.Context) {
	stats := h.engine.GetStats()
	active := h.engine.GetActiveAlerts()
	history := h.engine.GetHistory(10)
	rules := h.engine.GetRules()

	// Count by severity
	critical := h.engine.GetAlertsBySeverity(SeverityCritical)
	emergency := h.engine.GetAlertsBySeverity(SeverityEmergency)

	c.JSON(http.StatusOK, gin.H{
		"stats":           stats,
		"active_alerts":   active,
		"recent_history":  history,
		"rules":           rules,
		"critical_count":  len(critical),
		"emergency_count": len(emergency),
		"needs_attention": len(critical) + len(emergency) > 0,
	})
}

// ========================================
// METRICS ENDPOINTS
// ========================================

// GetMetricsJSON returns metrics as JSON
// GET /api/v1/alerts/metrics
func (h *AlertHandler) GetMetricsJSON(c *gin.Context) {
	c.JSON(http.StatusOK, GetMetricsJSON())
}

// GetMetricsPrometheus returns metrics in Prometheus format
// GET /api/v1/alerts/metrics/prometheus
func (h *AlertHandler) GetMetricsPrometheus(c *gin.Context) {
	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.String(http.StatusOK, GetPrometheusMetrics())
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterAlertRoutes registers alert routes
func RegisterAlertRoutes(r *gin.RouterGroup, engine *AlertEngine, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewAlertHandler(engine)

	alerts := r.Group("/alerts")
	alerts.Use(authMiddleware)
	{
		// Read endpoints (authenticated users)
		alerts.GET("", handler.GetActiveAlerts)
		alerts.GET("/stats", handler.GetAlertStats)
		alerts.GET("/history", handler.GetAlertHistory)
		alerts.GET("/dashboard", handler.GetDashboard)
		alerts.GET("/metrics", handler.GetMetricsJSON)
		alerts.GET("/metrics/prometheus", handler.GetMetricsPrometheus)
		alerts.GET("/severity/:severity", handler.GetAlertsBySeverity)
		alerts.GET("/type/:type", handler.GetAlertsByType)
		alerts.GET("/:id", handler.GetAlert)

		// Admin-only endpoints
		admin := alerts.Group("")
		admin.Use(adminMiddleware)
		{
			// Alert management
			admin.POST("/:id/ack", handler.AcknowledgeAlert)
			admin.POST("/:id/resolve", handler.ResolveAlert)

			// Rule management
			admin.GET("/rules", handler.GetRules)
			admin.GET("/rules/:name", handler.GetRule)
			admin.POST("/rules", handler.CreateRule)
			admin.POST("/rules/:name/enable", handler.EnableRule)
			admin.POST("/rules/:name/disable", handler.DisableRule)

			// Test endpoint
			admin.POST("/test", handler.TestAlert)
		}
	}
}
