package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"medisync-platform/backend/internal/core/domain"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"
)

// ClinicalMatchService handles intelligent patient-doctor matching
type ClinicalMatchService struct {
	db           *gorm.DB
	geminiAPIKey string
}

// NewClinicalMatchService creates a new clinical match service
func NewClinicalMatchService(db *gorm.DB) *ClinicalMatchService {
	return &ClinicalMatchService{
		db:           db,
		geminiAPIKey: os.Getenv("GEMINI_API_KEY"),
	}
}

// ClassifyPatientInput uses AI to analyze patient's message and classify urgency/specialty
func (s *ClinicalMatchService) ClassifyPatientInput(ctx context.Context, req *domain.MatchRequest) (*domain.AIClassification, error) {
	prompt := fmt.Sprintf(`Você é um sistema de triagem médica inteligente. Analise a mensagem do paciente e classifique.

MENSAGEM DO PACIENTE:
"%s"

SINTOMAS ADICIONAIS: %v
DURAÇÃO: %s
SEVERIDADE (1-10): %d

Retorne APENAS JSON válido com esta estrutura:
{
  "chief_complaint": "queixa principal resumida",
  "symptoms": ["sintoma1", "sintoma2"],
  "urgency_level": "IMMEDIATE|TODAY|WEEK|FLEXIBLE",
  "risk_level": "LOW|MODERATE|HIGH|CRITICAL",
  "suggested_specialties": ["especialidade1", "especialidade2"],
  "can_be_remote": true/false,
  "requires_exam_first": true/false,
  "red_flags": ["sinal de alerta se houver"],
  "reasoning": "explicação breve da classificação"
}

REGRAS:
- IMMEDIATE: dor no peito, dificuldade respiratória, AVC, trauma grave
- TODAY: febre alta, dor intensa, sintomas agudos
- WEEK: sintomas crônicos, check-ups, acompanhamento
- FLEXIBLE: consultas de rotina, segunda opinião
- can_be_remote: true se não precisa exame físico
- requires_exam_first: true se precisa exame antes da consulta`, 
		req.Message, req.Symptoms, req.Duration, req.Severity)

	result, err := s.callGeminiAPI(ctx, prompt)
	if err != nil {
		log.Printf("AI classification failed, using fallback: %v", err)
		return s.fallbackClassification(req), nil
	}

	var classification domain.AIClassification
	if err := json.Unmarshal([]byte(result), &classification); err != nil {
		log.Printf("Failed to parse AI response: %v", err)
		return s.fallbackClassification(req), nil
	}

	return &classification, nil
}

// fallbackClassification provides basic classification when AI is unavailable
func (s *ClinicalMatchService) fallbackClassification(req *domain.MatchRequest) *domain.AIClassification {
	urgency := domain.UrgencyWeek
	risk := domain.RiskLow
	specialties := []string{"Clínica Geral"}
	canBeRemote := true

	// Simple keyword-based classification
	msg := strings.ToLower(req.Message)
	
	// Emergency keywords
	if strings.Contains(msg, "dor no peito") || strings.Contains(msg, "não consigo respirar") ||
		strings.Contains(msg, "desmaio") || strings.Contains(msg, "sangramento") {
		urgency = domain.UrgencyImmediate
		risk = domain.RiskCritical
		canBeRemote = false
	} else if strings.Contains(msg, "febre alta") || strings.Contains(msg, "dor forte") {
		urgency = domain.UrgencyToday
		risk = domain.RiskHigh
	}

	// Specialty detection
	if strings.Contains(msg, "coração") || strings.Contains(msg, "peito") {
		specialties = []string{"Cardiologia", "Clínica Geral"}
	} else if strings.Contains(msg, "pele") || strings.Contains(msg, "mancha") {
		specialties = []string{"Dermatologia"}
	} else if strings.Contains(msg, "osso") || strings.Contains(msg, "articulação") {
		specialties = []string{"Ortopedia"}
		canBeRemote = false
	} else if strings.Contains(msg, "criança") || strings.Contains(msg, "filho") {
		specialties = []string{"Pediatria"}
	} else if strings.Contains(msg, "cabeça") || strings.Contains(msg, "enxaqueca") {
		specialties = []string{"Neurologia", "Clínica Geral"}
	}

	return &domain.AIClassification{
		ChiefComplaint:       req.Message,
		Symptoms:             req.Symptoms,
		UrgencyLevel:         urgency,
		RiskLevel:            risk,
		SuggestedSpecialties: specialties,
		CanBeRemote:          canBeRemote,
		RequiresExamFirst:    false,
		Reasoning:            "Classificação automática baseada em palavras-chave",
	}
}

// FindBestMatch finds the best doctor match for a patient
func (s *ClinicalMatchService) FindBestMatch(ctx context.Context, patientID uint, req *domain.MatchRequest, classification *domain.AIClassification) ([]domain.MatchResult, error) {
	var results []domain.MatchResult

	// Get all active doctors with their profiles
	var doctors []domain.User
	query := s.db.Where("role_id = (SELECT id FROM roles WHERE name = 'MEDICO') AND is_active = true")
	
	// Filter by specialty if we have suggestions
	if len(classification.SuggestedSpecialties) > 0 {
		specialtyConditions := make([]string, len(classification.SuggestedSpecialties))
		for i, spec := range classification.SuggestedSpecialties {
			specialtyConditions[i] = fmt.Sprintf("specialty LIKE '%%%s%%'", spec)
		}
		query = query.Where(strings.Join(specialtyConditions, " OR "))
	}

	if err := query.Find(&doctors).Error; err != nil {
		return nil, err
	}

	// Get doctor profiles
	var profiles []domain.DoctorProfile
	s.db.Find(&profiles)
	profileMap := make(map[uint]*domain.DoctorProfile)
	for i := range profiles {
		profileMap[profiles[i].UserID] = &profiles[i]
	}

	// Score each doctor
	for _, doctor := range doctors {
		profile := profileMap[uint(doctor.ID)]
		score, reasons := s.calculateMatchScore(&doctor, profile, req, classification)
		
		if score < 30 { // Minimum threshold
			continue
		}

		// Get next available slot
		var nextSlot *time.Time
		canStartNow := false
		estimatedWait := 60 // default 1 hour

		if profile != nil && profile.AvailableNow {
			canStartNow = true
			estimatedWait = profile.ResponseTimeMinutes
		} else if profile != nil && profile.NextAvailableSlot != nil {
			nextSlot = profile.NextAvailableSlot
			estimatedWait = int(time.Until(*nextSlot).Minutes())
		}

		consultationType := "SCHEDULED"
		if canStartNow && classification.CanBeRemote {
			consultationType = "TELEMEDICINE"
		} else if classification.UrgencyLevel == domain.UrgencyImmediate {
			consultationType = "IMMEDIATE"
		}

		price := 200.0 // default
		if profile != nil && profile.ConsultationPrice > 0 {
			price = profile.ConsultationPrice
		}

		results = append(results, domain.MatchResult{
			Doctor:            &doctor,
			DoctorProfile:     profile,
			MatchScore:        score,
			MatchReasons:      reasons,
			EstimatedWaitTime: estimatedWait,
			CanStartNow:       canStartNow,
			NextAvailableSlot: nextSlot,
			ConsultationType:  consultationType,
			Price:             price,
		})
	}

	// Sort by score descending
	sort.Slice(results, func(i, j int) bool {
		return results[i].MatchScore > results[j].MatchScore
	})

	// Return top 5
	if len(results) > 5 {
		results = results[:5]
	}

	return results, nil
}

// calculateMatchScore calculates how well a doctor matches the patient's needs
func (s *ClinicalMatchService) calculateMatchScore(doctor *domain.User, profile *domain.DoctorProfile, req *domain.MatchRequest, classification *domain.AIClassification) (float64, []string) {
	var score float64
	var reasons []string

	// Base score
	score = 50

	// Specialty match (up to +30)
	if doctor.Specialty != nil {
		for _, suggestedSpec := range classification.SuggestedSpecialties {
			if strings.Contains(strings.ToLower(*doctor.Specialty), strings.ToLower(suggestedSpec)) {
				score += 30
				reasons = append(reasons, fmt.Sprintf("Especialista em %s", suggestedSpec))
				break
			}
		}
	}

	if profile != nil {
		// Rating bonus (up to +10)
		if profile.AverageRating >= 4.5 {
			score += 10
			reasons = append(reasons, fmt.Sprintf("Avaliação %.1f★", profile.AverageRating))
		} else if profile.AverageRating >= 4.0 {
			score += 5
		}

		// Experience bonus (up to +5)
		if profile.YearsExperience >= 10 {
			score += 5
			reasons = append(reasons, fmt.Sprintf("%d anos de experiência", profile.YearsExperience))
		}

		// Availability bonus (up to +15)
		if profile.AvailableNow {
			score += 15
			reasons = append(reasons, "Disponível agora")
		}

		// Telemedicine preference
		if req.PreferTelemedicine && profile.AcceptsTelemedicine {
			score += 10
			reasons = append(reasons, "Aceita telemedicina")
		}

		// Emergency handling
		if classification.UrgencyLevel == domain.UrgencyImmediate && profile.AcceptsEmergency {
			score += 20
			reasons = append(reasons, "Atende emergências")
		}

		// Price consideration
		if req.MaxPriceReais > 0 && profile.ConsultationPrice <= req.MaxPriceReais {
			score += 5
			reasons = append(reasons, "Dentro do orçamento")
		}

		// Insurance match
		if req.InsurancePlan != "" && profile.AcceptsInsurance {
			if strings.Contains(profile.InsurancePlans, req.InsurancePlan) {
				score += 10
				reasons = append(reasons, "Aceita seu plano de saúde")
			}
		}

		// Distance calculation
		if req.Latitude != nil && req.Longitude != nil && profile.Latitude != nil && profile.Longitude != nil {
			distance := haversineDistance(*req.Latitude, *req.Longitude, *profile.Latitude, *profile.Longitude)
			if distance <= float64(req.MaxDistanceKm) {
				score += 10
				reasons = append(reasons, fmt.Sprintf("%.1f km de distância", distance))
			} else {
				score -= 10 // Penalty for being far
			}
		}

		// Completion rate bonus
		if profile.CompletionRate >= 95 {
			score += 5
			reasons = append(reasons, "Alta taxa de conclusão")
		}
	}

	// Previous doctor preference
	if req.PreviousDoctorID != nil && *req.PreviousDoctorID == uint(doctor.ID) {
		score += 20
		reasons = append(reasons, "Seu médico anterior")
	}

	// Cap at 100
	if score > 100 {
		score = 100
	}

	return score, reasons
}

// CreateMatch creates a new clinical match record
func (s *ClinicalMatchService) CreateMatch(ctx context.Context, patientID uint, req *domain.MatchRequest, classification *domain.AIClassification, bestMatch *domain.MatchResult) (*domain.ClinicalMatch, error) {
	specialtiesJSON, _ := json.Marshal(classification.SuggestedSpecialties)
	
	var alternativesJSON []byte
	if bestMatch != nil {
		alternativesJSON = []byte("[]")
	}

	expiresAt := time.Now().Add(30 * time.Minute) // Match expires in 30 min
	
	match := &domain.ClinicalMatch{
		PatientID:          patientID,
		TriageReportID:     req.TriageReportID,
		ChiefComplaint:     classification.ChiefComplaint,
		SymptomsSummary:    strings.Join(classification.Symptoms, ", "),
		UrgencyLevel:       classification.UrgencyLevel,
		RiskLevel:          classification.RiskLevel,
		SuggestedSpecialties: string(specialtiesJSON),
		CanBeRemote:        classification.CanBeRemote,
		RequiresExamFirst:  classification.RequiresExamFirst,
		AIReasoning:        classification.Reasoning,
		Status:             domain.MatchStatusPending,
		ExpiresAt:          &expiresAt,
	}

	if bestMatch != nil && bestMatch.Doctor != nil {
		doctorID := uint(bestMatch.Doctor.ID)
		match.DoctorID = &doctorID
		match.MatchScore = bestMatch.MatchScore
		match.MatchReason = strings.Join(bestMatch.MatchReasons, "; ")
		match.AlternativeDoctors = string(alternativesJSON)
		match.Status = domain.MatchStatusMatched
		now := time.Now()
		match.MatchedAt = &now
	}

	if err := s.db.Create(match).Error; err != nil {
		return nil, err
	}

	return match, nil
}

// AcceptMatch handles when patient or doctor accepts the match
func (s *ClinicalMatchService) AcceptMatch(ctx context.Context, matchID uint, userID uint, userRole string) error {
	var match domain.ClinicalMatch
	if err := s.db.First(&match, matchID).Error; err != nil {
		return err
	}

	if userRole == domain.RolePaciente && match.PatientID == userID {
		match.PatientAccepted = true
	} else if userRole == domain.RoleMedico && match.DoctorID != nil && *match.DoctorID == userID {
		match.DoctorAccepted = true
	} else {
		return fmt.Errorf("unauthorized")
	}

	// If both accepted, update status
	if match.PatientAccepted && match.DoctorAccepted {
		match.Status = domain.MatchStatusAccepted
		now := time.Now()
		match.AcceptedAt = &now
	}

	return s.db.Save(&match).Error
}

// GetMatchByID retrieves a match by ID
func (s *ClinicalMatchService) GetMatchByID(ctx context.Context, matchID uint) (*domain.ClinicalMatch, error) {
	var match domain.ClinicalMatch
	if err := s.db.Preload("Patient").Preload("Doctor").Preload("TriageReport").First(&match, matchID).Error; err != nil {
		return nil, err
	}
	return &match, nil
}

// GetPendingMatchesForDoctor gets matches waiting for doctor acceptance
func (s *ClinicalMatchService) GetPendingMatchesForDoctor(ctx context.Context, doctorID uint) ([]domain.ClinicalMatch, error) {
	var matches []domain.ClinicalMatch
	err := s.db.Where("doctor_id = ? AND status IN (?, ?) AND doctor_accepted = false", 
		doctorID, domain.MatchStatusMatched, domain.MatchStatusPending).
		Preload("Patient").
		Order("created_at DESC").
		Find(&matches).Error
	return matches, err
}

// GetMatchesForPatient gets all matches for a patient
func (s *ClinicalMatchService) GetMatchesForPatient(ctx context.Context, patientID uint) ([]domain.ClinicalMatch, error) {
	var matches []domain.ClinicalMatch
	err := s.db.Where("patient_id = ?", patientID).
		Preload("Doctor").
		Order("created_at DESC").
		Find(&matches).Error
	return matches, err
}

// callGeminiAPI calls the Gemini API for AI classification
func (s *ClinicalMatchService) callGeminiAPI(ctx context.Context, prompt string) (string, error) {
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
		return result.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("no response from Gemini")
}

// haversineDistance calculates distance between two coordinates in km
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth's radius in km
	
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
		math.Sin(dLon/2)*math.Sin(dLon/2)
	
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	
	return R * c
}
