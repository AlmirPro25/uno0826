package notification

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	service *NotificationService
}

func NewNotificationHandler(service *NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

// RegisterNotificationRoutes registra rotas de notificações
func RegisterNotificationRoutes(r *gin.RouterGroup, service *NotificationService, authMiddleware gin.HandlerFunc) {
	h := NewNotificationHandler(service)

	notifications := r.Group("/notifications")
	notifications.Use(authMiddleware)
	{
		notifications.GET("", h.List)
		notifications.GET("/unread", h.ListUnread)
		notifications.GET("/count", h.UnreadCount)
		notifications.POST("/:id/read", h.MarkAsRead)
		notifications.POST("/read-all", h.MarkAllAsRead)
		notifications.GET("/preferences", h.GetPreferences)
		notifications.PUT("/preferences/:type", h.UpdatePreference)
	}
}

// List retorna notificações do usuário
func (h *NotificationHandler) List(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	// Se app_id fornecido, buscar por app
	appIDStr := c.Query("app_id")
	if appIDStr != "" {
		appID, err := uuid.Parse(appIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app_id"})
			return
		}
		notifications, err := h.service.GetByApp(appID, 50)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"notifications": notifications})
		return
	}

	// Buscar por usuário
	notifications, err := h.service.GetUnreadByUser(userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

// ListUnread retorna notificações não lidas
func (h *NotificationHandler) ListUnread(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	notifications, err := h.service.GetUnreadByUser(userID, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

// UnreadCount retorna contagem de não lidas
func (h *NotificationHandler) UnreadCount(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	count, err := h.service.GetUnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// MarkAsRead marca notificação como lida
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.service.MarkAsRead(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}

// MarkAllAsRead marca todas como lidas
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	if err := h.service.MarkAllAsRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "all marked as read"})
}

// GetPreferences retorna preferências
func (h *NotificationHandler) GetPreferences(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	prefs, err := h.service.GetPreferences(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"preferences": prefs})
}

// UpdatePreference atualiza preferência
func (h *NotificationHandler) UpdatePreference(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	notifType := NotificationType(c.Param("type"))

	var req struct {
		Email   bool `json:"email"`
		InApp   bool `json:"in_app"`
		Webhook bool `json:"webhook"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdatePreference(userID, notifType, req.Email, req.InApp, req.Webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "preference updated"})
}
