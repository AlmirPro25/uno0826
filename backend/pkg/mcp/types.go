// Package mcp implements the Model Context Protocol for sovereign agent orchestration.
// This is the heart of the WATCHER system - all autonomous operations pass through here.
package mcp

import (
	"encoding/json"
	"time"
)

// ========================================
// COMMAND PROTOCOL
// ========================================

// Command represents a semantic instruction for an agent.
// It is the universal language spoken by all agents in the system.
type Command struct {
	Name   string          `json:"name"`   // Semantic command name, e.g., "identity:user:create"
	Params json.RawMessage `json:"params"` // Dynamic payload, validated by agent schema
}

// Result represents the outcome of agent execution.
// Every execution produces a Result, even failures.
type Result struct {
	Data  interface{} `json:"data,omitempty"`
	Error string      `json:"error,omitempty"`
}

// IsSuccess returns true if the result has no error.
func (r Result) IsSuccess() bool {
	return r.Error == ""
}

// ========================================
// API DATA TRANSFER OBJECTS
// ========================================

// DispatchRequest is the incoming DTO for the /dispatch API endpoint.
// This is the ONLY entry point for agent execution.
type DispatchRequest struct {
	AgentID string          `json:"agent_id" binding:"required"`
	Command string          `json:"command" binding:"required"`
	Params  json.RawMessage `json:"params"`
}

// DispatchResponse is the outgoing DTO after command execution.
// It always contains a TraceID for forensic tracking.
type DispatchResponse struct {
	TraceID         string      `json:"trace_id"`
	Status          string      `json:"status"` // SUCCESS, FAILED, PENDING
	Result          interface{} `json:"result,omitempty"`
	ExecutionTimeMs int64       `json:"execution_time_ms"`
	Timestamp       time.Time   `json:"timestamp"`
}

// ========================================
// KERNEL EVENT TYPES
// ========================================

// EventType defines the lifecycle stages of command execution.
type EventType string

const (
	EventTypeIntent    EventType = "INTENT"    // Before execution - records intent
	EventTypeSuccess   EventType = "SUCCESS"   // After successful execution
	EventTypeFailure   EventType = "FAILURE"   // After failed execution
	EventTypeViolation EventType = "VIOLATION" // Security violation detected
)

// KernelEvent represents an immutable record of an operation.
// "Se não está no log, não aconteceu."
type KernelEvent struct {
	ID          string          `json:"id" gorm:"primaryKey"`
	TraceID     string          `json:"trace_id" gorm:"index"`
	AgentID     string          `json:"agent_id" gorm:"index"`
	EventType   EventType       `json:"event_type"` // INTENT, SUCCESS, FAILURE, VIOLATION
	Command     string          `json:"command"`
	Payload     json.RawMessage `json:"payload" gorm:"type:jsonb"`
	Metadata    json.RawMessage `json:"metadata,omitempty" gorm:"type:jsonb"` // Context info (user, ip, etc)
	ExecutionMs int64           `json:"execution_ms,omitempty"`               // Duration of execution
	Timestamp   time.Time       `json:"timestamp" gorm:"index"`

	// Security Fields (Blockchain-lite)
	Hash         string `json:"hash" gorm:"unique"`         // SHA256(PrevHash + Content)
	PreviousHash string `json:"previous_hash" gorm:"index"` // Link to previous event
}

// TableName for GORM
func (KernelEvent) TableName() string {
	return "kernel_events"
}

// ========================================
// AGENT REGISTRY
// ========================================

// AgentStatus represents the runtime state of a registered agent.
type AgentStatus struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Status       string     `json:"status"` // ACTIVE, INACTIVE, SUSPENDED, COMPROMISED
	Capabilities []string   `json:"capabilities"`
	Version      string     `json:"version,omitempty"`
	LastActiveAt *time.Time `json:"last_active_at,omitempty"`
}

// AgentRegistry is the persistent record of an agent in the database.
type AgentRegistry struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"uniqueIndex"`
	Description  string    `json:"description,omitempty"`
	Capabilities []string  `json:"capabilities" gorm:"type:text[]"`
	Status       string    `json:"status" gorm:"default:ACTIVE"`
	Version      string    `json:"version"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// TableName for GORM
func (AgentRegistry) TableName() string {
	return "agent_registry"
}
