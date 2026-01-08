package billing

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/pkg/statemachine"
)

// ========================================
// ECONOMIC KERNEL - BILLING SERVICE
// "Stripe é executor. Ledger é verdade."
// ========================================

var (
	ErrAccountNotFound      = errors.New("billing account not found")
	ErrInsufficientBalance  = errors.New("insufficient balance")
	ErrIntentNotFound       = errors.New("payment intent not found")
	ErrIntentAlreadyConfirmed = errors.New("payment intent already confirmed")
	ErrSubscriptionNotFound = errors.New("subscription not found")
	ErrDuplicateIdempotency = errors.New("duplicate idempotency key")
	ErrDisputedState        = errors.New("estado disputado requer ação humana")
	ErrInvalidTransition    = errors.New("transição de estado inválida")
)

// BillingService gerencia o Economic Kernel
type BillingService struct {
	db            *gorm.DB
	stripeService *StripeService
}

// NewBillingService cria uma nova instância do serviço
func NewBillingService(db *gorm.DB, stripeService *StripeService) *BillingService {
	return &BillingService{
		db:            db,
		stripeService: stripeService,
	}
}

// ========================================
// BILLING ACCOUNT
// ========================================

// CreateBillingAccount cria uma conta de billing para uma identidade
func (s *BillingService) CreateBillingAccount(ctx context.Context, userID uuid.UUID, email, phone string) (*BillingAccount, error) {
	// Check if already exists
	var existing BillingAccount
	if err := s.db.Where("user_id = ?", userID).First(&existing).Error; err == nil {
		return &existing, nil // Already exists
	}

	// Create Stripe Customer
	stripeCustomerID, err := s.stripeService.CreateCustomer(ctx, email, phone, userID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to create stripe customer: %w", err)
	}

	// Create billing account
	account := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: stripeCustomerID,
		Balance:          0,
		Currency:         string(CurrencyBRL),
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.db.Create(account).Error; err != nil {
		return nil, fmt.Errorf("failed to create billing account: %w", err)
	}

	return account, nil
}

// GetBillingAccount busca conta por user ID
func (s *BillingService) GetBillingAccount(userID uuid.UUID) (*BillingAccount, error) {
	var account BillingAccount
	if err := s.db.Where("user_id = ?", userID).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

// GetBillingAccountByID busca conta por account ID
func (s *BillingService) GetBillingAccountByID(accountID uuid.UUID) (*BillingAccount, error) {
	var account BillingAccount
	if err := s.db.Where("account_id = ?", accountID).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

// ========================================
// PAYMENT INTENT
// ========================================

// CreatePaymentIntent cria uma intenção de pagamento
func (s *BillingService) CreatePaymentIntent(ctx context.Context, accountID uuid.UUID, amount int64, currency, description, idempotencyKey string) (*PaymentIntent, error) {
	// Check idempotency
	var existing PaymentIntent
	if idempotencyKey != "" {
		if err := s.db.Where("idempotency_key = ?", idempotencyKey).First(&existing).Error; err == nil {
			return &existing, nil // Return existing
		}
	}

	// Get billing account
	account, err := s.GetBillingAccountByID(accountID)
	if err != nil {
		return nil, err
	}

	// Create Stripe PaymentIntent
	stripeIntentID, err := s.stripeService.CreatePaymentIntent(
		ctx,
		amount,
		currency,
		account.StripeCustomerID,
		description,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create stripe payment intent: %w", err)
	}

	// Create our PaymentIntent
	intent := &PaymentIntent{
		IntentID:       uuid.New(),
		AccountID:      accountID,
		Amount:         amount,
		Currency:       currency,
		Status:         string(StatusPending),
		Description:    description,
		StripeIntentID: stripeIntentID,
		IdempotencyKey: idempotencyKey,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.db.Create(intent).Error; err != nil {
		return nil, fmt.Errorf("failed to create payment intent: %w", err)
	}

	return intent, nil
}

// ConfirmPaymentIntent confirma um pagamento (chamado via webhook) usando state machine
func (s *BillingService) ConfirmPaymentIntent(stripeIntentID, stripeChargeID string) (*PaymentIntent, error) {
	var intent PaymentIntent
	if err := s.db.Where("stripe_intent_id = ?", stripeIntentID).First(&intent).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrIntentNotFound
		}
		return nil, err
	}

	// Usar state machine para validar transição
	sm := statemachine.GetPaymentStateMachine()
	currentState := statemachine.PaymentState(intent.Status)
	
	result := sm.ExecuteTransition(currentState, statemachine.EventConfirm)
	
	if result.IsDisputed {
		// Transição inválida → marcar como DISPUTED
		intent.Status = string(statemachine.PaymentDisputed)
		intent.DisputeReason = fmt.Sprintf("Transição inválida: %s → confirm", currentState)
		intent.UpdatedAt = time.Now()
		s.db.Save(&intent)
		return &intent, ErrInvalidTransition
	}

	if intent.Status == string(StatusConfirmed) {
		return &intent, ErrIntentAlreadyConfirmed
	}

	// Update intent
	now := time.Now()
	intent.Status = string(result.ToState)
	intent.StripeChargeID = stripeChargeID
	intent.ConfirmedAt = now
	intent.UpdatedAt = now

	if err := s.db.Save(&intent).Error; err != nil {
		return nil, err
	}

	// Add to ledger
	if err := s.addLedgerEntry(intent.AccountID, "credit", intent.Amount, intent.Currency, intent.Description, intent.IntentID.String()); err != nil {
		return nil, err
	}

	return &intent, nil
}

// FailPaymentIntent marca um pagamento como falho usando state machine
func (s *BillingService) FailPaymentIntent(stripeIntentID, failureCode, failureMessage string) (*PaymentIntent, error) {
	var intent PaymentIntent
	if err := s.db.Where("stripe_intent_id = ?", stripeIntentID).First(&intent).Error; err != nil {
		return nil, err
	}

	// Usar state machine para validar transição
	sm := statemachine.GetPaymentStateMachine()
	currentState := statemachine.PaymentState(intent.Status)
	
	result := sm.ExecuteTransition(currentState, statemachine.EventFail)
	
	if result.IsDisputed {
		intent.Status = string(statemachine.PaymentDisputed)
		intent.DisputeReason = fmt.Sprintf("Transição inválida: %s → fail", currentState)
	} else {
		intent.Status = string(result.ToState)
	}

	intent.FailureCode = failureCode
	intent.FailureMessage = failureMessage
	intent.UpdatedAt = time.Now()

	if err := s.db.Save(&intent).Error; err != nil {
		return nil, err
	}

	return &intent, nil
}

// DisputePaymentIntent marca um pagamento como disputado
func (s *BillingService) DisputePaymentIntent(intentID uuid.UUID, reason string) (*PaymentIntent, error) {
	var intent PaymentIntent
	if err := s.db.Where("intent_id = ?", intentID).First(&intent).Error; err != nil {
		return nil, err
	}

	intent.Status = string(statemachine.PaymentDisputed)
	intent.DisputeReason = reason
	intent.UpdatedAt = time.Now()

	if err := s.db.Save(&intent).Error; err != nil {
		return nil, err
	}

	return &intent, nil
}

// ResolveDispute resolve uma disputa (ação humana)
func (s *BillingService) ResolveDispute(intentID uuid.UUID, resolution string, newStatus string) (*PaymentIntent, error) {
	var intent PaymentIntent
	if err := s.db.Where("intent_id = ?", intentID).First(&intent).Error; err != nil {
		return nil, err
	}

	if intent.Status != string(statemachine.PaymentDisputed) {
		return nil, errors.New("intent não está em estado disputado")
	}

	intent.Status = newStatus
	intent.DisputeReason = ""
	intent.DisputeResolution = resolution
	intent.UpdatedAt = time.Now()

	if err := s.db.Save(&intent).Error; err != nil {
		return nil, err
	}

	return &intent, nil
}

// GetPaymentIntent busca um payment intent
func (s *BillingService) GetPaymentIntent(intentID uuid.UUID) (*PaymentIntent, error) {
	var intent PaymentIntent
	if err := s.db.Where("intent_id = ?", intentID).First(&intent).Error; err != nil {
		return nil, err
	}
	return &intent, nil
}

// ListPaymentIntents lista intents de uma conta
func (s *BillingService) ListPaymentIntents(accountID uuid.UUID, limit int) ([]PaymentIntent, error) {
	var intents []PaymentIntent
	if err := s.db.Where("account_id = ?", accountID).Order("created_at DESC").Limit(limit).Find(&intents).Error; err != nil {
		return nil, err
	}
	return intents, nil
}

// ========================================
// LEDGER
// ========================================

// addLedgerEntry adiciona uma entrada no ledger e atualiza o saldo
func (s *BillingService) addLedgerEntry(accountID uuid.UUID, entryType string, amount int64, currency, description, referenceID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Get current balance
		var account BillingAccount
		if err := tx.Where("account_id = ?", accountID).First(&account).Error; err != nil {
			return err
		}

		// Calculate new balance
		var newBalance int64
		if entryType == "credit" {
			newBalance = account.Balance + amount
		} else {
			newBalance = account.Balance - amount
		}

		// Create ledger entry
		entry := &LedgerEntry{
			EntryID:      uuid.New(),
			AccountID:    accountID,
			Type:         entryType,
			Amount:       amount,
			Currency:     currency,
			Description:  description,
			ReferenceID:  referenceID,
			BalanceAfter: newBalance,
			CreatedAt:    time.Now(),
		}

		if err := tx.Create(entry).Error; err != nil {
			return err
		}

		// Update account balance
		account.Balance = newBalance
		account.UpdatedAt = time.Now()
		return tx.Save(&account).Error
	})
}

// GetLedgerEntries busca entradas do ledger
func (s *BillingService) GetLedgerEntries(accountID uuid.UUID, limit int) ([]LedgerEntry, error) {
	var entries []LedgerEntry
	if err := s.db.Where("account_id = ?", accountID).Order("created_at DESC").Limit(limit).Find(&entries).Error; err != nil {
		return nil, err
	}
	return entries, nil
}

// ========================================
// SUBSCRIPTION
// ========================================

// CreateSubscription cria uma assinatura
func (s *BillingService) CreateSubscription(ctx context.Context, accountID uuid.UUID, planID string, amount int64, currency, interval string) (*Subscription, error) {
	account, err := s.GetBillingAccountByID(accountID)
	if err != nil {
		return nil, err
	}

	// Create Stripe Subscription
	stripeSubID, periodEnd, err := s.stripeService.CreateSubscription(ctx, account.StripeCustomerID, planID)
	if err != nil {
		return nil, fmt.Errorf("failed to create stripe subscription: %w", err)
	}

	now := time.Now()
	sub := &Subscription{
		SubscriptionID:       uuid.New(),
		AccountID:            accountID,
		PlanID:               planID,
		Status:               string(SubStatusActive),
		Amount:               amount,
		Currency:             currency,
		Interval:             interval,
		StripeSubscriptionID: stripeSubID,
		StartedAt:            now,
		CurrentPeriodEnd:     periodEnd,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	if err := s.db.Create(sub).Error; err != nil {
		return nil, err
	}

	return sub, nil
}

// CancelSubscription cancela uma assinatura
func (s *BillingService) CancelSubscription(ctx context.Context, subscriptionID uuid.UUID, reason string) (*Subscription, error) {
	var sub Subscription
	if err := s.db.Where("subscription_id = ?", subscriptionID).First(&sub).Error; err != nil {
		return nil, ErrSubscriptionNotFound
	}

	// Cancel on Stripe
	if err := s.stripeService.CancelSubscription(ctx, sub.StripeSubscriptionID); err != nil {
		return nil, err
	}

	now := time.Now()
	sub.Status = string(SubStatusCanceled)
	sub.CanceledAt = now
	sub.UpdatedAt = now

	if err := s.db.Save(&sub).Error; err != nil {
		return nil, err
	}

	return &sub, nil
}

// GetActiveSubscription busca assinatura ativa de uma conta
func (s *BillingService) GetActiveSubscription(accountID uuid.UUID) (*Subscription, error) {
	var sub Subscription
	if err := s.db.Where("account_id = ? AND status = ?", accountID, string(SubStatusActive)).First(&sub).Error; err != nil {
		return nil, err
	}
	return &sub, nil
}

// ========================================
// PAYOUT
// ========================================

// RequestPayout solicita um saque
func (s *BillingService) RequestPayout(accountID uuid.UUID, amount int64, currency, destination string) (*Payout, error) {
	account, err := s.GetBillingAccountByID(accountID)
	if err != nil {
		return nil, err
	}

	if account.Balance < amount {
		return nil, ErrInsufficientBalance
	}

	payout := &Payout{
		PayoutID:    uuid.New(),
		AccountID:   accountID,
		Amount:      amount,
		Currency:    currency,
		Status:      "pending",
		Destination: destination,
		RequestedAt: time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(payout).Error; err != nil {
		return nil, err
	}

	// Debit from ledger (reserve funds)
	if err := s.addLedgerEntry(accountID, "debit", amount, currency, "Payout requested", payout.PayoutID.String()); err != nil {
		return nil, err
	}

	return payout, nil
}

// ConfirmPayout confirma que o payout foi enviado
func (s *BillingService) ConfirmPayout(payoutID uuid.UUID, stripePayoutID string) (*Payout, error) {
	var payout Payout
	if err := s.db.Where("payout_id = ?", payoutID).First(&payout).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	payout.Status = "sent"
	payout.StripePayoutID = stripePayoutID
	payout.SentAt = now
	payout.UpdatedAt = now

	if err := s.db.Save(&payout).Error; err != nil {
		return nil, err
	}

	return &payout, nil
}


// ========================================
// WEBHOOK IDEMPOTENCY
// ========================================

// IsWebhookProcessed verifica se um webhook já foi processado
func (s *BillingService) IsWebhookProcessed(eventID string) bool {
	var count int64
	s.db.Model(&ProcessedWebhook{}).Where("event_id = ?", eventID).Count(&count)
	return count > 0
}

// MarkWebhookProcessed registra um webhook como processado
func (s *BillingService) MarkWebhookProcessed(eventID, eventType string, success bool, errorMsg string) {
	webhook := &ProcessedWebhook{
		EventID:     eventID,
		EventType:   eventType,
		ProcessedAt: time.Now(),
		Success:     success,
		Error:       errorMsg,
	}
	s.db.Create(webhook)
}

// ========================================
// SUBSCRIPTION UPDATES (para webhooks)
// ========================================

// UpdateSubscriptionStatus atualiza status de subscription por Stripe ID
func (s *BillingService) UpdateSubscriptionStatus(stripeSubID, status string) error {
	return s.db.Model(&Subscription{}).
		Where("stripe_subscription_id = ?", stripeSubID).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

// CancelSubscriptionByStripeID cancela subscription por Stripe ID
func (s *BillingService) CancelSubscriptionByStripeID(stripeSubID, reason string) error {
	now := time.Now()
	return s.db.Model(&Subscription{}).
		Where("stripe_subscription_id = ?", stripeSubID).
		Updates(map[string]interface{}{
			"status":      "canceled",
			"canceled_at": now,
			"updated_at":  now,
		}).Error
}

// GetOrCreateAccountByStripeCustomer busca ou cria account por Stripe customer ID
func (s *BillingService) GetOrCreateAccountByStripeCustomer(stripeCustomerID, email string) (*BillingAccount, error) {
	var account BillingAccount
	
	// Tentar buscar por stripe_customer_id
	if stripeCustomerID != "" {
		if err := s.db.Where("stripe_customer_id = ?", stripeCustomerID).First(&account).Error; err == nil {
			log.Printf("📍 [ACCOUNT] Encontrada por stripe_customer_id: %s → account=%s user=%s", 
				stripeCustomerID, account.AccountID, account.UserID)
			return &account, nil
		}
	}
	
	// Se não encontrou por stripe_customer_id, NÃO criar nova account
	// O checkout deveria ter criado a account antes
	// Isso evita criar accounts órfãs
	log.Printf("⚠️ [ACCOUNT] Não encontrada para stripe_customer_id=%s email=%s", stripeCustomerID, email)
	return nil, ErrAccountNotFound
}

// FindAndLinkStripeCustomer encontra uma account recente sem stripe_customer_id e linka
// Usado como fallback quando o webhook chega antes do customer_id ser salvo
func (s *BillingService) FindAndLinkStripeCustomer(stripeCustomerID, email string) (*BillingAccount, error) {
	var account BillingAccount
	
	// Buscar account mais recente sem stripe_customer_id (criada nos últimos 10 minutos)
	cutoff := time.Now().Add(-10 * time.Minute)
	err := s.db.Where("stripe_customer_id = '' OR stripe_customer_id IS NULL").
		Where("created_at > ?", cutoff).
		Order("created_at DESC").
		First(&account).Error
	
	if err != nil {
		return nil, fmt.Errorf("nenhuma account recente encontrada para linkar: %w", err)
	}
	
	// Atualizar com o stripe_customer_id
	account.StripeCustomerID = stripeCustomerID
	account.UpdatedAt = time.Now()
	
	if err := s.db.Save(&account).Error; err != nil {
		return nil, err
	}
	
	log.Printf("🔗 [ACCOUNT] Linkada stripe_customer_id=%s → account=%s user=%s", 
		stripeCustomerID, account.AccountID, account.UserID)
	
	return &account, nil
}

// CreateSubscriptionFromStripe cria subscription local a partir de dados do Stripe
func (s *BillingService) CreateSubscriptionFromStripe(accountID uuid.UUID, stripeSubID, planID, status string) (*Subscription, error) {
	// Verificar se já existe
	var existing Subscription
	if err := s.db.Where("stripe_subscription_id = ?", stripeSubID).First(&existing).Error; err == nil {
		// Já existe, atualizar status
		existing.Status = status
		existing.UpdatedAt = time.Now()
		s.db.Save(&existing)
		log.Printf("📝 [SUBSCRIPTION] Atualizada: account=%s stripe_sub=%s status=%s", accountID, stripeSubID, status)
		return &existing, nil
	}
	
	now := time.Now()
	sub := &Subscription{
		SubscriptionID:       uuid.New(),
		AccountID:            accountID,
		PlanID:               planID,
		Status:               string(SubStatusActive),
		Amount:               2990, // R$ 29,90 - hardcoded por agora
		Currency:             "brl",
		Interval:             "month",
		StripeSubscriptionID: stripeSubID,
		StartedAt:            now,
		CurrentPeriodEnd:     now.AddDate(0, 1, 0), // +1 mês
		CreatedAt:            now,
		UpdatedAt:            now,
	}
	
	if err := s.db.Create(sub).Error; err != nil {
		return nil, err
	}
	
	// Adicionar entrada no ledger
	s.addLedgerEntry(accountID, "credit", 2990, "brl", "Subscription PROST-QS Pro", stripeSubID)
	
	// 🎉 EVENTO: Assinatura concedida - um humano ganhou poderes novos
	log.Printf("🎉 [SUBSCRIPTION_GRANTED] account=%s plan=%s stripe_sub=%s amount=2990 currency=brl", 
		accountID, planID, stripeSubID)
	log.Printf("   → Capacidades desbloqueadas: criar apps, gerar credentials, gerenciar recursos")
	
	return sub, nil
}

// ========================================
// PAYOUT UPDATES (para webhooks)
// ========================================

// ConfirmPayoutByStripeID confirma payout por Stripe ID
func (s *BillingService) ConfirmPayoutByStripeID(stripePayoutID string) error {
	now := time.Now()
	return s.db.Model(&Payout{}).
		Where("stripe_payout_id = ?", stripePayoutID).
		Updates(map[string]interface{}{
			"status":     "sent",
			"sent_at":    now,
			"updated_at": now,
		}).Error
}

// FailPayoutByStripeID marca payout como falho
func (s *BillingService) FailPayoutByStripeID(stripePayoutID, failureCode, failureMsg string) error {
	return s.db.Model(&Payout{}).
		Where("stripe_payout_id = ?", stripePayoutID).
		Updates(map[string]interface{}{
			"status":     "failed",
			"updated_at": time.Now(),
		}).Error
}

// ========================================
// RECONCILIATION
// ========================================

// ReconciliationResult resultado da reconciliação
type ReconciliationResult struct {
	TotalChecked  int                  `json:"total_checked"`
	Discrepancies []DiscrepancyDetail  `json:"discrepancies"`
}

// DiscrepancyDetail detalhe de uma discrepância
type DiscrepancyDetail struct {
	IntentID       string `json:"intent_id"`
	StripeIntentID string `json:"stripe_intent_id"`
	LocalStatus    string `json:"local_status"`
	StripeStatus   string `json:"stripe_status"`
	LocalAmount    int64  `json:"local_amount"`
	StripeAmount   int64  `json:"stripe_amount"`
	Type           string `json:"type"` // "status_mismatch", "amount_mismatch", "missing_local", "missing_stripe"
}

// RunReconciliation executa reconciliação entre ledger local e Stripe
func (s *BillingService) RunReconciliation(ctx context.Context) (*ReconciliationResult, error) {
	result := &ReconciliationResult{
		Discrepancies: []DiscrepancyDetail{},
	}

	// Buscar payment intents pendentes ou recentes (últimas 24h)
	var intents []PaymentIntent
	cutoff := time.Now().Add(-24 * time.Hour)
	if err := s.db.Where("created_at > ? OR status = ?", cutoff, "pending").Find(&intents).Error; err != nil {
		return nil, err
	}

	result.TotalChecked = len(intents)

	// Para cada intent, verificar status no Stripe
	for _, intent := range intents {
		if intent.StripeIntentID == "" {
			continue
		}

		// Buscar status no Stripe
		stripeStatus, stripeAmount, err := s.stripeService.GetPaymentIntent(ctx, intent.StripeIntentID)
		if err != nil {
			// Intent não encontrado no Stripe
			result.Discrepancies = append(result.Discrepancies, DiscrepancyDetail{
				IntentID:       intent.IntentID.String(),
				StripeIntentID: intent.StripeIntentID,
				LocalStatus:    intent.Status,
				Type:           "missing_stripe",
			})
			continue
		}

		// Verificar status
		localStatus := mapLocalToStripeStatus(intent.Status)
		if localStatus != stripeStatus {
			result.Discrepancies = append(result.Discrepancies, DiscrepancyDetail{
				IntentID:       intent.IntentID.String(),
				StripeIntentID: intent.StripeIntentID,
				LocalStatus:    intent.Status,
				StripeStatus:   stripeStatus,
				Type:           "status_mismatch",
			})
			
			// Marcar como DISPUTED automaticamente
			s.DisputePaymentIntent(intent.IntentID, fmt.Sprintf("Reconciliation: local=%s, stripe=%s", intent.Status, stripeStatus))
		}

		// Verificar amount
		if intent.Amount != stripeAmount {
			result.Discrepancies = append(result.Discrepancies, DiscrepancyDetail{
				IntentID:       intent.IntentID.String(),
				StripeIntentID: intent.StripeIntentID,
				LocalAmount:    intent.Amount,
				StripeAmount:   stripeAmount,
				Type:           "amount_mismatch",
			})
			
			// Marcar como DISPUTED automaticamente
			s.DisputePaymentIntent(intent.IntentID, fmt.Sprintf("Reconciliation: local_amount=%d, stripe_amount=%d", intent.Amount, stripeAmount))
		}
	}

	return result, nil
}

// mapLocalToStripeStatus mapeia status local para status Stripe
func mapLocalToStripeStatus(localStatus string) string {
	switch localStatus {
	case "pending":
		return "requires_payment_method"
	case "confirmed":
		return "succeeded"
	case "failed":
		return "canceled"
	default:
		return localStatus
	}
}

// LogReconciliation registra execução de reconciliação
func (s *BillingService) LogReconciliation(result *ReconciliationResult, err error) {
	log := &ReconciliationLog{
		ID:            uuid.New(),
		StartedAt:     time.Now(),
		CompletedAt:   time.Now(),
		TotalChecked:  result.TotalChecked,
		Discrepancies: len(result.Discrepancies),
	}

	if err != nil {
		log.Status = "failed"
		log.Error = err.Error()
	} else {
		log.Status = "completed"
		if len(result.Discrepancies) > 0 {
			data, _ := json.Marshal(result.Discrepancies)
			log.DiscrepancyData = string(data)
		}
	}

	s.db.Create(log)
}
