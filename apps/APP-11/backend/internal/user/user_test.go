
package user_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/user"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository implements user.UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	args := m.Called(ctx, id)
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

func (m *MockUserRepository) UpdateUser(ctx context.Context, user *model.User) (*model.User, error) {
	args := m.Called(ctx, user)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func TestUserService_GetUserProfile(t *testing.T) {
	mockRepo := new(MockUserRepository)
	testLogger := logger.NewLogger()
	userService := user.NewUserService(mockRepo, testLogger)

	ctx := context.Background()
	userID := uuid.New()
	testUser := &model.User{
		ID:           userID,
		Name:         "Test User",
		Email:        "test@example.com",
		PasswordHash: "hashedpassword",
		Role:         model.UserRoleUser,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	t.Run("successful get user profile", func(t *testing.T) {
		mockRepo.On("GetUserByID", ctx, userID).Return(testUser, nil).Once()

		profile, err := userService.GetUserProfile(ctx, userID)

		assert.Nil(t, err)
		assert.NotNil(t, profile)
		assert.Equal(t, testUser.ID, profile.ID)
		assert.Equal(t, testUser.Name, profile.Name)
		assert.Equal(t, testUser.Email, profile.Email)
		assert.Equal(t, testUser.Role, profile.Role)
		mockRepo.AssertExpectations(t)
	})

	t.Run("user not found", func(t *testing.T) {
		mockRepo.On("GetUserByID", ctx, userID).Return(nil, errors.NewAPIError(404, errors.CodeNotFound, "user not found", nil)).Once()

		profile, err := userService.GetUserProfile(ctx, userID)

		assert.Nil(t, profile)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeNotFound))
		mockRepo.AssertExpectations(t)
	})
	mock.AssertExpectationsForObjects(t, mockRepo)
}

func TestUserService_UpdateUserProfile(t *testing.T) {
	mockRepo := new(MockUserRepository)
	testLogger := logger.NewLogger()
	userService := user.NewUserService(mockRepo, testLogger)

	ctx := context.Background()
	userID := uuid.New()
	originalUser := &model.User{
		ID:           userID,
		Name:         "Original Name",
		Email:        "original@example.com",
		PasswordHash: "originalhashedpassword",
		Role:         model.UserRoleUser,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	t.Run("successful update name and email", func(t *testing.T) {
		newName := "Updated Name"
		newEmail := "updated@example.com"
		req := &model.UpdateUserProfileRequest{
			Name:  &newName,
			Email: &newEmail,
		}

		mockRepo.On("GetUserByID", ctx, userID).Return(originalUser, nil).Once()
		mockRepo.On("GetUserByEmail", ctx, newEmail).Return(nil, errors.NewAPIError(404, errors.CodeNotFound, "user not found", nil)).Once() // Check new email not taken
		mockRepo.On("UpdateUser", ctx, mock.AnythingOfType("*model.User")).Return(func(_ context.Context, user *model.User) *model.User {
			user.Name = newName
			user.Email = newEmail
			user.UpdatedAt = time.Now()
			return user
		}, nil).Once()

		profile, err := userService.UpdateUserProfile(ctx, userID, req)

		assert.Nil(t, err)
		assert.NotNil(t, profile)
		assert.Equal(t, newName, profile.Name)
		assert.Equal(t, newEmail, profile.Email)
		mockRepo.AssertExpectations(t)
	})

	t.Run("update password", func(t *testing.T) {
		newPassword := "newsecurepassword123"
		req := &model.UpdateUserProfileRequest{
			Password: &newPassword,
		}

		mockRepo.On("GetUserByID", ctx, userID).Return(originalUser, nil).Once()
		mockRepo.On("UpdateUser", ctx, mock.AnythingOfType("*model.User")).Return(func(_ context.Context, user *model.User) *model.User {
			user.PasswordHash = "some_new_hashed_password" // Simulate hashing
			user.UpdatedAt = time.Now()
			return user
		}, nil).Once()

		profile, err := userService.UpdateUserProfile(ctx, userID, req)

		assert.Nil(t, err)
		assert.NotNil(t, profile)
		mockRepo.AssertExpectations(t)
	})

	t.Run("email already taken by another user", func(t *testing.T) {
		anotherUserID := uuid.New()
		takenEmail := "taken@example.com"
		req := &model.UpdateUserProfileRequest{
			Email: &takenEmail,
		}
		userWithTakenEmail := &model.User{ID: anotherUserID, Email: takenEmail}

		mockRepo.On("GetUserByID", ctx, userID).Return(originalUser, nil).Once()
		mockRepo.On("GetUserByEmail", ctx, takenEmail).Return(userWithTakenEmail, nil).Once()

		profile, err := userService.UpdateUserProfile(ctx, userID, req)

		assert.Nil(t, profile)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeEmailTaken))
		mockRepo.AssertExpectations(t)
	})

	t.Run("user not found for update", func(t *testing.T) {
		req := &model.UpdateUserProfileRequest{
			Name: mock.AnythingOfType("*string").(*string),
		}
		mockRepo.On("GetUserByID", ctx, userID).Return(nil, errors.NewAPIError(404, errors.CodeNotFound, "user not found", nil)).Once()

		profile, err := userService.UpdateUserProfile(ctx, userID, req)

		assert.Nil(t, profile)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeNotFound))
		mockRepo.AssertExpectations(t)
	})

	t.Run("database error during update", func(t *testing.T) {
		newName := "Updated Name"
		req := &model.UpdateUserProfileRequest{
			Name: &newName,
		}

		mockRepo.On("GetUserByID", ctx, userID).Return(originalUser, nil).Once()
		mockRepo.On("GetUserByEmail", ctx, mock.Anything).Return(nil, errors.NewAPIError(404, errors.CodeNotFound, "user not found", nil)).Maybe()
		mockRepo.On("UpdateUser", ctx, mock.AnythingOfType("*model.User")).Return(nil, fmt.Errorf("db connection lost")).Once()

		profile, err := userService.UpdateUserProfile(ctx, userID, req)

		assert.Nil(t, profile)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeInternal))
		mockRepo.AssertExpectations(t)
	})
	mock.AssertExpectationsForObjects(t, mockRepo)
}
