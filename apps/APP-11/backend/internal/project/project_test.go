
package project_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/internal/project"
	"ai-web-weaver/backend/pkg/errors"
	"ai-web-weaver/backend/pkg/logger"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockProjectRepository implements project.ProjectRepository
type MockProjectRepository struct {
	mock.Mock
}

func (m *MockProjectRepository) CreateProject(ctx context.Context, p *model.Project) (*model.Project, error) {
	args := m.Called(ctx, p)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Project), args.Error(1)
}
func (m *MockProjectRepository) GetProjectsByUserID(ctx context.Context, userID uuid.UUID) ([]model.Project, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]model.Project), args.Error(1)
}
func (m *MockProjectRepository) GetProjectByID(ctx context.Context, projectID uuid.UUID) (*model.Project, error) {
	args := m.Called(ctx, projectID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Project), args.Error(1)
}
func (m *MockProjectRepository) UpdateProject(ctx context.Context, p *model.Project) (*model.Project, error) {
	args := m.Called(ctx, p)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Project), args.Error(1)
}
func (m *MockProjectRepository) DeleteProject(ctx context.Context, projectID uuid.UUID) error {
	args := m.Called(ctx, projectID)
	return args.Error(0)
}

func TestProjectService_CreateProject(t *testing.T) {
	mockRepo := new(MockProjectRepository)
	testLogger := logger.NewLogger()
	projectService := project.NewProjectService(mockRepo, testLogger)

	ctx := context.Background()
	userID := uuid.New()
	req := &model.CreateProjectRequest{
		Name:            "Test Project",
		Description:     "A test project for AI Web Weaver.",
		Requirements:    []string{"Requirement 1", "Requirement 2"},
		StylePreference: model.ProjectStyleModern,
		TargetAudience:  nil,
	}

	t.Run("successful project creation", func(t *testing.T) {
		mockRepo.On("CreateProject", ctx, mock.AnythingOfType("*model.Project")).Return(func(_ context.Context, p *model.Project) *model.Project {
			p.ID = uuid.New()
			p.UserID = userID
			p.CreatedAt = time.Now()
			p.UpdatedAt = time.Now()
			p.Status = model.ProjectStatusGenerating
			return p
		}, nil).Once()

		createdProject, err := projectService.CreateProject(ctx, userID, req)

		assert.Nil(t, err)
		assert.NotNil(t, createdProject)
		assert.Equal(t, req.Name, createdProject.Name)
		assert.Equal(t, model.ProjectStatusGenerating, createdProject.Status)
		assert.Equal(t, userID, createdProject.UserID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error during creation", func(t *testing.T) {
		mockRepo.On("CreateProject", ctx, mock.AnythingOfType("*model.Project")).Return(nil, errors.NewAPIError(500, errors.CodeInternal, "db error", fmt.Errorf("db connection failed"))).Once()

		createdProject, err := projectService.CreateProject(ctx, userID, req)

		assert.Nil(t, createdProject)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeInternal))
		mockRepo.AssertExpectations(t)
	})
	mock.AssertExpectationsForObjects(t, mockRepo)
}

func TestProjectService_GetProjectsByUserID(t *testing.T) {
	mockRepo := new(MockProjectRepository)
	testLogger := logger.NewLogger()
	projectService := project.NewProjectService(mockRepo, testLogger)

	ctx := context.Background()
	userID := uuid.New()
	p1 := model.Project{
		ID:        uuid.New(),
		UserID:    userID,
		Name:      "Project A",
		Status:    model.ProjectStatusCompleted,
		CreatedAt: time.Now(),
	}
	p2 := model.Project{
		ID:        uuid.New(),
		UserID:    userID,
		Name:      "Project B",
		Status:    model.ProjectStatusDraft,
		CreatedAt: time.Now().Add(-1 * time.Hour),
	}
	mockProjects := []model.Project{p1, p2}

	t.Run("successful retrieval of projects", func(t *testing.T) {
		mockRepo.On("GetProjectsByUserID", ctx, userID).Return(mockProjects, nil).Once()

		projects, err := projectService.GetProjectsByUserID(ctx, userID)

		assert.Nil(t, err)
		assert.NotNil(t, projects)
		assert.Len(t, projects, 2)
		assert.Equal(t, mockProjects[0].Name, projects[0].Name)
		assert.Equal(t, mockProjects[1].Name, projects[1].Name)
		mockRepo.AssertExpectations(t)
	})

	t.Run("no projects found", func(t *testing.T) {
		mockRepo.On("GetProjectsByUserID", ctx, userID).Return([]model.Project{}, nil).Once()

		projects, err := projectService.GetProjectsByUserID(ctx, userID)

		assert.Nil(t, err)
		assert.NotNil(t, projects)
		assert.Len(t, projects, 0)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error during retrieval", func(t *testing.T) {
		mockRepo.On("GetProjectsByUserID", ctx, userID).Return(nil, errors.NewAPIError(500, errors.CodeInternal, "db error", fmt.Errorf("network issue"))).Once()

		projects, err := projectService.GetProjectsByUserID(ctx, userID)

		assert.Nil(t, projects)
		assert.NotNil(t, err)
		assert.True(t, errors.Is(err, errors.CodeInternal))
		mockRepo.AssertExpectations(t)
	})
	mock.AssertExpectationsForObjects(t, mockRepo)
}
