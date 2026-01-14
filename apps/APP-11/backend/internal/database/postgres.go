
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPostgresDB creates a new PostgreSQL database connection pool.
func NewPostgresDB(databaseURL string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	// Configure connection pool settings
	config.MaxConns = 10                  // Max concurrent connections
	config.MinConns = 2                   // Min idle connections
	config.MaxConnLifetime = time.Hour    // Max time a connection can be used
	config.MaxConnIdleTime = 30 * time.Minute // Max time a connection can be idle
	config.HealthCheckPeriod = time.Minute // Period to check connection health

	connPool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Ping the database to verify the connection
	if err := connPool.Ping(ctx); err != nil {
		connPool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return connPool, nil
}
