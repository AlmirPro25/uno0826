package ads

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// ADS MODULE - ECONOMIC EXTENSION
// "Ads não gasta dinheiro. Ads consome orçamento."
// ========================================

// AdAccountStatus status da conta de anúncios
type AdAccountStatus string

const (
	AdAccountActive    AdAccountStatus = "active"
	AdAccountSuspended AdAccountStatus = "suspended"
)

// AdAccount representa quem anuncia
// Link com ledger via BalanceAccountID
type AdAccount struct {
	ID               uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	TenantID         uuid.UUID `gorm:"type:text;not null;index:idx_ad_account_tenant" json:"tenant_id"`
	UserID           uuid.UUID `gorm:"type:text;not null;index:idx_ad_account_user" json:"user_id"`
	BalanceAccountID uuid.UUID `gorm:"type:text;not null" json:"balance_account_id"` // Link com billing.BillingAccount
	Name             string    `gorm:"type:text;not null" json:"name"`
	Status           string    `gorm:"type:text;not null;default:'active'" json:"status"`
	CreatedAt        time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (AdAccount) TableName() string {
	return "ad_accounts"
}

// ========================================
// AD BUDGET
// ========================================

// BudgetPeriod período do orçamento
type BudgetPeriod string

const (
	BudgetDaily    BudgetPeriod = "daily"
	BudgetMonthly  BudgetPeriod = "monthly"
	BudgetLifetime BudgetPeriod = "lifetime"
)

// BudgetStatus status do orçamento
type BudgetStatus string

const (
	BudgetActive    BudgetStatus = "active"
	BudgetExhausted BudgetStatus = "exhausted"
	BudgetDisputed  BudgetStatus = "disputed"
)

// AdBudget define quanto pode ser gasto
// amount_spent só cresce via ledger-confirmed events
type AdBudget struct {
	ID            uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AdAccountID   uuid.UUID `gorm:"type:text;not null;index:idx_budget_account" json:"ad_account_id"`
	AmountTotal   int64     `gorm:"not null" json:"amount_total"`   // Em centavos
	AmountSpent   int64     `gorm:"not null;default:0" json:"amount_spent"` // Só cresce via ledger
	Currency      string    `gorm:"type:text;not null;default:'BRL'" json:"currency"`
	Period        string    `gorm:"type:text;not null" json:"period"` // daily, monthly, lifetime
	PeriodStart   time.Time `gorm:"not null" json:"period_start"`
	PeriodEnd     *time.Time `json:"period_end,omitempty"`
	Status        string    `gorm:"type:text;not null;default:'active'" json:"status"`
	DisputeReason string    `gorm:"type:text" json:"dispute_reason,omitempty"`
	CreatedAt     time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (AdBudget) TableName() string {
	return "ad_budgets"
}

// AmountRemaining retorna orçamento restante
func (b *AdBudget) AmountRemaining() int64 {
	return b.AmountTotal - b.AmountSpent
}

// IsExhausted verifica se orçamento está esgotado
func (b *AdBudget) IsExhausted() bool {
	return b.AmountSpent >= b.AmountTotal
}

// ========================================
// AD CAMPAIGN
// ========================================

// CampaignStatus status da campanha
type CampaignStatus string

const (
	CampaignDraft     CampaignStatus = "draft"
	CampaignActive    CampaignStatus = "active"
	CampaignPaused    CampaignStatus = "paused"
	CampaignCompleted CampaignStatus = "completed"
	CampaignDisputed  CampaignStatus = "disputed"
)

// CampaignObjective objetivo da campanha
type CampaignObjective string

const (
	ObjectiveImpressions CampaignObjective = "impressions"
	ObjectiveClicks      CampaignObjective = "clicks"
	ObjectiveConversions CampaignObjective = "conversions"
)

// BidStrategy estratégia de lance
type BidStrategy string

const (
	BidLowestCost BidStrategy = "lowest_cost"
	BidTargetCost BidStrategy = "target_cost"
	BidManual     BidStrategy = "manual"
)

// AdCampaign define intenção de gasto
type AdCampaign struct {
	ID              uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AdAccountID     uuid.UUID `gorm:"type:text;not null;index:idx_campaign_account" json:"ad_account_id"`
	BudgetID        uuid.UUID `gorm:"type:text;not null;index:idx_campaign_budget" json:"budget_id"`
	Name            string    `gorm:"type:text;not null" json:"name"`
	Objective       string    `gorm:"type:text;not null" json:"objective"`
	BidStrategy     string    `gorm:"type:text;not null;default:'lowest_cost'" json:"bid_strategy"`
	BidAmount       int64     `gorm:"default:0" json:"bid_amount"` // Para manual bidding
	DailySpendLimit int64     `gorm:"default:0" json:"daily_spend_limit"` // 0 = sem limite
	TotalSpent      int64     `gorm:"default:0" json:"total_spent"`
	Status          string    `gorm:"type:text;not null;default:'draft'" json:"status"`
	DisputeReason   string    `gorm:"type:text" json:"dispute_reason,omitempty"`
	StartAt         *time.Time `json:"start_at,omitempty"`
	EndAt           *time.Time `json:"end_at,omitempty"`
	CreatedAt       time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (AdCampaign) TableName() string {
	return "ad_campaigns"
}

// ========================================
// AD SPEND EVENT
// ========================================

// SpendUnit unidade de cobrança
type SpendUnit string

const (
	SpendUnitImpression SpendUnit = "impression"
	SpendUnitClick      SpendUnit = "click"
	SpendUnitConversion SpendUnit = "conversion"
)

// SpendSource origem do evento
type SpendSource string

const (
	SpendSourceInternal SpendSource = "internal"
	SpendSourceExternal SpendSource = "external"
)

// AdSpendEvent evento econômico atômico
// Nunca altera saldo diretamente. Sempre gera job → ledger entry.
type AdSpendEvent struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	CampaignID   uuid.UUID `gorm:"type:text;not null;index:idx_spend_campaign" json:"campaign_id"`
	BudgetID     uuid.UUID `gorm:"type:text;not null;index:idx_spend_budget" json:"budget_id"`
	Amount       int64     `gorm:"not null" json:"amount"` // Em centavos
	Quantity     int64     `gorm:"not null;default:1" json:"quantity"` // Ex: 1000 impressões
	Unit         string    `gorm:"type:text;not null" json:"unit"` // impression, click, conversion
	Source       string    `gorm:"type:text;not null;default:'internal'" json:"source"`
	Status       string    `gorm:"type:text;not null;default:'pending'" json:"status"` // pending, applied, failed, disputed
	LedgerEntryID *uuid.UUID `gorm:"type:text" json:"ledger_entry_id,omitempty"` // Referência ao ledger
	ErrorMessage string    `gorm:"type:text" json:"error_message,omitempty"`
	OccurredAt   time.Time `gorm:"not null" json:"occurred_at"`
	AppliedAt    *time.Time `json:"applied_at,omitempty"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
}

func (AdSpendEvent) TableName() string {
	return "ad_spend_events"
}

// SpendEventStatus status do evento de gasto
type SpendEventStatus string

const (
	SpendPending  SpendEventStatus = "pending"
	SpendApplied  SpendEventStatus = "applied"
	SpendFailed   SpendEventStatus = "failed"
	SpendDisputed SpendEventStatus = "disputed"
)

// ========================================
// ADS GOVERNANCE
// ========================================

// AdGovernanceLimit limites de governança
type AdGovernanceLimit struct {
	ID              uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	TenantID        uuid.UUID `gorm:"type:text;not null;index:idx_gov_tenant" json:"tenant_id"`
	MaxSpendPerDay  int64     `gorm:"not null" json:"max_spend_per_day"`
	MaxSpendPerCampaign int64 `gorm:"not null" json:"max_spend_per_campaign"`
	KillSwitch      bool      `gorm:"default:false" json:"kill_switch"` // Bloqueia tudo
	CreatedAt       time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (AdGovernanceLimit) TableName() string {
	return "ad_governance_limits"
}
