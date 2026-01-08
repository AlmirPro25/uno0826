package observer

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// HUMAN DECISION MODEL - Fase 25
// "Dar olhos humanos ao sistema — sem dar mãos"
// ========================================

// DecisionType tipos de decisão humana
type DecisionType string

const (
	DecisionIgnored  DecisionType = "ignored"  // Humano ignorou a sugestão
	DecisionAccepted DecisionType = "accepted" // Humano aceitou (vai agir manualmente)
	DecisionDeferred DecisionType = "deferred" // Humano adiou para depois
)

// HumanDecision representa uma decisão humana sobre uma sugestão
type HumanDecision struct {
	ID           uuid.UUID    `gorm:"type:uuid;primaryKey" json:"id"`
	SuggestionID uuid.UUID    `gorm:"type:uuid;index" json:"suggestion_id"`
	Decision     DecisionType `gorm:"size:20;index" json:"decision"`
	Reason       string       `gorm:"type:text" json:"reason"`
	Human        string       `gorm:"size:100;index" json:"human"`
	IP           string       `gorm:"size:45" json:"ip"`
	UserAgent    string       `gorm:"size:500" json:"user_agent"`
	CreatedAt    time.Time    `gorm:"index" json:"created_at"`
}

// TableName define o nome da tabela
func (HumanDecision) TableName() string {
	return "human_decisions"
}

// ========================================
// CONSOLE DASHBOARD
// ========================================

// ConsoleDashboard dados do console
type ConsoleDashboard struct {
	// Sugestões
	RecentSuggestions []AgentMemoryEntry `json:"recent_suggestions"`
	TotalSuggestions  int64              `json:"total_suggestions"`
	
	// Decisões
	TotalDecisions    int64              `json:"total_decisions"`
	DecisionsByType   map[string]int64   `json:"decisions_by_type"`
	PendingSuggestions int64             `json:"pending_suggestions"`
	
	// Métricas
	AvgConfidence     float64            `json:"avg_confidence"`
	
	// Tendências
	Trends            ConsoleTrends      `json:"trends"`
	
	// Kill Switches
	ActiveKillSwitches []KillSwitchInfo  `json:"active_kill_switches"`
	
	// Sistema
	SystemHealth      SystemHealthInfo   `json:"system_health"`
}

// ConsoleTrends tendências do sistema
type ConsoleTrends struct {
	ErrorsTrend      string `json:"errors_trend"`      // "up", "down", "stable"
	SuggestionsTrend string `json:"suggestions_trend"` // "up", "down", "stable"
	HealthTrend      string `json:"health_trend"`      // "up", "down", "stable"
}

// KillSwitchInfo informação de kill switch
type KillSwitchInfo struct {
	Scope     string    `json:"scope"`
	Reason    string    `json:"reason"`
	ExpiresAt time.Time `json:"expires_at,omitempty"`
	Active    bool      `json:"active"`
}

// SystemHealthInfo informação de saúde do sistema
type SystemHealthInfo struct {
	Status        string `json:"status"`
	UptimeSeconds int64  `json:"uptime_seconds"`
	ErrorRate     float64 `json:"error_rate"`
	MemoryMB      uint64  `json:"memory_mb"`
}

// ========================================
// DECISION STATS
// ========================================

// DecisionStats estatísticas de decisões
type DecisionStats struct {
	TotalDecisions  int64            `json:"total_decisions"`
	ByType          map[string]int64 `json:"by_type"`
	ByHuman         map[string]int64 `json:"by_human"`
	Last24h         int64            `json:"last_24h"`
	Last7d          int64            `json:"last_7d"`
	AvgResponseTime float64          `json:"avg_response_time_hours"`
}
