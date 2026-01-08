package explainability

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// INTELLIGENCE SERVICE - FASE 18 STEP 2
// "Mostrar onde o sistema está sob tensão"
// Apenas leitura e agregação - zero decisão nova
// ========================================

type IntelligenceService struct {
	db              *gorm.DB
	timelineService *TimelineService
}

func NewIntelligenceService(db *gorm.DB, timelineService *TimelineService) *IntelligenceService {
	return &IntelligenceService{
		db:              db,
		timelineService: timelineService,
	}
}

// ========================================
// DASHBOARD PRINCIPAL
// ========================================

// GetDashboard gera o dashboard administrativo
func (s *IntelligenceService) GetDashboard(query DashboardQuery) (*AdminDashboard, error) {
	if query.TopN <= 0 {
		query.TopN = 10
	}
	if query.Period == "" {
		query.Period = "last_24h"
	}

	since := time.Now().Add(-query.GetPeriodDuration())

	dashboard := &AdminDashboard{
		GeneratedAt: time.Now(),
		Period:      query.Period,
	}

	// 1. Overview
	overview, err := s.getOverview(since, query.AppID)
	if err != nil {
		return nil, err
	}
	dashboard.Overview = *overview

	// 2. Top Risky Apps
	riskyApps, err := s.getTopRiskyApps(since, query.TopN)
	if err != nil {
		return nil, err
	}
	dashboard.TopRiskyApps = riskyApps

	// 3. Most Triggered Policies
	policies, err := s.getMostTriggeredPolicies(since, query.TopN)
	if err != nil {
		return nil, err
	}
	dashboard.MostTriggeredPolicies = policies

	// 4. Divergence Hotspots
	hotspots, err := s.getDivergenceHotspots(since, query.TopN)
	if err != nil {
		return nil, err
	}
	dashboard.DivergenceHotspots = hotspots

	// 5. Detectar tensões
	tensions := s.detectTensions(dashboard, since)
	dashboard.Tensions = tensions

	return dashboard, nil
}

// ========================================
// OVERVIEW
// ========================================

func (s *IntelligenceService) getOverview(since time.Time, appID *uuid.UUID) (*DashboardOverview, error) {
	overview := &DashboardOverview{}

	db := s.db.Model(&DecisionTimeline{}).Where("timestamp >= ?", since)
	if appID != nil {
		db = db.Where("app_id = ?", appID)
	}

	// Total de decisões
	db.Count(&overview.TotalDecisions)

	// Contagem por outcome
	type OutcomeCount struct {
		Outcome string
		Count   int64
	}
	var outcomes []OutcomeCount
	s.db.Model(&DecisionTimeline{}).
		Select("final_outcome as outcome, count(*) as count").
		Where("timestamp >= ?", since).
		Group("final_outcome").
		Find(&outcomes)

	for _, o := range outcomes {
		switch o.Outcome {
		case "allowed":
			overview.AllowedCount = o.Count
		case "denied":
			overview.DeniedCount = o.Count
		case "pending_approval":
			overview.PendingCount = o.Count
		}
	}

	// Divergências
	s.db.Model(&DecisionTimeline{}).
		Where("timestamp >= ? AND has_divergence = ?", since, true).
		Count(&overview.DivergenceCount)

	if overview.TotalDecisions > 0 {
		overview.DivergenceRate = float64(overview.DivergenceCount) / float64(overview.TotalDecisions) * 100
	}

	// Apps únicos
	s.db.Model(&DecisionTimeline{}).
		Where("timestamp >= ? AND app_id IS NOT NULL", since).
		Distinct("app_id").
		Count(&overview.UniqueApps)

	// Apps em risco (risk_score >= 0.6)
	s.db.Model(&DecisionTimeline{}).
		Where("timestamp >= ? AND risk_score >= ? AND app_id IS NOT NULL", since, 0.6).
		Distinct("app_id").
		Count(&overview.AppsAtRisk)

	return overview, nil
}

// ========================================
// TOP RISKY APPS
// ========================================

func (s *IntelligenceService) getTopRiskyApps(since time.Time, limit int) ([]AppRiskRanking, error) {
	type AppStats struct {
		AppID       string
		AvgRisk     float64
		MaxRisk     float64
		TotalCount  int64
		DeniedCount int64
	}

	var stats []AppStats
	err := s.db.Model(&DecisionTimeline{}).
		Select(`
			app_id,
			AVG(risk_score) as avg_risk,
			MAX(risk_score) as max_risk,
			COUNT(*) as total_count,
			SUM(CASE WHEN final_outcome = 'denied' THEN 1 ELSE 0 END) as denied_count
		`).
		Where("timestamp >= ? AND app_id IS NOT NULL", since).
		Group("app_id").
		Order("avg_risk DESC").
		Limit(limit).
		Find(&stats).Error

	if err != nil {
		return nil, err
	}

	rankings := make([]AppRiskRanking, 0, len(stats))
	for i, stat := range stats {
		appID, _ := uuid.Parse(stat.AppID)
		
		denialRate := 0.0
		if stat.TotalCount > 0 {
			denialRate = float64(stat.DeniedCount) / float64(stat.TotalCount) * 100
		}

		ranking := AppRiskRanking{
			Rank:        i + 1,
			AppID:       appID,
			RiskScore:   stat.AvgRisk,
			RiskLevel:   scoreToLevel(stat.AvgRisk),
			Trend:       "stable", // TODO: calcular tendência real
			Decisions24h: stat.TotalCount,
			DenialRate:  denialRate,
		}
		rankings = append(rankings, ranking)
	}

	return rankings, nil
}

// ========================================
// MOST TRIGGERED POLICIES
// ========================================

func (s *IntelligenceService) getMostTriggeredPolicies(since time.Time, limit int) ([]PolicyTriggerRanking, error) {
	type PolicyStats struct {
		PolicyID     string
		PolicyName   string
		TotalCount   int64
		DenyCount    int64
		AllowCount   int64
		PendingCount int64
	}

	var stats []PolicyStats
	err := s.db.Model(&DecisionTimeline{}).
		Select(`
			policy_id,
			policy_name,
			COUNT(*) as total_count,
			SUM(CASE WHEN policy_result = 'denied' THEN 1 ELSE 0 END) as deny_count,
			SUM(CASE WHEN policy_result = 'allowed' THEN 1 ELSE 0 END) as allow_count,
			SUM(CASE WHEN policy_result = 'pending_approval' THEN 1 ELSE 0 END) as pending_count
		`).
		Where("timestamp >= ? AND policy_id IS NOT NULL", since).
		Group("policy_id, policy_name").
		Order("total_count DESC").
		Limit(limit).
		Find(&stats).Error

	if err != nil {
		return nil, err
	}

	rankings := make([]PolicyTriggerRanking, 0, len(stats))
	for i, stat := range stats {
		policyID, _ := uuid.Parse(stat.PolicyID)
		
		denyRate := 0.0
		if stat.TotalCount > 0 {
			denyRate = float64(stat.DenyCount) / float64(stat.TotalCount) * 100
		}

		ranking := PolicyTriggerRanking{
			Rank:         i + 1,
			PolicyID:     policyID,
			PolicyName:   stat.PolicyName,
			TriggerCount: stat.TotalCount,
			DenyCount:    stat.DenyCount,
			AllowCount:   stat.AllowCount,
			PendingCount: stat.PendingCount,
			DenyRate:     denyRate,
		}
		rankings = append(rankings, ranking)
	}

	return rankings, nil
}

// ========================================
// DIVERGENCE HOTSPOTS
// ========================================

func (s *IntelligenceService) getDivergenceHotspots(since time.Time, limit int) ([]DivergenceHotspot, error) {
	type DivergenceStats struct {
		PolicyID        string
		PolicyName      string
		PolicyResult    string
		ThresholdAction string
		Count           int64
		LastOccurrence  string // SQLite retorna como string
	}

	var stats []DivergenceStats
	err := s.db.Model(&DecisionTimeline{}).
		Select(`
			policy_id,
			policy_name,
			policy_result,
			threshold_action,
			COUNT(*) as count,
			MAX(timestamp) as last_occurrence
		`).
		Where("timestamp >= ? AND has_divergence = ? AND policy_id IS NOT NULL", since, true).
		Group("policy_id, policy_name, policy_result, threshold_action").
		Order("count DESC").
		Limit(limit).
		Find(&stats).Error

	if err != nil {
		return nil, err
	}

	hotspots := make([]DivergenceHotspot, 0, len(stats))
	for _, stat := range stats {
		policyID, _ := uuid.Parse(stat.PolicyID)
		
		// Parse time from string
		lastOccurrence, _ := time.Parse(time.RFC3339Nano, stat.LastOccurrence)
		if lastOccurrence.IsZero() {
			lastOccurrence, _ = time.Parse("2006-01-02 15:04:05.999999999-07:00", stat.LastOccurrence)
		}
		
		hotspot := DivergenceHotspot{
			PolicyID:        policyID,
			PolicyName:      stat.PolicyName,
			PolicyResult:    stat.PolicyResult,
			ThresholdAction: stat.ThresholdAction,
			Count:           stat.Count,
			LastOccurrence:  lastOccurrence,
		}
		hotspots = append(hotspots, hotspot)
	}

	return hotspots, nil
}

// ========================================
// DETECÇÃO DE TENSÕES
// ========================================

func (s *IntelligenceService) detectTensions(dashboard *AdminDashboard, since time.Time) []TensionPoint {
	tensions := []TensionPoint{}
	now := time.Now()

	// 1. Alta taxa de divergência (> 20%)
	if dashboard.Overview.DivergenceRate > 20 {
		severity := SeverityWarning
		if dashboard.Overview.DivergenceRate > 40 {
			severity = SeverityCritical
		}
		tensions = append(tensions, TensionPoint{
			Type:        TensionDivergenceCluster,
			Severity:    severity,
			Title:       "Alta taxa de divergência",
			Description: fmt.Sprintf("%.1f%% das decisões têm divergência entre policy e threshold", dashboard.Overview.DivergenceRate),
			Metric:      dashboard.Overview.DivergenceRate,
			Threshold:   20,
			DetectedAt:  now,
		})
	}

	// 2. Apps com risco alto
	for _, app := range dashboard.TopRiskyApps {
		if app.RiskScore >= 0.7 {
			severity := SeverityWarning
			if app.RiskScore >= 0.85 {
				severity = SeverityCritical
			}
			appID := app.AppID
			tensions = append(tensions, TensionPoint{
				Type:        TensionRiskSpike,
				Severity:    severity,
				Title:       fmt.Sprintf("App com risco %s", app.RiskLevel),
				Description: fmt.Sprintf("App %s tem score de risco %.0f%%", app.AppID.String()[:8], app.RiskScore*100),
				AppID:       &appID,
				Metric:      app.RiskScore,
				Threshold:   0.7,
				DetectedAt:  now,
			})
		}
	}

	// 3. Apps com alta taxa de negação (> 50%)
	for _, app := range dashboard.TopRiskyApps {
		if app.DenialRate > 50 && app.Decisions24h >= 5 {
			severity := SeverityWarning
			if app.DenialRate > 80 {
				severity = SeverityCritical
			}
			appID := app.AppID
			tensions = append(tensions, TensionPoint{
				Type:        TensionHighDenialRate,
				Severity:    severity,
				Title:       "Alta taxa de negação",
				Description: fmt.Sprintf("App %s tem %.0f%% de negações (%d decisões)", app.AppID.String()[:8], app.DenialRate, app.Decisions24h),
				AppID:       &appID,
				Metric:      app.DenialRate,
				Threshold:   50,
				DetectedAt:  now,
			})
		}
	}

	// 4. Policies com muitas negações (> 70%)
	for _, policy := range dashboard.MostTriggeredPolicies {
		if policy.DenyRate > 70 && policy.TriggerCount >= 10 {
			severity := SeverityInfo
			if policy.DenyRate > 90 {
				severity = SeverityWarning
			}
			policyID := policy.PolicyID
			tensions = append(tensions, TensionPoint{
				Type:        TensionPolicyOverload,
				Severity:    severity,
				Title:       "Policy com alta taxa de negação",
				Description: fmt.Sprintf("Policy '%s' negou %.0f%% das %d avaliações", policy.PolicyName, policy.DenyRate, policy.TriggerCount),
				PolicyID:    &policyID,
				Metric:      policy.DenyRate,
				Threshold:   70,
				DetectedAt:  now,
			})
		}
	}

	return tensions
}

// ========================================
// QUERIES ESPECÍFICAS
// ========================================

// GetAppIntelligence retorna inteligência específica de um app
func (s *IntelligenceService) GetAppIntelligence(appID uuid.UUID, period string) (*AppIntelligence, error) {
	duration := DashboardQuery{Period: period}.GetPeriodDuration()
	since := time.Now().Add(-duration)

	intel := &AppIntelligence{
		AppID:       appID,
		Period:      period,
		GeneratedAt: time.Now(),
	}

	// Estatísticas do app
	type AppStats struct {
		TotalCount   int64
		DeniedCount  int64
		AllowedCount int64
		PendingCount int64
		AvgRisk      float64
		MaxRisk      float64
		Divergences  int64
	}

	var stats AppStats
	s.db.Model(&DecisionTimeline{}).
		Select(`
			COUNT(*) as total_count,
			SUM(CASE WHEN final_outcome = 'denied' THEN 1 ELSE 0 END) as denied_count,
			SUM(CASE WHEN final_outcome = 'allowed' THEN 1 ELSE 0 END) as allowed_count,
			SUM(CASE WHEN final_outcome = 'pending_approval' THEN 1 ELSE 0 END) as pending_count,
			AVG(risk_score) as avg_risk,
			MAX(risk_score) as max_risk,
			SUM(CASE WHEN has_divergence = 1 THEN 1 ELSE 0 END) as divergences
		`).
		Where("timestamp >= ? AND app_id = ?", since, appID).
		Find(&stats)

	intel.TotalDecisions = stats.TotalCount
	intel.DeniedCount = stats.DeniedCount
	intel.AllowedCount = stats.AllowedCount
	intel.PendingCount = stats.PendingCount
	intel.AvgRiskScore = stats.AvgRisk
	intel.MaxRiskScore = stats.MaxRisk
	intel.DivergenceCount = stats.Divergences

	if stats.TotalCount > 0 {
		intel.DenialRate = float64(stats.DeniedCount) / float64(stats.TotalCount) * 100
		intel.DivergenceRate = float64(stats.Divergences) / float64(stats.TotalCount) * 100
	}

	intel.RiskLevel = scoreToLevel(stats.AvgRisk)

	// Últimas decisões
	var recentDecisions []DecisionTimeline
	s.db.Where("app_id = ?", appID).
		Order("timestamp DESC").
		Limit(10).
		Find(&recentDecisions)
	intel.RecentDecisions = recentDecisions

	return intel, nil
}

// AppIntelligence inteligência específica de um app
type AppIntelligence struct {
	AppID           uuid.UUID          `json:"app_id"`
	Period          string             `json:"period"`
	GeneratedAt     time.Time          `json:"generated_at"`
	TotalDecisions  int64              `json:"total_decisions"`
	DeniedCount     int64              `json:"denied_count"`
	AllowedCount    int64              `json:"allowed_count"`
	PendingCount    int64              `json:"pending_count"`
	DenialRate      float64            `json:"denial_rate"`
	AvgRiskScore    float64            `json:"avg_risk_score"`
	MaxRiskScore    float64            `json:"max_risk_score"`
	RiskLevel       string             `json:"risk_level"`
	DivergenceCount int64              `json:"divergence_count"`
	DivergenceRate  float64            `json:"divergence_rate"`
	RecentDecisions []DecisionTimeline `json:"recent_decisions"`
}

// ========================================
// HELPERS
// ========================================

func scoreToLevel(score float64) string {
	switch {
	case score >= 0.8:
		return "critical"
	case score >= 0.6:
		return "high"
	case score >= 0.3:
		return "medium"
	default:
		return "low"
	}
}
