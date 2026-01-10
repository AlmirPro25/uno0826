package rules

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// RULES HANDLER - API de Regras
// ========================================

type RulesHandler struct {
	service *RulesService
}

func NewRulesHandler(service *RulesService) *RulesHandler {
	return &RulesHandler{service: service}
}

// ========================================
// CRUD DE REGRAS
// ========================================

// CreateRule cria uma nova regra
// POST /api/v1/admin/rules
func (h *RulesHandler) CreateRule(c *gin.Context) {
	var rule Rule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validar app_id
	if rule.AppID == uuid.Nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_id é obrigatório"})
		return
	}
	
	// Pegar user_id do contexto
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(uuid.UUID); ok {
			rule.CreatedBy = id
		}
	}
	
	if err := h.service.CreateRule(&rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusCreated, rule)
}

// GetRule busca uma regra por ID
// GET /api/v1/admin/rules/:id
func (h *RulesHandler) GetRule(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	
	rule, err := h.service.GetRule(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Regra não encontrada"})
		return
	}
	
	c.JSON(http.StatusOK, rule)
}

// GetRulesByApp busca regras de um app
// GET /api/v1/admin/rules/app/:appId
func (h *RulesHandler) GetRulesByApp(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	rules, err := h.service.GetRulesByApp(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"rules": rules,
		"total": len(rules),
	})
}

// UpdateRule atualiza uma regra
// PUT /api/v1/admin/rules/:id
func (h *RulesHandler) UpdateRule(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	
	var rule Rule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	rule.ID = id
	if err := h.service.UpdateRule(&rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, rule)
}

// DeleteRule deleta uma regra
// DELETE /api/v1/admin/rules/:id
func (h *RulesHandler) DeleteRule(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	
	if err := h.service.DeleteRule(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Regra deletada"})
}

// ToggleRule ativa/desativa uma regra
// POST /api/v1/admin/rules/:id/toggle
func (h *RulesHandler) ToggleRule(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	
	var req struct {
		Active bool `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if err := h.service.ToggleRule(id, req.Active); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	status := "desativada"
	if req.Active {
		status = "ativada"
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Regra " + status})
}

// ========================================
// TEMPLATES DE REGRAS
// ========================================

// GetPredefinedRules retorna templates de regras
// GET /api/v1/admin/rules/templates
func (h *RulesHandler) GetPredefinedRules(c *gin.Context) {
	templates := GetPredefinedRules()
	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
		"total":     len(templates),
	})
}

// CreateFromTemplate cria regra a partir de template
// POST /api/v1/admin/rules/from-template
func (h *RulesHandler) CreateFromTemplate(c *gin.Context) {
	var req struct {
		TemplateID string    `json:"template_id" binding:"required"`
		AppID      uuid.UUID `json:"app_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Buscar template
	templates := GetPredefinedRules()
	var template *PredefinedRule
	for _, t := range templates {
		if t.ID == req.TemplateID {
			template = &t
			break
		}
	}
	
	if template == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template não encontrado"})
		return
	}
	
	// Criar regra a partir do template
	rule := template.Rule
	rule.AppID = req.AppID
	
	// Pegar user_id do contexto
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(uuid.UUID); ok {
			rule.CreatedBy = id
		}
	}
	
	if err := h.service.CreateRule(&rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusCreated, rule)
}

// ========================================
// HISTÓRICO DE EXECUÇÕES
// ========================================

// GetRuleExecutions busca histórico de execuções de uma regra
// GET /api/v1/admin/rules/:id/executions
func (h *RulesHandler) GetRuleExecutions(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}
	
	executions, err := h.service.GetRuleExecutions(id, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"executions": executions,
		"total":      len(executions),
	})
}

// GetAppRuleExecutions busca histórico de execuções de um app
// GET /api/v1/admin/rules/app/:appId/executions
func (h *RulesHandler) GetAppRuleExecutions(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}
	
	executions, err := h.service.GetAppRuleExecutions(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"executions": executions,
		"total":      len(executions),
	})
}

// ========================================
// ROUTES REGISTRATION
// ========================================

// RegisterRulesRoutes registra rotas de regras
func RegisterRulesRoutes(router *gin.RouterGroup, service *RulesService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewRulesHandler(service)
	
	rules := router.Group("/admin/rules")
	rules.Use(authMiddleware)
	rules.Use(adminMiddleware)
	{
		// CRUD
		rules.POST("", handler.CreateRule)
		rules.GET("/:id", handler.GetRule)
		rules.PUT("/:id", handler.UpdateRule)
		rules.DELETE("/:id", handler.DeleteRule)
		rules.POST("/:id/toggle", handler.ToggleRule)
		
		// Por app
		rules.GET("/app/:appId", handler.GetRulesByApp)
		rules.GET("/app/:appId/executions", handler.GetAppRuleExecutions)
		
		// Templates
		rules.GET("/templates", handler.GetPredefinedRules)
		rules.POST("/from-template", handler.CreateFromTemplate)
		
		// Execuções
		rules.GET("/:id/executions", handler.GetRuleExecutions)
		
		// App Configs (configurações dinâmicas)
		rules.GET("/app/:appId/configs", handler.GetAppConfigs)
		rules.POST("/app/:appId/configs", handler.SetAppConfig)
		rules.DELETE("/app/:appId/configs/:key", handler.DeleteAppConfig)
		
		// Kill Switch - Controle Humano
		rules.GET("/killswitch", handler.GetKillSwitchStatus)
		rules.POST("/killswitch/activate", handler.ActivateKillSwitchHandler)
		rules.POST("/killswitch/deactivate", handler.DeactivateKillSwitchHandler)
		
		// Políticas de Ações
		rules.GET("/policies", handler.GetActionPolicies)
		rules.POST("/actions/:type/pause", handler.PauseActionTypeHandler)
		rules.POST("/actions/:type/resume", handler.ResumeActionTypeHandler)
		
		// Shadow Mode - Observar sem agir
		rules.GET("/shadow", handler.GetShadowModeStatus)
		rules.POST("/shadow/activate", handler.ActivateShadowModeHandler)
		rules.POST("/shadow/deactivate", handler.DeactivateShadowModeHandler)
		rules.GET("/shadow/executions", handler.GetShadowExecutions)
		rules.GET("/shadow/stats", handler.GetShadowStats)
		
		// Authority - Níveis de autoridade
		rules.GET("/authority/levels", handler.GetAuthorityLevels)
		rules.GET("/authority/domains", handler.GetActionDomains)
		rules.POST("/authority/check", handler.CheckAuthority)
		
		// Audit - Logs de auditoria
		rules.GET("/audit", handler.GetAuditLogs)
	}
}

// ========================================
// APP CONFIGS - Configurações Dinâmicas
// ========================================

// GetAppConfigs retorna configurações de um app
// GET /api/v1/admin/rules/app/:appId/configs
func (h *RulesHandler) GetAppConfigs(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	configs, err := h.service.GetAppConfigs(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"configs": configs,
		"total":   len(configs),
	})
}

// SetAppConfig define uma configuração
// POST /api/v1/admin/rules/app/:appId/configs
func (h *RulesHandler) SetAppConfig(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	var req struct {
		Key       string `json:"key" binding:"required"`
		Value     string `json:"value" binding:"required"`
		ValueType string `json:"value_type"`
		Reason    string `json:"reason"`
		TTL       string `json:"ttl"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	config, err := h.service.SetAppConfig(appID, req.Key, req.Value, req.ValueType, req.Reason, req.TTL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, config)
}

// DeleteAppConfig remove uma configuração
// DELETE /api/v1/admin/rules/app/:appId/configs/:key
func (h *RulesHandler) DeleteAppConfig(c *gin.Context) {
	appIDStr := c.Param("appId")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "App ID inválido"})
		return
	}
	
	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Key é obrigatória"})
		return
	}
	
	if err := h.service.DeleteAppConfig(appID, key); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Config removida"})
}

// ========================================
// KILL SWITCH - Controle Humano
// ========================================

// GetKillSwitchStatus retorna status do kill switch
// GET /api/v1/admin/rules/killswitch
func (h *RulesHandler) GetKillSwitchStatus(c *gin.Context) {
	status := GetKillSwitchStatus()
	c.JSON(http.StatusOK, status)
}

// ActivateKillSwitchHandler ativa o kill switch
// POST /api/v1/admin/rules/killswitch/activate
func (h *RulesHandler) ActivateKillSwitchHandler(c *gin.Context) {
	var req struct {
		Reason          string `json:"reason" binding:"required"`
		AutoResumeAfter string `json:"auto_resume_after"` // Ex: "1h", "30m"
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	activatedBy := "admin"
	if user, exists := c.Get("user_email"); exists {
		activatedBy = user.(string)
	}
	
	var autoResume *time.Duration
	if req.AutoResumeAfter != "" {
		if d, err := time.ParseDuration(req.AutoResumeAfter); err == nil {
			autoResume = &d
		}
	}
	
	ActivateKillSwitch(activatedBy, req.Reason, autoResume)
	
	c.JSON(http.StatusOK, gin.H{
		"message":      "Kill switch ativado - todas as ações automáticas pausadas",
		"activated_by": activatedBy,
		"reason":       req.Reason,
	})
}

// DeactivateKillSwitchHandler desativa o kill switch
// POST /api/v1/admin/rules/killswitch/deactivate
func (h *RulesHandler) DeactivateKillSwitchHandler(c *gin.Context) {
	DeactivateKillSwitch()
	c.JSON(http.StatusOK, gin.H{
		"message": "Kill switch desativado - ações automáticas retomadas",
	})
}

// PauseActionTypeHandler pausa um tipo específico de ação
// POST /api/v1/admin/rules/actions/:type/pause
func (h *RulesHandler) PauseActionTypeHandler(c *gin.Context) {
	actionType := RuleActionType(c.Param("type"))
	PauseActionType(actionType)
	c.JSON(http.StatusOK, gin.H{
		"message":     "Tipo de ação pausado",
		"action_type": actionType,
	})
}

// ResumeActionTypeHandler resume um tipo específico de ação
// POST /api/v1/admin/rules/actions/:type/resume
func (h *RulesHandler) ResumeActionTypeHandler(c *gin.Context) {
	actionType := RuleActionType(c.Param("type"))
	ResumeActionType(actionType)
	c.JSON(http.StatusOK, gin.H{
		"message":     "Tipo de ação retomado",
		"action_type": actionType,
	})
}

// GetActionPolicies retorna políticas de ações
// GET /api/v1/admin/rules/policies
func (h *RulesHandler) GetActionPolicies(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"policies":           DefaultActionPolicies,
		"prohibited_actions": ProhibitedActions,
	})
}

// ========================================
// SHADOW MODE - Observar sem agir
// ========================================

// GetShadowModeStatus retorna status do shadow mode
// GET /api/v1/admin/rules/shadow
func (h *RulesHandler) GetShadowModeStatus(c *gin.Context) {
	status := GetShadowModeStatus()
	c.JSON(http.StatusOK, status)
}

// ActivateShadowModeHandler ativa o shadow mode
// POST /api/v1/admin/rules/shadow/activate
func (h *RulesHandler) ActivateShadowModeHandler(c *gin.Context) {
	var req struct {
		Reason      string           `json:"reason" binding:"required"`
		Duration    string           `json:"duration"`      // Ex: "1h", "24h"
		AppIDs      []string         `json:"app_ids"`       // Filtrar por apps
		ActionTypes []RuleActionType `json:"action_types"`  // Filtrar por tipos de ação
		Domains     []ActionDomain   `json:"domains"`       // Filtrar por domínios
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	activatedBy := "admin"
	if user, exists := c.Get("user_email"); exists {
		activatedBy = user.(string)
	}
	
	var duration *time.Duration
	if req.Duration != "" {
		if d, err := time.ParseDuration(req.Duration); err == nil {
			duration = &d
		}
	}
	
	// Converter app IDs
	var appIDs []uuid.UUID
	for _, idStr := range req.AppIDs {
		if id, err := uuid.Parse(idStr); err == nil {
			appIDs = append(appIDs, id)
		}
	}
	
	ActivateShadowMode(activatedBy, req.Reason, duration, appIDs, req.ActionTypes, req.Domains)
	
	c.JSON(http.StatusOK, gin.H{
		"message":      "Shadow mode ativado - ações serão simuladas sem execução real",
		"activated_by": activatedBy,
		"reason":       req.Reason,
		"duration":     req.Duration,
		"filters": gin.H{
			"app_ids":      req.AppIDs,
			"action_types": req.ActionTypes,
			"domains":      req.Domains,
		},
	})
}

// DeactivateShadowModeHandler desativa o shadow mode
// POST /api/v1/admin/rules/shadow/deactivate
func (h *RulesHandler) DeactivateShadowModeHandler(c *gin.Context) {
	DeactivateShadowMode()
	c.JSON(http.StatusOK, gin.H{
		"message": "Shadow mode desativado - ações serão executadas normalmente",
	})
}

// GetShadowExecutions retorna execuções em shadow mode
// GET /api/v1/admin/rules/shadow/executions
func (h *RulesHandler) GetShadowExecutions(c *gin.Context) {
	var appID uuid.UUID
	if appIDStr := c.Query("app_id"); appIDStr != "" {
		if id, err := uuid.Parse(appIDStr); err == nil {
			appID = id
		}
	}
	
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}
	
	executions, err := h.service.GetShadowExecutions(appID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"executions": executions,
		"total":      len(executions),
	})
}

// GetShadowStats retorna estatísticas do shadow mode
// GET /api/v1/admin/rules/shadow/stats
func (h *RulesHandler) GetShadowStats(c *gin.Context) {
	var appID uuid.UUID
	if appIDStr := c.Query("app_id"); appIDStr != "" {
		if id, err := uuid.Parse(appIDStr); err == nil {
			appID = id
		}
	}
	
	since := 24 * time.Hour // Default: últimas 24h
	if sinceStr := c.Query("since"); sinceStr != "" {
		if d, err := time.ParseDuration(sinceStr); err == nil {
			since = d
		}
	}
	
	stats := h.service.GetShadowStats(appID, since)
	c.JSON(http.StatusOK, stats)
}

// ========================================
// AUTHORITY - Níveis de autoridade
// ========================================

// GetAuthorityLevels retorna níveis de autoridade disponíveis
// GET /api/v1/admin/rules/authority/levels
func (h *RulesHandler) GetAuthorityLevels(c *gin.Context) {
	levels := []gin.H{
		{"level": AuthorityObserver, "rank": 1, "description": "Pode ver, não pode agir"},
		{"level": AuthoritySuggestor, "rank": 2, "description": "Pode sugerir ações (shadow mode)"},
		{"level": AuthorityOperator, "rank": 3, "description": "Pode executar ações operacionais"},
		{"level": AuthorityManager, "rank": 4, "description": "Pode mudar regras e configs"},
		{"level": AuthorityGovernor, "rank": 5, "description": "Pode mudar políticas"},
		{"level": AuthoritySovereign, "rank": 6, "description": "Pode desligar o sistema"},
	}
	c.JSON(http.StatusOK, gin.H{
		"levels":    levels,
		"hierarchy": AuthorityHierarchy,
	})
}

// GetActionDomains retorna domínios de ação disponíveis
// GET /api/v1/admin/rules/authority/domains
func (h *RulesHandler) GetActionDomains(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"domains":          DefaultDomainConfigs,
		"action_to_domain": ActionTypeToDomain,
	})
}

// CheckAuthority verifica se um ator tem autoridade para uma ação
// POST /api/v1/admin/rules/authority/check
func (h *RulesHandler) CheckAuthority(c *gin.Context) {
	var req struct {
		ActorLevel   AuthorityLevel `json:"actor_level" binding:"required"`
		ActionType   RuleActionType `json:"action_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	requiredLevel := GetRequiredAuthority(req.ActionType)
	hasAuth := HasAuthority(req.ActorLevel, requiredLevel)
	domain := GetActionDomain(req.ActionType)
	
	c.JSON(http.StatusOK, gin.H{
		"actor_level":    req.ActorLevel,
		"action_type":    req.ActionType,
		"action_domain":  domain,
		"required_level": requiredLevel,
		"has_authority":  hasAuth,
	})
}

// GetAuditLogs retorna logs de auditoria de ações
// GET /api/v1/admin/rules/audit
func (h *RulesHandler) GetAuditLogs(c *gin.Context) {
	var appID uuid.UUID
	if appIDStr := c.Query("app_id"); appIDStr != "" {
		if id, err := uuid.Parse(appIDStr); err == nil {
			appID = id
		}
	}
	
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}
	
	var logs []ActionAuditLog
	query := h.service.db.Order("executed_at DESC").Limit(limit)
	
	if appID != uuid.Nil {
		query = query.Where("app_id = ?", appID)
	}
	
	if actionType := c.Query("action_type"); actionType != "" {
		query = query.Where("action_type = ?", actionType)
	}
	
	if wasAllowed := c.Query("was_allowed"); wasAllowed != "" {
		query = query.Where("was_allowed = ?", wasAllowed == "true")
	}
	
	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"total": len(logs),
	})
}
