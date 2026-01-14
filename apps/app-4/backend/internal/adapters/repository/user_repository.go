package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

// UserRepository implementation using GORM.
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new repository instance.
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user in the database.
func (repo *UserRepository) Create(ctx context.Context, user *domain.User) error {
	return repo.db.WithContext(ctx).Create(user).Error
}

// FindByEmail retrieves a user by their email address.
func (repo *UserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	result := repo.db.WithContext(ctx).Preload("Role").Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

// FindByID retrieves a user by their ID.
func (repo *UserRepository) FindByID(ctx context.Context, id int) (*domain.User, error) {
	var user domain.User
	result := repo.db.WithContext(ctx).Preload("Role").First(&user, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

// List retrieves a list of users, with optional role filtering and pagination.
func (repo *UserRepository) List(ctx context.Context, role string, page int, pageSize int) ([]domain.User, error) {
	var users []domain.User
	query := repo.db.WithContext(ctx).Preload("Role")

	if role != "" {
		query = query.Joins("Role").Where("Role.name = ?", role)
	}

	offset := (page - 1) * pageSize
	result := query.Limit(pageSize).Offset(offset).Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}
	return users, nil
}

// Update updates an existing user's details.
func (repo *UserRepository) Update(ctx context.Context, user *domain.User) error {
	return repo.db.WithContext(ctx).Save(user).Error
}

// Delete soft-deletes a user by their ID (if GORM soft delete is enabled).
func (repo *UserRepository) Delete(ctx context.Context, id int) error {
	return repo.db.WithContext(ctx).Delete(&domain.User{}, id).Error
}
