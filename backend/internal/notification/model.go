package notification

import (
	"time"

	"github.com/google/uuid"
)

// NotificationChannel define os canais de notificação
type NotificationChannel string

const (
	ChannelEmail   NotificationChannel = "email"
	ChannelWebhook NotificationChannel = "webhook"
	ChannelInApp   NotificationChannel = "in_app"
)

// NotificationType define os tipos de notificação
type NotificationType string

const (
	TypeDeployFailed      NotificationType = "deploy_failed"
	TypeContainerCrash    NotificationType = "container_crash"
	TypeHealthCheckFailed NotificationType = "health_check_failed"
	TypeRuleTriggered     NotificationType = "rule_triggered"
	TypeApprovalRequired  NotificationType = "approval_required"
	TypeKillSwitchActive  NotificationType = "kill_switch_active"
	TypeShadowModeChanged NotificationType = "shadow_mode_changed"
	TypeBillingAlert      NotificationType = "billing_alert"
	TypeCertExpiring      NotificationType = "cert_expiring"
	TypeResourceLimit     NotificationType = "resource_limit"
)

// Notification representa uma notificação no sistema
type Notification struct {
	ID        uuid.UUID           `gorm:"type:text;primaryKey" json:"id"`
	AppID     uuid.UUID           `gorm:"type:text;not null;index:idx_notification_app" json:"app_id"`
	UserID    *uuid.UUID          `gorm:"type:text;index:idx_notification_user" json:"user_id,omitempty"`
	Type      NotificationType    `gorm:"type:text;not null" json:"type"`
	Channel   NotificationChannel `gorm:"type:text;not null" json:"channel"`
	Title     string              `gorm:"type:text;not null" json:"title"`
	Message   string              `gorm:"type:text;not null" json:"message"`
	Data      string              `gorm:"type:text" json:"data"` // JSON
	Severity  string              `gorm:"type:text;not null;default:'info'" json:"severity"`
	Read      bool                `gorm:"default:false" json:"read"`
	ReadAt    *time.Time          `json:"read_at,omitempty"`
	Sent      bool                `gorm:"default:false" json:"sent"`
	SentAt    *time.Time          `json:"sent_at,omitempty"`
	Error     string              `gorm:"type:text" json:"error,omitempty"`
	CreatedAt time.Time           `gorm:"not null" json:"created_at"`
}

func (Notification) TableName() string {
	return "notifications"
}

// NotificationPreference define preferências de notificação por usuário
type NotificationPreference struct {
	ID        uuid.UUID        `gorm:"type:text;primaryKey" json:"id"`
	UserID    uuid.UUID        `gorm:"type:text;not null;uniqueIndex:idx_pref_user_type" json:"user_id"`
	Type      NotificationType `gorm:"type:text;not null;uniqueIndex:idx_pref_user_type" json:"type"`
	Email     bool             `gorm:"default:true" json:"email"`
	InApp     bool             `gorm:"default:true" json:"in_app"`
	Webhook   bool             `gorm:"default:false" json:"webhook"`
	CreatedAt time.Time        `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
}

func (NotificationPreference) TableName() string {
	return "notification_preferences"
}

// WebhookEndpoint define um endpoint de webhook para notificações
type WebhookEndpoint struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID     uuid.UUID `gorm:"type:text;not null;index:idx_webhook_app" json:"app_id"`
	URL       string    `gorm:"type:text;not null" json:"url"`
	Secret    string    `gorm:"type:text" json:"secret,omitempty"`
	Active    bool      `gorm:"default:true" json:"active"`
	Events    string    `gorm:"type:text" json:"events"` // JSON array of event types
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (WebhookEndpoint) TableName() string {
	return "webhook_endpoints"
}
