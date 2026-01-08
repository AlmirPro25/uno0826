package event

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EventService define as operações de negócio para eventos e projeções de estado.
type EventService struct {
	repo      EventRepository
	projector StateProjector
}

// NewEventService cria uma nova instância de EventService.
func NewEventService(repo EventRepository) *EventService {
	// O projetor é criado dentro do repositório para garantir que ele use o mesmo DB transaction logic.
	// No entanto, para fins de modularidade, passamos a interface StateProjector aqui.
	// Precisamos inicializar o projetor de estado separadamente se o repo não o fizer automaticamente.
	// Assumindo que o NewGORMEventRepository já configura o projetor:
	gormRepo, ok := repo.(*GORMEventRepository)
	if !ok {
		log.Fatal("EventService requer uma implementação GORMEventRepository para acesso ao projetor de estado.")
	}
	return &EventService{
		repo:      repo,
		projector: gormRepo.projector, // Pega o projetor que foi inicializado no repo
	}
}

// CreateEvent cria um novo evento e o persiste.
func (s *EventService) CreateEvent(event *Event) error {
	if err := s.repo.CreateEvent(event); err != nil {
		return fmt.Errorf("falha ao criar evento: %w", err)
	}
	return nil
}

// GetEventsByUserID recupera eventos de um usuário.
func (s *EventService) GetEventsByUserID(userID uuid.UUID, limit, offset int, eventType string) ([]Event, error) {
	return s.repo.GetEventsByUserID(userID, limit, offset, eventType)
}

// ApplyEvent aplica um evento à projeção de estado usando a transação fornecida.
func (s *EventService) ApplyEvent(tx *gorm.DB, event *Event) error {
	return s.projector.ApplyEvent(tx, event)
}

// RebuildState a partir de todos os eventos (para recuperação de desastres ou inicialização).
func (s *EventService) RebuildState(db *gorm.DB) error {
	log.Println("Iniciando reconstrução completa do estado a partir do ledger de eventos...")

	return db.Transaction(func(tx *gorm.DB) error {
		// Limpar tabelas de projeção de estado
		if err := tx.Exec("DELETE FROM users;").Error; err != nil {
			return fmt.Errorf("falha ao limpar tabela de usuários: %w", err)
		}
		if err := tx.Exec("DELETE FROM payments;").Error; err != nil {
			return fmt.Errorf("falha ao limpar tabela de pagamentos: %w", err)
		}

		// Reaplicar todos os eventos em ordem cronológica
		events, err := s.repo.GetAllEvents(0, 0)
		if err != nil {
			return fmt.Errorf("falha ao obter todos os eventos para reconstrução: %w", err)
		}

		for _, evt := range events {
			if err := s.projector.ApplyEvent(tx, &evt); err != nil {
				return fmt.Errorf("falha ao reaplicar evento %s (%s) durante reconstrução: %w", evt.ID, evt.Type, err)
			}
		}
		return nil
	})
}
