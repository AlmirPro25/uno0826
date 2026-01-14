
package model

import (
	"time"

	"github.com/google/uuid"
)

// ProjectStatus defines the status of a project.
type ProjectStatus string

const (
	ProjectStatusDraft      ProjectStatus = "DRAFT"
	ProjectStatusGenerating ProjectStatus = "GENERATING"
	ProjectStatusCompleted  ProjectStatus = "COMPLETED"
	ProjectStatusError      ProjectStatus = "ERROR"
)

// ProjectStyle defines the style preference for a project.
type ProjectStyle string

const (
	ProjectStyleModern    ProjectStyle = "MODERN"
	ProjectStyleMinimalist ProjectStyle = "MINIMALIST"
	ProjectStyleCorporate ProjectStyle = "CORPORATE"
	ProjectStylePlayful   ProjectStyle = "PLAYFUL"
	ProjectStyleVintage   ProjectStyle = "VINTAGE"
	ProjectStyleCustom    ProjectStyle = "CUSTOM"
)

// Project represents the Project model.
type Project struct {
	ID               uuid.UUID     `json:"id"`
	UserID           uuid.UUID     `json:"userId"`
	Name             string        `json:"name"`
	Description      string        `json:"description"`
	Requirements     []string      `json:"requirements"` // Stored as array in DB
	StylePreference  ProjectStyle  `json:"stylePreference"`
	TargetAudience   *string       `json:"targetAudience,omitempty"`
	GeneratedCodeURL *string       `json:"generatedCodeUrl,omitempty"`
	PreviewImageURL  *string       `json:"previewImageUrl,omitempty"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
	Status           ProjectStatus `json:"status"`
}

// CreateProjectRequest represents the request body for creating a new project.
type CreateProjectRequest struct {
	Name            string       `json:"name" validate:"required,min=3,max=200"`
	Description     string       `json:"description" validate:"required,min=10,max=1000"`
	Requirements    []string     `json:"requirements" validate:"required,min=1,dive,min=3"` // At least one requirement
	StylePreference ProjectStyle `json:"stylePreference" validate:"omitempty,oneof=MODERN MINIMALIST CORPORATE PLAYFUL VINTAGE CUSTOM"`
	TargetAudience  *string      `json:"targetAudience,omitempty" validate:"omitempty,min=5,max=200"`
}
