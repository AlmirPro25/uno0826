
package auth

import (
	"context"
	"fmt"
	"time"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/util"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// claims represents the JWT custom claims.
type claims struct {
	UserID uuid.UUID `json:"userId"`
	Role   model.UserRole `json:"role"`
	jwt.RegisteredClaims
}

// AuthService defines the interface for authentication operations.
type AuthService interface {
	Register(ctx context.Context, req *model.RegisterRequest) (*model.AuthResponse, error)
	Login(ctx context.Context, req *model.LoginRequest, userAgent, ipAddress *string) (*model.AuthResponse, error)
	Refresh(ctx context.Context, req *model.RefreshTokenRequest) (*model.AuthResponse, error)
	GenerateTokens(userID uuid.UUID, role model.UserRole) (accessToken, refreshToken string, accessExpires int64, err error)
	ValidateAccessToken(tokenString string) (*claims, error)
}

// authService implements AuthService.
type authService struct {
	userRepo        UserRepository
	sessionRepo     SessionRepository
	jwtSecret       []byte
	accessExp       time.Duration
	refreshExp      time.Duration
	log             *logger.Logger
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo UserRepository, sessionRepo SessionRepository, jwtSecret string, accessExp, refreshExp time.Duration, log *logger.Logger) AuthService {
	return &authService{
		userRepo:        userRepo,
		sessionRepo:     sessionRepo,
		jwtSecret:       []byte(jwtSecret),
		accessExp:       accessExp,
		refreshExp:      refreshExp,
		log:             log,
	}
}

// Register registers a new user.
func (s *authService) Register(ctx context.Context, req *model.RegisterRequest) (*model.AuthResponse, error) {
	// Check if email already exists
	existingUser, err := s.userRepo.GetUserByEmail(ctx, req.Email)
	if err != nil && !errors.Is(err, errors.CodeNotFound) {
		s.log.Error("Error checking existing user by email", zap.Error(err), zap.String("email", req.Email))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to check user existence")
	}
	if existingUser != nil {
		return nil, errors.NewAPIError(409, errors.CodeEmailTaken, "email already registered", nil)
	}

	// Hash password
	hashedPassword, err := util.HashPassword(req.Password)
	if err != nil {
		s.log.Error("Failed to hash password", zap.Error(err))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to process password")
	}

	// Create user
	user := &model.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Role:         model.UserRoleUser,
	}
	createdUser, err := s.userRepo.CreateUser(ctx, user)
	if err != nil {
		s.log.Error("Failed to create user in repository", zap.Error(err))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to create user")
	}

	// Generate tokens
	accessToken, refreshToken, accessExpires, err := s.GenerateTokens(createdUser.ID, createdUser.Role)
	if err != nil {
		s.log.Error("Failed to generate tokens after registration", zap.Error(err), zap.String("userId", createdUser.ID.String()))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to generate tokens")
	}

	// Create and store session
	session := &model.Session{
		UserID:       createdUser.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(s.refreshExp),
		// UserAgent and IPAddress can be added if available from request context
	}
	_, err = s.sessionRepo.CreateSession(ctx, session)
	if err != nil {
		s.log.Error("Failed to create session after registration", zap.Error(err), zap.String("userId", createdUser.ID.String()))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to create session")
	}

	return &model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    accessExpires,
		User: model.UserProfile{
			ID:        createdUser.ID,
			Name:      createdUser.Name,
			Email:     createdUser.Email,
			Role:      createdUser.Role,
			CreatedAt: createdUser.CreatedAt,
			UpdatedAt: createdUser.UpdatedAt,
		},
	}, nil
}

// Login logs in a user.
func (s *authService) Login(ctx context.Context, req *model.LoginRequest, userAgent, ipAddress *string) (*model.AuthResponse, error) {
	user, err := s.userRepo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		s.log.Warn("Login attempt with non-existent email or database error", zap.String("email", req.Email), zap.Error(err))
		return nil, errors.NewAPIError(401, errors.CodeInvalidCredentials, "invalid credentials", nil)
	}

	if !util.CheckPasswordHash(req.Password, user.PasswordHash) {
		s.log.Warn("Login attempt with incorrect password", zap.String("email", req.Email))
		return nil, errors.NewAPIError(401, errors.CodeInvalidCredentials, "invalid credentials", nil)
	}

	// Generate tokens
	accessToken, refreshToken, accessExpires, err := s.GenerateTokens(user.ID, user.Role)
	if err != nil {
		s.log.Error("Failed to generate tokens during login", zap.Error(err), zap.String("userId", user.ID.String()))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to generate tokens")
	}

	// Create and store session
	session := &model.Session{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(s.refreshExp),
		UserAgent:    userAgent,
		IPAddress:    ipAddress,
	}
	_, err = s.sessionRepo.CreateSession(ctx, session)
	if err != nil {
		s.log.Error("Failed to create session during login", zap.Error(err), zap.String("userId", user.ID.String()))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to create session")
	}

	return &model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    accessExpires,
		User: model.UserProfile{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		},
	}, nil
}

// Refresh generates new access and refresh tokens using a valid refresh token.
func (s *authService) Refresh(ctx context.Context, req *model.RefreshTokenRequest) (*model.AuthResponse, error) {
	// 1. Get session by refresh token (decrypting in repo)
	session, err := s.sessionRepo.GetSessionByRefreshToken(ctx, req.RefreshToken)
	if err != nil {
		if errors.Is(err, errors.CodeNotFound) {
			s.log.Warn("Invalid refresh token provided", zap.Error(err))
			return nil, errors.NewAPIError(401, errors.CodeInvalidToken, "invalid refresh token", nil)
		}
		s.log.Error("Error retrieving session by refresh token", zap.Error(err))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to validate refresh token")
	}

	// 2. Check if refresh token is expired
	if time.Now().After(session.ExpiresAt) {
		// Invalidate this expired session from DB
		_ = s.sessionRepo.DeleteSession(ctx, session.ID) // Log error, but don't fail refresh
		s.log.Warn("Expired refresh token used", zap.String("sessionId", session.ID.String()))
		return nil, errors.NewAPIError(401, errors.CodeTokenExpired, "refresh token expired", nil)
	}

	// 3. Get user details for token claims
	user, err := s.userRepo.GetUserByID(ctx, session.UserID)
	if err != nil {
		s.log.Error("User associated with refresh token not found", zap.Error(err), zap.String("userId", session.UserID.String()))
		// Delete the orphaned session as the user doesn't exist anymore
		_ = s.sessionRepo.DeleteSession(ctx, session.ID)
		return nil, errors.NewAPIError(401, errors.CodeInvalidToken, "invalid refresh token (user not found)", nil)
	}

	// 4. Invalidate the old session
	err = s.sessionRepo.DeleteSession(ctx, session.ID)
	if err != nil {
		s.log.Error("Failed to delete old session during refresh", zap.Error(err), zap.String("sessionId", session.ID.String()))
		// Continue, but this could lead to token reuse in specific scenarios
	}

	// 5. Generate new tokens
	accessToken, newRefreshToken, accessExpires, err := s.GenerateTokens(user.ID, user.Role)
	if err != nil {
		s.log.Error("Failed to generate new tokens during refresh", zap.Error(err), zap.String("userId", user.ID.String()))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to generate new tokens")
	}

	// 6. Create and store a new session for the new refresh token
	newSession := &model.Session{
		UserID:       user.ID,
		RefreshToken: newRefreshToken,
		ExpiresAt:    time.Now().Add(s.refreshExp),
		UserAgent:    session.UserAgent, // Inherit from old session
		IPAddress:    session.IPAddress, // Inherit from old session
	}
	_, err = s.sessionRepo.CreateSession(ctx, newSession)
	if err != nil {
		s.log.Error("Failed to create new session during refresh", zap.Error(err), zap.String("userId", user.ID.String()))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to create new session")
	}

	return &model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    accessExpires,
		User: model.UserProfile{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		},
	}, nil
}

// GenerateTokens creates a new access token and refresh token.
func (s *authService) GenerateTokens(userID uuid.UUID, role model.UserRole) (accessToken, refreshToken string, accessExpires int64, err error) {
	// Access Token
	accessClaims := claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.accessExp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}
	accessExpires = accessClaims.ExpiresAt.Unix() - accessClaims.IssuedAt.Unix() // Duration in seconds

	accessTokenJWT := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accessTokenJWT.SignedString(s.jwtSecret)
	if err != nil {
		return "", "", 0, errors.Wrap(err, 500, errors.CodeInternal, "failed to sign access token")
	}

	// Refresh Token (can be a simple UUID or another JWT)
	// For simplicity and to match the schema's 'refreshToken String @unique',
	// we generate a UUID for the refresh token value itself, which will then be encrypted.
	// The *session ID* associated with this refresh token is what we will delete/manage.
	refreshToken = uuid.New().String()

	return accessToken, refreshToken, accessExpires, nil
}

// ValidateAccessToken parses and validates an access token string.
func (s *authService) ValidateAccessToken(tokenString string) (*claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		s.log.Debug("Failed to parse access token", zap.Error(err))
		var ve *jwt.ValidationError
		if errors.As(err, &ve) {
			if ve.Errors&jwt.ValidationErrorExpired != 0 {
				return nil, errors.NewAPIError(401, errors.CodeTokenExpired, "access token expired", err)
			}
			if ve.Errors&jwt.ValidationErrorNotValidYet != 0 {
				return nil, errors.NewAPIError(401, errors.CodeInvalidToken, "access token not valid yet", err)
			}
		}
		return nil, errors.NewAPIError(401, errors.CodeInvalidToken, "invalid access token", err)
	}

	if claims, ok := token.Claims.(*claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.NewAPIError(401, errors.CodeInvalidToken, "invalid access token claims", nil)
}
