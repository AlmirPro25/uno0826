package federation

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// FEDERATION KERNEL - HTTP HANDLERS
// ========================================

// FederationHandler gerencia os endpoints de federation
type FederationHandler struct {
	service       *FederationService
	googleService *GoogleOAuthService
}

// NewFederationHandler cria um novo handler
func NewFederationHandler(service *FederationService, googleService *GoogleOAuthService) *FederationHandler {
	return &FederationHandler{
		service:       service,
		googleService: googleService,
	}
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

type StartOAuthRequest struct {
	Provider    string `json:"provider" binding:"required,oneof=google"`
	RedirectURI string `json:"redirect_uri"`
}

type StartOAuthResponse struct {
	AuthURL string `json:"auth_url"`
	StateID string `json:"state_id"`
}

type OAuthCallbackResponse struct {
	Success   bool   `json:"success"`
	UserID    string `json:"user_id"`
	Token     string `json:"token"`
	IsNewUser bool   `json:"is_new_user"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Picture   string `json:"picture"`
}

type LinkProviderRequest struct {
	Provider string `json:"provider" binding:"required"`
}

type LinkedProviderResponse struct {
	Provider   string `json:"provider"`
	ProviderID string `json:"provider_id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
	Picture    string `json:"picture"`
	LinkedAt   string `json:"linked_at"`
}

// ========================================
// OAUTH ENDPOINTS
// ========================================

// StartOAuth inicia o fluxo OAuth
// @Summary Inicia fluxo OAuth
// @Tags Federation
// @Accept json
// @Produce json
// @Param request body StartOAuthRequest true "Provider"
// @Success 200 {object} StartOAuthResponse
// @Router /federation/oauth/start [post]
func (h *FederationHandler) StartOAuth(c *gin.Context) {
	var req StartOAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user is already authenticated (linking flow)
	var userID *uuid.UUID
	if userIDStr := c.GetString("userID"); userIDStr != "" {
		if parsed, err := uuid.Parse(userIDStr); err == nil {
			userID = &parsed
		}
	}

	clientIP := c.ClientIP()

	state, authURL, err := h.service.StartOAuthFlow(req.Provider, req.RedirectURI, clientIP, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao iniciar OAuth"})
		return
	}

	c.JSON(http.StatusOK, StartOAuthResponse{
		AuthURL: authURL,
		StateID: state.StateID.String(),
	})
}

// GoogleCallback processa o callback do Google OAuth
// @Summary Callback do Google OAuth
// @Tags Federation
// @Produce json
// @Param state query string true "State ID"
// @Param code query string true "Authorization code"
// @Success 200 {object} OAuthCallbackResponse
// @Router /federation/google/callback [get]
func (h *FederationHandler) GoogleCallback(c *gin.Context) {
	stateStr := c.Query("state")
	code := c.Query("code")
	errorParam := c.Query("error")

	if errorParam != "" {
		errorDesc := c.Query("error_description")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":       errorParam,
			"description": errorDesc,
		})
		return
	}

	if stateStr == "" || code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing state or code"})
		return
	}

	stateID, err := uuid.Parse(stateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state"})
		return
	}

	identity, fedIdentity, token, err := h.service.CompleteOAuthFlow(stateID, code)
	if err != nil {
		switch err {
		case ErrStateNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "State não encontrado"})
		case ErrStateExpired:
			c.JSON(http.StatusGone, gin.H{"error": "State expirado"})
		case ErrStateAlreadyUsed:
			c.JSON(http.StatusConflict, gin.H{"error": "State já utilizado"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha no OAuth"})
		}
		return
	}

	c.JSON(http.StatusOK, OAuthCallbackResponse{
		Success:   true,
		UserID:    identity.UserID.String(),
		Token:     token,
		IsNewUser: identity.Source == "oauth_google",
		Email:     fedIdentity.Email,
		Name:      fedIdentity.Name,
		Picture:   fedIdentity.Picture,
	})
}

// MockGoogleCallback simula callback do Google para desenvolvimento
func (h *FederationHandler) MockGoogleCallback(c *gin.Context) {
	stateStr := c.Query("state")
	if stateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing state"})
		return
	}

	// Simula código de autorização
	mockCode := "mock_auth_code_" + stateStr

	stateID, err := uuid.Parse(stateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state"})
		return
	}

	identity, fedIdentity, token, err := h.service.CompleteOAuthFlow(stateID, mockCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, OAuthCallbackResponse{
		Success:   true,
		UserID:    identity.UserID.String(),
		Token:     token,
		IsNewUser: true,
		Email:     fedIdentity.Email,
		Name:      fedIdentity.Name,
		Picture:   fedIdentity.Picture,
	})
}

// ========================================
// LINKING ENDPOINTS
// ========================================

// GetLinkedProviders lista providers linkados
// @Summary Lista providers linkados
// @Tags Federation
// @Produce json
// @Success 200 {array} LinkedProviderResponse
// @Router /federation/providers [get]
func (h *FederationHandler) GetLinkedProviders(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	links, err := h.service.GetLinkedProviders(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar providers"})
		return
	}

	response := make([]LinkedProviderResponse, len(links))
	for i, link := range links {
		response[i] = LinkedProviderResponse{
			Provider:   link.Provider,
			ProviderID: link.ProviderID,
			Email:      link.Email,
			Name:       link.Name,
			Picture:    link.Picture,
			LinkedAt:   link.LinkedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	c.JSON(http.StatusOK, response)
}

// UnlinkProvider remove um provider
// @Summary Remove provider linkado
// @Tags Federation
// @Param provider path string true "Provider name"
// @Success 200 {object} map[string]string
// @Router /federation/providers/{provider} [delete]
func (h *FederationHandler) UnlinkProvider(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	provider := c.Param("provider")
	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Provider não especificado"})
		return
	}

	if err := h.service.UnlinkProvider(userID, provider); err != nil {
		if err == ErrCannotUnlink {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível remover o único método de autenticação"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover provider"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Provider removido com sucesso"})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterFederationRoutes registra as rotas de federation
func RegisterFederationRoutes(router *gin.RouterGroup, service *FederationService, googleService *GoogleOAuthService, authMiddleware gin.HandlerFunc) {
	handler := NewFederationHandler(service, googleService)

	federation := router.Group("/federation")
	{
		// OAuth flow (público)
		federation.POST("/oauth/start", handler.StartOAuth)
		federation.GET("/google/callback", handler.GoogleCallback)
		federation.GET("/google/mock", handler.MockGoogleCallback) // Dev only

		// Provider management (autenticado)
		federation.GET("/providers", authMiddleware, handler.GetLinkedProviders)
		federation.DELETE("/providers/:provider", authMiddleware, handler.UnlinkProvider)
	}
}
