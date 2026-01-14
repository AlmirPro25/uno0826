package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"medisync-platform/backend/internal/adapters/repository"
	"medisync-platform/backend/internal/core/domain"
	"time"
)

// TriageReportService handles triage report business logic
type TriageReportService struct {
	repo                     *repository.TriageReportRepository
	notificationService      *NotificationService
	userRepo                 *repository.UserRepository
	healthIntelligenceService *HealthIntelligenceService
}

// NewTriageReportService creates a new service instance
func NewTriageReportService(
	repo *repository.TriageReportRepository,
	notificationService *NotificationService,
	userRepo *repository.UserRepository,
) *TriageReportService {
	return &TriageReportService{
		repo:                repo,
		notificationService: notificationService,
		userRepo:            userRepo,
	}
}

// SetHealthIntelligenceService sets the health intelligence service for profile updates
func (s *TriageReportService) SetHealthIntelligenceService(his *HealthIntelligenceService) {
	s.healthIntelligenceService = his
}

// CreateTriageReportInput defines input for creating a triage report
type CreateTriageReportInput struct {
	PatientComplaint        string   `json:"patient_complaint"`
	HistoryOfPresentIllness string   `json:"history_of_present_illness"`
	VitalSignsNote          string   `json:"vital_signs_note"`
	SuspectedDiagnosis      []string `json:"suspected_diagnosis"`
	RecommendedSpecialty    string   `json:"recommended_specialty"`
	Priority                string   `json:"priority"`
	Reasoning               string   `json:"reasoning"`
	Transcript              string   `json:"transcript"`
	SessionType             string   `json:"session_type"`
	AIModel                 string   `json:"ai_model"`
	SessionLength           int      `json:"session_length"`
	Latitude                *float64 `json:"latitude"`
	Longitude               *float64 `json:"longitude"`
}

// CreateTriageReport creates a new triage report and notifies relevant doctors
func (s *TriageReportService) CreateTriageReport(ctx context.Context, patientID int, input CreateTriageReportInput) (*domain.TriageReport, error) {
	// Convert diagnosis array to JSON string
	diagnosisJSON, _ := json.Marshal(input.SuspectedDiagnosis)

	report := &domain.TriageReport{
		PatientID:               patientID,
		PatientComplaint:        input.PatientComplaint,
		HistoryOfPresentIllness: input.HistoryOfPresentIllness,
		VitalSignsNote:          input.VitalSignsNote,
		SuspectedDiagnosis:      string(diagnosisJSON),
		RecommendedSpecialty:    input.RecommendedSpecialty,
		Priority:                input.Priority,
		Reasoning:               input.Reasoning,
		Transcript:              input.Transcript,
		SessionType:             input.SessionType,
		AIModel:                 input.AIModel,
		SessionLength:           input.SessionLength,
		Latitude:                input.Latitude,
		Longitude:               input.Longitude,
		Status:                  domain.TriageStatusPending,
	}

	if err := s.repo.Create(ctx, report); err != nil {
		return nil, errors.New("failed to create triage report")
	}

	// Notify doctors of the recommended specialty
	go s.notifyDoctors(ctx, report)

	// Update health profile with extracted data from triage
	if s.healthIntelligenceService != nil {
		go func() {
			if err := s.healthIntelligenceService.UpdateProfileFromTriage(context.Background(), uint(patientID), uint(report.ID)); err != nil {
				// Log error but don't fail the triage creation
				fmt.Printf("Failed to update health profile from triage: %v\n", err)
			}
		}()
	}

	return report, nil
}

// notifyDoctors sends notifications to doctors of the recommended specialty
func (s *TriageReportService) notifyDoctors(ctx context.Context, report *domain.TriageReport) {
	if s.notificationService == nil || s.userRepo == nil {
		return
	}

	// Get patient info
	patient, err := s.userRepo.FindByID(ctx, report.PatientID)
	if err != nil {
		return
	}

	// Get doctors of the recommended specialty
	doctors, err := s.userRepo.List(ctx, domain.RoleMedico, 1, 100)
	if err != nil {
		return
	}

	// Filter by specialty and notify
	for _, doctor := range doctors {
		if doctor.Specialty != nil && *doctor.Specialty == report.RecommendedSpecialty {
			data, _ := json.Marshal(map[string]interface{}{
				"triage_id": report.ID,
				"priority":  report.Priority,
			})

			notification := &domain.Notification{
				UserID:   doctor.ID,
				Title:    "Nova Triagem: " + report.Priority,
				Message:  "Paciente " + patient.FullName + " - " + report.PatientComplaint,
				Type:     domain.NotificationTypeTriage,
				Priority: s.mapPriorityToNotification(report.Priority),
				Data:     string(data),
				Link:     fmt.Sprintf("/medico/triagens/%d", report.ID),
			}

			s.notificationService.CreateNotification(ctx, notification)
		}
	}
}

// mapPriorityToNotification maps Manchester priority to notification priority
func (s *TriageReportService) mapPriorityToNotification(manchesterPriority string) string {
	switch manchesterPriority {
	case domain.PriorityEmergency:
		return domain.NotificationPriorityUrgent
	case domain.PriorityVeryUrgent:
		return domain.NotificationPriorityHigh
	case domain.PriorityUrgent:
		return domain.NotificationPriorityNormal
	default:
		return domain.NotificationPriorityLow
	}
}

// GetTriageReport retrieves a triage report by ID with authorization
func (s *TriageReportService) GetTriageReport(ctx context.Context, reportID, userID int, userRole string) (*domain.TriageReport, error) {
	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		return nil, errors.New("triage report not found")
	}

	// Authorization: patient can only see their own, doctors can see assigned or pending
	if userRole == domain.RolePaciente && report.PatientID != userID {
		return nil, errors.New("unauthorized to view this report")
	}

	return report, nil
}

// GetPatientTriageReports retrieves all triage reports for a patient
func (s *TriageReportService) GetPatientTriageReports(ctx context.Context, patientID, userID int, userRole string) ([]domain.TriageReport, error) {
	// Authorization
	if userRole == domain.RolePaciente && patientID != userID {
		return nil, errors.New("unauthorized to view these reports")
	}

	return s.repo.ListByPatientID(ctx, patientID)
}

// GetDoctorTriageReports retrieves triage reports assigned to a doctor
func (s *TriageReportService) GetDoctorTriageReports(ctx context.Context, doctorID int) ([]domain.TriageReport, error) {
	return s.repo.ListByDoctorID(ctx, doctorID)
}

// GetPendingTriageReports retrieves pending triage reports
func (s *TriageReportService) GetPendingTriageReports(ctx context.Context, specialty string, limit int) ([]domain.TriageReport, error) {
	return s.repo.ListPending(ctx, specialty, limit)
}

// AcceptTriageReport allows a doctor to accept a triage case
func (s *TriageReportService) AcceptTriageReport(ctx context.Context, reportID, doctorID int) (*domain.TriageReport, error) {
	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		return nil, errors.New("triage report not found")
	}

	if report.Status != domain.TriageStatusPending {
		return nil, errors.New("triage report is not pending")
	}

	// Assign doctor and update status
	if err := s.repo.AssignDoctor(ctx, reportID, doctorID); err != nil {
		return nil, errors.New("failed to accept triage report")
	}

	// Notify patient
	if s.notificationService != nil {
		doctor, _ := s.userRepo.FindByID(ctx, doctorID)
		doctorName := "Um médico"
		if doctor != nil {
			doctorName = doctor.FullName
		}

		data, _ := json.Marshal(map[string]interface{}{
			"triage_id": reportID,
			"doctor_id": doctorID,
		})

		notification := &domain.Notification{
			UserID:   report.PatientID,
			Title:    "Triagem Aceita",
			Message:  doctorName + " aceitou seu caso e entrará em contato.",
			Type:     domain.NotificationTypeTriage,
			Priority: domain.NotificationPriorityHigh,
			Data:     string(data),
			Link:     "/paciente/triagens",
		}

		s.notificationService.CreateNotification(ctx, notification)
	}

	return s.repo.FindByID(ctx, reportID)
}

// ReviewTriageReport allows a doctor to review and add notes
func (s *TriageReportService) ReviewTriageReport(ctx context.Context, reportID, doctorID int, notes string) (*domain.TriageReport, error) {
	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		return nil, errors.New("triage report not found")
	}

	now := time.Now()
	report.ReviewedByID = &doctorID
	report.ReviewedAt = &now
	report.ReviewNotes = notes
	report.Status = domain.TriageStatusReviewed

	if err := s.repo.Update(ctx, report); err != nil {
		return nil, errors.New("failed to update triage report")
	}

	return report, nil
}

// UpdateTriageStatus updates the status of a triage report
func (s *TriageReportService) UpdateTriageStatus(ctx context.Context, reportID int, status string, userID int, userRole string) error {
	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		return errors.New("triage report not found")
	}

	// Only doctors/admins can change status (except patient cancelling)
	if userRole == domain.RolePaciente {
		if report.PatientID != userID {
			return errors.New("unauthorized")
		}
		if status != domain.TriageStatusCancelled {
			return errors.New("patients can only cancel their own reports")
		}
	}

	return s.repo.UpdateStatus(ctx, reportID, status)
}

// GetTriageStats retrieves triage statistics
func (s *TriageReportService) GetTriageStats(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetStats(ctx)
}

// LinkToAppointment links a triage report to an appointment
func (s *TriageReportService) LinkToAppointment(ctx context.Context, reportID, appointmentID int) error {
	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		return errors.New("triage report not found")
	}

	report.AppointmentID = &appointmentID
	report.Status = domain.TriageStatusCompleted

	return s.repo.Update(ctx, report)
}

// LinkToMedicalRecord links a triage report to a medical record
func (s *TriageReportService) LinkToMedicalRecord(ctx context.Context, reportID, recordID int) error {
	report, err := s.repo.FindByID(ctx, reportID)
	if err != nil {
		return errors.New("triage report not found")
	}

	report.MedicalRecordID = &recordID

	return s.repo.Update(ctx, report)
}
