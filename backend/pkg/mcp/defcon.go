package mcp

import (
	"log"
	"sync"
	"sync/atomic"
	"time"

	"prost-qs/backend/pkg/alerting"
)

// ========================================
// DEFCON SYSTEM
// "Governança dinâmica baseada em pressão"
// ========================================

type DefconLevel int32

const (
	DefconNormal      DefconLevel = 5 // All systems go
	DefconElevated    DefconLevel = 4 // Enhanced logging
	DefconSubstantial DefconLevel = 3 // Rate limiting active
	DefconSevere      DefconLevel = 2 // Non-essential features off
	DefconCritical    DefconLevel = 1 // Emergency mode - Kill Switch
)

// DefconManager handles system-wide alert levels.
type DefconManager struct {
	level     int32 // atomic access
	mu        sync.RWMutex
	history   []DefconChange
	listeners []func(DefconLevel)

	// Rate limiting config per level
	rateLimits map[DefconLevel]int // requests per second
}

// DefconChange records a level transition.
type DefconChange struct {
	From      DefconLevel
	To        DefconLevel
	Reason    string
	Timestamp time.Time
	Automatic bool // true if triggered by WarObs, false if manual
}

// NewDefconManager creates a new manager at normal level.
func NewDefconManager() *DefconManager {
	return &DefconManager{
		level:   int32(DefconNormal),
		history: make([]DefconChange, 0),
		rateLimits: map[DefconLevel]int{
			DefconNormal:      0,    // No limit
			DefconElevated:    1000, // 1000 rps
			DefconSubstantial: 500,  // 500 rps
			DefconSevere:      100,  // 100 rps
			DefconCritical:    0,    // Blocked (Kill Switch)
		},
	}
}

// GetLevel returns the current DEFCON level.
func (dm *DefconManager) GetLevel() DefconLevel {
	return DefconLevel(atomic.LoadInt32(&dm.level))
}

// SetLevel changes the DEFCON level.
func (dm *DefconManager) SetLevel(newLevel DefconLevel, reason string, automatic bool) {
	oldLevel := dm.GetLevel()
	if oldLevel == newLevel {
		return
	}

	atomic.StoreInt32(&dm.level, int32(newLevel))

	// Fire alert to external channels (Slack, PagerDuty, etc.)
	alerting.AlertDefconChanged(int(newLevel), dm.getLevelName(newLevel), reason)

	change := DefconChange{
		From:      oldLevel,
		To:        newLevel,
		Reason:    reason,
		Timestamp: time.Now(),
		Automatic: automatic,
	}

	dm.mu.Lock()
	dm.history = append(dm.history, change)
	// Keep last 100 changes
	if len(dm.history) > 100 {
		dm.history = dm.history[1:]
	}
	dm.mu.Unlock()

	log.Printf("🚨 [DEFCON] Level changed: %d -> %d | Reason: %s | Auto: %v",
		oldLevel, newLevel, reason, automatic)

	// Notify listeners
	for _, listener := range dm.listeners {
		go listener(newLevel)
	}
}

// Escalate raises the alert level by 1.
func (dm *DefconManager) Escalate(reason string, automatic bool) {
	current := dm.GetLevel()
	if current > DefconCritical {
		dm.SetLevel(current-1, reason, automatic)
	}
}

// Deescalate lowers the alert level by 1.
func (dm *DefconManager) Deescalate(reason string) {
	current := dm.GetLevel()
	if current < DefconNormal {
		dm.SetLevel(current+1, reason, false)
	}
}

// GetRateLimit returns the rate limit for current level.
func (dm *DefconManager) GetRateLimit() int {
	return dm.rateLimits[dm.GetLevel()]
}

// OnChange registers a listener for level changes.
func (dm *DefconManager) OnChange(listener func(DefconLevel)) {
	dm.mu.Lock()
	dm.listeners = append(dm.listeners, listener)
	dm.mu.Unlock()
}

// GetHistory returns recent level changes.
func (dm *DefconManager) GetHistory() []DefconChange {
	dm.mu.RLock()
	defer dm.mu.RUnlock()
	result := make([]DefconChange, len(dm.history))
	copy(result, dm.history)
	return result
}

// GetStatus returns a summary of current state.
func (dm *DefconManager) GetStatus() map[string]interface{} {
	level := dm.GetLevel()
	return map[string]interface{}{
		"level":         int(level),
		"level_name":    dm.getLevelName(level),
		"rate_limit":    dm.GetRateLimit(),
		"is_critical":   level == DefconCritical,
		"history_count": len(dm.history),
	}
}

func (dm *DefconManager) getLevelName(level DefconLevel) string {
	switch level {
	case DefconNormal:
		return "NORMAL"
	case DefconElevated:
		return "ELEVATED"
	case DefconSubstantial:
		return "SUBSTANTIAL"
	case DefconSevere:
		return "SEVERE"
	case DefconCritical:
		return "CRITICAL"
	default:
		return "UNKNOWN"
	}
}

// ShouldBlock returns true if requests should be blocked (DEFCON 1).
func (dm *DefconManager) ShouldBlock() bool {
	return dm.GetLevel() == DefconCritical
}

// ShouldRateLimit returns true if rate limiting is active (DEFCON 3+).
func (dm *DefconManager) ShouldRateLimit() bool {
	return dm.GetLevel() <= DefconSubstantial
}
