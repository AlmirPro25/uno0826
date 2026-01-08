package billing

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// ECONOMIC KERNEL - SOVEREIGN MODELS
// Projeções derivadas dos eventos
// ========================================

// BillingAccount representa uma conta de billing linkada à identidade soberana
// 1 Identity = 1 BillingAccount
type BillingAccount struct {
	AccountID        uuid.UUID `gorm:"type:text;primaryKey" json:"account_id"`
	UserID           uuid.UUID `gorm:"type:text;uniqueIndex:idx_billing_user;not null" json:"user_id"`
	StripeCustomerID string    `gorm:"type:text;uniqueIndex:idx_billing_stripe" json:"stripe_customer_id"`
	Balance          int64     `gorm:"default:0" json:"balance"` // Em centavos, pode ser negativo (crédito)
	Currency         string    `gorm:"type:text;default:'BRL'" json:"currency"`
	CreatedAt        time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (BillingAccount) TableName() string {
	return "billing_accounts"
}

// PaymentIntent representa uma intenção de pagamento NOSSA (não do Stripe)
// O Stripe PaymentIntent é apenas uma referência externa
type PaymentIntent struct {
	IntentID          uuid.UUID `gorm:"type:text;primaryKey" json:"intent_id"`
	AccountID         uuid.UUID `gorm:"type:text;not null;index:idx_intent_account" json:"account_id"`
	Amount            int64     `gorm:"not null" json:"amount"` // Em centavos
	Currency          string    `gorm:"type:text;not null" json:"currency"`
	Status            string    `gorm:"type:text;not null;default:'pending'" json:"status"`
	Description       string    `gorm:"type:text" json:"description"`
	StripeIntentID    string    `gorm:"type:text;index:idx_intent_stripe" json:"stripe_intent_id"`
	StripeChargeID    string    `gorm:"type:text" json:"stripe_charge_id"`
	IdempotencyKey    string    `gorm:"type:text;uniqueIndex:idx_intent_idempotency" json:"idempotency_key"`
	FailureCode       string    `gorm:"type:text" json:"failure_code"`
	FailureMessage    string    `gorm:"type:text" json:"failure_message"`
	DisputeReason     string    `gorm:"type:text" json:"dispute_reason,omitempty"`
	DisputeResolution string    `gorm:"type:text" json:"dispute_resolution,omitempty"`
	CreatedAt         time.Time `gorm:"not null" json:"created_at"`
	ConfirmedAt       time.Time `json:"confirmed_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func (PaymentIntent) TableName() string {
	return "payment_intents"
}

// Subscription representa uma assinatura ativa
type Subscription struct {
	SubscriptionID       uuid.UUID  `gorm:"type:text;primaryKey" json:"subscription_id"`
	AccountID            uuid.UUID  `gorm:"type:text;not null;index:idx_sub_account" json:"account_id"`
	AppID                *uuid.UUID `gorm:"type:text;index:idx_sub_app" json:"app_id,omitempty"` // Fase 16: qual app criou esta subscription
	PlanID               string     `gorm:"type:text;not null" json:"plan_id"`
	Status               string     `gorm:"type:text;not null;default:'active'" json:"status"`
	Amount               int64      `gorm:"not null" json:"amount"`
	Currency             string     `gorm:"type:text;not null" json:"currency"`
	Interval             string     `gorm:"type:text;not null" json:"interval"` // "month" | "year"
	StripeSubscriptionID string     `gorm:"type:text;index:idx_sub_stripe" json:"stripe_subscription_id"`
	StartedAt            time.Time  `gorm:"not null" json:"started_at"`
	CurrentPeriodEnd     time.Time  `json:"current_period_end"`
	CanceledAt           time.Time  `json:"canceled_at"`
	CreatedAt            time.Time  `gorm:"not null" json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

func (Subscription) TableName() string {
	return "subscriptions"
}

// LedgerEntry representa uma entrada no ledger financeiro (imutável)
// Cada movimento de dinheiro é um evento no ledger
type LedgerEntry struct {
	EntryID     uuid.UUID `gorm:"type:text;primaryKey" json:"entry_id"`
	AccountID   uuid.UUID `gorm:"type:text;not null;index:idx_ledger_account" json:"account_id"`
	Type        string    `gorm:"type:text;not null" json:"type"` // "credit" | "debit"
	Amount      int64     `gorm:"not null" json:"amount"`         // Sempre positivo
	Currency    string    `gorm:"type:text;not null" json:"currency"`
	Description string    `gorm:"type:text" json:"description"`
	ReferenceID string    `gorm:"type:text" json:"reference_id"` // PaymentIntent, Payout, etc
	BalanceAfter int64    `gorm:"not null" json:"balance_after"` // Saldo após operação
	CreatedAt   time.Time `gorm:"not null;index:idx_ledger_created" json:"created_at"`
}

func (LedgerEntry) TableName() string {
	return "ledger_entries"
}

// Payout representa uma solicitação de saque
type Payout struct {
	PayoutID       uuid.UUID `gorm:"type:text;primaryKey" json:"payout_id"`
	AccountID      uuid.UUID `gorm:"type:text;not null;index:idx_payout_account" json:"account_id"`
	Amount         int64     `gorm:"not null" json:"amount"`
	Currency       string    `gorm:"type:text;not null" json:"currency"`
	Status         string    `gorm:"type:text;not null;default:'pending'" json:"status"`
	Destination    string    `gorm:"type:text" json:"destination"` // PIX key, bank account
	StripePayoutID string    `gorm:"type:text" json:"stripe_payout_id"`
	RequestedAt    time.Time `gorm:"not null" json:"requested_at"`
	SentAt         time.Time `json:"sent_at"`
	CreatedAt      time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (Payout) TableName() string {
	return "payouts"
}


// ========================================
// WEBHOOK IDEMPOTENCY
// ========================================

// ProcessedWebhook registra webhooks já processados (idempotência)
type ProcessedWebhook struct {
	EventID     string    `gorm:"type:text;primaryKey" json:"event_id"` // Stripe event ID
	EventType   string    `gorm:"type:text;not null" json:"event_type"`
	ProcessedAt time.Time `gorm:"not null" json:"processed_at"`
	Success     bool      `gorm:"default:true" json:"success"`
	Error       string    `gorm:"type:text" json:"error,omitempty"`
}

func (ProcessedWebhook) TableName() string {
	return "processed_webhooks"
}

// ReconciliationLog registra execuções de reconciliação
type ReconciliationLog struct {
	ID              uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	StartedAt       time.Time `gorm:"not null" json:"started_at"`
	CompletedAt     time.Time `json:"completed_at"`
	Status          string    `gorm:"type:text;not null" json:"status"` // running, completed, failed
	TotalChecked    int       `json:"total_checked"`
	Discrepancies   int       `json:"discrepancies"`
	DiscrepancyData string    `gorm:"type:text" json:"discrepancy_data"` // JSON com detalhes
	Error           string    `gorm:"type:text" json:"error,omitempty"`
}

func (ReconciliationLog) TableName() string {
	return "reconciliation_logs"
}
