package procurement_test

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"prost-qs/backend/internal/agents/procurement"
	"prost-qs/backend/internal/ai/cognitive"
	"prost-qs/backend/internal/ucp"
	"prost-qs/backend/pkg/mcp"

	"github.com/stretchr/testify/assert"
)

func TestNegotiationCycle(t *testing.T) {
	// 1. Setup
	ucpClient := ucp.NewClient()
	mockBrain := &cognitive.GeminiAdapter{}
	validator := cognitive.NewStandardValidator(0.5)
	agent := procurement.NewProcurementOpsAgent(ucpClient, mockBrain, validator)

	targetStore := "http://localhost:9090"

	// 2. EXECUTE: Propose $400,000 for a $450,000 server (Should trigger counter-offer)
	fmt.Println("🤖 [AGENT] Starting Negotiation Mission...")

	negParams := map[string]interface{}{
		"target_url":     targetStore,
		"negotiation_id": "neg_123",
		"product_id":     "srv-001",
		"proposed_price": 400000, // $4,000.00
		"currency":       "USD",
		"justification":  "Bulk order potential.",
	}
	paramBytes, _ := json.Marshal(negParams)

	cmd := mcp.Command{
		Name:   "procurement:negotiation:propose",
		Params: paramBytes,
	}

	// 3. Run Agent
	result, err := agent.Execute(context.Background(), cmd)

	// 4. Assert
	assert.NoError(t, err)
	assert.True(t, result.IsSuccess())

	// 5. Inspect Results
	resp := result.Data.(*ucp.NegotiationResponse)
	fmt.Printf("✅ Negotiation Response Received: %s\n", resp.Status)
	fmt.Printf("📝 Reason: %s\n", resp.Reason)
	if resp.Status == "counter_offer" {
		fmt.Printf("💰 Counter Price: %d %s\n", resp.CounterPrice, "USD")
	}

	assert.Equal(t, "counter_offer", resp.Status)
	assert.Equal(t, int64(427500), resp.CounterPrice) // 450,000 * 0.95 = 427,500
}
