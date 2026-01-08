package policy

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// POLICY HANDLER - API REST
// ========================================

type PolicyHandler struct {
	service *PolicyService
}

func NewPolicyHandler(service *PolicyService) *PolicyHandler {
	return &PolicyHandler{service: service}
}

// ========================================
// CRUD ENDPOINTS
// ========================================

// CreatePolicy cria uma nova política
// POST /api/v1/policies
func (h *PolicyHandler) CreatePolicy(c *gin.Context) {
	var policy Policy
	if err := c.ShouldBindJSON(&policy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pegar criador do contexto
	userID := c.GetString("userID")
	if userID != "" {
		policy.CreatedBy, _ = uuid.Parse(userID)
	}

	if err := h.service.CreatePolicy(&policy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar política"})
		return
	}

	c.JSON(http.StatusCreated, policy)
}

// ListPolicies lista todas as políticas
// GET /api/v1/policies
func (h *PolicyHandler) ListPolicies(c *gin.Context) {
	activeOnly := c.Query("active") != "false"
	
	policies, err := h.service.ListPolicies(activeOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar políticas"})
		return
	}

	c.JSON(http.StatusOK, policies)
}

// GetPolicy busca uma política por ID
// GET /api/v1/policies/:id
func (h *PolicyHandler) GetPolicy(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	policy, err := h.service.GetPolicy(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Política não encontrada"})
		return
	}

	c.JSON(http.StatusOK, policy)
}

// UpdatePolicy atualiza uma política
// PUT /api/v1/policies/:id
func (h *PolicyHandler) UpdatePolicy(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var updates Policy
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdatePolicy(id, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar política"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Política atualizada"})
}

// DeactivatePolicy desativa uma política
// DELETE /api/v1/policies/:id
func (h *PolicyHandler) DeactivatePolicy(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DeactivatePolicy(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao desativar política"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Política desativada"})
}

// ========================================
// AVALIAÇÃO
// ========================================

// Evaluate avalia uma ação contra as políticas
// POST /api/v1/policies/evaluate
func (h *PolicyHandler) Evaluate(c *gin.Context) {
	var req EvaluationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pegar ator do contexto se não fornecido
	if req.ActorID == uuid.Nil {
		userID := c.GetString("userID")
		if userID != "" {
			req.ActorID, _ = uuid.Parse(userID)
			req.ActorType = "user"
		}
	}

	result, err := h.service.Evaluate(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao avaliar"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetEvaluations busca histórico de avaliações
// GET /api/v1/policies/evaluations
func (h *PolicyHandler) GetEvaluations(c *gin.Context) {
	resource := c.Query("resource")
	action := c.Query("action")
	limit := 100

	evals, err := h.service.GetEvaluations(resource, action, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar avaliações"})
		return
	}

	c.JSON(http.StatusOK, evals)
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterPolicyRoutes registra as rotas de políticas
func RegisterPolicyRoutes(router *gin.RouterGroup, service *PolicyService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewPolicyHandler(service)

	policies := router.Group("/policies")
	policies.Use(authMiddleware)
	{
		// Avaliação - qualquer usuário autenticado pode avaliar
		policies.POST("/evaluate", handler.Evaluate)
		
		// CRUD - apenas admin
		policies.Use(adminMiddleware)
		{
			policies.POST("", handler.CreatePolicy)
			policies.GET("", handler.ListPolicies)
			policies.GET("/:id", handler.GetPolicy)
			policies.PUT("/:id", handler.UpdatePolicy)
			policies.DELETE("/:id", handler.DeactivatePolicy)
			policies.GET("/evaluations", handler.GetEvaluations)
		}
	}
}
