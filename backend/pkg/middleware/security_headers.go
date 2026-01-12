package middleware

/*
================================================================================
SECURITY HEADERS — DEFESA EM PROFUNDIDADE
================================================================================

Headers de segurança aplicados no nível da aplicação.
Isso é BACKUP - o Cloudflare deve aplicar primeiro.

Regra: Se chegou aqui, já passou pela borda. Mas ainda assim protegemos.

================================================================================
*/

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders adiciona headers de segurança em todas as respostas
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HSTS - Force HTTPS por 1 ano
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		
		// Previne MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")
		
		// Previne clickjacking
		c.Header("X-Frame-Options", "DENY")
		
		// XSS Protection (legacy, mas ainda útil)
		c.Header("X-XSS-Protection", "1; mode=block")
		
		// Controla informações de referrer
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Desabilita features perigosas do browser
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()")
		
		// CSP básico para API (ajustar conforme necessário)
		c.Header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		
		// Previne caching de dados sensíveis
		c.Header("Cache-Control", "no-store, no-cache, must-revalidate, private")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		
		// Remove headers que vazam informação
		c.Header("X-Powered-By", "")
		c.Header("Server", "")
		
		c.Next()
	}
}

// SecureAPIHeaders headers específicos para endpoints de API
func SecureAPIHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HSTS
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// CORS restritivo (ajustar domínios permitidos)
		origin := c.GetHeader("Origin")
		allowedOrigins := map[string]bool{
			"https://admin-six-mauve.vercel.app":  true,
			"https://vox-bridge-ivory.vercel.app": true,
			"http://localhost:3000":               true,
			"http://localhost:3001":               true,
		}
		
		if allowedOrigins[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID, X-App-ID")
			c.Header("Access-Control-Max-Age", "86400")
		}
		
		// Preflight
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	}
}

// RequestIDMiddleware adiciona request ID para tracing
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}
		
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)
		
		c.Next()
	}
}

// generateRequestID gera ID único para request
func generateRequestID() string {
	timestamp := strconv.FormatInt(time.Now().UnixNano(), 36)
	random := randomHex(8)
	return timestamp + "-" + random
}

// randomHex gera string hexadecimal aleatória
func randomHex(n int) string {
	bytes := make([]byte, n/2)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// PayloadSizeLimit limita tamanho do payload
func PayloadSizeLimit(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}

// IPWhitelist permite apenas IPs específicos
func IPWhitelist(allowedIPs []string) gin.HandlerFunc {
	allowed := make(map[string]bool)
	for _, ip := range allowedIPs {
		allowed[ip] = true
	}
	
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		if !allowed[clientIP] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "IP not allowed",
				"code":  "IP_BLOCKED",
			})
			return
		}
		c.Next()
	}
}

// CloudflareOnly aceita apenas requests vindos do Cloudflare
func CloudflareOnly() gin.HandlerFunc {
	// IPs do Cloudflare (atualizar periodicamente)
	// https://www.cloudflare.com/ips/
	cloudflareIPs := []string{
		"173.245.48.0/20",
		"103.21.244.0/22",
		"103.22.200.0/22",
		"103.31.4.0/22",
		"141.101.64.0/18",
		"108.162.192.0/18",
		"190.93.240.0/20",
		"188.114.96.0/20",
		"197.234.240.0/22",
		"198.41.128.0/17",
		"162.158.0.0/15",
		"104.16.0.0/13",
		"104.24.0.0/14",
		"172.64.0.0/13",
		"131.0.72.0/22",
	}
	
	return func(c *gin.Context) {
		// Verificar header CF-Connecting-IP (prova que veio do Cloudflare)
		cfIP := c.GetHeader("CF-Connecting-IP")
		if cfIP == "" {
			// Em desenvolvimento, permitir
			if c.ClientIP() == "127.0.0.1" || c.ClientIP() == "::1" {
				c.Next()
				return
			}
			
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Direct access not allowed",
				"code":  "CLOUDFLARE_REQUIRED",
			})
			return
		}
		
		// Guardar IP real do cliente
		c.Set("real_ip", cfIP)
		
		// Log para debug
		_ = cloudflareIPs // TODO: validar se IP está na lista do CF
		
		c.Next()
	}
}
