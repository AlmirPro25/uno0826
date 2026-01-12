package immunity

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

type AlertLevel int

const (
	AlertLevelLog        AlertLevel = 1
	AlertLevelDashboard  AlertLevel = 2
	AlertLevelTeam       AlertLevel = 3
	AlertLevelOnCall     AlertLevel = 4
	AlertLevelManagement AlertLevel = 5
)

func (l AlertLevel) String() string {
	switch l {
	case AlertLevelLog:
		return "LOG"
	case AlertLevelDashboard:
		return "DASHBOARD"
	case AlertLevelTeam:
		return "TEAM"
	case AlertLevelOnCall:
		return "ON_CALL"
	case AlertLevelManagement:
		return "MANAGEMENT"
	default:
		return "UNKNOWN"
	}
}

type AlertSeverity string

const (
	SeverityInfo     AlertSeverity = "info"
	SeverityWarning  AlertSeverity = "warning"
	SeverityError    AlertSeverity = "error"
	SeverityCritical AlertSeverity = "critical"
	SeverityFatal    AlertSeverity = "fatal"
)

type AlertCategory string

const (
	CategorySecurity     AlertCategory = "security"
	CategoryPerformance  AlertCategory = "performance"
	CategoryAvailability AlertCategory = "availability"
	CategoryData         AlertCategory = "data"
	CategoryBusiness     AlertCategory = "business"
	CategoryInvariant    AlertCategory = "invariant"
)

type Alert struct {
	ID              uuid.UUID              `json:"id"`
	Title           string                 `json:"title"`
	Message         string                 `json:"message"`
	Severity        AlertSeverity          `json:"severity"`
	Category        AlertCategory          `json:"category"`
	Source          string                 `json:"source"`
	Context         map[string]interface{} `json:"context"`
	CreatedAt       time.Time              `json:"created_at"`
	CurrentLevel    AlertLevel             `json:"current_level"`
	EscalatedAt     []time.Time            `json:"escalated_at"`
	AckedAt         *time.Time             `json:"acked_at,omitempty"`
	AckedBy         string                 `json:"acked_by,omitempty"`
	ResolvedAt      *time.Time             `json:"resolved_at,omitempty"`
	ResolvedBy      string                 `json:"resolved_by,omitempty"`
	Resolution      string                 `json:"resolution,omitempty"`
	Fingerprint     string                 `json:"fingerprint"`
	OccurrenceCount int                    `json:"occurrence_count"`
	LastOccurrence  time.Time              `json:"last_occurrence"`
}

func (a *Alert) IsActive() bool { return a.ResolvedAt == nil }
func (a *Alert) IsAcked() bool  { return a.AckedAt != nil }

type EscalationConfig struct {
	Level1To2Duration  time.Duration
	Level2To3Duration  time.Duration
	Level3To4Duration  time.Duration
	Level4To5Duration  time.Duration
	CriticalStartLevel AlertLevel
	FatalStartLevel    AlertLevel
}

func DefaultEscalationConfig() EscalationConfig {
	return EscalationConfig{
		Level1To2Duration:  5 * time.Minute,
		Level2To3Duration:  10 * time.Minute,
		Level3To4Duration:  15 * time.Minute,
		Level4To5Duration:  30 * time.Minute,
		CriticalStartLevel: AlertLevelTeam,
		FatalStartLevel:    AlertLevelOnCall,
	}
}

type EscalationHandler func(alert *Alert, level AlertLevel) error

type AlertEscalator struct {
	mu            sync.RWMutex
	config        EscalationConfig
	alerts        map[uuid.UUID]*Alert
	fingerprints  map[string]uuid.UUID
	handlers      map[AlertLevel][]EscalationHandler
	checkInterval time.Duration
	stopChan      chan struct{}
}

func NewAlertEscalator(config EscalationConfig) *AlertEscalator {
	ae := &AlertEscalator{
		config:        config,
		alerts:        make(map[uuid.UUID]*Alert),
		fingerprints:  make(map[string]uuid.UUID),
		handlers:      make(map[AlertLevel][]EscalationHandler),
		checkInterval: time.Minute,
		stopChan:      make(chan struct{}),
	}
	go ae.escalationLoop()
	return ae
}

func (ae *AlertEscalator) RegisterHandler(level AlertLevel, handler EscalationHandler) {
	ae.mu.Lock()
	defer ae.mu.Unlock()
	ae.handlers[level] = append(ae.handlers[level], handler)
}

func (ae *AlertEscalator) CreateAlert(title, message string, severity AlertSeverity, category AlertCategory, source string, context map[string]interface{}) *Alert {
	ae.mu.Lock()
	defer ae.mu.Unlock()
	fingerprint := fmt.Sprintf("%s:%s:%s:%s", category, severity, source, title)
	if existingID, exists := ae.fingerprints[fingerprint]; exists {
		if existing, ok := ae.alerts[existingID]; ok && existing.IsActive() {
			existing.OccurrenceCount++
			existing.LastOccurrence = time.Now()
			existing.Context = context
			return existing
		}
	}
	startLevel := AlertLevelLog
	switch severity {
	case SeverityCritical:
		startLevel = ae.config.CriticalStartLevel
	case SeverityFatal:
		startLevel = ae.config.FatalStartLevel
	}
	alert := &Alert{
		ID: uuid.New(), Title: title, Message: message, Severity: severity,
		Category: category, Source: source, Context: context, CreatedAt: time.Now(),
		CurrentLevel: startLevel, EscalatedAt: []time.Time{time.Now()},
		Fingerprint: fingerprint, OccurrenceCount: 1, LastOccurrence: time.Now(),
	}
	ae.alerts[alert.ID] = alert
	ae.fingerprints[fingerprint] = alert.ID
	ae.executeHandlers(alert, startLevel)
	return alert
}

func (ae *AlertEscalator) Acknowledge(alertID uuid.UUID, ackedBy string) bool {
	ae.mu.Lock()
	defer ae.mu.Unlock()
	alert, exists := ae.alerts[alertID]
	if !exists || !alert.IsActive() {
		return false
	}
	now := time.Now()
	alert.AckedAt = &now
	alert.AckedBy = ackedBy
	return true
}

func (ae *AlertEscalator) Resolve(alertID uuid.UUID, resolvedBy, resolution string) bool {
	ae.mu.Lock()
	defer ae.mu.Unlock()
	alert, exists := ae.alerts[alertID]
	if !exists || !alert.IsActive() {
		return false
	}
	now := time.Now()
	alert.ResolvedAt = &now
	alert.ResolvedBy = resolvedBy
	alert.Resolution = resolution
	delete(ae.fingerprints, alert.Fingerprint)
	return true
}

func (ae *AlertEscalator) GetAlert(alertID uuid.UUID) *Alert {
	ae.mu.RLock()
	defer ae.mu.RUnlock()
	return ae.alerts[alertID]
}

func (ae *AlertEscalator) GetActiveAlerts() []*Alert {
	ae.mu.RLock()
	defer ae.mu.RUnlock()
	var active []*Alert
	for _, alert := range ae.alerts {
		if alert.IsActive() {
			active = append(active, alert)
		}
	}
	return active
}

func (ae *AlertEscalator) GetAlertsByLevel(level AlertLevel) []*Alert {
	ae.mu.RLock()
	defer ae.mu.RUnlock()
	var result []*Alert
	for _, alert := range ae.alerts {
		if alert.IsActive() && alert.CurrentLevel >= level {
			result = append(result, alert)
		}
	}
	return result
}

func (ae *AlertEscalator) escalationLoop() {
	ticker := time.NewTicker(ae.checkInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			ae.checkEscalations()
		case <-ae.stopChan:
			return
		}
	}
}

func (ae *AlertEscalator) checkEscalations() {
	ae.mu.Lock()
	defer ae.mu.Unlock()
	now := time.Now()
	for _, alert := range ae.alerts {
		if !alert.IsActive() || alert.IsAcked() {
			continue
		}
		lastEscalation := alert.EscalatedAt[len(alert.EscalatedAt)-1]
		timeSinceEscalation := now.Sub(lastEscalation)
		var shouldEscalate bool
		var nextLevel AlertLevel
		switch alert.CurrentLevel {
		case AlertLevelLog:
			if timeSinceEscalation >= ae.config.Level1To2Duration {
				shouldEscalate = true
				nextLevel = AlertLevelDashboard
			}
		case AlertLevelDashboard:
			if timeSinceEscalation >= ae.config.Level2To3Duration {
				shouldEscalate = true
				nextLevel = AlertLevelTeam
			}
		case AlertLevelTeam:
			if timeSinceEscalation >= ae.config.Level3To4Duration {
				shouldEscalate = true
				nextLevel = AlertLevelOnCall
			}
		case AlertLevelOnCall:
			if timeSinceEscalation >= ae.config.Level4To5Duration {
				shouldEscalate = true
				nextLevel = AlertLevelManagement
			}
		}
		if shouldEscalate {
			alert.CurrentLevel = nextLevel
			alert.EscalatedAt = append(alert.EscalatedAt, now)
			ae.executeHandlers(alert, nextLevel)
		}
	}
}

func (ae *AlertEscalator) executeHandlers(alert *Alert, level AlertLevel) {
	handlers := ae.handlers[level]
	for _, handler := range handlers {
		go func(h EscalationHandler) {
			if err := h(alert, level); err != nil {
				log.Printf("[ESCALATION] Erro no handler nivel %s: %v", level, err)
			}
		}(handler)
	}
}

func (ae *AlertEscalator) Stats() map[string]interface{} {
	ae.mu.RLock()
	defer ae.mu.RUnlock()
	var active, acked, resolved int
	byLevel := make(map[AlertLevel]int)
	bySeverity := make(map[AlertSeverity]int)
	byCategory := make(map[AlertCategory]int)
	for _, alert := range ae.alerts {
		if alert.IsActive() {
			active++
			byLevel[alert.CurrentLevel]++
			bySeverity[alert.Severity]++
			byCategory[alert.Category]++
			if alert.IsAcked() {
				acked++
			}
		} else {
			resolved++
		}
	}
	return map[string]interface{}{
		"total":       len(ae.alerts),
		"active":      active,
		"acked":       acked,
		"resolved":    resolved,
		"by_level":    byLevel,
		"by_severity": bySeverity,
		"by_category": byCategory,
	}
}

func (ae *AlertEscalator) Stop() { close(ae.stopChan) }

func LogHandler() EscalationHandler {
	return func(alert *Alert, level AlertLevel) error {
		log.Printf("[ALERT-%s] %s: %s | source=%s", level, alert.Title, alert.Message, alert.Source)
		return nil
	}
}

func WebhookHandler(webhookURL string, sendFunc func(url string, payload interface{}) error) EscalationHandler {
	return func(alert *Alert, level AlertLevel) error {
		payload := map[string]interface{}{
			"alert_id":   alert.ID,
			"title":      alert.Title,
			"message":    alert.Message,
			"severity":   alert.Severity,
			"category":   alert.Category,
			"level":      level,
			"source":     alert.Source,
			"context":    alert.Context,
			"created_at": alert.CreatedAt,
		}
		return sendFunc(webhookURL, payload)
	}
}

func CallbackHandler(callback func(alert *Alert, level AlertLevel)) EscalationHandler {
	return func(alert *Alert, level AlertLevel) error {
		callback(alert, level)
		return nil
	}
}

var globalEscalator = NewAlertEscalator(DefaultEscalationConfig())

func AlertFunc(title, message string, severity AlertSeverity, category AlertCategory, source string, ctx map[string]interface{}) *Alert {
	return globalEscalator.CreateAlert(title, message, severity, category, source, ctx)
}

func AlertInfo(title, message, source string, ctx map[string]interface{}) *Alert {
	return AlertFunc(title, message, SeverityInfo, CategoryBusiness, source, ctx)
}

func AlertWarning(title, message, source string, ctx map[string]interface{}) *Alert {
	return AlertFunc(title, message, SeverityWarning, CategoryBusiness, source, ctx)
}

func AlertError(title, message, source string, ctx map[string]interface{}) *Alert {
	return AlertFunc(title, message, SeverityError, CategoryBusiness, source, ctx)
}

func AlertCritical(title, message, source string, ctx map[string]interface{}) *Alert {
	return AlertFunc(title, message, SeverityCritical, CategoryBusiness, source, ctx)
}

func AlertSecurity(title, message, source string, ctx map[string]interface{}) *Alert {
	return AlertFunc(title, message, SeverityCritical, CategorySecurity, source, ctx)
}

func AlertInvariant(title, message, source string, ctx map[string]interface{}) *Alert {
	return AlertFunc(title, message, SeverityCritical, CategoryInvariant, source, ctx)
}

func AckAlert(alertID uuid.UUID, ackedBy string) bool {
	return globalEscalator.Acknowledge(alertID, ackedBy)
}

func ResolveAlert(alertID uuid.UUID, resolvedBy, resolution string) bool {
	return globalEscalator.Resolve(alertID, resolvedBy, resolution)
}

func GetActiveAlerts() []*Alert {
	return globalEscalator.GetActiveAlerts()
}

func GetAlertStats() map[string]interface{} {
	return globalEscalator.Stats()
}

func RegisterAlertHandler(level AlertLevel, handler EscalationHandler) {
	globalEscalator.RegisterHandler(level, handler)
}

// InvariantViolation representa uma violacao de invariant
type InvariantViolation struct {
	ID         string                 `json:"id"`
	Invariant  string                 `json:"invariant"`
	Message    string                 `json:"message"`
	Severity   string                 `json:"severity"`
	Context    map[string]interface{} `json:"context"`
	StackTrace string                 `json:"stack_trace"`
	Timestamp  time.Time              `json:"timestamp"`
	Recovered  bool                   `json:"recovered"`
	AppID      string                 `json:"app_id,omitempty"`
	UserID     string                 `json:"user_id,omitempty"`
}

// EscalationDecision decisao de escalonamento
type EscalationDecision struct {
	ShouldEscalate    bool       `json:"should_escalate"`
	TargetLevel       AlertLevel `json:"target_level"`
	Reason            string     `json:"reason"`
	RecommendedAction string     `json:"recommended_action"`
	Alert             *Alert     `json:"alert,omitempty"`
}

// ProcessViolation processa uma violacao de invariant e decide se deve escalar
func ProcessViolation(violation InvariantViolation) EscalationDecision {
	decision := EscalationDecision{
		ShouldEscalate: false,
		TargetLevel:    AlertLevelLog,
	}

	var alertSeverity AlertSeverity
	var alertCategory AlertCategory = CategoryInvariant

	switch violation.Severity {
	case "FATAL":
		alertSeverity = SeverityFatal
		decision.ShouldEscalate = true
		decision.TargetLevel = AlertLevelOnCall
		decision.Reason = "Violacao FATAL requer atencao imediata do plantao"
		decision.RecommendedAction = "PAGER_DUTY_INCIDENT"

	case "CRITICAL":
		alertSeverity = SeverityCritical
		decision.ShouldEscalate = true
		decision.TargetLevel = AlertLevelTeam
		decision.Reason = "Violacao CRITICAL requer atencao da equipe"
		decision.RecommendedAction = "SLACK_ALERT"

	case "WARNING":
		alertSeverity = SeverityWarning
		recentCount := countRecentViolations(violation.Invariant, 5*time.Minute)
		if recentCount >= 5 {
			decision.ShouldEscalate = true
			decision.TargetLevel = AlertLevelDashboard
			decision.Reason = fmt.Sprintf("Multiplas violacoes WARNING (%d em 5min)", recentCount)
			decision.RecommendedAction = "DASHBOARD_HIGHLIGHT"
		} else {
			decision.Reason = "Violacao WARNING registrada para monitoramento"
			decision.RecommendedAction = "LOG_ONLY"
		}

	default:
		alertSeverity = SeverityInfo
		decision.Reason = "Violacao de baixa severidade"
		decision.RecommendedAction = "LOG_ONLY"
	}

	ctx := violation.Context
	if ctx == nil {
		ctx = make(map[string]interface{})
	}
	ctx["invariant"] = violation.Invariant
	ctx["violation_id"] = violation.ID
	ctx["recovered"] = violation.Recovered
	if violation.AppID != "" {
		ctx["app_id"] = violation.AppID
	}
	if violation.UserID != "" {
		ctx["user_id"] = violation.UserID
	}
	if violation.StackTrace != "" {
		ctx["has_stack_trace"] = true
	}

	alert := AlertFunc(
		fmt.Sprintf("Invariant Violation: %s", violation.Invariant),
		violation.Message,
		alertSeverity,
		alertCategory,
		"invariants",
		ctx,
	)

	decision.Alert = alert

	if decision.ShouldEscalate {
		log.Printf("[ESCALATION] Violacao %s escalada para %s: %s",
			violation.Severity, decision.TargetLevel, decision.Reason)
	}

	return decision
}

func countRecentViolations(invariant string, window time.Duration) int {
	alerts := globalEscalator.GetActiveAlerts()
	count := 0
	cutoff := time.Now().Add(-window)

	for _, alert := range alerts {
		if alert.Category == CategoryInvariant && alert.CreatedAt.After(cutoff) {
			if inv, ok := alert.Context["invariant"].(string); ok && inv == invariant {
				count += alert.OccurrenceCount
			}
		}
	}

	return count
}

// ShouldCreatePagerDutyIncident verifica se deve criar incidente no PagerDuty
func ShouldCreatePagerDutyIncident(violation InvariantViolation) bool {
	if violation.Severity == "FATAL" {
		return true
	}

	if violation.Severity == "CRITICAL" {
		recentCount := countRecentViolations(violation.Invariant, 10*time.Minute)
		if recentCount >= 3 {
			return true
		}
	}

	criticalInvariants := []string{
		"billing_balance_consistency",
		"auth_token_integrity",
		"data_encryption_required",
		"payment_idempotency",
	}

	for _, critical := range criticalInvariants {
		if violation.Invariant == critical {
			return true
		}
	}

	return false
}

// PagerDutyHandler cria handler para PagerDuty
func PagerDutyHandler(apiKey string, createIncident func(apiKey string, payload interface{}) error) EscalationHandler {
	return func(alert *Alert, level AlertLevel) error {
		if level < AlertLevelOnCall {
			return nil
		}

		payload := map[string]interface{}{
			"routing_key":  apiKey,
			"event_action": "trigger",
			"payload": map[string]interface{}{
				"summary":   fmt.Sprintf("[%s] %s", alert.Severity, alert.Title),
				"source":    alert.Source,
				"severity":  string(alert.Severity),
				"timestamp": alert.CreatedAt.Format(time.RFC3339),
				"custom_details": map[string]interface{}{
					"alert_id":    alert.ID,
					"message":     alert.Message,
					"category":    alert.Category,
					"occurrences": alert.OccurrenceCount,
					"context":     alert.Context,
				},
			},
		}

		return createIncident(apiKey, payload)
	}
}
