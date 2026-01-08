package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ========================================
// COGNITIVE NARRATOR HANDLER - Fase 26.6
// "Gemini como narrador, não como cérebro"
// READ-ONLY: Apenas interpreta dados, nunca decide
// ========================================

// NarratorHandler gerencia endpoints de narração
type NarratorHandler struct {
	service *NarratorService
}

// NewNarratorHandler cria o handler
func NewNarratorHandler(service *NarratorService) *NarratorHandler {
	return &NarratorHandler{service: service}
}

// ========================================
// ENDPOINTS
// ========================================

// GetNarratorStatus retorna status do narrador
// GET /admin/cognitive/narrator/status
func (h *NarratorHandler) GetNarratorStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"enabled": h.service.IsEnabled(),
		"model":   h.service.model,
		"message": func() string {
			if h.service.IsEnabled() {
				return "Gemini Narrator está habilitado e pronto"
			}
			return "Gemini Narrator desabilitado. Configure GEMINI_API_KEY e GEMINI_NARRATOR_ENABLED=true"
		}(),
	})
}

// Narrate gera uma narrativa
// POST /admin/cognitive/narrate
// Body: { "type": "summary" | "daily" | "weekly" | "question", "question"?: string }
func (h *NarratorHandler) Narrate(c *gin.Context) {
	var req NarrateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Requisição inválida",
			"details": err.Error(),
		})
		return
	}

	// Validar tipo
	validTypes := map[NarrationType]bool{
		NarrativeSummary:  true,
		NarrativeDaily:    true,
		NarrativeWeekly:   true,
		NarrativeQuestion: true,
	}
	if !validTypes[req.Type] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tipo inválido",
			"valid_types": []string{"summary", "daily", "weekly", "question"},
		})
		return
	}

	// Validar pergunta se tipo for question
	if req.Type == NarrativeQuestion && req.Question == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Campo 'question' é obrigatório para tipo 'question'",
		})
		return
	}

	response, err := h.service.Narrate(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao gerar narrativa",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetDailyReport gera relatório diário
// GET /admin/cognitive/report/daily
func (h *NarratorHandler) GetDailyReport(c *gin.Context) {
	report, err := h.service.GenerateDailyReport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao gerar relatório diário",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, report)
}

// GetWeeklyReport gera relatório semanal
// GET /admin/cognitive/report/weekly
func (h *NarratorHandler) GetWeeklyReport(c *gin.Context) {
	report, err := h.service.GenerateWeeklyReport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao gerar relatório semanal",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, report)
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterNarratorRoutes registra rotas do narrador
func RegisterNarratorRoutes(router *gin.RouterGroup, service *NarratorService, authMiddleware gin.HandlerFunc, adminMiddleware gin.HandlerFunc) {
	handler := NewNarratorHandler(service)

	narrator := router.Group("/admin/cognitive")
	narrator.Use(authMiddleware)
	narrator.Use(adminMiddleware)
	{
		// Status do narrador
		narrator.GET("/narrator/status", handler.GetNarratorStatus)

		// Narração sob demanda
		narrator.POST("/narrate", handler.Narrate)

		// Relatórios
		narrator.GET("/report/daily", handler.GetDailyReport)
		narrator.GET("/report/weekly", handler.GetWeeklyReport)
	}
}
