package alerting

import (
	"context"
	"sync"
	"testing"
	"time"

	"prost-qs/backend/pkg/warobs"
)

// ========================================
// INTEGRATION TESTS
// "Fluxo completo: Monitor → WarObs → Alert → Channel"
// ========================================

// TestIntegration_MonitorToAlert tests the full flow from monitor to alert
func TestIntegration_MonitorToAlert(t *testing.T) {
	// Create fresh instances
	engine := NewAlertEngine()
	warObs := warobs.NewWarObservability(nil, nil)

	// Create a test channel to capture alerts
	var receivedAlerts []*Alert
	var mu sync.Mutex

	testChannel := NewCallbackChannel("test_integration", func(alert *Alert) error {
		mu.Lock()
		receivedAlerts = append(receivedAlerts, alert)
		mu.Unlock()
		return nil
	})
	engine.AddChannel(testChannel)

	// Create monitor with short interval
	config := MonitorConfig{Interval: 100 * time.Millisecond}
	monitor := NewAlertMonitor(engine, warObs, config)

	// Simulate high error rate in WarObs
	// Record some requests with errors
	for i := 0; i < 100; i++ {
		warObs.RED.Record("/test", 50*time.Millisecond, 200)
	}
	for i := 0; i < 30; i++ { // 30% error rate
		warObs.RED.Record("/test", 50*time.Millisecond, 500)
	}

	// Start monitor
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	go monitor.Start(ctx)

	// Wait for monitor to check
	time.Sleep(300 * time.Millisecond)

	// Verify alerts were fired
	mu.Lock()
	alertCount := len(receivedAlerts)
	mu.Unlock()

	if alertCount == 0 {
		t.Error("Expected alerts to be fired from monitor")
	}

	// Check that error rate alert was fired
	found := false
	mu.Lock()
	for _, alert := range receivedAlerts {
		if alert.Type == AlertTypeErrorRate {
			found = true
			break
		}
	}
	mu.Unlock()

	if !found {
		t.Error("Expected error rate alert to be fired")
	}
}

// TestIntegration_APIGateToAlert tests API Gate block notification
func TestIntegration_APIGateToAlert(t *testing.T) {
	// Create fresh engine
	engine := NewAlertEngine()

	// Create attack monitor
	attackMonitor := NewAttackMonitor(engine)
	attackMonitor.blockThreshold = 5 // Lower threshold for testing
	attackMonitor.blockWindow = time.Minute

	// Simulate blocks from API Gate
	for i := 0; i < 10; i++ {
		attackMonitor.RecordBlock("sql_injection", "api_gate", map[string]string{
			"ip":   "1.2.3.4",
			"path": "/api/test",
		})
	}

	// Check that attack alert was fired
	attacks := engine.GetAlertsByType(AlertTypeAttack)
	if len(attacks) == 0 {
		t.Error("Expected attack alert to be fired after multiple blocks")
	}
}

// TestIntegration_AlertLifecycle tests full alert lifecycle
func TestIntegration_AlertLifecycle(t *testing.T) {
	engine := NewAlertEngine()

	// 1. Fire alert
	alert := engine.Fire(
		AlertTypeErrorRate,
		SeverityWarning,
		"lifecycle_test",
		"Test message",
		"test",
		15.0,
		10.0,
		nil,
	)

	if alert == nil {
		t.Fatal("Expected alert to be created")
	}

	// 2. Verify it's active
	active := engine.GetActiveAlerts()
	if len(active) != 1 {
		t.Errorf("Expected 1 active alert, got %d", len(active))
	}

	// 3. Acknowledge
	if !engine.Acknowledge(alert.ID, "test_user") {
		t.Error("Expected acknowledge to succeed")
	}

	// Verify acknowledged
	acked := engine.GetAlert(alert.ID)
	if acked.AckedAt == nil {
		t.Error("Expected alert to be acknowledged")
	}

	// 4. Resolve
	if !engine.Resolve(alert.ID) {
		t.Error("Expected resolve to succeed")
	}

	// Verify resolved
	active = engine.GetActiveAlerts()
	if len(active) != 0 {
		t.Errorf("Expected 0 active alerts after resolve, got %d", len(active))
	}
}

// TestIntegration_MetricsTracking tests that metrics are tracked correctly
func TestIntegration_MetricsTracking(t *testing.T) {
	// Reset metrics
	ResetMetrics()

	engine := NewAlertEngine()

	// Fire some alerts
	alert1 := engine.Fire(AlertTypeErrorRate, SeverityWarning, "metrics_test_1", "msg", "test", 10, 5, nil)
	engine.Fire(AlertTypeLatency, SeverityCritical, "metrics_test_2", "msg", "test", 10, 5, nil)
	engine.Fire(AlertTypeAttack, SeverityEmergency, "metrics_test_3", "msg", "test", 10, 5, nil)

	// Check metrics
	metrics := GetMetricsJSON()

	if metrics["alerts_fired_total"].(int64) != 3 {
		t.Errorf("Expected 3 alerts fired, got %v", metrics["alerts_fired_total"])
	}

	if metrics["active_alerts"].(int64) != 3 {
		t.Errorf("Expected 3 active alerts, got %v", metrics["active_alerts"])
	}

	// Resolve one
	engine.Resolve(alert1.ID)

	metrics = GetMetricsJSON()
	if metrics["alerts_resolved_total"].(int64) != 1 {
		t.Errorf("Expected 1 resolved, got %v", metrics["alerts_resolved_total"])
	}

	if metrics["active_alerts"].(int64) != 2 {
		t.Errorf("Expected 2 active alerts after resolve, got %v", metrics["active_alerts"])
	}
}

// TestIntegration_PrometheusFormat tests Prometheus metrics format
func TestIntegration_PrometheusFormat(t *testing.T) {
	ResetMetrics()

	engine := NewAlertEngine()
	engine.Fire(AlertTypeErrorRate, SeverityWarning, "prom_test", "msg", "test", 10, 5, nil)

	promMetrics := GetPrometheusMetrics()

	// Check format
	if promMetrics == "" {
		t.Error("Expected non-empty Prometheus metrics")
	}

	// Check for expected metric names
	expectedMetrics := []string{
		"alerting_alerts_fired_total",
		"alerting_alerts_resolved_total",
		"alerting_active_alerts",
		"alerting_alerts_fired_by_severity_total",
		"alerting_alerts_fired_by_type_total",
	}

	for _, metric := range expectedMetrics {
		if !containsString(promMetrics, metric) {
			t.Errorf("Expected Prometheus metrics to contain %s", metric)
		}
	}
}

// TestIntegration_ConfigFromEnv tests configuration loading
func TestIntegration_ConfigFromEnv(t *testing.T) {
	config := LoadConfigFromEnv()

	// Check defaults
	if config.ErrorRateWarning != 10.0 {
		t.Errorf("Expected default ErrorRateWarning 10.0, got %f", config.ErrorRateWarning)
	}

	if config.LatencyWarning != 2000.0 {
		t.Errorf("Expected default LatencyWarning 2000.0, got %f", config.LatencyWarning)
	}

	if config.MonitorInterval != 30*time.Second {
		t.Errorf("Expected default MonitorInterval 30s, got %v", config.MonitorInterval)
	}
}

// TestIntegration_ConfigApply tests applying config to engine
func TestIntegration_ConfigApply(t *testing.T) {
	engine := NewAlertEngine()
	config := &AlertConfig{
		ErrorRateWarning:  20.0, // Custom value
		ErrorRateCritical: 50.0,
		DefaultCooldown:   10 * time.Minute,
	}

	config.ApplyToEngine(engine)

	// Check rule was updated
	rule := engine.GetRule("high_error_rate")
	if rule.Threshold != 20.0 {
		t.Errorf("Expected threshold 20.0, got %f", rule.Threshold)
	}
}

// TestIntegration_MultipleChannels tests alert dispatch to multiple channels
func TestIntegration_MultipleChannels(t *testing.T) {
	engine := NewAlertEngine()

	var channel1Received, channel2Received bool
	var mu sync.Mutex

	engine.AddChannel(NewCallbackChannel("channel1", func(alert *Alert) error {
		mu.Lock()
		channel1Received = true
		mu.Unlock()
		return nil
	}))

	engine.AddChannel(NewCallbackChannel("channel2", func(alert *Alert) error {
		mu.Lock()
		channel2Received = true
		mu.Unlock()
		return nil
	}))

	engine.Fire(AlertTypeCustom, SeverityInfo, "multi_channel_test", "msg", "test", 0, 0, nil)

	// Wait for async dispatch
	time.Sleep(100 * time.Millisecond)

	mu.Lock()
	defer mu.Unlock()

	if !channel1Received {
		t.Error("Expected channel1 to receive alert")
	}
	if !channel2Received {
		t.Error("Expected channel2 to receive alert")
	}
}

// Helper function
func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstring(s, substr))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
