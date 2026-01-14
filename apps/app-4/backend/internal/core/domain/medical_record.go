package domain

import "time"

// MedicalRecord represents a patient's medical history entry.
type MedicalRecord struct {
	ID               int       `gorm:"primaryKey;autoIncrement"`
	PatientID        int       `gorm:"column:patient_id;not null"`
	DoctorID         int       `gorm:"column:doctor_id;not null"`
	Diagnosis        string    `gorm:"column:diagnosis;not null"`
	Notes            string    `gorm:"column:notes"` // Sensitive data, will be encrypted in service layer
	ConsultationDate time.Time `gorm:"column:consultation_date;autoCreateTime"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	Patient User `gorm:"foreignKey:PatientID;references:ID"`
	Doctor  User `gorm:"foreignKey:DoctorID;references:ID"`
}
