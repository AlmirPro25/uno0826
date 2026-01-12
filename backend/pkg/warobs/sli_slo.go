package warobs

import (
	"sync"
	"time"
)

// ========================================
// SLI/SLO TRACKING
// "Objetivos de nível de serviço mensuráveis"
// ========================================

// SLO defines a Service Level Objective
type SLO struct {
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Target      float64       `json:"target"`      // Target percentage (e.g., 99.9)
	Window      time.Duration `json:"window"`      // Measurement window
	Type        SLOType       `json:"type"`
}

// SLOType defines the type of SLO
type SLOType string

const (
	SLOTypeAvailability SLOType = "availability" // % of successful requests
	SLOTypeLatency      SLOType = "latency"      // % of requests under threshold
	SLOTypeErrorRate    SLOType = "error_rate"   // % of requests without errors
)

// SLOTracker tracks SLI/SLO compliance
type SLOTracker struct {
	slos       map[string]*SLO
	indicators map[string]*SLIData
	redMetrics *REDMetrics
	mu         sync.RWMutex
}

// SLIData holds Service Level Indicator data
type SLIData struct {
	TotalEvents   int64
	GoodEvents    int64
	WindowStart   time.Time
	WindowEnd     time.Time
	Measurements  []SLIMeasurement
}

// SLIMeasurement is a single SLI measurement
type SLIMeasurement struct {
	Timestamp time.Time
	Value     float64
	Good      bool
}

// NewSLOTracker creates a new SLO tracker with default SLOs
func NewSLOTracker(redMetrics *REDMetrics) *SLOTracker {
	tracker := &SLOTracker{
		slos:       make(map[string]*SLO),
		indicators: make(map[string]*SLIData),
		redMetrics: redMetrics,
	}
	
	// Default SLOs
	tracker.AddSLO(&SLO{
		Name:        "availability",
		Description: "Percentage of successful requests (non-5xx)",
		Target:      99.9,
		Window:      24 * time.Hour,
		Type:        SLOTypeAvailability,
	})
	
	tracker.AddSLO(&SLO{
		Name:        "latency_p99",
		Description: "99th percentile latency under 1 second",
		Target:      99.0,
		Window:      1 * time.Hour,
		Type:        SLOTypeLatency,
	})
	
	tracker.AddSLO(&SLO{
		Name:        "error_rate",
		Description: "Error rate below 1%",
		Target:      99.0,
		Window:      1 * time.Hour,
		Type:        SLOTypeErrorRate,
	})
	
	return tracker
}

// AddSLO adds a new SLO
func (t *SLOTracker) AddSLO(slo *SLO) {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	t.slos[slo.Name] = slo
	t.indicators[slo.Name] = &SLIData{
		WindowStart:  time.Now(),
		WindowEnd:    time.Now().Add(slo.Window),
		Measurements: make([]SLIMeasurement, 0),
	}
}

// RecordMeasurement records an SLI measurement
func (t *SLOTracker) RecordMeasurement(sloName string, value float64, good bool) {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	data, exists := t.indicators[sloName]
	if !exists {
		return
	}
	
	data.TotalEvents++
	if good {
		data.GoodEvents++
	}
	
	data.Measurements = append(data.Measurements, SLIMeasurement{
		Timestamp: time.Now(),
		Value:     value,
		Good:      good,
	})
	
	// Keep only last 1000 measurements
	if len(data.Measurements) > 1000 {
		data.Measurements = data.Measurements[len(data.Measurements)-1000:]
	}
}

// GetSLOStatus returns status for all SLOs
func (t *SLOTracker) GetSLOStatus() map[string]*SLOStatus {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	result := make(map[string]*SLOStatus)
	
	for name, slo := range t.slos {
		data := t.indicators[name]
		status := t.calculateStatus(slo, data)
		result[name] = status
	}
	
	return result
}

// SLOStatus holds the current status of an SLO
type SLOStatus struct {
	SLO           *SLO    `json:"slo"`
	CurrentValue  float64 `json:"current_value"`
	Target        float64 `json:"target"`
	Compliance    bool    `json:"compliance"`
	ErrorBudget   float64 `json:"error_budget_remaining"` // Percentage
	BurnRate      float64 `json:"burn_rate"`              // How fast budget is being consumed
	Status        string  `json:"status"`                 // ok, warning, critical
	Message       string  `json:"message"`
}

func (t *SLOTracker) calculateStatus(slo *SLO, data *SLIData) *SLOStatus {
	status := &SLOStatus{
		SLO:    slo,
		Target: slo.Target,
	}
	
	if data.TotalEvents == 0 {
		status.CurrentValue = 100.0
		status.Compliance = true
		status.ErrorBudget = 100.0
		status.Status = "ok"
		status.Message = "No data yet"
		return status
	}
	
	// Calculate current SLI value
	status.CurrentValue = float64(data.GoodEvents) / float64(data.TotalEvents) * 100
	
	// Check compliance
	status.Compliance = status.CurrentValue >= slo.Target
	
	// Calculate error budget
	// Error budget = (100 - target) percentage of requests that can fail
	errorBudgetTotal := 100.0 - slo.Target
	errorBudgetUsed := 100.0 - status.CurrentValue
	if errorBudgetTotal > 0 {
		status.ErrorBudget = ((errorBudgetTotal - errorBudgetUsed) / errorBudgetTotal) * 100
		if status.ErrorBudget < 0 {
			status.ErrorBudget = 0
		}
	}
	
	// Calculate burn rate (simplified)
	// Burn rate = how fast we're consuming error budget
	// 1.0 = consuming at expected rate
	// >1.0 = consuming faster than expected
	if errorBudgetTotal > 0 && data.TotalEvents > 100 {
		expectedErrors := float64(data.TotalEvents) * (errorBudgetTotal / 100)
		actualErrors := float64(data.TotalEvents - data.GoodEvents)
		if expectedErrors > 0 {
			status.BurnRate = actualErrors / expectedErrors
		}
	}
	
	// Determine status
	if status.ErrorBudget <= 0 {
		status.Status = "critical"
		status.Message = "Error budget exhausted"
	} else if status.ErrorBudget < 25 {
		status.Status = "warning"
		status.Message = "Error budget running low"
	} else if status.BurnRate > 2.0 {
		status.Status = "warning"
		status.Message = "High burn rate detected"
	} else {
		status.Status = "ok"
		status.Message = "Within SLO"
	}
	
	return status
}

// UpdateFromMetrics updates SLIs from RED metrics
func (t *SLOTracker) UpdateFromMetrics() {
	globalStats := t.redMetrics.GetGlobalStats()
	
	if globalStats.TotalRequests == 0 {
		return
	}
	
	// Availability SLI (non-5xx responses)
	// We approximate by using error rate
	availabilityGood := globalStats.ErrorRate < 1.0 // Less than 1% errors = good
	t.RecordMeasurement("availability", 100.0-globalStats.ErrorRate, availabilityGood)
	
	// Error rate SLI
	errorRateGood := globalStats.ErrorRate < 1.0
	t.RecordMeasurement("error_rate", 100.0-globalStats.ErrorRate, errorRateGood)
	
	// Latency SLI (from slowest endpoints)
	slowest := t.redMetrics.GetSlowestEndpoints(1)
	if len(slowest) > 0 {
		latencyGood := slowest[0].AvgDuration < time.Second
		t.RecordMeasurement("latency_p99", float64(slowest[0].AvgDuration.Milliseconds()), latencyGood)
	}
}

// GetErrorBudgetSummary returns a summary of all error budgets
func (t *SLOTracker) GetErrorBudgetSummary() *ErrorBudgetSummary {
	statuses := t.GetSLOStatus()
	
	summary := &ErrorBudgetSummary{
		Timestamp: time.Now(),
		SLOs:      make([]ErrorBudgetItem, 0),
	}
	
	var totalBudget float64
	var count int
	
	for name, status := range statuses {
		item := ErrorBudgetItem{
			Name:          name,
			Target:        status.Target,
			Current:       status.CurrentValue,
			BudgetPercent: status.ErrorBudget,
			Status:        status.Status,
		}
		summary.SLOs = append(summary.SLOs, item)
		totalBudget += status.ErrorBudget
		count++
	}
	
	if count > 0 {
		summary.AverageBudget = totalBudget / float64(count)
	}
	
	// Overall health
	if summary.AverageBudget > 50 {
		summary.OverallHealth = "healthy"
	} else if summary.AverageBudget > 25 {
		summary.OverallHealth = "warning"
	} else {
		summary.OverallHealth = "critical"
	}
	
	return summary
}

// ErrorBudgetSummary holds summary of all error budgets
type ErrorBudgetSummary struct {
	Timestamp     time.Time         `json:"timestamp"`
	OverallHealth string            `json:"overall_health"`
	AverageBudget float64           `json:"average_budget_percent"`
	SLOs          []ErrorBudgetItem `json:"slos"`
}

// ErrorBudgetItem holds error budget for a single SLO
type ErrorBudgetItem struct {
	Name          string  `json:"name"`
	Target        float64 `json:"target"`
	Current       float64 `json:"current"`
	BudgetPercent float64 `json:"budget_percent"`
	Status        string  `json:"status"`
}
