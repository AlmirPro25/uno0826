package middleware

/*
================================================================================
RATE LIMITING AVANÇADO — PROTEÇÃO POR ENDPOINT
================================================================================

Rate limits específicos para endpoints sensíveis:
- Auth/OTP: 5 req/min (previne brute force de OTP)
- Login: 10 req/5min (previne credential stuffing)
- API geral: 100 req/min
- Admin: 30 req/min

"Cada porta tem sua própria fechadura"

================================================================================
*/

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimitConfig configuração de rate limit
type RateLimitConfig struct {
	Rate     int           // Número máximo de requisições
	Window   time.Duration // Período de tempo
	ByUserID bool          // Se true, limita por userID em vez de IP
}

// EndpointRateLimits limites por padrão de endpoint
var EndpointRateLimits = map[string]RateLimitConfig{
	// Autenticação - MUITO restritivo
	"/api/v1/auth/phone/request": {Rate: 5, Window: time.Minute},      // 5 OTPs por minuto
	"/api/v1/auth/phone/verify":  {Rate: 10, Window: time.Minute},     // 10 tentativas por minuto
	"/api/v1/auth/login":         {Rate: 10, Window: 5 * time.Minute}, // 10 logins por 5 min
	"/api/v1/auth/register":      {Rate: 5, Window: time.Minute},      // 5 registros por minuto
	"/api/v1/auth/complete-signup": {Rate: 5, Window: time.Minute},

	// Admin - restritivo
	"/api/v1/admin": {Rate: 30, Window: time.Minute},

	// Billing - moderado
	"/api/v1/billing": {Rate: 20, Window: time.Minute},

	// Secrets - muito restritivo
	"/api/v1/secrets": {Rate: 10, Window: time.Minute},

	// Kill Switch - extremamente restritivo
	"/api/v1/killswitch": {Rate: 5, Window: time.Minute},
}

// AdvancedRateLimiter rate limiter com suporte a múltiplos buckets
type AdvancedRateLimiter struct {
	mu       sync.RWMutex
	buckets  map[string]*RateBucket
	defaults RateLimitConfig
}

// RateBucket bucket de rate limit
type RateBucket struct {
	mu         sync.Mutex
	clients    map[string]*ClientRateAdvanced
	config     RateLimitConfig
	lastClean  time.Time
}

// ClientRateAdvanced estado de rate limit de um cliente
type ClientRateAdvanced struct {
	Count      int
	WindowStart time.Time
	Blocked    bool
	BlockedAt  time.Time
}

// NewAdvancedRateLimiter cria novo rate limiter avançado
func NewAdvancedRateLimiter(defaultRate int, defaultWindow time.Duration) *AdvancedRateLimiter {
	arl := &AdvancedRateLimiter{
		buckets: make(map[string]*RateBucket),
		defaults: RateLimitConfig{
			Rate:   defaultRate,
			Window: defaultWindow,
		},
	}

	// Inicializar buckets para endpoints conhecidos
	for pattern, config := range EndpointRateLimits {
		arl.buckets[pattern] = &RateBucket{
			clients:   make(map[string]*ClientRateAdvanced),
			config:    config,
			lastClean: time.Now(),
		}
	}

	// Iniciar cleanup periódico
	go arl.cleanupLoop()

	return arl
}

// getConfig retorna config para um path
func (arl *AdvancedRateLimiter) getConfig(path string) RateLimitConfig {
	// Verificar match exato primeiro
	if config, exists := EndpointRateLimits[path]; exists {
		return config
	}

	// Verificar prefixos
	for pattern, config := range EndpointRateLimits {
		if strings.HasPrefix(path, pattern) {
			return config
		}
	}

	return arl.defaults
}

// getBucket retorna ou cria bucket para um path
func (arl *AdvancedRateLimiter) getBucket(path string) *RateBucket {
	arl.mu.RLock()
	
	// Verificar match exato
	if bucket, exists := arl.buckets[path]; exists {
		arl.mu.RUnlock()
		return bucket
	}

	// Verificar prefixos
	for pattern, bucket := range arl.buckets {
		if strings.HasPrefix(path, pattern) {
			arl.mu.RUnlock()
			return bucket
		}
	}
	arl.mu.RUnlock()

	// Criar bucket default
	arl.mu.Lock()
	defer arl.mu.Unlock()

	// Double-check
	if bucket, exists := arl.buckets[path]; exists {
		return bucket
	}

	bucket := &RateBucket{
		clients:   make(map[string]*ClientRateAdvanced),
		config:    arl.defaults,
		lastClean: time.Now(),
	}
	arl.buckets[path] = bucket

	return bucket
}

// Allow verifica se requisição é permitida
func (arl *AdvancedRateLimiter) Allow(path, clientKey string) (bool, int, time.Duration) {
	bucket := arl.getBucket(path)
	
	bucket.mu.Lock()
	defer bucket.mu.Unlock()

	now := time.Now()
	client, exists := bucket.clients[clientKey]

	if !exists {
		bucket.clients[clientKey] = &ClientRateAdvanced{
			Count:       1,
			WindowStart: now,
		}
		return true, bucket.config.Rate - 1, bucket.config.Window
	}

	// Verificar se janela expirou
	if now.Sub(client.WindowStart) > bucket.config.Window {
		client.Count = 1
		client.WindowStart = now
		client.Blocked = false
		return true, bucket.config.Rate - 1, bucket.config.Window
	}

	// Verificar se está bloqueado
	if client.Blocked {
		retryAfter := bucket.config.Window - now.Sub(client.WindowStart)
		return false, 0, retryAfter
	}

	// Verificar limite
	if client.Count >= bucket.config.Rate {
		client.Blocked = true
		client.BlockedAt = now
		retryAfter := bucket.config.Window - now.Sub(client.WindowStart)
		return false, 0, retryAfter
	}

	client.Count++
	remaining := bucket.config.Rate - client.Count
	return true, remaining, bucket.config.Window
}

// cleanupLoop limpa clientes antigos periodicamente
func (arl *AdvancedRateLimiter) cleanupLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		arl.cleanup()
	}
}

// cleanup remove clientes inativos
func (arl *AdvancedRateLimiter) cleanup() {
	arl.mu.RLock()
	buckets := make([]*RateBucket, 0, len(arl.buckets))
	for _, bucket := range arl.buckets {
		buckets = append(buckets, bucket)
	}
	arl.mu.RUnlock()

	now := time.Now()
	for _, bucket := range buckets {
		bucket.mu.Lock()
		for key, client := range bucket.clients {
			if now.Sub(client.WindowStart) > bucket.config.Window*2 {
				delete(bucket.clients, key)
			}
		}
		bucket.lastClean = now
		bucket.mu.Unlock()
	}
}

// Stats retorna estatísticas
func (arl *AdvancedRateLimiter) Stats() map[string]interface{} {
	arl.mu.RLock()
	defer arl.mu.RUnlock()

	stats := make(map[string]interface{})
	for pattern, bucket := range arl.buckets {
		bucket.mu.Lock()
		stats[pattern] = map[string]interface{}{
			"active_clients": len(bucket.clients),
			"rate":           bucket.config.Rate,
			"window":         bucket.config.Window.String(),
		}
		bucket.mu.Unlock()
	}

	return stats
}

// AdvancedRateLimitMiddleware middleware de rate limiting avançado
func AdvancedRateLimitMiddleware(defaultRate int, defaultWindow time.Duration) gin.HandlerFunc {
	limiter := NewAdvancedRateLimiter(defaultRate, defaultWindow)

	return func(c *gin.Context) {
		path := c.Request.URL.Path
		
		// Usar userID se autenticado, senão IP
		clientKey := c.ClientIP()
		if userID := c.GetString("userID"); userID != "" {
			clientKey = "user:" + userID
		}

		allowed, remaining, retryAfter := limiter.Allow(path, clientKey)

		// Adicionar headers de rate limit
		c.Header("X-RateLimit-Remaining", string(rune(remaining)))
		
		if !allowed {
			c.Header("Retry-After", retryAfter.String())
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit excedido",
				"retry_after": retryAfter.Seconds(),
				"message":     "Muitas requisições. Aguarde antes de tentar novamente.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Global instance
var globalAdvancedLimiter *AdvancedRateLimiter
var advancedLimiterOnce sync.Once

// GetAdvancedRateLimiter retorna instância global
func GetAdvancedRateLimiter() *AdvancedRateLimiter {
	advancedLimiterOnce.Do(func() {
		globalAdvancedLimiter = NewAdvancedRateLimiter(100, time.Minute)
	})
	return globalAdvancedLimiter
}
