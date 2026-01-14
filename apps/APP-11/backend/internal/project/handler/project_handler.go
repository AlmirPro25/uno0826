
package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"ai-web-weaver/backend/internal/errors"
	"ai-web-weaver/backend/internal/middleware"
	"ai-web-weaver/backend/internal/project/model"
	"ai-web-weaver/backend/internal/project/service"
	"ai-web-weaver/backend/internal/user/model" // For UserModel.User context in Auth
)

// ProjectHandler handles HTTP requests related to projects.
type ProjectHandler struct {
	projectService service.ProjectService
	logger         *zap.Logger
	validate       *validator.Validate
}

// NewProjectHandler creates a new ProjectHandler.
func NewProjectHandler(ps service.ProjectService, logger *zap.Logger) *ProjectHandler {
	return &ProjectHandler{
		projectService: ps,
		logger:         logger,
		validate:       validator.New(),
	}
}

// RegisterRoutes registers project related routes to the router.
func (h *ProjectHandler) RegisterRoutes(r chi.Router, authMiddleware func(http.Handler) http.Handler) {
	r.Route("/users/{userID}/projects", func(r chi.Router) {
		r.Use(authMiddleware) // Protect these routes
		r.Post("/", h.CreateProject)
		r.Get("/", h.ListProjects)

		r.Route("/{projectID}", func(r chi.Router) {
			r.Get("/", h.GetProjectByID)
			r.Put("/", h.UpdateProject) // Or PATCH, depending on full vs partial update semantics
			r.Patch("/", h.UpdateProject) // Added PATCH for partial updates
			r.Delete("/", h.DeleteProject)
		})
	})
}

// CreateProjectRequest defines the structure for creating a new project.
type CreateProjectRequest struct {
	Name            string            `json:"name" validate:"required,min=3,max=200"`
	Description     string            `json:"description" validate:"required,min=10,max=1000"`
	Requirements    []string          `json:"requirements" validate:"required,min=1,dive,min=3"`
	StylePreference model.ProjectStyle `json:"stylePreference" validate:"omitempty,oneof=MODERN MINIMALIST CORPORATE PLAYFUL VINTAGE CUSTOM"`
	TargetAudience  string            `json:"targetAudience" validate:"omitempty,min=5,max=200"`
}

// UpdateProjectRequest defines the structure for updating an existing project.
type UpdateProjectRequest struct {
	Name            *string            `json:"name,omitempty" validate:"omitempty,min=3,max=200"`
	Description     *string            `json:"description,omitempty" validate:"omitempty,min=10,max=1000"`
	Requirements    *[]string          `json:"requirements,omitempty" validate:"omitempty,min=1,dive,min=3"`
	StylePreference *model.ProjectStyle `json:"stylePreference,omitempty" validate:"omitempty,oneof=MODERN MINIMALIST CORPORATE PLAYFUL VINTAGE CUSTOM"`
	TargetAudience  *string            `json:"targetAudience,omitempty" validate:"omitempty,min=5,max=200"`
	Status          *model.ProjectStatus `json:"status,omitempty" validate:"omitempty,oneof=DRAFT GENERATING COMPLETED ERROR"`
	GeneratedCodeURL *string            `json:"generatedCodeUrl,omitempty" validate:"omitempty,url"`
	PreviewImageURL  *string            `json:"previewImageUrl,omitempty" validate:"omitempty,url"`
}

// CreateProject handles the creation of a new project.
func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	ctxUser, ok := r.Context().Value(middleware.UserContextKey).(*userModel.User)
	if !ok || ctxUser == nil {
		errors.RespondWithError(w, r, errors.NewUnauthorizedError("missing user context"), http.StatusUnauthorized)
		return
	}

	userIDParam := chi.URLParam(r, "userID")
	if userIDParam != ctxUser.ID.String() {
		errors.RespondWithError(w, r, errors.NewForbiddenError("cannot create project for another user"), http.StatusForbidden)
		return
	}

	var req CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.RespondWithError(w, r, errors.NewInvalidInputError("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(req); err != nil {
		errors.RespondWithError(w, r, errors.NewInvalidInputError(err.Error()), http.StatusBadRequest)
		return
	}

	newProject, err := h.projectService.CreateProject(r.Context(), ctxUser.ID, req.Name, req.Description, req.Requirements, req.StylePreference, req.TargetAudience)
	if err != nil {
		errors.RespondWithError(w, r, err, http.StatusInternalServerError) // Service will return specific error types
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newProject)
}

// ListProjects handles listing all projects for a user.
func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	ctxUser, ok := r.Context().Value(middleware.UserContextKey).(*userModel.User)
	if !ok || ctxUser == nil {
		errors.RespondWithError(w, r, errors.NewUnauthorizedError("missing user context"), http.StatusUnauthorized)
		return
	}

	userIDParam := chi.URLParam(r, "userID")
	if userIDParam != ctxUser.ID.String() {
		errors.RespondWithError(w, r, errors.NewForbiddenError("cannot list projects for another user"), http.StatusForbidden)
		return
	}

	projects, err := h.projectService.ListProjects(r.Context(), ctxUser.ID)
	if err != nil {
		errors.RespondWithError(w, r, err, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(projects)
}

// GetProjectByID handles fetching a single project by ID.
func (h *ProjectHandler) GetProjectByID(w http.ResponseWriter, r *http.Request) {
	ctxUser, ok := r.Context().Value(middleware.UserContextKey).(*userModel.User)
	if !ok || ctxUser == nil {
		errors.RespondWithError(w, r, errors.NewUnauthorizedError("missing user context"), http.StatusUnauthorized)
		return
	}

	userIDParam := chi.URLParam(r, "userID")
	if userIDParam != ctxUser.ID.String() {
		errors.RespondWithError(w, r, errors.NewForbiddenError("cannot access project of another user"), http.StatusForbidden)
		return
	}

	projectIDStr := chi.URLParam(r, "projectID")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		errors.RespondWithError(w, r, errors.NewInvalidInputError("invalid project ID format"), http.StatusBadRequest)
		return
	}

	project, err := h.projectService.GetProjectByID(r.Context(), ctxUser.ID, projectID)
	if err != nil {
		errors.RespondWithError(w, r, err, http.StatusNotFound) // Service will return NotFound if not found
		return
	}

	json.NewEncoder(w).Encode(project)
}

// UpdateProject handles updating an existing project.
func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	ctxUser, ok := r.Context().Value(middleware.UserContextKey).(*userModel.User)
	if !ok || ctxUser == nil {
		errors.RespondWithError(w, r, errors.NewUnauthorizedError("missing user context"), http.StatusUnauthorized)
		return
	}

	userIDParam := chi.URLParam(r, "userID")
	if userIDParam != ctxUser.ID.String() {
		errors.RespondWithError(w, r, errors.NewForbiddenError("cannot update project for another user"), http.StatusForbidden)
		return
	}

	projectIDStr := chi.URLParam(r, "projectID")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		errors.RespondWithError(w, r, errors.NewInvalidInputError("invalid project ID format"), http.StatusBadRequest)
		return
	}

	var req UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.RespondWithError(w, r, errors.NewInvalidInputError("invalid request body"), http.StatusBadRequest)
		return
	}

	if err := h.validate.Struct(req); err != nil {
		errors.RespondWithError(w, r, errors.NewInvalidInputError(err.Error()), http.StatusBadRequest)
		return
	}

	updatedProject, err := h.projectService.UpdateProject(r.Context(), ctxUser.ID, projectID, req.Name, req.Description, req.Requirements, req.StylePreference, req.TargetAudience, req.Status, req.GeneratedCodeURL, req.PreviewImageURL)
	if err != nil {
		errors.RespondWithError(w, r, err, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(updatedProject)
}

// DeleteProject handles deleting a project.
func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	ctxUser, ok := r.Context().Value(middleware.UserContextKey).(*userModel.User)
	if !ok || ctxUser == nil {
		errors.RespondWithError(w, r, errors.NewUnauthorizedError("missing user context"), http.StatusUnauthorized)
		return
	}

	userIDParam := chi.URLParam(r, "userID")
	if userIDParam != ctxUser.ID.String() {
		errors.RespondWithError(w, r, errors.NewForbiddenError("cannot delete project for another user"), http.StatusForbidden)
		return
	}

	projectIDStr := chi.URLParam(r, "projectID")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		errors.RespondWithError(w, r, errors.NewInvalidInputError("invalid project ID format"), http.StatusBadRequest)
		return
	}

	err = h.projectService.DeleteProject(r.Context(), ctxUser.ID, projectID)
	if err != nil {
		errors.RespondWithError(w, r, err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
