package events

/*
================================================================================
EVENT HANDLER — API REST para Eventos do Sistema
================================================================================

Endpoints para consultar eventos emitidos pelo sistema.
Útil para debugging, auditoria e integração com dashboards.

"Eventos são fatos. Fatos não mentem."

================================================================================
*/

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// EventHandler handlers HTTP para eventos
type EventHandler struct {
	service *EventService
}

// NewEventHandler cria novo handler
func NewEventHandler(service *EventService) *EventHandler {
	return &EventHandler{service: service}
}

// GetAppEvents retorna eventos de um app
// GET /events/app/:app_id
func (h *EventHandler) GetAppEvents(c *gin.Context) {
	appIDStr := c.Param("app_id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	events, err := h.service.GetRecentEvents(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar eventos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"count":  len(events),
		"app_id": appID,
	})
}

// GetUserEvents retorna eventos de um usuário
// GET /events/user/:user_id
func (h *EventHandler) GetUserEvents(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id inválido"})
		return
	}

	// Verificar permissão (Admin ou Próprio Usuário)
	authUserID := c.GetString("userID")
	authRole := c.GetString("role")
	if authRole != "admin" && authRole != "super_admin" && authUserID != userID.String() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão para visualizar eventos deste usuário"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	events, err := h.service.GetUserEvents(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar eventos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events":  events,
		"count":   len(events),
		"user_id": userID,
	})
}

// GetEventTypes retorna tipos de eventos disponíveis
// GET /events/types
func (h *EventHandler) GetEventTypes(c *gin.Context) {
	types := []map[string]string{
		{"type": string(EventUserCreated), "category": "user", "description": "Usuário criado"},
		{"type": string(EventUserUpdated), "category": "user", "description": "Usuário atualizado"},
		{"type": string(EventUserDeleted), "category": "user", "description": "Usuário deletado"},
		{"type": string(EventUserLogin), "category": "user", "description": "Login realizado"},
		{"type": string(EventUserLogout), "category": "user", "description": "Logout realizado"},
		{"type": string(EventUserMFAEnabled), "category": "user", "description": "MFA habilitado"},
		{"type": string(EventUserMFADisabled), "category": "user", "description": "MFA desabilitado"},
		{"type": string(EventSessionCreated), "category": "session", "description": "Sessão criada"},
		{"type": string(EventSessionRevoked), "category": "session", "description": "Sessão revogada"},
		{"type": string(EventSessionExpired), "category": "session", "description": "Sessão expirada"},
		{"type": string(EventSubscriptionCreated), "category": "billing", "description": "Assinatura criada"},
		{"type": string(EventSubscriptionUpdated), "category": "billing", "description": "Assinatura atualizada"},
		{"type": string(EventSubscriptionCanceled), "category": "billing", "description": "Assinatura cancelada"},
		{"type": string(EventPaymentSucceeded), "category": "billing", "description": "Pagamento bem-sucedido"},
		{"type": string(EventPaymentFailed), "category": "billing", "description": "Pagamento falhou"},
		{"type": string(EventAppMembershipCreated), "category": "app", "description": "Vínculo com app criado"},
		{"type": string(EventAppMembershipRemoved), "category": "app", "description": "Vínculo com app removido"},
		{"type": string(EventAlertTriggered), "category": "system", "description": "Alerta disparado"},
		{"type": string(EventIncidentCreated), "category": "system", "description": "Incidente criado"},
	}

	c.JSON(http.StatusOK, gin.H{
		"types": types,
		"count": len(types),
	})
}

// GetEventStats retorna estatísticas de eventos
// GET /events/stats/:app_id
func (h *EventHandler) GetEventStats(c *gin.Context) {
	appIDStr := c.Param("app_id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	stats, err := h.service.GetEventStats(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// RegisterEventSystemRoutes registra rotas do sistema de eventos
func RegisterEventSystemRoutes(r *gin.RouterGroup, service *EventService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewEventHandler(service)
	statsService := NewEventStatsService(service.db)

	events := r.Group("/events")
	events.Use(authMiddleware)
	{
		// Rotas públicas (autenticado)
		events.GET("/types", handler.GetEventTypes)
		events.GET("/user/:user_id", handler.GetUserEvents)

		// GET /events - Lista eventos recentes (para o frontend-old/admin)
		events.GET("", func(c *gin.Context) {
			limit := 50
			if l := c.Query("limit"); l != "" {
				if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
					limit = parsed
				}
			}

			// Buscar eventos recentes do sistema
			recentEvents, err := statsService.GetRecentSystemEvents(limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar eventos"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"events": recentEvents,
				"count":  len(recentEvents),
			})
		})

		// GET /events/stats - Estatísticas gerais
		events.GET("/stats", func(c *gin.Context) {
			stats, err := statsService.GetSystemStats()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, stats)
		})

		// Rotas admin
		admin := events.Group("")
		admin.Use(adminMiddleware)
		{
			admin.GET("/app/:app_id", handler.GetAppEvents)
			admin.GET("/stats/:app_id", handler.GetEventStats)

			// Estatísticas do sistema
			admin.GET("/system/stats", func(c *gin.Context) {
				stats, err := statsService.GetSystemStats()
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, stats)
			})

			// Estatísticas em tempo real
			admin.GET("/system/realtime", func(c *gin.Context) {
				stats, err := statsService.GetRealtimeStats()
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, stats)
			})
		}
	}
}
