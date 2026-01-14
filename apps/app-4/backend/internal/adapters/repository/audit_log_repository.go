package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// AuditLogRepository implementation using GORM.
type AuditLogRepository struct {
	db *gorm.DB
}

// NewAuditLogRepository creates a new repository instance.
func NewAuditLogRepository(db *gorm.DB) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

// Create creates a new audit log entry.
func (repo *AuditLogRepository) Create(ctx context.Context, log *domain.AuditLog) error {
	return repo.db.WithContext(ctx).Create(log).Error
}

// FindByID retrieves an audit log by its ID.
func (repo *AuditLogRepository) FindByID(ctx context.Context, id int) (*domain.AuditLog, error) {
	var log domain.AuditLog
	result := repo.db.WithContext(ctx).
		Preload("User").
		Preload("User.Role").
		First(&log, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &log, nil
}

// ListByUserID retrieves all audit logs for a specific user.
func (repo *AuditLogRepository) ListByUserID(ctx context.Context, userID int, limit, offset int) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	repo.db.Model(&domain.AuditLog{}).Where("user_id = ?", userID).Count(&total)

	result := repo.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&logs)

	if result.Error != nil {
		return nil, 0, result.Error
	}
	return logs, total, nil
}

// ListByEntityType retrieves audit logs for a specific entity type.
func (repo *AuditLogRepository) ListByEntityType(ctx context.Context, entityType string, limit, offset int) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	repo.db.Model(&domain.AuditLog{}).Where("entity_type = ?", entityType).Count(&total)

	result := repo.db.WithContext(ctx).
		Preload("User").
		Where("entity_type = ?", entityType).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&logs)

	if result.Error != nil {
		return nil, 0, result.Error
	}
	return logs, total, nil
}

// ListByEntityID retrieves audit logs for a specific entity.
func (repo *AuditLogRepository) ListByEntityID(ctx context.Context, entityType string, entityID int) ([]domain.AuditLog, error) {
	var logs []domain.AuditLog
	result := repo.db.WithContext(ctx).
		Preload("User").
		Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("created_at desc").
		Find(&logs)

	if result.Error != nil {
		return nil, result.Error
	}
	return logs, nil
}

// ListByAction retrieves audit logs for a specific action type.
func (repo *AuditLogRepository) ListByAction(ctx context.Context, action string, limit, offset int) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	repo.db.Model(&domain.AuditLog{}).Where("action = ?", action).Count(&total)

	result := repo.db.WithContext(ctx).
		Preload("User").
		Where("action = ?", action).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&logs)

	if result.Error != nil {
		return nil, 0, result.Error
	}
	return logs, total, nil
}

// ListByDateRange retrieves audit logs within a date range.
func (repo *AuditLogRepository) ListByDateRange(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	repo.db.Model(&domain.AuditLog{}).
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Count(&total)

	result := repo.db.WithContext(ctx).
		Preload("User").
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&logs)

	if result.Error != nil {
		return nil, 0, result.Error
	}
	return logs, total, nil
}

// ListAll retrieves all audit logs with pagination.
func (repo *AuditLogRepository) ListAll(ctx context.Context, limit, offset int) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	repo.db.Model(&domain.AuditLog{}).Count(&total)

	result := repo.db.WithContext(ctx).
		Preload("User").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&logs)

	if result.Error != nil {
		return nil, 0, result.Error
	}
	return logs, total, nil
}

// DeleteOlderThan deletes audit logs older than a specified date.
func (repo *AuditLogRepository) DeleteOlderThan(ctx context.Context, date time.Time) error {
	return repo.db.WithContext(ctx).
		Where("created_at < ?", date).
		Delete(&domain.AuditLog{}).Error
}
