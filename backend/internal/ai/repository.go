
package ai

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AIRepository define as operações para gerenciar versões de schema da IA.
type AIRepository interface {
	CreateAISchemaVersion(version *AISchemaVersion) error
	GetAISchemaVersionByID(id uuid.UUID) (*AISchemaVersion, error)
	GetLatestAISchemaVersion() (*AISchemaVersion, error)
}

// GORMVersionRepository é uma implementação de AIRepository usando GORM.
type GORMVersionRepository struct {
	db *gorm.DB
}

// NewGORMVersionRepository cria uma nova instância de GORMVersionRepository.
func NewGORMVersionRepository(db *gorm.DB) *GORMVersionRepository {
	return &GORMVersionRepository{db: db}
}

// CreateAISchemaVersion cria uma nova entrada de versão de schema.
func (r *GORMVersionRepository) CreateAISchemaVersion(version *AISchemaVersion) error {
	if err := r.db.Create(version).Error; err != nil {
		return fmt.Errorf("falha ao criar versão de schema da IA: %w", err)
	}
	return nil
}

// GetAISchemaVersionByID busca uma versão de schema pelo ID.
func (r *GORMVersionRepository) GetAISchemaVersionByID(id uuid.UUID) (*AISchemaVersion, error) {
	var version AISchemaVersion
	if err := r.db.Where("id = ?", id).First(&version).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("versão de schema da IA não encontrada")
		}
		return nil, fmt.Errorf("falha ao buscar versão de schema da IA: %w", err)
	}
	return &version, nil
}

// GetLatestAISchemaVersion busca a versão de schema mais recente.
func (r *GORMVersionRepository) GetLatestAISchemaVersion() (*AISchemaVersion, error) {
	var version AISchemaVersion
	if err := r.db.Order("version DESC").First(&version).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("nenhuma versão de schema da IA encontrada")
		}
		return nil, fmt.Errorf("falha ao buscar a versão mais recente do schema da IA: %w", err)
	}
	return &version, nil
}

