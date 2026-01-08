package identity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// LOGIN EVENTS - Auditoria de Login
// "Quem logou, quando, de onde"
// ========================================

// LoginEvent registra cada tentativa de login
type LoginEvent struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:text;index" json:"user_id"`
	Username  string    `gorm:"type:text" json:"username"`
	IP        string    `gorm:"type:text" json:"ip"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	Method    string    `gorm:"type:text" json:"method"` // password, phone_otp, google
	Success   bool      `gorm:"not null" json:"success"`
	FailReason string   `gorm:"type:text" json:"fail_reason,omitempty"`
	Role      string    `gorm:"type:text" json:"role"`
	CreatedAt time.Time `gorm:"not null;index" json:"created_at"`
}

func (LoginEvent) TableName() string {
	return "login_events"
}

// ========================================
// LOGIN EVENT SERVICE
// ========================================

type LoginEventService struct {
	db *gorm.DB
}

func NewLoginEventService(db *gorm.DB) *LoginEventService {
	return &LoginEventService{db: db}
}

// RecordLogin registra um evento de login
func (s *LoginEventService) RecordLogin(userID uuid.UUID, username, ip, userAgent, method, role string, success bool, failReason string) error {
	event := &LoginEvent{
		ID:         uuid.New(),
		UserID:     userID,
		Username:   username,
		IP:         ip,
		UserAgent:  userAgent,
		Method:     method,
		Success:    success,
		FailReason: failReason,
		Role:       role,
		CreatedAt:  time.Now(),
	}
	return s.db.Create(event).Error
}

// GetUserLoginHistory retorna histórico de login de um usuário
func (s *LoginEventService) GetUserLoginHistory(userID uuid.UUID, limit int) ([]LoginEvent, error) {
	var events []LoginEvent
	err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetRecentLogins retorna logins recentes (admin view)
func (s *LoginEventService) GetRecentLogins(limit int) ([]LoginEvent, error) {
	var events []LoginEvent
	err := s.db.Order("created_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetFailedLogins retorna tentativas de login falhas (segurança)
func (s *LoginEventService) GetFailedLogins(since time.Time, limit int) ([]LoginEvent, error) {
	var events []LoginEvent
	err := s.db.Where("success = ? AND created_at > ?", false, since).
		Order("created_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetLoginStats retorna estatísticas de login
func (s *LoginEventService) GetLoginStats(since time.Time) (map[string]interface{}, error) {
	var totalLogins int64
	var successfulLogins int64
	var failedLogins int64

	s.db.Model(&LoginEvent{}).Where("created_at > ?", since).Count(&totalLogins)
	s.db.Model(&LoginEvent{}).Where("created_at > ? AND success = ?", since, true).Count(&successfulLogins)
	s.db.Model(&LoginEvent{}).Where("created_at > ? AND success = ?", since, false).Count(&failedLogins)

	// Logins por método
	type MethodCount struct {
		Method string
		Count  int64
	}
	var methodCounts []MethodCount
	s.db.Model(&LoginEvent{}).
		Select("method, count(*) as count").
		Where("created_at > ?", since).
		Group("method").
		Scan(&methodCounts)

	methodMap := make(map[string]int64)
	for _, mc := range methodCounts {
		methodMap[mc.Method] = mc.Count
	}

	// Logins por role
	type RoleCount struct {
		Role  string
		Count int64
	}
	var roleCounts []RoleCount
	s.db.Model(&LoginEvent{}).
		Select("role, count(*) as count").
		Where("created_at > ? AND success = ?", since, true).
		Group("role").
		Scan(&roleCounts)

	roleMap := make(map[string]int64)
	for _, rc := range roleCounts {
		roleMap[rc.Role] = rc.Count
	}

	return map[string]interface{}{
		"total":      totalLogins,
		"successful": successfulLogins,
		"failed":     failedLogins,
		"by_method":  methodMap,
		"by_role":    roleMap,
		"since":      since,
	}, nil
}
