package alerting

import (
	"context"
	"log"
	"sync"
	"time"

	"prost-qs/backend/pkg/warobs"
)

// ========================================
// ALERT MONITOR
// "Vigilância contínua do sistema"
// ========================================

// AlertMonitor continuously monitors system health and fires alerts
type AlertMonitor struct {
	engine       *AlertEngine
	warObs       *warobs.WarObservability
	interval     time.Duration
	stopChan     chan struct{}
	running      bool
	mu           sync.Mutex
}

// MonitorConfig holds monitor configuration
type MonitorConfig struct {
	Interval time.Duration
}

// DefaultMonitorConfig returns default monitor configuration
func DefaultMonitorConfig() MonitorConfig {
	return MonitorConfig{
		Interval: 30 * time.Second,
	}
}

// NewAlertMonitor creates a new alert monitor
func NewAlertMonitor(engine *AlertEngine, warObs *warobs.WarObservability, config MonitorConfig) *AlertMonitor {
	if config.Interval == 0 {
		config.Interval = 30 * time.Second
	}

	return &AlertMonitor{
		engine:   engine,
		warObs:   warObs,
		interval: config.Interval,
		stopChan: make(chan struct{}),
	}
}

// Start begins the monitoring loop
func (m *AlertMonitor) Start(ctx context.Context) {
	m.mu.Lock()
	if m.running {
		m.mu.Unlock()
		return
	}
	m.running = true
	m.mu.Unlock()

	log.Printf("[ALERT MONITOR] Starting with interval %v", m.interval)

	ticker := time.NewTicker(m.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			m.Stop()
			return
		case <-m.stopChan:
			return
		case <-ticker.C:
			m.check()
		}
	}
}

// Stop stops the monitoring loop
func (m *AlertMonitor) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.running {
		return
	}

	close(m.stopChan)
	m.running = false
	log.Println("[ALERT MONITOR] Stopped")
}

// check performs a single monitoring check
func (m *AlertMonitor) check() {
	// Get current system state
	dashboard := m.warObs.GetDashboard()

	// Check pressure
	m.checkPressure(dashboard.Pressure)

	// Check error rate
	m.checkErrorRate(dashboard.GlobalStats)

	// Check SLO status
	m.checkSLOStatus(dashboard.SLOStatus)

	// Check error budget
	m.checkErrorBudget(dashboard.ErrorBudget)
}

// checkPressure checks system pressure and fires alerts
func (m *AlertMonitor) checkPressure(pressure *warobs.PressureReport) {
	if pressure == nil {
		return
	}

	// Map pressure level to numeric value
	levelValue := map[warobs.PressureLevel]float64{
		warobs.PressureNormal:   0,
		warobs.PressureElevated: 1,
		warobs.PressureHigh:     2,
		warobs.PressureCritical: 3,
	}

	overallValue := levelValue[pressure.OverallLevel]

	// Check elevated pressure
	if overallValue >= 1 {
		m.engine.FireFromRule("pressure_elevated", overallValue, "monitor", map[string]string{
			"level":   string(pressure.OverallLevel),
			"message": pressure.OverallMessage,
		})
	}

	// Check critical pressure
	if overallValue >= 3 {
		m.engine.FireFromRule("pressure_critical", overallValue, "monitor", map[string]string{
			"level":   string(pressure.OverallLevel),
			"message": pressure.OverallMessage,
		})
	}

	// Check individual components
	for name, comp := range pressure.Components {
		compValue := levelValue[comp.Level]
		if compValue >= 2 { // High or Critical
			m.engine.Fire(
				AlertTypePressure,
				m.severityFromPressure(comp.Level),
				"component_pressure_"+name,
				comp.Message,
				"monitor/"+name,
				comp.Value,
				0,
				map[string]string{
					"component": name,
					"level":     string(comp.Level),
				},
			)
		}
	}
}

// checkErrorRate checks error rate and fires alerts
func (m *AlertMonitor) checkErrorRate(stats *warobs.GlobalStats) {
	if stats == nil {
		return
	}

	errorRate := stats.ErrorRate

	// Check high error rate
	if errorRate >= 10 {
		m.engine.FireFromRule("high_error_rate", errorRate, "monitor", map[string]string{
			"total_requests": formatInt64(stats.TotalRequests),
			"total_errors":   formatInt64(stats.TotalErrors),
		})
	}

	// Check critical error rate
	if errorRate >= 25 {
		m.engine.FireFromRule("critical_error_rate", errorRate, "monitor", map[string]string{
			"total_requests": formatInt64(stats.TotalRequests),
			"total_errors":   formatInt64(stats.TotalErrors),
		})
	}
}

// checkSLOStatus checks SLO compliance and fires alerts
func (m *AlertMonitor) checkSLOStatus(sloStatus map[string]*warobs.SLOStatus) {
	if sloStatus == nil {
		return
	}

	for name, status := range sloStatus {
		if status == nil {
			continue
		}

		// Check if SLO is violated
		if !status.Compliance {
			severity := SeverityWarning
			if status.Status == "critical" {
				severity = SeverityCritical
			}

			m.engine.Fire(
				AlertTypeSLO,
				severity,
				"slo_violation_"+name,
				status.Message,
				"monitor/slo",
				status.CurrentValue,
				status.Target,
				map[string]string{
					"slo_name":     name,
					"status":       status.Status,
					"error_budget": formatFloat(status.ErrorBudget),
					"burn_rate":    formatFloat(status.BurnRate),
				},
			)
		}

		// Check high burn rate
		if status.BurnRate > 2.0 {
			m.engine.Fire(
				AlertTypeSLO,
				SeverityWarning,
				"slo_high_burn_rate_"+name,
				"Error budget being consumed faster than expected",
				"monitor/slo",
				status.BurnRate,
				1.0,
				map[string]string{
					"slo_name":     name,
					"error_budget": formatFloat(status.ErrorBudget),
				},
			)
		}
	}
}

// checkErrorBudget checks error budget and fires alerts
func (m *AlertMonitor) checkErrorBudget(budget *warobs.ErrorBudgetSummary) {
	if budget == nil {
		return
	}

	// Check average budget
	if budget.AverageBudget <= 25 {
		m.engine.FireFromRule("slo_budget_low", budget.AverageBudget, "monitor", map[string]string{
			"overall_health": budget.OverallHealth,
		})
	}

	if budget.AverageBudget <= 0 {
		m.engine.FireFromRule("slo_budget_exhausted", budget.AverageBudget, "monitor", map[string]string{
			"overall_health": budget.OverallHealth,
		})
	}

	// Check individual SLO budgets
	for _, item := range budget.SLOs {
		if item.BudgetPercent <= 10 {
			m.engine.Fire(
				AlertTypeSLO,
				SeverityCritical,
				"slo_budget_critical_"+item.Name,
				"Error budget nearly exhausted",
				"monitor/slo",
				item.BudgetPercent,
				10.0,
				map[string]string{
					"slo_name": item.Name,
					"status":   item.Status,
				},
			)
		}
	}
}

// severityFromPressure maps pressure level to alert severity
func (m *AlertMonitor) severityFromPressure(level warobs.PressureLevel) AlertSeverity {
	switch level {
	case warobs.PressureCritical:
		return SeverityEmergency
	case warobs.PressureHigh:
		return SeverityCritical
	case warobs.PressureElevated:
		return SeverityWarning
	default:
		return SeverityInfo
	}
}

// ========================================
// ATTACK MONITOR
// "Detectar ataques em tempo real"
// ========================================

// AttackMonitor monitors for attack patterns
type AttackMonitor struct {
	engine   *AlertEngine
	stopChan chan struct{}
	running  bool
	mu       sync.Mutex

	// Attack detection state
	recentBlocks     []time.Time
	blockThreshold   int
	blockWindow      time.Duration
}

// NewAttackMonitor creates a new attack monitor
func NewAttackMonitor(engine *AlertEngine) *AttackMonitor {
	return &AttackMonitor{
		engine:         engine,
		stopChan:       make(chan struct{}),
		recentBlocks:   make([]time.Time, 0),
		blockThreshold: 10,           // 10 blocks
		blockWindow:    time.Minute,  // in 1 minute
	}
}

// RecordBlock records a blocked request (call from API Gate)
func (m *AttackMonitor) RecordBlock(reason, source string, details map[string]string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	m.recentBlocks = append(m.recentBlocks, now)

	// Clean old blocks
	cutoff := now.Add(-m.blockWindow)
	newBlocks := make([]time.Time, 0)
	for _, t := range m.recentBlocks {
		if t.After(cutoff) {
			newBlocks = append(newBlocks, t)
		}
	}
	m.recentBlocks = newBlocks

	// Check if threshold exceeded
	if len(m.recentBlocks) >= m.blockThreshold {
		m.engine.Fire(
			AlertTypeAttack,
			SeverityCritical,
			"attack_detected",
			"High volume of blocked requests detected",
			source,
			float64(len(m.recentBlocks)),
			float64(m.blockThreshold),
			details,
		)
	}
}

// ========================================
// CIRCUIT BREAKER MONITOR
// "Alertar quando circuitos abrem"
// ========================================

// CircuitBreakerAlert fires an alert when a circuit breaker opens
func CircuitBreakerAlert(engine *AlertEngine, serviceName string, failureCount int, threshold int) {
	engine.Fire(
		AlertTypeCircuitOpen,
		SeverityCritical,
		"circuit_breaker_open",
		"Circuit breaker opened due to failures",
		serviceName,
		float64(failureCount),
		float64(threshold),
		map[string]string{
			"service": serviceName,
		},
	)
}

// CircuitBreakerResolve resolves circuit breaker alert
func CircuitBreakerResolve(engine *AlertEngine, serviceName string) {
	dedupKey := "circuit_open:" + serviceName + ":circuit_breaker_open"
	engine.ResolveByKey(dedupKey)
}

// ========================================
// QUARANTINE MONITOR
// "Alertar quando entidades são quarentenadas"
// ========================================

// QuarantineAlert fires an alert when an entity is quarantined
func QuarantineAlert(engine *AlertEngine, entityType, entityID, reason string) {
	engine.Fire(
		AlertTypeQuarantine,
		SeverityWarning,
		"entity_quarantined",
		reason,
		"quarantine/"+entityType,
		1,
		0,
		map[string]string{
			"entity_type": entityType,
			"entity_id":   entityID,
		},
	)
}

// ========================================
// HELPER FUNCTIONS
// ========================================

func formatInt64(n int64) string {
	return string(rune(n))
}

func formatFloat(f float64) string {
	return string(rune(int(f * 100)))
}

// ========================================
// GLOBAL MONITOR
// ========================================

var (
	globalMonitor *AlertMonitor
	monitorOnce   sync.Once
)

// GetAlertMonitor returns the global alert monitor
func GetAlertMonitor() *AlertMonitor {
	monitorOnce.Do(func() {
		globalMonitor = NewAlertMonitor(
			GetAlertEngine(),
			warobs.GetWarObservability(),
			DefaultMonitorConfig(),
		)
	})
	return globalMonitor
}

// StartGlobalMonitor starts the global alert monitor
func StartGlobalMonitor(ctx context.Context) {
	go GetAlertMonitor().Start(ctx)
}
