package agent

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"prost-qs/backend/internal/jobs"
)

// ========================================
// AGENT JOBS - PROCESSAMENTO ASSÍNCRONO
// ========================================

// RegisterAgentJobHandlers registra handlers de jobs do módulo Agent
func RegisterAgentJobHandlers(jobService *jobs.JobService, agentService *AgentService) {
	jobService.RegisterHandler(JobTypeAgentExecution, func(ctx context.Context, job *jobs.Job) error {
		return handleAgentExecution(ctx, job, agentService)
	})
}

// handleAgentExecution processa job de execução de decisão
func handleAgentExecution(ctx context.Context, job *jobs.Job, agentService *AgentService) error {
	var payload AgentExecutionPayload
	if err := json.Unmarshal([]byte(job.Payload), &payload); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}

	decisionID, err := uuid.Parse(payload.DecisionID)
	if err != nil {
		return fmt.Errorf("invalid decision id: %w", err)
	}

	return agentService.ExecuteDecision(ctx, decisionID)
}
