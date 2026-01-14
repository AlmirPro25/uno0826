package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/services"
	"medisync-platform/backend/pkg/security"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// VerificationController handles 2FA verification endpoints
type VerificationController struct {
	verificationSvc *services.VerificationService
}

// NewVerificationController creates a new verification controller
func NewVerificationController(svc *services.VerificationService) *VerificationController {
	return &VerificationController{verificationSvc: svc}
}

// RequestCode sends a verification code to the user
// POST /api/auth/2fa/request
func (ctrl *VerificationController) RequestCode(c *gin.Context) {
	var req struct {
		Purpose string `json:"purpose" binding:"required"` // login, password_reset, phone_verification
		Channel string `json:"channel" binding:"required"` // whatsapp, email
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate purpose
	validPurposes := map[string]bool{
		domain.VerificationPurposeLogin:         true,
		domain.VerificationPurposePasswordReset: true,
		domain.VerificationPurposePhoneVerify:   true,
		domain.VerificationPurposeAccountVerify: true,
	}
	if !validPurposes[req.Purpose] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purpose"})
		return
	}

	// Validate channel
	validChannels := map[string]bool{
		domain.VerificationChannelWhatsApp: true,
		domain.VerificationChannelEmail:    true,
	}
	if !validChannels[req.Channel] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid channel"})
		return
	}

	// Get user from context
	claims, exists := c.Get("claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userClaims := claims.(*security.Claims)

	// Request verification code
	code, err := ctrl.verificationSvc.RequestVerificationCode(c.Request.Context(), userClaims.UserID, req.Purpose, req.Channel)
	if err != nil {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"expires_at": code.ExpiresAt,
		"channel":    req.Channel,
		"message":    "Verification code sent successfully",
	})
}

// VerifyCode verifies a submitted code
// POST /api/auth/2fa/verify
func (ctrl *VerificationController) VerifyCode(c *gin.Context) {
	var req struct {
		Purpose string `json:"purpose" binding:"required"`
		Code    string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	claims, exists := c.Get("claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userClaims := claims.(*security.Claims)

	// Verify code
	valid, err := ctrl.verificationSvc.VerifyCode(c.Request.Context(), userClaims.UserID, req.Purpose, req.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Verification failed"})
		return
	}

	if !valid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid or expired verification code",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Verification successful",
	})
}

// NotificationController handles notification endpoints
type NotificationController struct {
	notificationSvc *services.NotificationService
}

// NewNotificationController creates a new notification controller
func NewNotificationController(svc *services.NotificationService) *NotificationController {
	return &NotificationController{notificationSvc: svc}
}

// GetNotifications gets user's notifications
// GET /api/notifications
func (ctrl *NotificationController) GetNotifications(c *gin.Context) {
	// Get user from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	unreadOnly := c.Query("unread_only") == "true"

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	notifications, total, err := ctrl.notificationSvc.GetUserNotifications(
		c.Request.Context(), userID.(int), page, pageSize, unreadOnly,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"total":         total,
		"page":          page,
		"page_size":     pageSize,
	})
}

// GetUnreadCount gets count of unread notifications
// GET /api/notifications/unread-count
func (ctrl *NotificationController) GetUnreadCount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	count, err := ctrl.notificationSvc.GetUnreadCount(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

// MarkAsRead marks a notification as read
// PUT /api/notifications/:id/read
func (ctrl *NotificationController) MarkAsRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	notificationID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	if err := ctrl.notificationSvc.MarkAsRead(c.Request.Context(), notificationID, userID.(int)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// MarkAllAsRead marks all notifications as read
// PUT /api/notifications/read-all
func (ctrl *NotificationController) MarkAllAsRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := ctrl.notificationSvc.MarkAllAsRead(c.Request.Context(), userID.(int)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark all as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// DeleteNotification deletes a notification
// DELETE /api/notifications/:id
func (ctrl *NotificationController) DeleteNotification(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	notificationID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	if err := ctrl.notificationSvc.Delete(c.Request.Context(), notificationID, userID.(int)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
