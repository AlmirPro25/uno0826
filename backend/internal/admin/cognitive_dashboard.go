package admin

import (
	"time"

	"gorm.io/gorm"
)

// ========================================
// COGNITIVE DASHBOARD - Fase 26.5
// "Observabilidade total. Zero interferência."
// READ-ONLY: Nenhuma alteração de lógica ou dados
// ========================================

// CognitiveDashboardService fornece visão cognitiva do sistema
type CognitiveDashboardService struct {
	db *gorm.DB
}

// NewCognitiveDashboardService cria o serviço
func NewCognitiveDashboardService(db *gorm.DB) *CognitiveDashboardService {
	return &CognitiveDashboardService{db: db}
}

// ========================================
// RESPONSE TYPES
// ========================================

// CognitiveDashboard KPIs principais do sistema cognitivo
type CognitiveDashboard struct {
	// Contadores gerais
	TotalSuggestions   int64 `json:"total_suggestions"`
	TotalDecisions     int64 `json:"total_decisions"`
	Suggestions24h     int64 `json:"suggestions_24h"`
	Decisions24h       int64 `json:"decisions_24h"`
	PendingSuggestions int64 `json:"pending_suggestions"`

	// Distribuição de decisões
	DecisionDistribution []DecisionCount `json:"decision_distribution"`

	// Tempo médio de decisão
	AvgDecisionTimeHours float64 `json:"avg_decision_time_hours"`

	// Top findings
	TopFindings []FindingCount `json:"top_findings"`

	// Top ignorados (ruído)
	TopIgnored []FindingCount `json:"top_ignored"`

	// Kill switches ativos
	ActiveKillSwitches []KillSwitchStatus `json:"active_kill_switches"`

	// Timestamp
	GeneratedAt time.Time `json:"generated_at"`
}

// DecisionCount contagem por tipo de decisão
type DecisionCount struct {
	Decision   string  `json:"decision"`
	Count      int64   `json:"count"`
	Percentage float64 `json:"percentage"`
}

// FindingCount contagem de findings
type FindingCount struct {
	Finding       string  `json:"finding"`
	Occurrences   int64   `json:"occurrences"`
	AvgConfidence float64 `json:"avg_confidence"`
}

// KillSwitchStatus status de kill switch
type KillSwitchStatus struct {
	Scope       string     `json:"scope"`
	Reason      string     `json:"reason"`
	ActivatedAt time.Time  `json:"activated_at"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

// AgentOverview visão geral dos agentes
type AgentOverview struct {
	Agents      []AgentStatus `json:"agents"`
	TotalAgents int           `json:"total_agents"`
	GeneratedAt time.Time     `json:"generated_at"`
}

// AgentStatus status de um agente
type AgentStatus struct {
	Agent           string  `json:"agent"`
	TotalSuggestions int64   `json:"total_suggestions"`
	Suggestions24h  int64   `json:"suggestions_24h"`
	AcceptedCount   int64   `json:"accepted_count"`
	IgnoredCount    int64   `json:"ignored_count"`
	DeferredCount   int64   `json:"deferred_count"`
	AcceptanceRate  float64 `json:"acceptance_rate"`
	AvgConfidence   float64 `json:"avg_confidence"`
}

// DecisionStatsResponse estatísticas detalhadas de decisões
type DecisionStatsResponse struct {
	TotalDecisions int64           `json:"total_decisions"`
	ByType         []DecisionCount `json:"by_type"`
	ByHuman        []HumanCount    `json:"by_human"`
	Last24h        int64           `json:"last_24h"`
	Last7d         int64           `json:"last_7d"`
	AvgReasonLen   float64         `json:"avg_reason_length"`
	GeneratedAt    time.Time       `json:"generated_at"`
}

// HumanCount contagem por humano
type HumanCount struct {
	Human string `json:"human"`
	Count int64  `json:"count"`
}

// NoisePattern padrão de ruído identificado
type NoisePattern struct {
	Finding      string  `json:"finding"`
	TimesIgnored int64   `json:"times_ignored"`
	IgnoreRate   float64 `json:"ignore_rate"`
}

// NoisePatternsResponse padrões de ruído
type NoisePatternsResponse struct {
	Patterns    []NoisePattern `json:"patterns"`
	TotalNoise  int64          `json:"total_noise"`
	GeneratedAt time.Time      `json:"generated_at"`
}

// TrustDay evolução da confiança por dia
type TrustDay struct {
	Day            string  `json:"day"`
	Accepted       int64   `json:"accepted"`
	Ignored        int64   `json:"ignored"`
	Deferred       int64   `json:"deferred"`
	Total          int64   `json:"total"`
	AcceptanceRate float64 `json:"acceptance_rate"`
	AvgReasonLen   float64 `json:"avg_reason_length"`
}

// TrustEvolutionResponse evolução da confiança
type TrustEvolutionResponse struct {
	Days        []TrustDay `json:"days"`
	TrendStatus string     `json:"trend_status"` // "improving", "stable", "declining"
	GeneratedAt time.Time  `json:"generated_at"`
}



// ========================================
// SERVICE METHODS - READ-ONLY QUERIES
// ========================================

// GetCognitiveDashboard retorna KPIs principais
func (s *CognitiveDashboardService) GetCognitiveDashboard() (*CognitiveDashboard, error) {
	dashboard := &CognitiveDashboard{
		GeneratedAt: time.Now(),
	}

	// Status geral
	s.db.Table("agent_memory").Count(&dashboard.TotalSuggestions)
	s.db.Table("human_decisions").Count(&dashboard.TotalDecisions)

	// Últimas 24h
	yesterday := time.Now().Add(-24 * time.Hour)
	s.db.Table("agent_memory").Where("created_at >= ?", yesterday).Count(&dashboard.Suggestions24h)
	s.db.Table("human_decisions").Where("created_at >= ?", yesterday).Count(&dashboard.Decisions24h)

	// Sugestões pendentes (sem decisão)
	var decidedCount int64
	s.db.Table("human_decisions").Select("COUNT(DISTINCT suggestion_id)").Scan(&decidedCount)
	dashboard.PendingSuggestions = dashboard.TotalSuggestions - decidedCount

	// Distribuição de decisões
	dashboard.DecisionDistribution = s.getDecisionDistribution()

	// Tempo médio de decisão
	dashboard.AvgDecisionTimeHours = s.getAvgDecisionTime()

	// Top findings
	dashboard.TopFindings = s.getTopFindings(5)

	// Top ignorados
	dashboard.TopIgnored = s.getTopIgnored(5)

	// Kill switches ativos
	dashboard.ActiveKillSwitches = s.getActiveKillSwitches()

	return dashboard, nil
}

// getDecisionDistribution retorna distribuição de decisões
func (s *CognitiveDashboardService) getDecisionDistribution() []DecisionCount {
	var results []DecisionCount
	var total int64

	s.db.Table("human_decisions").Count(&total)
	if total == 0 {
		return results
	}

	type rawCount struct {
		Decision string
		Count    int64
	}
	var raw []rawCount

	s.db.Table("human_decisions").
		Select("decision, COUNT(*) as count").
		Group("decision").
		Order("count DESC").
		Scan(&raw)

	for _, r := range raw {
		results = append(results, DecisionCount{
			Decision:   r.Decision,
			Count:      r.Count,
			Percentage: float64(r.Count) * 100.0 / float64(total),
		})
	}

	return results
}

// getAvgDecisionTime retorna tempo médio de decisão em horas
func (s *CognitiveDashboardService) getAvgDecisionTime() float64 {
	var avgHours float64

	// SQLite: usar julianday para calcular diferença
	s.db.Table("human_decisions hd").
		Joins("JOIN agent_memory am ON hd.suggestion_id = am.id").
		Select("AVG((JULIANDAY(hd.created_at) - JULIANDAY(am.created_at)) * 24)").
		Scan(&avgHours)

	return avgHours
}

// getTopFindings retorna top findings
func (s *CognitiveDashboardService) getTopFindings(limit int) []FindingCount {
	var results []FindingCount

	s.db.Table("agent_memory").
		Select("finding, COUNT(*) as occurrences, AVG(confidence) as avg_confidence").
		Group("finding").
		Order("occurrences DESC").
		Limit(limit).
		Scan(&results)

	return results
}

// getTopIgnored retorna findings mais ignorados
func (s *CognitiveDashboardService) getTopIgnored(limit int) []FindingCount {
	var results []FindingCount

	s.db.Table("human_decisions hd").
		Joins("JOIN agent_memory am ON hd.suggestion_id = am.id").
		Where("hd.decision = ?", "ignored").
		Select("am.finding as finding, COUNT(*) as occurrences, AVG(am.confidence) as avg_confidence").
		Group("am.finding").
		Order("occurrences DESC").
		Limit(limit).
		Scan(&results)

	return results
}

// getActiveKillSwitches retorna kill switches ativos
func (s *CognitiveDashboardService) getActiveKillSwitches() []KillSwitchStatus {
	var results []KillSwitchStatus

	s.db.Table("kill_switches").
		Where("active = ?", true).
		Select("scope, reason, activated_at, expires_at").
		Scan(&results)

	return results
}

// GetAgentsOverview retorna visão geral dos agentes
func (s *CognitiveDashboardService) GetAgentsOverview() (*AgentOverview, error) {
	overview := &AgentOverview{
		GeneratedAt: time.Now(),
	}

	// Listar agentes únicos
	var agents []string
	s.db.Table("agent_memory").
		Distinct("agent").
		Pluck("agent", &agents)

	overview.TotalAgents = len(agents)
	yesterday := time.Now().Add(-24 * time.Hour)

	for _, agent := range agents {
		status := AgentStatus{Agent: agent}

		// Total de sugestões
		s.db.Table("agent_memory").
			Where("agent = ?", agent).
			Count(&status.TotalSuggestions)

		// Sugestões 24h
		s.db.Table("agent_memory").
			Where("agent = ? AND created_at >= ?", agent, yesterday).
			Count(&status.Suggestions24h)

		// Confiança média
		s.db.Table("agent_memory").
			Where("agent = ?", agent).
			Select("AVG(confidence)").
			Scan(&status.AvgConfidence)

		// Decisões por tipo para este agente
		s.db.Table("human_decisions hd").
			Joins("JOIN agent_memory am ON hd.suggestion_id = am.id").
			Where("am.agent = ? AND hd.decision = ?", agent, "accepted").
			Count(&status.AcceptedCount)

		s.db.Table("human_decisions hd").
			Joins("JOIN agent_memory am ON hd.suggestion_id = am.id").
			Where("am.agent = ? AND hd.decision = ?", agent, "ignored").
			Count(&status.IgnoredCount)

		s.db.Table("human_decisions hd").
			Joins("JOIN agent_memory am ON hd.suggestion_id = am.id").
			Where("am.agent = ? AND hd.decision = ?", agent, "deferred").
			Count(&status.DeferredCount)

		// Taxa de aceitação
		totalDecisions := status.AcceptedCount + status.IgnoredCount + status.DeferredCount
		if totalDecisions > 0 {
			status.AcceptanceRate = float64(status.AcceptedCount) * 100.0 / float64(totalDecisions)
		}

		overview.Agents = append(overview.Agents, status)
	}

	return overview, nil
}

// GetDecisionStats retorna estatísticas detalhadas de decisões
func (s *CognitiveDashboardService) GetDecisionStats() (*DecisionStatsResponse, error) {
	stats := &DecisionStatsResponse{
		GeneratedAt: time.Now(),
	}

	// Total
	s.db.Table("human_decisions").Count(&stats.TotalDecisions)

	// Por tipo
	stats.ByType = s.getDecisionDistribution()

	// Por humano (top 10)
	s.db.Table("human_decisions").
		Select("human, COUNT(*) as count").
		Group("human").
		Order("count DESC").
		Limit(10).
		Scan(&stats.ByHuman)

	// Últimas 24h e 7d
	yesterday := time.Now().Add(-24 * time.Hour)
	lastWeek := time.Now().Add(-7 * 24 * time.Hour)

	s.db.Table("human_decisions").Where("created_at >= ?", yesterday).Count(&stats.Last24h)
	s.db.Table("human_decisions").Where("created_at >= ?", lastWeek).Count(&stats.Last7d)

	// Tamanho médio do reason
	s.db.Table("human_decisions").
		Select("AVG(LENGTH(reason))").
		Scan(&stats.AvgReasonLen)

	return stats, nil
}

// GetTopFindings retorna top findings com mais detalhes
func (s *CognitiveDashboardService) GetTopFindings(limit int) ([]FindingCount, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	return s.getTopFindings(limit), nil
}

// GetNoisePatterns retorna padrões de ruído
func (s *CognitiveDashboardService) GetNoisePatterns() (*NoisePatternsResponse, error) {
	response := &NoisePatternsResponse{
		GeneratedAt: time.Now(),
	}

	// Findings mais ignorados com taxa de ignore
	type rawPattern struct {
		Finding      string
		TimesIgnored int64
		TotalTimes   int64
	}
	var raw []rawPattern

	// Subquery para contar total de vezes que cada finding apareceu
	s.db.Table("agent_memory am").
		Select(`
			am.finding,
			SUM(CASE WHEN hd.decision = 'ignored' THEN 1 ELSE 0 END) as times_ignored,
			COUNT(hd.id) as total_times
		`).
		Joins("LEFT JOIN human_decisions hd ON am.id = hd.suggestion_id").
		Group("am.finding").
		Having("times_ignored > 0").
		Order("times_ignored DESC").
		Limit(10).
		Scan(&raw)

	for _, r := range raw {
		ignoreRate := float64(0)
		if r.TotalTimes > 0 {
			ignoreRate = float64(r.TimesIgnored) * 100.0 / float64(r.TotalTimes)
		}
		response.Patterns = append(response.Patterns, NoisePattern{
			Finding:      r.Finding,
			TimesIgnored: r.TimesIgnored,
			IgnoreRate:   ignoreRate,
		})
		response.TotalNoise += r.TimesIgnored
	}

	return response, nil
}

// GetTrustEvolution retorna evolução da confiança
func (s *CognitiveDashboardService) GetTrustEvolution(days int) (*TrustEvolutionResponse, error) {
	if days <= 0 {
		days = 30
	}
	if days > 90 {
		days = 90
	}

	response := &TrustEvolutionResponse{
		GeneratedAt: time.Now(),
	}

	// Buscar dados por dia
	type rawDay struct {
		Day          string
		Accepted     int64
		Ignored      int64
		Deferred     int64
		AvgReasonLen float64
	}
	var raw []rawDay

	s.db.Table("human_decisions").
		Select(`
			DATE(created_at) as day,
			SUM(CASE WHEN decision = 'accepted' THEN 1 ELSE 0 END) as accepted,
			SUM(CASE WHEN decision = 'ignored' THEN 1 ELSE 0 END) as ignored,
			SUM(CASE WHEN decision = 'deferred' THEN 1 ELSE 0 END) as deferred,
			AVG(LENGTH(reason)) as avg_reason_len
		`).
		Group("DATE(created_at)").
		Order("day DESC").
		Limit(days).
		Scan(&raw)

	for _, r := range raw {
		total := r.Accepted + r.Ignored + r.Deferred
		acceptanceRate := float64(0)
		if total > 0 {
			acceptanceRate = float64(r.Accepted) * 100.0 / float64(total)
		}

		response.Days = append(response.Days, TrustDay{
			Day:            r.Day,
			Accepted:       r.Accepted,
			Ignored:        r.Ignored,
			Deferred:       r.Deferred,
			Total:          total,
			AcceptanceRate: acceptanceRate,
			AvgReasonLen:   r.AvgReasonLen,
		})
	}

	// Calcular tendência
	response.TrendStatus = s.calculateTrustTrend(response.Days)

	return response, nil
}

// calculateTrustTrend calcula tendência de confiança
func (s *CognitiveDashboardService) calculateTrustTrend(days []TrustDay) string {
	if len(days) < 7 {
		return "insufficient_data"
	}

	// Comparar média dos últimos 7 dias com os 7 anteriores
	var recentSum, prevSum float64
	recentCount := 0
	prevCount := 0

	for i, day := range days {
		if i < 7 {
			recentSum += day.AcceptanceRate
			recentCount++
		} else if i < 14 {
			prevSum += day.AcceptanceRate
			prevCount++
		}
	}

	if recentCount == 0 || prevCount == 0 {
		return "insufficient_data"
	}

	recentAvg := recentSum / float64(recentCount)
	prevAvg := prevSum / float64(prevCount)

	diff := recentAvg - prevAvg
	if diff > 5 {
		return "improving"
	} else if diff < -5 {
		return "declining"
	}
	return "stable"
}
