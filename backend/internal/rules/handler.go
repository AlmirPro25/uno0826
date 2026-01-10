package rules

import (
	"net/http"
	"strconv"

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
	}
}
