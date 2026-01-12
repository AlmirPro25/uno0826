package alerting

import (
	"fmt"
	"strings"
	"sync/atomic"
)

// ========================================
// PROMETHEUS METRICS
// "Métricas para scraping"
// ========================================

// AlertMetrics holds Prometheus-compatible metrics
type AlertMetrics struct {
	// Counters
	AlertsFired    int64
	AlertsResolved int64
	AlertsAcked    int64

	// By severity
	FiredBySeverity map[AlertSeverity]*int64

	// By type
	FiredByType map[AlertType]*int64

	// Gauges
	ActiveAlerts int64
}

var globalMetrics = &AlertMetrics{
	FiredBySeverity: make(map[AlertSeverity]*int64),
	FiredByType:     make(map[AlertType]*int64),
}

func init() {
	// Initialize severity counters
	for _, sev := range []AlertSeverity{SeverityInfo, SeverityWarning, SeverityCritical, SeverityEmergency} {
		var counter int64
		globalMetrics.FiredBySeverity[sev] = &counter
	}

	// Initialize type counters
	for _, t := range []AlertType{AlertTypePressure, AlertTypeSLO, AlertTypeErrorRate, AlertTypeLatency, AlertTypeAttack, AlertTypeCircuitOpen, AlertTypeQuarantine, AlertTypeMemory, AlertTypeCustom} {
		var counter int64
		globalMetrics.FiredByType[t] = &counter
	}
}

// RecordAlertFired records an alert being fired
func RecordAlertFired(severity AlertSeverity, alertType AlertType) {
	atomic.AddInt64(&globalMetrics.AlertsFired, 1)
	atomic.AddInt64(&globalMetrics.ActiveAlerts, 1)

	if counter, ok := globalMetrics.FiredBySeverity[severity]; ok {
		atomic.AddInt64(counter, 1)
	}
	if counter, ok := globalMetrics.FiredByType[alertType]; ok {
		atomic.AddInt64(counter, 1)
	}
}

// RecordAlertResolved records an alert being resolved
func RecordAlertResolved() {
	atomic.AddInt64(&globalMetrics.AlertsResolved, 1)
	atomic.AddInt64(&globalMetrics.ActiveAlerts, -1)
}

// RecordAlertAcked records an alert being acknowledged
func RecordAlertAcked() {
	atomic.AddInt64(&globalMetrics.AlertsAcked, 1)
}

// GetPrometheusMetrics returns metrics in Prometheus format
func GetPrometheusMetrics() string {
	var sb strings.Builder

	// Help and type declarations
	sb.WriteString("# HELP alerting_alerts_fired_total Total number of alerts fired\n")
	sb.WriteString("# TYPE alerting_alerts_fired_total counter\n")
	sb.WriteString(fmt.Sprintf("alerting_alerts_fired_total %d\n", atomic.LoadInt64(&globalMetrics.AlertsFired)))

	sb.WriteString("# HELP alerting_alerts_resolved_total Total number of alerts resolved\n")
	sb.WriteString("# TYPE alerting_alerts_resolved_total counter\n")
	sb.WriteString(fmt.Sprintf("alerting_alerts_resolved_total %d\n", atomic.LoadInt64(&globalMetrics.AlertsResolved)))

	sb.WriteString("# HELP alerting_alerts_acked_total Total number of alerts acknowledged\n")
	sb.WriteString("# TYPE alerting_alerts_acked_total counter\n")
	sb.WriteString(fmt.Sprintf("alerting_alerts_acked_total %d\n", atomic.LoadInt64(&globalMetrics.AlertsAcked)))

	sb.WriteString("# HELP alerting_active_alerts Current number of active alerts\n")
	sb.WriteString("# TYPE alerting_active_alerts gauge\n")
	sb.WriteString(fmt.Sprintf("alerting_active_alerts %d\n", atomic.LoadInt64(&globalMetrics.ActiveAlerts)))

	// By severity
	sb.WriteString("# HELP alerting_alerts_fired_by_severity_total Alerts fired by severity\n")
	sb.WriteString("# TYPE alerting_alerts_fired_by_severity_total counter\n")
	for sev, counter := range globalMetrics.FiredBySeverity {
		sb.WriteString(fmt.Sprintf("alerting_alerts_fired_by_severity_total{severity=\"%s\"} %d\n", sev, atomic.LoadInt64(counter)))
	}

	// By type
	sb.WriteString("# HELP alerting_alerts_fired_by_type_total Alerts fired by type\n")
	sb.WriteString("# TYPE alerting_alerts_fired_by_type_total counter\n")
	for t, counter := range globalMetrics.FiredByType {
		sb.WriteString(fmt.Sprintf("alerting_alerts_fired_by_type_total{type=\"%s\"} %d\n", t, atomic.LoadInt64(counter)))
	}

	return sb.String()
}

// GetMetricsJSON returns metrics as JSON
func GetMetricsJSON() map[string]interface{} {
	bySeverity := make(map[string]int64)
	for sev, counter := range globalMetrics.FiredBySeverity {
		bySeverity[string(sev)] = atomic.LoadInt64(counter)
	}

	byType := make(map[string]int64)
	for t, counter := range globalMetrics.FiredByType {
		byType[string(t)] = atomic.LoadInt64(counter)
	}

	return map[string]interface{}{
		"alerts_fired_total":    atomic.LoadInt64(&globalMetrics.AlertsFired),
		"alerts_resolved_total": atomic.LoadInt64(&globalMetrics.AlertsResolved),
		"alerts_acked_total":    atomic.LoadInt64(&globalMetrics.AlertsAcked),
		"active_alerts":         atomic.LoadInt64(&globalMetrics.ActiveAlerts),
		"by_severity":           bySeverity,
		"by_type":               byType,
	}
}

// ResetMetrics resets all metrics (for testing)
func ResetMetrics() {
	atomic.StoreInt64(&globalMetrics.AlertsFired, 0)
	atomic.StoreInt64(&globalMetrics.AlertsResolved, 0)
	atomic.StoreInt64(&globalMetrics.AlertsAcked, 0)
	atomic.StoreInt64(&globalMetrics.ActiveAlerts, 0)

	for _, counter := range globalMetrics.FiredBySeverity {
		atomic.StoreInt64(counter, 0)
	}
	for _, counter := range globalMetrics.FiredByType {
		atomic.StoreInt64(counter, 0)
	}
}
