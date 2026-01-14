
package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"manifest-architect/backend/internal/core/domain"

	redisLib "github.com/go-redis/redis/v8"
)

// Client for interacting with Redis (Digital Twin Hot Cache)
type Client struct {
	client *redisLib.Client
}

// NewRedisClient creates and initializes a Redis client.
func NewRedisClient(addr string, password string) (*Client, error) {
	rdb := redisLib.NewClient(&redisLib.Options{
		Addr:     addr,
		Password: password,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("redis connection error: %w", err)
	}

	log.Println("[Redis] Connection established successfully.")
	return &Client{client: rdb}, nil
}

// SetAgvStatus updates the current state of a Digital Twin in Redis.
// Key format: agv:status:{agvId}
func (c *Client) SetAgvStatus(status *domain.AgvStatus) error {
	ctx := context.Background()
	key := fmt.Sprintf("agv:status:%s", status.RobotId)
	data, err := json.Marshal(status)
	if err != nil {
		return fmt.Errorf("failed to marshal AGV status: %w", err)
	}
	// No expiration set, as this is a persistent snapshot (SSOT for current state).
	return c.client.Set(ctx, key, data, 0).Err()
}

// GetAgvStatus retrieves the current state of a Digital Twin from Redis.
func (c *Client) GetAgvStatus(agvId string) (*domain.AgvStatus, error) {
	ctx := context.Background()
	key := fmt.Sprintf("agv:status:%s", agvId)
	data, err := c.client.Get(ctx, key).Bytes()
	if err == redisLib.Nil {
		return nil, fmt.Errorf("agv status not found for ID %s", agvId)
	} else if err != nil {
		return nil, fmt.Errorf("failed to get agv status from redis: %w", err)
	}

	var status domain.AgvStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return nil, fmt.Errorf("failed to unmarshal AGV status from redis: %w", err)
	}
	return &status, nil
}

// GetAllAgvStatuses retrieves all AGV states from Redis (for fleet summary endpoint).
func (c *Client) GetAllAgvStatuses() ([]domain.AgvStatus, error) {
	ctx := context.Background()
	keys, err := c.client.Keys(ctx, "agv:status:*").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve keys from redis: %w", err)
	}

	var results []domain.AgvStatus
	for _, key := range keys {
		data, err := c.client.Get(ctx, key).Bytes()
		if err == nil {
			var status domain.AgvStatus
			if err := json.Unmarshal(data, &status); err == nil {
				results = append(results, status)
			}
		}
	}
	return results, nil
}
