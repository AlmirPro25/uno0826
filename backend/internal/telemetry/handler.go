package telemetry

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"prost-qs/backend/internal/application"
)

// ========================================
// TELEMETRY HANDLER - API de Observabilidade
// ========================================

type TelemetryHandler struct {
	service *TelemetryService
}

func NewTelemetryHandler(service *TelemetryService) *TelemetryHandler {
	return &TelemetryHandler{service: service}
}

// ========================================
// INGESTÃO DE EVENTOS
// ========================================

// IngestEvent recebe eventos de apps externos
// POST /api/v1/telemetry/events
func (h *TelemetryHandler) IngestEvent(c *gin.Context) {
	// Verificar app context
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	
	// Type assertion para o tipo correto (Application do package application)
	var appID uuid.UUID
	
	if app, ok := appInterface.(*application.Application); ok {
		appID = app.ID
	} else if appIDStr, ok := c.Get("app_id"); ok {
		if id, err := uuid.Parse(appIDStr.(string)); err == nil {
			appID = id
		}
	}
	
	if appID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID não encontrado"})
		return
	}
	
	var req IngestEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	
	if err := h.service.IngestEvent(appID, &req, ip, userAgent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{"status": "ok", "message": "Evento registrado"})
}

// IngestBatch recebe múltiplos eventos de uma vez
// POST /api/v1/telemetry/events/batch
func (h *TelemetryHandler) IngestBatch(c *gin.Context) {
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	
	var appID uuid.UUID
	
	if app, ok := appInterface.(*application.Application); ok {
		appID = app.ID
	} else if appIDStr, ok := c.Get("app_id"); ok {
		if id, err := uuid.Parse(appIDStr.(string)); err == nil {
			appID = id
		}
	}
	
	if appID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID não encontrado"})
		return
	}
	
	var req struct {
		Events []IngestEventRequest `json:"events" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	
	success := 0
	failed := 0
	for _, event := range req.Events {
		if err := h.service.IngestEvent(appID, &event, ip, userAgent); err != nil {
			failed++
		} else {
			success++
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"success": success,
		"failed":  failed,
		"total":   len(req.Events),
	})
}

// ========================================
// MÉTRICAS SNAPSHOT
// ========================================

// GetMetrics retorna métricas prontas de um app
// GET /api/v1/telemetry/metrics
func (h *TelemetryHandler) GetMetrics(c *gin.Context) {
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	
	var appID uuid.UUID
	
	if app, ok := appInterface.(*application.Application); ok {
		appID = app.ID
	} else if appIDStr, ok := c.Get("app_id"); ok {
		if id, err := uuid.Parse(appIDStr.(string)); err == nil {
			appID = id
		}
	}
	
	if appID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID não encontrado"})
		return
	}
	
	snapshot, err := h.service.GetMetricsSnapshot(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, snapshot)
}

// GetMetricsAdmin retorna métricas de um app específico (admin)
// GET /api/v1/admin/telemetry/apps/:id/metrics
func (h *TelemetryHandler) GetMetricsAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	snapshot, err := h.service.GetMetricsSnapshot(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, snapshot)
}

// ========================================
// SESSÕES
// ========================================

// GetActiveSessions retorna sessões ativas
// GET /api/v1/telemetry/sessions/active
func (h *TelemetryHandler) GetActiveSessions(c *gin.Context) {
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	
	var appID uuid.UUID
	
	if app, ok := appInterface.(*application.Application); ok {
		appID = app.ID
	} else if appIDStr, ok := c.Get("app_id"); ok {
		if id, err := uuid.Parse(appIDStr.(string)); err == nil {
			appID = id
		}
	}
	
	if appID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID não encontrado"})
		return
	}
	
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}
	
	sessions, err := h.service.GetActiveSessions(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"total":    len(sessions),
	})
}

// GetActiveSessionsAdmin retorna sessões ativas de um app (admin)
// GET /api/v1/admin/telemetry/apps/:id/sessions
func (h *TelemetryHandler) GetActiveSessionsAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}
	
	sessions, err := h.service.GetActiveSessions(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"total":    len(sessions),
	})
}

// ========================================
// EVENTOS
// ========================================

// GetRecentEvents retorna eventos recentes
// GET /api/v1/telemetry/events
func (h *TelemetryHandler) GetRecentEvents(c *gin.Context) {
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	
	var appID uuid.UUID
	
	if app, ok := appInterface.(*application.Application); ok {
		appID = app.ID
	} else if appIDStr, ok := c.Get("app_id"); ok {
		if id, err := uuid.Parse(appIDStr.(string)); err == nil {
			appID = id
		}
	}
	
	if appID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID não encontrado"})
		return
	}
	
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}
	
	events, err := h.service.GetRecentEvents(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"total":  len(events),
	})
}

// GetEventsByType retorna contagem de eventos por tipo
// GET /api/v1/telemetry/events/by-type
func (h *TelemetryHandler) GetEventsByType(c *gin.Context) {
	appInterface, exists := c.Get("app")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App context obrigatório"})
		return
	}
	
	var appID uuid.UUID
	
	if app, ok := appInterface.(*application.Application); ok {
		appID = app.ID
	} else if appIDStr, ok := c.Get("app_id"); ok {
		if id, err := uuid.Parse(appIDStr.(string)); err == nil {
			appID = id
		}
	}
	
	if appID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID não encontrado"})
		return
	}
	
	// Default: últimas 24h
	since := 24 * time.Hour
	if s := c.Query("since"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			since = d
		}
	}
	
	counts, err := h.service.GetEventsByType(appID, since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"events_by_type": counts,
		"since":          since.String(),
	})
}

// ========================================
// ROUTES REGISTRATION
// ========================================

// RegisterTelemetryRoutes registra rotas de telemetria
func RegisterTelemetryRoutes(router *gin.RouterGroup, service *TelemetryService, appContextMiddleware, requireAppContext, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewTelemetryHandler(service)
	
	// Rotas para apps (autenticação via API Key)
	telemetry := router.Group("/telemetry")
	telemetry.Use(appContextMiddleware)
	telemetry.Use(requireAppContext)
	{
		// Ingestão
		telemetry.POST("/events", handler.IngestEvent)
		telemetry.POST("/events/batch", handler.IngestBatch)
		
		// Consultas
		telemetry.GET("/metrics", handler.GetMetrics)
		telemetry.GET("/sessions/active", handler.GetActiveSessions)
		telemetry.GET("/events", handler.GetRecentEvents)
		telemetry.GET("/events/by-type", handler.GetEventsByType)
	}
	
	// Rotas admin
	adminTelemetry := router.Group("/admin/telemetry")
	adminTelemetry.Use(authMiddleware)
	adminTelemetry.Use(adminMiddleware)
	{
		adminTelemetry.GET("/apps/:id/metrics", handler.GetMetricsAdmin)
		adminTelemetry.GET("/apps/:id/sessions", handler.GetActiveSessionsAdmin)
		adminTelemetry.GET("/apps/:id/alerts", handler.GetAlertsAdmin)
		adminTelemetry.GET("/alerts", handler.GetAllAlertsAdmin)
		
		// Alerts Management
		adminTelemetry.GET("/alerts/filtered", handler.GetAlertsFiltered)
		adminTelemetry.GET("/alerts/stats", handler.GetAlertStats)
		adminTelemetry.POST("/alerts/:id/acknowledge", handler.AcknowledgeAlert)
		adminTelemetry.POST("/alerts/acknowledge-all", handler.AcknowledgeAllAlerts)
		
		// Analytics
		adminTelemetry.GET("/apps/:id/retention", handler.GetRetentionAdmin)
		adminTelemetry.GET("/apps/:id/funnel", handler.GetFunnelAdmin)
		adminTelemetry.GET("/apps/:id/engagement", handler.GetEngagementAdmin)
		adminTelemetry.GET("/apps/:id/compare", handler.GetCompareAdmin)
		adminTelemetry.GET("/apps/:id/top-users", handler.GetTopUsersAdmin)
		
		// Advanced Analytics
		adminTelemetry.GET("/apps/:id/heatmap", handler.GetHeatmapAdmin)
		adminTelemetry.GET("/apps/:id/journey", handler.GetJourneyAdmin)
		adminTelemetry.GET("/apps/:id/geo", handler.GetGeoAdmin)
		adminTelemetry.GET("/apps/:id/live", handler.GetLiveEventsAdmin)
	}
}

// ========================================
// ALERTAS
// ========================================

// GetAlertsAdmin retorna alertas recentes de um app
// GET /api/v1/admin/telemetry/apps/:id/alerts
func (h *TelemetryHandler) GetAlertsAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}
	
	alerts, err := h.service.GetRecentAlerts(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"total":  len(alerts),
	})
}

// GetAllAlertsAdmin retorna alertas recentes de todos os apps
// GET /api/v1/admin/telemetry/alerts
func (h *TelemetryHandler) GetAllAlertsAdmin(c *gin.Context) {
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}
	
	alerts, err := h.service.GetAllRecentAlerts(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"total":  len(alerts),
	})
}


// ========================================
// ANALYTICS
// ========================================

// GetRetentionAdmin retorna dados de retenção D1/D7/D30
// GET /api/v1/admin/telemetry/apps/:id/retention
func (h *TelemetryHandler) GetRetentionAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	days := 30
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 90 {
			days = parsed
		}
	}
	
	retention, err := h.service.GetRetention(appID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"retention": retention,
		"days":      days,
	})
}

// GetFunnelAdmin retorna funil de conversão
// GET /api/v1/admin/telemetry/apps/:id/funnel
func (h *TelemetryHandler) GetFunnelAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	since := 24 * time.Hour
	if s := c.Query("since"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			since = d
		}
	}
	
	funnel, err := h.service.GetFunnel(appID, since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"funnel": funnel,
		"since":  since.String(),
	})
}

// GetEngagementAdmin retorna métricas de engajamento
// GET /api/v1/admin/telemetry/apps/:id/engagement
func (h *TelemetryHandler) GetEngagementAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	since := 24 * time.Hour
	if s := c.Query("since"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			since = d
		}
	}
	
	engagement, err := h.service.GetEngagementMetrics(appID, since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"engagement": engagement,
		"since":      since.String(),
	})
}


// GetCompareAdmin compara métricas entre dois períodos
// GET /api/v1/admin/telemetry/apps/:id/compare
func (h *TelemetryHandler) GetCompareAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	days := 7
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 90 {
			days = parsed
		}
	}
	
	comparison, err := h.service.ComparePeriods(appID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, comparison)
}

// GetTopUsersAdmin retorna usuários mais engajados
// GET /api/v1/admin/telemetry/apps/:id/top-users
func (h *TelemetryHandler) GetTopUsersAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	
	since := 7 * 24 * time.Hour
	if s := c.Query("since"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			since = d
		}
	}
	
	users, err := h.service.GetTopUsers(appID, since, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
		"since": since.String(),
	})
}

// GetHeatmapAdmin retorna heatmap de atividade
// GET /api/v1/admin/telemetry/apps/:id/heatmap
func (h *TelemetryHandler) GetHeatmapAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	days := 30
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 90 {
			days = parsed
		}
	}
	
	heatmap, err := h.service.GetActivityHeatmap(appID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, heatmap)
}

// GetJourneyAdmin retorna jornada do usuário
// GET /api/v1/admin/telemetry/apps/:id/journey
func (h *TelemetryHandler) GetJourneyAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	since := 24 * time.Hour
	if s := c.Query("since"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			since = d
		}
	}
	
	journey, err := h.service.GetUserJourney(appID, since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, journey)
}

// GetGeoAdmin retorna distribuição geográfica
// GET /api/v1/admin/telemetry/apps/:id/geo
func (h *TelemetryHandler) GetGeoAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	since := 7 * 24 * time.Hour
	if s := c.Query("since"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			since = d
		}
	}
	
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}
	
	geo, err := h.service.GetGeoDistribution(appID, since, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"countries": geo,
		"total":     len(geo),
		"since":     since.String(),
	})
}

// GetLiveEventsAdmin retorna eventos em tempo real
// GET /api/v1/admin/telemetry/apps/:id/live
func (h *TelemetryHandler) GetLiveEventsAdmin(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	
	events, err := h.service.GetLiveEvents(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"total":  len(events),
	})
}

// ========================================
// ALERTS MANAGEMENT
// ========================================

// GetAlertsFiltered retorna alertas com filtros
// GET /api/v1/admin/telemetry/alerts/filtered
func (h *TelemetryHandler) GetAlertsFiltered(c *gin.Context) {
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}
	
	severity := c.Query("severity") // info, warning, critical
	source := c.Query("source")     // system, rule, manual
	acknowledged := c.Query("acknowledged") // true, false
	appIDStr := c.Query("app_id")
	
	alerts, stats, err := h.service.GetAlertsFiltered(limit, severity, source, acknowledged, appIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"total":  len(alerts),
		"stats":  stats,
	})
}

// AcknowledgeAlert marca um alerta como reconhecido
// POST /api/v1/admin/telemetry/alerts/:id/acknowledge
func (h *TelemetryHandler) AcknowledgeAlert(c *gin.Context) {
	alertIDStr := c.Param("id")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Alert ID inválido"})
		return
	}
	
	// Pegar usuário do contexto
	acknowledgedBy := "admin"
	if user, exists := c.Get("user_email"); exists {
		acknowledgedBy = user.(string)
	}
	
	if err := h.service.AcknowledgeAlert(alertID, acknowledgedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Alerta reconhecido",
		"alert_id": alertID,
	})
}

// AcknowledgeAllAlerts marca todos alertas de um app como reconhecidos
// POST /api/v1/admin/telemetry/alerts/acknowledge-all
func (h *TelemetryHandler) AcknowledgeAllAlerts(c *gin.Context) {
	var req struct {
		AppID string `json:"app_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	acknowledgedBy := "admin"
	if user, exists := c.Get("user_email"); exists {
		acknowledgedBy = user.(string)
	}
	
	count, err := h.service.AcknowledgeAllAlerts(req.AppID, acknowledgedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Alertas reconhecidos",
		"count":   count,
	})
}

// GetAlertStats retorna estatísticas de alertas
// GET /api/v1/admin/telemetry/alerts/stats
func (h *TelemetryHandler) GetAlertStats(c *gin.Context) {
	stats, err := h.service.GetAlertStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, stats)
}
