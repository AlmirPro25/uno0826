
package identity

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserRepository define as operações para gerenciar usuários.
type UserRepository interface {
	CreateUser(user *User) error
	GetUserByID(id uuid.UUID) (*User, error)
	GetUserByUsername(username string) (*User, error)
	UpdateUser(user *User) error
	DeleteUser(id uuid.UUID) error
}

// GORMUserRepository é uma implementação de UserRepository usando GORM.
type GORMUserRepository struct {
	db *gorm.DB
}

// NewGORMUserRepository cria uma nova instância de GORMUserRepository.
func NewGORMUserRepository(db *gorm.DB) *GORMUserRepository {
	return &GORMUserRepository{db: db}
}

// CreateUser cria um novo usuário no banco de dados.
func (r *GORMUserRepository) CreateUser(user *User) error {
	if err := r.db.Create(user).Error; err != nil {
		return fmt.Errorf("falha ao criar usuário: %w", err)
	}
	return nil
}

// GetUserByID busca um usuário pelo ID.
func (r *GORMUserRepository) GetUserByID(id uuid.UUID) (*User, error) {
	var user User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("usuário não encontrado")
		}
		return nil, fmt.Errorf("falha ao buscar usuário: %w", err)
	}
	return &user, nil
}

// GetUserByUsername busca um usuário pelo nome de usuário.
func (r *GORMUserRepository) GetUserByUsername(username string) (*User, error) {
	var user User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("usuário não encontrado")
		}
		return nil, fmt.Errorf("falha ao buscar usuário: %w", err)
	}
	return &user, nil
}

// UpdateUser atualiza um usuário existente.
func (r *GORMUserRepository) UpdateUser(user *User) error {
	if err := r.db.Save(user).Error; err != nil {
		return fmt.Errorf("falha ao atualizar usuário: %w", err)
	}
	return nil
}

// DeleteUser deleta um usuário pelo ID.
func (r *GORMUserRepository) DeleteUser(id uuid.UUID) error {
	if err := r.db.Delete(&User{}, id).Error; err != nil {
		return fmt.Errorf("falha ao deletar usuário: %w", err)
	}
	return nil
}

