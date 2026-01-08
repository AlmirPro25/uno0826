package observer

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ========================================
// OBSERVER HANDLER - Fase 23
// "Endpoint read-only para sugestões"
// ========================================

type ObserverHandler struct {
	service *ObserverService
}

func NewObserverHandler(service *ObserverService) *ObserverHandler {
	return &ObserverHandler{service: service}
}

// ========================================
// GET /agents/suggestions
// "Read-only, sem side effects"
// ========================================

type SuggestionsResponse struct {
	Enabled     bool         `json:"enabled"`
	Suggestions []Suggestion `json:"suggestions"`
	Metrics     AgentMetrics `json:"metrics"`
}

// GetSuggestions retorna sugestões do agente
// GET /agents/suggestions
func (h *ObserverHandler) GetSuggestions(c *gin.Context) {
	enabled := h.service.IsEnabled()
	
	response := SuggestionsResponse{
		Enabled:     enabled,
		Suggestions: []Suggestion{},
		Metrics:     h.service.GetMetrics(),
	}

	if enabled {
		// Executar análise sob demanda
		h.service.Run()
		response.Suggestions = h.service.GetSuggestions()
	}

	c.JSON(http.StatusOK, response)
}

// ========================================
// GET /agents/status
// "Status do sistema de agentes"
// ========================================

type AgentStatusResponse struct {
	Enabled      bool                `json:"enabled"`
	AgentName    string              `json:"agent_name"`
	Metrics      AgentMetrics        `json:"metrics"`
	LastSnapshot *ControlledSnapshot `json:"last_snapshot,omitempty"`
}

// GetStatus retorna status do sistema de agentes
// GET /agents/status
func (h *ObserverHandler) GetStatus(c *gin.Context) {
	response := AgentStatusResponse{
		Enabled:      h.service.IsEnabled(),
		AgentName:    AgentNameObserverV1,
		Metrics:      h.service.GetMetrics(),
		LastSnapshot: h.service.GetLastSnapshot(),
	}

	c.JSON(http.StatusOK, response)
}

// ========================================
// GET /agents/metrics
// "Métricas do agente"
// ========================================

// GetMetrics retorna métricas do agente
// GET /agents/metrics
func (h *ObserverHandler) GetMetrics(c *gin.Context) {
	c.JSON(http.StatusOK, h.service.GetMetrics())
}

// ========================================
// ROUTES REGISTRATION
// ========================================

// RegisterObserverRoutes registra rotas do observer
func RegisterObserverRoutes(r *gin.Engine, service *ObserverService) {
	handler := NewObserverHandler(service)

	agents := r.Group("/agents")
	{
		// Todos os endpoints são read-only
		agents.GET("/suggestions", handler.GetSuggestions)
		agents.GET("/status", handler.GetStatus)
		agents.GET("/metrics", handler.GetMetrics)
	}
}
