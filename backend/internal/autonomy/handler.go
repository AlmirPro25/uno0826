package autonomy

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// AUTONOMY HANDLER - API REST
// "Documentação pública da matriz de autonomia"
// ========================================

type AutonomyHandler struct {
	service *AutonomyService
}

func NewAutonomyHandler(service *AutonomyService) *AutonomyHandler {
	return &AutonomyHandler{service: service}
}

// ========================================
// MATRIZ DE AUTONOMIA (PÚBLICA)
// ========================================

// GetMatrix retorna a matriz completa de autonomia
// GET /api/v1/autonomy/matrix
func (h *AutonomyHandler) GetMatrix(c *gin.Context) {
	definitions := h.service.GetAllDefinitions()

	c.JSON(http.StatusOK, gin.H{
		"matrix": definitions,
		"levels": map[string]any{
			"0_forbidden": "Proibido - sempre bloqueado, requer humano",
			"1_shadow":    "Shadow - simulação apenas, nada executa",
			"2_audited":   "Audited - execução com auditoria reforçada",
			"3_full":      "Full - execução plena (apenas leitura)",
		},
		"rules": []string{
			"Autonomia total só existe onde não há mutação",
			"Dinheiro nunca é autônomo",
			"Delete é poder absoluto - só humano",
			"Impacto humano direto nunca é delegado",
		},
	})
}

// GetForbiddenActions retorna ações proibidas
// GET /api/v1/autonomy/forbidden
func (h *AutonomyHandler) GetForbiddenActions(c *gin.Context) {
	actions := h.service.GetForbiddenActions()
	c.JSON(http.StatusOK, gin.H{
		"forbidden_actions": actions,
		"reason":            "Estas ações NUNCA podem ser executadas autonomamente",
	})
}

// GetAutonomousActions retorna ações que podem ser autônomas
// GET /api/v1/autonomy/autonomous
func (h *AutonomyHandler) GetAutonomousActions(c *gin.Context) {
	actions := h.service.GetAutonomousActions()
	c.JSON(http.StatusOK, gin.H{
		"autonomous_actions": actions,
		"warning":            "Mesmo ações autônomas estão sujeitas a perfil do agente e limites",
	})
}

// ========================================
// VERIFICAÇÃO DE AUTONOMIA
// ========================================

// CheckAutonomy verifica se agente pode executar ação
// POST /api/v1/autonomy/check
func (h *AutonomyHandler) CheckAutonomy(c *gin.Context) {
	var req AutonomyCheckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.service.Check(req)
	if err != nil {
		// Mesmo com erro, retornamos a resposta (contém reason)
		if response != nil {
			c.JSON(http.StatusOK, response)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// ========================================
// PERFIL DE AUTONOMIA
// ========================================

// GetProfile busca perfil de autonomia de um agente
// GET /api/v1/autonomy/profiles/:agentId
func (h *AutonomyHandler) GetProfile(c *gin.Context) {
	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	profile, err := h.service.GetProfile(agentID)
	if err != nil {
		if err == ErrNoAutonomyProfile {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Agente sem perfil de autonomia",
				"default": "Shadow mode apenas",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// CreateProfile cria perfil de autonomia
// POST /api/v1/autonomy/profiles
func (h *AutonomyHandler) CreateProfile(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}
	userID, _ := uuid.Parse(userIDStr)

	var req struct {
		AgentID   string `json:"agent_id" binding:"required"`
		BaseLevel int    `json:"base_level"`
		Reason    string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	agentID, err := uuid.Parse(req.AgentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "agent_id inválido"})
		return
	}

	// Validar nível base (não pode ser > 1 na criação)
	baseLevel := AutonomyLevel(req.BaseLevel)
	if baseLevel > AutonomyShadow {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nível base inicial não pode exceder Shadow (1)",
			"reason": "Autonomia é conquistada, não concedida",
		})
		return
	}

	profile, err := h.service.CreateProfile(agentID, userID, baseLevel, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, profile)
}

// SetActionOverride define override de autonomia para ação
// PUT /api/v1/autonomy/profiles/:agentId/actions/:action
func (h *AutonomyHandler) SetActionOverride(c *gin.Context) {
	agentIDStr := c.Param("agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	action := c.Param("action")

	var req struct {
		Level  int    `json:"level" binding:"required"`
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	level := AutonomyLevel(req.Level)

	if err := h.service.SetActionOverride(agentID, action, level); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Override definido",
		"agent":   agentID,
		"action":  action,
		"level":   level.String(),
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterAutonomyRoutes registra rotas de autonomia
func RegisterAutonomyRoutes(router *gin.RouterGroup, service *AutonomyService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewAutonomyHandler(service)

	autonomy := router.Group("/autonomy")
	{
		// Matriz pública (documentação)
		autonomy.GET("/matrix", handler.GetMatrix)
		autonomy.GET("/forbidden", handler.GetForbiddenActions)
		autonomy.GET("/autonomous", handler.GetAutonomousActions)

		// Verificação (requer auth)
		autonomy.POST("/check", authMiddleware, handler.CheckAutonomy)

		// Perfis (requer admin)
		autonomy.GET("/profiles/:agentId", authMiddleware, handler.GetProfile)
		autonomy.POST("/profiles", authMiddleware, adminMiddleware, handler.CreateProfile)
		autonomy.PUT("/profiles/:agentId/actions/:action", authMiddleware, adminMiddleware, handler.SetActionOverride)
	}
}
