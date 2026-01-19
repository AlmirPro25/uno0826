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

// TestFullProcurementCycle simulates the Kernel buying from the Demo Store
func TestFullProcurementCycle(t *testing.T) {
	// 1. Setup Dependencies
	// Network Client
	ucpClient := ucp.NewClient()

	// Mock Brain (Deterministic for testing)
	mockBrain := &cognitive.GeminiAdapter{} // Using mock implementation inside adapter

	// Validator (Standard Safety)
	validator := cognitive.NewStandardValidator(0.5) // Lower confidence for test

	// The Agent
	agent := procurement.NewProcurementOpsAgent(ucpClient, mockBrain, validator)

	// 2. Define the Target (The Demo Store running on :9090)
	// NOTE: Ensure external_demo_store/main.go is running!
	targetStore := "http://localhost:9090"

	// 3. EXECUTE: Search for "Server"
	fmt.Println("🤖 [AGENT] Starting Sourcing Mission...")

	searchParams := map[string]interface{}{
		"query":   "server",
		"targets": []string{targetStore}, // The agent will discover .well-known/ucp automatically
	}
	paramBytes, _ := json.Marshal(searchParams)

	cmd := mcp.Command{
		Name:   "procurement:sourcing:search",
		Params: paramBytes,
	}

	// 4. Run Agent Logic
	result, err := agent.Execute(context.Background(), cmd)

	// 5. Asset Success
	assert.NoError(t, err)
	assert.True(t, result.IsSuccess())

	// 6. Inspect Results
	data := result.Data.(map[string]interface{})
	items := data["items"].([]ucp.ProductItem)
	count := data["count"].(int)
	logs := data["logs"].([]string)

	fmt.Printf("✅ Mission Complete. Found %d items.\n", count)
	fmt.Println("📝 Agent Logs:")
	for _, l := range logs {
		fmt.Println("   " + l)
	}

	fmt.Println("📦 Products Found:")
	for _, item := range items {
		fmt.Printf("   - %s (%s) | %s\n", item.Name, item.ID, item.Description)
	}

	// Validation
	assert.Greater(t, count, 0, "Should find at least 1 server")
	assert.Contains(t, logs[0], "✅ Found", "Should verify discovery success")
}
