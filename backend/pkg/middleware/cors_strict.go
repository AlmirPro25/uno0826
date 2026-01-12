package middleware

/*
================================================================================
CORS ESTRITO — CONTROLE DE ORIGEM RIGOROSO
================================================================================

CORS configurável via variável de ambiente ALLOWED_ORIGINS.
Em produção, NUNCA usar wildcards.

"Só quem está na lista entra"

================================================================================
*/

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// CORSConfig configuração de CORS
type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	ExposedHeaders   []string
	AllowCredentials bool
	MaxAge           time.Duration
}

// DefaultCORSConfig configuração padrão restritiva
func DefaultCORSConfig() CORSConfig {
	return CORSConfig{
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Authorization", "Accept", "X-Request-ID", "X-App-ID"},
		ExposedHeaders:   []string{"Content-Length", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
}

// LoadAllowedOrigins carrega origens permitidas do ambiente
func LoadAllowedOrigins() []string {
	envOrigins := os.Getenv("ALLOWED_ORIGINS")
	if envOrigins == "" {
		// Fallback para desenvolvimento
		if os.Getenv("GIN_MODE") != "release" {
			return []string{
				"http://localhost:3000",
				"http://localhost:3001",
				"http://127.0.0.1:3000",
			}
		}
		// Em produção sem config, bloquear tudo
		return []string{}
	}

	origins := strings.Split(envOrigins, ",")
	cleaned := make([]string, 0, len(origins))
	for _, origin := range origins {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			cleaned = append(cleaned, origin)
		}
	}
	return cleaned
}

// isOriginAllowed verifica se origem é permitida
func isOriginAllowed(origin string, allowedOrigins []string) bool {
	if origin == "" {
		return false
	}

	for _, allowed := range allowedOrigins {
		// Match exato
		if origin == allowed {
			return true
		}
		
		// Match de subdomínio (ex: *.vercel.app)
		if strings.HasPrefix(allowed, "*.") {
			suffix := allowed[1:] // Remove o *
			if strings.HasSuffix(origin, suffix) {
				// Verificar que é realmente um subdomínio
				prefix := strings.TrimSuffix(origin, suffix)
				if strings.HasPrefix(prefix, "https://") || strings.HasPrefix(prefix, "http://") {
					return true
				}
			}
		}
	}

	return false
}

// StrictCORSMiddleware middleware de CORS estrito
func StrictCORSMiddleware() gin.HandlerFunc {
	config := DefaultCORSConfig()
	config.AllowedOrigins = LoadAllowedOrigins()

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// Verificar se origem é permitida
		if !isOriginAllowed(origin, config.AllowedOrigins) {
			// Para preflight, retornar 403
			if c.Request.Method == "OPTIONS" {
				c.AbortWithStatus(http.StatusForbidden)
				return
			}
			// Para requests normais, não adicionar headers CORS
			// O browser vai bloquear a resposta
			c.Next()
			return
		}

		// Adicionar headers CORS
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Methods", strings.Join(config.AllowedMethods, ", "))
		c.Header("Access-Control-Allow-Headers", strings.Join(config.AllowedHeaders, ", "))
		c.Header("Access-Control-Expose-Headers", strings.Join(config.ExposedHeaders, ", "))
		c.Header("Access-Control-Max-Age", "43200") // 12 horas

		// Preflight
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// ProductionCORSMiddleware CORS para produção com origens específicas
func ProductionCORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	config := DefaultCORSConfig()
	config.AllowedOrigins = allowedOrigins

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		if !isOriginAllowed(origin, config.AllowedOrigins) {
			if c.Request.Method == "OPTIONS" {
				c.AbortWithStatus(http.StatusForbidden)
				return
			}
			c.Next()
			return
		}

		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Methods", strings.Join(config.AllowedMethods, ", "))
		c.Header("Access-Control-Allow-Headers", strings.Join(config.AllowedHeaders, ", "))
		c.Header("Access-Control-Expose-Headers", strings.Join(config.ExposedHeaders, ", "))
		c.Header("Access-Control-Max-Age", "43200")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
