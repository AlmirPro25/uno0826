package event

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EventRepository define as operações para gerenciar eventos.
type EventRepository interface {
	CreateEvent(event *Event) error
	GetEventByID(id uuid.UUID) (*Event, error)
	GetEventsByUserID(userID uuid.UUID, limit, offset int, eventType string) ([]Event, error)
	GetAllEvents(limit, offset int) ([]Event, error)
}

// GORMEventRepository é uma implementação de EventRepository usando GORM.
type GORMEventRepository struct {
	db        *gorm.DB
	projector StateProjector
}

// NewGORMEventRepository cria uma nova instância de GORMEventRepository.
func NewGORMEventRepository(db *gorm.DB) *GORMEventRepository {
	return &GORMEventRepository{
		db:        db,
		projector: NewGORMStateProjector(db), // Inicializa o projetor de estado
	}
}

// CreateEvent cria um novo evento no banco de dados.
func (r *GORMEventRepository) CreateEvent(event *Event) error {
	if err := r.db.Create(event).Error; err != nil {
		return fmt.Errorf("falha ao criar evento: %w", err)
	}
	return nil
}

// GetEventByID busca um evento pelo ID.
func (r *GORMEventRepository) GetEventByID(id uuid.UUID) (*Event, error) {
	var event Event
	if err := r.db.Where("id = ?", id).First(&event).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("evento não encontrado")
		}
		return nil, fmt.Errorf("falha ao buscar evento: %w", err)
	}
	return &event, nil
}

// GetEventsByUserID busca eventos associados a um UserID (via metadados).
func (r *GORMEventRepository) GetEventsByUserID(userID uuid.UUID, limit, offset int, eventType string) ([]Event, error) {
	var events []Event
	query := r.db.Where("json_extract(metadata, '$.initiatorUserID') = ?", userID.String())

	if eventType != "" {
		query = query.Where("type = ?", eventType)
	}

	if err := query.Limit(limit).Offset(offset).Order("timestamp DESC").Find(&events).Error; err != nil {
		return nil, fmt.Errorf("falha ao buscar eventos por usuário: %w", err)
	}
	return events, nil
}

// GetAllEvents busca todos os eventos (para fins de auditoria ou replay).
func (r *GORMEventRepository) GetAllEvents(limit, offset int) ([]Event, error) {
	var events []Event
	if err := r.db.Limit(limit).Offset(offset).Order("timestamp DESC").Find(&events).Error; err != nil {
		return nil, fmt.Errorf("falha ao buscar todos os eventos: %w", err)
	}
	return events, nil
}
