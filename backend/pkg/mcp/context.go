package mcp

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

// ========================================
// CONTEXT KEYS
// ========================================

type contextKey int

const (
	traceIDKey contextKey = iota
	userIDKey
	sessionIDKey
	agentIDKey
)

// ========================================
// TRACE ID MANAGEMENT
// ========================================

// WithTraceID injects a TraceID into the context.
// This is the DNA of every operation - it flows through all layers.
func WithTraceID(ctx context.Context, traceID string) context.Context {
	return context.WithValue(ctx, traceIDKey, traceID)
}

// GetTraceID retrieves the TraceID from context.
// If not present, generates a new UUIDv7-style ID for safety.
func GetTraceID(ctx context.Context) string {
	val, ok := ctx.Value(traceIDKey).(string)
	if !ok || val == "" {
		return GenerateTraceID()
	}
	return val
}

// GenerateTraceID creates a new temporally-ordered unique identifier.
// Format: timestamp-random (similar to UUIDv7 concept)
func GenerateTraceID() string {
	// Timestamp component (milliseconds since epoch in hex)
	ts := time.Now().UnixMilli()
	tsHex := fmt.Sprintf("%012x", ts)

	// Random component (6 bytes = 12 hex chars)
	random := make([]byte, 6)
	rand.Read(random)
	randomHex := hex.EncodeToString(random)

	// Format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx (UUIDv7-like)
	return fmt.Sprintf("%s-%s-7%s-%s-%s",
		tsHex[0:8],
		tsHex[8:12],
		randomHex[0:3],
		randomHex[3:7],
		randomHex[7:12]+tsHex[0:6],
	)
}

// ========================================
// USER CONTEXT
// ========================================

// WithUserID injects the authenticated user ID into context.
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// GetUserID retrieves the user ID from context.
func GetUserID(ctx context.Context) string {
	val, ok := ctx.Value(userIDKey).(string)
	if !ok {
		return ""
	}
	return val
}

// WithSessionID injects the session ID into context.
func WithSessionID(ctx context.Context, sessionID string) context.Context {
	return context.WithValue(ctx, sessionIDKey, sessionID)
}

// GetSessionID retrieves the session ID from context.
func GetSessionID(ctx context.Context) string {
	val, ok := ctx.Value(sessionIDKey).(string)
	if !ok {
		return ""
	}
	return val
}

// ========================================
// AGENT CONTEXT
// ========================================

// WithAgentID injects the executing agent ID into context.
func WithAgentID(ctx context.Context, agentID string) context.Context {
	return context.WithValue(ctx, agentIDKey, agentID)
}

// GetAgentID retrieves the agent ID from context.
func GetAgentID(ctx context.Context) string {
	val, ok := ctx.Value(agentIDKey).(string)
	if !ok {
		return ""
	}
	return val
}

// ========================================
// FULL CONTEXT CONSTRUCTION
// ========================================

// ExecutionContext holds all metadata for a single execution.
type ExecutionContext struct {
	TraceID   string
	UserID    string
	SessionID string
	AgentID   string
	Timestamp time.Time
}

// NewExecutionContext creates a full execution context with all fields.
func NewExecutionContext(ctx context.Context) ExecutionContext {
	return ExecutionContext{
		TraceID:   GetTraceID(ctx),
		UserID:    GetUserID(ctx),
		SessionID: GetSessionID(ctx),
		AgentID:   GetAgentID(ctx),
		Timestamp: time.Now(),
	}
}

// ToContext injects all fields back into a context.
func (ec ExecutionContext) ToContext(ctx context.Context) context.Context {
	ctx = WithTraceID(ctx, ec.TraceID)
	if ec.UserID != "" {
		ctx = WithUserID(ctx, ec.UserID)
	}
	if ec.SessionID != "" {
		ctx = WithSessionID(ctx, ec.SessionID)
	}
	if ec.AgentID != "" {
		ctx = WithAgentID(ctx, ec.AgentID)
	}
	return ctx
}
