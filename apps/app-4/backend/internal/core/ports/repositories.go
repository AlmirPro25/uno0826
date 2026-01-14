package ports

import (
	"context"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// UserRepository defines the persistence layer operations for User entities.
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id int) (*domain.User, error)
	List(ctx context.Context, role string, page int, pageSize int) ([]domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id int) error
}

// AppointmentRepository defines the persistence layer operations for Appointment entities.
type AppointmentRepository interface {
	Create(ctx context.Context, appointment *domain.Appointment, tx *gorm.DB) error
	FindByID(ctx context.Context, id int) (*domain.Appointment, error)
	ListForUser(ctx context.Context, userID int, userRole string) ([]domain.Appointment, error)
	Cancel(ctx context.Context, id int, tx *gorm.DB) error
	Complete(ctx context.Context, id int) error
	CheckSlotAvailability(ctx context.Context, doctorID int, startTime, endTime time.Time, tx *gorm.DB) (bool, error)
	CheckPatientSlotAvailability(ctx context.Context, patientID int, startTime, endTime time.Time, tx *gorm.DB) (bool, error)
	GetAvailableSlots(ctx context.Context, doctorID int, date time.Time) ([]domain.Appointment, error)
}

// MedicalRecordRepository defines the persistence layer operations for MedicalRecord entities.
type MedicalRecordRepository interface {
	Create(ctx context.Context, record *domain.MedicalRecord) error
	FindByID(ctx context.Context, id int) (*domain.MedicalRecord, error)
	ListByPatientID(ctx context.Context, patientID int) ([]domain.MedicalRecord, error)
	Update(ctx context.Context, record *domain.MedicalRecord) error
	Delete(ctx context.Context, id int) error
}

// WaitingListRepository defines the persistence layer operations for WaitingList entities.
type WaitingListRepository interface {
	JoinWaitingRoom(ctx context.Context, patientID int) error
	LeaveWaitingRoom(ctx context.Context, patientID int) error
	GetStatus(ctx context.Context, patientID int) (*domain.WaitingList, error)
	ListWaitingPatients(ctx context.Context, doctorID int) ([]domain.WaitingList, error)
}

// PrescriptionRepository defines the persistence layer operations for Prescription entities.
type PrescriptionRepository interface {
	Create(ctx context.Context, prescription *domain.Prescription) error
	FindByID(ctx context.Context, id int) (*domain.Prescription, error)
	ListByPatientID(ctx context.Context, patientID int) ([]domain.Prescription, error)
	ListByDoctorID(ctx context.Context, doctorID int) ([]domain.Prescription, error)
	Update(ctx context.Context, prescription *domain.Prescription) error
	Delete(ctx context.Context, id int) error
}

// MedicalCertificateRepository defines the persistence layer operations for MedicalCertificate entities.
type MedicalCertificateRepository interface {
	Create(ctx context.Context, certificate *domain.MedicalCertificate) error
	FindByID(ctx context.Context, id int) (*domain.MedicalCertificate, error)
	ListByPatientID(ctx context.Context, patientID int) ([]domain.MedicalCertificate, error)
	ListByDoctorID(ctx context.Context, doctorID int) ([]domain.MedicalCertificate, error)
	Update(ctx context.Context, certificate *domain.MedicalCertificate) error
	Delete(ctx context.Context, id int) error
}

// ReviewRepository defines the persistence layer operations for Review entities.
type ReviewRepository interface {
	Create(ctx context.Context, review *domain.Review) error
	FindByID(ctx context.Context, id int) (*domain.Review, error)
	FindByAppointmentID(ctx context.Context, appointmentID int) (*domain.Review, error)
	ListByPatientID(ctx context.Context, patientID int) ([]domain.Review, error)
	ListByDoctorID(ctx context.Context, doctorID int) ([]domain.Review, error)
	GetDoctorAverageRating(ctx context.Context, doctorID int) (float64, int, error)
	Update(ctx context.Context, review *domain.Review) error
	Delete(ctx context.Context, id int) error
}
