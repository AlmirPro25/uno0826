package policy_agent

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"prost-qs/backend/pkg/mcp"
	"prost-qs/backend/pkg/warobs"
)

// PolicyOpsAgent governs system-wide rules and defense mechanisms.
// It acts as the "General" receiving intel from WarObs and controlling DEFCON.
type PolicyOpsAgent struct {
	mcp.BaseAgent
	dispatcher *mcp.Dispatcher
	warobs     *warobs.WarObservability
	defcon     *mcp.DefconManager
}

// NewPolicyOpsAgent creates a new policy agent.
func NewPolicyOpsAgent(dispatcher *mcp.Dispatcher, warObs *warobs.WarObservability, defcon *mcp.DefconManager) *PolicyOpsAgent {
	agent := &PolicyOpsAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:   "policy-ops-agent-001",
			AgentName: "Governance & Policy Agent",
			AgentCapabilities: []string{
				"policy:defcon:set",
				"policy:defcon:get",
				"policy:defcon:escalate",
				"policy:killswitch:activate",
				"policy:killswitch:deactivate",
				"policy:agent:disable",
				"policy:agent:enable",
				"policy:agent:list-disabled",
				"policy:status",
			},
		},
		dispatcher: dispatcher,
		warobs:     warObs,
		defcon:     defcon,
	}

	// Start autonomous monitoring routine (The Immune System)
	go agent.monitorPressure()

	return agent
}

// monitorPressure keeps an eye on WarObs indicators and adjusts DEFCON automatically.
func (a *PolicyOpsAgent) monitorPressure() {
	ticker := time.NewTicker(5 * time.Second)
	for range ticker.C {
		if a.warobs == nil || a.defcon == nil {
			continue
		}

		summary := a.warobs.GetHealthSummary()

		// AUTO-DEFENSE PROTOCOL: Adjust DEFCON based on pressure
		switch summary.Status {
		case "critical":
			if a.defcon.GetLevel() > mcp.DefconCritical {
				a.defcon.SetLevel(mcp.DefconCritical, "WarObs: Critical Pressure", true)
				a.dispatcher.EmergencyStop()
			}
		case "high":
			if a.defcon.GetLevel() > mcp.DefconSevere {
				a.defcon.SetLevel(mcp.DefconSevere, "WarObs: High Pressure", true)
			}
		case "elevated":
			if a.defcon.GetLevel() > mcp.DefconSubstantial {
				a.defcon.SetLevel(mcp.DefconSubstantial, "WarObs: Elevated Pressure", true)
			}
		case "normal":
			// Gradually de-escalate if currently elevated
			if a.defcon.GetLevel() < mcp.DefconNormal {
				a.defcon.Deescalate("WarObs: Pressure normalized")
			}
		}
	}
}

// Execute processes policy commands.
func (a *PolicyOpsAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	switch cmd.Name {
	case "policy:killswitch:activate":
		return a.activateKillSwitch(cmd.Params)
	case "policy:killswitch:deactivate":
		return a.deactivateKillSwitch(cmd.Params)
	case "policy:defcon:set":
		return a.setDefcon(cmd.Params)
	case "policy:defcon:get":
		return a.getDefcon()
	case "policy:defcon:escalate":
		return a.escalateDefcon(cmd.Params)
	case "policy:agent:disable":
		return a.disableAgent(cmd.Params)
	case "policy:agent:enable":
		return a.enableAgent(cmd.Params)
	case "policy:agent:list-disabled":
		return a.listDisabledAgents()
	case "policy:status":
		return a.getStatus()
	default:
		return mcp.Result{Error: "Unknown command"}, fmt.Errorf("unknown command: %s", cmd.Name)
	}
}

func (a *PolicyOpsAgent) activateKillSwitch(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		Reason string `json:"reason"`
	}
	_ = json.Unmarshal(params, &input)

	// Set DEFCON to Critical (1)
	if a.defcon != nil {
		a.defcon.SetLevel(mcp.DefconCritical, input.Reason, false)
	}
	a.dispatcher.EmergencyStop()

	return mcp.Result{Data: map[string]interface{}{
		"status":    "KILLED",
		"defcon":    1,
		"reason":    input.Reason,
		"timestamp": time.Now(),
	}}, nil
}

func (a *PolicyOpsAgent) deactivateKillSwitch(params json.RawMessage) (mcp.Result, error) {
	a.dispatcher.Resume()

	// Reset DEFCON to Normal (5)
	if a.defcon != nil {
		a.defcon.SetLevel(mcp.DefconNormal, "Manual resume", false)
	}

	return mcp.Result{Data: map[string]interface{}{
		"status":    "ACTIVE",
		"defcon":    5,
		"timestamp": time.Now(),
	}}, nil
}

func (a *PolicyOpsAgent) setDefcon(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		Level  int    `json:"level"`
		Reason string `json:"reason"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	if input.Level < 1 || input.Level > 5 {
		return mcp.Result{Error: "Level must be 1-5"}, fmt.Errorf("invalid level: %d", input.Level)
	}

	if a.defcon != nil {
		a.defcon.SetLevel(mcp.DefconLevel(input.Level), input.Reason, false)

		// If DEFCON 1, activate kill switch
		if input.Level == 1 {
			a.dispatcher.EmergencyStop()
		} else if a.defcon.GetLevel() == mcp.DefconCritical {
			// If coming out of DEFCON 1, resume
			a.dispatcher.Resume()
		}
	}

	return mcp.Result{Data: map[string]interface{}{
		"defcon":    input.Level,
		"reason":    input.Reason,
		"timestamp": time.Now(),
	}}, nil
}

func (a *PolicyOpsAgent) getDefcon() (mcp.Result, error) {
	if a.defcon == nil {
		return mcp.Result{Data: map[string]interface{}{"defcon": 5}}, nil
	}
	return mcp.Result{Data: a.defcon.GetStatus()}, nil
}

func (a *PolicyOpsAgent) escalateDefcon(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		Reason string `json:"reason"`
	}
	_ = json.Unmarshal(params, &input)

	if a.defcon != nil {
		a.defcon.Escalate(input.Reason, false)

		// If reached DEFCON 1, activate kill switch
		if a.defcon.GetLevel() == mcp.DefconCritical {
			a.dispatcher.EmergencyStop()
		}
	}

	return mcp.Result{Data: map[string]interface{}{
		"defcon":    int(a.defcon.GetLevel()),
		"reason":    input.Reason,
		"timestamp": time.Now(),
	}}, nil
}

func (a *PolicyOpsAgent) getStatus() (mcp.Result, error) {
	defconStatus := map[string]interface{}{"level": 5}
	if a.defcon != nil {
		defconStatus = a.defcon.GetStatus()
	}

	disabledAgents := a.dispatcher.GetDisabledAgents()

	return mcp.Result{Data: map[string]interface{}{
		"status":          "OPERATIONAL",
		"defcon":          defconStatus,
		"disabled_agents": disabledAgents,
	}}, nil
}

// ========================================
// CIRCUIT BREAKER COMMANDS
// ========================================

func (a *PolicyOpsAgent) disableAgent(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		AgentID string `json:"agent_id"`
		Reason  string `json:"reason"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	if input.AgentID == "" {
		return mcp.Result{Error: "agent_id is required"}, fmt.Errorf("missing agent_id")
	}

	// Prevent self-disable (can't disable the policy agent)
	if input.AgentID == "policy-ops-agent-001" {
		return mcp.Result{Error: "Cannot disable the Policy Agent"}, fmt.Errorf("self-disable not allowed")
	}

	a.dispatcher.DisableAgent(input.AgentID, input.Reason)

	return mcp.Result{Data: map[string]interface{}{
		"agent_id":  input.AgentID,
		"status":    "DISABLED",
		"reason":    input.Reason,
		"timestamp": time.Now(),
	}}, nil
}

func (a *PolicyOpsAgent) enableAgent(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		AgentID string `json:"agent_id"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	if input.AgentID == "" {
		return mcp.Result{Error: "agent_id is required"}, fmt.Errorf("missing agent_id")
	}

	a.dispatcher.EnableAgent(input.AgentID)

	return mcp.Result{Data: map[string]interface{}{
		"agent_id":  input.AgentID,
		"status":    "ENABLED",
		"timestamp": time.Now(),
	}}, nil
}

func (a *PolicyOpsAgent) listDisabledAgents() (mcp.Result, error) {
	disabled := a.dispatcher.GetDisabledAgents()
	return mcp.Result{Data: map[string]interface{}{
		"disabled_agents": disabled,
		"count":           len(disabled),
	}}, nil
}
