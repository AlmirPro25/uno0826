package capabilities

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
)

// ========================================
// ADD-ONS - Capabilities como SKUs
// "Capability primeiro. Preço depois. Agora: preço."
// ========================================

// AddOnType define o tipo de add-on
type AddOnType string

const (
	AddOnTypeCapability AddOnType = "capability" // Desbloqueia uma capability
	AddOnTypeLimit      AddOnType = "limit"      // Aumenta um limite
)

// AddOn define um add-on comprável
type AddOn struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Type        AddOnType  `json:"type"`
	
	// Para type=capability
	Capability  Capability `json:"capability,omitempty"`
	
	// Para type=limit
	LimitType   string     `json:"limit_type,omitempty"`  // "apps", "credentials", "app_users"
	LimitBonus  int        `json:"limit_bonus,omitempty"` // Quanto adiciona ao limite
	
	// Preço
	PriceMonthly int64  `json:"price_monthly"` // Em centavos
	PriceYearly  int64  `json:"price_yearly"`  // Em centavos (desconto anual)
	Currency     string `json:"currency"`
	
	// Stripe
	StripePriceIDMonthly string `json:"stripe_price_id_monthly,omitempty"`
	StripePriceIDYearly  string `json:"stripe_price_id_yearly,omitempty"`
	
	// Disponibilidade
	Active      bool     `json:"active"`
	RequiresPlan []string `json:"requires_plan,omitempty"` // Planos que podem comprar
}

// UserAddOn representa um add-on ativo de um usuário
type UserAddOn struct {
	ID                   uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	UserID               uuid.UUID `gorm:"type:text;not null;index:idx_user_addon_user" json:"user_id"`
	AddOnID              string    `gorm:"type:text;not null;index:idx_user_addon_addon" json:"addon_id"`
	Status               string    `gorm:"type:text;not null;default:'active'" json:"status"` // active, canceled, expired
	StripeSubscriptionID string    `gorm:"type:text" json:"stripe_subscription_id"`
	StartedAt            time.Time `gorm:"not null" json:"started_at"`
	ExpiresAt            time.Time `json:"expires_at"`
	CanceledAt           time.Time `json:"canceled_at"`
	CreatedAt            time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

func (UserAddOn) TableName() string {
	return "user_addons"
}

// ========================================
// ADD-ON CATALOG
// ========================================

// Catálogo de add-ons disponíveis
var AddOnCatalog = map[string]AddOn{
	"export_data": {
		ID:                   "export_data",
		Name:                 "Exportação de Dados",
		Description:          "Exporte dados em CSV, JSON e Excel",
		Type:                 AddOnTypeCapability,
		Capability:           CanExportData,
		PriceMonthly:         990,  // R$ 9,90
		PriceYearly:          9900, // R$ 99,00 (2 meses grátis)
		Currency:             "brl",
		StripePriceIDMonthly: "price_1SnQc0IYhyBfQ2dRRiklubXJ",
		Active:               true,
		RequiresPlan:         []string{"free", "pro"}, // Enterprise já tem
	},
	"audit_logs": {
		ID:                   "audit_logs",
		Name:                 "Logs de Auditoria",
		Description:          "Acesso completo aos logs de auditoria",
		Type:                 AddOnTypeCapability,
		Capability:           CanViewAuditLogs,
		PriceMonthly:         1990, // R$ 19,90
		PriceYearly:          19900,
		Currency:             "brl",
		StripePriceIDMonthly: "", // TODO: criar no modo teste
		Active:               false, // Desativado até ter Price ID
		RequiresPlan:         []string{"pro"},
	},
	"extra_apps_5": {
		ID:                   "extra_apps_5",
		Name:                 "+5 Apps",
		Description:          "Adiciona 5 apps ao seu limite",
		Type:                 AddOnTypeLimit,
		LimitType:            "apps",
		LimitBonus:           5,
		PriceMonthly:         1490, // R$ 14,90
		PriceYearly:          14900,
		Currency:             "brl",
		StripePriceIDMonthly: "", // TODO: criar no modo teste
		Active:               false, // Desativado até ter Price ID
		RequiresPlan:         []string{"pro"},
	},
	"extra_apps_20": {
		ID:                   "extra_apps_20",
		Name:                 "+20 Apps",
		Description:          "Adiciona 20 apps ao seu limite",
		Type:                 AddOnTypeLimit,
		LimitType:            "apps",
		LimitBonus:           20,
		PriceMonthly:         4990, // R$ 49,90
		PriceYearly:          49900,
		Currency:             "brl",
		StripePriceIDMonthly: "", // TODO: criar no modo teste
		Active:               false, // Desativado até ter Price ID
		RequiresPlan:         []string{"pro"},
	},
	"extra_users_5000": {
		ID:                   "extra_users_5000",
		Name:                 "+5.000 Usuários por App",
		Description:          "Aumenta limite de usuários por app",
		Type:                 AddOnTypeLimit,
		LimitType:            "app_users",
		LimitBonus:           5000,
		PriceMonthly:         2990, // R$ 29,90
		PriceYearly:          29900,
		Currency:             "brl",
		StripePriceIDMonthly: "", // TODO: criar no modo teste
		Active:               false, // Desativado até ter Price ID
		RequiresPlan:         []string{"pro"},
	},
}

// GetAddOn retorna um add-on pelo ID
func GetAddOn(id string) *AddOn {
	if addon, ok := AddOnCatalog[id]; ok {
		return &addon
	}
	return nil
}

// ========================================
// VERIFICAÇÃO DE CONFIGURAÇÃO - FAIL FAST
// "Configuração inválida não é estado aceitável"
// ========================================

// ValidateAddOnCatalog verifica se todos os add-ons ativos têm Price IDs configurados
// Deve ser chamado no startup da aplicação
// Em produção (ADDON_DEV_MODE != true): panic se faltar configuração
// Em dev: apenas warning
func ValidateAddOnCatalog() error {
	devMode := os.Getenv("ADDON_DEV_MODE") == "true"
	var missing []string

	for id, addon := range AddOnCatalog {
		if !addon.Active {
			continue
		}

		if addon.StripePriceIDMonthly == "" {
			missing = append(missing, fmt.Sprintf("%s (mensal)", id))
		}
	}

	if len(missing) == 0 {
		log.Println("✅ [CATALOG] Todos os add-ons ativos têm Price IDs configurados")
		return nil
	}

	msg := fmt.Sprintf("❌ [CATALOG] Add-ons sem Stripe Price ID: %v", missing)

	if devMode {
		log.Printf("⚠️ %s (ignorado: ADDON_DEV_MODE=true)", msg)
		return nil
	}

	// Produção: fail fast
	log.Printf("🚨 FATAL: %s", msg)
	log.Println("🚨 Configure os Price IDs no Stripe Dashboard e atualize o catálogo")
	log.Println("🚨 Ou defina ADDON_DEV_MODE=true para ambiente de desenvolvimento")
	
	return fmt.Errorf("configuração inválida: add-ons sem Price ID em produção")
}

// MustValidateAddOnCatalog valida e faz panic se falhar (para uso no init)
func MustValidateAddOnCatalog() {
	if err := ValidateAddOnCatalog(); err != nil {
		panic(err)
	}
}

// ListActiveAddOns retorna todos os add-ons ativos
func ListActiveAddOns() []AddOn {
	var addons []AddOn
	for _, addon := range AddOnCatalog {
		if addon.Active {
			addons = append(addons, addon)
		}
	}
	return addons
}

// ListAddOnsForPlan retorna add-ons disponíveis para um plano
func ListAddOnsForPlan(planID string) []AddOn {
	var addons []AddOn
	for _, addon := range AddOnCatalog {
		if !addon.Active {
			continue
		}
		for _, reqPlan := range addon.RequiresPlan {
			if reqPlan == planID {
				addons = append(addons, addon)
				break
			}
		}
	}
	return addons
}


// ========================================
// ADD-ON GRANT LOG
// "Toda concessão é um fato registrado"
// ========================================

// AddOnGrantLog registra concessões de add-ons para auditoria
type AddOnGrantLog struct {
	ID            uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:text;not null;index:idx_grant_user" json:"user_id"`
	AddOnID       string    `gorm:"type:text;not null;index:idx_grant_addon" json:"addon_id"`
	Trigger       string    `gorm:"type:text;not null" json:"trigger"` // "purchase", "webhook", "promotion", "trial", "admin"
	StripeEventID string    `gorm:"type:text" json:"stripe_event_id"`
	Metadata      string    `gorm:"type:text" json:"metadata"` // JSON com contexto adicional
	CreatedAt     time.Time `gorm:"not null;index:idx_grant_created" json:"created_at"`
}

func (AddOnGrantLog) TableName() string {
	return "addon_grant_logs"
}
