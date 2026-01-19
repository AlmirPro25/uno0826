package mcp

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"gorm.io/gorm"
)

// ========================================
// POSTGRES AUDIT REPOSITORY
// ========================================

// PostgresAuditRepo implements AuditRepository using GORM/Postgres.
// This is the production-grade persistence layer for the Watcher.
type PostgresAuditRepo struct {
	db *gorm.DB
	mu sync.Mutex // Mutex to ensure linear history when writing (essential for blockchain)
}

// NewPostgresAuditRepo creates a new GORM-backed audit repository.
func NewPostgresAuditRepo(db *gorm.DB) *PostgresAuditRepo {
	return &PostgresAuditRepo{db: db}
}

// Migrate ensures the schema exists in the database.
func (r *PostgresAuditRepo) Migrate() error {
	// AutoMigrate will create the table, missing columns and indexes
	// It relies on the GORM tags in KernelEvent/AgentRegistry structs
	return r.db.AutoMigrate(&KernelEvent{}, &AgentRegistry{})
}

// RecordEvent persists a kernel event to the database with Integrity Hash.
func (r *PostgresAuditRepo) RecordEvent(ctx context.Context, event KernelEvent) error {
	// MUTEX LOCK: Only one event can be written at a time to ensure
	// the hash chain is consistent and has no forks.
	r.mu.Lock()
	defer r.mu.Unlock()

	// Ensure ID is generated if missing
	if event.ID == "" {
		event.ID = GenerateTraceID() // Or simple UUID
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// 1. Get the last event's hash
	var lastEvent KernelEvent
	var prevHash string = "0000000000000000000000000000000000000000000000000000000000000000" // Genesis Hash

	// Query last inserted event ordered by timestamp or ID (assumes sequential IDs roughly)
	// We optimize by just getting the one with created_at desc limit 1
	if err := r.db.WithContext(ctx).Select("hash").Order("timestamp DESC, id DESC").First(&lastEvent).Error; err == nil {
		if lastEvent.Hash != "" {
			prevHash = lastEvent.Hash
		}
	} else if err != gorm.ErrRecordNotFound {
		// Real error occurred
		return fmt.Errorf("failed to get previous hash: %w", err)
	}

	// 2. Set PreviousHash
	event.PreviousHash = prevHash

	// 3. Calculate Current Hash
	event.Hash = r.calculateHash(event)

	// 4. Persist
	return r.db.WithContext(ctx).Create(&event).Error
}

func (r *PostgresAuditRepo) calculateHash(e KernelEvent) string {
	h := sha256.New()

	// Chain dependency
	h.Write([]byte(e.PreviousHash))

	// Content dependency
	h.Write([]byte(e.ID))
	h.Write([]byte(e.TraceID))
	h.Write([]byte(e.AgentID))
	h.Write([]byte(e.EventType))
	h.Write([]byte(e.Command))
	h.Write(e.Payload)
	h.Write(e.Metadata)
	h.Write([]byte(fmt.Sprintf("%d", e.ExecutionMs)))
	h.Write([]byte(e.Timestamp.UTC().String())) // Use UTC for consistency

	return hex.EncodeToString(h.Sum(nil))
}

// GetEvents retrieves events with flexible filtering using GORM scopes.
func (r *PostgresAuditRepo) GetEvents(ctx context.Context, filter EventFilter) ([]KernelEvent, error) {
	var events []KernelEvent

	query := r.db.WithContext(ctx).Model(&KernelEvent{})

	// Apply Filters
	if filter.TraceID != "" {
		query = query.Where("trace_id = ?", filter.TraceID)
	}
	if filter.AgentID != "" {
		query = query.Where("agent_id = ?", filter.AgentID)
	}
	if filter.EventType != "" {
		query = query.Where("event_type = ?", filter.EventType)
	}
	if filter.FromTime != nil {
		query = query.Where("timestamp >= ?", *filter.FromTime)
	}
	if filter.ToTime != nil {
		query = query.Where("timestamp <= ?", *filter.ToTime)
	}

	// Apply Sorting (Newest first is usually preferred for logs)
	query = query.Order("timestamp DESC")

	// Apply Pagination
	limit := 100 // Default limit safety
	if filter.Limit > 0 {
		limit = filter.Limit
	}
	query = query.Limit(limit)

	if filter.Offset > 0 {
		query = query.Offset(filter.Offset)
	}

	if err := query.Find(&events).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch kernel events: %w", err)
	}

	return events, nil
}

// GetEventsByTraceID retrieves the full narrative of a specific trace.
func (r *PostgresAuditRepo) GetEventsByTraceID(ctx context.Context, traceID string) ([]KernelEvent, error) {
	var events []KernelEvent

	// Order by timestamp ASC to reconstruct the timeline correctly
	err := r.db.WithContext(ctx).
		Where("trace_id = ?", traceID).
		Order("timestamp ASC").
		Find(&events).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch trace %s: %w", traceID, err)
	}

	return events, nil
}
