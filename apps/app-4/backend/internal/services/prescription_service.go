package services

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"time"
)

// PrescriptionService implementation.
type PrescriptionService struct {
	prescriptionRepository ports.PrescriptionRepository
}

// NewPrescriptionService creates a new instance of PrescriptionService.
func NewPrescriptionService(repo ports.PrescriptionRepository) *PrescriptionService {
	return &PrescriptionService{prescriptionRepository: repo}
}

// CreatePrescription creates a new digital prescription.
func (s *PrescriptionService) CreatePrescription(ctx context.Context, doctorID, patientID int, appointmentID *int, medications, instructions, diagnosis, notes string, validUntil time.Time) (*domain.Prescription, error) {
	prescription := &domain.Prescription{
		PatientID:     patientID,
		DoctorID:      doctorID,
		AppointmentID: appointmentID,
		Medications:   medications,
		Instructions:  instructions,
		Diagnosis:     diagnosis,
		Notes:         notes,
		ValidUntil:    validUntil,
		IssuedAt:      time.Now(),
	}

	if err := s.prescriptionRepository.Create(ctx, prescription); err != nil {
		return nil, errors.New("failed to create prescription")
	}

	// Reload with relations
	return s.prescriptionRepository.FindByID(ctx, prescription.ID)
}

// GetPrescription retrieves a prescription by ID with authorization check.
func (s *PrescriptionService) GetPrescription(ctx context.Context, prescriptionID, userID int, userRole string) (*domain.Prescription, error) {
	prescription, err := s.prescriptionRepository.FindByID(ctx, prescriptionID)
	if err != nil {
		return nil, errors.New("prescription not found")
	}

	// Authorization: Admin can see all, Doctor can see their own, Patient can see their own
	if userRole == domain.RoleAdmin {
		return prescription, nil
	}
	if userRole == domain.RoleMedico && prescription.DoctorID == userID {
		return prescription, nil
	}
	if userRole == domain.RolePaciente && prescription.PatientID == userID {
		return prescription, nil
	}

	return nil, errors.New("unauthorized to view this prescription")
}

// GetPrescriptionsForPatient retrieves all prescriptions for a patient.
func (s *PrescriptionService) GetPrescriptionsForPatient(ctx context.Context, patientID, userID int, userRole string) ([]domain.Prescription, error) {
	// Authorization check
	if userRole == domain.RolePaciente && patientID != userID {
		return nil, errors.New("patients can only view their own prescriptions")
	}

	return s.prescriptionRepository.ListByPatientID(ctx, patientID)
}

// GetPrescriptionsForDoctor retrieves all prescriptions created by a doctor.
func (s *PrescriptionService) GetPrescriptionsForDoctor(ctx context.Context, doctorID int) ([]domain.Prescription, error) {
	return s.prescriptionRepository.ListByDoctorID(ctx, doctorID)
}

// UpdatePrescription updates an existing prescription (only by the creating doctor).
func (s *PrescriptionService) UpdatePrescription(ctx context.Context, prescriptionID, doctorID int, updates map[string]interface{}) (*domain.Prescription, error) {
	prescription, err := s.prescriptionRepository.FindByID(ctx, prescriptionID)
	if err != nil {
		return nil, errors.New("prescription not found")
	}

	// Only the doctor who created the prescription can update it
	if prescription.DoctorID != doctorID {
		return nil, errors.New("unauthorized to update this prescription")
	}

	// Apply updates
	if medications, ok := updates["medications"].(string); ok {
		prescription.Medications = medications
	}
	if instructions, ok := updates["instructions"].(string); ok {
		prescription.Instructions = instructions
	}
	if diagnosis, ok := updates["diagnosis"].(string); ok {
		prescription.Diagnosis = diagnosis
	}
	if notes, ok := updates["notes"].(string); ok {
		prescription.Notes = notes
	}
	if validUntilStr, ok := updates["validUntil"].(string); ok {
		if validUntil, err := time.Parse(time.RFC3339, validUntilStr); err == nil {
			prescription.ValidUntil = validUntil
		}
	}

	if err := s.prescriptionRepository.Update(ctx, prescription); err != nil {
		return nil, errors.New("failed to update prescription")
	}

	return prescription, nil
}

// DeletePrescription deletes a prescription (only by the creating doctor).
func (s *PrescriptionService) DeletePrescription(ctx context.Context, prescriptionID, doctorID int) error {
	prescription, err := s.prescriptionRepository.FindByID(ctx, prescriptionID)
	if err != nil {
		return errors.New("prescription not found")
	}

	// Only the doctor who created the prescription can delete it
	if prescription.DoctorID != doctorID {
		return errors.New("unauthorized to delete this prescription")
	}

	return s.prescriptionRepository.Delete(ctx, prescriptionID)
}
