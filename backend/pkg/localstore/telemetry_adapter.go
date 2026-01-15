package localstore

import (
	"context"
	"encoding/json"
)

// TelemetryAdapter adapta o LocalStore para uso com telemetria
type TelemetryAdapter struct {
	store *LocalStore
}

// NewTelemetryAdapter cria um adapter para telemetria
func NewTelemetryAdapter(store *LocalStore) *TelemetryAdapter {
	return &TelemetryAdapter{store: store}
}

// TelemetryPayload representa um evento de telemetria
type TelemetryPayload struct {
	SessionID        string                 `json:"session_id,omitempty"`
	EventName        string                 `json:"event_name"`
	EventData        map[string]interface{} `json:"event_data,omitempty"`
	UserID           string                 `json:"user_id,omitempty"`
	DurationMs       int64                  `json:"duration_ms,omitempty"`
	InteractionCount int                    `json:"interaction_count,omitempty"`
}

// TrackEvent registra um evento de telemetria localmente
func (a *TelemetryAdapter) TrackEvent(ctx context.Context, appID string, payload TelemetryPayload) (string, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return a.store.Write(ctx, "telemetry.event", appID, string(data))
}

// TrackSessionStart registra início de sessão
func (a *TelemetryAdapter) TrackSessionStart(ctx context.Context, appID, sessionID, userID string) (string, error) {
	payload := TelemetryPayload{
		SessionID: sessionID,
		EventName: "session.start",
		UserID:    userID,
	}
	data, _ := json.Marshal(payload)
	return a.store.Write(ctx, "telemetry.session_start", appID, string(data))
}

// TrackSessionEnd registra fim de sessão
func (a *TelemetryAdapter) TrackSessionEnd(ctx context.Context, appID, sessionID string, durationMs int64, interactionCount int) (string, error) {
	payload := TelemetryPayload{
		SessionID:        sessionID,
		EventName:        "session.end",
		DurationMs:       durationMs,
		InteractionCount: interactionCount,
	}
	data, _ := json.Marshal(payload)
	return a.store.Write(ctx, "telemetry.session_end", appID, string(data))
}

// AuditAdapter adapta o LocalStore para uso com auditoria
type AuditAdapter struct {
	store *LocalStore
}

// NewAuditAdapter cria um adapter para auditoria
func NewAuditAdapter(store *LocalStore) *AuditAdapter {
	return &AuditAdapter{store: store}
}

// AuditPayload representa um evento de auditoria
type AuditPayload struct {
	Action      string                 `json:"action"`
	ActorID     string                 `json:"actor_id,omitempty"`
	ActorType   string                 `json:"actor_type,omitempty"` // user, system, agent
	ResourceID  string                 `json:"resource_id,omitempty"`
	ResourceType string                `json:"resource_type,omitempty"`
	OldValue    map[string]interface{} `json:"old_value,omitempty"`
	NewValue    map[string]interface{} `json:"new_value,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	IPAddress   string                 `json:"ip_address,omitempty"`
	UserAgent   string                 `json:"user_agent,omitempty"`
}

// Log registra um evento de auditoria localmente
func (a *AuditAdapter) Log(ctx context.Context, appID string, payload AuditPayload) (string, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return a.store.Write(ctx, "audit."+payload.Action, appID, string(data))
}

// RuleExecutionAdapter adapta o LocalStore para execuções de regras
type RuleExecutionAdapter struct {
	store *LocalStore
}

// NewRuleExecutionAdapter cria um adapter para execuções de regras
func NewRuleExecutionAdapter(store *LocalStore) *RuleExecutionAdapter {
	return &RuleExecutionAdapter{store: store}
}

// RuleExecutionPayload representa uma execução de regra
type RuleExecutionPayload struct {
	RuleID       string                 `json:"rule_id"`
	TriggerData  map[string]interface{} `json:"trigger_data,omitempty"`
	ConditionMet bool                   `json:"condition_met"`
	ActionTaken  bool                   `json:"action_taken"`
	ActionResult string                 `json:"action_result,omitempty"`
	Error        string                 `json:"error,omitempty"`
	DurationMs   int64                  `json:"duration_ms"`
}

// Log registra uma execução de regra localmente
func (a *RuleExecutionAdapter) Log(ctx context.Context, appID string, payload RuleExecutionPayload) (string, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return a.store.Write(ctx, "rule.execution", appID, string(data))
}
