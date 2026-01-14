
package project

import (
	"context"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// ProjectService defines the interface for project management operations.
type ProjectService interface {
	CreateProject(ctx context.Context, userID uuid.UUID, req *model.CreateProjectRequest) (*model.Project, error)
	GetProjectsByUserID(ctx context.Context, userID uuid.UUID) ([]model.Project, error)
	// Additional methods for GetProjectByID, UpdateProject, DeleteProject etc. would go here.
}

// projectService implements ProjectService.
type projectService struct {
	repo ProjectRepository
	log  *logger.Logger
}

// NewProjectService creates a new ProjectService.
func NewProjectService(repo ProjectRepository, log *logger.Logger) ProjectService {
	return &projectService{
		repo: repo,
		log:  log,
	}
}

// CreateProject initiates the creation of a new web project using AI.
func (s *projectService) CreateProject(ctx context.Context, userID uuid.UUID, req *model.CreateProjectRequest) (*model.Project, error) {
	project := &model.Project{
		UserID:           userID,
		Name:             req.Name,
		Description:      req.Description,
		Requirements:     req.Requirements,
		StylePreference:  req.StylePreference,
		TargetAudience:   req.TargetAudience,
		Status:           model.ProjectStatusGenerating, // Initially set to generating
	}

	createdProject, err := s.repo.CreateProject(ctx, project)
	if err != nil {
		s.log.Error("Failed to create project in repository", zap.Error(err), zap.String("userID", userID.String()))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to create project")
	}

	s.log.Info("Project creation initiated", zap.String("projectID", createdProject.ID.String()), zap.String("userID", userID.String()))

	// TODO: Here would be the logic to trigger the actual AI generation process.
	// This could involve:
	// - Sending a message to a message queue (e.g., RabbitMQ, Kafka)
	// - Calling another internal microservice (e.g., Python AI service)
	// - Starting a goroutine for background processing (for simpler architectures)
	// For now, it's a placeholder. The status "GENERATING" indicates this.

	return createdProject, nil
}

// GetProjectsByUserID retrieves all AI-generated projects belonging to a specific user.
func (s *projectService) GetProjectsByUserID(ctx context.Context, userID uuid.UUID) ([]model.Project, error) {
	projects, err := s.repo.GetProjectsByUserID(ctx, userID)
	if err != nil {
		s.log.Error("Failed to retrieve projects by user ID", zap.Error(err), zap.String("userID", userID.String()))
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to retrieve user projects")
	}

	return projects, nil
}
