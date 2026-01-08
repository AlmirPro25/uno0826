
package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter armazena as requisições por IP.
type RateLimiter struct {
	mu        sync.Mutex
	clients   map[string]*ClientRate
	rate      int           // Número máximo de requisições
	window    time.Duration // Período de tempo
}

// ClientRate armazena o estado de requisições de um cliente.
type ClientRate struct {
	Count      int
	LastAccess time.Time
}

// NewRateLimiter cria um novo RateLimiter.
func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		clients: make(map[string]*ClientRate),
		rate:    rate,
		window:  window,
	}
}

// Allow verifica se uma requisição é permitida.
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	client, exists := rl.clients[ip]
	now := time.Now()

	if !exists || now.Sub(client.LastAccess) > rl.window {
		rl.clients[ip] = &ClientRate{
			Count:      1,
			LastAccess: now,
		}
		return true
	}

	if client.Count < rl.rate {
		client.Count++
		client.LastAccess = now
		return true
	}

	return false
}

// RateLimitMiddleware é o middleware de rate limiting do Gin.
func RateLimitMiddleware(rate int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(rate, window)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		if !limiter.Allow(clientIP) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Muitas requisições. Tente novamente mais tarde."})
			c.Abort()
			return
		}
		c.Next()
	}
}

