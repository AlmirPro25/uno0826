package shadow

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// SHADOW SERVICE - SIMULAÇÃO SEM EFEITOS
// "O único efeito permitido é Audit Log e SimulatedResult"
// ========================================

type ShadowService struct {
	db *gorm.DB
}

func NewShadowService(db *gorm.DB) *ShadowService {
	return &ShadowService{db: db}
}

// ========================================
// EXECUÇÃO SHADOW
// ========================================

// Execute simula uma ação sem executá-la
// REGRA: Nunca executa efeitos colaterais reais
func (s *ShadowService) Execute(req ShadowRequest) (*ShadowResult, error) {
	// 1. Construir Intent (O que o agente quis fazer)
	intent := ShadowIntent{
		Action:       req.Action,
		TargetEntity: req.TargetEntity,
		Amount:       req.Amount,
		Payload:      req.Payload,
		Reason:       req.Reason,
	}

	// 2. Simular (O que teria acontecido)
	simulation := s.simulate(req)

	// 3. Determinar razão (Por que não aconteceu)
	reason := s.determineReason(req)

	// 4. Gerar recomendação
	recommendation := s.generateRecommendation(simulation)

	// 5. Persistir execução shadow
	execution := &ShadowExecution{
		ID:         uuid.New(),
		AgentID:    req.AgentID,
		Domain:     req.Domain,
		Action:     req.Action,
		Intent:     intent,
		Simulation: simulation,
		Reason:     reason,
		CreatedAt:  time.Now(),
	}

	if err := s.db.Create(execution).Error; err != nil {
		return nil, err
	}

	// 6. Retornar resultado
	return &ShadowResult{
		ExecutionID:       execution.ID,
		Mode:              "shadow",
		Executed:          false, // SEMPRE false em shadow
		WhatAgentWanted:   intent,
		WhatWouldHappen:   simulation,
		WhyDidntHappen:    reason,
		Recommendation:    recommendation,
	}, nil
}

// simulate calcula o que TERIA acontecido
// REGRA: Nenhum efeito colateral real
func (s *ShadowService) simulate(req ShadowRequest) ShadowSimulation {
	sim := ShadowSimulation{
		WouldExecute:    true,
		WouldSucceed:    true,
		EstimatedImpact: "low",
		RiskScore:       0.1,
	}

	// Calcular impacto baseado no valor
	if req.Amount > 0 {
		if req.Amount > 100000 { // > R$ 1000
			sim.EstimatedImpact = "high"
			sim.RiskScore = 0.7
			sim.RiskFactors = append(sim.RiskFactors, "Valor alto")
		} else if req.Amount > 10000 { // > R$ 100
			sim.EstimatedImpact = "medium"
			sim.RiskScore = 0.4
			sim.RiskFactors = append(sim.RiskFactors, "Valor moderado")
		}
		sim.WouldDebit = req.Amount
	}

	// Calcular impacto baseado na ação
	switch req.Action {
	case "create_ad", "create_campaign":
		sim.WouldCreate = []string{req.TargetEntity}
		sim.EstimatedImpact = "medium"
		sim.RiskFactors = append(sim.RiskFactors, "Criação de entidade")
	case "pause_campaign", "resume_campaign":
		sim.WouldModify = []string{req.TargetEntity}
		sim.EstimatedImpact = "low"
	case "update_config":
		sim.WouldModify = []string{req.TargetEntity}
		sim.EstimatedImpact = "medium"
		sim.RiskScore = 0.5
		sim.RiskFactors = append(sim.RiskFactors, "Alteração de configuração")
	}

	// Verificar se seria bloqueado por policy (simulação)
	if req.RiskScore > 0.6 {
		sim.WouldSucceed = false
		blockReason := "block_high_risk_agent"
		sim.BlockedBy = &blockReason
		sim.BlockReason = "Risco >= 60% seria bloqueado automaticamente"
		sim.RiskFactors = append(sim.RiskFactors, "Risk score alto")
	}

	return sim
}

// determineReason explica por que não executou
func (s *ShadowService) determineReason(req ShadowRequest) string {
	if req.ShadowReason != "" {
		return req.ShadowReason
	}
	return ReasonAutonomyShadow
}

// generateRecommendation gera recomendação baseada na simulação
func (s *ShadowService) generateRecommendation(sim ShadowSimulation) string {
	// Regras de recomendação
	if !sim.WouldSucceed {
		return RecommendShouldForbid
	}

	if sim.RiskScore >= 0.6 {
		return RecommendShouldForbid
	}

	if sim.RiskScore >= 0.4 {
		return RecommendNeedsReview
	}

	if sim.EstimatedImpact == "high" || sim.EstimatedImpact == "critical" {
		return RecommendNeedsReview
	}

	if sim.RiskScore <= 0.2 && sim.EstimatedImpact == "low" {
		return RecommendSafeToPromote
	}

	return RecommendKeepShadow
}

// ========================================
// QUERIES
// ========================================

// GetByAgent busca execuções shadow de um agente
func (s *ShadowService) GetByAgent(agentID uuid.UUID, limit int) ([]ShadowExecution, error) {
	var executions []ShadowExecution
	err := s.db.Where("agent_id = ?", agentID).
		Order("created_at DESC").
		Limit(limit).
		Find(&executions).Error
	return executions, err
}

// GetByAction busca execuções shadow por ação
func (s *ShadowService) GetByAction(action string, limit int) ([]ShadowExecution, error) {
	var executions []ShadowExecution
	err := s.db.Where("action = ?", action).
		Order("created_at DESC").
		Limit(limit).
		Find(&executions).Error
	return executions, err
}

// GetRecent busca execuções recentes
func (s *ShadowService) GetRecent(limit int) ([]ShadowExecution, error) {
	var executions []ShadowExecution
	err := s.db.Order("created_at DESC").Limit(limit).Find(&executions).Error
	return executions, err
}

// GetStats retorna estatísticas de shadow mode para um agente
func (s *ShadowService) GetStats(agentID uuid.UUID, since time.Time) (*ShadowStats, error) {
	var stats ShadowStats
	stats.AgentID = agentID

	// Total de tentativas
	var totalCount int64
	s.db.Model(&ShadowExecution{}).
		Where("agent_id = ? AND created_at >= ?", agentID, since).
		Count(&totalCount)
	stats.TotalAttempts = int(totalCount)

	// Contagem por resultado (simplificado - seria melhor com JSON query)
	var executions []ShadowExecution
	s.db.Where("agent_id = ? AND created_at >= ?", agentID, since).Find(&executions)

	var totalRisk float64
	actionCount := make(map[string]int)

	for _, exec := range executions {
		if exec.Simulation.WouldSucceed {
			stats.WouldSucceed++
		} else {
			stats.WouldFail++
		}
		if exec.Simulation.BlockedBy != nil {
			stats.WouldBeBlocked++
		}
		totalRisk += exec.Simulation.RiskScore
		actionCount[exec.Action]++
	}

	if stats.TotalAttempts > 0 {
		stats.AvgRiskScore = totalRisk / float64(stats.TotalAttempts)
	}

	// Ação mais comum
	maxCount := 0
	for action, count := range actionCount {
		if count > maxCount {
			maxCount = count
			stats.MostCommonAction = action
		}
	}

	return &stats, nil
}

// ========================================
// REQUEST
// ========================================

// ShadowRequest - requisição para execução shadow
type ShadowRequest struct {
	AgentID      uuid.UUID      `json:"agent_id"`
	Domain       string         `json:"domain"`
	Action       string         `json:"action"`
	TargetEntity string         `json:"target_entity"`
	Amount       int64          `json:"amount,omitempty"`
	Payload      map[string]any `json:"payload,omitempty"`
	Reason       string         `json:"reason"`
	RiskScore    float64        `json:"risk_score,omitempty"`
	ShadowReason string         `json:"shadow_reason,omitempty"` // Por que está em shadow
}
