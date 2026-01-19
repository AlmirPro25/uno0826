package warobs

import (
	"log"
	"sync"
	"time"

	"prost-qs/backend/internal/killswitch"
)

// ========================================
// WAR OBSERVABILITY - Central Orchestrator
// "Ver o sistema respirar"
// ========================================

// WarObservability is the central observability system
type WarObservability struct {
	RED         *REDMetrics
	Pressure    *PressureIndicator
	SLO         *SLOTracker
	Tracer      *Tracer
	Persistence *PersistenceService
	Defense     *DefensePolicyEngine
	Narrative   *NarrativeIntelligenceService
}

// Global instance
var (
	globalWarObs *WarObservability
	once         sync.Once
)

// InitWarObservability initializes the global war observability instance
func InitWarObservability(persistence *PersistenceService, ks *killswitch.KillSwitchService) *WarObservability {
	once.Do(func() {
		globalWarObs = NewWarObservability(persistence, ks)
	})
	return globalWarObs
}

// GetWarObservability returns the global war observability instance
func GetWarObservability() *WarObservability {
	return globalWarObs
}

// NewWarObservability creates a new war observability system
func NewWarObservability(persistence *PersistenceService, ks *killswitch.KillSwitchService) *WarObservability { // Added ks parameter
	red := NewREDMetrics()

	return &WarObservability{
		RED:         red,
		Pressure:    NewPressureIndicator(red, persistence),
		SLO:         NewSLOTracker(red),
		Tracer:      NewTracer(),
		Persistence: persistence,
		Defense:     NewDefensePolicyEngine(persistence, ks),
		Narrative:   NewNarrativeIntelligenceService(persistence),
	}
}

// StartDefenseWorker inicia o processamento periódico de políticas de defesa
func (w *WarObservability) StartDefenseWorker(interval time.Duration) {
	if w.Defense == nil {
		return
	}

	go func() {
		ticker := time.NewTicker(interval)
		log.Printf("🛡️ [WAROBS] Motor de Defesa iniciado (intervalo: %v)", interval)
		for range ticker.C {
			w.Defense.EvaluatePolicies()
		}
	}()
}

// GetDashboard returns a complete dashboard view
func (w *WarObservability) GetDashboard() *Dashboard {
	var recentIncidents []Incident
	var recentEvents []KernelEvent

	// Only fetch from persistence if available
	if w.Persistence != nil {
		recentIncidents, _ = w.Persistence.GetRecentIncidents(24) // Last 24h
		recentEvents, _ = w.Persistence.GetRecentKernelEvents(10)
	}

	return &Dashboard{
		GlobalStats:      w.RED.GetGlobalStats(),
		TopEndpoints:     w.RED.GetTopEndpoints(10),
		SlowestEndpoints: w.RED.GetSlowestEndpoints(5),
		ErrorEndpoints:   w.RED.GetErrorEndpoints(5.0),
		Pressure:         w.Pressure.GetCurrentPressure(),
		SLOStatus:        w.SLO.GetSLOStatus(),
		ErrorBudget:      w.SLO.GetErrorBudgetSummary(),
		TracerStats:      w.Tracer.GetStats(),
		RecentIncidents:  recentIncidents,
		RecentEvents:     recentEvents,
	}
}

// Dashboard holds complete observability dashboard
type Dashboard struct {
	GlobalStats      *GlobalStats          `json:"global_stats"`
	TopEndpoints     []*EndpointStats      `json:"top_endpoints"`
	SlowestEndpoints []*EndpointStats      `json:"slowest_endpoints"`
	ErrorEndpoints   []*EndpointStats      `json:"error_endpoints"`
	Pressure         *PressureReport       `json:"pressure"`
	SLOStatus        map[string]*SLOStatus `json:"slo_status"`
	ErrorBudget      *ErrorBudgetSummary   `json:"error_budget"`
	TracerStats      *TracerStats          `json:"tracer_stats"`
	RecentIncidents  []Incident            `json:"recent_incidents,omitempty"`
	RecentEvents     []KernelEvent         `json:"recent_events,omitempty"`
}

// GetHealthSummary returns a quick health summary
func (w *WarObservability) GetHealthSummary() *HealthSummary {
	pressure := w.Pressure.GetCurrentPressure()
	errorBudget := w.SLO.GetErrorBudgetSummary()
	globalStats := w.RED.GetGlobalStats()

	// Derive pressure score from level
	pressureScore := 0.0
	switch pressure.OverallLevel {
	case PressureNormal:
		pressureScore = 0
	case PressureElevated:
		pressureScore = 25
	case PressureHigh:
		pressureScore = 50
	case PressureCritical:
		pressureScore = 100
	}

	return &HealthSummary{
		Status:        string(pressure.OverallLevel),
		Message:       pressure.OverallMessage,
		ErrorRate:     globalStats.ErrorRate,
		ErrorBudget:   errorBudget.AverageBudget,
		Trend:         w.Pressure.GetTrend(),
		RequestsTotal: globalStats.TotalRequests,
		Metrics: struct {
			Rate     float64 `json:"rate"`
			Errors   float64 `json:"errors"`
			Duration float64 `json:"duration"`
		}{
			Rate:     0.0,                           // TODO: Calculate real requests/second
			Errors:   globalStats.ErrorRate / 100.0, // Convert to fraction for frontend
			Duration: globalStats.AverageDuration,
		},
		PressureScore:  pressureScore,
		ActiveDefenses: []string{},
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
	Metrics       struct {
		Rate     float64 `json:"rate"`
		Errors   float64 `json:"errors"`
		Duration float64 `json:"duration"`
	} `json:"metrics"`
	PressureScore  float64  `json:"pressure_score"`
	ActiveDefenses []string `json:"active_defenses"`
}

// Reset resets all metrics (for testing)
func (w *WarObservability) Reset() {
	w.RED.Reset()
}
