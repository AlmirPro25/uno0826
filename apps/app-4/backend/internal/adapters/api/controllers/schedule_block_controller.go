package controllers

import (
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ScheduleBlockController handles HTTP requests for schedule blocks.
type ScheduleBlockController struct {
	service *services.ScheduleBlockService
}

// NewScheduleBlockController creates a new controller instance.
func NewScheduleBlockController(service *services.ScheduleBlockService) *ScheduleBlockController {
	return &ScheduleBlockController{service: service}
}

// CreateBlockRequest represents the request body for creating a schedule block.
type CreateBlockRequest struct {
	StartTime string `json:"startTime" binding:"required"`
	EndTime   string `json:"endTime" binding:"required"`
	Reason    string `json:"reason"`
	Recurring bool   `json:"recurring"`
}

// UpdateBlockRequest represents the request body for updating a schedule block.
type UpdateBlockRequest struct {
	StartTime string `json:"startTime"`
	EndTime   string `json:"endTime"`
	Reason    string `json:"reason"`
	Recurring *bool  `json:"recurring"`
}

// CreateBlock creates a new schedule block for the authenticated doctor.
func (ctrl *ScheduleBlockController) CreateBlock(c *gin.Context) {
	userID, _ := c.Get("userID")
	doctorID := userID.(int)

	var req CreateBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start time format. Use RFC3339 format."})
		return
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end time format. Use RFC3339 format."})
		return
	}

	block, err := ctrl.service.CreateBlock(c.Request.Context(), doctorID, startTime, endTime, req.Reason, req.Recurring)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, block)
}

// GetBlock retrieves a specific schedule block.
func (ctrl *ScheduleBlockController) GetBlock(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	blockID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	block, err := ctrl.service.GetBlock(c.Request.Context(), blockID, userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, block)
}

// GetMyBlocks retrieves all schedule blocks for the authenticated doctor.
func (ctrl *ScheduleBlockController) GetMyBlocks(c *gin.Context) {
	userID, _ := c.Get("userID")
	doctorID := userID.(int)

	blocks, err := ctrl.service.GetBlocksForDoctor(c.Request.Context(), doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, blocks)
}

// GetDoctorBlocks retrieves schedule blocks for a specific doctor (for patients to see availability).
func (ctrl *ScheduleBlockController) GetDoctorBlocks(c *gin.Context) {
	doctorID, err := strconv.Atoi(c.Param("doctorId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	// Optional date range parameters
	startDateStr := c.Query("startDate")
	endDateStr := c.Query("endDate")

	var blocks []interface{}

	if startDateStr != "" && endDateStr != "" {
		startDate, err := time.Parse("2006-01-02", startDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format. Use YYYY-MM-DD."})
			return
		}
		endDate, err := time.Parse("2006-01-02", endDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format. Use YYYY-MM-DD."})
			return
		}
		// Set end date to end of day
		endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

		result, err := ctrl.service.GetBlocksForDoctorInRange(c.Request.Context(), doctorID, startDate, endDate)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		for _, b := range result {
			blocks = append(blocks, b)
		}
	} else {
		result, err := ctrl.service.GetBlocksForDoctor(c.Request.Context(), doctorID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		for _, b := range result {
			blocks = append(blocks, b)
		}
	}

	if blocks == nil {
		blocks = []interface{}{}
	}

	c.JSON(http.StatusOK, blocks)
}

// UpdateBlock updates an existing schedule block.
func (ctrl *ScheduleBlockController) UpdateBlock(c *gin.Context) {
	userID, _ := c.Get("userID")
	doctorID := userID.(int)

	blockID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	var req UpdateBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	updates := make(map[string]interface{})
	if req.StartTime != "" {
		updates["startTime"] = req.StartTime
	}
	if req.EndTime != "" {
		updates["endTime"] = req.EndTime
	}
	if req.Reason != "" {
		updates["reason"] = req.Reason
	}
	if req.Recurring != nil {
		updates["recurring"] = *req.Recurring
	}

	block, err := ctrl.service.UpdateBlock(c.Request.Context(), blockID, doctorID, updates)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, block)
}

// DeleteBlock deletes a schedule block.
func (ctrl *ScheduleBlockController) DeleteBlock(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	blockID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block ID"})
		return
	}

	if err := ctrl.service.DeleteBlock(c.Request.Context(), blockID, userID.(int), userRole.(string)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Schedule block deleted successfully"})
}

// CheckTimeBlocked checks if a specific time slot is blocked for a doctor.
func (ctrl *ScheduleBlockController) CheckTimeBlocked(c *gin.Context) {
	doctorID, err := strconv.Atoi(c.Param("doctorId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	startTimeStr := c.Query("startTime")
	endTimeStr := c.Query("endTime")

	if startTimeStr == "" || endTimeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "startTime and endTime are required"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start time format"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, endTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end time format"})
		return
	}

	blocked, err := ctrl.service.IsTimeBlocked(c.Request.Context(), doctorID, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"blocked": blocked})
}
