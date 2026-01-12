package decision

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// DECISION MODEL
// "O que o sistema DECIDIU, não só o que aconteceu"
// ========================================

// Decision representa uma decisão tomada pelo sistema
type Decision struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	AppID       uuid.UUID  `gorm:"type:uuid;index:idx_decision_app" json:"app_id"`
	
	// Tipo de decisão (hierárquico)
	Type        string     `gorm:"size:100;not null;index:idx_decision_type" json:"type"`
	
	// Resultado da decisão
	Outcome     string     `gorm:"size:50;not null" json:"outcome"`
	
	// Razão da decisão (para auditoria e explainability)
	Reason      string     `gorm:"size:500;not null" json:"reason"`
	ReasonCode  string     `gorm:"size:50" json:"reason_code,omitempty"`
	
	// Contexto da decisão
	UserID      *uuid.UUID `gorm:"type:uuid;index:idx_decision_user" json:"user_id,omitempty"`
	SessionID   *uuid.UUID `gorm:"type:uuid" json:"session_id,omitempty"`
	ResourceID  string     `gorm:"size:100" json:"resource_id,omitempty"`
	ResourceType string    `gorm:"size:50" json:"resource_type,omitempty"`
	
	// O que causou a decisão
	TriggerType string     `gorm:"size:50" json:"trigger_type,omitempty"`
	TriggerID   string     `gorm:"size:100" json:"trigger_id,omitempty"`
	
	// Dados extras
	Context     string     `gorm:"type:text" json:"context,omitempty"`
	Metadata    string     `gorm:"type:text" json:"metadata,omitempty"`
	
	// Impacto
	Severity    string     `gorm:"size:20" json:"severity"`
	Reversible  bool       `json:"reversible"`
	
	// Timestamps
	DecidedAt   time.Time  `gorm:"not null;index:idx_decision_timestamp" json:"decided_at"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	
	CreatedAt   time.Time  `json:"created_at"`
}

func (Decision) TableName() string {
	return "system_decisions"
}

// ========================================
// DECISION TYPES
// ========================================

const (
	// Acesso
	DecisionAccessAllowed    = "access.allowed"
	DecisionAccessDenied     = "access.denied"
	DecisionAccessDeferred   = "access.deferred"
	
	// Pagamento
	DecisionPaymentAllowed   = "payment.allowed"
	DecisionPaymentBlocked   = "payment.blocked"
	DecisionPaymentRetry     = "payment.retry"
	
	// Regras
	DecisionRuleTriggered    = "rule.triggered"
	DecisionRuleSkipped      = "rule.skipped"
	DecisionRuleShadow       = "rule.shadow"
	
	// Kill Switch
	DecisionKillswitchBlock  = "killswitch.block"
	DecisionKillswitchAllow  = "killswitch.allow"
	
	// Segurança
	DecisionSecurityBlock    = "security.block"
	DecisionSecurityQuarantine = "security.quarantine"
	DecisionSecurityEscalate = "security.escalate"
	
	// Invariantes
	DecisionInvariantViolation = "invariant.violation"
	DecisionInvariantRecovery  = "invariant.recovery"
	
	// Rate Limit
	DecisionRateLimitBlock   = "ratelimit.block"
	DecisionRateLimitThrottle = "ratelimit.throttle"
	
	// Agentes
	DecisionAgentAllowed     = "agent.allowed"
	DecisionAgentBlocked     = "agent.blocked"
	DecisionAgentSuspended   = "agent.suspended"
)

// ========================================
// OUTCOMES
// ========================================

const (
	OutcomeAllowed   = "allowed"
	OutcomeBlocked   = "blocked"
	OutcomeDeferred  = "deferred"
	OutcomeEscalated = "escalated"
	OutcomeRetry     = "retry"
)

// ========================================
// TRIGGER TYPES
// ========================================

const (
	TriggerRule       = "rule"
	TriggerInvariant  = "invariant"
	TriggerKillswitch = "killswitch"
	TriggerManual     = "manual"
	TriggerAutomatic  = "automatic"
	TriggerPolicy     = "policy"
)

// ========================================
// SEVERITY
// ========================================

const (
	SeverityLow      = "low"
	SeverityMedium   = "medium"
	SeverityHigh     = "high"
	SeverityCritical = "critical"
)
