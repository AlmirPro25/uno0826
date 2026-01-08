package kernel_billing

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// KERNEL BILLING SERVICE - Fase 28.1
// "Billing interno: tracking + controle + invoice"
// ========================================

type KernelBillingService struct {
	db *gorm.DB
}

func NewKernelBillingService(db *gorm.DB) *KernelBillingService {
	return &KernelBillingService{db: db}
}

// ========================================
// PLANS
// ========================================

// SeedDefaultPlans cria os planos padrão (idempotente)
func (s *KernelBillingService) SeedDefaultPlans() error {
	plans := []KernelPlan{
		{
			ID:                   "plan_free",
			Name:                 "free",
			DisplayName:          "Free",
			Description:          "Para começar. Ideal para testes e MVPs.",
			PriceMonthly:         0,
			PriceYearly:          0,
			Currency:             "BRL",
			MaxTransactionsMonth: 100,
			MaxApps:              1,
			MaxAPICallsMonth:     1000,
			MaxWebhooksMonth:     100,
			IsActive:             true,
			IsPublic:             true,
			SortOrder:            1,
		},
		{
			ID:                   "plan_pro",
			Name:                 "pro",
			DisplayName:          "Pro",
			Description:          "Para apps em produção. Limites expandidos.",
			PriceMonthly:         9900, // R$ 99,00
			PriceYearly:          99000, // R$ 990,00 (2 meses grátis)
			Currency:             "BRL",
			MaxTransactionsMonth: 5000,
			MaxApps:              5,
			MaxAPICallsMonth:     50000,
			MaxWebhooksMonth:     5000,
			IsActive:             true,
			IsPublic:             true,
			SortOrder:            2,
		},
		{
			ID:                   "plan_enterprise",
			Name:                 "enterprise",
			DisplayName:          "Enterprise",
			Description:          "Para operações de escala. Limites sob demanda.",
			PriceMonthly:         49900, // R$ 499,00
			PriceYearly:          499000, // R$ 4.990,00
			Currency:             "BRL",
			MaxTransactionsMonth: 0, // Ilimitado
			MaxApps:              0, // Ilimitado
			MaxAPICallsMonth:     0, // Ilimitado
			MaxWebhooksMonth:     0, // Ilimitado
			IsActive:             true,
			IsPublic:             true,
			SortOrder:            3,
		},
	}

	for _, plan := range plans {
		var existing KernelPlan
		if err := s.db.Where("id = ?", plan.ID).First(&existing).Error; err == gorm.ErrRecordNotFound {
			plan.CreatedAt = time.Now()
			plan.UpdatedAt = time.Now()
			if err := s.db.Create(&plan).Error; err != nil {
				return fmt.Errorf("failed to create plan %s: %w", plan.ID, err)
			}
			log.Printf("✅ Plano criado: %s (%s)", plan.DisplayName, plan.ID)
		}
	}

	return nil
}

// GetPlans retorna todos os planos públicos ativos
func (s *KernelBillingService) GetPlans() ([]KernelPlan, error) {
	var plans []KernelPlan
	err := s.db.Where("is_active = ? AND is_public = ?", true, true).
		Order("sort_order ASC").
		Find(&plans).Error
	return plans, err
}

// GetPlanByID retorna um plano específico
func (s *KernelBillingService) GetPlanByID(planID string) (*KernelPlan, error) {
	var plan KernelPlan
	err := s.db.Where("id = ?", planID).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

// ========================================
// SUBSCRIPTIONS
// ========================================

// GetOrCreateSubscription retorna ou cria uma assinatura para o app
func (s *KernelBillingService) GetOrCreateSubscription(appID string) (*AppSubscription, error) {
	var sub AppSubscription
	err := s.db.Where("app_id = ?", appID).Preload("Plan").First(&sub).Error
	
	if err == gorm.ErrRecordNotFound {
		// Criar assinatura Free por padrão
		now := time.Now()
		sub = AppSubscription{
			ID:                 uuid.New().String(),
			AppID:              appID,
			PlanID:             "plan_free",
			Status:             SubscriptionStatusActive,
			CurrentPeriodStart: now,
			CurrentPeriodEnd:   now.AddDate(0, 1, 0), // +1 mês
			CreatedAt:          now,
			UpdatedAt:          now,
		}
		if err := s.db.Create(&sub).Error; err != nil {
			return nil, fmt.Errorf("failed to create subscription: %w", err)
		}
		// Carregar o plano
		s.db.Where("id = ?", sub.PlanID).First(&sub.Plan)
		log.Printf("✅ Subscription criada para app %s (plano: free)", appID)
	} else if err != nil {
		return nil, err
	}
	
	return &sub, nil
}

// GetSubscription retorna a assinatura de um app
func (s *KernelBillingService) GetSubscription(appID string) (*AppSubscription, error) {
	var sub AppSubscription
	err := s.db.Where("app_id = ?", appID).Preload("Plan").First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

// ChangePlan muda o plano de um app
// Upgrade: efeito imediato
// Downgrade: só no próximo ciclo
func (s *KernelBillingService) ChangePlan(appID, newPlanID string) (*AppSubscription, error) {
	sub, err := s.GetSubscription(appID)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	newPlan, err := s.GetPlanByID(newPlanID)
	if err != nil {
		return nil, fmt.Errorf("plan not found: %w", err)
	}

	currentPlan, _ := s.GetPlanByID(sub.PlanID)
	
	// Determinar se é upgrade ou downgrade
	isUpgrade := newPlan.PriceMonthly > currentPlan.PriceMonthly

	if isUpgrade {
		// Upgrade: efeito imediato
		sub.PlanID = newPlanID
		sub.PendingPlanID = nil
		sub.PendingFrom = nil
		sub.Status = SubscriptionStatusActive
		log.Printf("⬆️ Upgrade imediato: app %s -> plano %s", appID, newPlanID)
	} else {
		// Downgrade: agenda para próximo ciclo
		sub.PendingPlanID = &newPlanID
		pendingFrom := sub.CurrentPeriodEnd
		sub.PendingFrom = &pendingFrom
		log.Printf("⬇️ Downgrade agendado: app %s -> plano %s em %s", appID, newPlanID, pendingFrom.Format("2006-01-02"))
	}

	sub.UpdatedAt = time.Now()
	if err := s.db.Save(sub).Error; err != nil {
		return nil, err
	}

	// Recarregar com plano
	return s.GetSubscription(appID)
}

// CancelSubscription cancela a assinatura no fim do período
func (s *KernelBillingService) CancelSubscription(appID string) (*AppSubscription, error) {
	sub, err := s.GetSubscription(appID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	sub.CanceledAt = &now
	sub.CancelAtPeriodEnd = true
	sub.UpdatedAt = now

	if err := s.db.Save(sub).Error; err != nil {
		return nil, err
	}

	log.Printf("❌ Subscription cancelada: app %s (efetivo em %s)", appID, sub.CurrentPeriodEnd.Format("2006-01-02"))
	return sub, nil
}

// ========================================
// USAGE TRACKING
// "Usage incrementa sempre, nunca apaga"
// ========================================

// GetCurrentPeriod retorna o período atual (YYYY-MM)
func GetCurrentPeriod() string {
	return time.Now().Format("2006-01")
}

// GetOrCreateUsage retorna ou cria o registro de usage do período atual
func (s *KernelBillingService) GetOrCreateUsage(appID string) (*AppUsage, error) {
	period := GetCurrentPeriod()
	
	var usage AppUsage
	err := s.db.Where("app_id = ? AND period = ?", appID, period).First(&usage).Error
	
	if err == gorm.ErrRecordNotFound {
		usage = AppUsage{
			ID:        uuid.New().String(),
			AppID:     appID,
			Period:    period,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := s.db.Create(&usage).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	
	return &usage, nil
}

// IncrementTransactions incrementa o contador de transações
func (s *KernelBillingService) IncrementTransactions(appID string, count int64, amount int64) error {
	usage, err := s.GetOrCreateUsage(appID)
	if err != nil {
		return err
	}

	now := time.Now()
	if usage.FirstEventAt == nil {
		usage.FirstEventAt = &now
	}
	usage.LastEventAt = &now
	usage.TransactionsCount += count
	usage.TotalProcessedAmount += amount
	usage.UpdatedAt = now

	return s.db.Save(usage).Error
}

// IncrementAPICalls incrementa o contador de API calls
func (s *KernelBillingService) IncrementAPICalls(appID string, count int64) error {
	usage, err := s.GetOrCreateUsage(appID)
	if err != nil {
		return err
	}

	now := time.Now()
	if usage.FirstEventAt == nil {
		usage.FirstEventAt = &now
	}
	usage.LastEventAt = &now
	usage.APICallsCount += count
	usage.UpdatedAt = now

	return s.db.Save(usage).Error
}

// IncrementWebhooks incrementa o contador de webhooks
func (s *KernelBillingService) IncrementWebhooks(appID string, count int64) error {
	usage, err := s.GetOrCreateUsage(appID)
	if err != nil {
		return err
	}

	now := time.Now()
	if usage.FirstEventAt == nil {
		usage.FirstEventAt = &now
	}
	usage.LastEventAt = &now
	usage.WebhooksCount += count
	usage.UpdatedAt = now

	return s.db.Save(usage).Error
}

// GetUsage retorna o usage de um app para um período
func (s *KernelBillingService) GetUsage(appID, period string) (*AppUsage, error) {
	var usage AppUsage
	err := s.db.Where("app_id = ? AND period = ?", appID, period).First(&usage).Error
	if err != nil {
		return nil, err
	}
	return &usage, nil
}

// GetUsageHistory retorna o histórico de usage de um app
func (s *KernelBillingService) GetUsageHistory(appID string, months int) ([]AppUsage, error) {
	var usages []AppUsage
	err := s.db.Where("app_id = ?", appID).
		Order("period DESC").
		Limit(months).
		Find(&usages).Error
	return usages, err
}

// ========================================
// QUOTA CHECK
// "Webhook entra, fica pending_quota se excedeu"
// ========================================

// CheckTransactionQuota verifica se o app pode processar mais transações
func (s *KernelBillingService) CheckTransactionQuota(appID string) (*QuotaCheckResult, error) {
	sub, err := s.GetOrCreateSubscription(appID)
	if err != nil {
		return nil, err
	}

	usage, err := s.GetOrCreateUsage(appID)
	if err != nil {
		return nil, err
	}

	plan := sub.Plan
	if plan == nil {
		plan, _ = s.GetPlanByID(sub.PlanID)
	}

	// 0 = ilimitado
	if plan.MaxTransactionsMonth == 0 {
		return &QuotaCheckResult{
			Allowed:       true,
			CurrentUsage:  usage.TransactionsCount,
			Limit:         0,
			RemainingQuota: -1, // Ilimitado
		}, nil
	}

	remaining := plan.MaxTransactionsMonth - usage.TransactionsCount
	allowed := remaining > 0

	result := &QuotaCheckResult{
		Allowed:       allowed,
		CurrentUsage:  usage.TransactionsCount,
		Limit:         plan.MaxTransactionsMonth,
		RemainingQuota: remaining,
	}

	if !allowed {
		result.Reason = fmt.Sprintf("quota exceeded: %d/%d transactions", usage.TransactionsCount, plan.MaxTransactionsMonth)
	}

	return result, nil
}

// CheckWebhookQuota verifica se o app pode receber mais webhooks
func (s *KernelBillingService) CheckWebhookQuota(appID string) (*QuotaCheckResult, error) {
	sub, err := s.GetOrCreateSubscription(appID)
	if err != nil {
		return nil, err
	}

	usage, err := s.GetOrCreateUsage(appID)
	if err != nil {
		return nil, err
	}

	plan := sub.Plan
	if plan == nil {
		plan, _ = s.GetPlanByID(sub.PlanID)
	}

	if plan.MaxWebhooksMonth == 0 {
		return &QuotaCheckResult{
			Allowed:       true,
			CurrentUsage:  usage.WebhooksCount,
			Limit:         0,
			RemainingQuota: -1,
		}, nil
	}

	remaining := plan.MaxWebhooksMonth - usage.WebhooksCount
	allowed := remaining > 0

	result := &QuotaCheckResult{
		Allowed:       allowed,
		CurrentUsage:  usage.WebhooksCount,
		Limit:         plan.MaxWebhooksMonth,
		RemainingQuota: remaining,
	}

	if !allowed {
		result.Reason = fmt.Sprintf("quota exceeded: %d/%d webhooks", usage.WebhooksCount, plan.MaxWebhooksMonth)
	}

	return result, nil
}
