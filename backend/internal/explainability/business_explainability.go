package explainability

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// BUSINESS EXPLAINABILITY - FASE 18 STEP 3
// "Traduzir governança técnica para linguagem de CRO"
// Determinístico, sem LLM, baseado em templates
// ========================================

// ========================================
// CLASSIFICAÇÃO DE APPS
// ========================================

// AppClassification classificação institucional de um app
// Responde: "Este app é confiável?"
type AppClassification string

const (
	AppTrusted      AppClassification = "trusted"      // Confiável - operação normal
	AppObservation  AppClassification = "observation"  // Em observação - atenção recomendada
	AppAtRisk       AppClassification = "at_risk"      // Em risco - ação necessária
	AppRestricted   AppClassification = "restricted"   // Sob restrição - operação limitada
)

// AppClassificationCriteria critérios para classificação
type AppClassificationCriteria struct {
	// Trusted: risk < 0.3, denial_rate < 20%, divergence_rate < 10%
	TrustedMaxRisk          float64
	TrustedMaxDenialRate    float64
	TrustedMaxDivergence    float64

	// Observation: risk < 0.5, denial_rate < 40%, divergence_rate < 25%
	ObservationMaxRisk       float64
	ObservationMaxDenialRate float64
	ObservationMaxDivergence float64

	// AtRisk: risk < 0.7, denial_rate < 60%, divergence_rate < 40%
	AtRiskMaxRisk       float64
	AtRiskMaxDenialRate float64
	AtRiskMaxDivergence float64

	// Restricted: acima de AtRisk
}

// DefaultClassificationCriteria critérios padrão
var DefaultClassificationCriteria = AppClassificationCriteria{
	TrustedMaxRisk:          0.3,
	TrustedMaxDenialRate:    20,
	TrustedMaxDivergence:    10,
	ObservationMaxRisk:       0.5,
	ObservationMaxDenialRate: 40,
	ObservationMaxDivergence: 25,
	AtRiskMaxRisk:           0.7,
	AtRiskMaxDenialRate:     60,
	AtRiskMaxDivergence:     40,
}

// ========================================
// EXECUTIVE SUMMARY
// ========================================

// ExecutiveSummary resumo executivo para board/CEO
// Responde às 4 perguntas do CEO
type ExecutiveSummary struct {
	GeneratedAt time.Time `json:"generated_at"`
	Period      string    `json:"period"`

	// ========================================
	// 1. "Estamos sob controle?"
	// ========================================
	ControlStatus ControlStatus `json:"control_status"`

	// ========================================
	// 2. "Onde estão os pontos de atenção?"
	// ========================================
	AttentionPoints []AttentionPoint `json:"attention_points"`

	// ========================================
	// 3. "Se algo der errado, conseguimos explicar?"
	// ========================================
	AuditReadiness AuditReadiness `json:"audit_readiness"`

	// ========================================
	// 4. "Posso crescer sem perder controle?"
	// ========================================
	ScalabilityAssessment ScalabilityAssessment `json:"scalability_assessment"`

	// ========================================
	// RESUMO NARRATIVO
	// ========================================
	NarrativeSummary string `json:"narrative_summary"`
	Recommendations  []string `json:"recommendations"`
}

// ControlStatus responde "Estamos sob controle?"
type ControlStatus struct {
	Status      string  `json:"status"`       // under_control, attention_needed, intervention_required
	Confidence  float64 `json:"confidence"`   // 0-100%
	Explanation string  `json:"explanation"`
	
	// Métricas de suporte
	KillSwitchActive    bool    `json:"kill_switch_active"`
	OpenConflicts       int64   `json:"open_conflicts"`
	PendingApprovals    int64   `json:"pending_approvals"`
	HighRiskApps        int64   `json:"high_risk_apps"`
	DivergenceRate      float64 `json:"divergence_rate"`
}

// ControlStatusLevel níveis de controle
const (
	StatusUnderControl        = "under_control"        // Tudo normal
	StatusAttentionNeeded     = "attention_needed"     // Precisa atenção
	StatusInterventionRequired = "intervention_required" // Ação urgente
)

// AttentionPoint ponto de atenção para executivos
type AttentionPoint struct {
	Priority    int       `json:"priority"`    // 1 = mais urgente
	Category    string    `json:"category"`    // risk, compliance, operational, financial
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Impact      string    `json:"impact"`      // low, medium, high, critical
	AppID       *uuid.UUID `json:"app_id,omitempty"`
	ActionNeeded string   `json:"action_needed"`
	Deadline    *time.Time `json:"deadline,omitempty"`
}

// AuditReadiness responde "Conseguimos explicar?"
type AuditReadiness struct {
	Ready       bool    `json:"ready"`
	Score       float64 `json:"score"`       // 0-100%
	Explanation string  `json:"explanation"`
	
	// Detalhes
	DecisionsWithOwner    float64 `json:"decisions_with_owner"`    // % com responsável
	DecisionsWithTimeline float64 `json:"decisions_with_timeline"` // % com timeline
	ConflictsResolved     float64 `json:"conflicts_resolved"`      // % resolvidos
	AuditTrailComplete    bool    `json:"audit_trail_complete"`
}

// ScalabilityAssessment responde "Posso crescer?"
type ScalabilityAssessment struct {
	CanScale    bool    `json:"can_scale"`
	Confidence  float64 `json:"confidence"`  // 0-100%
	Explanation string  `json:"explanation"`
	
	// Fatores
	GovernanceOverhead float64 `json:"governance_overhead"` // % de overhead
	ApprovalBottleneck bool    `json:"approval_bottleneck"` // Gargalo em aprovações
	PolicyCoverage     float64 `json:"policy_coverage"`     // % de ações cobertas
	AutomationLevel    float64 `json:"automation_level"`    // % automatizado
}

// ========================================
// APP REPORT - Relatório por App
// ========================================

// AppReport relatório executivo de um app específico
type AppReport struct {
	AppID          uuid.UUID         `json:"app_id"`
	AppName        string            `json:"app_name,omitempty"`
	GeneratedAt    time.Time         `json:"generated_at"`
	Period         string            `json:"period"`

	// Classificação institucional
	Classification AppClassification `json:"classification"`
	ClassificationReason string      `json:"classification_reason"`

	// Resumo narrativo
	Summary        string            `json:"summary"`
	
	// Métricas chave
	RiskScore      float64           `json:"risk_score"`
	RiskLevel      string            `json:"risk_level"`
	RiskTrend      string            `json:"risk_trend"` // rising, stable, falling
	
	TotalDecisions int64             `json:"total_decisions"`
	ApprovalRate   float64           `json:"approval_rate"`
	DenialRate     float64           `json:"denial_rate"`
	DivergenceRate float64           `json:"divergence_rate"`

	// Alertas específicos
	Alerts         []AppAlert        `json:"alerts"`
	
	// Recomendações
	Recommendations []string         `json:"recommendations"`

	// Histórico recente (narrativo)
	RecentActivity string            `json:"recent_activity"`
}

// AppAlert alerta específico de um app
type AppAlert struct {
	Type        string    `json:"type"`        // risk, behavior, policy, compliance
	Severity    string    `json:"severity"`    // info, warning, critical
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DetectedAt  time.Time `json:"detected_at"`
	Resolved    bool      `json:"resolved"`
}

// ========================================
// DECISION EXPLANATION - Explicação de Decisão
// ========================================

// DecisionExplanation explicação executiva de uma decisão
// Responde: "Por que isso aconteceu?"
type DecisionExplanation struct {
	DecisionID   uuid.UUID `json:"decision_id"`
	GeneratedAt  time.Time `json:"generated_at"`

	// Resumo em uma frase
	OneLiner     string    `json:"one_liner"`

	// Explicação completa
	Explanation  string    `json:"explanation"`

	// Contexto
	WhatHappened string    `json:"what_happened"`
	WhyHappened  string    `json:"why_happened"`
	WhoInvolved  string    `json:"who_involved"`
	WhatNext     string    `json:"what_next"`

	// Se houve divergência
	HadDivergence     bool   `json:"had_divergence"`
	DivergenceExplain string `json:"divergence_explain,omitempty"`

	// Impacto
	ImpactLevel  string    `json:"impact_level"`
	ImpactExplain string   `json:"impact_explain"`
}

// ========================================
// PERIOD REPORT - Relatório de Período
// ========================================

// PeriodReport relatório de um período (diário, semanal, mensal)
type PeriodReport struct {
	GeneratedAt time.Time `json:"generated_at"`
	PeriodStart time.Time `json:"period_start"`
	PeriodEnd   time.Time `json:"period_end"`
	PeriodType  string    `json:"period_type"` // daily, weekly, monthly

	// Resumo executivo
	ExecutiveSummary string `json:"executive_summary"`

	// Números chave
	KeyMetrics PeriodMetrics `json:"key_metrics"`

	// Comparação com período anterior
	Comparison *PeriodComparison `json:"comparison,omitempty"`

	// Destaques
	Highlights []string `json:"highlights"`

	// Preocupações
	Concerns []string `json:"concerns"`

	// Recomendações
	Recommendations []string `json:"recommendations"`
}

// PeriodMetrics métricas do período
type PeriodMetrics struct {
	TotalDecisions    int64   `json:"total_decisions"`
	ApprovedDecisions int64   `json:"approved_decisions"`
	DeniedDecisions   int64   `json:"denied_decisions"`
	PendingDecisions  int64   `json:"pending_decisions"`
	
	ApprovalRate      float64 `json:"approval_rate"`
	DenialRate        float64 `json:"denial_rate"`
	
	AvgRiskScore      float64 `json:"avg_risk_score"`
	MaxRiskScore      float64 `json:"max_risk_score"`
	
	DivergenceCount   int64   `json:"divergence_count"`
	DivergenceRate    float64 `json:"divergence_rate"`
	
	ConflictsDetected int64   `json:"conflicts_detected"`
	ConflictsResolved int64   `json:"conflicts_resolved"`
	
	KillSwitchEvents  int64   `json:"kill_switch_events"`
	
	UniqueApps        int64   `json:"unique_apps"`
	AppsAtRisk        int64   `json:"apps_at_risk"`
}

// PeriodComparison comparação com período anterior
type PeriodComparison struct {
	DecisionsChange    float64 `json:"decisions_change"`    // % mudança
	ApprovalRateChange float64 `json:"approval_rate_change"`
	RiskScoreChange    float64 `json:"risk_score_change"`
	DivergenceChange   float64 `json:"divergence_change"`
	
	Trend              string  `json:"trend"` // improving, stable, degrading
	TrendExplanation   string  `json:"trend_explanation"`
}

// ========================================
// TEMPLATES DE NARRATIVA
// ========================================

// NarrativeTemplates templates para geração de texto
var NarrativeTemplates = struct {
	// Control Status
	UnderControl        string
	AttentionNeeded     string
	InterventionRequired string

	// App Classification
	AppTrusted     string
	AppObservation string
	AppAtRisk      string
	AppRestricted  string

	// Decision Explanation
	DecisionAllowed string
	DecisionDenied  string
	DecisionPending string

	// Divergence
	DivergenceNote string

	// Period Summary
	PeriodGood    string
	PeriodCaution string
	PeriodConcern string
}{
	// Control Status
	UnderControl:        "O sistema está operando dentro dos parâmetros normais. Todas as decisões críticas passaram por governança adequada.",
	AttentionNeeded:     "Existem pontos que requerem atenção. Recomenda-se revisão das áreas sinalizadas antes que se tornem críticas.",
	InterventionRequired: "Ação imediata necessária. Foram detectadas condições que podem comprometer a operação se não forem tratadas.",

	// App Classification
	AppTrusted:     "Este aplicativo opera de forma consistente e dentro dos padrões esperados. Histórico de decisões demonstra comportamento confiável.",
	AppObservation: "Este aplicativo apresenta alguns indicadores que merecem acompanhamento. Não há risco imediato, mas recomenda-se monitoramento.",
	AppAtRisk:      "Este aplicativo apresenta comportamento que requer atenção. Métricas indicam possível degradação ou padrão anômalo.",
	AppRestricted:  "Este aplicativo está sob restrição devido a comportamento de alto risco. Operações limitadas até revisão completa.",

	// Decision Explanation
	DecisionAllowed: "A decisão foi aprovada porque atendeu todos os critérios de política e não apresentou fatores de risco que justificassem bloqueio.",
	DecisionDenied:  "A decisão foi bloqueada porque violou uma ou mais políticas de governança ou apresentou risco acima do aceitável.",
	DecisionPending: "A decisão aguarda aprovação humana porque envolve ação que requer supervisão conforme política vigente.",

	// Divergence
	DivergenceNote: "Houve divergência entre a decisão da política e a recomendação do threshold. Isso indica que os critérios podem precisar de calibração.",

	// Period Summary
	PeriodGood:    "O período foi positivo. Métricas de governança estão dentro do esperado e não há alertas críticos.",
	PeriodCaution: "O período apresentou alguns pontos de atenção. Recomenda-se revisão das áreas sinalizadas.",
	PeriodConcern: "O período apresentou indicadores preocupantes. Ação corretiva é recomendada.",
}
