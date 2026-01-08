package approval

import (
	"time"

	"github.com/google/uuid"
	"prost-qs/backend/internal/authority"
)

// ========================================
// APPROVAL MODEL - DECISÃO HUMANA ASSISTIDA
// "ApprovalRequest é imutável. ApprovalDecision é evento."
// ========================================

// ApprovalStatus - estados possíveis de uma aprovação
type ApprovalStatus string

const (
	StatusPending   ApprovalStatus = "pending"   // Aguardando decisão
	StatusApproved  ApprovalStatus = "approved"  // Aprovado por humano
	StatusRejected  ApprovalStatus = "rejected"  // Rejeitado por humano
	StatusEscalated ApprovalStatus = "escalated" // Escalado para autoridade superior
	StatusExpired   ApprovalStatus = "expired"   // Expirou sem decisão
	StatusCancelled ApprovalStatus = "cancelled" // Cancelado pelo solicitante
)

// ========================================
// APPROVAL REQUEST - ENTIDADE IMUTÁVEL
// Uma vez criada, nunca muda. Decisões são eventos separados.
// ========================================

type ApprovalRequest struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// O que precisa ser aprovado
	Domain    string                `gorm:"size:50;index" json:"domain"`    // billing, ads, config
	Action    string                `gorm:"size:100;index" json:"action"`   // transfer_funds, create_ad
	Impact    authority.ImpactLevel `gorm:"size:20" json:"impact"`
	Amount    int64                 `json:"amount,omitempty"`               // valor envolvido (centavos)
	
	// Contexto completo (imutável)
	Context   ApprovalContext `gorm:"type:text;serializer:json" json:"context"`
	
	// Quem pediu
	RequestedBy     uuid.UUID `gorm:"type:uuid;index" json:"requested_by"`      // agente ou sistema
	RequestedByType string    `gorm:"size:20" json:"requested_by_type"`         // agent, system, user
	RequestReason   string    `gorm:"size:1000" json:"request_reason"`          // por que precisa
	
	// Estado atual
	Status    ApprovalStatus `gorm:"size:20;index;default:pending" json:"status"`
	
	// Autoridades elegíveis no momento da criação (snapshot)
	EligibleAuthorities EligibleSnapshot `gorm:"type:text;serializer:json" json:"eligible_authorities"`
	
	// Timestamps imutáveis
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt time.Time  `json:"expires_at"` // quando expira se não decidido
	
	// Referência para decisão (preenchido após decisão)
	DecisionID *uuid.UUID `gorm:"type:uuid" json:"decision_id,omitempty"`
}

// TableName for ApprovalRequest
func (ApprovalRequest) TableName() string {
	return "approval_requests"
}

// IsExpired verifica se expirou
func (r *ApprovalRequest) IsExpired() bool {
	return time.Now().After(r.ExpiresAt)
}

// IsPending verifica se ainda aguarda decisão
func (r *ApprovalRequest) IsPending() bool {
	return r.Status == StatusPending && !r.IsExpired()
}

// ========================================
// APPROVAL CONTEXT - Contexto completo da ação
// ========================================

type ApprovalContext struct {
	// O que o agente quis fazer (Shadow Mode)
	Intent      string `json:"intent"`
	Description string `json:"description"`
	
	// O que teria acontecido
	SimulatedOutcome string `json:"simulated_outcome,omitempty"`
	
	// Recomendação do sistema
	SystemRecommendation string `json:"system_recommendation,omitempty"`
	RiskAssessment       string `json:"risk_assessment,omitempty"`
	
	// Dados adicionais (flexível)
	Metadata map[string]any `json:"metadata,omitempty"`
}

// ========================================
// ELIGIBLE SNAPSHOT - Snapshot de autoridades elegíveis
// ========================================

type EligibleSnapshot struct {
	Authorities []EligibleAuthoritySnapshot `json:"authorities"`
	ResolvedAt  time.Time                   `json:"resolved_at"`
}

type EligibleAuthoritySnapshot struct {
	AuthorityID uuid.UUID `json:"authority_id"`
	UserID      uuid.UUID `json:"user_id"`
	Role        string    `json:"role"`
	Title       string    `json:"title"`
}

// ========================================
// APPROVAL DECISION - EVENTO (não comando)
// Registra a decisão humana. Nunca apagado.
// ========================================

type ApprovalDecision struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// Referência ao request
	RequestID uuid.UUID `gorm:"type:uuid;index" json:"request_id"`
	
	// Quem decidiu
	AuthorityID uuid.UUID `gorm:"type:uuid;index" json:"authority_id"` // qual autoridade usou
	DecidedBy   uuid.UUID `gorm:"type:uuid;index" json:"decided_by"`   // humano real
	
	// A decisão
	Decision      ApprovalStatus `gorm:"size:20" json:"decision"` // approved, rejected, escalated
	Justification string         `gorm:"size:2000" json:"justification"` // OBRIGATÓRIO
	
	// Rastreabilidade completa
	IP        string `gorm:"size:50" json:"ip"`
	UserAgent string `gorm:"size:500" json:"user_agent"`
	
	// Timestamp imutável
	DecidedAt time.Time `json:"decided_at"`
	
	// Hash para integridade
	Hash string `gorm:"size:64" json:"hash"`
}

// TableName for ApprovalDecision
func (ApprovalDecision) TableName() string {
	return "approval_decisions"
}

// ========================================
// APPROVAL CHAIN - Histórico de decisões
// Para casos de escalação múltipla
// ========================================

type ApprovalChain struct {
	RequestID uuid.UUID          `json:"request_id"`
	Decisions []ApprovalDecision `json:"decisions"`
	FinalStatus ApprovalStatus   `json:"final_status"`
}

// ========================================
// REQUEST/RESPONSE DTOs
// ========================================

// CreateApprovalRequest - DTO para criar request
type CreateApprovalRequest struct {
	Domain          string                `json:"domain" binding:"required"`
	Action          string                `json:"action" binding:"required"`
	Impact          authority.ImpactLevel `json:"impact" binding:"required"`
	Amount          int64                 `json:"amount"`
	Context         ApprovalContext       `json:"context" binding:"required"`
	RequestedBy     uuid.UUID             `json:"requested_by" binding:"required"`
	RequestedByType string                `json:"requested_by_type" binding:"required"`
	RequestReason   string                `json:"request_reason" binding:"required"`
	ExpiresInHours  int                   `json:"expires_in_hours"` // default 24
}

// DecideRequest - DTO para decidir
type DecideRequest struct {
	RequestID     uuid.UUID      `json:"request_id" binding:"required"`
	Decision      ApprovalStatus `json:"decision" binding:"required"` // approved, rejected, escalated
	Justification string         `json:"justification" binding:"required,min=10"`
}

// ApprovalSummary - Resumo para listagem
type ApprovalSummary struct {
	ID              uuid.UUID      `json:"id"`
	Domain          string         `json:"domain"`
	Action          string         `json:"action"`
	Impact          string         `json:"impact"`
	Status          ApprovalStatus `json:"status"`
	RequestedBy     uuid.UUID      `json:"requested_by"`
	RequestedByType string         `json:"requested_by_type"`
	CreatedAt       time.Time      `json:"created_at"`
	ExpiresAt       time.Time      `json:"expires_at"`
	IsExpired       bool           `json:"is_expired"`
}
