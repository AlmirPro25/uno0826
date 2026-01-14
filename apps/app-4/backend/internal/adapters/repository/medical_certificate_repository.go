package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

// MedicalCertificateRepository implementation using GORM.
type MedicalCertificateRepository struct {
	db *gorm.DB
}

// NewMedicalCertificateRepository creates a new repository instance.
func NewMedicalCertificateRepository(db *gorm.DB) *MedicalCertificateRepository {
	return &MedicalCertificateRepository{db: db}
}

// Create creates a new medical certificate in the database.
func (repo *MedicalCertificateRepository) Create(ctx context.Context, certificate *domain.MedicalCertificate) error {
	return repo.db.WithContext(ctx).Create(certificate).Error
}

// FindByID retrieves a medical certificate by its ID.
func (repo *MedicalCertificateRepository) FindByID(ctx context.Context, id int) (*domain.MedicalCertificate, error) {
	var certificate domain.MedicalCertificate
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Preload("Doctor").
		Preload("Doctor.Role").
		First(&certificate, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &certificate, nil
}

// ListByPatientID retrieves all medical certificates for a specific patient.
func (repo *MedicalCertificateRepository) ListByPatientID(ctx context.Context, patientID int) ([]domain.MedicalCertificate, error) {
	var certificates []domain.MedicalCertificate
	result := repo.db.WithContext(ctx).
		Preload("Doctor").
		Preload("Doctor.Role").
		Where("patient_id = ?", patientID).
		Order("issued_at desc").
		Find(&certificates)
	if result.Error != nil {
		return nil, result.Error
	}
	return certificates, nil
}

// ListByDoctorID retrieves all medical certificates created by a specific doctor.
func (repo *MedicalCertificateRepository) ListByDoctorID(ctx context.Context, doctorID int) ([]domain.MedicalCertificate, error) {
	var certificates []domain.MedicalCertificate
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Where("doctor_id = ?", doctorID).
		Order("issued_at desc").
		Find(&certificates)
	if result.Error != nil {
		return nil, result.Error
	}
	return certificates, nil
}

// Update updates an existing medical certificate.
func (repo *MedicalCertificateRepository) Update(ctx context.Context, certificate *domain.MedicalCertificate) error {
	return repo.db.WithContext(ctx).Save(certificate).Error
}

// Delete removes a medical certificate from the database.
func (repo *MedicalCertificateRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Delete(&domain.MedicalCertificate{}, id).Error
}
