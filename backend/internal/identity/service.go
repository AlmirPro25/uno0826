package identity

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// IdentityService define as operações de negócio para gerenciamento de identidade.
type IdentityService struct {
	userRepo UserRepository
	db       *gorm.DB
}

// NewIdentityService cria uma nova instância de IdentityService.
func NewIdentityService(userRepo UserRepository) *IdentityService {
	return &IdentityService{userRepo: userRepo}
}

// NewIdentityServiceWithDB cria uma nova instância com DB direto
func NewIdentityServiceWithDB(db *gorm.DB) *IdentityService {
	return &IdentityService{db: db}
}

// CreateUser cria um novo usuário (legacy - para compatibilidade)
func (s *IdentityService) CreateUser(username, password, email, roles string) (*User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("falha ao gerar hash da senha: %w", err)
	}

	user := &User{
		ID:           uuid.New(),
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Roles:        roles,
		Version:      1,
		Status:       UserStatusActive,
		Role:         UserRoleUser,
	}

	return user, nil
}

// GetUserByIDNew busca usuário no novo modelo
func (s *IdentityService) GetUserByIDNew(id uuid.UUID) (*User, error) {
	if s.db == nil {
		return nil, ErrUserNotFound
	}
	var user User
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	// Tenta carregar profile se existir
	s.db.Where("user_id = ?", id).First(&user.Profile)
	return &user, nil
}

// GetSovereignIdentity busca identidade soberana (legacy)
func (s *IdentityService) GetSovereignIdentity(userID uuid.UUID) (*SovereignIdentity, error) {
	if s.db == nil {
		return nil, ErrUserNotFound
	}
	var identity SovereignIdentity
	if err := s.db.Where("user_id = ?", userID).First(&identity).Error; err != nil {
		return nil, err
	}
	return &identity, nil
}

// GetUserApplications simula a busca de aplicações que um usuário pode acessar.
func (s *IdentityService) GetUserApplications(userID uuid.UUID) ([]ApplicationAccess, error) {
	return []ApplicationAccess{
		{AppID: "app-frontend-mobile", AppName: "Prost-QS Mobile", Scope: "read:profile,write:events,read:payments"},
		{AppID: "app-admin-panel", AppName: "Prost-QS Admin", Scope: "read:all,manage:users,manage:schemas"},
	}, nil
}
