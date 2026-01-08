package kernel_billing

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

// ========================================
// INVOICE SERVICE - Fase 28.1
// "Gerar invoice interna, não cobrar ainda"
// ========================================

// GenerateMonthlyInvoice gera a fatura mensal para um app
func (s *KernelBillingService) GenerateMonthlyInvoice(appID string, period string) (*KernelInvoice, error) {
	// Verificar se já existe invoice para este período
	var existing KernelInvoice
	err := s.db.Where("app_id = ? AND period_start <= ? AND period_end >= ?", 
		appID, 
		period+"-01", 
		period+"-28").First(&existing).Error
	
	if err == nil {
		// Já existe
		return &existing, nil
	}

	// Buscar subscription
	sub, err := s.GetSubscription(appID)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	// Buscar plano
	plan, err := s.GetPlanByID(sub.PlanID)
	if err != nil {
		return nil, fmt.Errorf("plan not found: %w", err)
	}

	// Buscar usage do período
	usage, _ := s.GetUsage(appID, period)
	if usage == nil {
		usage = &AppUsage{}
	}

	// Calcular período
	periodStart, _ := time.Parse("2006-01", period)
	periodEnd := periodStart.AddDate(0, 1, 0).Add(-time.Second)

	// Criar line items
	lineItems := []InvoiceLineItem{
		{
			Description: fmt.Sprintf("Plano %s - %s", plan.DisplayName, period),
			Quantity:    1,
			UnitPrice:   plan.PriceMonthly,
			Amount:      plan.PriceMonthly,
		},
	}

	// Adicionar detalhes de uso
	if usage.TransactionsCount > 0 {
		lineItems = append(lineItems, InvoiceLineItem{
			Description: fmt.Sprintf("Transações processadas: %d", usage.TransactionsCount),
			Quantity:    usage.TransactionsCount,
			UnitPrice:   0, // Incluído no plano
			Amount:      0,
		})
	}

	// Criar invoice
	now := time.Now()
	dueAt := now.AddDate(0, 0, 15) // Vencimento em 15 dias

	invoice := &KernelInvoice{
		ID:          uuid.New().String(),
		AppID:       appID,
		PlanID:      plan.ID,
		PeriodStart: periodStart,
		PeriodEnd:   periodEnd,
		Subtotal:    plan.PriceMonthly,
		UsageAmount: 0, // Por enquanto não cobra excedente
		Discount:    0,
		Total:       plan.PriceMonthly,
		Currency:    plan.Currency,
		Status:      InvoiceStatusPending,
		IssuedAt:    &now,
		DueAt:       &dueAt,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	invoice.SetLineItems(lineItems)

	// Plano Free = invoice já paga
	if plan.PriceMonthly == 0 {
		invoice.Status = InvoiceStatusPaid
		invoice.PaidAt = &now
		invoice.PaidNote = "Plano gratuito"
	}

	if err := s.db.Create(invoice).Error; err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	log.Printf("📄 Invoice gerada: %s para app %s (R$ %.2f)", invoice.ID, appID, float64(invoice.Total)/100)
	return invoice, nil
}

// GetInvoices retorna as invoices de um app
func (s *KernelBillingService) GetInvoices(appID string, limit int) ([]KernelInvoice, error) {
	var invoices []KernelInvoice
	query := s.db.Where("app_id = ?", appID).Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&invoices).Error
	return invoices, err
}

// GetInvoiceByID retorna uma invoice específica
func (s *KernelBillingService) GetInvoiceByID(invoiceID string) (*KernelInvoice, error) {
	var invoice KernelInvoice
	err := s.db.Where("id = ?", invoiceID).First(&invoice).Error
	if err != nil {
		return nil, err
	}
	return &invoice, nil
}

// MarkInvoicePaid marca uma invoice como paga (manual)
func (s *KernelBillingService) MarkInvoicePaid(invoiceID, paidBy, note string) (*KernelInvoice, error) {
	invoice, err := s.GetInvoiceByID(invoiceID)
	if err != nil {
		return nil, err
	}

	if invoice.Status == InvoiceStatusPaid {
		return invoice, nil // Já está paga
	}

	now := time.Now()
	invoice.Status = InvoiceStatusPaid
	invoice.PaidAt = &now
	invoice.PaidBy = paidBy
	invoice.PaidNote = note
	invoice.UpdatedAt = now

	if err := s.db.Save(invoice).Error; err != nil {
		return nil, err
	}

	log.Printf("💰 Invoice paga: %s (por %s)", invoiceID, paidBy)
	return invoice, nil
}

// VoidInvoice cancela uma invoice
func (s *KernelBillingService) VoidInvoice(invoiceID, reason string) (*KernelInvoice, error) {
	invoice, err := s.GetInvoiceByID(invoiceID)
	if err != nil {
		return nil, err
	}

	if invoice.Status == InvoiceStatusPaid {
		return nil, fmt.Errorf("cannot void a paid invoice")
	}

	invoice.Status = InvoiceStatusVoided
	invoice.PaidNote = reason
	invoice.UpdatedAt = time.Now()

	if err := s.db.Save(invoice).Error; err != nil {
		return nil, err
	}

	log.Printf("🚫 Invoice cancelada: %s (%s)", invoiceID, reason)
	return invoice, nil
}

// ========================================
// BILLING CYCLE MANAGEMENT
// ========================================

// ProcessBillingCycle processa o ciclo de billing para todos os apps
// Deve ser chamado no início de cada mês (via cron/job)
func (s *KernelBillingService) ProcessBillingCycle() error {
	previousPeriod := time.Now().AddDate(0, -1, 0).Format("2006-01")
	
	// Buscar todas as subscriptions ativas
	var subs []AppSubscription
	if err := s.db.Where("status IN ?", []SubscriptionStatus{
		SubscriptionStatusActive,
		SubscriptionStatusPastDue,
	}).Find(&subs).Error; err != nil {
		return err
	}

	log.Printf("🔄 Processando billing cycle para %d apps (período: %s)", len(subs), previousPeriod)

	for _, sub := range subs {
		// Gerar invoice do mês anterior
		_, err := s.GenerateMonthlyInvoice(sub.AppID, previousPeriod)
		if err != nil {
			log.Printf("⚠️ Erro ao gerar invoice para app %s: %v", sub.AppID, err)
			continue
		}

		// Aplicar mudança de plano pendente
		if sub.PendingPlanID != nil && sub.PendingFrom != nil {
			if time.Now().After(*sub.PendingFrom) {
				sub.PlanID = *sub.PendingPlanID
				sub.PendingPlanID = nil
				sub.PendingFrom = nil
				log.Printf("📋 Plano alterado para app %s: %s", sub.AppID, sub.PlanID)
			}
		}

		// Renovar período
		sub.CurrentPeriodStart = time.Now()
		sub.CurrentPeriodEnd = time.Now().AddDate(0, 1, 0)
		sub.UpdatedAt = time.Now()

		// Verificar cancelamento
		if sub.CancelAtPeriodEnd && sub.CanceledAt != nil {
			sub.Status = SubscriptionStatusCanceled
			log.Printf("❌ Subscription cancelada: app %s", sub.AppID)
		}

		s.db.Save(&sub)
	}

	log.Printf("✅ Billing cycle processado")
	return nil
}

// ========================================
// STATS
// ========================================

// BillingStats estatísticas de billing
type BillingStats struct {
	TotalApps           int64   `json:"total_apps"`
	ActiveSubscriptions int64   `json:"active_subscriptions"`
	TotalMRR            int64   `json:"total_mrr"` // Monthly Recurring Revenue
	PendingInvoices     int64   `json:"pending_invoices"`
	PendingAmount       int64   `json:"pending_amount"`
	PlanDistribution    map[string]int64 `json:"plan_distribution"`
}

// GetBillingStats retorna estatísticas de billing
func (s *KernelBillingService) GetBillingStats() (*BillingStats, error) {
	stats := &BillingStats{
		PlanDistribution: make(map[string]int64),
	}

	// Total de apps com subscription
	s.db.Model(&AppSubscription{}).Count(&stats.TotalApps)

	// Subscriptions ativas
	s.db.Model(&AppSubscription{}).
		Where("status = ?", SubscriptionStatusActive).
		Count(&stats.ActiveSubscriptions)

	// MRR (soma dos planos ativos)
	var subs []AppSubscription
	s.db.Where("status = ?", SubscriptionStatusActive).Preload("Plan").Find(&subs)
	for _, sub := range subs {
		if sub.Plan != nil {
			stats.TotalMRR += sub.Plan.PriceMonthly
			stats.PlanDistribution[sub.Plan.Name]++
		}
	}

	// Invoices pendentes
	s.db.Model(&KernelInvoice{}).
		Where("status = ?", InvoiceStatusPending).
		Count(&stats.PendingInvoices)

	// Valor pendente
	var pendingSum struct{ Total int64 }
	s.db.Model(&KernelInvoice{}).
		Select("COALESCE(SUM(total), 0) as total").
		Where("status = ?", InvoiceStatusPending).
		Scan(&pendingSum)
	stats.PendingAmount = pendingSum.Total

	return stats, nil
}
