package telemetry

import (
"testing"
"time"

"github.com/glebarez/sqlite"
"github.com/google/uuid"
"github.com/stretchr/testify/assert"
"github.com/stretchr/testify/require"
"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
require.NoError(t, err)
db.Exec("CREATE TABLE IF NOT EXISTS alert_history (id TEXT PRIMARY KEY, app_id TEXT, type TEXT, severity TEXT DEFAULT 'info', title TEXT, message TEXT, data TEXT, source TEXT DEFAULT 'system', rule_id TEXT, rule_name TEXT, acknowledged INTEGER DEFAULT 0, acknowledged_at DATETIME, acknowledged_by TEXT, created_at DATETIME)")
db.Exec("CREATE TABLE IF NOT EXISTS telemetry_sessions (id TEXT PRIMARY KEY, app_id TEXT, user_id TEXT, device_id TEXT, started_at DATETIME, last_seen_at DATETIME, ended_at DATETIME, ip_address TEXT, user_agent TEXT, country TEXT, current_feature TEXT, current_context TEXT, event_count INTEGER DEFAULT 0, interaction_count INTEGER DEFAULT 0, duration_ms INTEGER DEFAULT 0, created_at DATETIME, updated_at DATETIME)")
return db
}

func createTestService(t *testing.T, db *gorm.DB) *TelemetryService {
return &TelemetryService{db: db, stopCleanup: make(chan struct{})}
}

func TestCreateAlert(t *testing.T) {
db := setupTestDB(t)
service := createTestService(t, db)
appID := uuid.New()
err := service.CreateAlert(appID, AlertOnlineDrop, "warning", "Test", "Message", nil, nil, "")
assert.NoError(t, err)
var alerts []AlertHistory
db.Where("app_id = ?", appID).Find(&alerts)
assert.Len(t, alerts, 1)
}

func TestGetRecentAlerts(t *testing.T) {
db := setupTestDB(t)
service := createTestService(t, db)
appID := uuid.New()
for i := 0; i < 5; i++ {
service.CreateAlert(appID, "test", "info", "Test", "Message", nil, nil, "")
}
alerts, err := service.GetRecentAlerts(appID, 10)
assert.NoError(t, err)
assert.Len(t, alerts, 5)
}

func TestAcknowledgeAlert(t *testing.T) {
db := setupTestDB(t)
service := createTestService(t, db)
appID := uuid.New()
service.CreateAlert(appID, "test", "warning", "Test", "Message", nil, nil, "")
var alert AlertHistory
db.Where("app_id = ?", appID).First(&alert)
err := service.AcknowledgeAlert(alert.ID, "admin@example.com")
assert.NoError(t, err)
db.Where("id = ?", alert.ID).First(&alert)
assert.True(t, alert.Acknowledged)
}

func TestGetAlertStats(t *testing.T) {
db := setupTestDB(t)
service := createTestService(t, db)
appID := uuid.New()
service.CreateAlert(appID, "a1", "info", "Info", "Msg", nil, nil, "")
service.CreateAlert(appID, "a2", "warning", "Warning", "Msg", nil, nil, "")
stats, err := service.GetAlertStats()
assert.NoError(t, err)
assert.Equal(t, int64(2), stats.Total)
}

func TestAlertDebounce(t *testing.T) {
db := setupTestDB(t)
service := createTestService(t, db)
appID := uuid.New()
for i := 0; i < 5; i++ {
service.triggerAlert(appID, AlertOnlineDrop, nil)
}
var alerts []AlertHistory
db.Where("app_id = ?", appID).Find(&alerts)
assert.Len(t, alerts, 1)
}

func TestAppSessionIsActive(t *testing.T) {
session := &AppSession{LastSeenAt: time.Now(), EndedAt: nil}
assert.True(t, session.IsActive())
now := time.Now()
session.EndedAt = &now
assert.False(t, session.IsActive())
}

func TestEventTypeConstants(t *testing.T) {
assert.Equal(t, "session.start", EventSessionStart)
assert.Equal(t, "session.end", EventSessionEnd)
}

func TestAlertTypeConstants(t *testing.T) {
assert.Equal(t, "online_drop", AlertOnlineDrop)
assert.Equal(t, "no_events", AlertNoEvents)
}