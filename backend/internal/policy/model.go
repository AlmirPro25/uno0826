package policy

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ========================================
// POLICY ENGINE - MOTOR DE REGRAS VIVO
// "Decisões explicáveis, não if/else"
// ========================================

// Policy - regra declarativa versionada
type Policy struct {
	ID          uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string          `gorm:"size:100;uniqueIndex" json:"name"`
	Description string          `gorm:"size:500" json:"description"`
	Version     int             `gorm:"default:1" json:"version"`
	Resource    string          `gorm:"size:50;index" json:"resource"`  // ledger, agent, identity, ads, *
	Action      string          `gorm:"size:50;index" json:"action"`    // debit, credit, execute, delete, *
	Conditions  ConditionList   `gorm:"type:text" json:"conditions"`    // JSON array
	Effect      string          `gorm:"size:20" json:"effect"`          // allow, deny, require_approval
	Reason      string          `gorm:"size:500" json:"reason"`         // explicação humana
	Priority    int             `gorm:"default:100" json:"priority"`    // maior = avaliado primeiro
	Active      bool            `gorm:"default:true" json:"active"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	CreatedBy   uuid.UUID       `gorm:"type:uuid" json:"created_by"`
}

// Condition - condição de uma policy
type Condition struct {
	Field    string `json:"field"`    // amount, user.role, risk_score
	Operator string `json:"operator"` // eq, ne, gt, gte, lt, lte, in, not_in, contains
	Value    any    `json:"value"`    // valor para comparar
}

// ConditionList para serialização GORM
type ConditionList []Condition

func (c ConditionList) Value() (driver.Value, error) {
	if c == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal(c)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

func (c *ConditionList) Scan(value any) error {
	if value == nil {
		*c = []Condition{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		*c = []Condition{}
		return nil
	}
	return json.Unmarshal(bytes, c)
}

// PolicyEffect - efeitos possíveis
const (
	EffectAllow           = "allow"
	EffectDeny            = "deny"
	EffectRequireApproval = "require_approval"
)

// PolicyResource - recursos controlados
const (
	ResourceAll      = "*"
	ResourceLedger   = "ledger"
	ResourceAgent    = "agent"
	ResourceIdentity = "identity"
	ResourceAds      = "ads"
	ResourcePayment  = "payment"
)

// PolicyAction - ações controladas
const (
	ActionAll      = "*"
	ActionDebit    = "debit"
	ActionCredit   = "credit"
	ActionExecute  = "execute"
	ActionDelete   = "delete"
	ActionSuspend  = "suspend"
	ActionApprove  = "approve"
	ActionReject   = "reject"
)

// ConditionOperator - operadores de comparação
const (
	OpEqual       = "eq"
	OpNotEqual    = "ne"
	OpGreaterThan = "gt"
	OpGreaterOrEq = "gte"
	OpLessThan    = "lt"
	OpLessOrEq    = "lte"
	OpIn          = "in"
	OpNotIn       = "not_in"
	OpContains    = "contains"
)

// PolicyEvaluation - resultado de avaliação
type PolicyEvaluation struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	PolicyID     *uuid.UUID     `gorm:"type:uuid;index" json:"policy_id"`
	PolicyName   string         `gorm:"size:100" json:"policy_name"`
	Resource     string         `gorm:"size:50" json:"resource"`
	Action       string         `gorm:"size:50" json:"action"`
	Context      JSONMap        `gorm:"type:text" json:"context"`       // dados avaliados
	Result       string         `gorm:"size:20" json:"result"`          // allowed, denied, pending_approval
	Reason       string         `gorm:"size:500" json:"reason"`         // explicação
	ActorID      uuid.UUID      `gorm:"type:uuid;index" json:"actor_id"`
	ActorType    string         `gorm:"size:20" json:"actor_type"`      // user, agent, system
	EvaluatedAt  time.Time      `json:"evaluated_at"`
}

// EvaluationResult - resultado da avaliação
const (
	ResultAllowed         = "allowed"
	ResultDenied          = "denied"
	ResultPendingApproval = "pending_approval"
)

// JSONMap para serialização de mapas
type JSONMap map[string]any

func (j JSONMap) Value() (any, error) {
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value any) error {
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

// TableName for Policy
func (Policy) TableName() string {
	return "policies"
}

// TableName for PolicyEvaluation
func (PolicyEvaluation) TableName() string {
	return "policy_evaluations"
}

// EvaluationRequest - request para avaliar uma ação
type EvaluationRequest struct {
	Resource  string         `json:"resource" binding:"required"`
	Action    string         `json:"action" binding:"required"`
	Context   map[string]any `json:"context" binding:"required"`
	ActorID   uuid.UUID      `json:"actor_id"`
	ActorType string         `json:"actor_type"`
}

// EvaluationResponse - resposta da avaliação
type EvaluationResponse struct {
	Allowed      bool    `json:"allowed"`
	Result       string  `json:"result"`
	EvaluationID *string `json:"evaluation_id,omitempty"` // ID para timeline
	PolicyID     *string `json:"policy_id,omitempty"`
	PolicyName   *string `json:"policy_name,omitempty"`
	Reason       string  `json:"reason"`
	
	// Threshold recommendation (integração passiva - Fase 17)
	// Thresholds influenciam, não decidem
	ThresholdRecommendation *ThresholdRecommendationInfo `json:"threshold_recommendation,omitempty"`
}

// ThresholdRecommendationInfo informação de recomendação de threshold
type ThresholdRecommendationInfo struct {
	ThresholdID       *string `json:"threshold_id,omitempty"`
	RecommendedAction string  `json:"recommended_action"`
	RiskLevel         string  `json:"risk_level,omitempty"`
	RiskScore         float64 `json:"risk_score,omitempty"`
	Reason            string  `json:"reason"`
	IsDefault         bool    `json:"is_default"`
}
