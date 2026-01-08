package explainability

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// TIMELINE SERVICE - FASE 18 STEP 1
// "Registrar fatos estruturados, não julgar"
// ========================================

type TimelineService struct {
	db *gorm.DB
}

func NewTimelineService(db *gorm.DB) *TimelineService {
	return &TimelineService{db: db}
}

// ========================================
// REGISTRO DE TIMELINE
// ========================================

// RecordTimeline registra uma decisão na timeline
// Esta é a função principal - chamada após cada decisão
func (s *TimelineService) RecordTimeline(entry *DecisionTimeline) error {
	if entry.ID == uuid.Nil {
		entry.ID = uuid.New()
	}
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now()
	}
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now()
	}

	// Detectar divergência entre policy e threshold
	entry.HasDivergence = s.detectDivergence(entry)
	if entry.HasDivergence {
		entry.DivergenceNote = s.generateDivergenceNote(entry)
	}

	return s.db.Create(entry).Error
}

// detectDivergence verifica se policy e threshold divergem
func (s *TimelineService) detectDivergence(entry *DecisionTimeline) bool {
	if entry.ThresholdAction == "" {
		return false // Sem threshold = sem divergência
	}

	// Mapear resultado da policy para ação comparável
	policyAction := s.policyResultToAction(entry.PolicyResult)
	
	return policyAction != entry.ThresholdAction
}

// policyResultToAction converte resultado de policy para ação comparável
func (s *TimelineService) policyResultToAction(result string) string {
	switch result {
	case "allowed":
		return "allow"
	case "denied":
		return "block"
	case "pending_approval":
		return "require_approval"
	default:
		return result
	}
}

// generateDivergenceNote gera nota explicando a divergência
func (s *TimelineService) generateDivergenceNote(entry *DecisionTimeline) string {
	return fmt.Sprintf(
		"Policy decidiu '%s', threshold recomendou '%s'",
		entry.PolicyResult,
		entry.ThresholdAction,
	)
}

// ========================================
// CONSULTAS
// ========================================

// GetByDecisionID busca timeline por ID da decisão
func (s *TimelineService) GetByDecisionID(decisionID uuid.UUID) (*DecisionTimeline, error) {
	var timeline DecisionTimeline
	err := s.db.Where("decision_id = ?", decisionID).First(&timeline).Error
	if err != nil {
		return nil, err
	}
	return &timeline, nil
}

// GetByID busca timeline por ID próprio
func (s *TimelineService) GetByID(id uuid.UUID) (*DecisionTimeline, error) {
	var timeline DecisionTimeline
	err := s.db.Where("id = ?", id).First(&timeline).Error
	if err != nil {
		return nil, err
	}
	return &timeline, nil
}

// ListByApp lista timelines de um app
func (s *TimelineService) ListByApp(appID uuid.UUID, limit int) ([]DecisionTimeline, error) {
	if limit <= 0 {
		limit = 50
	}
	
	var timelines []DecisionTimeline
	err := s.db.Where("app_id = ?", appID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&timelines).Error
	
	return timelines, err
}

// ListByActor lista timelines de um ator
func (s *TimelineService) ListByActor(actorID uuid.UUID, limit int) ([]DecisionTimeline, error) {
	if limit <= 0 {
		limit = 50
	}
	
	var timelines []DecisionTimeline
	err := s.db.Where("actor_id = ?", actorID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&timelines).Error
	
	return timelines, err
}

// ListDivergent lista decisões com divergência policy/threshold
func (s *TimelineService) ListDivergent(limit int) ([]DecisionTimeline, error) {
	if limit <= 0 {
		limit = 50
	}
	
	var timelines []DecisionTimeline
	err := s.db.Where("has_divergence = ?", true).
		Order("timestamp DESC").
		Limit(limit).
		Find(&timelines).Error
	
	return timelines, err
}

// Search busca timelines com filtros
func (s *TimelineService) Search(query TimelineQuery) (*TimelineListResponse, error) {
	if query.Limit <= 0 {
		query.Limit = 50
	}
	if query.Limit > 100 {
		query.Limit = 100
	}

	db := s.db.Model(&DecisionTimeline{})

	// Aplicar filtros
	if query.AppID != nil {
		db = db.Where("app_id = ?", query.AppID)
	}
	if query.ActorID != nil {
		db = db.Where("actor_id = ?", query.ActorID)
	}
	if query.DecisionType != "" {
		db = db.Where("decision_type = ?", query.DecisionType)
	}
	if query.Outcome != "" {
		db = db.Where("final_outcome = ?", query.Outcome)
	}
	if query.OnlyDivergent {
		db = db.Where("has_divergence = ?", true)
	}
	if query.StartDate != nil {
		db = db.Where("timestamp >= ?", query.StartDate)
	}
	if query.EndDate != nil {
		db = db.Where("timestamp <= ?", query.EndDate)
	}

	// Contar total
	var total int64
	db.Count(&total)

	// Buscar resultados
	var timelines []DecisionTimeline
	err := db.Order("timestamp DESC").
		Offset(query.Offset).
		Limit(query.Limit).
		Find(&timelines).Error

	if err != nil {
		return nil, err
	}

	return &TimelineListResponse{
		Timelines: timelines,
		Total:     total,
		Query:     query,
	}, nil
}

// ========================================
// ESTATÍSTICAS (para Admin Intelligence - Step 2)
// ========================================

// CountByOutcome conta decisões por resultado
func (s *TimelineService) CountByOutcome(appID *uuid.UUID, since time.Time) (map[string]int64, error) {
	type Result struct {
		Outcome string
		Count   int64
	}

	db := s.db.Model(&DecisionTimeline{}).
		Select("final_outcome as outcome, count(*) as count").
		Where("timestamp >= ?", since).
		Group("final_outcome")

	if appID != nil {
		db = db.Where("app_id = ?", appID)
	}

	var results []Result
	if err := db.Find(&results).Error; err != nil {
		return nil, err
	}

	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Outcome] = r.Count
	}
	return counts, nil
}

// CountDivergences conta divergências
func (s *TimelineService) CountDivergences(since time.Time) (int64, error) {
	var count int64
	err := s.db.Model(&DecisionTimeline{}).
		Where("has_divergence = ? AND timestamp >= ?", true, since).
		Count(&count).Error
	return count, err
}
