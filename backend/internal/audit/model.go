package audit

import (
	"crypto/sha256"
	"database/sql/driver"
	"encoding/hex"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ========================================
// AUDIT LOG - EVENT LOG IMUTÁVEL
// "Append-only, nunca deletar, sempre explicar"
// ========================================

// EventType - tipos de eventos do sistema
const (
	// Identity
	EventUserCreated     = "USER_CREATED"
	EventUserSuspended   = "USER_SUSPENDED"
	EventUserBanned      = "USER_BANNED"
	EventUserReactivated = "USER_REACTIVATED"
	EventRoleChanged     = "ROLE_CHANGED"
	EventLoginSuccess    = "LOGIN_SUCCESS"
	EventLoginFailed     = "LOGIN_FAILED"

	// Billing
	EventPaymentCreated   = "PAYMENT_CREATED"
	EventPaymentConfirmed = "PAYMENT_CONFIRMED"
	EventPaymentFailed    = "PAYMENT_FAILED"
	EventPaymentDisputed  = "PAYMENT_DISPUTED"
	EventLedgerCredit     = "LEDGER_CREDIT"
	EventLedgerDebit      = "LEDGER_DEBIT"
	EventSubscriptionCreated  = "SUBSCRIPTION_CREATED"
	EventSubscriptionCanceled = "SUBSCRIPTION_CANCELED"

	// Agent
	EventAgentDecisionProposed = "AGENT_DECISION_PROPOSED"
	EventAgentDecisionApproved = "AGENT_DECISION_APPROVED"
	EventAgentDecisionRejected = "AGENT_DECISION_REJECTED"
	EventAgentDecisionExecuted = "AGENT_DECISION_EXECUTED"

	// Governance
	EventPolicyCreated       = "POLICY_CREATED"
	EventPolicyUpdated       = "POLICY_UPDATED"
	EventPolicyDeactivated   = "POLICY_DEACTIVATED"
	EventPolicyEvaluated     = "POLICY_EVALUATED"
	EventDisputeOpened       = "DISPUTE_OPENED"
	EventDisputeResolved     = "DISPUTE_RESOLVED"
	EventKillSwitchActivated = "KILL_SWITCH_ACTIVATED"
	EventKillSwitchDeactivated = "KILL_SWITCH_DEACTIVATED"

	// Ads
	EventCampaignCreated = "CAMPAIGN_CREATED"
	EventCampaignPaused  = "CAMPAIGN_PAUSED"
	EventCampaignResumed = "CAMPAIGN_RESUMED"
	EventAdSpend         = "AD_SPEND"
)

// ActorType - tipos de atores
const (
	ActorUser   = "user"
	ActorAgent  = "agent"
	ActorSystem = "system"
	ActorAdmin  = "admin"
)

// AuditEvent - evento imutável
type AuditEvent struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Sequence     int64     `gorm:"autoIncrement;uniqueIndex" json:"sequence"` // ordem global
	Type         string    `gorm:"size:50;index" json:"type"`
	
	// ========================================
	// APP CONTEXT - Fase 16
	// "Este evento aconteceu em qual aplicativo?"
	// ========================================
	AppID        *uuid.UUID `gorm:"type:uuid;index:idx_audit_app" json:"app_id,omitempty"`
	AppUserID    *uuid.UUID `gorm:"type:uuid;index" json:"app_user_id,omitempty"`
	SessionID    *uuid.UUID `gorm:"type:uuid" json:"session_id,omitempty"`
	
	// Quem fez
	ActorID      uuid.UUID `gorm:"type:uuid;index" json:"actor_id"`
	ActorType    string    `gorm:"size:20" json:"actor_type"` // user, agent, system, admin, human
	
	// O que foi afetado
	TargetID     uuid.UUID `gorm:"type:uuid;index" json:"target_id"`
	TargetType   string    `gorm:"size:50" json:"target_type"` // user, payment, ledger, etc
	
	// Detalhes
	Action       string    `gorm:"size:50" json:"action"`
	Before       JSONData  `gorm:"type:text" json:"before,omitempty"`  // estado anterior
	After        JSONData  `gorm:"type:text" json:"after,omitempty"`   // estado posterior
	Metadata     JSONData  `gorm:"type:text" json:"metadata,omitempty"` // contexto adicional
	
	// Governança
	PolicyID     *uuid.UUID `gorm:"type:uuid" json:"policy_id,omitempty"`
	Reason       string     `gorm:"size:500" json:"reason"`
	
	// Rastreamento
	IP           string    `gorm:"size:50" json:"ip,omitempty"`
	UserAgent    string    `gorm:"size:500" json:"user_agent,omitempty"`
	
	// Integridade
	PreviousHash string    `gorm:"size:64" json:"previous_hash"` // hash do evento anterior
	Hash         string    `gorm:"size:64;uniqueIndex" json:"hash"` // hash deste evento
	
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

// JSONData para serialização
type JSONData map[string]any

func (j JSONData) Value() (driver.Value, error) {
	if j == nil {
		return "{}", nil
	}
	bytes, err := json.Marshal(j)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

func (j *JSONData) Scan(value any) error {
	if value == nil {
		*j = make(map[string]any)
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		str, ok := value.(string)
		if !ok {
			*j = make(map[string]any)
			return nil
		}
		bytes = []byte(str)
	}
	return json.Unmarshal(bytes, j)
}

// TableName for AuditEvent
func (AuditEvent) TableName() string {
	return "audit_events"
}

// ComputeHash calcula o hash do evento (inclui app_id para integridade multi-tenant)
func (e *AuditEvent) ComputeHash() string {
	appIDStr := ""
	if e.AppID != nil {
		appIDStr = e.AppID.String()
	}
	
	data := struct {
		ID           string
		Type         string
		AppID        string
		ActorID      string
		TargetID     string
		Action       string
		PreviousHash string
		CreatedAt    string
	}{
		ID:           e.ID.String(),
		Type:         e.Type,
		AppID:        appIDStr,
		ActorID:      e.ActorID.String(),
		TargetID:     e.TargetID.String(),
		Action:       e.Action,
		PreviousHash: e.PreviousHash,
		CreatedAt:    e.CreatedAt.Format(time.RFC3339Nano),
	}
	
	bytes, _ := json.Marshal(data)
	hash := sha256.Sum256(bytes)
	return hex.EncodeToString(hash[:])
}

// AuditQuery - filtros para busca
type AuditQuery struct {
	AppID      string    `form:"app_id"`      // Fase 16: filtrar por app
	Type       string    `form:"type"`
	ActorID    string    `form:"actor_id"`
	TargetID   string    `form:"target_id"`
	TargetType string    `form:"target_type"`
	StartDate  time.Time `form:"start_date"`
	EndDate    time.Time `form:"end_date"`
	Limit      int       `form:"limit"`
	Offset     int       `form:"offset"`
}

// ========================================
// AUDIT CONTEXT - Fase 16
// "Contexto completo para criar eventos"
// ========================================

// AuditContext carrega o contexto de app para criação de eventos
type AuditContext struct {
	AppID     *uuid.UUID
	AppUserID *uuid.UUID
	SessionID *uuid.UUID
	IP        string
	UserAgent string
}
