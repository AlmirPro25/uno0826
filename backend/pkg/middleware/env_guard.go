package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// DevOnlyGuard bloqueia acesso em produção
// Rotas protegidas por este middleware só funcionam quando GIN_MODE != "release"
func DevOnlyGuard() gin.HandlerFunc {
	return func(c *gin.Context) {
		ginMode := os.Getenv("GIN_MODE")
		
		// Em produção (release), bloqueia
		if ginMode == "release" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Endpoint não disponível em produção",
				"code":    "PROD_BLOCKED",
				"message": "Este endpoint só está disponível em ambiente de desenvolvimento",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// DebugModeGuard permite acesso apenas quando DEBUG_MODE=true
// Mais restritivo que DevOnlyGuard - requer flag explícita
func DebugModeGuard() gin.HandlerFunc {
	return func(c *gin.Context) {
		debugMode := os.Getenv("DEBUG_MODE")
		
		if debugMode != "true" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Debug mode não habilitado",
				"code":    "DEBUG_DISABLED",
				"message": "Defina DEBUG_MODE=true para acessar este endpoint",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// AdminOnlyGuard requer role admin ou super_admin
func AdminOnlyGuard() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("userRole")
		
		if role != "admin" && role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Acesso negado",
				"code":    "ADMIN_REQUIRED",
				"message": "Este endpoint requer privilégios de administrador",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// SuperAdminOnlyGuard requer role super_admin
func SuperAdminOnlyGuard() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("userRole")
		
		if role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Acesso negado",
				"code":    "SUPER_ADMIN_REQUIRED",
				"message": "Este endpoint requer privilégios de super administrador",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// IsProduction retorna true se estiver em ambiente de produção
func IsProduction() bool {
	return os.Getenv("GIN_MODE") == "release"
}

// IsDevelopment retorna true se estiver em ambiente de desenvolvimento
func IsDevelopment() bool {
	return os.Getenv("GIN_MODE") != "release"
}

// IsDebugEnabled retorna true se DEBUG_MODE=true
func IsDebugEnabled() bool {
	return os.Getenv("DEBUG_MODE") == "true"
}
