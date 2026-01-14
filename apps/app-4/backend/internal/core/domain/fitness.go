package domain

import (
	"time"
)

// FitnessProfile represents the fitness profile of a user (from NOVA system)
type FitnessProfile struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"uniqueIndex"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Basic Info (synced from NOVA)
	Goal       string  `json:"goal"`        // weight_loss, muscle_gain, maintenance
	HeightCm   float64 `json:"height_cm"`
	WeightKg   float64 `json:"weight_kg"`
	Age        int     `json:"age"`
	Level      int     `json:"level"`       // Gamification level
	TotalXP    int     `json:"total_xp"`

	// Targets
	DailyCaloriesBurnTarget   int `json:"daily_calories_burn_target" gorm:"default:500"`
	DailyCaloriesIntakeTarget int `json:"daily_calories_intake_target" gorm:"default:2000"`
	WeeklyWorkoutTarget       int `json:"weekly_workout_target" gorm:"default:5"`

	// Stats (aggregated)
	TotalWorkouts       int     `json:"total_workouts"`
	TotalWorkoutMinutes int     `json:"total_workout_minutes"`
	TotalCaloriesBurned int     `json:"total_calories_burned"`
	AvgHeartRate        float64 `json:"avg_heart_rate"`
	MaxHeartRate        int     `json:"max_heart_rate"`

	// Streaks
	CurrentStreak int `json:"current_streak"`
	LongestStreak int `json:"longest_streak"`
	LastWorkoutAt *time.Time `json:"last_workout_at,omitempty"`

	// Relations
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// WorkoutSession represents a workout session from NOVA
type WorkoutSession struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	CreatedAt time.Time `json:"created_at"`

	// Session Info
	Date            time.Time `json:"date" gorm:"index"`
	DurationMinutes int       `json:"duration_minutes"`
	CaloriesBurned  int       `json:"calories_burned"`
	WorkoutType     string    `json:"workout_type"` // cardio, strength, flexibility, hiit, mixed
	Focus           string    `json:"focus"`        // legs, arms, core, full_body, etc.
	Intensity       string    `json:"intensity"`    // low, moderate, high

	// Heart Rate Data (from Bluetooth device)
	AvgHeartRate *int `json:"avg_heart_rate,omitempty"`
	MaxHeartRate *int `json:"max_heart_rate,omitempty"`
	MinHeartRate *int `json:"min_heart_rate,omitempty"`

	// Running Data (from Bluetooth sensor)
	DistanceKm *float64 `json:"distance_km,omitempty"`
	AvgSpeed   *float64 `json:"avg_speed,omitempty"`   // km/h
	AvgCadence *int     `json:"avg_cadence,omitempty"` // steps/min

	// AI Analysis
	AIFeedback string `json:"ai_feedback,omitempty"`

	// Mood
	MoodBefore string `json:"mood_before,omitempty"` // energetic, tired, neutral
	MoodAfter  string `json:"mood_after,omitempty"`

	// Source
	Source string `json:"source"` // nova, manual, device
}

// DailyFitnessStats represents daily fitness statistics (synced from NOVA)
type DailyFitnessStats struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	Date      time.Time `json:"date" gorm:"index;uniqueIndex:idx_user_date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Calories
	CaloriesBurned   int `json:"calories_burned"`
	CaloriesConsumed int `json:"calories_consumed"`
	CaloriesNet      int `json:"calories_net"` // consumed - burned

	// Activity
	WorkoutDurationMinutes int    `json:"workout_duration_minutes"`
	WorkoutCount           int    `json:"workout_count"`
	Steps                  int    `json:"steps"`
	ActiveMinutes          int    `json:"active_minutes"`

	// Mood
	Mood string `json:"mood"` // energetic, tired, neutral

	// Source
	Source string `json:"source"` // nova, manual
}

// NutritionLog represents a nutrition/food log entry
type NutritionLog struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	CreatedAt time.Time `json:"created_at"`

	// Meal Info
	Date     time.Time `json:"date" gorm:"index"`
	MealType string    `json:"meal_type"` // breakfast, lunch, dinner, snack

	// Food Analysis (from NOVA AI)
	FoodDescription string `json:"food_description"`
	ImageURL        string `json:"image_url,omitempty"`

	// Nutritional Data
	Calories      int     `json:"calories"`
	ProteinG      float64 `json:"protein_g"`
	CarbsG        float64 `json:"carbs_g"`
	FatG          float64 `json:"fat_g"`
	FiberG        float64 `json:"fiber_g"`
	SugarG        float64 `json:"sugar_g"`

	// AI Analysis
	NutritionalQuality string `json:"nutritional_quality"` // excellent, good, moderate, poor
	AIRecommendation   string `json:"ai_recommendation,omitempty"`

	// Source
	Source string `json:"source"` // nova_ai, manual
}

// BodyAnalysis represents a body composition analysis from NOVA
type BodyAnalysis struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	CreatedAt time.Time `json:"created_at"`

	// Analysis Type
	AnalysisType string `json:"analysis_type"` // posture, body_composition

	// Results
	Summary        string `json:"summary"`
	Metrics        string `json:"metrics"` // JSON array of {label, value, unit}
	Recommendation string `json:"recommendation"`

	// Image (optional)
	ImageURL string `json:"image_url,omitempty"`

	// Source
	Source string `json:"source"` // nova_ai
}

// WeeklyFitnessPlan represents an AI-generated weekly fitness plan
type WeeklyFitnessPlan struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	CreatedAt time.Time `json:"created_at"`

	// Plan Info
	Title     string    `json:"title"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`

	// Plan Days (JSON)
	Days string `json:"days"` // JSON array of DailyPlan

	// Generated by
	GeneratedBy string `json:"generated_by"` // nova_ai, doctor, user
}

// DailyPlanItem represents a single day in a weekly plan
type DailyPlanItem struct {
	Day            string `json:"day"`             // Segunda, Terça, etc.
	Focus          string `json:"focus"`           // Legs & Core, Upper Body, etc.
	Workout        string `json:"workout"`         // Description
	NutritionFocus string `json:"nutrition_focus"` // High Carb, High Protein, etc.
	Duration       int    `json:"duration"`        // minutes
}

// FitnessAchievement represents a fitness achievement/badge
type FitnessAchievement struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"index"`
	Type        string    `json:"type"`        // streak, milestone, challenge
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	XPAwarded   int       `json:"xp_awarded"`
	EarnedAt    time.Time `json:"earned_at"`
}

// HeartRateReading represents a heart rate reading from Bluetooth device
type HeartRateReading struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index"`
	SessionID *uint     `json:"session_id,omitempty" gorm:"index"` // Optional link to workout
	Timestamp time.Time `json:"timestamp" gorm:"index"`
	BPM       int       `json:"bpm"`
	Source    string    `json:"source"` // bluetooth, manual
}
