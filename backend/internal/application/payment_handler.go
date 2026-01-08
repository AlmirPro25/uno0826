package application

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// PAYMENT PROVIDER HANDLER
// ========================================

type PaymentProviderHandler struct {
	service    *PaymentProviderService
	appService *ApplicationService
}

func NewPaymentProviderHandler(service *PaymentProviderService, appService *ApplicationService) *PaymentProviderHandler {
	return &PaymentProviderHandler{
		service:    service,
		appService: appService,
	}
}

// ConnectStripe conecta Stripe ao app
// POST /api/v1/apps/:id/payment-provider/stripe
func (h *PaymentProviderHandler) ConnectStripe(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	// Verificar se usuário é dono do app
	ownerID := c.GetString("userID")
	app, err := h.appService.GetApplication(appID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "App não encontrado"})
		return
	}
	if app.OwnerID.String() != ownerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não é dono deste app"})
		return
	}

	var req struct {
		SecretKey      string `json:"secret_key" binding:"required"`
		PublishableKey string `json:"publishable_key" binding:"required"`
		WebhookSecret  string `json:"webhook_secret"`
		Environment    string `json:"environment"` // test ou live
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Environment == "" {
		req.Environment = "test"
	}

	provider, err := h.service.ConnectStripe(appID, req.SecretKey, req.PublishableKey, req.WebhookSecret, req.Environment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Stripe conectado com sucesso",
		"provider": provider,
	})
}

// GetPaymentProvider retorna o provider de um app
// GET /api/v1/apps/:id/payment-provider
func (h *PaymentProviderHandler) GetPaymentProvider(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	// Verificar se usuário é dono do app
	ownerID := c.GetString("userID")
	app, err := h.appService.GetApplication(appID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "App não encontrado"})
		return
	}
	if app.OwnerID.String() != ownerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não é dono deste app"})
		return
	}

	providers, err := h.service.ListProviders(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"providers": providers})
}

// RevokePaymentProvider revoga um provider
// DELETE /api/v1/apps/:id/payment-provider/:provider
func (h *PaymentProviderHandler) RevokePaymentProvider(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}

	provider := c.Param("provider")
	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Provider não especificado"})
		return
	}

	// Verificar se usuário é dono do app
	ownerID := c.GetString("userID")
	app, err := h.appService.GetApplication(appID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "App não encontrado"})
		return
	}
	if app.OwnerID.String() != ownerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não é dono deste app"})
		return
	}

	if err := h.service.RevokeProvider(appID, provider); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Provider revogado"})
}

// RegisterPaymentProviderRoutes registra as rotas
func RegisterPaymentProviderRoutes(router *gin.RouterGroup, service *PaymentProviderService, appService *ApplicationService, authMiddleware gin.HandlerFunc) {
	handler := NewPaymentProviderHandler(service, appService)

	apps := router.Group("/apps")
	apps.Use(authMiddleware)
	{
		apps.POST("/:id/payment-provider/stripe", handler.ConnectStripe)
		apps.GET("/:id/payment-provider", handler.GetPaymentProvider)
		apps.DELETE("/:id/payment-provider/:provider", handler.RevokePaymentProvider)
	}
}
