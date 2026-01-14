package controllers

import (
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ReviewController handles HTTP requests for reviews.
type ReviewController struct {
	reviewService ports.ReviewService
}

// NewReviewController creates a new ReviewController instance.
func NewReviewController(svc ports.ReviewService) *ReviewController {
	return &ReviewController{reviewService: svc}
}

// ReviewDTO for API responses (flattens nested objects).
type ReviewDTO struct {
	ID            int    `json:"id"`
	AppointmentID int    `json:"appointmentId"`
	PatientID     int    `json:"patientId"`
	PatientName   string `json:"patientName"`
	DoctorID      int    `json:"doctorId"`
	DoctorName    string `json:"doctorName"`
	Rating        int    `json:"rating"`
	Comment       string `json:"comment"`
	CreatedAt     string `json:"createdAt"`
}

func toReviewDTO(r *domain.Review) ReviewDTO {
	dto := ReviewDTO{
		ID:            r.ID,
		AppointmentID: r.AppointmentID,
		PatientID:     r.PatientID,
		DoctorID:      r.DoctorID,
		Rating:        r.Rating,
		Comment:       r.Comment,
		CreatedAt:     r.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if r.Patient.ID != 0 {
		dto.PatientName = r.Patient.FullName
	}
	if r.Doctor.ID != 0 {
		dto.DoctorName = r.Doctor.FullName
	}
	return dto
}


// CreateReviewRequest represents the request body for creating a review.
type CreateReviewRequest struct {
	AppointmentID int    `json:"appointmentId" binding:"required"`
	Rating        int    `json:"rating" binding:"required,min=1,max=5"`
	Comment       string `json:"comment"`
}

// CreateReview handles POST /reviews
func (ctrl *ReviewController) CreateReview(c *gin.Context) {
	userID := c.GetInt("userID")

	var req CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := ctrl.reviewService.CreateReview(c.Request.Context(), userID, req.AppointmentID, req.Rating, req.Comment)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, toReviewDTO(review))
}

// GetReview handles GET /reviews/:id
func (ctrl *ReviewController) GetReview(c *gin.Context) {
	userID := c.GetInt("userID")
	userRole := c.GetString("userRole")

	reviewID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	review, err := ctrl.reviewService.GetReview(c.Request.Context(), reviewID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toReviewDTO(review))
}

// GetReviewByAppointment handles GET /appointments/:id/review
func (ctrl *ReviewController) GetReviewByAppointment(c *gin.Context) {
	userID := c.GetInt("userID")
	userRole := c.GetString("userRole")

	appointmentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid appointment ID"})
		return
	}

	review, err := ctrl.reviewService.GetReviewByAppointment(c.Request.Context(), appointmentID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toReviewDTO(review))
}

// GetMyReviews handles GET /reviews/my-reviews (for patients)
func (ctrl *ReviewController) GetMyReviews(c *gin.Context) {
	userID := c.GetInt("userID")

	reviews, err := ctrl.reviewService.GetReviewsForPatient(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	dtos := make([]ReviewDTO, len(reviews))
	for i, r := range reviews {
		dtos[i] = toReviewDTO(&r)
	}

	c.JSON(http.StatusOK, dtos)
}

// GetDoctorReviews handles GET /doctors/:doctorId/reviews
func (ctrl *ReviewController) GetDoctorReviews(c *gin.Context) {
	doctorID, err := strconv.Atoi(c.Param("doctorId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid doctor ID"})
		return
	}

	reviews, err := ctrl.reviewService.GetReviewsForDoctor(c.Request.Context(), doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	dtos := make([]ReviewDTO, len(reviews))
	for i, r := range reviews {
		dtos[i] = toReviewDTO(&r)
	}

	c.JSON(http.StatusOK, dtos)
}

// GetDoctorRating handles GET /doctors/:doctorId/rating
func (ctrl *ReviewController) GetDoctorRating(c *gin.Context) {
	doctorID, err := strconv.Atoi(c.Param("doctorId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid doctor ID"})
		return
	}

	average, count, err := ctrl.reviewService.GetDoctorRating(c.Request.Context(), doctorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"doctorId":      doctorID,
		"averageRating": average,
		"totalReviews":  count,
	})
}

// UpdateReviewRequest represents the request body for updating a review.
type UpdateReviewRequest struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

// UpdateReview handles PUT /reviews/:id
func (ctrl *ReviewController) UpdateReview(c *gin.Context) {
	userID := c.GetInt("userID")

	reviewID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	var req UpdateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := ctrl.reviewService.UpdateReview(c.Request.Context(), reviewID, userID, req.Rating, req.Comment)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toReviewDTO(review))
}

// DeleteReview handles DELETE /reviews/:id
func (ctrl *ReviewController) DeleteReview(c *gin.Context) {
	userID := c.GetInt("userID")

	reviewID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	if err := ctrl.reviewService.DeleteReview(c.Request.Context(), reviewID, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review deleted successfully"})
}
