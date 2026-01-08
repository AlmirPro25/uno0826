package financial

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// IDEMPOTENCY SERVICE
// Fase 27.2.1 - "Webhook duplicado NUNCA duplica dinheiro"
// ========================================

// ProcessedWebhook registra webhooks já processados
// UNIQUE constraint em (provider, external_event_id) garante idempotência
type ProcessedWebhook struct {
	ID              uuid.UUID  `gorm:"type:text;primaryKey" json:"id"`
	Provider        string     `gorm:"type:text;not null;index:idx_processed_webhook_unique,unique" json:"provider"`
	ExternalEventID string     `gorm:"type:text;not null;index:idx_processed_webhook_unique,unique" json:"external_event_id"`
	AppID           uuid.UUID  `gorm:"type:text;not null;index" json:"app_id"`
	EventType       string     `gorm:"type:text" json:"event_type"`
	PayloadHash     string     `gorm:"type:text" json:"payload_hash"`
	Status          string     `gorm:"type:text;not null;default:'processing'" json:"status"` // processing, processed, failed
	FinancialEventID *uuid.UUID `gorm:"type:text" json:"financial_event_id,omitempty"`
	ReceivedAt      time.Time  `gorm:"not null" json:"received_at"`
	ProcessedAt     *time.Time `json:"processed_at,omitempty"`
	ErrorMessage    string     `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt       time.Time  `gorm:"not null" json:"created_at"`
}

func (ProcessedWebhook) TableName() string {
	return "processed_webhooks"
}

// IdempotencyService gerencia verificação de duplicatas
type IdempotencyService struct {
	db *gorm.DB
}

func NewIdempotencyService(db *gorm.DB) *IdempotencyService {
	return &IdempotencyService{db: db}
}

// IdempotencyResult resultado da verificação
type IdempotencyResult struct {
	IsDuplicate      bool
	ProcessedWebhook *ProcessedWebhook
}

// CheckAndReserve verifica se webhook já foi processado e reserva slot
// Retorna:
// - IsDuplicate=true se já existe (não processar)
// - IsDuplicate=false se é novo (pode processar)
func (s *IdempotencyService) CheckAndReserve(provider, externalEventID string, appID uuid.UUID, eventType string, payload []byte) (*IdempotencyResult, error) {
	// Calcular hash do payload
	hash := sha256.Sum256(payload)
	payloadHash := hex.EncodeToString(hash[:])

	// Tentar inserir registro
	record := ProcessedWebhook{
		ID:              uuid.New(),
		Provider:        provider,
		ExternalEventID: externalEventID,
		AppID:           appID,
		EventType:       eventType,
		PayloadHash:     payloadHash,
		Status:          "processing",
		ReceivedAt:      time.Now(),
		CreatedAt:       time.Now(),
	}

	// INSERT com ON CONFLICT DO NOTHING (SQLite) ou similar
	result := s.db.Create(&record)
	
	if result.Error != nil {
		// Verificar se é erro de unique constraint
		if isUniqueConstraintError(result.Error) {
			// Buscar registro existente
			var existing ProcessedWebhook
			if err := s.db.Where("provider = ? AND external_event_id = ?", provider, externalEventID).First(&existing).Error; err != nil {
				return nil, err
			}
			return &IdempotencyResult{
				IsDuplicate:      true,
				ProcessedWebhook: &existing,
			}, nil
		}
		return nil, result.Error
	}

	return &IdempotencyResult{
		IsDuplicate:      false,
		ProcessedWebhook: &record,
	}, nil
}

// MarkProcessed marca webhook como processado com sucesso
func (s *IdempotencyService) MarkProcessed(id uuid.UUID, financialEventID uuid.UUID) error {
	now := time.Now()
	return s.db.Model(&ProcessedWebhook{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":             "processed",
			"financial_event_id": financialEventID,
			"processed_at":       &now,
		}).Error
}

// MarkFailed marca webhook como falho
func (s *IdempotencyService) MarkFailed(id uuid.UUID, errorMsg string) error {
	now := time.Now()
	return s.db.Model(&ProcessedWebhook{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":        "failed",
			"error_message": errorMsg,
			"processed_at":  &now,
		}).Error
}

// GetByExternalID busca registro por external_event_id
func (s *IdempotencyService) GetByExternalID(provider, externalEventID string) (*ProcessedWebhook, error) {
	var record ProcessedWebhook
	if err := s.db.Where("provider = ? AND external_event_id = ?", provider, externalEventID).First(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

// GetStats retorna estatísticas de processamento
func (s *IdempotencyService) GetStats(since time.Time) (map[string]int64, error) {
	type Result struct {
		Status string
		Count  int64
	}
	var results []Result

	err := s.db.Model(&ProcessedWebhook{}).
		Where("created_at >= ?", since).
		Select("status, count(*) as count").
		Group("status").
		Scan(&results).Error

	stats := map[string]int64{
		"processing": 0,
		"processed":  0,
		"failed":     0,
		"total":      0,
	}
	for _, r := range results {
		stats[r.Status] = r.Count
		stats["total"] += r.Count
	}
	return stats, err
}

// CleanupOld remove registros antigos (opcional, para manutenção)
func (s *IdempotencyService) CleanupOld(olderThan time.Duration) (int64, error) {
	cutoff := time.Now().Add(-olderThan)
	result := s.db.Where("created_at < ? AND status = ?", cutoff, "processed").Delete(&ProcessedWebhook{})
	return result.RowsAffected, result.Error
}

// isUniqueConstraintError verifica se erro é de unique constraint
func isUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	// SQLite
	if contains(errStr, "UNIQUE constraint failed") {
		return true
	}
	// PostgreSQL
	if contains(errStr, "duplicate key value violates unique constraint") {
		return true
	}
	// MySQL
	if contains(errStr, "Duplicate entry") {
		return true
	}
	return false
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// ========================================
// IDEMPOTENT EVENT CREATION
// ========================================

// CreateEventIdempotent cria evento com garantia de idempotência
func (s *FinancialEventService) CreateEventIdempotent(idempotencyService *IdempotencyService, input CreateEventInput, rawPayload []byte) (*FinancialEvent, error) {
	// 1. Verificar idempotência ANTES de qualquer write
	result, err := idempotencyService.CheckAndReserve(
		input.Provider,
		input.ExternalID,
		input.AppID,
		string(input.Type),
		rawPayload,
	)
	if err != nil {
		return nil, err
	}

	// 2. Se duplicado, retornar evento existente
	if result.IsDuplicate {
		if result.ProcessedWebhook.FinancialEventID != nil {
			event, err := s.GetEvent(*result.ProcessedWebhook.FinancialEventID)
			if err == nil {
				return event, errors.New("evento duplicado")
			}
		}
		return nil, errors.New("evento duplicado")
	}

	// 3. Criar evento financeiro
	event, err := s.CreateEvent(input)
	if err != nil {
		// Marcar como falho
		idempotencyService.MarkFailed(result.ProcessedWebhook.ID, err.Error())
		return nil, err
	}

	// 4. Marcar como processado
	idempotencyService.MarkProcessed(result.ProcessedWebhook.ID, event.ID)

	return event, nil
}
