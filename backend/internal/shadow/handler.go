package shadow

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// SHADOW HANDLER - API REST
// ========================================

type ShadowHandler struct {
	service *ShadowService
}

func NewShadowHandler(service *ShadowService) *ShadowHandler {
	return &ShadowHandler{service: service}
}

// GetRecent retorna execuções shadow recentes
// GET /api/v1/shadow/executions
func (h *ShadowHandler) GetRecent(c *gin.Context) {
	executions, err := h.service.GetRecent(100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"executions": executions,
		"total":      len(executions),
	})
}

// GetByAgent retorna execuções shadow de um agente
// GET /api/v1/shadow/agents/:agentId
func (h *ShadowHandler) GetByAgent(c *gin.Context) {
	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	executions, err := h.service.GetByAgent(agentID, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"agent_id":   agentID,
		"executions": executions,
		"total":      len(executions),
	})
}

// GetStats retorna estatísticas de shadow mode
// GET /api/v1/shadow/agents/:agentId/stats
func (h *ShadowHandler) GetStats(c *gin.Context) {
	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Período padrão: últimos 7 dias
	since := time.Now().AddDate(0, 0, -7)
	periodParam := c.Query("period")
	switch periodParam {
	case "24h":
		since = time.Now().Add(-24 * time.Hour)
	case "30d":
		since = time.Now().AddDate(0, 0, -30)
	}

	stats, err := h.service.GetStats(agentID, since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stats.Period = periodParam
	if stats.Period == "" {
		stats.Period = "7d"
	}

	c.JSON(http.StatusOK, stats)
}

// GetByAction retorna execuções shadow por ação
// GET /api/v1/shadow/actions/:action
func (h *ShadowHandler) GetByAction(c *gin.Context) {
	action := c.Param("action")

	executions, err := h.service.GetByAction(action, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"action":     action,
		"executions": executions,
		"total":      len(executions),
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterShadowRoutes registra rotas de shadow mode
func RegisterShadowRoutes(router *gin.RouterGroup, service *ShadowService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewShadowHandler(service)

	shadow := router.Group("/shadow")
	shadow.Use(authMiddleware)
	shadow.Use(adminMiddleware) // Apenas admin pode ver shadow executions
	{
		shadow.GET("/executions", handler.GetRecent)
		shadow.GET("/agents/:agentId", handler.GetByAgent)
		shadow.GET("/agents/:agentId/stats", handler.GetStats)
		shadow.GET("/actions/:action", handler.GetByAction)
	}
}
