package observer

import (
	"errors"
	"runtime"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/internal/observability"
)

// ========================================
// HUMAN DECISION SERVICE - Fase 25
// "Registrar decisões humanas sobre sugestões"
// ========================================

// HumanDecisionService gerencia decisões humanas
type HumanDecisionService struct {
	db            *gorm.DB
	memoryService *AgentMemoryService
}

// NewHumanDecisionService cria o serviço
func NewHumanDecisionService(db *gorm.DB, memoryService *AgentMemoryService) *HumanDecisionService {
	return &HumanDecisionService{
		db:            db,
		memoryService: memoryService,
	}
}

// ========================================
// RECORD DECISION
// ========================================

// RecordDecision registra uma decisão humana
func (s *HumanDecisionService) RecordDecision(suggestionID uuid.UUID, decision DecisionType, reason, human, ip, userAgent string) (*HumanDecision, error) {
	// Validar decision type
	if decision != DecisionIgnored && decision != DecisionAccepted && decision != DecisionDeferred {
		return nil, errors.New("decision deve ser: ignored, accepted ou deferred")
	}

	// Validar reason (mínimo 3 caracteres)
	if len(reason) < 3 {
		return nil, errors.New("reason deve ter pelo menos 3 caracteres")
	}

	// Validar human
	if len(human) < 2 {
		return nil, errors.New("human deve ter pelo menos 2 caracteres")
	}

	// Verificar se sugestão existe
	var suggestion AgentMemoryEntry
	if err := s.db.Where("id = ?", suggestionID).First(&suggestion).Error; err != nil {
		return nil, errors.New("sugestão não encontrada")
	}

	// Criar decisão
	humanDecision := &HumanDecision{
		ID:           uuid.New(),
		SuggestionID: suggestionID,
		Decision:     decision,
		Reason:       reason,
		Human:        human,
		IP:           ip,
		UserAgent:    userAgent,
		CreatedAt:    time.Now(),
	}

	if err := s.db.Create(humanDecision).Error; err != nil {
		return nil, err
	}

	return humanDecision, nil
}

// ========================================
// READ DECISIONS
// ========================================

// GetDecisions lista decisões
func (s *HumanDecisionService) GetDecisions(limit int) ([]HumanDecision, error) {
	var decisions []HumanDecision
	
	if limit <= 0 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000
	}

	err := s.db.Order("created_at DESC").Limit(limit).Find(&decisions).Error
	return decisions, err
}

// GetDecisionsBySuggestion lista decisões de uma sugestão
func (s *HumanDecisionService) GetDecisionsBySuggestion(suggestionID uuid.UUID) ([]HumanDecision, error) {
	var decisions []HumanDecision
	err := s.db.Where("suggestion_id = ?", suggestionID).Order("created_at DESC").Find(&decisions).Error
	return decisions, err
}

// GetDecisionsByHuman lista decisões de um humano
func (s *HumanDecisionService) GetDecisionsByHuman(human string, limit int) ([]HumanDecision, error) {
	var decisions []HumanDecision
	
	if limit <= 0 {
		limit = 100
	}

	err := s.db.Where("human = ?", human).Order("created_at DESC").Limit(limit).Find(&decisions).Error
	return decisions, err
}

// ========================================
// STATS
// ========================================

// GetDecisionStats retorna estatísticas
func (s *HumanDecisionService) GetDecisionStats() (*DecisionStats, error) {
	stats := &DecisionStats{
		ByType:  make(map[string]int64),
		ByHuman: make(map[string]int64),
	}

	// Total
	s.db.Model(&HumanDecision{}).Count(&stats.TotalDecisions)

	// Por tipo
	type TypeCount struct {
		Decision string
		Count    int64
	}
	var typeCounts []TypeCount
	s.db.Model(&HumanDecision{}).
		Select("decision, count(*) as count").
		Group("decision").
		Scan(&typeCounts)
	for _, tc := range typeCounts {
		stats.ByType[tc.Decision] = tc.Count
	}

	// Por humano
	type HumanCount struct {
		Human string
		Count int64
	}
	var humanCounts []HumanCount
	s.db.Model(&HumanDecision{}).
		Select("human, count(*) as count").
		Group("human").
		Order("count DESC").
		Limit(10).
		Scan(&humanCounts)
	for _, hc := range humanCounts {
		stats.ByHuman[hc.Human] = hc.Count
	}

	// Últimas 24h
	yesterday := time.Now().Add(-24 * time.Hour)
	s.db.Model(&HumanDecision{}).Where("created_at >= ?", yesterday).Count(&stats.Last24h)

	// Últimos 7 dias
	lastWeek := time.Now().Add(-7 * 24 * time.Hour)
	s.db.Model(&HumanDecision{}).Where("created_at >= ?", lastWeek).Count(&stats.Last7d)

	return stats, nil
}

// ========================================
// CONSOLE DASHBOARD
// ========================================

// GetDashboard retorna dados do console
func (s *HumanDecisionService) GetDashboard() (*ConsoleDashboard, error) {
	dashboard := &ConsoleDashboard{
		DecisionsByType: make(map[string]int64),
	}

	// Sugestões recentes (últimas 24h)
	suggestions, _ := s.memoryService.GetRecentMemory("24h", 20)
	dashboard.RecentSuggestions = suggestions

	// Total de sugestões
	memStats, _ := s.memoryService.GetStats()
	if memStats != nil {
		dashboard.TotalSuggestions = memStats.TotalEntries
		dashboard.AvgConfidence = memStats.AvgConfidence
	}

	// Decisões
	decisionStats, _ := s.GetDecisionStats()
	if decisionStats != nil {
		dashboard.TotalDecisions = decisionStats.TotalDecisions
		dashboard.DecisionsByType = decisionStats.ByType
	}

	// Sugestões pendentes (sem decisão)
	dashboard.PendingSuggestions = s.countPendingSuggestions()

	// Tendências
	dashboard.Trends = s.calculateTrends()

	// Kill switches (simplificado - sem acesso direto ao killswitch service)
	dashboard.ActiveKillSwitches = []KillSwitchInfo{}

	// Saúde do sistema
	dashboard.SystemHealth = s.getSystemHealth()

	return dashboard, nil
}

// countPendingSuggestions conta sugestões sem decisão
func (s *HumanDecisionService) countPendingSuggestions() int64 {
	var total int64
	s.db.Model(&AgentMemoryEntry{}).Count(&total)

	var decided int64
	s.db.Model(&HumanDecision{}).
		Select("COUNT(DISTINCT suggestion_id)").
		Scan(&decided)

	return total - decided
}

// calculateTrends calcula tendências
func (s *HumanDecisionService) calculateTrends() ConsoleTrends {
	trends := ConsoleTrends{
		ErrorsTrend:      "stable",
		SuggestionsTrend: "stable",
		HealthTrend:      "stable",
	}

	// Comparar sugestões últimas 12h vs 12h anteriores
	now := time.Now()
	last12h := now.Add(-12 * time.Hour)
	prev12h := now.Add(-24 * time.Hour)

	var recentCount, prevCount int64
	s.db.Model(&AgentMemoryEntry{}).Where("created_at >= ?", last12h).Count(&recentCount)
	s.db.Model(&AgentMemoryEntry{}).Where("created_at >= ? AND created_at < ?", prev12h, last12h).Count(&prevCount)

	if recentCount > prevCount*2 {
		trends.SuggestionsTrend = "up"
	} else if recentCount < prevCount/2 {
		trends.SuggestionsTrend = "down"
	}

	// Erros (baseado em métricas de observability)
	metrics := observability.GetMetrics().Snapshot()
	if metrics.ErrorsTotal > 0 && metrics.RequestsTotal > 0 {
		errorRate := float64(metrics.ErrorsTotal) / float64(metrics.RequestsTotal)
		if errorRate > 0.1 {
			trends.ErrorsTrend = "up"
		} else if errorRate < 0.01 {
			trends.ErrorsTrend = "down"
		}
	}

	return trends
}

// getSystemHealth retorna saúde do sistema
func (s *HumanDecisionService) getSystemHealth() SystemHealthInfo {
	metrics := observability.GetMetrics().Snapshot()
	
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	errorRate := float64(0)
	if metrics.RequestsTotal > 0 {
		errorRate = float64(metrics.ErrorsTotal) / float64(metrics.RequestsTotal)
	}

	status := "ok"
	if errorRate > 0.1 {
		status = "degraded"
	}

	return SystemHealthInfo{
		Status:        status,
		UptimeSeconds: metrics.UptimeSeconds,
		ErrorRate:     errorRate,
		MemoryMB:      memStats.Alloc / 1024 / 1024,
	}
}
