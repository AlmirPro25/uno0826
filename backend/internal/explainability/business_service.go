package explainability

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// BUSINESS EXPLAINABILITY SERVICE - FASE 18 STEP 3
// "Chief Risk Officer Digital"
// Determinístico, sem LLM, baseado em templates
// ========================================

type BusinessExplainabilityService struct {
	db                  *gorm.DB
	timelineService     *TimelineService
	intelligenceService *IntelligenceService
	criteria            AppClassificationCriteria
}

func NewBusinessExplainabilityService(
	db *gorm.DB,
	timelineService *TimelineService,
	intelligenceService *IntelligenceService,
) *BusinessExplainabilityService {
	return &BusinessExplainabilityService{
		db:                  db,
		timelineService:     timelineService,
		intelligenceService: intelligenceService,
		criteria:            DefaultClassificationCriteria,
	}
}


// ========================================
// EXECUTIVE SUMMARY - Responde às 4 perguntas do CEO
// ========================================

// GetExecutiveSummary gera resumo executivo completo
func (s *BusinessExplainabilityService) GetExecutiveSummary(period string) (*ExecutiveSummary, error) {
	query := DashboardQuery{Period: period, TopN: 10}
	dashboard, err := s.intelligenceService.GetDashboard(query)
	if err != nil {
		return nil, err
	}

	summary := &ExecutiveSummary{
		GeneratedAt: time.Now(),
		Period:      period,
	}

	// 1. Control Status
	summary.ControlStatus = s.assessControlStatus(dashboard)

	// 2. Attention Points
	summary.AttentionPoints = s.generateAttentionPoints(dashboard)

	// 3. Audit Readiness
	summary.AuditReadiness = s.assessAuditReadiness(dashboard)

	// 4. Scalability Assessment
	summary.ScalabilityAssessment = s.assessScalability(dashboard)

	// Narrative Summary
	summary.NarrativeSummary = s.generateNarrativeSummary(summary)
	summary.Recommendations = s.generateRecommendations(summary)

	return summary, nil
}

// assessControlStatus avalia "Estamos sob controle?"
func (s *BusinessExplainabilityService) assessControlStatus(dashboard *AdminDashboard) ControlStatus {
	status := ControlStatus{
		DivergenceRate:   dashboard.Overview.DivergenceRate,
		HighRiskApps:     dashboard.Overview.AppsAtRisk,
	}

	// Contar conflitos abertos e aprovações pendentes
	s.db.Table("decision_conflicts").Where("status = ?", "open").Count(&status.OpenConflicts)
	s.db.Table("approval_requests").Where("status = ?", "pending").Count(&status.PendingApprovals)
	
	// Verificar kill switch
	var activeKillSwitch int64
	s.db.Table("kill_switches").Where("is_active = ?", true).Count(&activeKillSwitch)
	status.KillSwitchActive = activeKillSwitch > 0

	// Calcular status
	criticalCount := 0
	warningCount := 0

	if status.KillSwitchActive {
		criticalCount++
	}
	if status.OpenConflicts > 0 {
		criticalCount++
	}
	if status.HighRiskApps > 2 {
		criticalCount++
	} else if status.HighRiskApps > 0 {
		warningCount++
	}
	if status.DivergenceRate > 30 {
		criticalCount++
	} else if status.DivergenceRate > 15 {
		warningCount++
	}
	if status.PendingApprovals > 10 {
		warningCount++
	}

	// Determinar status final
	if criticalCount > 0 {
		status.Status = StatusInterventionRequired
		status.Confidence = 100 - float64(criticalCount*15)
		status.Explanation = NarrativeTemplates.InterventionRequired
	} else if warningCount > 1 {
		status.Status = StatusAttentionNeeded
		status.Confidence = 100 - float64(warningCount*10)
		status.Explanation = NarrativeTemplates.AttentionNeeded
	} else {
		status.Status = StatusUnderControl
		status.Confidence = 95 - float64(warningCount*5)
		status.Explanation = NarrativeTemplates.UnderControl
	}

	return status
}


// generateAttentionPoints gera pontos de atenção para executivos
func (s *BusinessExplainabilityService) generateAttentionPoints(dashboard *AdminDashboard) []AttentionPoint {
	points := []AttentionPoint{}
	priority := 1

	// Converter tensões técnicas em pontos de atenção executivos
	for _, tension := range dashboard.Tensions {
		point := AttentionPoint{
			Priority: priority,
			Title:    tension.Title,
			AppID:    tension.AppID,
		}

		switch tension.Type {
		case TensionRiskSpike:
			point.Category = "risk"
			point.Description = fmt.Sprintf("Aplicativo apresentando comportamento de risco elevado (%.0f%% acima do normal)", tension.Metric*100)
			point.Impact = tension.Severity
			point.ActionNeeded = "Revisar políticas do app e considerar modo shadow"

		case TensionHighDenialRate:
			point.Category = "operational"
			point.Description = fmt.Sprintf("Taxa de negação de %.0f%% indica possível problema de configuração ou comportamento anômalo", tension.Metric)
			point.Impact = tension.Severity
			point.ActionNeeded = "Analisar padrão de requisições e ajustar políticas se necessário"

		case TensionDivergenceCluster:
			point.Category = "compliance"
			point.Description = fmt.Sprintf("%.0f%% das decisões têm divergência entre política e threshold - calibração necessária", tension.Metric)
			point.Impact = tension.Severity
			point.ActionNeeded = "Revisar alinhamento entre políticas e thresholds"

		case TensionPolicyOverload:
			point.Category = "operational"
			point.Description = fmt.Sprintf("Política sendo acionada excessivamente com %.0f%% de negações", tension.Metric)
			point.Impact = tension.Severity
			point.ActionNeeded = "Avaliar se política está muito restritiva ou se há problema no fluxo"
		}

		points = append(points, point)
		priority++
	}

	return points
}

// assessAuditReadiness avalia "Conseguimos explicar?"
func (s *BusinessExplainabilityService) assessAuditReadiness(dashboard *AdminDashboard) AuditReadiness {
	readiness := AuditReadiness{
		AuditTrailComplete: true, // Por design, audit log é sempre completo
	}

	// Decisões com owner (todas têm por design)
	readiness.DecisionsWithOwner = 100

	// Decisões com timeline
	var withTimeline int64
	s.db.Model(&DecisionTimeline{}).Count(&withTimeline)
	if dashboard.Overview.TotalDecisions > 0 {
		readiness.DecisionsWithTimeline = float64(withTimeline) / float64(dashboard.Overview.TotalDecisions) * 100
	} else {
		readiness.DecisionsWithTimeline = 100
	}

	// Conflitos resolvidos
	var totalConflicts, resolvedConflicts int64
	s.db.Table("decision_conflicts").Count(&totalConflicts)
	s.db.Table("decision_conflicts").Where("status = ?", "resolved").Count(&resolvedConflicts)
	if totalConflicts > 0 {
		readiness.ConflictsResolved = float64(resolvedConflicts) / float64(totalConflicts) * 100
	} else {
		readiness.ConflictsResolved = 100
	}

	// Score geral
	readiness.Score = (readiness.DecisionsWithOwner + readiness.DecisionsWithTimeline + readiness.ConflictsResolved) / 3

	readiness.Ready = readiness.Score >= 90
	if readiness.Ready {
		readiness.Explanation = "Sistema está preparado para auditoria. Todas as decisões têm rastreabilidade completa."
	} else {
		readiness.Explanation = fmt.Sprintf("Score de prontidão em %.0f%%. Algumas áreas precisam de atenção antes de auditoria.", readiness.Score)
	}

	return readiness
}


// assessScalability avalia "Posso crescer?"
func (s *BusinessExplainabilityService) assessScalability(dashboard *AdminDashboard) ScalabilityAssessment {
	assessment := ScalabilityAssessment{}

	// Overhead de governança (% de decisões que precisaram aprovação)
	if dashboard.Overview.TotalDecisions > 0 {
		assessment.GovernanceOverhead = float64(dashboard.Overview.PendingCount) / float64(dashboard.Overview.TotalDecisions) * 100
	}

	// Gargalo de aprovação (muitas pendentes)
	var pendingApprovals int64
	s.db.Table("approval_requests").Where("status = ?", "pending").Count(&pendingApprovals)
	assessment.ApprovalBottleneck = pendingApprovals > 20

	// Cobertura de políticas (assumindo que todas as ações passam por policy)
	assessment.PolicyCoverage = 100

	// Nível de automação (% de decisões que não precisaram de humano)
	if dashboard.Overview.TotalDecisions > 0 {
		automated := dashboard.Overview.AllowedCount + dashboard.Overview.DeniedCount
		assessment.AutomationLevel = float64(automated) / float64(dashboard.Overview.TotalDecisions) * 100
	}

	// Avaliação final
	assessment.CanScale = !assessment.ApprovalBottleneck && assessment.GovernanceOverhead < 30
	assessment.Confidence = 100 - assessment.GovernanceOverhead

	if assessment.CanScale {
		assessment.Explanation = "Sistema pode escalar. Governança não representa gargalo significativo."
	} else if assessment.ApprovalBottleneck {
		assessment.Explanation = "Gargalo detectado em aprovações. Considere aumentar autonomia de agentes confiáveis."
	} else {
		assessment.Explanation = fmt.Sprintf("Overhead de governança em %.0f%%. Otimização recomendada antes de escalar.", assessment.GovernanceOverhead)
	}

	return assessment
}

// generateNarrativeSummary gera resumo narrativo
func (s *BusinessExplainabilityService) generateNarrativeSummary(summary *ExecutiveSummary) string {
	var narrative string

	switch summary.ControlStatus.Status {
	case StatusUnderControl:
		narrative = fmt.Sprintf(
			"O sistema está operando normalmente com %.0f%% de confiança. ",
			summary.ControlStatus.Confidence,
		)
	case StatusAttentionNeeded:
		narrative = fmt.Sprintf(
			"Existem %d pontos que requerem atenção. Confiança atual em %.0f%%. ",
			len(summary.AttentionPoints),
			summary.ControlStatus.Confidence,
		)
	case StatusInterventionRequired:
		narrative = fmt.Sprintf(
			"Ação imediata necessária. %d pontos críticos detectados. ",
			len(summary.AttentionPoints),
		)
	}

	// Adicionar contexto de auditoria
	if summary.AuditReadiness.Ready {
		narrative += "Sistema preparado para auditoria. "
	} else {
		narrative += fmt.Sprintf("Prontidão para auditoria em %.0f%%. ", summary.AuditReadiness.Score)
	}

	// Adicionar contexto de escalabilidade
	if summary.ScalabilityAssessment.CanScale {
		narrative += "Capacidade de escala confirmada."
	} else {
		narrative += "Otimização necessária antes de escalar."
	}

	return narrative
}

// generateRecommendations gera recomendações
func (s *BusinessExplainabilityService) generateRecommendations(summary *ExecutiveSummary) []string {
	recommendations := []string{}

	// Baseado no status de controle
	if summary.ControlStatus.KillSwitchActive {
		recommendations = append(recommendations, "Kill Switch ativo - avaliar se condição de emergência persiste")
	}
	if summary.ControlStatus.OpenConflicts > 0 {
		recommendations = append(recommendations, fmt.Sprintf("Resolver %d conflitos abertos antes de novas operações", summary.ControlStatus.OpenConflicts))
	}
	if summary.ControlStatus.PendingApprovals > 5 {
		recommendations = append(recommendations, fmt.Sprintf("Processar %d aprovações pendentes para evitar gargalo", summary.ControlStatus.PendingApprovals))
	}

	// Baseado em pontos de atenção
	for _, point := range summary.AttentionPoints {
		if point.Impact == "critical" {
			recommendations = append(recommendations, point.ActionNeeded)
		}
	}

	// Baseado em escalabilidade
	if summary.ScalabilityAssessment.ApprovalBottleneck {
		recommendations = append(recommendations, "Revisar matriz de autonomia para reduzir gargalo de aprovações")
	}

	// Se não há recomendações, adicionar uma positiva
	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Manter monitoramento regular - sistema operando dentro do esperado")
	}

	return recommendations
}


// ========================================
// APP CLASSIFICATION & REPORT
// ========================================

// ClassifyApp classifica um app institucionalmente
func (s *BusinessExplainabilityService) ClassifyApp(appID uuid.UUID, period string) (AppClassification, string) {
	intel, err := s.intelligenceService.GetAppIntelligence(appID, period)
	if err != nil {
		return AppObservation, "Dados insuficientes para classificação"
	}

	// Aplicar critérios
	c := s.criteria

	// Trusted
	if intel.AvgRiskScore <= c.TrustedMaxRisk &&
		intel.DenialRate <= c.TrustedMaxDenialRate &&
		intel.DivergenceRate <= c.TrustedMaxDivergence {
		return AppTrusted, NarrativeTemplates.AppTrusted
	}

	// Observation
	if intel.AvgRiskScore <= c.ObservationMaxRisk &&
		intel.DenialRate <= c.ObservationMaxDenialRate &&
		intel.DivergenceRate <= c.ObservationMaxDivergence {
		return AppObservation, NarrativeTemplates.AppObservation
	}

	// AtRisk
	if intel.AvgRiskScore <= c.AtRiskMaxRisk &&
		intel.DenialRate <= c.AtRiskMaxDenialRate &&
		intel.DivergenceRate <= c.AtRiskMaxDivergence {
		return AppAtRisk, NarrativeTemplates.AppAtRisk
	}

	// Restricted
	return AppRestricted, NarrativeTemplates.AppRestricted
}

// GetAppReport gera relatório executivo de um app
func (s *BusinessExplainabilityService) GetAppReport(appID uuid.UUID, period string) (*AppReport, error) {
	intel, err := s.intelligenceService.GetAppIntelligence(appID, period)
	if err != nil {
		return nil, err
	}

	classification, classificationReason := s.ClassifyApp(appID, period)

	report := &AppReport{
		AppID:                appID,
		GeneratedAt:          time.Now(),
		Period:               period,
		Classification:       classification,
		ClassificationReason: classificationReason,
		RiskScore:            intel.AvgRiskScore,
		RiskLevel:            intel.RiskLevel,
		RiskTrend:            "stable", // TODO: calcular tendência real
		TotalDecisions:       intel.TotalDecisions,
		DenialRate:           intel.DenialRate,
		DivergenceRate:       intel.DivergenceRate,
	}

	// Calcular approval rate
	if intel.TotalDecisions > 0 {
		report.ApprovalRate = float64(intel.AllowedCount) / float64(intel.TotalDecisions) * 100
	}

	// Gerar summary narrativo
	report.Summary = s.generateAppSummary(report, intel)

	// Gerar alertas
	report.Alerts = s.generateAppAlerts(intel)

	// Gerar recomendações
	report.Recommendations = s.generateAppRecommendations(report, intel)

	// Atividade recente
	report.RecentActivity = s.generateRecentActivityNarrative(intel)

	return report, nil
}

// generateAppSummary gera resumo narrativo do app
func (s *BusinessExplainabilityService) generateAppSummary(report *AppReport, intel *AppIntelligence) string {
	var summary string

	switch report.Classification {
	case AppTrusted:
		summary = fmt.Sprintf(
			"Aplicativo operando de forma confiável. Score de risco em %.0f%% (nível %s). "+
				"Taxa de aprovação de %.0f%% em %d decisões no período.",
			report.RiskScore*100, report.RiskLevel, report.ApprovalRate, report.TotalDecisions,
		)
	case AppObservation:
		summary = fmt.Sprintf(
			"Aplicativo em observação. Score de risco em %.0f%% (nível %s). "+
				"Taxa de negação de %.0f%% merece acompanhamento.",
			report.RiskScore*100, report.RiskLevel, report.DenialRate,
		)
	case AppAtRisk:
		summary = fmt.Sprintf(
			"Aplicativo apresentando risco elevado (%.0f%%). "+
				"Taxa de negação em %.0f%% e divergência em %.0f%%. Ação recomendada.",
			report.RiskScore*100, report.DenialRate, report.DivergenceRate,
		)
	case AppRestricted:
		summary = fmt.Sprintf(
			"Aplicativo sob restrição. Métricas críticas: risco %.0f%%, negação %.0f%%, divergência %.0f%%. "+
				"Operação limitada até revisão.",
			report.RiskScore*100, report.DenialRate, report.DivergenceRate,
		)
	}

	return summary
}

// generateAppAlerts gera alertas do app
func (s *BusinessExplainabilityService) generateAppAlerts(intel *AppIntelligence) []AppAlert {
	alerts := []AppAlert{}
	now := time.Now()

	// Alerta de risco alto
	if intel.AvgRiskScore >= 0.6 {
		severity := "warning"
		if intel.AvgRiskScore >= 0.8 {
			severity = "critical"
		}
		alerts = append(alerts, AppAlert{
			Type:        "risk",
			Severity:    severity,
			Title:       "Risco elevado",
			Description: fmt.Sprintf("Score de risco médio em %.0f%%", intel.AvgRiskScore*100),
			DetectedAt:  now,
		})
	}

	// Alerta de alta negação
	if intel.DenialRate >= 40 {
		severity := "warning"
		if intel.DenialRate >= 70 {
			severity = "critical"
		}
		alerts = append(alerts, AppAlert{
			Type:        "behavior",
			Severity:    severity,
			Title:       "Alta taxa de negação",
			Description: fmt.Sprintf("%.0f%% das decisões foram negadas", intel.DenialRate),
			DetectedAt:  now,
		})
	}

	// Alerta de divergência
	if intel.DivergenceRate >= 20 {
		alerts = append(alerts, AppAlert{
			Type:        "policy",
			Severity:    "warning",
			Title:       "Divergência policy/threshold",
			Description: fmt.Sprintf("%.0f%% das decisões têm divergência", intel.DivergenceRate),
			DetectedAt:  now,
		})
	}

	return alerts
}


// generateAppRecommendations gera recomendações para o app
func (s *BusinessExplainabilityService) generateAppRecommendations(report *AppReport, intel *AppIntelligence) []string {
	recommendations := []string{}

	switch report.Classification {
	case AppTrusted:
		recommendations = append(recommendations, "Manter monitoramento regular")
		if intel.TotalDecisions > 100 {
			recommendations = append(recommendations, "Considerar aumento de autonomia para operações de baixo risco")
		}

	case AppObservation:
		recommendations = append(recommendations, "Acompanhar evolução das métricas nos próximos 7 dias")
		if intel.DivergenceRate > 15 {
			recommendations = append(recommendations, "Revisar alinhamento entre políticas e thresholds")
		}

	case AppAtRisk:
		recommendations = append(recommendations, "Revisar políticas aplicadas a este app")
		recommendations = append(recommendations, "Considerar ativar modo shadow para novas operações")
		if intel.DenialRate > 50 {
			recommendations = append(recommendations, "Investigar padrão de requisições negadas")
		}

	case AppRestricted:
		recommendations = append(recommendations, "Realizar auditoria completa antes de liberar operações")
		recommendations = append(recommendations, "Manter em modo shadow até normalização das métricas")
		recommendations = append(recommendations, "Agendar revisão com responsável pelo app")
	}

	return recommendations
}

// generateRecentActivityNarrative gera narrativa de atividade recente
func (s *BusinessExplainabilityService) generateRecentActivityNarrative(intel *AppIntelligence) string {
	if len(intel.RecentDecisions) == 0 {
		return "Nenhuma atividade recente registrada."
	}

	// Contar tipos de decisão recentes
	allowed := 0
	denied := 0
	pending := 0
	for _, d := range intel.RecentDecisions {
		switch d.FinalOutcome {
		case "allowed":
			allowed++
		case "denied":
			denied++
		case "pending_approval":
			pending++
		}
	}

	return fmt.Sprintf(
		"Nas últimas %d decisões: %d aprovadas, %d negadas, %d pendentes.",
		len(intel.RecentDecisions), allowed, denied, pending,
	)
}

// ========================================
// DECISION EXPLANATION
// ========================================

// ExplainDecision gera explicação executiva de uma decisão
func (s *BusinessExplainabilityService) ExplainDecision(decisionID uuid.UUID) (*DecisionExplanation, error) {
	timeline, err := s.timelineService.GetByDecisionID(decisionID)
	if err != nil {
		return nil, err
	}

	explanation := &DecisionExplanation{
		DecisionID:    decisionID,
		GeneratedAt:   time.Now(),
		HadDivergence: timeline.HasDivergence,
	}

	// One-liner
	explanation.OneLiner = s.generateOneLiner(timeline)

	// What happened
	explanation.WhatHappened = s.generateWhatHappened(timeline)

	// Why happened
	explanation.WhyHappened = s.generateWhyHappened(timeline)

	// Who involved
	explanation.WhoInvolved = s.generateWhoInvolved(timeline)

	// What next
	explanation.WhatNext = s.generateWhatNext(timeline)

	// Divergence explanation
	if timeline.HasDivergence {
		explanation.DivergenceExplain = s.generateDivergenceExplanation(timeline)
	}

	// Impact
	explanation.ImpactLevel = timeline.RiskLevel
	explanation.ImpactExplain = s.generateImpactExplanation(timeline)

	// Full explanation
	explanation.Explanation = fmt.Sprintf(
		"%s %s %s",
		explanation.WhatHappened,
		explanation.WhyHappened,
		explanation.WhatNext,
	)

	return explanation, nil
}

func (s *BusinessExplainabilityService) generateOneLiner(t *DecisionTimeline) string {
	action := t.Action
	outcome := t.FinalOutcome

	switch outcome {
	case "allowed":
		return fmt.Sprintf("Ação '%s' foi aprovada e executada com sucesso.", action)
	case "denied":
		return fmt.Sprintf("Ação '%s' foi bloqueada pela governança.", action)
	case "pending_approval":
		return fmt.Sprintf("Ação '%s' aguarda aprovação humana.", action)
	default:
		return fmt.Sprintf("Ação '%s' processada com resultado '%s'.", action, outcome)
	}
}

func (s *BusinessExplainabilityService) generateWhatHappened(t *DecisionTimeline) string {
	return fmt.Sprintf(
		"Em %s, uma solicitação de '%s' sobre '%s' foi processada pelo sistema de governança.",
		t.Timestamp.Format("02/01/2006 às 15:04"),
		t.Action,
		t.Resource,
	)
}

func (s *BusinessExplainabilityService) generateWhyHappened(t *DecisionTimeline) string {
	switch t.FinalOutcome {
	case "allowed":
		if t.PolicyReason != "" {
			return fmt.Sprintf("A decisão foi aprovada porque: %s.", t.PolicyReason)
		}
		return NarrativeTemplates.DecisionAllowed
	case "denied":
		if t.PolicyReason != "" {
			return fmt.Sprintf("A decisão foi bloqueada porque: %s.", t.PolicyReason)
		}
		return NarrativeTemplates.DecisionDenied
	case "pending_approval":
		if t.PolicyReason != "" {
			return fmt.Sprintf("A decisão aguarda aprovação porque: %s.", t.PolicyReason)
		}
		return NarrativeTemplates.DecisionPending
	default:
		return fmt.Sprintf("Resultado determinado pela política '%s'.", t.PolicyName)
	}
}

func (s *BusinessExplainabilityService) generateWhoInvolved(t *DecisionTimeline) string {
	actorType := t.ActorType
	switch actorType {
	case "user":
		return "Solicitação originada por usuário autenticado."
	case "agent":
		return "Solicitação originada por agente automatizado."
	case "system":
		return "Solicitação originada pelo próprio sistema."
	default:
		return fmt.Sprintf("Solicitação originada por %s.", actorType)
	}
}

func (s *BusinessExplainabilityService) generateWhatNext(t *DecisionTimeline) string {
	switch t.FinalOutcome {
	case "allowed":
		return "Nenhuma ação adicional necessária."
	case "denied":
		return "Solicitante pode revisar os critérios e tentar novamente se aplicável."
	case "pending_approval":
		return "Aguardando decisão de aprovador autorizado."
	default:
		return "Verificar status atual da solicitação."
	}
}

func (s *BusinessExplainabilityService) generateDivergenceExplanation(t *DecisionTimeline) string {
	return fmt.Sprintf(
		"Houve divergência: a política decidiu '%s', mas o threshold recomendou '%s'. %s",
		t.PolicyResult,
		t.ThresholdAction,
		NarrativeTemplates.DivergenceNote,
	)
}

func (s *BusinessExplainabilityService) generateImpactExplanation(t *DecisionTimeline) string {
	switch t.RiskLevel {
	case "critical":
		return "Impacto crítico - decisão afeta operações sensíveis."
	case "high":
		return "Impacto alto - decisão requer atenção especial."
	case "medium":
		return "Impacto médio - decisão dentro de parâmetros normais."
	case "low":
		return "Impacto baixo - decisão de rotina."
	default:
		return "Impacto não classificado."
	}
}


// ========================================
// PERIOD REPORT
// ========================================

// GetPeriodReport gera relatório de período
func (s *BusinessExplainabilityService) GetPeriodReport(periodType string) (*PeriodReport, error) {
	var duration time.Duration
	switch periodType {
	case "daily":
		duration = 24 * time.Hour
	case "weekly":
		duration = 7 * 24 * time.Hour
	case "monthly":
		duration = 30 * 24 * time.Hour
	default:
		duration = 24 * time.Hour
		periodType = "daily"
	}

	now := time.Now()
	periodStart := now.Add(-duration)

	report := &PeriodReport{
		GeneratedAt: now,
		PeriodStart: periodStart,
		PeriodEnd:   now,
		PeriodType:  periodType,
	}

	// Buscar métricas do período
	metrics, err := s.getPeriodMetrics(periodStart, now)
	if err != nil {
		return nil, err
	}
	report.KeyMetrics = *metrics

	// Gerar comparação com período anterior
	previousStart := periodStart.Add(-duration)
	previousMetrics, err := s.getPeriodMetrics(previousStart, periodStart)
	if err == nil && previousMetrics.TotalDecisions > 0 {
		report.Comparison = s.comparePeriods(previousMetrics, metrics)
	}

	// Gerar resumo executivo
	report.ExecutiveSummary = s.generatePeriodSummary(report)

	// Gerar destaques
	report.Highlights = s.generateHighlights(metrics)

	// Gerar preocupações
	report.Concerns = s.generateConcerns(metrics)

	// Gerar recomendações
	report.Recommendations = s.generatePeriodRecommendations(report)

	return report, nil
}

func (s *BusinessExplainabilityService) getPeriodMetrics(start, end time.Time) (*PeriodMetrics, error) {
	metrics := &PeriodMetrics{}

	// Total de decisões
	s.db.Model(&DecisionTimeline{}).
		Where("timestamp >= ? AND timestamp <= ?", start, end).
		Count(&metrics.TotalDecisions)

	// Por outcome
	type OutcomeCount struct {
		Outcome string
		Count   int64
	}
	var outcomes []OutcomeCount
	s.db.Model(&DecisionTimeline{}).
		Select("final_outcome as outcome, count(*) as count").
		Where("timestamp >= ? AND timestamp <= ?", start, end).
		Group("final_outcome").
		Find(&outcomes)

	for _, o := range outcomes {
		switch o.Outcome {
		case "allowed":
			metrics.ApprovedDecisions = o.Count
		case "denied":
			metrics.DeniedDecisions = o.Count
		case "pending_approval":
			metrics.PendingDecisions = o.Count
		}
	}

	// Taxas
	if metrics.TotalDecisions > 0 {
		metrics.ApprovalRate = float64(metrics.ApprovedDecisions) / float64(metrics.TotalDecisions) * 100
		metrics.DenialRate = float64(metrics.DeniedDecisions) / float64(metrics.TotalDecisions) * 100
	}

	// Risk scores
	type RiskStats struct {
		AvgRisk float64
		MaxRisk float64
	}
	var riskStats RiskStats
	s.db.Model(&DecisionTimeline{}).
		Select("AVG(risk_score) as avg_risk, MAX(risk_score) as max_risk").
		Where("timestamp >= ? AND timestamp <= ?", start, end).
		Find(&riskStats)
	metrics.AvgRiskScore = riskStats.AvgRisk
	metrics.MaxRiskScore = riskStats.MaxRisk

	// Divergências
	s.db.Model(&DecisionTimeline{}).
		Where("timestamp >= ? AND timestamp <= ? AND has_divergence = ?", start, end, true).
		Count(&metrics.DivergenceCount)
	if metrics.TotalDecisions > 0 {
		metrics.DivergenceRate = float64(metrics.DivergenceCount) / float64(metrics.TotalDecisions) * 100
	}

	// Conflitos
	s.db.Table("decision_conflicts").
		Where("created_at >= ? AND created_at <= ?", start, end).
		Count(&metrics.ConflictsDetected)
	s.db.Table("decision_conflicts").
		Where("created_at >= ? AND created_at <= ? AND status = ?", start, end, "resolved").
		Count(&metrics.ConflictsResolved)

	// Kill switch events
	s.db.Table("audit_events").
		Where("timestamp >= ? AND timestamp <= ? AND event_type = ?", start, end, "killswitch_activated").
		Count(&metrics.KillSwitchEvents)

	// Apps únicos
	s.db.Model(&DecisionTimeline{}).
		Where("timestamp >= ? AND timestamp <= ? AND app_id IS NOT NULL", start, end).
		Distinct("app_id").
		Count(&metrics.UniqueApps)

	// Apps em risco
	s.db.Model(&DecisionTimeline{}).
		Where("timestamp >= ? AND timestamp <= ? AND risk_score >= ? AND app_id IS NOT NULL", start, end, 0.6).
		Distinct("app_id").
		Count(&metrics.AppsAtRisk)

	return metrics, nil
}

func (s *BusinessExplainabilityService) comparePeriods(previous, current *PeriodMetrics) *PeriodComparison {
	comparison := &PeriodComparison{}

	// Calcular mudanças percentuais
	if previous.TotalDecisions > 0 {
		comparison.DecisionsChange = (float64(current.TotalDecisions) - float64(previous.TotalDecisions)) / float64(previous.TotalDecisions) * 100
	}
	comparison.ApprovalRateChange = current.ApprovalRate - previous.ApprovalRate
	comparison.RiskScoreChange = current.AvgRiskScore - previous.AvgRiskScore
	comparison.DivergenceChange = current.DivergenceRate - previous.DivergenceRate

	// Determinar tendência
	positiveSignals := 0
	negativeSignals := 0

	if comparison.ApprovalRateChange > 5 {
		positiveSignals++
	} else if comparison.ApprovalRateChange < -5 {
		negativeSignals++
	}

	if comparison.RiskScoreChange < -0.05 {
		positiveSignals++
	} else if comparison.RiskScoreChange > 0.05 {
		negativeSignals++
	}

	if comparison.DivergenceChange < -5 {
		positiveSignals++
	} else if comparison.DivergenceChange > 5 {
		negativeSignals++
	}

	if positiveSignals > negativeSignals {
		comparison.Trend = "improving"
		comparison.TrendExplanation = "Métricas mostram melhoria em relação ao período anterior."
	} else if negativeSignals > positiveSignals {
		comparison.Trend = "degrading"
		comparison.TrendExplanation = "Métricas mostram degradação em relação ao período anterior."
	} else {
		comparison.Trend = "stable"
		comparison.TrendExplanation = "Métricas estáveis em relação ao período anterior."
	}

	return comparison
}


func (s *BusinessExplainabilityService) generatePeriodSummary(report *PeriodReport) string {
	m := report.KeyMetrics

	var quality string
	if m.ApprovalRate >= 80 && m.DivergenceRate < 15 && m.AppsAtRisk == 0 {
		quality = NarrativeTemplates.PeriodGood
	} else if m.ApprovalRate >= 60 && m.DivergenceRate < 30 && m.AppsAtRisk <= 2 {
		quality = NarrativeTemplates.PeriodCaution
	} else {
		quality = NarrativeTemplates.PeriodConcern
	}

	summary := fmt.Sprintf(
		"No período de %s a %s, o sistema processou %d decisões. "+
			"Taxa de aprovação: %.0f%%. Taxa de negação: %.0f%%. "+
			"%d apps únicos operaram, sendo %d em situação de risco. %s",
		report.PeriodStart.Format("02/01"),
		report.PeriodEnd.Format("02/01"),
		m.TotalDecisions,
		m.ApprovalRate,
		m.DenialRate,
		m.UniqueApps,
		m.AppsAtRisk,
		quality,
	)

	if report.Comparison != nil {
		summary += fmt.Sprintf(" Tendência: %s.", report.Comparison.TrendExplanation)
	}

	return summary
}

func (s *BusinessExplainabilityService) generateHighlights(m *PeriodMetrics) []string {
	highlights := []string{}

	if m.ApprovalRate >= 90 {
		highlights = append(highlights, fmt.Sprintf("Alta taxa de aprovação (%.0f%%) indica operação saudável", m.ApprovalRate))
	}

	if m.DivergenceRate < 5 {
		highlights = append(highlights, "Baixa divergência entre políticas e thresholds - boa calibração")
	}

	if m.ConflictsDetected > 0 && m.ConflictsResolved == m.ConflictsDetected {
		highlights = append(highlights, "Todos os conflitos detectados foram resolvidos")
	}

	if m.KillSwitchEvents == 0 {
		highlights = append(highlights, "Nenhum evento de emergência (kill switch) no período")
	}

	if m.AppsAtRisk == 0 {
		highlights = append(highlights, "Nenhum app em situação de risco")
	}

	if len(highlights) == 0 {
		highlights = append(highlights, "Operação dentro dos parâmetros esperados")
	}

	return highlights
}

func (s *BusinessExplainabilityService) generateConcerns(m *PeriodMetrics) []string {
	concerns := []string{}

	if m.DenialRate > 30 {
		concerns = append(concerns, fmt.Sprintf("Taxa de negação elevada (%.0f%%) - investigar causa", m.DenialRate))
	}

	if m.DivergenceRate > 20 {
		concerns = append(concerns, fmt.Sprintf("Alta divergência (%.0f%%) entre políticas e thresholds", m.DivergenceRate))
	}

	if m.AppsAtRisk > 0 {
		concerns = append(concerns, fmt.Sprintf("%d app(s) em situação de risco requerem atenção", m.AppsAtRisk))
	}

	if m.KillSwitchEvents > 0 {
		concerns = append(concerns, fmt.Sprintf("%d evento(s) de emergência no período", m.KillSwitchEvents))
	}

	if m.ConflictsDetected > m.ConflictsResolved {
		open := m.ConflictsDetected - m.ConflictsResolved
		concerns = append(concerns, fmt.Sprintf("%d conflito(s) ainda não resolvido(s)", open))
	}

	if m.AvgRiskScore > 0.5 {
		concerns = append(concerns, fmt.Sprintf("Score de risco médio elevado (%.0f%%)", m.AvgRiskScore*100))
	}

	return concerns
}

func (s *BusinessExplainabilityService) generatePeriodRecommendations(report *PeriodReport) []string {
	recommendations := []string{}
	m := report.KeyMetrics

	// Baseado em preocupações
	if m.DenialRate > 30 {
		recommendations = append(recommendations, "Revisar políticas que estão gerando muitas negações")
	}

	if m.DivergenceRate > 20 {
		recommendations = append(recommendations, "Calibrar thresholds para alinhar com políticas")
	}

	if m.AppsAtRisk > 0 {
		recommendations = append(recommendations, "Priorizar revisão dos apps em situação de risco")
	}

	if m.ConflictsDetected > m.ConflictsResolved {
		recommendations = append(recommendations, "Resolver conflitos pendentes antes de novas operações")
	}

	// Baseado em comparação
	if report.Comparison != nil && report.Comparison.Trend == "degrading" {
		recommendations = append(recommendations, "Investigar causa da degradação das métricas")
	}

	// Recomendação positiva se tudo ok
	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Manter monitoramento regular - sistema operando bem")
	}

	return recommendations
}
