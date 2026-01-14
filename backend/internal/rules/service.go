package rules

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"prost-qs/backend/pkg/invariants"
)

// ========================================
// RULES SERVICE - Motor de decisão
// ========================================

type RulesService struct {
	db          *gorm.DB
	stopEval    chan struct{}
	evalWg      sync.WaitGroup
	planGuard   *PlanGuard // Verificador de plano
	
	// Callbacks para ações
	alertCallback   func(appID uuid.UUID, alertType, message string, data map[string]interface{})
	webhookCallback func(url, method string, headers map[string]string, body string) error
	flagCallback    func(appID uuid.UUID, target, flagName, flagValue string, ttl time.Duration) error
}

func NewRulesService(db *gorm.DB) *RulesService {
	// Auto-migrate
	db.AutoMigrate(&Rule{}, &RuleExecution{}, &AppConfig{}, &TemporaryRule{}, &ActionAuditLog{}, &ShadowExecution{}, &AuthorityGrant{})
	
	svc := &RulesService{
		db:        db,
		stopEval:  make(chan struct{}),
		planGuard: NewPlanGuard(db), // Inicializar PlanGuard
	}
	
	// Seed regras padrão para VOX-BRIDGE
	svc.seedDefaultRules()
	
	// Iniciar avaliador periódico
	svc.startPeriodicEvaluator()
	
	// Iniciar cleanup de regras temporárias
	svc.startTemporaryRulesCleanup()
	
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

// startTemporaryRulesCleanup inicia cleanup de regras temporárias expiradas
func (s *RulesService) startTemporaryRulesCleanup() {
	s.evalWg.Add(1)
	go func() {
		defer s.evalWg.Done()
		ticker := time.NewTicker(5 * time.Minute) // Verifica a cada 5 minutos
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				s.cleanupExpiredTemporaryRules()
				s.cleanupExpiredConfigs()
			case <-s.stopEval:
				return
			}
		}
	}()
	log.Println("🧹 [RULES] Temporary rules cleanup started (interval: 5min)")
}

// cleanupExpiredTemporaryRules desativa regras temporárias expiradas
func (s *RulesService) cleanupExpiredTemporaryRules() {
	var expiredRules []TemporaryRule
	s.db.Where("expires_at < ? AND auto_disabled = ?", time.Now(), false).Find(&expiredRules)
	
	for _, temp := range expiredRules {
		// Desativar a regra
		s.db.Model(&Rule{}).Where("id = ?", temp.RuleID).Update("status", RuleStatusInactive)
		
		// Marcar como desativada
		now := time.Now()
		temp.AutoDisabled = true
		temp.DisabledAt = &now
		s.db.Save(&temp)
		
		log.Printf("🧹 [CLEANUP] Regra temporária expirada desativada: %s", temp.RuleID)
	}
}

// cleanupExpiredConfigs remove configs expiradas
func (s *RulesService) cleanupExpiredConfigs() {
	var expiredConfigs []AppConfig
	s.db.Where("expires_at IS NOT NULL AND expires_at < ?", time.Now()).Find(&expiredConfigs)
	
	for _, config := range expiredConfigs {
		// Restaurar valor anterior se existir
		if config.PreviousValue != "" {
			config.Value = config.PreviousValue
			config.PreviousValue = ""
			config.ExpiresAt = nil
			config.Source = "auto_restore"
			config.Reason = "TTL expirado, valor restaurado"
			config.UpdatedAt = time.Now()
			s.db.Save(&config)
			
			log.Printf("🔄 [CLEANUP] Config restaurada: %s.%s = %s", config.AppID, config.Key, config.Value)
		} else {
			// Deletar se não tinha valor anterior
			s.db.Delete(&config)
			log.Printf("🧹 [CLEANUP] Config expirada removida: %s.%s", config.AppID, config.Key)
		}
	}
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
// PROTEGIDO POR PLAN GUARD: Verifica se o plano permite o tipo de ação
func (s *RulesService) CreateRule(rule *Rule) error {
	// Verificar se o plano permite criar esta regra
	validation := s.planGuard.ValidateRuleCreation(rule.AppID, rule.ActionType)
	if !validation.Allowed {
		log.Printf("🚫 [RULES] Criação bloqueada: app=%s action=%s reason=%s plan=%s",
			rule.AppID, rule.ActionType, validation.Reason, validation.PlanID)
		return fmt.Errorf("PLAN_BLOCKED: %s (upgrade para: %s)", validation.Reason, validation.UpgradeTo)
	}

	rule.ID = uuid.New()
	rule.CreatedAt = time.Now()
	rule.UpdatedAt = time.Now()
	
	log.Printf("✅ [RULES] Regra criada: app=%s action=%s plan=%s",
		rule.AppID, rule.ActionType, validation.PlanID)
	
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
// PROTEGIDO POR INVARIANTS: Anti-recursão e rate limiting
func (s *RulesService) evaluateRule(rule *Rule) {
	start := time.Now()
	
	// ========================================
	// INVARIANT: Proteção contra recursão
	// ========================================
	cleanup, err := startRuleExecutionTracking(rule.AppID.String(), rule.ID.String())
	if err != nil {
		log.Printf("🚫 [RULES] Execução bloqueada por invariant: %s - %v", rule.ID, err)
		return
	}
	defer cleanup()
	
	// ========================================
	// INVARIANT: Verificar killswitch
	// ========================================
	if checkKillswitchForRules(rule.AppID.String()) {
		log.Printf("🛑 [RULES] Execução bloqueada por killswitch: app=%s rule=%s", rule.AppID, rule.ID)
		return
	}
	
	// Verificar cooldown
	if rule.LastTriggeredAt != nil {
		cooldown := time.Duration(rule.CooldownMinutes) * time.Minute
		if time.Since(*rule.LastTriggeredAt) < cooldown {
			return // Ainda em cooldown
		}
	}
	
	// ========================================
	// INVARIANT: Rate limiting de execuções
	// ========================================
	trackRuleExecution(rule.AppID.String(), rule.ID.String())
	
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
	
	// Buscar snapshot de métricas - query resiliente que não quebra se colunas faltam
	var snapshot struct {
		OnlineNow         int64
		ActiveSessions    int64
		TotalSessions     int64
		TotalEvents       int64
		EventsPerMinute   float64
		TotalInteractions int64
	}
	
	// Query básica sem colunas que podem não existir
	err := s.db.Table("telemetry_metrics_snapshots").
		Where("app_id = ?", appID).
		Select("online_now, active_sessions, total_sessions, total_events, events_per_minute, total_interactions").
		Scan(&snapshot).Error
	
	if err != nil {
		// Se não encontrou dados, retorna métricas zeradas (não é erro)
		if err.Error() == "record not found" {
			return metrics, nil
		}
		return nil, err
	}
	
	metrics["online_now"] = float64(snapshot.OnlineNow)
	metrics["active_sessions"] = float64(snapshot.ActiveSessions)
	metrics["total_sessions"] = float64(snapshot.TotalSessions)
	metrics["total_events"] = float64(snapshot.TotalEvents)
	metrics["events_per_minute"] = snapshot.EventsPerMinute
	metrics["total_interactions"] = float64(snapshot.TotalInteractions)
	
	// Tentar buscar colunas extras (podem não existir ainda)
	var extraMetrics struct {
		ActiveUsers24h int64
		TotalUsers     int64
	}
	extraErr := s.db.Table("telemetry_metrics_snapshots").
		Where("app_id = ?", appID).
		Select("COALESCE(active_users_24h, 0) as active_users_24h, COALESCE(total_users, 0) as total_users").
		Scan(&extraMetrics).Error
	
	if extraErr == nil {
		metrics["active_users_24h"] = float64(extraMetrics.ActiveUsers24h)
		metrics["total_users"] = float64(extraMetrics.TotalUsers)
	} else {
		// Colunas não existem ainda, usar zero
		metrics["active_users_24h"] = 0
		metrics["total_users"] = 0
	}
	
	// Calcular métricas derivadas
	if snapshot.TotalSessions > 0 {
		// Bounce rate (sessões < 30s / total)
		var bounceSessions int64
		s.db.Table("telemetry_sessions").
			Where("app_id = ? AND ended_at IS NOT NULL AND duration_ms < 30000", appID).
			Count(&bounceSessions)
		metrics["bounce_rate"] = float64(bounceSessions) / float64(snapshot.TotalSessions) * 100
		
		// Match rate
		var sessionsWithMatch int64
		s.db.Table("telemetry_sessions").
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
	
	// VALIDAÇÃO DE PLANO - Verificar se o plano permite esta ação
	planValidation := s.planGuard.ValidateActionExecution(rule.AppID, rule.ActionType)
	if !planValidation.Allowed {
		log.Printf("🚫 [RULES] Execução bloqueada por plano: app=%s action=%s plan=%s reason=%s",
			rule.AppID, rule.ActionType, planValidation.PlanID, planValidation.Reason)
		s.logBlockedAction(rule, fmt.Sprintf("PLAN: %s", planValidation.Reason))
		return map[string]interface{}{
			"blocked":     true,
			"reason":      planValidation.Reason,
			"plan":        planValidation.PlanID,
			"upgrade_to":  planValidation.UpgradeTo,
		}, fmt.Errorf("action blocked by plan: %s", planValidation.Reason)
	}
	
	// VALIDAÇÃO DE POLÍTICA - Antes de qualquer ação
	validation := ValidateAction(rule.ActionType, rule.AppID, rule.ActionConfig)
	
	// SHADOW MODE - Se ativo, apenas registra sem executar
	if IsShadowModeActive(rule.AppID, rule.ActionType) {
		s.RecordShadowExecution(rule, metrics, true, validation)
		return map[string]interface{}{
			"shadow_mode":    true,
			"would_execute":  validation.Allowed,
			"would_block":    !validation.Allowed,
			"block_reason":   validation.Reason,
		}, nil
	}
	
	if !validation.Allowed {
		// Registrar tentativa bloqueada
		s.logBlockedAction(rule, validation.Reason)
		return map[string]interface{}{
			"blocked":  true,
			"reason":   validation.Reason,
			"requires_approval": validation.RequiresApproval,
		}, fmt.Errorf("action blocked: %s", validation.Reason)
	}
	
	switch rule.ActionType {
	case ActionAlert:
		return s.executeAlertAction(rule, metrics)
	case ActionWebhook:
		return s.executeWebhookAction(rule, metrics)
	case ActionFlag:
		return s.executeFlagAction(rule, metrics)
	case ActionNotify:
		return s.executeNotifyAction(rule, metrics)
	case ActionAdjust:
		return s.executeAdjustAction(rule, metrics)
	case ActionCreateRule:
		return s.executeCreateRuleAction(rule, metrics)
	case ActionDisableRule:
		return s.executeDisableRuleAction(rule, metrics)
	case ActionEscalate:
		return s.executeEscalateAction(rule, metrics)
	default:
		return result, fmt.Errorf("unknown action type: %s", rule.ActionType)
	}
}

// logBlockedAction registra ação bloqueada para auditoria
func (s *RulesService) logBlockedAction(rule *Rule, reason string) {
	log := ActionAuditLog{
		ID:           uuid.New(),
		AppID:        rule.AppID,
		RuleID:       &rule.ID,
		ActionType:   rule.ActionType,
		ActionConfig: rule.ActionConfig,
		WasAllowed:   false,
		BlockReason:  reason,
		WasExecuted:  false,
		TriggeredBy:  "rule",
		ExecutedAt:   time.Now(),
	}
	s.db.Create(&log)
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
	
	// Default method
	if config.Method == "" {
		config.Method = "POST"
	}
	
	// Substituir variáveis no body
	body := config.Body
	for name, value := range metrics {
		body = strings.ReplaceAll(body, "{{"+name+"}}", fmt.Sprintf("%.2f", value))
	}
	body = strings.ReplaceAll(body, "{{rule_name}}", rule.Name)
	body = strings.ReplaceAll(body, "{{rule_id}}", rule.ID.String())
	body = strings.ReplaceAll(body, "{{app_id}}", rule.AppID.String())
	body = strings.ReplaceAll(body, "{{timestamp}}", time.Now().Format(time.RFC3339))
	
	// Se body vazio, criar payload padrão
	if body == "" {
		defaultPayload := map[string]interface{}{
			"rule_id":   rule.ID.String(),
			"rule_name": rule.Name,
			"app_id":    rule.AppID.String(),
			"condition": rule.Condition,
			"metrics":   metrics,
			"timestamp": time.Now().Format(time.RFC3339),
		}
		if b, err := json.Marshal(defaultPayload); err == nil {
			body = string(b)
		}
	}
	
	// Executar webhook real
	result, err := s.executeHTTPWebhook(config.URL, config.Method, config.Headers, body)
	if err != nil {
		return nil, err
	}
	
	return result, nil
}

// executeHTTPWebhook executa a chamada HTTP real
func (s *RulesService) executeHTTPWebhook(url, method string, headers map[string]string, body string) (map[string]interface{}, error) {
	// Criar request
	req, err := http.NewRequest(method, url, strings.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}
	
	// Headers padrão
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "PROST-QS-RulesEngine/1.0")
	
	// Headers customizados
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	
	// Cliente com timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	
	// Executar
	start := time.Now()
	resp, err := client.Do(req)
	duration := time.Since(start)
	
	if err != nil {
		return map[string]interface{}{
			"url":      url,
			"method":   method,
			"error":    err.Error(),
			"duration": duration.Milliseconds(),
		}, fmt.Errorf("webhook failed: %v", err)
	}
	defer resp.Body.Close()
	
	// Ler resposta (limitado a 1KB)
	respBody := make([]byte, 1024)
	n, _ := resp.Body.Read(respBody)
	
	result := map[string]interface{}{
		"url":           url,
		"method":        method,
		"status_code":   resp.StatusCode,
		"response_body": string(respBody[:n]),
		"duration_ms":   duration.Milliseconds(),
	}
	
	// Verificar status
	if resp.StatusCode >= 400 {
		return result, fmt.Errorf("webhook returned status %d", resp.StatusCode)
	}
	
	log.Printf("✅ [WEBHOOK] %s %s -> %d (%dms)", method, url, resp.StatusCode, duration.Milliseconds())
	
	return result, nil
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
// AÇÕES CONSEQUENTES - Mudam estado do sistema
// ========================================

// executeAdjustAction ajusta configuração do app
func (s *RulesService) executeAdjustAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	var config AdjustActionConfig
	if err := json.Unmarshal([]byte(rule.ActionConfig), &config); err != nil {
		return nil, fmt.Errorf("invalid adjust config: %v", err)
	}
	
	if config.ConfigKey == "" {
		return nil, fmt.Errorf("config_key is required")
	}
	
	// Buscar config atual
	var currentConfig AppConfig
	err := s.db.Where("app_id = ? AND key = ?", rule.AppID, config.ConfigKey).First(&currentConfig).Error
	
	previousValue := ""
	newValue := config.ConfigValue
	
	if err == nil {
		previousValue = currentConfig.Value
		
		// Aplicar operação se especificada
		if config.Operation != "" && config.Operation != "set" {
			currentFloat, _ := strconv.ParseFloat(currentConfig.Value, 64)
			switch config.Operation {
			case "increment":
				newValue = fmt.Sprintf("%f", currentFloat+config.Amount)
			case "decrement":
				newValue = fmt.Sprintf("%f", currentFloat-config.Amount)
			case "multiply":
				newValue = fmt.Sprintf("%f", currentFloat*config.Amount)
			}
		}
		
		// Atualizar
		currentConfig.Value = newValue
		currentConfig.PreviousValue = previousValue
		currentConfig.Source = "rule"
		currentConfig.SourceID = &rule.ID
		currentConfig.Reason = config.Reason
		currentConfig.UpdatedAt = time.Now()
		
		// TTL
		if config.TTL != "" {
			if d, err := time.ParseDuration(config.TTL); err == nil {
				expiresAt := time.Now().Add(d)
				currentConfig.ExpiresAt = &expiresAt
			}
		}
		
		s.db.Save(&currentConfig)
	} else {
		// Criar nova config
		newConfig := AppConfig{
			ID:            uuid.New(),
			AppID:         rule.AppID,
			Key:           config.ConfigKey,
			Value:         newValue,
			ValueType:     "string",
			Source:        "rule",
			SourceID:      &rule.ID,
			Reason:        config.Reason,
			PreviousValue: "",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		
		if config.TTL != "" {
			if d, err := time.ParseDuration(config.TTL); err == nil {
				expiresAt := time.Now().Add(d)
				newConfig.ExpiresAt = &expiresAt
			}
		}
		
		s.db.Create(&newConfig)
	}
	
	log.Printf("⚙️ [ADJUST] app=%s key=%s value=%s (was: %s) by rule=%s", 
		rule.AppID, config.ConfigKey, newValue, previousValue, rule.Name)
	
	return map[string]interface{}{
		"config_key":     config.ConfigKey,
		"new_value":      newValue,
		"previous_value": previousValue,
		"operation":      config.Operation,
	}, nil
}

// executeCreateRuleAction cria uma nova regra (meta-regra)
func (s *RulesService) executeCreateRuleAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	var config CreateRuleActionConfig
	if err := json.Unmarshal([]byte(rule.ActionConfig), &config); err != nil {
		return nil, fmt.Errorf("invalid create_rule config: %v", err)
	}
	
	if config.RuleName == "" {
		return nil, fmt.Errorf("rule_name is required")
	}
	
	// Substituir variáveis no nome e condição
	ruleName := config.RuleName
	condition := config.Condition
	for name, value := range metrics {
		ruleName = strings.ReplaceAll(ruleName, "{{"+name+"}}", fmt.Sprintf("%.2f", value))
		condition = strings.ReplaceAll(condition, "{{"+name+"}}", fmt.Sprintf("%.2f", value))
	}
	ruleName = strings.ReplaceAll(ruleName, "{{timestamp}}", time.Now().Format("2006-01-02 15:04"))
	
	// Criar nova regra
	newRule := Rule{
		ID:              uuid.New(),
		AppID:           rule.AppID,
		Name:            ruleName,
		Description:     config.RuleDescription + " (criada automaticamente por: " + rule.Name + ")",
		Status:          RuleStatusActive,
		TriggerType:     RuleTriggerType(config.TriggerType),
		Condition:       condition,
		ActionType:      RuleActionType(config.ActionType),
		ActionConfig:    config.ActionConfig,
		CooldownMinutes: config.CooldownMinutes,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		CreatedBy:       rule.ID, // Regra pai
	}
	
	if newRule.CooldownMinutes == 0 {
		newRule.CooldownMinutes = 60
	}
	
	if err := s.db.Create(&newRule).Error; err != nil {
		return nil, fmt.Errorf("failed to create rule: %v", err)
	}
	
	// Se tem TTL, registrar como temporária
	if config.TTL != "" {
		if d, err := time.ParseDuration(config.TTL); err == nil {
			tempRule := TemporaryRule{
				ID:            uuid.New(),
				RuleID:        newRule.ID,
				CreatedByRule: rule.ID,
				ExpiresAt:     time.Now().Add(d),
				AutoDisabled:  config.AutoDisable,
				CreatedAt:     time.Now(),
			}
			s.db.Create(&tempRule)
		}
	}
	
	log.Printf("🧠 [CREATE_RULE] Nova regra criada: %s (por: %s)", newRule.Name, rule.Name)
	
	return map[string]interface{}{
		"new_rule_id":   newRule.ID.String(),
		"new_rule_name": newRule.Name,
		"created_by":    rule.Name,
		"ttl":           config.TTL,
	}, nil
}

// executeDisableRuleAction desativa outra regra
func (s *RulesService) executeDisableRuleAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	var config DisableRuleActionConfig
	if err := json.Unmarshal([]byte(rule.ActionConfig), &config); err != nil {
		return nil, fmt.Errorf("invalid disable_rule config: %v", err)
	}
	
	var targetRule Rule
	
	if config.TargetRuleID != "" {
		targetID, err := uuid.Parse(config.TargetRuleID)
		if err != nil {
			return nil, fmt.Errorf("invalid target_rule_id: %v", err)
		}
		if err := s.db.First(&targetRule, "id = ?", targetID).Error; err != nil {
			return nil, fmt.Errorf("target rule not found: %v", err)
		}
	} else if config.TargetRuleName != "" {
		if err := s.db.First(&targetRule, "app_id = ? AND name = ?", rule.AppID, config.TargetRuleName).Error; err != nil {
			return nil, fmt.Errorf("target rule not found: %v", err)
		}
	} else {
		return nil, fmt.Errorf("target_rule_id or target_rule_name is required")
	}
	
	// Desativar
	targetRule.Status = RuleStatusPaused
	targetRule.UpdatedAt = time.Now()
	s.db.Save(&targetRule)
	
	log.Printf("⏸️ [DISABLE_RULE] Regra desativada: %s (por: %s, motivo: %s)", 
		targetRule.Name, rule.Name, config.Reason)
	
	return map[string]interface{}{
		"disabled_rule_id":   targetRule.ID.String(),
		"disabled_rule_name": targetRule.Name,
		"disabled_by":        rule.Name,
		"reason":             config.Reason,
	}, nil
}

// executeEscalateAction escala severidade de alertas não reconhecidos
func (s *RulesService) executeEscalateAction(rule *Rule, metrics map[string]float64) (map[string]interface{}, error) {
	var config EscalateActionConfig
	if err := json.Unmarshal([]byte(rule.ActionConfig), &config); err != nil {
		return nil, fmt.Errorf("invalid escalate config: %v", err)
	}
	
	if config.AfterMinutes == 0 {
		config.AfterMinutes = 30 // Default: 30 minutos
	}
	if config.NewSeverity == "" {
		config.NewSeverity = "critical"
	}
	
	// Buscar alertas não reconhecidos que passaram do tempo
	cutoff := time.Now().Add(-time.Duration(config.AfterMinutes) * time.Minute)
	
	query := s.db.Table("alert_history").
		Where("app_id = ? AND acknowledged = ? AND created_at < ?", rule.AppID, false, cutoff)
	
	if config.TargetAlertType != "" {
		query = query.Where("type = ?", config.TargetAlertType)
	}
	
	// Atualizar severidade
	result := query.Updates(map[string]interface{}{
		"severity": config.NewSeverity,
	})
	
	escalatedCount := result.RowsAffected
	
	if escalatedCount > 0 {
		log.Printf("⬆️ [ESCALATE] %d alertas escalados para %s (app: %s)", 
			escalatedCount, config.NewSeverity, rule.AppID)
	}
	
	return map[string]interface{}{
		"escalated_count": escalatedCount,
		"new_severity":    config.NewSeverity,
		"after_minutes":   config.AfterMinutes,
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

// ========================================
// APP CONFIGS - Configurações Dinâmicas
// ========================================

// GetAppConfigs retorna todas as configs de um app
func (s *RulesService) GetAppConfigs(appID uuid.UUID) ([]AppConfig, error) {
	var configs []AppConfig
	err := s.db.Where("app_id = ?", appID).Order("key ASC").Find(&configs).Error
	return configs, err
}

// GetAppConfig retorna uma config específica
func (s *RulesService) GetAppConfig(appID uuid.UUID, key string) (*AppConfig, error) {
	var config AppConfig
	err := s.db.Where("app_id = ? AND key = ?", appID, key).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// SetAppConfig define ou atualiza uma config
func (s *RulesService) SetAppConfig(appID uuid.UUID, key, value, valueType, reason, ttl string) (*AppConfig, error) {
	var config AppConfig
	err := s.db.Where("app_id = ? AND key = ?", appID, key).First(&config).Error
	
	if err != nil {
		// Criar nova
		config = AppConfig{
			ID:        uuid.New(),
			AppID:     appID,
			Key:       key,
			Value:     value,
			ValueType: valueType,
			Source:    "manual",
			Reason:    reason,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	} else {
		// Atualizar existente
		config.PreviousValue = config.Value
		config.Value = value
		config.Source = "manual"
		config.Reason = reason
		config.UpdatedAt = time.Now()
	}
	
	if valueType == "" {
		config.ValueType = "string"
	}
	
	// TTL
	if ttl != "" {
		if d, err := time.ParseDuration(ttl); err == nil {
			expiresAt := time.Now().Add(d)
			config.ExpiresAt = &expiresAt
		}
	}
	
	if err := s.db.Save(&config).Error; err != nil {
		return nil, err
	}
	
	log.Printf("⚙️ [CONFIG] app=%s key=%s value=%s (manual)", appID, key, value)
	
	return &config, nil
}

// DeleteAppConfig remove uma config
func (s *RulesService) DeleteAppConfig(appID uuid.UUID, key string) error {
	return s.db.Where("app_id = ? AND key = ?", appID, key).Delete(&AppConfig{}).Error
}

// GetAppConfigValue retorna apenas o valor de uma config (para uso em apps)
func (s *RulesService) GetAppConfigValue(appID uuid.UUID, key string, defaultValue string) string {
	config, err := s.GetAppConfig(appID, key)
	if err != nil {
		return defaultValue
	}
	
	// Verificar se expirou
	if config.ExpiresAt != nil && config.ExpiresAt.Before(time.Now()) {
		return defaultValue
	}
	
	return config.Value
}

// ========================================
// INVARIANTS INTEGRATION
// "O sistema se recusa a entrar em colapso"
// ========================================

// Tracking de execuções por regra (para rate limiting)
var (
	ruleExecutionCounts     = make(map[string][]time.Time)
	ruleExecutionCountsLock sync.RWMutex
)

// startRuleExecutionTracking inicia tracking de execução com proteção anti-recursão
func startRuleExecutionTracking(appID, ruleID string) (func(), error) {
	return invariants.StartRuleExecution(appID, ruleID)
}

// checkKillswitchForRules verifica se o killswitch está ativo para regras
func checkKillswitchForRules(appID string) bool {
	return invariants.CheckKillswitchSafe(appID)
}

// trackRuleExecution registra execução para rate limiting
func trackRuleExecution(appID, ruleID string) {
	ruleExecutionCountsLock.Lock()
	defer ruleExecutionCountsLock.Unlock()
	
	key := appID + ":" + ruleID
	now := time.Now()
	oneMinuteAgo := now.Add(-1 * time.Minute)
	
	// Limpar execuções antigas
	if times, exists := ruleExecutionCounts[key]; exists {
		newTimes := make([]time.Time, 0)
		for _, t := range times {
			if t.After(oneMinuteAgo) {
				newTimes = append(newTimes, t)
			}
		}
		ruleExecutionCounts[key] = newTimes
	}
	
	// Adicionar nova execução
	ruleExecutionCounts[key] = append(ruleExecutionCounts[key], now)
	
	// Verificar rate limit via invariant
	count := len(ruleExecutionCounts[key])
	invariants.AssertRuleExecutionLimit(appID, ruleID, count)
}

// GetRuleExecutionRate retorna a taxa de execução de uma regra no último minuto
func (s *RulesService) GetRuleExecutionRate(appID, ruleID string) int {
	ruleExecutionCountsLock.RLock()
	defer ruleExecutionCountsLock.RUnlock()
	
	key := appID + ":" + ruleID
	if times, exists := ruleExecutionCounts[key]; exists {
		return len(times)
	}
	return 0
}

// NotifyKillswitchChange notifica o sistema de invariants sobre mudança no killswitch
func NotifyKillswitchChange(appID string, isActive bool) {
	invariants.UpdateKillswitchCache(appID, isActive)
}

// NotifyGlobalKillswitchChange notifica mudança no killswitch global
func NotifyGlobalKillswitchChange(isActive bool) {
	invariants.UpdateGlobalKillswitch(isActive)
}
