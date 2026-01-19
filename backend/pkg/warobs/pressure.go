package warobs

import (
	"os"
	"runtime"
	"strconv"
	"sync"
	"time"
)

// ========================================
// PRESSURE INDICATORS
// "Sinais de degradação antes do colapso"
// ========================================

// PressureLevel indicates system stress level
type PressureLevel string

const (
	PressureNormal   PressureLevel = "normal"
	PressureElevated PressureLevel = "elevated"
	PressureHigh     PressureLevel = "high"
	PressureCritical PressureLevel = "critical"
)

// PressureIndicator tracks system pressure
type PressureIndicator struct {
	redMetrics *REDMetrics

	// Thresholds
	errorRateElevated float64 // 5%
	errorRateHigh     float64 // 15%
	errorRateCritical float64 // 30%

	latencyElevated time.Duration // 500ms
	latencyHigh     time.Duration // 1s
	latencyCritical time.Duration // 3s

	// Memory thresholds (percentage)
	memoryElevated float64 // 70%
	memoryHigh     float64 // 85%
	memoryCritical float64 // 95%

	// Goroutine thresholds
	goroutineElevated int // 1000
	goroutineHigh     int // 5000
	goroutineCritical int // 10000

	// Low traffic threshold
	minRequestsThreshold int64 // Minimum requests per minute to trigger error pressure

	// History for trend detection
	history     []PressureSnapshot
	historySize int
	historyMu   sync.Mutex
}

// PressureSnapshot captures system state at a point in time
type PressureSnapshot struct {
	Timestamp      time.Time
	ErrorRate      float64
	AvgLatency     time.Duration
	MemoryPercent  float64
	GoroutineCount int
	Level          PressureLevel
}

// NewPressureIndicator creates a new pressure indicator
func NewPressureIndicator(redMetrics *REDMetrics) *PressureIndicator {
	p := &PressureIndicator{
		redMetrics:        redMetrics,
		errorRateElevated: getEnvFloat("WAROBS_ERROR_RATE_ELEVATED", 5.0),
		errorRateHigh:     getEnvFloat("WAROBS_ERROR_RATE_HIGH", 15.0),
		errorRateCritical: getEnvFloat("WAROBS_ERROR_RATE_CRITICAL", 30.0),

		latencyElevated: getEnvDuration("WAROBS_LATENCY_ELEVATED_MS", 500) * time.Millisecond,
		latencyHigh:     getEnvDuration("WAROBS_LATENCY_HIGH_MS", 1000) * time.Second,
		latencyCritical: getEnvDuration("WAROBS_LATENCY_CRITICAL_MS", 3000) * time.Second,

		memoryElevated: getEnvFloat("WAROBS_MEMORY_ELEVATED_PERCENT", 70.0),
		memoryHigh:     getEnvFloat("WAROBS_MEMORY_HIGH_PERCENT", 85.0),
		memoryCritical: getEnvFloat("WAROBS_MEMORY_CRITICAL_PERCENT", 95.0),

		goroutineElevated: getEnvInt("WAROBS_GOROUTINE_ELEVATED", 1000),
		goroutineHigh:     getEnvInt("WAROBS_GOROUTINE_HIGH", 5000),
		goroutineCritical: getEnvInt("WAROBS_GOROUTINE_CRITICAL", 10000),

		minRequestsThreshold: int64(getEnvInt("WAROBS_MIN_REQUESTS_THRESHOLD", 10)),

		historySize: 60, // 1 minute of snapshots
	}
	return p
}

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

func getEnvDuration(key string, defaultMs int) time.Duration {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return time.Duration(i)
		}
	}
	return time.Duration(defaultMs)
}

// GetCurrentPressure calculates current system pressure
func (p *PressureIndicator) GetCurrentPressure() *PressureReport {
	report := &PressureReport{
		Timestamp:  time.Now(),
		Components: make(map[string]ComponentPressure),
	}

	// Error rate pressure (5xx - System health)
	// Uses Windowed Stats (Last 60s) instead of Global Lifetime Stats
	windowStats := p.redMetrics.GetWindowedGlobalStats(60)

	errorPressure := PressureNormal
	// Only calculate error pressure if we have enough volume
	if windowStats.TotalRequests >= p.minRequestsThreshold {
		errorPressure = p.calculateErrorPressure(windowStats.ErrorRate5xx)
	}

	report.Components["error_rate"] = ComponentPressure{
		Level:   errorPressure,
		Value:   windowStats.ErrorRate5xx,
		Message: "System (5xx) " + p.getErrorMessage(windowStats.ErrorRate5xx, errorPressure),
	}

	// Total error rate (Client + System)
	errorAllPressure := PressureNormal
	if windowStats.TotalRequests >= p.minRequestsThreshold {
		errorAllPressure = p.calculateErrorPressure(windowStats.ErrorRate)
	}

	report.Components["error_rate_all"] = ComponentPressure{
		Level:   errorAllPressure,
		Value:   windowStats.ErrorRate,
		Message: "Total (4xx+5xx) " + p.getErrorMessage(windowStats.ErrorRate, errorAllPressure),
	}

	// Latency pressure (from slowest endpoints)
	slowest := p.redMetrics.GetSlowestEndpoints(5)
	var avgLatency time.Duration
	if len(slowest) > 0 {
		var total time.Duration
		for _, s := range slowest {
			total += s.AvgDuration
		}
		avgLatency = total / time.Duration(len(slowest))
	}
	latencyPressure := p.calculateLatencyPressure(avgLatency)
	report.Components["latency"] = ComponentPressure{
		Level:   latencyPressure,
		Value:   float64(avgLatency.Milliseconds()),
		Message: p.getLatencyMessage(avgLatency, latencyPressure),
	}

	// Memory pressure
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	memoryPercent := float64(memStats.Alloc) / float64(memStats.Sys) * 100
	memoryPressure := p.calculateMemoryPressure(memoryPercent)
	report.Components["memory"] = ComponentPressure{
		Level:   memoryPressure,
		Value:   memoryPercent,
		Message: p.getMemoryMessage(memoryPercent, memoryPressure),
	}

	// Goroutine pressure
	goroutineCount := runtime.NumGoroutine()
	goroutinePressure := p.calculateGoroutinePressure(goroutineCount)
	report.Components["goroutines"] = ComponentPressure{
		Level:   goroutinePressure,
		Value:   float64(goroutineCount),
		Message: p.getGoroutineMessage(goroutineCount, goroutinePressure),
	}

	// Calculate overall pressure (worst of all)
	report.OverallLevel = p.calculateOverallPressure(report.Components)
	report.OverallMessage = p.getOverallMessage(report.OverallLevel)

	// Store snapshot
	p.storeSnapshot(report, windowStats.ErrorRate, avgLatency, memoryPercent, goroutineCount)

	return report
}

// PressureReport contains full pressure analysis
type PressureReport struct {
	Timestamp      time.Time                    `json:"timestamp"`
	OverallLevel   PressureLevel                `json:"overall_level"`
	OverallMessage string                       `json:"overall_message"`
	Components     map[string]ComponentPressure `json:"components"`
	Trend          string                       `json:"trend"` // improving, stable, degrading
}

// ComponentPressure holds pressure for a single component
type ComponentPressure struct {
	Level   PressureLevel `json:"level"`
	Value   float64       `json:"value"`
	Message string        `json:"message"`
}

// Pressure calculation helpers
func (p *PressureIndicator) calculateErrorPressure(rate float64) PressureLevel {
	if rate >= p.errorRateCritical {
		return PressureCritical
	}
	if rate >= p.errorRateHigh {
		return PressureHigh
	}
	if rate >= p.errorRateElevated {
		return PressureElevated
	}
	return PressureNormal
}

func (p *PressureIndicator) calculateLatencyPressure(latency time.Duration) PressureLevel {
	if latency >= p.latencyCritical {
		return PressureCritical
	}
	if latency >= p.latencyHigh {
		return PressureHigh
	}
	if latency >= p.latencyElevated {
		return PressureElevated
	}
	return PressureNormal
}

func (p *PressureIndicator) calculateMemoryPressure(percent float64) PressureLevel {
	if percent >= p.memoryCritical {
		return PressureCritical
	}
	if percent >= p.memoryHigh {
		return PressureHigh
	}
	if percent >= p.memoryElevated {
		return PressureElevated
	}
	return PressureNormal
}

func (p *PressureIndicator) calculateGoroutinePressure(count int) PressureLevel {
	if count >= p.goroutineCritical {
		return PressureCritical
	}
	if count >= p.goroutineHigh {
		return PressureHigh
	}
	if count >= p.goroutineElevated {
		return PressureElevated
	}
	return PressureNormal
}

func (p *PressureIndicator) calculateOverallPressure(components map[string]ComponentPressure) PressureLevel {
	worst := PressureNormal

	levelOrder := map[PressureLevel]int{
		PressureNormal:   0,
		PressureElevated: 1,
		PressureHigh:     2,
		PressureCritical: 3,
	}

	for _, comp := range components {
		if levelOrder[comp.Level] > levelOrder[worst] {
			worst = comp.Level
		}
	}

	return worst
}

// Message generators
func (p *PressureIndicator) getErrorMessage(rate float64, level PressureLevel) string {
	switch level {
	case PressureCritical:
		return "CRITICAL: Error rate extremely high, system may be failing"
	case PressureHigh:
		return "HIGH: Error rate elevated, investigate immediately"
	case PressureElevated:
		return "ELEVATED: Error rate above normal, monitor closely"
	default:
		return "Normal error rate"
	}
}

func (p *PressureIndicator) getLatencyMessage(latency time.Duration, level PressureLevel) string {
	switch level {
	case PressureCritical:
		return "CRITICAL: Response times extremely slow"
	case PressureHigh:
		return "HIGH: Response times degraded significantly"
	case PressureElevated:
		return "ELEVATED: Response times above normal"
	default:
		return "Normal response times"
	}
}

func (p *PressureIndicator) getMemoryMessage(percent float64, level PressureLevel) string {
	switch level {
	case PressureCritical:
		return "CRITICAL: Memory near exhaustion, OOM risk"
	case PressureHigh:
		return "HIGH: Memory usage high, consider scaling"
	case PressureElevated:
		return "ELEVATED: Memory usage above normal"
	default:
		return "Normal memory usage"
	}
}

func (p *PressureIndicator) getGoroutineMessage(count int, level PressureLevel) string {
	switch level {
	case PressureCritical:
		return "CRITICAL: Goroutine leak suspected"
	case PressureHigh:
		return "HIGH: Many goroutines active, possible leak"
	case PressureElevated:
		return "ELEVATED: Goroutine count above normal"
	default:
		return "Normal goroutine count"
	}
}

func (p *PressureIndicator) getOverallMessage(level PressureLevel) string {
	switch level {
	case PressureCritical:
		return "🔴 CRITICAL: System under severe stress, immediate action required"
	case PressureHigh:
		return "🟠 HIGH: System under significant stress, investigate"
	case PressureElevated:
		return "🟡 ELEVATED: System showing signs of stress"
	default:
		return "🟢 NORMAL: System operating normally"
	}
}

func (p *PressureIndicator) storeSnapshot(report *PressureReport, errorRate float64, latency time.Duration, memory float64, goroutines int) {
	p.historyMu.Lock()
	defer p.historyMu.Unlock()

	snapshot := PressureSnapshot{
		Timestamp:      report.Timestamp,
		ErrorRate:      errorRate,
		AvgLatency:     latency,
		MemoryPercent:  memory,
		GoroutineCount: goroutines,
		Level:          report.OverallLevel,
	}

	p.history = append(p.history, snapshot)
	if len(p.history) > p.historySize {
		p.history = p.history[1:]
	}
}

// GetTrend analyzes pressure trend over time
func (p *PressureIndicator) GetTrend() string {
	p.historyMu.Lock()
	defer p.historyMu.Unlock()

	if len(p.history) < 5 {
		return "insufficient_data"
	}

	// Compare first half vs second half
	mid := len(p.history) / 2

	var firstHalfErrors, secondHalfErrors float64
	for i := 0; i < mid; i++ {
		firstHalfErrors += p.history[i].ErrorRate
	}
	for i := mid; i < len(p.history); i++ {
		secondHalfErrors += p.history[i].ErrorRate
	}

	firstAvg := firstHalfErrors / float64(mid)
	secondAvg := secondHalfErrors / float64(len(p.history)-mid)

	diff := secondAvg - firstAvg
	if diff > 2 {
		return "degrading"
	}
	if diff < -2 {
		return "improving"
	}
	return "stable"
}

// GetHistory returns pressure history
func (p *PressureIndicator) GetHistory() []PressureSnapshot {
	p.historyMu.Lock()
	defer p.historyMu.Unlock()

	result := make([]PressureSnapshot, len(p.history))
	copy(result, p.history)
	return result
}
