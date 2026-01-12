package apikey

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// APIKeyMiddleware middleware para autenticação via API key
func APIKeyMiddleware(service *APIKeyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Buscar API key no header
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			// Tentar Authorization: Bearer pqs_xxx
			auth := c.GetHeader("Authorization")
			if strings.HasPrefix(auth, "Bearer pqs_") {
				apiKey = strings.TrimPrefix(auth, "Bearer ")
			}
		}

		if apiKey == "" {
			c.Next() // Sem API key, deixa passar para outros middlewares
			return
		}

		// Validar API key
		key, err := service.ValidateKey(apiKey)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "API key inválida ou expirada",
				"code":  "INVALID_API_KEY",
			})
			c.Abort()
			return
		}

		// Setar contexto
		c.Set("api_key_id", key.ID)
		c.Set("app_id", key.AppID)
		c.Set("api_key_scopes", key.Scopes)
		c.Set("auth_type", "api_key")

		c.Next()

		// Registrar uso após a requisição
		duration := time.Since(start).Milliseconds()
		service.RecordUsage(
			key.ID,
			c.Request.URL.Path,
			c.Request.Method,
			c.ClientIP(),
			c.Request.UserAgent(),
			c.Writer.Status(),
			duration,
		)
	}
}

// RequireScope middleware que exige um scope específico
func RequireScope(scope APIKeyScope) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se autenticado via API key
		authType, exists := c.Get("auth_type")
		if !exists || authType != "api_key" {
			c.Next() // Não é API key, deixa passar
			return
		}

		// Verificar scope
		scopesStr, _ := c.Get("api_key_scopes")
		scopes, ok := scopesStr.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Scopes não encontrados",
				"code":  "MISSING_SCOPES",
			})
			c.Abort()
			return
		}

		// Admin tem acesso a tudo
		if strings.Contains(scopes, "admin") {
			c.Next()
			return
		}

		// Verificar scope específico
		if !strings.Contains(scopes, string(scope)) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":          "Scope insuficiente",
				"code":           "INSUFFICIENT_SCOPE",
				"required_scope": scope,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAPIKey middleware que exige autenticação via API key
func RequireAPIKey() gin.HandlerFunc {
	return func(c *gin.Context) {
		authType, exists := c.Get("auth_type")
		if !exists || authType != "api_key" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "API key obrigatória",
				"code":  "API_KEY_REQUIRED",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
