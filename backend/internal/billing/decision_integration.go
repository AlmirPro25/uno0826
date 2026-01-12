package billing

import (
	"context"
	"log"

	"github.com/google/uuid"

	"prost-qs/backend/internal/decision"
)

// ========================================
// DECISION INTEGRATION
// "Toda decisão de billing é registrada"
// ========================================

// DecisionAwareBillingService wraps BillingService to record decisions
type DecisionAwareBillingService struct {
	billing  *BillingService
	decision *decision.Service
}

// NewDecisionAwareBillingService creates a new decision-aware billing service
func NewDecisionAwareBillingService(billing *BillingService, decisionSvc *decision.Service) *DecisionAwareBillingService {
	return &DecisionAwareBillingService{
		billing:  billing,
		decision: decisionSvc,
	}
}

// ConfirmPaymentIntent confirms payment and records decision
func (s *DecisionAwareBillingService) ConfirmPaymentIntent(ctx context.Context, stripeIntentID, stripeChargeID string) (*PaymentIntent, error) {
	intent, err := s.billing.ConfirmPaymentIntent(stripeIntentID, stripeChargeID)
	
	if intent != nil {
		// Record decision
		allowed := err == nil
		reason := "Payment confirmed successfully"
		reasonCode := "PAYMENT_CONFIRMED"
		
		if err != nil {
			reason = err.Error()
			reasonCode = "PAYMENT_FAILED"
		}
		
		metadata := map[string]any{
			"stripe_intent_id": stripeIntentID,
			"stripe_charge_id": stripeChargeID,
			"amount":           intent.Amount,
			"currency":         intent.Currency,
		}
		
		// Get user ID from account
		account, _ := s.billing.GetBillingAccountByID(intent.AccountID)
		var userID uuid.UUID
		if account != nil {
			userID = account.UserID
		}
		
		if decErr := s.decision.RecordPaymentDecision(ctx, intent.AccountID, userID, allowed, reason, reasonCode, metadata); decErr != nil {
			log.Printf("⚠️ [DECISION] Failed to record payment decision: %v", decErr)
		}
	}
	
	return intent, err
}

// FailPaymentIntent fails payment and records decision
func (s *DecisionAwareBillingService) FailPaymentIntent(ctx context.Context, stripeIntentID, failureCode, failureMessage string) (*PaymentIntent, error) {
	intent, err := s.billing.FailPaymentIntent(stripeIntentID, failureCode, failureMessage)
	
	if intent != nil {
		metadata := map[string]any{
			"stripe_intent_id": stripeIntentID,
			"failure_code":     failureCode,
			"failure_message":  failureMessage,
			"amount":           intent.Amount,
			"currency":         intent.Currency,
		}
		
		// Get user ID from account
		account, _ := s.billing.GetBillingAccountByID(intent.AccountID)
		var userID uuid.UUID
		if account != nil {
			userID = account.UserID
		}
		
		if decErr := s.decision.RecordPaymentDecision(ctx, intent.AccountID, userID, false, failureMessage, failureCode, metadata); decErr != nil {
			log.Printf("⚠️ [DECISION] Failed to record payment failure decision: %v", decErr)
		}
	}
	
	return intent, err
}

// DisputePaymentIntent disputes payment and records decision
func (s *DecisionAwareBillingService) DisputePaymentIntent(ctx context.Context, intentID uuid.UUID, reason string) (*PaymentIntent, error) {
	intent, err := s.billing.DisputePaymentIntent(intentID, reason)
	
	if intent != nil {
		metadata := map[string]any{
			"intent_id":      intentID.String(),
			"dispute_reason": reason,
			"amount":         intent.Amount,
			"currency":       intent.Currency,
		}
		
		// Get user ID from account
		account, _ := s.billing.GetBillingAccountByID(intent.AccountID)
		var userID uuid.UUID
		if account != nil {
			userID = account.UserID
		}
		
		if decErr := s.decision.RecordPaymentDecision(ctx, intent.AccountID, userID, false, reason, "PAYMENT_DISPUTED", metadata); decErr != nil {
			log.Printf("⚠️ [DECISION] Failed to record dispute decision: %v", decErr)
		}
	}
	
	return intent, err
}

// RequestPayout requests payout and records decision
func (s *DecisionAwareBillingService) RequestPayout(ctx context.Context, accountID uuid.UUID, amount int64, currency, destination string) (*Payout, error) {
	payout, err := s.billing.RequestPayout(accountID, amount, currency, destination)
	
	// Get user ID from account
	account, _ := s.billing.GetBillingAccountByID(accountID)
	var userID uuid.UUID
	if account != nil {
		userID = account.UserID
	}
	
	allowed := err == nil
	reason := "Payout requested successfully"
	reasonCode := "PAYOUT_REQUESTED"
	
	if err != nil {
		reason = err.Error()
		reasonCode = "PAYOUT_FAILED"
	}
	
	metadata := map[string]any{
		"amount":      amount,
		"currency":    currency,
		"destination": destination,
	}
	
	if payout != nil {
		metadata["payout_id"] = payout.PayoutID.String()
	}
	
	if decErr := s.decision.RecordPaymentDecision(ctx, accountID, userID, allowed, reason, reasonCode, metadata); decErr != nil {
		log.Printf("⚠️ [DECISION] Failed to record payout decision: %v", decErr)
	}
	
	return payout, err
}
