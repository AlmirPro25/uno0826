package explainability

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// ADMIN INTELLIGENCE - FASE 18 STEP 2
// "Mostrar onde o sistema está sob tensão"
// Apenas leitura e agregação - zero decisão nova
// ========================================

// AdminDashboard visão consolidada para administradores
type AdminDashboard struct {
	// Timestamp da geração
	GeneratedAt time.Time `json:"generated_at"`
	Period      string    `json:"period"` // last_24h, last_7d, last_30d

	// ========================================
	// VISÃO GERAL
	// ========================================
	Overview DashboardOverview `json:"overview"`

	// ========================================
	// TENSÕES DETECTADAS
	// ========================================
	Tensions []TensionPoint `json:"tensions"`

	// ========================================
	// RANKINGS
	// ========================================
	TopRiskyApps       []AppRiskRanking       `json:"top_risky_apps"`
	MostTriggeredPolicies []PolicyTriggerRanking `json:"most_triggered_policies"`
	DivergenceHotspots []DivergenceHotspot    `json:"divergence_hotspots"`
}

// DashboardOverview números gerais
type DashboardOverview struct {
	TotalDecisions     int64   `json:"total_decisions"`
	AllowedCount       int64   `json:"allowed_count"`
	DeniedCount        int64   `json:"denied_count"`
	PendingCount       int64   `json:"pending_count"`
	DivergenceCount    int64   `json:"divergence_count"`
	DivergenceRate     float64 `json:"divergence_rate"` // % de decisões com divergência
	UniqueApps         int64   `json:"unique_apps"`
	AppsAtRisk         int64   `json:"apps_at_risk"` // apps com risk >= 0.6
}

// TensionPoint ponto de tensão no sistema
// "Onde o sistema está sob pressão"
type TensionPoint struct {
	Type        string    `json:"type"`        // risk_spike, high_denial_rate, divergence_cluster, policy_overload
	Severity    string    `json:"severity"`    // info, warning, critical
	Title       string    `json:"title"`
	Description string    `json:"description"`
	AppID       *uuid.UUID `json:"app_id,omitempty"`
	PolicyID    *uuid.UUID `json:"policy_id,omitempty"`
	Metric      float64   `json:"metric"`      // Valor numérico relevante
	Threshold   float64   `json:"threshold"`   // Limite que foi excedido
	DetectedAt  time.Time `json:"detected_at"`
}

// TensionType tipos de tensão
const (
	TensionRiskSpike        = "risk_spike"         // App com risco subindo rápido
	TensionHighDenialRate   = "high_denial_rate"   // Muitas negações em um app
	TensionDivergenceCluster = "divergence_cluster" // Muitas divergências policy/threshold
	TensionPolicyOverload   = "policy_overload"    // Uma policy sendo muito acionada
)

// TensionSeverity níveis de severidade
const (
	SeverityInfo     = "info"
	SeverityWarning  = "warning"
	SeverityCritical = "critical"
)

// AppRiskRanking ranking de apps por risco
type AppRiskRanking struct {
	Rank        int       `json:"rank"`
	AppID       uuid.UUID `json:"app_id"`
	AppName     string    `json:"app_name,omitempty"`
	RiskScore   float64   `json:"risk_score"`
	RiskLevel   string    `json:"risk_level"`
	Trend       string    `json:"trend"` // rising, stable, falling
	TopFactor   string    `json:"top_factor"`
	Decisions24h int64    `json:"decisions_24h"`
	DenialRate  float64   `json:"denial_rate"`
}

// PolicyTriggerRanking ranking de policies por acionamento
type PolicyTriggerRanking struct {
	Rank         int       `json:"rank"`
	PolicyID     uuid.UUID `json:"policy_id"`
	PolicyName   string    `json:"policy_name"`
	TriggerCount int64     `json:"trigger_count"`
	DenyCount    int64     `json:"deny_count"`
	AllowCount   int64     `json:"allow_count"`
	PendingCount int64     `json:"pending_count"`
	DenyRate     float64   `json:"deny_rate"` // % de negações
}

// DivergenceHotspot ponto quente de divergência
type DivergenceHotspot struct {
	PolicyID        uuid.UUID `json:"policy_id"`
	PolicyName      string    `json:"policy_name"`
	ThresholdAction string    `json:"threshold_action"` // O que threshold recomenda
	PolicyResult    string    `json:"policy_result"`    // O que policy decide
	Count           int64     `json:"count"`            // Quantas vezes divergiu
	LastOccurrence  time.Time `json:"last_occurrence"`
}

// ========================================
// QUERY PARAMETERS
// ========================================

// DashboardQuery parâmetros para gerar dashboard
type DashboardQuery struct {
	Period    string     `json:"period"`     // last_24h, last_7d, last_30d
	AppID     *uuid.UUID `json:"app_id,omitempty"`
	TopN      int        `json:"top_n"`      // Quantos itens nos rankings
}

// GetPeriodDuration converte período para duração
func (q DashboardQuery) GetPeriodDuration() time.Duration {
	switch q.Period {
	case "last_7d":
		return 7 * 24 * time.Hour
	case "last_30d":
		return 30 * 24 * time.Hour
	default: // last_24h
		return 24 * time.Hour
	}
}
