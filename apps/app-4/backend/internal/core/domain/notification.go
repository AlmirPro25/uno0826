package domain

import "time"

// Notification represents a system notification
type Notification struct {
	ID        int        `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int        `gorm:"column:user_id;not null;index" json:"user_id"`
	Title     string     `gorm:"column:title;not null" json:"title"`
	Message   string     `gorm:"column:message;type:text;not null" json:"message"`
	Type      string     `gorm:"column:type;not null;index" json:"type"`           // appointment, message, system, alert
	Priority  string     `gorm:"column:priority;default:'normal'" json:"priority"` // low, normal, high, urgent
	Read      bool       `gorm:"column:read;default:false;index" json:"read"`
	Data      string     `gorm:"column:data;type:text" json:"data,omitempty"` // JSON additional data
	Link      string     `gorm:"column:link" json:"link,omitempty"`           // Link to navigate to
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	ReadAt    *time.Time `gorm:"column:read_at" json:"read_at,omitempty"`

	// Relation
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name for Notification
func (Notification) TableName() string {
	return "notifications"
}

// NotificationType constants
const (
	NotificationTypeAppointment = "appointment"
	NotificationTypeMessage     = "message"
	NotificationTypeSystem      = "system"
	NotificationTypeAlert       = "alert"
	NotificationTypeReminder    = "reminder"
	NotificationTypeTriage      = "triage"
	NotificationTypeQueue       = "queue_call"
)

// NotificationPriority constants
const (
	NotificationPriorityLow    = "low"
	NotificationPriorityNormal = "normal"
	NotificationPriorityHigh   = "high"
	NotificationPriorityUrgent = "urgent"
)
