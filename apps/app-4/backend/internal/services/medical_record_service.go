package services

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"medisync-platform/backend/pkg/security"
	"time"
)

// MedicalRecordService implementation.
type MedicalRecordService struct {
	medicalRecordRepository ports.MedicalRecordRepository
	encryptionService       security.EncryptionService
}

// NewMedicalRecordService creates a new instance of MedicalRecordService.
func NewMedicalRecordService(repo ports.MedicalRecordRepository, encryptionService security.EncryptionService) *MedicalRecordService {
	return &MedicalRecordService{medicalRecordRepository: repo, encryptionService: encryptionService}
}

// CreateMedicalRecord creates a new medical record, encrypting the sensitive notes.
func (s *MedicalRecordService) CreateMedicalRecord(ctx context.Context, doctorID int, patientID int, diagnosis, notes string) (*domain.MedicalRecord, error) {
	// 1. Encrypt sensitive data (notes) before saving to database.
	encryptedNotes, err := s.encryptionService.Encrypt(notes)
	if err != nil {
		return nil, errors.New("failed to encrypt medical record notes")
	}

	// 2. Create the medical record object
	record := &domain.MedicalRecord{
		PatientID:        patientID,
		DoctorID:         doctorID,
		Diagnosis:        diagnosis,
		Notes:            encryptedNotes, // Store encrypted data
		ConsultationDate: time.Now(),
	}

	// 3. Save to database
	if err := s.medicalRecordRepository.Create(ctx, record); err != nil {
		return nil, errors.New("failed to save medical record")
	}

	return record, nil
}

// GetMedicalRecordsForPatient retrieves medical records for a patient.
// Authorization check: only patient themselves, creating doctor, or admin can view.
func (s *MedicalRecordService) GetMedicalRecordsForPatient(ctx context.Context, patientID int, userID int, userRole string) ([]domain.MedicalRecord, error) {
	// 1. Authorization check
	if userRole != domain.RoleAdmin && userRole != domain.RoleMedico && userRole != domain.RolePaciente {
		return nil, errors.New("unauthorized access to medical records")
	}

	// If user is a patient, check if they are requesting their own records.
	if userRole == domain.RolePaciente && patientID != userID {
		return nil, errors.New("patients can only view their own records")
	}

	// 2. Retrieve records from database
	records, err := s.medicalRecordRepository.ListByPatientID(ctx, patientID)
	if err != nil {
		return nil, errors.New("failed to retrieve medical records")
	}

	// 3. Decrypt sensitive data (notes) before returning.
	for i := range records {
		decryptedNotes, err := s.encryptionService.Decrypt(records[i].Notes)
		if err != nil {
			// Log error but potentially continue if other records are readable.
			// Or return error if decryption fails. For robustness, return an error.
			return nil, errors.New("failed to decrypt medical record notes")
		}
		records[i].Notes = decryptedNotes
	}

	return records, nil
}

// GetMedicalRecord retrieves a specific medical record by ID.
func (s *MedicalRecordService) GetMedicalRecord(ctx context.Context, recordID int, userID int, userRole string) (*domain.MedicalRecord, error) {
	record, err := s.medicalRecordRepository.FindByID(ctx, recordID)
	if err != nil {
		return nil, errors.New("medical record not found")
	}

	// Authorization check
	if userRole == domain.RolePaciente && record.PatientID != userID {
		return nil, errors.New("unauthorized to view this record")
	}

	// Decrypt notes
	decryptedNotes, err := s.encryptionService.Decrypt(record.Notes)
	if err != nil {
		return nil, errors.New("failed to decrypt medical record notes")
	}
	record.Notes = decryptedNotes

	return record, nil
}

// UpdateMedicalRecord updates an existing medical record. Only the creating doctor can update.
func (s *MedicalRecordService) UpdateMedicalRecord(ctx context.Context, recordID int, doctorID int, updates map[string]interface{}) (*domain.MedicalRecord, error) {
	record, err := s.medicalRecordRepository.FindByID(ctx, recordID)
	if err != nil {
		return nil, errors.New("medical record not found")
	}

	// Only the doctor who created the record can update it
	if record.DoctorID != doctorID {
		return nil, errors.New("unauthorized to update this record")
	}

	// Apply updates
	if diagnosis, ok := updates["diagnosis"].(string); ok && diagnosis != "" {
		record.Diagnosis = diagnosis
	}
	if notes, ok := updates["notes"].(string); ok && notes != "" {
		// Encrypt the new notes
		encryptedNotes, err := s.encryptionService.Encrypt(notes)
		if err != nil {
			return nil, errors.New("failed to encrypt medical record notes")
		}
		record.Notes = encryptedNotes
	}

	if err := s.medicalRecordRepository.Update(ctx, record); err != nil {
		return nil, errors.New("failed to update medical record")
	}

	// Decrypt notes for response
	decryptedNotes, _ := s.encryptionService.Decrypt(record.Notes)
	record.Notes = decryptedNotes

	return record, nil
}

// DeleteMedicalRecord deletes a medical record. Only the creating doctor can delete.
func (s *MedicalRecordService) DeleteMedicalRecord(ctx context.Context, recordID int, doctorID int) error {
	record, err := s.medicalRecordRepository.FindByID(ctx, recordID)
	if err != nil {
		return errors.New("medical record not found")
	}

	// Only the doctor who created the record can delete it
	if record.DoctorID != doctorID {
		return errors.New("unauthorized to delete this record")
	}

	return s.medicalRecordRepository.Delete(ctx, recordID)
}
