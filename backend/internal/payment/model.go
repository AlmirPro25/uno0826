
package payment

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Payment representa um registro de pagamento no estado derivado do kernel.
type Payment struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	Amount      float64   `gorm:"not null" json:"amount"`
	Currency    string    `gorm:"size:10;not null" json:"currency"`
	Description string    `gorm:"type:text" json:"description"`
	Status      string    `gorm:"size:50;not null" json:"status"` // e.g., "pending", "completed", "failed"
	ProcessorID string    `gorm:"size:255" json:"processorId"` // ID da transação no gateway externo (se houver)
	CreatedAt   time.Time `gorm:"not null" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"not null" json:"updatedAt"`
	CompletedAt *time.Time `json:"completedAt,omitempty"` // Opcional
	Version     int       `gorm:"not null" json:"version"` // Versão do registro de estado
	gorm.Model
}

// InitiatePaymentRequest representa a requisição para iniciar um pagamento.
type InitiatePaymentRequest struct {
	UserID      string  `json:"userId"` // O pagador/recebedor
	Amount      float64 `json:"amount" binding:"required"`
	Currency    string  `json:"currency" binding:"required"`
	Description string  `json:"description"`
	PaymentMethod string `json:"paymentMethod"` // e.g., "stripe", "pix"
}

// InitiatePaymentResponse representa a resposta de um pagamento iniciado.
type InitiatePaymentResponse struct {
	PaymentID string `json:"paymentId"`
	Status    string `json:"status"`
	Message   string `json:"message"`
}

// PaymentStatusResponse representa a resposta de consulta de status de pagamento.
type PaymentStatusResponse struct {
	PaymentID string    `json:"paymentId"`
	Status    string    `json:"status"`
	Amount    float64   `json:"amount"`
	Currency  string    `json:"currency"`
	Timestamp time.Time `json:"timestamp"`
}

// UserBalanceResponse representa a resposta do saldo do usuário.
type UserBalanceResponse struct {
	UserID      string    `json:"userId"`
	Balance     float64   `json:"balance"`
	Currency    string    `json:"currency"`
	LastUpdated time.Time `json:"lastUpdated"`
}

// PaymentEventPayload é o payload que seria incorporado a um evento.Event
type PaymentEventPayload struct {
	PaymentID   uuid.UUID `json:"paymentId"`
	UserID      uuid.UUID `json:"userId"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	Description string    `json:"description"`
	Status      string    `json:"status"` // e.g., "pending", "processed"
	CreatedAt   time.Time `json:"createdAt"`
}

