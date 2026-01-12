package observer

import (
	"os"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupObserverTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&AgentMemoryEntry{}, &HumanDecision{})
	require.NoError(t, err)

	return db
}

// ========================================
// CONTROLLED SNAPSHOT TESTS
// ========================================

func TestControlledSnapshot_ComputeHash(t *testing.T) {
	snapshot := &ControlledSnapshot{
		SnapshotVersion: SnapshotVersionV1,
		WindowStart:     time.Now().Add(-1 * time.Hour),
		WindowEnd:       time.Now(),
		GeneratedAt:     time.Now(),
		Metrics: SnapshotMetrics{
			AuditEventsTotal: 100,
			RequestsTotal:    1000,
		},
		SystemStatus: SnapshotStatus{
			HealthStatus: "ok",
			ReadyStatus:  "ok",
		},
	}

	hash := snapshot.ComputeHash()
	assert.NotEmpty(t, hash)
	assert.Len(t, hash, 64) // SHA256 hex = 64 chars
}

func TestControlledSnapshot_Seal(t *testing.T) {
	snapshot := &ControlledSnapshot{
		SnapshotVersion: SnapshotVersionV1,
		WindowStart:     time.Now().Add(-1 * time.Hour),
		WindowEnd:       time.Now(),
		GeneratedAt:     time.Now(),
	}

	assert.Empty(t, snapshot.SnapshotHash)
	snapshot.Seal()
	assert.NotEmpty(t, snapshot.SnapshotHash)
}

func TestControlledSnapshot_HashConsistency(t *testing.T) {
	snapshot := &ControlledSnapshot{
		SnapshotVersion: SnapshotVersionV1,
		WindowStart:     time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
		WindowEnd:       time.Date(2026, 1, 1, 1, 0, 0, 0, time.UTC),
		GeneratedAt:     time.Date(2026, 1, 1, 1, 0, 0, 0, time.UTC),
		Metrics: SnapshotMetrics{
			AuditEventsTotal: 100,
		},
	}

	hash1 := snapshot.ComputeHash()
	hash2 := snapshot.ComputeHash()
	assert.Equal(t, hash1, hash2)
}

// ========================================
// SUGGESTION TESTS
// ========================================

func TestSuggestion_Struct(t *testing.T) {
	suggestion := Suggestion{
		Agent:        AgentNameObserverV1,
		Confidence:   0.85,
		Finding:      "Taxa de erros acima do normal",
		Suggestion:   "Verificar logs de erro",
		SnapshotHash: "abc123",
		GeneratedAt:  time.Now(),
	}

	assert.Equal(t, AgentNameObserverV1, suggestion.Agent)
	assert.Equal(t, 0.85, suggestion.Confidence)
	assert.NotEmpty(t, suggestion.Finding)
}

func TestSuggestion_ConfidenceRange(t *testing.T) {
	testCases := []struct {
		confidence float64
		valid      bool
	}{
		{0.0, true},
		{0.5, true},
		{1.0, true},
		{-0.1, false},
		{1.1, false},
	}

	for _, tc := range testCases {
		suggestion := Suggestion{Confidence: tc.confidence}
		if tc.valid {
			assert.GreaterOrEqual(t, suggestion.Confidence, 0.0)
			assert.LessOrEqual(t, suggestion.Confidence, 1.0)
		}
	}
}

// ========================================
// AGENT MEMORY ENTRY TESTS
// ========================================

func TestAgentMemoryEntry_TableName(t *testing.T) {
	entry := AgentMemoryEntry{}
	assert.Equal(t, "agent_memory", entry.TableName())
}

func TestAgentMemoryEntry_Creation(t *testing.T) {
	db := setupObserverTestDB(t)

	entry := &AgentMemoryEntry{
		ID:           uuid.New(),
		Agent:        AgentNameObserverV1,
		Confidence:   0.75,
		Finding:      "Memória alta",
		Suggestion:   "Considerar restart",
		SnapshotHash: "hash123",
		CreatedAt:    time.Now(),
	}

	err := db.Create(entry).Error
	assert.NoError(t, err)

	var found AgentMemoryEntry
	err = db.First(&found, "id = ?", entry.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, 0.75, found.Confidence)
}

// ========================================
// HUMAN DECISION TESTS
// ========================================

func TestHumanDecision_TableName(t *testing.T) {
	decision := HumanDecision{}
	assert.Equal(t, "human_decisions", decision.TableName())
}

func TestHumanDecision_Creation(t *testing.T) {
	db := setupObserverTestDB(t)

	decision := &HumanDecision{
		ID:           uuid.New(),
		SuggestionID: uuid.New(),
		Decision:     DecisionAccepted,
		Reason:       "Vou verificar manualmente",
		Human:        "admin@test.com",
		IP:           "192.168.1.1",
		UserAgent:    "Mozilla/5.0",
		CreatedAt:    time.Now(),
	}

	err := db.Create(decision).Error
	assert.NoError(t, err)

	var found HumanDecision
	err = db.First(&found, "id = ?", decision.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionAccepted, found.Decision)
}

func TestDecisionType_Values(t *testing.T) {
	assert.Equal(t, DecisionType("ignored"), DecisionIgnored)
	assert.Equal(t, DecisionType("accepted"), DecisionAccepted)
	assert.Equal(t, DecisionType("deferred"), DecisionDeferred)
}

// ========================================
// OBSERVER SERVICE TESTS
// ========================================

func TestObserverService_IsEnabled_Disabled(t *testing.T) {
	os.Setenv("AGENTS_ENABLED", "false")
	defer os.Unsetenv("AGENTS_ENABLED")

	service := NewObserverService(nil, nil)
	assert.False(t, service.IsEnabled())
}

func TestObserverService_IsEnabled_Enabled(t *testing.T) {
	os.Setenv("AGENTS_ENABLED", "true")
	defer os.Unsetenv("AGENTS_ENABLED")

	service := NewObserverService(nil, nil)
	assert.True(t, service.IsEnabled())
}

func TestObserverService_IsEnabled_EnabledWithOne(t *testing.T) {
	os.Setenv("AGENTS_ENABLED", "1")
	defer os.Unsetenv("AGENTS_ENABLED")

	service := NewObserverService(nil, nil)
	assert.True(t, service.IsEnabled())
}

func TestObserverService_GetSuggestions_Empty(t *testing.T) {
	service := NewObserverService(nil, nil)
	suggestions := service.GetSuggestions()
	assert.Empty(t, suggestions)
}

func TestObserverService_GetLastSnapshot_Nil(t *testing.T) {
	service := NewObserverService(nil, nil)
	snapshot := service.GetLastSnapshot()
	assert.Nil(t, snapshot)
}

// ========================================
// SNAPSHOT METRICS TESTS
// ========================================

func TestSnapshotMetrics_Struct(t *testing.T) {
	metrics := SnapshotMetrics{
		AuditEventsTotal:     1000,
		AppEventsTotal:       500,
		AppEventsFailedTotal: 10,
		RequestsTotal:        10000,
		ErrorsTotal:          50,
		UptimeSeconds:        86400,
		GoRoutines:           100,
		MemoryMB:             256,
	}

	assert.Equal(t, int64(1000), metrics.AuditEventsTotal)
	assert.Equal(t, int64(86400), metrics.UptimeSeconds)
	assert.Equal(t, uint64(256), metrics.MemoryMB)
}

func TestSnapshotStatus_Struct(t *testing.T) {
	status := SnapshotStatus{
		HealthStatus: "ok",
		ReadyStatus:  "ok",
		DBStatus:     "ok",
		Version:      "1.0.0",
	}

	assert.Equal(t, "ok", status.HealthStatus)
	assert.Equal(t, "1.0.0", status.Version)
}

// ========================================
// CONSOLE DASHBOARD TESTS
// ========================================

func TestConsoleDashboard_Struct(t *testing.T) {
	dashboard := ConsoleDashboard{
		TotalSuggestions:   100,
		TotalDecisions:     80,
		PendingSuggestions: 20,
		AvgConfidence:      0.75,
		DecisionsByType: map[string]int64{
			"accepted": 50,
			"ignored":  20,
			"deferred": 10,
		},
		Trends: ConsoleTrends{
			ErrorsTrend:      "down",
			SuggestionsTrend: "stable",
			HealthTrend:      "up",
		},
	}

	assert.Equal(t, int64(100), dashboard.TotalSuggestions)
	assert.Equal(t, int64(50), dashboard.DecisionsByType["accepted"])
	assert.Equal(t, "down", dashboard.Trends.ErrorsTrend)
}

func TestKillSwitchInfo_Struct(t *testing.T) {
	info := KillSwitchInfo{
		Scope:     "global",
		Reason:    "Manutenção programada",
		ExpiresAt: time.Now().Add(1 * time.Hour),
		Active:    true,
	}

	assert.Equal(t, "global", info.Scope)
	assert.True(t, info.Active)
}

func TestSystemHealthInfo_Struct(t *testing.T) {
	health := SystemHealthInfo{
		Status:        "healthy",
		UptimeSeconds: 86400,
		ErrorRate:     0.01,
		MemoryMB:      512,
	}

	assert.Equal(t, "healthy", health.Status)
	assert.Equal(t, 0.01, health.ErrorRate)
}

// ========================================
// DECISION STATS TESTS
// ========================================

func TestDecisionStats_Struct(t *testing.T) {
	stats := DecisionStats{
		TotalDecisions: 100,
		ByType: map[string]int64{
			"accepted": 60,
			"ignored":  30,
			"deferred": 10,
		},
		ByHuman: map[string]int64{
			"admin@test.com": 50,
			"user@test.com":  50,
		},
		Last24h:         20,
		Last7d:          80,
		AvgResponseTime: 2.5,
	}

	assert.Equal(t, int64(100), stats.TotalDecisions)
	assert.Equal(t, int64(60), stats.ByType["accepted"])
	assert.Equal(t, 2.5, stats.AvgResponseTime)
}

// ========================================
// AGENT MEMORY STATS TESTS
// ========================================

func TestAgentMemoryStats_Struct(t *testing.T) {
	now := time.Now()
	oldest := now.Add(-24 * time.Hour)

	stats := AgentMemoryStats{
		TotalEntries: 500,
		EntriesByAgent: map[string]int64{
			AgentNameObserverV1: 500,
		},
		OldestEntry:   &oldest,
		NewestEntry:   &now,
		AvgConfidence: 0.72,
	}

	assert.Equal(t, int64(500), stats.TotalEntries)
	assert.Equal(t, 0.72, stats.AvgConfidence)
}

// ========================================
// AGENT MEMORY QUERY TESTS
// ========================================

func TestAgentMemoryQuery_Defaults(t *testing.T) {
	query := AgentMemoryQuery{
		Agent:  AgentNameObserverV1,
		Window: "24h",
		Limit:  DefaultMemoryLimit,
	}

	assert.Equal(t, AgentNameObserverV1, query.Agent)
	assert.Equal(t, 100, query.Limit)
}

func TestMemoryLimits(t *testing.T) {
	assert.Equal(t, 100, DefaultMemoryLimit)
	assert.Equal(t, 1000, MaxMemoryLimit)
}

// ========================================
// CONSTANTS TESTS
// ========================================

func TestConstants(t *testing.T) {
	assert.Equal(t, "observer_v1", AgentNameObserverV1)
	assert.Equal(t, "1.0", SnapshotVersionV1)
}

// ========================================
// AGENT METRICS TESTS
// ========================================

func TestAgentMetrics_Struct(t *testing.T) {
	metrics := AgentMetrics{
		RunsTotal:         100,
		FailuresTotal:     5,
		LastRunTimestamp:  time.Now(),
		LastRunDurationMs: 150,
	}

	assert.Equal(t, int64(100), metrics.RunsTotal)
	assert.Equal(t, int64(5), metrics.FailuresTotal)
	assert.Equal(t, int64(150), metrics.LastRunDurationMs)
}

// ========================================
// CONSOLE TRENDS TESTS
// ========================================

func TestConsoleTrends_Values(t *testing.T) {
	validTrends := []string{"up", "down", "stable"}

	for _, trend := range validTrends {
		trends := ConsoleTrends{
			ErrorsTrend:      trend,
			SuggestionsTrend: trend,
			HealthTrend:      trend,
		}
		assert.Contains(t, validTrends, trends.ErrorsTrend)
	}
}
