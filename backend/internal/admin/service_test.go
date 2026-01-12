package admin

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// ========================================
// ADMIN SERVICE TESTS
// ========================================

func TestNewAdminService(t *testing.T) {
	service := NewAdminService(nil)
	assert.NotNil(t, service)
}

// ========================================
// DASHBOARD STATS TESTS
// ========================================

func TestDashboardStats_Model(t *testing.T) {
	stats := &DashboardStats{
		TotalIdentities:      1000,
		TotalBillingAccounts: 800,
		TotalFederatedLinks:  500,
		TotalPaymentIntents:  2500,
		TotalSubscriptions:   600,
		TotalLedgerEntries:   10000,
		TotalRevenue:         50000.50,
		ActiveSubscriptions:  450,
		PendingPayouts:       25,
		IdentitiesLast24h:    50,
		PaymentsLast24h:      100,
	}

	assert.Equal(t, int64(1000), stats.TotalIdentities)
	assert.Equal(t, int64(800), stats.TotalBillingAccounts)
	assert.Equal(t, int64(500), stats.TotalFederatedLinks)
	assert.Equal(t, int64(2500), stats.TotalPaymentIntents)
	assert.Equal(t, int64(600), stats.TotalSubscriptions)
	assert.Equal(t, int64(10000), stats.TotalLedgerEntries)
	assert.InDelta(t, 50000.50, stats.TotalRevenue, 0.01)
	assert.Equal(t, int64(450), stats.ActiveSubscriptions)
	assert.Equal(t, int64(25), stats.PendingPayouts)
	assert.Equal(t, int64(50), stats.IdentitiesLast24h)
	assert.Equal(t, int64(100), stats.PaymentsLast24h)
}

// ========================================
// IDENTITY VIEW TESTS
// ========================================

func TestIdentityView_Model(t *testing.T) {
	now := time.Now()

	view := &IdentityView{
		UserID:       "user-123",
		PrimaryPhone: "+5511999999999",
		Source:       "phone",
		CreatedAt:    now,
		UpdatedAt:    now,
		LinkedProviders: []ProviderLink{
			{
				Provider:   "google",
				ProviderID: "google-456",
				Email:      "user@gmail.com",
				Name:       "Test User",
				LinkedAt:   now,
			},
		},
		BillingAccount: &BillingAccountView{
			AccountID:        "account-789",
			StripeCustomerID: "cus_xxx",
			Balance:          100.50,
			Currency:         "BRL",
		},
	}

	assert.Equal(t, "user-123", view.UserID)
	assert.Equal(t, "+5511999999999", view.PrimaryPhone)
	assert.Equal(t, "phone", view.Source)
	assert.Len(t, view.LinkedProviders, 1)
	assert.Equal(t, "google", view.LinkedProviders[0].Provider)
	assert.NotNil(t, view.BillingAccount)
	assert.Equal(t, "account-789", view.BillingAccount.AccountID)
}

func TestProviderLink_Model(t *testing.T) {
	now := time.Now()

	link := &ProviderLink{
		Provider:   "google",
		ProviderID: "google-123",
		Email:      "user@gmail.com",
		Name:       "Test User",
		LinkedAt:   now,
	}

	assert.Equal(t, "google", link.Provider)
	assert.Equal(t, "google-123", link.ProviderID)
	assert.Equal(t, "user@gmail.com", link.Email)
	assert.Equal(t, "Test User", link.Name)
	assert.Equal(t, now, link.LinkedAt)
}

func TestBillingAccountView_Model(t *testing.T) {
	view := &BillingAccountView{
		AccountID:        "account-123",
		StripeCustomerID: "cus_abc123",
		Balance:          250.75,
		Currency:         "BRL",
	}

	assert.Equal(t, "account-123", view.AccountID)
	assert.Equal(t, "cus_abc123", view.StripeCustomerID)
	assert.InDelta(t, 250.75, view.Balance, 0.01)
	assert.Equal(t, "BRL", view.Currency)
}

// ========================================
// PAYMENT VIEW TESTS
// ========================================

func TestPaymentView_Model(t *testing.T) {
	now := time.Now()
	confirmed := now.Add(time.Minute)

	view := &PaymentView{
		IntentID:       "intent-123",
		AccountID:      "account-456",
		UserID:         "user-789",
		Amount:         99.99,
		Currency:       "BRL",
		Status:         "confirmed",
		Description:    "Monthly subscription",
		StripeIntentID: "pi_xxx",
		CreatedAt:      now,
		ConfirmedAt:    confirmed,
	}

	assert.Equal(t, "intent-123", view.IntentID)
	assert.Equal(t, "account-456", view.AccountID)
	assert.Equal(t, "user-789", view.UserID)
	assert.InDelta(t, 99.99, view.Amount, 0.01)
	assert.Equal(t, "BRL", view.Currency)
	assert.Equal(t, "confirmed", view.Status)
	assert.Equal(t, "Monthly subscription", view.Description)
	assert.Equal(t, "pi_xxx", view.StripeIntentID)
}

// ========================================
// SUBSCRIPTION VIEW TESTS
// ========================================

func TestSubscriptionView_Model(t *testing.T) {
	now := time.Now()
	periodEnd := now.AddDate(0, 1, 0)

	view := &SubscriptionView{
		SubscriptionID:       "sub-123",
		AccountID:            "account-456",
		UserID:               "user-789",
		PlanID:               "plan_pro",
		Status:               "active",
		Amount:               49.90,
		Currency:             "BRL",
		Interval:             "month",
		StripeSubscriptionID: "sub_xxx",
		StartedAt:            now,
		CurrentPeriodEnd:     periodEnd,
	}

	assert.Equal(t, "sub-123", view.SubscriptionID)
	assert.Equal(t, "account-456", view.AccountID)
	assert.Equal(t, "user-789", view.UserID)
	assert.Equal(t, "plan_pro", view.PlanID)
	assert.Equal(t, "active", view.Status)
	assert.InDelta(t, 49.90, view.Amount, 0.01)
	assert.Equal(t, "BRL", view.Currency)
	assert.Equal(t, "month", view.Interval)
	assert.Equal(t, "sub_xxx", view.StripeSubscriptionID)
}

// ========================================
// LEDGER ENTRY VIEW TESTS
// ========================================

func TestLedgerEntryView_Model(t *testing.T) {
	now := time.Now()

	view := &LedgerEntryView{
		EntryID:      "entry-123",
		AccountID:    "account-456",
		UserID:       "user-789",
		Type:         "credit",
		Amount:       100.00,
		Currency:     "BRL",
		Description:  "Payment received",
		ReferenceID:  "ref-abc",
		BalanceAfter: 350.00,
		CreatedAt:    now,
	}

	assert.Equal(t, "entry-123", view.EntryID)
	assert.Equal(t, "account-456", view.AccountID)
	assert.Equal(t, "user-789", view.UserID)
	assert.Equal(t, "credit", view.Type)
	assert.InDelta(t, 100.00, view.Amount, 0.01)
	assert.Equal(t, "BRL", view.Currency)
	assert.Equal(t, "Payment received", view.Description)
	assert.Equal(t, "ref-abc", view.ReferenceID)
	assert.InDelta(t, 350.00, view.BalanceAfter, 0.01)
}

// ========================================
// PAYOUT VIEW TESTS
// ========================================

func TestPayoutView_Model(t *testing.T) {
	now := time.Now()
	sent := now.Add(time.Hour)

	view := &PayoutView{
		PayoutID:       "payout-123",
		AccountID:      "account-456",
		UserID:         "user-789",
		Amount:         500.00,
		Currency:       "BRL",
		Status:         "sent",
		Destination:    "bank_account_xxx",
		StripePayoutID: "po_xxx",
		RequestedAt:    now,
		SentAt:         sent,
	}

	assert.Equal(t, "payout-123", view.PayoutID)
	assert.Equal(t, "account-456", view.AccountID)
	assert.Equal(t, "user-789", view.UserID)
	assert.InDelta(t, 500.00, view.Amount, 0.01)
	assert.Equal(t, "BRL", view.Currency)
	assert.Equal(t, "sent", view.Status)
	assert.Equal(t, "bank_account_xxx", view.Destination)
	assert.Equal(t, "po_xxx", view.StripePayoutID)
}

// ========================================
// USER VIEW TESTS
// ========================================

func TestUserView_Model(t *testing.T) {
	now := time.Now()

	view := &UserView{
		ID:        "user-123",
		Status:    "active",
		Role:      "user",
		CreatedAt: now,
		Balance:   10000,
	}

	assert.Equal(t, "user-123", view.ID)
	assert.Equal(t, "active", view.Status)
	assert.Equal(t, "user", view.Role)
	assert.Equal(t, int64(10000), view.Balance)
}

// ========================================
// ECONOMY OVERVIEW TESTS
// ========================================

func TestEconomyOverview_Model(t *testing.T) {
	overview := &EconomyOverview{
		TotalBalance:  1000000,
		TotalCredits:  500000,
		TotalDebits:   300000,
		TotalAccounts: 1500,
	}

	assert.Equal(t, int64(1000000), overview.TotalBalance)
	assert.Equal(t, int64(500000), overview.TotalCredits)
	assert.Equal(t, int64(300000), overview.TotalDebits)
	assert.Equal(t, int64(1500), overview.TotalAccounts)
}

// ========================================
// DISPUTED ITEM TESTS
// ========================================

func TestDisputedItem_Model(t *testing.T) {
	item := &DisputedItem{
		Type:   "payment_intent",
		ID:     "intent-123",
		Reason: "Chargeback requested",
	}

	assert.Equal(t, "payment_intent", item.Type)
	assert.Equal(t, "intent-123", item.ID)
	assert.Equal(t, "Chargeback requested", item.Reason)
}

func TestDisputedItem_Types(t *testing.T) {
	tests := []struct {
		name     string
		itemType string
	}{
		{"payment intent", "payment_intent"},
		{"subscription", "subscription"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			item := &DisputedItem{Type: tt.itemType}
			assert.Equal(t, tt.itemType, item.Type)
		})
	}
}

// ========================================
// PAGINATION TESTS
// ========================================

func TestPagination_Offset(t *testing.T) {
	tests := []struct {
		name           string
		page           int
		limit          int
		expectedOffset int
	}{
		{"first page", 1, 10, 0},
		{"second page", 2, 10, 10},
		{"third page", 3, 10, 20},
		{"custom limit", 2, 25, 25},
		{"large page", 10, 50, 450},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			offset := (tt.page - 1) * tt.limit
			assert.Equal(t, tt.expectedOffset, offset)
		})
	}
}

// ========================================
// BALANCE CONVERSION TESTS
// ========================================

func TestBalanceConversion_CentavosToReais(t *testing.T) {
	tests := []struct {
		name     string
		centavos int64
		expected float64
	}{
		{"zero", 0, 0.0},
		{"one real", 100, 1.0},
		{"ten reais", 1000, 10.0},
		{"with cents", 1050, 10.50},
		{"large amount", 1000000, 10000.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reais := float64(tt.centavos) / 100
			assert.InDelta(t, tt.expected, reais, 0.001)
		})
	}
}

// ========================================
// IDENTITY VIEW WITHOUT BILLING TESTS
// ========================================

func TestIdentityView_NoBillingAccount(t *testing.T) {
	view := &IdentityView{
		UserID:         "user-123",
		PrimaryPhone:   "+5511999999999",
		BillingAccount: nil,
	}

	assert.Nil(t, view.BillingAccount)
}

func TestIdentityView_NoLinkedProviders(t *testing.T) {
	view := &IdentityView{
		UserID:          "user-123",
		LinkedProviders: []ProviderLink{},
	}

	assert.Empty(t, view.LinkedProviders)
}

// ========================================
// SUBSCRIPTION VIEW CANCELED TESTS
// ========================================

func TestSubscriptionView_Canceled(t *testing.T) {
	now := time.Now()
	canceled := now.Add(-time.Hour)

	view := &SubscriptionView{
		SubscriptionID: "sub-123",
		Status:         "canceled",
		CanceledAt:     canceled,
	}

	assert.Equal(t, "canceled", view.Status)
	assert.False(t, view.CanceledAt.IsZero())
}
