package controllers

import (
	"log"
	"medisync-platform/backend/internal/core/ports"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// MedicalRecordController handles API requests related to medical records.
type MedicalRecordController struct {
	medicalRecordService ports.MedicalRecordService
}

// NewMedicalRecordController creates a new instance of MedicalRecordController.
func NewMedicalRecordController(medicalRecordService ports.MedicalRecordService) *MedicalRecordController {
	return &MedicalRecordController{medicalRecordService: medicalRecordService}
}

// CreateMedicalRecordRequest defines the request body for creating a medical record.
type CreateMedicalRecordRequest struct {
	Diagnosis string `json:"diagnosis" binding:"required"`
	Notes     string `json:"notes" binding:"required"`
}

// CreateRecord creates a new medical record for a patient. Requires 'MEDICO' role.
func (ctrl *MedicalRecordController) CreateRecord(c *gin.Context) {
	patientID, err := strconv.Atoi(c.Param("patientId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	doctorID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	var req CreateMedicalRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data", "details": err.Error()})
		return
	}

	dID, _ := doctorID.(int)

	record, err := ctrl.medicalRecordService.CreateMedicalRecord(c.Request.Context(), dID, patientID, req.Diagnosis, req.Notes)
	if err != nil {
		log.Printf("Error creating medical record: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create medical record", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, record)
}

// GetRecords retrieves all medical records for a specific patient.
func (ctrl *MedicalRecordController) GetRecords(c *gin.Context) {
	patientID, err := strconv.Atoi(c.Param("patientId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
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

	records, err := ctrl.medicalRecordService.GetMedicalRecordsForPatient(c.Request.Context(), patientID, uID, userRole.(string))
	if err != nil {
		log.Printf("Error retrieving medical records: %v", err)
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. You do not have permission to view these records."})
		return
	}

	c.JSON(http.StatusOK, records)
}

// UpdateMedicalRecordRequest defines the request body for updating a medical record.
type UpdateMedicalRecordRequest struct {
	Diagnosis string `json:"diagnosis"`
	Notes     string `json:"notes"`
}

// GetRecord retrieves a specific medical record by ID.
func (ctrl *MedicalRecordController) GetRecord(c *gin.Context) {
	recordID, err := strconv.Atoi(c.Param("recordId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")

	record, err := ctrl.medicalRecordService.GetMedicalRecord(c.Request.Context(), recordID, userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

// UpdateRecord updates an existing medical record. Only the creating doctor can update.
func (ctrl *MedicalRecordController) UpdateRecord(c *gin.Context) {
	recordID, err := strconv.Atoi(c.Param("recordId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	doctorID, _ := c.Get("userID")

	var req UpdateMedicalRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data"})
		return
	}

	updates := make(map[string]interface{})
	if req.Diagnosis != "" {
		updates["diagnosis"] = req.Diagnosis
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}

	record, err := ctrl.medicalRecordService.UpdateMedicalRecord(c.Request.Context(), recordID, doctorID.(int), updates)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

// DeleteRecord deletes a medical record. Only the creating doctor can delete.
func (ctrl *MedicalRecordController) DeleteRecord(c *gin.Context) {
	recordID, err := strconv.Atoi(c.Param("recordId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	doctorID, _ := c.Get("userID")

	err = ctrl.medicalRecordService.DeleteMedicalRecord(c.Request.Context(), recordID, doctorID.(int))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Medical record deleted successfully"})
}
