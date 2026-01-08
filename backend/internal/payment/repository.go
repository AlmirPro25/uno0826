
package payment

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentRepository define as operações para gerenciar pagamentos.
type PaymentRepository interface {
	CreatePayment(payment *Payment) error
	GetPaymentByID(id uuid.UUID) (*Payment, error)
	GetPaymentsByUserID(userID uuid.UUID) ([]Payment, error)
	GetSumOfPaymentsByUserID(userID uuid.UUID) (float64, error) // Para saldo
	UpdatePayment(payment *Payment) error
}

// GormPaymentRepository é uma implementação de PaymentRepository usando GORM.
type GormPaymentRepository struct {
	db *gorm.DB
}

// NewGormPaymentRepository cria uma nova instância de GormPaymentRepository.
func NewGormPaymentRepository(db *gorm.DB) *GormPaymentRepository {
	return &GormPaymentRepository{db: db}
}

// CreatePayment cria um novo registro de pagamento.
func (r *GormPaymentRepository) CreatePayment(payment *Payment) error {
	if err := r.db.Create(payment).Error; err != nil {
		return fmt.Errorf("falha ao criar pagamento: %w", err)
	}
	return nil
}

// GetPaymentByID busca um pagamento pelo ID.
func (r *GormPaymentRepository) GetPaymentByID(id uuid.UUID) (*Payment, error) {
	var payment Payment
	if err := r.db.Where("id = ?", id).First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("pagamento não encontrado")
		}
		return nil, fmt.Errorf("falha ao buscar pagamento: %w", err)
	}
	return &payment, nil
}

// GetPaymentsByUserID busca todos os pagamentos associados a um usuário.
func (r *GormPaymentRepository) GetPaymentsByUserID(userID uuid.UUID) ([]Payment, error) {
	var payments []Payment
	if err := r.db.Where("user_id = ?", userID).Find(&payments).Error; err != nil {
		return nil, fmt.Errorf("falha ao buscar pagamentos por usuário: %w", err)
	}
	return payments, nil
}

// GetSumOfPaymentsByUserID calcula o saldo de um usuário.
func (r *GormPaymentRepository) GetSumOfPaymentsByUserID(userID uuid.UUID) (float64, error) {
	var total *float64
	// Exemplo simplificado: Soma todos os pagamentos "completed".
	// Em um sistema real, haveria tipos de transação (débito/crédito) e estados mais complexos.
	if err := r.db.Model(&Payment{}).
		Where("user_id = ? AND status = ?", userID, "completed").
		Select("COALESCE(SUM(amount), 0)").Row().Scan(&total); err != nil {
		return 0, fmt.Errorf("falha ao calcular soma dos pagamentos: %w", err)
	}
	if total == nil {
		return 0, nil
	}
	return *total, nil
}

// UpdatePayment atualiza um pagamento existente.
func (r *GormPaymentRepository) UpdatePayment(payment *Payment) error {
	payment.UpdatedAt = time.Now()
	payment.Version++
	if err := r.db.Save(payment).Error; err != nil {
		return fmt.Errorf("falha ao atualizar pagamento: %w", err)
	}
	return nil
}

