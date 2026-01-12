package jobs

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupJobsTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&Job{}, &DeadLetterJob{})
	require.NoError(t, err)

	return db
}

// ========================================
// ENQUEUE TESTS
// ========================================

func TestEnqueue(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	payload := map[string]string{"key": "value"}
	job, err := service.Enqueue("test_job", payload)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, job.ID)
	assert.Equal(t, "test_job", job.Type)
	assert.Equal(t, string(JobStatusPending), job.Status)
	assert.Equal(t, 0, job.Attempts)
	assert.Equal(t, 3, job.MaxAttempts)
}


func TestEnqueue_WithPriority(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	job, err := service.Enqueue("test_job", nil, WithPriority(10))
	require.NoError(t, err)
	assert.Equal(t, 10, job.Priority)
}

func TestEnqueue_WithDelay(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	delay := 1 * time.Hour
	job, err := service.Enqueue("test_job", nil, WithDelay(delay))
	require.NoError(t, err)
	assert.True(t, job.NextRunAt.After(time.Now().Add(55*time.Minute)))
}

func TestEnqueue_WithMaxAttempts(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	job, err := service.Enqueue("test_job", nil, WithMaxAttempts(5))
	require.NoError(t, err)
	assert.Equal(t, 5, job.MaxAttempts)
}

// ========================================
// HANDLER TESTS
// ========================================

func TestRegisterHandler(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	handler := func(ctx context.Context, job *Job) error {
		return nil
	}

	service.RegisterHandler("test_job", handler)

	// Verificar que handler foi registrado
	service.mu.RLock()
	_, exists := service.handlers["test_job"]
	service.mu.RUnlock()
	assert.True(t, exists)
}

// ========================================
// STATS TESTS
// ========================================

func TestGetPendingCount(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	// Criar jobs pendentes
	for i := 0; i < 3; i++ {
		_, err := service.Enqueue("test_job", nil)
		require.NoError(t, err)
	}

	count := service.GetPendingCount()
	assert.Equal(t, int64(3), count)
}

func TestGetDeadLetterCount(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	// Criar dead letter jobs diretamente
	for i := 0; i < 2; i++ {
		deadLetter := &DeadLetterJob{
			ID:            uuid.New(),
			OriginalJobID: uuid.New(),
			Type:          "test_job",
			Payload:       "{}",
			Attempts:      3,
			LastError:     "test error",
			FailedAt:      time.Now(),
			CreatedAt:     time.Now(),
		}
		db.Create(deadLetter)
	}

	count := service.GetDeadLetterCount()
	assert.Equal(t, int64(2), count)
}

func TestGetStats(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	// Criar jobs com diferentes status
	job1 := &Job{
		ID:        uuid.New(),
		Type:      "test",
		Payload:   "{}",
		Status:    string(JobStatusPending),
		NextRunAt: time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	db.Create(job1)

	job2 := &Job{
		ID:        uuid.New(),
		Type:      "test",
		Payload:   "{}",
		Status:    string(JobStatusFailed),
		NextRunAt: time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	db.Create(job2)

	job3 := &Job{
		ID:        uuid.New(),
		Type:      "test",
		Payload:   "{}",
		Status:    string(JobStatusProcessing),
		NextRunAt: time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	db.Create(job3)

	pending, failed, processing := service.GetStats()
	assert.Equal(t, int64(1), pending)
	assert.Equal(t, int64(1), failed)
	assert.Equal(t, int64(1), processing)
}

// ========================================
// BACKOFF TESTS
// ========================================

func TestCalculateBackoff(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	// Primeiro retry
	delay1 := service.calculateBackoff(1)
	assert.True(t, delay1 >= 4*time.Second && delay1 <= 6*time.Second)

	// Segundo retry
	delay2 := service.calculateBackoff(2)
	assert.True(t, delay2 >= 8*time.Second && delay2 <= 12*time.Second)

	// Terceiro retry
	delay3 := service.calculateBackoff(3)
	assert.True(t, delay3 >= 16*time.Second && delay3 <= 24*time.Second)
}

// ========================================
// JOB EXECUTION TESTS
// ========================================

func TestCompleteJob(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	job := &Job{
		ID:        uuid.New(),
		Type:      "test",
		Payload:   "{}",
		Status:    string(JobStatusProcessing),
		NextRunAt: time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	db.Create(job)

	service.completeJob(job)

	var updated Job
	db.First(&updated, "id = ?", job.ID)
	assert.Equal(t, string(JobStatusDone), updated.Status)
	assert.NotNil(t, updated.CompletedAt)
}

func TestFailJob(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	job := &Job{
		ID:        uuid.New(),
		Type:      "test",
		Payload:   "{}",
		Status:    string(JobStatusProcessing),
		Attempts:  3,
		NextRunAt: time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	db.Create(job)

	service.failJob(job, "permanent error")

	// Verificar job marcado como falho
	var updated Job
	db.First(&updated, "id = ?", job.ID)
	assert.Equal(t, string(JobStatusFailed), updated.Status)

	// Verificar dead letter criado
	var deadLetter DeadLetterJob
	err := db.Where("original_job_id = ?", job.ID).First(&deadLetter).Error
	require.NoError(t, err)
	assert.Equal(t, "permanent error", deadLetter.LastError)
}

func TestHandleJobError_Retry(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	job := &Job{
		ID:          uuid.New(),
		Type:        "test",
		Payload:     "{}",
		Status:      string(JobStatusProcessing),
		Attempts:    1,
		MaxAttempts: 3,
		NextRunAt:   time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	db.Create(job)

	service.handleJobError(job, errors.New("temporary error"))

	var updated Job
	db.First(&updated, "id = ?", job.ID)
	assert.Equal(t, string(JobStatusRetrying), updated.Status)
	assert.Equal(t, "temporary error", updated.LastError)
	assert.True(t, updated.NextRunAt.After(time.Now()))
}

func TestHandleJobError_MaxAttempts(t *testing.T) {
	db := setupJobsTestDB(t)
	service := NewJobService(db)

	job := &Job{
		ID:          uuid.New(),
		Type:        "test",
		Payload:     "{}",
		Status:      string(JobStatusProcessing),
		Attempts:    3,
		MaxAttempts: 3,
		NextRunAt:   time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	db.Create(job)

	service.handleJobError(job, errors.New("final error"))

	var updated Job
	db.First(&updated, "id = ?", job.ID)
	assert.Equal(t, string(JobStatusFailed), updated.Status)
}

// ========================================
// MODEL TESTS
// ========================================

func TestJobStatus_Constants(t *testing.T) {
	assert.Equal(t, JobStatus("pending"), JobStatusPending)
	assert.Equal(t, JobStatus("processing"), JobStatusProcessing)
	assert.Equal(t, JobStatus("done"), JobStatusDone)
	assert.Equal(t, JobStatus("failed"), JobStatusFailed)
	assert.Equal(t, JobStatus("retrying"), JobStatusRetrying)
}

func TestJobType_Constants(t *testing.T) {
	assert.Equal(t, JobType("webhook"), JobTypeWebhook)
	assert.Equal(t, JobType("stripe_sync"), JobTypeStripeSync)
	assert.Equal(t, JobType("reconcile"), JobTypeReconcile)
	assert.Equal(t, JobType("notification"), JobTypeNotification)
}
