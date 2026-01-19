package identity_agent

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"prost-qs/backend/internal/identity"
	"prost-qs/backend/pkg/mcp"

	"github.com/google/uuid"
)

// IdentityOpsAgent wraps the internal IdentityService to expose it via MCP.
type IdentityOpsAgent struct {
	mcp.BaseAgent
	userService *identity.UserService
}

// NewIdentityOpsAgent creates a new identity agent.
func NewIdentityOpsAgent(userService *identity.UserService) *IdentityOpsAgent {
	return &IdentityOpsAgent{
		BaseAgent: mcp.BaseAgent{
			AgentID:   "identity-ops-agent-001",
			AgentName: "Identity Operations Agent",
			AgentCapabilities: []string{
				"identity:user:create",
				"identity:user:get",
				"identity:user:list",
				"identity:user:status",
			},
		},
		userService: userService,
	}
}

// Execute processes identity commands.
func (a *IdentityOpsAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	switch cmd.Name {
	case "identity:user:create":
		return a.createUser(cmd.Params)
	case "identity:user:get":
		return a.getUser(cmd.Params)
	case "identity:user:list":
		return a.listUsers(cmd.Params)
	case "identity:user:status":
		return a.changeUserStatus(cmd.Params)
	default:
		return mcp.Result{Error: "Unknown command"}, fmt.Errorf("unknown command: %s", cmd.Name)
	}
}

// ------------------------------------------------------------------
// COMMAND HANDLERS
// ------------------------------------------------------------------

func (a *IdentityOpsAgent) createUser(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	user, err := a.userService.CreateUser(input.Name, input.Email, input.Phone)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: user}, nil
}

func (a *IdentityOpsAgent) getUser(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		UserID string `json:"user_id"`
		Email  string `json:"email"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	var user *identity.User
	var err error

	if input.UserID != "" {
		uid, parseErr := uuid.Parse(input.UserID)
		if parseErr != nil {
			return mcp.Result{Error: "Invalid UUID"}, parseErr
		}
		user, err = a.userService.GetUserByID(uid)
	} else if input.Email != "" {
		user, err = a.userService.GetUserByEmail(input.Email)
	} else {
		return mcp.Result{Error: "Either user_id or email is required"}, fmt.Errorf("missing identifier")
	}

	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: user}, nil
}

func (a *IdentityOpsAgent) listUsers(params json.RawMessage) (mcp.Result, error) {
	var input struct {
		Limit  int `json:"limit"`
		Offset int `json:"offset"`
	}
	_ = json.Unmarshal(params, &input) // Ignore error, use zero values

	if input.Limit <= 0 {
		input.Limit = 10
	}

	users, total, err := a.userService.ListAllUsers(input.Limit, input.Offset)
	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: map[string]interface{}{
		"users":  users,
		"total":  total,
		"limit":  input.Limit,
		"offset": input.Offset,
	}}, nil
}

func (a *IdentityOpsAgent) changeUserStatus(params json.RawMessage) (mcp.Result, error) {
	// Status change logic (ban/suspend/reactivate)
	// Implementation follows the service capabilities
	var input struct {
		UserID string `json:"user_id"`
		Action string `json:"action"` // ban, suspend, reactivate
		Reason string `json:"reason"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return mcp.Result{Error: "Invalid params"}, err
	}

	uid, err := uuid.Parse(input.UserID)
	if err != nil {
		return mcp.Result{Error: "Invalid UUID"}, err
	}

	switch input.Action {
	case "ban":
		err = a.userService.BanUser(uid, input.Reason)
	case "suspend":
		err = a.userService.SuspendUser(uid, input.Reason)
	case "reactivate":
		err = a.userService.ReactivateUser(uid)
	default:
		return mcp.Result{Error: "Invalid action. Use: ban, suspend, reactivate"}, fmt.Errorf("invalid action")
	}

	if err != nil {
		return mcp.Result{Error: err.Error()}, err
	}

	return mcp.Result{Data: map[string]string{
		"message":   fmt.Sprintf("User %s successfully %sed", input.UserID, input.Action),
		"timestamp": time.Now().Format(time.RFC3339),
	}}, nil
}
