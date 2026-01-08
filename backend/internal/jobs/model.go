package jobs

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// JOBS - FILA INTERNA DO KERNEL
// Processamento assíncrono confiável
// ========================================

// JobStatus representa o estado de um job
type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusDone       JobStatus = "done"
	JobStatusFailed     JobStatus = "failed"
	JobStatusRetrying   JobStatus = "retrying"
)

// JobType representa o tipo de job
type JobType string

const (
	JobTypeWebhook       JobType = "webhook"
	JobTypeStripeSync    JobType = "stripe_sync"
	JobTypeReconcile     JobType = "reconcile"
	JobTypeNotification  JobType = "notification"
)

// Job representa um trabalho na fila interna
type Job struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	Type        string    `gorm:"type:text;not null;index:idx_job_type" json:"type"`
	Payload     string    `gorm:"type:text;not null" json:"payload"`
	Status      string    `gorm:"type:text;not null;default:'pending';index:idx_job_status" json:"status"`
	Priority    int       `gorm:"default:0;index:idx_job_priority" json:"priority"`
	Attempts    int       `gorm:"default:0" json:"attempts"`
	MaxAttempts int       `gorm:"default:3" json:"max_attempts"`
	LastError   string    `gorm:"type:text" json:"last_error,omitempty"`
	NextRunAt   time.Time `gorm:"not null;index:idx_job_next_run" json:"next_run_at"`
	LockedAt    *time.Time `gorm:"index:idx_job_locked" json:"locked_at,omitempty"`
	LockedBy    string    `gorm:"type:text" json:"locked_by,omitempty"`
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

func (Job) TableName() string {
	return "jobs"
}

// WebhookPayload payload para jobs de webhook
type WebhookPayload struct {
	EventID   string `json:"event_id"`
	EventType string `json:"event_type"`
	Executor  string `json:"executor"` // stripe, pix, etc
	RawData   string `json:"raw_data"`
	Signature string `json:"signature"`
}

// DeadLetterJob jobs que falharam permanentemente
type DeadLetterJob struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	OriginalJobID uuid.UUID `gorm:"type:text;not null;index:idx_dead_original" json:"original_job_id"`
	Type         string    `gorm:"type:text;not null" json:"type"`
	Payload      string    `gorm:"type:text;not null" json:"payload"`
	Attempts     int       `gorm:"not null" json:"attempts"`
	LastError    string    `gorm:"type:text;not null" json:"last_error"`
	FailedAt     time.Time `gorm:"not null" json:"failed_at"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
}

func (DeadLetterJob) TableName() string {
	return "dead_letter_jobs"
}
