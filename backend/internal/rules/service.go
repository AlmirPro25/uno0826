package rules

import (
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// RULES SERVICE - Motor de decisão
// ========================================

type RulesService struct {
	db          *gorm.DB
	stopEval    chan struct{}
	evalWg      sync.WaitGroup
	
	// Callbacks para ações
	alertCallback   func(appID uuid.UUID, alertType, message string, data map[string]interface{})
	webhookCallback func(url, method string, headers map[string]string, body string) error
	flagCallback    func(appID uuid.UUID, target, flagName, flagValue string, ttl time.Duration) error
}

func NewRulesService(db *gorm.DB) *RulesService {
	// Auto-migrate
	db.AutoMigrate(&Rule{}, &RuleExecution{})
	
	svc := &RulesService{
		db:       db,
		stopEval: make(chan struct{}),
	}
	
	// Seed regras padrão para VOX-BRIDGE
	svc.seedDefaultRules()
	
	// Iniciar avaliador periódico
	svc.startPeriodicEvaluator()
	
	return svc
}

// seedDefaultRules cria regras padrão para o VOX-BRIDGE se não existirem
func (s *RulesService) seedDefaultRules() {
	// VOX-BRIDGE App ID
	appID, err := uuid.Parse("c573e4f0-a738-400c-a6bc-d890360a0057")
	if err != nil {
		return
	}
	
	// Verificar se já tem regras
	var count int64
	s.db.Model(&Rule{}).Where("app_id = ?", appID).Count(&count)
	if count > 0 {
		log.Printf("🧠 [RULES] VOX-BRIDGE já tem %d regras configuradas", count)
		return
	}
	
	rules := []Rule{
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Bounce Rate Crítico",
			Description: "Alerta quando bounce rate passa de 70%",
			Status:      RuleStatusActive,
			Priority:    10,
			TriggerType: TriggerMetric,
			Condition:   "bounce_rate > 70",
			ActionType:  ActionAlert,
			ActionConfig: `{"alert_type":"high_bounce","severity":"warning","message":"Bounce rate acima de 70%"}`,
			CooldownMinutes: 360,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Queda de Usuários Online",
			Description: "Alerta quando online cai para zero com sessões ativas",
			Status:      RuleStatusActive,
			Priority:    20,
			TriggerType: TriggerThreshold,
			Condition:   "online_now < 1 AND active_sessions > 0",
			ActionType:  ActionAlert,
			ActionConfig: `{"alert_type":"online_drop","severity":"critical","message":"Queda brusca de usuários online"}`,
			CooldownMinutes: 30,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Match Rate Baixo",
			Description: "Alerta quando menos de 20% das sessões resultam em match",
			Status:      RuleStatusActive,
			Priority:    5,
			TriggerType: TriggerMetric,
			Condition:   "match_rate < 20 AND total_sessions > 10",
			ActionType:  ActionAlert,
			ActionConfig: `{"alert_type":"low_match_rate","severity":"warning","message":"Taxa de match abaixo de 20%"}`,
			CooldownMinutes: 720,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Pico de Atividade",
			Description: "Alerta quando eventos/min passa de 10",
			Status:      RuleStatusActive,
			Priority:    3,
			TriggerType: TriggerThreshold,
			Condition:   "events_per_minute > 10",
			ActionType:  ActionAlert,
			ActionConfig: `{"alert_type":"activity_spike","severity":"info","message":"Pico de atividade detectado"}`,
			CooldownMinutes: 60,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        "Engajamento Alto",
			Description: "Alerta positivo quando match rate passa de 50%",
			Status:      RuleStatusActive,
			Priority:    2,
			TriggerType: TriggerMetric,
			Condition:   "match_rate > 50 AND total_sessions > 5",
			ActionType:  ActionAlert,
			ActionConfig: `{"alert_type":"high_engagement","severity":"info","message":"Engajamento alto - mais de 50% com match"}`,
			CooldownMinutes: 1440,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}
	
	for _, rule := range rules {
		if err := s.db.Create(&rule).Error; err != nil {
			log.Printf("⚠️ [RULES] Erro ao criar regra '%s': %v", rule.Name, err)
		} else {
			log.Printf("✅ [RULES] Regra criada: %s", rule.Name)
		}
	}
	
	log.Printf("🧠 [RULES] %d regras padrão criadas para VOX-BRIDGE", len(rules))
}

// SetAlertCallback define callback para alertas
func (s *RulesService) SetAlertCallback(cb func(appID uuid.UUID, alertType, message string, data map[string]interface{})) {
	s.alertCallback = cb
}

// SetWebhookCallback define callback para webhooks
func (s *RulesService) SetWebhookCallback(cb func(url, method string, headers map[string]string, body string) error) {
	s.webhookCallback = cb
}

// SetFlagCallback define callback para flags
func (s *RulesService) SetFlagCallback(cb func(appID uuid.UUID, target, flagName, flagValue string, ttl time.Duration) error) {
	s.flagCallback = cb
}

// Stop para o avaliador
func (s *RulesService) Stop() {
	close(s.stopEval)
	s.evalWg.Wait()
}

// ========================================
// AVALIADOR PERIÓDICO
// ========================================

func (s *RulesService) startPeriodicEvaluator() {
	s.evalWg.Add(1)
	go func() {
		defer s.evalWg.Done()
		ticker := time.NewTicker(1 * time.Minute) // Avalia a cada minuto
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				s.evaluateAllMetricRules()
			case <-s.stopEval:
				return
			}
		}
	}()
	log.Println("🧠 [RULES] Periodic evaluator started (interval: 1min)")
}

// evaluateAllMetricRules avalia todas as regras baseadas em métricas
func (s *RulesService) evaluateAllMetricRules() {
	var rules []Rule
	s.db.Where("status = ? AND trigger_type IN ?", RuleStatusActive, []RuleTriggerType{TriggerMetric, TriggerThreshold}).Find(&rules)
	
	for _, rule := range rules {
		go s.evaluateRule(&rule)
	}
}

// ========================================
// CRUD DE REGRAS
// ========================================

// CreateRule cria uma nova regra
func (s *RulesService) CreateRule(rule *Rule) error {
	rule.ID = uuid.New()
	rule.CreatedAt = time.Now()
	rule.UpdatedAt = time.Now()
	return s.db.Create(rule).Error
}

// GetRule busca uma regra por ID
func (s *RulesService) GetRule(id uuid.UUID) (*Rule, error) {
	var rule Rule
	err := s.db.First(&rule, "id = ?", id).Error
	return &rule, err
}

// GetRulesByApp busca regras de um app
func (s *RulesService) GetRulesByApp(appID uuid.UUID) ([]Rule, error) {
	var rules []Rule
	err := s.db.Where("app_id = ?", appID).Order("priority DESC, created_at DESC").Find(&rules).Error
	return rules, err
}

// UpdateRule atualiza uma regra
func (s *RulesService) UpdateRule(rule *Rule) error {
	rule.UpdatedAt = time.Now()
	return s.db.Save(rule).Error
}

// DeleteRule deleta uma regra
func (s *RulesService) DeleteRule(id uuid.UUID) error {
	return s.db.Delete(&Rule{}, "id = ?", id).Error
}

// ToggleRule ativa/desativa uma regra
func (s *RulesService) ToggleRule(id uuid.UUID, active bool) error {
	status := RuleStatusInactive
	if active {
		status = RuleStatusActive
	}
	return s.db.Model(&Rule{}).Where("id = ?", id).Update("status", status).Error
}

// ========================================
// AVALIAÇÃO DE REGRAS
// ========================================

// EvaluateRule avalia uma regra específica
func (s *RulesService) evaluateRule(rule *Rule) {
	start := time.Now()
	
	// Verificar cooldown
	if rule.LastTriggeredAt != nil {
		cooldown := time.Duration(rule.CooldownMinutes) * time.Minute
		if time.Since(*rule.LastTriggeredAt) < cooldown {
			return // Ainda em cooldown
		}
	}
	
	// Buscar métricas do app
	metrics, err := s.getAppMetrics(rule.AppID)
	if err != nil {
		log.Printf("⚠️ [RULES] Error getting metrics for app %s: %v", rule.AppID, err)
		return
	}
	
	// Avaliar condição
	conditionMet, err := s.evaluateCondition(rule.Condition, metrics)
	if err != nil {
		log.Printf("⚠️ [RULES] Error evaluating condition for rule %s: %v", rule.ID, err)
		return
	}
	
	// Registrar execução
	execution := &RuleExecution{
		ID:           uuid.New(),
		RuleID:       rule.ID,
		AppID:        rule.AppID,
		ConditionMet: conditionMet,
		ExecutedAt:   time.Now(),
		DurationMs:   time.Since(start).Milliseconds(),
	}
	
	if triggerData, err := json.Marshal(metrics); err == nil {
		execution.TriggerData = string(triggerData)
	}
	
	if conditionMet {
		// Executar ação
		result, err := s.executeAction(rule, metrics)
		execution.ActionTaken = true
		
		if err != nil {
			execution.Error = err.Error()
			log.Printf("⚠️ [RULES] Action failed for rule %s: %v", rule.ID, err)
		} else {
			if resultJSON, err := json.Marshal(result); err == nil {
				execution.ActionResult = string(resultJSON)
			}
			
			// Atualizar regra
			now := time.Now()
			s.db.Model(rule).Updates(map[string]interface{}{
				"last_triggered_at": now,
				"trigger_count":     gorm.Expr("trigger_count + 1"),
			})
			
			log.Printf("🎯 [RULES] Rule triggered: %s (app: %s, action: %s)", rule.Name, rule.AppID, rule.ActionType)
		}
	}
	
	s.db.Create(execution)
}

// getAppMetrics busca métricas do app para avaliação
func (s *RulesService) getAppMetrics(appID uuid.UUID) (map[string]float64, error) {
	metrics := make(map[string]float64)
	
	// Buscar snapshot de métricas
	var snapshot struct {
		OnlineNow         int64
		ActiveSessions    int64
		TotalSessions     int64
		TotalEvents       int64
		EventsPerMinute   float64
		TotalInteractions int64
		ActiveUsers24h    int64
		TotalUsers        int64
	}
	
	err := s.db.Table("app_metrics_snapshots").
		Where("app_id = ?", appID).
		Select("online_now, active_sessions, total_sessions, total_events, events_per_minute, total_interactions, active_users_24h, total_users").
		Scan(&snapshot).Error
	
	if err != nil {
		return nil, err
	}
	
	metrics["online_now"] = float64(snapshot.OnlineNow)
	metrics["active_sessions"] = float64(snapshot.ActiveSessions)
	metrics["total_sessions"] = float64(snapshot.TotalSessions)
	metrics["total_events"] = float64(snapshot.TotalEvents)
	metrics["events_per_minute"] = snapshot.EventsPerMinute
	metrics["total_interactions"] = float64(snapshot.TotalInteractions)
	metrics["active_users_24h"] = float64(snapshot.ActiveUsers24h)
	metrics["total_users"] = float64(snapshot.TotalUsers)
	
	// Calcular métricas derivadas
	if snapshot.TotalSessions > 0 {
		// Bounce rate (sessões < 30s / total)
		var bounceSessions int64
		s.db.Table("app_sessions").
			Where("app_id = ? AND ended_at IS NOT NULL AND duration_ms < 30000", appID).
			Count(&bounceSessions)
		metrics["bounce_rate"] = float64(bounceSessions) / float64(snapshot.TotalSessions) * 100
		
		// Match rate
		var sessionsWithMatch int64
		s.db.Table("app_sessions").
			Where("app_id = ? AND interaction_count > 0", appID).
			Count(&sessionsWithMatch)
		metrics["match_rate"] = float64(sessionsWithMatch) / float64(snapshot.TotalSessions) * 100
	}
	
	// Retenção D1 (simplificado - média dos últimos 7 dias)
	// TODO: Implementar cálculo real de retenção
	metrics["retention_d1"] = 0
	metrics["retention_d7"] = 0
	
	return metrics, nil
}

// evaluateCondition avalia uma expressão de condição
func (s *RulesService) evaluateCondition(condition string, metrics map[string]float64) (bool, error) {
	if condition == "" {
		return true, nil
	}
	
	// Parser simples de condições
	// Suporta: metric < value, metric > value, metric == value
	// Suporta: AND, OR
	
	// Substituir métricas por valores
	evaluated := condition
	for name, value := range metrics {
		evaluated = strings.ReplaceAll(evaluated, name, fmt.Sprintf("%f", value))
	}
	
	// Avaliar expressão
	return s.evalExpression(evaluated)
}

// evalExpression avalia uma expressão booleana simples
func (s *RulesService) evalExpression(expr string) (bool, error) {
	expr = strings.TrimSpace(expr)
	
	// Tratar AND
	if strings.Contains(expr, " AND ") {
		parts := strings.Split(expr, " AND ")
		for _, part := range parts {
			result, err := s.evalExpression(part)
			if err != nil {
				return false, err
			}
			if !result {
				return false, nil
			}
		}
		return true, nil
	}
	
	// Tratar OR
	if strings.Contains(expr, " OR ") {
		parts := strings.Split(expr, " OR ")
		for _, part := range parts {
			result, err := s.evalExpression(part)
			if err != nil {
				return false, err
			}
			if result {
				return true, nil
			}
		}
		return false, nil
	}
	
	// Avaliar comparação simples
	return s.evalComparison(expr)
}

// evalComparison avalia uma comparação simples (ex: "10.5 < 20")
func (s *RulesService) evalComparison(expr string) (bool, error) {
	// Regex para capturar: número operador número
	re := regexp.MustCompile(`([\d.]+)\s*(<=|>=|<|>|==|!=)\s*([\d.]+)`)
	matches := re.FindStringSubmatch(expr)
	
	if len(matches) != 4 {
		return false, fmt.Errorf("invalid comparison: %s", expr)
	}
	
	left, err := strconv.ParseFloat(matches[1], 64)
	if err != nil {
		return false, err
	}
	
	right, err := strconv.ParseFloat(matches[3], 64)
	if err != nil {
		return false, err
	}
	
	op := matches[2]
	
	switch op {
	case "<":
		return left < right, nil
	case ">":
		return left > right, nil
	case "<=":
		return left <= right, nil
	case ">=":
		return left >= right, nil
	case "==":
		return left == right, nil
	case "!=":
		return left != right, nil
	default:
		return false, fmt.Errorf("unknown operator: %s", op)
	}
}

// ========================================
// EXECUÇÃO DE AÇÕES
// ========================================

func (s *RulesService) executeAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	
	switch rule.ActionType {
	case ActionAlert:
		return s.executeAlertAction(rule, metrics)
	case ActionWebhook:
		return s.executeWebhookAction(rule, metrics)
	case ActionFlag:
		return s.executeFlagAction(rule, metrics)
	case ActionNotify:
		return s.executeNotifyAction(rule, metrics)
	default:
		return result, fmt.Errorf("unknown action type: %s", rule.ActionType)
	}
}

func (s *RulesService) executeAlertAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	var config AlertActionConfig
	if rule.ActionConfig != "" {
		json.Unmarshal([]byte(rule.ActionConfig), &config)
	}
	
	// Usar defaults se não configurado
	if config.AlertType == "" {
		config.AlertType = "rule_triggered"
	}
	if config.Severity == "" {
		config.Severity = "warning"
	}
	if config.Message == "" {
		config.Message = fmt.Sprintf("Regra '%s' disparada", rule.Name)
	}
	
	// Chamar callback se configurado
	if s.alertCallback != nil {
		data := map[string]interface{}{
			"rule_id":   rule.ID.String(),
			"rule_name": rule.Name,
			"condition": rule.Condition,
			"metrics":   metrics,
			"severity":  config.Severity,
		}
		s.alertCallback(rule.AppID, config.AlertType, config.Message, data)
	}
	
	return map[string]interface{}{
		"alert_type": config.AlertType,
		"severity":   config.Severity,
		"message":    config.Message,
	}, nil
}

func (s *RulesService) executeWebhookAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	var config WebhookActionConfig
	if err := json.Unmarshal([]byte(rule.ActionConfig), &config); err != nil {
		return nil, fmt.Errorf("invalid webhook config: %v", err)
	}
	
	if config.URL == "" {
		return nil, fmt.Errorf("webhook URL is required")
	}
	
	// Substituir variáveis no body
	body := config.Body
	for name, value := range metrics {
		body = strings.ReplaceAll(body, "{{"+name+"}}", fmt.Sprintf("%f", value))
	}
	body = strings.ReplaceAll(body, "{{rule_name}}", rule.Name)
	body = strings.ReplaceAll(body, "{{app_id}}", rule.AppID.String())
	
	// Chamar callback se configurado
	if s.webhookCallback != nil {
		if err := s.webhookCallback(config.URL, config.Method, config.Headers, body); err != nil {
			return nil, err
		}
	}
	
	return map[string]interface{}{
		"url":    config.URL,
		"method": config.Method,
		"body":   body,
	}, nil
}

func (s *RulesService) executeFlagAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	var config FlagActionConfig
	if err := json.Unmarshal([]byte(rule.ActionConfig), &config); err != nil {
		return nil, fmt.Errorf("invalid flag config: %v", err)
	}
	
	// Chamar callback se configurado
	if s.flagCallback != nil {
		ttl := 24 * time.Hour // Default
		if config.TTL != "" {
			if d, err := time.ParseDuration(config.TTL); err == nil {
				ttl = d
			}
		}
		
		if err := s.flagCallback(rule.AppID, config.Target, config.FlagName, config.FlagValue, ttl); err != nil {
			return nil, err
		}
	}
	
	return map[string]interface{}{
		"flag_name":  config.FlagName,
		"flag_value": config.FlagValue,
		"target":     config.Target,
	}, nil
}

func (s *RulesService) executeNotifyAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	// TODO: Implementar notificações (email, push, slack)
	return map[string]interface{}{
		"status": "not_implemented",
	}, nil
}

// ========================================
// HISTÓRICO DE EXECUÇÕES
// ========================================

// GetRuleExecutions busca histórico de execuções de uma regra
func (s *RulesService) GetRuleExecutions(ruleID uuid.UUID, limit int) ([]RuleExecution, error) {
	var executions []RuleExecution
	err := s.db.Where("rule_id = ?", ruleID).Order("executed_at DESC").Limit(limit).Find(&executions).Error
	return executions, err
}

// GetAppRuleExecutions busca histórico de execuções de um app
func (s *RulesService) GetAppRuleExecutions(appID uuid.UUID, limit int) ([]RuleExecution, error) {
	var executions []RuleExecution
	err := s.db.Where("app_id = ?", appID).Order("executed_at DESC").Limit(limit).Find(&executions).Error
	return executions, err
}

// ========================================
// TRIGGER POR EVENTO
// ========================================

// TriggerByEvent dispara regras baseadas em evento
func (s *RulesService) TriggerByEvent(appID uuid.UUID, eventType string, eventData map[string]interface{}) {
	var rules []Rule
	s.db.Where("app_id = ? AND status = ? AND trigger_type = ?", appID, RuleStatusActive, TriggerEvent).Find(&rules)
	
	for _, rule := range rules {
		var config EventTriggerConfig
		if err := json.Unmarshal([]byte(rule.TriggerConfig), &config); err != nil {
			continue
		}
		
		// Verificar se o evento corresponde
		if config.EventType != eventType {
			continue
		}
		
		// Verificar filtros
		match := true
		for key, value := range config.Filters {
			if eventData[key] != value {
				match = false
				break
			}
		}
		
		if match {
			go s.evaluateRule(&rule)
		}
	}
}
