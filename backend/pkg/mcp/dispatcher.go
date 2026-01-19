package mcp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"sync/atomic"
	"time"

	"prost-qs/backend/pkg/alerting"
)

// ========================================
// DISPATCHER ERRORS
// ========================================

var (
	// ErrAgentNotFound is returned when the requested agent doesn't exist.
	ErrAgentNotFound = errors.New("agent not found in registry")

	// ErrCapabilityDenied is returned when an agent lacks permission for a command.
	ErrCapabilityDenied = errors.New("capability violation: agent not authorized for this command")

	// ErrDispatcherNotInitialized is returned when Dispatch is called before Init.
	ErrDispatcherNotInitialized = errors.New("dispatcher not initialized")

	// ErrAuditFailed is returned when audit logging fails (critical error).
	ErrAuditFailed = errors.New("critical: audit logging failed")
)

// ========================================
// AUDIT REPOSITORY INTERFACE
// ========================================

// AuditRepository defines how kernel events are persisted.
// This is a PORT in hexagonal architecture - implementations are in infrastructure.
type AuditRepository interface {
	// RecordEvent persists a kernel event. Returns error if persistence fails.
	RecordEvent(ctx context.Context, event KernelEvent) error

	// GetEvents retrieves events with optional filtering.
	GetEvents(ctx context.Context, filter EventFilter) ([]KernelEvent, error)

	// GetEventByTraceID retrieves all events for a specific trace.
	GetEventsByTraceID(ctx context.Context, traceID string) ([]KernelEvent, error)
}

// EventFilter for querying audit logs.
type EventFilter struct {
	TraceID   string
	AgentID   string
	EventType EventType
	FromTime  *time.Time
	ToTime    *time.Time
	Limit     int
	Offset    int
}

// ========================================
// DISPATCHER - THE WATCHER'S CORE
// ========================================

// Dispatcher is the guardian of the Kernel.
// Nothing executes without passing through the Dispatcher.
// It enforces Zero Trust, audits everything, and orchestrates agents.
type Dispatcher struct {
	agents        map[string]MCPAgent
	agentBreakers map[string]bool // true = agent is disabled (circuit open)
	auditRepo     AuditRepository
	auditHub      *AuditHub // WebSocket broadcast hub
	mu            sync.RWMutex

	killSwitch int32 // 0 = Active, 1 = Killed

	// Configuration
	strictMode    bool // If true, audit failures cause execution to abort
	logToConsole  bool // If true, logs events to stdout
	enableMetrics bool // If true, records execution metrics
}

// DispatcherConfig holds configuration for the Dispatcher.
type DispatcherConfig struct {
	StrictMode    bool
	LogToConsole  bool
	EnableMetrics bool
}

// DefaultConfig returns sensible defaults for production.
func DefaultConfig() DispatcherConfig {
	return DispatcherConfig{
		StrictMode:    true, // Audit failures are fatal
		LogToConsole:  true, // Log for debugging
		EnableMetrics: true, // Track performance
	}
}

// NewDispatcher creates a new Dispatcher with the given audit repository.
func NewDispatcher(auditRepo AuditRepository, config DispatcherConfig) *Dispatcher {
	return &Dispatcher{
		agents:        make(map[string]MCPAgent),
		agentBreakers: make(map[string]bool),
		auditRepo:     auditRepo,
		strictMode:    config.StrictMode,
		logToConsole:  config.LogToConsole,
		enableMetrics: config.EnableMetrics,
	}
}

// SetAuditHub attaches a WebSocket hub for real-time event broadcasting.
func (d *Dispatcher) SetAuditHub(hub *AuditHub) {
	d.auditHub = hub
}

// ========================================
// EMERGENCY CONTROL
// ========================================

// EmergencyStop freezes the entire system.
func (d *Dispatcher) EmergencyStop() {
	atomic.StoreInt32(&d.killSwitch, 1)
	log.Println("🚨 [MCP] EMERGENCY STOP ACTIVATED. WATCHER FROZEN.")
	alerting.AlertKillSwitchStatus(true, "Emergency Stop activated manually or by policy")
}

// Resume unfreezes the system.
func (d *Dispatcher) Resume() {
	atomic.StoreInt32(&d.killSwitch, 0)
	log.Println("✅ [MCP] SYSTEM RESUMED.")
	alerting.AlertKillSwitchStatus(false, "System resumed manually")
}

// ========================================
// CIRCUIT BREAKER (Per-Agent)
// ========================================

// DisableAgent opens the circuit breaker for a specific agent.
func (d *Dispatcher) DisableAgent(agentID string, reason string) {
	d.mu.Lock()
	d.agentBreakers[agentID] = true
	d.mu.Unlock()
	log.Printf("🔴 [MCP] Agent DISABLED: %s | Reason: %s", agentID, reason)
	alerting.AlertAgentBreakerOpened(agentID, reason)
}

// EnableAgent closes the circuit breaker for a specific agent.
func (d *Dispatcher) EnableAgent(agentID string) {
	d.mu.Lock()
	delete(d.agentBreakers, agentID)
	d.mu.Unlock()
	log.Printf("🟢 [MCP] Agent ENABLED: %s", agentID)
}

// IsAgentDisabled checks if an agent's circuit breaker is open.
func (d *Dispatcher) IsAgentDisabled(agentID string) bool {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.agentBreakers[agentID]
}

// GetDisabledAgents returns a list of all disabled agents.
func (d *Dispatcher) GetDisabledAgents() []string {
	d.mu.RLock()
	defer d.mu.RUnlock()
	disabled := make([]string, 0, len(d.agentBreakers))
	for agentID := range d.agentBreakers {
		disabled = append(disabled, agentID)
	}
	return disabled
}

// DispatchInternal allows agents to invoke other agents.
// The callerAgentID is recorded in the audit trail for traceability.
func (d *Dispatcher) DispatchInternal(ctx context.Context, callerAgentID string, req DispatchRequest) (*DispatchResponse, error) {
	// Add caller info to context metadata
	type contextKey string
	const callerKey contextKey = "caller_agent"
	ctx = context.WithValue(ctx, callerKey, callerAgentID)

	// Log the internal dispatch intent
	log.Printf("[MCP] Internal Dispatch: %s -> %s:%s", callerAgentID, req.AgentID, req.Command)

	// Delegate to normal Dispatch (inherits Zero Trust checks)
	return d.Dispatch(ctx, req)
}

// ========================================
// AGENT REGISTRATION
// ========================================

// Register adds an agent to the execution pool.
// If the agent implements AgentWithInit, Init() is called.
func (d *Dispatcher) Register(agent MCPAgent) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	// Check for duplicate registration
	if _, exists := d.agents[agent.ID()]; exists {
		return fmt.Errorf("agent %s already registered", agent.ID())
	}

	// Initialize if needed
	if initAgent, ok := agent.(AgentWithInit); ok {
		if err := initAgent.Init(context.Background()); err != nil {
			return fmt.Errorf("agent %s initialization failed: %w", agent.ID(), err)
		}
	}

	d.agents[agent.ID()] = agent

	if d.logToConsole {
		log.Printf("[MCP] Agent Registered: %s (%s) with %d capabilities",
			agent.Name(), agent.ID(), len(agent.Capabilities()))
	}

	return nil
}

// Unregister removes an agent from the pool.
// If the agent implements AgentWithShutdown, Shutdown() is called.
func (d *Dispatcher) Unregister(agentID string) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	agent, exists := d.agents[agentID]
	if !exists {
		return ErrAgentNotFound
	}

	// Shutdown if needed
	if shutdownAgent, ok := agent.(AgentWithShutdown); ok {
		if err := shutdownAgent.Shutdown(context.Background()); err != nil {
			log.Printf("[MCP] Warning: Agent %s shutdown error: %v", agentID, err)
		}
	}

	delete(d.agents, agentID)
	return nil
}

// GetAgent retrieves an agent by ID.
func (d *Dispatcher) GetAgent(agentID string) (MCPAgent, bool) {
	d.mu.RLock()
	defer d.mu.RUnlock()
	agent, exists := d.agents[agentID]
	return agent, exists
}

// ListAgents returns the status of all registered agents.
func (d *Dispatcher) ListAgents() []AgentStatus {
	d.mu.RLock()
	defer d.mu.RUnlock()

	statuses := make([]AgentStatus, 0, len(d.agents))
	for _, agent := range d.agents {
		statuses = append(statuses, AgentStatus{
			ID:           agent.ID(),
			Name:         agent.Name(),
			Status:       "ACTIVE",
			Capabilities: agent.Capabilities(),
		})
	}
	return statuses
}

// ========================================
// DISPATCH - THE RITUAL OF EXECUTION
// ========================================

// Dispatch executes the Watcher Ritual:
// 1. Identification - Find the agent
// 2. Validation - Check capabilities (Zero Trust)
// 3. Intent Audit - Log what's about to happen
// 4. Execution - Run the command
// 5. Result Audit - Log what happened
func (d *Dispatcher) Dispatch(ctx context.Context, req DispatchRequest) (*DispatchResponse, error) {
	// 0. GOVERNANCE CHECK
	if atomic.LoadInt32(&d.killSwitch) == 1 {
		// Exception: Allow Policy Agent to restore order
		// We must allow the governance agent to deactivate the kill switch.
		isPolicyAgent := req.AgentID == "policy-ops-agent-001"
		isRecoveryCmd := req.Command == "policy:killswitch:deactivate" || req.Command == "policy:defcon:set"

		if !(isPolicyAgent && isRecoveryCmd) {
			return nil, errors.New("🚫 GOVERNANCE KILL-SWITCH ACTIVE: SYSTEM FROZEN")
		}
	}

	start := time.Now()
	traceID := GetTraceID(ctx)

	// Ensure trace ID is in context
	ctx = WithTraceID(ctx, traceID)
	ctx = WithAgentID(ctx, req.AgentID)

	// 1. IDENTIFICATION
	d.mu.RLock()
	agent, exists := d.agents[req.AgentID]
	d.mu.RUnlock()

	if !exists {
		d.logEvent(ctx, req.AgentID, req.Command, EventTypeViolation, nil, "Agent not found", 0)
		return nil, ErrAgentNotFound
	}

	// 2. VALIDATION (Zero Trust)
	if !HasCapability(agent, req.Command) {
		d.logEvent(ctx, req.AgentID, req.Command, EventTypeViolation, nil, "Unauthorized command", 0)
		return nil, ErrCapabilityDenied
	}

	// 2.5. CIRCUIT BREAKER CHECK
	if d.IsAgentDisabled(req.AgentID) {
		d.logEvent(ctx, req.AgentID, req.Command, EventTypeViolation, nil, "Agent circuit breaker OPEN", 0)
		return nil, fmt.Errorf("🔴 AGENT DISABLED: %s (circuit breaker open)", req.AgentID)
	}

	// 3. INTENT AUDIT
	if err := d.logEvent(ctx, req.AgentID, req.Command, EventTypeIntent, req.Params, nil, 0); err != nil {
		if d.strictMode {
			return nil, fmt.Errorf("%w: %v", ErrAuditFailed, err)
		}
	}

	// 4. EXECUTION
	cmd := Command{Name: req.Command, Params: req.Params}
	result, execErr := agent.Execute(ctx, cmd)

	executionTime := time.Since(start).Milliseconds()

	// 5. RESULT AUDIT
	status := EventTypeSuccess
	if execErr != nil || !result.IsSuccess() {
		status = EventTypeFailure
	}

	resultPayload, _ := json.Marshal(result)
	metadata := map[string]interface{}{
		"error": execErr,
	}
	metaBytes, _ := json.Marshal(metadata)
	d.logEventWithMeta(ctx, req.AgentID, req.Command, status, resultPayload, metaBytes, executionTime)

	// Build response
	responseStatus := "SUCCESS"
	if execErr != nil {
		responseStatus = "FAILED"
	}

	return &DispatchResponse{
		TraceID:         traceID,
		Status:          responseStatus,
		Result:          result.Data,
		ExecutionTimeMs: executionTime,
		Timestamp:       time.Now(),
	}, execErr
}

// ========================================
// AUDIT LOGGING
// ========================================

func (d *Dispatcher) logEvent(ctx context.Context, agentID, command string, eventType EventType, payload json.RawMessage, metadata interface{}, executionMs int64) error {
	var metaBytes json.RawMessage
	if metadata != nil {
		if m, ok := metadata.(json.RawMessage); ok {
			metaBytes = m // Already bytes
		} else if s, ok := metadata.(string); ok {
			// If it's a string, wrap it in a JSON object or just use it if it's raw
			metaBytes = json.RawMessage(fmt.Sprintf(`{"message": %q}`, s))
		} else {
			metaBytes, _ = json.Marshal(metadata)
		}
	}
	return d.logEventWithMeta(ctx, agentID, command, eventType, payload, metaBytes, executionMs)
}

func (d *Dispatcher) logEventWithMeta(ctx context.Context, agentID, command string, eventType EventType, payload, metadata json.RawMessage, executionMs int64) error {
	traceID := GetTraceID(ctx)

	event := KernelEvent{
		ID:          GenerateTraceID(), // Each event gets its own ID
		TraceID:     traceID,
		Timestamp:   time.Now(),
		AgentID:     agentID,
		Command:     command,
		EventType:   eventType,
		Payload:     payload,
		Metadata:    metadata,
		ExecutionMs: executionMs,
	}

	if d.logToConsole {
		log.Printf("[MCP] %s | %s | %s | %s | %dms", eventType, traceID[:8], agentID, command, executionMs)
	}

	if d.auditRepo != nil {
		if err := d.auditRepo.RecordEvent(ctx, event); err != nil {
			log.Printf("[MCP] AUDIT FAILURE: %v", err)
			return err
		}
	}

	// Broadcast to WebSocket clients (real-time)
	if d.auditHub != nil {
		d.auditHub.Broadcast(&event)
	}

	return nil
}

// ========================================
// HEALTH & METRICS
// ========================================

// HealthCheck runs health checks on all agents that support it.
func (d *Dispatcher) HealthCheck(ctx context.Context) map[string]error {
	d.mu.RLock()
	defer d.mu.RUnlock()

	results := make(map[string]error)
	for id, agent := range d.agents {
		if hc, ok := agent.(AgentWithHealthCheck); ok {
			results[id] = hc.HealthCheck(ctx)
		} else {
			results[id] = nil // Healthy if no health check defined
		}
	}
	return results
}

// AgentCount returns the number of registered agents.
func (d *Dispatcher) AgentCount() int {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return len(d.agents)
}
