package webhook

/*
================================================================================
WEBHOOK HANDLER — REST API para Gerenciamento de Webhooks
================================================================================

Endpoints:
- POST   /webhooks              - Criar endpoint
- GET    /webhooks              - Listar endpoints do app
- GET    /webhooks/:id          - Buscar endpoint
- PUT    /webhooks/:id          - Atualizar endpoint
- DELETE /webhooks/:id          - Remover endpoint
- POST   /webhooks/:id/test     - Testar endpoint
- POST   /webhooks/:id/rotate   - Rotacionar secret
- POST   /webhooks/:id/enable   - Habilitar endpoint
- POST   /webhooks/:id/disable  - Desabilitar endpoint
- GET    /webhooks/:id/deliveries - Histórico de entregas
- GET    /webhooks/:id/stats    - Estatísticas

================================================================================
*/

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// WebhookHandler handler HTTP
type WebhookHandler struct {
	service *WebhookService
}

// NewWebhookHandler cria novo handler
func NewWebhookHandler(service *WebhookService) *WebhookHandler {
	return &WebhookHandler{service: service}
}

// CreateEndpointRequest request para criar endpoint
type CreateEndpointRequest struct {
	URL         string             `json:"url" binding:"required,url"`
	Events      []WebhookEventType `json:"events" binding:"required,min=1"`
	Description string             `json:"description"`
}

// UpdateEndpointRequest request para atualizar endpoint
type UpdateEndpointRequest struct {
	URL         string             `json:"url" binding:"required,url"`
	Events      []WebhookEventType `json:"events" binding:"required,min=1"`
	Description string             `json:"description"`
}

// CreateEndpoint cria um novo endpoint de webhook
func (h *WebhookHandler) CreateEndpoint(c *gin.Context) {
	appID, err := getAppIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	var req CreateEndpointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	endpoint, secret, err := h.service.CreateEndpoint(appID, req.URL, req.Events, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"endpoint": endpoint,
		"secret":   secret,
		"warning":  "Guarde o secret! Ele não será mostrado novamente.",
	})
}

// ListEndpoints lista endpoints do app
func (h *WebhookHandler) ListEndpoints(c *gin.Context) {
	appID, err := getAppIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
		return
	}

	endpoints, err := h.service.ListEndpoints(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"endpoints": endpoints,
		"count":     len(endpoints),
	})
}

// GetEndpoint busca endpoint por ID
func (h *WebhookHandler) GetEndpoint(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	endpoint, err := h.service.GetEndpoint(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint não encontrado"})
		return
	}

	c.JSON(http.StatusOK, endpoint)
}

// UpdateEndpoint atualiza um endpoint
func (h *WebhookHandler) UpdateEndpoint(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req UpdateEndpointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	endpoint, err := h.service.UpdateEndpoint(id, req.URL, req.Events, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, endpoint)
}

// DeleteEndpoint remove um endpoint
func (h *WebhookHandler) DeleteEndpoint(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DeleteEndpoint(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Endpoint removido"})
}

// TestEndpoint envia webhook de teste
func (h *WebhookHandler) TestEndpoint(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	delivery, err := h.service.TestEndpoint(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"delivery": delivery,
		"success":  delivery.Success,
	})
}

// RotateSecret gera novo secret
func (h *WebhookHandler) RotateSecret(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	newSecret, err := h.service.RotateSecret(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"secret":  newSecret,
		"warning": "Guarde o novo secret! Ele não será mostrado novamente.",
	})
}

// EnableEndpoint habilita um endpoint
func (h *WebhookHandler) EnableEndpoint(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.EnableEndpoint(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Endpoint habilitado"})
}

// DisableEndpoint desabilita um endpoint
func (h *WebhookHandler) DisableEndpoint(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DisableEndpoint(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Endpoint desabilitado"})
}

// GetDeliveries retorna histórico de entregas
func (h *WebhookHandler) GetDeliveries(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	deliveries, err := h.service.GetDeliveries(id, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"deliveries": deliveries,
		"count":      len(deliveries),
	})
}

// GetStats retorna estatísticas do endpoint
func (h *WebhookHandler) GetStats(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	stats, err := h.service.GetEndpointStats(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetEventTypes retorna tipos de eventos disponíveis
func (h *WebhookHandler) GetEventTypes(c *gin.Context) {
	events := []map[string]string{
		{"type": string(EventUserCreated), "description": "Usuário criado"},
		{"type": string(EventUserUpdated), "description": "Usuário atualizado"},
		{"type": string(EventUserDeleted), "description": "Usuário removido"},
		{"type": string(EventUserLogin), "description": "Usuário fez login"},
		{"type": string(EventUserLogout), "description": "Usuário fez logout"},
		{"type": string(EventSubscriptionCreated), "description": "Assinatura criada"},
		{"type": string(EventSubscriptionUpdated), "description": "Assinatura atualizada"},
		{"type": string(EventSubscriptionCanceled), "description": "Assinatura cancelada"},
		{"type": string(EventPaymentSucceeded), "description": "Pagamento aprovado"},
		{"type": string(EventPaymentFailed), "description": "Pagamento falhou"},
		{"type": string(EventAppMembershipCreated), "description": "Usuário vinculado ao app"},
		{"type": string(EventAppMembershipRemoved), "description": "Usuário desvinculado do app"},
		{"type": string(EventAlertTriggered), "description": "Alerta disparado"},
		{"type": string(EventIncidentCreated), "description": "Incidente criado"},
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"count":  len(events),
	})
}

// RegisterWebhookRoutes registra rotas de webhook
func RegisterWebhookRoutes(r *gin.RouterGroup, service *WebhookService, authMiddleware, adminOnly gin.HandlerFunc) {
	handler := NewWebhookHandler(service)
	statsService := NewWebhookStatsService(service.db)

	webhooks := r.Group("/webhooks")
	webhooks.Use(authMiddleware)
	{
		// Tipos de eventos (público para autenticados)
		webhooks.GET("/events", handler.GetEventTypes)

		// CRUD de endpoints (requer admin)
		webhooks.POST("", adminOnly, handler.CreateEndpoint)
		webhooks.GET("", handler.ListEndpoints)
		webhooks.GET("/:id", handler.GetEndpoint)
		webhooks.PUT("/:id", adminOnly, handler.UpdateEndpoint)
		webhooks.DELETE("/:id", adminOnly, handler.DeleteEndpoint)

		// Ações em endpoints
		webhooks.POST("/:id/test", adminOnly, handler.TestEndpoint)
		webhooks.POST("/:id/rotate", adminOnly, handler.RotateSecret)
		webhooks.POST("/:id/enable", adminOnly, handler.EnableEndpoint)
		webhooks.POST("/:id/disable", adminOnly, handler.DisableEndpoint)

		// Histórico e estatísticas
		webhooks.GET("/:id/deliveries", handler.GetDeliveries)
		webhooks.GET("/:id/stats", handler.GetStats)

		// Estatísticas do sistema (admin)
		webhooks.GET("/system/stats", adminOnly, func(c *gin.Context) {
			stats, err := statsService.GetSystemStats()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, stats)
		})

		// Estatísticas de um app
		webhooks.GET("/app/:app_id/stats", adminOnly, func(c *gin.Context) {
			appID, err := uuid.Parse(c.Param("app_id"))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "app_id inválido"})
				return
			}
			stats, err := statsService.GetAppStats(appID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, stats)
		})

		// Saúde de um endpoint
		webhooks.GET("/:id/health", adminOnly, func(c *gin.Context) {
			endpointID, err := uuid.Parse(c.Param("id"))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
				return
			}
			health, err := statsService.GetEndpointHealth(endpointID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, health)
		})
	}
}

// Helper para extrair app_id do contexto
func getAppIDFromContext(c *gin.Context) (uuid.UUID, error) {
	// Primeiro tenta do query param
	if appIDStr := c.Query("app_id"); appIDStr != "" {
		return uuid.Parse(appIDStr)
	}

	// Depois tenta do contexto (set pelo middleware)
	if appID, exists := c.Get("appID"); exists {
		if id, ok := appID.(uuid.UUID); ok {
			return id, nil
		}
		if idStr, ok := appID.(string); ok {
			return uuid.Parse(idStr)
		}
	}

	// Fallback: usa o userID como appID (para admin global)
	if userID, exists := c.Get("userID"); exists {
		if id, ok := userID.(uuid.UUID); ok {
			return id, nil
		}
		if idStr, ok := userID.(string); ok {
			return uuid.Parse(idStr)
		}
	}

	return uuid.Nil, nil
}
