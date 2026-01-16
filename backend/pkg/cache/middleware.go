package cache

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// CachedResponseWriter wraps gin.ResponseWriter to capture response
type CachedResponseWriter struct {
	gin.ResponseWriter
	body   *bytes.Buffer
	status int
}

func (w *CachedResponseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *CachedResponseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

// CachedResponse stores a cached HTTP response
type CachedResponse struct {
	Status      int
	Body        []byte
	ContentType string
	CachedAt    time.Time
}

// ResponseCacheMiddleware caches GET responses for specified duration
// "Mesma pergunta, mesma resposta. Por que calcular de novo?"
func ResponseCacheMiddleware(ttl time.Duration, keyPrefix string) gin.HandlerFunc {
	cache := GetCache()
	
	return func(c *gin.Context) {
		// Only cache GET requests
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}
		
		// Skip if user is authenticated (personalized responses)
		if c.GetHeader("Authorization") != "" {
			c.Next()
			return
		}
		
		// Generate cache key
		key := generateCacheKey(keyPrefix, c.Request)
		
		// Try to get from cache
		if cached, found := cache.Get(key); found {
			resp := cached.(CachedResponse)
			c.Header("X-Cache", "HIT")
			c.Header("X-Cache-Age", time.Since(resp.CachedAt).String())
			c.Data(resp.Status, resp.ContentType, resp.Body)
			c.Abort()
			return
		}
		
		// Capture response
		writer := &CachedResponseWriter{
			ResponseWriter: c.Writer,
			body:           &bytes.Buffer{},
			status:         http.StatusOK,
		}
		c.Writer = writer
		
		c.Next()
		
		// Only cache successful responses
		if writer.status >= 200 && writer.status < 300 {
			contentType := c.Writer.Header().Get("Content-Type")
			cache.Set(key, CachedResponse{
				Status:      writer.status,
				Body:        writer.body.Bytes(),
				ContentType: contentType,
				CachedAt:    time.Now(),
			}, ttl)
		}
		
		c.Header("X-Cache", "MISS")
	}
}

// AuthenticatedCacheMiddleware caches responses per user
// "Cada usuário tem seu próprio cache"
func AuthenticatedCacheMiddleware(ttl time.Duration, keyPrefix string) gin.HandlerFunc {
	cache := GetCache()
	
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}
		
		// Get user ID from context
		userID := c.GetString("userID")
		if userID == "" {
			c.Next()
			return
		}
		
		// Generate user-specific cache key
		key := keyPrefix + ":" + userID + ":" + c.Request.URL.Path
		
		if cached, found := cache.Get(key); found {
			resp := cached.(CachedResponse)
			c.Header("X-Cache", "HIT")
			c.Data(resp.Status, resp.ContentType, resp.Body)
			c.Abort()
			return
		}
		
		writer := &CachedResponseWriter{
			ResponseWriter: c.Writer,
			body:           &bytes.Buffer{},
			status:         http.StatusOK,
		}
		c.Writer = writer
		
		c.Next()
		
		if writer.status >= 200 && writer.status < 300 {
			contentType := c.Writer.Header().Get("Content-Type")
			cache.Set(key, CachedResponse{
				Status:      writer.status,
				Body:        writer.body.Bytes(),
				ContentType: contentType,
				CachedAt:    time.Now(),
			}, ttl)
		}
		
		c.Header("X-Cache", "MISS")
	}
}

// InvalidateCacheMiddleware invalidates cache on write operations
// "Escreveu? Invalida o cache."
func InvalidateCacheMiddleware(keyPrefixes ...string) gin.HandlerFunc {
	cache := GetCache()
	
	return func(c *gin.Context) {
		c.Next()
		
		// Only invalidate on successful write operations
		if c.Writer.Status() >= 200 && c.Writer.Status() < 300 {
			method := c.Request.Method
			if method == http.MethodPost || method == http.MethodPut || 
			   method == http.MethodPatch || method == http.MethodDelete {
				for _, prefix := range keyPrefixes {
					cache.DeletePrefix(prefix)
				}
			}
		}
	}
}

func generateCacheKey(prefix string, r *http.Request) string {
	// Create hash of URL + query params
	data := r.URL.Path + "?" + r.URL.RawQuery
	hash := sha256.Sum256([]byte(data))
	return prefix + ":" + hex.EncodeToString(hash[:8])
}

// CacheStatsHandler returns cache statistics
func CacheStatsHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		cache := GetCache()
		c.JSON(http.StatusOK, gin.H{
			"cache": cache.Stats(),
		})
	}
}

// ========================================
// CACHE HELPERS - Funções utilitárias
// ========================================

// GetOrSet gets from cache or sets if not found
func GetOrSet[T any](key string, ttl time.Duration, fn func() (T, error)) (T, error) {
	cache := GetCache()
	
	if cached, found := cache.Get(key); found {
		return cached.(T), nil
	}
	
	value, err := fn()
	if err != nil {
		var zero T
		return zero, err
	}
	
	cache.Set(key, value, ttl)
	return value, nil
}

// InvalidateUserCache invalidates all cache for a user
func InvalidateUserCache(userID string) {
	cache := GetCache()
	cache.DeletePrefix(KeyUserByID + userID)
	cache.DeletePrefix(KeyCapabilities + userID)
	cache.DeletePrefix("auth:" + userID)
}

// InvalidateAppCache invalidates all cache for an app
func InvalidateAppCache(appID string) {
	cache := GetCache()
	cache.DeletePrefix(KeyAppByID + appID)
	cache.DeletePrefix(KeyRulesByApp + appID)
}

// WarmupCache pre-populates cache with frequently accessed data
func WarmupCache(warmupFn func()) {
	go func() {
		// Wait for system to stabilize
		time.Sleep(5 * time.Second)
		warmupFn()
	}()
}

// ========================================
// ETAG SUPPORT - HTTP Caching
// ========================================

// ETagMiddleware adds ETag support for conditional requests
func ETagMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}
		
		writer := &CachedResponseWriter{
			ResponseWriter: c.Writer,
			body:           &bytes.Buffer{},
			status:         http.StatusOK,
		}
		c.Writer = writer
		
		c.Next()
		
		// Generate ETag from response body
		if writer.status == http.StatusOK && writer.body.Len() > 0 {
			hash := sha256.Sum256(writer.body.Bytes())
			etag := `"` + hex.EncodeToString(hash[:8]) + `"`
			
			c.Header("ETag", etag)
			
			// Check If-None-Match
			if match := c.GetHeader("If-None-Match"); match != "" {
				if strings.Contains(match, etag) {
					c.Status(http.StatusNotModified)
					return
				}
			}
		}
	}
}
