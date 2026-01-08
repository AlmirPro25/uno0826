package kernel_billing

import (
	"encoding/json"
	"time"
)

// ========================================
// KERNEL BILLING - Fase 28.1
// "O kernel cobra dos apps que usam a infraestrutura"
// ========================================

// KernelPlan representa um plano de assinatura do kernel
// Data-driven: limites e preços são configuráveis
type KernelPlan struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description"`
	
	// Preço em centavos (ex: 2900 = R$ 29,00)
	PriceMonthly int64 `json:"price_monthly"`
	PriceYearly  int64 `json:"price_yearly"`
	Currency     string `gorm:"default:'BRL'" json:"currency"`
	
	// Limites (data-driven, não hardcoded)
	MaxTransactionsMonth int64  `json:"max_transactions_month"` // 0 = ilimitado
	MaxApps              int    `json:"max_apps"`               // 0 = ilimitado
	MaxAPICallsMonth     int64  `json:"max_api_calls_month"`    // 0 = ilimitado
	MaxWebhooksMonth     int64  `json:"max_webhooks_month"`     // 0 = ilimitado
	
	// Features como JSON para flexibilidade futura
	FeaturesJSON string `gorm:"type:text" json:"-"`
	
	// Controle
	IsActive   bool `gorm:"default:true" json:"is_active"`
	IsPublic   bool `gorm:"default:true" json:"is_public"` // Visível para todos ou só negociado
	SortOrder  int  `gorm:"default:0" json:"sort_order"`
	
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Features retorna as features parseadas do JSON
func (p *KernelPlan) Features() map[string]interface{} {
	if p.FeaturesJSON == "" {
		return make(map[string]interface{})
	}
	var features map[string]interface{}
	json.Unmarshal([]byte(p.FeaturesJSON), &features)
	return features
}

// SetFeatures serializa features para JSON
func (p *KernelPlan) SetFeatures(features map[string]interface{}) {
	data, _ := json.Marshal(features)
	p.FeaturesJSON = string(data)
}

// ========================================
// APP SUBSCRIPTION
// ========================================

type SubscriptionStatus string

const (
	SubscriptionStatusActive   SubscriptionStatus = "active"
	SubscriptionStatusPastDue  SubscriptionStatus = "past_due"
	SubscriptionStatusCanceled SubscriptionStatus = "canceled"
	SubscriptionStatusTrialing SubscriptionStatus = "trialing"
	SubscriptionStatusPaused   SubscriptionStatus = "paused" // Quota excedida
)

// AppSubscription representa a assinatura de um app no kernel
type AppSubscription struct {
	ID     string `gorm:"primaryKey" json:"id"`
	AppID  string `gorm:"uniqueIndex;not null" json:"app_id"`
	PlanID string `gorm:"not null" json:"plan_id"`
	
	Status SubscriptionStatus `gorm:"default:'active'" json:"status"`
	
	// Ciclo de billing
	CurrentPeriodStart time.Time `json:"current_period_start"`
	CurrentPeriodEnd   time.Time `json:"current_period_end"`
	
	// Mudança de plano pendente (só aplica no próximo ciclo)
	PendingPlanID *string    `json:"pending_plan_id,omitempty"`
	PendingFrom   *time.Time `json:"pending_from,omitempty"`
	
	// Cancelamento
	CanceledAt      *time.Time `json:"canceled_at,omitempty"`
	CancelAtPeriodEnd bool     `json:"cancel_at_period_end"`
	
	// Metadata
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	
	// Relacionamentos
	Plan *KernelPlan `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
}

// IsActive verifica se a assinatura está ativa
func (s *AppSubscription) IsActive() bool {
	return s.Status == SubscriptionStatusActive || s.Status == SubscriptionStatusTrialing
}

// ========================================
// APP USAGE - Ledger Operacional
// "Usage incrementa sempre, nunca apaga"
// ========================================

// AppUsage rastreia o consumo mensal de um app
type AppUsage struct {
	ID    string `gorm:"primaryKey" json:"id"`
	AppID string `gorm:"index;not null" json:"app_id"`
	
	// Período (YYYY-MM)
	Period string `gorm:"index;not null" json:"period"`
	
	// Contadores (só incrementam)
	TransactionsCount int64 `json:"transactions_count"`
	APICallsCount     int64 `json:"api_calls_count"`
	WebhooksCount     int64 `json:"webhooks_count"`
	
	// Valores processados (em centavos)
	TotalProcessedAmount int64 `json:"total_processed_amount"`
	
	// Timestamps do primeiro e último evento
	FirstEventAt *time.Time `json:"first_event_at,omitempty"`
	LastEventAt  *time.Time `json:"last_event_at,omitempty"`
	
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName define índice único composto
func (AppUsage) TableName() string {
	return "app_usage"
}

// ========================================
// KERNEL INVOICE - Fatura Interna
// "Gerar invoice, não cobrar ainda"
// ========================================

type InvoiceStatus string

const (
	InvoiceStatusDraft   InvoiceStatus = "draft"   // Ainda sendo calculada
	InvoiceStatusPending InvoiceStatus = "pending" // Aguardando pagamento
	InvoiceStatusPaid    InvoiceStatus = "paid"    // Paga (manual por enquanto)
	InvoiceStatusOverdue InvoiceStatus = "overdue" // Vencida
	InvoiceStatusVoided  InvoiceStatus = "voided"  // Cancelada
)

// KernelInvoice representa uma fatura do kernel para um app
type KernelInvoice struct {
	ID     string `gorm:"primaryKey" json:"id"`
	AppID  string `gorm:"index;not null" json:"app_id"`
	PlanID string `json:"plan_id"`
	
	// Período da fatura
	PeriodStart time.Time `json:"period_start"`
	PeriodEnd   time.Time `json:"period_end"`
	
	// Valores (em centavos)
	Subtotal    int64  `json:"subtotal"`     // Valor do plano
	UsageAmount int64  `json:"usage_amount"` // Excedente (futuro)
	Discount    int64  `json:"discount"`     // Desconto aplicado
	Total       int64  `json:"total"`        // Valor final
	Currency    string `gorm:"default:'BRL'" json:"currency"`
	
	// Status
	Status InvoiceStatus `gorm:"default:'draft'" json:"status"`
	
	// Datas
	IssuedAt *time.Time `json:"issued_at,omitempty"`
	DueAt    *time.Time `json:"due_at,omitempty"`
	PaidAt   *time.Time `json:"paid_at,omitempty"`
	
	// Quem marcou como pago (manual)
	PaidBy   string `json:"paid_by,omitempty"`
	PaidNote string `json:"paid_note,omitempty"`
	
	// Detalhes como JSON
	LineItemsJSON string `gorm:"type:text" json:"-"`
	
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// InvoiceLineItem representa um item da fatura
type InvoiceLineItem struct {
	Description string `json:"description"`
	Quantity    int64  `json:"quantity"`
	UnitPrice   int64  `json:"unit_price"`
	Amount      int64  `json:"amount"`
}

// LineItems retorna os itens parseados
func (i *KernelInvoice) LineItems() []InvoiceLineItem {
	if i.LineItemsJSON == "" {
		return []InvoiceLineItem{}
	}
	var items []InvoiceLineItem
	json.Unmarshal([]byte(i.LineItemsJSON), &items)
	return items
}

// SetLineItems serializa os itens
func (i *KernelInvoice) SetLineItems(items []InvoiceLineItem) {
	data, _ := json.Marshal(items)
	i.LineItemsJSON = string(data)
}

// ========================================
// QUOTA CHECK RESULT
// "Webhook entra, fica pending_quota se excedeu"
// ========================================

type QuotaCheckResult struct {
	Allowed       bool   `json:"allowed"`
	Reason        string `json:"reason,omitempty"`
	CurrentUsage  int64  `json:"current_usage"`
	Limit         int64  `json:"limit"`
	RemainingQuota int64 `json:"remaining_quota"`
}
