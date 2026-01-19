package mcp

import "context"

// ========================================
// AGENT INTERFACE - THE SACRED CONTRACT
// ========================================

// MCPAgent defines the strict contract that every autonomous agent must obey.
// This is the foundation of Zero Trust - the Dispatcher doesn't trust implementations,
// only the interface.
//
// Every agent in the UNO KERNEL must implement this interface to participate
// in the sovereign orchestration system.
type MCPAgent interface {
	// ID returns the unique identifier of the agent (UUID format).
	// This is the agent's "passport" in the system.
	ID() string

	// Name returns the human-readable name of the agent.
	// Example: "Identity Operations Agent", "Financial Ledger Agent"
	Name() string

	// Capabilities returns the list of permissions this agent possesses.
	// This is the agent's "manifest" - what it's allowed to do.
	// Format: "domain:resource:action" (e.g., "identity:user:create")
	Capabilities() []string

	// Execute processes a command within the agent's domain.
	// This is the ONLY method through which work is done.
	// It must be idempotent whenever possible.
	Execute(ctx context.Context, cmd Command) (Result, error)
}

// ========================================
// AGENT LIFECYCLE HOOKS (OPTIONAL)
// ========================================

// AgentWithInit is an optional interface for agents that need initialization.
type AgentWithInit interface {
	MCPAgent
	// Init is called once when the agent is registered with the Dispatcher.
	Init(ctx context.Context) error
}

// AgentWithShutdown is an optional interface for agents that need cleanup.
type AgentWithShutdown interface {
	MCPAgent
	// Shutdown is called when the Dispatcher is stopping.
	Shutdown(ctx context.Context) error
}

// AgentWithHealthCheck is an optional interface for agents with health monitoring.
type AgentWithHealthCheck interface {
	MCPAgent
	// HealthCheck returns nil if the agent is healthy, error otherwise.
	HealthCheck(ctx context.Context) error
}

// ========================================
// BASE AGENT IMPLEMENTATION
// ========================================

// BaseAgent provides a reusable foundation for building agents.
// Embed this in your agent structs to get default implementations.
type BaseAgent struct {
	AgentID           string
	AgentName         string
	AgentCapabilities []string
}

// ID implements MCPAgent.ID
func (b *BaseAgent) ID() string {
	return b.AgentID
}

// Name implements MCPAgent.Name
func (b *BaseAgent) Name() string {
	return b.AgentName
}

// Capabilities implements MCPAgent.Capabilities
func (b *BaseAgent) Capabilities() []string {
	return b.AgentCapabilities
}

// ========================================
// CAPABILITY CHECKING
// ========================================

// HasCapability checks if an agent has a specific capability.
// This is used by the Dispatcher for Zero Trust validation.
func HasCapability(agent MCPAgent, requiredCapability string) bool {
	for _, cap := range agent.Capabilities() {
		if cap == requiredCapability {
			return true
		}
		// Support wildcard capabilities (e.g., "identity:*" matches "identity:user:create")
		if matchWildcard(cap, requiredCapability) {
			return true
		}
	}
	return false
}

// matchWildcard checks if a capability pattern matches a specific capability.
// Supports:
//   - Exact match: "identity:user:create" == "identity:user:create"
//   - Trailing wildcard: "identity:*" matches "identity:user:create"
//   - Full wildcard: "*" matches everything
func matchWildcard(pattern, capability string) bool {
	if pattern == "*" {
		return true
	}

	// Check for trailing wildcard
	if len(pattern) > 1 && pattern[len(pattern)-1] == '*' {
		prefix := pattern[:len(pattern)-1]
		return len(capability) >= len(prefix) && capability[:len(prefix)] == prefix
	}

	return false
}
