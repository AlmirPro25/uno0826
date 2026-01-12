package invariants

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// ========================================
// TESTES DE EVENT VALIDATION
// ========================================

// NOTA: Testes de AssertTelemetryHasAppID estão em invariants_test.go

func TestAssertTelemetryHasUserID_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryHasUserID("550e8400-e29b-41d4-a716-446655440000", false)

	violations := GetViolations()
	assert.Empty(t, violations, "User ID válido não deveria gerar violação")
	t.Log("✅ User ID válido passou")
}

func TestAssertTelemetryHasUserID_Empty_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryHasUserID("", false)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar user_id vazio")
	assert.Equal(t, "telemetry_missing_user_id", violations[0].Invariant)
	t.Logf("✅ Detectou user_id vazio: %s", violations[0].Message)
}

func TestAssertTelemetryHasUserID_AllowAnonymous_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryHasUserID("", true)

	violations := GetViolations()
	assert.Empty(t, violations, "Anônimo permitido não deveria gerar violação")
	t.Log("✅ Anônimo permitido passou")
}

func TestAssertTelemetryEventTypeValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	validTypes := []string{"session.start", "session.end", "interaction.click", "error.crash"}
	AssertTelemetryEventTypeValid("session.start", validTypes)

	violations := GetViolations()
	assert.Empty(t, violations, "Tipo válido não deveria gerar violação")
	t.Log("✅ Tipo de evento válido passou")
}

func TestAssertTelemetryEventTypeValid_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	validTypes := []string{"session.start", "session.end"}
	AssertTelemetryEventTypeValid("unknown.event", validTypes)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar tipo inválido")
	assert.Equal(t, "telemetry_event_type_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou tipo inválido: %s", violations[0].Message)
}

func TestAssertTelemetryTimestampValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertTelemetryTimestampValid(time.Now(), 1*time.Hour, 5*time.Minute)

	violations := GetViolations()
	assert.Empty(t, violations, "Timestamp válido não deveria gerar violação")
	t.Log("✅ Timestamp válido passou")
}

func TestAssertTelemetryTimestampValid_TooOld_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	oldTimestamp := time.Now().Add(-2 * time.Hour)
	AssertTelemetryTimestampValid(oldTimestamp, 1*time.Hour, 5*time.Minute)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar timestamp muito antigo")
	assert.Equal(t, "telemetry_timestamp_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou timestamp antigo: %s", violations[0].Message)
}

func TestAssertTelemetryTimestampValid_Future_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	futureTimestamp := time.Now().Add(10 * time.Minute)
	AssertTelemetryTimestampValid(futureTimestamp, 1*time.Hour, 5*time.Minute)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar timestamp futuro")
	assert.Equal(t, "telemetry_timestamp_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou timestamp futuro: %s", violations[0].Message)
}

// ========================================
// TESTES DE SESSION MANAGEMENT
// ========================================

func TestAssertSessionNotZombie_Active_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionNotZombie("session-123", time.Now().Add(-30*time.Second), 60*time.Second)

	violations := GetViolations()
	assert.Empty(t, violations, "Sessão ativa não deveria gerar violação")
	t.Log("✅ Sessão ativa passou")
}

func TestAssertSessionNotZombie_Zombie_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionNotZombie("session-123", time.Now().Add(-2*time.Minute), 60*time.Second)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar sessão zumbi")
	assert.Equal(t, "telemetry_session_zombie", violations[0].Invariant)
	t.Logf("✅ Detectou sessão zumbi: %s", violations[0].Message)
}

func TestAssertSessionDurationValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionDurationValid("session-123", 30*time.Minute, 24*time.Hour)

	violations := GetViolations()
	assert.Empty(t, violations, "Duração válida não deveria gerar violação")
	t.Log("✅ Duração válida passou")
}

func TestAssertSessionDurationValid_Negative_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionDurationValid("session-123", -5*time.Minute, 24*time.Hour)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar duração negativa")
	assert.Equal(t, "telemetry_session_duration_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou duração negativa: %s", violations[0].Message)
}

func TestAssertSessionDurationValid_TooLong_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionDurationValid("session-123", 48*time.Hour, 24*time.Hour)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar duração muito longa")
	assert.Equal(t, "telemetry_session_duration_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou duração muito longa: %s", violations[0].Message)
}

func TestAssertSessionStartBeforeEnd_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	start := time.Now().Add(-1 * time.Hour)
	end := time.Now()
	AssertSessionStartBeforeEnd("session-123", start, end)

	violations := GetViolations()
	assert.Empty(t, violations, "Sessão válida não deveria gerar violação")
	t.Log("✅ Sessão com tempo válido passou")
}

func TestAssertSessionStartBeforeEnd_Paradox_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	start := time.Now()
	end := time.Now().Add(-1 * time.Hour)
	AssertSessionStartBeforeEnd("session-123", start, end)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar paradoxo temporal")
	assert.Equal(t, "telemetry_session_time_paradox", violations[0].Invariant)
	t.Logf("✅ Detectou paradoxo temporal: %s", violations[0].Message)
}

// NOTA: Testes de AssertSessionBelongsToApp estão em application_invariants_test.go

// ========================================
// TESTES DE METRICS CONSISTENCY
// ========================================

func TestAssertMetricsNonNegative_Positive_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertMetricsNonNegative("total_users", 100)

	violations := GetViolations()
	assert.Empty(t, violations, "Métrica positiva não deveria gerar violação")
	t.Log("✅ Métrica positiva passou")
}

func TestAssertMetricsNonNegative_Zero_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertMetricsNonNegative("active_users", 0)

	violations := GetViolations()
	assert.Empty(t, violations, "Métrica zero não deveria gerar violação")
	t.Log("✅ Métrica zero passou")
}

func TestAssertMetricsNonNegative_Negative_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertMetricsNonNegative("total_events", -5)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar métrica negativa")
	assert.Equal(t, "telemetry_metric_negative", violations[0].Invariant)
	t.Logf("✅ Detectou métrica negativa: %s", violations[0].Message)
}

func TestAssertMetricsConsistent_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertMetricsConsistent(50, 100)

	violations := GetViolations()
	assert.Empty(t, violations, "Métricas consistentes não deveriam gerar violação")
	t.Log("✅ Métricas consistentes passou")
}

func TestAssertMetricsConsistent_Inconsistent_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertMetricsConsistent(150, 100)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar inconsistência")
	assert.Equal(t, "telemetry_metrics_inconsistent", violations[0].Invariant)
	t.Logf("✅ Detectou inconsistência: %s", violations[0].Message)
}

func TestAssertOnlineCountValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertOnlineCountValid("app-123", 10, 50)

	violations := GetViolations()
	assert.Empty(t, violations, "Online válido não deveria gerar violação")
	t.Log("✅ Online válido passou")
}

func TestAssertOnlineCountValid_ExceedsActive_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertOnlineCountValid("app-123", 100, 50)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar online > active")
	assert.Equal(t, "telemetry_online_exceeds_active", violations[0].Invariant)
	t.Logf("✅ Detectou online > active: %s", violations[0].Message)
}

func TestAssertEventsPerMinuteValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertEventsPerMinuteValid("app-123", 50.0, 100.0)

	violations := GetViolations()
	assert.Empty(t, violations, "Taxa válida não deveria gerar violação")
	t.Log("✅ Taxa de eventos válida passou")
}

func TestAssertEventsPerMinuteValid_TooHigh_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertEventsPerMinuteValid("app-123", 150.0, 100.0)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar taxa muito alta")
	assert.Equal(t, "telemetry_events_rate_high", violations[0].Invariant)
	t.Logf("✅ Detectou taxa muito alta: %s", violations[0].Message)
}


// ========================================
// TESTES DE ALERT VALIDATION
// ========================================

func TestAssertAlertSeverityValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	validSeverities := []string{"info", "warning", "critical"}
	AssertAlertSeverityValid("alert-123", "warning", validSeverities)

	violations := GetViolations()
	assert.Empty(t, violations, "Severidade válida não deveria gerar violação")
	t.Log("✅ Severidade válida passou")
}

func TestAssertAlertSeverityValid_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	validSeverities := []string{"info", "warning", "critical"}
	AssertAlertSeverityValid("alert-123", "extreme", validSeverities)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar severidade inválida")
	assert.Equal(t, "telemetry_alert_severity_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou severidade inválida: %s", violations[0].Message)
}

func TestAssertAlertNotDuplicate_NotDuplicate_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	lastAlertTime := time.Now().Add(-10 * time.Minute)
	AssertAlertNotDuplicate("online_drop", "app-123", lastAlertTime, 5*time.Minute)

	violations := GetViolations()
	assert.Empty(t, violations, "Alerta não duplicado não deveria gerar violação")
	t.Log("✅ Alerta não duplicado passou")
}

func TestAssertAlertNotDuplicate_Duplicate_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	lastAlertTime := time.Now().Add(-2 * time.Minute)
	AssertAlertNotDuplicate("online_drop", "app-123", lastAlertTime, 5*time.Minute)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar alerta duplicado")
	assert.Equal(t, "telemetry_alert_duplicate", violations[0].Invariant)
	t.Logf("✅ Detectou alerta duplicado: %s", violations[0].Message)
}

func TestAssertAlertDataValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	data := map[string]interface{}{
		"previous": 100,
		"current":  0,
	}
	AssertAlertDataValid("alert-123", data)

	violations := GetViolations()
	assert.Empty(t, violations, "Dados válidos não deveriam gerar violação")
	t.Log("✅ Dados de alerta válidos passou")
}

func TestAssertAlertDataValid_Empty_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAlertDataValid("alert-123", map[string]interface{}{})

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar dados vazios")
	assert.Equal(t, "telemetry_alert_data_empty", violations[0].Invariant)
	t.Logf("✅ Detectou dados vazios: %s", violations[0].Message)
}

func TestAssertAlertDataValid_Nil_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAlertDataValid("alert-123", nil)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar dados nil")
	assert.Equal(t, "telemetry_alert_data_empty", violations[0].Invariant)
	t.Logf("✅ Detectou dados nil: %s", violations[0].Message)
}

// ========================================
// TESTES DE DATA INTEGRITY
// ========================================

func TestAssertEventCountConsistent_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertEventCountConsistent("app-123", 500, 1000)

	violations := GetViolations()
	assert.Empty(t, violations, "Contagem consistente não deveria gerar violação")
	t.Log("✅ Contagem de eventos consistente passou")
}

func TestAssertEventCountConsistent_Inconsistent_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertEventCountConsistent("app-123", 1500, 1000)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar inconsistência")
	assert.Equal(t, "telemetry_event_count_inconsistent", violations[0].Invariant)
	t.Logf("✅ Detectou inconsistência: %s", violations[0].Message)
}

func TestAssertSnapshotFresh_Fresh_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSnapshotFresh("app-123", time.Now().Add(-5*time.Second), 30*time.Second)

	violations := GetViolations()
	assert.Empty(t, violations, "Snapshot fresco não deveria gerar violação")
	t.Log("✅ Snapshot fresco passou")
}

func TestAssertSnapshotFresh_Stale_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSnapshotFresh("app-123", time.Now().Add(-2*time.Minute), 30*time.Second)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar snapshot desatualizado")
	assert.Equal(t, "telemetry_snapshot_stale", violations[0].Invariant)
	t.Logf("✅ Detectou snapshot desatualizado: %s", violations[0].Message)
}

func TestAssertRetentionDataValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRetentionDataValid("2026-01-11", 45.5)

	violations := GetViolations()
	assert.Empty(t, violations, "Retenção válida não deveria gerar violação")
	t.Log("✅ Retenção válida passou")
}

func TestAssertRetentionDataValid_Negative_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRetentionDataValid("2026-01-11", -5.0)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar retenção negativa")
	assert.Equal(t, "telemetry_retention_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou retenção negativa: %s", violations[0].Message)
}

func TestAssertRetentionDataValid_Over100_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRetentionDataValid("2026-01-11", 150.0)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar retenção > 100%")
	assert.Equal(t, "telemetry_retention_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou retenção > 100%%: %s", violations[0].Message)
}

// ========================================
// TESTES DE RATE LIMITING
// ========================================

func TestAssertIngestionRateValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertIngestionRateValid("app-123", 500, 1000, time.Minute)

	violations := GetViolations()
	assert.Empty(t, violations, "Taxa válida não deveria gerar violação")
	t.Log("✅ Taxa de ingestão válida passou")
}

func TestAssertIngestionRateValid_Exceeded_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertIngestionRateValid("app-123", 1500, 1000, time.Minute)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar taxa excedida")
	assert.Equal(t, "telemetry_ingestion_rate_exceeded", violations[0].Invariant)
	t.Logf("✅ Detectou taxa excedida: %s", violations[0].Message)
}

func TestAssertBatchSizeValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertBatchSizeValid(50, 100)

	violations := GetViolations()
	assert.Empty(t, violations, "Batch válido não deveria gerar violação")
	t.Log("✅ Batch válido passou")
}

func TestAssertBatchSizeValid_TooLarge_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertBatchSizeValid(150, 100)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar batch muito grande")
	assert.Equal(t, "telemetry_batch_too_large", violations[0].Invariant)
	t.Logf("✅ Detectou batch muito grande: %s", violations[0].Message)
}

// ========================================
// TESTES DE EDGE CASES
// ========================================

func TestTelemetryInvariants_EdgeCases(t *testing.T) {
	t.Run("Zero values", func(t *testing.T) {
		ClearViolations()
		Enable()

		AssertMetricsNonNegative("zero_metric", 0)
		AssertMetricsConsistent(0, 0)
		AssertOnlineCountValid("app-123", 0, 0)
		
		violations := GetViolations()
		assert.Empty(t, violations, "Valores zero deveriam passar")
	})

	t.Run("Boundary timestamp", func(t *testing.T) {
		ClearViolations()
		Enable()

		// Exatamente no limite
		AssertTelemetryTimestampValid(time.Now().Add(-1*time.Hour), 1*time.Hour, 5*time.Minute)
		
		violations := GetViolations()
		assert.Empty(t, violations, "Timestamp no limite deveria passar")
	})

	t.Run("Session same start and end", func(t *testing.T) {
		ClearViolations()
		Enable()

		now := time.Now()
		AssertSessionStartBeforeEnd("session-123", now, now)
		
		violations := GetViolations()
		assert.Empty(t, violations, "Sessão com mesmo início e fim deveria passar")
	})

	t.Run("Retention boundaries", func(t *testing.T) {
		ClearViolations()
		Enable()

		AssertRetentionDataValid("2026-01-11", 0.0)
		AssertRetentionDataValid("2026-01-11", 100.0)
		
		violations := GetViolations()
		assert.Empty(t, violations, "Retenção 0% e 100% deveriam passar")
	})
}
