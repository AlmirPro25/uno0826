package killswitch

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// KILL SWITCH HANDLER - API REST
// ========================================

type KillSwitchHandler struct {
	service *KillSwitchService
}

func NewKillSwitchHandler(service *KillSwitchService) *KillSwitchHandler {
	return &KillSwitchHandler{service: service}
}

// GetStatus retorna status de todos os switches
// GET /api/v1/admin/kill-switch
func (h *KillSwitchHandler) GetStatus(c *gin.Context) {
	status := h.service.GetStatus()
	switches, _ := h.service.GetAll()

	c.JSON(http.StatusOK, gin.H{
		"status":   status,
		"switches": switches,
	})
}

// Activate ativa um kill switch
// POST /api/v1/admin/kill-switch
func (h *KillSwitchHandler) Activate(c *gin.Context) {
	var req ActivateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("userID")
	activatedBy, _ := uuid.Parse(userID)

	if err := h.service.Activate(req.Scope, req.Reason, activatedBy, req.ExpiresIn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ativar kill switch"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kill switch ativado",
		"scope":   req.Scope,
		"reason":  req.Reason,
	})
}

// Deactivate desativa um kill switch
// DELETE /api/v1/admin/kill-switch/:scope
func (h *KillSwitchHandler) Deactivate(c *gin.Context) {
	scope := c.Param("scope")

	if err := h.service.Deactivate(scope); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao desativar kill switch"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kill switch desativado",
		"scope":   scope,
	})
}

// DeactivateAll desativa todos os kill switches
// DELETE /api/v1/admin/kill-switch
func (h *KillSwitchHandler) DeactivateAll(c *gin.Context) {
	if err := h.service.DeactivateAll(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao desativar kill switches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Todos os kill switches desativados",
	})
}

// ========================================
// ROUTE REGISTRATION
// ========================================

// RegisterKillSwitchRoutes registra as rotas de kill switch
func RegisterKillSwitchRoutes(router *gin.RouterGroup, service *KillSwitchService, authMiddleware, superAdminMiddleware gin.HandlerFunc) {
	handler := NewKillSwitchHandler(service)

	ks := router.Group("/admin/kill-switch")
	ks.Use(authMiddleware)
	ks.Use(superAdminMiddleware) // Apenas super_admin pode usar kill switch
	{
		ks.GET("", handler.GetStatus)
		ks.POST("", handler.Activate)
		ks.DELETE("/:scope", handler.Deactivate)
		ks.DELETE("", handler.DeactivateAll)
	}
}
