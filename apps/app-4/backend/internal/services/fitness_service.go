package services

import (
	"context"
	"encoding/json"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// FitnessService handles fitness data management and sync with NOVA
type FitnessService struct {
	db                  *gorm.DB
	healthIntelligence  *HealthIntelligenceService
}

// NewFitnessService creates a new fitness service
func NewFitnessService(db *gorm.DB, healthIntelligence *HealthIntelligenceService) *FitnessService {
	return &FitnessService{
		db:                 db,
		healthIntelligence: healthIntelligence,
	}
}

// GetOrCreateProfile gets or creates a fitness profile for a user
func (s *FitnessService) GetOrCreateProfile(ctx context.Context, userID uint) (*domain.FitnessProfile, error) {
	var profile domain.FitnessProfile
	err := s.db.Where("user_id = ?", userID).First(&profile).Error
	if err == gorm.ErrRecordNotFound {
		profile = domain.FitnessProfile{
			UserID: userID,
			Goal:   "maintenance",
			Level:  1,
		}
		if err := s.db.Create(&profile).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	return &profile, nil
}

// UpdateProfile updates a fitness profile
func (s *FitnessService) UpdateProfile(ctx context.Context, profile *domain.FitnessProfile) error {
	return s.db.Save(profile).Error
}

// SyncFromNOVA syncs data from NOVA app (bulk sync)
func (s *FitnessService) SyncFromNOVA(ctx context.Context, userID uint, data *NOVASyncData) error {
	// Update fitness profile
	profile, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if data.Profile != nil {
		profile.Goal = data.Profile.Goal
		profile.HeightCm = data.Profile.HeightCm
		profile.WeightKg = data.Profile.WeightKg
		profile.Age = data.Profile.Age
		profile.Level = data.Profile.Level
		s.db.Save(profile)

		// Also update health profile
		s.syncToHealthProfile(ctx, userID, data.Profile)
	}

	// Sync daily stats
	for _, stat := range data.DailyStats {
		s.UpsertDailyStats(ctx, userID, &stat)
	}

	// Sync workout sessions
	for _, session := range data.WorkoutSessions {
		session.UserID = userID
		s.CreateWorkoutSession(ctx, &session)
	}

	// Sync nutrition logs
	for _, log := range data.NutritionLogs {
		log.UserID = userID
		s.CreateNutritionLog(ctx, &log)
	}

	// Sync body analyses
	for _, analysis := range data.BodyAnalyses {
		analysis.UserID = userID
		s.CreateBodyAnalysis(ctx, &analysis)
	}

	// Sync active plan
	if data.ActivePlan != nil {
		data.ActivePlan.UserID = userID
		s.SaveWeeklyPlan(ctx, data.ActivePlan)
	}

	// Recalculate stats
	s.RecalculateStats(ctx, userID)

	return nil
}

// syncToHealthProfile syncs fitness data to health profile
func (s *FitnessService) syncToHealthProfile(ctx context.Context, userID uint, novaProfile *NOVAProfile) {
	healthProfile, err := s.healthIntelligence.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return
	}

	// Update health profile with fitness data
	if novaProfile.HeightCm > 0 {
		healthProfile.HeightCm = novaProfile.HeightCm
	}
	if novaProfile.WeightKg > 0 {
		healthProfile.WeightKg = novaProfile.WeightKg
		now := time.Now()
		healthProfile.LastWeightDate = &now
	}

	// Map exercise level based on goal and level
	if novaProfile.Level >= 5 {
		healthProfile.ExerciseLevel = "very_active"
	} else if novaProfile.Level >= 3 {
		healthProfile.ExerciseLevel = "active"
	} else if novaProfile.Level >= 2 {
		healthProfile.ExerciseLevel = "moderate"
	} else {
		healthProfile.ExerciseLevel = "light"
	}

	s.healthIntelligence.UpdateProfile(ctx, healthProfile)
}

// UpsertDailyStats creates or updates daily fitness stats
func (s *FitnessService) UpsertDailyStats(ctx context.Context, userID uint, stats *domain.DailyFitnessStats) error {
	var existing domain.DailyFitnessStats
	date := stats.Date.Truncate(24 * time.Hour)
	
	err := s.db.Where("user_id = ? AND date = ?", userID, date).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		stats.UserID = userID
		stats.Date = date
		stats.CaloriesNet = stats.CaloriesConsumed - stats.CaloriesBurned
		return s.db.Create(stats).Error
	} else if err != nil {
		return err
	}

	// Update existing
	existing.CaloriesBurned = stats.CaloriesBurned
	existing.CaloriesConsumed = stats.CaloriesConsumed
	existing.CaloriesNet = stats.CaloriesConsumed - stats.CaloriesBurned
	existing.WorkoutDurationMinutes = stats.WorkoutDurationMinutes
	existing.WorkoutCount = stats.WorkoutCount
	existing.Steps = stats.Steps
	existing.ActiveMinutes = stats.ActiveMinutes
	existing.Mood = stats.Mood
	existing.Source = stats.Source

	return s.db.Save(&existing).Error
}

// GetDailyStats gets daily stats for a date range
func (s *FitnessService) GetDailyStats(ctx context.Context, userID uint, days int) ([]domain.DailyFitnessStats, error) {
	var stats []domain.DailyFitnessStats
	startDate := time.Now().AddDate(0, 0, -days)
	err := s.db.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date DESC").Find(&stats).Error
	return stats, err
}

// CreateWorkoutSession creates a new workout session
func (s *FitnessService) CreateWorkoutSession(ctx context.Context, session *domain.WorkoutSession) error {
	// Check for duplicate (same user, same date, similar time)
	var existing domain.WorkoutSession
	startTime := session.Date.Add(-30 * time.Minute)
	endTime := session.Date.Add(30 * time.Minute)
	
	err := s.db.Where("user_id = ? AND date BETWEEN ? AND ?", session.UserID, startTime, endTime).First(&existing).Error
	if err == nil {
		// Update existing instead
		session.ID = existing.ID
	}

	if err := s.db.Save(session).Error; err != nil {
		return err
	}

	// Update profile stats
	s.updateProfileAfterWorkout(ctx, session.UserID)

	// Sync to health check-in
	s.syncWorkoutToHealthCheckIn(ctx, session)

	return nil
}

// updateProfileAfterWorkout updates profile stats after a workout
func (s *FitnessService) updateProfileAfterWorkout(ctx context.Context, userID uint) {
	profile, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return
	}

	// Count total workouts
	var count int64
	s.db.Model(&domain.WorkoutSession{}).Where("user_id = ?", userID).Count(&count)
	profile.TotalWorkouts = int(count)

	// Sum total minutes and calories
	var result struct {
		TotalMinutes  int
		TotalCalories int
	}
	s.db.Model(&domain.WorkoutSession{}).
		Select("COALESCE(SUM(duration_minutes), 0) as total_minutes, COALESCE(SUM(calories_burned), 0) as total_calories").
		Where("user_id = ?", userID).
		Scan(&result)
	
	profile.TotalWorkoutMinutes = result.TotalMinutes
	profile.TotalCaloriesBurned = result.TotalCalories

	// Update last workout
	var lastSession domain.WorkoutSession
	if err := s.db.Where("user_id = ?", userID).Order("date DESC").First(&lastSession).Error; err == nil {
		profile.LastWorkoutAt = &lastSession.Date
	}

	// Calculate streak
	profile.CurrentStreak = s.calculateStreak(ctx, userID)
	if profile.CurrentStreak > profile.LongestStreak {
		profile.LongestStreak = profile.CurrentStreak
	}

	s.db.Save(profile)
}

// calculateStreak calculates current workout streak
func (s *FitnessService) calculateStreak(ctx context.Context, userID uint) int {
	var sessions []domain.WorkoutSession
	s.db.Where("user_id = ?", userID).Order("date DESC").Limit(30).Find(&sessions)

	if len(sessions) == 0 {
		return 0
	}

	streak := 0
	today := time.Now().Truncate(24 * time.Hour)
	lastDate := today

	for _, session := range sessions {
		sessionDate := session.Date.Truncate(24 * time.Hour)
		diff := lastDate.Sub(sessionDate).Hours() / 24

		if diff <= 1 {
			streak++
			lastDate = sessionDate
		} else {
			break
		}
	}

	return streak
}

// syncWorkoutToHealthCheckIn syncs workout data to health check-in
func (s *FitnessService) syncWorkoutToHealthCheckIn(ctx context.Context, session *domain.WorkoutSession) {
	checkIn, _ := s.healthIntelligence.GetDailyCheckIn(ctx, session.UserID, session.Date)
	if checkIn == nil {
		checkIn = &domain.DailyCheckIn{
			UserID: session.UserID,
			Date:   session.Date,
			Source: "nova",
		}
	}

	checkIn.ActiveMinutes += session.DurationMinutes
	checkIn.CaloriesBurned += session.CaloriesBurned
	checkIn.ExerciseType = session.WorkoutType

	if session.AvgHeartRate != nil {
		checkIn.HeartRate = session.AvgHeartRate
	}

	s.healthIntelligence.CreateDailyCheckIn(ctx, checkIn)
}

// GetWorkoutSessions gets workout sessions for a user
func (s *FitnessService) GetWorkoutSessions(ctx context.Context, userID uint, days int) ([]domain.WorkoutSession, error) {
	var sessions []domain.WorkoutSession
	startDate := time.Now().AddDate(0, 0, -days)
	err := s.db.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date DESC").Find(&sessions).Error
	return sessions, err
}

// CreateNutritionLog creates a nutrition log entry
func (s *FitnessService) CreateNutritionLog(ctx context.Context, log *domain.NutritionLog) error {
	return s.db.Create(log).Error
}

// GetNutritionLogs gets nutrition logs for a user
func (s *FitnessService) GetNutritionLogs(ctx context.Context, userID uint, days int) ([]domain.NutritionLog, error) {
	var logs []domain.NutritionLog
	startDate := time.Now().AddDate(0, 0, -days)
	err := s.db.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date DESC").Find(&logs).Error
	return logs, err
}

// CreateBodyAnalysis creates a body analysis entry
func (s *FitnessService) CreateBodyAnalysis(ctx context.Context, analysis *domain.BodyAnalysis) error {
	return s.db.Create(analysis).Error
}

// GetBodyAnalyses gets body analyses for a user
func (s *FitnessService) GetBodyAnalyses(ctx context.Context, userID uint, limit int) ([]domain.BodyAnalysis, error) {
	var analyses []domain.BodyAnalysis
	err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").Limit(limit).Find(&analyses).Error
	return analyses, err
}

// SaveWeeklyPlan saves a weekly fitness plan
func (s *FitnessService) SaveWeeklyPlan(ctx context.Context, plan *domain.WeeklyFitnessPlan) error {
	// Deactivate previous plans
	s.db.Model(&domain.WeeklyFitnessPlan{}).
		Where("user_id = ? AND is_active = true", plan.UserID).
		Update("is_active", false)

	plan.IsActive = true
	return s.db.Create(plan).Error
}

// GetActivePlan gets the active weekly plan for a user
func (s *FitnessService) GetActivePlan(ctx context.Context, userID uint) (*domain.WeeklyFitnessPlan, error) {
	var plan domain.WeeklyFitnessPlan
	err := s.db.Where("user_id = ? AND is_active = true", userID).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

// RecordHeartRate records a heart rate reading
func (s *FitnessService) RecordHeartRate(ctx context.Context, reading *domain.HeartRateReading) error {
	reading.Timestamp = time.Now()
	return s.db.Create(reading).Error
}

// GetHeartRateHistory gets heart rate history
func (s *FitnessService) GetHeartRateHistory(ctx context.Context, userID uint, hours int) ([]domain.HeartRateReading, error) {
	var readings []domain.HeartRateReading
	startTime := time.Now().Add(-time.Duration(hours) * time.Hour)
	err := s.db.Where("user_id = ? AND timestamp >= ?", userID, startTime).
		Order("timestamp DESC").Find(&readings).Error
	return readings, err
}

// RecalculateStats recalculates all fitness stats for a user
func (s *FitnessService) RecalculateStats(ctx context.Context, userID uint) error {
	profile, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	// Total workouts
	var workoutCount int64
	s.db.Model(&domain.WorkoutSession{}).Where("user_id = ?", userID).Count(&workoutCount)
	profile.TotalWorkouts = int(workoutCount)

	// Total minutes and calories
	var totals struct {
		Minutes  int
		Calories int
	}
	s.db.Model(&domain.WorkoutSession{}).
		Select("COALESCE(SUM(duration_minutes), 0) as minutes, COALESCE(SUM(calories_burned), 0) as calories").
		Where("user_id = ?", userID).
		Scan(&totals)
	profile.TotalWorkoutMinutes = totals.Minutes
	profile.TotalCaloriesBurned = totals.Calories

	// Average heart rate
	var hrStats struct {
		Avg float64
		Max int
	}
	s.db.Model(&domain.WorkoutSession{}).
		Select("COALESCE(AVG(avg_heart_rate), 0) as avg, COALESCE(MAX(max_heart_rate), 0) as max").
		Where("user_id = ? AND avg_heart_rate IS NOT NULL", userID).
		Scan(&hrStats)
	profile.AvgHeartRate = hrStats.Avg
	profile.MaxHeartRate = hrStats.Max

	// Streak
	profile.CurrentStreak = s.calculateStreak(ctx, userID)
	if profile.CurrentStreak > profile.LongestStreak {
		profile.LongestStreak = profile.CurrentStreak
	}

	return s.db.Save(profile).Error
}

// GetFitnessSummary gets a complete fitness summary for a user
func (s *FitnessService) GetFitnessSummary(ctx context.Context, userID uint) (map[string]interface{}, error) {
	profile, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Get this week's stats
	weekStats, _ := s.GetDailyStats(ctx, userID, 7)
	
	// Calculate weekly totals
	var weeklyCaloriesBurned, weeklyWorkoutMinutes, weeklyWorkouts int
	for _, stat := range weekStats {
		weeklyCaloriesBurned += stat.CaloriesBurned
		weeklyWorkoutMinutes += stat.WorkoutDurationMinutes
		weeklyWorkouts += stat.WorkoutCount
	}

	// Get today's stats
	var todayStats *domain.DailyFitnessStats
	today := time.Now().Truncate(24 * time.Hour)
	for _, stat := range weekStats {
		if stat.Date.Truncate(24 * time.Hour).Equal(today) {
			todayStats = &stat
			break
		}
	}

	// Get active plan
	activePlan, _ := s.GetActivePlan(ctx, userID)

	// Get recent workouts
	recentWorkouts, _ := s.GetWorkoutSessions(ctx, userID, 7)

	// Get achievements count
	var achievementsCount int64
	s.db.Model(&domain.FitnessAchievement{}).Where("user_id = ?", userID).Count(&achievementsCount)

	return map[string]interface{}{
		"profile":              profile,
		"todayStats":           todayStats,
		"weekStats":            weekStats,
		"weeklyCaloriesBurned": weeklyCaloriesBurned,
		"weeklyWorkoutMinutes": weeklyWorkoutMinutes,
		"weeklyWorkouts":       weeklyWorkouts,
		"activePlan":           activePlan,
		"recentWorkouts":       recentWorkouts,
		"achievements":         achievementsCount,
		"currentStreak":        profile.CurrentStreak,
		"longestStreak":        profile.LongestStreak,
	}, nil
}

// AwardAchievement awards a fitness achievement
func (s *FitnessService) AwardAchievement(ctx context.Context, achievement *domain.FitnessAchievement) error {
	// Check if already awarded
	var existing domain.FitnessAchievement
	err := s.db.Where("user_id = ? AND name = ?", achievement.UserID, achievement.Name).First(&existing).Error
	if err == nil {
		return nil // Already awarded
	}

	achievement.EarnedAt = time.Now()
	if err := s.db.Create(achievement).Error; err != nil {
		return err
	}

	// Add XP to profile
	profile, _ := s.GetOrCreateProfile(ctx, achievement.UserID)
	if profile != nil {
		profile.TotalXP += achievement.XPAwarded
		// Level up every 1000 XP
		profile.Level = (profile.TotalXP / 1000) + 1
		s.db.Save(profile)
	}

	return nil
}

// GetAchievements gets fitness achievements for a user
func (s *FitnessService) GetAchievements(ctx context.Context, userID uint) ([]domain.FitnessAchievement, error) {
	var achievements []domain.FitnessAchievement
	err := s.db.Where("user_id = ?", userID).Order("earned_at DESC").Find(&achievements).Error
	return achievements, err
}

// NOVASyncData represents data synced from NOVA app
type NOVASyncData struct {
	Profile         *NOVAProfile                 `json:"profile"`
	DailyStats      []domain.DailyFitnessStats   `json:"daily_stats"`
	WorkoutSessions []domain.WorkoutSession      `json:"workout_sessions"`
	NutritionLogs   []domain.NutritionLog        `json:"nutrition_logs"`
	BodyAnalyses    []domain.BodyAnalysis        `json:"body_analyses"`
	ActivePlan      *domain.WeeklyFitnessPlan    `json:"active_plan"`
}

// NOVAProfile represents profile data from NOVA
type NOVAProfile struct {
	Goal     string  `json:"goal"`
	HeightCm float64 `json:"height_cm"`
	WeightKg float64 `json:"weight_kg"`
	Age      int     `json:"age"`
	Level    int     `json:"level"`
}

// ParseDailyPlan parses JSON days into DailyPlanItem slice
func ParseDailyPlan(daysJSON string) ([]domain.DailyPlanItem, error) {
	var days []domain.DailyPlanItem
	if err := json.Unmarshal([]byte(daysJSON), &days); err != nil {
		return nil, err
	}
	return days, nil
}
