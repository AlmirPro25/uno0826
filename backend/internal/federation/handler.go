package federation

import (
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/pkg/utils"
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
// @Success 302 "Redirect to frontend with tokens"
// @Router /federation/google/callback [get]
func (h *FederationHandler) GoogleCallback(c *gin.Context) {
	stateStr := c.Query("state")
	code := c.Query("code")
	errorParam := c.Query("error")

	// URL do frontend para redirect
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "https://prostqs.com.br"
	}

	// Erro do Google
	if errorParam != "" {
		errorDesc := c.Query("error_description")
		redirectURL := fmt.Sprintf("%s/login?error=%s&description=%s",
			frontendURL,
			url.QueryEscape(errorParam),
			url.QueryEscape(errorDesc))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Parâmetros faltando
	if stateStr == "" || code == "" {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=missing_params")
		return
	}

	// State inválido
	stateID, err := uuid.Parse(stateStr)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=invalid_state")
		return
	}

	// Completar fluxo OAuth
	identity, fedIdentity, token, err := h.service.CompleteOAuthFlow(stateID, code)
	if err != nil {
		var errorCode string
		switch err {
		case ErrStateNotFound:
			errorCode = "state_not_found"
		case ErrStateExpired:
			errorCode = "state_expired"
		case ErrStateAlreadyUsed:
			errorCode = "state_already_used"
		default:
			errorCode = "oauth_failed"
		}
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error="+errorCode)
		return
	}

	// Gerar refresh token
	refreshToken, _ := utils.GenerateRefreshToken(identity.UserID.String(), "user", "active")

	// Redirecionar para frontend com tokens
	// O frontend vai processar esses tokens e fazer login
	redirectURL := fmt.Sprintf("%s/auth/callback?token=%s&refresh_token=%s&email=%s&name=%s&picture=%s",
		frontendURL,
		url.QueryEscape(token),
		url.QueryEscape(refreshToken),
		url.QueryEscape(fedIdentity.Email),
		url.QueryEscape(fedIdentity.Name),
		url.QueryEscape(fedIdentity.Picture))

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// MockGoogleCallback simula callback do Google para desenvolvimento
// PROTEGIDO: Só funciona em ambiente de desenvolvimento
func (h *FederationHandler) MockGoogleCallback(c *gin.Context) {
	// URL do frontend para redirect
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Bloquear em produção
	if os.Getenv("GIN_MODE") == "release" {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=mock_blocked_in_production")
		return
	}

	stateStr := c.Query("state")
	if stateStr == "" {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=missing_state")
		return
	}

	// Simula código de autorização
	mockCode := "mock_auth_code_" + stateStr

	stateID, err := uuid.Parse(stateStr)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=invalid_state")
		return
	}

	identity, fedIdentity, token, err := h.service.CompleteOAuthFlow(stateID, mockCode)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=oauth_failed")
		return
	}

	// Gerar refresh token
	refreshToken, _ := utils.GenerateRefreshToken(identity.UserID.String(), "user", "active")

	// Redirecionar para frontend com tokens
	redirectURL := fmt.Sprintf("%s/auth/callback?token=%s&refresh_token=%s&email=%s&name=%s&picture=%s",
		frontendURL,
		url.QueryEscape(token),
		url.QueryEscape(refreshToken),
		url.QueryEscape(fedIdentity.Email),
		url.QueryEscape(fedIdentity.Name),
		url.QueryEscape(fedIdentity.Picture))

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
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
