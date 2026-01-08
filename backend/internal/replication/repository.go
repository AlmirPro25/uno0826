
package replication

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReplicationStateRepository define as operações para gerenciar o estado de replicação entre nós.
type ReplicationStateRepository interface {
	CreateOrUpdateReplicationState(state *ReplicationState) error
	GetReplicationStateByNodeID(nodeID uuid.UUID) (*ReplicationState, error)
	GetAllReplicationStates() ([]ReplicationState, error)
}

// GORMStateRepository é uma implementação de ReplicationStateRepository usando GORM.
type GORMStateRepository struct {
	db *gorm.DB
}

// NewGORMStateRepository cria uma nova instância de GORMStateRepository.
func NewGORMStateRepository(db *gorm.DB) *GORMStateRepository {
	return &GORMStateRepository{db: db}
}

// CreateOrUpdateReplicationState cria ou atualiza o estado de replicação para um nó.
func (r *GORMStateRepository) CreateOrUpdateReplicationState(state *ReplicationState) error {
	state.UpdatedAt = time.Now()
	// Tenta encontrar o registro. Se não encontrar, cria. Se encontrar, atualiza.
	result := r.db.Model(state).Where("node_id = ?", state.NodeID).Updates(state)
	if result.Error != nil {
		return fmt.Errorf("falha ao atualizar estado de replicação: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		state.CreatedAt = time.Now()
		if err := r.db.Create(state).Error; err != nil {
			return fmt.Errorf("falha ao criar estado de replicação: %w", err)
		}
	}
	return nil
}

// GetReplicationStateByNodeID busca o estado de replicação para um nó específico.
func (r *GORMStateRepository) GetReplicationStateByNodeID(nodeID uuid.UUID) (*ReplicationState, error) {
	var state ReplicationState
	if err := r.db.Where("node_id = ?", nodeID).First(&state).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("estado de replicação para o nó %s não encontrado", nodeID)
		}
		return nil, fmt.Errorf("falha ao buscar estado de replicação: %w", err)
	}
	return &state, nil
}

// GetAllReplicationStates busca todos os estados de replicação.
func (r *GORMStateRepository) GetAllReplicationStates() ([]ReplicationState, error) {
	var states []ReplicationState
	if err := r.db.Find(&states).Error; err != nil {
		return nil, fmt.Errorf("falha ao buscar todos os estados de replicação: %w", err)
	}
	return states, nil
}

