package invariants

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestAssert_PassingCondition(t *testing.T) {
	ClearViolations()
	Enable()

	// Condição verdadeira não deve gerar violação
	Assert(true, "test_pass", "This should not trigger")

	violations := GetViolations()
	assert.Len(t, violations, 0, "Condição verdadeira não deve gerar violação")
}

func TestAssert_FailingCondition(t *testing.T) {
	ClearViolations()
	Enable()

	// Condição falsa deve gerar violação
	Assert(false, "test_fail", "This should trigger", map[string]interface{}{
		"key": "value",
	})

	violations := GetViolations()
	assert.Len(t, violations, 1, "Condição falsa deve gerar violação")
	assert.Equal(t, "test_fail", violations[0].Invariant)
	assert.Equal(t, "This should trigger", violations[0].Message)
	assert.Equal(t, SeverityWarning, violations[0].Severity)
	assert.Equal(t, "value", violations[0].Context["key"])
}

func TestAssertCritical_FailingCondition(t *testing.T) {
	ClearViolations()
	Enable()

	AssertCritical(false, "critical_test", "Critical violation")

	violations := GetViolations()
	assert.Len(t, violations, 1)
	assert.Equal(t, SeverityCritical, violations[0].Severity)
}

func TestAssertFatal_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	assert.Panics(t, func() {
		AssertFatal(false, "fatal_test", "This should panic")
	}, "AssertFatal deve causar panic")

	violations := GetViolations()
	assert.Len(t, violations, 1)
	assert.Equal(t, SeverityFatal, violations[0].Severity)
}

func TestNever_AlwaysPanics(t *testing.T) {
	ClearViolations()
	Enable()

	assert.Panics(t, func() {
		Never("never_test", "This code should never run")
	}, "Never deve sempre causar panic")
}

func TestDisable_PreventsViolations(t *testing.T) {
	ClearViolations()
	Disable()

	Assert(false, "disabled_test", "Should not record")

	violations := GetViolations()
	assert.Len(t, violations, 0, "Invariants desabilitadas não devem registrar")

	Enable() // Restaurar
}

func TestHandler_IsCalled(t *testing.T) {
	ClearViolations()
	Enable()

	called := make(chan bool, 1)
	RegisterHandler(func(v Violation) {
		called <- true
	})

	Assert(false, "handler_test", "Should call handler")

	// Esperar um pouco porque handler é async
	select {
	case <-called:
		// OK
	case <-time.After(100 * time.Millisecond):
		t.Error("Handler não foi chamado")
	}
}

// ========================================
// TESTES DAS INVARIANTS DO KERNEL
// ========================================

func TestAssertUserHasSingleOrigin_Valid(t *testing.T) {
	ClearViolations()
	Enable()

	AssertUserHasSingleOrigin("user-123", 1)

	violations := GetViolations()
	assert.Len(t, violations, 0, "1 origem é válido")
}

func TestAssertUserHasSingleOrigin_Invalid(t *testing.T) {
	ClearViolations()
	Enable()

	AssertUserHasSingleOrigin("user-123", 2)

	violations := GetViolations()
	assert.Len(t, violations, 1, "2 origens deve violar")
	assert.Equal(t, "user_multiple_origins", violations[0].Invariant)
}

func TestAssertAppIsolation_Valid(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppIsolation("app-1", "app-1")

	violations := GetViolations()
	assert.Len(t, violations, 0, "Mesmo app é válido")
}

func TestAssertAppIsolation_Breach(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppIsolation("app-1", "app-2")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Apps diferentes deve violar")
	assert.Equal(t, "app_isolation_breach", violations[0].Invariant)
}

func TestAssertNoPasswordInJWT_Valid(t *testing.T) {
	ClearViolations()
	Enable()

	claims := map[string]interface{}{
		"user_id": "123",
		"email":   "test@test.com",
	}

	// Não deve causar panic
	assert.NotPanics(t, func() {
		AssertNoPasswordInJWT(claims)
	})

	violations := GetViolations()
	assert.Len(t, violations, 0)
}

func TestAssertNoPasswordInJWT_Invalid(t *testing.T) {
	ClearViolations()
	Enable()

	claims := map[string]interface{}{
		"user_id":  "123",
		"password": "secret123", // NUNCA deve acontecer
	}

	assert.Panics(t, func() {
		AssertNoPasswordInJWT(claims)
	}, "Senha no JWT deve causar panic")
}

func TestAssertTelemetryHasAppID_Valid(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryHasAppID("550e8400-e29b-41d4-a716-446655440000")

	violations := GetViolations()
	assert.Len(t, violations, 0)
}

func TestAssertTelemetryHasAppID_Empty(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryHasAppID("")

	violations := GetViolations()
	assert.Len(t, violations, 1)
	assert.Equal(t, "telemetry_missing_app_id", violations[0].Invariant)
}

func TestAssertTelemetryHasAppID_NilUUID(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryHasAppID("00000000-0000-0000-0000-000000000000")

	violations := GetViolations()
	assert.Len(t, violations, 1)
	assert.Equal(t, "telemetry_missing_app_id", violations[0].Invariant)
}


// ========================================
// TESTES DE ISOLAMENTO DE TELEMETRIA
// ========================================

func TestAssertTelemetryBelongsToApp_Valid(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryBelongsToApp("app-123", "app-123")

	violations := GetViolations()
	assert.Len(t, violations, 0, "Mesmo app é válido")
}

func TestAssertTelemetryBelongsToApp_CrossApp(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryBelongsToApp("app-123", "app-456")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Apps diferentes deve violar")
	assert.Equal(t, "telemetry_cross_app_violation", violations[0].Invariant)
	assert.Equal(t, "app-123", violations[0].Context["request_app_id"])
	assert.Equal(t, "app-456", violations[0].Context["event_app_id"])
}
