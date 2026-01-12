package killswitch

import (
	"context"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"prost-qs/backend/internal/decision"
)

// ========================================
// DECISION INTEGRATION TESTS
// "Toda decisão de killswitch é registrada"
// ========================================

func setupDecisionTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	
	// Migrate all required models
	err = db.AutoMigrate(
		&decision.Decision{},
		&KillSwitch{},
	)
	require.NoError(t, err)
	
	return db
}

func TestNewDecisionAwareKillSwitchService(t *testing.T) {
	db := setupDecisionTestDB(t)
	
	ksService := NewKillSwitchService(db)
	decisionService := decision.NewService(db)
	
	service := NewDecisionAwareKillSwitchService(ksService, decisionService)
	
	assert.NotNil(t, service)
	assert.NotNil(t, service.killswitch)
	assert.NotNil(t, service.decision)
}

func TestDecisionAwareKillSwitchService_CheckAndRecord_NotBlocked(t *testing.T) {
	db := setupDecisionTestDB(t)
	ctx := context.Background()
	
	// Create services
	ksService := NewKillSwitchService(db)
	decisionService := decision.NewService(db)
	service := NewDecisionAwareKillSwitchService(ksService, decisionService)
	
	appID := uuid.New()
	
	// Check killswitch (should not be blocked)
	blocked, err := service.CheckAndRecord(ctx, "billing", appID)
	
	assert.NoError(t, err)
	assert.False(t, blocked)
	
	// Verify decision was recorded
	decisions, err := decisionService.GetByApp(ctx, appID, 10)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(decisions), 1)
	
	// Find the killswitch decision
	var found bool
	for _, d := range decisions {
		if d.Type == decision.DecisionKillswitchAllow {
			found = true
			assert.Equal(t, decision.OutcomeAllowed, d.Outcome)
			break
		}
	}
	assert.True(t, found, "Killswitch allow decision should be recorded")
	
	t.Log("✅ Killswitch not blocked decision recorded")
}

func TestDecisionAwareKillSwitchService_CheckAndRecord_Blocked(t *testing.T) {
	db := setupDecisionTestDB(t)
	ctx := context.Background()
	
	// Create services
	ksService := NewKillSwitchService(db)
	decisionService := decision.NewService(db)
	service := NewDecisionAwareKillSwitchService(ksService, decisionService)
	
	appID := uuid.New()
	adminID := uuid.New()
	
	// Activate killswitch
	err := ksService.Activate("billing", "Emergency shutdown", adminID, nil)
	require.NoError(t, err)
	
	// Check killswitch (should be blocked)
	blocked, err := service.CheckAndRecord(ctx, "billing", appID)
	
	assert.NoError(t, err)
	assert.True(t, blocked)
	
	// Verify decision was recorded
	decisions, err := decisionService.GetByApp(ctx, appID, 10)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(decisions), 1)
	
	// Find the killswitch decision
	var found bool
	for _, d := range decisions {
		if d.Type == decision.DecisionKillswitchBlock {
			found = true
			assert.Equal(t, decision.OutcomeBlocked, d.Outcome)
			break
		}
	}
	assert.True(t, found, "Killswitch block decision should be recorded")
	
	t.Log("✅ Killswitch blocked decision recorded")
}

func TestDecisionAwareKillSwitchService_ActivateAndRecord(t *testing.T) {
	db := setupDecisionTestDB(t)
	ctx := context.Background()
	
	// Create services
	ksService := NewKillSwitchService(db)
	decisionService := decision.NewService(db)
	service := NewDecisionAwareKillSwitchService(ksService, decisionService)
	
	adminID := uuid.New()
	
	// Activate killswitch
	err := service.ActivateAndRecord(ctx, "billing", "Emergency shutdown", adminID, nil)
	
	assert.NoError(t, err)
	
	// Verify killswitch is active
	assert.True(t, ksService.IsActive("billing"))
	
	// Verify decision was recorded (using uuid.Nil as appID for global decisions)
	decisions, err := decisionService.GetByApp(ctx, uuid.Nil, 10)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(decisions), 1)
	
	t.Log("✅ Killswitch activation decision recorded")
}

func TestDecisionAwareKillSwitchService_DeactivateAndRecord(t *testing.T) {
	db := setupDecisionTestDB(t)
	ctx := context.Background()
	
	// Create services
	ksService := NewKillSwitchService(db)
	decisionService := decision.NewService(db)
	service := NewDecisionAwareKillSwitchService(ksService, decisionService)
	
	adminID := uuid.New()
	
	// First activate
	err := ksService.Activate("billing", "Emergency shutdown", adminID, nil)
	require.NoError(t, err)
	
	// Then deactivate
	err = service.DeactivateAndRecord(ctx, "billing")
	
	assert.NoError(t, err)
	
	// Verify killswitch is not active
	assert.False(t, ksService.IsActive("billing"))
	
	// Verify decision was recorded
	decisions, err := decisionService.GetByApp(ctx, uuid.Nil, 10)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(decisions), 1)
	
	t.Log("✅ Killswitch deactivation decision recorded")
}

func TestDecisionAwareKillSwitchService_GetKillSwitchService(t *testing.T) {
	db := setupDecisionTestDB(t)
	
	ksService := NewKillSwitchService(db)
	decisionService := decision.NewService(db)
	service := NewDecisionAwareKillSwitchService(ksService, decisionService)
	
	// Should return the underlying service
	assert.Equal(t, ksService, service.GetKillSwitchService())
	
	t.Log("✅ GetKillSwitchService returns underlying service")
}
