
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"prost-qs/backend/pkg/utils"
)

// Context keys para dados do usuário
const (
	ContextUserIDKey        = "userID"
	ContextUserRoleKey      = "userRole"
	ContextAccountStatusKey = "accountStatus"
	
	// Fase 16: App Context Keys
	ContextAppIDKey     = "appID"
	ContextAppUserIDKey = "appUserID"
	ContextSessionIDKey = "sessionID"
)

// AuthMiddleware verifica o token JWT e extrai user_id, role, account_status.
// FASE 10: Bloqueia usuários suspensos/banidos
// FASE 16: Extrai contexto de aplicação (app_id, app_user_id, session_id)
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autenticação não fornecido"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ParseJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido ou expirado"})
			c.Abort()
			return
		}

		// FASE 10: Bloquear usuários suspensos ou banidos
		if claims.AccountStatus == "suspended" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Conta suspensa",
				"message": "Sua conta está temporariamente suspensa. Entre em contato com o suporte.",
			})
			c.Abort()
			return
		}

		if claims.AccountStatus == "banned" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Conta banida",
				"message": "Sua conta foi permanentemente banida.",
			})
			c.Abort()
			return
		}

		// Armazena dados no contexto
		c.Set(ContextUserIDKey, claims.UserID)
		c.Set(ContextUserRoleKey, claims.Role)
		c.Set(ContextAccountStatusKey, claims.AccountStatus)

		// FASE 16: Extrair contexto de aplicação dos headers
		// Esses headers são enviados pelo SDK/cliente para identificar o app
		if appID := c.GetHeader("X-App-ID"); appID != "" {
			c.Set(ContextAppIDKey, appID)
		}
		if appUserID := c.GetHeader("X-App-User-ID"); appUserID != "" {
			c.Set(ContextAppUserIDKey, appUserID)
		}
		if sessionID := c.GetHeader("X-Session-ID"); sessionID != "" {
			c.Set(ContextSessionIDKey, sessionID)
		}

		c.Next()
	}
}

// RequireUser middleware que permite apenas usuários autenticados (qualquer role)
func RequireUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString(ContextUserIDKey)
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// RequireAdmin middleware que permite apenas admins e super_admins
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString(ContextUserRoleKey)
		if role != "admin" && role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Acesso negado",
				"message": "Esta ação requer privilégios de administrador.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// RequireSuperAdmin middleware que permite apenas super_admins
func RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString(ContextUserRoleKey)
		if role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Acesso negado",
				"message": "Esta ação requer privilégios de super administrador.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// AdminOnly é um alias para RequireAdmin (compatibilidade)
func AdminOnly() gin.HandlerFunc {
	return RequireAdmin()
}

