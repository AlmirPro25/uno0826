package admin

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ========================================
// COGNITIVE DASHBOARD HANDLER - Fase 26.5
// "Observabilidade total. Zero interferência."
// READ-ONLY: Todos os endpoints são GET
// ========================================

// CognitiveHandler gerencia endpoints do dashboard cognitivo
type CognitiveHandler struct {
	service *CognitiveDashboardService
}

// NewCognitiveHandler cria o handler
func NewCognitiveHandler(service *CognitiveDashboardService) *CognitiveHandler {
	return &CognitiveHandler{service: service}
}

// ========================================
// ENDPOINTS
// ========================================

// GetCognitiveDashboard retorna KPIs principais
// GET /admin/cognitive/dashboard
// Responde em 30 segundos:
// - O sistema está saudável?
// - Os agentes estão úteis ou ruidosos?
// - Estou confiando mais ou menos neles?
func (h *CognitiveHandler) GetCognitiveDashboard(c *gin.Context) {
	dashboard, err := h.service.GetCognitiveDashboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Erro ao buscar dashboard cognitivo",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, dashboard)
}

// GetAgentsOverview retorna visão geral dos agentes
// GET /admin/cognitive/agents
// Mostra efetividade de cada agente
func (h *CognitiveHandler) GetAgentsOverview(c *gin.Context) {
	overview, err := h.service.GetAgentsOverview()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Erro ao buscar overview dos agentes",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, overview)
}

// GetDecisionStats retorna estatísticas de decisões
// GET /admin/cognitive/decisions
// Mostra distribuição e padrões de decisões humanas
func (h *CognitiveHandler) GetDecisionStats(c *gin.Context) {
	stats, err := h.service.GetDecisionStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Erro ao buscar estatísticas de decisões",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// GetTopFindings retorna top findings
// GET /admin/cognitive/findings?limit=10
// Mostra findings mais frequentes
func (h *CognitiveHandler) GetTopFindings(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	findings, err := h.service.GetTopFindings(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Erro ao buscar top findings",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"findings": findings,
		"count":    len(findings),
	})
}

// GetNoisePatterns retorna padrões de ruído
// GET /admin/cognitive/noise
// Identifica sugestões frequentemente ignoradas
func (h *CognitiveHandler) GetNoisePatterns(c *gin.Context) {
	patterns, err := h.service.GetNoisePatterns()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Erro ao buscar padrões de ruído",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, patterns)
}

// GetTrustEvolution retorna evolução da confiança
// GET /admin/cognitive/trust?days=30
// Mostra como a confiança no sistema evolui ao longo do tempo
func (h *CognitiveHandler) GetTrustEvolution(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	evolution, err := h.service.GetTrustEvolution(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Erro ao buscar evolução da confiança",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, evolution)
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterCognitiveRoutes registra rotas do dashboard cognitivo
// Todas as rotas são READ-ONLY (GET)
func RegisterCognitiveRoutes(router *gin.RouterGroup, service *CognitiveDashboardService, authMiddleware gin.HandlerFunc, adminMiddleware gin.HandlerFunc) {
	handler := NewCognitiveHandler(service)

	cognitive := router.Group("/admin/cognitive")
	cognitive.Use(authMiddleware)
	cognitive.Use(adminMiddleware)
	{
		// Dashboard principal - KPIs
		cognitive.GET("/dashboard", handler.GetCognitiveDashboard)

		// Visão dos agentes
		cognitive.GET("/agents", handler.GetAgentsOverview)

		// Estatísticas de decisões
		cognitive.GET("/decisions", handler.GetDecisionStats)

		// Top findings
		cognitive.GET("/findings", handler.GetTopFindings)

		// Padrões de ruído
		cognitive.GET("/noise", handler.GetNoisePatterns)

		// Evolução da confiança
		cognitive.GET("/trust", handler.GetTrustEvolution)
	}
}
