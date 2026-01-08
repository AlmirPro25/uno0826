package ads

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/internal/billing"
	"prost-qs/backend/internal/jobs"
	"prost-qs/backend/pkg/statemachine"
)

// ========================================
// ADS SERVICE - ECONOMIC EXTENSION
// "Ads não gasta dinheiro. Ads consome orçamento."
// ========================================

var (
	ErrAdAccountNotFound   = errors.New("ad account not found")
	ErrBudgetNotFound      = errors.New("budget not found")
	ErrCampaignNotFound    = errors.New("campaign not found")
	ErrBudgetExhausted     = errors.New("budget exhausted")
	ErrBudgetDisputed      = errors.New("budget is disputed")
	ErrCampaignNotActive   = errors.New("campaign is not active")
	ErrCampaignDisputed    = errors.New("campaign is disputed")
	ErrGovernanceBlocked   = errors.New("governance kill switch active")
	ErrSpendLimitExceeded  = errors.New("spend limit exceeded")
	ErrInvalidTransition   = errors.New("invalid state transition")
)

// AdsService gerencia o módulo de Ads
type AdsService struct {
	db             *gorm.DB
	billingService *billing.BillingService
	jobService     *jobs.JobService
}

// NewAdsService cria nova instância
func NewAdsService(db *gorm.DB, billingService *billing.BillingService, jobService *jobs.JobService) *AdsService {
	return &AdsService{
		db:             db,
		billingService: billingService,
		jobService:     jobService,
	}
}

// ========================================
// AD ACCOUNT
// ========================================

// CreateAdAccount cria uma conta de anúncios
func (s *AdsService) CreateAdAccount(ctx context.Context, userID uuid.UUID, name string, billingAccountID uuid.UUID) (*AdAccount, error) {
	account := &AdAccount{
		ID:               uuid.New(),
		TenantID:         userID, // Por enquanto, tenant = user
		UserID:           userID,
		BalanceAccountID: billingAccountID,
		Name:             name,
		Status:           string(AdAccountActive),
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.db.Create(account).Error; err != nil {
		return nil, fmt.Errorf("failed to create ad account: %w", err)
	}

	return account, nil
}

// GetAdAccount busca conta de anúncios
func (s *AdsService) GetAdAccount(accountID uuid.UUID) (*AdAccount, error) {
	var account AdAccount
	if err := s.db.Where("id = ?", accountID).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

// GetAdAccountByUser busca conta por user
func (s *AdsService) GetAdAccountByUser(userID uuid.UUID) (*AdAccount, error) {
	var account AdAccount
	if err := s.db.Where("user_id = ?", userID).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

// ========================================
// AD BUDGET
// ========================================

// CreateBudget cria um orçamento
func (s *AdsService) CreateBudget(ctx context.Context, adAccountID uuid.UUID, amount int64, currency string, period BudgetPeriod) (*AdBudget, error) {
	now := time.Now()
	
	var periodEnd *time.Time
	switch period {
	case BudgetDaily:
		end := now.AddDate(0, 0, 1)
		periodEnd = &end
	case BudgetMonthly:
		end := now.AddDate(0, 1, 0)
		periodEnd = &end
	case BudgetLifetime:
		periodEnd = nil
	}

	budget := &AdBudget{
		ID:          uuid.New(),
		AdAccountID: adAccountID,
		AmountTotal: amount,
		AmountSpent: 0,
		Currency:    currency,
		Period:      string(period),
		PeriodStart: now,
		PeriodEnd:   periodEnd,
		Status:      string(BudgetActive),
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.db.Create(budget).Error; err != nil {
		return nil, fmt.Errorf("failed to create budget: %w", err)
	}

	return budget, nil
}

// GetBudget busca orçamento
func (s *AdsService) GetBudget(budgetID uuid.UUID) (*AdBudget, error) {
	var budget AdBudget
	if err := s.db.Where("id = ?", budgetID).First(&budget).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBudgetNotFound
		}
		return nil, err
	}
	return &budget, nil
}

// RefillBudget adiciona mais orçamento
func (s *AdsService) RefillBudget(ctx context.Context, budgetID uuid.UUID, additionalAmount int64) (*AdBudget, error) {
	budget, err := s.GetBudget(budgetID)
	if err != nil {
		return nil, err
	}

	// Usar state machine
	sm := statemachine.GetBudgetStateMachine()
	currentState := statemachine.BudgetState(budget.Status)

	if currentState == statemachine.BudgetStateDisputed {
		return nil, ErrBudgetDisputed
	}

	budget.AmountTotal += additionalAmount
	budget.UpdatedAt = time.Now()

	// Se estava exhausted, volta para active
	if currentState == statemachine.BudgetStateExhausted {
		newState, _ := sm.Transition(currentState, statemachine.BudgetEventRefill)
		budget.Status = string(newState)
	}

	if err := s.db.Save(budget).Error; err != nil {
		return nil, err
	}

	return budget, nil
}

// ========================================
// AD CAMPAIGN
// ========================================

// CreateCampaign cria uma campanha
func (s *AdsService) CreateCampaign(ctx context.Context, adAccountID, budgetID uuid.UUID, name string, objective CampaignObjective, bidStrategy BidStrategy) (*AdCampaign, error) {
	// Verificar se budget existe e pertence à conta
	budget, err := s.GetBudget(budgetID)
	if err != nil {
		return nil, err
	}
	if budget.AdAccountID != adAccountID {
		return nil, errors.New("budget does not belong to this ad account")
	}

	now := time.Now()
	campaign := &AdCampaign{
		ID:          uuid.New(),
		AdAccountID: adAccountID,
		BudgetID:    budgetID,
		Name:        name,
		Objective:   string(objective),
		BidStrategy: string(bidStrategy),
		Status:      string(CampaignDraft),
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.db.Create(campaign).Error; err != nil {
		return nil, fmt.Errorf("failed to create campaign: %w", err)
	}

	return campaign, nil
}

// GetCampaign busca campanha
func (s *AdsService) GetCampaign(campaignID uuid.UUID) (*AdCampaign, error) {
	var campaign AdCampaign
	if err := s.db.Where("id = ?", campaignID).First(&campaign).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCampaignNotFound
		}
		return nil, err
	}
	return &campaign, nil
}

// ActivateCampaign ativa uma campanha
func (s *AdsService) ActivateCampaign(ctx context.Context, campaignID uuid.UUID) (*AdCampaign, error) {
	campaign, err := s.GetCampaign(campaignID)
	if err != nil {
		return nil, err
	}

	// Verificar governança
	if blocked, _ := s.isGovernanceBlocked(campaign.AdAccountID); blocked {
		return nil, ErrGovernanceBlocked
	}

	// Usar state machine
	sm := statemachine.GetCampaignStateMachine()
	currentState := statemachine.CampaignState(campaign.Status)

	newState, err := sm.Transition(currentState, statemachine.CampaignEventActivate)
	if err != nil {
		campaign.Status = string(statemachine.CampaignDisputed)
		campaign.DisputeReason = err.Error()
		s.db.Save(campaign)
		return campaign, ErrInvalidTransition
	}

	now := time.Now()
	campaign.Status = string(newState)
	campaign.StartAt = &now
	campaign.UpdatedAt = now

	if err := s.db.Save(campaign).Error; err != nil {
		return nil, err
	}

	return campaign, nil
}

// PauseCampaign pausa uma campanha
func (s *AdsService) PauseCampaign(ctx context.Context, campaignID uuid.UUID, reason string) (*AdCampaign, error) {
	campaign, err := s.GetCampaign(campaignID)
	if err != nil {
		return nil, err
	}

	sm := statemachine.GetCampaignStateMachine()
	currentState := statemachine.CampaignState(campaign.Status)

	newState, err := sm.Transition(currentState, statemachine.CampaignEventPause)
	if err != nil {
		campaign.Status = string(statemachine.CampaignDisputed)
		campaign.DisputeReason = err.Error()
		s.db.Save(campaign)
		return campaign, ErrInvalidTransition
	}

	campaign.Status = string(newState)
	campaign.UpdatedAt = time.Now()

	if err := s.db.Save(campaign).Error; err != nil {
		return nil, err
	}

	return campaign, nil
}

// ResumeCampaign retoma uma campanha pausada
func (s *AdsService) ResumeCampaign(ctx context.Context, campaignID uuid.UUID) (*AdCampaign, error) {
	campaign, err := s.GetCampaign(campaignID)
	if err != nil {
		return nil, err
	}

	// Verificar governança
	if blocked, _ := s.isGovernanceBlocked(campaign.AdAccountID); blocked {
		return nil, ErrGovernanceBlocked
	}

	// Verificar budget
	budget, err := s.GetBudget(campaign.BudgetID)
	if err != nil {
		return nil, err
	}
	if budget.IsExhausted() {
		return nil, ErrBudgetExhausted
	}

	sm := statemachine.GetCampaignStateMachine()
	currentState := statemachine.CampaignState(campaign.Status)

	newState, err := sm.Transition(currentState, statemachine.CampaignEventResume)
	if err != nil {
		return campaign, ErrInvalidTransition
	}

	campaign.Status = string(newState)
	campaign.UpdatedAt = time.Now()

	if err := s.db.Save(campaign).Error; err != nil {
		return nil, err
	}

	return campaign, nil
}

// ========================================
// AD SPEND EVENT
// ========================================

// RegisterSpendEvent registra um evento de gasto e enfileira job
func (s *AdsService) RegisterSpendEvent(ctx context.Context, campaignID uuid.UUID, amount int64, quantity int64, unit SpendUnit, source SpendSource) (*AdSpendEvent, error) {
	// Buscar campanha
	campaign, err := s.GetCampaign(campaignID)
	if err != nil {
		return nil, err
	}

	// Verificar se campanha está ativa
	if campaign.Status != string(CampaignActive) {
		return nil, ErrCampaignNotActive
	}

	// Verificar governança
	if blocked, _ := s.isGovernanceBlocked(campaign.AdAccountID); blocked {
		return nil, ErrGovernanceBlocked
	}

	now := time.Now()
	event := &AdSpendEvent{
		ID:         uuid.New(),
		CampaignID: campaignID,
		BudgetID:   campaign.BudgetID,
		Amount:     amount,
		Quantity:   quantity,
		Unit:       string(unit),
		Source:     string(source),
		Status:     string(SpendPending),
		OccurredAt: now,
		CreatedAt:  now,
	}

	if err := s.db.Create(event).Error; err != nil {
		return nil, fmt.Errorf("failed to create spend event: %w", err)
	}

	// Enfileirar job para aplicar o gasto
	if s.jobService != nil {
		payload := ApplyAdSpendPayload{
			CampaignID:   campaignID.String(),
			SpendEventID: event.ID.String(),
			Amount:       amount,
		}
		_, err := s.jobService.Enqueue(JobTypeApplyAdSpend, payload, jobs.WithPriority(5))
		if err != nil {
			// Log error but don't fail - event is recorded
			event.ErrorMessage = fmt.Sprintf("failed to enqueue job: %v", err)
			s.db.Save(event)
		}
	}

	return event, nil
}

// ApplyAdSpendPayload payload do job de aplicar gasto
type ApplyAdSpendPayload struct {
	CampaignID   string `json:"campaign_id"`
	SpendEventID string `json:"spend_event_id"`
	Amount       int64  `json:"amount"`
}

// JobTypeApplyAdSpend tipo do job
const JobTypeApplyAdSpend = "apply_ad_spend"

// ApplySpendEvent aplica um evento de gasto (chamado pelo job worker)
func (s *AdsService) ApplySpendEvent(ctx context.Context, spendEventID uuid.UUID) error {
	// Buscar evento
	var event AdSpendEvent
	if err := s.db.Where("id = ?", spendEventID).First(&event).Error; err != nil {
		return err
	}

	// Já aplicado?
	if event.Status == string(SpendApplied) {
		return nil // Idempotente
	}

	// Buscar campanha
	campaign, err := s.GetCampaign(event.CampaignID)
	if err != nil {
		return err
	}

	// Buscar budget
	budget, err := s.GetBudget(event.BudgetID)
	if err != nil {
		return err
	}

	// Buscar ad account para pegar balance_account_id
	adAccount, err := s.GetAdAccount(campaign.AdAccountID)
	if err != nil {
		return err
	}

	// Verificar state machine da campanha
	campaignState := statemachine.CampaignState(campaign.Status)
	if campaignState != statemachine.CampaignActive {
		event.Status = string(SpendFailed)
		event.ErrorMessage = "campaign not active"
		s.db.Save(&event)
		return ErrCampaignNotActive
	}

	// Verificar orçamento disponível
	if budget.AmountRemaining() < event.Amount {
		// Orçamento insuficiente - pausar campanha
		s.pauseCampaignDueToBudget(ctx, campaign)
		event.Status = string(SpendFailed)
		event.ErrorMessage = "budget exhausted"
		s.db.Save(&event)
		return ErrBudgetExhausted
	}

	// Tudo OK - aplicar no ledger via transação
	err = s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Criar ledger entry (debit)
		ledgerEntryID := uuid.New()
		ledgerEntry := &billing.LedgerEntry{
			EntryID:     ledgerEntryID,
			AccountID:   adAccount.BalanceAccountID,
			Type:        "debit",
			Amount:      event.Amount,
			Currency:    budget.Currency,
			Description: fmt.Sprintf("Ad spend: campaign %s", campaign.Name),
			ReferenceID: event.ID.String(),
			CreatedAt:   time.Now(),
		}

		// Buscar saldo atual
		var billingAccount billing.BillingAccount
		if err := tx.Where("account_id = ?", adAccount.BalanceAccountID).First(&billingAccount).Error; err != nil {
			return err
		}

		// Verificar saldo suficiente
		if billingAccount.Balance < event.Amount {
			return errors.New("insufficient balance in billing account")
		}

		// Atualizar saldo
		newBalance := billingAccount.Balance - event.Amount
		ledgerEntry.BalanceAfter = newBalance

		if err := tx.Create(ledgerEntry).Error; err != nil {
			return err
		}

		billingAccount.Balance = newBalance
		billingAccount.UpdatedAt = time.Now()
		if err := tx.Save(&billingAccount).Error; err != nil {
			return err
		}

		// 2. Atualizar budget.amount_spent
		budget.AmountSpent += event.Amount
		budget.UpdatedAt = time.Now()

		// Verificar se esgotou
		if budget.IsExhausted() {
			budgetSM := statemachine.GetBudgetStateMachine()
			newBudgetState, _ := budgetSM.Transition(statemachine.BudgetState(budget.Status), statemachine.BudgetEventExhaust)
			budget.Status = string(newBudgetState)
		}

		if err := tx.Save(budget).Error; err != nil {
			return err
		}

		// 3. Atualizar campaign.total_spent
		campaign.TotalSpent += event.Amount
		campaign.UpdatedAt = time.Now()
		if err := tx.Save(campaign).Error; err != nil {
			return err
		}

		// 4. Marcar evento como aplicado
		now := time.Now()
		event.Status = string(SpendApplied)
		event.LedgerEntryID = &ledgerEntryID
		event.AppliedAt = &now
		if err := tx.Save(&event).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		event.Status = string(SpendFailed)
		event.ErrorMessage = err.Error()
		s.db.Save(&event)
		return err
	}

	// Se budget esgotou, pausar campanha
	budget, _ = s.GetBudget(event.BudgetID)
	if budget.IsExhausted() {
		s.pauseCampaignDueToBudget(ctx, campaign)
	}

	return nil
}

// pauseCampaignDueToBudget pausa campanha por orçamento esgotado
func (s *AdsService) pauseCampaignDueToBudget(ctx context.Context, campaign *AdCampaign) {
	sm := statemachine.GetCampaignStateMachine()
	currentState := statemachine.CampaignState(campaign.Status)

	newState, err := sm.Transition(currentState, statemachine.CampaignEventBudgetExhausted)
	if err != nil {
		campaign.Status = string(statemachine.CampaignDisputed)
		campaign.DisputeReason = "budget exhausted but transition failed"
	} else {
		campaign.Status = string(newState)
	}

	campaign.UpdatedAt = time.Now()
	s.db.Save(campaign)
}

// ========================================
// GOVERNANCE
// ========================================

// isGovernanceBlocked verifica se há kill switch ativo
func (s *AdsService) isGovernanceBlocked(adAccountID uuid.UUID) (bool, error) {
	adAccount, err := s.GetAdAccount(adAccountID)
	if err != nil {
		return false, err
	}

	var limit AdGovernanceLimit
	if err := s.db.Where("tenant_id = ?", adAccount.TenantID).First(&limit).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil // Sem limite = não bloqueado
		}
		return false, err
	}

	return limit.KillSwitch, nil
}

// SetKillSwitch ativa/desativa kill switch
func (s *AdsService) SetKillSwitch(ctx context.Context, tenantID uuid.UUID, active bool) error {
	var limit AdGovernanceLimit
	err := s.db.Where("tenant_id = ?", tenantID).First(&limit).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Criar novo
		limit = AdGovernanceLimit{
			ID:         uuid.New(),
			TenantID:   tenantID,
			KillSwitch: active,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		return s.db.Create(&limit).Error
	}

	if err != nil {
		return err
	}

	limit.KillSwitch = active
	limit.UpdatedAt = time.Now()
	return s.db.Save(&limit).Error
}

// ========================================
// OBSERVABILITY
// ========================================

// CampaignStats estatísticas de uma campanha
type CampaignStats struct {
	CampaignID      uuid.UUID `json:"campaign_id"`
	TotalSpent      int64     `json:"total_spent"`
	BudgetTotal     int64     `json:"budget_total"`
	BudgetRemaining int64     `json:"budget_remaining"`
	SpendRate       float64   `json:"spend_rate"` // spend per hour
	Status          string    `json:"status"`
}

// GetCampaignStats retorna estatísticas de uma campanha
func (s *AdsService) GetCampaignStats(campaignID uuid.UUID) (*CampaignStats, error) {
	campaign, err := s.GetCampaign(campaignID)
	if err != nil {
		return nil, err
	}

	budget, err := s.GetBudget(campaign.BudgetID)
	if err != nil {
		return nil, err
	}

	// Calcular spend rate (últimas 24h)
	var totalLast24h int64
	cutoff := time.Now().Add(-24 * time.Hour)
	s.db.Model(&AdSpendEvent{}).
		Where("campaign_id = ? AND status = ? AND applied_at > ?", campaignID, string(SpendApplied), cutoff).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalLast24h)

	spendRate := float64(totalLast24h) / 24.0

	return &CampaignStats{
		CampaignID:      campaignID,
		TotalSpent:      campaign.TotalSpent,
		BudgetTotal:     budget.AmountTotal,
		BudgetRemaining: budget.AmountRemaining(),
		SpendRate:       spendRate,
		Status:          campaign.Status,
	}, nil
}

// ListCampaigns lista campanhas de uma conta
func (s *AdsService) ListCampaigns(adAccountID uuid.UUID, limit int) ([]AdCampaign, error) {
	var campaigns []AdCampaign
	if err := s.db.Where("ad_account_id = ?", adAccountID).
		Order("created_at DESC").
		Limit(limit).
		Find(&campaigns).Error; err != nil {
		return nil, err
	}
	return campaigns, nil
}

// GetDisputedItems retorna itens em estado disputado
func (s *AdsService) GetDisputedItems(tenantID uuid.UUID) (map[string]interface{}, error) {
	var disputedCampaigns []AdCampaign
	var disputedBudgets []AdBudget
	var disputedEvents []AdSpendEvent

	s.db.Joins("JOIN ad_accounts ON ad_campaigns.ad_account_id = ad_accounts.id").
		Where("ad_accounts.tenant_id = ? AND ad_campaigns.status = ?", tenantID, string(CampaignDisputed)).
		Find(&disputedCampaigns)

	s.db.Joins("JOIN ad_accounts ON ad_budgets.ad_account_id = ad_accounts.id").
		Where("ad_accounts.tenant_id = ? AND ad_budgets.status = ?", tenantID, string(BudgetDisputed)).
		Find(&disputedBudgets)

	s.db.Joins("JOIN ad_campaigns ON ad_spend_events.campaign_id = ad_campaigns.id").
		Joins("JOIN ad_accounts ON ad_campaigns.ad_account_id = ad_accounts.id").
		Where("ad_accounts.tenant_id = ? AND ad_spend_events.status = ?", tenantID, string(SpendDisputed)).
		Find(&disputedEvents)

	return map[string]interface{}{
		"campaigns":    disputedCampaigns,
		"budgets":      disputedBudgets,
		"spend_events": disputedEvents,
	}, nil
}
