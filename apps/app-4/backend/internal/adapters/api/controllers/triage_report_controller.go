package controllers

import (
	"log"
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// TriageReportController handles API requests for triage reports
type TriageReportController struct {
	triageService *services.TriageReportService
}

// NewTriageReportController creates a new controller instance
func NewTriageReportController(triageService *services.TriageReportService) *TriageReportController {
	return &TriageReportController{triageService: triageService}
}

// CreateTriageReportRequest defines the request body for creating a triage report
type CreateTriageReportRequest struct {
	PatientComplaint        string   `json:"patient_complaint" binding:"required"`
	HistoryOfPresentIllness string   `json:"history_of_present_illness"`
	VitalSignsNote          string   `json:"vital_signs_note"`
	SuspectedDiagnosis      []string `json:"suspected_diagnosis" binding:"required"`
	RecommendedSpecialty    string   `json:"recommended_specialty" binding:"required"`
	Priority                string   `json:"priority" binding:"required"`
	Reasoning               string   `json:"reasoning"`
	Transcript              string   `json:"transcript"`
	SessionType             string   `json:"session_type"`
	AIModel                 string   `json:"ai_model"`
	SessionLength           int      `json:"session_length"`
	Latitude                *float64 `json:"latitude"`
	Longitude               *float64 `json:"longitude"`
}

// CreateTriageReport creates a new triage report (patient only)
func (ctrl *TriageReportController) CreateTriageReport(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var req CreateTriageReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	input := services.CreateTriageReportInput{
		PatientComplaint:        req.PatientComplaint,
		HistoryOfPresentIllness: req.HistoryOfPresentIllness,
		VitalSignsNote:          req.VitalSignsNote,
		SuspectedDiagnosis:      req.SuspectedDiagnosis,
		RecommendedSpecialty:    req.RecommendedSpecialty,
		Priority:                req.Priority,
		Reasoning:               req.Reasoning,
		Transcript:              req.Transcript,
		SessionType:             req.SessionType,
		AIModel:                 req.AIModel,
		SessionLength:           req.SessionLength,
		Latitude:                req.Latitude,
		Longitude:               req.Longitude,
	}

	report, err := ctrl.triageService.CreateTriageReport(c.Request.Context(), userID.(int), input)
	if err != nil {
		log.Printf("Error creating triage report: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, report)
}

// GetTriageReport retrieves a specific triage report
func (ctrl *TriageReportController) GetTriageReport(c *gin.Context) {
	reportID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")

	report, err := ctrl.triageService.GetTriageReport(c.Request.Context(), reportID, userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// GetMyTriageReports retrieves triage reports for the current user
func (ctrl *TriageReportController) GetMyTriageReports(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")

	reports, err := ctrl.triageService.GetPatientTriageReports(c.Request.Context(), userID.(int), userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetPatientTriageReports retrieves triage reports for a specific patient (doctor/admin)
func (ctrl *TriageReportController) GetPatientTriageReports(c *gin.Context) {
	patientID, err := strconv.Atoi(c.Param("patientId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")

	reports, err := ctrl.triageService.GetPatientTriageReports(c.Request.Context(), patientID, userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetDoctorTriageReports retrieves triage reports assigned to the current doctor
func (ctrl *TriageReportController) GetDoctorTriageReports(c *gin.Context) {
	userID, _ := c.Get("userID")

	reports, err := ctrl.triageService.GetDoctorTriageReports(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetPendingTriageReports retrieves pending triage reports (for doctors)
func (ctrl *TriageReportController) GetPendingTriageReports(c *gin.Context) {
	specialty := c.Query("specialty")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	reports, err := ctrl.triageService.GetPendingTriageReports(c.Request.Context(), specialty, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// AcceptTriageReport allows a doctor to accept a triage case
func (ctrl *TriageReportController) AcceptTriageReport(c *gin.Context) {
	reportID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	doctorID, _ := c.Get("userID")

	report, err := ctrl.triageService.AcceptTriageReport(c.Request.Context(), reportID, doctorID.(int))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// ReviewTriageReportRequest defines the request body for reviewing a triage report
type ReviewTriageReportRequest struct {
	Notes string `json:"notes" binding:"required"`
}

// ReviewTriageReport allows a doctor to review and add notes
func (ctrl *TriageReportController) ReviewTriageReport(c *gin.Context) {
	reportID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	doctorID, _ := c.Get("userID")

	var req ReviewTriageReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	report, err := ctrl.triageService.ReviewTriageReport(c.Request.Context(), reportID, doctorID.(int), req.Notes)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// UpdateStatusRequest defines the request body for updating status
type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// UpdateTriageStatus updates the status of a triage report
func (ctrl *TriageReportController) UpdateTriageStatus(c *gin.Context) {
	reportID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	err = ctrl.triageService.UpdateTriageStatus(c.Request.Context(), reportID, req.Status, userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

// GetTriageStats retrieves triage statistics (admin only)
func (ctrl *TriageReportController) GetTriageStats(c *gin.Context) {
	stats, err := ctrl.triageService.GetTriageStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// LinkToAppointmentRequest defines the request body
type LinkToAppointmentRequest struct {
	AppointmentID int `json:"appointment_id" binding:"required"`
}

// LinkToAppointment links a triage report to an appointment
func (ctrl *TriageReportController) LinkToAppointment(c *gin.Context) {
	reportID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report ID"})
		return
	}

	var req LinkToAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	err = ctrl.triageService.LinkToAppointment(c.Request.Context(), reportID, req.AppointmentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Linked to appointment successfully"})
}
