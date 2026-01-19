package memory_agent

import (
	"context"
	"encoding/json"
	"fmt"

	"prost-qs/backend/internal/memory"
	"prost-qs/backend/pkg/mcp"

	"github.com/google/uuid"
)

// MemoryOpsAgent handles institutional memory operations
type MemoryOpsAgent struct {
	memorySvc *memory.MemoryService
}

// NewMemoryOpsAgent creates a new memory ops agent
func NewMemoryOpsAgent(memorySvc *memory.MemoryService) *MemoryOpsAgent {
	return &MemoryOpsAgent{
		memorySvc: memorySvc,
	}
}

func (a *MemoryOpsAgent) ID() string {
	return "agent:memory:ops"
}

func (a *MemoryOpsAgent) Name() string {
	return "Memory Operations Agent"
}

func (a *MemoryOpsAgent) Capabilities() []string {
	return []string{
		"memory:decision:check",
		"memory:conflict:list",
		"memory:precedent:list",
		"memory:review:list",
	}
}

func (a *MemoryOpsAgent) Execute(ctx context.Context, cmd mcp.Command) (mcp.Result, error) {
	switch cmd.Name {
	case "memory:decision:check":
		return a.handleCheckDecision(cmd)
	case "memory:conflict:list":
		return a.handleListConflicts(cmd)
	case "memory:precedent:list":
		return a.handleListPrecedents(cmd)
	case "memory:review:list":
		return a.handleListReviews(cmd)
	default:
		return mcp.Result{
			Error: fmt.Sprintf("Capacidade não suportada: %s", cmd.Name),
		}, nil
	}
}

func (a *MemoryOpsAgent) handleCheckDecision(cmd mcp.Command) (mcp.Result, error) {
	var params struct {
		DecisionID string `json:"decision_id"`
	}
	if err := json.Unmarshal(cmd.Params, &params); err != nil {
		return mcp.Result{Error: "Falha ao processar parâmetros"}, nil
	}

	if params.DecisionID == "" {
		return mcp.Result{Error: "decision_id é obrigatório"}, nil
	}

	decisionID, err := uuid.Parse(params.DecisionID)
	if err != nil {
		return mcp.Result{Error: "decision_id inválido"}, nil
	}

	canExecute, reason, err := a.memorySvc.CanExecute(decisionID)
	if err != nil {
		return mcp.Result{Error: fmt.Sprintf("Erro ao verificar decisão: %v", err)}, nil
	}

	return mcp.Result{
		Data: map[string]interface{}{
			"can_execute": canExecute,
			"reason":      reason,
			"decision_id": decisionID,
		},
	}, nil
}

func (a *MemoryOpsAgent) handleListConflicts(cmd mcp.Command) (mcp.Result, error) {
	var params struct {
		Domain string `json:"domain"`
	}
	_ = json.Unmarshal(cmd.Params, &params)

	conflicts, err := a.memorySvc.GetOpenConflicts(params.Domain)
	if err != nil {
		return mcp.Result{Error: fmt.Sprintf("Erro ao listar conflitos: %v", err)}, nil
	}

	return mcp.Result{
		Data: map[string]interface{}{
			"conflicts": conflicts,
			"count":     len(conflicts),
		},
	}, nil
}

func (a *MemoryOpsAgent) handleListPrecedents(cmd mcp.Command) (mcp.Result, error) {
	var params struct {
		Domain string `json:"domain"`
		Action string `json:"action"`
	}
	if err := json.Unmarshal(cmd.Params, &params); err != nil {
		return mcp.Result{Error: "Falha ao processar parâmetros"}, nil
	}

	if params.Domain == "" || params.Action == "" {
		return mcp.Result{Error: "domain e action são obrigatórios"}, nil
	}

	precedents, err := a.memorySvc.ListPrecedentsForContext(params.Domain, params.Action)
	if err != nil {
		return mcp.Result{Error: fmt.Sprintf("Erro ao listar precedentes: %v", err)}, nil
	}

	// Formatar precedentes para facilitar leitura
	formatted := make([]string, len(precedents))
	for i, p := range precedents {
		formatted[i] = a.memorySvc.FormatPrecedentForPresentation(&p)
	}

	return mcp.Result{
		Data: map[string]interface{}{
			"precedents": precedents,
			"formatted":  formatted,
			"count":      len(precedents),
		},
	}, nil
}

func (a *MemoryOpsAgent) handleListReviews(cmd mcp.Command) (mcp.Result, error) {
	reviews, err := a.memorySvc.GetPendingReviews()
	if err != nil {
		return mcp.Result{Error: fmt.Sprintf("Erro ao listar revisões: %v", err)}, nil
	}

	return mcp.Result{
		Data: map[string]interface{}{
			"reviews": reviews,
			"count":   len(reviews),
		},
	}, nil
}
