
package user

import (
	"context"
	"net/http"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/util"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// UserService defines the interface for user profile management.
type UserService interface {
	GetUserProfile(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error)
	UpdateUserProfile(ctx context.Context, userID uuid.UUID, req *model.UpdateUserProfileRequest) (*model.UserProfile, error)
}

// userService implements UserService.
type userService struct {
	repo UserRepository
	log  *logger.Logger
}

// NewUserService creates a new UserService.
func NewUserService(repo UserRepository, log *logger.Logger) UserService {
	return &userService{
		repo: repo,
		log:  log,
	}
}

// GetUserProfile retrieves the profile details of a user.
func (s *userService) GetUserProfile(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		s.log.Error("Failed to get user by ID for profile", zap.Error(err), zap.String("userID", userID.String()))
		return nil, errors.FromError(err) // Repository errors already wrapped
	}

	return &model.UserProfile{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, nil
}

// UpdateUserProfile updates editable fields of the authenticated user's profile.
func (s *userService) UpdateUserProfile(ctx context.Context, userID uuid.UUID, req *model.UpdateUserProfileRequest) (*model.UserProfile, error) {
	existingUser, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		s.log.Error("Failed to get user for update profile", zap.Error(err), zap.String("userID", userID.String()))
		return nil, errors.FromError(err)
	}

	if req.Name != nil {
		existingUser.Name = *req.Name
	}
	if req.Email != nil {
		// Check if new email is already taken by another user
		if existingUser.Email != *req.Email {
			userWithNewEmail, err := s.repo.GetUserByEmail(ctx, *req.Email)
			if err != nil && !errors.Is(err, errors.CodeNotFound) {
				s.log.Error("Error checking for duplicate email during update", zap.Error(err), zap.String("newEmail", *req.Email))
				return nil, errors.Wrap(err, http.StatusInternalServerError, errors.CodeInternal, "failed to check email uniqueness")
			}
			if userWithNewEmail != nil && userWithNewEmail.ID != userID {
				return nil, errors.NewAPIError(http.StatusConflict, errors.CodeEmailTaken, "this email is already registered by another user", nil)
			}
		}
		existingUser.Email = *req.Email
	}
	if req.Password != nil {
		hashedPassword, err := util.HashPassword(*req.Password)
		if err != nil {
			s.log.Error("Failed to hash new password for profile update", zap.Error(err), zap.String("userID", userID.String()))
			return nil, errors.Wrap(err, http.StatusInternalServerError, errors.CodeInternal, "failed to update password")
		}
		existingUser.PasswordHash = hashedPassword
	}

	updatedUser, err := s.repo.UpdateUser(ctx, existingUser)
	if err != nil {
		s.log.Error("Failed to update user in repository", zap.Error(err), zap.String("userID", userID.String()))
		return nil, errors.FromError(err)
	}

	return &model.UserProfile{
		ID:        updatedUser.ID,
		Name:      updatedUser.Name,
		Email:     updatedUser.Email,
		Role:      updatedUser.Role,
		CreatedAt: updatedUser.CreatedAt,
		UpdatedAt: updatedUser.UpdatedAt,
	}, nil
}
