package immunity

/*
================================================================================
INTEGRATIONS — INTEGRAÇÕES DO SISTEMA IMUNOLÓGICO
================================================================================

Conecta o sistema imunológico com outros componentes do kernel:
1. Invariants → Violações geram alertas e podem acionar quarentena
2. Telemetry → Métricas exportadas para observabilidade
3. Audit → Todas as ações são auditadas
4. Notifications → Alertas críticos geram notificações
5. Kill Switch → Pode acionar kill switch em emergências

================================================================================
*/

import (
	"context"
	"log"
	"sync"
	"time"
)

// ========================================
// INVARIANT INTEGRATION
// ========================================

// InvariantIntegration integra com o sistema de invariantes
type InvariantIntegration struct {
	immunity *ImmunitySystem
	enabled  bool
	mu       sync.RWMutex
	
	// Contadores
	totalViolations   int64
	escalatedCount    int64
	autoResolvedCount int64
}

// NewInvariantIntegration cria nova integração
func NewInvariantIntegration(immunity *ImmunitySystem) *InvariantIntegration {
	return &InvariantIntegration{
		immunity: immunity,
		enabled:  true,
	}
}

// Enable habilita a integração
func (ii *InvariantIntegration) Enable() {
	ii.mu.Lock()
	defer ii.mu.Unlock()
	ii.enabled = true
}

// Disable desabilita a integração
func (ii *InvariantIntegration) Disable() {
	ii.mu.Lock()
	defer ii.mu.Unlock()
	ii.enabled = false
}

// HandleViolation processa uma violação de invariante
func (ii *InvariantIntegration) HandleViolation(violation InvariantViolation) *EscalationDecision {
	ii.mu.Lock()
	ii.totalViolations++
	ii.mu.Unlock()
	
	if !ii.enabled {
		return nil
	}
	
	// Processar violação
	decision := ProcessViolation(violation)
	
	if decision.ShouldEscalate {
		ii.mu.Lock()
		ii.escalatedCount++
		ii.mu.Unlock()
	}
	
	// Se violação crítica de billing ou auth, considerar quarentena
	if violation.Severity == "FATAL" || violation.Severity == "CRITICAL" {
		if violation.AppID != "" {
			// Quarentena soft para o app
			ii.immunity.QuarantineEntity(
				TargetApp,
				violation.AppID,
				QuarantineSoft,
				QuarantineReason("invariant_violation"),
				map[string]interface{}{
					"invariant":    violation.Invariant,
					"violation_id": violation.ID,
					"severity":     violation.Severity,
				},
				30*time.Minute, // 30 minutos para investigação
			)
		}
	}
	
	// Verificar se deve criar incidente PagerDuty
	if ShouldCreatePagerDutyIncident(violation) {
		log.Printf("🚨 [INVARIANT-INTEGRATION] Incidente PagerDuty recomendado para: %s", violation.Invariant)
	}
	
	return &decision
}

// Stats retorna estatísticas
func (ii *InvariantIntegration) Stats() map[string]interface{} {
	ii.mu.RLock()
	defer ii.mu.RUnlock()
	
	return map[string]interface{}{
		"enabled":            ii.enabled,
		"total_violations":   ii.totalViolations,
		"escalated_count":    ii.escalatedCount,
		"auto_resolved_count": ii.autoResolvedCount,
	}
}

// ========================================
// TELEMETRY INTEGRATION
// ========================================

// TelemetryExporter exporta métricas do sistema imunológico
type TelemetryExporter struct {
	immunity *ImmunitySystem
	interval time.Duration
	stopChan chan struct{}
	
	// Callbacks para exportação
	onMetrics func(metrics ImmunityMetrics)
}

// ImmunityMetrics métricas do sistema imunológico
type ImmunityMetrics struct {
	Timestamp         time.Time `json:"timestamp"`
	HealthScore       float64   `json:"health_score"`
	HealthStatus      string    `json:"health_status"`
	OpenCircuits      int       `json:"open_circuits"`
	ActiveQuarantines int       `json:"active_quarantines"`
	ActiveAlerts      int       `json:"active_alerts"`
	TotalThreats      int64     `json:"total_threats"`
	TotalHeals        int64     `json:"total_heals"`
	TotalBlocks       int64     `json:"total_blocks"`
	BlockedSources    int       `json:"blocked_sources"`
	TrackedSources    int       `json:"tracked_sources"`
	UptimeSeconds     float64   `json:"uptime_seconds"`
}

// NewTelemetryExporter cria novo exportador
func NewTelemetryExporter(immunity *ImmunitySystem, interval time.Duration) *TelemetryExporter {
	return &TelemetryExporter{
		immunity: immunity,
		interval: interval,
		stopChan: make(chan struct{}),
	}
}

// SetOnMetrics define callback para métricas
func (te *TelemetryExporter) SetOnMetrics(fn func(ImmunityMetrics)) {
	te.onMetrics = fn
}

// Start inicia exportação periódica
func (te *TelemetryExporter) Start() {
	go te.exportLoop()
	log.Printf("📊 [TELEMETRY] Exportador de métricas iniciado (intervalo: %v)", te.interval)
}

// Stop para exportação
func (te *TelemetryExporter) Stop() {
	close(te.stopChan)
}

// exportLoop loop de exportação
func (te *TelemetryExporter) exportLoop() {
	ticker := time.NewTicker(te.interval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			metrics := te.CollectMetrics()
			if te.onMetrics != nil {
				te.onMetrics(metrics)
			}
		case <-te.stopChan:
			return
		}
	}
}

// CollectMetrics coleta métricas atuais
func (te *TelemetryExporter) CollectMetrics() ImmunityMetrics {
	health := te.immunity.CheckHealth()
	defenseStats := te.immunity.Defense().Stats()
	
	blockedSources := 0
	if bs, ok := defenseStats["blocked_sources"].(int); ok {
		blockedSources = bs
	}
	
	trackedSources := 0
	if ts, ok := defenseStats["tracked_sources"].(int); ok {
		trackedSources = ts
	}
	
	return ImmunityMetrics{
		Timestamp:         time.Now(),
		HealthScore:       health.Score,
		HealthStatus:      health.Status,
		OpenCircuits:      health.OpenCircuits,
		ActiveQuarantines: health.ActiveQuarantines,
		ActiveAlerts:      health.ActiveAlerts,
		TotalThreats:      health.TotalThreats,
		TotalHeals:        health.TotalHeals,
		TotalBlocks:       health.TotalBlocks,
		BlockedSources:    blockedSources,
		TrackedSources:    trackedSources,
		UptimeSeconds:     health.Uptime.Seconds(),
	}
}

// ========================================
// AUDIT INTEGRATION
// ========================================

// AuditAction representa uma ação auditável
type AuditAction struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Actor       string                 `json:"actor"` // "system" ou user_id
	Target      string                 `json:"target"`
	Action      string                 `json:"action"`
	Details     map[string]interface{} `json:"details"`
	Result      string                 `json:"result"` // success, failure
	Timestamp   time.Time              `json:"timestamp"`
	IPAddress   string                 `json:"ip_address,omitempty"`
}

// AuditIntegration integra com sistema de auditoria
type AuditIntegration struct {
	immunity *ImmunitySystem
	enabled  bool
	mu       sync.RWMutex
	
	// Buffer de ações para batch insert
	buffer    []AuditAction
	bufferMax int
	
	// Callback para persistência
	onAudit func(action AuditAction)
}

// NewAuditIntegration cria nova integração
func NewAuditIntegration(immunity *ImmunitySystem) *AuditIntegration {
	ai := &AuditIntegration{
		immunity:  immunity,
		enabled:   true,
		buffer:    make([]AuditAction, 0, 100),
		bufferMax: 100,
	}
	
	// Configurar callbacks no sistema imunológico
	ai.setupCallbacks()
	
	return ai
}

// setupCallbacks configura callbacks para auditoria
func (ai *AuditIntegration) setupCallbacks() {
	// Auditar quando alguém é colocado em quarentena
	ai.immunity.Quarantine().SetOnQuarantine(func(entry *QuarantineEntry) {
		ai.RecordAction(AuditAction{
			Type:    "quarantine",
			Actor:   "system",
			Target:  entry.TargetID,
			Action:  "quarantine_entity",
			Details: map[string]interface{}{
				"target_type": entry.TargetType,
				"type":        entry.Type,
				"reason":      entry.Reason,
				"duration":    entry.ExpiresAt.Sub(entry.CreatedAt).String(),
			},
			Result:    "success",
			Timestamp: time.Now(),
		})
	})
	
	// Auditar ações de defesa
	ai.immunity.Defense().SetOnActionTaken(func(source string, action DefenseAction, reason string) {
		ai.RecordAction(AuditAction{
			Type:    "defense",
			Actor:   "system",
			Target:  source,
			Action:  string(action),
			Details: map[string]interface{}{
				"reason": reason,
			},
			Result:    "success",
			Timestamp: time.Now(),
		})
	})
}

// SetOnAudit define callback para persistência
func (ai *AuditIntegration) SetOnAudit(fn func(AuditAction)) {
	ai.mu.Lock()
	defer ai.mu.Unlock()
	ai.onAudit = fn
}

// RecordAction registra uma ação
func (ai *AuditIntegration) RecordAction(action AuditAction) {
	ai.mu.Lock()
	defer ai.mu.Unlock()
	
	if !ai.enabled {
		return
	}
	
	// Callback imediato se configurado
	if ai.onAudit != nil {
		go ai.onAudit(action)
	}
	
	// Adicionar ao buffer
	ai.buffer = append(ai.buffer, action)
	
	// Flush se buffer cheio
	if len(ai.buffer) >= ai.bufferMax {
		ai.flush()
	}
}

// flush envia buffer para persistência
func (ai *AuditIntegration) flush() {
	if len(ai.buffer) == 0 {
		return
	}
	
	// Aqui seria a persistência real
	log.Printf("📝 [AUDIT] Flush de %d ações de auditoria", len(ai.buffer))
	
	ai.buffer = ai.buffer[:0]
}

// Flush força flush do buffer
func (ai *AuditIntegration) Flush() {
	ai.mu.Lock()
	defer ai.mu.Unlock()
	ai.flush()
}

// ========================================
// NOTIFICATION INTEGRATION
// ========================================

// NotificationLevel nível de notificação
type NotificationLevel string

const (
	NotifyInfo     NotificationLevel = "info"
	NotifyWarning  NotificationLevel = "warning"
	NotifyError    NotificationLevel = "error"
	NotifyCritical NotificationLevel = "critical"
)

// ImmunityNotification notificação do sistema imunológico
type ImmunityNotification struct {
	ID        string                 `json:"id"`
	Level     NotificationLevel      `json:"level"`
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Source    string                 `json:"source"`
	Context   map[string]interface{} `json:"context"`
	Timestamp time.Time              `json:"timestamp"`
	Channels  []string               `json:"channels"` // email, slack, pagerduty, etc
}

// NotificationIntegration integra com sistema de notificações
type NotificationIntegration struct {
	immunity *ImmunitySystem
	enabled  bool
	mu       sync.RWMutex
	
	// Callbacks por canal
	handlers map[string]func(ImmunityNotification)
}

// NewNotificationIntegration cria nova integração
func NewNotificationIntegration(immunity *ImmunitySystem) *NotificationIntegration {
	ni := &NotificationIntegration{
		immunity: immunity,
		enabled:  true,
		handlers: make(map[string]func(ImmunityNotification)),
	}
	
	// Configurar handlers de alerta
	ni.setupAlertHandlers()
	
	return ni
}

// setupAlertHandlers configura handlers para alertas
func (ni *NotificationIntegration) setupAlertHandlers() {
	// Handler para alertas de nível TEAM
	ni.immunity.Escalator().RegisterHandler(AlertLevelTeam, func(alert *Alert, level AlertLevel) error {
		ni.SendNotification(ImmunityNotification{
			Level:   NotifyWarning,
			Title:   alert.Title,
			Message: alert.Message,
			Source:  alert.Source,
			Context: alert.Context,
			Channels: []string{"slack"},
		})
		return nil
	})
	
	// Handler para alertas de nível ON_CALL
	ni.immunity.Escalator().RegisterHandler(AlertLevelOnCall, func(alert *Alert, level AlertLevel) error {
		ni.SendNotification(ImmunityNotification{
			Level:   NotifyCritical,
			Title:   alert.Title,
			Message: alert.Message,
			Source:  alert.Source,
			Context: alert.Context,
			Channels: []string{"pagerduty", "slack", "email"},
		})
		return nil
	})
	
	// Handler para alertas de nível MANAGEMENT
	ni.immunity.Escalator().RegisterHandler(AlertLevelManagement, func(alert *Alert, level AlertLevel) error {
		ni.SendNotification(ImmunityNotification{
			Level:   NotifyCritical,
			Title:   "[ESCALADO] " + alert.Title,
			Message: alert.Message,
			Source:  alert.Source,
			Context: alert.Context,
			Channels: []string{"pagerduty", "slack", "email", "sms"},
		})
		return nil
	})
}

// RegisterHandler registra handler para canal
func (ni *NotificationIntegration) RegisterHandler(channel string, handler func(ImmunityNotification)) {
	ni.mu.Lock()
	defer ni.mu.Unlock()
	ni.handlers[channel] = handler
}

// SendNotification envia notificação
func (ni *NotificationIntegration) SendNotification(notification ImmunityNotification) {
	ni.mu.RLock()
	defer ni.mu.RUnlock()
	
	if !ni.enabled {
		return
	}
	
	notification.Timestamp = time.Now()
	
	for _, channel := range notification.Channels {
		if handler, exists := ni.handlers[channel]; exists {
			go handler(notification)
		}
	}
	
	log.Printf("📢 [NOTIFICATION] %s: %s (canais: %v)", notification.Level, notification.Title, notification.Channels)
}

// ========================================
// KILL SWITCH INTEGRATION
// ========================================

// KillSwitchIntegration integra com kill switch
type KillSwitchIntegration struct {
	immunity *ImmunitySystem
	enabled  bool
	mu       sync.RWMutex
	
	// Thresholds para acionamento automático
	healthThreshold float64 // Score abaixo disso aciona kill switch
	alertThreshold  int     // Número de alertas críticos
	
	// Callback para acionar kill switch
	onKillSwitch func(reason string, context map[string]interface{})
}

// NewKillSwitchIntegration cria nova integração
func NewKillSwitchIntegration(immunity *ImmunitySystem) *KillSwitchIntegration {
	return &KillSwitchIntegration{
		immunity:        immunity,
		enabled:         true,
		healthThreshold: 25.0, // Score muito baixo
		alertThreshold:  5,    // 5 alertas críticos
	}
}

// SetOnKillSwitch define callback para kill switch
func (ki *KillSwitchIntegration) SetOnKillSwitch(fn func(string, map[string]interface{})) {
	ki.mu.Lock()
	defer ki.mu.Unlock()
	ki.onKillSwitch = fn
}

// CheckAndTrigger verifica condições e aciona kill switch se necessário
func (ki *KillSwitchIntegration) CheckAndTrigger() bool {
	ki.mu.RLock()
	if !ki.enabled || ki.onKillSwitch == nil {
		ki.mu.RUnlock()
		return false
	}
	callback := ki.onKillSwitch
	healthThreshold := ki.healthThreshold
	alertThreshold := ki.alertThreshold
	ki.mu.RUnlock()
	
	health := ki.immunity.CheckHealth()
	
	// Verificar score de saúde
	if health.Score < healthThreshold {
		callback("health_critical", map[string]interface{}{
			"health_score":  health.Score,
			"threshold":     healthThreshold,
			"open_circuits": health.OpenCircuits,
			"quarantines":   health.ActiveQuarantines,
		})
		log.Printf("🚨 [KILL-SWITCH] Acionado por saúde crítica: %.1f < %.1f", health.Score, healthThreshold)
		return true
	}
	
	// Verificar número de alertas críticos
	alerts := ki.immunity.Escalator().GetActiveAlerts()
	criticalCount := 0
	for _, alert := range alerts {
		if alert.Severity == SeverityCritical || alert.Severity == SeverityFatal {
			criticalCount++
		}
	}
	
	if criticalCount >= alertThreshold {
		callback("too_many_critical_alerts", map[string]interface{}{
			"critical_alerts": criticalCount,
			"threshold":       alertThreshold,
		})
		log.Printf("🚨 [KILL-SWITCH] Acionado por alertas críticos: %d >= %d", criticalCount, alertThreshold)
		return true
	}
	
	return false
}

// ========================================
// INTEGRATION MANAGER
// ========================================

// IntegrationManager gerencia todas as integrações
type IntegrationManager struct {
	immunity      *ImmunitySystem
	invariants    *InvariantIntegration
	telemetry     *TelemetryExporter
	audit         *AuditIntegration
	notifications *NotificationIntegration
	killSwitch    *KillSwitchIntegration
}

// NewIntegrationManager cria novo gerenciador
func NewIntegrationManager(immunity *ImmunitySystem) *IntegrationManager {
	return &IntegrationManager{
		immunity:      immunity,
		invariants:    NewInvariantIntegration(immunity),
		telemetry:     NewTelemetryExporter(immunity, 30*time.Second),
		audit:         NewAuditIntegration(immunity),
		notifications: NewNotificationIntegration(immunity),
		killSwitch:    NewKillSwitchIntegration(immunity),
	}
}

// Start inicia todas as integrações
func (im *IntegrationManager) Start(ctx context.Context) {
	im.telemetry.Start()
	
	// Verificação periódica de kill switch
	go func() {
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				im.killSwitch.CheckAndTrigger()
			case <-ctx.Done():
				return
			}
		}
	}()
	
	log.Println("🔗 [INTEGRATIONS] Todas as integrações iniciadas")
}

// Stop para todas as integrações
func (im *IntegrationManager) Stop() {
	im.telemetry.Stop()
	im.audit.Flush()
	log.Println("🔗 [INTEGRATIONS] Todas as integrações paradas")
}

// Invariants retorna integração de invariantes
func (im *IntegrationManager) Invariants() *InvariantIntegration {
	return im.invariants
}

// Telemetry retorna exportador de telemetria
func (im *IntegrationManager) Telemetry() *TelemetryExporter {
	return im.telemetry
}

// Audit retorna integração de auditoria
func (im *IntegrationManager) Audit() *AuditIntegration {
	return im.audit
}

// Notifications retorna integração de notificações
func (im *IntegrationManager) Notifications() *NotificationIntegration {
	return im.notifications
}

// KillSwitch retorna integração de kill switch
func (im *IntegrationManager) KillSwitch() *KillSwitchIntegration {
	return im.killSwitch
}

// ========================================
// GLOBAL INTEGRATION MANAGER
// ========================================

var globalIntegrations *IntegrationManager
var integrationsOnce sync.Once

// GetIntegrations retorna gerenciador global de integrações
func GetIntegrations() *IntegrationManager {
	integrationsOnce.Do(func() {
		globalIntegrations = NewIntegrationManager(GetImmunitySystem())
	})
	return globalIntegrations
}

// HandleInvariantViolation processa violação de invariante globalmente
func HandleInvariantViolation(violation InvariantViolation) *EscalationDecision {
	return GetIntegrations().Invariants().HandleViolation(violation)
}
