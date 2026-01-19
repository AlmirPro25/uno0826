package scaling

import (
	"fmt"
	"sync"
	"time"
)

// ========================================
// COST GOVERNOR FOR AUTO-SCALER
// ========================================
// Purpose: Prevent tenant from causing runaway infrastructure costs
// Problem: Malicious/buggy tenant spams jobs → forces scale-up → bankrupts us
// Solution: Per-tenant limits on workers, RPS, CPU-time
// ========================================

// CostGovernor enforces tenant-level resource limits
type CostGovernor struct {
	mu         sync.RWMutex
	limits     map[string]*TenantLimits    // tenantID -> limits
	usage      map[string]*TenantUsage     // tenantID -> current usage
	violations map[string]*ViolationRecord // tenantID -> violations
}

// TenantLimits defines maximum resources a tenant can consume
type TenantLimits struct {
	TenantID string

	// Worker Limits
	MaxConcurrentWorkers int           // Max workers this tenant can spawn
	MaxWorkerLifetime    time.Duration // Max time a single worker can run

	// Request Limits
	MaxRPS        int // Requests per second
	MaxBurstRPS   int // Burst tolerance
	MaxQueueDepth int // Max queued tasks

	// Compute Limits
	MaxCPUTimePerHour time.Duration // Total CPU time per hour
	MaxMemoryMB       int           // Max memory usage

	// Cost Limits (derives from plan tier)
	MaxInfraCostPerHour float64 // Max infrastructure cost (USD)
}

// TenantUsage tracks current resource consumption
type TenantUsage struct {
	TenantID string

	// Current State
	ActiveWorkers int
	QueuedTasks   int
	CurrentRPS    int

	// Hourly Counters
	CPUTimeThisHour time.Duration
	CostThisHour    float64
	HourlyResetAt   time.Time

	// Lifetime Counters
	TotalTasks   int64
	TotalCPUTime time.Duration
	TotalCost    float64
}

// ViolationRecord tracks cost limit violations
type ViolationRecord struct {
	TenantID      string
	ViolationType string
	Count         int
	FirstSeen     time.Time
	LastSeen      time.Time
	Throttled     bool
	ThrottleUntil time.Time
}

// NewCostGovernor creates a new cost governor
func NewCostGovernor() *CostGovernor {
	return &CostGovernor{
		limits:     make(map[string]*TenantLimits),
		usage:      make(map[string]*TenantUsage),
		violations: make(map[string]*ViolationRecord),
	}
}

// ========================================
// LIMIT CONFIGURATION
// ========================================

// SetLimits configures tenant limits (called during provisioning)
func (g *CostGovernor) SetLimits(tenantID string, limits *TenantLimits) {
	g.mu.Lock()
	defer g.mu.Unlock()

	limits.TenantID = tenantID
	g.limits[tenantID] = limits

	// Initialize usage tracking
	if _, exists := g.usage[tenantID]; !exists {
		g.usage[tenantID] = &TenantUsage{
			TenantID:      tenantID,
			HourlyResetAt: nextHour(),
		}
	}
}

// SetPlanTierLimits applies limits based on subscription tier
func (g *CostGovernor) SetPlanTierLimits(tenantID string, planTier string) {
	var limits *TenantLimits

	switch planTier {
	case "starter":
		limits = &TenantLimits{
			MaxConcurrentWorkers: 3,
			MaxWorkerLifetime:    5 * time.Minute,
			MaxRPS:               10,
			MaxBurstRPS:          20,
			MaxQueueDepth:        50,
			MaxCPUTimePerHour:    30 * time.Minute,
			MaxMemoryMB:          512,
			MaxInfraCostPerHour:  0.50, // $0.50/hour max
		}

	case "professional":
		limits = &TenantLimits{
			MaxConcurrentWorkers: 10,
			MaxWorkerLifetime:    30 * time.Minute,
			MaxRPS:               100,
			MaxBurstRPS:          200,
			MaxQueueDepth:        500,
			MaxCPUTimePerHour:    2 * time.Hour,
			MaxMemoryMB:          2048,
			MaxInfraCostPerHour:  5.00, // $5/hour max
		}

	case "enterprise":
		limits = &TenantLimits{
			MaxConcurrentWorkers: 50,
			MaxWorkerLifetime:    2 * time.Hour,
			MaxRPS:               1000,
			MaxBurstRPS:          2000,
			MaxQueueDepth:        5000,
			MaxCPUTimePerHour:    10 * time.Hour,
			MaxMemoryMB:          8192,
			MaxInfraCostPerHour:  50.00, // $50/hour max
		}

	default:
		limits = g.getDefaultLimits()
	}

	g.SetLimits(tenantID, limits)
}

func (g *CostGovernor) getDefaultLimits() *TenantLimits {
	return &TenantLimits{
		MaxConcurrentWorkers: 2,
		MaxWorkerLifetime:    2 * time.Minute,
		MaxRPS:               5,
		MaxBurstRPS:          10,
		MaxQueueDepth:        20,
		MaxCPUTimePerHour:    10 * time.Minute,
		MaxMemoryMB:          256,
		MaxInfraCostPerHour:  0.25,
	}
}

// ========================================
// PRE-EXECUTION CHECKS
// ========================================

// CanSpawnWorker checks if tenant is allowed to spawn another worker
func (g *CostGovernor) CanSpawnWorker(tenantID string) error {
	g.mu.RLock()
	defer g.mu.RUnlock()

	limits, usage := g.getLimitsAndUsage(tenantID)

	// Check if throttled
	if violation, exists := g.violations[tenantID]; exists {
		if violation.Throttled && time.Now().Before(violation.ThrottleUntil) {
			return fmt.Errorf("tenant %s is throttled until %s", tenantID, violation.ThrottleUntil.Format(time.RFC3339))
		}
	}

	// Check worker limit
	if usage.ActiveWorkers >= limits.MaxConcurrentWorkers {
		g.recordViolation(tenantID, "max_workers_exceeded")
		return fmt.Errorf("tenant %s exceeded max workers: %d/%d", tenantID, usage.ActiveWorkers, limits.MaxConcurrentWorkers)
	}

	// Check cost limit
	if usage.CostThisHour >= limits.MaxInfraCostPerHour {
		g.recordViolation(tenantID, "max_cost_exceeded")
		return fmt.Errorf("tenant %s exceeded hourly cost limit: $%.2f/$%.2f", tenantID, usage.CostThisHour, limits.MaxInfraCostPerHour)
	}

	return nil
}

// CanEnqueueTask checks if tenant can add more tasks to queue
func (g *CostGovernor) CanEnqueueTask(tenantID string) error {
	g.mu.RLock()
	defer g.mu.RUnlock()

	limits, usage := g.getLimitsAndUsage(tenantID)

	// Check queue depth
	if usage.QueuedTasks >= limits.MaxQueueDepth {
		g.recordViolation(tenantID, "max_queue_depth_exceeded")
		return fmt.Errorf("tenant %s exceeded max queue depth: %d/%d", tenantID, usage.QueuedTasks, limits.MaxQueueDepth)
	}

	// Check RPS
	if usage.CurrentRPS >= limits.MaxRPS {
		g.recordViolation(tenantID, "rate_limit_exceeded")
		return fmt.Errorf("tenant %s exceeded RPS limit: %d/%d", tenantID, usage.CurrentRPS, limits.MaxRPS)
	}

	return nil
}

// ========================================
// USAGE TRACKING
// ========================================

// TrackWorkerSpawned records a new worker activation
func (g *CostGovernor) TrackWorkerSpawned(tenantID string, workerCostPerHour float64) {
	g.mu.Lock()
	defer g.mu.Unlock()

	usage := g.getOrCreateUsage(tenantID)
	usage.ActiveWorkers++

	// Estimate cost increment
	// (Simplified: assumes worker runs for full hour, divide by 60 for per-minute)
	usage.CostThisHour += workerCostPerHour / 60.0
}

// TrackWorkerKilled records worker termination
func (g *CostGovernor) TrackWorkerKilled(tenantID string, cpuTime time.Duration) {
	g.mu.Lock()
	defer g.mu.Unlock()

	usage := g.getOrCreateUsage(tenantID)
	usage.ActiveWorkers--
	usage.CPUTimeThisHour += cpuTime
	usage.TotalCPUTime += cpuTime
}

// TrackTaskEnqueued increments queue depth
func (g *CostGovernor) TrackTaskEnqueued(tenantID string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	usage := g.getOrCreateUsage(tenantID)
	usage.QueuedTasks++
}

// TrackTaskCompleted decrements queue depth and updates counters
func (g *CostGovernor) TrackTaskCompleted(tenantID string, duration time.Duration) {
	g.mu.Lock()
	defer g.mu.Unlock()

	usage := g.getOrCreateUsage(tenantID)
	usage.QueuedTasks--
	usage.TotalTasks++

	// Reset hourly counters if needed
	if time.Now().After(usage.HourlyResetAt) {
		usage.CPUTimeThisHour = 0
		usage.CostThisHour = 0
		usage.HourlyResetAt = nextHour()
	}
}

// ========================================
// VIOLATION HANDLING
// ========================================

func (g *CostGovernor) recordViolation(tenantID string, violationType string) {
	violation, exists := g.violations[tenantID]
	if !exists {
		violation = &ViolationRecord{
			TenantID:      tenantID,
			ViolationType: violationType,
			FirstSeen:     time.Now(),
		}
		g.violations[tenantID] = violation
	}

	violation.Count++
	violation.LastSeen = time.Now()

	// Auto-throttle if violations exceed threshold
	if violation.Count > 5 {
		violation.Throttled = true
		violation.ThrottleUntil = time.Now().Add(5 * time.Minute)

		fmt.Printf("[COST GOVERNOR] Tenant %s throttled for %s violations (count: %d)\n",
			tenantID, violationType, violation.Count)
	}
}

// ResetThrottle manually unthrottles a tenant (admin action)
func (g *CostGovernor) ResetThrottle(tenantID string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if violation, exists := g.violations[tenantID]; exists {
		violation.Throttled = false
		violation.ThrottleUntil = time.Time{}
		violation.Count = 0
	}
}

// ========================================
// REPORTING
// ========================================

// GetUsageReport returns current usage for a tenant
func (g *CostGovernor) GetUsageReport(tenantID string) *UsageReport {
	g.mu.RLock()
	defer g.mu.RUnlock()

	limits, usage := g.getLimitsAndUsage(tenantID)

	report := &UsageReport{
		TenantID:      tenantID,
		Timestamp:     time.Now(),
		ActiveWorkers: usage.ActiveWorkers,
		MaxWorkers:    limits.MaxConcurrentWorkers,
		QueuedTasks:   usage.QueuedTasks,
		MaxQueue:      limits.MaxQueueDepth,
		CostThisHour:  usage.CostThisHour,
		MaxCostHour:   limits.MaxInfraCostPerHour,
		Utilization:   float64(usage.ActiveWorkers) / float64(limits.MaxConcurrentWorkers),
	}

	if violation, exists := g.violations[tenantID]; exists {
		report.IsThrottled = violation.Throttled
		report.ThrottleReason = violation.ViolationType
	}

	return report
}

// ========================================
// HELPERS
// ========================================

func (g *CostGovernor) getLimitsAndUsage(tenantID string) (*TenantLimits, *TenantUsage) {
	limits, exists := g.limits[tenantID]
	if !exists {
		limits = g.getDefaultLimits()
	}

	usage, exists := g.usage[tenantID]
	if !exists {
		usage = &TenantUsage{
			TenantID:      tenantID,
			HourlyResetAt: nextHour(),
		}
	}

	return limits, usage
}

func (g *CostGovernor) getOrCreateUsage(tenantID string) *TenantUsage {
	usage, exists := g.usage[tenantID]
	if !exists {
		usage = &TenantUsage{
			TenantID:      tenantID,
			HourlyResetAt: nextHour(),
		}
		g.usage[tenantID] = usage
	}
	return usage
}

func nextHour() time.Time {
	now := time.Now()
	return now.Truncate(time.Hour).Add(time.Hour)
}

// ========================================
// TYPES
// ========================================

type UsageReport struct {
	TenantID       string
	Timestamp      time.Time
	ActiveWorkers  int
	MaxWorkers     int
	QueuedTasks    int
	MaxQueue       int
	CostThisHour   float64
	MaxCostHour    float64
	Utilization    float64
	IsThrottled    bool
	ThrottleReason string
}
