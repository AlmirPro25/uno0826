
package project

import (
	"context"
	"time"

	"ai-web-weaver/backend/internal/model"
	"ai-web-weaver/backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ProjectRepository defines the interface for project data operations.
type ProjectRepository interface {
	CreateProject(ctx context.Context, project *model.Project) (*model.Project, error)
	GetProjectsByUserID(ctx context.Context, userID uuid.UUID) ([]model.Project, error)
	GetProjectByID(ctx context.Context, projectID uuid.UUID) (*model.Project, error)
	UpdateProject(ctx context.Context, project *model.Project) (*model.Project, error)
	DeleteProject(ctx context.Context, projectID uuid.UUID) error
}

// postgresProjectRepository implements ProjectRepository using PostgreSQL.
type postgresProjectRepository struct {
	db *pgxpool.Pool
}

// NewPostgresProjectRepository creates a new ProjectRepository.
func NewPostgresProjectRepository(db *pgxpool.Pool) ProjectRepository {
	return &postgresProjectRepository{db: db}
}

// CreateProject inserts a new project into the database.
func (r *postgresProjectRepository) CreateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
	project.ID = uuid.New()
	project.CreatedAt = time.Now()
	project.UpdatedAt = time.Now()
	// Ensure default status if not set
	if project.Status == "" {
		project.Status = model.ProjectStatusDraft
	}
	if project.StylePreference == "" {
		project.StylePreference = model.ProjectStyleModern
	}

	query := `INSERT INTO "Project" (id, userId, name, description, requirements, stylePreference, targetAudience,
                                  generatedCodeUrl, previewImageUrl, createdAt, updatedAt, status)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              RETURNING id, userId, name, description, requirements, stylePreference, targetAudience,
                        generatedCodeUrl, previewImageUrl, createdAt, updatedAt, status`

	var createdProject model.Project
	err := r.db.QueryRow(ctx, query,
		project.ID, project.UserID, project.Name, project.Description, project.Requirements, project.StylePreference, project.TargetAudience,
		project.GeneratedCodeURL, project.PreviewImageURL, project.CreatedAt, project.UpdatedAt, project.Status,
	).Scan(
		&createdProject.ID, &createdProject.UserID, &createdProject.Name, &createdProject.Description, &createdProject.Requirements, &createdProject.StylePreference, &createdProject.TargetAudience,
		&createdProject.GeneratedCodeURL, &createdProject.PreviewImageURL, &createdProject.CreatedAt, &createdProject.UpdatedAt, &createdProject.Status,
	)
	if err != nil {
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to create project")
	}
	return &createdProject, nil
}

// GetProjectsByUserID retrieves all projects belonging to a specific user.
func (r *postgresProjectRepository) GetProjectsByUserID(ctx context.Context, userID uuid.UUID) ([]model.Project, error) {
	query := `SELECT id, userId, name, description, requirements, stylePreference, targetAudience,
                     generatedCodeUrl, previewImageUrl, createdAt, updatedAt, status
              FROM "Project" WHERE userId = $1 ORDER BY createdAt DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to query projects by user ID")
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.Name, &p.Description, &p.Requirements, &p.StylePreference, &p.TargetAudience,
			&p.GeneratedCodeURL, &p.PreviewImageURL, &p.CreatedAt, &p.UpdatedAt, &p.Status,
		); err != nil {
			return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to scan project row")
		}
		projects = append(projects, p)
	}

	if rows.Err() != nil {
		return nil, errors.Wrap(rows.Err(), 500, errors.CodeInternal, "error iterating project rows")
	}

	return projects, nil
}

// GetProjectByID retrieves a single project by its ID.
func (r *postgresProjectRepository) GetProjectByID(ctx context.Context, projectID uuid.UUID) (*model.Project, error) {
	query := `SELECT id, userId, name, description, requirements, stylePreference, targetAudience,
                     generatedCodeUrl, previewImageUrl, createdAt, updatedAt, status
              FROM "Project" WHERE id = $1`

	var p model.Project
	err := r.db.QueryRow(ctx, query, projectID).Scan(
		&p.ID, &p.UserID, &p.Name, &p.Description, &p.Requirements, &p.StylePreference, &p.TargetAudience,
		&p.GeneratedCodeURL, &p.PreviewImageURL, &p.CreatedAt, &p.UpdatedAt, &p.Status,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.NewAPIError(404, errors.CodeNotFound, "project not found", err)
		}
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to get project by ID")
	}
	return &p, nil
}

// UpdateProject updates an existing project in the database.
func (r *postgresProjectRepository) UpdateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
	project.UpdatedAt = time.Now()
	query := `UPDATE "Project" SET name=$1, description=$2, requirements=$3, stylePreference=$4, targetAudience=$5,
                                generatedCodeUrl=$6, previewImageUrl=$7, updatedAt=$8, status=$9
              WHERE id=$10 AND userId=$11
              RETURNING id, userId, name, description, requirements, stylePreference, targetAudience,
                        generatedCodeUrl, previewImageUrl, createdAt, updatedAt, status`

	var updatedProject model.Project
	err := r.db.QueryRow(ctx, query,
		project.Name, project.Description, project.Requirements, project.StylePreference, project.TargetAudience,
		project.GeneratedCodeURL, project.PreviewImageURL, project.UpdatedAt, project.Status,
		project.ID, project.UserID,
	).Scan(
		&updatedProject.ID, &updatedProject.UserID, &updatedProject.Name, &updatedProject.Description, &updatedProject.Requirements, &updatedProject.StylePreference, &updatedProject.TargetAudience,
		&updatedProject.GeneratedCodeURL, &updatedProject.PreviewImageURL, &updatedProject.CreatedAt, &updatedProject.UpdatedAt, &updatedProject.Status,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.NewAPIError(404, errors.CodeNotFound, "project not found for update or does not belong to user", err)
		}
		return nil, errors.Wrap(err, 500, errors.CodeInternal, "failed to update project")
	}
	return &updatedProject, nil
}

// DeleteProject deletes a project by its ID.
func (r *postgresProjectRepository) DeleteProject(ctx context.Context, projectID uuid.UUID) error {
	query := `DELETE FROM "Project" WHERE id = $1`
	cmdTag, err := r.db.Exec(ctx, query, projectID)
	if err != nil {
		return errors.Wrap(err, 500, errors.CodeInternal, "failed to delete project")
	}
	if cmdTag.RowsAffected() == 0 {
		return errors.NewAPIError(404, errors.CodeNotFound, "project not found for deletion", nil)
	}
	return nil
}
