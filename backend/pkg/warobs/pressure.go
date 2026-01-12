package warobs

import (
	"runtime"
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
	errorRateElevated  float64 // 5%
	errorRateHigh      float64 // 15%
	errorRateCritical  float64 // 30%
	
	latencyElevated    time.Duration // 500ms
	latencyHigh        time.Duration // 1s
	latencyCritical    time.Duration // 3s
	
	// Memory thresholds (percentage)
	memoryElevated  float64 // 70%
	memoryHigh      float64 // 85%
	memoryCritical  float64 // 95%
	
	// Goroutine thresholds
	goroutineElevated  int // 1000
	goroutineHigh      int // 5000
	goroutineCritical  int // 10000
	
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
	return &PressureIndicator{
		redMetrics:         redMetrics,
		errorRateElevated:  5.0,
		errorRateHigh:      15.0,
		errorRateCritical:  30.0,
		latencyElevated:    500 * time.Millisecond,
		latencyHigh:        1 * time.Second,
		latencyCritical:    3 * time.Second,
		memoryElevated:     70.0,
		memoryHigh:         85.0,
		memoryCritical:     95.0,
		goroutineElevated:  1000,
		goroutineHigh:      5000,
		goroutineCritical:  10000,
		historySize:        60, // 1 minute of snapshots
	}
}

// GetCurrentPressure calculates current system pressure
func (p *PressureIndicator) GetCurrentPressure() *PressureReport {
	report := &PressureReport{
		Timestamp:  time.Now(),
		Components: make(map[string]ComponentPressure),
	}
	
	// Error rate pressure
	globalStats := p.redMetrics.GetGlobalStats()
	errorPressure := p.calculateErrorPressure(globalStats.ErrorRate)
	report.Components["error_rate"] = ComponentPressure{
		Level:   errorPressure,
		Value:   globalStats.ErrorRate,
		Message: p.getErrorMessage(globalStats.ErrorRate, errorPressure),
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
	p.storeSnapshot(report, globalStats.ErrorRate, avgLatency, memoryPercent, goroutineCount)
	
	return report
}


// PressureReport contains full pressure analysis
type PressureReport struct {
	Timestamp      time.Time                     `json:"timestamp"`
	OverallLevel   PressureLevel                 `json:"overall_level"`
	OverallMessage string                        `json:"overall_message"`
	Components     map[string]ComponentPressure  `json:"components"`
	Trend          string                        `json:"trend"` // improving, stable, degrading
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
