package agent

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// AGENT HANDLER - HTTP API
// ========================================

// AgentHandler gerencia endpoints de Agent
type AgentHandler struct {
	service         *AgentService
	governedService *GovernedAgentService
}

// NewAgentHandler cria novo handler
func NewAgentHandler(service *AgentService, governedService *GovernedAgentService) *AgentHandler {
	return &AgentHandler{
		service:         service,
		governedService: governedService,
	}
}

// ========================================
// HELPER - EXTRACT APP CONTEXT (Fase 16)
// ========================================

// extractAppContext extrai contexto de app do request
func extractAppContext(c *gin.Context) *AgentAppContext {
	ctx := &AgentAppContext{
		IP:        c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
	}

	// Tentar extrair app_id do contexto (se middleware de app estiver ativo)
	if appIDStr := c.GetString("appID"); appIDStr != "" {
		if appID, err := uuid.Parse(appIDStr); err == nil {
			ctx.AppID = &appID
		}
	}

	// Tentar extrair app_user_id
	if appUserIDStr := c.GetString("appUserID"); appUserIDStr != "" {
		if appUserID, err := uuid.Parse(appUserIDStr); err == nil {
			ctx.AppUserID = &appUserID
		}
	}

	// Tentar extrair session_id
	if sessionIDStr := c.GetString("sessionID"); sessionIDStr != "" {
		if sessionID, err := uuid.Parse(sessionIDStr); err == nil {
			ctx.SessionID = &sessionID
		}
	}

	return ctx
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

type CreateAgentRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Type        string `json:"type" binding:"required,oneof=observer operator executor"`
}

type CreatePolicyRequest struct {
	AgentID          string   `json:"agent_id" binding:"required"`
	Domain           string   `json:"domain" binding:"required,oneof=ads billing subscriptions ledger identity"`
	AllowedActions   []string `json:"allowed_actions" binding:"required"`
	MaxAmount        int64    `json:"max_amount"`
	RequiresApproval bool     `json:"requires_approval"`
}

type UpdatePolicyRequest struct {
	AllowedActions   []string `json:"allowed_actions" binding:"required"`
	MaxAmount        int64    `json:"max_amount"`
	RequiresApproval bool     `json:"requires_approval"`
	MaxRiskScore     float64  `json:"max_risk_score"`
	DailyLimit       int      `json:"daily_limit"`
}

type ProposeDecisionRequest struct {
	AgentID      string                 `json:"agent_id" binding:"required"`
	Domain       string                 `json:"domain" binding:"required"`
	Action       string                 `json:"action" binding:"required"`
	TargetEntity string                 `json:"target_entity" binding:"required"`
	Payload      map[string]interface{} `json:"payload"`
	Reason       string                 `json:"reason"`
	Amount       int64                  `json:"amount"`
}

type ReviewDecisionRequest struct {
	Note string `json:"note"`
}

// ========================================
// AGENT ENDPOINTS
// ========================================

// CreateAgent cria um agente
func (h *AgentHandler) CreateAgent(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req CreateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	agent, err := h.service.CreateAgent(ctx, userID, req.Name, req.Description, AgentType(req.Type))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar agente"})
		return
	}

	c.JSON(http.StatusCreated, agent)
}

// GetAgent busca um agente
func (h *AgentHandler) GetAgent(c *gin.Context) {
	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	agent, err := h.service.GetAgent(agentID)
	if err != nil {
		if err == ErrAgentNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Agente não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar agente"})
		return
	}

	c.JSON(http.StatusOK, agent)
}

// ListAgents lista agentes do tenant
func (h *AgentHandler) ListAgents(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	agents, err := h.service.ListAgents(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar agentes"})
		return
	}

	c.JSON(http.StatusOK, agents)
}

// SuspendAgent suspende um agente (GOVERNADO)
func (h *AgentHandler) SuspendAgent(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx := c.Request.Context()
	appCtx := extractAppContext(c) // Fase 16
	
	// Usar GovernedService para Audit
	agent, err := h.governedService.SuspendAgentGoverned(ctx, agentID, userID, "Suspenso via API", appCtx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao suspender agente"})
		return
	}

	c.JSON(http.StatusOK, agent)
}

// ActivateAgent ativa um agente
func (h *AgentHandler) ActivateAgent(c *gin.Context) {
	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx := c.Request.Context()
	agent, err := h.service.ActivateAgent(ctx, agentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao ativar agente"})
		return
	}

	c.JSON(http.StatusOK, agent)
}

// GetAgentStats retorna estatísticas do agente
func (h *AgentHandler) GetAgentStats(c *gin.Context) {
	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	stats, err := h.service.GetAgentStats(agentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar estatísticas"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ========================================
// POLICY ENDPOINTS
// ========================================

// CreatePolicy cria política para agente
func (h *AgentHandler) CreatePolicy(c *gin.Context) {
	var req CreatePolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	agentID, err := uuid.Parse(req.AgentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "agent_id inválido"})
		return
	}

	ctx := c.Request.Context()
	policy, err := h.service.CreatePolicy(ctx, agentID, PolicyDomain(req.Domain), req.AllowedActions, req.MaxAmount, req.RequiresApproval)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, policy)
}

// GetPolicies lista políticas de um agente
func (h *AgentHandler) GetPolicies(c *gin.Context) {
	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	policies, err := h.service.GetPolicies(agentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar políticas"})
		return
	}

	c.JSON(http.StatusOK, policies)
}

// UpdatePolicy atualiza política
func (h *AgentHandler) UpdatePolicy(c *gin.Context) {
	policyIDStr := c.Param("policyId")
	policyID, err := uuid.Parse(policyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req UpdatePolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	policy, err := h.service.UpdatePolicy(ctx, policyID, req.AllowedActions, req.MaxAmount, req.RequiresApproval, req.MaxRiskScore, req.DailyLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, policy)
}

// ========================================
// DECISION ENDPOINTS
// ========================================

// ProposeDecision agente propõe decisão (GOVERNADO)
func (h *AgentHandler) ProposeDecision(c *gin.Context) {
	var req ProposeDecisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	agentID, err := uuid.Parse(req.AgentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "agent_id inválido"})
		return
	}

	ctx := c.Request.Context()
	appCtx := extractAppContext(c) // Fase 16
	
	input := ProposeDecisionInput{
		AgentID:      agentID,
		Domain:       req.Domain,
		Action:       req.Action,
		TargetEntity: req.TargetEntity,
		Payload:      req.Payload,
		Reason:       req.Reason,
		Amount:       req.Amount,
	}

	// Usar GovernedService para Policy + KillSwitch + Audit
	decision, err := h.governedService.ProposeDecisionGoverned(ctx, input, appCtx)
	if err != nil {
		// Retornar decisão mesmo em caso de erro (para auditoria)
		if decision != nil {
			c.JSON(http.StatusConflict, gin.H{
				"error":    err.Error(),
				"decision": decision,
			})
			return
		}
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, decision)
}

// GetDecision busca decisão
func (h *AgentHandler) GetDecision(c *gin.Context) {
	decisionIDStr := c.Param("decisionId")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	decision, err := h.service.GetDecision(decisionID)
	if err != nil {
		if err == ErrDecisionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Decisão não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar decisão"})
		return
	}

	c.JSON(http.StatusOK, decision)
}

// ListPendingDecisions lista decisões pendentes
func (h *AgentHandler) ListPendingDecisions(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	decisions, err := h.service.ListPendingDecisions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar decisões"})
		return
	}

	c.JSON(http.StatusOK, decisions)
}

// ListDecisions lista decisões com filtros
func (h *AgentHandler) ListDecisions(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	status := c.Query("status")
	decisions, err := h.service.ListDecisions(userID, status, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar decisões"})
		return
	}

	c.JSON(http.StatusOK, decisions)
}

// ApproveDecision aprova decisão (GOVERNADO)
func (h *AgentHandler) ApproveDecision(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	decisionIDStr := c.Param("decisionId")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req ReviewDecisionRequest
	c.ShouldBindJSON(&req) // Opcional

	ctx := c.Request.Context()
	appCtx := extractAppContext(c) // Fase 16
	
	// Usar GovernedService para Policy + KillSwitch + Audit
	decision, err := h.governedService.ApproveDecisionGoverned(ctx, decisionID, userID, req.Note, appCtx)
	if err != nil {
		if err == ErrDecisionExpired {
			c.JSON(http.StatusGone, gin.H{"error": "Decisão expirada"})
			return
		}
		if err == ErrInvalidDecisionState {
			c.JSON(http.StatusConflict, gin.H{"error": "Estado inválido para aprovação"})
			return
		}
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, decision)
}

// RejectDecision rejeita decisão (GOVERNADO)
func (h *AgentHandler) RejectDecision(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	decisionIDStr := c.Param("decisionId")
	decisionID, err := uuid.Parse(decisionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req ReviewDecisionRequest
	c.ShouldBindJSON(&req)

	ctx := c.Request.Context()
	appCtx := extractAppContext(c) // Fase 16
	
	// Usar GovernedService para Audit
	decision, err := h.governedService.RejectDecisionGoverned(ctx, decisionID, userID, req.Note, appCtx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, decision)
}

// ========================================
// AUDIT ENDPOINTS
// ========================================

// GetExecutionLogs retorna logs de execução
func (h *AgentHandler) GetExecutionLogs(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	logs, err := h.service.GetExecutionLogs(userID, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar logs"})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterAgentRoutes registra rotas do módulo Agent
func RegisterAgentRoutes(router *gin.RouterGroup, service *AgentService, governedService *GovernedAgentService, authMiddleware gin.HandlerFunc) {
	handler := NewAgentHandler(service, governedService)

	agents := router.Group("/agents")
	{
		// Agent CRUD
		agents.POST("", authMiddleware, handler.CreateAgent)
		agents.GET("", authMiddleware, handler.ListAgents)
		agents.GET("/:agentId", authMiddleware, handler.GetAgent)
		agents.POST("/:agentId/suspend", authMiddleware, handler.SuspendAgent)
		agents.POST("/:agentId/activate", authMiddleware, handler.ActivateAgent)
		agents.GET("/:agentId/stats", authMiddleware, handler.GetAgentStats)
		agents.GET("/:agentId/policies", authMiddleware, handler.GetPolicies)

		// Policies
		agents.POST("/policies", authMiddleware, handler.CreatePolicy)
		agents.PUT("/policies/:policyId", authMiddleware, handler.UpdatePolicy)

		// Decisions
		agents.POST("/decisions", authMiddleware, handler.ProposeDecision)
		agents.GET("/decisions", authMiddleware, handler.ListDecisions)
		agents.GET("/decisions/pending", authMiddleware, handler.ListPendingDecisions)
		agents.GET("/decisions/:decisionId", authMiddleware, handler.GetDecision)
		agents.POST("/decisions/:decisionId/approve", authMiddleware, handler.ApproveDecision)
		agents.POST("/decisions/:decisionId/reject", authMiddleware, handler.RejectDecision)

		// Audit
		agents.GET("/audit/logs", authMiddleware, handler.GetExecutionLogs)
	}
}
