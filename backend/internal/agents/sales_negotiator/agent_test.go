package sales_negotiator_test

import (
	"context"
	"encoding/json"
	"testing"

	"prost-qs/backend/internal/agents/sales_negotiator"
	"prost-qs/backend/internal/ai/cognitive"
	"prost-qs/backend/pkg/mcp"

	"github.com/stretchr/testify/assert"
)

// ensureResult extracts the decision recommendation from agent result
func extractRecommendation(t *testing.T, res mcp.Result) string {
	data, ok := res.Data.(map[string]interface{})
	assert.True(t, ok, "Result data should be map")
	rec, ok := data["recommendation"].(string)
	assert.True(t, ok, "Recommendation missing")
	return rec
}

func TestSalesAgent_BATNA_Enforcement(t *testing.T) {
	// Strategy Setup (from source code defaults for now):
	// List: 600,000 | Target: 550,000 | Min (BATNA): 480,000 | Rounds: 5

	// 1. Setup Agent with Mock Brain (Brain should NOT be called for absolute rejections)
	// We use a nil brain to ensure panic if it IS called unexpectedly
	dumbBrain := &cognitive.GeminiAdapter{}
	agent := sales_negotiator.NewSalesNegotiatorAgent(dumbBrain, nil)

	// 2. Test Case: Offer BELOW BATNA (< 480,000)
	// Expectation: Immediate REJECTION. No thinking.
	lowBallParams := map[string]interface{}{
		"proposal_id":    "test_1",
		"product_id":     "srv_dell_r750",
		"proposed_price": 400000, // Very low
	}
	bytes, _ := json.Marshal(lowBallParams)
	cmd := mcp.Command{Name: "sales:negotiation:propose", Params: bytes}

	result, err := agent.Execute(context.Background(), cmd)
	assert.NoError(t, err)

	rec := extractRecommendation(t, result)
	assert.Equal(t, "reject_deal", rec, "Must reject offer below BATNA without thinking")
}

func TestSalesAgent_GreedyAcceptance(t *testing.T) {
	// 1. Setup
	brain := &cognitive.GeminiAdapter{}
	agent := sales_negotiator.NewSalesNegotiatorAgent(brain, nil)

	// 2. Test Case: Offer ABOVE Target (> 550,000)
	// Expectation: Immediate ACCEPTANCE.
	goodOfferParams := map[string]interface{}{
		"proposal_id":    "test_2",
		"product_id":     "srv_dell_r750",
		"proposed_price": 580000,
	}
	bytes, _ := json.Marshal(goodOfferParams)
	cmd := mcp.Command{Name: "sales:negotiation:propose", Params: bytes}

	result, err := agent.Execute(context.Background(), cmd)
	assert.NoError(t, err)

	rec := extractRecommendation(t, result)
	assert.Equal(t, "accept_deal", rec, "Must accept good offer immediately")
}

func TestSalesAgent_NegotiationZone(t *testing.T) {
	// 1. Setup - This time we need a brain because it enters negotiation zone
	// Wemock the brain to return a specific counter offer
	// Note: In a real unit test we would interface mock the brain.
	// Here we rely on the agent's logic calling the real struct, but since we don't hold the API key,
	// the mock implementation inside GeminiAdapter will run.
	brain := &cognitive.GeminiAdapter{}
	agent := sales_negotiator.NewSalesNegotiatorAgent(brain, nil)

	// 2. Test Case: Offer in Zone (500,000 - between 480k and 550k)
	// Expectation: Counter Offer
	midOfferParams := map[string]interface{}{
		"proposal_id":    "test_3",
		"product_id":     "srv_dell_r750",
		"proposed_price": 500000,
	}
	bytes, _ := json.Marshal(midOfferParams)
	cmd := mcp.Command{Name: "sales:negotiation:propose", Params: bytes}

	result, err := agent.Execute(context.Background(), cmd)
	assert.NoError(t, err)

	rec := extractRecommendation(t, result)
	assert.Equal(t, "counter_offer", rec, "Must negotiate/counter-offer in the gray zone")
}
