package authority

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// AUTHORITY MODEL - PODER LIMITADO E RASTREÁVEL
// "Authority ≠ Identity"
// ========================================

// DecisionAuthority - quem pode aprovar o quê
// Um mesmo humano pode ter múltiplas autoridades
type DecisionAuthority struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	
	// Quem é o humano (identidade real)
	UserID    uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	
	// Papel institucional
	Role      AuthorityRole `gorm:"size:50" json:"role"`
	Title     string        `gorm:"size:100" json:"title"` // ex: "Tech Lead", "Finance Officer"
	
	// Escopos de autoridade
	Scopes    AuthorityScopes `gorm:"type:text;serializer:json" json:"scopes"`
	
	// Limites globais
	MaxImpact ImpactLevel `gorm:"size:20" json:"max_impact"` // até onde pode aprovar
	
	// Rastreabilidade de concessão
	GrantedBy   uuid.UUID `gorm:"type:uuid" json:"granted_by"`   // quem concedeu
	GrantReason string    `gorm:"size:500" json:"grant_reason"`  // por que tem essa autoridade
	GrantedAt   time.Time `json:"granted_at"`
	
	// Validade
	Active    bool       `gorm:"default:true" json:"active"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"` // autoridade pode expirar
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	RevokedBy *uuid.UUID `gorm:"type:uuid" json:"revoked_by,omitempty"`
	RevokeReason string  `gorm:"size:500" json:"revoke_reason,omitempty"`
	
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName for DecisionAuthority
func (DecisionAuthority) TableName() string {
	return "decision_authorities"
}

// IsValid verifica se a autoridade está válida
func (a *DecisionAuthority) IsValid() bool {
	if !a.Active {
		return false
	}
	if a.RevokedAt != nil {
		return false
	}
	if a.ExpiresAt != nil && a.ExpiresAt.Before(time.Now()) {
		return false
	}
	return true
}

// ========================================
// AUTHORITY ROLE - Papéis institucionais
// ========================================

type AuthorityRole string

const (
	RoleSuperAdmin     AuthorityRole = "super_admin"     // Pode tudo (com registro)
	RoleTechLead       AuthorityRole = "tech_lead"       // Configurações técnicas
	RoleFinanceOfficer AuthorityRole = "finance_officer" // Operações financeiras
	RoleOpsManager     AuthorityRole = "ops_manager"     // Operações de negócio
	RoleAuditor        AuthorityRole = "auditor"         // Apenas leitura, sem aprovação
)

// ========================================
// AUTHORITY SCOPE - Escopo de autoridade
// ========================================

// AuthorityScope - define o que uma autoridade pode aprovar
type AuthorityScope struct {
	Domain    string   `json:"domain"`     // billing, ads, config, identity
	Actions   []string `json:"actions"`    // quais ações pode aprovar
	MaxAmount int64    `json:"max_amount"` // limite de valor (centavos)
	MaxImpact string   `json:"max_impact"` // low, medium, high
}

// AuthorityScopes - lista de escopos
type AuthorityScopes []AuthorityScope

// ========================================
// IMPACT LEVEL - Nível de impacto
// ========================================

type ImpactLevel string

const (
	ImpactNone     ImpactLevel = "none"
	ImpactLow      ImpactLevel = "low"
	ImpactMedium   ImpactLevel = "medium"
	ImpactHigh     ImpactLevel = "high"
	ImpactCritical ImpactLevel = "critical"
)

// Weight retorna peso numérico do impacto
func (i ImpactLevel) Weight() int {
	switch i {
	case ImpactNone:
		return 0
	case ImpactLow:
		return 1
	case ImpactMedium:
		return 2
	case ImpactHigh:
		return 3
	case ImpactCritical:
		return 4
	default:
		return 5 // desconhecido = máximo
	}
}

// CanApprove verifica se pode aprovar determinado impacto
func (i ImpactLevel) CanApprove(target ImpactLevel) bool {
	return i.Weight() >= target.Weight()
}

// ========================================
// RESOLUTION REQUEST - Pedido de resolução
// ========================================

// ResolutionRequest - pergunta ao sistema
type ResolutionRequest struct {
	Domain       string      `json:"domain"`
	Action       string      `json:"action"`
	Amount       int64       `json:"amount,omitempty"`
	Impact       ImpactLevel `json:"impact"`
	RequestedBy  uuid.UUID   `json:"requested_by"` // agente ou sistema que pediu
}

// ========================================
// RESOLUTION RESULT - Resposta do sistema
// ========================================

// ResolutionResult - quem pode aprovar e por quê
type ResolutionResult struct {
	// Autoridades elegíveis
	Eligible    []EligibleAuthority `json:"eligible"`
	
	// Autoridades excluídas (e por quê)
	Excluded    []ExcludedAuthority `json:"excluded"`
	
	// Resumo
	HasEligible bool   `json:"has_eligible"`
	Reason      string `json:"reason"`
	
	// Se ninguém pode aprovar
	RequiresEscalation bool   `json:"requires_escalation"`
	EscalationReason   string `json:"escalation_reason,omitempty"`
}

// EligibleAuthority - autoridade que pode aprovar
type EligibleAuthority struct {
	AuthorityID uuid.UUID     `json:"authority_id"`
	UserID      uuid.UUID     `json:"user_id"`
	Role        AuthorityRole `json:"role"`
	Title       string        `json:"title"`
	Reason      string        `json:"reason"` // por que pode
}

// ExcludedAuthority - autoridade que NÃO pode aprovar
type ExcludedAuthority struct {
	AuthorityID uuid.UUID     `json:"authority_id"`
	UserID      uuid.UUID     `json:"user_id"`
	Role        AuthorityRole `json:"role"`
	Title       string        `json:"title"`
	Reason      string        `json:"reason"` // POR QUE NÃO PODE (crítico)
}

// ========================================
// EXCLUSION REASONS - Razões de exclusão
// ========================================

const (
	ExclusionInactive       = "Autoridade inativa"
	ExclusionExpired        = "Autoridade expirada"
	ExclusionRevoked        = "Autoridade revogada"
	ExclusionDomainMismatch = "Domínio não autorizado"
	ExclusionActionMismatch = "Ação não autorizada"
	ExclusionAmountExceeded = "Valor excede limite"
	ExclusionImpactExceeded = "Impacto excede autorização"
	ExclusionSelfApproval   = "Auto-aprovação não permitida"
	ExclusionConflict       = "Conflito de interesse detectado"
)
