package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

// MedicalRecordRepository implementation using GORM.
type MedicalRecordRepository struct {
	db *gorm.DB
}

// NewMedicalRecordRepository creates a new repository instance.
func NewMedicalRecordRepository(db *gorm.DB) *MedicalRecordRepository {
	return &MedicalRecordRepository{db: db}
}

// Create creates a new medical record in the database.
func (repo *MedicalRecordRepository) Create(ctx context.Context, record *domain.MedicalRecord) error {
	return repo.db.WithContext(ctx).Create(record).Error
}

// FindByID retrieves a medical record by its ID.
func (repo *MedicalRecordRepository) FindByID(ctx context.Context, id int) (*domain.MedicalRecord, error) {
	var record domain.MedicalRecord
	result := repo.db.WithContext(ctx).Preload("Doctor").Preload("Patient").First(&record, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &record, nil
}

// ListByPatientID retrieves all medical records for a specific patient.
func (repo *MedicalRecordRepository) ListByPatientID(ctx context.Context, patientID int) ([]domain.MedicalRecord, error) {
	var records []domain.MedicalRecord
	result := repo.db.WithContext(ctx).Preload("Doctor").Where("patient_id = ?", patientID).Order("consultation_date desc").Find(&records)
	if result.Error != nil {
		return nil, result.Error
	}
	return records, nil
}

// Update updates an existing medical record.
func (repo *MedicalRecordRepository) Update(ctx context.Context, record *domain.MedicalRecord) error {
	return repo.db.WithContext(ctx).Save(record).Error
}

// Delete removes a medical record by its ID.
func (repo *MedicalRecordRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Delete(&domain.MedicalRecord{}, id).Error
}
