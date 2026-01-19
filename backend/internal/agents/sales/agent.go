package sales_agent

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"prost-qs/backend/internal/sales"
	"prost-qs/backend/pkg/mcp"

	"github.com/google/uuid"
)

// SalesOpsAgent is an autonomous agent that generates and optimizes commercial offers.
// It follows the Universal Commerce Protocol (UCP) principles but runs sovereignly.
type SalesOpsAgent struct {
	mcp.BaseAgent
	service    *sales.SalesService
	dispatcher *mcp.Dispatcher // For agent-to-agent calls
}

// NewSalesOpsAgent creates a new sales agent.
func NewSalesOpsAgent(service *sales.SalesService, dispatcher *mcp.Dispatcher) *SalesOpsAgent {
	return &SalesOpsAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:   "sales-ops-agent-001",
			AgentName: "Autonomous Sales Agent",
			AgentCapabilities: []string{
				"sales:negotiation:start",
				"sales:proposal:create",
				"sales:proposal:accept",
				"sales:list",
			},
		},
		service:    service,
		dispatcher: dispatcher,
	}
}

// Execute processes sales commands.
func (a *SalesOpsAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	switch cmd.Name {
	case "sales:negotiation:start":
		return a.startNegotiation(cmd.Params)
	case "sales:proposal:create":
		return a.createProposal(cmd.Params)
	case "sales:proposal:accept":
		return a.acceptProposal(ctx, cmd.Params)
	case "sales:list":
		return a.listNegotiations(cmd.Params)
	default:
		return mcp.Result{Error: "Unknown command"}, fmt.Errorf("unknown command: %s", cmd.Name)
	}
}

func (a *SalesOpsAgent) startNegotiation(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		UserID  string `json:"user_id"`
		Context string `json:"context"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	uid, err := uuid.Parse(input.UserID)
	if err != nil {
		return mcp.Result{Error: "Invalid User UUID"}, err
	}

	neg, err := a.service.StartNegotiation(uid, input.Context)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: neg}, nil
}

func (a *SalesOpsAgent) createProposal(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		NegotiationID string `json:"negotiation_id"`
		ProductTier   string `json:"product_tier"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	nid, err := uuid.Parse(input.NegotiationID)
	if err != nil {
		return mcp.Result{Error: "Invalid Negotiation UUID"}, err
	}

	prop, err := a.service.CreateProposal(nid, input.ProductTier)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: prop}, nil
}

func (a *SalesOpsAgent) acceptProposal(ctx context.Context, params json.RawMessage) (mcp.Result, error) {
	var input struct {
		ProposalID string `json:"proposal_id"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	pid, err := uuid.Parse(input.ProposalID)
	if err != nil {
		return mcp.Result{Error: "Invalid Proposal UUID"}, err
	}

	prop, err := a.service.AcceptProposal(pid)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	// ========================================
	// AGENT-TO-AGENT: Trigger Billing
	// ========================================
	if a.dispatcher != nil {
		// Build billing command payload
		billingPayload := map[string]interface{}{
			"proposal_id":  prop.ID.String(),
			"product_tier": prop.ProductTier,
			"amount":       prop.FinalPrice,
			"currency":     prop.Currency,
			"source":       "sales_agent",
		}
		payloadBytes, _ := json.Marshal(billingPayload)

		billingReq := mcp.DispatchRequest{
			AgentID: "billing-ops-agent-001",
			Command: "billing:subscription:create_from_proposal",
			Params:  payloadBytes,
		}

		// Fire async (don't block sales flow)
		go func() {
			resp, err := a.dispatcher.DispatchInternal(context.Background(), a.ID(), billingReq)
			if err != nil {
				log.Printf("[SalesAgent] Failed to trigger billing: %v", err)
			} else {
				log.Printf("[SalesAgent] Billing triggered successfully: %s", resp.TraceID)
			}
		}()
	}

	return mcp.Result{Data: prop}, nil
}

func (a *SalesOpsAgent) listNegotiations(params json.RawMessage) (mcp.Result, error) {
	negs, err := a.service.ListNegotiations(10)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}
	return mcp.Result{Data: negs}, nil
}
