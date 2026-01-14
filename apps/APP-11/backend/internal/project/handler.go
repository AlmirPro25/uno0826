
package project

import (
	"encoding/json"
	"net/http"

	"ai-web-weaver/backend/internal/middleware"
	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/validator"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// ProjectHandler handles HTTP requests for project management.
type ProjectHandler struct {
	service   ProjectService
	validator *validator.Validator
	log       *logger.Logger
}

// NewProjectHandler creates a new ProjectHandler.
func NewProjectHandler(s ProjectService, v *validator.Validator, log *logger.Logger) *ProjectHandler {
	return &ProjectHandler{
		service:   s,
		validator: v,
		log:       log,
	}
}

// ListProjects retrieves all projects for a given user.
func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	// The userID in the path should ideally be matched with the authenticated user's ID
	// for security and preventing one user from fetching another's projects.
	// For simplicity, we assume auth middleware already ensured the request is for the authenticated user's ID
	// or that an admin role handles cross-user access.
	// Here, we'll enforce that the path userID matches the context userID for normal users.
	pathUserIDStr := chi.URLParam(r, "userID")
	pathUserID, err := uuid.Parse(pathUserIDStr)
	if err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, "invalid user ID format", err).Error(), http.StatusBadRequest)
		return
	}

	authUserID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, errors.NewAPIError(http.StatusUnauthorized, errors.CodeUnauthorized, "user ID not found in context", err).Error(), http.StatusUnauthorized)
		return
	}

	// Enforce authorization: authenticated user must match the path user ID
	if authUserID != pathUserID {
		h.log.Warn("Authorization attempt for different user's projects",
			zap.String("authUserID", authUserID.String()),
			zap.String("pathUserID", pathUserID.String()))
		http.Error(w, errors.NewAPIError(http.StatusForbidden, errors.CodeForbidden, "access to other users' projects is forbidden", nil).Error(), http.StatusForbidden)
		return
	}

	projects, err := h.service.GetProjectsByUserID(r.Context(), pathUserID)
	if err != nil {
		apiErr := errors.FromError(err)
		h.log.Error("Failed to list projects", zap.Error(apiErr.Err), zap.String("userID", pathUserID.String()))
		http.Error(w, apiErr.Error(), apiErr.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(projects); err != nil {
		h.log.Error("Failed to write project list response", zap.Error(err))
	}
}

// CreateProject handles the creation of a new AI-generated project.
func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	pathUserIDStr := chi.URLParam(r, "userID")
	pathUserID, err := uuid.Parse(pathUserIDStr)
	if err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, "invalid user ID format", err).Error(), http.StatusBadRequest)
		return
	}

	authUserID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, errors.NewAPIError(http.StatusUnauthorized, errors.CodeUnauthorized, "user ID not found in context", err).Error(), http.StatusUnauthorized)
		return
	}

	if authUserID != pathUserID {
		h.log.Warn("Authorization attempt to create project for different user",
			zap.String("authUserID", authUserID.String()),
			zap.String("pathUserID", pathUserID.String()))
		http.Error(w, errors.NewAPIError(http.StatusForbidden, errors.CodeForbidden, "cannot create projects for other users", nil).Error(), http.StatusForbidden)
		return
	}

	var req model.CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, "invalid request body", err).Error(), http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(req); err != nil {
		http.Error(w, errors.NewAPIError(http.StatusBadRequest, errors.CodeInvalidInput, err.Error(), err).Error(), http.StatusBadRequest)
		return
	}

	project, err := h.service.CreateProject(r.Context(), pathUserID, &req)
	if err != nil {
		apiErr := errors.FromError(err)
		h.log.Error("Failed to create project", zap.Error(apiErr.Err), zap.String("userID", pathUserID.String()))
		http.Error(w, apiErr.Error(), apiErr.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(project); err != nil {
		h.log.Error("Failed to write create project response", zap.Error(err))
	}
}
