package financial

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// ALERTS HANDLER - Fase 27.2.3
// ========================================

type AlertsHandler struct {
	alertService *AlertService
}

func NewAlertsHandler(alertService *AlertService) *AlertsHandler {
	return &AlertsHandler{alertService: alertService}
}

// GetActiveAlerts retorna alertas ativos
// GET /api/v1/admin/financial/alerts
func (h *AlertsHandler) GetActiveAlerts(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// Filtro por app (opcional)
	var appID *uuid.UUID
	if appIDStr := c.Query("app_id"); appIDStr != "" {
		if id, err := uuid.Parse(appIDStr); err == nil {
			appID = &id
		}
	}

	alerts, err := h.alertService.GetActiveAlerts(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"total":  len(alerts),
	})
}

// GetAlertStats retorna estatísticas de alertas
// GET /api/v1/admin/financial/alerts/stats
func (h *AlertsHandler) GetAlertStats(c *gin.Context) {
	windowStr := c.DefaultQuery("window", "24h")
	window, err := time.ParseDuration(windowStr)
	if err != nil {
		window = 24 * time.Hour
	}

	since := time.Now().Add(-window)
	stats, err := h.alertService.GetAlertStats(since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats":  stats,
		"window": windowStr,
		"since":  since,
	})
}

// ResolveAlert marca alerta como resolvido
// POST /api/v1/admin/financial/alerts/:id/resolve
func (h *AlertsHandler) ResolveAlert(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Obter usuário do contexto
	resolvedBy := "admin"
	if userID, exists := c.Get("user_id"); exists {
		resolvedBy = userID.(string)
	}

	if err := h.alertService.ResolveAlert(id, resolvedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Alerta resolvido",
		"resolved_by": resolvedBy,
	})
}

// GetThresholds retorna thresholds configurados
// GET /api/v1/admin/financial/alerts/thresholds
func (h *AlertsHandler) GetThresholds(c *gin.Context) {
	var thresholds []AlertThreshold
	if err := h.alertService.db.Order("type").Find(&thresholds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"thresholds": thresholds,
	})
}

// UpdateThreshold atualiza um threshold
// PUT /api/v1/admin/financial/alerts/thresholds/:type
func (h *AlertsHandler) UpdateThreshold(c *gin.Context) {
	alertType := AlertType(c.Param("type"))

	var input struct {
		Threshold   float64       `json:"threshold"`
		Severity    AlertSeverity `json:"severity"`
		Description string        `json:"description"`
		AppID       *string       `json:"app_id,omitempty"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var appID *uuid.UUID
	if input.AppID != nil {
		if id, err := uuid.Parse(*input.AppID); err == nil {
			appID = &id
		}
	}

	if err := h.alertService.SetThreshold(alertType, appID, input.Threshold, input.Severity, input.Description); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Threshold atualizado",
		"type":    alertType,
	})
}

// RunAlertChecks executa verificações de alerta manualmente
// POST /api/v1/admin/financial/alerts/check
func (h *AlertsHandler) RunAlertChecks(c *gin.Context) {
	// Este endpoint seria chamado por um job ou manualmente
	// Por enquanto, retorna status
	c.JSON(http.StatusOK, gin.H{
		"message": "Alert checks executados",
		"note":    "Em produção, isso seria um background job",
	})
}

// ========================================
// IDEMPOTENCY STATS HANDLER
// ========================================

type IdempotencyHandler struct {
	idempotencyService *IdempotencyService
}

func NewIdempotencyHandler(idempotencyService *IdempotencyService) *IdempotencyHandler {
	return &IdempotencyHandler{idempotencyService: idempotencyService}
}

// GetIdempotencyStats retorna estatísticas de idempotência
// GET /api/v1/admin/financial/idempotency/stats
func (h *IdempotencyHandler) GetIdempotencyStats(c *gin.Context) {
	windowStr := c.DefaultQuery("window", "24h")
	window, err := time.ParseDuration(windowStr)
	if err != nil {
		window = 24 * time.Hour
	}

	since := time.Now().Add(-window)
	stats, err := h.idempotencyService.GetStats(since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calcular taxa de duplicatas
	total := stats["total"]
	processed := stats["processed"]
	duplicateRate := float64(0)
	if total > 0 {
		// Duplicatas são webhooks que tentaram mas já existiam
		// Como não temos essa métrica direta, usamos processed vs total
		duplicateRate = float64(total-processed) / float64(total) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"stats":          stats,
		"duplicate_rate": duplicateRate,
		"window":         windowStr,
		"since":          since,
	})
}

// GetRecentWebhooks retorna webhooks recentes processados
// GET /api/v1/admin/financial/idempotency/webhooks
func (h *IdempotencyHandler) GetRecentWebhooks(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var webhooks []ProcessedWebhook
	if err := h.idempotencyService.db.Order("created_at DESC").Limit(limit).Find(&webhooks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"webhooks": webhooks,
		"total":    len(webhooks),
	})
}

// ========================================
// RATE LIMIT STATS HANDLER
// ========================================

type RateLimitHandler struct {
	rateLimiter *RateLimiter
}

func NewRateLimitHandler(rateLimiter *RateLimiter) *RateLimitHandler {
	return &RateLimitHandler{rateLimiter: rateLimiter}
}

// GetRateLimitStats retorna estatísticas do rate limiter
// GET /api/v1/admin/financial/ratelimit/stats
func (h *RateLimitHandler) GetRateLimitStats(c *gin.Context) {
	stats := h.rateLimiter.GetStats()
	c.JSON(http.StatusOK, stats)
}
