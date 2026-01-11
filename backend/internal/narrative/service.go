package narrative

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NarrativeService struct {
	db *gorm.DB
}

func NewNarrativeService(db *gorm.DB) *NarrativeService {
	return &NarrativeService{db: db}
}

// Create cria uma nova narrativa
func (s *NarrativeService) Create(narrative FailureNarrative) error {
	return s.db.Create(&narrative).Error
}

// CreateFromTemplate cria narrativa a partir de template
func (s *NarrativeService) CreateFromTemplate(templateName string, appID uuid.UUID, details map[string]string) (*FailureNarrative, error) {
	templateFn, ok := CommonNarratives[templateName]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}

	narrative := templateFn(appID, details)
	if err := s.db.Create(&narrative).Error; err != nil {
		return nil, err
	}

	return &narrative, nil
}

// GetByApp retorna narrativas de um app
func (s *NarrativeService) GetByApp(appID uuid.UUID, limit int) ([]FailureNarrative, error) {
	var narratives []FailureNarrative
	err := s.db.Where("app_id = ?", appID).
		Order("created_at DESC").
		Limit(limit).
		Find(&narratives).Error
	return narratives, err
}

// GetOpen retorna narrativas abertas
func (s *NarrativeService) GetOpen(appID uuid.UUID) ([]FailureNarrative, error) {
	var narratives []FailureNarrative
	err := s.db.Where("app_id = ? AND status = ?", appID, "open").
		Order("created_at DESC").
		Find(&narratives).Error
	return narratives, err
}

// Acknowledge marca como reconhecida
func (s *NarrativeService) Acknowledge(id uuid.UUID) error {
	return s.db.Model(&FailureNarrative{}).
		Where("id = ?", id).
		Update("status", "acknowledged").Error
}

// Resolve marca como resolvida
func (s *NarrativeService) Resolve(id uuid.UUID, resolvedBy uuid.UUID) error {
	now := time.Now()
	return s.db.Model(&FailureNarrative{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":      "resolved",
			"resolved_by": resolvedBy,
			"resolved_at": now,
		}).Error
}

// GetStats retorna estatísticas de narrativas
func (s *NarrativeService) GetStats(appID uuid.UUID) (map[string]int, error) {
	stats := map[string]int{
		"total":        0,
		"open":         0,
		"acknowledged": 0,
		"resolved":     0,
	}

	var results []struct {
		Status string
		Count  int
	}

	err := s.db.Model(&FailureNarrative{}).
		Select("status, count(*) as count").
		Where("app_id = ?", appID).
		Group("status").
		Scan(&results).Error

	if err != nil {
		return stats, err
	}

	for _, r := range results {
		stats[r.Status] = r.Count
		stats["total"] += r.Count
	}

	return stats, nil
}
