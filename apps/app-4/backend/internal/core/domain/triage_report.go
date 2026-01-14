package domain

import "time"

// TriageReport represents an AI-generated triage report from MediCore
type TriageReport struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	PatientID int       `gorm:"column:patient_id;not null;index" json:"patient_id"`
	DoctorID  *int      `gorm:"column:doctor_id;index" json:"doctor_id,omitempty"` // Assigned doctor (optional)
	ClinicID  *int      `gorm:"column:clinic_id;index" json:"clinic_id,omitempty"` // Assigned clinic (optional)

	// Triage Data
	PatientComplaint        string `gorm:"column:patient_complaint;type:text;not null" json:"patient_complaint"`
	HistoryOfPresentIllness string `gorm:"column:history_of_present_illness;type:text" json:"history_of_present_illness"`
	VitalSignsNote          string `gorm:"column:vital_signs_note;type:text" json:"vital_signs_note"`
	SuspectedDiagnosis      string `gorm:"column:suspected_diagnosis;type:text" json:"suspected_diagnosis"` // JSON array
	RecommendedSpecialty    string `gorm:"column:recommended_specialty;not null" json:"recommended_specialty"`
	Priority                string `gorm:"column:priority;not null;index" json:"priority"` // Manchester Protocol
	Reasoning               string `gorm:"column:reasoning;type:text" json:"reasoning"`

	// Session Data
	Transcript    string `gorm:"column:transcript;type:text" json:"transcript,omitempty"`     // Full conversation
	SessionType   string `gorm:"column:session_type;default:'voice'" json:"session_type"`    // voice, text, video
	AIModel       string `gorm:"column:ai_model" json:"ai_model,omitempty"`                  // Model used
	SessionLength int    `gorm:"column:session_length" json:"session_length,omitempty"`      // Duration in seconds

	// Status & Workflow
	Status           string     `gorm:"column:status;default:'pending';index" json:"status"` // pending, reviewed, accepted, referred, completed
	ReviewedByID     *int       `gorm:"column:reviewed_by_id" json:"reviewed_by_id,omitempty"`
	ReviewedAt       *time.Time `gorm:"column:reviewed_at" json:"reviewed_at,omitempty"`
	ReviewNotes      string     `gorm:"column:review_notes;type:text" json:"review_notes,omitempty"`
	AppointmentID    *int       `gorm:"column:appointment_id" json:"appointment_id,omitempty"` // If converted to appointment
	MedicalRecordID  *int       `gorm:"column:medical_record_id" json:"medical_record_id,omitempty"` // If linked to record

	// Geolocation (for clinic matching)
	Latitude  *float64 `gorm:"column:latitude" json:"latitude,omitempty"`
	Longitude *float64 `gorm:"column:longitude" json:"longitude,omitempty"`

	// Timestamps
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Patient    User         `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
	Doctor     *User        `gorm:"foreignKey:DoctorID" json:"doctor,omitempty"`
	ReviewedBy *User        `gorm:"foreignKey:ReviewedByID" json:"reviewed_by,omitempty"`
	Appointment *Appointment `gorm:"foreignKey:AppointmentID" json:"appointment,omitempty"`
}

// TableName specifies the table name
func (TriageReport) TableName() string {
	return "triage_reports"
}

// Triage Status constants
const (
	TriageStatusPending   = "pending"   // Awaiting doctor review
	TriageStatusReviewed  = "reviewed"  // Doctor reviewed
	TriageStatusAccepted  = "accepted"  // Doctor accepted the case
	TriageStatusReferred  = "referred"  // Referred to another specialty/clinic
	TriageStatusCompleted = "completed" // Case closed
	TriageStatusCancelled = "cancelled" // Patient cancelled
)

// Manchester Priority constants
const (
	PriorityEmergency   = "Emergência (Vermelho)"
	PriorityVeryUrgent  = "Muito Urgente (Laranja)"
	PriorityUrgent      = "Urgente (Amarelo)"
	PriorityLessUrgent  = "Pouco Urgente (Verde)"
	PriorityNonUrgent   = "Não Urgente (Azul)"
)

// Session Type constants
const (
	SessionTypeVoice = "voice"
	SessionTypeText  = "text"
	SessionTypeVideo = "video"
)
