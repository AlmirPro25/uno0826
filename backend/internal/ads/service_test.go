package ads

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================================
// ADS SERVICE TESTS
// ========================================

func TestNewAdsService(t *testing.T) {
	service := NewAdsService(nil, nil, nil)
	assert.NotNil(t, service)
}

// ========================================
// AD ACCOUNT TESTS
// ========================================

func TestAdAccount_Model(t *testing.T) {
	id := uuid.New()
	tenantID := uuid.New()
	userID := uuid.New()
	balanceID := uuid.New()
	now := time.Now()

	account := &AdAccount{
		ID:               id,
		TenantID:         tenantID,
		UserID:           userID,
		BalanceAccountID: balanceID,
		Name:             "Test Ad Account",
		Status:           string(AdAccountActive),
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	assert.Equal(t, id, account.ID)
	assert.Equal(t, tenantID, account.TenantID)
	assert.Equal(t, userID, account.UserID)
	assert.Equal(t, balanceID, account.BalanceAccountID)
	assert.Equal(t, "Test Ad Account", account.Name)
	assert.Equal(t, "active", account.Status)
}

func TestAdAccountStatus_Constants(t *testing.T) {
	assert.Equal(t, AdAccountStatus("active"), AdAccountActive)
	assert.Equal(t, AdAccountStatus("suspended"), AdAccountSuspended)
}

func TestAdAccount_TableName(t *testing.T) {
	account := &AdAccount{}
	assert.Equal(t, "ad_accounts", account.TableName())
}

// ========================================
// AD BUDGET TESTS
// ========================================

func TestAdBudget_Model(t *testing.T) {
	id := uuid.New()
	accountID := uuid.New()
	now := time.Now()
	end := now.AddDate(0, 1, 0)

	budget := &AdBudget{
		ID:          id,
		AdAccountID: accountID,
		AmountTotal: 100000, // R$ 1000,00
		AmountSpent: 25000,  // R$ 250,00
		Currency:    "BRL",
		Period:      string(BudgetMonthly),
		PeriodStart: now,
		PeriodEnd:   &end,
		Status:      string(BudgetActive),
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	assert.Equal(t, id, budget.ID)
	assert.Equal(t, accountID, budget.AdAccountID)
	assert.Equal(t, int64(100000), budget.AmountTotal)
	assert.Equal(t, int64(25000), budget.AmountSpent)
	assert.Equal(t, "BRL", budget.Currency)
	assert.Equal(t, "monthly", budget.Period)
}

func TestAdBudget_AmountRemaining(t *testing.T) {
	tests := []struct {
		name     string
		total    int64
		spent    int64
		expected int64
	}{
		{"full budget", 100000, 0, 100000},
		{"partial spent", 100000, 25000, 75000},
		{"half spent", 100000, 50000, 50000},
		{"almost exhausted", 100000, 99000, 1000},
		{"fully exhausted", 100000, 100000, 0},
		{"overspent", 100000, 110000, -10000},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			budget := &AdBudget{
				AmountTotal: tt.total,
				AmountSpent: tt.spent,
			}
			assert.Equal(t, tt.expected, budget.AmountRemaining())
		})
	}
}

func TestAdBudget_IsExhausted(t *testing.T) {
	tests := []struct {
		name     string
		total    int64
		spent    int64
		expected bool
	}{
		{"not exhausted", 100000, 50000, false},
		{"exactly exhausted", 100000, 100000, true},
		{"overspent", 100000, 110000, true},
		{"fresh budget", 100000, 0, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			budget := &AdBudget{
				AmountTotal: tt.total,
				AmountSpent: tt.spent,
			}
			assert.Equal(t, tt.expected, budget.IsExhausted())
		})
	}
}

func TestBudgetPeriod_Constants(t *testing.T) {
	assert.Equal(t, BudgetPeriod("daily"), BudgetDaily)
	assert.Equal(t, BudgetPeriod("monthly"), BudgetMonthly)
	assert.Equal(t, BudgetPeriod("lifetime"), BudgetLifetime)
}

func TestBudgetStatus_Constants(t *testing.T) {
	assert.Equal(t, BudgetStatus("active"), BudgetActive)
	assert.Equal(t, BudgetStatus("exhausted"), BudgetExhausted)
	assert.Equal(t, BudgetStatus("disputed"), BudgetDisputed)
}

func TestAdBudget_TableName(t *testing.T) {
	budget := &AdBudget{}
	assert.Equal(t, "ad_budgets", budget.TableName())
}

// ========================================
// AD CAMPAIGN TESTS
// ========================================

func TestAdCampaign_Model(t *testing.T) {
	id := uuid.New()
	accountID := uuid.New()
	budgetID := uuid.New()
	now := time.Now()
	start := now
	end := now.AddDate(0, 0, 30)

	campaign := &AdCampaign{
		ID:              id,
		AdAccountID:     accountID,
		BudgetID:        budgetID,
		Name:            "Summer Sale Campaign",
		Objective:       string(ObjectiveClicks),
		BidStrategy:     string(BidLowestCost),
		BidAmount:       50,
		DailySpendLimit: 10000,
		TotalSpent:      5000,
		Status:          string(CampaignActive),
		StartAt:         &start,
		EndAt:           &end,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	assert.Equal(t, id, campaign.ID)
	assert.Equal(t, accountID, campaign.AdAccountID)
	assert.Equal(t, budgetID, campaign.BudgetID)
	assert.Equal(t, "Summer Sale Campaign", campaign.Name)
	assert.Equal(t, "clicks", campaign.Objective)
	assert.Equal(t, "lowest_cost", campaign.BidStrategy)
	assert.Equal(t, int64(50), campaign.BidAmount)
	assert.Equal(t, int64(10000), campaign.DailySpendLimit)
	assert.Equal(t, int64(5000), campaign.TotalSpent)
	assert.Equal(t, "active", campaign.Status)
}

func TestCampaignStatus_Constants(t *testing.T) {
	assert.Equal(t, CampaignStatus("draft"), CampaignDraft)
	assert.Equal(t, CampaignStatus("active"), CampaignActive)
	assert.Equal(t, CampaignStatus("paused"), CampaignPaused)
	assert.Equal(t, CampaignStatus("completed"), CampaignCompleted)
	assert.Equal(t, CampaignStatus("disputed"), CampaignDisputed)
}

func TestCampaignObjective_Constants(t *testing.T) {
	assert.Equal(t, CampaignObjective("impressions"), ObjectiveImpressions)
	assert.Equal(t, CampaignObjective("clicks"), ObjectiveClicks)
	assert.Equal(t, CampaignObjective("conversions"), ObjectiveConversions)
}

func TestBidStrategy_Constants(t *testing.T) {
	assert.Equal(t, BidStrategy("lowest_cost"), BidLowestCost)
	assert.Equal(t, BidStrategy("target_cost"), BidTargetCost)
	assert.Equal(t, BidStrategy("manual"), BidManual)
}

func TestAdCampaign_TableName(t *testing.T) {
	campaign := &AdCampaign{}
	assert.Equal(t, "ad_campaigns", campaign.TableName())
}

// ========================================
// AD SPEND EVENT TESTS
// ========================================

func TestAdSpendEvent_Model(t *testing.T) {
	id := uuid.New()
	campaignID := uuid.New()
	budgetID := uuid.New()
	ledgerID := uuid.New()
	now := time.Now()
	applied := now.Add(time.Second)

	event := &AdSpendEvent{
		ID:            id,
		CampaignID:    campaignID,
		BudgetID:      budgetID,
		Amount:        500,
		Quantity:      1000,
		Unit:          string(SpendUnitImpression),
		Source:        string(SpendSourceInternal),
		Status:        string(SpendApplied),
		LedgerEntryID: &ledgerID,
		OccurredAt:    now,
		AppliedAt:     &applied,
		CreatedAt:     now,
	}

	assert.Equal(t, id, event.ID)
	assert.Equal(t, campaignID, event.CampaignID)
	assert.Equal(t, budgetID, event.BudgetID)
	assert.Equal(t, int64(500), event.Amount)
	assert.Equal(t, int64(1000), event.Quantity)
	assert.Equal(t, "impression", event.Unit)
	assert.Equal(t, "internal", event.Source)
	assert.Equal(t, "applied", event.Status)
	assert.Equal(t, &ledgerID, event.LedgerEntryID)
}

func TestSpendUnit_Constants(t *testing.T) {
	assert.Equal(t, SpendUnit("impression"), SpendUnitImpression)
	assert.Equal(t, SpendUnit("click"), SpendUnitClick)
	assert.Equal(t, SpendUnit("conversion"), SpendUnitConversion)
}

func TestSpendSource_Constants(t *testing.T) {
	assert.Equal(t, SpendSource("internal"), SpendSourceInternal)
	assert.Equal(t, SpendSource("external"), SpendSourceExternal)
}

func TestSpendEventStatus_Constants(t *testing.T) {
	assert.Equal(t, SpendEventStatus("pending"), SpendPending)
	assert.Equal(t, SpendEventStatus("applied"), SpendApplied)
	assert.Equal(t, SpendEventStatus("failed"), SpendFailed)
	assert.Equal(t, SpendEventStatus("disputed"), SpendDisputed)
}

func TestAdSpendEvent_TableName(t *testing.T) {
	event := &AdSpendEvent{}
	assert.Equal(t, "ad_spend_events", event.TableName())
}

// ========================================
// AD GOVERNANCE TESTS
// ========================================

func TestAdGovernanceLimit_Model(t *testing.T) {
	id := uuid.New()
	tenantID := uuid.New()
	now := time.Now()

	limit := &AdGovernanceLimit{
		ID:                  id,
		TenantID:            tenantID,
		MaxSpendPerDay:      100000,
		MaxSpendPerCampaign: 50000,
		KillSwitch:          false,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	assert.Equal(t, id, limit.ID)
	assert.Equal(t, tenantID, limit.TenantID)
	assert.Equal(t, int64(100000), limit.MaxSpendPerDay)
	assert.Equal(t, int64(50000), limit.MaxSpendPerCampaign)
	assert.False(t, limit.KillSwitch)
}

func TestAdGovernanceLimit_KillSwitch(t *testing.T) {
	limit := &AdGovernanceLimit{
		ID:         uuid.New(),
		KillSwitch: true,
	}
	assert.True(t, limit.KillSwitch)
}

func TestAdGovernanceLimit_TableName(t *testing.T) {
	limit := &AdGovernanceLimit{}
	assert.Equal(t, "ad_governance_limits", limit.TableName())
}

// ========================================
// ERROR TESTS
// ========================================

func TestErrors(t *testing.T) {
	tests := []struct {
		name string
		err  error
		msg  string
	}{
		{"ErrAdAccountNotFound", ErrAdAccountNotFound, "ad account not found"},
		{"ErrBudgetNotFound", ErrBudgetNotFound, "budget not found"},
		{"ErrCampaignNotFound", ErrCampaignNotFound, "campaign not found"},
		{"ErrBudgetExhausted", ErrBudgetExhausted, "budget exhausted"},
		{"ErrBudgetDisputed", ErrBudgetDisputed, "budget is disputed"},
		{"ErrCampaignNotActive", ErrCampaignNotActive, "campaign is not active"},
		{"ErrCampaignDisputed", ErrCampaignDisputed, "campaign is disputed"},
		{"ErrGovernanceBlocked", ErrGovernanceBlocked, "governance kill switch active"},
		{"ErrSpendLimitExceeded", ErrSpendLimitExceeded, "spend limit exceeded"},
		{"ErrInvalidTransition", ErrInvalidTransition, "invalid state transition"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.msg, tt.err.Error())
		})
	}
}

// ========================================
// CAMPAIGN STATS TESTS
// ========================================

func TestCampaignStats_Model(t *testing.T) {
	campaignID := uuid.New()

	stats := &CampaignStats{
		CampaignID:      campaignID,
		TotalSpent:      50000,
		BudgetTotal:     100000,
		BudgetRemaining: 50000,
		SpendRate:       2083.33,
		Status:          "active",
	}

	assert.Equal(t, campaignID, stats.CampaignID)
	assert.Equal(t, int64(50000), stats.TotalSpent)
	assert.Equal(t, int64(100000), stats.BudgetTotal)
	assert.Equal(t, int64(50000), stats.BudgetRemaining)
	assert.InDelta(t, 2083.33, stats.SpendRate, 0.01)
	assert.Equal(t, "active", stats.Status)
}

// ========================================
// APPLY AD SPEND PAYLOAD TESTS
// ========================================

func TestApplyAdSpendPayload_Model(t *testing.T) {
	payload := ApplyAdSpendPayload{
		CampaignID:   "campaign-123",
		SpendEventID: "event-456",
		Amount:       1000,
	}

	assert.Equal(t, "campaign-123", payload.CampaignID)
	assert.Equal(t, "event-456", payload.SpendEventID)
	assert.Equal(t, int64(1000), payload.Amount)
}

func TestJobTypeApplyAdSpend_Constant(t *testing.T) {
	assert.Equal(t, "apply_ad_spend", JobTypeApplyAdSpend)
}
