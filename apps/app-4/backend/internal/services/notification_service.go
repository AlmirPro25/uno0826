package services

import (
	"context"
	"encoding/json"
	"medisync-platform/backend/internal/adapters/repository"
	"medisync-platform/backend/internal/core/domain"
	"time"
)

// NotificationService handles notification logic
type NotificationService struct {
	repo    *repository.NotificationRepository
	chatHub *ChatHub
}

// NewNotificationService creates a new notification service
func NewNotificationService(repo *repository.NotificationRepository, chatHub *ChatHub) *NotificationService {
	return &NotificationService{
		repo:    repo,
		chatHub: chatHub,
	}
}

// CreateNotification creates a notification and pushes it to the user in real-time
func (s *NotificationService) CreateNotification(ctx context.Context, notification *domain.Notification) error {
	// Save to database
	if err := s.repo.Create(ctx, notification); err != nil {
		return err
	}

	// Push to user via WebSocket if online
	if s.chatHub != nil {
		s.pushNotificationToUser(notification)
	}

	return nil
}

// pushNotificationToUser sends notification via WebSocket
func (s *NotificationService) pushNotificationToUser(notification *domain.Notification) {
	payload := map[string]interface{}{
		"type":         "notification",
		"notification": notification,
	}
	data, _ := json.Marshal(payload)
	s.chatHub.SendToUser(uint(notification.UserID), data)
}

// GetUserNotifications gets paginated notifications for a user
func (s *NotificationService) GetUserNotifications(ctx context.Context, userID, page, pageSize int, unreadOnly bool) ([]domain.Notification, int64, error) {
	return s.repo.GetUserNotifications(ctx, userID, page, pageSize, unreadOnly)
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(ctx context.Context, notificationID, userID int) error {
	return s.repo.MarkAsRead(ctx, notificationID, userID)
}

// MarkAllAsRead marks all notifications as read for a user
func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID int) error {
	return s.repo.MarkAllAsRead(ctx, userID)
}

// GetUnreadCount gets the count of unread notifications
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID int) (int64, error) {
	return s.repo.GetUnreadCount(ctx, userID)
}

// Delete deletes a notification
func (s *NotificationService) Delete(ctx context.Context, notificationID, userID int) error {
	return s.repo.Delete(ctx, notificationID, userID)
}

// CreateAppointmentNotification creates a notification for appointment events
func (s *NotificationService) CreateAppointmentNotification(ctx context.Context, userID int, appointmentID int, notificationType string, title, message string) error {
	data, _ := json.Marshal(map[string]interface{}{
		"appointment_id": appointmentID,
	})

	notification := &domain.Notification{
		UserID:   userID,
		Title:    title,
		Message:  message,
		Type:     domain.NotificationTypeAppointment,
		Priority: domain.NotificationPriorityNormal,
		Data:     string(data),
		Link:     "/paciente/my-appointments",
	}

	return s.CreateNotification(ctx, notification)
}

// CreateMessageNotification creates a notification for new messages
func (s *NotificationService) CreateMessageNotification(ctx context.Context, userID, senderID int, senderName, messagePreview string) error {
	data, _ := json.Marshal(map[string]interface{}{
		"sender_id": senderID,
	})

	notification := &domain.Notification{
		UserID:   userID,
		Title:    "Nova mensagem de " + senderName,
		Message:  messagePreview,
		Type:     domain.NotificationTypeMessage,
		Priority: domain.NotificationPriorityNormal,
		Data:     string(data),
		Link:     "/chat",
	}

	return s.CreateNotification(ctx, notification)
}

// CreateSystemNotification creates a system notification
func (s *NotificationService) CreateSystemNotification(ctx context.Context, userID int, title, message string, priority string) error {
	notification := &domain.Notification{
		UserID:   userID,
		Title:    title,
		Message:  message,
		Type:     domain.NotificationTypeSystem,
		Priority: priority,
	}

	return s.CreateNotification(ctx, notification)
}

// CleanupOldNotifications removes notifications older than 30 days
func (s *NotificationService) CleanupOldNotifications(ctx context.Context) error {
	return s.repo.DeleteOld(ctx, 30*24*time.Hour)
}

// BroadcastNotification sends a notification to multiple users
func (s *NotificationService) BroadcastNotification(ctx context.Context, userIDs []int, title, message, notificationType string) error {
	notifications := make([]domain.Notification, len(userIDs))
	for i, userID := range userIDs {
		notifications[i] = domain.Notification{
			UserID:   userID,
			Title:    title,
			Message:  message,
			Type:     notificationType,
			Priority: domain.NotificationPriorityNormal,
		}
	}

	if err := s.repo.CreateBulk(ctx, notifications); err != nil {
		return err
	}

	// Push to all users
	if s.chatHub != nil {
		for i := range notifications {
			s.pushNotificationToUser(&notifications[i])
		}
	}

	return nil
}
