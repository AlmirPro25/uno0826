package warobs

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ========================================
// PRESSURE INDICATOR TESTS
// Criados em: 19/01/2026 (QA Report)
// ========================================

func TestNewPressureIndicator_DefaultThresholds(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	assert.NotNil(t, p)
	assert.Equal(t, 5.0, p.errorRateElevated)
	assert.Equal(t, 15.0, p.errorRateHigh)
	assert.Equal(t, 30.0, p.errorRateCritical)
	assert.Equal(t, int64(10), p.minRequestsThreshold)
}

func TestCalculateErrorPressure_AllLevels(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	tests := []struct {
		name     string
		rate     float64
		expected PressureLevel
	}{
		{"normal_zero", 0.0, PressureNormal},
		{"normal_low", 2.0, PressureNormal},
		{"elevated_threshold", 5.0, PressureElevated},
		{"elevated_mid", 10.0, PressureElevated},
		{"high_threshold", 15.0, PressureHigh},
		{"high_mid", 25.0, PressureHigh},
		{"critical_threshold", 30.0, PressureCritical},
		{"critical_extreme", 90.0, PressureCritical},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := p.calculateErrorPressure(tt.rate)
			assert.Equal(t, tt.expected, result, "Error rate %.1f should be %s", tt.rate, tt.expected)
		})
	}
}

func TestCalculateLatencyPressure_AllLevels(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	tests := []struct {
		name     string
		latency  time.Duration
		expected PressureLevel
	}{
		{"normal_fast", 100 * time.Millisecond, PressureNormal},
		{"normal_ok", 400 * time.Millisecond, PressureNormal},
		{"elevated_threshold", 500 * time.Millisecond, PressureElevated},
		{"elevated_mid", 800 * time.Millisecond, PressureElevated},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := p.calculateLatencyPressure(tt.latency)
			assert.Equal(t, tt.expected, result, "Latency %v should be %s", tt.latency, tt.expected)
		})
	}
}

func TestCalculateMemoryPressure_AllLevels(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	tests := []struct {
		name     string
		percent  float64
		expected PressureLevel
	}{
		{"normal_low", 30.0, PressureNormal},
		{"normal_mid", 60.0, PressureNormal},
		{"elevated_threshold", 70.0, PressureElevated},
		{"elevated_mid", 80.0, PressureElevated},
		{"high_threshold", 85.0, PressureHigh},
		{"high_mid", 92.0, PressureHigh},
		{"critical_threshold", 95.0, PressureCritical},
		{"critical_extreme", 99.0, PressureCritical},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := p.calculateMemoryPressure(tt.percent)
			assert.Equal(t, tt.expected, result, "Memory %.1f%% should be %s", tt.percent, tt.expected)
		})
	}
}

func TestCalculateGoroutinePressure_AllLevels(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	tests := []struct {
		name     string
		count    int
		expected PressureLevel
	}{
		{"normal_low", 100, PressureNormal},
		{"normal_mid", 500, PressureNormal},
		{"elevated_threshold", 1000, PressureElevated},
		{"elevated_mid", 3000, PressureElevated},
		{"high_threshold", 5000, PressureHigh},
		{"high_mid", 8000, PressureHigh},
		{"critical_threshold", 10000, PressureCritical},
		{"critical_extreme", 50000, PressureCritical},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := p.calculateGoroutinePressure(tt.count)
			assert.Equal(t, tt.expected, result, "Goroutine count %d should be %s", tt.count, tt.expected)
		})
	}
}

func TestCalculateOverallPressure_WorstWins(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	tests := []struct {
		name       string
		components map[string]ComponentPressure
		expected   PressureLevel
	}{
		{
			name: "all_normal",
			components: map[string]ComponentPressure{
				"error_rate": {Level: PressureNormal},
				"latency":    {Level: PressureNormal},
				"memory":     {Level: PressureNormal},
			},
			expected: PressureNormal,
		},
		{
			name: "one_elevated",
			components: map[string]ComponentPressure{
				"error_rate": {Level: PressureNormal},
				"latency":    {Level: PressureElevated},
				"memory":     {Level: PressureNormal},
			},
			expected: PressureElevated,
		},
		{
			name: "critical_overrides_all",
			components: map[string]ComponentPressure{
				"error_rate": {Level: PressureNormal},
				"latency":    {Level: PressureElevated},
				"memory":     {Level: PressureCritical},
			},
			expected: PressureCritical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := p.calculateOverallPressure(tt.components)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetTrend_InsufficientData(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	// With no history
	trend := p.GetTrend()
	assert.Equal(t, "insufficient_data", trend)
}

func TestStoreSnapshot_MaintainsHistorySize(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)
	p.historySize = 5 // Small history for testing

	// Store more snapshots than history size
	for i := 0; i < 10; i++ {
		report := &PressureReport{
			Timestamp:  time.Now(),
			Components: make(map[string]ComponentPressure),
		}
		p.storeSnapshot(report, float64(i), time.Duration(i)*time.Millisecond, float64(i*10), i*100)
	}

	history := p.GetHistory()
	assert.Len(t, history, 5, "History should be capped at historySize")
}

func TestGetCurrentPressure_ReturnsValidReport(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	// Record some metrics first (use Record, not RecordRequest)
	red.Record("/test", 100*time.Millisecond, 200)

	report := p.GetCurrentPressure()

	require.NotNil(t, report)
	assert.NotEmpty(t, report.Timestamp)
	assert.NotEmpty(t, report.OverallLevel)
	assert.NotEmpty(t, report.OverallMessage)
	assert.Contains(t, report.Components, "error_rate")
	assert.Contains(t, report.Components, "latency")
	assert.Contains(t, report.Components, "memory")
	assert.Contains(t, report.Components, "goroutines")
}

func TestGetErrorMessage_AllLevels(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	tests := []struct {
		level    PressureLevel
		contains string
	}{
		{PressureCritical, "CRITICAL"},
		{PressureHigh, "HIGH"},
		{PressureElevated, "ELEVATED"},
		{PressureNormal, "Normal"},
	}

	for _, tt := range tests {
		t.Run(string(tt.level), func(t *testing.T) {
			msg := p.getErrorMessage(10.0, tt.level)
			assert.Contains(t, msg, tt.contains)
		})
	}
}

func TestGetOverallMessage_ContainsEmoji(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	tests := []struct {
		level    PressureLevel
		contains string
	}{
		{PressureCritical, "🔴"},
		{PressureHigh, "🟠"},
		{PressureElevated, "🟡"},
		{PressureNormal, "🟢"},
	}

	for _, tt := range tests {
		t.Run(string(tt.level), func(t *testing.T) {
			msg := p.getOverallMessage(tt.level)
			assert.Contains(t, msg, tt.contains)
		})
	}
}

func TestIsSustained_NotEnoughHistory(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	// With empty history, should return false
	result := p.isSustained(time.Now(), "error_rate", PressureHigh, 3)
	assert.False(t, result, "Should return false with insufficient history")
}

func TestIsSustained_WithSufficientHistory(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	// Add sustained critical snapshots
	for i := 0; i < 5; i++ {
		snap := PressureSnapshot{
			Timestamp: time.Now(),
			Level:     PressureCritical,
			ComponentLevels: map[string]PressureLevel{
				"error_rate": PressureCritical,
			},
		}
		p.historyMu.Lock()
		p.history = append(p.history, snap)
		p.historyMu.Unlock()
	}

	// Test with High as min level (Critical >= High should be true)
	result := p.isSustained(time.Now(), "error_rate", PressureHigh, 3)
	assert.True(t, result, "Should return true when component is sustained above (or equal to) min level")
}

// ========================================
// SECURITY TESTS
// ========================================

func TestPressureIndicator_NoSensitiveDataInMessages(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	messages := []string{
		p.getErrorMessage(50.0, PressureCritical),
		p.getLatencyMessage(5*time.Second, PressureCritical),
		p.getMemoryMessage(99.0, PressureCritical),
		p.getGoroutineMessage(50000, PressureCritical),
		p.getOverallMessage(PressureCritical),
	}

	sensitivePatterns := []string{
		"password",
		"secret",
		"key",
		"token",
		"api_key",
	}

	for _, msg := range messages {
		for _, pattern := range sensitivePatterns {
			assert.NotContains(t, msg, pattern, "Message should not contain sensitive pattern: %s", pattern)
		}
	}
}

// ========================================
// EDGE CASE TESTS
// ========================================

func TestPressureIndicator_ZeroMetrics(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	// No metrics recorded
	report := p.GetCurrentPressure()

	assert.NotNil(t, report)
	assert.Equal(t, PressureNormal, report.OverallLevel, "With no traffic, pressure should be normal")
}

func TestGetTrend_StableMetrics(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	// Add stable snapshots
	for i := 0; i < 10; i++ {
		snap := PressureSnapshot{
			Timestamp: time.Now(),
			ErrorRate: 5.0, // Constant error rate
		}
		p.historyMu.Lock()
		p.history = append(p.history, snap)
		p.historyMu.Unlock()
	}

	trend := p.GetTrend()
	assert.Equal(t, "stable", trend)
}

func TestGetTrend_ImprovingMetrics(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	// Add improving snapshots (error rate decreasing)
	for i := 0; i < 10; i++ {
		snap := PressureSnapshot{
			Timestamp: time.Now(),
			ErrorRate: float64(50 - i*5), // 50, 45, 40, 35... 5
		}
		p.historyMu.Lock()
		p.history = append(p.history, snap)
		p.historyMu.Unlock()
	}

	trend := p.GetTrend()
	assert.Equal(t, "improving", trend)
}

func TestGetTrend_DegradingMetrics(t *testing.T) {
	red := NewREDMetrics()
	p := NewPressureIndicator(red, nil)

	// Add degrading snapshots (error rate increasing)
	for i := 0; i < 10; i++ {
		snap := PressureSnapshot{
			Timestamp: time.Now(),
			ErrorRate: float64(5 + i*5), // 5, 10, 15... 50
		}
		p.historyMu.Lock()
		p.history = append(p.history, snap)
		p.historyMu.Unlock()
	}

	trend := p.GetTrend()
	assert.Equal(t, "degrading", trend)
}
