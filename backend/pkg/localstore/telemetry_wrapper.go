package localstore

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
)

// ========================================
// TELEMETRY WRAPPER - Integração com TelemetryService
// "Escreve local primeiro, sync depois"
// ========================================

// TelemetryEventData representa dados de um evento de telemetria
type TelemetryEventData struct {
	AppID      string                 `json:"app_id"`
	UserID     string                 `json:"user_id"`
	SessionID  string                 `json:"session_id"`
	Type       string                 `json:"type"`
	Feature    string                 `json:"feature,omitempty"`
	TargetID   string                 `json:"target_id,omitempty"`
	TargetType string                 `json:"target_type,omitempty"`
	Context    map[string]interface{} `json:"context,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	IPAddress  string                 `json:"ip_address,omitempty"`
	UserAgent  string                 `json:"user_agent,omitempty"`
	Timestamp  time.Time              `json:"timestamp"`
}

// WriteTelemetryEvent escreve um evento de telemetria no LocalStore
// Retorna o ID do evento local ou erro
func WriteTelemetryEvent(ctx context.Context, data TelemetryEventData) (string, error) {
	store := GetGlobalStore()
	if store == nil {
		// LocalStore não habilitado - retorna sem erro
		return "", nil
	}

	payload, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	eventType := "telemetry." + data.Type
	return store.Write(ctx, eventType, data.AppID, string(payload))
}

// WriteTelemetryEventAsync escreve um evento de forma assíncrona (fire-and-forget)
func WriteTelemetryEventAsync(data TelemetryEventData) {
	if !IsEnabled() {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if _, err := WriteTelemetryEvent(ctx, data); err != nil {
			log.Printf("[LocalStore] Erro ao escrever evento de telemetria: %v", err)
		}
	}()
}

// ========================================
// AUDIT WRAPPER - Integração com AuditService
// ========================================

// AuditEventData representa dados de um evento de auditoria
type AuditEventData struct {
	AppID      string                 `json:"app_id,omitempty"`
	Type       string                 `json:"type"`
	ActorID    string                 `json:"actor_id"`
	ActorType  string                 `json:"actor_type"`
	TargetID   string                 `json:"target_id,omitempty"`
	TargetType string                 `json:"target_type,omitempty"`
	Action     string                 `json:"action"`
	Before     map[string]interface{} `json:"before,omitempty"`
	After      map[string]interface{} `json:"after,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	IP         string                 `json:"ip,omitempty"`
	UserAgent  string                 `json:"user_agent,omitempty"`
	Reason     string                 `json:"reason,omitempty"`
	Timestamp  time.Time              `json:"timestamp"`
}

// WriteAuditEvent escreve um evento de auditoria no LocalStore
func WriteAuditEvent(ctx context.Context, data AuditEventData) (string, error) {
	store := GetGlobalStore()
	if store == nil {
		return "", nil
	}

	if data.Timestamp.IsZero() {
		data.Timestamp = time.Now().UTC()
	}

	payload, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	eventType := "audit." + data.Type
	return store.Write(ctx, eventType, data.AppID, string(payload))
}

// WriteAuditEventAsync escreve um evento de auditoria de forma assíncrona
func WriteAuditEventAsync(data AuditEventData) {
	if !IsEnabled() {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if _, err := WriteAuditEvent(ctx, data); err != nil {
			log.Printf("[LocalStore] Erro ao escrever evento de auditoria: %v", err)
		}
	}()
}

// ========================================
// RULE EXECUTION WRAPPER
// ========================================

// RuleExecutionData representa dados de uma execução de regra
type RuleExecutionData struct {
	ID           string                 `json:"id"`
	RuleID       string                 `json:"rule_id"`
	AppID        string                 `json:"app_id"`
	TriggerData  map[string]interface{} `json:"trigger_data,omitempty"`
	ConditionMet bool                   `json:"condition_met"`
	ActionTaken  bool                   `json:"action_taken"`
	ActionResult string                 `json:"action_result,omitempty"`
	Error        string                 `json:"error,omitempty"`
	DurationMs   int64                  `json:"duration_ms"`
	ExecutedAt   time.Time              `json:"executed_at"`
}

// WriteRuleExecution escreve uma execução de regra no LocalStore
func WriteRuleExecution(ctx context.Context, data RuleExecutionData) (string, error) {
	store := GetGlobalStore()
	if store == nil {
		return "", nil
	}

	if data.ID == "" {
		data.ID = uuid.NewString()
	}
	if data.ExecutedAt.IsZero() {
		data.ExecutedAt = time.Now().UTC()
	}

	payload, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	return store.Write(ctx, "rule.execution", data.AppID, string(payload))
}

// WriteRuleExecutionAsync escreve uma execução de regra de forma assíncrona
func WriteRuleExecutionAsync(data RuleExecutionData) {
	if !IsEnabled() {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if _, err := WriteRuleExecution(ctx, data); err != nil {
			log.Printf("[LocalStore] Erro ao escrever execução de regra: %v", err)
		}
	}()
}

// ========================================
// SESSION WRAPPER - Para sessões de telemetria
// ========================================

// SessionEventData representa dados de evento de sessão
type SessionEventData struct {
	AppID            string    `json:"app_id"`
	SessionID        string    `json:"session_id"`
	UserID           string    `json:"user_id"`
	EventType        string    `json:"event_type"` // start, end, heartbeat, recover
	IPAddress        string    `json:"ip_address,omitempty"`
	UserAgent        string    `json:"user_agent,omitempty"`
	Country          string    `json:"country,omitempty"`
	DurationMs       int64     `json:"duration_ms,omitempty"`
	InteractionCount int       `json:"interaction_count,omitempty"`
	Timestamp        time.Time `json:"timestamp"`
}

// WriteSessionEvent escreve um evento de sessão no LocalStore
func WriteSessionEvent(ctx context.Context, data SessionEventData) (string, error) {
	store := GetGlobalStore()
	if store == nil {
		return "", nil
	}

	if data.Timestamp.IsZero() {
		data.Timestamp = time.Now().UTC()
	}

	payload, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	eventType := "session." + data.EventType
	return store.Write(ctx, eventType, data.AppID, string(payload))
}

// WriteSessionEventAsync escreve um evento de sessão de forma assíncrona
func WriteSessionEventAsync(data SessionEventData) {
	if !IsEnabled() {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if _, err := WriteSessionEvent(ctx, data); err != nil {
			log.Printf("[LocalStore] Erro ao escrever evento de sessão: %v", err)
		}
	}()
}
