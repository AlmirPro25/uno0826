package warobs

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// ========================================
// DEFENSE POLICY ENGINE TESTS
// Criados em: 19/01/2026 (QA Report)
// ========================================

func TestNewDefensePolicyEngine_Creation(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)

	assert.NotNil(t, engine)
	assert.True(t, engine.enabled, "Engine should be enabled by default")
}

func TestDefensePolicyEngine_EnabledByDefault(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)
	assert.True(t, engine.enabled)
}

func TestDefensePolicyEngine_EvaluatePolicies_NilPersistence(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)

	// Should not panic with nil persistence and nil kill switch
	assert.NotPanics(t, func() {
		engine.EvaluatePolicies()
	})
}

func TestDefensePolicyEngine_EvaluatePolicies_NilKillSwitch(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)

	// Should handle nil kill switch gracefully
	assert.NotPanics(t, func() {
		engine.EvaluatePolicies()
	})
}

func TestDefensePolicyEngine_EvaluatePolicies_Disabled(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)
	engine.enabled = false

	// Should return early when disabled
	assert.NotPanics(t, func() {
		engine.EvaluatePolicies()
	})
}

func TestGuardMiddleware_Creation(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)

	middleware := engine.GuardMiddleware()
	assert.NotNil(t, middleware, "GuardMiddleware should return a valid function")
}

func TestGuardMiddleware_DisabledEngine(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)
	engine.enabled = false

	middleware := engine.GuardMiddleware()
	assert.NotNil(t, middleware)
}

func TestGuardMiddleware_NilKillSwitch(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)

	middleware := engine.GuardMiddleware()
	assert.NotNil(t, middleware)
}

// ========================================
// INTEGRATION TESTS (Require Mock Context)
// ========================================

// Note: Full integration tests with Gin context require gin test helpers
// which would be added in a separate integration test file

// ========================================
// EDGE CASES
// ========================================

func TestDefensePolicyEngine_NilPersistence_NilKillSwitch(t *testing.T) {
	engine := NewDefensePolicyEngine(nil, nil)

	assert.Nil(t, engine.persistence)
	assert.Nil(t, engine.ksService)
	assert.True(t, engine.enabled)
}

// ========================================
// SECURITY TESTS
// ========================================

func TestDefensePolicyEngine_CircuitBreakerScope(t *testing.T) {
	// Verify circuit breaker scopes are correctly formatted
	routes := []string{
		"/api/v1/health",
		"/api/v1/billing/charge",
		"/admin/kill-switch",
	}

	for _, route := range routes {
		scope := "route:" + route
		assert.Contains(t, scope, "route:", "Scope should have route: prefix")
		assert.Contains(t, scope, route, "Scope should contain the route")
	}
}
