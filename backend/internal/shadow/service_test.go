package shadow

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupShadowTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&ShadowExecution{})
	return db
}

func createShadowTestService(t *testing.T, db *gorm.DB) *ShadowService {
	return NewShadowService(db)
}

// ===========================================
// EXECUTE TESTS
// ===========================================

func TestExecute(t *testing.T) {
	db := setupShadowTestDB(t)
	service := createShadowTestService(t, db)
	req := ShadowRequest{
		AgentID:      uuid.New(),
		Domain:       "ads",
		Action:       "create_campaign",
		TargetEntity: "campaign-123",
		Reason:       "test",
	}
	result, err := service.Execute(req)
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "shadow", result.Mode)
	assert.False(t, result.Executed)
}

func TestExecuteWithAmount(t *testing.T) {
	db := setupShadowTestDB(t)
	service := createShadowTestService(t, db)
	req := ShadowRequest{
		AgentID:      uuid.New(),
		Domain:       "billing",
		Action:       "debit",
		TargetEntity: "account-123",
		Amount:       50000,
		Reason:       "test",
	}
	result, err := service.Execute(req)
	assert.NoError(t, err)
	assert.Equal(t, int64(50000), result.WhatWouldHappen.WouldDebit)
}

func TestExecuteHighRisk(t *testing.T) {
	db := setupShadowTestDB(t)
	service := createShadowTestService(t, db)
	req := ShadowRequest{
		AgentID:      uuid.New(),
		Domain:       "billing",
		Action:       "debit",
		TargetEntity: "account-123",
		Amount:       200000,
		RiskScore:    0.8,
		Reason:       "test",
	}
	result, err := service.Execute(req)
	assert.NoError(t, err)
	assert.False(t, result.WhatWouldHappen.WouldSucceed)
	assert.Equal(t, RecommendShouldForbid, result.Recommendation)
}

func TestExecuteWithShadowReason(t *testing.T) {
	db := setupShadowTestDB(t)
	service := createShadowTestService(t, db)
	req := ShadowRequest{
		AgentID:      uuid.New(),
		Domain:       "ads",
		Action:       "pause_campaign",
		TargetEntity: "campaign-123",
		ShadowReason: "Manual observation",
		Reason:       "test",
	}
	result, err := service.Execute(req)
	assert.NoError(t, err)
	assert.Equal(t, "Manual observation", result.WhyDidntHappen)
}


// ===========================================
// QUERY TESTS
// ===========================================

func TestGetByAgent(t *testing.T) {
	db := setupShadowTestDB(t)
	service := createShadowTestService(t, db)
	agentID := uuid.New()
	for i := 0; i < 5; i++ {
		service.Execute(ShadowRequest{AgentID: agentID, Domain: "test", Action: "test", Reason: "test"})
	}
	executions, err := service.GetByAgent(agentID, 10)
	assert.NoError(t, err)
	assert.Len(t, executions, 5)
}

func TestGetByAction(t *testing.T) {
	db := setupShadowTestDB(t)
	service := createShadowTestService(t, db)
	service.Execute(ShadowRequest{AgentID: uuid.New(), Domain: "ads", Action: "create_campaign", Reason: "test"})
	service.Execute(ShadowRequest{AgentID: uuid.New(), Domain: "ads", Action: "pause_campaign", Reason: "test"})
	service.Execute(ShadowRequest{AgentID: uuid.New(), Domain: "ads", Action: "create_campaign", Reason: "test"})
	executions, err := service.GetByAction("create_campaign", 10)
	assert.NoError(t, err)
	assert.Len(t, executions, 2)
}

func TestGetRecent(t *testing.T) {
	db := setupShadowTestDB(t)
	service := createShadowTestService(t, db)
	for i := 0; i < 10; i++ {
		service.Execute(ShadowRequest{AgentID: uuid.New(), Domain: "test", Action: "test", Reason: "test"})
	}
	executions, err := service.GetRecent(5)
	assert.NoError(t, err)
	assert.Len(t, executions, 5)
}

func TestGetStats(t *testing.T) {
	db := setupShadowTestDB(t)
	service := createShadowTestService(t, db)
	agentID := uuid.New()
	for i := 0; i < 5; i++ {
		service.Execute(ShadowRequest{AgentID: agentID, Domain: "test", Action: "test", Reason: "test"})
	}
	stats, err := service.GetStats(agentID, time.Now().Add(-1*time.Hour))
	assert.NoError(t, err)
	assert.Equal(t, 5, stats.TotalAttempts)
	assert.Equal(t, agentID, stats.AgentID)
}

// ===========================================
// SIMULATION TESTS
// ===========================================

func TestSimulateLowAmount(t *testing.T) {
	service := &ShadowService{}
	req := ShadowRequest{Amount: 5000}
	sim := service.simulate(req)
	assert.Equal(t, "low", sim.EstimatedImpact)
	assert.True(t, sim.RiskScore < 0.4)
}

func TestSimulateMediumAmount(t *testing.T) {
	service := &ShadowService{}
	req := ShadowRequest{Amount: 50000}
	sim := service.simulate(req)
	assert.Equal(t, "medium", sim.EstimatedImpact)
}

func TestSimulateHighAmount(t *testing.T) {
	service := &ShadowService{}
	req := ShadowRequest{Amount: 200000}
	sim := service.simulate(req)
	assert.Equal(t, "high", sim.EstimatedImpact)
	assert.True(t, sim.RiskScore >= 0.7)
}

func TestSimulateCreateAction(t *testing.T) {
	service := &ShadowService{}
	req := ShadowRequest{Action: "create_campaign", TargetEntity: "campaign-123"}
	sim := service.simulate(req)
	assert.Contains(t, sim.WouldCreate, "campaign-123")
}

func TestSimulatePauseAction(t *testing.T) {
	service := &ShadowService{}
	req := ShadowRequest{Action: "pause_campaign", TargetEntity: "campaign-123"}
	sim := service.simulate(req)
	assert.Contains(t, sim.WouldModify, "campaign-123")
}

// ===========================================
// RECOMMENDATION TESTS
// ===========================================

func TestGenerateRecommendationSafeToPromote(t *testing.T) {
	service := &ShadowService{}
	sim := ShadowSimulation{WouldSucceed: true, RiskScore: 0.1, EstimatedImpact: "low"}
	rec := service.generateRecommendation(sim)
	assert.Equal(t, RecommendSafeToPromote, rec)
}

func TestGenerateRecommendationNeedsReview(t *testing.T) {
	service := &ShadowService{}
	sim := ShadowSimulation{WouldSucceed: true, RiskScore: 0.5, EstimatedImpact: "medium"}
	rec := service.generateRecommendation(sim)
	assert.Equal(t, RecommendNeedsReview, rec)
}

func TestGenerateRecommendationShouldForbid(t *testing.T) {
	service := &ShadowService{}
	sim := ShadowSimulation{WouldSucceed: false, RiskScore: 0.8}
	rec := service.generateRecommendation(sim)
	assert.Equal(t, RecommendShouldForbid, rec)
}

// ===========================================
// MODEL TESTS
// ===========================================

func TestShadowExecutionTableName(t *testing.T) {
	assert.Equal(t, "shadow_executions", ShadowExecution{}.TableName())
}

func TestReasonConstants(t *testing.T) {
	assert.NotEmpty(t, ReasonAutonomyShadow)
	assert.NotEmpty(t, ReasonNoProfile)
	assert.NotEmpty(t, ReasonManualShadow)
}

func TestRecommendationConstants(t *testing.T) {
	assert.Equal(t, "safe_to_promote", RecommendSafeToPromote)
	assert.Equal(t, "needs_review", RecommendNeedsReview)
	assert.Equal(t, "keep_shadow", RecommendKeepShadow)
	assert.Equal(t, "should_forbid", RecommendShouldForbid)
}
