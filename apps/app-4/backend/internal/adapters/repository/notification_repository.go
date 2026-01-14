package repository

import (
	"context"
	"medisync-platform/backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

// NotificationRepository handles notification persistence
type NotificationRepository struct {
	db *gorm.DB
}

// NewNotificationRepository creates a new repository instance
func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create creates a new notification
func (repo *NotificationRepository) Create(ctx context.Context, notification *domain.Notification) error {
	return repo.db.WithContext(ctx).Create(notification).Error
}

// GetByID retrieves a notification by ID
func (repo *NotificationRepository) GetByID(ctx context.Context, id int) (*domain.Notification, error) {
	var notification domain.Notification
	result := repo.db.WithContext(ctx).First(&notification, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &notification, nil
}

// GetUserNotifications gets notifications for a user with pagination
func (repo *NotificationRepository) GetUserNotifications(ctx context.Context, userID, page, pageSize int, unreadOnly bool) ([]domain.Notification, int64, error) {
	var notifications []domain.Notification
	var total int64

	query := repo.db.WithContext(ctx).Model(&domain.Notification{}).
		Where("user_id = ?", userID)

	if unreadOnly {
		query = query.Where("read = ?", false)
	}

	// Count total
	query.Count(&total)

	// Get paginated results (newest first)
	offset := (page - 1) * pageSize
	result := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&notifications)

	if result.Error != nil {
		return nil, 0, result.Error
	}

	return notifications, total, nil
}

// MarkAsRead marks a notification as read
func (repo *NotificationRepository) MarkAsRead(ctx context.Context, id, userID int) error {
	now := time.Now()
	return repo.db.WithContext(ctx).
		Model(&domain.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"read":    true,
			"read_at": now,
		}).Error
}

// MarkAllAsRead marks all notifications as read for a user
func (repo *NotificationRepository) MarkAllAsRead(ctx context.Context, userID int) error {
	now := time.Now()
	return repo.db.WithContext(ctx).
		Model(&domain.Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Updates(map[string]interface{}{
			"read":    true,
			"read_at": now,
		}).Error
}

// GetUnreadCount gets the count of unread notifications for a user
func (repo *NotificationRepository) GetUnreadCount(ctx context.Context, userID int) (int64, error) {
	var count int64
	result := repo.db.WithContext(ctx).
		Model(&domain.Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Count(&count)
	return count, result.Error
}

// Delete deletes a notification
func (repo *NotificationRepository) Delete(ctx context.Context, id, userID int) error {
	return repo.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&domain.Notification{}).Error
}

// DeleteOld deletes notifications older than a specified duration
func (repo *NotificationRepository) DeleteOld(ctx context.Context, olderThan time.Duration) error {
	return repo.db.WithContext(ctx).
		Where("created_at < ?", time.Now().Add(-olderThan)).
		Delete(&domain.Notification{}).Error
}

// CreateBulk creates multiple notifications at once
func (repo *NotificationRepository) CreateBulk(ctx context.Context, notifications []domain.Notification) error {
	return repo.db.WithContext(ctx).Create(&notifications).Error
}
