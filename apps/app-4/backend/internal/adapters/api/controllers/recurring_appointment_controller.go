package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// RecurringAppointmentController handles HTTP requests for recurring appointments.
type RecurringAppointmentController struct {
	service *services.RecurringAppointmentService
}

// NewRecurringAppointmentController creates a new controller instance.
func NewRecurringAppointmentController(service *services.RecurringAppointmentService) *RecurringAppointmentController {
	return &RecurringAppointmentController{service: service}
}

// CreateRecurringRequest represents the request body for creating a recurring appointment.
type CreateRecurringRequest struct {
	DoctorID       int    `json:"doctorId" binding:"required"`
	StartTime      string `json:"startTime" binding:"required"` // Time of day (HH:MM)
	Duration       int    `json:"duration"`                     // Duration in minutes
	Frequency      string `json:"frequency" binding:"required"` // weekly, biweekly, monthly
	DayOfWeek      int    `json:"dayOfWeek" binding:"required"` // 0-6
	StartDate      string `json:"startDate" binding:"required"` // YYYY-MM-DD
	EndDate        string `json:"endDate"`                      // YYYY-MM-DD (optional)
	MaxOccurrences int    `json:"maxOccurrences"`               // Optional
	Notes          string `json:"notes"`
}

// CreateRecurring creates a new recurring appointment pattern.
func (ctrl *RecurringAppointmentController) CreateRecurring(c *gin.Context) {
	userID, _ := c.Get("userID")
	patientID := userID.(int)

	var req CreateRecurringRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Parse start time (HH:MM format)
	startTime, err := time.Parse("15:04", req.StartTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start time format. Use HH:MM."})
		return
	}

	// Parse start date
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format. Use YYYY-MM-DD."})
		return
	}

	// Parse end date (optional)
	var endDate time.Time
	if req.EndDate != "" {
		endDate, err = time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format. Use YYYY-MM-DD."})
			return
		}
	}

	// Default duration to 30 minutes
	duration := req.Duration
	if duration == 0 {
		duration = 30
	}

	recurring, err := ctrl.service.CreateRecurringAppointment(
		c.Request.Context(),
		patientID,
		req.DoctorID,
		startTime,
		duration,
		req.Frequency,
		req.DayOfWeek,
		startDate,
		endDate,
		req.MaxOccurrences,
		req.Notes,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, recurring)
}

// GetRecurring retrieves a specific recurring appointment.
func (ctrl *RecurringAppointmentController) GetRecurring(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	recurring, err := ctrl.service.GetRecurringAppointment(c.Request.Context(), id, userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recurring)
}

// GetMyRecurring retrieves all recurring appointments for the authenticated user.
func (ctrl *RecurringAppointmentController) GetMyRecurring(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	recurrings, err := ctrl.service.GetMyRecurringAppointments(c.Request.Context(), userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recurrings)
}

// GetUpcomingOccurrences generates the next N appointments from a recurring pattern.
func (ctrl *RecurringAppointmentController) GetUpcomingOccurrences(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	count, _ := strconv.Atoi(c.DefaultQuery("count", "5"))
	if count > 20 {
		count = 20
	}

	occurrences, err := ctrl.service.GenerateUpcomingAppointments(c.Request.Context(), id, userID.(int), userRole.(string), count)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"occurrences": occurrences})
}

// BookFromRecurring creates actual appointments from a recurring pattern.
func (ctrl *RecurringAppointmentController) BookFromRecurring(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Only patients can book from their recurring patterns
	if userRole.(string) != domain.RolePaciente {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only patients can book appointments"})
		return
	}

	count, _ := strconv.Atoi(c.DefaultQuery("count", "4"))
	if count > 12 {
		count = 12 // Max 12 appointments at once (3 months weekly)
	}

	appointments, err := ctrl.service.BookFromRecurring(c.Request.Context(), id, userID.(int), userRole.(string), count)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Appointments booked successfully",
		"booked":       len(appointments),
		"appointments": appointments,
	})
}

// CancelRecurring cancels a recurring appointment pattern.
func (ctrl *RecurringAppointmentController) CancelRecurring(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := ctrl.service.CancelRecurringAppointment(c.Request.Context(), id, userID.(int), userRole.(string)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recurring appointment cancelled successfully"})
}
