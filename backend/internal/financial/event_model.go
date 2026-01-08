package financial

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// ========================================
// FINANCIAL EVENT - Ledger Primário
// "Todo centavo que passa é registrado aqui"
// ========================================

// FinancialEvent representa um evento financeiro normalizado
// Independente do provider (Stripe, MercadoPago, etc)
type FinancialEvent struct {
	ID          uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	AppID       uuid.UUID      `gorm:"type:text;not null;index" json:"app_id"`
	Provider    string         `gorm:"type:text;not null;index" json:"provider"` // stripe, mercadopago
	Type        EventType      `gorm:"type:text;not null;index" json:"type"`
	Status      EventStatus    `gorm:"type:text;not null" json:"status"`
	
	// Valores financeiros (sempre em centavos)
	Amount      int64          `gorm:"not null" json:"amount"`
	Currency    string         `gorm:"type:text;not null;default:'BRL'" json:"currency"`
	NetAmount   int64          `json:"net_amount"`   // Após taxas
	FeeAmount   int64          `json:"fee_amount"`   // Taxa do provider
	
	// Referências externas
	ExternalID  string         `gorm:"type:text;index" json:"external_id"`  // ID no provider (pi_xxx, ch_xxx)
	CustomerID  string         `gorm:"type:text" json:"customer_id"`        // ID do cliente no provider
	UserID      *uuid.UUID     `gorm:"type:text" json:"user_id,omitempty"` // ID do usuário no PROST-QS
	
	// Metadados
	Description string         `gorm:"type:text" json:"description,omitempty"`
	Metadata    datatypes.JSON `gorm:"type:text" json:"metadata,omitempty"`
	RawPayload  datatypes.JSON `gorm:"type:text" json:"-"` // Payload original do webhook
	
	// Relacionamentos
	ParentID    *uuid.UUID     `gorm:"type:text" json:"parent_id,omitempty"` // Para refunds, disputes
	
	// Timestamps
	OccurredAt  time.Time      `gorm:"not null;index" json:"occurred_at"` // Quando aconteceu no provider
	ProcessedAt time.Time      `gorm:"not null" json:"processed_at"`      // Quando processamos
	CreatedAt   time.Time      `gorm:"not null" json:"created_at"`
}

func (FinancialEvent) TableName() string {
	return "financial_events"
}

// ========================================
// EVENT TYPES - Tipos de eventos financeiros
// ========================================

type EventType string

const (
	// Pagamentos
	EventPaymentCreated   EventType = "payment.created"
	EventPaymentSucceeded EventType = "payment.succeeded"
	EventPaymentFailed    EventType = "payment.failed"
	EventPaymentCanceled  EventType = "payment.canceled"
	
	// Reembolsos
	EventRefundCreated    EventType = "refund.created"
	EventRefundSucceeded  EventType = "refund.succeeded"
	EventRefundFailed     EventType = "refund.failed"
	
	// Disputas
	EventDisputeCreated   EventType = "dispute.created"
	EventDisputeWon       EventType = "dispute.won"
	EventDisputeLost      EventType = "dispute.lost"
	
	// Subscriptions
	EventSubscriptionCreated  EventType = "subscription.created"
	EventSubscriptionUpdated  EventType = "subscription.updated"
	EventSubscriptionCanceled EventType = "subscription.canceled"
	EventSubscriptionRenewed  EventType = "subscription.renewed"
	
	// Payouts (saques)
	EventPayoutCreated    EventType = "payout.created"
	EventPayoutPaid       EventType = "payout.paid"
	EventPayoutFailed     EventType = "payout.failed"
)

// IsPayment retorna true se é um evento de pagamento
func (t EventType) IsPayment() bool {
	return t == EventPaymentCreated || t == EventPaymentSucceeded || 
	       t == EventPaymentFailed || t == EventPaymentCanceled
}

// IsRefund retorna true se é um evento de reembolso
func (t EventType) IsRefund() bool {
	return t == EventRefundCreated || t == EventRefundSucceeded || t == EventRefundFailed
}

// IsPositive retorna true se é entrada de dinheiro
func (t EventType) IsPositive() bool {
	return t == EventPaymentSucceeded || t == EventSubscriptionRenewed
}

// IsNegative retorna true se é saída de dinheiro
func (t EventType) IsNegative() bool {
	return t == EventRefundSucceeded || t == EventDisputeLost || t == EventPayoutPaid
}

// ========================================
// EVENT STATUS
// ========================================

type EventStatus string

const (
	StatusPending   EventStatus = "pending"
	StatusProcessed EventStatus = "processed"
	StatusFailed    EventStatus = "failed"
	StatusIgnored   EventStatus = "ignored"
)

// ========================================
// PROVIDER CONSTANTS
// ========================================

const (
	ProviderStripe      = "stripe"
	ProviderMercadoPago = "mercadopago"
	ProviderManual      = "manual"
)
