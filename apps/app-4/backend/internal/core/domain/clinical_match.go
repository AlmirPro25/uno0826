package domain

import (
	"time"
)

// ClinicalMatch represents an intelligent match between patient and doctor
type ClinicalMatch struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	PatientID         uint      `json:"patient_id" gorm:"index"`
	DoctorID          *uint     `json:"doctor_id,omitempty" gorm:"index"`
	TriageReportID    *uint     `json:"triage_report_id,omitempty" gorm:"index"`
	AppointmentID     *uint     `json:"appointment_id,omitempty"`
	
	// Patient Input (from conversation/triage)
	ChiefComplaint    string    `json:"chief_complaint"`
	SymptomsSummary   string    `json:"symptoms_summary"`
	UrgencyLevel      string    `json:"urgency_level"` // IMMEDIATE, TODAY, WEEK, FLEXIBLE
	RiskLevel         string    `json:"risk_level"`    // LOW, MODERATE, HIGH, CRITICAL
	
	// AI Classification
	SuggestedSpecialties string  `json:"suggested_specialties"` // JSON array
	CanBeRemote        bool      `json:"can_be_remote"`
	RequiresExamFirst  bool      `json:"requires_exam_first"`
	AIReasoning        string    `json:"ai_reasoning"`
	
	// Match Result
	MatchScore         float64   `json:"match_score"`
	MatchReason        string    `json:"match_reason"`
	AlternativeDoctors string    `json:"alternative_doctors"` // JSON array of doctor IDs
	
	// Status
	Status             string    `json:"status"` // PENDING, MATCHED, ACCEPTED, REJECTED, COMPLETED, EXPIRED
	PatientAccepted    bool      `json:"patient_accepted"`
	DoctorAccepted     bool      `json:"doctor_accepted"`
	
	// Timestamps
	MatchedAt          *time.Time `json:"matched_at,omitempty"`
	AcceptedAt         *time.Time `json:"accepted_at,omitempty"`
	ExpiresAt          *time.Time `json:"expires_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	
	// Relations
	Patient       User          `json:"patient,omitempty" gorm:"foreignKey:PatientID"`
	Doctor        *User         `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
	TriageReport  *TriageReport `json:"triage_report,omitempty" gorm:"foreignKey:TriageReportID"`
	Appointment   *Appointment  `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
}

// DoctorProfile extended profile for matching
type DoctorProfile struct {
	ID                  uint      `json:"id" gorm:"primaryKey"`
	UserID              uint      `json:"user_id" gorm:"uniqueIndex"`
	
	// Professional Info
	Specialties         string    `json:"specialties"` // JSON array - can have multiple
	SubSpecialties      string    `json:"sub_specialties"` // JSON array
	YearsExperience     int       `json:"years_experience"`
	Languages           string    `json:"languages"` // JSON array
	
	// Availability
	AcceptsEmergency    bool      `json:"accepts_emergency"`
	AcceptsTelemedicine bool      `json:"accepts_telemedicine"`
	AvailableNow        bool      `json:"available_now"`
	NextAvailableSlot   *time.Time `json:"next_available_slot,omitempty"`
	
	// Location
	Latitude            *float64  `json:"latitude,omitempty"`
	Longitude           *float64  `json:"longitude,omitempty"`
	MaxDistanceKm       int       `json:"max_distance_km" gorm:"default:50"`
	
	// Performance Metrics
	TotalConsultations  int       `json:"total_consultations" gorm:"default:0"`
	CompletionRate      float64   `json:"completion_rate" gorm:"default:100"`
	AverageRating       float64   `json:"average_rating" gorm:"default:0"`
	TotalReviews        int       `json:"total_reviews" gorm:"default:0"`
	ResponseTimeMinutes int       `json:"response_time_minutes" gorm:"default:30"`
	
	// Preferences
	PreferredAgeGroups  string    `json:"preferred_age_groups"` // JSON array: pediatric, adult, geriatric
	ConditionsExpertise string    `json:"conditions_expertise"` // JSON array of conditions
	
	// Pricing
	ConsultationPrice   float64   `json:"consultation_price" gorm:"default:0"`
	AcceptsInsurance    bool      `json:"accepts_insurance" gorm:"default:true"`
	InsurancePlans      string    `json:"insurance_plans"` // JSON array
	
	// Status
	IsActive            bool      `json:"is_active" gorm:"default:true"`
	IsVerified          bool      `json:"is_verified" gorm:"default:false"`
	
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	
	// Relations
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// MatchRequest represents a patient's request for intelligent matching
type MatchRequest struct {
	// From conversation/input
	Message           string   `json:"message"`           // Free text from patient
	Symptoms          []string `json:"symptoms"`          // Extracted symptoms
	Duration          string   `json:"duration"`          // How long symptoms
	Severity          int      `json:"severity"`          // 1-10 scale
	
	// Preferences
	PreferTelemedicine bool     `json:"prefer_telemedicine"`
	PreferFemaleDoctor bool     `json:"prefer_female_doctor"`
	PreferMaleDoctor   bool     `json:"prefer_male_doctor"`
	MaxWaitMinutes     int      `json:"max_wait_minutes"`
	MaxPriceReais      float64  `json:"max_price_reais"`
	InsurancePlan      string   `json:"insurance_plan"`
	
	// Location
	Latitude           *float64 `json:"latitude,omitempty"`
	Longitude          *float64 `json:"longitude,omitempty"`
	MaxDistanceKm      int      `json:"max_distance_km"`
	
	// Context
	TriageReportID     *uint    `json:"triage_report_id,omitempty"`
	PreviousDoctorID   *uint    `json:"previous_doctor_id,omitempty"` // Prefer same doctor
}

// MatchResult represents the AI matching result
type MatchResult struct {
	Doctor            *User          `json:"doctor"`
	DoctorProfile     *DoctorProfile `json:"doctor_profile"`
	MatchScore        float64        `json:"match_score"`        // 0-100
	MatchReasons      []string       `json:"match_reasons"`
	EstimatedWaitTime int            `json:"estimated_wait_time"` // minutes
	CanStartNow       bool           `json:"can_start_now"`
	NextAvailableSlot *time.Time     `json:"next_available_slot,omitempty"`
	ConsultationType  string         `json:"consultation_type"` // IMMEDIATE, SCHEDULED, TELEMEDICINE
	Price             float64        `json:"price"`
}

// AIClassification represents the AI's analysis of patient input
type AIClassification struct {
	ChiefComplaint       string   `json:"chief_complaint"`
	Symptoms             []string `json:"symptoms"`
	UrgencyLevel         string   `json:"urgency_level"`
	RiskLevel            string   `json:"risk_level"`
	SuggestedSpecialties []string `json:"suggested_specialties"`
	CanBeRemote          bool     `json:"can_be_remote"`
	RequiresExamFirst    bool     `json:"requires_exam_first"`
	RedFlags             []string `json:"red_flags,omitempty"`
	Reasoning            string   `json:"reasoning"`
}

// Match status constants
const (
	MatchStatusPending   = "PENDING"
	MatchStatusMatched   = "MATCHED"
	MatchStatusAccepted  = "ACCEPTED"
	MatchStatusRejected  = "REJECTED"
	MatchStatusCompleted = "COMPLETED"
	MatchStatusExpired   = "EXPIRED"
)

// Urgency level constants
const (
	UrgencyImmediate = "IMMEDIATE" // Emergency, needs now
	UrgencyToday     = "TODAY"     // Should be seen today
	UrgencyWeek      = "WEEK"      // Within a week
	UrgencyFlexible  = "FLEXIBLE"  // Patient chooses
)

// Risk level constants
const (
	RiskLow      = "LOW"
	RiskModerate = "MODERATE"
	RiskHigh     = "HIGH"
	RiskCritical = "CRITICAL"
)
