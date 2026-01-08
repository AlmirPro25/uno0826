package explainability

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// INTELLIGENCE HANDLER - HTTP API
// "Mostrar onde o sistema está sob tensão"
// ========================================

type IntelligenceHandler struct {
	service *IntelligenceService
}

func NewIntelligenceHandler(service *IntelligenceService) *IntelligenceHandler {
	return &IntelligenceHandler{service: service}
}

// ========================================
// ENDPOINTS
// ========================================

// GetDashboard retorna o dashboard administrativo
// GET /api/v1/admin/intelligence/dashboard
func (h *IntelligenceHandler) GetDashboard(c *gin.Context) {
	query := DashboardQuery{
		Period: c.DefaultQuery("period", "last_24h"),
		TopN:   10,
	}

	if topN := c.Query("top_n"); topN != "" {
		if n, err := strconv.Atoi(topN); err == nil && n > 0 {
			query.TopN = n
		}
	}

	if appIDStr := c.Query("app_id"); appIDStr != "" {
		if appID, err := uuid.Parse(appIDStr); err == nil {
			query.AppID = &appID
		}
	}

	dashboard, err := h.service.GetDashboard(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dashboard)
}

// GetTensions retorna apenas os pontos de tensão
// GET /api/v1/admin/intelligence/tensions
func (h *IntelligenceHandler) GetTensions(c *gin.Context) {
	query := DashboardQuery{
		Period: c.DefaultQuery("period", "last_24h"),
		TopN:   10,
	}

	dashboard, err := h.service.GetDashboard(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filtrar por severidade se especificado
	severity := c.Query("severity")
	tensions := dashboard.Tensions
	if severity != "" {
		filtered := []TensionPoint{}
		for _, t := range tensions {
			if t.Severity == severity {
				filtered = append(filtered, t)
			}
		}
		tensions = filtered
	}

	c.JSON(http.StatusOK, gin.H{
		"tensions":     tensions,
		"count":        len(tensions),
		"period":       query.Period,
		"generated_at": dashboard.GeneratedAt,
	})
}

// GetTopRiskyApps retorna ranking de apps por risco
// GET /api/v1/admin/intelligence/risky-apps
func (h *IntelligenceHandler) GetTopRiskyApps(c *gin.Context) {
	query := DashboardQuery{
		Period: c.DefaultQuery("period", "last_24h"),
		TopN:   10,
	}

	if topN := c.Query("top_n"); topN != "" {
		if n, err := strconv.Atoi(topN); err == nil && n > 0 {
			query.TopN = n
		}
	}

	dashboard, err := h.service.GetDashboard(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"apps":         dashboard.TopRiskyApps,
		"count":        len(dashboard.TopRiskyApps),
		"period":       query.Period,
		"generated_at": dashboard.GeneratedAt,
	})
}

// GetPolicyStats retorna estatísticas de policies
// GET /api/v1/admin/intelligence/policies
func (h *IntelligenceHandler) GetPolicyStats(c *gin.Context) {
	query := DashboardQuery{
		Period: c.DefaultQuery("period", "last_24h"),
		TopN:   10,
	}

	if topN := c.Query("top_n"); topN != "" {
		if n, err := strconv.Atoi(topN); err == nil && n > 0 {
			query.TopN = n
		}
	}

	dashboard, err := h.service.GetDashboard(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"policies":     dashboard.MostTriggeredPolicies,
		"count":        len(dashboard.MostTriggeredPolicies),
		"period":       query.Period,
		"generated_at": dashboard.GeneratedAt,
	})
}

// GetDivergenceHotspots retorna pontos quentes de divergência
// GET /api/v1/admin/intelligence/divergences
func (h *IntelligenceHandler) GetDivergenceHotspots(c *gin.Context) {
	query := DashboardQuery{
		Period: c.DefaultQuery("period", "last_24h"),
		TopN:   10,
	}

	if topN := c.Query("top_n"); topN != "" {
		if n, err := strconv.Atoi(topN); err == nil && n > 0 {
			query.TopN = n
		}
	}

	dashboard, err := h.service.GetDashboard(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"hotspots":          dashboard.DivergenceHotspots,
		"count":             len(dashboard.DivergenceHotspots),
		"total_divergences": dashboard.Overview.DivergenceCount,
		"divergence_rate":   dashboard.Overview.DivergenceRate,
		"period":            query.Period,
		"generated_at":      dashboard.GeneratedAt,
	})
}

// GetAppIntelligence retorna inteligência específica de um app
// GET /api/v1/admin/intelligence/apps/:appId
func (h *IntelligenceHandler) GetAppIntelligence(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	period := c.DefaultQuery("period", "last_24h")

	intel, err := h.service.GetAppIntelligence(appID, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, intel)
}

// GetOverview retorna apenas o overview
// GET /api/v1/admin/intelligence/overview
func (h *IntelligenceHandler) GetOverview(c *gin.Context) {
	query := DashboardQuery{
		Period: c.DefaultQuery("period", "last_24h"),
		TopN:   1, // Não precisa de rankings
	}

	dashboard, err := h.service.GetDashboard(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"overview":     dashboard.Overview,
		"period":       query.Period,
		"generated_at": dashboard.GeneratedAt,
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterIntelligenceRoutes registra rotas de intelligence
func RegisterIntelligenceRoutes(router *gin.RouterGroup, service *IntelligenceService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewIntelligenceHandler(service)

	// Rotas de intelligence (todas admin-only)
	intel := router.Group("/admin/intelligence")
	intel.Use(authMiddleware, adminMiddleware)
	{
		intel.GET("/dashboard", handler.GetDashboard)
		intel.GET("/overview", handler.GetOverview)
		intel.GET("/tensions", handler.GetTensions)
		intel.GET("/risky-apps", handler.GetTopRiskyApps)
		intel.GET("/policies", handler.GetPolicyStats)
		intel.GET("/divergences", handler.GetDivergenceHotspots)
		intel.GET("/apps/:appId", handler.GetAppIntelligence)
	}
}
