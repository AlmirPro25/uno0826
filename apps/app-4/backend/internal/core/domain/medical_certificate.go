package domain

import "time"

// MedicalCertificate represents a digital medical certificate (atestado médico).
type MedicalCertificate struct {
	ID            int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatientID     int       `gorm:"column:patient_id;not null" json:"patientId"`
	DoctorID      int       `gorm:"column:doctor_id;not null" json:"doctorId"`
	AppointmentID *int      `gorm:"column:appointment_id" json:"appointmentId,omitempty"`
	Type          string    `gorm:"column:type;not null" json:"type"`                   // "absence", "fitness", "medical_leave"
	Days          int       `gorm:"column:days;not null" json:"days"`                   // Number of days
	StartDate     time.Time `gorm:"column:start_date;not null" json:"startDate"`        // Start date of certificate
	EndDate       time.Time `gorm:"column:end_date;not null" json:"endDate"`            // End date of certificate
	Reason        string    `gorm:"column:reason" json:"reason"`                        // General reason (not detailed diagnosis for privacy)
	CID           string    `gorm:"column:cid" json:"cid,omitempty"`                    // CID-10 code (optional)
	Restrictions  string    `gorm:"column:restrictions" json:"restrictions,omitempty"`  // Activity restrictions
	Notes         string    `gorm:"column:notes" json:"notes,omitempty"`                // Additional notes
	IssuedAt      time.Time `gorm:"column:issued_at;autoCreateTime" json:"issuedAt"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Patient     User         `gorm:"foreignKey:PatientID;references:ID" json:"patient"`
	Doctor      User         `gorm:"foreignKey:DoctorID;references:ID" json:"doctor"`
	Appointment *Appointment `gorm:"foreignKey:AppointmentID;references:ID" json:"appointment,omitempty"`
}

// Certificate types
const (
	CertificateTypeAbsence      = "absence"       // Atestado de comparecimento
	CertificateTypeMedicalLeave = "medical_leave" // Atestado médico (afastamento)
	CertificateTypeFitness      = "fitness"       // Atestado de aptidão
)
