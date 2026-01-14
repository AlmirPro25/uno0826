package controllers

import (
	"log"
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ClinicController handles API requests for clinics
type ClinicController struct {
	clinicService *services.ClinicService
}

// NewClinicController creates a new controller instance
func NewClinicController(clinicService *services.ClinicService) *ClinicController {
	return &ClinicController{clinicService: clinicService}
}

// CreateClinicRequest defines the request body for creating a clinic
type CreateClinicRequest struct {
	Name             string   `json:"name" binding:"required"`
	Description      string   `json:"description"`
	CNPJ             string   `json:"cnpj"`
	Phone            string   `json:"phone" binding:"required"`
	Email            string   `json:"email" binding:"required"`
	Website          string   `json:"website"`
	Address          string   `json:"address" binding:"required"`
	City             string   `json:"city" binding:"required"`
	State            string   `json:"state" binding:"required"`
	ZipCode          string   `json:"zip_code"`
	Neighborhood     string   `json:"neighborhood"`
	Latitude         float64  `json:"latitude" binding:"required"`
	Longitude        float64  `json:"longitude" binding:"required"`
	Specialties      []string `json:"specialties" binding:"required"`
	AcceptsInsurance bool     `json:"accepts_insurance"`
	InsuranceList    []string `json:"insurance_list"`
	LogoURL          string   `json:"logo_url"`
}

// CreateClinic creates a new clinic (admin only)
func (ctrl *ClinicController) CreateClinic(c *gin.Context) {
	var req CreateClinicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	uid := userID.(int)

	input := services.CreateClinicInput{
		Name:             req.Name,
		Description:      req.Description,
		CNPJ:             req.CNPJ,
		Phone:            req.Phone,
		Email:            req.Email,
		Website:          req.Website,
		Address:          req.Address,
		City:             req.City,
		State:            req.State,
		ZipCode:          req.ZipCode,
		Neighborhood:     req.Neighborhood,
		Latitude:         req.Latitude,
		Longitude:        req.Longitude,
		Specialties:      req.Specialties,
		AcceptsInsurance: req.AcceptsInsurance,
		InsuranceList:    req.InsuranceList,
		LogoURL:          req.LogoURL,
	}

	clinic, err := ctrl.clinicService.CreateClinic(c.Request.Context(), input, &uid)
	if err != nil {
		log.Printf("Error creating clinic: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, clinic)
}

// GetClinic retrieves a specific clinic
func (ctrl *ClinicController) GetClinic(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clinic ID"})
		return
	}

	clinic, err := ctrl.clinicService.GetClinic(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Clinic not found"})
		return
	}

	c.JSON(http.StatusOK, clinic)
}

// ListClinics retrieves all clinics with pagination
func (ctrl *ClinicController) ListClinics(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	clinics, total, err := ctrl.clinicService.ListClinics(c.Request.Context(), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"clinics": clinics,
		"total":   total,
		"page":    page,
		"pages":   (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// FindNearby finds clinics near a location
func (ctrl *ClinicController) FindNearby(c *gin.Context) {
	lat, err := strconv.ParseFloat(c.Query("lat"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude"})
		return
	}

	lng, err := strconv.ParseFloat(c.Query("lng"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude"})
		return
	}

	radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "10"), 64)
	specialty := c.Query("specialty")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	clinics, err := ctrl.clinicService.FindNearby(c.Request.Context(), lat, lng, radius, specialty, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, clinics)
}

// FindBySpecialty finds clinics by specialty
func (ctrl *ClinicController) FindBySpecialty(c *gin.Context) {
	specialty := c.Param("specialty")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	clinics, total, err := ctrl.clinicService.FindBySpecialty(c.Request.Context(), specialty, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"clinics": clinics,
		"total":   total,
		"page":    page,
	})
}

// FindByCity finds clinics by city
func (ctrl *ClinicController) FindByCity(c *gin.Context) {
	city := c.Param("city")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	clinics, total, err := ctrl.clinicService.FindByCity(c.Request.Context(), city, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"clinics": clinics,
		"total":   total,
		"page":    page,
	})
}

// SearchClinics searches clinics
func (ctrl *ClinicController) SearchClinics(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	clinics, total, err := ctrl.clinicService.SearchClinics(c.Request.Context(), query, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"clinics": clinics,
		"total":   total,
		"page":    page,
	})
}

// GetPremiumClinics retrieves featured/premium clinics
func (ctrl *ClinicController) GetPremiumClinics(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	clinics, err := ctrl.clinicService.GetPremiumClinics(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, clinics)
}

// UpdateClinicRequest defines the request body for updating a clinic
type UpdateClinicRequest struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Phone        string   `json:"phone"`
	Email        string   `json:"email"`
	Address      string   `json:"address"`
	Specialties  []string `json:"specialties"`
}

// UpdateClinic updates a clinic
func (ctrl *ClinicController) UpdateClinic(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clinic ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")

	var req UpdateClinicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Address != "" {
		updates["address"] = req.Address
	}
	if len(req.Specialties) > 0 {
		updates["specialties"] = req.Specialties
	}

	clinic, err := ctrl.clinicService.UpdateClinic(c.Request.Context(), id, updates, userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, clinic)
}

// DeleteClinic deletes a clinic
func (ctrl *ClinicController) DeleteClinic(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clinic ID"})
		return
	}

	userID, _ := c.Get("userID")
	userRole, _ := c.Get("role")

	err = ctrl.clinicService.DeleteClinic(c.Request.Context(), id, userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Clinic deleted successfully"})
}

// CreateClinicReviewRequest defines the request body for creating a clinic review
type CreateClinicReviewRequest struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

// CreateReview creates a review for a clinic
func (ctrl *ClinicController) CreateReview(c *gin.Context) {
	clinicID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clinic ID"})
		return
	}

	userID, _ := c.Get("userID")

	var req CreateClinicReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	review, err := ctrl.clinicService.CreateReview(c.Request.Context(), clinicID, userID.(int), req.Rating, req.Comment)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}

// GetReviews retrieves reviews for a clinic
func (ctrl *ClinicController) GetReviews(c *gin.Context) {
	clinicID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clinic ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	reviews, total, err := ctrl.clinicService.GetReviews(c.Request.Context(), clinicID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews": reviews,
		"total":   total,
		"page":    page,
	})
}

// SetPremiumRequest defines the request body for setting premium status
type SetPremiumRequest struct {
	IsPremium     bool `json:"is_premium"`
	FeaturedOrder int  `json:"featured_order"`
}

// SetPremium sets a clinic as premium (admin only)
func (ctrl *ClinicController) SetPremium(c *gin.Context) {
	clinicID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clinic ID"})
		return
	}

	var req SetPremiumRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	err = ctrl.clinicService.SetPremium(c.Request.Context(), clinicID, req.IsPremium, req.FeaturedOrder)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Premium status updated"})
}
