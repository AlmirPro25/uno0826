package alerting

import (
	"sync"
	"testing"
	"time"
)

// ========================================
// ALERT ENGINE TESTS
// ========================================

func TestNewAlertEngine(t *testing.T) {
	engine := NewAlertEngine()

	if engine == nil {
		t.Fatal("Expected non-nil engine")
	}

	// Check default rules are loaded
	rules := engine.GetRules()
	if len(rules) == 0 {
		t.Error("Expected default rules to be loaded")
	}

	// Check specific default rules
	expectedRules := []string{
		"high_error_rate",
		"critical_error_rate",
		"high_latency",
		"critical_latency",
		"slo_budget_low",
		"slo_budget_exhausted",
		"pressure_elevated",
		"pressure_critical",
		"memory_high",
		"memory_critical",
	}

	for _, name := range expectedRules {
		if engine.GetRule(name) == nil {
			t.Errorf("Expected default rule %s to exist", name)
		}
	}
}

func TestAlertEngine_Fire(t *testing.T) {
	engine := NewAlertEngine()

	alert := engine.Fire(
		AlertTypeErrorRate,
		SeverityWarning,
		"test_alert",
		"Test message",
		"test_source",
		15.0,
		10.0,
		map[string]string{"env": "test"},
	)

	if alert == nil {
		t.Fatal("Expected alert to be created")
	}

	if alert.Type != AlertTypeErrorRate {
		t.Errorf("Expected type %s, got %s", AlertTypeErrorRate, alert.Type)
	}

	if alert.Severity != SeverityWarning {
		t.Errorf("Expected severity %s, got %s", SeverityWarning, alert.Severity)
	}

	if alert.Title != "test_alert" {
		t.Errorf("Expected title 'test_alert', got '%s'", alert.Title)
	}

	if alert.Value != 15.0 {
		t.Errorf("Expected value 15.0, got %f", alert.Value)
	}

	if alert.Count != 1 {
		t.Errorf("Expected count 1, got %d", alert.Count)
	}

	// Check alert is in active alerts
	active := engine.GetActiveAlerts()
	if len(active) != 1 {
		t.Errorf("Expected 1 active alert, got %d", len(active))
	}
}

func TestAlertEngine_Deduplication(t *testing.T) {
	engine := NewAlertEngine()

	// Fire same alert twice quickly
	alert1 := engine.Fire(
		AlertTypeErrorRate,
		SeverityWarning,
		"dedup_test",
		"Test message",
		"test_source",
		15.0,
		10.0,
		nil,
	)

	alert2 := engine.Fire(
		AlertTypeErrorRate,
		SeverityWarning,
		"dedup_test",
		"Test message",
		"test_source",
		16.0,
		10.0,
		nil,
	)

	// Second alert should be deduplicated (same alert returned with incremented count)
	if alert1.ID != alert2.ID {
		t.Error("Expected alerts to be deduplicated")
	}

	if alert2.Count != 2 {
		t.Errorf("Expected count 2 after deduplication, got %d", alert2.Count)
	}

	// Should still only have 1 active alert
	active := engine.GetActiveAlerts()
	if len(active) != 1 {
		t.Errorf("Expected 1 active alert after deduplication, got %d", len(active))
	}
}

func TestAlertEngine_Acknowledge(t *testing.T) {
	engine := NewAlertEngine()

	alert := engine.Fire(
		AlertTypeErrorRate,
		SeverityWarning,
		"ack_test",
		"Test message",
		"test_source",
		15.0,
		10.0,
		nil,
	)

	// Acknowledge the alert
	result := engine.Acknowledge(alert.ID, "test_user")
	if !result {
		t.Error("Expected acknowledge to succeed")
	}

	// Check alert is acknowledged
	acked := engine.GetAlert(alert.ID)
	if acked.AckedAt == nil {
		t.Error("Expected AckedAt to be set")
	}
	if acked.AckedBy != "test_user" {
		t.Errorf("Expected AckedBy 'test_user', got '%s'", acked.AckedBy)
	}

	// Acknowledge non-existent alert
	result = engine.Acknowledge("non_existent", "test_user")
	if result {
		t.Error("Expected acknowledge of non-existent alert to fail")
	}
}

func TestAlertEngine_Resolve(t *testing.T) {
	engine := NewAlertEngine()

	alert := engine.Fire(
		AlertTypeErrorRate,
		SeverityWarning,
		"resolve_test",
		"Test message",
		"test_source",
		15.0,
		10.0,
		nil,
	)

	// Resolve the alert
	result := engine.Resolve(alert.ID)
	if !result {
		t.Error("Expected resolve to succeed")
	}

	// Check alert is no longer active
	active := engine.GetActiveAlerts()
	if len(active) != 0 {
		t.Errorf("Expected 0 active alerts after resolve, got %d", len(active))
	}

	// Resolve non-existent alert
	result = engine.Resolve("non_existent")
	if result {
		t.Error("Expected resolve of non-existent alert to fail")
	}
}

func TestAlertEngine_FireFromRule(t *testing.T) {
	engine := NewAlertEngine()

	// Fire from existing rule (high_error_rate threshold is 10%)
	alert := engine.FireFromRule("high_error_rate", 15.0, "test_source", nil)
	if alert == nil {
		t.Fatal("Expected alert to be created from rule")
	}

	if alert.Type != AlertTypeErrorRate {
		t.Errorf("Expected type %s, got %s", AlertTypeErrorRate, alert.Type)
	}

	// Fire with value below threshold (should not create alert)
	engine2 := NewAlertEngine()
	alert2 := engine2.FireFromRule("high_error_rate", 5.0, "test_source", nil)
	if alert2 != nil {
		t.Error("Expected no alert when value is below threshold")
	}

	// Fire from non-existent rule
	alert3 := engine.FireFromRule("non_existent_rule", 15.0, "test_source", nil)
	if alert3 != nil {
		t.Error("Expected no alert from non-existent rule")
	}
}

func TestAlertEngine_RuleManagement(t *testing.T) {
	engine := NewAlertEngine()

	// Add custom rule
	customRule := &AlertRule{
		Name:      "custom_test_rule",
		Type:      AlertTypeCustom,
		Condition: "Custom condition",
		Threshold: 50.0,
		Severity:  SeverityWarning,
		Cooldown:  1 * time.Minute,
		Enabled:   true,
	}

	engine.AddRule(customRule)

	// Check rule exists
	rule := engine.GetRule("custom_test_rule")
	if rule == nil {
		t.Fatal("Expected custom rule to exist")
	}

	if rule.Threshold != 50.0 {
		t.Errorf("Expected threshold 50.0, got %f", rule.Threshold)
	}

	// Disable rule
	engine.DisableRule("custom_test_rule")
	rule = engine.GetRule("custom_test_rule")
	if rule.Enabled {
		t.Error("Expected rule to be disabled")
	}

	// Enable rule
	engine.EnableRule("custom_test_rule")
	rule = engine.GetRule("custom_test_rule")
	if !rule.Enabled {
		t.Error("Expected rule to be enabled")
	}
}

func TestAlertEngine_GetAlertsBySeverity(t *testing.T) {
	engine := NewAlertEngine()

	// Fire alerts with different severities
	engine.Fire(AlertTypeErrorRate, SeverityWarning, "warning1", "msg", "src", 10, 5, nil)
	engine.Fire(AlertTypeErrorRate, SeverityWarning, "warning2", "msg", "src", 10, 5, nil)
	engine.Fire(AlertTypeErrorRate, SeverityCritical, "critical1", "msg", "src", 10, 5, nil)

	warnings := engine.GetAlertsBySeverity(SeverityWarning)
	if len(warnings) != 2 {
		t.Errorf("Expected 2 warning alerts, got %d", len(warnings))
	}

	criticals := engine.GetAlertsBySeverity(SeverityCritical)
	if len(criticals) != 1 {
		t.Errorf("Expected 1 critical alert, got %d", len(criticals))
	}
}

func TestAlertEngine_GetAlertsByType(t *testing.T) {
	engine := NewAlertEngine()

	// Fire alerts with different types
	engine.Fire(AlertTypeErrorRate, SeverityWarning, "error1", "msg", "src", 10, 5, nil)
	engine.Fire(AlertTypeLatency, SeverityWarning, "latency1", "msg", "src", 10, 5, nil)
	engine.Fire(AlertTypeLatency, SeverityWarning, "latency2", "msg", "src", 10, 5, nil)

	errorAlerts := engine.GetAlertsByType(AlertTypeErrorRate)
	if len(errorAlerts) != 1 {
		t.Errorf("Expected 1 error rate alert, got %d", len(errorAlerts))
	}

	latencyAlerts := engine.GetAlertsByType(AlertTypeLatency)
	if len(latencyAlerts) != 2 {
		t.Errorf("Expected 2 latency alerts, got %d", len(latencyAlerts))
	}
}

func TestAlertEngine_History(t *testing.T) {
	engine := NewAlertEngine()

	// Fire multiple DIFFERENT alerts to avoid deduplication
	for i := 0; i < 5; i++ {
		engine.Fire(AlertTypeErrorRate, SeverityWarning, "history_test_"+string(rune('a'+i)), "msg", "src", float64(i), 0, nil)
		time.Sleep(10 * time.Millisecond) // Small delay to ensure different timestamps
	}

	// Get history
	history := engine.GetHistory(3)
	if len(history) != 3 {
		t.Errorf("Expected 3 history items, got %d", len(history))
	}
}

func TestAlertEngine_Stats(t *testing.T) {
	engine := NewAlertEngine()

	// Fire some alerts
	engine.Fire(AlertTypeErrorRate, SeverityWarning, "stats1", "msg", "src", 10, 5, nil)
	engine.Fire(AlertTypeLatency, SeverityCritical, "stats2", "msg", "src", 10, 5, nil)

	stats := engine.GetStats()

	if stats.TotalActive != 2 {
		t.Errorf("Expected 2 active alerts, got %d", stats.TotalActive)
	}

	if stats.BySeverity[SeverityWarning] != 1 {
		t.Errorf("Expected 1 warning, got %d", stats.BySeverity[SeverityWarning])
	}

	if stats.BySeverity[SeverityCritical] != 1 {
		t.Errorf("Expected 1 critical, got %d", stats.BySeverity[SeverityCritical])
	}
}

func TestAlertEngine_Concurrency(t *testing.T) {
	engine := NewAlertEngine()

	var wg sync.WaitGroup
	numGoroutines := 10
	alertsPerGoroutine := 10

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < alertsPerGoroutine; j++ {
				engine.Fire(
					AlertTypeErrorRate,
					SeverityWarning,
					"concurrent_test",
					"msg",
					"src",
					float64(id*100+j),
					0,
					nil,
				)
			}
		}(i)
	}

	wg.Wait()

	// Should have at least 1 alert (due to deduplication)
	active := engine.GetActiveAlerts()
	if len(active) == 0 {
		t.Error("Expected at least 1 active alert")
	}

	// Stats should be consistent
	stats := engine.GetStats()
	if stats.TotalActive != len(active) {
		t.Errorf("Stats mismatch: TotalActive=%d, len(active)=%d", stats.TotalActive, len(active))
	}
}

// ========================================
// CHANNEL TESTS
// ========================================

func TestLogChannel(t *testing.T) {
	channel := NewLogChannel()

	if channel.Name() != "log" {
		t.Errorf("Expected name 'log', got '%s'", channel.Name())
	}

	if !channel.IsEnabled() {
		t.Error("Expected log channel to be enabled")
	}

	alert := &Alert{
		ID:        "test-id",
		Type:      AlertTypeErrorRate,
		Severity:  SeverityWarning,
		Title:     "Test Alert",
		Message:   "Test message",
		Source:    "test",
		Value:     15.0,
		Threshold: 10.0,
		CreatedAt: time.Now(),
	}

	err := channel.Send(alert)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
}

func TestWebhookChannel_Disabled(t *testing.T) {
	channel := NewWebhookChannel(WebhookConfig{
		Name: "test_webhook",
		URL:  "", // Empty URL
	})

	if channel.IsEnabled() {
		t.Error("Expected webhook channel to be disabled with empty URL")
	}
}

func TestSlackChannel_Disabled(t *testing.T) {
	channel := NewSlackChannel("", "")

	if channel.IsEnabled() {
		t.Error("Expected slack channel to be disabled with empty URL")
	}
}

func TestPagerDutyChannel_Disabled(t *testing.T) {
	channel := NewPagerDutyChannel("")

	if channel.IsEnabled() {
		t.Error("Expected pagerduty channel to be disabled with empty key")
	}
}

func TestCallbackChannel(t *testing.T) {
	var receivedAlert *Alert

	channel := NewCallbackChannel("test_callback", func(alert *Alert) error {
		receivedAlert = alert
		return nil
	})

	if channel.Name() != "test_callback" {
		t.Errorf("Expected name 'test_callback', got '%s'", channel.Name())
	}

	if !channel.IsEnabled() {
		t.Error("Expected callback channel to be enabled")
	}

	alert := &Alert{
		ID:      "callback-test",
		Title:   "Callback Test",
		Message: "Test message",
	}

	err := channel.Send(alert)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if receivedAlert == nil {
		t.Error("Expected callback to receive alert")
	}

	if receivedAlert.ID != "callback-test" {
		t.Errorf("Expected alert ID 'callback-test', got '%s'", receivedAlert.ID)
	}
}

// ========================================
// THRESHOLD TESTS
// ========================================

func TestAlertEngine_ThresholdChecks(t *testing.T) {
	tests := []struct {
		name      string
		ruleName  string
		value     float64
		shouldFire bool
	}{
		{"error_rate_below_threshold", "high_error_rate", 5.0, false},
		{"error_rate_at_threshold", "high_error_rate", 10.0, true},
		{"error_rate_above_threshold", "high_error_rate", 15.0, true},
		{"latency_below_threshold", "high_latency", 1000.0, false},
		{"latency_above_threshold", "high_latency", 3000.0, true},
		{"slo_budget_above_threshold", "slo_budget_low", 50.0, false},
		{"slo_budget_at_threshold", "slo_budget_low", 25.0, true},
		{"slo_budget_below_threshold", "slo_budget_low", 10.0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create fresh engine for each test
			testEngine := NewAlertEngine()
			alert := testEngine.FireFromRule(tt.ruleName, tt.value, "test", nil)

			if tt.shouldFire && alert == nil {
				t.Errorf("Expected alert to fire for %s with value %f", tt.ruleName, tt.value)
			}
			if !tt.shouldFire && alert != nil {
				t.Errorf("Expected no alert for %s with value %f", tt.ruleName, tt.value)
			}
		})
	}
}

// ========================================
// GLOBAL INSTANCE TESTS
// ========================================

func TestGetAlertEngine(t *testing.T) {
	engine1 := GetAlertEngine()
	engine2 := GetAlertEngine()

	if engine1 != engine2 {
		t.Error("Expected GetAlertEngine to return same instance")
	}
}

// ========================================
// ATTACK MONITOR TESTS
// ========================================

func TestAttackMonitor_RecordBlock(t *testing.T) {
	testEngine := NewAlertEngine()
	monitor := NewAttackMonitor(testEngine)

	// Record blocks below threshold
	for i := 0; i < 5; i++ {
		monitor.RecordBlock("sql_injection", "test_source", map[string]string{"ip": "1.2.3.4"})
	}

	// Should not have attack alert yet
	attacks := testEngine.GetAlertsByType(AlertTypeAttack)
	if len(attacks) != 0 {
		t.Errorf("Expected 0 attack alerts, got %d", len(attacks))
	}

	// Record more blocks to exceed threshold
	for i := 0; i < 10; i++ {
		monitor.RecordBlock("sql_injection", "test_source", map[string]string{"ip": "1.2.3.4"})
	}

	// Should have attack alert now
	attacks = testEngine.GetAlertsByType(AlertTypeAttack)
	if len(attacks) != 1 {
		t.Errorf("Expected 1 attack alert, got %d", len(attacks))
	}
}

// ========================================
// CIRCUIT BREAKER ALERT TESTS
// ========================================

func TestCircuitBreakerAlert(t *testing.T) {
	engine := NewAlertEngine()

	CircuitBreakerAlert(engine, "payment_service", 5, 3)

	alerts := engine.GetAlertsByType(AlertTypeCircuitOpen)
	if len(alerts) != 1 {
		t.Errorf("Expected 1 circuit breaker alert, got %d", len(alerts))
	}

	alert := alerts[0]
	if alert.Severity != SeverityCritical {
		t.Errorf("Expected critical severity, got %s", alert.Severity)
	}
}

func TestCircuitBreakerResolve(t *testing.T) {
	engine := NewAlertEngine()

	CircuitBreakerAlert(engine, "payment_service", 5, 3)

	// Verify alert exists
	alerts := engine.GetAlertsByType(AlertTypeCircuitOpen)
	if len(alerts) != 1 {
		t.Fatalf("Expected 1 alert before resolve, got %d", len(alerts))
	}

	// Resolve
	CircuitBreakerResolve(engine, "payment_service")

	// Verify alert is resolved
	alerts = engine.GetAlertsByType(AlertTypeCircuitOpen)
	if len(alerts) != 0 {
		t.Errorf("Expected 0 alerts after resolve, got %d", len(alerts))
	}
}

// ========================================
// QUARANTINE ALERT TESTS
// ========================================

func TestQuarantineAlert(t *testing.T) {
	engine := NewAlertEngine()

	QuarantineAlert(engine, "user", "user-123", "Suspicious activity detected")

	alerts := engine.GetAlertsByType(AlertTypeQuarantine)
	if len(alerts) != 1 {
		t.Errorf("Expected 1 quarantine alert, got %d", len(alerts))
	}

	alert := alerts[0]
	if alert.Tags["entity_type"] != "user" {
		t.Errorf("Expected entity_type 'user', got '%s'", alert.Tags["entity_type"])
	}
	if alert.Tags["entity_id"] != "user-123" {
		t.Errorf("Expected entity_id 'user-123', got '%s'", alert.Tags["entity_id"])
	}
}
