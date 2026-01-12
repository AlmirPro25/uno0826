package immunity

/*
================================================================================
IMMUNITY HANDLER — API HTTP DO SISTEMA IMUNOLÓGICO
================================================================================

Expõe o sistema imunológico via endpoints REST:
- GET  /immunity/health      → Saúde do sistema
- GET  /immunity/stats       → Estatísticas completas
- GET  /immunity/alerts      → Alertas ativos
- POST /immunity/alerts/:id/ack → Reconhecer alerta
- POST /immunity/alerts/:id/resolve → Resolver alerta
- GET  /immunity/quarantine  → Quarentenas ativas
- POST /immunity/quarantine/release → Liberar quarentena
- GET  /immunity/circuits    → Status dos circuit breakers
- POST /immunity/circuits/:name/reset → Reset circuit breaker
- GET  /immunity/threats     → Fontes bloqueadas
- POST /immunity/threats/block → Bloquear IP manualmente
- POST /immunity/threats/unblock → Desbloquear IP

================================================================================
*/

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Handler para o sistema imunológico
type Handler struct {
	immunity *ImmunitySystem
}

// NewHandler cria novo handler
func NewHandler() *Handler {
	return &Handler{
		immunity: GetImmunitySystem(),
	}
}

// RegisterRoutes registra as rotas no router Gin
// authMiddleware: middleware de autenticação
// adminMiddleware: middleware que requer admin
func (h *Handler) RegisterRoutes(r *gin.RouterGroup, authMiddleware ...gin.HandlerFunc) {
	immunity := r.Group("/immunity")
	
	// Aplicar middlewares se fornecidos
	if len(authMiddleware) > 0 {
		immunity.Use(authMiddleware...)
	}
	
	{
		// Saúde e estatísticas (público para health checks)
		immunity.GET("/health", h.GetHealth)
		immunity.GET("/stats", h.GetStats)

		// Alertas
		immunity.GET("/alerts", h.GetAlerts)
		immunity.POST("/alerts/:id/ack", h.AcknowledgeAlert)
		immunity.POST("/alerts/:id/resolve", h.ResolveAlert)

		// Quarentena
		immunity.GET("/quarantine", h.GetQuarantines)
		immunity.POST("/quarantine/release", h.ReleaseQuarantine)

		// Circuit Breakers
		immunity.GET("/circuits", h.GetCircuits)
		immunity.POST("/circuits/:name/reset", h.ResetCircuit)

		// Ameaças
		immunity.GET("/threats", h.GetThreats)
		immunity.POST("/threats/block", h.BlockIP)
		immunity.POST("/threats/unblock", h.UnblockIP)

		// Healing
		immunity.GET("/healing/history", h.GetHealingHistory)
		immunity.POST("/healing/trigger", h.TriggerHealing)

		// Anomaly Detection
		immunity.GET("/anomalies/stats", h.GetAnomalyStats)
		immunity.GET("/anomalies/baselines", h.GetBaselines)
		immunity.POST("/anomalies/reset-learning", h.ResetLearning)
	}
}

// ========================================
// HEALTH & STATS
// ========================================

// GetHealth retorna saúde do sistema
func (h *Handler) GetHealth(c *gin.Context) {
	health := h.immunity.CheckHealth()
	
	statusCode := http.StatusOK
	if health.Status == "critical" {
		statusCode = http.StatusServiceUnavailable
	} else if health.Status == "degraded" {
		statusCode = http.StatusOK // Ainda OK, mas degradado
	}

	c.JSON(statusCode, gin.H{
		"status":             health.Status,
		"score":              health.Score,
		"open_circuits":      health.OpenCircuits,
		"active_quarantines": health.ActiveQuarantines,
		"active_alerts":      health.ActiveAlerts,
		"total_threats":      health.TotalThreats,
		"total_heals":        health.TotalHeals,
		"total_blocks":       health.TotalBlocks,
		"uptime_seconds":     health.Uptime.Seconds(),
		"checked_at":         health.CheckedAt,
	})
}

// GetStats retorna estatísticas completas
func (h *Handler) GetStats(c *gin.Context) {
	stats := h.immunity.Stats()
	c.JSON(http.StatusOK, stats)
}

// ========================================
// ALERTS
// ========================================

// GetAlerts retorna alertas ativos
func (h *Handler) GetAlerts(c *gin.Context) {
	alerts := h.immunity.Escalator().GetActiveAlerts()

	result := make([]gin.H, 0, len(alerts))
	for _, alert := range alerts {
		result = append(result, gin.H{
			"id":               alert.ID,
			"title":            alert.Title,
			"message":          alert.Message,
			"severity":         alert.Severity,
			"category":         alert.Category,
			"source":           alert.Source,
			"current_level":    alert.CurrentLevel.String(),
			"occurrence_count": alert.OccurrenceCount,
			"created_at":       alert.CreatedAt,
			"last_occurrence":  alert.LastOccurrence,
			"is_acked":         alert.IsAcked(),
			"acked_by":         alert.AckedBy,
			"acked_at":         alert.AckedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": result,
		"total":  len(result),
	})
}


// AcknowledgeAlertRequest request para reconhecer alerta
type AcknowledgeAlertRequest struct {
	AckedBy string `json:"acked_by" binding:"required"`
}

// AcknowledgeAlert reconhece um alerta
func (h *Handler) AcknowledgeAlert(c *gin.Context) {
	idStr := c.Param("id")
	alertID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var req AcknowledgeAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !h.immunity.Escalator().Acknowledge(alertID, req.AckedBy) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found or already resolved"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Alert acknowledged",
		"alert_id": alertID,
		"acked_by": req.AckedBy,
	})
}

// ResolveAlertRequest request para resolver alerta
type ResolveAlertRequest struct {
	ResolvedBy string `json:"resolved_by" binding:"required"`
	Resolution string `json:"resolution" binding:"required,min=10"`
}

// ResolveAlert resolve um alerta
func (h *Handler) ResolveAlert(c *gin.Context) {
	idStr := c.Param("id")
	alertID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var req ResolveAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !h.immunity.Escalator().Resolve(alertID, req.ResolvedBy, req.Resolution) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found or already resolved"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Alert resolved",
		"alert_id":    alertID,
		"resolved_by": req.ResolvedBy,
		"resolution":  req.Resolution,
	})
}

// ========================================
// QUARANTINE
// ========================================

// GetQuarantines retorna quarentenas ativas
func (h *Handler) GetQuarantines(c *gin.Context) {
	quarantines := h.immunity.Quarantine().GetActiveQuarantines()

	result := make([]gin.H, 0, len(quarantines))
	for _, q := range quarantines {
		result = append(result, gin.H{
			"id":          q.ID,
			"target_type": q.TargetType,
			"target_id":   q.TargetID,
			"type":        q.Type,
			"reason":      q.Reason,
			"evidence":    q.Evidence,
			"created_at":  q.CreatedAt,
			"expires_at":  q.ExpiresAt,
			"auto_release": q.AutoRelease,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"quarantines": result,
		"total":       len(result),
	})
}

// ReleaseQuarantineRequest request para liberar quarentena
type ReleaseQuarantineRequest struct {
	TargetType string `json:"target_type" binding:"required"`
	TargetID   string `json:"target_id" binding:"required"`
	ReleasedBy string `json:"released_by" binding:"required"`
	Note       string `json:"note" binding:"required,min=10"`
}

// ReleaseQuarantine libera uma quarentena
func (h *Handler) ReleaseQuarantine(c *gin.Context) {
	var req ReleaseQuarantineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	targetType := QuarantineTarget(req.TargetType)
	if !h.immunity.Quarantine().Release(targetType, req.TargetID, req.ReleasedBy, req.Note) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quarantine not found or already released"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Quarantine released",
		"target_type": req.TargetType,
		"target_id":   req.TargetID,
		"released_by": req.ReleasedBy,
	})
}

// ========================================
// CIRCUIT BREAKERS
// ========================================

// GetCircuits retorna status dos circuit breakers
func (h *Handler) GetCircuits(c *gin.Context) {
	stats := h.immunity.CircuitBreakers().AllStats()

	c.JSON(http.StatusOK, gin.H{
		"circuits": stats,
		"total":    len(stats),
	})
}

// ResetCircuit reseta um circuit breaker
func (h *Handler) ResetCircuit(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Circuit name required"})
		return
	}

	cb := h.immunity.CircuitBreakers().Get(name)
	cb.Reset()

	c.JSON(http.StatusOK, gin.H{
		"message": "Circuit breaker reset",
		"name":    name,
		"state":   cb.State(),
	})
}

// ========================================
// THREATS
// ========================================

// GetThreats retorna fontes bloqueadas
func (h *Handler) GetThreats(c *gin.Context) {
	blocked := h.immunity.Defense().GetBlockedSources()
	stats := h.immunity.Defense().Stats()

	result := make([]gin.H, 0, len(blocked))
	for source, expiry := range blocked {
		result = append(result, gin.H{
			"source":     source,
			"expires_at": expiry,
			"remaining":  time.Until(expiry).String(),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"blocked_sources": result,
		"total_blocked":   len(result),
		"stats":           stats,
	})
}

// BlockIPRequest request para bloquear IP
type BlockIPRequest struct {
	IP       string `json:"ip" binding:"required"`
	Duration string `json:"duration" binding:"required"` // e.g., "1h", "24h"
	Reason   string `json:"reason" binding:"required"`
}

// BlockIP bloqueia um IP manualmente
func (h *Handler) BlockIP(c *gin.Context) {
	var req BlockIPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	duration, err := time.ParseDuration(req.Duration)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid duration format"})
		return
	}

	BlockIP(req.IP, duration)

	c.JSON(http.StatusOK, gin.H{
		"message":    "IP blocked",
		"ip":         req.IP,
		"duration":   req.Duration,
		"expires_at": time.Now().Add(duration),
	})
}

// UnblockIPRequest request para desbloquear IP
type UnblockIPRequest struct {
	IP string `json:"ip" binding:"required"`
}

// UnblockIP desbloqueia um IP
func (h *Handler) UnblockIP(c *gin.Context) {
	var req UnblockIPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	UnblockIP(req.IP)

	c.JSON(http.StatusOK, gin.H{
		"message": "IP unblocked",
		"ip":      req.IP,
	})
}

// ========================================
// HEALING
// ========================================

// GetHealingHistory retorna histórico de healing
func (h *Handler) GetHealingHistory(c *gin.Context) {
	limit := 50
	history := h.immunity.AutoHealer().GetRecentHistory(limit)
	stats := h.immunity.AutoHealer().GetStats()

	result := make([]gin.H, 0, len(history))
	for _, h := range history {
		result = append(result, gin.H{
			"action":       h.Action,
			"target":       h.Target,
			"success":      h.Success,
			"message":      h.Message,
			"duration_ms":  h.Duration.Milliseconds(),
			"attempted_at": h.AttemptedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"history": result,
		"stats":   stats,
	})
}

// TriggerHealingRequest request para disparar healing
type TriggerHealingRequest struct {
	Action  string                 `json:"action" binding:"required"`
	Target  string                 `json:"target" binding:"required"`
	Context map[string]interface{} `json:"context"`
}

// TriggerHealing dispara uma ação de healing manualmente
func (h *Handler) TriggerHealing(c *gin.Context) {
	var req TriggerHealingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	action := HealingAction(req.Action)
	result := h.immunity.TryHeal(action, req.Target, req.Context)

	c.JSON(http.StatusOK, gin.H{
		"action":      result.Action,
		"target":      result.Target,
		"success":     result.Success,
		"message":     result.Message,
		"duration_ms": result.Duration.Milliseconds(),
	})
}

// ========================================
// ANOMALY DETECTION
// ========================================

// GetAnomalyStats retorna estatísticas de detecção de anomalias
func (h *Handler) GetAnomalyStats(c *gin.Context) {
	stats := GetAnomalyStats()
	c.JSON(http.StatusOK, stats)
}

// GetBaselines retorna baselines de métricas
func (h *Handler) GetBaselines(c *gin.Context) {
	baselines := GetAnomalyDetector().GetAllBaselines()
	
	result := make([]gin.H, 0, len(baselines))
	for name, baseline := range baselines {
		result = append(result, gin.H{
			"name":        name,
			"mean":        baseline.Mean,
			"std_dev":     baseline.StdDev,
			"min":         baseline.Min,
			"max":         baseline.Max,
			"count":       baseline.Count,
			"last_update": baseline.LastUpdate,
		})
	}
	
	c.JSON(http.StatusOK, gin.H{
		"baselines":    result,
		"total":        len(result),
		"is_learning":  GetAnomalyDetector().IsLearning(),
	})
}

// ResetLearning reinicia o período de aprendizado
func (h *Handler) ResetLearning(c *gin.Context) {
	GetAnomalyDetector().ResetLearning()
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Learning period reset",
		"status":  "learning",
	})
}

// ========================================
// MIDDLEWARE
// ========================================

// ProtectionMiddleware middleware que integra proteção do sistema imunológico
func ProtectionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		endpoint := c.Request.URL.Path
		userID := c.GetString("user_id") // Se autenticado

		// Verificar se IP está bloqueado ou em quarentena
		action := CheckIP(ip, endpoint, userID)

		switch action {
		case ActionBlackhole:
			// Silenciosamente descarta
			c.AbortWithStatus(http.StatusServiceUnavailable)
			return

		case ActionBlock:
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
				"code":  "BLOCKED",
			})
			return

		case ActionTarpit:
			// Resposta lenta para desperdiçar tempo do atacante
			time.Sleep(5 * time.Second)

		case ActionChallenge:
			// Poderia redirecionar para CAPTCHA
			c.Header("X-Challenge-Required", "true")

		case ActionDecoy:
			// Retornar dados falsos
			c.JSON(http.StatusOK, gin.H{
				"status": "ok",
				"data":   []interface{}{},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimitMiddleware middleware de rate limiting usando o sistema imunológico
func RateLimitMiddleware(limit int64, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := "ratelimit:" + ip

		if !RateLimitGlobal(key, limit, window) {
			// Reportar como possível abuso
			GetImmunitySystem().Defense().DetectAPIAbuse(ip, int(limit)+1)

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit exceeded",
				"retry_after": window.Seconds(),
			})
			return
		}

		c.Next()
	}
}
