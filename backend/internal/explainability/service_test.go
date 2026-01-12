package explainability

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupExplainabilityTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&DecisionTimeline{})
	require.NoError(t, err)

	return db
}

// ========================================
// RECORD TIMELINE TESTS
// ========================================

func TestRecordTimeline(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	entry := &DecisionTimeline{
		DecisionID:   uuid.New(),
		DecisionType: "policy_eval",
		ActorID:      uuid.New(),
		ActorType:    "user",
		Resource:     "agent",
		Action:       "execute",
		PolicyResult: "allowed",
		FinalOutcome: "allowed",
	}

	err := service.RecordTimeline(entry)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, entry.ID)
	assert.False(t, entry.CreatedAt.IsZero())
	assert.False(t, entry.Timestamp.IsZero())
}


func TestRecordTimeline_WithDivergence(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	entry := &DecisionTimeline{
		DecisionID:      uuid.New(),
		DecisionType:    "policy_eval",
		ActorID:         uuid.New(),
		ActorType:       "agent",
		Resource:        "billing",
		Action:          "debit",
		PolicyResult:    "allowed",
		ThresholdAction: "block", // Divergência: policy permitiu, threshold bloquearia
		FinalOutcome:    "allowed",
	}

	err := service.RecordTimeline(entry)
	require.NoError(t, err)
	assert.True(t, entry.HasDivergence)
	assert.Contains(t, entry.DivergenceNote, "Policy decidiu")
	assert.Contains(t, entry.DivergenceNote, "threshold recomendou")
}

func TestRecordTimeline_NoDivergence(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	entry := &DecisionTimeline{
		DecisionID:      uuid.New(),
		DecisionType:    "policy_eval",
		ActorID:         uuid.New(),
		ActorType:       "user",
		Resource:        "agent",
		Action:          "execute",
		PolicyResult:    "denied",
		ThresholdAction: "block", // Sem divergência: ambos bloqueiam
		FinalOutcome:    "denied",
	}

	err := service.RecordTimeline(entry)
	require.NoError(t, err)
	assert.False(t, entry.HasDivergence)
}

// ========================================
// QUERY TESTS
// ========================================

func TestGetByDecisionID(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)
	decisionID := uuid.New()

	entry := &DecisionTimeline{
		DecisionID:   decisionID,
		DecisionType: "policy_eval",
		ActorID:      uuid.New(),
		ActorType:    "user",
		Resource:     "agent",
		Action:       "execute",
		PolicyResult: "allowed",
		FinalOutcome: "allowed",
	}
	err := service.RecordTimeline(entry)
	require.NoError(t, err)

	found, err := service.GetByDecisionID(decisionID)
	require.NoError(t, err)
	assert.Equal(t, decisionID, found.DecisionID)
}

func TestGetByDecisionID_NotFound(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	_, err := service.GetByDecisionID(uuid.New())
	assert.Error(t, err)
}

func TestGetByID(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	entry := &DecisionTimeline{
		DecisionID:   uuid.New(),
		DecisionType: "policy_eval",
		ActorID:      uuid.New(),
		ActorType:    "user",
		Resource:     "agent",
		Action:       "execute",
		PolicyResult: "allowed",
		FinalOutcome: "allowed",
	}
	err := service.RecordTimeline(entry)
	require.NoError(t, err)

	found, err := service.GetByID(entry.ID)
	require.NoError(t, err)
	assert.Equal(t, entry.ID, found.ID)
}

func TestListByApp(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)
	appID := uuid.New()

	// Criar múltiplas entradas
	for i := 0; i < 3; i++ {
		entry := &DecisionTimeline{
			DecisionID:   uuid.New(),
			DecisionType: "policy_eval",
			AppID:        &appID,
			ActorID:      uuid.New(),
			ActorType:    "user",
			Resource:     "agent",
			Action:       "execute",
			PolicyResult: "allowed",
			FinalOutcome: "allowed",
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	timelines, err := service.ListByApp(appID, 10)
	require.NoError(t, err)
	assert.Len(t, timelines, 3)
}

func TestListByActor(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)
	actorID := uuid.New()

	// Criar múltiplas entradas
	for i := 0; i < 3; i++ {
		entry := &DecisionTimeline{
			DecisionID:   uuid.New(),
			DecisionType: "policy_eval",
			ActorID:      actorID,
			ActorType:    "user",
			Resource:     "agent",
			Action:       "execute",
			PolicyResult: "allowed",
			FinalOutcome: "allowed",
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	timelines, err := service.ListByActor(actorID, 10)
	require.NoError(t, err)
	assert.Len(t, timelines, 3)
}

func TestListDivergent(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	// Criar entradas com e sem divergência
	for i := 0; i < 2; i++ {
		entry := &DecisionTimeline{
			DecisionID:      uuid.New(),
			DecisionType:    "policy_eval",
			ActorID:         uuid.New(),
			ActorType:       "user",
			Resource:        "agent",
			Action:          "execute",
			PolicyResult:    "allowed",
			ThresholdAction: "block", // Divergência
			FinalOutcome:    "allowed",
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	// Entrada sem divergência
	entry := &DecisionTimeline{
		DecisionID:   uuid.New(),
		DecisionType: "policy_eval",
		ActorID:      uuid.New(),
		ActorType:    "user",
		Resource:     "agent",
		Action:       "execute",
		PolicyResult: "allowed",
		FinalOutcome: "allowed",
	}
	err := service.RecordTimeline(entry)
	require.NoError(t, err)

	divergent, err := service.ListDivergent(10)
	require.NoError(t, err)
	assert.Len(t, divergent, 2)
}


// ========================================
// SEARCH TESTS
// ========================================

func TestSearch_ByDecisionType(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	// Criar entradas com diferentes tipos
	types := []string{"policy_eval", "agent_decision", "approval"}
	for _, dt := range types {
		entry := &DecisionTimeline{
			DecisionID:   uuid.New(),
			DecisionType: dt,
			ActorID:      uuid.New(),
			ActorType:    "user",
			Resource:     "agent",
			Action:       "execute",
			PolicyResult: "allowed",
			FinalOutcome: "allowed",
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	query := TimelineQuery{
		DecisionType: "policy_eval",
	}
	result, err := service.Search(query)
	require.NoError(t, err)
	assert.Equal(t, int64(1), result.Total)
	assert.Len(t, result.Timelines, 1)
	assert.Equal(t, "policy_eval", result.Timelines[0].DecisionType)
}

func TestSearch_ByOutcome(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	// Criar entradas com diferentes outcomes
	outcomes := []string{"allowed", "denied", "pending"}
	for _, outcome := range outcomes {
		entry := &DecisionTimeline{
			DecisionID:   uuid.New(),
			DecisionType: "policy_eval",
			ActorID:      uuid.New(),
			ActorType:    "user",
			Resource:     "agent",
			Action:       "execute",
			PolicyResult: outcome,
			FinalOutcome: outcome,
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	query := TimelineQuery{
		Outcome: "denied",
	}
	result, err := service.Search(query)
	require.NoError(t, err)
	assert.Equal(t, int64(1), result.Total)
}

func TestSearch_OnlyDivergent(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	// Com divergência
	entry1 := &DecisionTimeline{
		DecisionID:      uuid.New(),
		DecisionType:    "policy_eval",
		ActorID:         uuid.New(),
		ActorType:       "user",
		Resource:        "agent",
		Action:          "execute",
		PolicyResult:    "allowed",
		ThresholdAction: "block",
		FinalOutcome:    "allowed",
	}
	err := service.RecordTimeline(entry1)
	require.NoError(t, err)

	// Sem divergência
	entry2 := &DecisionTimeline{
		DecisionID:   uuid.New(),
		DecisionType: "policy_eval",
		ActorID:      uuid.New(),
		ActorType:    "user",
		Resource:     "agent",
		Action:       "execute",
		PolicyResult: "allowed",
		FinalOutcome: "allowed",
	}
	err = service.RecordTimeline(entry2)
	require.NoError(t, err)

	query := TimelineQuery{
		OnlyDivergent: true,
	}
	result, err := service.Search(query)
	require.NoError(t, err)
	assert.Equal(t, int64(1), result.Total)
}

func TestSearch_DateRange(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	now := time.Now()
	yesterday := now.Add(-24 * time.Hour)
	tomorrow := now.Add(24 * time.Hour)

	entry := &DecisionTimeline{
		DecisionID:   uuid.New(),
		DecisionType: "policy_eval",
		ActorID:      uuid.New(),
		ActorType:    "user",
		Resource:     "agent",
		Action:       "execute",
		PolicyResult: "allowed",
		FinalOutcome: "allowed",
		Timestamp:    now,
	}
	err := service.RecordTimeline(entry)
	require.NoError(t, err)

	// Buscar com range que inclui
	query := TimelineQuery{
		StartDate: &yesterday,
		EndDate:   &tomorrow,
	}
	result, err := service.Search(query)
	require.NoError(t, err)
	assert.Equal(t, int64(1), result.Total)

	// Buscar com range que não inclui
	pastStart := now.Add(-48 * time.Hour)
	pastEnd := now.Add(-24 * time.Hour)
	query2 := TimelineQuery{
		StartDate: &pastStart,
		EndDate:   &pastEnd,
	}
	result2, err := service.Search(query2)
	require.NoError(t, err)
	assert.Equal(t, int64(0), result2.Total)
}

func TestSearch_Pagination(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	// Criar 10 entradas
	for i := 0; i < 10; i++ {
		entry := &DecisionTimeline{
			DecisionID:   uuid.New(),
			DecisionType: "policy_eval",
			ActorID:      uuid.New(),
			ActorType:    "user",
			Resource:     "agent",
			Action:       "execute",
			PolicyResult: "allowed",
			FinalOutcome: "allowed",
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	// Primeira página
	query := TimelineQuery{
		Limit:  5,
		Offset: 0,
	}
	result, err := service.Search(query)
	require.NoError(t, err)
	assert.Equal(t, int64(10), result.Total)
	assert.Len(t, result.Timelines, 5)

	// Segunda página
	query2 := TimelineQuery{
		Limit:  5,
		Offset: 5,
	}
	result2, err := service.Search(query2)
	require.NoError(t, err)
	assert.Len(t, result2.Timelines, 5)
}

func TestSearch_LimitCap(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	// Tentar buscar com limite muito alto
	query := TimelineQuery{
		Limit: 500, // Acima do cap de 100
	}
	result, err := service.Search(query)
	require.NoError(t, err)
	assert.Equal(t, 100, result.Query.Limit) // Deve ser limitado a 100
}


// ========================================
// STATISTICS TESTS
// ========================================

func TestCountByOutcome(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)
	appID := uuid.New()

	// Criar entradas com diferentes outcomes
	outcomes := []string{"allowed", "allowed", "denied", "pending"}
	for _, outcome := range outcomes {
		entry := &DecisionTimeline{
			DecisionID:   uuid.New(),
			DecisionType: "policy_eval",
			AppID:        &appID,
			ActorID:      uuid.New(),
			ActorType:    "user",
			Resource:     "agent",
			Action:       "execute",
			PolicyResult: outcome,
			FinalOutcome: outcome,
			Timestamp:    time.Now(),
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	since := time.Now().Add(-1 * time.Hour)
	counts, err := service.CountByOutcome(&appID, since)
	require.NoError(t, err)
	assert.Equal(t, int64(2), counts["allowed"])
	assert.Equal(t, int64(1), counts["denied"])
	assert.Equal(t, int64(1), counts["pending"])
}

func TestCountByOutcome_AllApps(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	// Criar entradas para diferentes apps
	for i := 0; i < 3; i++ {
		appID := uuid.New()
		entry := &DecisionTimeline{
			DecisionID:   uuid.New(),
			DecisionType: "policy_eval",
			AppID:        &appID,
			ActorID:      uuid.New(),
			ActorType:    "user",
			Resource:     "agent",
			Action:       "execute",
			PolicyResult: "allowed",
			FinalOutcome: "allowed",
			Timestamp:    time.Now(),
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	since := time.Now().Add(-1 * time.Hour)
	counts, err := service.CountByOutcome(nil, since) // nil = todos os apps
	require.NoError(t, err)
	assert.Equal(t, int64(3), counts["allowed"])
}

func TestCountDivergences(t *testing.T) {
	db := setupExplainabilityTestDB(t)
	service := NewTimelineService(db)

	// Criar entradas com divergência
	for i := 0; i < 3; i++ {
		entry := &DecisionTimeline{
			DecisionID:      uuid.New(),
			DecisionType:    "policy_eval",
			ActorID:         uuid.New(),
			ActorType:       "user",
			Resource:        "agent",
			Action:          "execute",
			PolicyResult:    "allowed",
			ThresholdAction: "block",
			FinalOutcome:    "allowed",
			Timestamp:       time.Now(),
		}
		err := service.RecordTimeline(entry)
		require.NoError(t, err)
	}

	// Criar entrada sem divergência
	entry := &DecisionTimeline{
		DecisionID:   uuid.New(),
		DecisionType: "policy_eval",
		ActorID:      uuid.New(),
		ActorType:    "user",
		Resource:     "agent",
		Action:       "execute",
		PolicyResult: "allowed",
		FinalOutcome: "allowed",
		Timestamp:    time.Now(),
	}
	err := service.RecordTimeline(entry)
	require.NoError(t, err)

	since := time.Now().Add(-1 * time.Hour)
	count, err := service.CountDivergences(since)
	require.NoError(t, err)
	assert.Equal(t, int64(3), count)
}

// ========================================
// MODEL TESTS
// ========================================

func TestRiskFactorList_ValueScan(t *testing.T) {
	factors := RiskFactorList{
		{Name: "amount", Value: 100.0, Weight: 0.5, Exceeded: false},
		{Name: "frequency", Value: 10.0, Weight: 0.3, Exceeded: true},
	}

	// Test Value
	val, err := factors.Value()
	require.NoError(t, err)
	assert.NotEmpty(t, val)

	// Test Scan
	var scanned RiskFactorList
	err = scanned.Scan(val)
	require.NoError(t, err)
	assert.Len(t, scanned, 2)
	assert.Equal(t, "amount", scanned[0].Name)
}

func TestRiskFactorList_ScanNil(t *testing.T) {
	var factors RiskFactorList
	err := factors.Scan(nil)
	require.NoError(t, err)
	assert.Empty(t, factors)
}

func TestJSONMap_ValueScan(t *testing.T) {
	m := JSONMap{
		"key1": "value1",
		"key2": 123,
	}

	// Test Value
	val, err := m.Value()
	require.NoError(t, err)
	assert.NotEmpty(t, val)

	// Test Scan
	var scanned JSONMap
	err = scanned.Scan(val)
	require.NoError(t, err)
	assert.Equal(t, "value1", scanned["key1"])
}

func TestJSONMap_ScanNil(t *testing.T) {
	var m JSONMap
	err := m.Scan(nil)
	require.NoError(t, err)
	assert.NotNil(t, m)
}
