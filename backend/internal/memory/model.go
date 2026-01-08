package memory

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// INSTITUTIONAL MEMORY - FASE 14
// "Nenhuma decisão existe isoladamente no tempo"
// ========================================

// ========================================
// DECISION LIFECYCLE
// ========================================

// LifecycleState - estados canônicos de uma decisão
type LifecycleState string

const (
	// StateActive - decisão válida, dentro do tempo e contexto
	StateActive LifecycleState = "active"
	
	// StateExpired - perdeu validade temporal
	StateExpired LifecycleState = "expired"
	
	// StateSuperseded - substituída por decisão mais recente
	StateSuperseded LifecycleState = "superseded"
	
	// StateRevoked - revogada explicitamente por humano
	StateRevoked LifecycleState = "revoked"
	
	// StateUnderReview - suspensa aguardando reavaliação
	StateUnderReview LifecycleState = "under_review"
)

// ExpirationType - tipo de expiração
type ExpirationType string

const (
	// ExpiresAtDate - expira em data específica
	ExpiresAtDate ExpirationType = "expires_at"
	
	// ExpiresOnCondition - expira quando condição é satisfeita
	ExpiresOnCondition ExpirationType = "expires_on_condition"
	
	// ReviewRequired - requer revisão periódica
	ReviewRequired ExpirationType = "review_required"
)

// DecisionLifecycle - ciclo de vida de uma decisão
type DecisionLifecycle struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// Referência à decisão original (ApprovalDecision)
	DecisionID   uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"decision_id"`
	DecisionType string    `gorm:"size:50" json:"decision_type"` // approval, authority_grant, etc
	
	// Estado atual
	State     LifecycleState `gorm:"size:20;index" json:"state"`
	
	// Configuração de expiração (obrigatória)
	ExpirationType   ExpirationType `gorm:"size:30" json:"expiration_type"`
	ExpiresAt        *time.Time     `gorm:"index" json:"expires_at,omitempty"`
	ExpiresCondition string         `gorm:"size:500" json:"expires_condition,omitempty"`
	ReviewEveryDays  *int           `json:"review_every_days,omitempty"`
	NextReviewAt     *time.Time     `gorm:"index" json:"next_review_at,omitempty"`
	
	// Domínio e contexto
	Domain    string `gorm:"size:50;index" json:"domain"`
	Action    string `gorm:"size:100;index" json:"action"`
	
	// Rastreabilidade de transições
	StateChangedAt   time.Time  `json:"state_changed_at"`
	StateChangedBy   *uuid.UUID `gorm:"type:uuid" json:"state_changed_by,omitempty"`
	StateChangeReason string    `gorm:"size:500" json:"state_change_reason,omitempty"`
	
	// Supersessão
	SupersededBy *uuid.UUID `gorm:"type:uuid" json:"superseded_by,omitempty"`
	Supersedes   *uuid.UUID `gorm:"type:uuid" json:"supersedes,omitempty"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName for DecisionLifecycle
func (DecisionLifecycle) TableName() string {
	return "decision_lifecycles"
}

// IsActive verifica se a decisão está ativa
func (l *DecisionLifecycle) IsActive() bool {
	return l.State == StateActive
}

// IsExpired verifica se expirou por tempo
func (l *DecisionLifecycle) IsExpired() bool {
	if l.ExpiresAt != nil && l.ExpiresAt.Before(time.Now()) {
		return true
	}
	if l.NextReviewAt != nil && l.NextReviewAt.Before(time.Now()) {
		return true
	}
	return false
}

// CanProduceEffects verifica se pode produzir efeitos
func (l *DecisionLifecycle) CanProduceEffects() bool {
	return l.State == StateActive && !l.IsExpired()
}

// ========================================
// DECISION CONFLICT
// "Conflito não é erro. Conflito é informação institucional crítica."
// ========================================

// ConflictType - tipos de conflito institucional
type ConflictType string

const (
	// ConflictResource - duas decisões disputam o mesmo recurso finito
	ConflictResource ConflictType = "resource"
	
	// ConflictDirection - decisões apontam para direções opostas
	ConflictDirection ConflictType = "direction"
	
	// ConflictScope - decisão específica contradiz decisão geral
	ConflictScope ConflictType = "scope"
	
	// ConflictTemporal - decisões válidas para mesmo período são incompatíveis
	ConflictTemporal ConflictType = "temporal"
)

// ConflictState - estados de um conflito
type ConflictState string

const (
	// ConflictDetected - conflito identificado, execução bloqueada
	ConflictDetected ConflictState = "detected"
	
	// ConflictAcknowledged - humano ciente, ainda não resolvido
	ConflictAcknowledged ConflictState = "acknowledged"
	
	// ConflictResolved - humano decidiu qual decisão prevalece
	ConflictResolved ConflictState = "resolved"
	
	// ConflictDissolved - uma das decisões saiu de active
	ConflictDissolved ConflictState = "dissolved"
)

// DecisionConflict - conflito entre decisões institucionais
type DecisionConflict struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// Decisões em conflito
	DecisionAID uuid.UUID `gorm:"type:uuid;index" json:"decision_a_id"`
	DecisionBID uuid.UUID `gorm:"type:uuid;index" json:"decision_b_id"`
	
	// Tipo e estado
	ConflictType ConflictType  `gorm:"size:20" json:"conflict_type"`
	State        ConflictState `gorm:"size:20;index" json:"state"`
	
	// Descrição do conflito
	Description string `gorm:"size:1000" json:"description"`
	Domain      string `gorm:"size:50;index" json:"domain"`
	
	// Detecção
	DetectedAt time.Time  `json:"detected_at"`
	DetectedBy string     `gorm:"size:50" json:"detected_by"` // system, human
	
	// Acknowledgment (se houver)
	AcknowledgedAt *time.Time `json:"acknowledged_at,omitempty"`
	AcknowledgedBy *uuid.UUID `gorm:"type:uuid" json:"acknowledged_by,omitempty"`
	
	// Resolução (se houver)
	ResolvedAt       *time.Time `json:"resolved_at,omitempty"`
	ResolvedBy       *uuid.UUID `gorm:"type:uuid" json:"resolved_by,omitempty"`
	Resolution       string     `gorm:"size:1000" json:"resolution,omitempty"`
	PrevailingID     *uuid.UUID `gorm:"type:uuid" json:"prevailing_id,omitempty"` // qual decisão prevaleceu
	NonPrevailingFate string    `gorm:"size:20" json:"non_prevailing_fate,omitempty"` // revoked, superseded, under_review
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName for DecisionConflict
func (DecisionConflict) TableName() string {
	return "decision_conflicts"
}

// IsBlocking verifica se o conflito bloqueia execução
func (c *DecisionConflict) IsBlocking() bool {
	return c.State == ConflictDetected || c.State == ConflictAcknowledged
}

// ========================================
// DECISION PRECEDENT
// "Precedente é memória, não autoridade."
// ========================================

// PrecedentState - estados de um precedente
type PrecedentState string

const (
	// PrecedentActive - referenciável, apresentado quando relevante
	PrecedentActive PrecedentState = "active"
	
	// PrecedentDeprecated - desatualizado, contexto mudou muito
	PrecedentDeprecated PrecedentState = "deprecated"
	
	// PrecedentContested - validade sendo questionada
	PrecedentContested PrecedentState = "contested"
	
	// PrecedentArchived - apenas histórico, não apresentado ativamente
	PrecedentArchived PrecedentState = "archived"
)

// DecisionPrecedent - precedente institucional (memória, não autoridade)
type DecisionPrecedent struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// Decisão original (já encerrada)
	OriginalDecisionID uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"original_decision_id"`
	DecisionType       string    `gorm:"size:50" json:"decision_type"`
	
	// Domínio e ação
	Domain string `gorm:"size:50;index" json:"domain"`
	Action string `gorm:"size:100;index" json:"action"`
	
	// Contexto original (snapshot)
	OriginalContext PrecedentContext `gorm:"type:text;serializer:json" json:"original_context"`
	
	// Resultado observado
	ObservedResult PrecedentResult `gorm:"type:text;serializer:json" json:"observed_result"`
	
	// Estado
	State PrecedentState `gorm:"size:20;index" json:"state"`
	
	// Quem criou o precedente (humano, não sistema)
	CreatedBy       uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreationReason  string    `gorm:"size:500" json:"creation_reason"` // por que é referenciável
	
	// Deprecação (se houver)
	DeprecatedAt     *time.Time `json:"deprecated_at,omitempty"`
	DeprecatedBy     *uuid.UUID `gorm:"type:uuid" json:"deprecated_by,omitempty"`
	DeprecationReason string    `gorm:"size:500" json:"deprecation_reason,omitempty"`
	
	// Timestamps
	DecisionDate time.Time `json:"decision_date"` // quando a decisão original foi tomada
	CreatedAt    time.Time `json:"created_at"`    // quando virou precedente
	UpdatedAt    time.Time `json:"updated_at"`
}

// TableName for DecisionPrecedent
func (DecisionPrecedent) TableName() string {
	return "decision_precedents"
}

// IsReferenciable verifica se pode ser apresentado
func (p *DecisionPrecedent) IsReferenciable() bool {
	return p.State == PrecedentActive
}

// PrecedentContext - contexto da decisão original
type PrecedentContext struct {
	// Quem decidiu
	AuthorityID   uuid.UUID `json:"authority_id"`
	AuthorityRole string    `json:"authority_role"`
	
	// Por que decidiu
	OriginalJustification string `json:"original_justification"`
	
	// Condições vigentes
	ConditionsAtTime map[string]any `json:"conditions_at_time,omitempty"`
	
	// Constraints ativos
	ActiveConstraints []string `json:"active_constraints,omitempty"`
}

// PrecedentResult - resultado observado (sem scoring!)
type PrecedentResult struct {
	// O que aconteceu (descritivo, não avaliativo)
	WhatHappened string `json:"what_happened"`
	
	// Efeitos observados
	ObservedEffects []string `json:"observed_effects,omitempty"`
	
	// Consequências não previstas (se houver)
	UnforeseenConsequences []string `json:"unforeseen_consequences,omitempty"`
	
	// Data do encerramento do ciclo de vida
	LifecycleEndedAt time.Time `json:"lifecycle_ended_at"`
	LifecycleEndState string   `json:"lifecycle_end_state"` // expired, superseded, revoked
}

// ========================================
// DECISION REVIEW
// "Revisão humana consciente"
// ========================================

// ReviewType - tipo de revisão
type ReviewType string

const (
	// ReviewPeriodic - revisão periódica programada
	ReviewPeriodic ReviewType = "periodic"
	
	// ReviewContextChange - contexto mudou
	ReviewContextChange ReviewType = "context_change"
	
	// ReviewPolicyChange - política mudou
	ReviewPolicyChange ReviewType = "policy_change"
	
	// ReviewExplicitRequest - solicitação explícita
	ReviewExplicitRequest ReviewType = "explicit_request"
	
	// ReviewConflictResolution - resolução de conflito
	ReviewConflictResolution ReviewType = "conflict_resolution"
)

// ReviewOutcome - resultado da revisão
type ReviewOutcome string

const (
	// OutcomeRenewed - decisão renovada
	OutcomeRenewed ReviewOutcome = "renewed"
	
	// OutcomeRevoked - decisão revogada
	OutcomeRevoked ReviewOutcome = "revoked"
	
	// OutcomeSuperseded - decisão substituída
	OutcomeSuperseded ReviewOutcome = "superseded"
	
	// OutcomePending - ainda em análise
	OutcomePending ReviewOutcome = "pending"
)

// DecisionReview - revisão de decisão
type DecisionReview struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// Decisão sendo revisada
	DecisionID uuid.UUID `gorm:"type:uuid;index" json:"decision_id"`
	
	// Tipo de revisão
	ReviewType ReviewType `gorm:"size:30" json:"review_type"`
	
	// Motivo da revisão
	ReviewReason string `gorm:"size:1000" json:"review_reason"`
	
	// Quem iniciou
	InitiatedBy   uuid.UUID `gorm:"type:uuid" json:"initiated_by"`
	InitiatedAt   time.Time `json:"initiated_at"`
	
	// Resultado
	Outcome       ReviewOutcome `gorm:"size:20" json:"outcome"`
	OutcomeReason string        `gorm:"size:1000" json:"outcome_reason,omitempty"`
	
	// Quem decidiu (se concluída)
	DecidedBy  *uuid.UUID `gorm:"type:uuid" json:"decided_by,omitempty"`
	DecidedAt  *time.Time `json:"decided_at,omitempty"`
	
	// Nova decisão (se superseded)
	NewDecisionID *uuid.UUID `gorm:"type:uuid" json:"new_decision_id,omitempty"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName for DecisionReview
func (DecisionReview) TableName() string {
	return "decision_reviews"
}

// IsPending verifica se ainda está pendente
func (r *DecisionReview) IsPending() bool {
	return r.Outcome == OutcomePending
}

// ========================================
// LIFECYCLE TRANSITION LOG
// Registro imutável de transições de estado
// ========================================

// LifecycleTransition - registro de transição de estado
type LifecycleTransition struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// Decisão
	DecisionID uuid.UUID `gorm:"type:uuid;index" json:"decision_id"`
	
	// Transição
	FromState LifecycleState `gorm:"size:20" json:"from_state"`
	ToState   LifecycleState `gorm:"size:20" json:"to_state"`
	
	// Quem/o que causou
	TriggeredBy     uuid.UUID `gorm:"type:uuid" json:"triggered_by"`
	TriggeredByType string    `gorm:"size:20" json:"triggered_by_type"` // human, system, time
	
	// Motivo
	Reason string `gorm:"size:500" json:"reason"`
	
	// Timestamp imutável
	TransitionedAt time.Time `json:"transitioned_at"`
	
	// Hash para integridade
	Hash string `gorm:"size:64" json:"hash"`
}

// TableName for LifecycleTransition
func (LifecycleTransition) TableName() string {
	return "lifecycle_transitions"
}
