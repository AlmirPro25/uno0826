package services

import (
	"context"
	"errors"
	"log"
	"medisync-platform/backend/internal/core/domain"
	"os"
	"time"

	"gorm.io/gorm"
)

// PaymentService handles payment operations
type PaymentService struct {
	db            *gorm.DB
	stripeKey     string
	enabled       bool
	consultPrice  int64 // Price in cents (e.g., 15000 = R$ 150,00)
}

// NewPaymentService creates a new payment service
func NewPaymentService(db *gorm.DB) *PaymentService {
	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	enabled := stripeKey != ""

	if !enabled {
		log.Println("💳 Payment service disabled (STRIPE_SECRET_KEY not configured)")
	} else {
		log.Println("💳 Payment service enabled")
	}

	// Default consultation price: R$ 150,00
	consultPrice := int64(15000)
	if priceEnv := os.Getenv("CONSULT_PRICE_CENTS"); priceEnv != "" {
		// Parse price from env if needed
	}

	return &PaymentService{
		db:           db,
		stripeKey:    stripeKey,
		enabled:      enabled,
		consultPrice: consultPrice,
	}
}

// IsEnabled returns whether payment service is configured
func (s *PaymentService) IsEnabled() bool {
	return s.enabled
}

// GetConsultPrice returns the consultation price in cents
func (s *PaymentService) GetConsultPrice() int64 {
	return s.consultPrice
}

// CreatePaymentIntent creates a new payment intent for an appointment
func (s *PaymentService) CreatePaymentIntent(ctx context.Context, appointmentID, patientID int, description string) (*domain.Payment, error) {
	if !s.enabled {
		// Return a mock payment for development
		payment := &domain.Payment{
			AppointmentID:   appointmentID,
			PatientID:       patientID,
			Amount:          s.consultPrice,
			Currency:        "BRL",
			Status:          domain.PaymentStatusPending,
			Description:     description,
			StripePaymentID: "mock_payment_" + time.Now().Format("20060102150405"),
		}
		
		if err := s.db.WithContext(ctx).Create(payment).Error; err != nil {
			return nil, err
		}
		
		return payment, nil
	}

	// TODO: Integrate with Stripe API
	// stripe.Key = s.stripeKey
	// params := &stripe.PaymentIntentParams{
	//     Amount:   stripe.Int64(s.consultPrice),
	//     Currency: stripe.String("brl"),
	//     ...
	// }
	// pi, err := paymentintent.New(params)

	payment := &domain.Payment{
		AppointmentID:   appointmentID,
		PatientID:       patientID,
		Amount:          s.consultPrice,
		Currency:        "BRL",
		Status:          domain.PaymentStatusPending,
		Description:     description,
	}

	if err := s.db.WithContext(ctx).Create(payment).Error; err != nil {
		return nil, err
	}

	return payment, nil
}

// GetPayment retrieves a payment by ID
func (s *PaymentService) GetPayment(ctx context.Context, paymentID int) (*domain.Payment, error) {
	var payment domain.Payment
	if err := s.db.WithContext(ctx).First(&payment, paymentID).Error; err != nil {
		return nil, err
	}
	return &payment, nil
}

// GetPaymentByAppointment retrieves payment for an appointment
func (s *PaymentService) GetPaymentByAppointment(ctx context.Context, appointmentID int) (*domain.Payment, error) {
	var payment domain.Payment
	if err := s.db.WithContext(ctx).Where("appointment_id = ?", appointmentID).First(&payment).Error; err != nil {
		return nil, err
	}
	return &payment, nil
}

// GetPaymentsForPatient retrieves all payments for a patient
func (s *PaymentService) GetPaymentsForPatient(ctx context.Context, patientID int) ([]domain.Payment, error) {
	var payments []domain.Payment
	if err := s.db.WithContext(ctx).Where("patient_id = ?", patientID).Order("created_at desc").Find(&payments).Error; err != nil {
		return nil, err
	}
	return payments, nil
}

// ConfirmPayment marks a payment as succeeded (called by webhook or manual confirmation)
func (s *PaymentService) ConfirmPayment(ctx context.Context, paymentID int) error {
	now := time.Now()
	return s.db.WithContext(ctx).Model(&domain.Payment{}).
		Where("id = ?", paymentID).
		Updates(map[string]interface{}{
			"status":  domain.PaymentStatusSucceeded,
			"paid_at": now,
		}).Error
}

// SimulatePayment simulates a successful payment (for development/testing)
func (s *PaymentService) SimulatePayment(ctx context.Context, paymentID int) error {
	payment, err := s.GetPayment(ctx, paymentID)
	if err != nil {
		return errors.New("payment not found")
	}

	if payment.Status != domain.PaymentStatusPending {
		return errors.New("payment already processed")
	}

	return s.ConfirmPayment(ctx, paymentID)
}

// RefundPayment refunds a payment
func (s *PaymentService) RefundPayment(ctx context.Context, paymentID int) error {
	return s.db.WithContext(ctx).Model(&domain.Payment{}).
		Where("id = ?", paymentID).
		Update("status", domain.PaymentStatusRefunded).Error
}
