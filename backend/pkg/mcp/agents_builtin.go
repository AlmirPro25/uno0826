package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// ========================================
// SYSTEM AGENT - REFERENCE IMPLEMENTATION
// ========================================

// SystemAgent is the built-in agent for kernel-level operations.
// It provides health checks, diagnostics, and system information.
type SystemAgent struct {
	BaseAgent
	dispatcher *Dispatcher
	startTime  time.Time
}

// NewSystemAgent creates a new system agent.
// The dispatcher is injected to allow introspection capabilities.
func NewSystemAgent(dispatcher *Dispatcher) *SystemAgent {
	return &SystemAgent{
		BaseAgent: BaseAgent{
			AgentID:   "system-agent-001",
			AgentName: "Kernel System Agent",
			AgentCapabilities: []string{
				"system:health:check",
				"system:agents:list",
				"system:echo",
				"system:time",
			},
		},
		dispatcher: dispatcher,
		startTime:  time.Now(),
	}
}

// Execute processes system commands.
func (a *SystemAgent) Execute(ctx context.Context, cmd Command) (Result, error) {
	switch cmd.Name {
	case "system:health:check":
		return a.healthCheck(ctx)
	case "system:agents:list":
		return a.listAgents(ctx)
	case "system:echo":
		return a.echo(cmd.Params)
	case "system:time":
		return a.systemTime()
	default:
		return Result{Error: "Unknown system command"}, fmt.Errorf("unknown command: %s", cmd.Name)
	}
}

func (a *SystemAgent) healthCheck(ctx context.Context) (Result, error) {
	health := map[string]interface{}{
		"status":      "healthy",
		"uptime_ms":   time.Since(a.startTime).Milliseconds(),
		"agent_count": a.dispatcher.AgentCount(),
		"timestamp":   time.Now().Format(time.RFC3339),
	}

	// Run health checks on all agents if dispatcher available
	if a.dispatcher != nil {
		agentHealth := a.dispatcher.HealthCheck(ctx)
		healthyCount := 0
		for _, err := range agentHealth {
			if err == nil {
				healthyCount++
			}
		}
		health["healthy_agents"] = healthyCount
		health["total_agents"] = len(agentHealth)
	}

	return Result{Data: health}, nil
}

func (a *SystemAgent) listAgents(ctx context.Context) (Result, error) {
	if a.dispatcher == nil {
		return Result{Error: "Dispatcher not available"}, fmt.Errorf("dispatcher not initialized")
	}

	agents := a.dispatcher.ListAgents()
	return Result{Data: agents}, nil
}

func (a *SystemAgent) echo(params json.RawMessage) (Result, error) {
	var input struct {
		Message string `json:"message"`
	}

	if err := json.Unmarshal(params, &input); err != nil {
		return Result{Error: "Invalid params: expected {message: string}"}, err
	}

	return Result{Data: map[string]string{
		"echo":      input.Message,
		"timestamp": time.Now().Format(time.RFC3339),
	}}, nil
}

func (a *SystemAgent) systemTime() (Result, error) {
	return Result{Data: map[string]interface{}{
		"utc":       time.Now().UTC().Format(time.RFC3339),
		"local":     time.Now().Format(time.RFC3339),
		"unix":      time.Now().Unix(),
		"uptime_ms": time.Since(a.startTime).Milliseconds(),
	}}, nil
}

// ========================================
// ECHO AGENT - MINIMAL EXAMPLE
// ========================================

// EchoAgent is the simplest possible agent for testing and demonstrations.
type EchoAgent struct {
	BaseAgent
}

// NewEchoAgent creates a minimal echo agent.
func NewEchoAgent() *EchoAgent {
	return &EchoAgent{
		BaseAgent: BaseAgent{
			AgentID:   "echo-agent-001",
			AgentName: "Echo Test Agent",
			AgentCapabilities: []string{
				"echo:message",
				"echo:json",
			},
		},
	}
}

// Execute simply echoes back the input.
func (a *EchoAgent) Execute(ctx context.Context, cmd Command) (Result, error) {
	traceID := GetTraceID(ctx)

	return Result{Data: map[string]interface{}{
		"command":   cmd.Name,
		"params":    json.RawMessage(cmd.Params),
		"trace_id":  traceID,
		"echoed_at": time.Now().Format(time.RFC3339),
	}}, nil
}
