package billing

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// ECONOMIC KERNEL - EVENT DEFINITIONS
// "Stripe é executor. Ledger é verdade."
// ========================================

// EventType define os tipos de eventos do Economic Kernel
type EventType string

const (
	EventBillingAccountCreated EventType = "billing_account_created"
	EventPaymentIntentCreated  EventType = "payment_intent_created"
	EventPaymentIntentConfirmed EventType = "payment_intent_confirmed"
	EventPaymentFailed         EventType = "payment_failed"
	EventSubscriptionStarted   EventType = "subscription_started"
	EventSubscriptionCanceled  EventType = "subscription_canceled"
	EventPayoutRequested       EventType = "payout_requested"
	EventPayoutSent            EventType = "payout_sent"
)

// PaymentStatus define estados do pagamento
type PaymentStatus string

const (
	StatusPending   PaymentStatus = "pending"
	StatusConfirmed PaymentStatus = "confirmed"
	StatusFailed    PaymentStatus = "failed"
	StatusRefunded  PaymentStatus = "refunded"
)

// SubscriptionStatus define estados da assinatura
type SubscriptionStatus string

const (
	SubStatusActive   SubscriptionStatus = "active"
	SubStatusCanceled SubscriptionStatus = "canceled"
	SubStatusPastDue  SubscriptionStatus = "past_due"
	SubStatusTrialing SubscriptionStatus = "trialing"
)

// Currency define moedas suportadas
type Currency string

const (
	CurrencyBRL Currency = "BRL"
	CurrencyUSD Currency = "USD"
)

// ========================================
// EVENT PAYLOADS
// ========================================

// BillingAccountCreatedPayload - Evento 1
type BillingAccountCreatedPayload struct {
	AccountID        uuid.UUID `json:"account_id"`
	UserID           uuid.UUID `json:"user_id"`
	StripeCustomerID string    `json:"stripe_customer_id"` // Referência externa
	CreatedAt        time.Time `json:"created_at"`
}

// PaymentIntentCreatedPayload - Evento 2 (NOSSO intent, não do Stripe)
type PaymentIntentCreatedPayload struct {
	IntentID          uuid.UUID `json:"intent_id"`
	AccountID         uuid.UUID `json:"account_id"`
	Amount            int64     `json:"amount"` // Em centavos
	Currency          Currency  `json:"currency"`
	Description       string    `json:"description"`
	StripeIntentID    string    `json:"stripe_intent_id"` // Referência externa
	IdempotencyKey    string    `json:"idempotency_key"`
	CreatedAt         time.Time `json:"created_at"`
}

// PaymentIntentConfirmedPayload - Evento 3
type PaymentIntentConfirmedPayload struct {
	IntentID       uuid.UUID `json:"intent_id"`
	AccountID      uuid.UUID `json:"account_id"`
	Amount         int64     `json:"amount"`
	Currency       Currency  `json:"currency"`
	StripeChargeID string    `json:"stripe_charge_id"`
	ConfirmedAt    time.Time `json:"confirmed_at"`
}

// PaymentFailedPayload - Evento 4
type PaymentFailedPayload struct {
	IntentID    uuid.UUID `json:"intent_id"`
	AccountID   uuid.UUID `json:"account_id"`
	Amount      int64     `json:"amount"`
	Currency    Currency  `json:"currency"`
	FailureCode string    `json:"failure_code"`
	FailureMsg  string    `json:"failure_message"`
	FailedAt    time.Time `json:"failed_at"`
}

// SubscriptionStartedPayload - Evento 5
type SubscriptionStartedPayload struct {
	SubscriptionID       uuid.UUID `json:"subscription_id"`
	AccountID            uuid.UUID `json:"account_id"`
	PlanID               string    `json:"plan_id"`
	Amount               int64     `json:"amount"`
	Currency             Currency  `json:"currency"`
	Interval             string    `json:"interval"` // "month" | "year"
	StripeSubscriptionID string    `json:"stripe_subscription_id"`
	StartedAt            time.Time `json:"started_at"`
	CurrentPeriodEnd     time.Time `json:"current_period_end"`
}

// SubscriptionCanceledPayload - Evento 6
type SubscriptionCanceledPayload struct {
	SubscriptionID uuid.UUID `json:"subscription_id"`
	AccountID      uuid.UUID `json:"account_id"`
	Reason         string    `json:"reason"`
	CanceledAt     time.Time `json:"canceled_at"`
	EffectiveAt    time.Time `json:"effective_at"` // Quando realmente termina
}

// PayoutRequestedPayload - Evento 7
type PayoutRequestedPayload struct {
	PayoutID    uuid.UUID `json:"payout_id"`
	AccountID   uuid.UUID `json:"account_id"`
	Amount      int64     `json:"amount"`
	Currency    Currency  `json:"currency"`
	Destination string    `json:"destination"` // PIX, bank account, etc
	RequestedAt time.Time `json:"requested_at"`
}

// PayoutSentPayload - Evento 8
type PayoutSentPayload struct {
	PayoutID       uuid.UUID `json:"payout_id"`
	AccountID      uuid.UUID `json:"account_id"`
	Amount         int64     `json:"amount"`
	Currency       Currency  `json:"currency"`
	StripePayoutID string    `json:"stripe_payout_id"`
	SentAt         time.Time `json:"sent_at"`
}
