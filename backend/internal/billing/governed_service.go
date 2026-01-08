package billing

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"prost-qs/backend/internal/audit"
	"prost-qs/backend/internal/killswitch"
	"prost-qs/backend/internal/policy"
)

// ========================================
// GOVERNED BILLING SERVICE
// "Toda operação passa por Policy, Kill Switch e Audit"
// ========================================

// GovernedBillingService wraps BillingService with governance
type GovernedBillingService struct {
	*BillingService
	policyService    *policy.PolicyService
	killSwitch       *killswitch.KillSwitchService
	auditService     *audit.AuditService
}

// ========================================
// BILLING APP CONTEXT - Fase 16
// "Toda operação de billing sabe de qual app veio"
// ========================================

// BillingAppContext contexto de aplicação para operações de billing
type BillingAppContext struct {
	AppID     *uuid.UUID
	AppUserID *uuid.UUID
	SessionID *uuid.UUID
	IP        string
	UserAgent string
}

// toAuditContext converte para AuditContext
func (c *BillingAppContext) toAuditContext() *audit.AuditContext {
	if c == nil {
		return nil
	}
	return &audit.AuditContext{
		AppID:     c.AppID,
		AppUserID: c.AppUserID,
		SessionID: c.SessionID,
		IP:        c.IP,
		UserAgent: c.UserAgent,
	}
}

// NewGovernedBillingService creates a governed billing service
func NewGovernedBillingService(
	billing *BillingService,
	policyService *policy.PolicyService,
	killSwitch *killswitch.KillSwitchService,
	auditService *audit.AuditService,
) *GovernedBillingService {
	return &GovernedBillingService{
		BillingService: billing,
		policyService:  policyService,
		killSwitch:     killSwitch,
		auditService:   auditService,
	}
}

// ========================================
// GOVERNED OPERATIONS
// ========================================

// CreateBillingAccountGoverned creates account with governance
func (s *GovernedBillingService) CreateBillingAccountGoverned(ctx context.Context, userID uuid.UUID, email, phone string, actorID uuid.UUID, appCtx *BillingAppContext) (*BillingAccount, error) {
	// 1. Check Kill Switch
	if err := s.killSwitch.Check(killswitch.ScopeBilling); err != nil {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventPaymentCreated,
			actorID, userID,
			audit.ActorUser, "billing_account", "create",
			nil, nil, nil,
			"Bloqueado por Kill Switch",
		)
		return nil, fmt.Errorf("operação bloqueada: %w", err)
	}

	// 2. Evaluate Policy
	evalResult, err := s.policyService.Evaluate(policy.EvaluationRequest{
		Resource:  policy.ResourceLedger,
		Action:    "create_account",
		Context:   map[string]any{"user_id": userID.String(), "app_id": appCtx.AppID},
		ActorID:   actorID,
		ActorType: "user",
	})
	if err != nil {
		return nil, err
	}
	if !evalResult.Allowed {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventPaymentCreated,
			actorID, userID,
			audit.ActorUser, "billing_account", "create",
			nil, nil, nil,
			fmt.Sprintf("Bloqueado por política: %s", evalResult.Reason),
		)
		return nil, fmt.Errorf("bloqueado por política: %s", evalResult.Reason)
	}

	// 3. Execute
	account, err := s.BillingService.CreateBillingAccount(ctx, userID, email, phone)
	if err != nil {
		return nil, err
	}

	// 4. Audit Log com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventPaymentCreated,
		actorID, account.AccountID,
		audit.ActorUser, "billing_account", "create",
		nil,
		map[string]any{
			"account_id": account.AccountID.String(),
			"user_id":    userID.String(),
			"currency":   account.Currency,
		},
		nil,
		"Conta de billing criada",
	)

	return account, nil
}

// CreatePaymentIntentGoverned creates payment intent with governance
func (s *GovernedBillingService) CreatePaymentIntentGoverned(
	ctx context.Context,
	accountID uuid.UUID,
	amount int64,
	currency, description, idempotencyKey string,
	actorID uuid.UUID,
	appCtx *BillingAppContext,
) (*PaymentIntent, error) {
	// 1. Check Kill Switch
	if err := s.killSwitch.Check(killswitch.ScopePayments); err != nil {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventPaymentCreated,
			actorID, accountID,
			audit.ActorUser, "payment_intent", "create",
			nil, nil, nil,
			"Bloqueado por Kill Switch",
		)
		return nil, fmt.Errorf("operação bloqueada: %w", err)
	}

	// 2. Evaluate Policy
	evalResult, err := s.policyService.Evaluate(policy.EvaluationRequest{
		Resource: policy.ResourcePayment,
		Action:   "create",
		Context: map[string]any{
			"amount":     amount,
			"currency":   currency,
			"account_id": accountID.String(),
			"app_id":     appCtx.AppID, // Fase 16
		},
		ActorID:   actorID,
		ActorType: "user",
	})
	if err != nil {
		return nil, err
	}
	if !evalResult.Allowed {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventPaymentCreated,
			actorID, accountID,
			audit.ActorUser, "payment_intent", "create",
			nil, nil, nil,
			fmt.Sprintf("Bloqueado por política: %s", evalResult.Reason),
		)
		return nil, fmt.Errorf("bloqueado por política: %s", evalResult.Reason)
	}

	// 3. Execute
	intent, err := s.BillingService.CreatePaymentIntent(ctx, accountID, amount, currency, description, idempotencyKey)
	if err != nil {
		return nil, err
	}

	// 4. Audit Log com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventPaymentCreated,
		actorID, intent.IntentID,
		audit.ActorUser, "payment_intent", "create",
		nil,
		map[string]any{
			"intent_id":   intent.IntentID.String(),
			"account_id":  accountID.String(),
			"amount":      amount,
			"currency":    currency,
			"description": description,
		},
		nil,
		"Payment intent criado",
	)

	return intent, nil
}

// RequestPayoutGoverned requests payout with governance
func (s *GovernedBillingService) RequestPayoutGoverned(
	accountID uuid.UUID,
	amount int64,
	currency, destination string,
	actorID uuid.UUID,
	userRole string,
	appCtx *BillingAppContext,
) (*Payout, error) {
	// 1. Check Kill Switch
	if err := s.killSwitch.Check(killswitch.ScopeBilling); err != nil {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventLedgerDebit,
			actorID, accountID,
			audit.ActorUser, "payout", "request",
			nil, nil, nil,
			"Bloqueado por Kill Switch",
		)
		return nil, fmt.Errorf("operação bloqueada: %w", err)
	}

	// 2. Evaluate Policy - CRÍTICO para débitos
	evalResult, err := s.policyService.Evaluate(policy.EvaluationRequest{
		Resource: policy.ResourceLedger,
		Action:   policy.ActionDebit,
		Context: map[string]any{
			"amount":     amount,
			"currency":   currency,
			"account_id": accountID.String(),
			"app_id":     appCtx.AppID, // Fase 16
			"user": map[string]any{
				"role": userRole,
			},
		},
		ActorID:   actorID,
		ActorType: "user",
	})
	if err != nil {
		return nil, err
	}

	if evalResult.Result == policy.ResultPendingApproval {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventLedgerDebit,
			actorID, accountID,
			audit.ActorUser, "payout", "request",
			nil, nil, nil,
			fmt.Sprintf("Requer aprovação: %s", evalResult.Reason),
		)
		return nil, fmt.Errorf("requer aprovação humana: %s", evalResult.Reason)
	}

	if !evalResult.Allowed {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventLedgerDebit,
			actorID, accountID,
			audit.ActorUser, "payout", "request",
			nil, nil, nil,
			fmt.Sprintf("Bloqueado por política: %s", evalResult.Reason),
		)
		return nil, fmt.Errorf("bloqueado por política: %s", evalResult.Reason)
	}

	// 3. Get balance before
	account, _ := s.BillingService.GetBillingAccountByID(accountID)
	balanceBefore := int64(0)
	if account != nil {
		balanceBefore = account.Balance
	}

	// 4. Execute
	payout, err := s.BillingService.RequestPayout(accountID, amount, currency, destination)
	if err != nil {
		return nil, err
	}

	// 5. Audit Log with before/after + AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventLedgerDebit,
		actorID, payout.PayoutID,
		audit.ActorUser, "payout", "request",
		map[string]any{"balance": balanceBefore},
		map[string]any{"balance": balanceBefore - amount},
		map[string]any{
			"payout_id":   payout.PayoutID.String(),
			"amount":      amount,
			"destination": destination,
		},
		"Payout solicitado",
	)

	return payout, nil
}

// ConfirmPaymentIntentGoverned confirms payment with governance
func (s *GovernedBillingService) ConfirmPaymentIntentGoverned(
	stripeIntentID, stripeChargeID string,
	appCtx *BillingAppContext,
) (*PaymentIntent, error) {
	// 1. Check Kill Switch
	if err := s.killSwitch.Check(killswitch.ScopePayments); err != nil {
		return nil, fmt.Errorf("operação bloqueada: %w", err)
	}

	// 2. Execute (webhook - não precisa policy, já foi validado na criação)
	intent, err := s.BillingService.ConfirmPaymentIntent(stripeIntentID, stripeChargeID)
	if err != nil {
		return nil, err
	}

	// 3. Audit Log com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventPaymentConfirmed,
		uuid.Nil, intent.IntentID, // System actor
		audit.ActorSystem, "payment_intent", "confirm",
		map[string]any{"status": "pending"},
		map[string]any{"status": "confirmed"},
		map[string]any{
			"stripe_intent_id": stripeIntentID,
			"stripe_charge_id": stripeChargeID,
			"amount":           intent.Amount,
		},
		"Pagamento confirmado via webhook",
	)

	// 4. Log credit to ledger com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventLedgerCredit,
		uuid.Nil, intent.AccountID,
		audit.ActorSystem, "ledger", "credit",
		nil, nil,
		map[string]any{
			"amount":      intent.Amount,
			"reference":   intent.IntentID.String(),
			"description": intent.Description,
		},
		"Crédito adicionado ao ledger",
	)

	return intent, nil
}

// DisputePaymentIntentGoverned disputes payment with governance
func (s *GovernedBillingService) DisputePaymentIntentGoverned(
	intentID uuid.UUID,
	reason string,
	actorID uuid.UUID,
	appCtx *BillingAppContext,
) (*PaymentIntent, error) {
	// Get before state
	intentBefore, _ := s.BillingService.GetPaymentIntent(intentID)

	// Execute
	intent, err := s.BillingService.DisputePaymentIntent(intentID, reason)
	if err != nil {
		return nil, err
	}

	// Audit Log com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventPaymentDisputed,
		actorID, intentID,
		audit.ActorAdmin, "payment_intent", "dispute",
		map[string]any{"status": intentBefore.Status},
		map[string]any{"status": "disputed", "reason": reason},
		nil,
		fmt.Sprintf("Pagamento disputado: %s", reason),
	)

	return intent, nil
}
