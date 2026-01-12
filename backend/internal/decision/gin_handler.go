package decision

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// DECISION GIN HANDLER
// "Toda decisão do sistema é registrada"
// ========================================

type GinHandler struct {
	service *Service
}

func NewGinHandler(service *Service) *GinHandler {
	return &GinHandler{service: service}
}

// RegisterDecisionRoutes registra as rotas de decisões
func RegisterDecisionRoutes(r *gin.RouterGroup, service *Service, authMiddleware gin.HandlerFunc, adminOnly gin.HandlerFunc) {
	handler := NewGinHandler(service)

	decisions := r.Group("/decisions")
	decisions.Use(authMiddleware)
	{
		decisions.GET("", handler.List)
		decisions.GET("/critical", handler.ListCritical)
		decisions.GET("/stats", handler.Stats)
		decisions.GET("/by-type/:type", handler.ListByType)
		decisions.GET("/by-user/:userID", handler.ListByUser)
	}

	// Admin routes
	adminDecisions := r.Group("/admin/decisions")
	adminDecisions.Use(authMiddleware, adminOnly)
	{
		adminDecisions.GET("/all", handler.ListAll)
		adminDecisions.GET("/recent", handler.ListRecent)
	}
}

// List retorna decisões do app atual
func (h *GinHandler) List(c *gin.Context) {
	// Tentar pegar app_id do contexto
	appIDStr := c.GetString("app_id")
	if appIDStr == "" {
		// Fallback: listar todas (para admin)
		h.ListAll(c)
		return
	}

	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	decisions, err := h.service.GetByApp(c.Request.Context(), appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar decisões"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": decisions,
		"meta": gin.H{
			"count": len(decisions),
			"limit": limit,
		},
	})
}

// ListAll retorna todas as decisões (admin)
func (h *GinHandler) ListAll(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	decisions, err := h.service.GetAll(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar decisões"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": decisions,
		"meta": gin.H{
			"count": len(decisions),
			"limit": limit,
		},
	})
}

// ListRecent retorna decisões recentes
func (h *GinHandler) ListRecent(c *gin.Context) {
	hours := 24
	if h := c.Query("hours"); h != "" {
		if parsed, err := strconv.Atoi(h); err == nil && parsed > 0 && parsed <= 168 {
			hours = parsed
		}
	}

	since := time.Now().Add(-time.Duration(hours) * time.Hour)

	decisions, err := h.service.GetRecent(c.Request.Context(), since, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar decisões"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": decisions,
		"meta": gin.H{
			"count": len(decisions),
			"hours": hours,
			"since": since,
		},
	})
}

// ListCritical retorna decisões críticas recentes
func (h *GinHandler) ListCritical(c *gin.Context) {
	hours := 24
	if h := c.Query("hours"); h != "" {
		if parsed, err := strconv.Atoi(h); err == nil && parsed > 0 && parsed <= 168 {
			hours = parsed
		}
	}

	since := time.Now().Add(-time.Duration(hours) * time.Hour)

	decisions, err := h.service.GetCritical(c.Request.Context(), since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar decisões críticas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": decisions,
		"meta": gin.H{
			"count": len(decisions),
			"since": since,
			"hours": hours,
		},
	})
}

// ListByType retorna decisões de um tipo específico
func (h *GinHandler) ListByType(c *gin.Context) {
	decisionType := c.Param("type")
	if decisionType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipo de decisão obrigatório"})
		return
	}

	// Tentar pegar app_id do contexto
	var appID *uuid.UUID
	if appIDStr := c.GetString("app_id"); appIDStr != "" {
		if id, err := uuid.Parse(appIDStr); err == nil {
			appID = &id
		}
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	var decisions []Decision
	var err error

	if appID != nil {
		decisions, err = h.service.GetByType(c.Request.Context(), *appID, decisionType, limit)
	} else {
		decisions, err = h.service.GetByTypeAll(c.Request.Context(), decisionType, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar decisões"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": decisions,
		"meta": gin.H{
			"count": len(decisions),
			"type":  decisionType,
		},
	})
}

// ListByUser retorna decisões de um usuário
func (h *GinHandler) ListByUser(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuário inválido"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	decisions, err := h.service.GetByUser(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar decisões"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": decisions,
		"meta": gin.H{
			"count":   len(decisions),
			"user_id": userID,
		},
	})
}

// Stats retorna estatísticas de decisões
func (h *GinHandler) Stats(c *gin.Context) {
	hours := 24
	if h := c.Query("hours"); h != "" {
		if parsed, err := strconv.Atoi(h); err == nil && parsed > 0 && parsed <= 168 {
			hours = parsed
		}
	}

	since := time.Now().Add(-time.Duration(hours) * time.Hour)

	// Tentar pegar app_id do contexto
	var appID *uuid.UUID
	if appIDStr := c.GetString("app_id"); appIDStr != "" {
		if id, err := uuid.Parse(appIDStr); err == nil {
			appID = &id
		}
	}

	var counts map[string]int64
	var err error

	if appID != nil {
		counts, err = h.service.CountByOutcome(c.Request.Context(), *appID, since)
	} else {
		counts, err = h.service.CountByOutcomeAll(c.Request.Context(), since)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	total := int64(0)
	for _, count := range counts {
		total += count
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"by_outcome": counts,
			"total":      total,
			"period": gin.H{
				"hours": hours,
				"since": since,
			},
		},
	})
}
