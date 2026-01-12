package killswitch

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// ========================================
// TEST HELPERS
// ========================================

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&KillSwitch{})
	require.NoError(t, err)

	return db
}

// ========================================
// BASIC FUNCTIONALITY TESTS
// ========================================

func TestKillSwitchService_NewService(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)

	assert.NotNil(t, service)
	assert.NotNil(t, service.cache)
}

func TestKillSwitchService_IsActive_DefaultFalse(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)

	// All scopes should be inactive by default
	assert.False(t, service.IsActive(ScopeAll))
	assert.False(t, service.IsActive(ScopeBilling))
	assert.False(t, service.IsActive(ScopeAgents))
	assert.False(t, service.IsActive(ScopeAds))
	assert.False(t, service.IsActive(ScopeJobs))
	assert.False(t, service.IsActive(ScopePayments))
}

func TestKillSwitchService_Check_NoError(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)

	err := service.Check(ScopeBilling)
	assert.NoError(t, err)
}

// ========================================
// ACTIVATION TESTS
// ========================================

func TestKillSwitchService_Activate(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	err := service.Activate(ScopeBilling, "Test activation", adminID, nil)
	assert.NoError(t, err)

	// Verify it's active
	assert.True(t, service.IsActive(ScopeBilling))

	// Verify Check returns error
	err = service.Check(ScopeBilling)
	assert.Error(t, err)
	assert.Equal(t, ErrKillSwitchActive, err)
}

func TestKillSwitchService_Activate_AllScope(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Activate "all" scope
	err := service.Activate(ScopeAll, "Emergency shutdown", adminID, nil)
	assert.NoError(t, err)

	// All scopes should be blocked
	assert.True(t, service.IsActive(ScopeAll))
	assert.True(t, service.IsActive(ScopeBilling))
	assert.True(t, service.IsActive(ScopeAgents))
	assert.True(t, service.IsActive(ScopeAds))
}

func TestKillSwitchService_Activate_WithExpiration(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Activate with 1 minute expiration
	expiresIn := 1
	err := service.Activate(ScopeBilling, "Temporary block", adminID, &expiresIn)
	assert.NoError(t, err)

	// Verify it's active
	assert.True(t, service.IsActive(ScopeBilling))

	// Verify expiration is set
	ks, err := service.GetByScope(ScopeBilling)
	assert.NoError(t, err)
	assert.NotNil(t, ks.ExpiresAt)
	assert.True(t, ks.ExpiresAt.After(time.Now()))
}

func TestKillSwitchService_Activate_UpdateExisting(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// First activation
	err := service.Activate(ScopeBilling, "First reason", adminID, nil)
	assert.NoError(t, err)

	// Second activation (should update)
	err = service.Activate(ScopeBilling, "Updated reason", adminID, nil)
	assert.NoError(t, err)

	// Verify reason was updated
	ks, err := service.GetByScope(ScopeBilling)
	assert.NoError(t, err)
	assert.Equal(t, "Updated reason", ks.Reason)
}

// ========================================
// DEACTIVATION TESTS
// ========================================

func TestKillSwitchService_Deactivate(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Activate first
	service.Activate(ScopeBilling, "Test", adminID, nil)
	assert.True(t, service.IsActive(ScopeBilling))

	// Deactivate
	err := service.Deactivate(ScopeBilling)
	assert.NoError(t, err)

	// Verify it's inactive
	assert.False(t, service.IsActive(ScopeBilling))
}

func TestKillSwitchService_DeactivateAll(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Activate multiple scopes
	service.Activate(ScopeBilling, "Test", adminID, nil)
	service.Activate(ScopeAgents, "Test", adminID, nil)
	service.Activate(ScopeAds, "Test", adminID, nil)

	// Verify all are active
	assert.True(t, service.IsActive(ScopeBilling))
	assert.True(t, service.IsActive(ScopeAgents))
	assert.True(t, service.IsActive(ScopeAds))

	// Deactivate all
	err := service.DeactivateAll()
	assert.NoError(t, err)

	// Verify all are inactive
	assert.False(t, service.IsActive(ScopeBilling))
	assert.False(t, service.IsActive(ScopeAgents))
	assert.False(t, service.IsActive(ScopeAds))
}

// ========================================
// STATUS TESTS
// ========================================

func TestKillSwitchService_GetStatus(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Activate some scopes
	service.Activate(ScopeBilling, "Test", adminID, nil)
	service.Activate(ScopeAgents, "Test", adminID, nil)

	status := service.GetStatus()

	assert.False(t, status.All)
	assert.True(t, status.Billing)
	assert.True(t, status.Agents)
	assert.False(t, status.Ads)
	assert.False(t, status.Jobs)
	assert.False(t, status.Payments)
}

func TestKillSwitchService_GetAll(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Activate some scopes
	service.Activate(ScopeBilling, "Billing test", adminID, nil)
	service.Activate(ScopeAgents, "Agents test", adminID, nil)

	switches, err := service.GetAll()
	assert.NoError(t, err)
	assert.Len(t, switches, 2)
}

func TestKillSwitchService_GetByScope(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	service.Activate(ScopeBilling, "Test reason", adminID, nil)

	ks, err := service.GetByScope(ScopeBilling)
	assert.NoError(t, err)
	assert.Equal(t, ScopeBilling, ks.Scope)
	assert.Equal(t, "Test reason", ks.Reason)
	assert.True(t, ks.Active)
}

func TestKillSwitchService_GetByScope_NotFound(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)

	_, err := service.GetByScope(ScopeBilling)
	assert.Error(t, err)
}

// ========================================
// CHECK MULTIPLE TESTS
// ========================================

func TestKillSwitchService_CheckMultiple(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// No scopes active - should pass
	err := service.CheckMultiple(ScopeBilling, ScopeAgents)
	assert.NoError(t, err)

	// Activate one scope
	service.Activate(ScopeBilling, "Test", adminID, nil)

	// Should fail because billing is active
	err = service.CheckMultiple(ScopeBilling, ScopeAgents)
	assert.Error(t, err)
	assert.Equal(t, ErrKillSwitchActive, err)
}

// ========================================
// CONCURRENCY TESTS
// ========================================

func TestKillSwitchService_ConcurrentAccess(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Run concurrent checks
	done := make(chan bool, 100)

	for i := 0; i < 100; i++ {
		go func() {
			service.IsActive(ScopeBilling)
			done <- true
		}()
	}

	// Activate while checks are running
	go func() {
		service.Activate(ScopeBilling, "Test", adminID, nil)
	}()

	// Wait for all goroutines
	for i := 0; i < 100; i++ {
		<-done
	}

	// Should not panic or deadlock
	assert.True(t, true)
}

// ========================================
// EDGE CASES
// ========================================

func TestKillSwitchService_EmptyReason(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Should still work with empty reason (validation is in handler)
	err := service.Activate(ScopeBilling, "", adminID, nil)
	assert.NoError(t, err)
}

func TestKillSwitchService_ZeroExpiration(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Zero expiration should be treated as no expiration
	expiresIn := 0
	err := service.Activate(ScopeBilling, "Test", adminID, &expiresIn)
	assert.NoError(t, err)

	ks, _ := service.GetByScope(ScopeBilling)
	assert.Nil(t, ks.ExpiresAt)
}

func TestKillSwitchService_NegativeExpiration(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Negative expiration should be treated as no expiration
	expiresIn := -5
	err := service.Activate(ScopeBilling, "Test", adminID, &expiresIn)
	assert.NoError(t, err)

	ks, _ := service.GetByScope(ScopeBilling)
	assert.Nil(t, ks.ExpiresAt)
}

// ========================================
// INTEGRATION TESTS
// ========================================

func TestKillSwitch_EmergencyScenario(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Scenario: System detects anomaly, activates kill switch

	// 1. Normal operation
	assert.NoError(t, service.Check(ScopeBilling))
	assert.NoError(t, service.Check(ScopeAgents))

	// 2. Emergency detected - activate all
	err := service.Activate(ScopeAll, "Anomaly detected - emergency shutdown", adminID, nil)
	assert.NoError(t, err)

	// 3. All operations should be blocked
	assert.Error(t, service.Check(ScopeBilling))
	assert.Error(t, service.Check(ScopeAgents))
	assert.Error(t, service.Check(ScopeAds))

	// 4. Issue resolved - deactivate
	err = service.Deactivate(ScopeAll)
	assert.NoError(t, err)

	// 5. Operations resume
	assert.NoError(t, service.Check(ScopeBilling))
	assert.NoError(t, service.Check(ScopeAgents))
}

func TestKillSwitch_PartialShutdown(t *testing.T) {
	db := setupTestDB(t)
	service := NewKillSwitchService(db)
	adminID := uuid.New()

	// Scenario: Only billing needs to be stopped

	// 1. Activate only billing
	service.Activate(ScopeBilling, "Billing maintenance", adminID, nil)

	// 2. Billing blocked, others work
	assert.Error(t, service.Check(ScopeBilling))
	assert.NoError(t, service.Check(ScopeAgents))
	assert.NoError(t, service.Check(ScopeAds))

	// 3. Maintenance complete
	service.Deactivate(ScopeBilling)

	// 4. All work again
	assert.NoError(t, service.Check(ScopeBilling))
}
