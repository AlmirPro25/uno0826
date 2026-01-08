
package auth

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"prost-qs/backend/internal/identity"
	"prost-qs/backend/pkg/utils"
)

// AuthService define as operações de autenticação.
type AuthService struct {
	userRepo          identity.UserRepository
	loginEventService *identity.LoginEventService
}

// NewAuthService cria uma nova instância de AuthService.
func NewAuthService(userRepo identity.UserRepository, loginEventService *identity.LoginEventService) *AuthService {
	return &AuthService{
		userRepo:          userRepo,
		loginEventService: loginEventService,
	}
}

// RegisterUser registra um novo usuário.
func (s *AuthService) RegisterUser(username, password, email string) (*identity.User, error) {
	// Verificar se o usuário já existe
	existingUser, _ := s.userRepo.GetUserByUsername(username)
	if existingUser != nil {
		return nil, fmt.Errorf("usuário com este nome já existe")
	}

	// Gerar hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("falha ao gerar hash da senha: %w", err)
	}

	user := &identity.User{
		ID:        uuid.New(),
		Username:  username,
		Email:     email,
		PasswordHash: string(hashedPassword),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Roles:     "[]", // Default role
		Version:   1,
	}

	if err := s.userRepo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("falha ao criar usuário: %w", err)
	}

	return user, nil
}

// LoginUser autentica um usuário e gera tokens.
// Agora também registra evento de login para auditoria.
func (s *AuthService) LoginUser(username, password, applicationScope string) (string, string, time.Time, error) {
	return s.LoginUserWithContext(username, password, applicationScope, "", "")
}

// LoginUserWithContext autentica com contexto de IP e UserAgent
func (s *AuthService) LoginUserWithContext(username, password, applicationScope, ip, userAgent string) (string, string, time.Time, error) {
	user, err := s.userRepo.GetUserByUsername(username)
	if err != nil {
		// Registrar tentativa falha
		if s.loginEventService != nil {
			s.loginEventService.RecordLogin(uuid.Nil, username, ip, userAgent, "password", "", false, "user_not_found")
		}
		return "", "", time.Time{}, fmt.Errorf("usuário não encontrado: %w", err)
	}

	// Comparar senha
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		// Registrar tentativa falha
		if s.loginEventService != nil {
			s.loginEventService.RecordLogin(user.ID, username, ip, userAgent, "password", user.Role, false, "invalid_password")
		}
		return "", "", time.Time{}, fmt.Errorf("senha inválida")
	}

	// Gerar tokens com role e status
	role := user.Role
	if role == "" {
		role = "user"
	}
	status := user.Status
	if status == "" {
		status = "active"
	}
	token, expiresAt, err := utils.GenerateJWT(user.ID.String(), role, status)
	if err != nil {
		return "", "", time.Time{}, fmt.Errorf("falha ao gerar token JWT: %w", err)
	}

	// Refresh token
	refreshToken, err := utils.GenerateRefreshToken(user.ID.String(), role, status)
	if err != nil {
		return "", "", time.Time{}, fmt.Errorf("falha ao gerar refresh token: %w", err)
	}

	// Registrar login bem-sucedido
	if s.loginEventService != nil {
		s.loginEventService.RecordLogin(user.ID, username, ip, userAgent, "password", role, true, "")
	}

	log.Printf("Usuário %s logado com sucesso. Token expira em: %v", user.Username, expiresAt)
	return token, refreshToken, expiresAt, nil
}

// RefreshToken gera um novo token de acesso a partir de um refresh token.
func (s *AuthService) RefreshToken(refreshToken string) (string, time.Time, error) {
	claims, err := utils.ParseRefreshToken(refreshToken)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("refresh token inválido: %w", err)
	}

	userID := claims.UserID
	role := claims.Role
	if role == "" {
		role = "user"
	}
	status := claims.AccountStatus
	if status == "" {
		status = "active"
	}

	newToken, newExpiresAt, err := utils.GenerateJWT(userID, role, status)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("falha ao gerar novo token JWT: %w", err)
	}

	return newToken, newExpiresAt, nil
}

