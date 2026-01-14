
package user

import (
	"encoding/json"
	"net/http"

	"ai-web-weaver/backend/internal/middleware"
	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/validator"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"go.uber.org/zap"
)

// UserHandler handles HTTP requests for user profile management.
type UserHandler struct {
	service   UserService
	validator *validator.Validator
	log       *logger.Logger
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(s UserService, v *validator.Validator, log *logger.Logger) *UserHandler {
	return &UserHandler{
		service:   s,
		validator: v,
		log:       log,
	}
}

// GetProfile retrieves the profile of the authenticated user.
func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, errors.NewAPIError(http.StatusUnauthorized, errors.CodeUnauthorized, "user ID not found in context", err).Error(), http.StatusUnauthorized)
		return
	}

	userProfile, err := h.service.GetUserProfile(r.Context(), userID)
	if err != nil {
		apiErr := errors.FromError(err)
		h.log.Error("Failed to get user profile", zap.Error(apiErr.Err), zap.String("userID", userID.String()))
		http.Error(w, apiErr.Error(), apiErr.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(userProfile); err != nil {
		h.log.Error("Failed to write user profile response", zap.Error(err))
	}
}

// UpdateProfile updates the profile of the authenticated user.
func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, errors.NewAPIError(http.StatusUnauthorized, errors.CodeUnauthorized, "user ID not found in context", err).Error(), http.StatusUnauthorized)
		return
	}

	var req model.UpdateUserProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, "invalid request body", err).Error(), http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, err.Error(), err).Error(), http.StatusBadRequest)
		return
	}

	userProfile, err := h.service.UpdateUserProfile(r.Context(), userID, &req)
	if err != nil {
		apiErr := errors.FromError(err)
		h.log.Error("Failed to update user profile", zap.Error(apiErr.Err), zap.String("userID", userID.String()))
		http.Error(w, apiErr.Error(), apiErr.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(userProfile); err != nil {
		h.log.Error("Failed to write updated user profile response", zap.Error(err))
	}
}
