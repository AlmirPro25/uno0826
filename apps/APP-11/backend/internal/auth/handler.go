
package auth

import (
	"encoding/json"
	"net/http"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/validator"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"go.uber.org/zap"
)

// AuthHandler handles HTTP requests for authentication.
type AuthHandler struct {
	service   AuthService
	validator *validator.Validator
	log       *logger.Logger
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(s AuthService, v *validator.Validator, log *logger.Logger) *AuthHandler {
	return &AuthHandler{
		service:   s,
		validator: v,
		log:       log,
	}
}

// Register handles user registration.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, "invalid request body", err).Error(), http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, err.Error(), err).Error(), http.StatusBadRequest)
		return
	}

	authResponse, err := h.service.Register(r.Context(), &req)
	if err != nil {
		apiErr := errors.FromError(err)
		h.log.Error("Failed to register user", zap.Error(apiErr.Err), zap.String("email", req.Email))
		http.Error(w, apiErr.Error(), apiErr.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(authResponse); err != nil {
		h.log.Error("Failed to write register response", zap.Error(err))
	}
}

// Login handles user login.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, "invalid request body", err).Error(), http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, err.Error(), err).Error(), http.StatusBadRequest)
		return
	}

	userAgent := r.UserAgent()
	ipAddress := r.RemoteAddr

	authResponse, err := h.service.Login(r.Context(), &req, &userAgent, &ipAddress)
	if err != nil {
		apiErr := errors.FromError(err)
		h.log.Error("Failed to login user", zap.Error(apiErr.Err), zap.String("email", req.Email))
		http.Error(w, apiErr.Error(), apiErr.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(authResponse); err != nil {
		h.log.Error("Failed to write login response", zap.Error(err))
	}
}

// Refresh handles refreshing access tokens using a refresh token.
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req model.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, "invalid request body", err).Error(), http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, err.Error(), err).Error(), http.StatusBadRequest)
		return
	}

	authResponse, err := h.service.Refresh(r.Context(), &req)
	if err != nil {
		apiErr := errors.FromError(err)
		h.log.Error("Failed to refresh tokens", zap.Error(apiErr.Err))
		http.Error(w, apiErr.Error(), apiErr.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(authResponse); err != nil {
		h.log.Error("Failed to write refresh response", zap.Error(err))
	}
}
