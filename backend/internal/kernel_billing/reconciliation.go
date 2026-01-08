package kernel_billing

import (
	"context"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

// ========================================
// RECONCILIATION SERVICE - Fase 28.2-B
// "Detectar divergências Stripe × Kernel"
// Cenários cobertos: 5, 13
// ========================================

// ReconciliationService gerencia reconciliação entre Stripe e Kernel
type ReconciliationService struct {
	db            *gorm.DB
	stripeService *KernelStripeService
	alertService  KernelAlertService
}

// NewReconciliationService cria novo serviço de reconciliação
func NewReconciliationService(
	db *gorm.DB,
	stripeService *KernelStripeService,
	alertService KernelAlertService,
) *ReconciliationService {
	return &ReconciliationService{
		db:            db,
		stripeService: stripeService,
		alertService:  alertService,
	}
}

// ========================================
// DIVERGENCE MODELS
// ========================================

// DivergenceType tipo de divergência
type DivergenceType string

const (
	DivergenceStatusDiff  DivergenceType = "status_diff"
	DivergencePaymentDiff DivergenceType = "payment_diff"
	DivergencePlanDiff    DivergenceType = "plan_diff"
	DivergenceAmountDiff  DivergenceType = "amount_diff"
	DivergenceMissing     DivergenceType = "missing"
)

// DivergenceSeverity severidade da divergência
type DivergenceSeverity string

const (
	SeverityCritical DivergenceSeverity = "critical"
	SeverityHigh     DivergenceSeverity = "high"
	SeverityMedium   DivergenceSeverity = "medium"
	SeverityLow      DivergenceSeverity = "low"
)

// ReconciliationDivergence representa uma divergência encontrada
type ReconciliationDivergence struct {
	ID           string             `gorm:"primaryKey" json:"id"`
	AppID        string             `gorm:"index" json:"app_id"`
	Type         DivergenceType     `json:"type"`
	Severity     DivergenceSeverity `json:"severity"`
	Description  string             `json:"description"`
	StripeValue  string             `json:"stripe_value"`
	KernelValue  string             `json:"kernel_value"`
	Status       string             `gorm:"default:'open'" json:"status"` // open, resolved, ignored
	ResolvedAt   *time.Time         `json:"resolved_at,omitempty"`
	ResolvedBy   string             `json:"resolved_by,omitempty"`
	Resolution   string             `json:"resolution,omitempty"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`
}

func (ReconciliationDivergence) TableName() string {
	return "reconciliation_divergences"
}

// ReconciliationRun representa uma execução de reconciliação
type ReconciliationRun struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	StartedAt       time.Time `json:"started_at"`
	CompletedAt     *time.Time `json:"completed_at,omitempty"`
	Status          string    `gorm:"default:'running'" json:"status"` // running, completed, failed
	AppsChecked     int       `json:"apps_checked"`
	DivergencesFound int      `json:"divergences_found"`
	ErrorMessage    string    `json:"error_message,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

func (ReconciliationRun) TableName() string {
	return "reconciliation_runs"
}

// ========================================
// RECONCILIATION EXECUTION
// ========================================

// ReconciliationResult resultado da reconciliação
type ReconciliationResult struct {
	RunID            string                     `json:"run_id"`
	AppsChecked      int                        `json:"apps_checked"`
	DivergencesFound int                        `json:"divergences_found"`
	Divergences      []ReconciliationDivergence `json:"divergences"`
	Duration         time.Duration              `json:"duration"`
	Error            string                     `json:"error,omitempty"`
}

// RunReconciliation executa reconciliação completa
// Cenário 5: Webhook nunca chega
// Cenário 13: Divergência Stripe × Kernel
func (s *ReconciliationService) RunReconciliation(ctx context.Context) (*ReconciliationResult, error) {
	startTime := time.Now()
	result := &ReconciliationResult{
		RunID: fmt.Sprintf("recon_%d", startTime.Unix()),
	}

	// Criar registro da execução
	run := ReconciliationRun{
		ID:        result.RunID,
		StartedAt: startTime,
		Status:    "running",
		CreatedAt: startTime,
	}
	s.db.Create(&run)

	// Buscar todas as subscriptions com Stripe ID
	var subscriptions []AppSubscription
	if err := s.db.Where("status != ?", SubscriptionStatusCanceled).Find(&subscriptions).Error; err != nil {
		s.markRunFailed(run.ID, err.Error())
		result.Error = err.Error()
		return result, err
	}

	result.AppsChecked = len(subscriptions)
	divergences := make([]ReconciliationDivergence, 0)

	// Verificar cada subscription
	for _, sub := range subscriptions {
		select {
		case <-ctx.Done():
			s.markRunFailed(run.ID, "context canceled")
			result.Error = "reconciliation canceled"
			return result, ctx.Err()
		default:
		}

		// Buscar dados no Stripe (se tiver stripe_subscription_id)
		// Por enquanto, simular verificação de invoices pendentes
		appDivergences := s.checkAppDivergences(ctx, sub.AppID)
		divergences = append(divergences, appDivergences...)
	}

	// Salvar divergências
	for _, div := range divergences {
		s.db.Create(&div)
		
		// Criar alerta para divergências críticas
		if div.Severity == SeverityCritical || div.Severity == SeverityHigh {
			s.createDivergenceAlert(div)
		}
	}

	// Finalizar execução
	result.DivergencesFound = len(divergences)
	result.Divergences = divergences
	result.Duration = time.Since(startTime)

	now := time.Now()
	run.CompletedAt = &now
	run.Status = "completed"
	run.AppsChecked = result.AppsChecked
	run.DivergencesFound = result.DivergencesFound
	s.db.Save(&run)

	log.Printf("✅ [RECONCILIATION] Concluída: %d apps, %d divergências em %v",
		result.AppsChecked, result.DivergencesFound, result.Duration)

	return result, nil
}

// checkAppDivergences verifica divergências para um app específico
func (s *ReconciliationService) checkAppDivergences(ctx context.Context, appID string) []ReconciliationDivergence {
	divergences := make([]ReconciliationDivergence, 0)

	// 1. Verificar invoices pendentes no kernel que podem estar pagas no Stripe
	// Cenário 5: Webhook nunca chega
	pendingDivergences := s.checkPendingInvoices(ctx, appID)
	divergences = append(divergences, pendingDivergences...)

	// 2. Verificar status de subscription
	// Cenário 13: Status diferente
	statusDivergences := s.checkSubscriptionStatus(ctx, appID)
	divergences = append(divergences, statusDivergences...)

	return divergences
}

// checkPendingInvoices verifica invoices pendentes
func (s *ReconciliationService) checkPendingInvoices(ctx context.Context, appID string) []ReconciliationDivergence {
	divergences := make([]ReconciliationDivergence, 0)

	// Buscar invoices pendentes há mais de 24h
	cutoff := time.Now().Add(-24 * time.Hour)
	var pendingInvoices []KernelInvoice
	s.db.Where("app_id = ? AND status = ? AND created_at < ?", appID, InvoiceStatusPending, cutoff).
		Find(&pendingInvoices)

	for _, inv := range pendingInvoices {
		// Em produção, verificar no Stripe se está paga
		// Por enquanto, criar divergência para investigação
		div := ReconciliationDivergence{
			ID:          fmt.Sprintf("div_%s_%d", appID, time.Now().UnixNano()),
			AppID:       appID,
			Type:        DivergencePaymentDiff,
			Severity:    SeverityHigh,
			Description: fmt.Sprintf("Invoice %s pendente há mais de 24h", inv.ID),
			KernelValue: string(inv.Status),
			StripeValue: "unknown (verificar manualmente)",
			Status:      "open",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		divergences = append(divergences, div)
	}

	return divergences
}

// checkSubscriptionStatus verifica status de subscription
func (s *ReconciliationService) checkSubscriptionStatus(ctx context.Context, appID string) []ReconciliationDivergence {
	divergences := make([]ReconciliationDivergence, 0)

	// Buscar subscription do kernel
	var sub AppSubscription
	if err := s.db.Where("app_id = ?", appID).First(&sub).Error; err != nil {
		return divergences
	}

	// Verificar inconsistências internas
	// Ex: past_due há mais de 7 dias sem cancelamento
	if sub.Status == SubscriptionStatusPastDue {
		// Buscar última invoice
		var lastInvoice KernelInvoice
		err := s.db.Where("app_id = ?", appID).Order("created_at DESC").First(&lastInvoice).Error
		if err == nil && lastInvoice.Status == InvoiceStatusOverdue {
			daysSinceOverdue := time.Since(lastInvoice.UpdatedAt).Hours() / 24
			if daysSinceOverdue > 7 {
				div := ReconciliationDivergence{
					ID:          fmt.Sprintf("div_%s_%d", appID, time.Now().UnixNano()),
					AppID:       appID,
					Type:        DivergenceStatusDiff,
					Severity:    SeverityMedium,
					Description: fmt.Sprintf("Subscription em past_due há %.0f dias", daysSinceOverdue),
					KernelValue: string(sub.Status),
					StripeValue: "verificar se deve cancelar",
					Status:      "open",
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}
				divergences = append(divergences, div)
			}
		}
	}

	return divergences
}

// ========================================
// DIVERGENCE MANAGEMENT
// ========================================

// GetOpenDivergences retorna divergências abertas
func (s *ReconciliationService) GetOpenDivergences() ([]ReconciliationDivergence, error) {
	var divergences []ReconciliationDivergence
	err := s.db.Where("status = ?", "open").Order("severity ASC, created_at DESC").Find(&divergences).Error
	return divergences, err
}

// GetDivergencesByApp retorna divergências de um app
func (s *ReconciliationService) GetDivergencesByApp(appID string) ([]ReconciliationDivergence, error) {
	var divergences []ReconciliationDivergence
	err := s.db.Where("app_id = ?", appID).Order("created_at DESC").Find(&divergences).Error
	return divergences, err
}

// ResolveDivergence resolve uma divergência
func (s *ReconciliationService) ResolveDivergence(divergenceID, resolvedBy, resolution string) error {
	now := time.Now()
	return s.db.Model(&ReconciliationDivergence{}).
		Where("id = ?", divergenceID).
		Updates(map[string]interface{}{
			"status":      "resolved",
			"resolved_at": &now,
			"resolved_by": resolvedBy,
			"resolution":  resolution,
			"updated_at":  now,
		}).Error
}

// IgnoreDivergence ignora uma divergência
func (s *ReconciliationService) IgnoreDivergence(divergenceID, ignoredBy, reason string) error {
	now := time.Now()
	return s.db.Model(&ReconciliationDivergence{}).
		Where("id = ?", divergenceID).
		Updates(map[string]interface{}{
			"status":      "ignored",
			"resolved_at": &now,
			"resolved_by": ignoredBy,
			"resolution":  "IGNORED: " + reason,
			"updated_at":  now,
		}).Error
}

// ========================================
// HELPERS
// ========================================

// markRunFailed marca execução como falha
func (s *ReconciliationService) markRunFailed(runID, errorMsg string) {
	now := time.Now()
	s.db.Model(&ReconciliationRun{}).
		Where("id = ?", runID).
		Updates(map[string]interface{}{
			"status":        "failed",
			"completed_at":  &now,
			"error_message": errorMsg,
		})
}

// createDivergenceAlert cria alerta para divergência
func (s *ReconciliationService) createDivergenceAlert(div ReconciliationDivergence) {
	if s.alertService != nil {
		s.alertService.CreateAlert(
			"reconciliation_divergence",
			string(div.Severity),
			div.AppID,
			map[string]interface{}{
				"divergence_id":   div.ID,
				"divergence_type": div.Type,
				"description":     div.Description,
				"stripe_value":    div.StripeValue,
				"kernel_value":    div.KernelValue,
			},
		)
	}
}

// GetReconciliationStats retorna estatísticas de reconciliação
func (s *ReconciliationService) GetReconciliationStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Última execução
	var lastRun ReconciliationRun
	if err := s.db.Order("created_at DESC").First(&lastRun).Error; err == nil {
		stats["last_run"] = lastRun
	}

	// Divergências por status
	type StatusCount struct {
		Status string
		Count  int64
	}
	var statusCounts []StatusCount
	s.db.Model(&ReconciliationDivergence{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&statusCounts)

	divergenceStats := map[string]int64{
		"open":     0,
		"resolved": 0,
		"ignored":  0,
	}
	for _, sc := range statusCounts {
		divergenceStats[sc.Status] = sc.Count
	}
	stats["divergences_by_status"] = divergenceStats

	// Divergências por severidade (apenas abertas)
	var severityCounts []struct {
		Severity string
		Count    int64
	}
	s.db.Model(&ReconciliationDivergence{}).
		Where("status = ?", "open").
		Select("severity, count(*) as count").
		Group("severity").
		Scan(&severityCounts)

	severityStats := map[string]int64{
		"critical": 0,
		"high":     0,
		"medium":   0,
		"low":      0,
	}
	for _, sc := range severityCounts {
		severityStats[sc.Severity] = sc.Count
	}
	stats["open_by_severity"] = severityStats

	return stats, nil
}
