package agent

import (
	"context"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupAgentTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(
		&Agent{},
		&AgentPolicy{},
		&AgentDecision{},
		&AgentExecutionLog{},
		&AgentDailyStats{},
	)
	require.NoError(t, err)

	return db
}

// ========================================
// AGENT CRUD TESTS
// ========================================

func TestCreateAgent(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Agent for testing", AgentTypeOperator)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, agent.ID)
	assert.Equal(t, tenantID, agent.TenantID)
	assert.Equal(t, "Test Agent", agent.Name)
	assert.Equal(t, "Agent for testing", agent.Description)
	assert.Equal(t, string(AgentTypeOperator), agent.Type)
	assert.Equal(t, string(AgentStatusActive), agent.Status)
}

func TestGetAgent(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	// Criar agente
	created, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Description", AgentTypeObserver)
	require.NoError(t, err)

	// Buscar agente
	found, err := service.GetAgent(created.ID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, found.ID)
	assert.Equal(t, created.Name, found.Name)
}

func TestGetAgent_NotFound(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)

	_, err := service.GetAgent(uuid.New())
	assert.ErrorIs(t, err, ErrAgentNotFound)
}

func TestListAgents(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	// Criar múltiplos agentes
	_, err := service.CreateAgent(ctx, tenantID, "Agent 1", "Desc 1", AgentTypeObserver)
	require.NoError(t, err)
	_, err = service.CreateAgent(ctx, tenantID, "Agent 2", "Desc 2", AgentTypeOperator)
	require.NoError(t, err)

	// Listar
	agents, err := service.ListAgents(tenantID)
	require.NoError(t, err)
	assert.Len(t, agents, 2)
}

func TestSuspendAgent(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)
	assert.Equal(t, string(AgentStatusActive), agent.Status)

	// Suspender
	suspended, err := service.SuspendAgent(ctx, agent.ID)
	require.NoError(t, err)
	assert.Equal(t, string(AgentStatusSuspended), suspended.Status)
}

func TestActivateAgent(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Suspender primeiro
	_, err = service.SuspendAgent(ctx, agent.ID)
	require.NoError(t, err)

	// Ativar
	activated, err := service.ActivateAgent(ctx, agent.ID)
	require.NoError(t, err)
	assert.Equal(t, string(AgentStatusActive), activated.Status)
}

// ========================================
// POLICY TESTS
// ========================================

func TestCreatePolicy(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	policy, err := service.CreatePolicy(ctx, agent.ID, DomainAds, []string{"pause_campaign", "resume_campaign"}, 10000, true)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, policy.ID)
	assert.Equal(t, agent.ID, policy.AgentID)
	assert.Equal(t, string(DomainAds), policy.Domain)
	assert.Equal(t, int64(10000), policy.MaxAmount)
	assert.True(t, policy.RequiresApproval)
}

func TestCreatePolicy_AgentNotFound(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()

	_, err := service.CreatePolicy(ctx, uuid.New(), DomainAds, []string{"pause_campaign"}, 10000, true)
	assert.ErrorIs(t, err, ErrAgentNotFound)
}

func TestCreatePolicy_DuplicateDomain(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar primeira policy
	_, err = service.CreatePolicy(ctx, agent.ID, DomainAds, []string{"pause_campaign"}, 10000, true)
	require.NoError(t, err)

	// Tentar criar duplicada
	_, err = service.CreatePolicy(ctx, agent.ID, DomainAds, []string{"resume_campaign"}, 5000, false)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

func TestGetPolicies(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar policies
	_, err = service.CreatePolicy(ctx, agent.ID, DomainAds, []string{"pause_campaign"}, 10000, true)
	require.NoError(t, err)
	_, err = service.CreatePolicy(ctx, agent.ID, DomainBilling, []string{"flag_suspicious"}, 5000, true)
	require.NoError(t, err)

	// Listar
	policies, err := service.GetPolicies(agent.ID)
	require.NoError(t, err)
	assert.Len(t, policies, 2)
}

func TestUpdatePolicy(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	policy, err := service.CreatePolicy(ctx, agent.ID, DomainAds, []string{"pause_campaign"}, 10000, true)
	require.NoError(t, err)

	// Atualizar
	updated, err := service.UpdatePolicy(ctx, policy.ID, []string{"pause_campaign", "resume_campaign"}, 20000, false, 0.3, 200)
	require.NoError(t, err)
	assert.Equal(t, int64(20000), updated.MaxAmount)
	assert.False(t, updated.RequiresApproval)
	assert.Equal(t, 0.3, updated.MaxRiskScore)
	assert.Equal(t, 200, updated.DailyLimit)
}

// ========================================
// DECISION TESTS
// ========================================

func TestGetDecision(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar decisão diretamente
	decision := &AgentDecision{
		ID:             uuid.New(),
		AgentID:        agent.ID,
		TenantID:       tenantID,
		Domain:         string(DomainAds),
		ProposedAction: string(ActionPauseCampaign),
		TargetEntity:   "campaign:123",
		Payload:        `{"reason":"test"}`,
		Reason:         "Test decision",
		RiskScore:      0.1,
		Status:         string(DecisionProposed),
		ExpiresAt:      time.Now().Add(24 * time.Hour),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	err = db.Create(decision).Error
	require.NoError(t, err)

	// Buscar
	found, err := service.GetDecision(decision.ID)
	require.NoError(t, err)
	assert.Equal(t, decision.ID, found.ID)
	assert.Equal(t, decision.ProposedAction, found.ProposedAction)
}

func TestGetDecision_NotFound(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)

	_, err := service.GetDecision(uuid.New())
	assert.ErrorIs(t, err, ErrDecisionNotFound)
}

func TestApproveDecision(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()
	reviewerID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar decisão pendente
	decision := &AgentDecision{
		ID:             uuid.New(),
		AgentID:        agent.ID,
		TenantID:       tenantID,
		Domain:         string(DomainAds),
		ProposedAction: string(ActionPauseCampaign),
		TargetEntity:   "campaign:123",
		Payload:        `{}`,
		RiskScore:      0.1,
		Status:         string(DecisionProposed),
		ExpiresAt:      time.Now().Add(24 * time.Hour),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	err = db.Create(decision).Error
	require.NoError(t, err)

	// Aprovar
	approved, err := service.ApproveDecision(ctx, decision.ID, reviewerID, "Approved for testing")
	require.NoError(t, err)
	assert.Equal(t, string(DecisionApproved), approved.Status)
	assert.Equal(t, &reviewerID, approved.ReviewedBy)
	assert.Equal(t, "Approved for testing", approved.ReviewNote)
}

func TestApproveDecision_InvalidState(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar decisão já aprovada
	decision := &AgentDecision{
		ID:             uuid.New(),
		AgentID:        agent.ID,
		TenantID:       tenantID,
		Domain:         string(DomainAds),
		ProposedAction: string(ActionPauseCampaign),
		TargetEntity:   "campaign:123",
		Payload:        `{}`,
		RiskScore:      0.1,
		Status:         string(DecisionApproved), // Já aprovada
		ExpiresAt:      time.Now().Add(24 * time.Hour),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	err = db.Create(decision).Error
	require.NoError(t, err)

	// Tentar aprovar novamente
	_, err = service.ApproveDecision(ctx, decision.ID, uuid.New(), "Test")
	assert.ErrorIs(t, err, ErrInvalidDecisionState)
}

func TestApproveDecision_Expired(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar decisão expirada
	decision := &AgentDecision{
		ID:             uuid.New(),
		AgentID:        agent.ID,
		TenantID:       tenantID,
		Domain:         string(DomainAds),
		ProposedAction: string(ActionPauseCampaign),
		TargetEntity:   "campaign:123",
		Payload:        `{}`,
		RiskScore:      0.1,
		Status:         string(DecisionProposed),
		ExpiresAt:      time.Now().Add(-1 * time.Hour), // Expirada
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	err = db.Create(decision).Error
	require.NoError(t, err)

	// Tentar aprovar
	_, err = service.ApproveDecision(ctx, decision.ID, uuid.New(), "Test")
	assert.ErrorIs(t, err, ErrDecisionExpired)
}

func TestRejectDecision(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()
	reviewerID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar decisão pendente
	decision := &AgentDecision{
		ID:             uuid.New(),
		AgentID:        agent.ID,
		TenantID:       tenantID,
		Domain:         string(DomainAds),
		ProposedAction: string(ActionPauseCampaign),
		TargetEntity:   "campaign:123",
		Payload:        `{}`,
		RiskScore:      0.1,
		Status:         string(DecisionProposed),
		ExpiresAt:      time.Now().Add(24 * time.Hour),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	err = db.Create(decision).Error
	require.NoError(t, err)

	// Rejeitar
	rejected, err := service.RejectDecision(ctx, decision.ID, reviewerID, "Rejected for testing")
	require.NoError(t, err)
	assert.Equal(t, string(DecisionRejected), rejected.Status)
	assert.Equal(t, &reviewerID, rejected.ReviewedBy)
}

func TestListPendingDecisions(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar decisões
	for i := 0; i < 3; i++ {
		decision := &AgentDecision{
			ID:             uuid.New(),
			AgentID:        agent.ID,
			TenantID:       tenantID,
			Domain:         string(DomainAds),
			ProposedAction: string(ActionPauseCampaign),
			TargetEntity:   "campaign:123",
			Payload:        `{}`,
			RiskScore:      0.1,
			Status:         string(DecisionProposed),
			ExpiresAt:      time.Now().Add(24 * time.Hour),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		err = db.Create(decision).Error
		require.NoError(t, err)
	}

	// Listar pendentes
	pending, err := service.ListPendingDecisions(tenantID)
	require.NoError(t, err)
	assert.Len(t, pending, 3)
}

func TestListDecisions(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar decisões com diferentes status
	statuses := []DecisionStatus{DecisionProposed, DecisionApproved, DecisionRejected}
	for _, status := range statuses {
		decision := &AgentDecision{
			ID:             uuid.New(),
			AgentID:        agent.ID,
			TenantID:       tenantID,
			Domain:         string(DomainAds),
			ProposedAction: string(ActionPauseCampaign),
			TargetEntity:   "campaign:123",
			Payload:        `{}`,
			RiskScore:      0.1,
			Status:         string(status),
			ExpiresAt:      time.Now().Add(24 * time.Hour),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		err = db.Create(decision).Error
		require.NoError(t, err)
	}

	// Listar todas
	all, err := service.ListDecisions(tenantID, "", 10)
	require.NoError(t, err)
	assert.Len(t, all, 3)

	// Listar apenas aprovadas
	approved, err := service.ListDecisions(tenantID, string(DecisionApproved), 10)
	require.NoError(t, err)
	assert.Len(t, approved, 1)
}

// ========================================
// STATS TESTS
// ========================================

func TestGetAgentStats(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar decisões com diferentes status
	statuses := []DecisionStatus{DecisionApproved, DecisionApproved, DecisionRejected, DecisionExecuted, DecisionFailed}
	for _, status := range statuses {
		decision := &AgentDecision{
			ID:             uuid.New(),
			AgentID:        agent.ID,
			TenantID:       tenantID,
			Domain:         string(DomainAds),
			ProposedAction: string(ActionPauseCampaign),
			TargetEntity:   "campaign:123",
			Payload:        `{}`,
			RiskScore:      0.2,
			Status:         string(status),
			ExpiresAt:      time.Now().Add(24 * time.Hour),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		err = db.Create(decision).Error
		require.NoError(t, err)
	}

	// Buscar stats
	stats, err := service.GetAgentStats(agent.ID)
	require.NoError(t, err)
	assert.Equal(t, agent.ID, stats.AgentID)
	assert.Equal(t, int64(5), stats.TotalDecisions)
	assert.Equal(t, int64(2), stats.Approved)
	assert.Equal(t, int64(1), stats.Rejected)
	assert.Equal(t, int64(1), stats.Executed)
	assert.Equal(t, int64(1), stats.Failed)
}

func TestGetExecutionLogs(t *testing.T) {
	db := setupAgentTestDB(t)
	service := NewAgentService(db, nil)
	ctx := context.Background()
	tenantID := uuid.New()

	agent, err := service.CreateAgent(ctx, tenantID, "Test Agent", "Desc", AgentTypeOperator)
	require.NoError(t, err)

	// Criar logs de execução
	for i := 0; i < 3; i++ {
		log := &AgentExecutionLog{
			ID:         uuid.New(),
			DecisionID: uuid.New(),
			AgentID:    agent.ID,
			TenantID:   tenantID,
			ExecutedBy: "agent",
			Action:     string(ActionPauseCampaign),
			Target:     "campaign:123",
			Result:     "success",
			ExecutedAt: time.Now(),
			CreatedAt:  time.Now(),
		}
		err = db.Create(log).Error
		require.NoError(t, err)
	}

	// Buscar logs
	logs, err := service.GetExecutionLogs(tenantID, 10)
	require.NoError(t, err)
	assert.Len(t, logs, 3)
}

// ========================================
// MODEL TESTS
// ========================================

func TestIsForbiddenAction(t *testing.T) {
	tests := []struct {
		action   string
		expected bool
	}{
		{string(ActionDebitLedger), true},
		{string(ActionCreditLedger), true},
		{string(ActionResolveDisputed), true},
		{string(ActionDeleteIdentity), true},
		{string(ActionPauseCampaign), false},
		{string(ActionResumeCampaign), false},
		{string(ActionAdjustBid), false},
	}

	for _, tt := range tests {
		t.Run(tt.action, func(t *testing.T) {
			result := IsForbiddenAction(tt.action)
			assert.Equal(t, tt.expected, result)
		})
	}
}
