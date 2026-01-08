package risk

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// RISK SERVICE
// "Calcula, explica e persiste scores de risco"
// ========================================

type RiskService struct {
	db          *gorm.DB
	calculators []FactorCalculator
	cacheTTL    time.Duration // Tempo de cache do score
}

func NewRiskService(db *gorm.DB) *RiskService {
	return &RiskService{
		db:          db,
		calculators: GetAllFactorCalculators(),
		cacheTTL:    15 * time.Minute, // Score válido por 15 minutos
	}
}

// ========================================
// CALCULATE RISK
// ========================================

// CalculateAppRisk calcula o score de risco para um app
func (s *RiskService) CalculateAppRisk(appID uuid.UUID) (*RiskResponse, error) {
	return s.calculateRisk(appID, nil, "", false)
}

// ForceCalculateAppRisk força recálculo ignorando cache
func (s *RiskService) ForceCalculateAppRisk(appID uuid.UUID) (*RiskResponse, error) {
	return s.calculateRisk(appID, nil, "", true)
}

// CalculateAgentRisk calcula o score de risco para um agente específico
func (s *RiskService) CalculateAgentRisk(appID uuid.UUID, agentID uuid.UUID) (*RiskResponse, error) {
	return s.calculateRisk(appID, &agentID, "", false)
}

// CalculateDomainRisk calcula o score de risco para um domínio específico
func (s *RiskService) CalculateDomainRisk(appID uuid.UUID, domain string) (*RiskResponse, error) {
	return s.calculateRisk(appID, nil, domain, false)
}

// calculateRisk implementação interna
func (s *RiskService) calculateRisk(appID uuid.UUID, agentID *uuid.UUID, domain string, forceRecalc bool) (*RiskResponse, error) {
	// 1. Verificar cache (se não forçar recálculo)
	if !forceRecalc {
		cached, err := s.getCachedScore(appID, agentID)
		if err == nil && cached != nil && time.Now().Before(cached.ExpiresAt) {
			// Deserializar fatores
			var factors []RiskFactor
			json.Unmarshal([]byte(cached.FactorsJSON), &factors)
			
			return &RiskResponse{
				AppID:        appID,
				AgentID:      agentID,
				Score:        cached.Score,
				Level:        RiskLevel(cached.Level),
				Factors:      factors,
				Explanation:  cached.Explanation,
				CalculatedAt: cached.CalculatedAt,
				CachedUntil:  cached.ExpiresAt,
			}, nil
		}
	}

	// 2. Calcular todos os fatores
	factors := make([]RiskFactor, 0, len(s.calculators))
	for _, calc := range s.calculators {
		factor := calc.Calculate(s.db, appID, agentID)
		factors = append(factors, factor)
	}

	// 3. Calcular score ponderado
	var totalWeight float64
	var weightedSum float64
	for _, f := range factors {
		weightedSum += f.Value * f.Weight
		totalWeight += f.Weight
	}

	score := 0.0
	if totalWeight > 0 {
		score = weightedSum / totalWeight
	}

	// 4. Determinar nível
	level := GetLevel(score)

	// 5. Gerar explicação
	explanation := s.generateExplanation(score, level, factors)

	// 6. Persistir score
	now := time.Now()
	expiresAt := now.Add(s.cacheTTL)

	factorsJSON, _ := json.Marshal(factors)
	riskScore := &RiskScore{
		ID:           uuid.New(),
		AppID:        appID,
		AgentID:      agentID,
		Domain:       domain,
		Score:        score,
		Level:        string(level),
		FactorsJSON:  string(factorsJSON),
		Explanation:  explanation,
		CalculatedAt: now,
		ExpiresAt:    expiresAt,
		CreatedAt:    now,
	}

	if err := s.db.Create(riskScore).Error; err != nil {
		// Log mas não falha - score ainda é válido
		fmt.Printf("RISK: Erro ao persistir score: %v\n", err)
	}

	// 7. Salvar no histórico
	s.saveHistory(appID, score, level, factorsJSON)

	return &RiskResponse{
		AppID:        appID,
		AgentID:      agentID,
		Score:        score,
		Level:        level,
		Factors:      factors,
		Explanation:  explanation,
		CalculatedAt: now,
		CachedUntil:  expiresAt,
	}, nil
}

// getCachedScore busca score em cache
func (s *RiskService) getCachedScore(appID uuid.UUID, agentID *uuid.UUID) (*RiskScore, error) {
	var score RiskScore
	query := s.db.Where("app_id = ?", appID)
	
	if agentID != nil {
		query = query.Where("agent_id = ?", agentID)
	} else {
		query = query.Where("agent_id IS NULL")
	}

	err := query.Order("calculated_at DESC").First(&score).Error
	if err != nil {
		return nil, err
	}
	return &score, nil
}

// saveHistory salva no histórico para análise de tendência
func (s *RiskService) saveHistory(appID uuid.UUID, score float64, level RiskLevel, factorsJSON []byte) {
	history := &RiskHistory{
		ID:           uuid.New(),
		AppID:        appID,
		Score:        score,
		Level:        string(level),
		FactorsJSON:  string(factorsJSON),
		CalculatedAt: time.Now(),
	}
	s.db.Create(history)
}

// ========================================
// EXPLANATION GENERATOR
// ========================================

func (s *RiskService) generateExplanation(score float64, level RiskLevel, factors []RiskFactor) string {
	var parts []string

	// Resumo geral
	switch level {
	case RiskLevelLow:
		parts = append(parts, fmt.Sprintf("Risco BAIXO (%.2f). O app apresenta comportamento saudável.", score))
	case RiskLevelMedium:
		parts = append(parts, fmt.Sprintf("Risco MÉDIO (%.2f). Alguns indicadores merecem atenção.", score))
	case RiskLevelHigh:
		parts = append(parts, fmt.Sprintf("Risco ALTO (%.2f). Recomenda-se revisão das atividades.", score))
	case RiskLevelCritical:
		parts = append(parts, fmt.Sprintf("Risco CRÍTICO (%.2f). Ação imediata recomendada.", score))
	}

	// Fatores que excederam threshold
	var exceededFactors []string
	for _, f := range factors {
		if f.Exceeded {
			exceededFactors = append(exceededFactors, fmt.Sprintf("%s (%.2f > %.2f)", f.Name, f.Value, f.Threshold))
		}
	}

	if len(exceededFactors) > 0 {
		parts = append(parts, fmt.Sprintf("Fatores acima do limite: %s.", strings.Join(exceededFactors, ", ")))
	}

	// Fator de maior impacto
	var maxFactor RiskFactor
	var maxImpact float64
	for _, f := range factors {
		impact := f.Value * f.Weight
		if impact > maxImpact {
			maxImpact = impact
			maxFactor = f
		}
	}

	if maxImpact > 0 {
		parts = append(parts, fmt.Sprintf("Principal contribuinte: %s (%s).", maxFactor.Name, maxFactor.Description))
	}

	return strings.Join(parts, " ")
}

// ========================================
// QUERIES
// ========================================

// GetAppRisk retorna o score mais recente de um app
func (s *RiskService) GetAppRisk(appID uuid.UUID) (*RiskResponse, error) {
	// Sempre recalcula para garantir dados frescos
	return s.CalculateAppRisk(appID)
}

// GetRiskHistory retorna histórico de scores de um app
func (s *RiskService) GetRiskHistory(appID uuid.UUID, days int) ([]RiskHistory, error) {
	var history []RiskHistory
	since := time.Now().AddDate(0, 0, -days)
	
	err := s.db.Where("app_id = ? AND calculated_at >= ?", appID, since).
		Order("calculated_at DESC").
		Find(&history).Error
	
	return history, err
}

// GetRiskTrend retorna a tendência de risco (subindo, estável, descendo)
func (s *RiskService) GetRiskTrend(appID uuid.UUID) (string, float64, error) {
	history, err := s.GetRiskHistory(appID, 7)
	if err != nil {
		return "unknown", 0, err
	}

	if len(history) < 2 {
		return "insufficient_data", 0, nil
	}

	// Comparar primeiro e último
	oldest := history[len(history)-1].Score
	newest := history[0].Score
	diff := newest - oldest

	var trend string
	switch {
	case diff > 0.1:
		trend = "increasing"
	case diff < -0.1:
		trend = "decreasing"
	default:
		trend = "stable"
	}

	return trend, diff, nil
}

// ========================================
// RISK CHECK (para uso em governança)
// ========================================

// CheckRisk verifica se o risco está aceitável para uma operação
func (s *RiskService) CheckRisk(appID uuid.UUID, maxAcceptableLevel RiskLevel) (bool, *RiskResponse, error) {
	risk, err := s.GetAppRisk(appID)
	if err != nil {
		return false, nil, err
	}

	// Mapear níveis para valores numéricos
	levelValues := map[RiskLevel]int{
		RiskLevelLow:      1,
		RiskLevelMedium:   2,
		RiskLevelHigh:     3,
		RiskLevelCritical: 4,
	}

	acceptable := levelValues[risk.Level] <= levelValues[maxAcceptableLevel]
	return acceptable, risk, nil
}

// IsHighRisk verifica se o app é de alto risco
func (s *RiskService) IsHighRisk(appID uuid.UUID) (bool, error) {
	risk, err := s.GetAppRisk(appID)
	if err != nil {
		return false, err
	}
	return risk.Level == RiskLevelHigh || risk.Level == RiskLevelCritical, nil
}
