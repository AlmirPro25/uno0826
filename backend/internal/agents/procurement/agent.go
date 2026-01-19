package procurement

import (
	"context"
	"encoding/json"
	"fmt"

	"prost-qs/backend/internal/ai/cognitive"
	"prost-qs/backend/internal/ucp"
	"prost-qs/backend/pkg/mcp"
)

// ProcurementOpsAgent handles sourcing and purchasing from external UCP merchants.
type ProcurementOpsAgent struct {
	mcp.BaseAgent
	ucpClient *ucp.Client
	brain     cognitive.CognitiveEngine
	validator cognitive.DecisionValidator
}

// NewProcurementOpsAgent creates a new procurement agent
func NewProcurementOpsAgent(ucpClient *ucp.Client, brain cognitive.CognitiveEngine, validator cognitive.DecisionValidator) *ProcurementOpsAgent {
	return &ProcurementOpsAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:   "procurement-ops-agent-001",
			AgentName: "Strategic Procurement Agent",
			AgentCapabilities: []string{
				"procurement:sourcing:search",
				"procurement:sourcing:evaluate",
				"procurement:negotiation:propose",
			},
		},
		ucpClient: ucpClient,
		brain:     brain,
		validator: validator,
	}
}

func (a *ProcurementOpsAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	switch cmd.Name {
	case "procurement:sourcing:search":
		return a.searchProducts(ctx, cmd.Params)
	case "procurement:sourcing:evaluate":
		return a.evaluateOptions(ctx, cmd.Params)
	case "procurement:negotiation:propose":
		return a.proposeNegotiation(ctx, cmd.Params)
	default:
		return mcp.Result{Error: "Unknown command"}, nil
	}
}

func (a *ProcurementOpsAgent) searchProducts(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	var input struct {
		Query   string   `json:"query"`
		Targets []string `json:"targets"` // List of UCP URLs to search
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	if len(input.Targets) == 0 {
		return mcp.Result{Error: "No targets specified. Where should I search?"}, nil
	}

	var allResults []ucp.ProductItem
	var log []string

	// Federated Search across targets
	for _, target := range input.Targets {
		// 1. Discover (Handshake)
		manifest, err := a.ucpClient.Discover(ctx, target)
		if err != nil {
			log = append(log, fmt.Sprintf("❌ Failed to discover %s: %v", target, err))
			continue
		}

		// 2. Search (Action)
		// We assume the manifest has the Catalog endpoint.
		catalogUrl := target + manifest.Endpoints.Catalog

		resp, err := a.ucpClient.SearchRemote(ctx, catalogUrl, input.Query)
		if err != nil {
			log = append(log, fmt.Sprintf("⚠️ Search failed at %s: %v", target, err))
			continue
		}

		// Tag results with source
		for i := range resp.Items {
			resp.Items[i].Description = fmt.Sprintf("[%s] %s", manifest.Merchant.Name, resp.Items[i].Description)
			allResults = append(allResults, resp.Items[i])
		}
		log = append(log, fmt.Sprintf("✅ Found %d items at %s", resp.TotalItems, manifest.Merchant.Name))
	}

	return mcp.Result{
		Data: map[string]interface{}{
			"items": allResults,
			"count": len(allResults),
			"logs":  log,
		},
	}, nil
}

func (a *ProcurementOpsAgent) evaluateOptions(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	var input struct {
		Goal  string            `json:"goal"` // e.g. "Best value laptop for coding"
		Items []ucp.ProductItem `json:"items"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	// 1. THINK: Use Gemini to compare
	decision, err := a.brain.Think(ctx, input.Goal, input.Items)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	// 2. GOVERN: Validate decision
	if a.validator != nil {
		if err := a.validator.Validate(ctx, decision); err != nil {
			return mcp.Result{Error: fmt.Sprintf("🛡️ COGNITIVE GUARD BLOCKED: %v", err)}, nil
		}
	}

	return mcp.Result{
		Data: map[string]interface{}{
			"recommendation": decision.Choice,
			"reasoning":      decision.Reasoning,
			"confidence":     decision.Confidence,
		},
	}, nil
}

func (a *ProcurementOpsAgent) proposeNegotiation(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	var input struct {
		TargetURL     string `json:"target_url"`
		NegotiationID string `json:"negotiation_id"`
		ProductID     string `json:"product_id"`
		ProposedPrice int64  `json:"proposed_price"`
		Currency      string `json:"currency"`
		Justification string `json:"justification"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	// 1. Handshake with target to get Negotiate endpoint
	manifest, err := a.ucpClient.Discover(ctx, input.TargetURL)
	if err != nil {
		return mcp.Result{Error: fmt.Sprintf("discovery failed: %v", err)}, nil
	}

	if manifest.Endpoints.Negotiate == "" {
		return mcp.Result{Error: "target does not support negotiation protocol"}, nil
	}

	negotiateURL := input.TargetURL + manifest.Endpoints.Negotiate

	// 2. Execute Remote Negotiation
	proposal := ucp.NegotiationProposal{
		ID:            input.NegotiationID,
		ProductID:     input.ProductID,
		ProposedPrice: input.ProposedPrice,
		Currency:      input.Currency,
		Justification: input.Justification,
	}

	resp, err := a.ucpClient.NegotiateRemote(ctx, negotiateURL, proposal)
	if err != nil {
		return mcp.Result{Error: fmt.Sprintf("remote negotiation failed: %v", err)}, nil
	}

	return mcp.Result{
		Data: resp,
	}, nil
}
