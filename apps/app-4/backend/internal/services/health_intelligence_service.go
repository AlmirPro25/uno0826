package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"medisync-platform/backend/internal/core/domain"
	"net/http"
	"os"
	"strings"
	"time"

	"gorm.io/gorm"
)

// HealthIntelligenceService handles health profile management and AI-powered data extraction
type HealthIntelligenceService struct {
	db           *gorm.DB
	geminiAPIKey string
}

// NewHealthIntelligenceService creates a new health intelligence service
func NewHealthIntelligenceService(db *gorm.DB) *HealthIntelligenceService {
	return &HealthIntelligenceService{
		db:           db,
		geminiAPIKey: os.Getenv("GEMINI_API_KEY"),
	}
}

// GetOrCreateProfile gets or creates a health profile for a user
func (s *HealthIntelligenceService) GetOrCreateProfile(ctx context.Context, userID uint) (*domain.HealthProfile, error) {
	var profile domain.HealthProfile
	err := s.db.Where("user_id = ?", userID).First(&profile).Error
	if err == gorm.ErrRecordNotFound {
		// Get user info
		var user domain.User
		if err := s.db.First(&user, userID).Error; err != nil {
			return nil, err
		}
		profile = domain.HealthProfile{
			UserID:   userID,
			FullName: user.FullName,
		}
		if err := s.db.Create(&profile).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	return &profile, nil
}

// GetProfile gets a health profile by user ID
func (s *HealthIntelligenceService) GetProfile(ctx context.Context, userID uint) (*domain.HealthProfile, error) {
	var profile domain.HealthProfile
	if err := s.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}


// UpdateProfile updates a health profile
func (s *HealthIntelligenceService) UpdateProfile(ctx context.Context, profile *domain.HealthProfile) error {
	// Calculate BMI if height and weight are set
	if profile.HeightCm > 0 && profile.WeightKg > 0 {
		heightM := profile.HeightCm / 100
		profile.BMI = profile.WeightKg / (heightM * heightM)
	}
	// Calculate profile completeness
	profile.ProfileCompleteness = s.calculateCompleteness(profile)
	return s.db.Save(profile).Error
}

// calculateCompleteness calculates how complete a profile is (0-100)
func (s *HealthIntelligenceService) calculateCompleteness(profile *domain.HealthProfile) int {
	score := 0
	total := 10

	if profile.FullName != "" { score++ }
	if profile.BirthDate != nil { score++ }
	if profile.Gender != "" { score++ }
	if profile.BloodType != "" { score++ }
	if profile.HeightCm > 0 { score++ }
	if profile.WeightKg > 0 { score++ }
	if profile.ChronicConditions != "" && profile.ChronicConditions != "[]" { score++ }
	if profile.Allergies != "" && profile.Allergies != "[]" { score++ }
	if profile.SmokingStatus != "" { score++ }
	if profile.ExerciseLevel != "" { score++ }

	return (score * 100) / total
}

// ExtractDataFromTriage uses AI to extract structured health data from triage conversation
func (s *HealthIntelligenceService) ExtractDataFromTriage(ctx context.Context, triageReport *domain.TriageReport) (*domain.TriageExtractedData, error) {
	prompt := fmt.Sprintf(`Você é um sistema de extração de dados médicos. Analise a conversa de triagem e extraia dados estruturados.

QUEIXA DO PACIENTE:
"%s"

HISTÓRICO DA DOENÇA ATUAL:
"%s"

DIAGNÓSTICO SUSPEITO: %s
ESPECIALIDADE RECOMENDADA: %s

Extraia TODOS os dados mencionados e retorne APENAS JSON válido:
{
  "age": número ou null,
  "gender": "male"|"female"|"other"|null,
  "weight_kg": número ou null,
  "height_cm": número ou null,
  "current_symptoms": ["sintoma1", "sintoma2"],
  "chronic_conditions": ["condição1", "condição2"],
  "allergies": ["alergia1", "alergia2"],
  "current_medications": [{"name": "nome", "dosage": "dose", "frequency": "frequência"}],
  "smoking_status": "never"|"former"|"current"|null,
  "alcohol_use": "never"|"occasional"|"moderate"|"heavy"|null,
  "exercise_level": "sedentary"|"light"|"moderate"|"active"|"very_active"|null,
  "sleep_hours": número ou null,
  "blood_pressure": "120/80" ou null,
  "heart_rate": número ou null,
  "health_goals": ["meta1", "meta2"],
  "risk_factors": ["fator1", "fator2"]
}

REGRAS:
- Extraia APENAS dados explicitamente mencionados
- Use null para dados não mencionados
- Não invente dados
- Mantenha arrays vazios [] se não houver dados`,
		triageReport.PatientComplaint,
		triageReport.HistoryOfPresentIllness,
		triageReport.SuspectedDiagnosis,
		triageReport.RecommendedSpecialty)

	result, err := s.callGeminiAPI(ctx, prompt)
	if err != nil {
		log.Printf("AI extraction failed: %v", err)
		return s.fallbackExtraction(triageReport), nil
	}

	var extracted domain.TriageExtractedData
	if err := json.Unmarshal([]byte(result), &extracted); err != nil {
		log.Printf("Failed to parse AI response: %v", err)
		return s.fallbackExtraction(triageReport), nil
	}

	return &extracted, nil
}

// fallbackExtraction provides basic extraction when AI is unavailable
func (s *HealthIntelligenceService) fallbackExtraction(triageReport *domain.TriageReport) *domain.TriageExtractedData {
	var diagnoses []string
	if triageReport.SuspectedDiagnosis != "" {
		json.Unmarshal([]byte(triageReport.SuspectedDiagnosis), &diagnoses)
	}
	return &domain.TriageExtractedData{
		CurrentSymptoms: diagnoses,
	}
}

// UpdateProfileFromTriage updates health profile with data extracted from triage
func (s *HealthIntelligenceService) UpdateProfileFromTriage(ctx context.Context, userID uint, triageID uint) error {
	// Get triage report
	var triage domain.TriageReport
	if err := s.db.First(&triage, triageID).Error; err != nil {
		return err
	}

	// Extract data
	extracted, err := s.ExtractDataFromTriage(ctx, &triage)
	if err != nil {
		return err
	}

	// Get or create profile
	profile, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	// Update profile with extracted data
	if extracted.Age != nil {
		birthYear := time.Now().Year() - *extracted.Age
		birthDate := time.Date(birthYear, 1, 1, 0, 0, 0, 0, time.UTC)
		profile.BirthDate = &birthDate
	}
	if extracted.Gender != "" {
		profile.Gender = extracted.Gender
	}
	if extracted.WeightKg != nil {
		profile.WeightKg = *extracted.WeightKg
		now := time.Now()
		profile.LastWeightDate = &now
	}
	if extracted.HeightCm != nil {
		profile.HeightCm = *extracted.HeightCm
	}
	if len(extracted.ChronicConditions) > 0 {
		conditionsJSON, _ := json.Marshal(extracted.ChronicConditions)
		profile.ChronicConditions = string(conditionsJSON)
	}
	if len(extracted.Allergies) > 0 {
		allergiesJSON, _ := json.Marshal(extracted.Allergies)
		profile.Allergies = string(allergiesJSON)
	}
	if extracted.SmokingStatus != "" {
		profile.SmokingStatus = extracted.SmokingStatus
	}
	if extracted.AlcoholUse != "" {
		profile.AlcoholUse = extracted.AlcoholUse
	}
	if extracted.ExerciseLevel != "" {
		profile.ExerciseLevel = extracted.ExerciseLevel
	}
	if len(extracted.HealthGoals) > 0 {
		goalsJSON, _ := json.Marshal(extracted.HealthGoals)
		profile.HealthGoals = string(goalsJSON)
	}

	// Update last triage info
	profile.LastTriageID = &triageID
	now := time.Now()
	profile.LastTriageDate = &now

	// Save medications if extracted
	for _, med := range extracted.CurrentMedications {
		medication := domain.Medication{
			UserID:    userID,
			Name:      med.Name,
			Dosage:    med.Dosage,
			Frequency: med.Frequency,
			StartDate: time.Now(),
			IsActive:  true,
		}
		s.db.Where("user_id = ? AND name = ?", userID, med.Name).FirstOrCreate(&medication)
	}

	return s.UpdateProfile(ctx, profile)
}


// CreateDailyCheckIn creates a new daily check-in
func (s *HealthIntelligenceService) CreateDailyCheckIn(ctx context.Context, checkIn *domain.DailyCheckIn) error {
	// Check if already exists for today
	var existing domain.DailyCheckIn
	today := time.Now().Truncate(24 * time.Hour)
	err := s.db.Where("user_id = ? AND date >= ? AND date < ?", 
		checkIn.UserID, today, today.Add(24*time.Hour)).First(&existing).Error
	
	if err == nil {
		// Update existing
		checkIn.ID = existing.ID
		return s.db.Save(checkIn).Error
	}
	
	checkIn.Date = today
	return s.db.Create(checkIn).Error
}

// GetDailyCheckIn gets today's check-in for a user
func (s *HealthIntelligenceService) GetDailyCheckIn(ctx context.Context, userID uint, date time.Time) (*domain.DailyCheckIn, error) {
	var checkIn domain.DailyCheckIn
	startOfDay := date.Truncate(24 * time.Hour)
	err := s.db.Where("user_id = ? AND date >= ? AND date < ?", 
		userID, startOfDay, startOfDay.Add(24*time.Hour)).First(&checkIn).Error
	if err != nil {
		return nil, err
	}
	return &checkIn, nil
}

// GetCheckInHistory gets check-in history for a user
func (s *HealthIntelligenceService) GetCheckInHistory(ctx context.Context, userID uint, days int) ([]domain.DailyCheckIn, error) {
	var checkIns []domain.DailyCheckIn
	startDate := time.Now().AddDate(0, 0, -days)
	err := s.db.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date DESC").Find(&checkIns).Error
	return checkIns, err
}

// RecordMetric records a health metric
func (s *HealthIntelligenceService) RecordMetric(ctx context.Context, metric *domain.HealthMetric) error {
	metric.Date = time.Now()
	return s.db.Create(metric).Error
}

// GetMetrics gets metrics for a user by type
func (s *HealthIntelligenceService) GetMetrics(ctx context.Context, userID uint, metricType string, days int) ([]domain.HealthMetric, error) {
	var metrics []domain.HealthMetric
	startDate := time.Now().AddDate(0, 0, -days)
	query := s.db.Where("user_id = ? AND date >= ?", userID, startDate)
	if metricType != "" {
		query = query.Where("type = ?", metricType)
	}
	err := query.Order("date DESC").Find(&metrics).Error
	return metrics, err
}

// GetMedications gets active medications for a user
func (s *HealthIntelligenceService) GetMedications(ctx context.Context, userID uint) ([]domain.Medication, error) {
	var medications []domain.Medication
	err := s.db.Where("user_id = ? AND is_active = true", userID).Find(&medications).Error
	return medications, err
}

// CreateMedication creates a new medication
func (s *HealthIntelligenceService) CreateMedication(ctx context.Context, medication *domain.Medication) error {
	return s.db.Create(medication).Error
}

// LogMedication logs when a medication was taken
func (s *HealthIntelligenceService) LogMedication(ctx context.Context, log *domain.MedicationLog) error {
	return s.db.Create(log).Error
}

// GetVaccines gets vaccines for a user
func (s *HealthIntelligenceService) GetVaccines(ctx context.Context, userID uint) ([]domain.Vaccine, error) {
	var vaccines []domain.Vaccine
	err := s.db.Where("user_id = ?", userID).Order("applied_at DESC").Find(&vaccines).Error
	return vaccines, err
}

// CreateVaccine creates a new vaccine record
func (s *HealthIntelligenceService) CreateVaccine(ctx context.Context, vaccine *domain.Vaccine) error {
	return s.db.Create(vaccine).Error
}

// GetExams gets exams for a user
func (s *HealthIntelligenceService) GetExams(ctx context.Context, userID uint) ([]domain.Exam, error) {
	var exams []domain.Exam
	err := s.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&exams).Error
	return exams, err
}

// CreateExam creates a new exam record
func (s *HealthIntelligenceService) CreateExam(ctx context.Context, exam *domain.Exam) error {
	return s.db.Create(exam).Error
}

// GetHealthGoals gets health goals for a user
func (s *HealthIntelligenceService) GetHealthGoals(ctx context.Context, userID uint) ([]domain.HealthGoal, error) {
	var goals []domain.HealthGoal
	err := s.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&goals).Error
	return goals, err
}

// CreateHealthGoal creates a new health goal
func (s *HealthIntelligenceService) CreateHealthGoal(ctx context.Context, goal *domain.HealthGoal) error {
	return s.db.Create(goal).Error
}

// UpdateHealthGoal updates a health goal
func (s *HealthIntelligenceService) UpdateHealthGoal(ctx context.Context, goal *domain.HealthGoal) error {
	// Calculate progress
	if goal.TargetValue > 0 {
		goal.Progress = int((goal.CurrentValue / goal.TargetValue) * 100)
		if goal.Progress >= 100 {
			goal.Status = "completed"
		}
	}
	return s.db.Save(goal).Error
}

// GetAchievements gets achievements for a user
func (s *HealthIntelligenceService) GetAchievements(ctx context.Context, userID uint) ([]domain.Achievement, error) {
	var achievements []domain.Achievement
	err := s.db.Where("user_id = ?", userID).Order("earned_at DESC").Find(&achievements).Error
	return achievements, err
}

// AwardAchievement awards an achievement to a user
func (s *HealthIntelligenceService) AwardAchievement(ctx context.Context, achievement *domain.Achievement) error {
	// Check if already awarded
	var existing domain.Achievement
	err := s.db.Where("user_id = ? AND name = ?", achievement.UserID, achievement.Name).First(&existing).Error
	if err == nil {
		return nil // Already awarded
	}
	achievement.EarnedAt = time.Now()
	return s.db.Create(achievement).Error
}


// CalculateHealthScores calculates all health scores for a user
func (s *HealthIntelligenceService) CalculateHealthScores(ctx context.Context, userID uint) error {
	profile, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	// Get recent check-ins (last 7 days)
	checkIns, _ := s.GetCheckInHistory(ctx, userID, 7)

	if len(checkIns) > 0 {
		var totalSleep, totalWater, totalSteps, totalMood float64
		for _, c := range checkIns {
			totalSleep += c.SleepHours
			totalWater += float64(c.WaterMl)
			totalSteps += float64(c.Steps)
			totalMood += float64(c.MoodScore)
		}
		count := float64(len(checkIns))

		// Sleep score (target: 7-9 hours)
		avgSleep := totalSleep / count
		if avgSleep >= 7 && avgSleep <= 9 {
			profile.SleepScore = 100
		} else if avgSleep >= 6 && avgSleep <= 10 {
			profile.SleepScore = 75
		} else {
			profile.SleepScore = 50
		}

		// Hydration score (target: 2000ml)
		avgWater := totalWater / count
		profile.HydrationScore = int((avgWater / float64(profile.WaterTargetMl)) * 100)
		if profile.HydrationScore > 100 {
			profile.HydrationScore = 100
		}

		// Activity score (target: 10000 steps)
		avgSteps := totalSteps / count
		profile.ActivityScore = int((avgSteps / float64(profile.StepsTarget)) * 100)
		if profile.ActivityScore > 100 {
			profile.ActivityScore = 100
		}

		// Mental score (based on mood)
		avgMood := totalMood / count
		profile.MentalScore = int((avgMood / 5) * 100)
	}

	// Calculate overall score
	profile.OverallScore = (profile.SleepScore + profile.HydrationScore + 
		profile.ActivityScore + profile.NutritionScore + profile.MentalScore) / 5

	return s.db.Save(profile).Error
}

// GetHealthSummary gets a complete health summary for a user
func (s *HealthIntelligenceService) GetHealthSummary(ctx context.Context, userID uint) (map[string]interface{}, error) {
	profile, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Get today's check-in
	todayCheckIn, _ := s.GetDailyCheckIn(ctx, userID, time.Now())

	// Get active medications count
	medications, _ := s.GetMedications(ctx, userID)

	// Get pending exams
	var pendingExams int64
	s.db.Model(&domain.Exam{}).Where("user_id = ? AND status IN ('pending', 'scheduled')", userID).Count(&pendingExams)

	// Get overdue vaccines
	var overdueVaccines int64
	s.db.Model(&domain.Vaccine{}).Where("user_id = ? AND next_dose_at < ?", userID, time.Now()).Count(&overdueVaccines)

	// Get active goals
	var activeGoals int64
	s.db.Model(&domain.HealthGoal{}).Where("user_id = ? AND status = 'active'", userID).Count(&activeGoals)

	// Get achievements count
	var achievementsCount int64
	s.db.Model(&domain.Achievement{}).Where("user_id = ?", userID).Count(&achievementsCount)

	// Determine health trend
	checkIns, _ := s.GetCheckInHistory(ctx, userID, 14)
	trend := "stable"
	if len(checkIns) >= 7 {
		recentAvg := 0.0
		olderAvg := 0.0
		for i, c := range checkIns {
			if i < 7 {
				recentAvg += float64(c.MoodScore)
			} else {
				olderAvg += float64(c.MoodScore)
			}
		}
		recentAvg /= 7
		olderAvg /= float64(len(checkIns) - 7)
		if recentAvg > olderAvg+0.5 {
			trend = "up"
		} else if recentAvg < olderAvg-0.5 {
			trend = "down"
		}
	}

	// Build alerts
	var alerts []map[string]string
	if overdueVaccines > 0 {
		alerts = append(alerts, map[string]string{"type": "warning", "message": fmt.Sprintf("%d vacina(s) pendente(s)", overdueVaccines)})
	}
	if pendingExams > 0 {
		alerts = append(alerts, map[string]string{"type": "info", "message": fmt.Sprintf("%d exame(s) pendente(s)", pendingExams)})
	}
	if profile.ProfileCompleteness < 50 {
		alerts = append(alerts, map[string]string{"type": "info", "message": "Complete seu perfil de saúde"})
	}

	return map[string]interface{}{
		"profile":             profile,
		"todayCheckIn":        todayCheckIn,
		"healthScore":         profile.OverallScore,
		"healthTrend":         trend,
		"sleepScore":          profile.SleepScore,
		"hydrationScore":      profile.HydrationScore,
		"activityScore":       profile.ActivityScore,
		"nutritionScore":      profile.NutritionScore,
		"mentalScore":         profile.MentalScore,
		"pendingMedications":  len(medications),
		"pendingExams":        pendingExams,
		"overdueVaccines":     overdueVaccines,
		"activeGoals":         activeGoals,
		"achievements":        achievementsCount,
		"profileCompleteness": profile.ProfileCompleteness,
		"alerts":              alerts,
	}, nil
}

// ProcessAIChatCheckIn processes a chat message for health check-in data
func (s *HealthIntelligenceService) ProcessAIChatCheckIn(ctx context.Context, userID uint, message string) (*domain.DailyCheckIn, error) {
	prompt := fmt.Sprintf(`Você é um assistente de saúde. Analise a mensagem do usuário e extraia dados de check-in diário.

MENSAGEM DO USUÁRIO:
"%s"

Extraia dados mencionados e retorne APENAS JSON válido:
{
  "sleep_hours": número ou null,
  "sleep_quality": 1-5 ou null,
  "steps": número ou null,
  "water_ml": número ou null,
  "calories_consumed": número ou null,
  "mood_score": 1-5 ou null,
  "energy_level": 1-5 ou null,
  "stress_level": 1-5 ou null,
  "symptoms": ["sintoma1"] ou [],
  "notes": "observações extraídas",
  "ai_insights": "insight sobre a saúde do usuário",
  "ai_recommendations": "recomendação personalizada"
}

REGRAS:
- Extraia APENAS dados explicitamente mencionados
- Use null para dados não mencionados
- Gere insights e recomendações baseados nos dados`, message)

	result, err := s.callGeminiAPI(ctx, prompt)
	if err != nil {
		return nil, err
	}

	var extracted struct {
		SleepHours        *float64 `json:"sleep_hours"`
		SleepQuality      *int     `json:"sleep_quality"`
		Steps             *int     `json:"steps"`
		WaterMl           *int     `json:"water_ml"`
		CaloriesConsumed  *int     `json:"calories_consumed"`
		MoodScore         *int     `json:"mood_score"`
		EnergyLevel       *int     `json:"energy_level"`
		StressLevel       *int     `json:"stress_level"`
		Symptoms          []string `json:"symptoms"`
		Notes             string   `json:"notes"`
		AIInsights        string   `json:"ai_insights"`
		AIRecommendations string   `json:"ai_recommendations"`
	}

	if err := json.Unmarshal([]byte(result), &extracted); err != nil {
		return nil, err
	}

	// Get or create today's check-in
	checkIn, _ := s.GetDailyCheckIn(ctx, userID, time.Now())
	if checkIn == nil {
		checkIn = &domain.DailyCheckIn{
			UserID: userID,
			Date:   time.Now(),
			Source: "ai_chat",
		}
	}

	// Update with extracted data
	if extracted.SleepHours != nil {
		checkIn.SleepHours = *extracted.SleepHours
	}
	if extracted.SleepQuality != nil {
		checkIn.SleepQuality = *extracted.SleepQuality
	}
	if extracted.Steps != nil {
		checkIn.Steps = *extracted.Steps
	}
	if extracted.WaterMl != nil {
		checkIn.WaterMl = *extracted.WaterMl
	}
	if extracted.CaloriesConsumed != nil {
		checkIn.CaloriesConsumed = *extracted.CaloriesConsumed
	}
	if extracted.MoodScore != nil {
		checkIn.MoodScore = *extracted.MoodScore
	}
	if extracted.EnergyLevel != nil {
		checkIn.EnergyLevel = *extracted.EnergyLevel
	}
	if extracted.StressLevel != nil {
		checkIn.StressLevel = *extracted.StressLevel
	}
	if len(extracted.Symptoms) > 0 {
		symptomsJSON, _ := json.Marshal(extracted.Symptoms)
		checkIn.Symptoms = string(symptomsJSON)
	}
	if extracted.Notes != "" {
		checkIn.Notes = extracted.Notes
	}
	checkIn.AIInsights = extracted.AIInsights
	checkIn.AIRecommendations = extracted.AIRecommendations

	if err := s.CreateDailyCheckIn(ctx, checkIn); err != nil {
		return nil, err
	}

	// Recalculate health scores
	s.CalculateHealthScores(ctx, userID)

	return checkIn, nil
}

// callGeminiAPI calls the Gemini API
func (s *HealthIntelligenceService) callGeminiAPI(ctx context.Context, prompt string) (string, error) {
	if s.geminiAPIKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY not configured")
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=%s", s.geminiAPIKey)

	reqBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"responseMimeType": "application/json",
		},
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	if len(result.Candidates) > 0 && len(result.Candidates[0].Content.Parts) > 0 {
		text := result.Candidates[0].Content.Parts[0].Text
		// Clean JSON if wrapped in markdown
		text = strings.TrimPrefix(text, "```json")
		text = strings.TrimPrefix(text, "```")
		text = strings.TrimSuffix(text, "```")
		return strings.TrimSpace(text), nil
	}

	return "", fmt.Errorf("no response from Gemini")
}
