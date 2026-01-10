package rules

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ========================================
// SHADOW MODE - Observar sem agir
// "Veja tudo, não faça nada, registre tudo"
// ========================================

// ShadowMode controle do modo shadow
type ShadowMode struct {
	mu            sync.RWMutex
	active        bool
	activatedAt   *time.Time
	activatedBy   string
	reason        string
	expiresAt     *time.Time
	
	// Filtros (se vazio, aplica a tudo)
	appIDs        []uuid.UUID           // Apps específicos em shadow
	actionTypes   []RuleActionType      // Tipos de ação em shadow
	domains       []ActionDomain        // Domínios em shadow
}

var globalShadowMode = &ShadowMode{}

// ActivateShadowMode ativa o modo shadow
func ActivateShadowMode(activatedBy, reason string, duration *time.Duration, appIDs []uuid.UUID, actionTypes []RuleActionType, domains []ActionDomain) {
	globalShadowMode.mu.Lock()
	defer globalShadowMode.mu.Unlock()
	
	now := time.Now()
	globalShadowMode.active = true
	globalShadowMode.activatedAt = &now
	globalShadowMode.activatedBy = activatedBy
	globalShadowMode.reason = reason
	globalShadowMode.appIDs = appIDs
	globalShadowMode.actionTypes = actionTypes
	globalShadowMode.domains = domains
	
	if duration != nil {
		expiresAt := now.Add(*duration)
		globalShadowMode.expiresAt = &expiresAt
	}
}

// DeactivateShadowMode desativa o modo shadow
func DeactivateShadowMode() {
	globalShadowMode.mu.Lock()
	defer globalShadowMode.mu.Unlock()
	
	globalShadowMode.active = false
	globalShadowMode.activatedAt = nil
	globalShadowMode.activatedBy = ""
	globalShadowMode.reason = ""
	globalShadowMode.expiresAt = nil
	globalShadowMode.appIDs = nil
	globalShadowMode.actionTypes = nil
	globalShadowMode.domains = nil
}

// IsShadowModeActive verifica se shadow mode está ativo para uma ação específica
func IsShadowModeActive(appID uuid.UUID, actionType RuleActionType) bool {
	globalShadowMode.mu.RLock()
	defer globalShadowMode.mu.RUnlock()
	
	if !globalShadowMode.active {
		return false
	}
	
	// Verificar expiração
	if globalShadowMode.expiresAt != nil && time.Now().After(*globalShadowMode.expiresAt) {
		return false
	}
	
	// Se tem filtros, verificar se aplica
	if len(globalShadowMode.appIDs) > 0 {
		found := false
		for _, id := range globalShadowMode.appIDs {
			if id == appID {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	
	if len(globalShadowMode.actionTypes) > 0 {
		found := false
		for _, at := range globalShadowMode.actionTypes {
			if at == actionType {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	
	if len(globalShadowMode.domains) > 0 {
		domain := GetActionDomain(actionType)
		found := false
		for _, d := range globalShadowMode.domains {
			if d == domain {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	
	return true
}

// GetShadowModeStatus retorna status do shadow mode
func GetShadowModeStatus() map[string]interface{} {
	globalShadowMode.mu.RLock()
	defer globalShadowMode.mu.RUnlock()
	
	return map[string]interface{}{
		"active":        globalShadowMode.active,
		"activated_at":  globalShadowMode.activatedAt,
		"activated_by":  globalShadowMode.activatedBy,
		"reason":        globalShadowMode.reason,
		"expires_at":    globalShadowMode.expiresAt,
		"app_ids":       globalShadowMode.appIDs,
		"action_types":  globalShadowMode.actionTypes,
		"domains":       globalShadowMode.domains,
	}
}

// ========================================
// SHADOW EXECUTION - Execução simulada
// ========================================

// ShadowExecution registro de execução em shadow mode
type ShadowExecution struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	AppID         uuid.UUID      `gorm:"type:uuid;index" json:"app_id"`
	RuleID        uuid.UUID      `gorm:"type:uuid;index" json:"rule_id"`
	RuleName      string         `gorm:"size:100" json:"rule_name"`
	
	// Ação que SERIA executada
	ActionType    RuleActionType `gorm:"size:30" json:"action_type"`
	ActionDomain  ActionDomain   `gorm:"size:20" json:"action_domain"`
	ActionConfig  string         `gorm:"type:text" json:"action_config"`
	
	// Contexto
	TriggerData   string         `gorm:"type:text" json:"trigger_data"`   // Métricas que triggaram
	ConditionMet  bool           `json:"condition_met"`
	
	// Validação (o que TERIA acontecido)
	WouldBeAllowed bool          `json:"would_be_allowed"`
	WouldBlockReason string      `gorm:"size:500" json:"would_block_reason"`
	
	// Resultado simulado
	SimulatedResult string       `gorm:"type:text" json:"simulated_result"`
	
	// Timing
	ExecutedAt    time.Time      `json:"executed_at"`
	DurationMs    int64          `json:"duration_ms"`
}

func (ShadowExecution) TableName() string {
	return "shadow_executions"
}

// RecordShadowExecution registra uma execução em shadow mode
func (s *RulesService) RecordShadowExecution(rule *Rule, metrics map[string]float64, conditionMet bool, validation ActionValidationResult) {
	triggerData, _ := json.Marshal(metrics)
	
	// Simular resultado
	simulatedResult := map[string]interface{}{
		"action_type": rule.ActionType,
		"would_execute": validation.Allowed && conditionMet,
		"metrics": metrics,
	}
	resultJSON, _ := json.Marshal(simulatedResult)
	
	exec := ShadowExecution{
		ID:               uuid.New(),
		AppID:            rule.AppID,
		RuleID:           rule.ID,
		RuleName:         rule.Name,
		ActionType:       rule.ActionType,
		ActionDomain:     GetActionDomain(rule.ActionType),
		ActionConfig:     rule.ActionConfig,
		TriggerData:      string(triggerData),
		ConditionMet:     conditionMet,
		WouldBeAllowed:   validation.Allowed,
		WouldBlockReason: validation.Reason,
		SimulatedResult:  string(resultJSON),
		ExecutedAt:       time.Now(),
	}
	
	s.db.Create(&exec)
}

// GetShadowExecutions retorna execuções em shadow mode
func (s *RulesService) GetShadowExecutions(appID uuid.UUID, limit int) ([]ShadowExecution, error) {
	var executions []ShadowExecution
	query := s.db.Order("executed_at DESC").Limit(limit)
	
	if appID != uuid.Nil {
		query = query.Where("app_id = ?", appID)
	}
	
	err := query.Find(&executions).Error
	return executions, err
}

// GetShadowStats retorna estatísticas do shadow mode
func (s *RulesService) GetShadowStats(appID uuid.UUID, since time.Duration) map[string]interface{} {
	cutoff := time.Now().Add(-since)
	
	var total int64
	var wouldExecute int64
	var wouldBlock int64
	
	query := s.db.Model(&ShadowExecution{}).Where("executed_at > ?", cutoff)
	if appID != uuid.Nil {
		query = query.Where("app_id = ?", appID)
	}
	
	query.Count(&total)
	query.Where("would_be_allowed = ? AND condition_met = ?", true, true).Count(&wouldExecute)
	query.Where("would_be_allowed = ?", false).Count(&wouldBlock)
	
	// Por domínio
	type DomainCount struct {
		ActionDomain ActionDomain
		Count        int64
	}
	var domainCounts []DomainCount
	s.db.Model(&ShadowExecution{}).
		Where("executed_at > ?", cutoff).
		Select("action_domain, count(*) as count").
		Group("action_domain").
		Scan(&domainCounts)
	
	byDomain := make(map[string]int64)
	for _, dc := range domainCounts {
		byDomain[string(dc.ActionDomain)] = dc.Count
	}
	
	return map[string]interface{}{
		"total":         total,
		"would_execute": wouldExecute,
		"would_block":   wouldBlock,
		"by_domain":     byDomain,
		"since":         since.String(),
	}
}
