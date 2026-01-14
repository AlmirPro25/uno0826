package domain

import "time"

// Payment represents a payment transaction.
type Payment struct {
	ID              int       `gorm:"primaryKey;autoIncrement" json:"id"`
	AppointmentID   int       `gorm:"column:appointment_id;not null" json:"appointmentId"`
	PatientID       int       `gorm:"column:patient_id;not null" json:"patientId"`
	Amount          int64     `gorm:"column:amount;not null" json:"amount"` // Amount in cents
	Currency        string    `gorm:"column:currency;default:BRL" json:"currency"`
	Status          string    `gorm:"column:status;default:pending" json:"status"`
	PaymentMethod   string    `gorm:"column:payment_method" json:"paymentMethod"`
	StripePaymentID string    `gorm:"column:stripe_payment_id" json:"stripePaymentId,omitempty"`
	StripeClientSecret string `gorm:"column:stripe_client_secret" json:"-"`
	Description     string    `gorm:"column:description" json:"description"`
	PaidAt          *time.Time `gorm:"column:paid_at" json:"paidAt,omitempty"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	// Relations
	Appointment Appointment `gorm:"foreignKey:AppointmentID;references:ID" json:"appointment,omitempty"`
	Patient     User        `gorm:"foreignKey:PatientID;references:ID" json:"patient,omitempty"`
}

// Payment status constants
const (
	PaymentStatusPending   = "pending"
	PaymentStatusProcessing = "processing"
	PaymentStatusSucceeded = "succeeded"
	PaymentStatusFailed    = "failed"
	PaymentStatusRefunded  = "refunded"
)
