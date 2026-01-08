package financial

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// FINANCIAL METRICS - Métricas Materializadas
// "Não recalcular tudo sempre"
// ========================================

// AppFinancialMetrics métricas financeiras por app
// Atualizadas incrementalmente quando eventos chegam
type AppFinancialMetrics struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID     uuid.UUID `gorm:"type:text;not null;uniqueIndex" json:"app_id"`
	
	// Totais acumulados (lifetime)
	TotalRevenue       int64 `json:"total_revenue"`        // Total recebido (centavos)
	TotalRefunds       int64 `json:"total_refunds"`        // Total reembolsado
	TotalFees          int64 `json:"total_fees"`           // Total em taxas
	TotalDisputes      int64 `json:"total_disputes"`       // Total em disputas perdidas
	NetRevenue         int64 `json:"net_revenue"`          // Receita líquida
	
	// Contadores
	PaymentsSuccess    int64 `json:"payments_success"`
	PaymentsFailed     int64 `json:"payments_failed"`
	RefundsCount       int64 `json:"refunds_count"`
	DisputesCount      int64 `json:"disputes_count"`
	DisputesWon        int64 `json:"disputes_won"`
	DisputesLost       int64 `json:"disputes_lost"`
	
	// Subscriptions
	ActiveSubscriptions int64 `json:"active_subscriptions"`
	ChurnedSubscriptions int64 `json:"churned_subscriptions"`
	
	// Métricas de período (rolling)
	RevenueToday       int64     `json:"revenue_today"`
	Revenue7d          int64     `json:"revenue_7d"`
	Revenue30d         int64     `json:"revenue_30d"`
	
	// Última atividade
	LastPaymentAt      *time.Time `json:"last_payment_at,omitempty"`
	LastRefundAt       *time.Time `json:"last_refund_at,omitempty"`
	LastEventAt        *time.Time `json:"last_event_at,omitempty"`
	
	// Timestamps
	CreatedAt          time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func (AppFinancialMetrics) TableName() string {
	return "app_financial_metrics"
}

// ========================================
// DAILY FINANCIAL SNAPSHOT
// Para histórico e gráficos
// ========================================

type DailyFinancialSnapshot struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID     uuid.UUID `gorm:"type:text;not null;index:idx_daily_app_date" json:"app_id"`
	Date      time.Time `gorm:"type:date;not null;index:idx_daily_app_date" json:"date"`
	
	// Valores do dia
	Revenue           int64 `json:"revenue"`
	Refunds           int64 `json:"refunds"`
	Fees              int64 `json:"fees"`
	NetRevenue        int64 `json:"net_revenue"`
	
	// Contadores do dia
	PaymentsSuccess   int64 `json:"payments_success"`
	PaymentsFailed    int64 `json:"payments_failed"`
	RefundsCount      int64 `json:"refunds_count"`
	
	// Subscriptions
	NewSubscriptions  int64 `json:"new_subscriptions"`
	CanceledSubscriptions int64 `json:"canceled_subscriptions"`
	
	CreatedAt         time.Time `gorm:"not null" json:"created_at"`
}

func (DailyFinancialSnapshot) TableName() string {
	return "daily_financial_snapshots"
}

// ========================================
// GLOBAL FINANCIAL METRICS (Super Admin)
// ========================================

type GlobalFinancialMetrics struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	
	// Totais globais
	TotalRevenue       int64 `json:"total_revenue"`
	TotalRefunds       int64 `json:"total_refunds"`
	TotalFees          int64 `json:"total_fees"`
	NetRevenue         int64 `json:"net_revenue"`
	
	// Contadores globais
	TotalApps          int64 `json:"total_apps"`
	ActiveApps         int64 `json:"active_apps"`  // Apps com pagamento nos últimos 30d
	TotalPayments      int64 `json:"total_payments"`
	
	// Rolling metrics
	RevenueToday       int64 `json:"revenue_today"`
	Revenue7d          int64 `json:"revenue_7d"`
	Revenue30d         int64 `json:"revenue_30d"`
	
	// Volume
	VolumeToday        int64 `json:"volume_today"`  // Número de transações hoje
	Volume7d           int64 `json:"volume_7d"`
	Volume30d          int64 `json:"volume_30d"`
	
	UpdatedAt          time.Time `json:"updated_at"`
}

func (GlobalFinancialMetrics) TableName() string {
	return "global_financial_metrics"
}

// ========================================
// WEBHOOK LOG - Registro de webhooks recebidos
// ========================================

type WebhookLog struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID       uuid.UUID `gorm:"type:text;not null;index" json:"app_id"`
	Provider    string    `gorm:"type:text;not null" json:"provider"`
	EventType   string    `gorm:"type:text;not null" json:"event_type"`
	ExternalID  string    `gorm:"type:text;index" json:"external_id"`
	
	// Status do processamento
	Status      string    `gorm:"type:text;not null" json:"status"` // received, processed, failed, duplicate
	Error       string    `gorm:"type:text" json:"error,omitempty"`
	
	// Payload
	Headers     string    `gorm:"type:text" json:"-"`
	RawBody     string    `gorm:"type:text" json:"-"`
	
	// Timing
	ReceivedAt  time.Time `gorm:"not null;index" json:"received_at"`
	ProcessedAt *time.Time `json:"processed_at,omitempty"`
	
	// IP de origem
	SourceIP    string    `gorm:"type:text" json:"source_ip"`
}

func (WebhookLog) TableName() string {
	return "webhook_logs"
}
