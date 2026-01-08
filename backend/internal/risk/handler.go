package risk

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// RISK HANDLER - HTTP API
// ========================================

type RiskHandler struct {
	service *RiskService
}

func NewRiskHandler(service *RiskService) *RiskHandler {
	return &RiskHandler{service: service}
}

// ========================================
// ENDPOINTS
// ========================================

// GetAppRisk retorna o score de risco de um app
// GET /api/v1/risk/apps/:appId
func (h *RiskHandler) GetAppRisk(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	risk, err := h.service.GetAppRisk(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao calcular risco"})
		return
	}

	c.JSON(http.StatusOK, risk)
}

// GetAppRiskHistory retorna o histórico de risco de um app
// GET /api/v1/risk/apps/:appId/history
func (h *RiskHandler) GetAppRiskHistory(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	// Dias padrão: 7
	days := 7
	if daysParam := c.Query("days"); daysParam != "" {
		// Parse days se fornecido
		var d int
		if _, err := fmt.Sscanf(daysParam, "%d", &d); err == nil && d > 0 && d <= 90 {
			days = d
		}
	}

	history, err := h.service.GetRiskHistory(appID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar histórico"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"app_id":  appID,
		"days":    days,
		"history": history,
		"count":   len(history),
	})
}

// GetAppRiskTrend retorna a tendência de risco de um app
// GET /api/v1/risk/apps/:appId/trend
func (h *RiskHandler) GetAppRiskTrend(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	trend, diff, err := h.service.GetRiskTrend(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao calcular tendência"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"app_id":     appID,
		"trend":      trend,
		"difference": diff,
		"period":     "7 days",
	})
}

// CalculateRisk força recálculo do risco
// POST /api/v1/risk/apps/:appId/calculate
func (h *RiskHandler) CalculateRisk(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	// Sempre força recálculo quando chamado via POST
	risk, err := h.service.ForceCalculateAppRisk(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao calcular risco"})
		return
	}

	c.JSON(http.StatusOK, risk)
}

// CheckRisk verifica se o risco está aceitável
// POST /api/v1/risk/check
func (h *RiskHandler) CheckRisk(c *gin.Context) {
	var req struct {
		AppID            string `json:"app_id" binding:"required"`
		MaxAcceptableLevel string `json:"max_acceptable_level" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	appID, err := uuid.Parse(req.AppID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	// Validar nível
	var maxLevel RiskLevel
	switch req.MaxAcceptableLevel {
	case "low":
		maxLevel = RiskLevelLow
	case "medium":
		maxLevel = RiskLevelMedium
	case "high":
		maxLevel = RiskLevelHigh
	case "critical":
		maxLevel = RiskLevelCritical
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "max_acceptable_level inválido (low, medium, high, critical)"})
		return
	}

	acceptable, risk, err := h.service.CheckRisk(appID, maxLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar risco"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"acceptable":           acceptable,
		"current_level":        risk.Level,
		"max_acceptable_level": maxLevel,
		"score":                risk.Score,
		"explanation":          risk.Explanation,
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterRiskRoutes registra rotas do módulo Risk
func RegisterRiskRoutes(router *gin.RouterGroup, service *RiskService, authMiddleware gin.HandlerFunc) {
	handler := NewRiskHandler(service)

	risk := router.Group("/risk")
	{
		// App risk
		risk.GET("/apps/:appId", authMiddleware, handler.GetAppRisk)
		risk.GET("/apps/:appId/history", authMiddleware, handler.GetAppRiskHistory)
		risk.GET("/apps/:appId/trend", authMiddleware, handler.GetAppRiskTrend)
		risk.POST("/apps/:appId/calculate", authMiddleware, handler.CalculateRisk)

		// Risk check
		risk.POST("/check", authMiddleware, handler.CheckRisk)
	}
}
