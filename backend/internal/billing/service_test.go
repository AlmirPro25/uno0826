package billing

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// ========================================
// TEST HELPERS
// ========================================

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate schemas
	err = db.AutoMigrate(
		&BillingAccount{},
		&PaymentIntent{},
		&Subscription{},
		&LedgerEntry{},
		&Payout{},
		&ProcessedWebhook{},
		&ReconciliationLog{},
		&SubscriptionStateTransition{},
	)
	require.NoError(t, err)

	return db
}

func createTestAccount(t *testing.T, db *gorm.DB, userID uuid.UUID) *BillingAccount {
	account := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: "cus_test_" + uuid.New().String()[:8],
		Balance:          0,
		Currency:         "BRL",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	err := db.Create(account).Error
	require.NoError(t, err)
	return account
}

// MockStripeService para testes
type MockStripeService struct{}

func (m *MockStripeService) CreateCustomer(ctx interface{}, email, phone, userID string) (string, error) {
	return "cus_mock_" + uuid.New().String()[:8], nil
}

func (m *MockStripeService) CreatePaymentIntent(ctx interface{}, amount int64, currency, customerID, description string) (string, error) {
	return "pi_mock_" + uuid.New().String()[:8], nil
}

func (m *MockStripeService) CreateSubscription(ctx interface{}, customerID, planID string) (string, time.Time, error) {
	return "sub_mock_" + uuid.New().String()[:8], time.Now().AddDate(0, 1, 0), nil
}

func (m *MockStripeService) CancelSubscription(ctx interface{}, subscriptionID string) error {
	return nil
}

func (m *MockStripeService) GetPaymentIntent(ctx interface{}, intentID string) (string, int64, error) {
	return "succeeded", 1000, nil
}

// ========================================
// BILLING ACCOUNT TESTS
// ========================================

func TestBillingAccount_Creation(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()

	account := createTestAccount(t, db, userID)

	assert.NotEqual(t, uuid.Nil, account.AccountID)
	assert.Equal(t, userID, account.UserID)
	assert.Equal(t, int64(0), account.Balance)
	assert.Equal(t, "BRL", account.Currency)
}

func TestBillingAccount_UniquePerUser(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()

	// Create first account
	createTestAccount(t, db, userID)

	// Try to create second account for same user
	account2 := &BillingAccount{
		AccountID:        uuid.New(),
		UserID:           userID,
		StripeCustomerID: "cus_test_2",
		Balance:          0,
		Currency:         "BRL",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	err := db.Create(account2).Error
	assert.Error(t, err) // Should fail due to unique constraint
}

func TestBillingService_GetBillingAccount(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)

	service := &BillingService{db: db}

	// Test get by user ID
	found, err := service.GetBillingAccount(userID)
	assert.NoError(t, err)
	assert.Equal(t, account.AccountID, found.AccountID)

	// Test get by account ID
	found2, err := service.GetBillingAccountByID(account.AccountID)
	assert.NoError(t, err)
	assert.Equal(t, account.UserID, found2.UserID)
}

func TestBillingService_GetBillingAccount_NotFound(t *testing.T) {
	db := setupTestDB(t)
	service := &BillingService{db: db}

	_, err := service.GetBillingAccount(uuid.New())
	assert.Error(t, err)
	assert.Equal(t, ErrAccountNotFound, err)
}

// ========================================
// PAYMENT INTENT TESTS
// ========================================

func TestPaymentIntent_Creation(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)

	intent := &PaymentIntent{
		IntentID:       uuid.New(),
		AccountID:      account.AccountID,
		Amount:         1000, // R$ 10,00
		Currency:       "BRL",
		Status:         string(StatusPending),
		Description:    "Test payment",
		StripeIntentID: "pi_test_123",
		IdempotencyKey: "idem_" + uuid.New().String(),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	err := db.Create(intent).Error
	assert.NoError(t, err)

	// Verify intent was created
	var found PaymentIntent
	err = db.Where("intent_id = ?", intent.IntentID).First(&found).Error
	assert.NoError(t, err)
	assert.Equal(t, int64(1000), found.Amount)
	assert.Equal(t, "pending", found.Status)
}

func TestPaymentIntent_IdempotencyKey(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	idempotencyKey := "idem_unique_123"

	// Create first intent
	intent1 := &PaymentIntent{
		IntentID:       uuid.New(),
		AccountID:      account.AccountID,
		Amount:         1000,
		Currency:       "BRL",
		Status:         string(StatusPending),
		IdempotencyKey: idempotencyKey,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	err := db.Create(intent1).Error
	assert.NoError(t, err)

	// Try to create second intent with same idempotency key
	intent2 := &PaymentIntent{
		IntentID:       uuid.New(),
		AccountID:      account.AccountID,
		Amount:         2000,
		Currency:       "BRL",
		Status:         string(StatusPending),
		IdempotencyKey: idempotencyKey,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	err = db.Create(intent2).Error
	assert.Error(t, err) // Should fail due to unique constraint
}

func TestBillingService_GetPaymentIntent(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	intent := &PaymentIntent{
		IntentID:       uuid.New(),
		AccountID:      account.AccountID,
		Amount:         1000,
		Currency:       "BRL",
		Status:         string(StatusPending),
		StripeIntentID: "pi_test_123",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	db.Create(intent)

	found, err := service.GetPaymentIntent(intent.IntentID)
	assert.NoError(t, err)
	assert.Equal(t, int64(1000), found.Amount)
}

func TestBillingService_ListPaymentIntents(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	// Create multiple intents
	for i := 0; i < 5; i++ {
		intent := &PaymentIntent{
			IntentID:       uuid.New(),
			AccountID:      account.AccountID,
			Amount:         int64(1000 * (i + 1)),
			Currency:       "BRL",
			Status:         string(StatusPending),
			StripeIntentID: "pi_test_" + uuid.New().String()[:8],
			IdempotencyKey: "idem_list_" + uuid.New().String(), // Unique key for each
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		db.Create(intent)
	}

	intents, err := service.ListPaymentIntents(account.AccountID, 10)
	assert.NoError(t, err)
	assert.Len(t, intents, 5)
}

// ========================================
// LEDGER TESTS
// ========================================

func TestLedgerEntry_Creation(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)

	entry := &LedgerEntry{
		EntryID:      uuid.New(),
		AccountID:    account.AccountID,
		Type:         "credit",
		Amount:       1000,
		Currency:     "BRL",
		Description:  "Test credit",
		ReferenceID:  uuid.New().String(),
		BalanceAfter: 1000,
		CreatedAt:    time.Now(),
	}

	err := db.Create(entry).Error
	assert.NoError(t, err)

	// Verify entry was created
	var found LedgerEntry
	err = db.Where("entry_id = ?", entry.EntryID).First(&found).Error
	assert.NoError(t, err)
	assert.Equal(t, "credit", found.Type)
	assert.Equal(t, int64(1000), found.Amount)
}

func TestBillingService_GetLedgerEntries(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	// Create multiple entries
	balance := int64(0)
	for i := 0; i < 3; i++ {
		balance += 1000
		entry := &LedgerEntry{
			EntryID:      uuid.New(),
			AccountID:    account.AccountID,
			Type:         "credit",
			Amount:       1000,
			Currency:     "BRL",
			Description:  "Test credit",
			BalanceAfter: balance,
			CreatedAt:    time.Now(),
		}
		db.Create(entry)
	}

	entries, err := service.GetLedgerEntries(account.AccountID, 10)
	assert.NoError(t, err)
	assert.Len(t, entries, 3)
}

// ========================================
// SUBSCRIPTION TESTS
// ========================================

func TestSubscription_Creation(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)

	now := time.Now()
	sub := &Subscription{
		SubscriptionID:       uuid.New(),
		AccountID:            account.AccountID,
		PlanID:               "pro",
		Status:               string(SubStatusActive),
		Amount:               2990,
		Currency:             "BRL",
		Interval:             "month",
		StripeSubscriptionID: "sub_test_123",
		StartedAt:            now,
		CurrentPeriodEnd:     now.AddDate(0, 1, 0),
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	err := db.Create(sub).Error
	assert.NoError(t, err)

	// Verify subscription was created
	var found Subscription
	err = db.Where("subscription_id = ?", sub.SubscriptionID).First(&found).Error
	assert.NoError(t, err)
	assert.Equal(t, "pro", found.PlanID)
	assert.Equal(t, "active", found.Status)
}

func TestBillingService_GetActiveSubscription(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	now := time.Now()
	sub := &Subscription{
		SubscriptionID:       uuid.New(),
		AccountID:            account.AccountID,
		PlanID:               "pro",
		Status:               string(SubStatusActive),
		Amount:               2990,
		Currency:             "BRL",
		Interval:             "month",
		StripeSubscriptionID: "sub_test_123",
		StartedAt:            now,
		CurrentPeriodEnd:     now.AddDate(0, 1, 0),
		CreatedAt:            now,
		UpdatedAt:            now,
	}
	db.Create(sub)

	found, err := service.GetActiveSubscription(account.AccountID)
	assert.NoError(t, err)
	assert.Equal(t, "pro", found.PlanID)
}

func TestBillingService_UpdateSubscriptionStatus(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	now := time.Now()
	sub := &Subscription{
		SubscriptionID:       uuid.New(),
		AccountID:            account.AccountID,
		PlanID:               "pro",
		Status:               string(SubStatusActive),
		Amount:               2990,
		Currency:             "BRL",
		Interval:             "month",
		StripeSubscriptionID: "sub_test_123",
		StartedAt:            now,
		CurrentPeriodEnd:     now.AddDate(0, 1, 0),
		CreatedAt:            now,
		UpdatedAt:            now,
	}
	db.Create(sub)

	// Update status
	err := service.UpdateSubscriptionStatus("sub_test_123", "past_due")
	assert.NoError(t, err)

	// Verify status was updated
	var found Subscription
	db.Where("stripe_subscription_id = ?", "sub_test_123").First(&found)
	assert.Equal(t, "past_due", found.Status)
}

// ========================================
// PAYOUT TESTS
// ========================================

func TestPayout_Creation(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)

	// Add balance first
	account.Balance = 10000
	db.Save(account)

	payout := &Payout{
		PayoutID:    uuid.New(),
		AccountID:   account.AccountID,
		Amount:      5000,
		Currency:    "BRL",
		Status:      "pending",
		Destination: "pix:test@email.com",
		RequestedAt: time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err := db.Create(payout).Error
	assert.NoError(t, err)

	// Verify payout was created
	var found Payout
	err = db.Where("payout_id = ?", payout.PayoutID).First(&found).Error
	assert.NoError(t, err)
	assert.Equal(t, int64(5000), found.Amount)
	assert.Equal(t, "pending", found.Status)
}

func TestBillingService_RequestPayout_InsufficientBalance(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	// Account has 0 balance
	// Com invariants FATAL, isso agora causa panic (comportamento correto)
	// O sistema se recusa a processar payout que excede saldo
	assert.Panics(t, func() {
		service.RequestPayout(account.AccountID, 5000, "BRL", "pix:test@email.com")
	}, "Payout excedendo saldo deve causar panic devido à invariant FATAL")
}

// ========================================
// WEBHOOK IDEMPOTENCY TESTS
// ========================================

func TestBillingService_WebhookIdempotency(t *testing.T) {
	db := setupTestDB(t)
	service := &BillingService{db: db}

	eventID := "evt_test_123"

	// First check - not processed
	assert.False(t, service.IsWebhookProcessed(eventID))

	// Mark as processed
	service.MarkWebhookProcessed(eventID, "payment_intent.succeeded", true, "")

	// Second check - should be processed
	assert.True(t, service.IsWebhookProcessed(eventID))
}

// ========================================
// STATE TRANSITION TESTS
// ========================================

func TestBillingService_RecordStateTransition(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	subID := uuid.New()

	err := service.RecordStateTransition(
		subID,
		account.AccountID,
		"none",
		"active",
		"webhook",
		"evt_test_123",
		`{"plan":"pro"}`,
	)
	assert.NoError(t, err)

	// Verify transition was recorded
	transitions, err := service.GetSubscriptionTransitions(subID)
	assert.NoError(t, err)
	assert.Len(t, transitions, 1)
	assert.Equal(t, "none", transitions[0].FromState)
	assert.Equal(t, "active", transitions[0].ToState)
}

func TestBillingService_GetTransitionStats(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	// Record multiple transitions
	for i := 0; i < 3; i++ {
		service.RecordStateTransition(
			uuid.New(),
			account.AccountID,
			"none",
			"active",
			"webhook",
			"evt_"+uuid.New().String()[:8],
			"",
		)
	}

	for i := 0; i < 2; i++ {
		service.RecordStateTransition(
			uuid.New(),
			account.AccountID,
			"active",
			"canceled",
			"api",
			"",
			"",
		)
	}

	stats, err := service.GetTransitionStats(time.Now().Add(-1 * time.Hour))
	assert.NoError(t, err)
	assert.Equal(t, int64(3), stats["none_to_active"])
	assert.Equal(t, int64(2), stats["active_to_canceled"])
}

// ========================================
// INTEGRATION TESTS
// ========================================

func TestBillingFlow_CompletePayment(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	// 1. Create payment intent
	intent := &PaymentIntent{
		IntentID:       uuid.New(),
		AccountID:      account.AccountID,
		Amount:         1000,
		Currency:       "BRL",
		Status:         string(StatusPending),
		Description:    "Test payment",
		StripeIntentID: "pi_test_flow",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	db.Create(intent)

	// 2. Confirm payment (simulating webhook)
	confirmed, err := service.ConfirmPaymentIntent("pi_test_flow", "ch_test_123")
	assert.NoError(t, err)
	assert.Equal(t, "confirmed", confirmed.Status)

	// 3. Verify ledger entry was created
	entries, _ := service.GetLedgerEntries(account.AccountID, 10)
	assert.Len(t, entries, 1)
	assert.Equal(t, "credit", entries[0].Type)
	assert.Equal(t, int64(1000), entries[0].Amount)

	// 4. Verify account balance was updated
	updatedAccount, _ := service.GetBillingAccountByID(account.AccountID)
	assert.Equal(t, int64(1000), updatedAccount.Balance)
}

func TestBillingFlow_SubscriptionLifecycle(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	// 1. Create subscription from Stripe webhook
	sub, err := service.CreateSubscriptionFromStripe(
		account.AccountID,
		"sub_test_lifecycle",
		"pro",
		"active",
	)
	assert.NoError(t, err)
	assert.Equal(t, "active", sub.Status)

	// 2. Verify transition was recorded
	transitions, _ := service.GetSubscriptionTransitions(sub.SubscriptionID)
	assert.Len(t, transitions, 1)
	assert.Equal(t, "none", transitions[0].FromState)
	assert.Equal(t, "active", transitions[0].ToState)

	// 3. Update to past_due
	err = service.UpdateSubscriptionStatus("sub_test_lifecycle", "past_due")
	assert.NoError(t, err)

	// 4. Verify second transition
	transitions, _ = service.GetSubscriptionTransitions(sub.SubscriptionID)
	assert.Len(t, transitions, 2)

	// 5. Cancel subscription
	err = service.CancelSubscriptionByStripeID("sub_test_lifecycle", "user_requested")
	assert.NoError(t, err)

	// 6. Verify final state
	var finalSub Subscription
	db.Where("stripe_subscription_id = ?", "sub_test_lifecycle").First(&finalSub)
	assert.Equal(t, "canceled", finalSub.Status)
}

// ========================================
// EDGE CASES
// ========================================

func TestEdgeCase_DoubleConfirmPayment(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)
	service := &BillingService{db: db}

	intent := &PaymentIntent{
		IntentID:       uuid.New(),
		AccountID:      account.AccountID,
		Amount:         1000,
		Currency:       "BRL",
		Status:         string(StatusPending),
		StripeIntentID: "pi_test_double",
		IdempotencyKey: "idem_double_" + uuid.New().String(),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	db.Create(intent)

	// First confirm
	_, err := service.ConfirmPaymentIntent("pi_test_double", "ch_test_1")
	assert.NoError(t, err)

	// Second confirm should fail (either already confirmed or invalid transition)
	_, err = service.ConfirmPaymentIntent("pi_test_double", "ch_test_2")
	assert.Error(t, err)
	// The system uses state machine, so it returns ErrInvalidTransition or ErrIntentAlreadyConfirmed
	assert.True(t, err == ErrIntentAlreadyConfirmed || err == ErrInvalidTransition)
}

func TestEdgeCase_NegativeBalance(t *testing.T) {
	db := setupTestDB(t)
	userID := uuid.New()
	account := createTestAccount(t, db, userID)

	// Manually set negative balance (credit)
	account.Balance = -5000 // R$ 50 credit
	db.Save(account)

	var found BillingAccount
	db.Where("account_id = ?", account.AccountID).First(&found)
	assert.Equal(t, int64(-5000), found.Balance)
}
