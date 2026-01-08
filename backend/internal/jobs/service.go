package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// JOB SERVICE - FILA INTERNA CONFIÁVEL
// ========================================

// JobHandler função que processa um job
type JobHandler func(ctx context.Context, job *Job) error

// JobService gerencia a fila de jobs
type JobService struct {
	db        *gorm.DB
	handlers  map[string]JobHandler
	workerID  string
	mu        sync.RWMutex
	stopChan  chan struct{}
	isRunning bool
}

// NewJobService cria nova instância do serviço
func NewJobService(db *gorm.DB) *JobService {
	return &JobService{
		db:       db,
		handlers: make(map[string]JobHandler),
		workerID: fmt.Sprintf("worker-%s", uuid.New().String()[:8]),
		stopChan: make(chan struct{}),
	}
}

// RegisterHandler registra um handler para um tipo de job
func (s *JobService) RegisterHandler(jobType string, handler JobHandler) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.handlers[jobType] = handler
	log.Printf("[Jobs] Handler registrado: %s", jobType)
}

// Enqueue adiciona um job à fila
func (s *JobService) Enqueue(jobType string, payload interface{}, opts ...JobOption) (*Job, error) {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("falha ao serializar payload: %w", err)
	}

	job := &Job{
		ID:          uuid.New(),
		Type:        jobType,
		Payload:     string(payloadJSON),
		Status:      string(JobStatusPending),
		Priority:    0,
		Attempts:    0,
		MaxAttempts: 3,
		NextRunAt:   time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Aplicar opções
	for _, opt := range opts {
		opt(job)
	}

	if err := s.db.Create(job).Error; err != nil {
		return nil, fmt.Errorf("falha ao criar job: %w", err)
	}

	log.Printf("[Jobs] Enfileirado: %s (type=%s)", job.ID, job.Type)
	return job, nil
}

// JobOption opção para configurar job
type JobOption func(*Job)

// WithPriority define prioridade do job
func WithPriority(priority int) JobOption {
	return func(j *Job) {
		j.Priority = priority
	}
}

// WithDelay define delay antes de executar
func WithDelay(delay time.Duration) JobOption {
	return func(j *Job) {
		j.NextRunAt = time.Now().Add(delay)
	}
}

// WithMaxAttempts define máximo de tentativas
func WithMaxAttempts(max int) JobOption {
	return func(j *Job) {
		j.MaxAttempts = max
	}
}

// Start inicia o worker de processamento
func (s *JobService) Start(ctx context.Context, pollInterval time.Duration) {
	s.mu.Lock()
	if s.isRunning {
		s.mu.Unlock()
		return
	}
	s.isRunning = true
	s.mu.Unlock()

	log.Printf("[Jobs] Worker iniciado: %s", s.workerID)

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("[Jobs] Worker parando: context cancelado")
			return
		case <-s.stopChan:
			log.Printf("[Jobs] Worker parando: stop signal")
			return
		case <-ticker.C:
			s.processNextJob(ctx)
		}
	}
}

// Stop para o worker
func (s *JobService) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.isRunning {
		close(s.stopChan)
		s.isRunning = false
	}
}

// processNextJob busca e processa o próximo job disponível
func (s *JobService) processNextJob(ctx context.Context) {
	job, err := s.acquireJob()
	if err != nil {
		if err != gorm.ErrRecordNotFound {
			log.Printf("[Jobs] Erro ao adquirir job: %v", err)
		}
		return
	}

	s.executeJob(ctx, job)
}

// acquireJob adquire um job para processamento (lock otimista)
func (s *JobService) acquireJob() (*Job, error) {
	var job Job
	now := time.Now()

	// Buscar job disponível e fazer lock atômico
	result := s.db.Model(&Job{}).
		Where("status IN ?", []string{string(JobStatusPending), string(JobStatusRetrying)}).
		Where("next_run_at <= ?", now).
		Where("locked_at IS NULL OR locked_at < ?", now.Add(-5*time.Minute)). // Lock expirado
		Order("priority DESC, next_run_at ASC").
		Limit(1).
		Updates(map[string]interface{}{
			"status":    string(JobStatusProcessing),
			"locked_at": now,
			"locked_by": s.workerID,
		})

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	// Buscar o job que foi lockado
	if err := s.db.Where("locked_by = ? AND status = ?", s.workerID, string(JobStatusProcessing)).
		First(&job).Error; err != nil {
		return nil, err
	}

	return &job, nil
}

// executeJob executa um job
func (s *JobService) executeJob(ctx context.Context, job *Job) {
	s.mu.RLock()
	handler, exists := s.handlers[job.Type]
	s.mu.RUnlock()

	if !exists {
		log.Printf("[Jobs] Handler não encontrado: %s", job.Type)
		s.failJob(job, "handler não registrado")
		return
	}

	// Executar com timeout
	execCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	job.Attempts++
	err := handler(execCtx, job)

	if err != nil {
		s.handleJobError(job, err)
		return
	}

	s.completeJob(job)
}

// completeJob marca job como concluído
func (s *JobService) completeJob(job *Job) {
	now := time.Now()
	s.db.Model(job).Updates(map[string]interface{}{
		"status":       string(JobStatusDone),
		"completed_at": now,
		"updated_at":   now,
		"locked_at":    nil,
		"locked_by":    "",
	})
	log.Printf("[Jobs] Concluído: %s", job.ID)
}

// handleJobError trata erro de execução
func (s *JobService) handleJobError(job *Job, err error) {
	job.LastError = err.Error()

	if job.Attempts >= job.MaxAttempts {
		s.failJob(job, err.Error())
		return
	}

	// Retry com backoff exponencial
	delay := s.calculateBackoff(job.Attempts)
	nextRun := time.Now().Add(delay)

	s.db.Model(job).Updates(map[string]interface{}{
		"status":      string(JobStatusRetrying),
		"attempts":    job.Attempts,
		"last_error":  err.Error(),
		"next_run_at": nextRun,
		"updated_at":  time.Now(),
		"locked_at":   nil,
		"locked_by":   "",
	})

	log.Printf("[Jobs] Retry agendado: %s (attempt=%d, next=%v)", job.ID, job.Attempts, nextRun)
}

// failJob move job para dead letter
func (s *JobService) failJob(job *Job, errorMsg string) {
	now := time.Now()

	// Mover para dead letter
	deadLetter := &DeadLetterJob{
		ID:            uuid.New(),
		OriginalJobID: job.ID,
		Type:          job.Type,
		Payload:       job.Payload,
		Attempts:      job.Attempts,
		LastError:     errorMsg,
		FailedAt:      now,
		CreatedAt:     now,
	}
	s.db.Create(deadLetter)

	// Marcar job como falho
	s.db.Model(job).Updates(map[string]interface{}{
		"status":     string(JobStatusFailed),
		"last_error": errorMsg,
		"updated_at": now,
		"locked_at":  nil,
		"locked_by":  "",
	})

	log.Printf("[Jobs] Falhou permanentemente: %s -> dead_letter", job.ID)
}

// calculateBackoff calcula delay com exponential backoff + jitter
func (s *JobService) calculateBackoff(attempt int) time.Duration {
	base := time.Second * 5
	maxDelay := time.Minute * 5

	// Exponential: 5s, 10s, 20s, 40s, 80s...
	delay := base * time.Duration(1<<uint(attempt-1))
	if delay > maxDelay {
		delay = maxDelay
	}

	// Jitter: ±20%
	jitter := time.Duration(float64(delay) * 0.2 * (0.5 - float64(time.Now().UnixNano()%100)/100))
	return delay + jitter
}

// GetPendingCount retorna contagem de jobs pendentes
func (s *JobService) GetPendingCount() int64 {
	var count int64
	s.db.Model(&Job{}).Where("status IN ?", []string{
		string(JobStatusPending),
		string(JobStatusRetrying),
	}).Count(&count)
	return count
}

// GetDeadLetterCount retorna contagem de dead letters
func (s *JobService) GetDeadLetterCount() int64 {
	var count int64
	s.db.Model(&DeadLetterJob{}).Count(&count)
	return count
}

// GetStats retorna estatísticas de jobs para health check
func (s *JobService) GetStats() (pending int64, failed int64, processing int64) {
	s.db.Model(&Job{}).Where("status IN ?", []string{
		string(JobStatusPending),
		string(JobStatusRetrying),
	}).Count(&pending)
	
	s.db.Model(&Job{}).Where("status = ?", string(JobStatusFailed)).Count(&failed)
	
	s.db.Model(&Job{}).Where("status = ?", string(JobStatusProcessing)).Count(&processing)
	
	return pending, failed, processing
}
