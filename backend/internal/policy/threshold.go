package policy

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// POLICY THRESHOLDS - FASE 17 STEP 2
// "Thresholds influenciam decisões, não executam ações"
// ========================================

// ThresholdAction ações que um threshold pode recomendar
type ThresholdAction string

const (
	ThresholdActionAllow           ThresholdAction = "allow"            // Permitir sem restrições
	ThresholdActionRequireApproval ThresholdAction = "require_approval" // Exigir aprovação humana
	ThresholdActionShadow          ThresholdAction = "shadow"           // Executar em shadow mode
	ThresholdActionBlock           ThresholdAction = "block"            // Bloquear ação
)

// PolicyThreshold define comportamento baseado em nível de risco
// Thresholds são:
// - Por policy (obrigatório)
// - Opcionalmente por app (se nil = global para a policy)
// - Nunca "one size fits all"
type PolicyThreshold struct {
	ID          uuid.UUID       `gorm:"type:text;primaryKey" json:"id"`
	PolicyID    uuid.UUID       `gorm:"type:text;not null;index:idx_threshold_policy" json:"policy_id"`
	AppID       *uuid.UUID      `gorm:"type:text;index:idx_threshold_app" json:"app_id,omitempty"` // nil = global
	
	// Configuração por nível de risco
	RiskLevel   string          `gorm:"type:text;not null" json:"risk_level"` // low, medium, high, critical
	Action      ThresholdAction `gorm:"type:text;not null" json:"action"`     // allow, require_approval, shadow, block
	
	// Metadados
	Description string          `gorm:"type:text" json:"description,omitempty"`
	Active      bool            `gorm:"default:true" json:"active"`
	
	// Auditoria
	CreatedBy   uuid.UUID       `gorm:"type:text;not null" json:"created_by"`
	CreatedAt   time.Time       `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

func (PolicyThreshold) TableName() string {
	return "policy_thresholds"
}

// ThresholdAdjustment registra histórico de ajustes
// Ajustes são sempre versionados e reversíveis
type ThresholdAdjustment struct {
	ID            uuid.UUID       `gorm:"type:text;primaryKey" json:"id"`
	ThresholdID   uuid.UUID       `gorm:"type:text;not null;index:idx_adjustment_threshold" json:"threshold_id"`
	
	// O que mudou
	PreviousAction ThresholdAction `gorm:"type:text;not null" json:"previous_action"`
	NewAction      ThresholdAction `gorm:"type:text;not null" json:"new_action"`
	
	// Por que mudou
	Reason        string          `gorm:"type:text;not null" json:"reason"`
	TriggerType   string          `gorm:"type:text;not null" json:"trigger_type"` // manual, automatic, system
	
	// Contexto do ajuste automático (se aplicável)
	RiskScoreAtAdjustment float64 `gorm:"default:0" json:"risk_score_at_adjustment,omitempty"`
	DaysAnalyzed          int     `gorm:"default:0" json:"days_analyzed,omitempty"`
	
	// Quem ajustou
	AdjustedBy    string          `gorm:"type:text;not null" json:"adjusted_by"` // user_id ou "system"
	
	// Reversibilidade
	Reverted      bool            `gorm:"default:false" json:"reverted"`
	RevertedAt    *time.Time      `json:"reverted_at,omitempty"`
	RevertedBy    *string         `gorm:"type:text" json:"reverted_by,omitempty"`
	RevertReason  string          `gorm:"type:text" json:"revert_reason,omitempty"`
	
	// Timestamp
	CreatedAt     time.Time       `gorm:"not null" json:"created_at"`
}

func (ThresholdAdjustment) TableName() string {
	return "threshold_adjustments"
}

// ========================================
// DTOs
// ========================================

// CreateThresholdRequest request para criar threshold
type CreateThresholdRequest struct {
	PolicyID    uuid.UUID       `json:"policy_id" binding:"required"`
	AppID       *uuid.UUID      `json:"app_id,omitempty"`
	RiskLevel   string          `json:"risk_level" binding:"required"` // low, medium, high, critical
	Action      ThresholdAction `json:"action" binding:"required"`
	Description string          `json:"description,omitempty"`
}

// UpdateThresholdRequest request para atualizar threshold
type UpdateThresholdRequest struct {
	Action      ThresholdAction `json:"action" binding:"required"`
	Reason      string          `json:"reason" binding:"required,min=10"`
	Description string          `json:"description,omitempty"`
}

// ThresholdRecommendation recomendação baseada em threshold
type ThresholdRecommendation struct {
	ThresholdID   *uuid.UUID      `json:"threshold_id,omitempty"`
	PolicyID      uuid.UUID       `json:"policy_id"`
	AppID         *uuid.UUID      `json:"app_id,omitempty"`
	RiskLevel     string          `json:"risk_level"`
	RiskScore     float64         `json:"risk_score"`
	Action        ThresholdAction `json:"recommended_action"`
	Reason        string          `json:"reason"`
	IsDefault     bool            `json:"is_default"` // true se usou threshold padrão
}

// ========================================
// DEFAULT THRESHOLDS
// ========================================

// DefaultThresholds thresholds padrão por nível de risco
// Usados quando não há threshold específico configurado
var DefaultThresholds = map[string]ThresholdAction{
	"low":      ThresholdActionAllow,           // Risco baixo = permitir
	"medium":   ThresholdActionRequireApproval, // Risco médio = aprovar
	"high":     ThresholdActionShadow,          // Risco alto = shadow mode
	"critical": ThresholdActionBlock,           // Risco crítico = bloquear
}

// GetDefaultAction retorna ação padrão para um nível de risco
func GetDefaultAction(riskLevel string) ThresholdAction {
	if action, ok := DefaultThresholds[riskLevel]; ok {
		return action
	}
	return ThresholdActionRequireApproval // Fallback seguro
}
