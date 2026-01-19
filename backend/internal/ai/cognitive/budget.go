package cognitive

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// ========================================
// COGNITIVE BUDGET MANAGER
// ========================================
// Purpose: Cost control and rate limiting for AI operations
// Problem: Unlimited Gemini calls can burn $500+/day in tight loops
// Solution: Per-agent budgets with time windows and quota enforcement
// ========================================

// BudgetManager tracks and enforces AI usage limits
type BudgetManager struct {
	mu sync.RWMutex

	// Per-agent tracking
	agentUsage map[string]*AgentBudget

	// Global limits
	globalDailyLimit   int64
	globalDailySpent   int64
	globalDailyResetAt time.Time

	// Cost model
	costPerThink int64 // Cost in micro-dollars (e.g., 5000 = $0.005)
}

// AgentBudget tracks usage for a single agent
type AgentBudget struct {
	AgentID string

	// Quotas
	DailyLimit   int64
	HourlyLimit  int64
	MonthlyLimit int64

	// Current usage
	DailySpent   int64
	HourlySpent  int64
	MonthlySpent int64
	TotalCalls   int64

	// Time tracking
	DailyResetAt   time.Time
	HourlyResetAt  time.Time
	MonthlyResetAt time.Time

	// Circuit breaker
	IsThrottled   bool
	ThrottleUntil time.Time
}

// BudgetConfig defines limits
type BudgetConfig struct {
	GlobalDailyLimitUSD  float64 // e.g., 50.00 USD
	DefaultAgentDailyUSD float64 // e.g., 5.00 USD per agent
	CostPerThinkUSD      float64 // e.g., 0.005 USD per Think() call
}

// NewBudgetManager creates a new budget manager
func NewBudgetManager(config BudgetConfig) *BudgetManager {
	return &BudgetManager{
		agentUsage:         make(map[string]*AgentBudget),
		globalDailyLimit:   usdToMicroDollars(config.GlobalDailyLimitUSD),
		globalDailyResetAt: nextMidnight(),
		costPerThink:       usdToMicroDollars(config.CostPerThinkUSD),
	}
}

// ========================================
// PRE-AUTHORIZATION (Before Think)
// ========================================

// CanThink checks if an agent is allowed to make an AI call
func (b *BudgetManager) CanThink(ctx context.Context, agentID string) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	// 1. Check global budget
	if b.globalDailySpent >= b.globalDailyLimit {
		return ErrGlobalBudgetExhausted
	}

	// 2. Get or create agent budget
	agent := b.getOrCreateAgentBudget(agentID)

	// 3. Check if throttled
	if agent.IsThrottled && time.Now().Before(agent.ThrottleUntil) {
		return fmt.Errorf("agent %s is throttled until %s", agentID, agent.ThrottleUntil.Format(time.RFC3339))
	}

	// 4. Reset time windows if needed
	b.resetTimeWindows(agent)

	// 5. Check agent quotas
	if agent.DailySpent >= agent.DailyLimit {
		return fmt.Errorf("agent %s daily budget exhausted: %d/%d micro-USD", agentID, agent.DailySpent, agent.DailyLimit)
	}

	if agent.HourlySpent >= agent.HourlyLimit {
		return fmt.Errorf("agent %s hourly budget exhausted: %d/%d micro-USD", agentID, agent.HourlySpent, agent.HourlyLimit)
	}

	return nil
}

// ========================================
// POST-EXECUTION (After Think)
// ========================================

// RecordThink records usage after a Think() call
func (b *BudgetManager) RecordThink(ctx context.Context, agentID string, cost int64) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if cost == 0 {
		cost = b.costPerThink // Use default if not specified
	}

	agent := b.getOrCreateAgentBudget(agentID)

	// Update agent counters
	agent.DailySpent += cost
	agent.HourlySpent += cost
	agent.MonthlySpent += cost
	agent.TotalCalls++

	// Update global counter
	b.globalDailySpent += cost

	// Check for throttling conditions
	b.checkThrottling(agent)
}

// ========================================
// INTERNAL HELPERS
// ========================================

func (b *BudgetManager) getOrCreateAgentBudget(agentID string) *AgentBudget {
	agent, exists := b.agentUsage[agentID]
	if !exists {
		agent = &AgentBudget{
			AgentID:        agentID,
			DailyLimit:     usdToMicroDollars(5.00),   // $5 default per agent per day
			HourlyLimit:    usdToMicroDollars(1.00),   // $1 per hour
			MonthlyLimit:   usdToMicroDollars(100.00), // $100 per month
			DailyResetAt:   nextMidnight(),
			HourlyResetAt:  nextHour(),
			MonthlyResetAt: nextMonth(),
		}
		b.agentUsage[agentID] = agent
	}
	return agent
}

func (b *BudgetManager) resetTimeWindows(agent *AgentBudget) {
	now := time.Now()

	// Reset daily
	if now.After(agent.DailyResetAt) {
		agent.DailySpent = 0
		agent.DailyResetAt = nextMidnight()
	}

	// Reset hourly
	if now.After(agent.HourlyResetAt) {
		agent.HourlySpent = 0
		agent.HourlyResetAt = nextHour()
	}

	// Reset monthly
	if now.After(agent.MonthlyResetAt) {
		agent.MonthlySpent = 0
		agent.MonthlyResetAt = nextMonth()
	}

	// Reset global daily
	if now.After(b.globalDailyResetAt) {
		b.globalDailySpent = 0
		b.globalDailyResetAt = nextMidnight()
	}
}

func (b *BudgetManager) checkThrottling(agent *AgentBudget) {
	// If agent hit 80% of daily limit, throttle for 1 hour
	if float64(agent.DailySpent) >= float64(agent.DailyLimit)*0.8 {
		agent.IsThrottled = true
		agent.ThrottleUntil = time.Now().Add(1 * time.Hour)
	}

	// If agent is making more than 10 calls per minute, throttle
	// (This would require call rate tracking - simplified for now)
}

// ========================================
// ADMIN OPERATIONS
// ========================================

// SetAgentBudget manually sets an agent's budget
func (b *BudgetManager) SetAgentBudget(agentID string, dailyUSD, hourlyUSD, monthlyUSD float64) {
	b.mu.Lock()
	defer b.mu.Unlock()

	agent := b.getOrCreateAgentBudget(agentID)
	agent.DailyLimit = usdToMicroDollars(dailyUSD)
	agent.HourlyLimit = usdToMicroDollars(hourlyUSD)
	agent.MonthlyLimit = usdToMicroDollars(monthlyUSD)
}

// GetAgentStats returns current usage stats
func (b *BudgetManager) GetAgentStats(agentID string) *AgentBudget {
	b.mu.RLock()
	defer b.mu.RUnlock()

	agent, exists := b.agentUsage[agentID]
	if !exists {
		return nil
	}

	// Return a copy
	return &AgentBudget{
		AgentID:       agent.AgentID,
		DailyLimit:    agent.DailyLimit,
		HourlyLimit:   agent.HourlyLimit,
		MonthlyLimit:  agent.MonthlyLimit,
		DailySpent:    agent.DailySpent,
		HourlySpent:   agent.HourlySpent,
		MonthlySpent:  agent.MonthlySpent,
		TotalCalls:    agent.TotalCalls,
		IsThrottled:   agent.IsThrottled,
		ThrottleUntil: agent.ThrottleUntil,
	}
}

// GetGlobalStats returns system-wide usage
func (b *BudgetManager) GetGlobalStats() map[string]interface{} {
	b.mu.RLock()
	defer b.mu.RUnlock()

	return map[string]interface{}{
		"global_daily_spent_usd": microDollarsToUSD(b.globalDailySpent),
		"global_daily_limit_usd": microDollarsToUSD(b.globalDailyLimit),
		"utilization_percent":    float64(b.globalDailySpent) / float64(b.globalDailyLimit) * 100,
		"total_agents":           len(b.agentUsage),
		"reset_at":               b.globalDailyResetAt.Format(time.RFC3339),
	}
}

// ResetThrottle manually unthrottles an agent
func (b *BudgetManager) ResetThrottle(agentID string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if agent, exists := b.agentUsage[agentID]; exists {
		agent.IsThrottled = false
		agent.ThrottleUntil = time.Time{}
	}
}

// ========================================
// UTILITIES
// ========================================

func usdToMicroDollars(usd float64) int64 {
	return int64(usd * 1_000_000)
}

func microDollarsToUSD(microUSD int64) float64 {
	return float64(microUSD) / 1_000_000
}

func nextMidnight() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
}

func nextHour() time.Time {
	now := time.Now()
	return now.Truncate(time.Hour).Add(time.Hour)
}

func nextMonth() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
}

// ========================================
// ERRORS
// ========================================

var (
	ErrGlobalBudgetExhausted = fmt.Errorf("global daily AI budget exhausted")
	ErrAgentBudgetExhausted  = fmt.Errorf("agent budget exhausted")
	ErrAgentThrottled        = fmt.Errorf("agent is throttled")
)

// ========================================
// WRAPPER: Managed Cognitive Engine
// ========================================

// ManagedEngine wraps a CognitiveEngine with budget enforcement
type ManagedEngine struct {
	engine  CognitiveEngine
	budget  *BudgetManager
	agentID string
}

// NewManagedEngine creates a budget-aware cognitive engine
func NewManagedEngine(engine CognitiveEngine, budget *BudgetManager, agentID string) *ManagedEngine {
	return &ManagedEngine{
		engine:  engine,
		budget:  budget,
		agentID: agentID,
	}
}

// Think executes AI with automatic budget checking
func (m *ManagedEngine) Think(ctx context.Context, goal string, state interface{}) (*Decision, error) {
	// Pre-check budget
	if err := m.budget.CanThink(ctx, m.agentID); err != nil {
		return nil, fmt.Errorf("budget check failed: %w", err)
	}

	// Execute AI
	decision, err := m.engine.Think(ctx, goal, state)

	// Record usage (even if failed, to track attempts)
	m.budget.RecordThink(ctx, m.agentID, 0)

	return decision, err
}

// Name delegates to underlying engine
func (m *ManagedEngine) Name() string {
	return m.engine.Name() + " (managed)"
}
