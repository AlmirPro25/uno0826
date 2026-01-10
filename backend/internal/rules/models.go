package rules

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// RULES ENGINE - O cérebro que decide
// "Observação → Condição → Ação"
// ========================================

// RuleStatus status da regra
type RuleStatus string

const (
	RuleStatusActive   RuleStatus = "active"
	RuleStatusInactive RuleStatus = "inactive"
	RuleStatusPaused   RuleStatus = "paused"
)

// RuleTriggerType tipo de trigger
type RuleTriggerType string

const (
	TriggerMetric    RuleTriggerType = "metric"     // Baseado em métrica (ex: retention_d1 < 10)
	TriggerEvent     RuleTriggerType = "event"      // Baseado em evento (ex: session.end)
	TriggerSchedule  RuleTriggerType = "schedule"   // Baseado em horário (ex: todo dia 9h)
	TriggerThreshold RuleTriggerType = "threshold"  // Baseado em threshold (ex: online_now > 100)
)

// RuleActionType tipo de ação
type RuleActionType string

const (
	ActionAlert      RuleActionType = "alert"       // Criar alerta
	ActionWebhook    RuleActionType = "webhook"     // Chamar webhook
	ActionFlag       RuleActionType = "flag"        // Marcar usuário/sessão
	ActionNotify     RuleActionType = "notify"      // Notificar (email, push)
	ActionAdjust     RuleActionType = "adjust"      // Ajustar parâmetro
	ActionExperiment RuleActionType = "experiment"  // Iniciar experimento
)

// Rule regra de decisão
type Rule struct {
	ID          uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	AppID       uuid.UUID       `gorm:"type:uuid;index" json:"app_id"`
	Name        string          `gorm:"size:100" json:"name"`
	Description string          `gorm:"size:500" json:"description"`
	Status      RuleStatus      `gorm:"size:20;default:'active'" json:"status"`
	Priority    int             `gorm:"default:0" json:"priority"` // Maior = mais prioritário
	
	// Trigger
	TriggerType  RuleTriggerType `gorm:"size:20" json:"trigger_type"`
	TriggerConfig string         `gorm:"type:text" json:"trigger_config"` // JSON com config do trigger
	
	// Condition (expressão avaliável)
	Condition string `gorm:"type:text" json:"condition"` // Ex: "retention_d1 < 10 AND active_users > 100"
	
	// Action
	ActionType   RuleActionType `gorm:"size:20" json:"action_type"`
	ActionConfig string         `gorm:"type:text" json:"action_config"` // JSON com config da ação
	
	// Cooldown (evita spam)
	CooldownMinutes int       `gorm:"default:60" json:"cooldown_minutes"`
	LastTriggeredAt *time.Time `json:"last_triggered_at"`
	TriggerCount    int       `gorm:"default:0" json:"trigger_count"`
	
	// Metadata
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	CreatedBy uuid.UUID `gorm:"type:uuid" json:"created_by"`
}

// RuleExecution histórico de execução de regras
type RuleExecution struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	RuleID      uuid.UUID `gorm:"type:uuid;index" json:"rule_id"`
	AppID       uuid.UUID `gorm:"type:uuid;index" json:"app_id"`
	
	// Contexto da execução
	TriggerData  string `gorm:"type:text" json:"trigger_data"`   // JSON com dados que triggaram
	ConditionMet bool   `json:"condition_met"`                   // Condição foi satisfeita?
	
	// Resultado
	ActionTaken  bool   `json:"action_taken"`                    // Ação foi executada?
	ActionResult string `gorm:"type:text" json:"action_result"`  // JSON com resultado
	Error        string `gorm:"size:500" json:"error"`           // Erro se houver
	
	// Timing
	ExecutedAt   time.Time `json:"executed_at"`
	DurationMs   int64     `json:"duration_ms"`
}

// ========================================
// TRIGGER CONFIGS
// ========================================

// MetricTriggerConfig config para trigger de métrica
type MetricTriggerConfig struct {
	MetricName string `json:"metric_name"` // Ex: "retention_d1", "bounce_rate", "online_now"
	Operator   string `json:"operator"`    // Ex: "<", ">", "==", ">=", "<="
	Value      float64 `json:"value"`
	Period     string `json:"period"`      // Ex: "1h", "24h", "7d"
}

// EventTriggerConfig config para trigger de evento
type EventTriggerConfig struct {
	EventType string            `json:"event_type"` // Ex: "session.end", "interaction.match.ended"
	Filters   map[string]string `json:"filters"`    // Filtros adicionais
}

// ThresholdTriggerConfig config para trigger de threshold
type ThresholdTriggerConfig struct {
	MetricName string  `json:"metric_name"`
	Threshold  float64 `json:"threshold"`
	Direction  string  `json:"direction"` // "above" ou "below"
	Duration   string  `json:"duration"`  // Quanto tempo precisa estar acima/abaixo
}

// ScheduleTriggerConfig config para trigger agendado
type ScheduleTriggerConfig struct {
	Cron     string `json:"cron"`      // Expressão cron
	Timezone string `json:"timezone"`  // Ex: "America/Sao_Paulo"
}

// ========================================
// ACTION CONFIGS
// ========================================

// AlertActionConfig config para ação de alerta
type AlertActionConfig struct {
	AlertType string `json:"alert_type"` // Tipo do alerta
	Severity  string `json:"severity"`   // "info", "warning", "critical"
	Message   string `json:"message"`    // Template da mensagem
}

// WebhookActionConfig config para ação de webhook
type WebhookActionConfig struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`  // GET, POST
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`    // Template do body
}

// FlagActionConfig config para ação de flag
type FlagActionConfig struct {
	FlagName  string `json:"flag_name"`
	FlagValue string `json:"flag_value"`
	Target    string `json:"target"` // "user", "session", "app"
	TTL       string `json:"ttl"`    // Tempo de vida do flag
}

// NotifyActionConfig config para ação de notificação
type NotifyActionConfig struct {
	Channel  string   `json:"channel"`   // "email", "push", "slack"
	Template string   `json:"template"`  // Template da mensagem
	To       []string `json:"to"`        // Destinatários
}

// ========================================
// PREDEFINED RULES (Templates)
// ========================================

// PredefinedRule template de regra pré-definida
type PredefinedRule struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"` // "retention", "engagement", "growth", "alerts"
	Rule        Rule   `json:"rule"`
}

// GetPredefinedRules retorna templates de regras comuns
func GetPredefinedRules() []PredefinedRule {
	return []PredefinedRule{
		{
			ID:          "low_retention_alert",
			Name:        "Alerta de Retenção Baixa",
			Description: "Dispara quando retenção D1 cai abaixo de 10%",
			Category:    "retention",
			Rule: Rule{
				Name:            "Retenção D1 Crítica",
				TriggerType:     TriggerMetric,
				Condition:       "retention_d1 < 10",
				ActionType:      ActionAlert,
				CooldownMinutes: 1440, // 24h
			},
		},
		{
			ID:          "high_bounce_alert",
			Name:        "Alerta de Bounce Alto",
			Description: "Dispara quando bounce rate passa de 60%",
			Category:    "engagement",
			Rule: Rule{
				Name:            "Bounce Rate Alto",
				TriggerType:     TriggerMetric,
				Condition:       "bounce_rate > 60",
				ActionType:      ActionAlert,
				CooldownMinutes: 360, // 6h
			},
		},
		{
			ID:          "online_spike",
			Name:        "Pico de Usuários Online",
			Description: "Dispara quando online_now passa de threshold",
			Category:    "growth",
			Rule: Rule{
				Name:            "Pico de Online",
				TriggerType:     TriggerThreshold,
				Condition:       "online_now > 100",
				ActionType:      ActionAlert,
				CooldownMinutes: 60,
			},
		},
		{
			ID:          "churn_risk",
			Name:        "Risco de Churn",
			Description: "Identifica usuários em risco de abandonar",
			Category:    "retention",
			Rule: Rule{
				Name:            "Usuário em Risco",
				TriggerType:     TriggerEvent,
				Condition:       "days_since_last_session > 3 AND total_sessions > 2",
				ActionType:      ActionFlag,
				CooldownMinutes: 1440,
			},
		},
		{
			ID:          "engagement_drop",
			Name:        "Queda de Engajamento",
			Description: "Dispara quando eventos/min cai drasticamente",
			Category:    "engagement",
			Rule: Rule{
				Name:            "Queda de Atividade",
				TriggerType:     TriggerMetric,
				Condition:       "events_per_minute < 0.5 AND online_now > 10",
				ActionType:      ActionAlert,
				CooldownMinutes: 30,
			},
		},
	}
}
