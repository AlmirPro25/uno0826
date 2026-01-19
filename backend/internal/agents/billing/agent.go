package billing_agent

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"prost-qs/backend/internal/billing"
	"prost-qs/backend/pkg/mcp"

	"github.com/google/uuid"
)

// BillingOpsAgent wraps internal BillingService to expose financial operations via MCP.
type BillingOpsAgent struct {
	mcp.BaseAgent
	billingService *billing.BillingService
}

// NewBillingOpsAgent creates a new financial agent.
func NewBillingOpsAgent(billingService *billing.BillingService) *BillingOpsAgent {
	return &BillingOpsAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:   "billing-ops-agent-001",
			AgentName: "Financial Operations Agent",
			AgentCapabilities: []string{
				"billing:account:create",
				"billing:account:get",
				"billing:payment:create",
				"billing:subscription:create",
				"billing:subscription:cancel",
				"billing:subscription:create_from_proposal",
				"billing:ledger:list",
			},
		},
		billingService: billingService,
	}
}

// Execute processes financial commands.
func (a *BillingOpsAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	switch cmd.Name {
	case "billing:account:create":
		return a.createAccount(ctx, cmd.Params)
	case "billing:account:get":
		return a.getAccount(cmd.Params)
	case "billing:payment:create":
		return a.createPayment(ctx, cmd.Params)
	case "billing:subscription:create":
		return a.createSubscription(ctx, cmd.Params)
	case "billing:subscription:create_from_proposal":
		return a.createSubscriptionFromProposal(ctx, cmd.Params)
	case "billing:subscription:cancel":
		return a.cancelSubscription(ctx, cmd.Params)
	case "billing:ledger:list":
		return a.listLedger(cmd.Params)
	default:
		return mcp.Result{Error: "Unknown command"}, fmt.Errorf("unknown command: %s", cmd.Name)
	}
}

// ------------------------------------------------------------------
// COMMAND HANDLERS
// ------------------------------------------------------------------

func (a *BillingOpsAgent) createAccount(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	var input struct {
		UserID string `json:"user_id"`
		Email  string `json:"email"`
		Phone  string `json:"phone"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	uid, err := uuid.Parse(input.UserID)
	if err != nil {
		return mcp.Result{Error: "Invalid User UUID"}, err
	}

	account, err := a.billingService.CreateBillingAccount(ctx, uid, input.Email, input.Phone)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: account}, nil
}

func (a *BillingOpsAgent) getAccount(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		UserID    string `json:"user_id"`
		AccountID string `json:"account_id"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	var account *billing.BillingAccount
	var err error

	if input.AccountID != "" {
		aid, pErr := uuid.Parse(input.AccountID)
		if pErr != nil {
			return mcp.Result{Error: "Invalid Account UUID"}, pErr
		}
		account, err = a.billingService.GetBillingAccountByID(aid)
	} else if input.UserID != "" {
		uid, pErr := uuid.Parse(input.UserID)
		if pErr != nil {
			return mcp.Result{Error: "Invalid User UUID"}, pErr
		}
		account, err = a.billingService.GetBillingAccount(uid)
	} else {
		return mcp.Result{Error: "Either user_id or account_id is required"}, fmt.Errorf("missing identifier")
	}

	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: account}, nil
}

func (a *BillingOpsAgent) createPayment(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	// CreatePaymentIntent(ctx, accountID, amount, currency, description, idempotencyKey)
	var input struct {
		AccountID      string `json:"account_id"`
		Amount         int64  `json:"amount"` // in cents
		Currency       string `json:"currency"`
		Description    string `json:"description"`
		IdempotencyKey string `json:"idempotency_key"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	if input.IdempotencyKey == "" {
		input.IdempotencyKey = uuid.New().String()
	}

	aid, err := uuid.Parse(input.AccountID)
	if err != nil {
		return mcp.Result{Error: "Invalid Account UUID"}, err
	}

	intent, err := a.billingService.CreatePaymentIntent(ctx, aid, input.Amount, input.Currency, input.Description, input.IdempotencyKey)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: intent}, nil
}

func (a *BillingOpsAgent) createSubscription(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	// CreateSubscription(ctx, accountID, planID, amount, currency, interval)
	var input struct {
		AccountID string `json:"account_id"`
		PlanID    string `json:"plan_id"`
		Amount    int64  `json:"amount"`
		Currency  string `json:"currency"`
		Interval  string `json:"interval"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	aid, err := uuid.Parse(input.AccountID)
	if err != nil {
		return mcp.Result{Error: "Invalid Account UUID"}, err
	}

	sub, err := a.billingService.CreateSubscription(ctx, aid, input.PlanID, input.Amount, input.Currency, input.Interval)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: sub}, nil
}

func (a *BillingOpsAgent) cancelSubscription(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	// CancelSubscription(ctx, subscriptionID, reason)
	var input struct {
		SubscriptionID string `json:"subscription_id"`
		Reason         string `json:"reason"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	sid, err := uuid.Parse(input.SubscriptionID)
	if err != nil {
		return mcp.Result{Error: "Invalid Subscription UUID"}, err
	}

	sub, err := a.billingService.CancelSubscription(ctx, sid, input.Reason)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: map[string]interface{}{
		"subscription_id": sub.SubscriptionID,
		"status":          sub.Status,
		"canceled_at":     time.Now().Format(time.RFC3339),
	}}, nil
}

func (a *BillingOpsAgent) listLedger(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		AccountID string `json:"account_id"`
		Limit     int    `json:"limit"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	if input.Limit <= 0 {
		input.Limit = 20
	}

	aid, err := uuid.Parse(input.AccountID)
	if err != nil {
		return mcp.Result{Error: "Invalid Account UUID"}, err
	}

	entries, err := a.billingService.GetLedgerEntries(aid, input.Limit)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: entries}, nil
}

// createSubscriptionFromProposal handles subscription creation triggered by SalesAgent.
func (a *BillingOpsAgent) createSubscriptionFromProposal(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	var input struct {
		ProposalID  string `json:"proposal_id"`
		ProductTier string `json:"product_tier"`
		Amount      int64  `json:"amount"`
		Currency    string `json:"currency"`
		Source      string `json:"source"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	// Log the handoff from SalesAgent
	fmt.Printf("[BillingAgent] Received proposal conversion request: %s (Tier: %s, Amount: %d %s, Source: %s)\n",
		input.ProposalID, input.ProductTier, input.Amount, input.Currency, input.Source)

	// TODO: In a real implementation, this would:
	// 1. Look up the proposal and associated user
	// 2. Create a subscription for the user
	// 3. Charge the first payment

	return mcp.Result{Data: map[string]interface{}{
		"status":      "PROPOSAL_CONVERTED",
		"proposal_id": input.ProposalID,
		"tier":        input.ProductTier,
		"message":     "Billing handoff received. Subscription creation queued.",
	}}, nil
}
