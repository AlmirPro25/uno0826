package explainability

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ========================================
// DECISION TIMELINE - FASE 18 STEP 1
// "Timeline é registro, não julgamento"
// ========================================

// DecisionTimeline registra o estado completo de uma decisão
// Entidade de primeira classe - não log solto
type DecisionTimeline struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	DecisionID   uuid.UUID `gorm:"type:text;not null;uniqueIndex" json:"decision_id"`
	DecisionType string    `gorm:"type:text;not null;index" json:"decision_type"` // policy_eval, agent_decision, approval

	// ========================================
	// CONTEXTO - Quem, onde, quando
	// ========================================
	Timestamp time.Time  `gorm:"not null;index" json:"timestamp"`
	AppID     *uuid.UUID `gorm:"type:text;index" json:"app_id,omitempty"`
	ActorID   uuid.UUID  `gorm:"type:text;not null" json:"actor_id"`
	ActorType string     `gorm:"type:text;not null" json:"actor_type"` // user, agent, system
	SessionID *string    `gorm:"type:text" json:"session_id,omitempty"`

	// ========================================
	// O QUE FOI AVALIADO
	// ========================================
	Resource string  `gorm:"type:text;not null" json:"resource"` // agent, ledger, payment
	Action   string  `gorm:"type:text;not null" json:"action"`   // execute, debit, create
	Context  JSONMap `gorm:"type:text" json:"context"`           // Dados no momento

	// ========================================
	// ESTADO DE RISCO NO MOMENTO
	// ========================================
	RiskScore   float64           `gorm:"not null;default:0" json:"risk_score"`
	RiskLevel   string            `gorm:"type:text" json:"risk_level"` // low, medium, high, critical
	RiskFactors RiskFactorList    `gorm:"type:text" json:"risk_factors"`

	// ========================================
	// AVALIAÇÃO - Policy
	// ========================================
	PolicyID     *uuid.UUID `gorm:"type:text" json:"policy_id,omitempty"`
	PolicyName   string     `gorm:"type:text" json:"policy_name"`
	PolicyResult string     `gorm:"type:text;not null" json:"policy_result"` // allowed, denied, pending_approval
	PolicyReason string     `gorm:"type:text" json:"policy_reason"`

	// ========================================
	// AVALIAÇÃO - Threshold (conselho)
	// ========================================
	ThresholdID     *uuid.UUID `gorm:"type:text" json:"threshold_id,omitempty"`
	ThresholdAction string     `gorm:"type:text" json:"threshold_action"` // allow, require_approval, shadow, block
	ThresholdReason string     `gorm:"type:text" json:"threshold_reason"`

	// ========================================
	// RESULTADO FINAL
	// ========================================
	FinalOutcome  string `gorm:"type:text;not null" json:"final_outcome"` // allowed, denied, pending
	HasDivergence bool   `gorm:"not null;default:false" json:"has_divergence"`
	DivergenceNote string `gorm:"type:text" json:"divergence_note,omitempty"`

	// ========================================
	// METADADOS
	// ========================================
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
}

func (DecisionTimeline) TableName() string {
	return "decision_timelines"
}

// ========================================
// TIPOS AUXILIARES
// ========================================

// RiskFactorSnapshot snapshot de um fator de risco no momento da decisão
type RiskFactorSnapshot struct {
	Name     string  `json:"name"`
	Value    float64 `json:"value"`
	Weight   float64 `json:"weight"`
	Exceeded bool    `json:"exceeded"`
}

// RiskFactorList para serialização GORM
type RiskFactorList []RiskFactorSnapshot

func (r RiskFactorList) Value() (driver.Value, error) {
	if r == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal(r)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

func (r *RiskFactorList) Scan(value any) error {
	if value == nil {
		*r = []RiskFactorSnapshot{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		*r = []RiskFactorSnapshot{}
		return nil
	}
	return json.Unmarshal(bytes, r)
}

// JSONMap para serialização de mapas
type JSONMap map[string]any

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return "{}", nil
	}
	bytes, err := json.Marshal(j)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

func (j *JSONMap) Scan(value any) error {
	if value == nil {
		*j = make(map[string]any)
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		*j = make(map[string]any)
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// ========================================
// DTOs
// ========================================

// TimelineQuery parâmetros de busca
type TimelineQuery struct {
	AppID        *uuid.UUID `json:"app_id,omitempty"`
	ActorID      *uuid.UUID `json:"actor_id,omitempty"`
	DecisionType string     `json:"decision_type,omitempty"`
	Outcome      string     `json:"outcome,omitempty"`
	OnlyDivergent bool      `json:"only_divergent,omitempty"`
	StartDate    *time.Time `json:"start_date,omitempty"`
	EndDate      *time.Time `json:"end_date,omitempty"`
	Limit        int        `json:"limit,omitempty"`
	Offset       int        `json:"offset,omitempty"`
}

// TimelineResponse resposta de timeline
type TimelineResponse struct {
	Timeline    *DecisionTimeline `json:"timeline"`
	DecisionID  uuid.UUID         `json:"decision_id"`
}

// TimelineListResponse lista de timelines
type TimelineListResponse struct {
	Timelines []DecisionTimeline `json:"timelines"`
	Total     int64              `json:"total"`
	Query     TimelineQuery      `json:"query"`
}
