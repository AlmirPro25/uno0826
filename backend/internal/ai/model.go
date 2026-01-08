
package ai

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AISchemaVersion representa uma versão do schema SQLite governada pela IA.
type AISchemaVersion struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Version      int       `gorm:"uniqueIndex" json:"version"` // Versão sequencial do schema
	MigrationSQL string    `gorm:"type:text;not null" json:"migrationSql"`
	AIIntention  string    `gorm:"type:text;not null" json:"aiIntention"` // A intenção que levou à migração
	AppliedAt    time.Time `gorm:"not null" json:"appliedAt"`
	ApprovedBy   string    `gorm:"size:255" json:"approvedBy"` // Entidade que aprovou
	gorm.Model
}

// EvolveSchemaRequest representa a requisição para evoluir o schema.
type EvolveSchemaRequest struct {
	Intention string            `json:"intention" binding:"required"` // Descrição da intenção da mudança
	Context   map[string]string `json:"context"`                      // Contexto adicional para a IA
}

// EvolveSchemaResponse representa a resposta da evolução do schema.
type EvolveSchemaResponse struct {
	MigrationID   string `json:"migrationId"`
	SchemaVersion int    `json:"schemaVersion"`
	Status        string `json:"status"` // e.g., "pending_review", "applied"
	ProposedSQL   string `json:"proposedSql"`
}

// ResolveConflictRequest representa a requisição para resolver um conflito de replicação.
type ResolveConflictRequest struct {
	ConflictID       string `json:"conflictId" binding:"required"`
	ResolutionPolicy string `json:"resolutionPolicy" binding:"required"` // e.g., "last_write_wins", "manual_merge"
}

// ResolveConflictResponse representa a resposta da resolução de conflitos.
type ResolveConflictResponse struct {
	Status    string   `json:"status"`
	NewEvents []string `json:"newEvents"` // IDs dos novos eventos gerados, se houver
	Details   string   `json:"details"`
}

