package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

// RecurringAppointmentRepository implementation using GORM.
type RecurringAppointmentRepository struct {
	db *gorm.DB
}

// NewRecurringAppointmentRepository creates a new repository instance.
func NewRecurringAppointmentRepository(db *gorm.DB) *RecurringAppointmentRepository {
	return &RecurringAppointmentRepository{db: db}
}

// Create creates a new recurring appointment pattern.
func (repo *RecurringAppointmentRepository) Create(ctx context.Context, recurring *domain.RecurringAppointment) error {
	return repo.db.WithContext(ctx).Create(recurring).Error
}

// FindByID retrieves a recurring appointment by its ID.
func (repo *RecurringAppointmentRepository) FindByID(ctx context.Context, id int) (*domain.RecurringAppointment, error) {
	var recurring domain.RecurringAppointment
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Preload("Doctor").
		Preload("Doctor.Role").
		First(&recurring, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &recurring, nil
}

// ListByPatientID retrieves all recurring appointments for a patient.
func (repo *RecurringAppointmentRepository) ListByPatientID(ctx context.Context, patientID int) ([]domain.RecurringAppointment, error) {
	var recurrings []domain.RecurringAppointment
	result := repo.db.WithContext(ctx).
		Preload("Doctor").
		Preload("Doctor.Role").
		Where("patient_id = ? AND is_active = true", patientID).
		Order("created_at desc").
		Find(&recurrings)
	if result.Error != nil {
		return nil, result.Error
	}
	return recurrings, nil
}

// ListByDoctorID retrieves all recurring appointments for a doctor.
func (repo *RecurringAppointmentRepository) ListByDoctorID(ctx context.Context, doctorID int) ([]domain.RecurringAppointment, error) {
	var recurrings []domain.RecurringAppointment
	result := repo.db.WithContext(ctx).
		Preload("Patient").
		Preload("Patient.Role").
		Where("doctor_id = ? AND is_active = true", doctorID).
		Order("created_at desc").
		Find(&recurrings)
	if result.Error != nil {
		return nil, result.Error
	}
	return recurrings, nil
}

// Update updates an existing recurring appointment.
func (repo *RecurringAppointmentRepository) Update(ctx context.Context, recurring *domain.RecurringAppointment) error {
	return repo.db.WithContext(ctx).Save(recurring).Error
}

// Delete removes a recurring appointment (soft delete by setting is_active to false).
func (repo *RecurringAppointmentRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).
		Model(&domain.RecurringAppointment{}).
		Where("id = ?", id).
		Update("is_active", false).Error
}

// HardDelete permanently removes a recurring appointment.
func (repo *RecurringAppointmentRepository) HardDelete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Delete(&domain.RecurringAppointment{}, id).Error
}
