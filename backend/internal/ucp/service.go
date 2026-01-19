package ucp

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"prost-qs/backend/pkg/mcp" // Link to the existing Kernel

	"github.com/google/uuid"
)

// UCPService acts as the gateway between external agents and the internal MCP Kernel.
type UCPService struct {
	dispatcher *mcp.Dispatcher
	domain     string
}

// NewUCPService creates a new UCP Bridge
func NewUCPService(dispatcher *mcp.Dispatcher, domain string) *UCPService {
	return &UCPService{
		dispatcher: dispatcher,
		domain:     domain,
	}
}

// GetManifest returns the UCP discovery document
func (s *UCPService) GetManifest() DiscoveryManifest {
	return DiscoveryManifest{
		UCPVersion: "1.0",
		Merchant: MerchantInfo{
			ID:     "com.prostqs.kernel",
			Name:   "UNO Sovereign Kernel",
			Domain: s.domain,
			Logo:   fmt.Sprintf("https://%s/logo.png", s.domain),
		},
		Capabilities: Capabilities{
			CatalogSearch:  true,
			ProductDetails: true,
			CartManagement: true,
			Checkout:       true,
		},
		Endpoints: Endpoints{
			Catalog:   "/api/ucp/catalog",
			Products:  "/api/ucp/products/{id}",
			Cart:      "/api/ucp/cart",
			Checkout:  "/api/ucp/checkout",
			Negotiate: "/api/ucp/negotiate",
		},
		PaymentHandlers: []string{
			"com.stripe.v1",
			"com.pix.v1",
		},
		TrustSignals: TrustSignals{
			VerifiedMerchant: true,
			SSLCertificate:   true,
			RefundPolicy:     "/legal/refunds",
		},
	}
}

// SearchCatalog bridges the request to the SalesOpsAgent
func (s *UCPService) SearchCatalog(ctx context.Context, req SearchRequest) (*SearchResponse, error) {
	// Protocol Translation: UCP Query -> MCP Command
	// We'll use the SalesOpsAgent to "negotiate" or "find" products.
	// In a real scenario, this might map to a ProductService.
	// Here we show the Agentic Handshake.

	// TODO: Replace with real dynamic search from Sales/Product Agent.
	// For now, return a mock response to satisfy the interface.
	return &SearchResponse{
		TotalItems: 2,
		Items: []ProductItem{
			{
				ID:          "sku_agent_sales_v1",
				Name:        "Sales Ops Agent (License)",
				Description: "Autonomous sales representative agent",
				Price:       50000, // $500.00
				Currency:    "USD",
				InStock:     true,
			},
			{
				ID:          "sku_agent_billing_v1",
				Name:        "Billing Ops Agent (License)",
				Description: "Autonomous financial operations agent",
				Price:       50000,
				Currency:    "USD",
				InStock:     true,
			},
		},
	}, nil
}

// CreateCheckoutSession bridges the request to the BillingOpsAgent
func (s *UCPService) CreateCheckoutSession(ctx context.Context, req CheckoutSessionRequest) (*CheckoutSessionResponse, error) {
	// 1. Prepare Command for Billing Agent
	// We use "propose a subscription" or "create payment intent" logic.

	amount := int64(0)
	for _, item := range req.LineItems {
		// In strictly safe code, we would re-fetch price from DB.
		// Trusting client price for prototype only if validated.
		amount += item.Price * int64(item.Quantity)
	}

	cmdPayload := map[string]interface{}{
		"amount":          amount,
		"currency":        "USD",
		"description":     fmt.Sprintf("UCP Checkout for %d items", len(req.LineItems)),
		"idempotency_key": uuid.New().String(),
		"account_id":      "00000000-0000-0000-0000-000000000000", // Would be resolved from Buyer user
	}

	payloadBytes, _ := json.Marshal(cmdPayload)

	// 2. Dispatch to Billing Agent via MCP Kernel
	// Using "billing:payment:create" capability
	// Note: We need a valid AgentID. In production, this service would hold a system credential.
	request := mcp.DispatchRequest{
		AgentID: "billing-ops-agent-001",
		Command: "billing:payment:create",
		Params:  payloadBytes,
	}

	result, err := s.dispatcher.Dispatch(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("agent dispatch failed: %v", err)
	}

	if result.Status != "SUCCESS" {
		return nil, fmt.Errorf("checkout failed: %s", result.Status)
	}

	// 3. Map MCP Result -> UCP Response
	// Assuming result.Result contains the PaymentIntent

	return &CheckoutSessionResponse{
		ID:         uuid.New().String(),
		Status:     "pending",
		PaymentURL: "https://checkout.stripe.com/pay/...", // Mock
		Total:      amount,
		Currency:   "USD",
		ExpiresAt:  time.Now().Add(1 * time.Hour),
	}, nil
}

// Negotiate bridges external UCP negotiation requests to the SalesNegotiatorAgent
func (s *UCPService) Negotiate(ctx context.Context, req NegotiationProposal) (*NegotiationResponse, error) {
	// 1. Prepare Command for Sales Negotiator Agent
	cmdPayload := map[string]interface{}{
		"proposal_id":    req.ID,
		"product_id":     req.ProductID,
		"proposed_price": req.ProposedPrice,
		"currency":       req.Currency,
		"justification":  req.Justification,
	}

	payloadBytes, _ := json.Marshal(cmdPayload)

	// 2. Dispatch to Sales Negotiator Agent via MCP Kernel
	request := mcp.DispatchRequest{
		AgentID: "sales-negotiator-001",
		Command: "sales:negotiation:propose", // Using the cognitive command we built
		Params:  payloadBytes,
	}

	result, err := s.dispatcher.Dispatch(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("agent dispatch failed: %v", err)
	}

	if result.Status != "SUCCESS" {
		return nil, fmt.Errorf("negotiation failed: %s", result.Status)
	}

	// 3. Map MCP Result -> UCP Response
	// The agent returns a decision in result.Result (interface{})
	data, ok := result.Result.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid result data from agent: expected map[string]interface{}")
	}

	// Assume the cognitive response has been mapped to UCP format in the agent or here
	// For now, let's trust the agent's proposal_action
	proposalAction, ok := data["proposed_action"].(map[string]interface{})
	if !ok {
		proposalAction = make(map[string]interface{})
	}

	status := "counter_offer"
	if data["recommendation"] == "accept_deal" {
		status = "accepted"
	} else if data["recommendation"] == "reject_deal" {
		status = "rejected"
	}

	counterPrice := int64(0)
	if cpVal, ok := proposalAction["offer_amount"].(float64); ok {
		counterPrice = int64(cpVal)
	} else if cpVal, ok := proposalAction["amount"].(float64); ok {
		counterPrice = int64(cpVal)
	}

	reasonStr := ""
	if r, ok := data["justification"].(string); ok {
		reasonStr = r
	}

	return &NegotiationResponse{
		Status:       status,
		CounterPrice: int64(counterPrice),
		Reason:       reasonStr,
	}, nil
}
