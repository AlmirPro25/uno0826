package invariants

/*
================================================================================
TELEMETRY INVARIANTS — PROTEÇÃO DO SISTEMA DE TELEMETRIA
================================================================================

Estas invariants garantem que:
1. Eventos têm origem válida (app_id, user_id)
2. Sessões são gerenciadas corretamente
3. Métricas são consistentes
4. Alertas são válidos
5. Dados não são corrompidos

Se estas invariants falharem, há risco de:
- Métricas incorretas
- Sessões zumbi
- Alertas falsos
- Perda de dados

================================================================================
*/

import (
	"fmt"
	"time"
)

// ========================================
// EVENT VALIDATION
// ========================================

// NOTA: AssertTelemetryHasAppID já existe em invariants.go

// AssertTelemetryHasUserID verifica se evento tem user_id válido
// WARNING: Evento sem user_id pode ser anônimo, mas deve ser intencional
func AssertTelemetryHasUserID(userID string, allowAnonymous bool) {
	if !allowAnonymous {
		Assert(
			userID != "" && userID != "00000000-0000-0000-0000-000000000000",
			"telemetry_missing_user_id",
			"Telemetry event missing valid user_id",
			map[string]interface{}{
				"user_id": userID,
			},
		)
	}
}

// AssertTelemetryEventTypeValid verifica se tipo de evento é válido
// WARNING: Tipo inválido pode causar problemas de processamento
func AssertTelemetryEventTypeValid(eventType string, validTypes []string) {
	valid := false
	for _, t := range validTypes {
		if t == eventType {
			valid = true
			break
		}
	}

	Assert(
		valid,
		"telemetry_event_type_invalid",
		fmt.Sprintf("Invalid telemetry event type: %s", eventType),
		map[string]interface{}{
			"event_type":  eventType,
			"valid_types": validTypes,
		},
	)
}

// AssertTelemetryTimestampValid verifica se timestamp do evento é válido
// WARNING: Timestamp muito antigo ou futuro pode indicar problema
func AssertTelemetryTimestampValid(timestamp time.Time, maxAge, maxFuture time.Duration) {
	now := time.Now()
	age := now.Sub(timestamp)
	
	Assert(
		age <= maxAge && age >= -maxFuture,
		"telemetry_timestamp_invalid",
		fmt.Sprintf("Telemetry timestamp out of range (age: %v)", age),
		map[string]interface{}{
			"timestamp":  timestamp,
			"now":        now,
			"age":        age.String(),
			"max_age":    maxAge.String(),
			"max_future": maxFuture.String(),
		},
	)
}

// ========================================
// SESSION MANAGEMENT
// ========================================

// AssertSessionNotZombie verifica se sessão não é zumbi
// WARNING: Sessão zumbi deve ser limpa
func AssertSessionNotZombie(sessionID string, lastSeenAt time.Time, timeout time.Duration) {
	age := time.Since(lastSeenAt)
	
	Assert(
		age <= timeout,
		"telemetry_session_zombie",
		fmt.Sprintf("Session %s is zombie (last seen: %v ago)", sessionID, age),
		map[string]interface{}{
			"session_id":   sessionID,
			"last_seen_at": lastSeenAt,
			"age":          age.String(),
			"timeout":      timeout.String(),
		},
	)
}

// AssertSessionDurationValid verifica se duração da sessão é válida
// WARNING: Duração negativa ou muito longa pode indicar bug
func AssertSessionDurationValid(sessionID string, duration time.Duration, maxDuration time.Duration) {
	Assert(
		duration >= 0 && duration <= maxDuration,
		"telemetry_session_duration_invalid",
		fmt.Sprintf("Session %s has invalid duration: %v", sessionID, duration),
		map[string]interface{}{
			"session_id":   sessionID,
			"duration":     duration.String(),
			"max_duration": maxDuration.String(),
		},
	)
}

// AssertSessionStartBeforeEnd verifica se início é antes do fim
// CRITICAL: Sessão com fim antes do início é inválida
func AssertSessionStartBeforeEnd(sessionID string, startedAt, endedAt time.Time) {
	AssertCritical(
		endedAt.After(startedAt) || endedAt.Equal(startedAt),
		"telemetry_session_time_paradox",
		fmt.Sprintf("Session %s ended before it started", sessionID),
		map[string]interface{}{
			"session_id": sessionID,
			"started_at": startedAt,
			"ended_at":   endedAt,
		},
	)
}

// NOTA: AssertSessionBelongsToApp já existe em application_invariants.go

// ========================================
// METRICS CONSISTENCY
// ========================================

// AssertMetricsNonNegative verifica se métricas não são negativas
// CRITICAL: Métricas negativas indicam corrupção de dados
func AssertMetricsNonNegative(metricName string, value int64) {
	AssertCritical(
		value >= 0,
		"telemetry_metric_negative",
		fmt.Sprintf("Metric %s has negative value: %d", metricName, value),
		map[string]interface{}{
			"metric_name": metricName,
			"value":       value,
		},
	)
}

// AssertMetricsConsistent verifica se métricas são consistentes entre si
// WARNING: Inconsistência pode indicar bug no cálculo
func AssertMetricsConsistent(activeUsers, totalUsers int64) {
	Assert(
		activeUsers <= totalUsers,
		"telemetry_metrics_inconsistent",
		fmt.Sprintf("Active users (%d) > total users (%d)", activeUsers, totalUsers),
		map[string]interface{}{
			"active_users": activeUsers,
			"total_users":  totalUsers,
		},
	)
}

// AssertOnlineCountValid verifica se contagem de online é válida
// WARNING: Online muito alto pode indicar sessões zumbi
func AssertOnlineCountValid(appID string, onlineNow, activeSessions int64) {
	Assert(
		onlineNow <= activeSessions,
		"telemetry_online_exceeds_active",
		fmt.Sprintf("App %s: online (%d) > active sessions (%d)", appID, onlineNow, activeSessions),
		map[string]interface{}{
			"app_id":          appID,
			"online_now":      onlineNow,
			"active_sessions": activeSessions,
		},
	)
}

// AssertEventsPerMinuteValid verifica se taxa de eventos é válida
// WARNING: Taxa muito alta pode indicar spam ou loop
func AssertEventsPerMinuteValid(appID string, eventsPerMinute, maxEventsPerMinute float64) {
	Assert(
		eventsPerMinute <= maxEventsPerMinute,
		"telemetry_events_rate_high",
		fmt.Sprintf("App %s: events/min (%.2f) exceeds max (%.2f)", appID, eventsPerMinute, maxEventsPerMinute),
		map[string]interface{}{
			"app_id":              appID,
			"events_per_minute":   eventsPerMinute,
			"max_events_per_minute": maxEventsPerMinute,
		},
	)
}

// ========================================
// ALERT VALIDATION
// ========================================

// AssertAlertSeverityValid verifica se severidade do alerta é válida
// WARNING: Severidade inválida pode causar problemas de priorização
func AssertAlertSeverityValid(alertID, severity string, validSeverities []string) {
	valid := false
	for _, s := range validSeverities {
		if s == severity {
			valid = true
			break
		}
	}

	Assert(
		valid,
		"telemetry_alert_severity_invalid",
		fmt.Sprintf("Alert %s has invalid severity: %s", alertID, severity),
		map[string]interface{}{
			"alert_id":         alertID,
			"severity":         severity,
			"valid_severities": validSeverities,
		},
	)
}

// AssertAlertNotDuplicate verifica se alerta não é duplicado
// WARNING: Alertas duplicados causam spam
func AssertAlertNotDuplicate(alertType, appID string, lastAlertTime time.Time, debounceWindow time.Duration) {
	timeSinceLastAlert := time.Since(lastAlertTime)
	
	Assert(
		timeSinceLastAlert >= debounceWindow,
		"telemetry_alert_duplicate",
		fmt.Sprintf("Alert %s for app %s is duplicate (last: %v ago)", alertType, appID, timeSinceLastAlert),
		map[string]interface{}{
			"alert_type":      alertType,
			"app_id":          appID,
			"time_since_last": timeSinceLastAlert.String(),
			"debounce_window": debounceWindow.String(),
		},
	)
}

// AssertAlertDataValid verifica se dados do alerta são válidos
// WARNING: Dados inválidos dificultam diagnóstico
func AssertAlertDataValid(alertID string, data map[string]interface{}) {
	Assert(
		data != nil && len(data) > 0,
		"telemetry_alert_data_empty",
		fmt.Sprintf("Alert %s has empty data", alertID),
		map[string]interface{}{
			"alert_id": alertID,
		},
	)
}

// ========================================
// DATA INTEGRITY
// ========================================

// AssertEventCountConsistent verifica se contagem de eventos é consistente
// WARNING: Inconsistência pode indicar perda de dados
func AssertEventCountConsistent(appID string, sessionEventCount, totalEventCount int64) {
	Assert(
		sessionEventCount <= totalEventCount,
		"telemetry_event_count_inconsistent",
		fmt.Sprintf("App %s: session events (%d) > total events (%d)", appID, sessionEventCount, totalEventCount),
		map[string]interface{}{
			"app_id":              appID,
			"session_event_count": sessionEventCount,
			"total_event_count":   totalEventCount,
		},
	)
}

// AssertSnapshotFresh verifica se snapshot de métricas está atualizado
// WARNING: Snapshot desatualizado pode mostrar dados incorretos
func AssertSnapshotFresh(appID string, lastUpdated time.Time, maxAge time.Duration) {
	age := time.Since(lastUpdated)
	
	Assert(
		age <= maxAge,
		"telemetry_snapshot_stale",
		fmt.Sprintf("App %s metrics snapshot is stale (age: %v)", appID, age),
		map[string]interface{}{
			"app_id":       appID,
			"last_updated": lastUpdated,
			"age":          age.String(),
			"max_age":      maxAge.String(),
		},
	)
}

// AssertRetentionDataValid verifica se dados de retenção são válidos
// WARNING: Retenção > 100% é impossível
func AssertRetentionDataValid(date string, retention float64) {
	Assert(
		retention >= 0 && retention <= 100,
		"telemetry_retention_invalid",
		fmt.Sprintf("Retention for %s is invalid: %.2f%%", date, retention),
		map[string]interface{}{
			"date":      date,
			"retention": retention,
		},
	)
}

// ========================================
// RATE LIMITING
// ========================================

// AssertIngestionRateValid verifica se taxa de ingestão está dentro do limite
// CRITICAL: Taxa muito alta pode sobrecarregar o sistema
func AssertIngestionRateValid(appID string, currentRate, maxRate int64, window time.Duration) {
	AssertCritical(
		currentRate <= maxRate,
		"telemetry_ingestion_rate_exceeded",
		fmt.Sprintf("App %s exceeded ingestion rate (%d/%d in %v)", appID, currentRate, maxRate, window),
		map[string]interface{}{
			"app_id":       appID,
			"current_rate": currentRate,
			"max_rate":     maxRate,
			"window":       window.String(),
		},
	)
}

// AssertBatchSizeValid verifica se tamanho do batch é válido
// WARNING: Batch muito grande pode causar timeout
func AssertBatchSizeValid(batchSize, maxBatchSize int) {
	Assert(
		batchSize <= maxBatchSize,
		"telemetry_batch_too_large",
		fmt.Sprintf("Batch size %d exceeds max %d", batchSize, maxBatchSize),
		map[string]interface{}{
			"batch_size":     batchSize,
			"max_batch_size": maxBatchSize,
		},
	)
}


// ========================================
// SYSTEM THROUGHPUT SANITY
// ========================================

// AssertSystemThroughputSanity verifica se o sistema está processando eventos
// WARNING: Silêncio total por 5 minutos é anomalia de telemetria
func AssertSystemThroughputSanity(eventsInWindow int64, windowMinutes int, minExpectedEvents int64) {
	Assert(
		eventsInWindow >= minExpectedEvents,
		"telemetry_system_silence",
		fmt.Sprintf("Sistema processou apenas %d eventos em %d minutos (mínimo esperado: %d)", eventsInWindow, windowMinutes, minExpectedEvents),
		map[string]interface{}{
			"events_in_window":    eventsInWindow,
			"window_minutes":      windowMinutes,
			"min_expected_events": minExpectedEvents,
			"status":              "ANOMALIA - Sistema pode estar morto ou desconectado",
		},
	)
}

// TelemetryThroughputChecker verifica throughput do sistema
type TelemetryThroughputChecker struct {
	lastEventCount int64
	lastCheckTime  time.Time
}

// NewTelemetryThroughputChecker cria novo checker
func NewTelemetryThroughputChecker() *TelemetryThroughputChecker {
	return &TelemetryThroughputChecker{
		lastEventCount: 0,
		lastCheckTime:  time.Now(),
	}
}

// CheckThroughput verifica se há throughput mínimo
func (c *TelemetryThroughputChecker) CheckThroughput(currentEventCount int64, minEventsPerWindow int64, windowMinutes int) (bool, string, map[string]interface{}) {
	now := time.Now()
	elapsed := now.Sub(c.lastCheckTime)
	
	// Só verifica se passou tempo suficiente
	if elapsed < time.Duration(windowMinutes)*time.Minute {
		return true, "Aguardando janela de tempo", nil
	}
	
	eventsInWindow := currentEventCount - c.lastEventCount
	
	// Atualiza para próxima verificação
	c.lastEventCount = currentEventCount
	c.lastCheckTime = now
	
	if eventsInWindow < minEventsPerWindow {
		return false, fmt.Sprintf("ALERTA: Sistema silencioso - apenas %d eventos em %d minutos", eventsInWindow, windowMinutes), map[string]interface{}{
			"events_in_window":    eventsInWindow,
			"window_minutes":      windowMinutes,
			"min_expected_events": minEventsPerWindow,
			"elapsed":             elapsed.String(),
			"action":              "INVESTIGAR - possível falha de conectividade ou sistema morto",
		}
	}
	
	return true, fmt.Sprintf("Throughput OK: %d eventos em %d minutos", eventsInWindow, windowMinutes), nil
}
