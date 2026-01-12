package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// ========================================
// RATE LIMITER TESTS
// ========================================

func TestNewRateLimiter(t *testing.T) {
	rl := NewRateLimiter(10, time.Minute)
	assert.NotNil(t, rl)
	assert.Equal(t, 10, rl.rate)
	assert.Equal(t, time.Minute, rl.window)
	assert.NotNil(t, rl.clients)
}

func TestAllow_FirstRequest(t *testing.T) {
	rl := NewRateLimiter(5, time.Minute)
	
	allowed := rl.Allow("192.168.1.1")
	assert.True(t, allowed)
}

func TestAllow_WithinLimit(t *testing.T) {
	rl := NewRateLimiter(5, time.Minute)
	
	for i := 0; i < 5; i++ {
		allowed := rl.Allow("192.168.1.1")
		assert.True(t, allowed, "Request %d should be allowed", i+1)
	}
}

func TestAllow_ExceedsLimit(t *testing.T) {
	rl := NewRateLimiter(3, time.Minute)
	
	// Primeiras 3 requests permitidas
	for i := 0; i < 3; i++ {
		allowed := rl.Allow("192.168.1.1")
		assert.True(t, allowed)
	}
	
	// 4ª request bloqueada
	allowed := rl.Allow("192.168.1.1")
	assert.False(t, allowed)
}

func TestAllow_DifferentIPs(t *testing.T) {
	rl := NewRateLimiter(2, time.Minute)
	
	// IP 1 - 2 requests
	assert.True(t, rl.Allow("192.168.1.1"))
	assert.True(t, rl.Allow("192.168.1.1"))
	assert.False(t, rl.Allow("192.168.1.1"))
	
	// IP 2 - ainda tem quota
	assert.True(t, rl.Allow("192.168.1.2"))
	assert.True(t, rl.Allow("192.168.1.2"))
	assert.False(t, rl.Allow("192.168.1.2"))
}

// ========================================
// RATE LIMIT MIDDLEWARE TESTS
// ========================================

func TestRateLimitMiddleware_AllowsRequests(t *testing.T) {
	router := gin.New()
	router.Use(RateLimitMiddleware(5, time.Minute))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRateLimitMiddleware_BlocksExcessRequests(t *testing.T) {
	router := gin.New()
	router.Use(RateLimitMiddleware(2, time.Minute))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Primeiras 2 requests OK
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// 3ª request bloqueada
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

func TestRateLimitMiddleware_ReturnsErrorMessage(t *testing.T) {
	router := gin.New()
	router.Use(RateLimitMiddleware(1, time.Minute))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Primeira request OK
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Segunda request bloqueada
	req = httptest.NewRequest(http.MethodGet, "/test", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
	assert.Contains(t, w.Body.String(), "error")
}
