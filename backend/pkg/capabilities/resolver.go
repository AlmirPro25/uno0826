package capabilities

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// CAPABILITY RESOLVER
// "Plano base + Add-ons = Capabilities efetivas"
// ========================================

// EffectiveEntitlements representa as capabilities e limites efetivos de um usuário
type EffectiveEntitlements struct {
	PlanID       string       `json:"plan_id"`
	PlanName     string       `json:"plan_name"`
	Capabilities []Capability `json:"capabilities"`
	Limits       PlanLimits   `json:"limits"`
	ActiveAddOns []string     `json:"active_addons"`
}

// CapabilityResolver resolve capabilities efetivas combinando plano + add-ons
type CapabilityResolver struct {
	db *gorm.DB
}

// NewCapabilityResolver cria um novo resolver
func NewCapabilityResolver(db *gorm.DB) *CapabilityResolver {
	return &CapabilityResolver{db: db}
}

// ResolveEntitlements calcula capabilities efetivas de um usuário
func (r *CapabilityResolver) ResolveEntitlements(userID uuid.UUID, basePlan *Plan) *EffectiveEntitlements {
	// Começar com o plano base
	entitlements := &EffectiveEntitlements{
		PlanID:       basePlan.ID,
		PlanName:     basePlan.Name,
		Capabilities: make([]Capability, len(basePlan.Capabilities)),
		Limits: PlanLimits{
			MaxApps:        basePlan.Limits.MaxApps,
			MaxCredentials: basePlan.Limits.MaxCredentials,
			MaxAppUsers:    basePlan.Limits.MaxAppUsers,
		},
		ActiveAddOns: []string{},
	}
	copy(entitlements.Capabilities, basePlan.Capabilities)
	
	// Buscar add-ons ativos do usuário
	var userAddOns []UserAddOn
	r.db.Where("user_id = ? AND status = ?", userID, "active").Find(&userAddOns)
	
	// Aplicar cada add-on
	for _, userAddOn := range userAddOns {
		addon := GetAddOn(userAddOn.AddOnID)
		if addon == nil {
			continue
		}
		
		entitlements.ActiveAddOns = append(entitlements.ActiveAddOns, addon.ID)
		
		switch addon.Type {
		case AddOnTypeCapability:
			// Adicionar capability se não existir
			if !r.hasCapability(entitlements.Capabilities, addon.Capability) {
				entitlements.Capabilities = append(entitlements.Capabilities, addon.Capability)
			}
			
		case AddOnTypeLimit:
			// Aumentar limite (se não for ilimitado)
			switch addon.LimitType {
			case "apps":
				if entitlements.Limits.MaxApps != -1 {
					entitlements.Limits.MaxApps += addon.LimitBonus
				}
			case "credentials":
				if entitlements.Limits.MaxCredentials != -1 {
					entitlements.Limits.MaxCredentials += addon.LimitBonus
				}
			case "app_users":
				if entitlements.Limits.MaxAppUsers != -1 {
					entitlements.Limits.MaxAppUsers += addon.LimitBonus
				}
			}
		}
	}
	
	return entitlements
}

// HasCapability verifica se o usuário tem uma capability (plano + add-ons)
func (r *CapabilityResolver) HasCapability(userID uuid.UUID, basePlan *Plan, cap Capability) bool {
	// Verificar no plano base primeiro (rápido)
	if basePlan.HasCapability(cap) {
		return true
	}
	
	// Verificar nos add-ons
	var count int64
	r.db.Model(&UserAddOn{}).
		Where("user_id = ? AND status = ? AND addon_id IN (?)", 
			userID, "active", r.getAddOnIDsForCapability(cap)).
		Count(&count)
	
	return count > 0
}

// GetEffectiveLimit retorna o limite efetivo para um recurso
func (r *CapabilityResolver) GetEffectiveLimit(userID uuid.UUID, basePlan *Plan, limitType string) int {
	baseLimit := r.getBaseLimit(basePlan, limitType)
	if baseLimit == -1 {
		return -1 // Ilimitado
	}
	
	// Somar bônus dos add-ons
	var userAddOns []UserAddOn
	r.db.Where("user_id = ? AND status = ?", userID, "active").Find(&userAddOns)
	
	bonus := 0
	for _, userAddOn := range userAddOns {
		addon := GetAddOn(userAddOn.AddOnID)
		if addon != nil && addon.Type == AddOnTypeLimit && addon.LimitType == limitType {
			bonus += addon.LimitBonus
		}
	}
	
	return baseLimit + bonus
}

// CanCreate verifica se pode criar mais recursos (considerando add-ons)
func (r *CapabilityResolver) CanCreate(userID uuid.UUID, basePlan *Plan, resourceType string, currentCount int) bool {
	limit := r.GetEffectiveLimit(userID, basePlan, resourceType)
	if limit == -1 {
		return true // Ilimitado
	}
	return currentCount < limit
}

// Helpers

func (r *CapabilityResolver) hasCapability(caps []Capability, cap Capability) bool {
	for _, c := range caps {
		if c == cap {
			return true
		}
	}
	return false
}

func (r *CapabilityResolver) getAddOnIDsForCapability(cap Capability) []string {
	var ids []string
	for id, addon := range AddOnCatalog {
		if addon.Type == AddOnTypeCapability && addon.Capability == cap {
			ids = append(ids, id)
		}
	}
	return ids
}

func (r *CapabilityResolver) getBaseLimit(plan *Plan, limitType string) int {
	switch limitType {
	case "apps":
		return plan.Limits.MaxApps
	case "credentials":
		return plan.Limits.MaxCredentials
	case "app_users":
		return plan.Limits.MaxAppUsers
	default:
		return 0
	}
}
