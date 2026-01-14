package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

// TriageReportRepository implementation using GORM
type TriageReportRepository struct {
	db *gorm.DB
}

// NewTriageReportRepository creates a new repository instance
func NewTriageReportRepository(db *gorm.DB) *TriageReportRepository {
	return &TriageReportRepository{db: db}
}

// Create creates a new triage report
func (repo *TriageReportRepository) Create(ctx context.Context, report *domain.TriageReport) error {
	return repo.db.WithContext(ctx).Create(report).Error
}

// FindByID retrieves a triage report by ID
func (repo *TriageReportRepository) FindByID(ctx context.Context, id int) (*domain.TriageReport, error) {
	var report domain.TriageReport
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Doctor").
		Preload("ReviewedBy").
		First(&report, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &report, nil
}

// ListByPatientID retrieves all triage reports for a patient
func (repo *TriageReportRepository) ListByPatientID(ctx context.Context, patientID int) ([]domain.TriageReport, error) {
	var reports []domain.TriageReport
	result := repo.db.WithContext(ctx).
		Preload("Doctor").
		Where("patient_id = ?", patientID).
		Order("created_at DESC").
		Find(&reports)
	return reports, result.Error
}

// ListByDoctorID retrieves all triage reports assigned to a doctor
func (repo *TriageReportRepository) ListByDoctorID(ctx context.Context, doctorID int) ([]domain.TriageReport, error) {
	var reports []domain.TriageReport
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Where("doctor_id = ?", doctorID).
		Order("created_at DESC").
		Find(&reports)
	return reports, result.Error
}

// ListPending retrieves all pending triage reports (for doctors/admins)
func (repo *TriageReportRepository) ListPending(ctx context.Context, specialty string, limit int) ([]domain.TriageReport, error) {
	var reports []domain.TriageReport
	query := repo.db.WithContext(ctx).
		Preload("Patient").
		Where("status = ?", domain.TriageStatusPending)
	
	if specialty != "" {
		query = query.Where("recommended_specialty = ?", specialty)
	}
	
	// Order by priority (emergency first)
	query = query.Order(`
		CASE priority 
			WHEN 'Emergência (Vermelho)' THEN 1
			WHEN 'Muito Urgente (Laranja)' THEN 2
			WHEN 'Urgente (Amarelo)' THEN 3
			WHEN 'Pouco Urgente (Verde)' THEN 4
			WHEN 'Não Urgente (Azul)' THEN 5
			ELSE 6
		END, created_at ASC
	`)
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	
	result := query.Find(&reports)
	return reports, result.Error
}

// ListByStatus retrieves triage reports by status
func (repo *TriageReportRepository) ListByStatus(ctx context.Context, status string, page, pageSize int) ([]domain.TriageReport, int64, error) {
	var reports []domain.TriageReport
	var total int64
	
	query := repo.db.WithContext(ctx).Model(&domain.TriageReport{}).Where("status = ?", status)
	query.Count(&total)
	
	offset := (page - 1) * pageSize
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Doctor").
		Where("status = ?", status).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&reports)
	
	return reports, total, result.Error
}

// Update updates a triage report
func (repo *TriageReportRepository) Update(ctx context.Context, report *domain.TriageReport) error {
	return repo.db.WithContext(ctx).Save(report).Error
}

// UpdateStatus updates only the status of a triage report
func (repo *TriageReportRepository) UpdateStatus(ctx context.Context, id int, status string) error {
	return repo.db.WithContext(ctx).
		Model(&domain.TriageReport{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// AssignDoctor assigns a doctor to a triage report
func (repo *TriageReportRepository) AssignDoctor(ctx context.Context, id int, doctorID int) error {
	return repo.db.WithContext(ctx).
		Model(&domain.TriageReport{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"doctor_id": doctorID,
			"status":    domain.TriageStatusAccepted,
		}).Error
}

// GetStats retrieves triage statistics
func (repo *TriageReportRepository) GetStats(ctx context.Context) (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// Total count
	var total int64
	repo.db.WithContext(ctx).Model(&domain.TriageReport{}).Count(&total)
	stats["total"] = total
	
	// Count by status
	var statusCounts []struct {
		Status string
		Count  int64
	}
	repo.db.WithContext(ctx).
		Model(&domain.TriageReport{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&statusCounts)
	
	statusMap := make(map[string]int64)
	for _, sc := range statusCounts {
		statusMap[sc.Status] = sc.Count
	}
	stats["by_status"] = statusMap
	
	// Count by priority
	var priorityCounts []struct {
		Priority string
		Count    int64
	}
	repo.db.WithContext(ctx).
		Model(&domain.TriageReport{}).
		Select("priority, count(*) as count").
		Group("priority").
		Scan(&priorityCounts)
	
	priorityMap := make(map[string]int64)
	for _, pc := range priorityCounts {
		priorityMap[pc.Priority] = pc.Count
	}
	stats["by_priority"] = priorityMap
	
	// Today's count
	var todayCount int64
	repo.db.WithContext(ctx).
		Model(&domain.TriageReport{}).
		Where("DATE(created_at) = DATE('now')").
		Count(&todayCount)
	stats["today"] = todayCount
	
	return stats, nil
}

// Delete removes a triage report
func (repo *TriageReportRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Delete(&domain.TriageReport{}, id).Error
}
