
package auth_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"ai-web-weaver/backend/internal/auth"
	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository implements auth.UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) CreateUser(ctx context.Context, user *model.User) (*model.User, error) {
	args := m.Called(ctx, user)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}
func (m *MockUserRepository) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}
func (m *MockUserRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}
func (m *MockUserRepository) UpdateUser(ctx context.Context, user *model.User) (*model.User, error) {
	args := m.Called(ctx, user)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

// MockSessionRepository implements auth.SessionRepository
type MockSessionRepository struct {
	mock.Mock
}

func (m *MockSessionRepository) CreateSession(ctx context.Context, session *model.Session) (*model.Session, error) {
	args := m.Called(ctx, session)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Session), args.Error(1)
}
func (m *MockSessionRepository) GetSessionByRefreshToken(ctx context.Context, refreshToken string) (*model.Session, error) {
	args := m.Called(ctx, refreshToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Session), args.Error(1)
}
func (m *MockSessionRepository) DeleteSession(ctx context.Context, sessionID uuid.UUID) error {
	args := m.Called(ctx, sessionID)
	return args.Error(0)
}
func (m *MockSessionRepository) DeleteUserSessions(ctx context.Context, userID uuid.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func TestAuthService_Register(t *testing.T) {
	mockUserRepo := new(MockUserRepository)
	mockSessionRepo := new(MockSessionRepository)
	testLogger := logger.NewLogger()
	authService := auth.NewAuthService(mockUserRepo, mockSessionRepo, "test_secret", 15*time.Minute, 24*time.Hour, testLogger)

	ctx := context.Background()
	req := &model.RegisterRequest{
		Name:     "Test User",
		Email:    "test@example.com",
		Password: "password123",
	}

	t.Run("successful registration", func(t *testing.T) {
		mockUserRepo.On("GetUserByEmail", ctx, req.Email).Return(nil, errors.NewAPIError(404, errors.CodeNotFound, "user not found", nil)).Once()
		mockUserRepo.On("CreateUser", ctx, mock.AnythingOfType("*model.User")).Return(func(_ context.Context, user *model.User) *model.User {
			user.ID = uuid.New()
			user.CreatedAt = time.Now()
			user.UpdatedAt = time.Now()
			return user
		}, nil).Once()
		mockSessionRepo.On("CreateSession", ctx, mock.AnythingOfType("*model.Session")).Return(func(_ context.Context, session *model.Session) *model.Session {
			session.ID = uuid.New()
			return session
		}, nil).Once()

		resp, err := authService.Register(ctx, req)

		assert.Nil(t, err)
		assert.NotNil(t, resp)
		assert.NotEmpty(t, resp.AccessToken)
		assert.NotEmpty(t, resp.RefreshToken)
		assert.Equal(t, "Test User", resp.User.Name)
		assert.Equal(t, req.Email, resp.User.Email)

		mockUserRepo.AssertExpectations(t)
		mockSessionRepo.AssertExpectations(t)
	})

	t.Run("email already registered", func(t *testing.T) {
		existingUser := &model.User{ID: uuid.New(), Email: req.Email}
		mockUserRepo.On("GetUserByEmail", ctx, req.Email).Return(existingUser, nil).Once()

		resp, err := authService.Register(ctx, req)

		assert.Nil(t, resp)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeEmailTaken))
		mockUserRepo.AssertExpectations(t)
	})

	mock.AssertExpectationsForObjects(t, mockUserRepo, mockSessionRepo) // Ensure all mocks are reset or re-created for new test runs
}

func TestAuthService_Login(t *testing.T) {
	mockUserRepo := new(MockUserRepository)
	mockSessionRepo := new(MockSessionRepository)
	testLogger := logger.NewLogger()
	authService := auth.NewAuthService(mockUserRepo, mockSessionRepo, "test_secret", 15*time.Minute, 24*time.Hour, testLogger)

	ctx := context.Background()
	req := &model.LoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	}
	userID := uuid.New()
	hashedPassword, _ := auth.HashPassword(req.Password)
	existingUser := &model.User{
		ID:           userID,
		Name:         "Test User",
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Role:         model.UserRoleUser,
	}

	t.Run("successful login", func(t *testing.T) {
		mockUserRepo.On("GetUserByEmail", ctx, req.Email).Return(existingUser, nil).Once()
		mockSessionRepo.On("CreateSession", ctx, mock.AnythingOfType("*model.Session")).Return(func(_ context.Context, session *model.Session) *model.Session {
			session.ID = uuid.New()
			return session
		}, nil).Once()

		resp, err := authService.Login(ctx, req, nil, nil)

		assert.Nil(t, err)
		assert.NotNil(t, resp)
		assert.NotEmpty(t, resp.AccessToken)
		assert.NotEmpty(t, resp.RefreshToken)

		mockUserRepo.AssertExpectations(t)
		mockSessionRepo.AssertExpectations(t)
	})

	t.Run("invalid credentials - wrong password", func(t *testing.T) {
		mockUserRepo.On("GetUserByEmail", ctx, req.Email).Return(existingUser, nil).Once()
		wrongPasswordReq := &model.LoginRequest{
			Email:    req.Email,
			Password: "wrongpassword",
		}

		resp, err := authService.Login(ctx, wrongPasswordReq, nil, nil)

		assert.Nil(t, resp)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeInvalidCredentials))
		mockUserRepo.AssertExpectations(t)
	})

	mock.AssertExpectationsForObjects(t, mockUserRepo, mockSessionRepo)
}

func TestAuthService_Refresh(t *testing.T) {
	mockUserRepo := new(MockUserRepository)
	mockSessionRepo := new(MockSessionRepository)
	testLogger := logger.NewLogger()
	authService := auth.NewAuthService(mockUserRepo, mockSessionRepo, "test_secret", 15*time.Minute, 24*time.Hour, testLogger)

	ctx := context.Background()
	userID := uuid.New()
	oldSessionID := uuid.New()
	oldRefreshToken := "old_refresh_token_uuid"
	validTill := time.Now().Add(1 * time.Hour)
	expiredTill := time.Now().Add(-1 * time.Hour)

	// User details
	user := &model.User{ID: userID, Name: "Test User", Email: "test@example.com", Role: model.UserRoleUser}

	t.Run("successful refresh", func(t *testing.T) {
		mockSession := &model.Session{
			ID:           oldSessionID,
			UserID:       userID,
			RefreshToken: oldRefreshToken,
			ExpiresAt:    validTill,
		}
		mockSessionRepo.On("GetSessionByRefreshToken", ctx, oldRefreshToken).Return(mockSession, nil).Once()
		mockUserRepo.On("GetUserByID", ctx, userID).Return(user, nil).Once()
		mockSessionRepo.On("DeleteSession", ctx, oldSessionID).Return(nil).Once()
		mockSessionRepo.On("CreateSession", ctx, mock.AnythingOfType("*model.Session")).Return(func(_ context.Context, session *model.Session) *model.Session {
			session.ID = uuid.New()
			return session
		}, nil).Once()

		req := &model.RefreshTokenRequest{RefreshToken: oldRefreshToken}
		resp, err := authService.Refresh(ctx, req)

		assert.Nil(t, err)
		assert.NotNil(t, resp)
		assert.NotEmpty(t, resp.AccessToken)
		assert.NotEmpty(t, resp.RefreshToken)
		assert.NotEqual(t, oldRefreshToken, resp.RefreshToken) // New refresh token generated

		mockSessionRepo.AssertExpectations(t)
		mockUserRepo.AssertExpectations(t)
	})

	t.Run("refresh token expired", func(t *testing.T) {
		expiredSession := &model.Session{
			ID:           oldSessionID,
			UserID:       userID,
			RefreshToken: oldRefreshToken,
			ExpiresAt:    expiredTill,
		}
		mockSessionRepo.On("GetSessionByRefreshToken", ctx, oldRefreshToken).Return(expiredSession, nil).Once()
		mockSessionRepo.On("DeleteSession", ctx, oldSessionID).Return(nil).Once() // Should try to delete expired session

		req := &model.RefreshTokenRequest{RefreshToken: oldRefreshToken}
		resp, err := authService.Refresh(ctx, req)

		assert.Nil(t, resp)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeTokenExpired))

		mockSessionRepo.AssertExpectations(t)
	})

	mock.AssertExpectationsForObjects(t, mockUserRepo, mockSessionRepo)
}

func TestAuthService_ValidateAccessToken(t *testing.T) {
	mockUserRepo := new(MockUserRepository)
	mockSessionRepo := new(MockSessionRepository)
	testLogger := logger.NewLogger()
	jwtSecret := "test_secret"
	authService := auth.NewAuthService(mockUserRepo, mockSessionRepo, jwtSecret, 15*time.Minute, 24*time.Hour, testLogger)

	userID := uuid.New()
	role := model.UserRoleUser

	accessToken, _, _, _ := authService.GenerateTokens(userID, role)

	t.Run("valid access token", func(t *testing.T) {
		claims, err := authService.ValidateAccessToken(accessToken)
		assert.Nil(t, err)
		assert.NotNil(t, claims)
		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, role, claims.Role)
	})

	t.Run("invalid access token - wrong secret", func(t *testing.T) {
		wrongSecretService := auth.NewAuthService(mockUserRepo, mockSessionRepo, "wrong_secret", 15*time.Minute, 24*time.Hour, testLogger)
		claims, err := wrongSecretService.ValidateAccessToken(accessToken)
		assert.Nil(t, claims)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeInvalidToken))
		assert.Contains(t, err.Error(), "crypto/ecdsa: verification error") // Specific error for invalid signature usually
	})

	t.Run("expired access token", func(t *testing.T) {
		expiredService := auth.NewAuthService(mockUserRepo, mockSessionRepo, jwtSecret, -5*time.Minute, 24*time.Hour, testLogger) // Create token that is already expired
		expiredAccessToken, _, _, _ := expiredService.GenerateTokens(userID, role)

		claims, err := authService.ValidateAccessToken(expiredAccessToken)
		assert.Nil(t, claims)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeTokenExpired))
	})
}
