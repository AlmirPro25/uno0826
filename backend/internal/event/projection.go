package event

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/internal/identity"
	"prost-qs/backend/internal/payment"
	"prost-qs/backend/internal/ad"
)

// StateProjector interface for applying events to state.
type StateProjector interface {
	ApplyEvent(tx *gorm.DB, event *Event) error
}

// GORMStateProjector implements StateProjector using GORM.
type GORMStateProjector struct {
	db *gorm.DB
}

// NewGORMStateProjector creates a new GORMStateProjector.
func NewGORMStateProjector(db *gorm.DB) *GORMStateProjector {
	return &GORMStateProjector{db: db}
}

// ApplyEvent applies an event to update the projected state.
// It uses the provided tx for atomicity within the sovereign kernel's dispatch cycle.
func (p *GORMStateProjector) ApplyEvent(tx *gorm.DB, evt *Event) error {
	var err error
	switch evt.Type {
	case "CreateUserEvent":
		err = p.handleCreateUserEvent(tx, evt)
	case "InitiatePaymentEvent":
		err = p.handleInitiatePaymentEvent(tx, evt)
	case "TrackImpressionEvent":
		err = p.handleTrackImpressionEvent(tx, evt)
	// Adicionar outros tipos de evento aqui para atualizar os respectivos estados
	default:
		log.Printf("INFO: Tipo de evento desconhecido para projeção: %s", evt.Type)
		return nil // Evento sem efeito no estado atual
	}

	if err != nil {
		return fmt.Errorf("falha ao projetar evento %s (%s): %w", evt.ID, evt.Type, err)
	}

	return nil
}

func (p *GORMStateProjector) handleCreateUserEvent(tx *gorm.DB, evt *Event) error {
	var payload struct {
		UserID       string    `json:"userId"`
		Username     string    `json:"username"`
		Email        string    `json:"email"`
		PasswordHash string    `json:"passwordHash"`
		CreatedAt    time.Time `json:"createdAt"`
	}
	if err := json.Unmarshal(evt.Payload, &payload); err != nil {
		return fmt.Errorf("falha ao decodificar payload de CreateUserEvent: %w", err)
	}

	userID, err := uuid.Parse(payload.UserID)
	if err != nil {
		return fmt.Errorf("UserID inválido no payload de CreateUserEvent: %w", err)
	}

	// Criar o usuário na tabela de estado 'users'
	user := &identity.User{
		ID:           userID,
		Username:     payload.Username,
		Email:        payload.Email,
		PasswordHash: payload.PasswordHash,
		CreatedAt:    payload.CreatedAt,
		UpdatedAt:    time.Now(),
		Version:      1,    // Primeira versão do usuário
		Roles:        "[]", // Default roles, pode ser mais sofisticado
	}

	// Como a criação do usuário é feita pelo authService (que usa identityService que usa o mesmo repo),
	// essa projeção aqui pode ser redundante ou usada para garantir consistência ou para um modelo de leitura otimizado.
	// Para o Prost-QS, a tabela `users` é o estado derivado primário.
	if err := tx.Create(user).Error; err != nil {
		return fmt.Errorf("falha ao criar projeção de usuário: %w", err)
	}
	log.Printf("Projeção de estado: Usuário %s criado com sucesso.", user.ID)
	return nil
}

func (p *GORMStateProjector) handleInitiatePaymentEvent(tx *gorm.DB, evt *Event) error {
	var payload struct {
		PaymentID   string    `json:"paymentId"`
		UserID      string    `json:"userId"`
		Amount      float64   `json:"amount"`
		Currency    string    `json:"currency"`
		Description string    `json:"description"`
		Status      string    `json:"status"`
		CreatedAt   time.Time `json:"createdAt"`
	}
	if err := json.Unmarshal(evt.Payload, &payload); err != nil {
		return fmt.Errorf("falha ao decodificar payload de InitiatePaymentEvent: %w", err)
	}

	paymentID, err := uuid.Parse(payload.PaymentID)
	if err != nil {
		return fmt.Errorf("PaymentID inválido no payload de InitiatePaymentEvent: %w", err)
	}
	userID, err := uuid.Parse(payload.UserID)
	if err != nil {
		return fmt.Errorf("UserID inválido no payload de InitiatePaymentEvent: %w", err)
	}

	// Criar ou atualizar o registro de pagamento na tabela de estado `payments`
	paymentRecord := &payment.Payment{
		ID:          paymentID,
		UserID:      userID,
		Amount:      payload.Amount,
		Currency:    payload.Currency,
		Description: payload.Description,
		Status:      payload.Status,
		CreatedAt:   payload.CreatedAt,
		UpdatedAt:   time.Now(),
		Version:     1, // Primeira versão do pagamento
	}

	if err := tx.Create(paymentRecord).Error; err != nil {
		return fmt.Errorf("falha ao criar projeção de pagamento: %w", err)
	}
	log.Printf("Projeção de estado: Pagamento %s iniciado para o usuário %s.", paymentRecord.ID, paymentRecord.UserID)
	return nil
}

func (p *GORMStateProjector) handleTrackImpressionEvent(tx *gorm.DB, evt *Event) error {
	var payload ad.AdEventPayload
	if err := json.Unmarshal(evt.Payload, &payload); err != nil {
		return fmt.Errorf("falha ao decodificar payload de TrackImpressionEvent: %w", err)
	}

	// Aqui poderíamos atualizar uma tabela de analytics ou debitar saldo do anunciante.
	// Por enquanto, apenas logamos a "monetização" capturada no ledger.
	log.Printf("Projeção de estado [Neural Ad]: Impressão capturada para Ad %s (App: %s). Receita: R$ %.2f", 
		payload.AdID, payload.AppID, payload.Cost)

	// Exemplo: Debitar saldo do anunciante se for um sistema pré-pago (não implementado aqui para brevidade)
	return nil
}

