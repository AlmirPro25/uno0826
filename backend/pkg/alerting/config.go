package alerting

import (
	"os"
	"strconv"
	"time"
)

// ========================================
// CONFIGURATION VIA ENVIRONMENT
// "Thresholds configuráveis sem rebuild"
// ========================================

// AlertConfig holds alerting configuration from environment
type AlertConfig struct {
	// Error Rate Thresholds
	ErrorRateWarning  float64 // ALERT_ERROR_RATE_WARNING (default: 10)
	ErrorRateCritical float64 // ALERT_ERROR_RATE_CRITICAL (default: 25)

	// Latency Thresholds (ms)
	LatencyWarning  float64 // ALERT_LATENCY_WARNING_MS (default: 2000)
	LatencyCritical float64 // ALERT_LATENCY_CRITICAL_MS (default: 5000)

	// SLO Budget Thresholds
	SLOBudgetWarning  float64 // ALERT_SLO_BUDGET_WARNING (default: 25)
	SLOBudgetCritical float64 // ALERT_SLO_BUDGET_CRITICAL (default: 0)

	// Memory Thresholds (%)
	MemoryWarning  float64 // ALERT_MEMORY_WARNING (default: 85)
	MemoryCritical float64 // ALERT_MEMORY_CRITICAL (default: 95)

	// Pressure Thresholds (level 0-3)
	PressureWarning  float64 // ALERT_PRESSURE_WARNING (default: 1)
	PressureCritical float64 // ALERT_PRESSURE_CRITICAL (default: 3)

	// Cooldowns (seconds)
	DefaultCooldown  time.Duration // ALERT_DEFAULT_COOLDOWN_SEC (default: 300)
	CriticalCooldown time.Duration // ALERT_CRITICAL_COOLDOWN_SEC (default: 60)

	// Monitor
	MonitorInterval time.Duration // ALERT_MONITOR_INTERVAL_SEC (default: 30)

	// Attack Detection
	AttackBlockThreshold int           // ALERT_ATTACK_BLOCK_THRESHOLD (default: 10)
	AttackBlockWindow    time.Duration // ALERT_ATTACK_BLOCK_WINDOW_SEC (default: 60)

	// Persistence
	PersistenceEnabled bool          // ALERT_PERSISTENCE_ENABLED (default: true)
	CleanupAge         time.Duration // ALERT_CLEANUP_AGE_HOURS (default: 168 = 7 days)
}

// LoadConfigFromEnv loads alerting configuration from environment variables
func LoadConfigFromEnv() *AlertConfig {
	return &AlertConfig{
		// Error Rate
		ErrorRateWarning:  getEnvFloat("ALERT_ERROR_RATE_WARNING", 10.0),
		ErrorRateCritical: getEnvFloat("ALERT_ERROR_RATE_CRITICAL", 25.0),

		// Latency
		LatencyWarning:  getEnvFloat("ALERT_LATENCY_WARNING_MS", 2000.0),
		LatencyCritical: getEnvFloat("ALERT_LATENCY_CRITICAL_MS", 5000.0),

		// SLO Budget
		SLOBudgetWarning:  getEnvFloat("ALERT_SLO_BUDGET_WARNING", 25.0),
		SLOBudgetCritical: getEnvFloat("ALERT_SLO_BUDGET_CRITICAL", 0.0),

		// Memory
		MemoryWarning:  getEnvFloat("ALERT_MEMORY_WARNING", 85.0),
		MemoryCritical: getEnvFloat("ALERT_MEMORY_CRITICAL", 95.0),

		// Pressure
		PressureWarning:  getEnvFloat("ALERT_PRESSURE_WARNING", 1.0),
		PressureCritical: getEnvFloat("ALERT_PRESSURE_CRITICAL", 3.0),

		// Cooldowns
		DefaultCooldown:  time.Duration(getEnvInt("ALERT_DEFAULT_COOLDOWN_SEC", 300)) * time.Second,
		CriticalCooldown: time.Duration(getEnvInt("ALERT_CRITICAL_COOLDOWN_SEC", 60)) * time.Second,

		// Monitor
		MonitorInterval: time.Duration(getEnvInt("ALERT_MONITOR_INTERVAL_SEC", 30)) * time.Second,

		// Attack Detection
		AttackBlockThreshold: getEnvInt("ALERT_ATTACK_BLOCK_THRESHOLD", 10),
		AttackBlockWindow:    time.Duration(getEnvInt("ALERT_ATTACK_BLOCK_WINDOW_SEC", 60)) * time.Second,

		// Persistence
		PersistenceEnabled: getEnvBool("ALERT_PERSISTENCE_ENABLED", true),
		CleanupAge:         time.Duration(getEnvInt("ALERT_CLEANUP_AGE_HOURS", 168)) * time.Hour,
	}
}

// ApplyToEngine applies configuration to an alert engine
func (c *AlertConfig) ApplyToEngine(engine *AlertEngine) {
	// Update error rate rules
	if rule := engine.GetRule("high_error_rate"); rule != nil {
		rule.Threshold = c.ErrorRateWarning
		rule.Cooldown = c.DefaultCooldown
	}
	if rule := engine.GetRule("critical_error_rate"); rule != nil {
		rule.Threshold = c.ErrorRateCritical
		rule.Cooldown = c.CriticalCooldown
	}

	// Update latency rules
	if rule := engine.GetRule("high_latency"); rule != nil {
		rule.Threshold = c.LatencyWarning
		rule.Cooldown = c.DefaultCooldown
	}
	if rule := engine.GetRule("critical_latency"); rule != nil {
		rule.Threshold = c.LatencyCritical
		rule.Cooldown = c.CriticalCooldown
	}

	// Update SLO rules
	if rule := engine.GetRule("slo_budget_low"); rule != nil {
		rule.Threshold = c.SLOBudgetWarning
	}
	if rule := engine.GetRule("slo_budget_exhausted"); rule != nil {
		rule.Threshold = c.SLOBudgetCritical
	}

	// Update memory rules
	if rule := engine.GetRule("memory_high"); rule != nil {
		rule.Threshold = c.MemoryWarning
		rule.Cooldown = c.DefaultCooldown
	}
	if rule := engine.GetRule("memory_critical"); rule != nil {
		rule.Threshold = c.MemoryCritical
		rule.Cooldown = c.CriticalCooldown
	}

	// Update pressure rules
	if rule := engine.GetRule("pressure_elevated"); rule != nil {
		rule.Threshold = c.PressureWarning
	}
	if rule := engine.GetRule("pressure_critical"); rule != nil {
		rule.Threshold = c.PressureCritical
	}
}

// ApplyToMonitor applies configuration to attack monitor
func (c *AlertConfig) ApplyToMonitor(monitor *AttackMonitor) {
	monitor.mu.Lock()
	defer monitor.mu.Unlock()
	monitor.blockThreshold = c.AttackBlockThreshold
	monitor.blockWindow = c.AttackBlockWindow
}

// ========================================
// HELPER FUNCTIONS
// ========================================

func getEnvFloat(key string, defaultVal float64) float64 {
	if val := os.Getenv(key); val != "" {
		if f, err := strconv.ParseFloat(val, 64); err == nil {
			return f
		}
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return defaultVal
}

func getEnvBool(key string, defaultVal bool) bool {
	if val := os.Getenv(key); val != "" {
		if b, err := strconv.ParseBool(val); err == nil {
			return b
		}
	}
	return defaultVal
}

// ========================================
// GLOBAL CONFIG
// ========================================

var globalConfig *AlertConfig

// GetConfig returns the global alert configuration
func GetConfig() *AlertConfig {
	if globalConfig == nil {
		globalConfig = LoadConfigFromEnv()
	}
	return globalConfig
}

// InitWithConfig initializes alerting with configuration
func InitWithConfig() *AlertEngine {
	config := GetConfig()
	engine := GetAlertEngine()
	config.ApplyToEngine(engine)
	return engine
}
