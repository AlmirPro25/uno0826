package application

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// ========================================
// TEST HELPERS
// ========================================

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate schemas
	err = db.AutoMigrate(&Application{}, &AppCredential{}, &AppUser{}, &AppSession{}, &AppAuditEvent{})
	require.NoError(t, err)

	// Create implicit_users table for metrics
	db.Exec(`CREATE TABLE IF NOT EXISTS implicit_users (
		id TEXT PRIMARY KEY,
		app_id TEXT,
		external_ref TEXT,
		name TEXT,
		email TEXT,
		session_count INTEGER DEFAULT 0,
		first_seen_at DATETIME,
		last_seen_at DATETIME,
		created_at DATETIME
	)`)

	return db
}

func createTestApp(t *testing.T, db *gorm.DB, name, slug string, ownerID uuid.UUID) *Application {
	app := &Application{
		ID:          uuid.New(),
		Name:        name,
		Slug:        slug,
		Description: "Test app: " + name,
		OwnerID:     ownerID,
		OwnerType:   "user",
		Status:      AppStatusActive,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	err := db.Create(app).Error
	require.NoError(t, err)
	return app
}

// ========================================
// APPLICATION CRUD TESTS
// ========================================

func TestApplicationService_CreateApplication(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app, err := service.CreateApplication("Test App", "test-app", "A test application", ownerID, "user")
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, app.ID)
	assert.Equal(t, "Test App", app.Name)
	assert.Equal(t, "test-app", app.Slug)
	assert.Equal(t, AppStatusActive, app.Status)
}

func TestApplicationService_CreateApplication_DuplicateSlug(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	// Create first app
	_, err := service.CreateApplication("App 1", "my-app", "First app", ownerID, "user")
	assert.NoError(t, err)

	// Try to create second app with same slug
	_, err = service.CreateApplication("App 2", "my-app", "Second app", ownerID, "user")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "slug já existe")
}

func TestApplicationService_GetApplication(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	created := createTestApp(t, db, "Get Test", "get-test", ownerID)

	found, err := service.GetApplication(created.ID)
	assert.NoError(t, err)
	assert.Equal(t, "Get Test", found.Name)
}

func TestApplicationService_GetApplicationBySlug(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	createTestApp(t, db, "Slug Test", "slug-test", ownerID)

	found, err := service.GetApplicationBySlug("slug-test")
	assert.NoError(t, err)
	assert.Equal(t, "Slug Test", found.Name)
}

func TestApplicationService_ListApplications(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()
	otherOwnerID := uuid.New()

	// Create apps for owner
	createTestApp(t, db, "App 1", "app-1", ownerID)
	createTestApp(t, db, "App 2", "app-2", ownerID)
	createTestApp(t, db, "App 3", "app-3", ownerID)

	// Create app for other owner
	createTestApp(t, db, "Other App", "other-app", otherOwnerID)

	apps, err := service.ListApplications(ownerID)
	assert.NoError(t, err)
	assert.Len(t, apps, 3)
}

func TestApplicationService_UpdateApplication(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	created := createTestApp(t, db, "Update Test", "update-test", ownerID)

	updated, err := service.UpdateApplication(created.ID, map[string]interface{}{
		"name":        "Updated Name",
		"description": "Updated description",
	})
	assert.NoError(t, err)
	assert.Equal(t, "Updated Name", updated.Name)
	assert.Equal(t, "Updated description", updated.Description)
}

func TestApplicationService_SuspendApplication(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	created := createTestApp(t, db, "Suspend Test", "suspend-test", ownerID)

	err := service.SuspendApplication(created.ID, "Policy violation")
	assert.NoError(t, err)

	// Verify status
	var found Application
	db.Where("id = ?", created.ID).First(&found)
	assert.Equal(t, AppStatusSuspended, found.Status)
}

// ========================================
// CREDENTIAL TESTS
// ========================================

func TestApplicationService_CreateCredential(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Cred Test", "cred-test", ownerID)

	cred, secret, err := service.CreateCredential(app.ID, "Production Key", []string{"read", "write"})
	assert.NoError(t, err)
	assert.NotEmpty(t, cred.PublicKey)
	assert.NotEmpty(t, secret)
	assert.Contains(t, cred.PublicKey, "pq_pk_")
	assert.Contains(t, secret, "pq_sk_")
}

func TestApplicationService_ValidateCredential(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Validate Test", "validate-test", ownerID)
	cred, secret, _ := service.CreateCredential(app.ID, "Test Key", []string{"read"})

	// Valid credentials
	foundCred, foundApp, err := service.ValidateCredential(cred.PublicKey, secret)
	assert.NoError(t, err)
	assert.Equal(t, cred.ID, foundCred.ID)
	assert.Equal(t, app.ID, foundApp.ID)
}

func TestApplicationService_ValidateCredential_InvalidSecret(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Invalid Test", "invalid-test", ownerID)
	cred, _, _ := service.CreateCredential(app.ID, "Test Key", []string{"read"})

	// Invalid secret
	_, _, err := service.ValidateCredential(cred.PublicKey, "wrong_secret")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "secret inválido")
}

func TestApplicationService_ListCredentials(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "List Creds", "list-creds", ownerID)

	// Create multiple credentials
	service.CreateCredential(app.ID, "Key 1", []string{"read"})
	service.CreateCredential(app.ID, "Key 2", []string{"write"})
	service.CreateCredential(app.ID, "Key 3", []string{"read", "write"})

	creds, err := service.ListCredentials(app.ID)
	assert.NoError(t, err)
	assert.Len(t, creds, 3)
}

func TestApplicationService_RevokeCredential(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Revoke Test", "revoke-test", ownerID)
	cred, secret, _ := service.CreateCredential(app.ID, "Test Key", []string{"read"})

	// Revoke
	err := service.RevokeCredential(cred.ID)
	assert.NoError(t, err)

	// Should not validate anymore
	_, _, err = service.ValidateCredential(cred.PublicKey, secret)
	assert.Error(t, err)
}

// ========================================
// APP USER TESTS
// ========================================

func TestApplicationService_GetOrCreateAppUser(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "User Test", "user-test", ownerID)
	userID := uuid.New()

	// First call - should create
	appUser, created, err := service.GetOrCreateAppUser(app.ID, userID, "ext_123")
	assert.NoError(t, err)
	assert.True(t, created)
	assert.Equal(t, userID, appUser.UserID)
	assert.Equal(t, "ext_123", appUser.ExternalUserID)

	// Second call - should get existing
	appUser2, created2, err := service.GetOrCreateAppUser(app.ID, userID, "ext_123")
	assert.NoError(t, err)
	assert.False(t, created2)
	assert.Equal(t, appUser.ID, appUser2.ID)
}

func TestApplicationService_ListAppUsers(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "List Users", "list-users", ownerID)

	// Create multiple users
	for i := 0; i < 5; i++ {
		service.GetOrCreateAppUser(app.ID, uuid.New(), "ext_"+uuid.New().String()[:8])
	}

	users, total, err := service.ListAppUsers(app.ID, 10, 0)
	assert.NoError(t, err)
	assert.Len(t, users, 5)
	assert.Equal(t, int64(5), total)
}

// ========================================
// SESSION TESTS
// ========================================

func TestApplicationService_CreateSession(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Session Test", "session-test", ownerID)
	userID := uuid.New()
	appUser, _, _ := service.GetOrCreateAppUser(app.ID, userID, "ext_123")

	session, err := service.CreateSession(
		app.ID, appUser.ID, userID,
		"192.168.1.1", "Mozilla/5.0", "desktop", "BR",
		24*time.Hour,
	)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, session.ID)
	assert.Equal(t, SessionStatusActive, session.Status)
	assert.True(t, session.ExpiresAt.After(time.Now()))
}

func TestApplicationService_ValidateSession(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Validate Session", "validate-session", ownerID)
	userID := uuid.New()
	appUser, _, _ := service.GetOrCreateAppUser(app.ID, userID, "ext_123")

	session, _ := service.CreateSession(
		app.ID, appUser.ID, userID,
		"192.168.1.1", "Mozilla/5.0", "desktop", "BR",
		24*time.Hour,
	)

	// Valid session
	validated, err := service.ValidateSession(session.ID)
	assert.NoError(t, err)
	assert.Equal(t, session.ID, validated.ID)
}

func TestApplicationService_ValidateSession_Expired(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Expired Session", "expired-session", ownerID)
	userID := uuid.New()
	appUser, _, _ := service.GetOrCreateAppUser(app.ID, userID, "ext_123")

	// Create session with negative duration (already expired)
	session := &AppSession{
		ID:        uuid.New(),
		AppID:     app.ID,
		AppUserID: appUser.ID,
		UserID:    userID,
		Status:    SessionStatusActive,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(-1 * time.Hour), // Expired
	}
	db.Create(session)

	_, err := service.ValidateSession(session.ID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "expirada")
}

func TestApplicationService_RevokeSession(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Revoke Session", "revoke-session", ownerID)
	userID := uuid.New()
	appUser, _, _ := service.GetOrCreateAppUser(app.ID, userID, "ext_123")

	session, _ := service.CreateSession(
		app.ID, appUser.ID, userID,
		"192.168.1.1", "Mozilla/5.0", "desktop", "BR",
		24*time.Hour,
	)

	err := service.RevokeSession(session.ID, "User logout")
	assert.NoError(t, err)

	// Should not validate anymore
	_, err = service.ValidateSession(session.ID)
	assert.Error(t, err)
}

func TestApplicationService_RevokeAllSessions(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Revoke All", "revoke-all", ownerID)
	userID := uuid.New()
	appUser, _, _ := service.GetOrCreateAppUser(app.ID, userID, "ext_123")

	// Create multiple sessions
	for i := 0; i < 3; i++ {
		service.CreateSession(
			app.ID, appUser.ID, userID,
			"192.168.1.1", "Mozilla/5.0", "desktop", "BR",
			24*time.Hour,
		)
	}

	err := service.RevokeAllSessions(app.ID, userID, "Security breach")
	assert.NoError(t, err)

	// All sessions should be revoked
	sessions, _ := service.ListActiveSessions(app.ID, userID)
	assert.Len(t, sessions, 0)
}

// ========================================
// AUDIT EVENT TESTS
// ========================================

func TestApplicationService_CreateAppAuditEvent(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Audit Test", "audit-test", ownerID)

	err := service.CreateAppAuditEvent(
		app.ID,
		"user.login",
		"user_123",
		"user",
		"session_456",
		"session",
		"create",
		`{"browser":"Chrome"}`,
		"192.168.1.1",
		"Mozilla/5.0",
	)
	assert.NoError(t, err)

	// Verify event was created
	events, err := service.GetAppAuditEvents(app.ID, 10)
	assert.NoError(t, err)
	assert.Len(t, events, 1)
	assert.Equal(t, "user.login", events[0].Type)
}

func TestApplicationService_GetAppAuditStats(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Stats Test", "stats-test", ownerID)

	// Create multiple events
	for i := 0; i < 5; i++ {
		service.CreateAppAuditEvent(app.ID, "user.login", "user_"+uuid.New().String()[:8], "user", "", "", "create", "{}", "", "")
	}
	for i := 0; i < 3; i++ {
		service.CreateAppAuditEvent(app.ID, "user.logout", "user_"+uuid.New().String()[:8], "user", "", "", "delete", "{}", "", "")
	}

	stats, err := service.GetAppAuditStats(app.ID)
	assert.NoError(t, err)
	assert.Equal(t, int64(8), stats["total_events"])
	
	eventsByType := stats["events_by_type"].(map[string]int64)
	assert.Equal(t, int64(5), eventsByType["user.login"])
	assert.Equal(t, int64(3), eventsByType["user.logout"])
}

// ========================================
// METRICS TESTS
// ========================================

func TestApplicationService_GetAppMetrics(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Metrics Test", "metrics-test", ownerID)

	// Create some sessions
	for i := 0; i < 3; i++ {
		userID := uuid.New()
		appUser, _, _ := service.GetOrCreateAppUser(app.ID, userID, "ext_"+uuid.New().String()[:8])
		service.CreateSession(app.ID, appUser.ID, userID, "192.168.1.1", "Mozilla/5.0", "desktop", "BR", 24*time.Hour)
	}

	metrics, err := service.GetAppMetrics(app.ID)
	assert.NoError(t, err)
	assert.Equal(t, app.ID, metrics.AppID)
	assert.Equal(t, int64(3), metrics.TotalSessions)
	assert.Equal(t, int64(3), metrics.ActiveSessions)
}

// ========================================
// INTEGRATION TESTS
// ========================================

func TestApplicationFlow_CompleteLifecycle(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	// 1. Create application
	app, err := service.CreateApplication("My App", "my-app", "Test application", ownerID, "user")
	assert.NoError(t, err)

	// 2. Create credentials
	cred, secret, err := service.CreateCredential(app.ID, "Production", []string{"read", "write"})
	assert.NoError(t, err)

	// 3. Validate credentials
	_, foundApp, err := service.ValidateCredential(cred.PublicKey, secret)
	assert.NoError(t, err)
	assert.Equal(t, app.ID, foundApp.ID)

	// 4. Create user
	userID := uuid.New()
	appUser, created, err := service.GetOrCreateAppUser(app.ID, userID, "ext_user_1")
	assert.NoError(t, err)
	assert.True(t, created)

	// 5. Create session
	session, err := service.CreateSession(app.ID, appUser.ID, userID, "192.168.1.1", "Mozilla/5.0", "desktop", "BR", 24*time.Hour)
	assert.NoError(t, err)

	// 6. Validate session
	_, err = service.ValidateSession(session.ID)
	assert.NoError(t, err)

	// 7. Create audit event
	err = service.CreateAppAuditEvent(app.ID, "user.action", userID.String(), "user", "", "", "execute", "{}", "192.168.1.1", "Mozilla/5.0")
	assert.NoError(t, err)

	// 8. Get metrics
	metrics, err := service.GetAppMetrics(app.ID)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), metrics.TotalSessions)

	// 9. Revoke session
	err = service.RevokeSession(session.ID, "User logout")
	assert.NoError(t, err)

	// 10. Suspend application
	err = service.SuspendApplication(app.ID, "Maintenance")
	assert.NoError(t, err)

	// 11. Credentials should not work for suspended app
	_, _, err = service.ValidateCredential(cred.PublicKey, secret)
	assert.Error(t, err)
}

// ========================================
// EDGE CASES
// ========================================

func TestEdgeCase_SlugNormalization(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	// Slug should be lowercased
	app, err := service.CreateApplication("Test App", "MY-APP-SLUG", "Test", ownerID, "user")
	assert.NoError(t, err)
	assert.Equal(t, "my-app-slug", app.Slug)
}

func TestEdgeCase_DeletedAppNotFound(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Delete Test", "delete-test", ownerID)

	// Mark as deleted
	db.Model(&Application{}).Where("id = ?", app.ID).Update("status", AppStatusDeleted)

	// Should not find deleted app
	_, err := service.GetApplication(app.ID)
	assert.Error(t, err)
}

func TestEdgeCase_ExpiredCredential(t *testing.T) {
	db := setupTestDB(t)
	service := NewApplicationService(db)
	ownerID := uuid.New()

	app := createTestApp(t, db, "Expired Cred", "expired-cred", ownerID)
	cred, secret, _ := service.CreateCredential(app.ID, "Test Key", []string{"read"})

	// Set expiration in the past
	expiredTime := time.Now().Add(-1 * time.Hour)
	db.Model(&AppCredential{}).Where("id = ?", cred.ID).Update("expires_at", expiredTime)

	// Should not validate
	_, _, err := service.ValidateCredential(cred.PublicKey, secret)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "expirada")
}
