package activity

/*
================================================================================
ACTIVITY SERVICE — LOG DE ATIVIDADES DO USUÁRIO
================================================================================

Rastreia ações importantes dos usuários:
- Login/Logout
- Alterações de configuração
- Ações administrativas
- Operações sensíveis

"Saber o que aconteceu é tão importante quanto fazer acontecer"

================================================================================
*/

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ActivityType tipos de atividade
type ActivityType string

const (
	ActivityLogin           ActivityType = "auth.login"
	ActivityLogout          ActivityType = "auth.logout"
	ActivityLoginFailed     ActivityType = "auth.login_failed"
	ActivityMFAEnabled      ActivityType = "auth.mfa_enabled"
	ActivityMFADisabled     ActivityType = "auth.mfa_disabled"
	ActivityPasswordChanged ActivityType = "auth.password_changed"
	ActivitySessionRevoked  ActivityType = "auth.session_revoked"

	ActivityAppCreated    ActivityType = "app.created"
	ActivityAppUpdated    ActivityType = "app.updated"
	ActivityAppDeleted    ActivityType = "app.deleted"
	ActivityAppSuspended  ActivityType = "app.suspended"
	ActivityAPIKeyCreated ActivityType = "app.api_key_created"
	ActivityAPIKeyRevoked ActivityType = "app.api_key_revoked"

	ActivityBillingUpgrade   ActivityType = "billing.upgrade"
	ActivityBillingDowngrade ActivityType = "billing.downgrade"
	ActivityBillingCanceled  ActivityType = "billing.canceled"
	ActivityPaymentFailed    ActivityType = "billing.payment_failed"

	ActivityRuleCreated   ActivityType = "rule.created"
	ActivityRuleUpdated   ActivityType = "rule.updated"
	ActivityRuleDeleted   ActivityType = "rule.deleted"
	ActivityRuleTriggered ActivityType = "rule.triggered"

	ActivitySecretCreated  ActivityType = "secret.created"
	ActivitySecretAccessed ActivityType = "secret.accessed"
	ActivitySecretDeleted  ActivityType = "secret.deleted"

	ActivityAdminAction ActivityType = "admin.action"
	ActivityKillSwitch  ActivityType = "admin.killswitch"
)

// ActivitySeverity severidade da atividade
type ActivitySeverity string

const (
	SeverityInfo     ActivitySeverity = "info"
	SeverityWarning  ActivitySeverity = "warning"
	SeverityCritical ActivitySeverity = "critical"
)

// Activity representa uma atividade registrada
type Activity struct {
	ID          uuid.UUID        `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID        `gorm:"type:uuid;index" json:"user_id"`
	AppID       *uuid.UUID       `gorm:"type:uuid;index" json:"app_id,omitempty"`
	Type        ActivityType     `gorm:"size:100;index" json:"type"`
	Severity    ActivitySeverity `gorm:"size:20;default:info" json:"severity"`
	Description string           `gorm:"size:500" json:"description"`
	Metadata    string           `gorm:"type:text" json:"metadata,omitempty"`
	IPAddress   string           `gorm:"size:45" json:"ip_address"`
	UserAgent   string           `gorm:"size:500" json:"user_agent"`
	Location    string           `gorm:"size:100" json:"location,omitempty"`
	Success     bool             `json:"success"`
	CreatedAt   time.Time        `gorm:"index" json:"created_at"`
}

// ActivityService serviço de atividades
type ActivityService struct {
	db *gorm.DB
}

// NewActivityService cria novo serviço
func NewActivityService(db *gorm.DB) *ActivityService {
	db.AutoMigrate(&Activity{})
	return &ActivityService{db: db}
}

// LogActivity registra uma atividade
func (s *ActivityService) LogActivity(
	userID uuid.UUID,
	appID *uuid.UUID,
	activityType ActivityType,
	description string,
	metadata map[string]interface{},
	ipAddress, userAgent string,
	success bool,
) (*Activity, error) {
	severity := getSeverity(activityType, success)

	metadataJSON := ""
	if metadata != nil {
		if data, err := json.Marshal(metadata); err == nil {
			metadataJSON = string(data)
		}
	}

	activity := &Activity{
		ID:          uuid.New(),
		UserID:      userID,
		AppID:       appID,
		Type:        activityType,
		Severity:    severity,
		Description: description,
		Metadata:    metadataJSON,
		IPAddress:   ipAddress,
		UserAgent:   userAgent,
		Success:     success,
		CreatedAt:   time.Now(),
	}

	if err := s.db.Create(activity).Error; err != nil {
		return nil, err
	}

	return activity, nil
}

// GetUserActivities retorna atividades de um usuário
func (s *ActivityService) GetUserActivities(userID uuid.UUID, limit, offset int) ([]Activity, int64, error) {
	var activities []Activity
	var total int64

	s.db.Model(&Activity{}).Where("user_id = ?", userID).Count(&total)

	err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&activities).Error

	return activities, total, err
}

// GetAppActivities retorna atividades de um app
func (s *ActivityService) GetAppActivities(appID uuid.UUID, limit, offset int) ([]Activity, int64, error) {
	var activities []Activity
	var total int64

	s.db.Model(&Activity{}).Where("app_id = ?", appID).Count(&total)

	err := s.db.Where("app_id = ?", appID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&activities).Error

	return activities, total, err
}

// GetActivitiesByType retorna atividades por tipo
func (s *ActivityService) GetActivitiesByType(activityType ActivityType, limit int) ([]Activity, error) {
	var activities []Activity
	err := s.db.Where("type = ?", activityType).
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error
	return activities, err
}

// GetSecurityActivities retorna atividades de segurança (warning/critical)
func (s *ActivityService) GetSecurityActivities(limit int) ([]Activity, error) {
	var activities []Activity
	err := s.db.Where("severity IN ?", []ActivitySeverity{SeverityWarning, SeverityCritical}).
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error
	return activities, err
}

// GetFailedActivities retorna atividades que falharam
func (s *ActivityService) GetFailedActivities(userID uuid.UUID, since time.Time) ([]Activity, error) {
	var activities []Activity
	err := s.db.Where("user_id = ? AND success = ? AND created_at > ?", userID, false, since).
		Order("created_at DESC").
		Find(&activities).Error
	return activities, err
}

// GetActivityStats retorna estatísticas de atividades
func (s *ActivityService) GetActivityStats(userID uuid.UUID) (*ActivityStats, error) {
	stats := &ActivityStats{UserID: userID}

	// Total de atividades
	s.db.Model(&Activity{}).Where("user_id = ?", userID).Count(&stats.TotalActivities)

	// Atividades nos últimos 7 dias
	weekAgo := time.Now().Add(-7 * 24 * time.Hour)
	s.db.Model(&Activity{}).Where("user_id = ? AND created_at > ?", userID, weekAgo).Count(&stats.ActivitiesLast7Days)

	// Logins nos últimos 30 dias
	monthAgo := time.Now().Add(-30 * 24 * time.Hour)
	s.db.Model(&Activity{}).Where("user_id = ? AND type = ? AND created_at > ?", userID, ActivityLogin, monthAgo).Count(&stats.LoginsLast30Days)

	// Falhas de login
	s.db.Model(&Activity{}).Where("user_id = ? AND type = ? AND created_at > ?", userID, ActivityLoginFailed, monthAgo).Count(&stats.FailedLoginsLast30Days)

	// Última atividade
	var lastActivity Activity
	if err := s.db.Where("user_id = ?", userID).Order("created_at DESC").First(&lastActivity).Error; err == nil {
		stats.LastActivity = lastActivity.CreatedAt
	}

	// Atividades por tipo (top 5)
	type TypeCount struct {
		Type  ActivityType
		Count int64
	}
	var typeCounts []TypeCount
	s.db.Model(&Activity{}).
		Select("type, count(*) as count").
		Where("user_id = ?", userID).
		Group("type").
		Order("count DESC").
		Limit(5).
		Scan(&typeCounts)

	stats.ByType = make(map[ActivityType]int64)
	for _, tc := range typeCounts {
		stats.ByType[tc.Type] = tc.Count
	}

	return stats, nil
}

// ActivityStats estatísticas de atividades
type ActivityStats struct {
	UserID                 uuid.UUID              `json:"user_id"`
	TotalActivities        int64                  `json:"total_activities"`
	ActivitiesLast7Days    int64                  `json:"activities_last_7_days"`
	LoginsLast30Days       int64                  `json:"logins_last_30_days"`
	FailedLoginsLast30Days int64                  `json:"failed_logins_last_30_days"`
	LastActivity           time.Time              `json:"last_activity"`
	ByType                 map[ActivityType]int64 `json:"by_type"`
}

// CleanupOldActivities remove atividades antigas (job de limpeza)
func (s *ActivityService) CleanupOldActivities(olderThan time.Duration) (int64, error) {
	cutoff := time.Now().Add(-olderThan)
	result := s.db.Where("created_at < ? AND severity = ?", cutoff, SeverityInfo).Delete(&Activity{})
	return result.RowsAffected, result.Error
}

// getSeverity determina a severidade baseada no tipo e sucesso
func getSeverity(activityType ActivityType, success bool) ActivitySeverity {
	// Falhas são sempre warning ou critical
	if !success {
		switch activityType {
		case ActivityLoginFailed:
			return SeverityWarning
		case ActivityPaymentFailed:
			return SeverityCritical
		default:
			return SeverityWarning
		}
	}

	// Ações críticas
	switch activityType {
	case ActivityKillSwitch, ActivityAppDeleted, ActivitySecretDeleted:
		return SeverityCritical
	case ActivityMFADisabled, ActivityAPIKeyRevoked, ActivitySessionRevoked, ActivityBillingCanceled:
		return SeverityWarning
	default:
		return SeverityInfo
	}
}
