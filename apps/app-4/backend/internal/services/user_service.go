package services

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"medisync-platform/backend/pkg/security"

	"gorm.io/gorm"
)

// UserService implementation.
type UserService struct {
	userRepository ports.UserRepository
}

// NewUserService creates a new instance of UserService.
func NewUserService(userRepo ports.UserRepository) *UserService {
	return &UserService{userRepository: userRepo}
}

// CreateUser creates a new user, requiring an explicit role assignment.
func (s *UserService) CreateUser(ctx context.Context, user *domain.User) (*domain.User, error) {
	// 1. Check if email already exists
	existingUser, err := s.userRepository.FindByEmail(ctx, user.Email)
	if err == nil && existingUser != nil {
		return nil, errors.New("email already registered")
	}

	// 2. Set role based on request
	user.RoleID = getRoleIDByName(user.Role.Name)

	// 3. Hash password
	hashedPassword, err := security.HashPassword(user.PasswordHash)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}
	user.PasswordHash = hashedPassword

	// 4. Create user in database
	if err := s.userRepository.Create(ctx, user); err != nil {
		return nil, errors.New("failed to save user")
	}

	return user, nil
}

// ListUsers retrieves all users, filtered by role and paginated.
func (s *UserService) ListUsers(ctx context.Context, role string, page int, pageSize int) ([]domain.User, error) {
	users, err := s.userRepository.List(ctx, role, page, pageSize)
	if err != nil {
		return nil, err
	}
	return users, nil
}

// UpdateUser updates specific fields of a user.
func (s *UserService) UpdateUser(ctx context.Context, id int, updates map[string]interface{}) (*domain.User, error) {
	// 1. Find existing user
	user, err := s.userRepository.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// 2. Apply updates (reflection/manual mapping)
	if fullName, ok := updates["full_name"]; ok {
		user.FullName = fullName.(string)
	}
	if email, ok := updates["email"]; ok {
		user.Email = email.(string)
	}
	if phone, ok := updates["phone"]; ok {
		p := phone.(*string)
		user.Phone = p
	}
	if isActive, ok := updates["is_active"]; ok {
		user.IsActive = isActive.(bool)
	}

	// 3. Save updates
	if err := s.userRepository.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

// GetUser retrieves a user by ID.
func (s *UserService) GetUser(ctx context.Context, id int) (*domain.User, error) {
	user, err := s.userRepository.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return user, nil
}

// DeleteUser soft-deletes or permanently deletes a user by ID.
func (s *UserService) DeleteUser(ctx context.Context, id int) error {
	// 1. Check if user exists
	_, err := s.userRepository.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return err
	}

	// 2. Delete user
	if err := s.userRepository.Delete(ctx, id); err != nil {
		return errors.New("failed to delete user")
	}

	return nil
}
