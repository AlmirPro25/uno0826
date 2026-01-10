package rules

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// AUTHORITY - Quem decide o quê
// "Poder sem autoridade é caos. Autoridade sem limite é tirania."
// ========================================

// AuthorityLevel nível de autoridade no sistema
type AuthorityLevel string

const (
	AuthorityObserver   AuthorityLevel = "observer"   // Pode ver, não pode agir
	AuthoritySuggestor  AuthorityLevel = "suggestor"  // Pode sugerir ações (shadow mode)
	AuthorityOperator   AuthorityLevel = "operator"   // Pode executar ações operacionais
	AuthorityManager    AuthorityLevel = "manager"    // Pode mudar regras e configs
	AuthorityGovernor   AuthorityLevel = "governor"   // Pode mudar políticas
	AuthoritySovereign  AuthorityLevel = "sovereign"  // Pode desligar o sistema
)

// AuthorityHierarchy define a hierarquia (maior = mais poder)
var AuthorityHierarchy = map[AuthorityLevel]int{
	AuthorityObserver:  1,
	AuthoritySuggestor: 2,
	AuthorityOperator:  3,
	AuthorityManager:   4,
	AuthorityGovernor:  5,
	AuthoritySovereign: 6,
}

// HasAuthority verifica se um nível tem autoridade sobre outro
func HasAuthority(actor, required AuthorityLevel) bool {
	return AuthorityHierarchy[actor] >= AuthorityHierarchy[required]
}

// ========================================
// ACTION DOMAIN - Classificação semântica
// ========================================

// ActionDomain domínio da ação
type ActionDomain string

const (
	DomainTech       ActionDomain = "tech"       // Técnico (throttle, cache, retry)
	DomainBusiness   ActionDomain = "business"   // Negócio (campanha, pricing, feature)
	DomainGovernance ActionDomain = "governance" // Governança (regras, políticas, limites)
	DomainOps        ActionDomain = "ops"        // Operacional (alertas, escalação, notificação)
)

// ActionDomainConfig configuração por domínio
type ActionDomainConfig struct {
	Domain           ActionDomain   `json:"domain"`
	RequiredAuthority AuthorityLevel `json:"required_authority"`
	Description      string         `json:"description"`
	Examples         []string       `json:"examples"`
}

// DefaultDomainConfigs configurações padrão por domínio
var DefaultDomainConfigs = map[ActionDomain]ActionDomainConfig{
	DomainTech: {
		Domain:           DomainTech,
		RequiredAuthority: AuthorityOperator,
		Description:      "Ações técnicas que não afetam diretamente o negócio",
		Examples:         []string{"adjust_throttle", "clear_cache", "retry_webhook"},
	},
	DomainBusiness: {
		Domain:           DomainBusiness,
		RequiredAuthority: AuthorityManager,
		Description:      "Ações que afetam o comportamento do produto",
		Examples:         []string{"pause_campaign", "change_pricing", "toggle_feature"},
	},
	DomainGovernance: {
		Domain:           DomainGovernance,
		RequiredAuthority: AuthorityGovernor,
		Description:      "Ações que mudam as regras do sistema",
		Examples:         []string{"create_rule", "change_policy", "set_limit"},
	},
	DomainOps: {
		Domain:           DomainOps,
		RequiredAuthority: AuthorityOperator,
		Description:      "Ações operacionais do dia-a-dia",
		Examples:         []string{"create_alert", "escalate", "notify"},
	},
}

// ActionTypeToDomain mapeia tipo de ação para domínio
var ActionTypeToDomain = map[RuleActionType]ActionDomain{
	ActionAlert:      DomainOps,
	ActionWebhook:    DomainTech,
	ActionFlag:       DomainBusiness,
	ActionNotify:     DomainOps,
	ActionAdjust:     DomainTech,
	ActionCreateRule: DomainGovernance,
	ActionDisableRule: DomainGovernance,
	ActionEscalate:   DomainOps,
}

// GetActionDomain retorna o domínio de uma ação
func GetActionDomain(actionType RuleActionType) ActionDomain {
	if domain, exists := ActionTypeToDomain[actionType]; exists {
		return domain
	}
	return DomainOps // Default
}

// GetRequiredAuthority retorna a autoridade necessária para uma ação
func GetRequiredAuthority(actionType RuleActionType) AuthorityLevel {
	domain := GetActionDomain(actionType)
	if config, exists := DefaultDomainConfigs[domain]; exists {
		return config.RequiredAuthority
	}
	return AuthorityManager // Default conservador
}

// ========================================
// AUTHORITY GRANT - Concessão de autoridade
// ========================================

// AuthorityGrant concessão de autoridade a um ator
type AuthorityGrant struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	ActorID     uuid.UUID      `gorm:"type:uuid;index" json:"actor_id"`     // User ou App
	ActorType   string         `gorm:"size:20" json:"actor_type"`           // "user", "app", "rule"
	Level       AuthorityLevel `gorm:"size:20" json:"level"`
	Scope       string         `gorm:"size:100" json:"scope"`               // "*", "app:xxx", "domain:tech"
	GrantedBy   uuid.UUID      `gorm:"type:uuid" json:"granted_by"`
	GrantedAt   time.Time      `json:"granted_at"`
	ExpiresAt   *time.Time     `json:"expires_at"`
	Reason      string         `gorm:"size:500" json:"reason"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
}

func (AuthorityGrant) TableName() string {
	return "authority_grants"
}
