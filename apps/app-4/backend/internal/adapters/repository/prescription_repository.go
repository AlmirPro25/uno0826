package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

// PrescriptionRepository implementation using GORM.
type PrescriptionRepository struct {
	db *gorm.DB
}

// NewPrescriptionRepository creates a new repository instance.
func NewPrescriptionRepository(db *gorm.DB) *PrescriptionRepository {
	return &PrescriptionRepository{db: db}
}

// Create creates a new prescription in the database.
func (repo *PrescriptionRepository) Create(ctx context.Context, prescription *domain.Prescription) error {
	return repo.db.WithContext(ctx).Create(prescription).Error
}

// FindByID retrieves a prescription by its ID.
func (repo *PrescriptionRepository) FindByID(ctx context.Context, id int) (*domain.Prescription, error) {
	var prescription domain.Prescription
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Preload("Doctor").
		Preload("Doctor.Role").
		First(&prescription, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &prescription, nil
}

// ListByPatientID retrieves all prescriptions for a specific patient.
func (repo *PrescriptionRepository) ListByPatientID(ctx context.Context, patientID int) ([]domain.Prescription, error) {
	var prescriptions []domain.Prescription
	result := repo.db.WithContext(ctx).
		Preload("Doctor").
		Preload("Doctor.Role").
		Where("patient_id = ?", patientID).
		Order("issued_at desc").
		Find(&prescriptions)
	if result.Error != nil {
		return nil, result.Error
	}
	return prescriptions, nil
}

// ListByDoctorID retrieves all prescriptions created by a specific doctor.
func (repo *PrescriptionRepository) ListByDoctorID(ctx context.Context, doctorID int) ([]domain.Prescription, error) {
	var prescriptions []domain.Prescription
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Where("doctor_id = ?", doctorID).
		Order("issued_at desc").
		Find(&prescriptions)
	if result.Error != nil {
		return nil, result.Error
	}
	return prescriptions, nil
}

// Update updates an existing prescription.
func (repo *PrescriptionRepository) Update(ctx context.Context, prescription *domain.Prescription) error {
	return repo.db.WithContext(ctx).Save(prescription).Error
}

// Delete removes a prescription from the database.
func (repo *PrescriptionRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Delete(&domain.Prescription{}, id).Error
}
