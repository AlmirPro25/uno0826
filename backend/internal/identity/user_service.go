package identity

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// USER SERVICE - GERENCIAMENTO DE USUÁRIOS
// ========================================

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrEmailAlreadyUsed  = errors.New("email already in use")
	ErrUserSuspended     = errors.New("user is suspended")
	ErrUserBanned        = errors.New("user is banned")
	ErrInvalidRole       = errors.New("invalid role")
)

// UserService gerencia usuários
type UserService struct {
	db *gorm.DB
}

// NewUserService cria uma nova instância
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

// CreateUser cria um novo usuário com perfil
func (s *UserService) CreateUser(name, email, phone string) (*User, error) {
	// Verificar se email já existe
	if email != "" {
		var existing UserProfile
		if err := s.db.Where("email = ?", email).First(&existing).Error; err == nil {
			return nil, ErrEmailAlreadyUsed
		}
	}

	// Criar usuário
	user := &User{
		ID:        uuid.New(),
		Status:    UserStatusActive,
		Role:      UserRoleUser,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	// Criar perfil
	profile := &UserProfile{
		ID:        uuid.New(),
		UserID:    user.ID,
		Name:      name,
		Email:     email,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(profile).Error; err != nil {
		return nil, err
	}

	// Criar método de auth (telefone)
	authMethod := &AuthMethod{
		ID:         uuid.New(),
		UserID:     user.ID,
		Type:       AuthMethodPhone,
		Identifier: phone,
		Verified:   true,
		CreatedAt:  time.Now(),
	}

	if err := s.db.Create(authMethod).Error; err != nil {
		return nil, err
	}

	user.Profile = profile
	user.AuthMethods = []AuthMethod{*authMethod}

	return user, nil
}

// GetUserByID busca usuário por ID
func (s *UserService) GetUserByID(userID uuid.UUID) (*User, error) {
	var user User
	if err := s.db.Preload("Profile").Preload("AuthMethods").Where("id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// GetUserByPhone busca usuário por telefone
func (s *UserService) GetUserByPhone(phone string) (*User, error) {
	var authMethod AuthMethod
	if err := s.db.Where("type = ? AND identifier = ?", AuthMethodPhone, phone).First(&authMethod).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return s.GetUserByID(authMethod.UserID)
}

// GetUserByEmail busca usuário por email
func (s *UserService) GetUserByEmail(email string) (*User, error) {
	var profile UserProfile
	if err := s.db.Where("email = ?", email).First(&profile).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return s.GetUserByID(profile.UserID)
}

// UpdateProfile atualiza o perfil do usuário
func (s *UserService) UpdateProfile(userID uuid.UUID, name, email, avatarURL string) (*UserProfile, error) {
	var profile UserProfile
	if err := s.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		return nil, err
	}

	// Verificar se novo email já existe (se mudou)
	if email != "" && email != profile.Email {
		var existing UserProfile
		if err := s.db.Where("email = ? AND user_id != ?", email, userID).First(&existing).Error; err == nil {
			return nil, ErrEmailAlreadyUsed
		}
	}

	if name != "" {
		profile.Name = name
	}
	if email != "" {
		profile.Email = email
	}
	if avatarURL != "" {
		profile.AvatarURL = avatarURL
	}
	profile.UpdatedAt = time.Now()

	if err := s.db.Save(&profile).Error; err != nil {
		return nil, err
	}

	return &profile, nil
}

// CheckPhoneExists verifica se telefone já está cadastrado
func (s *UserService) CheckPhoneExists(phone string) bool {
	var count int64
	s.db.Model(&AuthMethod{}).Where("type = ? AND identifier = ?", AuthMethodPhone, phone).Count(&count)
	return count > 0
}

// SuspendUser suspende um usuário
func (s *UserService) SuspendUser(userID uuid.UUID, reason string) error {
	return s.db.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":     UserStatusSuspended,
		"updated_at": time.Now(),
	}).Error
}

// BanUser bane um usuário
func (s *UserService) BanUser(userID uuid.UUID, reason string) error {
	return s.db.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":     UserStatusBanned,
		"updated_at": time.Now(),
	}).Error
}

// ReactivateUser reativa um usuário
func (s *UserService) ReactivateUser(userID uuid.UUID) error {
	return s.db.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":     UserStatusActive,
		"updated_at": time.Now(),
	}).Error
}

// SetUserRole define o role do usuário
func (s *UserService) SetUserRole(userID uuid.UUID, role string) error {
	if role != UserRoleUser && role != UserRoleAdmin && role != UserRoleSuperAdmin {
		return ErrInvalidRole
	}

	return s.db.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"role":       role,
		"updated_at": time.Now(),
	}).Error
}

// ListAllUsers lista todos os usuários (admin)
func (s *UserService) ListAllUsers(limit, offset int) ([]User, int64, error) {
	var users []User
	var total int64

	s.db.Model(&User{}).Count(&total)

	if err := s.db.Preload("Profile").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// SearchUsers busca usuários por nome, email ou telefone
func (s *UserService) SearchUsers(query string, limit int) ([]User, error) {
	var users []User

	// Buscar por perfil (nome ou email)
	var profileUserIDs []uuid.UUID
	s.db.Model(&UserProfile{}).
		Where("name LIKE ? OR email LIKE ?", "%"+query+"%", "%"+query+"%").
		Pluck("user_id", &profileUserIDs)

	// Buscar por auth method (telefone)
	var authUserIDs []uuid.UUID
	s.db.Model(&AuthMethod{}).
		Where("identifier LIKE ?", "%"+query+"%").
		Pluck("user_id", &authUserIDs)

	// Combinar IDs
	allIDs := append(profileUserIDs, authUserIDs...)
	if len(allIDs) == 0 {
		return users, nil
	}

	// Buscar usuários
	if err := s.db.Preload("Profile").Preload("AuthMethods").
		Where("id IN ?", allIDs).
		Limit(limit).
		Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}
