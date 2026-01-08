package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/internal/jobs"
)

// ========================================
// AGENT SERVICE
// "Decision Proposer + Risk Classifier"
// ========================================

// AgentService gerencia agentes e suas decisões
type AgentService struct {
	db             *gorm.DB
	policyEnforcer *PolicyEnforcer
	jobService     *jobs.JobService
}

// NewAgentService cria nova instância
func NewAgentService(db *gorm.DB, jobService *jobs.JobService) *AgentService {
	return &AgentService{
		db:             db,
		policyEnforcer: NewPolicyEnforcer(db),
		jobService:     jobService,
	}
}

// ========================================
// AGENT CRUD
// ========================================

// CreateAgent cria um novo agente
func (s *AgentService) CreateAgent(ctx context.Context, tenantID uuid.UUID, name, description string, agentType AgentType) (*Agent, error) {
	agent := &Agent{
		ID:          uuid.New(),
		TenantID:    tenantID,
		Name:        name,
		Description: description,
		Type:        string(agentType),
		Status:      string(AgentStatusActive),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(agent).Error; err != nil {
		return nil, fmt.Errorf("failed to create agent: %w", err)
	}

	return agent, nil
}

// GetAgent busca agente por ID
func (s *AgentService) GetAgent(agentID uuid.UUID) (*Agent, error) {
	var agent Agent
	if err := s.db.Where("id = ?", agentID).First(&agent).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAgentNotFound
		}
		return nil, err
	}
	return &agent, nil
}

// ListAgents lista agentes de um tenant
func (s *AgentService) ListAgents(tenantID uuid.UUID) ([]Agent, error) {
	var agents []Agent
	if err := s.db.Where("tenant_id = ?", tenantID).Order("created_at DESC").Find(&agents).Error; err != nil {
		return nil, err
	}
	return agents, nil
}

// SuspendAgent suspende um agente
func (s *AgentService) SuspendAgent(ctx context.Context, agentID uuid.UUID) (*Agent, error) {
	agent, err := s.GetAgent(agentID)
	if err != nil {
		return nil, err
	}

	agent.Status = string(AgentStatusSuspended)
	agent.UpdatedAt = time.Now()

	if err := s.db.Save(agent).Error; err != nil {
		return nil, err
	}

	return agent, nil
}

// ActivateAgent ativa um agente
func (s *AgentService) ActivateAgent(ctx context.Context, agentID uuid.UUID) (*Agent, error) {
	agent, err := s.GetAgent(agentID)
	if err != nil {
		return nil, err
	}

	agent.Status = string(AgentStatusActive)
	agent.UpdatedAt = time.Now()

	if err := s.db.Save(agent).Error; err != nil {
		return nil, err
	}

	return agent, nil
}

// ========================================
// POLICY CRUD
// ========================================

// CreatePolicy cria política para agente
func (s *AgentService) CreatePolicy(ctx context.Context, agentID uuid.UUID, domain PolicyDomain, allowedActions []string, maxAmount int64, requiresApproval bool) (*AgentPolicy, error) {
	// Verificar se agente existe
	if _, err := s.GetAgent(agentID); err != nil {
		return nil, err
	}

	// Verificar se já existe política para esse domínio
	var existing AgentPolicy
	if err := s.db.Where("agent_id = ? AND domain = ?", agentID, domain).First(&existing).Error; err == nil {
		return nil, errors.New("policy already exists for this domain")
	}

	actionsJSON, err := json.Marshal(allowedActions)
	if err != nil {
		return nil, err
	}

	policy := &AgentPolicy{
		ID:               uuid.New(),
		AgentID:          agentID,
		Domain:           string(domain),
		MaxAmount:        maxAmount,
		AllowedActions:   string(actionsJSON),
		RequiresApproval: requiresApproval,
		MaxRiskScore:     0.2, // Default
		DailyLimit:       100, // Default
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.db.Create(policy).Error; err != nil {
		return nil, fmt.Errorf("failed to create policy: %w", err)
	}

	return policy, nil
}

// GetPolicies lista políticas de um agente
func (s *AgentService) GetPolicies(agentID uuid.UUID) ([]AgentPolicy, error) {
	var policies []AgentPolicy
	if err := s.db.Where("agent_id = ?", agentID).Find(&policies).Error; err != nil {
		return nil, err
	}
	return policies, nil
}

// UpdatePolicy atualiza política
func (s *AgentService) UpdatePolicy(ctx context.Context, policyID uuid.UUID, allowedActions []string, maxAmount int64, requiresApproval bool, maxRiskScore float64, dailyLimit int) (*AgentPolicy, error) {
	var policy AgentPolicy
	if err := s.db.Where("id = ?", policyID).First(&policy).Error; err != nil {
		return nil, ErrPolicyNotFound
	}

	actionsJSON, err := json.Marshal(allowedActions)
	if err != nil {
		return nil, err
	}

	policy.AllowedActions = string(actionsJSON)
	policy.MaxAmount = maxAmount
	policy.RequiresApproval = requiresApproval
	policy.MaxRiskScore = maxRiskScore
	policy.DailyLimit = dailyLimit
	policy.UpdatedAt = time.Now()

	if err := s.db.Save(&policy).Error; err != nil {
		return nil, err
	}

	return &policy, nil
}

// ========================================
// DECISION LIFECYCLE
// ========================================

// ProposeDecisionInput input para propor decisão
type ProposeDecisionInput struct {
	AgentID        uuid.UUID
	Domain         string
	Action         string
	TargetEntity   string // Ex: "campaign:uuid"
	Payload        map[string]interface{}
	Reason         string
	Amount         int64 // Valor envolvido (para cálculo de risco)
}

// ProposeDecision agente propõe uma decisão
func (s *AgentService) ProposeDecision(ctx context.Context, input ProposeDecisionInput) (*AgentDecision, error) {
	// 1. Buscar agente
	agent, err := s.GetAgent(input.AgentID)
	if err != nil {
		return nil, err
	}

	// 2. Calcular risk score
	dailyCount, _ := s.policyEnforcer.getDailyActionCount(input.AgentID)
	riskFactors := RiskFactors{
		Amount:          input.Amount,
		ActionFrequency: dailyCount,
		AgentHistory:    s.getAgentSuccessRate(input.AgentID),
		EntityState:     s.getEntityState(input.TargetEntity),
		TimeOfDay:       time.Now().Hour(),
		IsFirstAction:   dailyCount == 0,
	}
	riskScore := CalculateRiskScore(riskFactors)

	// 3. Verificar política
	policyResult, err := s.policyEnforcer.CheckPolicy(input.AgentID, input.Domain, input.Action, input.Amount, riskScore)
	if err != nil {
		// Criar decisão rejeitada para auditoria
		decision := s.createRejectedDecision(agent, input, riskScore, err.Error())
		return decision, err
	}

	// 4. Verificar se entidade está em DISPUTED
	if s.isEntityDisputed(input.TargetEntity) {
		decision := s.createRejectedDecision(agent, input, riskScore, "target entity is disputed")
		return decision, ErrEntityDisputed
	}

	// 5. Verificar se risco é muito alto
	if ShouldBlock(riskScore) {
		decision := s.createRejectedDecision(agent, input, riskScore, "risk score too high")
		return decision, ErrRiskTooHigh
	}

	// 6. Criar decisão
	payloadJSON, _ := json.Marshal(input.Payload)
	
	decision := &AgentDecision{
		ID:             uuid.New(),
		AgentID:        input.AgentID,
		TenantID:       agent.TenantID,
		Domain:         input.Domain,
		ProposedAction: input.Action,
		TargetEntity:   input.TargetEntity,
		Payload:        string(payloadJSON),
		Reason:         input.Reason,
		RiskScore:      riskScore,
		ExpiresAt:      time.Now().Add(24 * time.Hour), // Expira em 24h
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// 7. Determinar status inicial
	if !policyResult.RequiresApproval && ShouldAutoApprove(riskScore) {
		decision.Status = string(DecisionApproved)
		// Auto-aprovar e enfileirar execução
		if err := s.db.Create(decision).Error; err != nil {
			return nil, err
		}
		s.policyEnforcer.IncrementDailyCount(input.AgentID, "actions")
		s.policyEnforcer.IncrementDailyCount(input.AgentID, "approved")
		
		// Enfileirar job de execução
		s.enqueueExecution(decision)
		
		return decision, nil
	}

	// Precisa aprovação humana
	decision.Status = string(DecisionProposed)
	if err := s.db.Create(decision).Error; err != nil {
		return nil, err
	}
	s.policyEnforcer.IncrementDailyCount(input.AgentID, "actions")

	return decision, nil
}

// createRejectedDecision cria decisão rejeitada para auditoria
func (s *AgentService) createRejectedDecision(agent *Agent, input ProposeDecisionInput, riskScore float64, reason string) *AgentDecision {
	payloadJSON, _ := json.Marshal(input.Payload)
	
	decision := &AgentDecision{
		ID:             uuid.New(),
		AgentID:        input.AgentID,
		TenantID:       agent.TenantID,
		Domain:         input.Domain,
		ProposedAction: input.Action,
		TargetEntity:   input.TargetEntity,
		Payload:        string(payloadJSON),
		Reason:         input.Reason,
		RiskScore:      riskScore,
		Status:         string(DecisionRejected),
		ReviewNote:     reason,
		ExpiresAt:      time.Now(),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	
	s.db.Create(decision)
	s.policyEnforcer.IncrementDailyCount(input.AgentID, "actions")
	s.policyEnforcer.IncrementDailyCount(input.AgentID, "rejected")
	
	return decision
}

// ApproveDecision humano aprova decisão
func (s *AgentService) ApproveDecision(ctx context.Context, decisionID uuid.UUID, reviewerID uuid.UUID, note string) (*AgentDecision, error) {
	decision, err := s.GetDecision(decisionID)
	if err != nil {
		return nil, err
	}

	// Verificar estado
	if decision.Status != string(DecisionProposed) {
		return nil, ErrInvalidDecisionState
	}

	// Verificar expiração
	if time.Now().After(decision.ExpiresAt) {
		decision.Status = string(DecisionExpired)
		s.db.Save(decision)
		return nil, ErrDecisionExpired
	}

	// Aprovar
	decision.Status = string(DecisionApproved)
	decision.ReviewedBy = &reviewerID
	decision.ReviewNote = note
	decision.UpdatedAt = time.Now()

	if err := s.db.Save(decision).Error; err != nil {
		return nil, err
	}

	s.policyEnforcer.IncrementDailyCount(decision.AgentID, "approved")

	// Enfileirar execução
	s.enqueueExecution(decision)

	return decision, nil
}

// RejectDecision humano rejeita decisão
func (s *AgentService) RejectDecision(ctx context.Context, decisionID uuid.UUID, reviewerID uuid.UUID, note string) (*AgentDecision, error) {
	decision, err := s.GetDecision(decisionID)
	if err != nil {
		return nil, err
	}

	if decision.Status != string(DecisionProposed) {
		return nil, ErrInvalidDecisionState
	}

	decision.Status = string(DecisionRejected)
	decision.ReviewedBy = &reviewerID
	decision.ReviewNote = note
	decision.UpdatedAt = time.Now()

	if err := s.db.Save(decision).Error; err != nil {
		return nil, err
	}

	s.policyEnforcer.IncrementDailyCount(decision.AgentID, "rejected")

	return decision, nil
}

// GetDecision busca decisão
func (s *AgentService) GetDecision(decisionID uuid.UUID) (*AgentDecision, error) {
	var decision AgentDecision
	if err := s.db.Where("id = ?", decisionID).First(&decision).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDecisionNotFound
		}
		return nil, err
	}
	return &decision, nil
}

// ListPendingDecisions lista decisões pendentes de aprovação
func (s *AgentService) ListPendingDecisions(tenantID uuid.UUID) ([]AgentDecision, error) {
	var decisions []AgentDecision
	if err := s.db.Where("tenant_id = ? AND status = ? AND expires_at > ?", 
		tenantID, string(DecisionProposed), time.Now()).
		Order("created_at DESC").
		Find(&decisions).Error; err != nil {
		return nil, err
	}
	return decisions, nil
}

// ListDecisions lista decisões com filtros
func (s *AgentService) ListDecisions(tenantID uuid.UUID, status string, limit int) ([]AgentDecision, error) {
	query := s.db.Where("tenant_id = ?", tenantID)
	if status != "" {
		query = query.Where("status = ?", status)
	}
	
	var decisions []AgentDecision
	if err := query.Order("created_at DESC").Limit(limit).Find(&decisions).Error; err != nil {
		return nil, err
	}
	return decisions, nil
}

// ========================================
// EXECUTION
// ========================================

// JobTypeAgentExecution tipo do job
const JobTypeAgentExecution = "agent_execution"

// AgentExecutionPayload payload do job
type AgentExecutionPayload struct {
	DecisionID string `json:"decision_id"`
}

// enqueueExecution enfileira job de execução
func (s *AgentService) enqueueExecution(decision *AgentDecision) {
	if s.jobService == nil {
		return
	}

	payload := AgentExecutionPayload{
		DecisionID: decision.ID.String(),
	}

	s.jobService.Enqueue(JobTypeAgentExecution, payload, jobs.WithPriority(5))
}

// ExecuteDecision executa uma decisão aprovada (chamado pelo job worker)
func (s *AgentService) ExecuteDecision(ctx context.Context, decisionID uuid.UUID) error {
	decision, err := s.GetDecision(decisionID)
	if err != nil {
		return err
	}

	// Verificar estado
	if decision.Status != string(DecisionApproved) {
		return ErrInvalidDecisionState
	}

	// Verificar expiração
	if time.Now().After(decision.ExpiresAt) {
		decision.Status = string(DecisionExpired)
		s.db.Save(decision)
		return ErrDecisionExpired
	}

	// Verificar novamente se entidade está disputada
	if s.isEntityDisputed(decision.TargetEntity) {
		s.logExecution(decision, "agent", "failed", "", "target entity became disputed")
		decision.Status = string(DecisionFailed)
		s.db.Save(decision)
		return ErrEntityDisputed
	}

	// Executar ação
	_, resultData, err := s.executeAction(ctx, decision)
	
	// Registrar execução
	if err != nil {
		s.logExecution(decision, "agent", "failed", resultData, err.Error())
		decision.Status = string(DecisionFailed)
	} else {
		s.logExecution(decision, "agent", "success", resultData, "")
		decision.Status = string(DecisionExecuted)
		s.policyEnforcer.IncrementDailyCount(decision.AgentID, "executed")
	}

	decision.UpdatedAt = time.Now()
	s.db.Save(decision)

	return err
}

// executeAction executa a ação real
func (s *AgentService) executeAction(ctx context.Context, decision *AgentDecision) (string, string, error) {
	// Aqui seria a integração com os outros módulos
	// Por enquanto, retorna sucesso simulado
	
	switch decision.ProposedAction {
	case string(ActionPauseCampaign):
		// TODO: Chamar ads.PauseCampaign
		return "success", `{"action":"pause_campaign","simulated":true}`, nil
		
	case string(ActionResumeCampaign):
		// TODO: Chamar ads.ResumeCampaign
		return "success", `{"action":"resume_campaign","simulated":true}`, nil
		
	case string(ActionAdjustBid):
		// TODO: Chamar ads.AdjustBid
		return "success", `{"action":"adjust_bid","simulated":true}`, nil
		
	case string(ActionSuggestRefill):
		// Sugestões não executam nada, só registram
		return "success", `{"action":"suggest_refill","type":"suggestion_only"}`, nil
		
	case string(ActionFlagSuspicious):
		// TODO: Criar flag no sistema
		return "success", `{"action":"flag_suspicious","simulated":true}`, nil
		
	default:
		return "failed", "", fmt.Errorf("unknown action: %s", decision.ProposedAction)
	}
}

// logExecution registra execução
func (s *AgentService) logExecution(decision *AgentDecision, executedBy, result, resultData, errorMsg string) {
	log := &AgentExecutionLog{
		ID:         uuid.New(),
		DecisionID: decision.ID,
		AgentID:    decision.AgentID,
		TenantID:   decision.TenantID,
		ExecutedBy: executedBy,
		Action:     decision.ProposedAction,
		Target:     decision.TargetEntity,
		Result:     result,
		ResultData: resultData,
		ErrorMsg:   errorMsg,
		ExecutedAt: time.Now(),
		CreatedAt:  time.Now(),
	}
	s.db.Create(log)
}

// ========================================
// HELPERS
// ========================================

// getAgentSuccessRate calcula taxa de sucesso do agente
func (s *AgentService) getAgentSuccessRate(agentID uuid.UUID) float64 {
	var total, success int64
	
	s.db.Model(&AgentExecutionLog{}).Where("agent_id = ?", agentID).Count(&total)
	s.db.Model(&AgentExecutionLog{}).Where("agent_id = ? AND result = ?", agentID, "success").Count(&success)
	
	if total == 0 {
		return 1.0 // Novo agente = assume sucesso
	}
	
	return float64(success) / float64(total)
}

// getEntityState busca estado da entidade
func (s *AgentService) getEntityState(targetEntity string) string {
	// Parse target: "campaign:uuid" ou "budget:uuid"
	// Por enquanto, retorna "active" como default
	return "active"
}

// isEntityDisputed verifica se entidade está disputada
func (s *AgentService) isEntityDisputed(targetEntity string) bool {
	state := s.getEntityState(targetEntity)
	return state == "disputed"
}

// ========================================
// OBSERVABILITY
// ========================================

// AgentStats estatísticas de um agente
type AgentStats struct {
	AgentID        uuid.UUID `json:"agent_id"`
	TotalDecisions int64     `json:"total_decisions"`
	Approved       int64     `json:"approved"`
	Rejected       int64     `json:"rejected"`
	Executed       int64     `json:"executed"`
	Failed         int64     `json:"failed"`
	SuccessRate    float64   `json:"success_rate"`
	AvgRiskScore   float64   `json:"avg_risk_score"`
}

// GetAgentStats retorna estatísticas de um agente
func (s *AgentService) GetAgentStats(agentID uuid.UUID) (*AgentStats, error) {
	stats := &AgentStats{AgentID: agentID}

	s.db.Model(&AgentDecision{}).Where("agent_id = ?", agentID).Count(&stats.TotalDecisions)
	s.db.Model(&AgentDecision{}).Where("agent_id = ? AND status = ?", agentID, string(DecisionApproved)).Count(&stats.Approved)
	s.db.Model(&AgentDecision{}).Where("agent_id = ? AND status = ?", agentID, string(DecisionRejected)).Count(&stats.Rejected)
	s.db.Model(&AgentDecision{}).Where("agent_id = ? AND status = ?", agentID, string(DecisionExecuted)).Count(&stats.Executed)
	s.db.Model(&AgentDecision{}).Where("agent_id = ? AND status = ?", agentID, string(DecisionFailed)).Count(&stats.Failed)

	// Calcular taxa de sucesso
	if stats.Executed+stats.Failed > 0 {
		stats.SuccessRate = float64(stats.Executed) / float64(stats.Executed+stats.Failed)
	}

	// Calcular risco médio
	var avgRisk float64
	s.db.Model(&AgentDecision{}).Where("agent_id = ?", agentID).Select("AVG(risk_score)").Scan(&avgRisk)
	stats.AvgRiskScore = avgRisk

	return stats, nil
}

// GetExecutionLogs retorna logs de execução
func (s *AgentService) GetExecutionLogs(tenantID uuid.UUID, limit int) ([]AgentExecutionLog, error) {
	var logs []AgentExecutionLog
	if err := s.db.Where("tenant_id = ?", tenantID).
		Order("executed_at DESC").
		Limit(limit).
		Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}
