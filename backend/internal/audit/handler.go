package audit

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// AUDIT HANDLER - API REST
// ========================================

type AuditHandler struct {
	service *AuditService
}

func NewAuditHandler(service *AuditService) *AuditHandler {
	return &AuditHandler{service: service}
}

// QueryEvents busca eventos com filtros
// GET /api/v1/audit/events
func (h *AuditHandler) QueryEvents(c *gin.Context) {
	var query AuditQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	events, total, err := h.service.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar eventos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  events,
		"total": total,
	})
}

// GetEvent busca um evento por ID
// GET /api/v1/audit/events/:id
func (h *AuditHandler) GetEvent(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	event, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Evento não encontrado"})
		return
	}

	c.JSON(http.StatusOK, event)
}

// GetActorEvents busca eventos de um ator
// GET /api/v1/audit/actors/:id/events
func (h *AuditHandler) GetActorEvents(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	events, err := h.service.GetEventsByActor(id, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar eventos"})
		return
	}

	c.JSON(http.StatusOK, events)
}

// GetTargetEvents busca eventos de um alvo
// GET /api/v1/audit/targets/:id/events
func (h *AuditHandler) GetTargetEvents(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	events, err := h.service.GetEventsByTarget(id, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar eventos"})
		return
	}

	c.JSON(http.StatusOK, events)
}

// GetChainStatus retorna status da cadeia
// GET /api/v1/audit/chain/status
func (h *AuditHandler) GetChainStatus(c *gin.Context) {
	status, err := h.service.GetChainStatus()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar status"})
		return
	}

	c.JSON(http.StatusOK, status)
}

// VerifyChain verifica integridade da cadeia
// POST /api/v1/audit/chain/verify
func (h *AuditHandler) VerifyChain(c *gin.Context) {
	var req struct {
		StartSequence int64 `json:"start_sequence"`
		EndSequence   int64 `json:"end_sequence"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	valid, err := h.service.VerifyChain(req.StartSequence, req.EndSequence)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar cadeia"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":          valid,
		"start_sequence": req.StartSequence,
		"end_sequence":   req.EndSequence,
	})
}

// GetAppEvents busca eventos de um app específico
func (h *AuditHandler) GetAppEvents(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	events, err := h.service.GetEventsByApp(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": events, "total": len(events), "app_id": appID})
}

// GetAppStats retorna estatísticas de audit de um app
func (h *AuditHandler) GetAppStats(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	stats, err := h.service.GetAppStats(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterAuditRoutes registra as rotas de audit
func RegisterAuditRoutes(router *gin.RouterGroup, service *AuditService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewAuditHandler(service)

	audit := router.Group("/audit")
	audit.Use(authMiddleware)
	audit.Use(adminMiddleware) // Apenas admin pode ver audit log
	{
		audit.GET("/events", handler.QueryEvents)
		audit.GET("/events/:id", handler.GetEvent)
		audit.GET("/actors/:id/events", handler.GetActorEvents)
		audit.GET("/targets/:id/events", handler.GetTargetEvents)
		audit.GET("/chain/status", handler.GetChainStatus)
		audit.POST("/chain/verify", handler.VerifyChain)
		
		// Fase 16: Audit por Application
		audit.GET("/apps/:appId/events", handler.GetAppEvents)
		audit.GET("/apps/:appId/stats", handler.GetAppStats)
	}
}
