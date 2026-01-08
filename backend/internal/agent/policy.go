package agent

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// POLICY ENFORCEMENT
// "Agente opera dentro de limites explícitos"
// ========================================

var (
	ErrAgentNotFound       = errors.New("agent not found")
	ErrAgentSuspended      = errors.New("agent is suspended")
	ErrPolicyNotFound      = errors.New("policy not found")
	ErrActionForbidden     = errors.New("action is forbidden for agents")
	ErrActionNotAllowed    = errors.New("action not allowed by policy")
	ErrAmountExceedsLimit  = errors.New("amount exceeds policy limit")
	ErrRiskTooHigh         = errors.New("risk score too high for auto-approval")
	ErrDailyLimitExceeded  = errors.New("daily action limit exceeded")
	ErrEntityDisputed      = errors.New("target entity is in disputed state")
	ErrDecisionNotFound    = errors.New("decision not found")
	ErrDecisionExpired     = errors.New("decision has expired")
	ErrInvalidDecisionState = errors.New("invalid decision state for this operation")
)

// PolicyEnforcer valida ações contra políticas
type PolicyEnforcer struct {
	db *gorm.DB
}

// NewPolicyEnforcer cria novo enforcer
func NewPolicyEnforcer(db *gorm.DB) *PolicyEnforcer {
	return &PolicyEnforcer{db: db}
}

// PolicyCheckResult resultado da verificação de política
type PolicyCheckResult struct {
	Allowed          bool    `json:"allowed"`
	RequiresApproval bool    `json:"requires_approval"`
	Reason           string  `json:"reason,omitempty"`
	RiskScore        float64 `json:"risk_score"`
	PolicyID         uuid.UUID `json:"policy_id,omitempty"`
}

// CheckPolicy verifica se agente pode executar ação
func (e *PolicyEnforcer) CheckPolicy(agentID uuid.UUID, domain, action string, amount int64, riskScore float64) (*PolicyCheckResult, error) {
	// 1. Verificar se ação é globalmente proibida
	if IsForbiddenAction(action) {
		return &PolicyCheckResult{
			Allowed: false,
			Reason:  "action is forbidden for all agents",
		}, ErrActionForbidden
	}

	// 2. Buscar agente
	var agent Agent
	if err := e.db.Where("id = ?", agentID).First(&agent).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAgentNotFound
		}
		return nil, err
	}

	// 3. Verificar status do agente
	if agent.Status == string(AgentStatusSuspended) {
		return &PolicyCheckResult{
			Allowed: false,
			Reason:  "agent is suspended",
		}, ErrAgentSuspended
	}

	// 4. Buscar política para o domínio
	var policy AgentPolicy
	if err := e.db.Where("agent_id = ? AND domain = ?", agentID, domain).First(&policy).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &PolicyCheckResult{
				Allowed: false,
				Reason:  fmt.Sprintf("no policy for domain %s", domain),
			}, ErrPolicyNotFound
		}
		return nil, err
	}

	// 5. Verificar se ação está na lista de permitidas
	var allowedActions []string
	if err := json.Unmarshal([]byte(policy.AllowedActions), &allowedActions); err != nil {
		return nil, fmt.Errorf("invalid allowed_actions format: %w", err)
	}

	actionAllowed := false
	for _, a := range allowedActions {
		if a == action {
			actionAllowed = true
			break
		}
	}

	if !actionAllowed {
		return &PolicyCheckResult{
			Allowed:  false,
			Reason:   fmt.Sprintf("action %s not in allowed list", action),
			PolicyID: policy.ID,
		}, ErrActionNotAllowed
	}

	// 6. Verificar ações proibidas explicitamente
	if policy.ForbiddenActions != "" {
		var forbiddenActions []string
		if err := json.Unmarshal([]byte(policy.ForbiddenActions), &forbiddenActions); err == nil {
			for _, f := range forbiddenActions {
				if f == action {
					return &PolicyCheckResult{
						Allowed:  false,
						Reason:   fmt.Sprintf("action %s is explicitly forbidden", action),
						PolicyID: policy.ID,
					}, ErrActionNotAllowed
				}
			}
		}
	}

	// 7. Verificar limite de valor
	if policy.MaxAmount > 0 && amount > policy.MaxAmount {
		return &PolicyCheckResult{
			Allowed:  false,
			Reason:   fmt.Sprintf("amount %d exceeds limit %d", amount, policy.MaxAmount),
			PolicyID: policy.ID,
		}, ErrAmountExceedsLimit
	}

	// 8. Verificar limite diário
	dailyCount, err := e.getDailyActionCount(agentID)
	if err != nil {
		return nil, err
	}
	if dailyCount >= policy.DailyLimit {
		return &PolicyCheckResult{
			Allowed:  false,
			Reason:   fmt.Sprintf("daily limit %d exceeded", policy.DailyLimit),
			PolicyID: policy.ID,
		}, ErrDailyLimitExceeded
	}

	// 9. Determinar se precisa aprovação
	requiresApproval := policy.RequiresApproval || riskScore > policy.MaxRiskScore

	return &PolicyCheckResult{
		Allowed:          true,
		RequiresApproval: requiresApproval,
		RiskScore:        riskScore,
		PolicyID:         policy.ID,
	}, nil
}

// getDailyActionCount conta ações do dia
func (e *PolicyEnforcer) getDailyActionCount(agentID uuid.UUID) (int, error) {
	today := time.Now().Format("2006-01-02")
	
	var stats AgentDailyStats
	err := e.db.Where("agent_id = ? AND date = ?", agentID, today).First(&stats).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	
	return stats.ActionsCount, nil
}

// IncrementDailyCount incrementa contador diário
func (e *PolicyEnforcer) IncrementDailyCount(agentID uuid.UUID, field string) error {
	today := time.Now().Format("2006-01-02")
	
	var stats AgentDailyStats
	err := e.db.Where("agent_id = ? AND date = ?", agentID, today).First(&stats).Error
	
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Criar novo registro
		stats = AgentDailyStats{
			ID:        uuid.New(),
			AgentID:   agentID,
			Date:      today,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	} else if err != nil {
		return err
	}

	// Incrementar campo apropriado
	switch field {
	case "actions":
		stats.ActionsCount++
	case "approved":
		stats.ApprovedCount++
	case "rejected":
		stats.RejectedCount++
	case "executed":
		stats.ExecutedCount++
	}
	stats.UpdatedAt = time.Now()

	return e.db.Save(&stats).Error
}

// ========================================
// RISK ENGINE
// ========================================

// RiskFactors fatores para cálculo de risco
type RiskFactors struct {
	Amount           int64   // Valor envolvido
	ActionFrequency  int     // Quantas vezes essa ação foi feita hoje
	AgentHistory     float64 // Taxa de sucesso histórica do agente
	EntityState      string  // Estado atual da entidade alvo
	TimeOfDay        int     // Hora do dia (ações noturnas = mais risco)
	IsFirstAction    bool    // Primeira ação do agente
}

// CalculateRiskScore calcula score de risco (0.0 a 1.0)
func CalculateRiskScore(factors RiskFactors) float64 {
	var score float64 = 0.0

	// Fator 1: Valor (0-0.3)
	if factors.Amount > 100000 { // > R$1000
		score += 0.3
	} else if factors.Amount > 10000 { // > R$100
		score += 0.15
	} else if factors.Amount > 1000 { // > R$10
		score += 0.05
	}

	// Fator 2: Frequência (0-0.2)
	if factors.ActionFrequency > 50 {
		score += 0.2
	} else if factors.ActionFrequency > 20 {
		score += 0.1
	} else if factors.ActionFrequency > 10 {
		score += 0.05
	}

	// Fator 3: Histórico do agente (0-0.2)
	if factors.AgentHistory < 0.5 { // Menos de 50% de sucesso
		score += 0.2
	} else if factors.AgentHistory < 0.8 {
		score += 0.1
	}

	// Fator 4: Estado da entidade (0-0.2)
	if factors.EntityState == "disputed" {
		score += 0.2 // Entidade disputada = alto risco
	} else if factors.EntityState == "paused" {
		score += 0.05
	}

	// Fator 5: Hora do dia (0-0.05)
	if factors.TimeOfDay >= 0 && factors.TimeOfDay < 6 {
		score += 0.05 // Madrugada = mais risco
	}

	// Fator 6: Primeira ação (0-0.05)
	if factors.IsFirstAction {
		score += 0.05
	}

	// Normalizar para máximo 1.0
	if score > 1.0 {
		score = 1.0
	}

	return score
}

// RiskLevel nível de risco baseado no score
type RiskLevel string

const (
	RiskLow      RiskLevel = "low"      // < 0.2 - auto-approve
	RiskMedium   RiskLevel = "medium"   // 0.2-0.6 - human approval
	RiskHigh     RiskLevel = "high"     // >= 0.6 - blocked
)

// GetRiskLevel retorna nível de risco
func GetRiskLevel(score float64) RiskLevel {
	if score < 0.2 {
		return RiskLow
	}
	if score < 0.6 {
		return RiskMedium
	}
	return RiskHigh
}

// ShouldAutoApprove verifica se pode aprovar automaticamente
func ShouldAutoApprove(score float64) bool {
	return score < 0.2
}

// ShouldBlock verifica se deve bloquear
func ShouldBlock(score float64) bool {
	return score >= 0.6
}
