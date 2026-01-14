package domain

import (
	"time"
)

// HealthProfile represents the complete health profile of a patient
// This is the central data structure that connects all health data
type HealthProfile struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"uniqueIndex"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Basic Info (extracted from triage/conversations)
	FullName    string     `json:"full_name"`
	BirthDate   *time.Time `json:"birth_date,omitempty"`
	Gender      string     `json:"gender,omitempty"`      // male, female, other, prefer_not_say
	BloodType   string     `json:"blood_type,omitempty"`  // A+, A-, B+, B-, AB+, AB-, O+, O-

	// Anthropometric Data
	HeightCm       float64    `json:"height_cm"`
	WeightKg       float64    `json:"weight_kg"`
	BMI            float64    `json:"bmi"`
	BodyFatPercent *float64   `json:"body_fat_percent,omitempty"`
	LastWeightDate *time.Time `json:"last_weight_date,omitempty"`

	// Health Scores (0-100)
	OverallScore    int `json:"overall_score" gorm:"default:50"`
	SleepScore      int `json:"sleep_score" gorm:"default:50"`
	NutritionScore  int `json:"nutrition_score" gorm:"default:50"`
	ActivityScore   int `json:"activity_score" gorm:"default:50"`
	HydrationScore  int `json:"hydration_score" gorm:"default:50"`
	MentalScore     int `json:"mental_score" gorm:"default:50"`

	// Daily Targets
	WaterTargetMl     int `json:"water_target_ml" gorm:"default:2000"`
	StepsTarget       int `json:"steps_target" gorm:"default:10000"`
	SleepTargetHours  int `json:"sleep_target_hours" gorm:"default:8"`
	CaloriesTarget    int `json:"calories_target" gorm:"default:2000"`

	// Medical History (JSON arrays)
	ChronicConditions string `json:"chronic_conditions"` // JSON array
	Allergies         string `json:"allergies"`          // JSON array
	FamilyHistory     string `json:"family_history"`     // JSON array
	Surgeries         string `json:"surgeries"`          // JSON array

	// Lifestyle
	SmokingStatus   string `json:"smoking_status"`   // never, former, current
	AlcoholUse      string `json:"alcohol_use"`      // never, occasional, moderate, heavy
	ExerciseLevel   string `json:"exercise_level"`   // sedentary, light, moderate, active, very_active
	DietType        string `json:"diet_type"`        // omnivore, vegetarian, vegan, pescatarian, other

	// Goals (JSON)
	HealthGoals string `json:"health_goals"` // JSON array of goals

	// Last Triage Data
	LastTriageID   *uint      `json:"last_triage_id,omitempty"`
	LastTriageDate *time.Time `json:"last_triage_date,omitempty"`

	// Profile Completeness (0-100)
	ProfileCompleteness int `json:"profile_completeness" gorm:"default:0"`

	// Relations
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// DailyCheckIn represents a daily health check-in from the user
type DailyCheckIn struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	Date      time.Time `json:"date" gorm:"index"`
	CreatedAt time.Time `json:"created_at"`

	// Sleep
	SleepHours   float64 `json:"sleep_hours"`
	SleepQuality int     `json:"sleep_quality"` // 1-5
	WokeUpTime   string  `json:"woke_up_time"`
	BedTime      string  `json:"bed_time"`

	// Activity
	Steps          int     `json:"steps"`
	ActiveMinutes  int     `json:"active_minutes"`
	ExerciseType   string  `json:"exercise_type,omitempty"`
	CaloriesBurned int     `json:"calories_burned"`

	// Nutrition
	CaloriesConsumed int    `json:"calories_consumed"`
	WaterMl          int    `json:"water_ml"`
	MealsCount       int    `json:"meals_count"`
	MealsLog         string `json:"meals_log"` // JSON array of meals

	// Vitals (if measured)
	WeightKg         *float64 `json:"weight_kg,omitempty"`
	BloodPressureSys *int     `json:"blood_pressure_sys,omitempty"`
	BloodPressureDia *int     `json:"blood_pressure_dia,omitempty"`
	HeartRate        *int     `json:"heart_rate,omitempty"`
	BloodGlucose     *float64 `json:"blood_glucose,omitempty"`

	// Mood & Symptoms
	MoodScore    int    `json:"mood_score"` // 1-5
	EnergyLevel  int    `json:"energy_level"` // 1-5
	StressLevel  int    `json:"stress_level"` // 1-5
	Symptoms     string `json:"symptoms"`     // JSON array
	Notes        string `json:"notes"`

	// AI Analysis
	AIInsights     string `json:"ai_insights"`      // AI-generated insights
	AIRecommendations string `json:"ai_recommendations"` // AI recommendations
	RiskFlags      string `json:"risk_flags"`       // JSON array of detected risks

	// Source
	Source string `json:"source"` // manual, triage, sensor, ai_chat
}

// HealthMetric represents a single health metric measurement
type HealthMetric struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	Type      string    `json:"type" gorm:"index"` // weight, steps, water, sleep, calories, heart_rate, etc.
	Value     float64   `json:"value"`
	Unit      string    `json:"unit"`
	Date      time.Time `json:"date" gorm:"index"`
	Source    string    `json:"source"` // manual, triage, sensor, ai_chat
	CreatedAt time.Time `json:"created_at"`
}

// Medication represents a medication the user is taking
type Medication struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	UserID      uint       `json:"user_id" gorm:"index"`
	Name        string     `json:"name"`
	Dosage      string     `json:"dosage"`
	Frequency   string     `json:"frequency"` // daily, twice_daily, weekly, as_needed
	Times       string     `json:"times"`     // JSON array of times ["08:00", "20:00"]
	StartDate   time.Time  `json:"start_date"`
	EndDate     *time.Time `json:"end_date,omitempty"`
	Instructions string    `json:"instructions"`
	PrescribedBy *uint     `json:"prescribed_by,omitempty"` // Doctor ID
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// MedicationLog represents when a user took their medication
type MedicationLog struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	MedicationID uint      `json:"medication_id" gorm:"index"`
	UserID       uint      `json:"user_id" gorm:"index"`
	TakenAt      time.Time `json:"taken_at"`
	ScheduledFor time.Time `json:"scheduled_for"`
	Status       string    `json:"status"` // taken, missed, skipped
	Notes        string    `json:"notes,omitempty"`
}

// Vaccine represents a vaccine record
type Vaccine struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	UserID       uint       `json:"user_id" gorm:"index"`
	Name         string     `json:"name"`
	Manufacturer string     `json:"manufacturer,omitempty"`
	Batch        string     `json:"batch,omitempty"`
	DoseNumber   int        `json:"dose_number"`
	TotalDoses   int        `json:"total_doses"`
	AppliedAt    time.Time  `json:"applied_at"`
	NextDoseAt   *time.Time `json:"next_dose_at,omitempty"`
	Location     string     `json:"location,omitempty"`
	AppliedBy    string     `json:"applied_by,omitempty"`
	Notes        string     `json:"notes,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

// Exam represents a medical exam record
type Exam struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	UserID      uint       `json:"user_id" gorm:"index"`
	Name        string     `json:"name"`
	Type        string     `json:"type"` // blood, imaging, other
	RequestedBy *uint      `json:"requested_by,omitempty"` // Doctor ID
	RequestedAt *time.Time `json:"requested_at,omitempty"`
	ScheduledAt *time.Time `json:"scheduled_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	ResultURL   string     `json:"result_url,omitempty"`
	Results     string     `json:"results,omitempty"` // JSON or text
	Status      string     `json:"status"`            // pending, scheduled, completed, cancelled
	Notes       string     `json:"notes,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// HealthGoal represents a health goal set by user or AI
type HealthGoal struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	UserID      uint       `json:"user_id" gorm:"index"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Category    string     `json:"category"` // weight, activity, nutrition, sleep, medication, other
	TargetValue float64    `json:"target_value"`
	CurrentValue float64   `json:"current_value"`
	Unit        string     `json:"unit"`
	StartDate   time.Time  `json:"start_date"`
	TargetDate  time.Time  `json:"target_date"`
	Status      string     `json:"status"` // active, completed, abandoned
	Progress    int        `json:"progress"` // 0-100
	SetBy       string     `json:"set_by"`   // user, ai, doctor
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Achievement represents a health achievement/badge
type Achievement struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"index"`
	Type        string    `json:"type"`        // streak, milestone, challenge
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	EarnedAt    time.Time `json:"earned_at"`
	Points      int       `json:"points"`
}

// TriageExtractedData represents structured data extracted from triage by AI
type TriageExtractedData struct {
	// Personal Info
	Age              *int     `json:"age,omitempty"`
	Gender           string   `json:"gender,omitempty"`
	WeightKg         *float64 `json:"weight_kg,omitempty"`
	HeightCm         *float64 `json:"height_cm,omitempty"`

	// Symptoms & Conditions
	CurrentSymptoms  []string `json:"current_symptoms"`
	ChronicConditions []string `json:"chronic_conditions"`
	Allergies        []string `json:"allergies"`
	
	// Medications
	CurrentMedications []ExtractedMedication `json:"current_medications"`
	
	// Lifestyle
	SmokingStatus    string   `json:"smoking_status"`
	AlcoholUse       string   `json:"alcohol_use"`
	ExerciseLevel    string   `json:"exercise_level"`
	SleepHours       *float64 `json:"sleep_hours,omitempty"`
	
	// Vitals mentioned
	BloodPressure    string   `json:"blood_pressure,omitempty"`
	HeartRate        *int     `json:"heart_rate,omitempty"`
	
	// Goals mentioned
	HealthGoals      []string `json:"health_goals"`
	
	// Risk factors
	RiskFactors      []string `json:"risk_factors"`
}

type ExtractedMedication struct {
	Name     string `json:"name"`
	Dosage   string `json:"dosage"`
	Frequency string `json:"frequency"`
}
