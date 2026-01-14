package services

import (
	"context"
	"log"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"time"
)

// SchedulerService handles background tasks like auto-cancellation
type SchedulerService struct {
	appointmentRepo ports.AppointmentRepository
	emailService    *EmailService
	userRepo        ports.UserRepository
	stopChan        chan struct{}
}

// NewSchedulerService creates a new scheduler service
func NewSchedulerService(appointmentRepo ports.AppointmentRepository, emailService *EmailService, userRepo ports.UserRepository) *SchedulerService {
	return &SchedulerService{
		appointmentRepo: appointmentRepo,
		emailService:    emailService,
		userRepo:        userRepo,
		stopChan:        make(chan struct{}),
	}
}

// Start begins the scheduler background tasks
func (s *SchedulerService) Start() {
	log.Println("📅 Scheduler service started")
	
	// Run auto-cancellation check every 5 minutes
	go s.runAutoCancellation()
	
	// Run reminder emails every hour
	go s.runReminderEmails()
}

// Stop stops the scheduler
func (s *SchedulerService) Stop() {
	close(s.stopChan)
	log.Println("📅 Scheduler service stopped")
}

// runAutoCancellation checks for appointments that should be auto-cancelled
func (s *SchedulerService) runAutoCancellation() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	// Run immediately on start
	s.checkAndCancelNoShows()

	for {
		select {
		case <-ticker.C:
			s.checkAndCancelNoShows()
		case <-s.stopChan:
			return
		}
	}
}


// checkAndCancelNoShows cancels appointments that are past their time and still pending
func (s *SchedulerService) checkAndCancelNoShows() {
	// Get all pending appointments that are more than 30 minutes past their start time
	cutoffTime := time.Now().Add(-30 * time.Minute)
	
	// This would require a new repository method to get overdue appointments
	// For now, we'll log that this check is running
	log.Printf("📅 Checking for no-show appointments (cutoff: %s)", cutoffTime.Format("15:04"))
	
	// In a full implementation, you would:
	// 1. Query for appointments where status = 'PENDING' AND start_time < cutoffTime
	// 2. Update their status to 'NO_SHOW' or 'CANCELLED'
	// 3. Send notification emails
}

// runReminderEmails sends reminder emails for upcoming appointments
func (s *SchedulerService) runReminderEmails() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	// Run immediately on start
	s.sendUpcomingReminders()

	for {
		select {
		case <-ticker.C:
			s.sendUpcomingReminders()
		case <-s.stopChan:
			return
		}
	}
}

// sendUpcomingReminders sends reminder emails for appointments in the next hour
func (s *SchedulerService) sendUpcomingReminders() {
	if s.emailService == nil || !s.emailService.IsEnabled() {
		return
	}

	ctx := context.Background()
	
	// Get appointments starting in the next hour
	now := time.Now()
	oneHourLater := now.Add(1 * time.Hour)
	
	log.Printf("📅 Checking for appointments to remind (between %s and %s)", 
		now.Format("15:04"), oneHourLater.Format("15:04"))
	
	// In a full implementation, you would:
	// 1. Query for appointments where status = 'PENDING' AND start_time BETWEEN now AND oneHourLater
	// 2. Check if reminder was already sent (need a 'reminder_sent' field)
	// 3. Send reminder emails
	// 4. Mark reminder as sent
	
	_ = ctx
}

// MarkNoShow marks an appointment as no-show (can be called manually by doctor)
func (s *SchedulerService) MarkNoShow(ctx context.Context, appointmentID int, doctorID int) error {
	appointment, err := s.appointmentRepo.FindByID(ctx, appointmentID)
	if err != nil {
		return err
	}

	// Only the doctor can mark as no-show
	if appointment.DoctorID != doctorID {
		return domain.ErrUnauthorized
	}

	// Only pending appointments can be marked as no-show
	if appointment.Status != domain.StatusPending {
		return domain.ErrInvalidStatus
	}

	// Cancel the appointment (using existing cancel method)
	return s.appointmentRepo.Cancel(ctx, appointmentID, nil)
}
