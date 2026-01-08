package explainability

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// BUSINESS EXPLAINABILITY HANDLER - HTTP API
// "Chief Risk Officer Digital"
// ========================================

type BusinessHandler struct {
	service *BusinessExplainabilityService
}

func NewBusinessHandler(service *BusinessExplainabilityService) *BusinessHandler {
	return &BusinessHandler{service: service}
}

// ========================================
// EXECUTIVE SUMMARY
// ========================================

// GetExecutiveSummary retorna resumo executivo
// GET /api/v1/explainability/executive-summary
func (h *BusinessHandler) GetExecutiveSummary(c *gin.Context) {
	period := c.DefaultQuery("period", "last_24h")

	summary, err := h.service.GetExecutiveSummary(period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// ========================================
// APP CLASSIFICATION & REPORT
// ========================================

// GetAppClassification retorna classificação de um app
// GET /api/v1/explainability/apps/:appId/classification
func (h *BusinessHandler) GetAppClassification(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	period := c.DefaultQuery("period", "last_7d")
	classification, reason := h.service.ClassifyApp(appID, period)

	c.JSON(http.StatusOK, gin.H{
		"app_id":         appID,
		"classification": classification,
		"reason":         reason,
		"period":         period,
	})
}


// GetAppReport retorna relatório executivo de um app
// GET /api/v1/explainability/apps/:appId/report
func (h *BusinessHandler) GetAppReport(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	period := c.DefaultQuery("period", "last_7d")
	report, err := h.service.GetAppReport(appID, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// ========================================
// DECISION EXPLANATION
// ========================================

// ExplainDecision retorna explicação executiva de uma decisão
// GET /api/v1/explainability/decisions/:decisionId/explain
func (h *BusinessHandler) ExplainDecision(c *gin.Context) {
	decisionIDStr := c.Param("decisionId")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision_id inválido"})
		return
	}

	explanation, err := h.service.ExplainDecision(decisionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "decisão não encontrada"})
		return
	}

	c.JSON(http.StatusOK, explanation)
}

// ========================================
// PERIOD REPORTS
// ========================================

// GetDailyReport retorna relatório diário
// GET /api/v1/explainability/reports/daily
func (h *BusinessHandler) GetDailyReport(c *gin.Context) {
	report, err := h.service.GetPeriodReport("daily")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// GetWeeklyReport retorna relatório semanal
// GET /api/v1/explainability/reports/weekly
func (h *BusinessHandler) GetWeeklyReport(c *gin.Context) {
	report, err := h.service.GetPeriodReport("weekly")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// GetMonthlyReport retorna relatório mensal
// GET /api/v1/explainability/reports/monthly
func (h *BusinessHandler) GetMonthlyReport(c *gin.Context) {
	report, err := h.service.GetPeriodReport("monthly")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterBusinessRoutes registra rotas de Business Explainability
func RegisterBusinessRoutes(
	router *gin.RouterGroup,
	timelineService *TimelineService,
	intelligenceService *IntelligenceService,
	authMiddleware gin.HandlerFunc,
	adminMiddleware gin.HandlerFunc,
) {
	service := NewBusinessExplainabilityService(
		timelineService.db,
		timelineService,
		intelligenceService,
	)
	handler := NewBusinessHandler(service)

	// Rotas de explainability (requer auth)
	explain := router.Group("/explainability")
	explain.Use(authMiddleware)
	{
		// Executive Summary (admin only)
		explain.GET("/executive-summary", adminMiddleware, handler.GetExecutiveSummary)

		// App Classification & Report
		explain.GET("/apps/:appId/classification", handler.GetAppClassification)
		explain.GET("/apps/:appId/report", handler.GetAppReport)

		// Decision Explanation
		explain.GET("/decisions/:decisionId/explain", handler.ExplainDecision)

		// Period Reports (admin only)
		reports := explain.Group("/reports")
		reports.Use(adminMiddleware)
		{
			reports.GET("/daily", handler.GetDailyReport)
			reports.GET("/weekly", handler.GetWeeklyReport)
			reports.GET("/monthly", handler.GetMonthlyReport)
		}
	}
}
