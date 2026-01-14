package controllers

import (
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// AuditController handles HTTP requests for audit logs.
type AuditController struct {
	service *services.AuditService
}

// NewAuditController creates a new controller instance.
func NewAuditController(service *services.AuditService) *AuditController {
	return &AuditController{service: service}
}

// GetAuditLogs retrieves audit logs with optional filters (Admin only).
func (ctrl *AuditController) GetAuditLogs(c *gin.Context) {
	// Parse pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	// Parse filters
	userIDStr := c.Query("userId")
	action := c.Query("action")
	entityType := c.Query("entityType")
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")

	var logs interface{}
	var total int64
	var err error

	if userIDStr != "" {
		userID, _ := strconv.Atoi(userIDStr)
		logs, total, err = ctrl.service.GetUserAuditLogs(c.Request.Context(), userID, limit, offset)
	} else if action != "" {
		logs, total, err = ctrl.service.GetAuditLogsByAction(c.Request.Context(), action, limit, offset)
	} else if startDateStr != "" && endDateStr != "" {
		startDate, _ := time.Parse("2006-01-02", startDateStr)
		endDate, _ := time.Parse("2006-01-02", endDateStr)
		endDate = endDate.Add(24*time.Hour - time.Second)
		logs, total, err = ctrl.service.GetAuditLogsByDateRange(c.Request.Context(), startDate, endDate, limit, offset)
	} else if entityType != "" {
		var logsList interface{}
		logsList, total, err = ctrl.service.GetAllAuditLogs(c.Request.Context(), limit, offset)
		logs = logsList
	} else {
		logs, total, err = ctrl.service.GetAllAuditLogs(c.Request.Context(), limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":   logs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetEntityAuditLogs retrieves audit logs for a specific entity (Admin only).
func (ctrl *AuditController) GetEntityAuditLogs(c *gin.Context) {
	entityType := c.Param("entityType")
	entityID, err := strconv.Atoi(c.Param("entityId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}

	logs, err := ctrl.service.GetEntityAuditLogs(c.Request.Context(), entityType, entityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// GetUserActivityLogs retrieves audit logs for a specific user (Admin only).
func (ctrl *AuditController) GetUserActivityLogs(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logs, total, err := ctrl.service.GetUserAuditLogs(c.Request.Context(), userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":   logs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetMyActivityLogs retrieves audit logs for the authenticated user.
func (ctrl *AuditController) GetMyActivityLogs(c *gin.Context) {
	userID, _ := c.Get("userID")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logs, total, err := ctrl.service.GetUserAuditLogs(c.Request.Context(), userID.(int), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":   logs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}
