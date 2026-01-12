package billing

import (
	"context"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// ========================================
// CHECKOUT TESTS
// "Primeiro $1 - Validação de Billing"
// ========================================

func setupCheckoutTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	
	// Migrate all required models
	err = db.AutoMigrate(
		&BillingAccount{},
		&PaymentIntent{},
		&LedgerEntry{},
		&Subscription{},
		&Payout{},
		&ProcessedWebhook{},
		&ReconciliationLog{},
		&SubscriptionStateTransition{},
	)
	require.NoError(t, err)
	
	return db
}

func TestStripeService_CreateCheckoutSession_MockMode(t *testing.T) {
	// Stripe service without config = mock mode
	stripeService := NewStripeService()
	
	ctx := context.Background()
	customerID := "cus_mock_123"
	accountID := uuid.New().String()
	successURL := "https://example.com/success"
	cancelURL := "https://example.com/cancel"
	
	url, sessionID, err := stripeService.CreateCheckoutSession(ctx, customerID, accountID, successURL, cancelURL)
	
	assert.NoError(t, err)
	assert.NotEmpty(t, url)
	assert.NotEmpty(t, sessionID)
	assert.Contains(t, url, "stripe.com")
	assert.Contains(t, sessionID, "cs_mock_")
	
	t.Logf("✅ Mock checkout session created: %s", sessionID)
}

func TestStripeService_CreatePortalSession_MockMode(t *testing.T) {
	// Stripe service without config = mock mode
	stripeService := NewStripeService()
	
	ctx := context.Background()
	customerID := "cus_mock_123"
	returnURL := "https://example.com/billing"
	
	url, err := stripeService.CreatePortalSession(ctx, customerID, returnURL)
	
	assert.NoError(t, err)
	assert.NotEmpty(t, url)
	assert.Contains(t, url, "stripe.com")
	
	t.Logf("✅ Mock portal session created: %s", url)
}

func TestBillingService_CreateSubscriptionFromStripe(t *testing.T) {
	db := setupCheckoutTestDB(t)
	stripeService := NewStripeService()
	billingService := NewBillingService(db, stripeService)
	
	// Create a billing account first
	userID := uuid.New()
	account := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: "cus_test_123",
		Balance:          0,
		Currency:         "brl",
	}
	require.NoError(t, db.Create(account).Error)
	
	// Create subscription from Stripe webhook data
	stripeSubID := "sub_test_123"
	planID := "pro"
	status := "active"
	
	sub, err := billingService.CreateSubscriptionFromStripe(account.AccountID, stripeSubID, planID, status)
	
	assert.NoError(t, err)
	assert.NotNil(t, sub)
	assert.Equal(t, stripeSubID, sub.StripeSubscriptionID)
	assert.Equal(t, planID, sub.PlanID)
	assert.Equal(t, "active", sub.Status)
	
	// Verify subscription was saved
	var saved Subscription
	err = db.First(&saved, "stripe_subscription_id = ?", stripeSubID).Error
	assert.NoError(t, err)
	assert.Equal(t, account.AccountID, saved.AccountID)
	
	t.Logf("✅ Subscription created from Stripe: %s", sub.SubscriptionID)
}

func TestBillingService_GetSubscriptionStatus_NoSubscription(t *testing.T) {
	db := setupCheckoutTestDB(t)
	stripeService := NewStripeService()
	billingService := NewBillingService(db, stripeService)
	
	// Create a billing account without subscription
	userID := uuid.New()
	account := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: "cus_test_123",
		Balance:          0,
		Currency:         "brl",
	}
	require.NoError(t, db.Create(account).Error)
	
	// Try to get active subscription
	sub, err := billingService.GetActiveSubscription(account.AccountID)
	
	// Should return error (no subscription)
	assert.Error(t, err)
	assert.Nil(t, sub)
	
	t.Log("✅ Correctly returns error when no subscription exists")
}

func TestBillingService_GetSubscriptionStatus_WithSubscription(t *testing.T) {
	db := setupCheckoutTestDB(t)
	stripeService := NewStripeService()
	billingService := NewBillingService(db, stripeService)
	
	// Create a billing account
	userID := uuid.New()
	account := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: "cus_test_123",
		Balance:          0,
		Currency:         "brl",
	}
	require.NoError(t, db.Create(account).Error)
	
	// Create subscription
	_, err := billingService.CreateSubscriptionFromStripe(account.AccountID, "sub_test_123", "pro", "active")
	require.NoError(t, err)
	
	// Get active subscription
	sub, err := billingService.GetActiveSubscription(account.AccountID)
	
	assert.NoError(t, err)
	assert.NotNil(t, sub)
	assert.Equal(t, "pro", sub.PlanID)
	assert.Equal(t, "active", sub.Status)
	
	t.Logf("✅ Active subscription found: %s", sub.SubscriptionID)
}

func TestCheckout_WebhookIdempotency(t *testing.T) {
	db := setupCheckoutTestDB(t)
	stripeService := NewStripeService()
	billingService := NewBillingService(db, stripeService)
	
	eventID := "evt_checkout_test_123"
	eventType := "checkout.session.completed"
	
	// First time - not processed
	assert.False(t, billingService.IsWebhookProcessed(eventID))
	
	// Mark as processed
	billingService.MarkWebhookProcessed(eventID, eventType, true, "")
	
	// Second time - should be processed
	assert.True(t, billingService.IsWebhookProcessed(eventID))
	
	t.Log("✅ Checkout webhook idempotency working correctly")
}
