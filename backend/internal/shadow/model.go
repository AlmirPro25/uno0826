package shadow

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// SHADOW MODE - SIMULAÇÃO SEM EXECUÇÃO
// "Você pode tentar, mas o mundo não muda"
// ========================================

// ShadowExecution - registro de execução em shadow mode
// Responde às 3 perguntas obrigatórias:
// 1. O que o agente quis fazer?
// 2. O que teria acontecido?
// 3. Por que não aconteceu?
type ShadowExecution struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// Contexto
	AgentID   uuid.UUID `gorm:"type:uuid;index" json:"agent_id"`
	Domain    string    `gorm:"size:50" json:"domain"`
	Action    string    `gorm:"size:100" json:"action"`
	
	// 1. O que o agente quis fazer?
	Intent    ShadowIntent `gorm:"type:text;serializer:json" json:"intent"`
	
	// 2. O que teria acontecido?
	Simulation ShadowSimulation `gorm:"type:text;serializer:json" json:"simulation"`
	
	// 3. Por que não aconteceu?
	Reason    string `gorm:"size:500" json:"reason"`
	
	// Metadados
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

// TableName for ShadowExecution
func (ShadowExecution) TableName() string {
	return "shadow_executions"
}

// ShadowIntent - O que o agente quis fazer
type ShadowIntent struct {
	Action       string         `json:"action"`
	TargetEntity string         `json:"target_entity"`
	Amount       int64          `json:"amount,omitempty"`
	Payload      map[string]any `json:"payload,omitempty"`
	Reason       string         `json:"reason"`
}

// ShadowSimulation - O que teria acontecido
type ShadowSimulation struct {
	// Resultado hipotético
	WouldExecute    bool   `json:"would_execute"`
	WouldSucceed    bool   `json:"would_succeed"`
	
	// Impacto estimado
	EstimatedImpact string `json:"estimated_impact"` // none, low, medium, high, critical
	
	// Efeitos que TERIAM acontecido (mas não aconteceram)
	WouldAffect     []string `json:"would_affect,omitempty"`     // IDs que seriam afetados
	WouldDebit      int64    `json:"would_debit,omitempty"`      // valor que seria debitado
	WouldCredit     int64    `json:"would_credit,omitempty"`     // valor que seria creditado
	WouldCreate     []string `json:"would_create,omitempty"`     // entidades que seriam criadas
	WouldModify     []string `json:"would_modify,omitempty"`     // entidades que seriam modificadas
	
	// Bloqueios que TERIAM acontecido
	BlockedBy       *string  `json:"blocked_by,omitempty"`       // política que bloquearia
	BlockReason     string   `json:"block_reason,omitempty"`
	
	// Risk assessment
	RiskScore       float64  `json:"risk_score"`
	RiskFactors     []string `json:"risk_factors,omitempty"`
}

// ========================================
// SHADOW RESULT - Resposta completa
// ========================================

// ShadowResult - resultado de uma execução shadow
type ShadowResult struct {
	ExecutionID uuid.UUID `json:"execution_id"`
	
	// Status
	Mode        string `json:"mode"` // "shadow"
	Executed    bool   `json:"executed"` // sempre false em shadow
	
	// As 3 perguntas respondidas
	WhatAgentWanted   ShadowIntent     `json:"what_agent_wanted"`
	WhatWouldHappen   ShadowSimulation `json:"what_would_happen"`
	WhyDidntHappen    string           `json:"why_didnt_happen"`
	
	// Recomendação
	Recommendation    string `json:"recommendation"` // "safe_to_promote", "needs_review", "keep_shadow", "should_forbid"
}

// ========================================
// SHADOW STATISTICS - Para análise
// ========================================

// ShadowStats - estatísticas de shadow mode
type ShadowStats struct {
	AgentID          uuid.UUID `json:"agent_id"`
	TotalAttempts    int       `json:"total_attempts"`
	WouldSucceed     int       `json:"would_succeed"`
	WouldFail        int       `json:"would_fail"`
	WouldBeBlocked   int       `json:"would_be_blocked"`
	AvgRiskScore     float64   `json:"avg_risk_score"`
	MostCommonAction string    `json:"most_common_action"`
	Period           string    `json:"period"` // "24h", "7d", "30d"
}

// ========================================
// CONSTANTES
// ========================================

const (
	// Razões padrão para shadow mode
	ReasonAutonomyShadow    = "Nível de autonomia é Shadow (1) - apenas simulação permitida"
	ReasonNoProfile         = "Agente sem perfil de autonomia - operando em modo seguro"
	ReasonManualShadow      = "Shadow mode ativado manualmente para observação"
	
	// Recomendações
	RecommendSafeToPromote = "safe_to_promote"  // Padrão seguro, pode considerar promoção
	RecommendNeedsReview   = "needs_review"     // Precisa análise humana
	RecommendKeepShadow    = "keep_shadow"      // Manter em shadow por mais tempo
	RecommendShouldForbid  = "should_forbid"    // Deveria ser forbidden
)
