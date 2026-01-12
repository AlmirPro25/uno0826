package immunity

/*
================================================================================
IMMUNITY — SISTEMA IMUNOLÓGICO DO KERNEL
================================================================================

Este pacote implementa o sistema imunológico completo do Prost-QS Kernel.
Assim como o sistema imunológico humano, ele:

1. DETECTA ameaças (invariants, anomalias, padrões suspeitos)
2. RESPONDE automaticamente (circuit breaker, quarentena, defesa)
3. SE CURA sozinho (auto-healing)
4. ESCALA alertas (quando não consegue resolver sozinho)
5. APRENDE com ataques (ajusta thresholds)

Componentes:
- invariants.go: Testes ativos em produção
- circuit_breaker.go: Corta conexões problemáticas
- quarantine.go: Isola elementos suspeitos
- auto_healing.go: Recuperação automática
- alert_escalation.go: Escalonamento de alertas
- self_defense.go: Defesa ativa contra ataques

Filosofia:
"O sistema deve se defender sozinho. Humanos são para casos excepcionais."

================================================================================
*/

import (
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ========================================
// IMMUNITY SYSTEM — ORQUESTRADOR CENTRAL
// ========================================

// ImmunitySystem orquestra todos os componentes de imunidade
type ImmunitySystem struct {
	mu sync.RWMutex
	
	// Componentes
	autoHealer    *AutoHealer
	circuitReg    *CircuitBreakerRegistry
	quarantine    *QuarantineManager
	escalator     *AlertEscalator
	defense       *SelfDefense
	
	// Estado
	enabled       bool
	startedAt     time.Time
	
	// Métricas
	totalThreats  int64
	totalHeals    int64
	totalBlocks   int64
	totalAlerts   int64
	
	// Callbacks
	onIncident    func(incident Incident)
}

// Incident representa um incidente de segurança/saúde
type Incident struct {
	ID          uuid.UUID              `json:"id"`
	Type        string                 `json:"type"`
	Severity    string                 `json:"severity"`
	Source      string                 `json:"source"`
	Description string                 `json:"description"`
	Context     map[string]interface{} `json:"context"`
	Actions     []string               `json:"actions"`
	CreatedAt   time.Time              `json:"created_at"`
	ResolvedAt  *time.Time             `json:"resolved_at,omitempty"`
	AutoResolved bool                  `json:"auto_resolved"`
}

// NewImmunitySystem cria novo sistema de imunidade
func NewImmunitySystem() *ImmunitySystem {
	is := &ImmunitySystem{
		autoHealer:  NewAutoHealer(),
		circuitReg:  NewCircuitBreakerRegistry(),
		quarantine:  NewQuarantineManager(),
		escalator:   NewAlertEscalator(DefaultEscalationConfig()),
		defense:     NewSelfDefense(),
		enabled:     true,
		startedAt:   time.Now(),
	}
	
	// Configurar integrações entre componentes
	is.setupIntegrations()
	
	log.Println("🛡️ [IMMUNITY] Sistema imunológico inicializado")
	
	return is
}

// setupIntegrations configura integrações entre componentes
func (is *ImmunitySystem) setupIntegrations() {
	// Quando algo é quarentenado, criar alerta
	is.quarantine.SetOnQuarantine(func(entry *QuarantineEntry) {
		is.mu.Lock()
		is.totalBlocks++
		is.mu.Unlock()
		
		is.escalator.CreateAlert(
			"Elemento em Quarentena",
			entry.Reason.String(),
			SeverityWarning,
			CategorySecurity,
			"quarantine",
			map[string]interface{}{
				"target_type": entry.TargetType,
				"target_id":   entry.TargetID,
				"type":        entry.Type,
				"evidence":    entry.Evidence,
			},
		)
	})
	
	// Quando auto-heal falha, criar alerta
	is.autoHealer.SetOnHealCallback(func(result HealingResult) {
		is.mu.Lock()
		is.totalHeals++
		is.mu.Unlock()
		
		if !result.Success {
			is.escalator.CreateAlert(
				"Auto-Healing Falhou",
				result.Message,
				SeverityError,
				CategoryAvailability,
				"auto_healer",
				map[string]interface{}{
					"action":   result.Action,
					"target":   result.Target,
					"duration": result.Duration.String(),
				},
			)
		}
	})
	
	// Quando ameaça é detectada, registrar
	is.defense.SetOnThreatDetected(func(indicator ThreatIndicator) {
		is.mu.Lock()
		is.totalThreats++
		is.mu.Unlock()
		
		// Se confiança alta, criar alerta
		if indicator.Confidence >= 0.8 {
			is.escalator.CreateAlert(
				"Ameaça Detectada: "+string(indicator.Type),
				"Ameaça de alta confiança detectada",
				SeverityWarning,
				CategorySecurity,
				"self_defense",
				map[string]interface{}{
					"threat_type": indicator.Type,
					"source":      indicator.Source,
					"confidence":  indicator.Confidence,
					"evidence":    indicator.Evidence,
				},
			)
		}
	})
	
	// Quando ação de defesa é tomada
	is.defense.SetOnActionTaken(func(source string, action DefenseAction, reason string) {
		if action == ActionBlock || action == ActionBlackhole {
			is.mu.Lock()
			is.totalBlocks++
			is.mu.Unlock()
		}
	})
	
	// Registrar handler de log para todos os níveis de alerta
	is.escalator.RegisterHandler(AlertLevelLog, LogHandler())
}

// ========================================
// MÉTODOS PÚBLICOS
// ========================================

// Enable habilita o sistema
func (is *ImmunitySystem) Enable() {
	is.mu.Lock()
	defer is.mu.Unlock()
	is.enabled = true
	is.autoHealer.Enable()
	log.Println("🛡️ [IMMUNITY] Sistema habilitado")
}

// Disable desabilita o sistema
func (is *ImmunitySystem) Disable() {
	is.mu.Lock()
	defer is.mu.Unlock()
	is.enabled = false
	is.autoHealer.Disable()
	log.Println("🛡️ [IMMUNITY] Sistema desabilitado")
}

// IsEnabled verifica se está habilitado
func (is *ImmunitySystem) IsEnabled() bool {
	is.mu.RLock()
	defer is.mu.RUnlock()
	return is.enabled
}

// SetOnIncident define callback para incidentes
func (is *ImmunitySystem) SetOnIncident(fn func(Incident)) {
	is.mu.Lock()
	defer is.mu.Unlock()
	is.onIncident = fn
}

// ========================================
// ACESSO AOS COMPONENTES
// ========================================

// AutoHealer retorna o auto-healer
func (is *ImmunitySystem) AutoHealer() *AutoHealer {
	return is.autoHealer
}

// CircuitBreakers retorna o registry de circuit breakers
func (is *ImmunitySystem) CircuitBreakers() *CircuitBreakerRegistry {
	return is.circuitReg
}

// Quarantine retorna o gerenciador de quarentena
func (is *ImmunitySystem) Quarantine() *QuarantineManager {
	return is.quarantine
}

// Escalator retorna o escalador de alertas
func (is *ImmunitySystem) Escalator() *AlertEscalator {
	return is.escalator
}

// Defense retorna o sistema de defesa
func (is *ImmunitySystem) Defense() *SelfDefense {
	return is.defense
}

// ========================================
// OPERAÇÕES DE ALTO NÍVEL
// ========================================

// CheckHealth verifica saúde geral do sistema
func (is *ImmunitySystem) CheckHealth() HealthReport {
	is.mu.RLock()
	defer is.mu.RUnlock()
	
	// Coletar dados de todos os componentes
	openCircuits := is.circuitReg.OpenCircuits()
	activeQuarantines := is.quarantine.GetActiveQuarantines()
	activeAlerts := is.escalator.GetActiveAlerts()
	defenseStats := is.defense.Stats()
	
	// Calcular score de saúde (0-100)
	healthScore := 100.0
	
	// Penalizar por circuitos abertos
	healthScore -= float64(len(openCircuits)) * 10
	
	// Penalizar por quarentenas ativas
	healthScore -= float64(len(activeQuarantines)) * 5
	
	// Penalizar por alertas críticos
	for _, alert := range activeAlerts {
		if alert.Severity == SeverityCritical || alert.Severity == SeverityFatal {
			healthScore -= 15
		} else if alert.Severity == SeverityError {
			healthScore -= 10
		}
	}
	
	// Penalizar por fontes bloqueadas
	if blocked, ok := defenseStats["blocked_sources"].(int); ok {
		healthScore -= float64(blocked) * 2
	}
	
	if healthScore < 0 {
		healthScore = 0
	}
	
	status := "healthy"
	if healthScore < 50 {
		status = "critical"
	} else if healthScore < 75 {
		status = "degraded"
	}
	
	return HealthReport{
		Status:            status,
		Score:             healthScore,
		OpenCircuits:      len(openCircuits),
		ActiveQuarantines: len(activeQuarantines),
		ActiveAlerts:      len(activeAlerts),
		TotalThreats:      is.totalThreats,
		TotalHeals:        is.totalHeals,
		TotalBlocks:       is.totalBlocks,
		Uptime:            time.Since(is.startedAt),
		CheckedAt:         time.Now(),
	}
}

// HealthReport relatório de saúde
type HealthReport struct {
	Status            string        `json:"status"`
	Score             float64       `json:"score"`
	OpenCircuits      int           `json:"open_circuits"`
	ActiveQuarantines int           `json:"active_quarantines"`
	ActiveAlerts      int           `json:"active_alerts"`
	TotalThreats      int64         `json:"total_threats"`
	TotalHeals        int64         `json:"total_heals"`
	TotalBlocks       int64         `json:"total_blocks"`
	Uptime            time.Duration `json:"uptime"`
	CheckedAt         time.Time     `json:"checked_at"`
}

// RespondToThreat responde a uma ameaça de forma coordenada
func (is *ImmunitySystem) RespondToThreat(
	threatType ThreatType,
	source string,
	severity AlertSeverity,
	evidence map[string]interface{},
) *Incident {
	if !is.IsEnabled() {
		return nil
	}
	
	incident := &Incident{
		ID:          uuid.New(),
		Type:        string(threatType),
		Severity:    string(severity),
		Source:      source,
		Description: "Ameaça detectada: " + string(threatType),
		Context:     evidence,
		Actions:     []string{},
		CreatedAt:   time.Now(),
	}
	
	// 1. Reportar ao sistema de defesa
	action := is.defense.ReportThreat(ThreatIndicator{
		Type:       threatType,
		Source:     source,
		Confidence: 0.9,
		Evidence:   evidence,
		DetectedAt: time.Now(),
	})
	incident.Actions = append(incident.Actions, "defense:"+string(action))
	
	// 2. Se ação severa, colocar em quarentena
	if action == ActionBlock || action == ActionBlackhole {
		qType := QuarantineSoft
		if severity == SeverityCritical || severity == SeverityFatal {
			qType = QuarantineHard
		}
		
		is.quarantine.Quarantine(
			TargetIP,
			source,
			qType,
			QuarantineReason(threatType),
			evidence,
			time.Hour,
		)
		incident.Actions = append(incident.Actions, "quarantine:"+string(qType))
	}
	
	// 3. Criar alerta
	alert := is.escalator.CreateAlert(
		"Incidente de Segurança",
		incident.Description,
		severity,
		CategorySecurity,
		"immunity_system",
		evidence,
	)
	incident.Actions = append(incident.Actions, "alert:"+alert.ID.String())
	
	// 4. Callback
	is.mu.RLock()
	callback := is.onIncident
	is.mu.RUnlock()
	
	if callback != nil {
		go callback(*incident)
	}
	
	log.Printf("🚨 [IMMUNITY] Incidente criado: %s de %s (ações: %v)", 
		threatType, source, incident.Actions)
	
	return incident
}

// TryHeal tenta curar um problema
func (is *ImmunitySystem) TryHeal(action HealingAction, target string, context map[string]interface{}) HealingResult {
	return is.autoHealer.Heal(action, target, context)
}

// GetCircuitBreaker retorna circuit breaker por nome
func (is *ImmunitySystem) GetCircuitBreaker(name string) *CircuitBreaker {
	return is.circuitReg.Get(name)
}

// QuarantineEntity coloca entidade em quarentena
func (is *ImmunitySystem) QuarantineEntity(
	targetType QuarantineTarget,
	targetID string,
	qType QuarantineType,
	reason QuarantineReason,
	evidence map[string]interface{},
	duration time.Duration,
) *QuarantineEntry {
	return is.quarantine.Quarantine(targetType, targetID, qType, reason, evidence, duration)
}

// CreateAlert cria alerta
func (is *ImmunitySystem) CreateAlert(
	title, message string,
	severity AlertSeverity,
	category AlertCategory,
	source string,
	context map[string]interface{},
) *Alert {
	is.mu.Lock()
	is.totalAlerts++
	is.mu.Unlock()
	
	return is.escalator.CreateAlert(title, message, severity, category, source, context)
}

// Stats retorna estatísticas completas
func (is *ImmunitySystem) Stats() map[string]interface{} {
	is.mu.RLock()
	defer is.mu.RUnlock()
	
	return map[string]interface{}{
		"enabled":          is.enabled,
		"uptime":           time.Since(is.startedAt).String(),
		"total_threats":    is.totalThreats,
		"total_heals":      is.totalHeals,
		"total_blocks":     is.totalBlocks,
		"total_alerts":     is.totalAlerts,
		"auto_healer":      is.autoHealer.GetStats(),
		"circuit_breakers": is.circuitReg.AllStats(),
		"quarantine":       is.quarantine.Stats(),
		"alerts":           is.escalator.Stats(),
		"defense":          is.defense.Stats(),
	}
}

// Stop para todos os componentes
func (is *ImmunitySystem) Stop() {
	is.quarantine.Stop()
	is.escalator.Stop()
	log.Println("🛡️ [IMMUNITY] Sistema parado")
}

// ========================================
// INSTÂNCIA GLOBAL
// ========================================

var globalImmunity *ImmunitySystem
var immunityOnce sync.Once

// GetImmunitySystem retorna instância global
func GetImmunitySystem() *ImmunitySystem {
	immunityOnce.Do(func() {
		globalImmunity = NewImmunitySystem()
	})
	return globalImmunity
}

// ========================================
// FUNÇÕES DE CONVENIÊNCIA GLOBAIS
// ========================================

// SystemHealth retorna saúde do sistema
func SystemHealth() HealthReport {
	return GetImmunitySystem().CheckHealth()
}

// RespondThreat responde a ameaça globalmente
func RespondThreat(threatType ThreatType, source string, severity AlertSeverity, evidence map[string]interface{}) *Incident {
	return GetImmunitySystem().RespondToThreat(threatType, source, severity, evidence)
}

// Heal tenta curar globalmente
func Heal(action HealingAction, target string, context map[string]interface{}) HealingResult {
	return GetImmunitySystem().TryHeal(action, target, context)
}

// Circuit retorna circuit breaker global
func Circuit(name string) *CircuitBreaker {
	return GetImmunitySystem().GetCircuitBreaker(name)
}

// ImmunityStats retorna estatísticas globais
func ImmunityStats() map[string]interface{} {
	return GetImmunitySystem().Stats()
}

// String helper para QuarantineReason
func (r QuarantineReason) String() string {
	return string(r)
}
