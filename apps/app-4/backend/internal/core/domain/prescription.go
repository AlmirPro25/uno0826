package domain

import "time"

// Prescription represents a digital medical prescription.
type Prescription struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatientID     int       `gorm:"column:patient_id;not null" json:"patientId"`
	DoctorID      int       `gorm:"column:doctor_id;not null" json:"doctorId"`
	AppointmentID *int      `gorm:"column:appointment_id" json:"appointmentId,omitempty"`
	Medications   string    `gorm:"column:medications;type:text;not null" json:"medications"` // JSON array of medications
	Instructions  string    `gorm:"column:instructions;type:text" json:"instructions"`
	Diagnosis     string    `gorm:"column:diagnosis" json:"diagnosis"`
	Notes         string    `gorm:"column:notes" json:"notes"`
	ValidUntil    time.Time `gorm:"column:valid_until" json:"validUntil"`
	IssuedAt      time.Time `gorm:"column:issued_at;autoCreateTime" json:"issuedAt"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Patient     User         `gorm:"foreignKey:PatientID;references:ID" json:"patient"`
	Doctor      User         `gorm:"foreignKey:DoctorID;references:ID" json:"doctor"`
	Appointment *Appointment `gorm:"foreignKey:AppointmentID;references:ID" json:"appointment,omitempty"`
}

// PrescriptionMedication represents a single medication in a prescription.
type PrescriptionMedication struct {
	Name        string `json:"name"`
	Dosage      string `json:"dosage"`
	Frequency   string `json:"frequency"`
	Duration    string `json:"duration"`
	Quantity    string `json:"quantity"`
	Instructions string `json:"instructions,omitempty"`
}
