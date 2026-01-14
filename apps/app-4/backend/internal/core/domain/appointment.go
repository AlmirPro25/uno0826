package domain

import "time"

// Appointment represents a scheduled consultation.
type Appointment struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatientID int       `gorm:"column:patient_id;not null" json:"patientId"`
	DoctorID  int       `gorm:"column:doctor_id;not null" json:"doctorId"`
	StartTime time.Time `gorm:"column:start_time;not null" json:"startTime"`
	EndTime   time.Time `gorm:"column:end_time;not null" json:"endTime"`
	Status    string    `gorm:"column:status;default:pending" json:"status"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Patient User `gorm:"foreignKey:PatientID;references:ID" json:"patient"`
	Doctor  User `gorm:"foreignKey:DoctorID;references:ID" json:"doctor"`
}

// AppointmentStatus constants
const (
	StatusPending   = "pending"
	StatusBooked    = "booked"
	StatusCompleted = "completed"
	StatusCancelled = "cancelled"
	StatusNoShow    = "no_show"
)

// Common domain errors
var (
	ErrUnauthorized  = &DomainError{Message: "unauthorized"}
	ErrInvalidStatus = &DomainError{Message: "invalid status"}
	ErrNotFound      = &DomainError{Message: "not found"}
)

// DomainError represents a domain-level error
type DomainError struct {
	Message string
}

func (e *DomainError) Error() string {
	return e.Message
}

// VideoCallInfo represents the connection details for a video call.
type VideoCallInfo struct {
	RoomName string `json:"roomName"`
	Provider string `json:"provider"`
}
