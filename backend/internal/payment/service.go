package payment

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// PaymentService define as operações de negócio para pagamentos.
type PaymentService struct {
	repo PaymentRepository
}

// NewPaymentService cria uma nova instância de PaymentService.
func NewPaymentService(repo PaymentRepository) *PaymentService {
	return &PaymentService{repo: repo}
}

// InitiatePayment inicia um novo pagamento (Intenção).
// No modelo soberano, esta função não escreve no banco; ela apenas valida e retorna o payload do evento.
func (s *PaymentService) InitiatePayment(userID string, amount float64, currency, description string) (*PaymentEventPayload, error) {
	paymentID := uuid.New()
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("userID inválido: %w", err)
	}

	// O payload do evento de pagamento (A Intenção)
	eventPayload := &PaymentEventPayload{
		PaymentID:   paymentID,
		UserID:      parsedUserID,
		Amount:      amount,
		Currency:    currency,
		Description: description,
		Status:      "pending",
		CreatedAt:   time.Now(),
	}

	return eventPayload, nil
}

// GetPaymentByID busca um pagamento pelo ID.
func (s *PaymentService) GetPaymentByID(id uuid.UUID) (*Payment, error) {
	return s.repo.GetPaymentByID(id)
}

// UpdatePaymentStatus atualiza o status de um pagamento.
func (s *PaymentService) UpdatePaymentStatus(paymentID uuid.UUID, newStatus string) (*Payment, error) {
	payment, err := s.repo.GetPaymentByID(paymentID)
	if err != nil {
		return nil, fmt.Errorf("pagamento não encontrado: %w", err)
	}

	payment.Status = newStatus
	payment.UpdatedAt = time.Now()
	if newStatus == "completed" {
		now := time.Now()
		payment.CompletedAt = &now
	}
	if err := s.repo.UpdatePayment(payment); err != nil {
		return nil, fmt.Errorf("falha ao atualizar status do pagamento: %w", err)
	}
	return payment, nil
}

// CalculateUserBalance calcula o saldo total de um usuário.
func (s *PaymentService) CalculateUserBalance(userID uuid.UUID) (float64, time.Time, error) {
	balance, err := s.repo.GetSumOfPaymentsByUserID(userID)
	if err != nil {
		return 0, time.Time{}, fmt.Errorf("falha ao calcular saldo: %w", err)
	}
	return balance, time.Now(), nil
}
