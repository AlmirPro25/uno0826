package warobs

import (
	"sync"
)

// ========================================
// WAR OBSERVABILITY - Central Orchestrator
// "Ver o sistema respirar"
// ========================================

// WarObservability is the central observability system
type WarObservability struct {
	RED      *REDMetrics
	Pressure *PressureIndicator
	SLO      *SLOTracker
	Tracer   *Tracer
}

// Global instance
var (
	globalWarObs *WarObservability
	once         sync.Once
)

// GetWarObservability returns the global war observability instance
func GetWarObservability() *WarObservability {
	once.Do(func() {
		globalWarObs = NewWarObservability()
	})
	return globalWarObs
}

// NewWarObservability creates a new war observability system
func NewWarObservability() *WarObservability {
	red := NewREDMetrics()
	
	return &WarObservability{
		RED:      red,
		Pressure: NewPressureIndicator(red),
		SLO:      NewSLOTracker(red),
		Tracer:   NewTracer(),
	}
}

// GetDashboard returns a complete dashboard view
func (w *WarObservability) GetDashboard() *Dashboard {
	return &Dashboard{
		GlobalStats:    w.RED.GetGlobalStats(),
		TopEndpoints:   w.RED.GetTopEndpoints(10),
		SlowestEndpoints: w.RED.GetSlowestEndpoints(5),
		ErrorEndpoints: w.RED.GetErrorEndpoints(5.0),
		Pressure:       w.Pressure.GetCurrentPressure(),
		SLOStatus:      w.SLO.GetSLOStatus(),
		ErrorBudget:    w.SLO.GetErrorBudgetSummary(),
		TracerStats:    w.Tracer.GetStats(),
	}
}

// Dashboard holds complete observability dashboard
type Dashboard struct {
	GlobalStats      *GlobalStats              `json:"global_stats"`
	TopEndpoints     []*EndpointStats          `json:"top_endpoints"`
	SlowestEndpoints []*EndpointStats          `json:"slowest_endpoints"`
	ErrorEndpoints   []*EndpointStats          `json:"error_endpoints"`
	Pressure         *PressureReport           `json:"pressure"`
	SLOStatus        map[string]*SLOStatus     `json:"slo_status"`
	ErrorBudget      *ErrorBudgetSummary       `json:"error_budget"`
	TracerStats      *TracerStats              `json:"tracer_stats"`
}

// GetHealthSummary returns a quick health summary
func (w *WarObservability) GetHealthSummary() *HealthSummary {
	pressure := w.Pressure.GetCurrentPressure()
	errorBudget := w.SLO.GetErrorBudgetSummary()
	globalStats := w.RED.GetGlobalStats()
	
	return &HealthSummary{
		Status:        string(pressure.OverallLevel),
		Message:       pressure.OverallMessage,
		ErrorRate:     globalStats.ErrorRate,
		ErrorBudget:   errorBudget.AverageBudget,
		Trend:         w.Pressure.GetTrend(),
		RequestsTotal: globalStats.TotalRequests,
	}
}

// HealthSummary provides a quick health overview
type HealthSummary struct {
	Status        string  `json:"status"`
	Message       string  `json:"message"`
	ErrorRate     float64 `json:"error_rate_percent"`
	ErrorBudget   float64 `json:"error_budget_percent"`
	Trend         string  `json:"trend"`
	RequestsTotal int64   `json:"requests_total"`
}

// Reset resets all metrics (for testing)
func (w *WarObservability) Reset() {
	w.RED.Reset()
}
