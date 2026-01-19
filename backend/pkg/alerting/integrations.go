package alerting

import (
	"fmt"
	"sync"
)

// ========================================
// INTEGRATIONS
// "Conectando alertas com outros sistemas"
// ========================================

// Global attack monitor for API Gate integration
var (
	globalAttackMonitor *AttackMonitor
	attackMonitorOnce   sync.Once
)

// GetAttackMonitor returns the global attack monitor
func GetAttackMonitor() *AttackMonitor {
	attackMonitorOnce.Do(func() {
		globalAttackMonitor = NewAttackMonitor(GetAlertEngine())
	})
	return globalAttackMonitor
}

// RecordAPIGateBlock records a block from API Gate
// Call this from API Gate when a request is blocked
func RecordAPIGateBlock(reason, clientIP, path string, details map[string]string) {
	if details == nil {
		details = make(map[string]string)
	}
	details["client_ip"] = clientIP
	details["path"] = path
	details["reason"] = reason

	GetAttackMonitor().RecordBlock(reason, "api_gate", details)
}

// RecordSQLInjectionAttempt records a SQL injection attempt
func RecordSQLInjectionAttempt(clientIP, path, payload string) {
	RecordAPIGateBlock("sql_injection", clientIP, path, map[string]string{
		"attack_type": "sql_injection",
		"payload":     truncate(payload, 100),
	})
}

// RecordXSSAttempt records an XSS attempt
func RecordXSSAttempt(clientIP, path, payload string) {
	RecordAPIGateBlock("xss", clientIP, path, map[string]string{
		"attack_type": "xss",
		"payload":     truncate(payload, 100),
	})
}

// RecordPathTraversalAttempt records a path traversal attempt
func RecordPathTraversalAttempt(clientIP, path string) {
	RecordAPIGateBlock("path_traversal", clientIP, path, map[string]string{
		"attack_type": "path_traversal",
	})
}

// RecordPayloadTooLarge records an oversized payload
func RecordPayloadTooLarge(clientIP, path string, size int64) {
	RecordAPIGateBlock("payload_too_large", clientIP, path, map[string]string{
		"attack_type": "payload_too_large",
		"size":        string(rune(size)),
	})
}

// RecordRateLimitExceeded records a rate limit violation
func RecordRateLimitExceeded(clientIP, path string) {
	RecordAPIGateBlock("rate_limit", clientIP, path, map[string]string{
		"attack_type": "rate_limit",
	})
}

// ========================================
// IMMUNITY SYSTEM INTEGRATION
// ========================================

// AlertFromImmunity fires an alert from the immunity system
func AlertFromImmunity(alertType AlertType, severity AlertSeverity, title, message, source string, context map[string]string) *Alert {
	return GetAlertEngine().Fire(
		alertType,
		severity,
		title,
		message,
		"immunity/"+source,
		0,
		0,
		context,
	)
}

// AlertCircuitBreakerOpened fires alert when circuit breaker opens
func AlertCircuitBreakerOpened(serviceName string, failureCount, threshold int) {
	CircuitBreakerAlert(GetAlertEngine(), serviceName, failureCount, threshold)
}

// AlertCircuitBreakerClosed resolves circuit breaker alert
func AlertCircuitBreakerClosed(serviceName string) {
	CircuitBreakerResolve(GetAlertEngine(), serviceName)
}

// AlertEntityQuarantined fires alert when entity is quarantined
func AlertEntityQuarantined(entityType, entityID, reason string) {
	QuarantineAlert(GetAlertEngine(), entityType, entityID, reason)
}

// ========================================
// BILLING INTEGRATION
// ========================================

// AlertBillingAnomaly fires alert for billing anomalies
func AlertBillingAnomaly(appID, description string, amount float64) {
	GetAlertEngine().Fire(
		AlertTypeCustom,
		SeverityCritical,
		"billing_anomaly",
		description,
		"billing/"+appID,
		amount,
		0,
		map[string]string{
			"app_id": appID,
		},
	)
}

// AlertPaymentFailed fires alert for payment failures
func AlertPaymentFailed(appID, paymentID, reason string) {
	GetAlertEngine().Fire(
		AlertTypeCustom,
		SeverityWarning,
		"payment_failed",
		reason,
		"billing/"+appID,
		0,
		0,
		map[string]string{
			"app_id":     appID,
			"payment_id": paymentID,
		},
	)
}

// ========================================
// INVARIANT INTEGRATION
// ========================================

// AlertInvariantViolation fires alert for invariant violations
func AlertInvariantViolation(invariantName, message string, severity AlertSeverity, context map[string]string) {
	GetAlertEngine().Fire(
		AlertTypeCustom,
		severity,
		"invariant_violation_"+invariantName,
		message,
		"invariants",
		0,
		0,
		context,
	)
}

// ========================================
// MCP SOVEREIGN KERNEL INTEGRATION
// ========================================

// AlertDefconChanged fires alert when DEFCON level changes
func AlertDefconChanged(level int, levelName, reason string) {
	severity := SeverityWarning
	if level <= 2 {
		severity = SeverityCritical
	} else if level == 1 {
		severity = SeverityEmergency
	}

	GetAlertEngine().Fire(
		AlertTypeCustom,
		severity,
		"defcon_level_changed",
		fmt.Sprintf("DEFCON Level changed to %d (%s)", level, levelName),
		"mcp/kernel",
		float64(level),
		5,
		map[string]string{
			"level":      fmt.Sprintf("%d", level),
			"level_name": levelName,
			"reason":     reason,
		},
	)
}

// AlertKillSwitchStatus fires alert when kill switch is activated or deactivated
func AlertKillSwitchStatus(active bool, reason string) {
	title := "KILL SWITCH ACTIVATED"
	severity := SeverityEmergency
	if !active {
		title = "KILL SWITCH DEACTIVATED"
		severity = SeverityWarning
	}

	GetAlertEngine().Fire(
		AlertTypeCustom,
		severity,
		title,
		reason,
		"mcp/kernel",
		1,
		0,
		map[string]string{
			"status": fmt.Sprintf("%v", active),
			"reason": reason,
		},
	)
}

// AlertAgentBreakerOpened fires alert when an agent's circuit breaker opens
func AlertAgentBreakerOpened(agentID, reason string) {
	GetAlertEngine().Fire(
		AlertTypeCustom,
		SeverityCritical,
		"agent_breaker_opened",
		fmt.Sprintf("Circuit breaker opened for agent: %s", agentID),
		"mcp/dispatcher",
		1,
		0,
		map[string]string{
			"agent_id": agentID,
			"reason":   reason,
		},
	)
}

// ========================================
// HELPERS
// ========================================

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
