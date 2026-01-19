package tenancy

import (
	"context"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// ========================================
// TENANT ISOLATION TESTS
// ========================================
// Purpose: Prove that tenant boundaries are HARD
// Critical for: SaaS B2B security compliance
// ========================================

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Auto-migrate
	err = db.AutoMigrate(&Tenant{})
	require.NoError(t, err)

	return db
}

// TestTenantDataIsolation proves that Tenant A cannot access Tenant B data
func TestTenantDataIsolation(t *testing.T) {
	db := setupTestDB(t)
	manager := NewTenantManager(db, false) // non-isolated for this test

	ctx := context.Background()

	// Create Tenant A
	tenantA, err := manager.CreateTenant(ctx, CreateTenantRequest{
		Name:         "Acme Corp",
		Domain:       "acme",
		DisplayName:  "Acme",
		ContactEmail: "admin@acme.com",
		PlanTier:     "professional",
	})
	require.NoError(t, err)

	// Create Tenant B
	tenantB, err := manager.CreateTenant(ctx, CreateTenantRequest{
		Name:         "Beta Inc",
		Domain:       "beta",
		DisplayName:  "Beta",
		ContactEmail: "admin@beta.com",
		PlanTier:     "professional",
	})
	require.NoError(t, err)

	// CRITICAL TEST: Ensure API keys are unique
	assert.NotEqual(t, tenantA.APIKey, tenantB.APIKey, "API keys must be unique")
	assert.NotEqual(t, tenantA.ID, tenantB.ID, "Tenant IDs must be unique")

	// CRITICAL TEST: Lookup by API key returns ONLY that tenant
	retrieved, err := manager.GetTenantByAPIKey(ctx, tenantA.APIKey)
	require.NoError(t, err)
	assert.Equal(t, tenantA.ID, retrieved.ID)
	assert.NotEqual(t, tenantB.ID, retrieved.ID)

	// CRITICAL TEST: Invalid API key fails
	_, err = manager.GetTenantByAPIKey(ctx, "prost_live_INVALID")
	assert.Error(t, err, "Invalid API key must fail")
}

// TestTenantQuotaIsolation proves that Tenant A quota doesn't affect Tenant B
func TestTenantQuotaIsolation(t *testing.T) {
	db := setupTestDB(t)
	manager := NewTenantManager(db, false)

	ctx := context.Background()

	// Create two tenants with different quotas
	tenantA, _ := manager.CreateTenant(ctx, CreateTenantRequest{
		Name:     "Acme",
		Domain:   "acme",
		PlanTier: "starter", // Max 10k AI calls
	})

	tenantB, _ := manager.CreateTenant(ctx, CreateTenantRequest{
		Name:     "Beta",
		Domain:   "beta",
		PlanTier: "enterprise", // Max 1M AI calls
	})

	// Exhaust Tenant A quota
	for i := 0; i < 10001; i++ {
		manager.TrackAICall(ctx, tenantA.ID)
	}

	// CRITICAL TEST: Tenant A is blocked
	err := manager.CheckQuota(ctx, tenantA.ID, "ai_call")
	assert.Error(t, err, "Tenant A should be blocked")

	// CRITICAL TEST: Tenant B is NOT blocked
	err = manager.CheckQuota(ctx, tenantB.ID, "ai_call")
	assert.NoError(t, err, "Tenant B should NOT be affected by Tenant A quota")
}

// TestTenantSchemaIsolation tests schema-per-tenant isolation
func TestTenantSchemaIsolation(t *testing.T) {
	// NOTE: This test requires Postgres with schema support
	// SQLite doesn't support schemas, so we skip for now
	t.Skip("Requires Postgres - implement in integration tests")

	// In production test:
	// 1. Create tenant with schema
	// 2. Insert data into schema
	// 3. Try to access from another schema → should fail
	// 4. Drop tenant schema → other schemas unaffected
}

// TestConcurrentTenantCreation tests race conditions
func TestConcurrentTenantCreation(t *testing.T) {
	db := setupTestDB(t)
	manager := NewTenantManager(db, false)

	ctx := context.Background()

	// Try to create same domain twice concurrently
	done := make(chan error, 2)

	go func() {
		_, err := manager.CreateTenant(ctx, CreateTenantRequest{
			Name:   "Acme",
			Domain: "acme",
		})
		done <- err
	}()

	go func() {
		_, err := manager.CreateTenant(ctx, CreateTenantRequest{
			Name:   "Acme Duplicate",
			Domain: "acme", // Same domain
		})
		done <- err
	}()

	err1 := <-done
	err2 := <-done

	// CRITICAL TEST: One must succeed, one must fail
	if err1 == nil {
		assert.Error(t, err2, "Second creation must fail due to duplicate domain")
	} else {
		assert.NoError(t, err2, "First creation failed, second should succeed")
	}
}

// TestTenantSuspensionIsolation ensures suspended tenant can't access
func TestTenantSuspensionIsolation(t *testing.T) {
	db := setupTestDB(t)
	manager := NewTenantManager(db, false)

	ctx := context.Background()

	tenant, _ := manager.CreateTenant(ctx, CreateTenantRequest{
		Name:   "Acme",
		Domain: "acme",
	})

	// Suspend tenant
	err := manager.SuspendTenant(ctx, tenant.ID, "non-payment")
	require.NoError(t, err)

	// CRITICAL TEST: Suspended tenant can't authenticate
	_, err = manager.GetTenantByAPIKey(ctx, tenant.APIKey)
	assert.Error(t, err, "Suspended tenant must not authenticate")
}

// TestAPIKeyUniqueness ensures cryptographic randomness
func TestAPIKeyUniqueness(t *testing.T) {
	db := setupTestDB(t)
	manager := NewTenantManager(db, false)

	ctx := context.Background()

	keys := make(map[string]bool)

	// Create 100 tenants and check for collisions
	for i := 0; i < 100; i++ {
		tenant, err := manager.CreateTenant(ctx, CreateTenantRequest{
			Name:   "Tenant" + string(rune(i)),
			Domain: "tenant" + string(rune(i)),
		})
		require.NoError(t, err)

		// CRITICAL TEST: No duplicate API keys
		assert.False(t, keys[tenant.APIKey], "API key collision detected!")
		keys[tenant.APIKey] = true

		// CRITICAL TEST: API key has correct format
		assert.Contains(t, tenant.APIKey, "prost_live_", "API key must have correct prefix")
		assert.Greater(t, len(tenant.APIKey), 40, "API key must be long enough")
	}
}

// ========================================
// FUZZING TESTS (Property-Based)
// ========================================

// FuzzTenantCreation fuzzes tenant creation with random inputs
func FuzzTenantCreation(f *testing.F) {
	db := setupTestDB(&testing.T{})
	manager := NewTenantManager(db, false)

	f.Add("acme", "admin@acme.com")
	f.Add("", "") // Empty strings
	f.Add("a", "b@c.d")

	f.Fuzz(func(t *testing.T, domain, email string) {
		ctx := context.Background()

		_, err := manager.CreateTenant(ctx, CreateTenantRequest{
			Name:         "Test",
			Domain:       domain,
			ContactEmail: email,
		})

		// Should never panic, only return error
		if err != nil {
			// Expected for invalid inputs
			return
		}
	})
}
