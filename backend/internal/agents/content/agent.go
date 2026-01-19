package content_agent

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"prost-qs/backend/internal/ads"
	"prost-qs/backend/pkg/mcp"

	"github.com/google/uuid"
)

// ContentOpsAgent wraps internal AdsService to expose campaign operations via MCP.
type ContentOpsAgent struct {
	mcp.BaseAgent
	adsService *ads.AdsService
}

// NewContentOpsAgent creates a new content/ads agent.
func NewContentOpsAgent(adsService *ads.AdsService) *ContentOpsAgent {
	return &ContentOpsAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:   "content-ops-agent-001",
			AgentName: "Content & Campaigns Agent",
			AgentCapabilities: []string{
				"ads:account:create",
				"ads:account:get",
				"ads:budget:create",
				"ads:campaign:create",
				"ads:campaign:status",
			},
		},
		adsService: adsService,
	}
}

// Execute processes content commands.
func (a *ContentOpsAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	switch cmd.Name {
	case "ads:account:create":
		return a.createAdAccount(ctx, cmd.Params)
	case "ads:account:get":
		return a.getAdAccount(cmd.Params)
	case "ads:budget:create":
		return a.createBudget(ctx, cmd.Params)
	case "ads:campaign:create":
		return a.createCampaign(ctx, cmd.Params)
	case "ads:campaign:status":
		return a.changeCampaignStatus(ctx, cmd.Params)
	default:
		return mcp.Result{Error: "Unknown command"}, fmt.Errorf("unknown command: %s", cmd.Name)
	}
}

// ------------------------------------------------------------------
// COMMAND HANDLERS
// ------------------------------------------------------------------

func (a *ContentOpsAgent) createAdAccount(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	var input struct {
		UserID           string `json:"user_id"`
		Name             string `json:"name"`
		BillingAccountID string `json:"billing_account_id"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	uid, err := uuid.Parse(input.UserID)
	if err != nil {
		return mcp.Result{Error: "Invalid User UUID"}, err
	}

	bid, err := uuid.Parse(input.BillingAccountID)
	if err != nil {
		return mcp.Result{Error: "Invalid Billing Account UUID"}, err
	}

	account, err := a.adsService.CreateAdAccount(ctx, uid, input.Name, bid)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: account}, nil
}

func (a *ContentOpsAgent) getAdAccount(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		AccountID string `json:"account_id"`
		UserID    string `json:"user_id"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	var account *ads.AdAccount
	var err error

	if input.AccountID != "" {
		aid, pErr := uuid.Parse(input.AccountID)
		if pErr != nil {
			return mcp.Result{Error: "Invalid Account UUID"}, pErr
		}
		account, err = a.adsService.GetAdAccount(aid)
	} else if input.UserID != "" {
		uid, pErr := uuid.Parse(input.UserID)
		if pErr != nil {
			return mcp.Result{Error: "Invalid User UUID"}, pErr
		}
		account, err = a.adsService.GetAdAccountByUser(uid)
	} else {
		return mcp.Result{Error: "Either account_id or user_id is required"}, fmt.Errorf("missing identifier")
	}

	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: account}, nil
}

func (a *ContentOpsAgent) createBudget(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	// CreateBudget(ctx, adAccountID, amount, currency, period)
	var input struct {
		AdAccountID string `json:"ad_account_id"`
		Amount      int64  `json:"amount"` // cents
		Currency    string `json:"currency"`
		Period      string `json:"period"` // daily, monthly, lifetime
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	aid, err := uuid.Parse(input.AdAccountID)
	if err != nil {
		return mcp.Result{Error: "Invalid Ad Account UUID"}, err
	}

	// Default values
	if input.Currency == "" {
		input.Currency = "BRL"
	}
	if input.Period == "" {
		input.Period = "monthly"
	}

	budget, err := a.adsService.CreateBudget(ctx, aid, input.Amount, input.Currency, ads.BudgetPeriod(input.Period))
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: budget}, nil
}

func (a *ContentOpsAgent) createCampaign(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	// CreateCampaign(ctx, adAccountID, budgetID, name, objective, bidStrategy)
	var input struct {
		AdAccountID string `json:"ad_account_id"`
		BudgetID    string `json:"budget_id"`
		Name        string `json:"name"`
		Objective   string `json:"objective"`    // impressions, clicks, conversions
		BidStrategy string `json:"bid_strategy"` // lowest_cost, target_cost
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	aid, err := uuid.Parse(input.AdAccountID)
	if err != nil {
		return mcp.Result{Error: "Invalid Ad Account UUID"}, err
	}

	bid, err := uuid.Parse(input.BudgetID)
	if err != nil {
		return mcp.Result{Error: "Invalid Budget UUID"}, err
	}

	// Defaults
	if input.BidStrategy == "" {
		input.BidStrategy = "lowest_cost"
	}

	campaign, err := a.adsService.CreateCampaign(
		ctx,
		aid,
		bid,
		input.Name,
		ads.CampaignObjective(input.Objective),
		ads.BidStrategy(input.BidStrategy),
	)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: campaign}, nil
}

func (a *ContentOpsAgent) changeCampaignStatus(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	// activate, pause, resume
	var input struct {
		CampaignID string `json:"campaign_id"`
		Action     string `json:"action"` // activate, pause, resume
		Reason     string `json:"reason"` // required for pause
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	cid, err := uuid.Parse(input.CampaignID)
	if err != nil {
		return mcp.Result{Error: "Invalid Campaign UUID"}, err
	}

	var campaign *ads.AdCampaign
	var actionErr error

	switch input.Action {
	case "activate":
		campaign, actionErr = a.adsService.ActivateCampaign(ctx, cid)
	case "pause":
		campaign, actionErr = a.adsService.PauseCampaign(ctx, cid, input.Reason)
	case "resume":
		campaign, actionErr = a.adsService.ResumeCampaign(ctx, cid)
	default:
		return mcp.Result{Error: "Invalid action. Use: activate, pause, resume"}, fmt.Errorf("invalid action")
	}

	if actionErr != nil {
		return mcp.Result{Error: actionErr.Error()}, actionErr
	}

	return mcp.Result{Data: map[string]interface{}{
		"campaign_id": campaign.ID,
		"status":      campaign.Status,
		"updated_at":  time.Now().Format(time.RFC3339),
	}}, nil
}
