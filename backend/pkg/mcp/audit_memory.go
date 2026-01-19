package mcp

import (
	"context"
	"sync"
	"time"
)

// ========================================
// IN-MEMORY AUDIT REPOSITORY
// ========================================

// InMemoryAuditRepo is a simple in-memory implementation of AuditRepository.
// Use this for development/testing. In production, use PostgresAuditRepo.
type InMemoryAuditRepo struct {
	events  []KernelEvent
	mu      sync.RWMutex
	maxSize int
}

// NewInMemoryAuditRepo creates a new in-memory audit repository.
func NewInMemoryAuditRepo(maxSize int) *InMemoryAuditRepo {
	if maxSize <= 0 {
		maxSize = 10000 // Default: keep last 10k events
	}
	return &InMemoryAuditRepo{
		events:  make([]KernelEvent, 0, maxSize),
		maxSize: maxSize,
	}
}

// RecordEvent adds an event to the in-memory store.
func (r *InMemoryAuditRepo) RecordEvent(ctx context.Context, event KernelEvent) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Ensure ID and Timestamp are set
	if event.ID == "" {
		event.ID = GenerateTraceID()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	r.events = append(r.events, event)

	// Ring buffer: remove oldest if over capacity
	if len(r.events) > r.maxSize {
		r.events = r.events[len(r.events)-r.maxSize:]
	}

	return nil
}

// GetEvents retrieves events with filtering.
func (r *InMemoryAuditRepo) GetEvents(ctx context.Context, filter EventFilter) ([]KernelEvent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []KernelEvent

	for i := len(r.events) - 1; i >= 0; i-- {
		event := r.events[i]

		// Apply filters
		if filter.TraceID != "" && event.TraceID != filter.TraceID {
			continue
		}
		if filter.AgentID != "" && event.AgentID != filter.AgentID {
			continue
		}
		if filter.EventType != "" && event.EventType != filter.EventType {
			continue
		}
		if filter.FromTime != nil && event.Timestamp.Before(*filter.FromTime) {
			continue
		}
		if filter.ToTime != nil && event.Timestamp.After(*filter.ToTime) {
			continue
		}

		result = append(result, event)

		// Apply limit
		if filter.Limit > 0 && len(result) >= filter.Limit {
			break
		}
	}

	return result, nil
}

// GetEventsByTraceID retrieves all events for a specific trace.
func (r *InMemoryAuditRepo) GetEventsByTraceID(ctx context.Context, traceID string) ([]KernelEvent, error) {
	return r.GetEvents(ctx, EventFilter{TraceID: traceID, Limit: 1000})
}

// Count returns the total number of stored events.
func (r *InMemoryAuditRepo) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.events)
}

// Clear removes all events (for testing).
func (r *InMemoryAuditRepo) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.events = r.events[:0]
}
