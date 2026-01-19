package mcp_test

import (
	"context"
	"encoding/json"
	"testing"

	"prost-qs/backend/pkg/mcp"
)

// ========================================
// MOCK AGENT FOR TESTING
// ========================================

type MockAgent struct {
	mcp.BaseAgent
	ExecuteFunc func(ctx context.Context, cmd mcp.Command) (mcp.Result, error)
}

func (m *MockAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	if m.ExecuteFunc != nil {
		return m.ExecuteFunc(ctx, cmd)
	}
	return mcp.Result{Data: map[string]string{"status": "ok"}}, nil
}

// ========================================
// TESTS
// ========================================

func TestDispatcher_Register(t *testing.T) {
	auditRepo := mcp.NewInMemoryAuditRepo(100)
	dispatcher := mcp.NewDispatcher(auditRepo, mcp.DefaultConfig())

	agent := &MockAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:           "test-agent-001",
			AgentName:         "Test Agent",
			AgentCapabilities: []string{"test:action:do"},
		},
	}

	err := dispatcher.Register(agent)
	if err != nil {
		t.Fatalf("Failed to register agent: %v", err)
	}

	if dispatcher.AgentCount() != 1 {
		t.Errorf("Expected 1 agent, got %d", dispatcher.AgentCount())
	}

	// Test duplicate registration
	err = dispatcher.Register(agent)
	if err == nil {
		t.Error("Expected error on duplicate registration")
	}
}

func TestDispatcher_Dispatch_Success(t *testing.T) {
	auditRepo := mcp.NewInMemoryAuditRepo(100)
	dispatcher := mcp.NewDispatcher(auditRepo, mcp.DefaultConfig())

	agent := &MockAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:           "test-agent-001",
			AgentName:         "Test Agent",
			AgentCapabilities: []string{"test:greet"},
		},
		ExecuteFunc: func(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
			return mcp.Result{Data: map[string]string{"message": "Hello, World!"}}, nil
		},
	}

	dispatcher.Register(agent)

	ctx := mcp.WithTraceID(context.Background(), "test-trace-123")
	params, _ := json.Marshal(map[string]string{"name": "World"})

	resp, err := dispatcher.Dispatch(ctx, mcp.DispatchRequest{
		AgentID: "test-agent-001",
		Command: "test:greet",
		Params:  params,
	})

	if err != nil {
		t.Fatalf("Dispatch failed: %v", err)
	}

	if resp.Status != "SUCCESS" {
		t.Errorf("Expected SUCCESS, got %s", resp.Status)
	}

	if resp.TraceID != "test-trace-123" {
		t.Errorf("Expected trace ID test-trace-123, got %s", resp.TraceID)
	}

	// Verify audit logs were created
	events, _ := auditRepo.GetEventsByTraceID(ctx, "test-trace-123")
	if len(events) < 2 {
		t.Errorf("Expected at least 2 audit events (INTENT + SUCCESS), got %d", len(events))
	}
}

func TestDispatcher_Dispatch_CapabilityDenied(t *testing.T) {
	auditRepo := mcp.NewInMemoryAuditRepo(100)
	dispatcher := mcp.NewDispatcher(auditRepo, mcp.DefaultConfig())

	agent := &MockAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:           "test-agent-001",
			AgentName:         "Test Agent",
			AgentCapabilities: []string{"test:read"}, // Only has read capability
		},
	}

	dispatcher.Register(agent)

	ctx := context.Background()
	resp, err := dispatcher.Dispatch(ctx, mcp.DispatchRequest{
		AgentID: "test-agent-001",
		Command: "test:write", // Trying to write without permission
	})

	if err != mcp.ErrCapabilityDenied {
		t.Errorf("Expected ErrCapabilityDenied, got %v", err)
	}

	if resp != nil {
		t.Error("Response should be nil on capability denial")
	}

	// Verify VIOLATION event was logged
	events, _ := auditRepo.GetEvents(ctx, mcp.EventFilter{EventType: mcp.EventTypeViolation})
	if len(events) == 0 {
		t.Error("Expected VIOLATION event to be logged")
	}
}

func TestDispatcher_Dispatch_AgentNotFound(t *testing.T) {
	auditRepo := mcp.NewInMemoryAuditRepo(100)
	dispatcher := mcp.NewDispatcher(auditRepo, mcp.DefaultConfig())

	ctx := context.Background()
	_, err := dispatcher.Dispatch(ctx, mcp.DispatchRequest{
		AgentID: "nonexistent-agent",
		Command: "any:command",
	})

	if err != mcp.ErrAgentNotFound {
		t.Errorf("Expected ErrAgentNotFound, got %v", err)
	}
}

func TestHasCapability_Wildcard(t *testing.T) {
	agent := &MockAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:           "admin-agent",
			AgentName:         "Admin Agent",
			AgentCapabilities: []string{"identity:*", "billing:invoice:read"},
		},
	}

	tests := []struct {
		capability string
		expected   bool
	}{
		{"identity:user:create", true},   // Matches identity:*
		{"identity:role:delete", true},   // Matches identity:*
		{"billing:invoice:read", true},   // Exact match
		{"billing:invoice:write", false}, // No match
		{"other:action", false},          // No match
	}

	for _, tt := range tests {
		result := mcp.HasCapability(agent, tt.capability)
		if result != tt.expected {
			t.Errorf("HasCapability(%s) = %v, expected %v", tt.capability, result, tt.expected)
		}
	}
}

func TestTraceID_Generation(t *testing.T) {
	// Test that trace IDs are unique
	ids := make(map[string]bool)
	for i := 0; i < 1000; i++ {
		id := mcp.GenerateTraceID()
		if ids[id] {
			t.Errorf("Duplicate trace ID generated: %s", id)
		}
		ids[id] = true
	}
}

func TestContext_TraceID(t *testing.T) {
	ctx := context.Background()

	// Without trace ID, should generate one
	traceID1 := mcp.GetTraceID(ctx)
	if traceID1 == "" {
		t.Error("Expected generated trace ID, got empty string")
	}

	// With trace ID, should return it
	ctx = mcp.WithTraceID(ctx, "custom-trace-id")
	traceID2 := mcp.GetTraceID(ctx)
	if traceID2 != "custom-trace-id" {
		t.Errorf("Expected custom-trace-id, got %s", traceID2)
	}
}
