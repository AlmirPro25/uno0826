package services

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"time"
)

// MedicalCertificateService implementation.
type MedicalCertificateService struct {
	certificateRepository ports.MedicalCertificateRepository
}

// NewMedicalCertificateService creates a new instance of MedicalCertificateService.
func NewMedicalCertificateService(repo ports.MedicalCertificateRepository) *MedicalCertificateService {
	return &MedicalCertificateService{certificateRepository: repo}
}

// CreateCertificate creates a new medical certificate.
func (s *MedicalCertificateService) CreateCertificate(ctx context.Context, doctorID, patientID int, appointmentID *int, certType string, days int, startDate time.Time, reason, cid, restrictions, notes string) (*domain.MedicalCertificate, error) {
	// Validate certificate type
	if certType != domain.CertificateTypeAbsence && certType != domain.CertificateTypeMedicalLeave && certType != domain.CertificateTypeFitness {
		return nil, errors.New("invalid certificate type")
	}

	// Calculate end date
	endDate := startDate.AddDate(0, 0, days-1)

	certificate := &domain.MedicalCertificate{
		PatientID:     patientID,
		DoctorID:      doctorID,
		AppointmentID: appointmentID,
		Type:          certType,
		Days:          days,
		StartDate:     startDate,
		EndDate:       endDate,
		Reason:        reason,
		CID:           cid,
		Restrictions:  restrictions,
		Notes:         notes,
		IssuedAt:      time.Now(),
	}

	if err := s.certificateRepository.Create(ctx, certificate); err != nil {
		return nil, errors.New("failed to create medical certificate")
	}

	// Reload with relations
	return s.certificateRepository.FindByID(ctx, certificate.ID)
}

// GetCertificate retrieves a certificate by ID with authorization check.
func (s *MedicalCertificateService) GetCertificate(ctx context.Context, certificateID, userID int, userRole string) (*domain.MedicalCertificate, error) {
	certificate, err := s.certificateRepository.FindByID(ctx, certificateID)
	if err != nil {
		return nil, errors.New("certificate not found")
	}

	// Authorization: Admin can see all, Doctor can see their own, Patient can see their own
	if userRole == domain.RoleAdmin {
		return certificate, nil
	}
	if userRole == domain.RoleMedico && certificate.DoctorID == userID {
		return certificate, nil
	}
	if userRole == domain.RolePaciente && certificate.PatientID == userID {
		return certificate, nil
	}

	return nil, errors.New("unauthorized to view this certificate")
}

// GetCertificatesForPatient retrieves all certificates for a patient.
func (s *MedicalCertificateService) GetCertificatesForPatient(ctx context.Context, patientID, userID int, userRole string) ([]domain.MedicalCertificate, error) {
	// Authorization check
	if userRole == domain.RolePaciente && patientID != userID {
		return nil, errors.New("patients can only view their own certificates")
	}

	return s.certificateRepository.ListByPatientID(ctx, patientID)
}

// GetCertificatesForDoctor retrieves all certificates created by a doctor.
func (s *MedicalCertificateService) GetCertificatesForDoctor(ctx context.Context, doctorID int) ([]domain.MedicalCertificate, error) {
	return s.certificateRepository.ListByDoctorID(ctx, doctorID)
}

// DeleteCertificate deletes a certificate (only by the creating doctor).
func (s *MedicalCertificateService) DeleteCertificate(ctx context.Context, certificateID, doctorID int) error {
	certificate, err := s.certificateRepository.FindByID(ctx, certificateID)
	if err != nil {
		return errors.New("certificate not found")
	}

	// Only the doctor who created the certificate can delete it
	if certificate.DoctorID != doctorID {
		return errors.New("unauthorized to delete this certificate")
	}

	return s.certificateRepository.Delete(ctx, certificateID)
}
