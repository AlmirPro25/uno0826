package observer

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ========================================
// AGENT MEMORY HANDLER - Fase 24
// "Endpoints read-only para memória de agentes"
// ========================================

type AgentMemoryHandler struct {
	service *AgentMemoryService
}

func NewAgentMemoryHandler(service *AgentMemoryService) *AgentMemoryHandler {
	return &AgentMemoryHandler{service: service}
}

// ========================================
// GET /agents/memory
// "Lista entradas da memória (read-only)"
// ========================================

type MemoryResponse struct {
	Enabled bool               `json:"enabled"`
	Entries []AgentMemoryEntry `json:"entries"`
	Total   int                `json:"total"`
	Query   MemoryQueryInfo    `json:"query"`
}

type MemoryQueryInfo struct {
	Agent  string `json:"agent,omitempty"`
	Window string `json:"window,omitempty"`
	Limit  int    `json:"limit"`
}

// GetMemory retorna entradas da memória
// GET /agents/memory
// Query params: agent, window (1h, 24h, 7d), limit
func (h *AgentMemoryHandler) GetMemory(c *gin.Context) {
	enabled := h.service.IsMemoryEnabled()

	// Parse query params
	agent := c.Query("agent")
	window := c.DefaultQuery("window", "24h")
	limitStr := c.DefaultQuery("limit", "100")
	limit, _ := strconv.Atoi(limitStr)

	query := AgentMemoryQuery{
		Agent:  agent,
		Window: window,
		Limit:  limit,
	}

	entries, err := h.service.GetMemory(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, MemoryResponse{
		Enabled: enabled,
		Entries: entries,
		Total:   len(entries),
		Query: MemoryQueryInfo{
			Agent:  agent,
			Window: window,
			Limit:  limit,
		},
	})
}

// ========================================
// GET /agents/memory/:agent
// "Lista entradas de um agente específico"
// ========================================

// GetMemoryByAgent retorna entradas de um agente
// GET /agents/memory/:agent
func (h *AgentMemoryHandler) GetMemoryByAgent(c *gin.Context) {
	agent := c.Param("agent")
	limitStr := c.DefaultQuery("limit", "100")
	limit, _ := strconv.Atoi(limitStr)

	entries, err := h.service.GetMemoryByAgent(agent, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"enabled": h.service.IsMemoryEnabled(),
		"agent":   agent,
		"entries": entries,
		"total":   len(entries),
	})
}

// ========================================
// GET /agents/memory/stats
// "Estatísticas da memória"
// ========================================

// GetMemoryStats retorna estatísticas
// GET /agents/memory/stats
func (h *AgentMemoryHandler) GetMemoryStats(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"enabled": h.service.IsMemoryEnabled(),
		"stats":   stats,
		"metrics": GetMemoryMetrics(),
	})
}

// ========================================
// ROUTES REGISTRATION
// ========================================

// RegisterMemoryRoutes registra rotas de memória
func RegisterMemoryRoutes(r *gin.Engine, service *AgentMemoryService) {
	handler := NewAgentMemoryHandler(service)

	memory := r.Group("/agents/memory")
	{
		// Todos os endpoints são read-only
		memory.GET("", handler.GetMemory)
		memory.GET("/stats", handler.GetMemoryStats)
		memory.GET("/:agent", handler.GetMemoryByAgent)
	}
}
