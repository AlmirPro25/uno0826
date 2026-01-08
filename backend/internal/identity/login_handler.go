package identity

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ========================================
// LOGIN EVENTS HANDLER
// ========================================

type LoginEventHandler struct {
	service *LoginEventService
}

func NewLoginEventHandler(service *LoginEventService) *LoginEventHandler {
	return &LoginEventHandler{service: service}
}

// GetMyLoginHistory retorna histórico de login do usuário logado
// GET /api/v1/users/me/login-history
func (h *LoginEventHandler) GetMyLoginHistory(c *gin.Context) {
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

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 100 {
		limit = 100
	}

	events, err := h.service.GetUserLoginHistory(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"total":  len(events),
	})
}

// GetRecentLogins retorna logins recentes (admin/superadmin)
// GET /api/v1/admin/login-history
func (h *LoginEventHandler) GetRecentLogins(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 500 {
		limit = 500
	}

	events, err := h.service.GetRecentLogins(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"total":  len(events),
	})
}

// GetFailedLogins retorna tentativas de login falhas (segurança)
// GET /api/v1/admin/login-history/failed
func (h *LoginEventHandler) GetFailedLogins(c *gin.Context) {
	hoursStr := c.DefaultQuery("hours", "24")
	hours, _ := strconv.Atoi(hoursStr)
	if hours > 168 { // max 7 dias
		hours = 168
	}

	since := time.Now().Add(-time.Duration(hours) * time.Hour)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	if limit > 500 {
		limit = 500
	}

	events, err := h.service.GetFailedLogins(since, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"total":  len(events),
		"since":  since,
	})
}

// GetLoginStats retorna estatísticas de login
// GET /api/v1/admin/login-stats
func (h *LoginEventHandler) GetLoginStats(c *gin.Context) {
	hoursStr := c.DefaultQuery("hours", "24")
	hours, _ := strconv.Atoi(hoursStr)
	if hours > 720 { // max 30 dias
		hours = 720
	}

	since := time.Now().Add(-time.Duration(hours) * time.Hour)

	stats, err := h.service.GetLoginStats(since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// RegisterLoginEventRoutes registra as rotas
func RegisterLoginEventRoutes(router *gin.RouterGroup, service *LoginEventService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewLoginEventHandler(service)

	// Rotas de usuário
	users := router.Group("/users")
	users.Use(authMiddleware)
	{
		users.GET("/me/login-history", handler.GetMyLoginHistory)
	}

	// Rotas de admin
	admin := router.Group("/admin")
	admin.Use(authMiddleware)
	admin.Use(adminMiddleware)
	{
		admin.GET("/login-history", handler.GetRecentLogins)
		admin.GET("/login-history/failed", handler.GetFailedLogins)
		admin.GET("/login-stats", handler.GetLoginStats)
	}
}
