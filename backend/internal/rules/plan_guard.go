package rules

/*
================================================================================
PLAN GUARD - Conectando Cérebro (Rules) ao Bolso (Billing)
================================================================================

"Usuário Free não pode usar webhook. Isso é lei."

Este módulo verifica se o plano do usuário permite:
1. Criar regras com certos tipos de ação
2. Executar ações que consomem recursos premium
3. Usar funcionalidades avançadas do Rules Engine

Hierarquia de Planos:
- Free: Apenas alertas básicos
- Pro: Webhooks, flags, ajustes de config
- Enterprise: AI inference, meta-regras, ações críticas

================================================================================
*/

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// CAPABILITIES DE RULES POR PLANO
// ========================================

// RuleCapability representa uma capacidade específica do Rules Engine
type RuleCapability string

const (
	// Ações básicas (Free)
	CapRuleAlert RuleCapability = "RULE_ACTION_ALERT"
	
	// Ações intermediárias (Pro)
	CapRuleWebhook    RuleCapability = "RULE_ACTION_WEBHOOK"
	CapRuleFlag       RuleCapability = "RULE_ACTION_FLAG"
	CapRuleAdjust     RuleCapability = "RULE_ACTION_ADJUST"
	CapRuleNotify     RuleCapability = "RULE_ACTION_NOTIFY"
	CapRuleEscalate   RuleCapability = "RULE_ACTION_ESCALATE"
	
	// Ações avançadas (Enterprise)
	CapRuleCreateRule  RuleCapability = "RULE_ACTION_CREATE_RULE"  // Meta-regras
	CapRuleDisableRule RuleCapability = "RULE_ACTION_DISABLE_RULE"
	CapRuleAIInference RuleCapability = "RULE_ACTION_AI_INFERENCE"
	
	// Limites
	CapRuleUnlimitedRules RuleCapability = "RULE_UNLIMITED_RULES"
	CapRuleCustomTriggers RuleCapability = "RULE_CUSTOM_TRIGGERS"
)

// PlanRuleCapabilities define quais capabilities cada plano tem
var PlanRuleCapabilities = map[string][]RuleCapability{
	"free": {
		CapRuleAlert, // Apenas alertas
	},
	"pro": {
		CapRuleAlert,
		CapRuleWebhook,
		CapRuleFlag,
		CapRuleAdjust,
		CapRuleNotify,
		CapRuleEscalate,
	},
	"enterprise": {
		CapRuleAlert,
		CapRuleWebhook,
		CapRuleFlag,
		CapRuleAdjust,
		CapRuleNotify,
		CapRuleEscalate,
		CapRuleCreateRule,
		CapRuleDisableRule,
		CapRuleAIInference,
		CapRuleUnlimitedRules,
		CapRuleCustomTriggers,
	},
}

// ActionTypeToCapability mapeia tipo de ação para capability necessária
var ActionTypeToCapability = map[RuleActionType]RuleCapability{
	ActionAlert:       CapRuleAlert,
	ActionWebhook:     CapRuleWebhook,
	ActionFlag:        CapRuleFlag,
	ActionAdjust:      CapRuleAdjust,
	ActionNotify:      CapRuleNotify,
	ActionEscalate:    CapRuleEscalate,
	ActionCreateRule:  CapRuleCreateRule,
	ActionDisableRule: CapRuleDisableRule,
}

// PlanRuleLimits define limites de regras por plano
var PlanRuleLimits = map[string]int{
	"free":       5,   // Máximo 5 regras
	"pro":        50,  // Máximo 50 regras
	"enterprise": -1,  // Ilimitado
}

// ========================================
// PLAN GUARD - Verificador de Plano
// ========================================

// PlanGuard verifica permissões baseadas no plano
type PlanGuard struct {
	db *gorm.DB
}

// NewPlanGuard cria um novo guard
func NewPlanGuard(db *gorm.DB) *PlanGuard {
	return &PlanGuard{db: db}
}

// GetUserPlan busca o plano do usuário
func (g *PlanGuard) GetUserPlan(userID uuid.UUID) string {
	// Buscar billing account
	var account struct {
		AccountID uuid.UUID `gorm:"column:account_id"`
	}
	if err := g.db.Table("billing_accounts").
		Select("account_id").
		Where("user_id = ?", userID).
		First(&account).Error; err != nil {
		return "free"
	}

	// Buscar subscription ativa
	var subscription struct {
		PlanID string `gorm:"column:plan_id"`
		Status string `gorm:"column:status"`
	}
	if err := g.db.Table("subscriptions").
		Select("plan_id, status").
		Where("account_id = ? AND status IN ?", account.AccountID, []string{"active", "trialing"}).
		First(&subscription).Error; err != nil {
		return "free"
	}

	return subscription.PlanID
}

// GetAppOwnerPlan busca o plano do dono do app
func (g *PlanGuard) GetAppOwnerPlan(appID uuid.UUID) string {
	// Buscar owner do app
	var app struct {
		OwnerID uuid.UUID `gorm:"column:owner_id"`
	}
	if err := g.db.Table("applications").
		Select("owner_id").
		Where("id = ?", appID).
		First(&app).Error; err != nil {
		return "free"
	}

	return g.GetUserPlan(app.OwnerID)
}

// HasRuleCapability verifica se o plano tem uma capability de rules
func (g *PlanGuard) HasRuleCapability(planID string, cap RuleCapability) bool {
	capabilities, exists := PlanRuleCapabilities[planID]
	if !exists {
		capabilities = PlanRuleCapabilities["free"]
	}

	for _, c := range capabilities {
		if c == cap {
			return true
		}
	}
	return false
}

// CanUseActionType verifica se o plano permite usar um tipo de ação
func (g *PlanGuard) CanUseActionType(planID string, actionType RuleActionType) bool {
	requiredCap, exists := ActionTypeToCapability[actionType]
	if !exists {
		// Ação desconhecida - bloquear por segurança
		return false
	}

	return g.HasRuleCapability(planID, requiredCap)
}

// CanCreateMoreRules verifica se pode criar mais regras
func (g *PlanGuard) CanCreateMoreRules(appID uuid.UUID) (bool, int, int) {
	planID := g.GetAppOwnerPlan(appID)
	limit := PlanRuleLimits[planID]
	
	if limit == -1 {
		return true, -1, 0 // Ilimitado
	}

	// Contar regras existentes do app
	var count int64
	g.db.Model(&Rule{}).Where("app_id = ?", appID).Count(&count)

	return int(count) < limit, limit, int(count)
}

// ========================================
// VALIDAÇÃO DE REGRA POR PLANO
// ========================================

// PlanValidationResult resultado da validação de plano
type PlanValidationResult struct {
	Allowed     bool   `json:"allowed"`
	Reason      string `json:"reason"`
	PlanID      string `json:"plan_id"`
	RequiredCap string `json:"required_capability,omitempty"`
	UpgradeTo   string `json:"upgrade_to,omitempty"`
}

// ValidateRuleCreation valida se uma regra pode ser criada
func (g *PlanGuard) ValidateRuleCreation(appID uuid.UUID, actionType RuleActionType) PlanValidationResult {
	planID := g.GetAppOwnerPlan(appID)

	// 1. Verificar limite de regras
	canCreate, limit, current := g.CanCreateMoreRules(appID)
	if !canCreate {
		return PlanValidationResult{
			Allowed:   false,
			Reason:    fmt.Sprintf("Limite de regras atingido (%d/%d). Faça upgrade para criar mais.", current, limit),
			PlanID:    planID,
			UpgradeTo: suggestPlanUpgrade(planID),
		}
	}

	// 2. Verificar se o tipo de ação é permitido
	if !g.CanUseActionType(planID, actionType) {
		requiredCap := ActionTypeToCapability[actionType]
		return PlanValidationResult{
			Allowed:     false,
			Reason:      fmt.Sprintf("Ação '%s' não disponível no plano %s", actionType, planID),
			PlanID:      planID,
			RequiredCap: string(requiredCap),
			UpgradeTo:   suggestPlanForCapability(requiredCap),
		}
	}

	return PlanValidationResult{
		Allowed: true,
		Reason:  "Regra permitida pelo plano",
		PlanID:  planID,
	}
}

// ValidateActionExecution valida se uma ação pode ser executada
func (g *PlanGuard) ValidateActionExecution(appID uuid.UUID, actionType RuleActionType) PlanValidationResult {
	planID := g.GetAppOwnerPlan(appID)

	if !g.CanUseActionType(planID, actionType) {
		requiredCap := ActionTypeToCapability[actionType]
		return PlanValidationResult{
			Allowed:     false,
			Reason:      fmt.Sprintf("Execução de '%s' bloqueada - não disponível no plano %s", actionType, planID),
			PlanID:      planID,
			RequiredCap: string(requiredCap),
			UpgradeTo:   suggestPlanForCapability(requiredCap),
		}
	}

	return PlanValidationResult{
		Allowed: true,
		Reason:  "Execução permitida pelo plano",
		PlanID:  planID,
	}
}

// ========================================
// HELPERS
// ========================================

// suggestPlanUpgrade sugere upgrade de plano
func suggestPlanUpgrade(currentPlan string) string {
	switch currentPlan {
	case "free":
		return "pro"
	case "pro":
		return "enterprise"
	default:
		return ""
	}
}

// suggestPlanForCapability sugere plano que tem a capability
func suggestPlanForCapability(cap RuleCapability) string {
	// Verificar se Pro tem
	for _, c := range PlanRuleCapabilities["pro"] {
		if c == cap {
			return "pro"
		}
	}
	// Se não, precisa Enterprise
	return "enterprise"
}

// GetPlanCapabilities retorna capabilities de um plano
func GetPlanCapabilities(planID string) []RuleCapability {
	caps, exists := PlanRuleCapabilities[planID]
	if !exists {
		return PlanRuleCapabilities["free"]
	}
	return caps
}

// GetPlanRuleLimit retorna limite de regras de um plano
func GetPlanRuleLimit(planID string) int {
	limit, exists := PlanRuleLimits[planID]
	if !exists {
		return PlanRuleLimits["free"]
	}
	return limit
}
