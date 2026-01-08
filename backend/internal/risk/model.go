package risk

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// RISK SCORING ENGINE - FASE 17
// "Risco calculável, explicável, defensável"
// ========================================

// RiskLevel níveis de risco
type RiskLevel string

const (
	RiskLevelLow      RiskLevel = "low"      // 0.0 - 0.3
	RiskLevelMedium   RiskLevel = "medium"   // 0.3 - 0.6
	RiskLevelHigh     RiskLevel = "high"     // 0.6 - 0.8
	RiskLevelCritical RiskLevel = "critical" // 0.8 - 1.0
)

// RiskScore representa o score de risco calculado
type RiskScore struct {
	ID           uuid.UUID    `gorm:"type:text;primaryKey" json:"id"`
	AppID        uuid.UUID    `gorm:"type:text;not null;index:idx_risk_app" json:"app_id"`
	AgentID      *uuid.UUID   `gorm:"type:text;index:idx_risk_agent" json:"agent_id,omitempty"`
	Domain       string       `gorm:"type:text" json:"domain,omitempty"` // billing, agents, identity, all
	Score        float64      `gorm:"not null" json:"score"`             // 0.0 a 1.0
	Level        string       `gorm:"type:text;not null" json:"level"`   // low, medium, high, critical
	FactorsJSON  string       `gorm:"type:text" json:"-"`                // JSON serializado
	Factors      []RiskFactor `gorm:"-" json:"factors"`                  // Fatores calculados
	Explanation  string       `gorm:"type:text" json:"explanation"`      // Explicação legível
	CalculatedAt time.Time    `gorm:"not null" json:"calculated_at"`
	ExpiresAt    time.Time    `gorm:"not null" json:"expires_at"` // Score expira e precisa recalcular
	CreatedAt    time.Time    `gorm:"not null" json:"created_at"`
}

func (RiskScore) TableName() string {
	return "risk_scores"
}

// GetLevel retorna o nível baseado no score
func GetLevel(score float64) RiskLevel {
	switch {
	case score >= 0.8:
		return RiskLevelCritical
	case score >= 0.6:
		return RiskLevelHigh
	case score >= 0.3:
		return RiskLevelMedium
	default:
		return RiskLevelLow
	}
}

// ========================================
// RISK FACTORS
// ========================================

// RiskFactor representa um fator individual de risco
type RiskFactor struct {
	Name        string  `json:"name"`        // Identificador único
	Description string  `json:"description"` // Descrição legível
	Weight      float64 `json:"weight"`      // Peso no cálculo (0.0 - 1.0)
	Value       float64 `json:"value"`       // Valor atual (0.0 - 1.0)
	Threshold   float64 `json:"threshold"`   // Limite aceitável
	Exceeded    bool    `json:"exceeded"`    // Passou do limite?
	Source      string  `json:"source"`      // De onde veio o dado
	RawData     any     `json:"raw_data,omitempty"` // Dados brutos para debug
}

// FactorName constantes para nomes de fatores
const (
	FactorApprovalRate     = "approval_rate"      // Taxa de aprovação histórica
	FactorRejectionHistory = "rejection_history"  // Quantidade de rejeições recentes
	FactorVolumeSpike      = "volume_spike"       // Aumento súbito de decisões
	FactorShadowModeRatio  = "shadow_mode_ratio"  // % de ações em shadow mode
	FactorTimePattern      = "time_pattern"       // Horário incomum de atividade
)

// DefaultFactorWeights pesos padrão dos fatores
var DefaultFactorWeights = map[string]float64{
	FactorApprovalRate:     0.30, // 30%
	FactorRejectionHistory: 0.20, // 20%
	FactorVolumeSpike:      0.20, // 20%
	FactorShadowModeRatio:  0.15, // 15%
	FactorTimePattern:      0.15, // 15%
}

// DefaultFactorThresholds thresholds padrão
var DefaultFactorThresholds = map[string]float64{
	FactorApprovalRate:     0.7,  // Abaixo de 70% aprovação = risco
	FactorRejectionHistory: 0.3,  // Acima de 30% rejeição = risco
	FactorVolumeSpike:      2.0,  // 2x o volume normal = risco
	FactorShadowModeRatio:  0.5,  // Acima de 50% em shadow = risco
	FactorTimePattern:      0.3,  // 30% fora do horário normal = risco
}

// ========================================
// RISK CALCULATION REQUEST/RESPONSE
// ========================================

// CalculateRiskRequest request para calcular risco
type CalculateRiskRequest struct {
	AppID   uuid.UUID  `json:"app_id" binding:"required"`
	AgentID *uuid.UUID `json:"agent_id,omitempty"`
	Domain  string     `json:"domain,omitempty"` // Se vazio, calcula para todos
}

// RiskResponse resposta com score e explicação
type RiskResponse struct {
	AppID       uuid.UUID    `json:"app_id"`
	AgentID     *uuid.UUID   `json:"agent_id,omitempty"`
	Score       float64      `json:"score"`
	Level       RiskLevel    `json:"level"`
	Factors     []RiskFactor `json:"factors"`
	Explanation string       `json:"explanation"`
	CalculatedAt time.Time   `json:"calculated_at"`
	CachedUntil  time.Time   `json:"cached_until"`
}

// ========================================
// RISK HISTORY (para análise de tendência)
// ========================================

// RiskHistory histórico de scores para análise
type RiskHistory struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID        uuid.UUID `gorm:"type:text;not null;index:idx_riskhist_app" json:"app_id"`
	Score        float64   `gorm:"not null" json:"score"`
	Level        string    `gorm:"type:text;not null" json:"level"`
	FactorsJSON  string    `gorm:"type:text" json:"factors_json"`
	CalculatedAt time.Time `gorm:"not null;index:idx_riskhist_time" json:"calculated_at"`
}

func (RiskHistory) TableName() string {
	return "risk_history"
}

// ========================================
// RISK CONFIG (configuração por app)
// ========================================

// RiskConfig configuração de risco por app (opcional)
type RiskConfig struct {
	ID              uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID           uuid.UUID `gorm:"type:text;not null;uniqueIndex" json:"app_id"`
	CustomWeights   string    `gorm:"type:text" json:"custom_weights,omitempty"`   // JSON
	CustomThresholds string   `gorm:"type:text" json:"custom_thresholds,omitempty"` // JSON
	Enabled         bool      `gorm:"default:true" json:"enabled"`
	CreatedAt       time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (RiskConfig) TableName() string {
	return "risk_configs"
}
