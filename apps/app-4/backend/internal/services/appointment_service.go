package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"time"

	"gorm.io/gorm"
)

// AppointmentService implementation.
type AppointmentService struct {
	appointmentRepository   ports.AppointmentRepository
	emailService            *EmailService
	userRepository          ports.UserRepository
	scheduleBlockRepository ScheduleBlockRepository
}

// NewAppointmentService creates a new instance of AppointmentService.
func NewAppointmentService(repo ports.AppointmentRepository) *AppointmentService {
	return &AppointmentService{appointmentRepository: repo}
}

// NewAppointmentServiceWithEmail creates a new instance with email support.
func NewAppointmentServiceWithEmail(repo ports.AppointmentRepository, emailSvc *EmailService, userRepo ports.UserRepository) *AppointmentService {
	return &AppointmentService{
		appointmentRepository: repo,
		emailService:          emailSvc,
		userRepository:        userRepo,
	}
}

// NewAppointmentServiceFull creates a new instance with all dependencies.
func NewAppointmentServiceFull(repo ports.AppointmentRepository, emailSvc *EmailService, userRepo ports.UserRepository, scheduleBlockRepo ScheduleBlockRepository) *AppointmentService {
	return &AppointmentService{
		appointmentRepository:   repo,
		emailService:            emailSvc,
		userRepository:          userRepo,
		scheduleBlockRepository: scheduleBlockRepo,
	}
}

// BookAppointment creates a new appointment using an atomic transaction to prevent conflicts.
func (s *AppointmentService) BookAppointment(ctx context.Context, patientID, doctorID int, startTime, endTime time.Time) (*domain.Appointment, error) {
	// 1. Validate appointment duration (e.g., must be 30 minutes)
	if endTime.Sub(startTime) != 30*time.Minute {
		return nil, errors.New("appointment duration must be 30 minutes")
	}

	// 2. Check for DOCTOR slot availability (doctor cannot have overlapping appointments)
	isDoctorAvailable, err := s.appointmentRepository.CheckSlotAvailability(ctx, doctorID, startTime, endTime, nil)
	if err != nil {
		return nil, err
	}
	if !isDoctorAvailable {
		return nil, errors.New("slot conflict detected: doctor is not available at this time")
	}

	// 3. Check for PATIENT slot availability (patient cannot have overlapping appointments)
	isPatientAvailable, err := s.appointmentRepository.CheckPatientSlotAvailability(ctx, patientID, startTime, endTime, nil)
	if err != nil {
		return nil, err
	}
	if !isPatientAvailable {
		return nil, errors.New("patient conflict detected: you already have an appointment at this time")
	}

	// 5. Create appointment
	appointment := &domain.Appointment{
		PatientID: patientID,
		DoctorID:  doctorID,
		StartTime: startTime,
		EndTime:   endTime,
		Status:    domain.StatusPending,
	}

	if err := s.appointmentRepository.Create(ctx, appointment, nil); err != nil {
		return nil, err
	}

	log.Printf("Appointment created: patient %d, doctor %d, time %s", patientID, doctorID, startTime)

	// Send confirmation email (async, don't block on failure)
	go s.sendAppointmentConfirmationEmail(ctx, appointment)

	return appointment, nil
}

// sendAppointmentConfirmationEmail sends email notification for new appointment
func (s *AppointmentService) sendAppointmentConfirmationEmail(ctx context.Context, appointment *domain.Appointment) {
	if s.emailService == nil || s.userRepository == nil || !s.emailService.IsEnabled() {
		return
	}

	patient, err := s.userRepository.FindByID(ctx, appointment.PatientID)
	if err != nil {
		log.Printf("Failed to get patient for email: %v", err)
		return
	}

	doctor, err := s.userRepository.FindByID(ctx, appointment.DoctorID)
	if err != nil {
		log.Printf("Failed to get doctor for email: %v", err)
		return
	}

	date, timeStr := FormatAppointmentTime(appointment.StartTime)
	
	// Send to patient
	patientData := AppointmentEmailData{
		PatientName: patient.FullName,
		DoctorName:  doctor.FullName,
		Date:        date,
		Time:        timeStr,
		Status:      "Agendada",
	}
	if err := s.emailService.SendAppointmentConfirmation(patient.Email, patientData); err != nil {
		log.Printf("Failed to send confirmation email to patient: %v", err)
	}

	// Send to doctor
	doctorData := AppointmentEmailData{
		PatientName: patient.FullName,
		DoctorName:  doctor.FullName,
		Date:        date,
		Time:        timeStr,
		Status:      "Agendada",
	}
	if err := s.emailService.SendNewAppointmentNotificationToDoctor(doctor.Email, doctorData); err != nil {
		log.Printf("Failed to send notification email to doctor: %v", err)
	}
}

// GetAppointmentsForUser retrieves a list of appointments for a specific user role.
func (s *AppointmentService) GetAppointmentsForUser(ctx context.Context, userID int, userRole string) ([]domain.Appointment, error) {
	appointments, err := s.appointmentRepository.ListForUser(ctx, userID, userRole)
	if err != nil {
		return nil, err
	}
	return appointments, nil
}

// CancelAppointment cancels an appointment if the user has permission (patient or doctor).
func (s *AppointmentService) CancelAppointment(ctx context.Context, appointmentID int, userID int, userRole string) error {
	// 1. Find appointment details
	appointment, err := s.appointmentRepository.FindByID(ctx, appointmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("appointment not found")
		}
		return err
	}

	// 2. Authorization check: patient can cancel their own appointment, doctor can cancel their patient's appointment.
	isAuthorized := false
	if userRole == domain.RolePaciente && appointment.PatientID == userID {
		isAuthorized = true
	}
	if userRole == domain.RoleMedico && appointment.DoctorID == userID {
		isAuthorized = true
	}
	if !isAuthorized {
		return errors.New("unauthorized to cancel this appointment")
	}

	// 3. Update status in database
	if err := s.appointmentRepository.Cancel(ctx, appointmentID, nil); err != nil {
		return err
	}

	// Send cancellation email (async)
	go s.sendAppointmentCancellationEmail(ctx, appointment)

	return nil
}

// sendAppointmentCancellationEmail sends email notification for cancelled appointment
func (s *AppointmentService) sendAppointmentCancellationEmail(ctx context.Context, appointment *domain.Appointment) {
	if s.emailService == nil || s.userRepository == nil || !s.emailService.IsEnabled() {
		return
	}

	patient, err := s.userRepository.FindByID(ctx, appointment.PatientID)
	if err != nil {
		return
	}

	doctor, err := s.userRepository.FindByID(ctx, appointment.DoctorID)
	if err != nil {
		return
	}

	date, timeStr := FormatAppointmentTime(appointment.StartTime)
	data := AppointmentEmailData{
		PatientName: patient.FullName,
		DoctorName:  doctor.FullName,
		Date:        date,
		Time:        timeStr,
	}

	s.emailService.SendAppointmentCancellation(patient.Email, data)
}

// GetAvailableSlots generates potential slots based on a default schedule (e.g., 9:00-17:00, 30 min slots)
// and filters out existing booked slots and blocked times for the specified doctor on the given date.
func (s *AppointmentService) GetAvailableSlots(ctx context.Context, doctorID int, date time.Time) ([]time.Time, error) {
	// 1. Get existing appointments for the doctor on the specified date.
	existingAppointments, err := s.appointmentRepository.GetAvailableSlots(ctx, doctorID, date)
	if err != nil {
		return nil, err
	}

	// 2. Generate all potential slots for the day (e.g., 9:00 to 17:00)
	availableSlots := generateSlots(date, 9, 0, 17, 0, 30*time.Minute)

	// 3. Remove existing appointments from potential slots
	bookedSlots := make(map[time.Time]bool)
	for _, appt := range existingAppointments {
		// Mark the start time of existing appointments as booked
		bookedSlots[appt.StartTime] = true
	}

	// 4. Filter out booked slots
	var filteredSlots []time.Time
	for _, slot := range availableSlots {
		if !bookedSlots[slot] {
			filteredSlots = append(filteredSlots, slot)
		}
	}

	// 5. Filter out blocked time slots (if schedule block repository is available)
	if s.scheduleBlockRepository != nil {
		var finalSlots []time.Time
		for _, slot := range filteredSlots {
			endTime := slot.Add(30 * time.Minute)
			isBlocked, err := s.scheduleBlockRepository.IsTimeBlocked(ctx, doctorID, slot, endTime)
			if err != nil {
				log.Printf("Error checking blocked time: %v", err)
				continue
			}
			if !isBlocked {
				finalSlots = append(finalSlots, slot)
			}
		}
		return finalSlots, nil
	}

	return filteredSlots, nil
}

// generateSlots creates a slice of time.Time objects representing potential appointment start times.
func generateSlots(date time.Time, startHour, startMinute, endHour, endMinute int, duration time.Duration) []time.Time {
	var slots []time.Time
	start := time.Date(date.Year(), date.Month(), date.Day(), startHour, startMinute, 0, 0, time.Local)
	end := time.Date(date.Year(), date.Month(), date.Day(), endHour, endMinute, 0, 0, time.Local)

	for current := start; current.Before(end); current = current.Add(duration) {
		slots = append(slots, current)
	}
	return slots
}

// GetVideoCallInfo retrieves the video call connection details for an appointment.
func (s *AppointmentService) GetVideoCallInfo(ctx context.Context, appointmentID int, userID int) (*domain.VideoCallInfo, error) {
	// 1. Find appointment details
	appointment, err := s.appointmentRepository.FindByID(ctx, appointmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("appointment not found")
		}
		return nil, err
	}

	// 2. Authorization check: must be the patient or the doctor
	if appointment.PatientID != userID && appointment.DoctorID != userID {
		return nil, errors.New("unauthorized to join this call")
	}

	// 3. Generate room name
	// Using a consistent naming convention: medisync-appt-{ID}
	roomName := fmt.Sprintf("medisync-appt-%d", appointmentID)

	return &domain.VideoCallInfo{
		RoomName: roomName,
		Provider: "jitsi",
	}, nil
}

// GetAppointment retrieves detailed information about a specific appointment.
func (s *AppointmentService) GetAppointment(ctx context.Context, appointmentID int, userID int, userRole string) (*domain.Appointment, error) {
	// 1. Find appointment details
	appointment, err := s.appointmentRepository.FindByID(ctx, appointmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("appointment not found")
		}
		return nil, err
	}

	// 2. Authorization check
	isAuthorized := false
	if userRole == domain.RolePaciente && appointment.PatientID == userID {
		isAuthorized = true
	}
	if userRole == domain.RoleMedico && appointment.DoctorID == userID {
		isAuthorized = true
	}
	if userRole == domain.RoleAdmin {
		isAuthorized = true
	}

	if !isAuthorized {
		return nil, errors.New("unauthorized to view this appointment")
	}

	return appointment, nil
}

// CompleteAppointment marks an appointment as completed (only by doctor).
func (s *AppointmentService) CompleteAppointment(ctx context.Context, appointmentID int, doctorID int) error {
	// 1. Find appointment details
	appointment, err := s.appointmentRepository.FindByID(ctx, appointmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("appointment not found")
		}
		return err
	}

	// 2. Authorization check: only the doctor can complete
	if appointment.DoctorID != doctorID {
		return errors.New("unauthorized to complete this appointment")
	}

	// 3. Check current status
	if appointment.Status == domain.StatusCompleted {
		return errors.New("appointment is already completed")
	}
	if appointment.Status == domain.StatusCancelled {
		return errors.New("cannot complete a cancelled appointment")
	}

	// 4. Update status
	if err := s.appointmentRepository.Complete(ctx, appointmentID); err != nil {
		return err
	}

	// Send completion email (async)
	go s.sendAppointmentCompletedEmail(ctx, appointment)

	return nil
}

// sendAppointmentCompletedEmail sends email notification when appointment is completed
func (s *AppointmentService) sendAppointmentCompletedEmail(ctx context.Context, appointment *domain.Appointment) {
	if s.emailService == nil || s.userRepository == nil || !s.emailService.IsEnabled() {
		return
	}

	patient, err := s.userRepository.FindByID(ctx, appointment.PatientID)
	if err != nil {
		return
	}

	doctor, err := s.userRepository.FindByID(ctx, appointment.DoctorID)
	if err != nil {
		return
	}

	date, timeStr := FormatAppointmentTime(appointment.StartTime)
	data := AppointmentEmailData{
		PatientName: patient.FullName,
		DoctorName:  doctor.FullName,
		Date:        date,
		Time:        timeStr,
	}

	s.emailService.SendAppointmentCompletedEmail(patient.Email, data)
}
