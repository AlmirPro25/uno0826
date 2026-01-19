package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// ========================================
// REDIS CACHE LAYER
// ========================================
// Purpose: Distributed caching for UCP sessions, agent state, and hot data
// Benefits:
//   - Persistence across restarts
//   - Horizontal scalability
//   - Low-latency reads
// ========================================

// RedisCache wraps the redis client with typed methods
type RedisCache struct {
	client *redis.Client
	prefix string // Namespace prefix for all keys (e.g., "prostqs:")
}

// RedisConfig holds configuration for Redis connection
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
	Prefix   string
}

// NewRedisCache creates a new Redis cache client
func NewRedisCache(config RedisConfig) (*RedisCache, error) {
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)

	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: config.Password,
		DB:       config.DB,

		// Production-grade settings
		PoolSize:     20,              // Support 20 concurrent connections
		MinIdleConns: 5,               // Keep 5 connections warm
		MaxRetries:   3,               // Auto-retry failed commands
		DialTimeout:  5 * time.Second, // Connect timeout
		ReadTimeout:  3 * time.Second, // Read timeout
		WriteTimeout: 3 * time.Second, // Write timeout
	})

	// Health Check
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	prefix := config.Prefix
	if prefix == "" {
		prefix = "prostqs:"
	}

	return &RedisCache{
		client: client,
		prefix: prefix,
	}, nil
}

// ========================================
// CORE OPERATIONS
// ========================================

// Set stores a value with an optional TTL
func (r *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	fullKey := r.prefix + key

	// Serialize to JSON
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to serialize value: %w", err)
	}

	return r.client.Set(ctx, fullKey, data, ttl).Err()
}

// Get retrieves and deserializes a value
func (r *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
	fullKey := r.prefix + key

	data, err := r.client.Get(ctx, fullKey).Bytes()
	if err != nil {
		if err == redis.Nil {
			return ErrCacheMiss
		}
		return fmt.Errorf("redis get failed: %w", err)
	}

	if err := json.Unmarshal(data, dest); err != nil {
		return fmt.Errorf("failed to deserialize value: %w", err)
	}

	return nil
}

// Delete removes a key
func (r *RedisCache) Delete(ctx context.Context, key string) error {
	fullKey := r.prefix + key
	return r.client.Del(ctx, fullKey).Err()
}

// Exists checks if a key exists
func (r *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	fullKey := r.prefix + key
	count, err := r.client.Exists(ctx, fullKey).Result()
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetTTL returns the remaining TTL of a key
func (r *RedisCache) GetTTL(ctx context.Context, key string) (time.Duration, error) {
	fullKey := r.prefix + key
	return r.client.TTL(ctx, fullKey).Result()
}

// Expire sets a new TTL on an existing key
func (r *RedisCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	fullKey := r.prefix + key
	return r.client.Expire(ctx, fullKey, ttl).Err()
}

// ========================================
// ADVANCED OPERATIONS
// ========================================

// SetNX sets a key only if it doesn't exist (atomic lock)
func (r *RedisCache) SetNX(ctx context.Context, key string, value interface{}, ttl time.Duration) (bool, error) {
	fullKey := r.prefix + key

	data, err := json.Marshal(value)
	if err != nil {
		return false, fmt.Errorf("failed to serialize value: %w", err)
	}

	return r.client.SetNX(ctx, fullKey, data, ttl).Result()
}

// Increment atomically increments a counter
func (r *RedisCache) Increment(ctx context.Context, key string) (int64, error) {
	fullKey := r.prefix + key
	return r.client.Incr(ctx, fullKey).Result()
}

// IncrementBy atomically increments by a specific amount
func (r *RedisCache) IncrementBy(ctx context.Context, key string, amount int64) (int64, error) {
	fullKey := r.prefix + key
	return r.client.IncrBy(ctx, fullKey, amount).Result()
}

// GetMany retrieves multiple keys in a single call (pipeline)
func (r *RedisCache) GetMany(ctx context.Context, keys []string) (map[string]interface{}, error) {
	if len(keys) == 0 {
		return make(map[string]interface{}), nil
	}

	fullKeys := make([]string, len(keys))
	for i, k := range keys {
		fullKeys[i] = r.prefix + k
	}

	pipe := r.client.Pipeline()
	cmds := make([]*redis.StringCmd, len(fullKeys))

	for i, fk := range fullKeys {
		cmds[i] = pipe.Get(ctx, fk)
	}

	if _, err := pipe.Exec(ctx); err != nil && err != redis.Nil {
		return nil, fmt.Errorf("pipeline exec failed: %w", err)
	}

	results := make(map[string]interface{})
	for i, cmd := range cmds {
		if cmd.Err() == nil {
			var val interface{}
			if err := json.Unmarshal([]byte(cmd.Val()), &val); err == nil {
				results[keys[i]] = val
			}
		}
	}

	return results, nil
}

// DeletePattern deletes all keys matching a pattern
func (r *RedisCache) DeletePattern(ctx context.Context, pattern string) error {
	fullPattern := r.prefix + pattern

	iter := r.client.Scan(ctx, 0, fullPattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := r.client.Del(ctx, iter.Val()).Err(); err != nil {
			return fmt.Errorf("failed to delete key %s: %w", iter.Val(), err)
		}
	}

	return iter.Err()
}

// ========================================
// UCP-SPECIFIC OPERATIONS
// ========================================

// StoreUCPSession caches a UCP discovery session
func (r *RedisCache) StoreUCPSession(ctx context.Context, targetURL string, manifest interface{}, ttl time.Duration) error {
	key := fmt.Sprintf("ucp:session:%s", targetURL)
	return r.Set(ctx, key, manifest, ttl)
}

// GetUCPSession retrieves a cached UCP session
func (r *RedisCache) GetUCPSession(ctx context.Context, targetURL string, dest interface{}) error {
	key := fmt.Sprintf("ucp:session:%s", targetURL)
	return r.Get(ctx, key, dest)
}

// ========================================
// HEALTH & METRICS
// ========================================

// Ping checks if Redis is responsive
func (r *RedisCache) Ping(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

// Stats returns Redis info
func (r *RedisCache) Stats(ctx context.Context) (map[string]string, error) {
	info, err := r.client.Info(ctx, "stats").Result()
	if err != nil {
		return nil, err
	}

	// Parse info string into map (simplified)
	stats := make(map[string]string)
	stats["raw_info"] = info
	return stats, nil
}

// Close gracefully shuts down the Redis connection
func (r *RedisCache) Close() error {
	return r.client.Close()
}

// ========================================
// ERRORS
// ========================================

var ErrCacheMiss = fmt.Errorf("cache: key not found")
