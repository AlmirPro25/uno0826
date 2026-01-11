package notification

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationService struct {
	db *gorm.DB
}

func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{db: db}
}

// CreateNotification cria uma nova notificação
func (s *NotificationService) CreateNotification(appID uuid.UUID, userID *uuid.UUID, notifType NotificationType, title, message string, severity string, data map[string]interface{}) (*Notification, error) {
	dataJSON := "{}"
	if data != nil {
		if b, err := json.Marshal(data); err == nil {
			dataJSON = string(b)
		}
	}

	notification := Notification{
		ID:        uuid.New(),
		AppID:     appID,
		UserID:    userID,
		Type:      notifType,
		Channel:   ChannelInApp,
		Title:     title,
		Message:   message,
		Data:      dataJSON,
		Severity:  severity,
		CreatedAt: time.Now(),
	}

	if err := s.db.Create(&notification).Error; err != nil {
		return nil, err
	}

	log.Printf("📬 Notificação criada: %s - %s", notifType, title)
	return &notification, nil
}

// GetUnreadByUser retorna notificações não lidas de um usuário
func (s *NotificationService) GetUnreadByUser(userID uuid.UUID, limit int) ([]Notification, error) {
	var notifications []Notification
	err := s.db.Where("user_id = ? AND read = ?", userID, false).
		Order("created_at DESC").
		Limit(limit).
		Find(&notifications).Error
	return notifications, err
}

// GetByApp retorna notificações de um app
func (s *NotificationService) GetByApp(appID uuid.UUID, limit int) ([]Notification, error) {
	var notifications []Notification
	err := s.db.Where("app_id = ?", appID).
		Order("created_at DESC").
		Limit(limit).
		Find(&notifications).Error
	return notifications, err
}

// MarkAsRead marca notificação como lida
func (s *NotificationService) MarkAsRead(id uuid.UUID) error {
	now := time.Now()
	return s.db.Model(&Notification{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"read":    true,
			"read_at": now,
		}).Error
}

// MarkAllAsRead marca todas notificações de um usuário como lidas
func (s *NotificationService) MarkAllAsRead(userID uuid.UUID) error {
	now := time.Now()
	return s.db.Model(&Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Updates(map[string]interface{}{
			"read":    true,
			"read_at": now,
		}).Error
}

// GetUnreadCount retorna contagem de não lidas
func (s *NotificationService) GetUnreadCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := s.db.Model(&Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Count(&count).Error
	return count, err
}

// GetPreferences retorna preferências de notificação
func (s *NotificationService) GetPreferences(userID uuid.UUID) ([]NotificationPreference, error) {
	var prefs []NotificationPreference
	err := s.db.Where("user_id = ?", userID).Find(&prefs).Error
	return prefs, err
}

// UpdatePreference atualiza preferência de notificação
func (s *NotificationService) UpdatePreference(userID uuid.UUID, notifType NotificationType, email, inApp, webhook bool) error {
	pref := NotificationPreference{
		ID:        uuid.New(),
		UserID:    userID,
		Type:      notifType,
		Email:     email,
		InApp:     inApp,
		Webhook:   webhook,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return s.db.Where("user_id = ? AND type = ?", userID, notifType).
		Assign(map[string]interface{}{
			"email":      email,
			"in_app":     inApp,
			"webhook":    webhook,
			"updated_at": time.Now(),
		}).
		FirstOrCreate(&pref).Error
}

// NotifyDeployFailed notifica sobre falha de deploy
func (s *NotificationService) NotifyDeployFailed(appID uuid.UUID, appName, phase, errorMsg string) {
	s.CreateNotification(
		appID,
		nil,
		TypeDeployFailed,
		"Deploy Falhou",
		"Deploy do app \""+appName+"\" falhou na fase de "+phase+": "+errorMsg,
		"error",
		map[string]interface{}{
			"app_name": appName,
			"phase":    phase,
			"error":    errorMsg,
		},
	)
}

// NotifyContainerCrash notifica sobre crash de container
func (s *NotificationService) NotifyContainerCrash(appID uuid.UUID, appName, containerID, exitCode string) {
	s.CreateNotification(
		appID,
		nil,
		TypeContainerCrash,
		"Container Crashou",
		"Container do app \""+appName+"\" crashou com exit code "+exitCode,
		"error",
		map[string]interface{}{
			"app_name":     appName,
			"container_id": containerID,
			"exit_code":    exitCode,
		},
	)
}

// NotifyRuleTriggered notifica sobre regra disparada
func (s *NotificationService) NotifyRuleTriggered(appID uuid.UUID, ruleName, actionType string) {
	s.CreateNotification(
		appID,
		nil,
		TypeRuleTriggered,
		"Regra Disparada",
		"Regra \""+ruleName+"\" foi disparada e executou ação: "+actionType,
		"info",
		map[string]interface{}{
			"rule_name":   ruleName,
			"action_type": actionType,
		},
	)
}

// NotifyApprovalRequired notifica sobre aprovação necessária
func (s *NotificationService) NotifyApprovalRequired(appID uuid.UUID, userID uuid.UUID, actionType, description string) {
	s.CreateNotification(
		appID,
		&userID,
		TypeApprovalRequired,
		"Aprovação Necessária",
		"Ação \""+actionType+"\" requer sua aprovação: "+description,
		"warning",
		map[string]interface{}{
			"action_type": actionType,
			"description": description,
		},
	)
}

// NotifyKillSwitchActive notifica sobre kill switch ativado
func (s *NotificationService) NotifyKillSwitchActive(appID uuid.UUID, reason string) {
	s.CreateNotification(
		appID,
		nil,
		TypeKillSwitchActive,
		"Kill Switch Ativado",
		"Kill switch foi ativado: "+reason,
		"critical",
		map[string]interface{}{
			"reason": reason,
		},
	)
}

// NotifyShadowModeChanged notifica sobre mudança no shadow mode
func (s *NotificationService) NotifyShadowModeChanged(appID uuid.UUID, active bool, reason string) {
	status := "desativado"
	if active {
		status = "ativado"
	}
	s.CreateNotification(
		appID,
		nil,
		TypeShadowModeChanged,
		"Shadow Mode "+status,
		"Shadow mode foi "+status+": "+reason,
		"info",
		map[string]interface{}{
			"active": active,
			"reason": reason,
		},
	)
}

// NotifyBillingAlert notifica sobre alerta de billing
func (s *NotificationService) NotifyBillingAlert(appID uuid.UUID, userID uuid.UUID, alertType, message string) {
	s.CreateNotification(
		appID,
		&userID,
		TypeBillingAlert,
		"Alerta de Billing",
		message,
		"warning",
		map[string]interface{}{
			"alert_type": alertType,
		},
	)
}

// NotifyResourceLimit notifica sobre limite de recurso
func (s *NotificationService) NotifyResourceLimit(appID uuid.UUID, resource string, current, limit float64) {
	percentage := (current / limit) * 100
	severity := "warning"
	if percentage >= 90 {
		severity = "error"
	}
	s.CreateNotification(
		appID,
		nil,
		TypeResourceLimit,
		"Limite de Recurso",
		resource+" atingiu "+formatPercent(percentage)+" do limite",
		severity,
		map[string]interface{}{
			"resource":   resource,
			"current":    current,
			"limit":      limit,
			"percentage": percentage,
		},
	)
}

func formatPercent(p float64) string {
	return fmt.Sprintf("%.0f%%", p)
}
