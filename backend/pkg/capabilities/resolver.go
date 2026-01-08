package capabilities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// CAPABILITY RESOLVER
// "Plano base + Add-ons = Capabilities efetivas"
// ========================================

// CapabilityGrant representa um direito concedido com sua origem
// "capability ≠ boolean. capability = dado auditável"
type CapabilityGrant struct {
	Capability Capability `json:"capability"`
	Source     string     `json:"source"`      // "plan" | "addon" | "promotion" | "trial"
	SourceID   string     `json:"source_id"`   // ID do plano, add-on, promoção, etc
	SourceName string     `json:"source_name"` // Nome legível
	ExpiresAt  *time.Time `json:"expires_at"`  // nil = permanente (enquanto source ativo)
}

// LimitGrant representa um limite com sua composição
type LimitGrant struct {
	LimitType  string       `json:"limit_type"`
	BaseValue  int          `json:"base_value"`  // Do plano
	BonusValue int          `json:"bonus_value"` // Dos add-ons
	TotalValue int          `json:"total_value"` // Base + Bonus (-1 = ilimitado)
	Sources    []LimitSource `json:"sources"`
}

// LimitSource representa uma fonte de limite
type LimitSource struct {
	Source   string `json:"source"`    // "plan" | "addon"
	SourceID string `json:"source_id"`
	Value    int    `json:"value"`
}

// EffectiveEntitlements representa as capabilities e limites efetivos de um usuário
type EffectiveEntitlements struct {
	UserID       uuid.UUID         `json:"user_id"`
	PlanID       string            `json:"plan_id"`
	PlanName     string            `json:"plan_name"`
	Capabilities []CapabilityGrant `json:"capabilities"`
	Limits       []LimitGrant      `json:"limits"`
	ActiveAddOns []string          `json:"active_addons"`
	ResolvedAt   time.Time         `json:"resolved_at"`
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
	now := time.Now()
	
	entitlements := &EffectiveEntitlements{
		UserID:       userID,
		PlanID:       basePlan.ID,
		PlanName:     basePlan.Name,
		Capabilities: []CapabilityGrant{},
		Limits:       []LimitGrant{},
		ActiveAddOns: []string{},
		ResolvedAt:   now,
	}
	
	// 1. Adicionar capabilities do plano base
	for _, cap := range basePlan.Capabilities {
		entitlements.Capabilities = append(entitlements.Capabilities, CapabilityGrant{
			Capability: cap,
			Source:     "plan",
			SourceID:   basePlan.ID,
			SourceName: basePlan.Name,
			ExpiresAt:  nil, // Permanente enquanto plano ativo
		})
	}
	
	// 2. Inicializar limites do plano base
	limitsMap := map[string]*LimitGrant{
		"apps": {
			LimitType:  "apps",
			BaseValue:  basePlan.Limits.MaxApps,
			BonusValue: 0,
			TotalValue: basePlan.Limits.MaxApps,
			Sources: []LimitSource{{
				Source:   "plan",
				SourceID: basePlan.ID,
				Value:    basePlan.Limits.MaxApps,
			}},
		},
		"credentials": {
			LimitType:  "credentials",
			BaseValue:  basePlan.Limits.MaxCredentials,
			BonusValue: 0,
			TotalValue: basePlan.Limits.MaxCredentials,
			Sources: []LimitSource{{
				Source:   "plan",
				SourceID: basePlan.ID,
				Value:    basePlan.Limits.MaxCredentials,
			}},
		},
		"app_users": {
			LimitType:  "app_users",
			BaseValue:  basePlan.Limits.MaxAppUsers,
			BonusValue: 0,
			TotalValue: basePlan.Limits.MaxAppUsers,
			Sources: []LimitSource{{
				Source:   "plan",
				SourceID: basePlan.ID,
				Value:    basePlan.Limits.MaxAppUsers,
			}},
		},
	}
	
	// 3. Buscar add-ons ativos do usuário
	var userAddOns []UserAddOn
	r.db.Where("user_id = ? AND status = ?", userID, "active").Find(&userAddOns)
	
	// 4. Aplicar cada add-on
	capabilitySet := make(map[Capability]bool)
	for _, cap := range basePlan.Capabilities {
		capabilitySet[cap] = true
	}
	
	for _, userAddOn := range userAddOns {
		addon := GetAddOn(userAddOn.AddOnID)
		if addon == nil {
			continue
		}
		
		entitlements.ActiveAddOns = append(entitlements.ActiveAddOns, addon.ID)
		
		switch addon.Type {
		case AddOnTypeCapability:
			// Adicionar capability se não existir
			if !capabilitySet[addon.Capability] {
				capabilitySet[addon.Capability] = true
				
				var expiresAt *time.Time
				if !userAddOn.ExpiresAt.IsZero() {
					expiresAt = &userAddOn.ExpiresAt
				}
				
				entitlements.Capabilities = append(entitlements.Capabilities, CapabilityGrant{
					Capability: addon.Capability,
					Source:     "addon",
					SourceID:   addon.ID,
					SourceName: addon.Name,
					ExpiresAt:  expiresAt,
				})
			}
			
		case AddOnTypeLimit:
			// Aumentar limite (se não for ilimitado)
			if limit, ok := limitsMap[addon.LimitType]; ok {
				if limit.BaseValue != -1 { // Não é ilimitado
					limit.BonusValue += addon.LimitBonus
					limit.TotalValue = limit.BaseValue + limit.BonusValue
					limit.Sources = append(limit.Sources, LimitSource{
						Source:   "addon",
						SourceID: addon.ID,
						Value:    addon.LimitBonus,
					})
				}
			}
		}
	}
	
	// 5. Converter limites para slice
	for _, limit := range limitsMap {
		entitlements.Limits = append(entitlements.Limits, *limit)
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

// GetCapabilityGrant retorna o grant de uma capability específica (para debug/suporte)
func (r *CapabilityResolver) GetCapabilityGrant(userID uuid.UUID, basePlan *Plan, cap Capability) *CapabilityGrant {
	// Verificar no plano base
	if basePlan.HasCapability(cap) {
		return &CapabilityGrant{
			Capability: cap,
			Source:     "plan",
			SourceID:   basePlan.ID,
			SourceName: basePlan.Name,
			ExpiresAt:  nil,
		}
	}
	
	// Verificar nos add-ons
	var userAddOn UserAddOn
	addonIDs := r.getAddOnIDsForCapability(cap)
	if len(addonIDs) == 0 {
		return nil
	}
	
	err := r.db.Where("user_id = ? AND status = ? AND addon_id IN (?)", 
		userID, "active", addonIDs).First(&userAddOn).Error
	if err != nil {
		return nil
	}
	
	addon := GetAddOn(userAddOn.AddOnID)
	if addon == nil {
		return nil
	}
	
	var expiresAt *time.Time
	if !userAddOn.ExpiresAt.IsZero() {
		expiresAt = &userAddOn.ExpiresAt
	}
	
	return &CapabilityGrant{
		Capability: cap,
		Source:     "addon",
		SourceID:   addon.ID,
		SourceName: addon.Name,
		ExpiresAt:  expiresAt,
	}
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
