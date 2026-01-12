package notification

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupNotificationTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&Notification{}, &NotificationPreference{}, &WebhookEndpoint{})
	return db
}

func createNotificationTestService(t *testing.T, db *gorm.DB) *NotificationService {
	return NewNotificationService(db)
}

// ===========================================
// CREATE NOTIFICATION TESTS
// ===========================================

func TestCreateNotification(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	notif, err := service.CreateNotification(appID, nil, TypeRuleTriggered, "Test Title", "Test Message", "info", nil)
	assert.NoError(t, err)
	assert.NotNil(t, notif)
	assert.Equal(t, "Test Title", notif.Title)
	assert.Equal(t, TypeRuleTriggered, notif.Type)
	assert.Equal(t, ChannelInApp, notif.Channel)
}

func TestCreateNotificationWithData(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	data := map[string]interface{}{"key": "value", "count": 42}
	notif, err := service.CreateNotification(appID, nil, TypeDeployFailed, "Deploy Failed", "Error", "error", data)
	assert.NoError(t, err)
	assert.Contains(t, notif.Data, "key")
}

func TestCreateNotificationWithUser(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	userID := uuid.New()
	notif, err := service.CreateNotification(appID, &userID, TypeApprovalRequired, "Approval", "Needs approval", "warning", nil)
	assert.NoError(t, err)
	assert.NotNil(t, notif.UserID)
	assert.Equal(t, userID, *notif.UserID)
}


// ===========================================
// GET NOTIFICATIONS TESTS
// ===========================================

func TestGetUnreadByUser(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	userID := uuid.New()
	for i := 0; i < 5; i++ {
		service.CreateNotification(appID, &userID, TypeRuleTriggered, "Test", "Msg", "info", nil)
	}
	notifications, err := service.GetUnreadByUser(userID, 10)
	assert.NoError(t, err)
	assert.Len(t, notifications, 5)
}

func TestGetByApp(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	for i := 0; i < 3; i++ {
		service.CreateNotification(appID, nil, TypeContainerCrash, "Crash", "Msg", "error", nil)
	}
	notifications, err := service.GetByApp(appID, 10)
	assert.NoError(t, err)
	assert.Len(t, notifications, 3)
}

func TestGetByAppLimit(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	for i := 0; i < 10; i++ {
		service.CreateNotification(appID, nil, TypeRuleTriggered, "Test", "Msg", "info", nil)
	}
	notifications, err := service.GetByApp(appID, 5)
	assert.NoError(t, err)
	assert.Len(t, notifications, 5)
}

// ===========================================
// MARK AS READ TESTS
// ===========================================

func TestMarkAsRead(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	notif, _ := service.CreateNotification(appID, nil, TypeRuleTriggered, "Test", "Msg", "info", nil)
	assert.False(t, notif.Read)
	err := service.MarkAsRead(notif.ID)
	assert.NoError(t, err)
	var found Notification
	db.First(&found, "id = ?", notif.ID)
	assert.True(t, found.Read)
	assert.NotNil(t, found.ReadAt)
}

func TestMarkAllAsRead(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	userID := uuid.New()
	for i := 0; i < 5; i++ {
		service.CreateNotification(appID, &userID, TypeRuleTriggered, "Test", "Msg", "info", nil)
	}
	err := service.MarkAllAsRead(userID)
	assert.NoError(t, err)
	notifications, _ := service.GetUnreadByUser(userID, 10)
	assert.Len(t, notifications, 0)
}

func TestGetUnreadCount(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	userID := uuid.New()
	for i := 0; i < 7; i++ {
		service.CreateNotification(appID, &userID, TypeRuleTriggered, "Test", "Msg", "info", nil)
	}
	count, err := service.GetUnreadCount(userID)
	assert.NoError(t, err)
	assert.Equal(t, int64(7), count)
}


// ===========================================
// PREFERENCES TESTS
// ===========================================

func TestUpdatePreference(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	userID := uuid.New()
	err := service.UpdatePreference(userID, TypeDeployFailed, true, true, false)
	assert.NoError(t, err)
	prefs, err := service.GetPreferences(userID)
	assert.NoError(t, err)
	assert.Len(t, prefs, 1)
	assert.True(t, prefs[0].Email)
	assert.True(t, prefs[0].InApp)
	assert.False(t, prefs[0].Webhook)
}

func TestUpdatePreferenceMultipleTypes(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	userID := uuid.New()
	service.UpdatePreference(userID, TypeDeployFailed, true, true, false)
	service.UpdatePreference(userID, TypeContainerCrash, false, true, true)
	prefs, _ := service.GetPreferences(userID)
	assert.Len(t, prefs, 2)
}

// ===========================================
// HELPER NOTIFICATION METHODS TESTS
// ===========================================

func TestNotifyDeployFailed(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	service.NotifyDeployFailed(appID, "MyApp", "build", "compilation error")
	notifications, _ := service.GetByApp(appID, 10)
	assert.Len(t, notifications, 1)
	assert.Equal(t, TypeDeployFailed, notifications[0].Type)
	assert.Equal(t, "error", notifications[0].Severity)
}

func TestNotifyContainerCrash(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	service.NotifyContainerCrash(appID, "MyApp", "container-123", "1")
	notifications, _ := service.GetByApp(appID, 10)
	assert.Len(t, notifications, 1)
	assert.Equal(t, TypeContainerCrash, notifications[0].Type)
}

func TestNotifyRuleTriggered(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	service.NotifyRuleTriggered(appID, "High Bounce Rate", "alert")
	notifications, _ := service.GetByApp(appID, 10)
	assert.Len(t, notifications, 1)
	assert.Equal(t, TypeRuleTriggered, notifications[0].Type)
	assert.Equal(t, "info", notifications[0].Severity)
}

func TestNotifyKillSwitchActive(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	service.NotifyKillSwitchActive(appID, "Security breach detected")
	notifications, _ := service.GetByApp(appID, 10)
	assert.Len(t, notifications, 1)
	assert.Equal(t, TypeKillSwitchActive, notifications[0].Type)
	assert.Equal(t, "critical", notifications[0].Severity)
}

func TestNotifyShadowModeChanged(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	service.NotifyShadowModeChanged(appID, true, "Testing new rules")
	notifications, _ := service.GetByApp(appID, 10)
	assert.Len(t, notifications, 1)
	assert.Equal(t, TypeShadowModeChanged, notifications[0].Type)
}

func TestNotifyResourceLimit(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	service.NotifyResourceLimit(appID, "CPU", 85, 100)
	notifications, _ := service.GetByApp(appID, 10)
	assert.Len(t, notifications, 1)
	assert.Equal(t, TypeResourceLimit, notifications[0].Type)
	assert.Equal(t, "warning", notifications[0].Severity)
}

func TestNotifyResourceLimitCritical(t *testing.T) {
	db := setupNotificationTestDB(t)
	service := createNotificationTestService(t, db)
	appID := uuid.New()
	service.NotifyResourceLimit(appID, "Memory", 95, 100)
	notifications, _ := service.GetByApp(appID, 10)
	assert.Equal(t, "error", notifications[0].Severity)
}


// ===========================================
// CONSTANTS AND MODELS TESTS
// ===========================================

func TestNotificationChannelConstants(t *testing.T) {
	assert.Equal(t, NotificationChannel("email"), ChannelEmail)
	assert.Equal(t, NotificationChannel("webhook"), ChannelWebhook)
	assert.Equal(t, NotificationChannel("in_app"), ChannelInApp)
}

func TestNotificationTypeConstants(t *testing.T) {
	assert.Equal(t, NotificationType("deploy_failed"), TypeDeployFailed)
	assert.Equal(t, NotificationType("container_crash"), TypeContainerCrash)
	assert.Equal(t, NotificationType("health_check_failed"), TypeHealthCheckFailed)
	assert.Equal(t, NotificationType("rule_triggered"), TypeRuleTriggered)
	assert.Equal(t, NotificationType("approval_required"), TypeApprovalRequired)
	assert.Equal(t, NotificationType("kill_switch_active"), TypeKillSwitchActive)
	assert.Equal(t, NotificationType("shadow_mode_changed"), TypeShadowModeChanged)
	assert.Equal(t, NotificationType("billing_alert"), TypeBillingAlert)
	assert.Equal(t, NotificationType("cert_expiring"), TypeCertExpiring)
	assert.Equal(t, NotificationType("resource_limit"), TypeResourceLimit)
}

func TestNotificationTableName(t *testing.T) {
	assert.Equal(t, "notifications", Notification{}.TableName())
}

func TestNotificationPreferenceTableName(t *testing.T) {
	assert.Equal(t, "notification_preferences", NotificationPreference{}.TableName())
}

func TestWebhookEndpointTableName(t *testing.T) {
	assert.Equal(t, "webhook_endpoints", WebhookEndpoint{}.TableName())
}

// ===========================================
// WEBHOOK ENDPOINT TESTS
// ===========================================

func TestWebhookEndpointCRUD(t *testing.T) {
	db := setupNotificationTestDB(t)
	appID := uuid.New()
	endpoint := WebhookEndpoint{
		ID:        uuid.New(),
		AppID:     appID,
		URL:       "https://example.com/webhook",
		Secret:    "secret123",
		Active:    true,
		Events:    `["deploy_failed","container_crash"]`,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err := db.Create(&endpoint).Error
	assert.NoError(t, err)
	var found WebhookEndpoint
	err = db.Where("app_id = ?", appID).First(&found).Error
	assert.NoError(t, err)
	assert.Equal(t, "https://example.com/webhook", found.URL)
	assert.True(t, found.Active)
}
