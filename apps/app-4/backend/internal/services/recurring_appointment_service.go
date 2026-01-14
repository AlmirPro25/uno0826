package services

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"time"
)

// RecurringAppointmentRepository interface for the service.
type RecurringAppointmentRepository interface {
	Create(ctx context.Context, recurring *domain.RecurringAppointment) error
	FindByID(ctx context.Context, id int) (*domain.RecurringAppointment, error)
	ListByPatientID(ctx context.Context, patientID int) ([]domain.RecurringAppointment, error)
	ListByDoctorID(ctx context.Context, doctorID int) ([]domain.RecurringAppointment, error)
	Update(ctx context.Context, recurring *domain.RecurringAppointment) error
	Delete(ctx context.Context, id int) error
}

// RecurringAppointmentService handles recurring appointment business logic.
type RecurringAppointmentService struct {
	repo            RecurringAppointmentRepository
	appointmentRepo ports.AppointmentRepository
}

// NewRecurringAppointmentService creates a new instance.
func NewRecurringAppointmentService(repo RecurringAppointmentRepository, apptRepo ports.AppointmentRepository) *RecurringAppointmentService {
	return &RecurringAppointmentService{
		repo:            repo,
		appointmentRepo: apptRepo,
	}
}

// CreateRecurringAppointment creates a new recurring appointment pattern.
func (s *RecurringAppointmentService) CreateRecurringAppointment(ctx context.Context, patientID, doctorID int, startTime time.Time, duration int, frequency string, dayOfWeek int, startDate, endDate time.Time, maxOccurrences int, notes string) (*domain.RecurringAppointment, error) {
	// Validate frequency
	if frequency != domain.FrequencyWeekly && frequency != domain.FrequencyBiweekly && frequency != domain.FrequencyMonthly {
		return nil, errors.New("invalid frequency: must be weekly, biweekly, or monthly")
	}

	// Validate day of week
	if dayOfWeek < 0 || dayOfWeek > 6 {
		return nil, errors.New("invalid day of week: must be 0-6 (Sunday-Saturday)")
	}

	recurring := &domain.RecurringAppointment{
		PatientID:      patientID,
		DoctorID:       doctorID,
		StartTime:      startTime,
		Duration:       duration,
		Frequency:      frequency,
		DayOfWeek:      dayOfWeek,
		StartDate:      startDate,
		EndDate:        endDate,
		MaxOccurrences: maxOccurrences,
		Notes:          notes,
		IsActive:       true,
	}

	if err := s.repo.Create(ctx, recurring); err != nil {
		return nil, errors.New("failed to create recurring appointment")
	}

	return s.repo.FindByID(ctx, recurring.ID)
}

// GetRecurringAppointment retrieves a recurring appointment by ID.
func (s *RecurringAppointmentService) GetRecurringAppointment(ctx context.Context, id, userID int, userRole string) (*domain.RecurringAppointment, error) {
	recurring, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("recurring appointment not found")
	}

	// Authorization check
	if userRole == domain.RoleAdmin {
		return recurring, nil
	}
	if userRole == domain.RoleMedico && recurring.DoctorID == userID {
		return recurring, nil
	}
	if userRole == domain.RolePaciente && recurring.PatientID == userID {
		return recurring, nil
	}

	return nil, errors.New("unauthorized to view this recurring appointment")
}

// GetMyRecurringAppointments retrieves recurring appointments for the current user.
func (s *RecurringAppointmentService) GetMyRecurringAppointments(ctx context.Context, userID int, userRole string) ([]domain.RecurringAppointment, error) {
	if userRole == domain.RoleMedico {
		return s.repo.ListByDoctorID(ctx, userID)
	}
	return s.repo.ListByPatientID(ctx, userID)
}

// GenerateUpcomingAppointments generates the next N appointments from a recurring pattern.
func (s *RecurringAppointmentService) GenerateUpcomingAppointments(ctx context.Context, recurringID, userID int, userRole string, count int) ([]time.Time, error) {
	recurring, err := s.GetRecurringAppointment(ctx, recurringID, userID, userRole)
	if err != nil {
		return nil, err
	}

	return recurring.GenerateNextOccurrences(count), nil
}

// BookFromRecurring creates actual appointments from a recurring pattern.
func (s *RecurringAppointmentService) BookFromRecurring(ctx context.Context, recurringID, userID int, userRole string, count int) ([]domain.Appointment, error) {
	recurring, err := s.GetRecurringAppointment(ctx, recurringID, userID, userRole)
	if err != nil {
		return nil, err
	}

	occurrences := recurring.GenerateNextOccurrences(count)
	var bookedAppointments []domain.Appointment

	for _, startTime := range occurrences {
		endTime := startTime.Add(time.Duration(recurring.Duration) * time.Minute)

		// Check if slot is available
		isAvailable, err := s.appointmentRepo.CheckSlotAvailability(ctx, recurring.DoctorID, startTime, endTime, nil)
		if err != nil || !isAvailable {
			continue // Skip unavailable slots
		}

		appointment := &domain.Appointment{
			PatientID: recurring.PatientID,
			DoctorID:  recurring.DoctorID,
			StartTime: startTime,
			EndTime:   endTime,
			Status:    domain.StatusBooked,
		}

		if err := s.appointmentRepo.Create(ctx, appointment, nil); err != nil {
			continue // Skip failed bookings
		}

		bookedAppointments = append(bookedAppointments, *appointment)
	}

	return bookedAppointments, nil
}

// UpdateRecurringAppointment updates a recurring appointment pattern.
func (s *RecurringAppointmentService) UpdateRecurringAppointment(ctx context.Context, id, userID int, userRole string, updates map[string]interface{}) (*domain.RecurringAppointment, error) {
	recurring, err := s.GetRecurringAppointment(ctx, id, userID, userRole)
	if err != nil {
		return nil, err
	}

	// Only doctor or admin can update
	if userRole != domain.RoleAdmin && userRole != domain.RoleMedico {
		return nil, errors.New("only doctors can update recurring appointments")
	}

	// Apply updates
	if frequency, ok := updates["frequency"].(string); ok {
		recurring.Frequency = frequency
	}
	if notes, ok := updates["notes"].(string); ok {
		recurring.Notes = notes
	}
	if isActive, ok := updates["isActive"].(bool); ok {
		recurring.IsActive = isActive
	}

	if err := s.repo.Update(ctx, recurring); err != nil {
		return nil, errors.New("failed to update recurring appointment")
	}

	return recurring, nil
}

// CancelRecurringAppointment cancels a recurring appointment pattern.
func (s *RecurringAppointmentService) CancelRecurringAppointment(ctx context.Context, id, userID int, userRole string) error {
	recurring, err := s.GetRecurringAppointment(ctx, id, userID, userRole)
	if err != nil {
		return err
	}

	// Patient, doctor, or admin can cancel
	if userRole == domain.RolePaciente && recurring.PatientID != userID {
		return errors.New("unauthorized to cancel this recurring appointment")
	}
	if userRole == domain.RoleMedico && recurring.DoctorID != userID {
		return errors.New("unauthorized to cancel this recurring appointment")
	}

	return s.repo.Delete(ctx, id)
}
