package controllers

import (
	"log"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"net/http"
	"strconv"
	"time"

	"medisync-platform/backend/internal/services"

	"github.com/gin-gonic/gin"
)

// AppointmentResponse is a DTO for returning appointment data with flattened role
type AppointmentResponse struct {
	ID        int           `json:"id"`
	PatientID int           `json:"patientId"`
	DoctorID  int           `json:"doctorId"`
	StartTime time.Time     `json:"startTime"`
	EndTime   time.Time     `json:"endTime"`
	Status    string        `json:"status"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
	Patient   UserResponse  `json:"patient"`
	Doctor    UserResponse  `json:"doctor"`
}

// UserResponse is a DTO for returning user data with role as string
type UserResponse struct {
	ID        int     `json:"id"`
	Email     string  `json:"email"`
	FullName  string  `json:"fullName"`
	Phone     *string `json:"phone"`
	Specialty *string `json:"specialty,omitempty"`
	CRM       *string `json:"crm,omitempty"`
	Role      string  `json:"role"`
	IsActive  bool    `json:"isActive"`
}

// toAppointmentResponse converts a domain Appointment to AppointmentResponse
func toAppointmentResponse(appt *domain.Appointment) *AppointmentResponse {
	return &AppointmentResponse{
		ID:        appt.ID,
		PatientID: appt.PatientID,
		DoctorID:  appt.DoctorID,
		StartTime: appt.StartTime,
		EndTime:   appt.EndTime,
		Status:    appt.Status,
		CreatedAt: appt.CreatedAt,
		UpdatedAt: appt.UpdatedAt,
		Patient:   toUserResponse(&appt.Patient),
		Doctor:    toUserResponse(&appt.Doctor),
	}
}

// toAppointmentResponses converts a slice of domain Appointments to AppointmentResponses
func toAppointmentResponses(appts []domain.Appointment) []AppointmentResponse {
	responses := make([]AppointmentResponse, len(appts))
	for i, appt := range appts {
		responses[i] = *toAppointmentResponse(&appt)
	}
	return responses
}

// toUserResponse converts a domain User to UserResponse
func toUserResponse(user *domain.User) UserResponse {
	return UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FullName:  user.FullName,
		Phone:     user.Phone,
		Specialty: user.Specialty,
		CRM:       user.CRM,
		Role:      user.Role.Name,
		IsActive:  user.IsActive,
	}
}

// AppointmentController handles API requests related to scheduling.
type AppointmentController struct {
	appointmentService ports.AppointmentService
	hub                *services.Hub
}

// NewAppointmentController creates a new instance of AppointmentController.
func NewAppointmentController(appointmentService ports.AppointmentService, hub *services.Hub) *AppointmentController {
	return &AppointmentController{
		appointmentService: appointmentService,
		hub:                hub,
	}
}

// GetAvailableSlots queries available appointment slots for a specific doctor on a specific date.
func (ctrl *AppointmentController) GetAvailableSlots(c *gin.Context) {
	doctorID, err := strconv.Atoi(c.Query("doctorId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	dateStr := c.Query("date")
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
		return
	}

	slots, err := ctrl.appointmentService.GetAvailableSlots(c.Request.Context(), doctorID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch available slots", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, slots)
}

// BookAppointmentRequest defines the request body for booking an appointment.
type BookAppointmentRequest struct {
	DoctorID  int    `json:"doctorId" binding:"required"`
	StartTime string `json:"startTime" binding:"required"` // Removed "datetime" custom validation for simplicity
	EndTime   string `json:"endTime" binding:"required"`
}

// BookAppointment creates a new appointment for the logged-in patient.
func (ctrl *AppointmentController) BookAppointment(c *gin.Context) {
	// 1. Get patient ID from context (set by AuthMiddleware)
	patientID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// 2. Validate request body
	var req BookAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	// 3. Parse time strings
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startTime format, use ISO 8601 (RFC3339)"})
		return
	}
	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endTime format, use ISO 8601 (RFC3339)"})
		return
	}

	// 4. Call service logic
	// Type casting patientID to int (default JSON unmarshal for numbers is float64 but if set in middleware it depends on JWT claim parsing)
	// JWT claims usually unmarshal numbers as float64. But our security package sets it as int.
	// Let's assert it carefully.
	pID, ok := patientID.(int)
	if !ok {
		// handle float64 if coming from jwt-go default map claims logic
		if fID, ok := patientID.(float64); ok {
			pID = int(fID)
		} else {
			log.Printf("Failed to cast patientID: %v %T", patientID, patientID)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal User ID error"})
			return
		}
	}

	appointment, err := ctrl.appointmentService.BookAppointment(c.Request.Context(), pID, req.DoctorID, startTime, endTime)
	if err != nil {
		log.Printf("Error booking appointment: %v", err)
		if err.Error() == "slot conflict detected" {
			c.JSON(http.StatusConflict, gin.H{"error": "Slot conflict detected. The time slot is already taken or unavailable."})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to book appointment", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, toAppointmentResponse(appointment))
}

// GetMyAppointments retrieves all appointments for the logged-in user.
func (ctrl *AppointmentController) GetMyAppointments(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}
	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found in context"})
		return
	}

	uID, _ := userID.(int) // Simplification, handle float64 if needed as above

	appointments, err := ctrl.appointmentService.GetAppointmentsForUser(c.Request.Context(), uID, userRole.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toAppointmentResponses(appointments))
}

// CancelAppointment cancels an appointment.
func (ctrl *AppointmentController) CancelAppointment(c *gin.Context) {
	appointmentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}
	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found in context"})
		return
	}

	uID, _ := userID.(int)

	err = ctrl.appointmentService.CancelAppointment(c.Request.Context(), appointmentID, uID, userRole.(string))
	if err != nil {
		if err.Error() == "unauthorized to cancel this appointment" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. You can only cancel your own appointments."})
		} else if err.Error() == "appointment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel appointment", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment cancelled successfully"})
}

// GetVideoCallInfo handles requests to get video call details.
func (ctrl *AppointmentController) GetVideoCallInfo(c *gin.Context) {
	appointmentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	uID, ok := userID.(int)
	if !ok {
		// handle float64 if coming from jwt-go default map claims logic
		if fID, ok := userID.(float64); ok {
			uID = int(fID)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal User ID error"})
			return
		}
	}

	info, err := ctrl.appointmentService.GetVideoCallInfo(c.Request.Context(), appointmentID, uID)
	if err != nil {
		if err.Error() == "unauthorized to join this call" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. You can only join your own appointments."})
		} else if err.Error() == "appointment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get video call info", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, info)
}

// GetAppointment retrieves detailed information about a specific appointment.
func (ctrl *AppointmentController) GetAppointment(c *gin.Context) {
	appointmentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}
	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found in context"})
		return
	}

	uID, _ := userID.(int)

	appointment, err := ctrl.appointmentService.GetAppointment(c.Request.Context(), appointmentID, uID, userRole.(string))
	if err != nil {
		if err.Error() == "unauthorized to view this appointment" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else if err.Error() == "appointment not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointment", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, toAppointmentResponse(appointment))
}

// CompleteAppointment marks an appointment as completed (doctor only).
func (ctrl *AppointmentController) CompleteAppointment(c *gin.Context) {
	appointmentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	uID, _ := userID.(int)

	// Type assert to get the service with CompleteAppointment method
	type completer interface {
		CompleteAppointment(ctx interface{}, appointmentID int, doctorID int) error
	}

	if svc, ok := ctrl.appointmentService.(completer); ok {
		err = svc.CompleteAppointment(c.Request.Context(), appointmentID, uID)
		if err != nil {
			if err.Error() == "unauthorized to complete this appointment" {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. Only the doctor can complete this appointment."})
			} else if err.Error() == "appointment not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			}
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Appointment marked as completed"})
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Service does not support this operation"})
	}
}

// StartVideoCall notifies the other participant that the call is starting.
func (ctrl *AppointmentController) StartVideoCall(c *gin.Context) {
	appointmentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}
	userRole, _ := c.Get("role")

	uID, _ := userID.(int)
	role := userRole.(string)

	// Get appointment to find the other participant
	appt, err := ctrl.appointmentService.GetAppointment(c.Request.Context(), appointmentID, uID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve appointment details"})
		return
	}

	var targetUserID int
	if role == "MEDICO" {
		targetUserID = appt.PatientID
	} else {
		targetUserID = appt.DoctorID
	}

	// Send signal via WebSocket
	// Message format: {"type": "incoming_call", "appointmentId": 123, "roomName": "..."}
	roomName := "medisync-appt-" + strconv.Itoa(appointmentID)
	message := []byte(`{"type": "incoming_call", "appointmentId": ` + strconv.Itoa(appointmentID) + `, "roomName": "` + roomName + `"}`)

	ctrl.hub.NotifyUser(targetUserID, message)

	c.JSON(http.StatusOK, gin.H{"message": "Call signal sent", "roomName": roomName})
}
