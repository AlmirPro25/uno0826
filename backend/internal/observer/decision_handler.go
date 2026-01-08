package observer

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// HUMAN DECISION HANDLER - Fase 25
// "Console minimalista para decisões humanas"
// ========================================

type HumanDecisionHandler struct {
	service *HumanDecisionService
}

func NewHumanDecisionHandler(service *HumanDecisionService) *HumanDecisionHandler {
	return &HumanDecisionHandler{service: service}
}

// ========================================
// POST /decisions
// "Registrar decisão humana sobre sugestão"
// ========================================

type RecordDecisionRequest struct {
	SuggestionID string `json:"suggestion_id" binding:"required"`
	Decision     string `json:"decision" binding:"required"`
	Reason       string `json:"reason" binding:"required"`
	Human        string `json:"human" binding:"required"`
}

// RecordDecision registra uma decisão humana
// POST /decisions
func (h *HumanDecisionHandler) RecordDecision(c *gin.Context) {
	var req RecordDecisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse suggestion ID
	suggestionID, err := uuid.Parse(req.SuggestionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "suggestion_id inválido"})
		return
	}

	// Extrair IP e UserAgent
	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Registrar decisão
	decision, err := h.service.RecordDecision(
		suggestionID,
		DecisionType(req.Decision),
		req.Reason,
		req.Human,
		ip,
		userAgent,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Decisão registrada",
		"decision": decision,
	})
}

// ========================================
// GET /decisions
// "Listar decisões humanas"
// ========================================

// GetDecisions lista decisões
// GET /decisions
func (h *HumanDecisionHandler) GetDecisions(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "100")
	limit, _ := strconv.Atoi(limitStr)

	human := c.Query("human")

	var decisions []HumanDecision
	var err error

	if human != "" {
		decisions, err = h.service.GetDecisionsByHuman(human, limit)
	} else {
		decisions, err = h.service.GetDecisions(limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"decisions": decisions,
		"total":     len(decisions),
	})
}

// ========================================
// GET /decisions/stats
// "Estatísticas de decisões"
// ========================================

// GetDecisionStats retorna estatísticas
// GET /decisions/stats
func (h *HumanDecisionHandler) GetDecisionStats(c *gin.Context) {
	stats, err := h.service.GetDecisionStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ========================================
// GET /console
// "Dashboard do console"
// ========================================

// GetConsole retorna dashboard do console
// GET /console
func (h *HumanDecisionHandler) GetConsole(c *gin.Context) {
	dashboard, err := h.service.GetDashboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dashboard)
}

// ========================================
// ROUTES REGISTRATION
// ========================================

// RegisterDecisionRoutes registra rotas de decisões
func RegisterDecisionRoutes(r *gin.Engine, service *HumanDecisionService) {
	handler := NewHumanDecisionHandler(service)

	// Console (read-only)
	r.GET("/console", handler.GetConsole)

	// Decisões
	decisions := r.Group("/decisions")
	{
		decisions.GET("", handler.GetDecisions)
		decisions.GET("/stats", handler.GetDecisionStats)
		decisions.POST("", handler.RecordDecision) // Única escrita permitida
	}
}
