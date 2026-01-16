// Package cache provides high-performance in-memory caching for PROST-QS
// "Memória é mais rápida que banco. Sempre."
package cache

import (
	"sync"
	"time"
)

// CacheItem represents a cached item with expiration
type CacheItem struct {
	Value      interface{}
	Expiration int64
}

// MemoryCache is a thread-safe in-memory cache with TTL support
type MemoryCache struct {
	items map[string]CacheItem
	mu    sync.RWMutex
	
	// Stats
	hits   int64
	misses int64
}

var (
	globalCache *MemoryCache
	once        sync.Once
)

// GetCache returns the singleton cache instance
func GetCache() *MemoryCache {
	once.Do(func() {
		globalCache = &MemoryCache{
			items: make(map[string]CacheItem),
		}
		// Start cleanup goroutine
		go globalCache.cleanupLoop()
	})
	return globalCache
}

// Set stores a value with TTL
func (c *MemoryCache) Set(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	expiration := int64(0)
	if ttl > 0 {
		expiration = time.Now().Add(ttl).UnixNano()
	}
	
	c.items[key] = CacheItem{
		Value:      value,
		Expiration: expiration,
	}
}

// Get retrieves a value from cache
func (c *MemoryCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	
	item, found := c.items[key]
	if !found {
		c.misses++
		return nil, false
	}
	
	// Check expiration
	if item.Expiration > 0 && time.Now().UnixNano() > item.Expiration {
		c.misses++
		return nil, false
	}
	
	c.hits++
	return item.Value, true
}

// Delete removes a key from cache
func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

// DeletePrefix removes all keys with given prefix
func (c *MemoryCache) DeletePrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	for key := range c.items {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.items, key)
		}
	}
}

// Clear removes all items from cache
func (c *MemoryCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[string]CacheItem)
}

// Stats returns cache statistics
func (c *MemoryCache) Stats() map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()
	
	hitRate := float64(0)
	total := c.hits + c.misses
	if total > 0 {
		hitRate = float64(c.hits) / float64(total) * 100
	}
	
	return map[string]interface{}{
		"items":    len(c.items),
		"hits":     c.hits,
		"misses":   c.misses,
		"hit_rate": hitRate,
	}
}

// cleanupLoop removes expired items periodically
func (c *MemoryCache) cleanupLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		c.cleanup()
	}
}

func (c *MemoryCache) cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	now := time.Now().UnixNano()
	for key, item := range c.items {
		if item.Expiration > 0 && now > item.Expiration {
			delete(c.items, key)
		}
	}
}

// ========================================
// CACHE KEYS - Convenções de nomenclatura
// ========================================

const (
	// User cache keys
	KeyUserByID    = "user:"        // user:{id}
	KeyUserByEmail = "user:email:"  // user:email:{email}
	
	// App cache keys
	KeyAppByID     = "app:"         // app:{id}
	KeyAppByKey    = "app:key:"     // app:key:{api_key}
	
	// Capabilities cache keys
	KeyCapabilities = "caps:"       // caps:{user_id}
	KeyPlan         = "plan:"       // plan:{plan_id}
	KeyPlans        = "plans:all"   // All plans
	
	// Rules cache keys
	KeyRulesByApp   = "rules:app:"  // rules:app:{app_id}
	
	// Session cache keys
	KeySession      = "session:"    // session:{token_id}
)

// TTL constants
const (
	TTLShort   = 1 * time.Minute   // Dados que mudam frequentemente
	TTLMedium  = 5 * time.Minute   // Dados moderadamente estáveis
	TTLLong    = 30 * time.Minute  // Dados raramente mudam
	TTLVeryLong = 1 * time.Hour    // Dados quase estáticos (planos, etc)
)
