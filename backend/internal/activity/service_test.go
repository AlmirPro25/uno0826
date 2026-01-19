package activity

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupActivityTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	return db
}

func TestActivityService_LogActivity(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()
	metadata := map[string]interface{}{
		"browser": "Chrome",
		"os":      "Windows",
	}

	activity, err := service.LogActivity(
		userID,
		nil,
		ActivityLogin,
		"Login realizado com sucesso",
		metadata,
		"192.168.1.1",
		"Mozilla/5.0",
		true,
	)

	require.NoError(t, err)
	assert.NotNil(t, activity)
	assert.Equal(t, userID, activity.UserID)
	assert.Equal(t, ActivityLogin, activity.Type)
	assert.Equal(t, SeverityInfo, activity.Severity)
	assert.True(t, activity.Success)
}

func TestActivityService_LogActivity_Failed(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()

	activity, err := service.LogActivity(
		userID,
		nil,
		ActivityLoginFailed,
		"Senha incorreta",
		nil,
		"192.168.1.1",
		"Mozilla/5.0",
		false,
	)

	require.NoError(t, err)
	assert.Equal(t, SeverityWarning, activity.Severity)
	assert.False(t, activity.Success)
}

func TestActivityService_LogActivity_Critical(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()

	activity, err := service.LogActivity(
		userID,
		nil,
		ActivityKillSwitch,
		"Kill switch ativado",
		nil,
		"192.168.1.1",
		"Mozilla/5.0",
		true,
	)

	require.NoError(t, err)
	assert.Equal(t, SeverityCritical, activity.Severity)
}

func TestActivityService_GetUserActivities(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()

	// Criar várias atividades
	for i := 0; i < 5; i++ {
		_, err := service.LogActivity(userID, nil, ActivityLogin, "Login", nil, "1.1.1.1", "UA", true)
		require.NoError(t, err)
	}

	activities, total, err := service.GetUserActivities(userID, 10, 0)
	require.NoError(t, err)
	assert.Len(t, activities, 5)
	assert.Equal(t, int64(5), total)
}

func TestActivityService_GetUserActivities_Pagination(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()

	// Criar 10 atividades
	for i := 0; i < 10; i++ {
		_, err := service.LogActivity(userID, nil, ActivityLogin, "Login", nil, "1.1.1.1", "UA", true)
		require.NoError(t, err)
	}

	// Primeira página
	activities, total, err := service.GetUserActivities(userID, 5, 0)
	require.NoError(t, err)
	assert.Len(t, activities, 5)
	assert.Equal(t, int64(10), total)

	// Segunda página
	activities, _, err = service.GetUserActivities(userID, 5, 5)
	require.NoError(t, err)
	assert.Len(t, activities, 5)
}

func TestActivityService_GetSecurityActivities(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()

	// Criar atividades de diferentes severidades
	service.LogActivity(userID, nil, ActivityLogin, "Login", nil, "1.1.1.1", "UA", true)        // info
	service.LogActivity(userID, nil, ActivityLoginFailed, "Falha", nil, "1.1.1.1", "UA", false) // warning
	service.LogActivity(userID, nil, ActivityKillSwitch, "Kill", nil, "1.1.1.1", "UA", true)    // critical

	activities, err := service.GetSecurityActivities(10)
	require.NoError(t, err)
	assert.Len(t, activities, 2) // Apenas warning e critical
}

func TestActivityService_GetActivityStats(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()

	// Criar atividades
	service.LogActivity(userID, nil, ActivityLogin, "Login 1", nil, "1.1.1.1", "UA", true)
	service.LogActivity(userID, nil, ActivityLogin, "Login 2", nil, "1.1.1.1", "UA", true)
	service.LogActivity(userID, nil, ActivityLoginFailed, "Falha", nil, "1.1.1.1", "UA", false)
	service.LogActivity(userID, nil, ActivityMFAEnabled, "MFA", nil, "1.1.1.1", "UA", true)

	stats, err := service.GetActivityStats(userID)
	require.NoError(t, err)
	assert.Equal(t, int64(4), stats.TotalActivities)
	assert.Equal(t, int64(4), stats.ActivitiesLast7Days)
	assert.Equal(t, int64(2), stats.LoginsLast30Days)
	assert.Equal(t, int64(1), stats.FailedLoginsLast30Days)
}

func TestActivityService_GetFailedActivities(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()

	// Criar atividades
	service.LogActivity(userID, nil, ActivityLogin, "Login", nil, "1.1.1.1", "UA", true)
	service.LogActivity(userID, nil, ActivityLoginFailed, "Falha 1", nil, "1.1.1.1", "UA", false)
	service.LogActivity(userID, nil, ActivityLoginFailed, "Falha 2", nil, "1.1.1.1", "UA", false)

	since := time.Now().Add(-1 * time.Hour)
	activities, err := service.GetFailedActivities(userID, since)
	require.NoError(t, err)
	assert.Len(t, activities, 2)
}

func TestActivityService_AppActivities(t *testing.T) {
	db := setupActivityTestDB(t)
	service := NewActivityService(db)

	userID := uuid.New()
	appID := uuid.New()

	// Criar atividades com app
	service.LogActivity(userID, &appID, ActivityAppCreated, "App criado", nil, "1.1.1.1", "UA", true)
	service.LogActivity(userID, &appID, ActivityAPIKeyCreated, "Key criada", nil, "1.1.1.1", "UA", true)

	activities, total, err := service.GetAppActivities(appID, 10, 0)
	require.NoError(t, err)
	assert.Len(t, activities, 2)
	assert.Equal(t, int64(2), total)
}

func TestGetSeverity(t *testing.T) {
	tests := []struct {
		activityType ActivityType
		success      bool
		expected     ActivitySeverity
	}{
		{ActivityLogin, true, SeverityInfo},
		{ActivityLoginFailed, false, SeverityWarning},
		{ActivityKillSwitch, true, SeverityCritical},
		{ActivityMFADisabled, true, SeverityWarning},
		{ActivityAppDeleted, true, SeverityCritical},
		{ActivityPaymentFailed, false, SeverityCritical},
	}

	for _, tt := range tests {
		t.Run(string(tt.activityType), func(t *testing.T) {
			result := getSeverity(tt.activityType, tt.success)
			assert.Equal(t, tt.expected, result)
		})
	}
}
