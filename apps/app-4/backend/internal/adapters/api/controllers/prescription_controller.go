package controllers

import (
	"log"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// PrescriptionResponse is a DTO for returning prescription data
type PrescriptionResponse struct {
	ID            int           `json:"id"`
	PatientID     int           `json:"patientId"`
	DoctorID      int           `json:"doctorId"`
	AppointmentID *int          `json:"appointmentId,omitempty"`
	Medications   string        `json:"medications"`
	Instructions  string        `json:"instructions"`
	Diagnosis     string        `json:"diagnosis"`
	Notes         string        `json:"notes"`
	ValidUntil    time.Time     `json:"validUntil"`
	IssuedAt      time.Time     `json:"issuedAt"`
	CreatedAt     time.Time     `json:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt"`
	Patient       *UserResponse `json:"patient,omitempty"`
	Doctor        *UserResponse `json:"doctor,omitempty"`
}

// toPrescriptionResponse converts a domain Prescription to PrescriptionResponse
func toPrescriptionResponse(p *domain.Prescription) *PrescriptionResponse {
	resp := &PrescriptionResponse{
		ID:            p.ID,
		PatientID:     p.PatientID,
		DoctorID:      p.DoctorID,
		AppointmentID: p.AppointmentID,
		Medications:   p.Medications,
		Instructions:  p.Instructions,
		Diagnosis:     p.Diagnosis,
		Notes:         p.Notes,
		ValidUntil:    p.ValidUntil,
		IssuedAt:      p.IssuedAt,
		CreatedAt:     p.CreatedAt,
		UpdatedAt:     p.UpdatedAt,
	}

	if p.Patient.ID != 0 {
		patientResp := toUserResponse(&p.Patient)
		resp.Patient = &patientResp
	}
	if p.Doctor.ID != 0 {
		doctorResp := toUserResponse(&p.Doctor)
		resp.Doctor = &doctorResp
	}

	return resp
}

// toPrescriptionResponses converts a slice of domain Prescriptions to PrescriptionResponses
func toPrescriptionResponses(prescriptions []domain.Prescription) []PrescriptionResponse {
	responses := make([]PrescriptionResponse, len(prescriptions))
	for i, p := range prescriptions {
		responses[i] = *toPrescriptionResponse(&p)
	}
	return responses
}

// PrescriptionController handles API requests related to prescriptions.
type PrescriptionController struct {
	prescriptionService ports.PrescriptionService
}

// NewPrescriptionController creates a new instance of PrescriptionController.
func NewPrescriptionController(prescriptionService ports.PrescriptionService) *PrescriptionController {
	return &PrescriptionController{prescriptionService: prescriptionService}
}

// CreatePrescriptionRequest defines the request body for creating a prescription.
type CreatePrescriptionRequest struct {
	PatientID     int    `json:"patientId" binding:"required"`
	AppointmentID *int   `json:"appointmentId"`
	Medications   string `json:"medications" binding:"required"` // JSON string of medications array
	Instructions  string `json:"instructions"`
	Diagnosis     string `json:"diagnosis"`
	Notes         string `json:"notes"`
	ValidUntil    string `json:"validUntil" binding:"required"` // RFC3339 format
}

// CreatePrescription creates a new prescription (Doctor only).
func (ctrl *PrescriptionController) CreatePrescription(c *gin.Context) {
	doctorID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	var req CreatePrescriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	validUntil, err := time.Parse(time.RFC3339, req.ValidUntil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid validUntil format, use ISO 8601 (RFC3339)"})
		return
	}

	dID, _ := doctorID.(int)

	prescription, err := ctrl.prescriptionService.CreatePrescription(
		c.Request.Context(),
		dID,
		req.PatientID,
		req.AppointmentID,
		req.Medications,
		req.Instructions,
		req.Diagnosis,
		req.Notes,
		validUntil,
	)
	if err != nil {
		log.Printf("Error creating prescription: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create prescription", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, toPrescriptionResponse(prescription))
}

// GetPrescription retrieves a specific prescription by ID.
func (ctrl *PrescriptionController) GetPrescription(c *gin.Context) {
	prescriptionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid prescription ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")
	uID, _ := userID.(int)

	prescription, err := ctrl.prescriptionService.GetPrescription(c.Request.Context(), prescriptionID, uID, userRole.(string))
	if err != nil {
		if err.Error() == "unauthorized to view this prescription" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else if err.Error() == "prescription not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Prescription not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch prescription", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, toPrescriptionResponse(prescription))
}

// GetMyPrescriptions retrieves all prescriptions for the logged-in user.
func (ctrl *PrescriptionController) GetMyPrescriptions(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")
	uID, _ := userID.(int)
	role := userRole.(string)

	var prescriptions []domain.Prescription
	var err error

	if role == domain.RoleMedico {
		prescriptions, err = ctrl.prescriptionService.GetPrescriptionsForDoctor(c.Request.Context(), uID)
	} else {
		prescriptions, err = ctrl.prescriptionService.GetPrescriptionsForPatient(c.Request.Context(), uID, uID, role)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch prescriptions", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toPrescriptionResponses(prescriptions))
}

// GetPatientPrescriptions retrieves all prescriptions for a specific patient.
func (ctrl *PrescriptionController) GetPatientPrescriptions(c *gin.Context) {
	patientID, err := strconv.Atoi(c.Param("patientId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")
	uID, _ := userID.(int)

	prescriptions, err := ctrl.prescriptionService.GetPrescriptionsForPatient(c.Request.Context(), patientID, uID, userRole.(string))
	if err != nil {
		if err.Error() == "patients can only view their own prescriptions" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch prescriptions", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, toPrescriptionResponses(prescriptions))
}

// UpdatePrescriptionRequest defines the request body for updating a prescription.
type UpdatePrescriptionRequest struct {
	Medications  string `json:"medications"`
	Instructions string `json:"instructions"`
	Diagnosis    string `json:"diagnosis"`
	Notes        string `json:"notes"`
	ValidUntil   string `json:"validUntil"`
}

// UpdatePrescription updates an existing prescription (Doctor only).
func (ctrl *PrescriptionController) UpdatePrescription(c *gin.Context) {
	prescriptionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid prescription ID"})
		return
	}

	doctorID, _ := c.Get("userID")
	dID, _ := doctorID.(int)

	var req UpdatePrescriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Medications != "" {
		updates["medications"] = req.Medications
	}
	if req.Instructions != "" {
		updates["instructions"] = req.Instructions
	}
	if req.Diagnosis != "" {
		updates["diagnosis"] = req.Diagnosis
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.ValidUntil != "" {
		updates["validUntil"] = req.ValidUntil
	}

	prescription, err := ctrl.prescriptionService.UpdatePrescription(c.Request.Context(), prescriptionID, dID, updates)
	if err != nil {
		if err.Error() == "unauthorized to update this prescription" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else if err.Error() == "prescription not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Prescription not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update prescription", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, toPrescriptionResponse(prescription))
}

// DeletePrescription deletes a prescription (Doctor only).
func (ctrl *PrescriptionController) DeletePrescription(c *gin.Context) {
	prescriptionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid prescription ID"})
		return
	}

	doctorID, _ := c.Get("userID")
	dID, _ := doctorID.(int)

	err = ctrl.prescriptionService.DeletePrescription(c.Request.Context(), prescriptionID, dID)
	if err != nil {
		if err.Error() == "unauthorized to delete this prescription" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else if err.Error() == "prescription not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Prescription not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete prescription", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Prescription deleted successfully"})
}
