package auth

/*
================================================================================
LOGOUT HANDLER — REVOGAÇÃO DE SESSÃO
================================================================================

Endpoints para logout e revogação de tokens:
- POST /auth/logout - Logout da sessão atual
- POST /auth/logout-all - Logout de todas as sessões
- POST /auth/revoke - Revogação administrativa

"Sair é tão importante quanto entrar"

================================================================================
*/

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/internal/events"
	"prost-qs/backend/pkg/middleware"
	"prost-qs/backend/pkg/utils"
)

// LogoutHandler gerencia logout e revogação
type LogoutHandler struct{}

// NewLogoutHandler cria novo handler
func NewLogoutHandler() *LogoutHandler {
	return &LogoutHandler{}
}

// Logout revoga o token atual
// POST /api/v1/auth/logout
func (h *LogoutHandler) Logout(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	tokenID := c.GetString(middleware.ContextTokenIDKey)
	
	if userID == "" || tokenID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// Revogar token atual
	// Token expira em 24h por padrão, então mantemos na blacklist até lá
	expiresAt := time.Now().Add(24 * time.Hour)
	utils.RevokeToken(tokenID, userID, "user_logout", expiresAt)

	// Emitir evento de logout
	if uid, err := uuid.Parse(userID); err == nil {
		appIDStr := c.GetString(middleware.ContextAppIDKey)
		if appID, err := uuid.Parse(appIDStr); err == nil {
			events.EmitUserLogout(appID, uid, tokenID)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logout realizado com sucesso",
	})
}

// LogoutAll revoga todos os tokens do usuário
// POST /api/v1/auth/logout-all
func (h *LogoutHandler) LogoutAll(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	// Revogar todos os tokens do usuário
	count := utils.RevokeAllUserTokens(userID, "user_logout_all")

	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"message":         "Todas as sessões foram encerradas",
		"sessions_revoked": count,
	})
}

// RevokeUserTokens revoga tokens de um usuário específico (admin only)
// POST /api/v1/auth/revoke/:user_id
func (h *LogoutHandler) RevokeUserTokens(c *gin.Context) {
	targetUserID := c.Param("user_id")
	adminID := c.GetString(middleware.ContextUserIDKey)
	
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id é obrigatório"})
		return
	}

	// Revogar todos os tokens do usuário alvo
	count := utils.RevokeAllUserTokens(targetUserID, "admin_revoke:"+adminID)

	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"message":         "Tokens do usuário revogados",
		"user_id":         targetUserID,
		"sessions_revoked": count,
	})
}

// RegisterLogoutRoutes registra rotas de logout
func RegisterLogoutRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc, adminMiddleware gin.HandlerFunc) {
	handler := NewLogoutHandler()

	auth := router.Group("/auth")
	{
		// Rotas autenticadas
		auth.POST("/logout", authMiddleware, handler.Logout)
		auth.POST("/logout-all", authMiddleware, handler.LogoutAll)
		
		// Rotas admin
		auth.POST("/revoke/:user_id", authMiddleware, adminMiddleware, handler.RevokeUserTokens)
	}
}
