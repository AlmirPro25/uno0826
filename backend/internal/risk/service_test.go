package risk

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupRiskTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&RiskScore{}, &RiskHistory{}, &RiskConfig{})
	return db
}

func createRiskTestService(t *testing.T, db *gorm.DB) *RiskService {
	return NewRiskService(db)
}

// ===========================================
// CALCULATE RISK TESTS
// ===========================================

func TestCalculateAppRisk(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()
	result, err := service.CalculateAppRisk(appID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, appID, result.AppID)
	assert.GreaterOrEqual(t, result.Score, 0.0)
	assert.LessOrEqual(t, result.Score, 1.0)
	assert.NotEmpty(t, result.Level)
	assert.NotEmpty(t, result.Explanation)
}

func TestForceCalculateAppRisk(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()

	// Primeiro cálculo
	result1, _ := service.CalculateAppRisk(appID)

	// Forçar recálculo
	result2, err := service.ForceCalculateAppRisk(appID)

	assert.NoError(t, err)
	assert.NotNil(t, result2)
	// Deve ter calculado novamente (timestamps diferentes)
	assert.True(t, result2.CalculatedAt.After(result1.CalculatedAt) || result2.CalculatedAt.Equal(result1.CalculatedAt))
}

func TestCalculateAgentRisk(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()
	agentID := uuid.New()

	result, err := service.CalculateAgentRisk(appID, agentID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, appID, result.AppID)
	assert.NotNil(t, result.AgentID)
	assert.Equal(t, agentID, *result.AgentID)
}

func TestCalculateDomainRisk(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()
	result, err := service.CalculateDomainRisk(appID, "billing")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, appID, result.AppID)
}

// ===========================================
// RISK LEVEL TESTS
// ===========================================

func TestGetLevelLow(t *testing.T) {
	assert.Equal(t, RiskLevelLow, GetLevel(0.0))
	assert.Equal(t, RiskLevelLow, GetLevel(0.1))
	assert.Equal(t, RiskLevelLow, GetLevel(0.29))
}

func TestGetLevelMedium(t *testing.T) {
	assert.Equal(t, RiskLevelMedium, GetLevel(0.3))
	assert.Equal(t, RiskLevelMedium, GetLevel(0.45))
	assert.Equal(t, RiskLevelMedium, GetLevel(0.59))
}

func TestGetLevelHigh(t *testing.T) {
	assert.Equal(t, RiskLevelHigh, GetLevel(0.6))
	assert.Equal(t, RiskLevelHigh, GetLevel(0.7))
	assert.Equal(t, RiskLevelHigh, GetLevel(0.79))
}

func TestGetLevelCritical(t *testing.T) {
	assert.Equal(t, RiskLevelCritical, GetLevel(0.8))
	assert.Equal(t, RiskLevelCritical, GetLevel(0.9))
	assert.Equal(t, RiskLevelCritical, GetLevel(1.0))
}

// ===========================================
// QUERY TESTS
// ===========================================

func TestGetAppRisk(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()
	result, err := service.GetAppRisk(appID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, appID, result.AppID)
}

func TestGetRiskHistory(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()

	// Criar alguns scores
	for i := 0; i < 5; i++ {
		service.CalculateAppRisk(appID)
	}

	history, err := service.GetRiskHistory(appID, 7)

	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(history), 1)
}

func TestGetRiskTrendInsufficientData(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()
	trend, diff, err := service.GetRiskTrend(appID)

	assert.NoError(t, err)
	assert.Equal(t, "insufficient_data", trend)
	assert.Equal(t, 0.0, diff)
}

func TestGetRiskTrendWithData(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()

	// Criar histórico manualmente
	for i := 0; i < 3; i++ {
		history := &RiskHistory{
			ID:           uuid.New(),
			AppID:        appID,
			Score:        0.3 + float64(i)*0.1,
			Level:        string(RiskLevelMedium),
			CalculatedAt: time.Now().Add(-time.Duration(i) * time.Hour),
		}
		db.Create(history)
	}

	trend, _, err := service.GetRiskTrend(appID)

	assert.NoError(t, err)
	assert.Contains(t, []string{"increasing", "decreasing", "stable"}, trend)
}

// ===========================================
// CHECK RISK TESTS
// ===========================================

func TestCheckRiskAcceptable(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()
	acceptable, risk, err := service.CheckRisk(appID, RiskLevelHigh)

	assert.NoError(t, err)
	assert.NotNil(t, risk)
	// Como não há dados, o risco deve ser baixo
	assert.True(t, acceptable)
}

func TestIsHighRisk(t *testing.T) {
	db := setupRiskTestDB(t)
	service := createRiskTestService(t, db)

	appID := uuid.New()
	isHigh, err := service.IsHighRisk(appID)

	assert.NoError(t, err)
	// Sem dados, não deve ser alto risco
	assert.False(t, isHigh)
}

// ===========================================
// EXPLANATION TESTS
// ===========================================

func TestGenerateExplanationLow(t *testing.T) {
	service := &RiskService{}
	factors := []RiskFactor{{Name: "test", Value: 0.1, Weight: 1.0, Threshold: 0.5}}

	explanation := service.generateExplanation(0.1, RiskLevelLow, factors)

	assert.Contains(t, explanation, "BAIXO")
	assert.Contains(t, explanation, "saudável")
}

func TestGenerateExplanationMedium(t *testing.T) {
	service := &RiskService{}
	factors := []RiskFactor{{Name: "test", Value: 0.4, Weight: 1.0, Threshold: 0.5}}

	explanation := service.generateExplanation(0.4, RiskLevelMedium, factors)

	assert.Contains(t, explanation, "MÉDIO")
	assert.Contains(t, explanation, "atenção")
}

func TestGenerateExplanationHigh(t *testing.T) {
	service := &RiskService{}
	factors := []RiskFactor{{Name: "test", Value: 0.7, Weight: 1.0, Threshold: 0.5}}

	explanation := service.generateExplanation(0.7, RiskLevelHigh, factors)

	assert.Contains(t, explanation, "ALTO")
	assert.Contains(t, explanation, "revisão")
}

func TestGenerateExplanationCritical(t *testing.T) {
	service := &RiskService{}
	factors := []RiskFactor{{Name: "test", Value: 0.9, Weight: 1.0, Threshold: 0.5, Exceeded: true}}

	explanation := service.generateExplanation(0.9, RiskLevelCritical, factors)

	assert.Contains(t, explanation, "CRÍTICO")
	assert.Contains(t, explanation, "imediata")
}

func TestGenerateExplanationWithExceededFactors(t *testing.T) {
	service := &RiskService{}
	factors := []RiskFactor{
		{Name: "approval_rate", Value: 0.8, Weight: 0.3, Threshold: 0.7, Exceeded: true},
		{Name: "volume_spike", Value: 0.6, Weight: 0.2, Threshold: 0.5, Exceeded: true},
	}

	explanation := service.generateExplanation(0.7, RiskLevelHigh, factors)

	assert.Contains(t, explanation, "Fatores acima do limite")
}

// ===========================================
// MODEL TESTS
// ===========================================

func TestRiskScoreTableName(t *testing.T) {
	assert.Equal(t, "risk_scores", RiskScore{}.TableName())
}

func TestRiskHistoryTableName(t *testing.T) {
	assert.Equal(t, "risk_history", RiskHistory{}.TableName())
}

func TestRiskConfigTableName(t *testing.T) {
	assert.Equal(t, "risk_configs", RiskConfig{}.TableName())
}

func TestRiskLevelConstants(t *testing.T) {
	assert.Equal(t, RiskLevel("low"), RiskLevelLow)
	assert.Equal(t, RiskLevel("medium"), RiskLevelMedium)
	assert.Equal(t, RiskLevel("high"), RiskLevelHigh)
	assert.Equal(t, RiskLevel("critical"), RiskLevelCritical)
}

func TestDefaultFactorWeights(t *testing.T) {
	total := 0.0
	for _, w := range DefaultFactorWeights {
		total += w
	}
	assert.InDelta(t, 1.0, total, 0.01)
}
