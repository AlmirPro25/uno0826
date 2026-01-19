package sales_negotiator

import (
	"context"
	"encoding/json"
	"fmt"

	"prost-qs/backend/internal/ai/cognitive"
	"prost-qs/backend/pkg/mcp"
)

// SalesNegotiatorAgent is a "Smart" agent that uses an LLM to decide
type SalesNegotiatorAgent struct {
	mcp.BaseAgent
	brain     cognitive.CognitiveEngine
	validator cognitive.DecisionValidator
}

// NewSalesNegotiatorAgent creates a new smart agent
func NewSalesNegotiatorAgent(brain cognitive.CognitiveEngine, validator cognitive.DecisionValidator) *SalesNegotiatorAgent {
	return &SalesNegotiatorAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:   "sales-negotiator-001",
			AgentName: "Sales Strategy Negotiator",
			AgentCapabilities: []string{
				"sales:negotiation:analyze",
				"sales:negotiation:propose",
			},
		},
		brain:     brain,
		validator: validator,
	}
}

func (a *SalesNegotiatorAgent) SetCognitiveEngine(engine cognitive.CognitiveEngine) {
	a.brain = engine
}

func (a *SalesNegotiatorAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	switch cmd.Name {
	case "sales:negotiation:analyze":
		return a.analyzeDeal(ctx, cmd.Params)
	case "sales:negotiation:propose":
		// This is where simple code stops and AI starts
		return a.proposeCounterOffer(ctx, cmd.Params)
	default:
		return mcp.Result{Error: "Unknown command"}, nil
	}
}

func (a *SalesNegotiatorAgent) analyzeDeal(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	// Parse deal context (mock)
	dealState := map[string]interface{}{
		"customer_offer": 5000,
		"our_list_price": 6000,
		"history":        "Customer bought 2x before",
	}

	// 1. THINK: ASK THE BRAIN
	decision, err := a.brain.Think(ctx, "Analyze if this deal is good or bad", dealState)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	// 2. GOVERN: VALIDATE THE THOUGHT
	if a.validator != nil {
		if err := a.validator.Validate(ctx, decision); err != nil {
			return mcp.Result{
				Error: fmt.Sprintf("🛡️ COGNITIVE GUARD BLOCKED: %v", err),
			}, nil
		}
	}

	return mcp.Result{
		Data: map[string]interface{}{
			"analysis":       decision.Reasoning,
			"recommendation": decision.Choice,
			"confidence":     decision.Confidence,
			"validated":      true,
		},
	}, nil
}

func (a *SalesNegotiatorAgent) proposeCounterOffer(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	// 0. Parse Input
	var input struct {
		ProposalID    string `json:"proposal_id"`
		ProductID     string `json:"product_id"`
		ProposedPrice int64  `json:"proposed_price"`
	}
	// Try to unmarshal specific params, fallback if needed or ignore error for mock compatibility
	json.Unmarshal(params, &input)

	// MOCK STRATEGY LOOKUP (In prod, this comes from DB based on ProductID)
	// Example: Dell Server R750
	strategy := NegotiationStrategy{
		ListingPrice: 600000, // $6,000
		TargetPrice:  550000, // $5,500
		MinPrice:     480000, // $4,800 (BATNA)
		MaxRounds:    5,
	}

	currentRound := 1 // Mock state

	// 1. ECONOMIC CHECK (The Hard Rails)
	tacticalAction, tacticalReason := strategy.EvaluateOffer(input.ProposedPrice, currentRound)

	// If strategy dictates rejection or walk-away, we short-circuit the AI
	if tacticalAction == "reject_deal" || tacticalAction == "walk_away" || tacticalAction == "accept_deal" {
		return mcp.Result{
			Data: map[string]interface{}{
				"recommendation": tacticalAction,
				"proposed_action": map[string]interface{}{
					"offer_amount": strategy.ListingPrice, // Reset to list price on rejection
				},
				"justification": fmt.Sprintf("Economic Guard: %s", tacticalReason),
				"validated":     true,
			},
		}, nil
	}

	// 2. AI OPTIMIZATION (If Economics allow negotiation)
	// We ask the AI to craft the counter-offer, but bounded by our strategy.

	dealState := map[string]interface{}{
		"customer_offer": input.ProposedPrice,
		"strategy":       strategy,
		"context":        "Customer is under-bidding but within negotiation zone.",
	}

	goal := fmt.Sprintf("Generate counter-offer between %d and %d. Be persuasive.", strategy.MinPrice, strategy.ListingPrice)

	decision, err := a.brain.Think(ctx, goal, dealState)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	// 3. GOVERN (Double Check AI didn't break limits)
	if a.validator != nil {
		if err := a.validator.Validate(ctx, decision); err != nil {
			return mcp.Result{Error: fmt.Sprintf("🛡️ COGNITIVE GUARD BLOCKED: %v", err)}, nil
		}
	}

	// Extra Safety: Ensure AI counter-offer is not below MinPrice (Hallucination check)
	aiOffer := int64(0)
	if val, ok := decision.Config["offer_amount"].(float64); ok {
		aiOffer = int64(val)
	}
	if aiOffer > 0 && aiOffer < strategy.MinPrice {
		// AI hallucinated a too-low price. Enforce MinPrice.
		decision.Config["offer_amount"] = strategy.MinPrice
		decision.Reasoning += " [Adjusted by Economic Safety Protocol]"
	}

	return mcp.Result{
		Data: map[string]interface{}{
			"recommendation":  "counter_offer", // Force counter if in negotiation zone
			"proposed_action": decision.Config,
			"justification":   decision.Reasoning,
			"validated":       true,
		},
	}, nil
}
