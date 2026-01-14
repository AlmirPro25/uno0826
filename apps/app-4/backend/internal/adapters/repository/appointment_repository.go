package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// AppointmentRepository implementation using GORM.
type AppointmentRepository struct {
	db *gorm.DB
}

// NewAppointmentRepository creates a new repository instance.
func NewAppointmentRepository(db *gorm.DB) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

// Create creates a new appointment in the database within a transaction.
func (repo *AppointmentRepository) Create(ctx context.Context, appointment *domain.Appointment, tx *gorm.DB) error {
	// Use the provided transaction or the main DB connection
	if tx == nil {
		tx = repo.db.WithContext(ctx)
	} else {
		tx = tx.WithContext(ctx)
	}
	return tx.Create(appointment).Error
}

// FindByID retrieves an appointment by its ID.
func (repo *AppointmentRepository) FindByID(ctx context.Context, id int) (*domain.Appointment, error) {
	var appointment domain.Appointment
	result := repo.db.WithContext(ctx).First(&appointment, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &appointment, nil
}

// ListForUser retrieves appointments for either a patient or a doctor.
func (repo *AppointmentRepository) ListForUser(ctx context.Context, userID int, userRole string) ([]domain.Appointment, error) {
	var appointments []domain.Appointment
	query := repo.db.WithContext(ctx).Preload("Patient").Preload("Doctor")

	switch userRole {
	case domain.RolePaciente:
		query = query.Where("patient_id = ?", userID)
	case domain.RoleMedico:
		query = query.Where("doctor_id = ?", userID)
	case domain.RoleAdmin:
		// Admin sees all appointments. No specific filter needed.
	}

	result := query.Order("start_time asc").Find(&appointments)
	return appointments, result.Error
}

// Cancel updates an appointment status to "cancelled" within a transaction.
func (repo *AppointmentRepository) Cancel(ctx context.Context, id int, tx *gorm.DB) error {
	// Use the provided transaction or the main DB connection
	if tx == nil {
		tx = repo.db.WithContext(ctx)
	} else {
		tx = tx.WithContext(ctx)
	}
	return tx.Model(&domain.Appointment{}).Where("id = ?", id).Update("status", domain.StatusCancelled).Error
}

// CheckSlotAvailability checks if a time slot is available for a doctor.
// It searches for any existing appointment that overlaps with the requested [startTime, endTime] range.
func (repo *AppointmentRepository) CheckSlotAvailability(ctx context.Context, doctorID int, startTime, endTime time.Time, tx *gorm.DB) (bool, error) {
	// Use the provided transaction or the main DB connection
	if tx == nil {
		tx = repo.db.WithContext(ctx)
	} else {
		tx = tx.WithContext(ctx)
	}

	var count int64
	// SQL query to check for overlaps:
	// Find appointments where:
	// (appointment.start_time < requested_end_time) AND (appointment.end_time > requested_start_time)
	// AND status != cancelled
	query := `
		SELECT count(*) FROM appointments 
		WHERE doctor_id = ? 
		AND status != ? 
		AND start_time < ? 
		AND end_time > ?`

	result := tx.Raw(query, doctorID, domain.StatusCancelled, endTime, startTime).Count(&count)
	if result.Error != nil {
		return false, result.Error
	}

	return count == 0, nil
}

// GetAvailableSlots generates potential slots and checks existing appointments to find available times.
// Note: This implementation assumes fixed-duration slots (e.g., 30 minutes).
// In a real application, doctor availability would be managed by a separate schedule table.
func (repo *AppointmentRepository) GetAvailableSlots(ctx context.Context, doctorID int, date time.Time) ([]domain.Appointment, error) {
	// 1. Define the search window for the given date (start of day to end of day)
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	// 2. Query all existing appointments for the doctor on that day
	var existingAppointments []domain.Appointment
	result := repo.db.WithContext(ctx).Where("doctor_id = ? AND start_time >= ? AND start_time < ? AND status != ?",
		doctorID, startOfDay, endOfDay, domain.StatusCancelled).Order("start_time asc").Find(&existingAppointments)

	if result.Error != nil {
		return nil, result.Error
	}

	return existingAppointments, nil
}

// CheckPatientSlotAvailability checks if a patient already has an appointment at the requested time.
func (repo *AppointmentRepository) CheckPatientSlotAvailability(ctx context.Context, patientID int, startTime, endTime time.Time, tx *gorm.DB) (bool, error) {
	if tx == nil {
		tx = repo.db.WithContext(ctx)
	} else {
		tx = tx.WithContext(ctx)
	}

	var count int64
	query := `
		SELECT count(*) FROM appointments 
		WHERE patient_id = ? 
		AND status != ? 
		AND start_time < ? 
		AND end_time > ?`

	result := tx.Raw(query, patientID, domain.StatusCancelled, endTime, startTime).Count(&count)
	if result.Error != nil {
		return false, result.Error
	}

	return count == 0, nil
}

// Complete updates an appointment status to "completed".
func (repo *AppointmentRepository) Complete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Model(&domain.Appointment{}).Where("id = ?", id).Update("status", domain.StatusCompleted).Error
}
