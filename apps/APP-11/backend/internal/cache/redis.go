
package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisClient represents the Redis client wrapper.
type RedisClient struct {
	client *redis.Client
}

// NewRedisClient creates and returns a new Redis client.
func NewRedisClient(addr, password string, db int) *RedisClient {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password, // no password set
		DB:       db,       // use default DB
	})
	return &RedisClient{client: rdb}
}

// Set stores a key-value pair in Redis with an expiration.
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(ctx, key, value, expiration).Err()
}

// Get retrieves a value from Redis.
func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	return r.client.Get(ctx, key).Result()
}

// Del deletes keys from Redis.
func (r *RedisClient) Del(ctx context.Context, keys ...string) error {
	return r.client.Del(ctx, keys...).Err()
}

// Ping checks the connectivity to the Redis server.
func (r *RedisClient) Ping(ctx context.Context) *redis.StatusCmd {
	return r.client.Ping(ctx)
}

// Close closes the Redis client connection.
func (r *RedisClient) Close() error {
	return r.client.Close()
}
