package controllers

import (
	"medisync-platform/backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PaymentController handles API requests related to payments.
type PaymentController struct {
	paymentService *services.PaymentService
}

// NewPaymentController creates a new instance of PaymentController.
func NewPaymentController(paymentService *services.PaymentService) *PaymentController {
	return &PaymentController{paymentService: paymentService}
}

// PaymentResponse is a DTO for returning payment data
type PaymentResponse struct {
	ID              int     `json:"id"`
	AppointmentID   int     `json:"appointmentId"`
	PatientID       int     `json:"patientId"`
	Amount          int64   `json:"amount"`
	AmountFormatted string  `json:"amountFormatted"`
	Currency        string  `json:"currency"`
	Status          string  `json:"status"`
	Description     string  `json:"description"`
	PaidAt          *string `json:"paidAt,omitempty"`
	CreatedAt       string  `json:"createdAt"`
}

// CreatePaymentRequest defines the request body for creating a payment
type CreatePaymentRequest struct {
	AppointmentID int    `json:"appointmentId" binding:"required"`
	Description   string `json:"description"`
}

// GetPaymentConfig returns payment configuration
func (ctrl *PaymentController) GetPaymentConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"enabled":       ctrl.paymentService.IsEnabled(),
		"consultPrice":  ctrl.paymentService.GetConsultPrice(),
		"currency":      "BRL",
		"priceFormatted": formatPrice(ctrl.paymentService.GetConsultPrice()),
	})
}

// CreatePayment creates a new payment intent
func (ctrl *PaymentController) CreatePayment(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}
	patientID, _ := userID.(int)

	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	payment, err := ctrl.paymentService.CreatePaymentIntent(c.Request.Context(), req.AppointmentID, patientID, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":              payment.ID,
		"appointmentId":   payment.AppointmentID,
		"amount":          payment.Amount,
		"amountFormatted": formatPrice(payment.Amount),
		"currency":        payment.Currency,
		"status":          payment.Status,
	})
}

// GetPayment retrieves a specific payment
func (ctrl *PaymentController) GetPayment(c *gin.Context) {
	paymentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	payment, err := ctrl.paymentService.GetPayment(c.Request.Context(), paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	var paidAt *string
	if payment.PaidAt != nil {
		formatted := payment.PaidAt.Format("2006-01-02T15:04:05Z")
		paidAt = &formatted
	}

	c.JSON(http.StatusOK, PaymentResponse{
		ID:              payment.ID,
		AppointmentID:   payment.AppointmentID,
		PatientID:       payment.PatientID,
		Amount:          payment.Amount,
		AmountFormatted: formatPrice(payment.Amount),
		Currency:        payment.Currency,
		Status:          payment.Status,
		Description:     payment.Description,
		PaidAt:          paidAt,
		CreatedAt:       payment.CreatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

// GetMyPayments retrieves all payments for the logged-in patient
func (ctrl *PaymentController) GetMyPayments(c *gin.Context) {
	userID, _ := c.Get("userID")
	patientID, _ := userID.(int)

	payments, err := ctrl.paymentService.GetPaymentsForPatient(c.Request.Context(), patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}

	var response []PaymentResponse
	for _, p := range payments {
		var paidAt *string
		if p.PaidAt != nil {
			formatted := p.PaidAt.Format("2006-01-02T15:04:05Z")
			paidAt = &formatted
		}
		response = append(response, PaymentResponse{
			ID:              p.ID,
			AppointmentID:   p.AppointmentID,
			PatientID:       p.PatientID,
			Amount:          p.Amount,
			AmountFormatted: formatPrice(p.Amount),
			Currency:        p.Currency,
			Status:          p.Status,
			Description:     p.Description,
			PaidAt:          paidAt,
			CreatedAt:       p.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	c.JSON(http.StatusOK, response)
}

// SimulatePayment simulates a successful payment (for testing)
func (ctrl *PaymentController) SimulatePayment(c *gin.Context) {
	paymentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	if err := ctrl.paymentService.SimulatePayment(c.Request.Context(), paymentID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment simulated successfully", "status": "succeeded"})
}

// formatPrice formats price in cents to BRL string
func formatPrice(cents int64) string {
	reais := float64(cents) / 100
	return "R$ " + strconv.FormatFloat(reais, 'f', 2, 64)
}
