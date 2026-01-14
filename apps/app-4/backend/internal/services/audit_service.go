package services

import (
	"context"
	"encoding/json"
	"log"
	"medisync-platform/backend/internal/core/domain"
	"time"
)

// AuditRepository interface for the service.
type AuditRepository interface {
	Create(ctx context.Context, log *domain.AuditLog) error
	FindByID(ctx context.Context, id int) (*domain.AuditLog, error)
	ListByUserID(ctx context.Context, userID int, limit, offset int) ([]domain.AuditLog, int64, error)
	ListByEntityType(ctx context.Context, entityType string, limit, offset int) ([]domain.AuditLog, int64, error)
	ListByEntityID(ctx context.Context, entityType string, entityID int) ([]domain.AuditLog, error)
	ListByAction(ctx context.Context, action string, limit, offset int) ([]domain.AuditLog, int64, error)
	ListByDateRange(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]domain.AuditLog, int64, error)
	ListAll(ctx context.Context, limit, offset int) ([]domain.AuditLog, int64, error)
	DeleteOlderThan(ctx context.Context, date time.Time) error
}

// AuditService handles audit logging business logic.
type AuditService struct {
	repo AuditRepository
}

// NewAuditService creates a new instance of AuditService.
func NewAuditService(repo AuditRepository) *AuditService {
	return &AuditService{repo: repo}
}

// LogAction creates a new audit log entry.
func (s *AuditService) LogAction(ctx context.Context, userID int, action, entityType string, entityID int, details map[string]interface{}, ipAddress, userAgent string) {
	detailsJSON := ""
	if details != nil {
		if jsonBytes, err := json.Marshal(details); err == nil {
			detailsJSON = string(jsonBytes)
		}
	}

	auditLog := &domain.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Details:    detailsJSON,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
	}

	if err := s.repo.Create(ctx, auditLog); err != nil {
		log.Printf("Failed to create audit log: %v", err)
	}
}

// LogActionAsync creates a new audit log entry asynchronously.
func (s *AuditService) LogActionAsync(userID int, action, entityType string, entityID int, details map[string]interface{}, ipAddress, userAgent string) {
	go func() {
		ctx := context.Background()
		s.LogAction(ctx, userID, action, entityType, entityID, details, ipAddress, userAgent)
	}()
}

// GetAuditLog retrieves an audit log by ID.
func (s *AuditService) GetAuditLog(ctx context.Context, id int) (*domain.AuditLog, error) {
	return s.repo.FindByID(ctx, id)
}

// GetUserAuditLogs retrieves audit logs for a specific user.
func (s *AuditService) GetUserAuditLogs(ctx context.Context, userID int, limit, offset int) ([]domain.AuditLog, int64, error) {
	return s.repo.ListByUserID(ctx, userID, limit, offset)
}

// GetEntityAuditLogs retrieves audit logs for a specific entity.
func (s *AuditService) GetEntityAuditLogs(ctx context.Context, entityType string, entityID int) ([]domain.AuditLog, error) {
	return s.repo.ListByEntityID(ctx, entityType, entityID)
}

// GetAuditLogsByAction retrieves audit logs for a specific action.
func (s *AuditService) GetAuditLogsByAction(ctx context.Context, action string, limit, offset int) ([]domain.AuditLog, int64, error) {
	return s.repo.ListByAction(ctx, action, limit, offset)
}

// GetAuditLogsByDateRange retrieves audit logs within a date range.
func (s *AuditService) GetAuditLogsByDateRange(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]domain.AuditLog, int64, error) {
	return s.repo.ListByDateRange(ctx, startDate, endDate, limit, offset)
}

// GetAllAuditLogs retrieves all audit logs with pagination.
func (s *AuditService) GetAllAuditLogs(ctx context.Context, limit, offset int) ([]domain.AuditLog, int64, error) {
	return s.repo.ListAll(ctx, limit, offset)
}

// CleanupOldLogs deletes audit logs older than a specified number of days.
func (s *AuditService) CleanupOldLogs(ctx context.Context, daysToKeep int) error {
	cutoffDate := time.Now().AddDate(0, 0, -daysToKeep)
	return s.repo.DeleteOlderThan(ctx, cutoffDate)
}
