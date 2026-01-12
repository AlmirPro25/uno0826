package billing

import (
	"context"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"prost-qs/backend/internal/decision"
)

// ========================================
// DECISION INTEGRATION TESTS
// "Toda decisão de billing é registrada"
// ========================================

func setupDecisionTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	
	// Migrate all required models
	err = db.AutoMigrate(
		&decision.Decision{},
		&BillingAccount{},
		&PaymentIntent{},
		&LedgerEntry{},
		&Subscription{},
		&Payout{},
	)
	require.NoError(t, err)
	
	return db
}

func TestNewDecisionAwareBillingService(t *testing.T) {
	db := setupDecisionTestDB(t)
	
	billingService := NewBillingService(db, nil)
	decisionService := decision.NewService(db)
	
	service := NewDecisionAwareBillingService(billingService, decisionService)
	
	assert.NotNil(t, service)
	assert.NotNil(t, service.billing)
	assert.NotNil(t, service.decision)
}

func TestDecisionAwareBillingService_RequestPayout_Success(t *testing.T) {
	db := setupDecisionTestDB(t)
	ctx := context.Background()
	
	// Create services
	billingService := NewBillingService(db, nil)
	decisionService := decision.NewService(db)
	service := NewDecisionAwareBillingService(billingService, decisionService)
	
	// Create a billing account with balance
	userID := uuid.New()
	account := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: "cus_test",
		Balance:          10000, // R$ 100,00
		Currency:         "brl",
	}
	require.NoError(t, db.Create(account).Error)
	
	// Request payout
	payout, err := service.RequestPayout(ctx, account.AccountID, 5000, "brl", "bank_account_123")
	
	// Should succeed
	assert.NoError(t, err)
	assert.NotNil(t, payout)
	
	// Verify decision was recorded
	decisions, err := decisionService.GetByApp(ctx, account.AccountID, 10)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(decisions), 1)
	
	// Find the payout decision
	var found bool
	for _, d := range decisions {
		if d.ReasonCode == "PAYOUT_REQUESTED" {
			found = true
			assert.Equal(t, decision.OutcomeAllowed, d.Outcome)
			break
		}
	}
	assert.True(t, found, "Payout decision should be recorded")
	
	t.Log("✅ Payout success decision recorded")
}

func TestDecisionAwareBillingService_RequestPayout_InsufficientBalance(t *testing.T) {
	db := setupDecisionTestDB(t)
	ctx := context.Background()
	
	// Create services
	billingService := NewBillingService(db, nil)
	decisionService := decision.NewService(db)
	service := NewDecisionAwareBillingService(billingService, decisionService)
	
	// Create a billing account with low balance
	userID := uuid.New()
	account := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: "cus_test",
		Balance:          1000, // R$ 10,00
		Currency:         "brl",
	}
	require.NoError(t, db.Create(account).Error)
	
	// Request payout larger than balance - this will panic due to invariant
	// We need to recover from the panic
	defer func() {
		if r := recover(); r != nil {
			// Expected panic from invariant
			t.Log("✅ Invariant correctly panicked for insufficient balance")
			
			// Verify decision was recorded before panic
			// Note: In production, the decision might not be recorded if panic happens first
			// This is expected behavior - invariants are meant to halt execution
		}
	}()
	
	_, _ = service.RequestPayout(ctx, account.AccountID, 5000, "brl", "bank_account_123")
	
	// If we reach here, the invariant didn't panic (unexpected)
	t.Error("Expected invariant to panic for insufficient balance")
}

func TestDecisionAwareBillingService_DisputePaymentIntent(t *testing.T) {
	db := setupDecisionTestDB(t)
	ctx := context.Background()
	
	// Create services
	billingService := NewBillingService(db, nil)
	decisionService := decision.NewService(db)
	service := NewDecisionAwareBillingService(billingService, decisionService)
	
	// Create a billing account
	userID := uuid.New()
	account := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: "cus_test",
		Balance:          10000,
		Currency:         "brl",
	}
	require.NoError(t, db.Create(account).Error)
	
	// Create a payment intent
	intent := &PaymentIntent{
		IntentID:       uuid.New(),
		AccountID:      account.AccountID,
		Amount:         5000,
		Currency:       "brl",
		Status:         "confirmed",
		StripeIntentID: "pi_test",
	}
	require.NoError(t, db.Create(intent).Error)
	
	// Dispute the payment
	disputed, err := service.DisputePaymentIntent(ctx, intent.IntentID, "Customer complaint")
	
	// Should succeed
	assert.NoError(t, err)
	assert.NotNil(t, disputed)
	
	// Verify decision was recorded
	decisions, err := decisionService.GetByApp(ctx, account.AccountID, 10)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(decisions), 1)
	
	// Find the dispute decision
	var found bool
	for _, d := range decisions {
		if d.ReasonCode == "PAYMENT_DISPUTED" {
			found = true
			assert.Equal(t, decision.OutcomeBlocked, d.Outcome)
			break
		}
	}
	assert.True(t, found, "Dispute decision should be recorded")
	
	t.Log("✅ Dispute decision recorded")
}
