package financial

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// FINANCIAL HANDLER
// ========================================

type FinancialHandler struct {
	eventService   *FinancialEventService
	metricsService *MetricsService
}

func NewFinancialHandler(eventService *FinancialEventService, metricsService *MetricsService) *FinancialHandler {
	return &FinancialHandler{
		eventService:   eventService,
		metricsService: metricsService,
	}
}

// ========================================
// APP FINANCIAL ENDPOINTS
// ========================================

// GetAppFinancialMetrics retorna métricas financeiras de um app
// GET /api/v1/apps/:id/financial/metrics
func (h *FinancialHandler) GetAppFinancialMetrics(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	metrics, err := h.metricsService.GetAppMetricsWithRolling(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// GetAppFinancialEvents lista eventos financeiros de um app
// GET /api/v1/apps/:id/financial/events
func (h *FinancialHandler) GetAppFinancialEvents(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	events, total, err := h.eventService.ListEventsByApp(appID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetAppDailySnapshots retorna snapshots diários para gráficos
// GET /api/v1/apps/:id/financial/daily
func (h *FinancialHandler) GetAppDailySnapshots(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days > 90 {
		days = 90
	}

	snapshots, err := h.metricsService.GetDailySnapshots(appID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"snapshots": snapshots,
		"days":      days,
	})
}

// ========================================
// GLOBAL FINANCIAL ENDPOINTS (Super Admin)
// ========================================

// GetGlobalFinancialMetrics retorna métricas financeiras globais
// GET /api/v1/admin/financial/metrics
func (h *FinancialHandler) GetGlobalFinancialMetrics(c *gin.Context) {
	metrics, err := h.metricsService.GetGlobalMetrics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// GetGlobalDailySnapshots retorna snapshots diários globais
// GET /api/v1/admin/financial/daily
func (h *FinancialHandler) GetGlobalDailySnapshots(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days > 90 {
		days = 90
	}

	snapshots, err := h.metricsService.GetGlobalDailySnapshots(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"snapshots": snapshots,
		"days":      days,
	})
}

// GetRecentFinancialEvents lista eventos recentes (global)
// GET /api/v1/admin/financial/events
func (h *FinancialHandler) GetRecentFinancialEvents(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 200 {
		limit = 200
	}

	events, err := h.eventService.ListRecentEvents(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"total":  len(events),
	})
}

// GetTopApps retorna apps com maior receita
// GET /api/v1/admin/financial/top-apps
func (h *FinancialHandler) GetTopApps(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit > 50 {
		limit = 50
	}

	apps, err := h.metricsService.GetTopAppsByRevenue(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"apps": apps,
	})
}

// RecalculateAppMetrics recalcula métricas de um app
// POST /api/v1/admin/financial/recalculate/:id
func (h *FinancialHandler) RecalculateAppMetrics(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	if err := h.metricsService.RecalculateAppMetrics(appID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Métricas recalculadas com sucesso",
		"app_id":  appID,
	})
}

// ========================================
// ROUTES REGISTRATION
// ========================================

func RegisterFinancialRoutes(router *gin.RouterGroup, eventService *FinancialEventService, metricsService *MetricsService, authMiddleware, adminMiddleware, superAdminMiddleware gin.HandlerFunc) {
	handler := NewFinancialHandler(eventService, metricsService)

	// Rotas por app (owner do app)
	apps := router.Group("/apps")
	apps.Use(authMiddleware)
	{
		apps.GET("/:id/financial/metrics", handler.GetAppFinancialMetrics)
		apps.GET("/:id/financial/events", handler.GetAppFinancialEvents)
		apps.GET("/:id/financial/daily", handler.GetAppDailySnapshots)
	}

	// Rotas globais (super admin)
	admin := router.Group("/admin/financial")
	admin.Use(authMiddleware)
	admin.Use(superAdminMiddleware)
	{
		admin.GET("/metrics", handler.GetGlobalFinancialMetrics)
		admin.GET("/daily", handler.GetGlobalDailySnapshots)
		admin.GET("/events", handler.GetRecentFinancialEvents)
		admin.GET("/top-apps", handler.GetTopApps)
		admin.POST("/recalculate/:id", handler.RecalculateAppMetrics)
	}
}
