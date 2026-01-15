// Package alerting implements FASE 4 - Real Alerting System
// "Alertas por SLA quebrado, ataque na borda, degradação progressiva"
package alerting

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ========================================
// ALERT ENGINE
// "Alertas inteligentes, não spam"
// ========================================

// AlertSeverity defines alert severity levels
type AlertSeverity string

const (
	SeverityInfo     AlertSeverity = "info"
	SeverityWarning  AlertSeverity = "warning"
	SeverityCritical AlertSeverity = "critical"
	SeverityEmergency AlertSeverity = "emergency"
)

// AlertType defines the type of alert
type AlertType string

const (
	AlertTypePressure     AlertType = "pressure"      // System pressure
	AlertTypeSLO          AlertType = "slo"           // SLO violation
	AlertTypeErrorRate    AlertType = "error_rate"    // High error rate
	AlertTypeLatency      AlertType = "latency"       // High latency
	AlertTypeAttack       AlertType = "attack"        // Attack detected
	AlertTypeCircuitOpen  AlertType = "circuit_open"  // Circuit breaker opened
	AlertTypeQuarantine   AlertType = "quarantine"    // Entity quarantined
	AlertTypeMemory       AlertType = "memory"        // Memory pressure
	AlertTypeCustom       AlertType = "custom"        // Custom alert
)

// Alert represents a single alert
type Alert struct {
	ID          string            `json:"id"`
	Type        AlertType         `json:"type"`
	Severity    AlertSeverity     `json:"severity"`
	Title       string            `json:"title"`
	Message     string            `json:"message"`
	Source      string            `json:"source"`
	Tags        map[string]string `json:"tags,omitempty"`
	Value       float64           `json:"value,omitempty"`
	Threshold   float64           `json:"threshold,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	ResolvedAt  *time.Time        `json:"resolved_at,omitempty"`
	AckedAt     *time.Time        `json:"acked_at,omitempty"`
	AckedBy     string            `json:"acked_by,omitempty"`
	Count       int               `json:"count"` // Deduplication count
	LastSeen    time.Time         `json:"last_seen"`
}

// AlertRule defines when to trigger an alert
type AlertRule struct {
	Name        string        `json:"name"`
	Type        AlertType     `json:"type"`
	Condition   string        `json:"condition"` // Human readable
	Threshold   float64       `json:"threshold"`
	Severity    AlertSeverity `json:"severity"`
	Cooldown    time.Duration `json:"cooldown"`    // Min time between alerts
	Enabled     bool          `json:"enabled"`
	Tags        map[string]string `json:"tags,omitempty"`
}

// AlertEngine manages alerts
type AlertEngine struct {
	alerts      map[string]*Alert
	rules       map[string]*AlertRule
	channels    []AlertChannel
	history     []*Alert
	historySize int
	
	// Deduplication
	lastAlerts  map[string]time.Time // key -> last alert time
	cooldowns   map[string]time.Duration
	
	// Persistence
	persistence *AlertPersistence
	
	mu sync.RWMutex
}

// AlertChannel is an interface for alert delivery
type AlertChannel interface {
	Name() string
	Send(alert *Alert) error
	IsEnabled() bool
}

// NewAlertEngine creates a new alert engine
func NewAlertEngine() *AlertEngine {
	engine := &AlertEngine{
		alerts:      make(map[string]*Alert),
		rules:       make(map[string]*AlertRule),
		channels:    make([]AlertChannel, 0),
		history:     make([]*Alert, 0),
		historySize: 1000,
		lastAlerts:  make(map[string]time.Time),
		cooldowns:   make(map[string]time.Duration),
	}
	
	// Add default rules
	engine.addDefaultRules()
	
	// Add default channels
	engine.AddChannel(NewLogChannel())
	
	return engine
}

// addDefaultRules adds default alerting rules
func (e *AlertEngine) addDefaultRules() {
	defaultRules := []*AlertRule{
		{
			Name:      "high_error_rate",
			Type:      AlertTypeErrorRate,
			Condition: "Error rate > 10%",
			Threshold: 10.0,
			Severity:  SeverityWarning,
			Cooldown:  5 * time.Minute,
			Enabled:   true,
		},
		{
			Name:      "critical_error_rate",
			Type:      AlertTypeErrorRate,
			Condition: "Error rate > 25%",
			Threshold: 25.0,
			Severity:  SeverityCritical,
			Cooldown:  1 * time.Minute,
			Enabled:   true,
		},
		{
			Name:      "high_latency",
			Type:      AlertTypeLatency,
			Condition: "P99 latency > 2s",
			Threshold: 2000.0, // ms
			Severity:  SeverityWarning,
			Cooldown:  5 * time.Minute,
			Enabled:   true,
		},
		{
			Name:      "critical_latency",
			Type:      AlertTypeLatency,
			Condition: "P99 latency > 5s",
			Threshold: 5000.0, // ms
			Severity:  SeverityCritical,
			Cooldown:  1 * time.Minute,
			Enabled:   true,
		},
		{
			Name:      "slo_budget_low",
			Type:      AlertTypeSLO,
			Condition: "Error budget < 25%",
			Threshold: 25.0,
			Severity:  SeverityWarning,
			Cooldown:  15 * time.Minute,
			Enabled:   true,
		},
		{
			Name:      "slo_budget_exhausted",
			Type:      AlertTypeSLO,
			Condition: "Error budget exhausted",
			Threshold: 0.0,
			Severity:  SeverityCritical,
			Cooldown:  5 * time.Minute,
			Enabled:   true,
		},
		{
			Name:      "pressure_elevated",
			Type:      AlertTypePressure,
			Condition: "System pressure high",
			Threshold: 2.0, // high level (not elevated, to reduce noise)
			Severity:  SeverityWarning,
			Cooldown:  30 * time.Minute, // Increased to reduce alert spam
			Enabled:   true,
		},
		{
			Name:      "pressure_critical",
			Type:      AlertTypePressure,
			Condition: "System pressure critical",
			Threshold: 3.0, // critical level
			Severity:  SeverityEmergency,
			Cooldown:  10 * time.Minute, // Increased from 1 min to reduce DB load
			Enabled:   true,
		},
		{
			Name:      "memory_high",
			Type:      AlertTypeMemory,
			Condition: "Memory usage > 85%",
			Threshold: 85.0,
			Severity:  SeverityWarning,
			Cooldown:  5 * time.Minute,
			Enabled:   true,
		},
		{
			Name:      "memory_critical",
			Type:      AlertTypeMemory,
			Condition: "Memory usage > 95%",
			Threshold: 95.0,
			Severity:  SeverityCritical,
			Cooldown:  1 * time.Minute,
			Enabled:   true,
		},
	}
	
	for _, rule := range defaultRules {
		e.rules[rule.Name] = rule
		e.cooldowns[rule.Name] = rule.Cooldown
	}
}

// ========================================
// ALERT FIRING & MANAGEMENT
// ========================================

// Fire creates and dispatches an alert
func (e *AlertEngine) Fire(alertType AlertType, severity AlertSeverity, title, message, source string, value, threshold float64, tags map[string]string) *Alert {
	e.mu.Lock()
	defer e.mu.Unlock()

	// Generate deduplication key
	dedupKey := fmt.Sprintf("%s:%s:%s", alertType, source, title)

	// Check cooldown
	if lastTime, exists := e.lastAlerts[dedupKey]; exists {
		cooldown := e.getCooldownForType(alertType, severity)
		if time.Since(lastTime) < cooldown {
			// Update existing alert count
			if existing, ok := e.alerts[dedupKey]; ok {
				existing.Count++
				existing.LastSeen = time.Now()
				return existing
			}
			return nil
		}
	}

	// Create new alert
	alert := &Alert{
		ID:        uuid.New().String(),
		Type:      alertType,
		Severity:  severity,
		Title:     title,
		Message:   message,
		Source:    source,
		Tags:      tags,
		Value:     value,
		Threshold: threshold,
		CreatedAt: time.Now(),
		Count:     1,
		LastSeen:  time.Now(),
	}

	// Store alert
	e.alerts[dedupKey] = alert
	e.lastAlerts[dedupKey] = time.Now()

	// Add to history
	e.addToHistory(alert)

	// Persist to database
	if e.persistence != nil && e.persistence.IsEnabled() {
		go e.persistence.Save(alert)
	}

	// Record metrics
	RecordAlertFired(severity, alertType)

	// Dispatch to channels
	e.dispatch(alert)

	log.Printf("[ALERT] %s | %s | %s: %s (value=%.2f, threshold=%.2f)",
		severity, alertType, title, message, value, threshold)

	return alert
}

// FireFromRule fires an alert based on a rule
func (e *AlertEngine) FireFromRule(ruleName string, value float64, source string, tags map[string]string) *Alert {
	e.mu.RLock()
	rule, exists := e.rules[ruleName]
	e.mu.RUnlock()

	if !exists || !rule.Enabled {
		return nil
	}

	// Check if threshold is exceeded
	if !e.checkThreshold(rule, value) {
		return nil
	}

	message := fmt.Sprintf("%s: %.2f (threshold: %.2f)", rule.Condition, value, rule.Threshold)
	
	// Merge tags
	allTags := make(map[string]string)
	for k, v := range rule.Tags {
		allTags[k] = v
	}
	for k, v := range tags {
		allTags[k] = v
	}

	return e.Fire(rule.Type, rule.Severity, rule.Name, message, source, value, rule.Threshold, allTags)
}

// checkThreshold checks if value exceeds rule threshold
func (e *AlertEngine) checkThreshold(rule *AlertRule, value float64) bool {
	switch rule.Type {
	case AlertTypeErrorRate, AlertTypeLatency, AlertTypeMemory:
		return value >= rule.Threshold
	case AlertTypeSLO:
		// SLO: alert when budget is BELOW threshold
		return value <= rule.Threshold
	case AlertTypePressure:
		return value >= rule.Threshold
	default:
		return value >= rule.Threshold
	}
}

// getCooldownForType returns cooldown for alert type/severity
func (e *AlertEngine) getCooldownForType(alertType AlertType, severity AlertSeverity) time.Duration {
	// Emergency alerts have shorter cooldown
	if severity == SeverityEmergency {
		return 30 * time.Second
	}
	if severity == SeverityCritical {
		return 1 * time.Minute
	}
	
	// Default cooldowns by type
	switch alertType {
	case AlertTypeAttack:
		return 30 * time.Second
	case AlertTypeCircuitOpen, AlertTypeQuarantine:
		return 1 * time.Minute
	default:
		return 5 * time.Minute
	}
}

// Resolve marks an alert as resolved
func (e *AlertEngine) Resolve(alertID string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()

	for key, alert := range e.alerts {
		if alert.ID == alertID {
			now := time.Now()
			alert.ResolvedAt = &now
			delete(e.alerts, key)
			
			// Persist resolution
			if e.persistence != nil && e.persistence.IsEnabled() {
				go e.persistence.Resolve(alertID)
			}
			
			// Record metrics
			RecordAlertResolved()
			
			log.Printf("[ALERT RESOLVED] %s: %s", alert.Title, alert.Message)
			return true
		}
	}
	return false
}

// ResolveByKey resolves alert by dedup key
func (e *AlertEngine) ResolveByKey(dedupKey string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()

	if alert, exists := e.alerts[dedupKey]; exists {
		now := time.Now()
		alert.ResolvedAt = &now
		delete(e.alerts, dedupKey)
		
		// Persist resolution
		if e.persistence != nil && e.persistence.IsEnabled() {
			go e.persistence.Resolve(alert.ID)
		}
		
		log.Printf("[ALERT RESOLVED] %s: %s", alert.Title, alert.Message)
		return true
	}
	return false
}

// Acknowledge marks an alert as acknowledged
func (e *AlertEngine) Acknowledge(alertID, ackedBy string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()

	for _, alert := range e.alerts {
		if alert.ID == alertID {
			now := time.Now()
			alert.AckedAt = &now
			alert.AckedBy = ackedBy
			
			// Persist acknowledgment
			if e.persistence != nil && e.persistence.IsEnabled() {
				go e.persistence.Acknowledge(alertID, ackedBy)
			}
			
			// Record metrics
			RecordAlertAcked()
			
			log.Printf("[ALERT ACKED] %s by %s", alert.Title, ackedBy)
			return true
		}
	}
	return false
}

// ========================================
// CHANNEL MANAGEMENT
// ========================================

// AddChannel adds an alert channel
func (e *AlertEngine) AddChannel(channel AlertChannel) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.channels = append(e.channels, channel)
}

// dispatch sends alert to all enabled channels
func (e *AlertEngine) dispatch(alert *Alert) {
	for _, channel := range e.channels {
		if channel.IsEnabled() {
			go func(ch AlertChannel) {
				if err := ch.Send(alert); err != nil {
					log.Printf("[ALERT CHANNEL ERROR] %s: %v", ch.Name(), err)
				}
			}(channel)
		}
	}
}

// ========================================
// RULE MANAGEMENT
// ========================================

// AddRule adds a custom alerting rule
func (e *AlertEngine) AddRule(rule *AlertRule) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.rules[rule.Name] = rule
	e.cooldowns[rule.Name] = rule.Cooldown
}

// GetRule returns a rule by name
func (e *AlertEngine) GetRule(name string) *AlertRule {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.rules[name]
}

// GetRules returns all rules
func (e *AlertEngine) GetRules() []*AlertRule {
	e.mu.RLock()
	defer e.mu.RUnlock()
	
	rules := make([]*AlertRule, 0, len(e.rules))
	for _, rule := range e.rules {
		rules = append(rules, rule)
	}
	return rules
}

// EnableRule enables a rule
func (e *AlertEngine) EnableRule(name string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	
	if rule, exists := e.rules[name]; exists {
		rule.Enabled = true
		return true
	}
	return false
}

// DisableRule disables a rule
func (e *AlertEngine) DisableRule(name string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	
	if rule, exists := e.rules[name]; exists {
		rule.Enabled = false
		return true
	}
	return false
}

// ========================================
// ALERT QUERIES
// ========================================

// GetActiveAlerts returns all active (unresolved) alerts
func (e *AlertEngine) GetActiveAlerts() []*Alert {
	e.mu.RLock()
	defer e.mu.RUnlock()

	alerts := make([]*Alert, 0, len(e.alerts))
	for _, alert := range e.alerts {
		if alert.ResolvedAt == nil {
			alerts = append(alerts, alert)
		}
	}
	return alerts
}

// GetAlertsBySeverity returns alerts filtered by severity
func (e *AlertEngine) GetAlertsBySeverity(severity AlertSeverity) []*Alert {
	e.mu.RLock()
	defer e.mu.RUnlock()

	var alerts []*Alert
	for _, alert := range e.alerts {
		if alert.Severity == severity && alert.ResolvedAt == nil {
			alerts = append(alerts, alert)
		}
	}
	return alerts
}

// GetAlertsByType returns alerts filtered by type
func (e *AlertEngine) GetAlertsByType(alertType AlertType) []*Alert {
	e.mu.RLock()
	defer e.mu.RUnlock()

	var alerts []*Alert
	for _, alert := range e.alerts {
		if alert.Type == alertType && alert.ResolvedAt == nil {
			alerts = append(alerts, alert)
		}
	}
	return alerts
}

// GetAlert returns a specific alert by ID
func (e *AlertEngine) GetAlert(alertID string) *Alert {
	e.mu.RLock()
	defer e.mu.RUnlock()

	for _, alert := range e.alerts {
		if alert.ID == alertID {
			return alert
		}
	}
	return nil
}

// ========================================
// HISTORY & STATS
// ========================================

// addToHistory adds alert to history
func (e *AlertEngine) addToHistory(alert *Alert) {
	e.history = append(e.history, alert)
	if len(e.history) > e.historySize {
		e.history = e.history[1:]
	}
}

// GetHistory returns alert history
func (e *AlertEngine) GetHistory(limit int) []*Alert {
	e.mu.RLock()
	defer e.mu.RUnlock()

	if limit <= 0 || limit > len(e.history) {
		limit = len(e.history)
	}

	// Return most recent first
	result := make([]*Alert, limit)
	for i := 0; i < limit; i++ {
		result[i] = e.history[len(e.history)-1-i]
	}
	return result
}

// GetStats returns alerting statistics
func (e *AlertEngine) GetStats() *AlertStats {
	e.mu.RLock()
	defer e.mu.RUnlock()

	stats := &AlertStats{
		TotalActive:    len(e.alerts),
		TotalHistory:   len(e.history),
		BySeverity:     make(map[AlertSeverity]int),
		ByType:         make(map[AlertType]int),
		Acknowledged:   0,
		Unacknowledged: 0,
	}

	for _, alert := range e.alerts {
		if alert.ResolvedAt == nil {
			stats.BySeverity[alert.Severity]++
			stats.ByType[alert.Type]++
			if alert.AckedAt != nil {
				stats.Acknowledged++
			} else {
				stats.Unacknowledged++
			}
		}
	}

	// Count recent alerts (last hour)
	oneHourAgo := time.Now().Add(-1 * time.Hour)
	for _, alert := range e.history {
		if alert.CreatedAt.After(oneHourAgo) {
			stats.LastHour++
		}
	}

	return stats
}

// AlertStats holds alerting statistics
type AlertStats struct {
	TotalActive    int                      `json:"total_active"`
	TotalHistory   int                      `json:"total_history"`
	BySeverity     map[AlertSeverity]int    `json:"by_severity"`
	ByType         map[AlertType]int        `json:"by_type"`
	Acknowledged   int                      `json:"acknowledged"`
	Unacknowledged int                      `json:"unacknowledged"`
	LastHour       int                      `json:"last_hour"`
}

// ========================================
// GLOBAL INSTANCE
// ========================================

var (
	globalEngine *AlertEngine
	engineOnce   sync.Once
)

// GetAlertEngine returns the global alert engine instance
func GetAlertEngine() *AlertEngine {
	engineOnce.Do(func() {
		globalEngine = NewAlertEngine()
	})
	return globalEngine
}
