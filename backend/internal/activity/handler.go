package activity

/*
================================================================================
ACTIVITY HANDLER — ENDPOINTS DE LOG DE ATIVIDADES
================================================================================

Endpoints:
- GET  /activity           → Listar atividades do usuário
- GET  /activity/stats     → Estatísticas de atividades
- GET  /activity/security  → Atividades de segurança (admin)
- GET  /apps/:id/activity  → Atividades de um app

================================================================================
*/

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/pkg/middleware"
)

// ActivityHandler handler de atividades
type ActivityHandler struct {
	activityService *ActivityService
}

// NewActivityHandler cria novo handler
func NewActivityHandler(activityService *ActivityService) *ActivityHandler {
	return &ActivityHandler{activityService: activityService}
}

// ListUserActivities lista atividades do usuário autenticado
// GET /api/v1/activity
func (h *ActivityHandler) ListUserActivities(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	activities, total, err := h.activityService.GetUserActivities(uid, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"activities": activities,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}

// GetActivityStats retorna estatísticas de atividades
// GET /api/v1/activity/stats
func (h *ActivityHandler) GetActivityStats(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserIDKey)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	stats, err := h.activityService.GetActivityStats(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ListSecurityActivities lista atividades de segurança (admin)
// GET /api/v1/activity/security
func (h *ActivityHandler) ListSecurityActivities(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 100 {
		limit = 100
	}

	activities, err := h.activityService.GetSecurityActivities(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"activities": activities,
		"count":      len(activities),
	})
}

// ListAppActivities lista atividades de um app
// GET /api/v1/apps/:id/activity
func (h *ActivityHandler) ListAppActivities(c *gin.Context) {
	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de app inválido"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	activities, total, err := h.activityService.GetAppActivities(appID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"activities": activities,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}

// RegisterActivityRoutes registra rotas de atividade
func RegisterActivityRoutes(router *gin.RouterGroup, activityService *ActivityService, authMiddleware, adminMiddleware gin.HandlerFunc) {
	handler := NewActivityHandler(activityService)

	activity := router.Group("/activity")
	activity.Use(authMiddleware)
	{
		activity.GET("", handler.ListUserActivities)
		activity.GET("/stats", handler.GetActivityStats)
		activity.GET("/security", adminMiddleware, handler.ListSecurityActivities)
	}

	// Rota de atividades por app
	router.GET("/apps/:id/activity", authMiddleware, handler.ListAppActivities)
}
