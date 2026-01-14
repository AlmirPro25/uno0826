package domain

import "time"

// Review represents a patient's review of an appointment.
type Review struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	AppointmentID int       `gorm:"column:appointment_id;not null;uniqueIndex" json:"appointmentId"`
	PatientID     int       `gorm:"column:patient_id;not null" json:"patientId"`
	DoctorID      int       `gorm:"column:doctor_id;not null" json:"doctorId"`
	Rating        int       `gorm:"column:rating;not null" json:"rating"` // 1-5 stars
	Comment       string    `gorm:"column:comment" json:"comment"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Appointment Appointment `gorm:"foreignKey:AppointmentID;references:ID" json:"appointment,omitempty"`
	Patient     User        `gorm:"foreignKey:PatientID;references:ID" json:"patient,omitempty"`
	Doctor      User        `gorm:"foreignKey:DoctorID;references:ID" json:"doctor,omitempty"`
}
