package services

import (
	"context"
	"errors"
	"medisync-platform/backend/config"
	"medisync-platform/backend/internal/core/domain"
	"medisync-platform/backend/internal/core/ports"
	"medisync-platform/backend/pkg/security"
	"time"

	"gorm.io/gorm"
)

// AuthService implementation.
type AuthService struct {
	userRepository ports.UserRepository
}

// NewAuthService creates a new instance of AuthService.
func NewAuthService(userRepo ports.UserRepository) *AuthService {
	return &AuthService{userRepository: userRepo}
}

// Login authenticates a user by checking password hash against stored hash.
// It returns a JWT token and user role on success.
func (s *AuthService) Login(ctx context.Context, email, password string) (token string, role string, err error) {
	// 1. Find user by email
	user, err := s.userRepository.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", errors.New("invalid credentials")
		}
		return "", "", errors.New("database error")
	}

	// 2. Compare password hash
	if err := security.CheckPasswordHash(password, user.PasswordHash); err != nil {
		return "", "", errors.New("invalid credentials")
	}

	// 3. Generate JWT token
	cfg := config.LoadConfig() // Load config to get secret key
	token, err = security.GenerateJWT(user.ID, user.Role.Name, cfg.JWTSecret, time.Hour*24)
	if err != nil {
		return "", "", errors.New("failed to generate token")
	}

	return token, user.Role.Name, nil
}

// RegisterPatient creates a new user with the default PACIENTE role.
func (s *AuthService) RegisterPatient(ctx context.Context, user *domain.User) (*domain.User, error) {
	// 1. Check if email already exists
	existingUser, err := s.userRepository.FindByEmail(ctx, user.Email)
	if err == nil && existingUser != nil {
		return nil, errors.New("email already registered")
	}

	// 2. Set default role (PACIENTE)
	user.RoleID = getRoleIDByName(domain.RolePaciente) // Simplified role lookup

	// 3. Hash password (assuming password is in user.PasswordHash temporarily during transfer)
	// The request body contains a clear text password, so we need to hash it here.
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

// GetRefreshToken generates a refresh token for the user.
func (s *AuthService) GetRefreshToken(ctx context.Context, email, password string) (refreshToken string, err error) {
	// 1. Find user by email
	user, err := s.userRepository.FindByEmail(ctx, email)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	// 2. Compare password hash
	if err := security.CheckPasswordHash(password, user.PasswordHash); err != nil {
		return "", errors.New("invalid credentials")
	}

	// 3. Generate refresh token
	cfg := config.LoadConfig()
	refreshToken, err = security.GenerateRefreshToken(user.ID, user.Role.Name, cfg.JWTSecret)
	if err != nil {
		return "", errors.New("failed to generate refresh token")
	}

	return refreshToken, nil
}

// RefreshAccessToken generates a new access token using a valid refresh token.
func (s *AuthService) RefreshAccessToken(ctx context.Context, refreshToken string) (newToken string, err error) {
	cfg := config.LoadConfig()

	// 1. Validate refresh token
	claims, err := security.ValidateJWT(refreshToken, cfg.JWTSecret)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}

	// 2. Check if it's a refresh token
	if claims.TokenType != security.TokenTypeRefresh {
		return "", errors.New("invalid token type")
	}

	// 3. Verify user still exists
	user, err := s.userRepository.FindByID(ctx, claims.UserID)
	if err != nil {
		return "", errors.New("user not found")
	}

	// 4. Generate new access token
	newToken, err = security.GenerateJWT(user.ID, user.Role.Name, cfg.JWTSecret, time.Hour*24)
	if err != nil {
		return "", errors.New("failed to generate new token")
	}

	return newToken, nil
}

// LogoutAllDevices invalidates all tokens for a user by incrementing their token version.
func (s *AuthService) LogoutAllDevices(ctx context.Context, userID int) error {
	user, err := s.userRepository.FindByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	user.TokenVersion++
	if err := s.userRepository.Update(ctx, user); err != nil {
		return errors.New("failed to logout from all devices")
	}

	return nil
}

// ChangePassword changes the user's password and optionally logs out from all devices.
func (s *AuthService) ChangePassword(ctx context.Context, userID int, currentPassword, newPassword string, logoutAll bool) error {
	user, err := s.userRepository.FindByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify current password
	if err := security.CheckPasswordHash(currentPassword, user.PasswordHash); err != nil {
		return errors.New("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := security.HashPassword(newPassword)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user.PasswordHash = hashedPassword

	// Optionally invalidate all tokens
	if logoutAll {
		user.TokenVersion++
	}

	if err := s.userRepository.Update(ctx, user); err != nil {
		return errors.New("failed to change password")
	}

	return nil
}

// GetUserByID returns a user by their ID.
func (s *AuthService) GetUserByID(ctx context.Context, userID int) (*domain.User, error) {
	user, err := s.userRepository.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

// Simplified function to look up role ID based on name.
// In a proper implementation, this lookup should be done dynamically from a role repository.
func getRoleIDByName(roleName string) int {
	switch roleName {
	case domain.RoleAdmin:
		return 1
	case domain.RoleMedico:
		return 2
	case domain.RolePaciente:
		return 3
	default:
		return 3 // Default to patient if role name is unrecognized
	}
}
