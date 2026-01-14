package ports

import (
	"context"
	"medisync-platform/backend/internal/core/domain"
	"time"
)

// AuthService defines the business logic for authentication.
type AuthService interface {
	Login(ctx context.Context, email, password string) (token string, role string, err error)
	RegisterPatient(ctx context.Context, patient *domain.User) (*domain.User, error)
	GetRefreshToken(ctx context.Context, email, password string) (refreshToken string, err error)
	RefreshAccessToken(ctx context.Context, refreshToken string) (newToken string, err error)
	LogoutAllDevices(ctx context.Context, userID int) error
	ChangePassword(ctx context.Context, userID int, currentPassword, newPassword string, logoutAll bool) error
	GetUserByID(ctx context.Context, userID int) (*domain.User, error)
}

// UserService defines the business logic for user management (Admin scope).
type UserService interface {
	ListUsers(ctx context.Context, role string, page int, pageSize int) ([]domain.User, error)
	CreateUser(ctx context.Context, user *domain.User) (*domain.User, error)
	UpdateUser(ctx context.Context, id int, updates map[string]interface{}) (*domain.User, error)
	GetUser(ctx context.Context, id int) (*domain.User, error)
	DeleteUser(ctx context.Context, id int) error
}

// AppointmentService defines the business logic for scheduling appointments.
type AppointmentService interface {
	BookAppointment(ctx context.Context, patientID, doctorID int, startTime, endTime time.Time) (*domain.Appointment, error)
	GetAppointmentsForUser(ctx context.Context, userID int, userRole string) ([]domain.Appointment, error)
	CancelAppointment(ctx context.Context, appointmentID int, userID int, userRole string) error
	GetAvailableSlots(ctx context.Context, doctorID int, date time.Time) ([]time.Time, error) // Returns a slice of start times.
	GetVideoCallInfo(ctx context.Context, appointmentID int, userID int) (*domain.VideoCallInfo, error)
	GetAppointment(ctx context.Context, appointmentID int, userID int, userRole string) (*domain.Appointment, error)
}

// MedicalRecordService defines the business logic for handling medical records.
type MedicalRecordService interface {
	CreateMedicalRecord(ctx context.Context, doctorID int, patientID int, diagnosis, notes string) (*domain.MedicalRecord, error)
	GetMedicalRecordsForPatient(ctx context.Context, patientID int, userID int, userRole string) ([]domain.MedicalRecord, error)
	GetMedicalRecord(ctx context.Context, recordID int, userID int, userRole string) (*domain.MedicalRecord, error)
	UpdateMedicalRecord(ctx context.Context, recordID int, doctorID int, updates map[string]interface{}) (*domain.MedicalRecord, error)
	DeleteMedicalRecord(ctx context.Context, recordID int, doctorID int) error
}

// WaitingListService defines the business logic for the real-time waiting list.
type WaitingListService interface {
	JoinWaitingRoom(ctx context.Context, patientID int) error
	LeaveWaitingRoom(ctx context.Context, patientID int) error
	GetWaitingPatients(ctx context.Context, doctorID int) ([]domain.WaitingList, error)
}

// PrescriptionService defines the business logic for handling digital prescriptions.
type PrescriptionService interface {
	CreatePrescription(ctx context.Context, doctorID, patientID int, appointmentID *int, medications, instructions, diagnosis, notes string, validUntil time.Time) (*domain.Prescription, error)
	GetPrescription(ctx context.Context, prescriptionID, userID int, userRole string) (*domain.Prescription, error)
	GetPrescriptionsForPatient(ctx context.Context, patientID, userID int, userRole string) ([]domain.Prescription, error)
	GetPrescriptionsForDoctor(ctx context.Context, doctorID int) ([]domain.Prescription, error)
	UpdatePrescription(ctx context.Context, prescriptionID, doctorID int, updates map[string]interface{}) (*domain.Prescription, error)
	DeletePrescription(ctx context.Context, prescriptionID, doctorID int) error
}

// MedicalCertificateService defines the business logic for handling medical certificates.
type MedicalCertificateService interface {
	CreateCertificate(ctx context.Context, doctorID, patientID int, appointmentID *int, certType string, days int, startDate time.Time, reason, cid, restrictions, notes string) (*domain.MedicalCertificate, error)
	GetCertificate(ctx context.Context, certificateID, userID int, userRole string) (*domain.MedicalCertificate, error)
	GetCertificatesForPatient(ctx context.Context, patientID, userID int, userRole string) ([]domain.MedicalCertificate, error)
	GetCertificatesForDoctor(ctx context.Context, doctorID int) ([]domain.MedicalCertificate, error)
	DeleteCertificate(ctx context.Context, certificateID, doctorID int) error
}

// ReviewService defines the business logic for handling appointment reviews.
type ReviewService interface {
	CreateReview(ctx context.Context, patientID, appointmentID int, rating int, comment string) (*domain.Review, error)
	GetReview(ctx context.Context, reviewID, userID int, userRole string) (*domain.Review, error)
	GetReviewByAppointment(ctx context.Context, appointmentID, userID int, userRole string) (*domain.Review, error)
	GetReviewsForPatient(ctx context.Context, patientID int) ([]domain.Review, error)
	GetReviewsForDoctor(ctx context.Context, doctorID int) ([]domain.Review, error)
	GetDoctorRating(ctx context.Context, doctorID int) (float64, int, error)
	UpdateReview(ctx context.Context, reviewID, patientID int, rating int, comment string) (*domain.Review, error)
	DeleteReview(ctx context.Context, reviewID, patientID int) error
}
