package financial

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// RATE LIMITING - Fase 27.2.2
// "Proteção contra flood, bugs e abuso"
// ========================================

// RateLimitConfig configuração do rate limiter
type RateLimitConfig struct {
	RequestsPerMinute int           // Limite de requests por minuto
	WindowSize        time.Duration // Janela de tempo
	CleanupInterval   time.Duration // Intervalo de limpeza
}

// DefaultRateLimitConfig configuração padrão
var DefaultRateLimitConfig = RateLimitConfig{
	RequestsPerMinute: 60,              // 60 req/min por app
	WindowSize:        time.Minute,
	CleanupInterval:   5 * time.Minute,
}

// RateLimiter controla taxa de requests por app
type RateLimiter struct {
	config   RateLimitConfig
	counters map[string]*rateLimitCounter
	mu       sync.RWMutex
	stopCh   chan struct{}
}

type rateLimitCounter struct {
	count     int
	windowEnd time.Time
}

// NewRateLimiter cria novo rate limiter
func NewRateLimiter(config RateLimitConfig) *RateLimiter {
	rl := &RateLimiter{
		config:   config,
		counters: make(map[string]*rateLimitCounter),
		stopCh:   make(chan struct{}),
	}
	go rl.cleanup()
	return rl
}

// Allow verifica se request é permitido
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	counter, exists := rl.counters[key]

	if !exists || now.After(counter.windowEnd) {
		// Nova janela
		rl.counters[key] = &rateLimitCounter{
			count:     1,
			windowEnd: now.Add(rl.config.WindowSize),
		}
		return true
	}

	if counter.count >= rl.config.RequestsPerMinute {
		return false
	}

	counter.count++
	return true
}

// GetCount retorna contagem atual para uma chave
func (rl *RateLimiter) GetCount(key string) int {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	counter, exists := rl.counters[key]
	if !exists || time.Now().After(counter.windowEnd) {
		return 0
	}
	return counter.count
}

// GetRemaining retorna requests restantes
func (rl *RateLimiter) GetRemaining(key string) int {
	count := rl.GetCount(key)
	remaining := rl.config.RequestsPerMinute - count
	if remaining < 0 {
		return 0
	}
	return remaining
}

// cleanup remove contadores expirados
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.config.CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			rl.mu.Lock()
			now := time.Now()
			for key, counter := range rl.counters {
				if now.After(counter.windowEnd) {
					delete(rl.counters, key)
				}
			}
			rl.mu.Unlock()
		case <-rl.stopCh:
			return
		}
	}
}

// Stop para o cleanup goroutine
func (rl *RateLimiter) Stop() {
	close(rl.stopCh)
}

// ========================================
// GIN MIDDLEWARE
// ========================================

// RateLimitMiddleware middleware Gin para rate limiting
func RateLimitMiddleware(rl *RateLimiter, alertService *AlertService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extrair app_id do path
		appIDStr := c.Param("app_id")
		if appIDStr == "" {
			c.Next()
			return
		}

		appID, err := uuid.Parse(appIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
			c.Abort()
			return
		}

		key := "webhook:" + appID.String()

		// Verificar rate limit
		if !rl.Allow(key) {
			// Criar alerta de rate limit
			if alertService != nil {
				alertService.CreateAlert(AlertInput{
					Type:      AlertRateLimitExceeded,
					AppID:     &appID,
					Severity:  SeverityWarning,
					Value:     float64(rl.config.RequestsPerMinute),
					Threshold: float64(rl.config.RequestsPerMinute),
					Message:   "Rate limit excedido para webhooks",
					Metadata: map[string]interface{}{
						"app_id":     appID.String(),
						"limit":      rl.config.RequestsPerMinute,
						"window":     rl.config.WindowSize.String(),
						"source_ip":  c.ClientIP(),
					},
				})
			}

			c.Header("X-RateLimit-Limit", string(rune(rl.config.RequestsPerMinute)))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("Retry-After", "60")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit excedido",
				"limit":       rl.config.RequestsPerMinute,
				"window":      "1m",
				"retry_after": 60,
			})
			c.Abort()
			return
		}

		// Adicionar headers de rate limit
		remaining := rl.GetRemaining(key)
		c.Header("X-RateLimit-Limit", string(rune(rl.config.RequestsPerMinute)))
		c.Header("X-RateLimit-Remaining", string(rune(remaining)))

		c.Next()
	}
}

// ========================================
// RATE LIMIT STATS
// ========================================

// RateLimitStats estatísticas do rate limiter
type RateLimitStats struct {
	TotalApps       int            `json:"total_apps"`
	ActiveCounters  int            `json:"active_counters"`
	LimitPerMinute  int            `json:"limit_per_minute"`
	AppStats        []AppRateStats `json:"app_stats,omitempty"`
}

type AppRateStats struct {
	AppID     string `json:"app_id"`
	Count     int    `json:"count"`
	Remaining int    `json:"remaining"`
}

// GetStats retorna estatísticas do rate limiter
func (rl *RateLimiter) GetStats() RateLimitStats {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	now := time.Now()
	stats := RateLimitStats{
		LimitPerMinute: rl.config.RequestsPerMinute,
	}

	for key, counter := range rl.counters {
		if now.Before(counter.windowEnd) {
			stats.ActiveCounters++
			stats.AppStats = append(stats.AppStats, AppRateStats{
				AppID:     key,
				Count:     counter.count,
				Remaining: rl.config.RequestsPerMinute - counter.count,
			})
		}
	}

	stats.TotalApps = len(stats.AppStats)
	return stats
}
