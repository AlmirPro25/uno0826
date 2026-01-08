package agent

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// AGENT GOVERNANCE LAYER
// "Agentes não executam dinheiro. Agentes solicitam transições de estado."
// ========================================

// AgentType tipo de agente
type AgentType string

const (
	AgentTypeObserver AgentType = "observer" // Só observa, não age
	AgentTypeOperator AgentType = "operator" // Pode propor ações
	AgentTypeExecutor AgentType = "executor" // Pode executar ações aprovadas
)

// AgentStatus status do agente
type AgentStatus string

const (
	AgentStatusActive    AgentStatus = "active"
	AgentStatusSuspended AgentStatus = "suspended"
)

// Agent representa uma entidade autônoma no sistema
type Agent struct {
	ID          uuid.UUID  `gorm:"type:text;primaryKey" json:"id"`
	TenantID    uuid.UUID  `gorm:"type:text;not null;index:idx_agent_tenant" json:"tenant_id"`
	AppID       *uuid.UUID `gorm:"type:text;index:idx_agent_app" json:"app_id,omitempty"` // Fase 16: qual app criou este agente
	Name        string     `gorm:"type:text;not null" json:"name"`
	Description string     `gorm:"type:text" json:"description"`
	Type        string     `gorm:"type:text;not null" json:"type"` // observer, operator, executor
	Status      string     `gorm:"type:text;not null;default:'active'" json:"status"`
	Metadata    string     `gorm:"type:text" json:"metadata,omitempty"` // JSON com config extra
	CreatedAt   time.Time  `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (Agent) TableName() string {
	return "agents"
}

// ========================================
// AGENT POLICY
// ========================================

// PolicyDomain domínio de atuação
type PolicyDomain string

const (
	DomainAds           PolicyDomain = "ads"
	DomainBilling       PolicyDomain = "billing"
	DomainSubscriptions PolicyDomain = "subscriptions"
	DomainLedger        PolicyDomain = "ledger"
	DomainIdentity      PolicyDomain = "identity"
)

// AgentPolicy define o que um agente pode fazer
type AgentPolicy struct {
	ID               uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AgentID          uuid.UUID `gorm:"type:text;not null;index:idx_policy_agent" json:"agent_id"`
	Domain           string    `gorm:"type:text;not null" json:"domain"` // ads, billing, etc
	MaxAmount        int64     `gorm:"default:0" json:"max_amount"`      // Limite financeiro (0 = sem limite de valor, mas pode ter outras restrições)
	AllowedActions   string    `gorm:"type:text;not null" json:"allowed_actions"` // JSON array: ["pause_campaign", "adjust_bid"]
	ForbiddenActions string    `gorm:"type:text" json:"forbidden_actions,omitempty"` // JSON array de ações explicitamente proibidas
	RequiresApproval bool      `gorm:"default:true" json:"requires_approval"`
	MaxRiskScore     float64   `gorm:"default:0.2" json:"max_risk_score"` // Acima disso, precisa aprovação
	DailyLimit       int       `gorm:"default:100" json:"daily_limit"`    // Máximo de ações por dia
	CreatedAt        time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (AgentPolicy) TableName() string {
	return "agent_policies"
}

// ========================================
// AGENT DECISION
// ========================================

// DecisionStatus status da decisão
type DecisionStatus string

const (
	DecisionProposed DecisionStatus = "proposed"
	DecisionApproved DecisionStatus = "approved"
	DecisionRejected DecisionStatus = "rejected"
	DecisionExecuted DecisionStatus = "executed"
	DecisionFailed   DecisionStatus = "failed"
	DecisionExpired  DecisionStatus = "expired"
)

// AgentDecision tudo que o agente decide vira dado
type AgentDecision struct {
	ID             uuid.UUID  `gorm:"type:text;primaryKey" json:"id"`
	AgentID        uuid.UUID  `gorm:"type:text;not null;index:idx_decision_agent" json:"agent_id"`
	TenantID       uuid.UUID  `gorm:"type:text;not null;index:idx_decision_tenant" json:"tenant_id"`
	AppID          *uuid.UUID `gorm:"type:text;index:idx_decision_app" json:"app_id,omitempty"`       // Fase 16: qual app originou
	OriginApp      string     `gorm:"type:text" json:"origin_app,omitempty"`                          // Fase 16: nome do app para referência
	Domain         string     `gorm:"type:text;not null" json:"domain"`
	ProposedAction string     `gorm:"type:text;not null" json:"proposed_action"`
	TargetEntity   string     `gorm:"type:text;not null" json:"target_entity"` // Ex: "campaign:uuid"
	Payload        string     `gorm:"type:text;not null" json:"payload"`       // JSON com detalhes
	Reason         string     `gorm:"type:text" json:"reason"`
	RiskScore      float64    `gorm:"not null" json:"risk_score"`
	Status         string     `gorm:"type:text;not null;default:'proposed'" json:"status"`
	ReviewedBy     *uuid.UUID `gorm:"type:text" json:"reviewed_by,omitempty"` // Humano que aprovou/rejeitou
	ReviewNote     string     `gorm:"type:text" json:"review_note,omitempty"`
	ExpiresAt      time.Time  `gorm:"not null" json:"expires_at"` // Decisões expiram
	CreatedAt      time.Time  `gorm:"not null" json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (AgentDecision) TableName() string {
	return "agent_decisions"
}

// ========================================
// AGENT EXECUTION LOG
// ========================================

// ExecutedBy quem executou
type ExecutedBy string

const (
	ExecutedByAgent ExecutedBy = "agent"
	ExecutedByHuman ExecutedBy = "human"
)

// AgentExecutionLog registro final, imutável
type AgentExecutionLog struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	DecisionID  uuid.UUID `gorm:"type:text;not null;index:idx_exec_decision" json:"decision_id"`
	AgentID     uuid.UUID `gorm:"type:text;not null;index:idx_exec_agent" json:"agent_id"`
	TenantID    uuid.UUID `gorm:"type:text;not null;index:idx_exec_tenant" json:"tenant_id"`
	ExecutedBy  string    `gorm:"type:text;not null" json:"executed_by"` // agent, human
	Action      string    `gorm:"type:text;not null" json:"action"`
	Target      string    `gorm:"type:text;not null" json:"target"`
	Result      string    `gorm:"type:text;not null" json:"result"` // success, failed
	ResultData  string    `gorm:"type:text" json:"result_data,omitempty"` // JSON com detalhes
	ErrorMsg    string    `gorm:"type:text" json:"error_msg,omitempty"`
	ExecutedAt  time.Time `gorm:"not null" json:"executed_at"`
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
}

func (AgentExecutionLog) TableName() string {
	return "agent_execution_logs"
}

// ========================================
// AGENT DAILY STATS (para rate limiting)
// ========================================

// AgentDailyStats contagem diária de ações
type AgentDailyStats struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AgentID      uuid.UUID `gorm:"type:text;not null;index:idx_daily_agent" json:"agent_id"`
	Date         string    `gorm:"type:text;not null;index:idx_daily_date" json:"date"` // YYYY-MM-DD
	ActionsCount int       `gorm:"default:0" json:"actions_count"`
	ApprovedCount int      `gorm:"default:0" json:"approved_count"`
	RejectedCount int      `gorm:"default:0" json:"rejected_count"`
	ExecutedCount int      `gorm:"default:0" json:"executed_count"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (AgentDailyStats) TableName() string {
	return "agent_daily_stats"
}

// ========================================
// PREDEFINED ACTIONS
// ========================================

// AgentAction ações que agentes podem propor
type AgentAction string

const (
	// Ads Domain
	ActionPauseCampaign   AgentAction = "pause_campaign"
	ActionResumeCampaign  AgentAction = "resume_campaign"
	ActionAdjustBid       AgentAction = "adjust_bid"
	ActionSuggestRefill   AgentAction = "suggest_refill"
	
	// Billing Domain
	ActionFlagSuspicious  AgentAction = "flag_suspicious"
	ActionSuggestReview   AgentAction = "suggest_review"
	
	// Subscriptions Domain
	ActionSuggestCancel   AgentAction = "suggest_cancel"
	ActionSuggestUpgrade  AgentAction = "suggest_upgrade"
	
	// NUNCA permitido para agentes
	ActionDebitLedger     AgentAction = "debit_ledger"     // FORBIDDEN
	ActionCreditLedger    AgentAction = "credit_ledger"    // FORBIDDEN
	ActionResolveDisputed AgentAction = "resolve_disputed" // FORBIDDEN
	ActionDeleteIdentity  AgentAction = "delete_identity"  // FORBIDDEN
)

// IsForbiddenAction verifica se ação é proibida para agentes
func IsForbiddenAction(action string) bool {
	forbidden := map[string]bool{
		string(ActionDebitLedger):     true,
		string(ActionCreditLedger):    true,
		string(ActionResolveDisputed): true,
		string(ActionDeleteIdentity):  true,
	}
	return forbidden[action]
}
