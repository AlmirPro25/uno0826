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

// MedicalCertificateResponse is a DTO for returning certificate data
type MedicalCertificateResponse struct {
	ID            int           `json:"id"`
	PatientID     int           `json:"patientId"`
	DoctorID      int           `json:"doctorId"`
	AppointmentID *int          `json:"appointmentId,omitempty"`
	Type          string        `json:"type"`
	Days          int           `json:"days"`
	StartDate     time.Time     `json:"startDate"`
	EndDate       time.Time     `json:"endDate"`
	Reason        string        `json:"reason"`
	CID           string        `json:"cid,omitempty"`
	Restrictions  string        `json:"restrictions,omitempty"`
	Notes         string        `json:"notes,omitempty"`
	IssuedAt      time.Time     `json:"issuedAt"`
	CreatedAt     time.Time     `json:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt"`
	Patient       *UserResponse `json:"patient,omitempty"`
	Doctor        *UserResponse `json:"doctor,omitempty"`
}

// toCertificateResponse converts a domain MedicalCertificate to MedicalCertificateResponse
func toCertificateResponse(c *domain.MedicalCertificate) *MedicalCertificateResponse {
	resp := &MedicalCertificateResponse{
		ID:            c.ID,
		PatientID:     c.PatientID,
		DoctorID:      c.DoctorID,
		AppointmentID: c.AppointmentID,
		Type:          c.Type,
		Days:          c.Days,
		StartDate:     c.StartDate,
		EndDate:       c.EndDate,
		Reason:        c.Reason,
		CID:           c.CID,
		Restrictions:  c.Restrictions,
		Notes:         c.Notes,
		IssuedAt:      c.IssuedAt,
		CreatedAt:     c.CreatedAt,
		UpdatedAt:     c.UpdatedAt,
	}

	if c.Patient.ID != 0 {
		patientResp := toUserResponse(&c.Patient)
		resp.Patient = &patientResp
	}
	if c.Doctor.ID != 0 {
		doctorResp := toUserResponse(&c.Doctor)
		resp.Doctor = &doctorResp
	}

	return resp
}

// toCertificateResponses converts a slice of domain MedicalCertificates to responses
func toCertificateResponses(certificates []domain.MedicalCertificate) []MedicalCertificateResponse {
	responses := make([]MedicalCertificateResponse, len(certificates))
	for i, c := range certificates {
		responses[i] = *toCertificateResponse(&c)
	}
	return responses
}

// MedicalCertificateController handles API requests related to medical certificates.
type MedicalCertificateController struct {
	certificateService ports.MedicalCertificateService
}

// NewMedicalCertificateController creates a new instance of MedicalCertificateController.
func NewMedicalCertificateController(certificateService ports.MedicalCertificateService) *MedicalCertificateController {
	return &MedicalCertificateController{certificateService: certificateService}
}

// CreateCertificateRequest defines the request body for creating a certificate.
type CreateCertificateRequest struct {
	PatientID     int    `json:"patientId" binding:"required"`
	AppointmentID *int   `json:"appointmentId"`
	Type          string `json:"type" binding:"required"`      // "absence", "medical_leave", "fitness"
	Days          int    `json:"days" binding:"required,min=1"`
	StartDate     string `json:"startDate" binding:"required"` // YYYY-MM-DD format
	Reason        string `json:"reason"`
	CID           string `json:"cid"`
	Restrictions  string `json:"restrictions"`
	Notes         string `json:"notes"`
}

// CreateCertificate creates a new medical certificate (Doctor only).
func (ctrl *MedicalCertificateController) CreateCertificate(c *gin.Context) {
	doctorID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	var req CreateCertificateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startDate format, use YYYY-MM-DD"})
		return
	}

	dID, _ := doctorID.(int)

	certificate, err := ctrl.certificateService.CreateCertificate(
		c.Request.Context(),
		dID,
		req.PatientID,
		req.AppointmentID,
		req.Type,
		req.Days,
		startDate,
		req.Reason,
		req.CID,
		req.Restrictions,
		req.Notes,
	)
	if err != nil {
		log.Printf("Error creating certificate: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create certificate", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, toCertificateResponse(certificate))
}

// GetCertificate retrieves a specific certificate by ID.
func (ctrl *MedicalCertificateController) GetCertificate(c *gin.Context) {
	certificateID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid certificate ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")
	uID, _ := userID.(int)

	certificate, err := ctrl.certificateService.GetCertificate(c.Request.Context(), certificateID, uID, userRole.(string))
	if err != nil {
		if err.Error() == "unauthorized to view this certificate" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else if err.Error() == "certificate not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Certificate not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch certificate", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, toCertificateResponse(certificate))
}

// GetMyCertificates retrieves all certificates for the logged-in user.
func (ctrl *MedicalCertificateController) GetMyCertificates(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")
	uID, _ := userID.(int)
	role := userRole.(string)

	var certificates []domain.MedicalCertificate
	var err error

	if role == domain.RoleMedico {
		certificates, err = ctrl.certificateService.GetCertificatesForDoctor(c.Request.Context(), uID)
	} else {
		certificates, err = ctrl.certificateService.GetCertificatesForPatient(c.Request.Context(), uID, uID, role)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch certificates", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toCertificateResponses(certificates))
}

// GetPatientCertificates retrieves all certificates for a specific patient.
func (ctrl *MedicalCertificateController) GetPatientCertificates(c *gin.Context) {
	patientID, err := strconv.Atoi(c.Param("patientId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")
	uID, _ := userID.(int)

	certificates, err := ctrl.certificateService.GetCertificatesForPatient(c.Request.Context(), patientID, uID, userRole.(string))
	if err != nil {
		if err.Error() == "patients can only view their own certificates" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch certificates", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, toCertificateResponses(certificates))
}

// DeleteCertificate deletes a certificate (Doctor only).
func (ctrl *MedicalCertificateController) DeleteCertificate(c *gin.Context) {
	certificateID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid certificate ID"})
		return
	}

	doctorID, _ := c.Get("userID")
	dID, _ := doctorID.(int)

	err = ctrl.certificateService.DeleteCertificate(c.Request.Context(), certificateID, dID)
	if err != nil {
		if err.Error() == "unauthorized to delete this certificate" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else if err.Error() == "certificate not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Certificate not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete certificate", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Certificate deleted successfully"})
}
