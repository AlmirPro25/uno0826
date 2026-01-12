package audit

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupAuditTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&AuditEvent{})
	return db
}

func createAuditTestService(t *testing.T, db *gorm.DB) *AuditService {
	return NewAuditService(db)
}

// ===========================================
// LOG TESTS
// ===========================================

func TestLogSimple(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	targetID := uuid.New()
	err := service.LogSimple(EventUserCreated, actorID, targetID, ActorUser, "user", "create", "test reason")
	assert.NoError(t, err)
	events, _ := service.GetRecentEvents(10)
	assert.Len(t, events, 1)
	assert.Equal(t, EventUserCreated, events[0].Type)
}

func TestLogWithData(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	targetID := uuid.New()
	before := map[string]any{"status": "active"}
	after := map[string]any{"status": "suspended"}
	err := service.LogWithData(EventUserSuspended, actorID, targetID, ActorAdmin, "user", "suspend", before, after, nil, "violation")
	assert.NoError(t, err)
	events, _ := service.GetRecentEvents(10)
	assert.Len(t, events, 1)
}

func TestLogWithPolicy(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	targetID := uuid.New()
	policyID := uuid.New()
	err := service.LogWithPolicy(EventPolicyEvaluated, actorID, targetID, ActorSystem, "policy", "evaluate", &policyID, "auto check")
	assert.NoError(t, err)
}

func TestLogWithRequest(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	targetID := uuid.New()
	err := service.LogWithRequest(EventLoginSuccess, actorID, targetID, ActorUser, "session", "login", "192.168.1.1", "Mozilla/5.0", "")
	assert.NoError(t, err)
	events, _ := service.GetRecentEvents(10)
	assert.Equal(t, "192.168.1.1", events[0].IP)
}

func TestLogWithAppContext(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	targetID := uuid.New()
	appID := uuid.New()
	ctx := &AuditContext{AppID: &appID, IP: "10.0.0.1"}
	err := service.LogWithAppContext(ctx, EventUserCreated, actorID, targetID, ActorUser, "user", "create", nil, nil, nil, "")
	assert.NoError(t, err)
	events, _ := service.GetEventsByApp(appID, 10)
	assert.Len(t, events, 1)
}


// ===========================================
// QUERY TESTS
// ===========================================

func TestQuery(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	for i := 0; i < 5; i++ {
		service.LogSimple(EventUserCreated, actorID, uuid.New(), ActorUser, "user", "create", "")
	}
	events, total, err := service.Query(AuditQuery{Limit: 10})
	assert.NoError(t, err)
	assert.Equal(t, int64(5), total)
	assert.Len(t, events, 5)
}

func TestQueryByType(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	service.LogSimple(EventUserCreated, actorID, uuid.New(), ActorUser, "user", "create", "")
	service.LogSimple(EventUserSuspended, actorID, uuid.New(), ActorAdmin, "user", "suspend", "")
	events, total, _ := service.Query(AuditQuery{Type: EventUserCreated, Limit: 10})
	assert.Equal(t, int64(1), total)
	assert.Len(t, events, 1)
}

func TestQueryByActor(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	service.LogSimple(EventUserCreated, actorID, uuid.New(), ActorUser, "user", "create", "")
	service.LogSimple(EventUserCreated, uuid.New(), uuid.New(), ActorUser, "user", "create", "")
	events, total, _ := service.Query(AuditQuery{ActorID: actorID.String(), Limit: 10})
	assert.Equal(t, int64(1), total)
	assert.Len(t, events, 1)
}

func TestGetByID(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	service.LogSimple(EventUserCreated, uuid.New(), uuid.New(), ActorUser, "user", "create", "")
	events, _, _ := service.Query(AuditQuery{Limit: 1})
	event, err := service.GetByID(events[0].ID)
	assert.NoError(t, err)
	assert.Equal(t, events[0].ID, event.ID)
}

func TestGetEventsByActor(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	actorID := uuid.New()
	for i := 0; i < 3; i++ {
		service.LogSimple(EventUserCreated, actorID, uuid.New(), ActorUser, "user", "create", "")
	}
	events, err := service.GetEventsByActor(actorID, 10)
	assert.NoError(t, err)
	assert.Len(t, events, 3)
}

func TestGetEventsByTarget(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	targetID := uuid.New()
	for i := 0; i < 2; i++ {
		service.LogSimple(EventUserCreated, uuid.New(), targetID, ActorUser, "user", "create", "")
	}
	events, err := service.GetEventsByTarget(targetID, 10)
	assert.NoError(t, err)
	assert.Len(t, events, 2)
}

func TestGetRecentEvents(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	for i := 0; i < 10; i++ {
		service.LogSimple(EventUserCreated, uuid.New(), uuid.New(), ActorUser, "user", "create", "")
	}
	events, err := service.GetRecentEvents(5)
	assert.NoError(t, err)
	assert.Len(t, events, 5)
}

// ===========================================
// INTEGRITY TESTS
// ===========================================

func TestHashChain(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	for i := 0; i < 5; i++ {
		service.LogSimple(EventUserCreated, uuid.New(), uuid.New(), ActorUser, "user", "create", "")
	}
	valid, err := service.VerifyChain(1, 5)
	assert.NoError(t, err)
	assert.True(t, valid)
}

func TestGetChainStatus(t *testing.T) {
	db := setupAuditTestDB(t)
	service := createAuditTestService(t, db)
	for i := 0; i < 3; i++ {
		service.LogSimple(EventUserCreated, uuid.New(), uuid.New(), ActorUser, "user", "create", "")
	}
	status, err := service.GetChainStatus()
	assert.NoError(t, err)
	assert.Equal(t, int64(3), status["total_events"])
}

// ===========================================
// MODEL TESTS
// ===========================================

func TestAuditEventTableName(t *testing.T) {
	assert.Equal(t, "audit_events", AuditEvent{}.TableName())
}

func TestComputeHash(t *testing.T) {
	event := &AuditEvent{
		ID:           uuid.New(),
		Type:         EventUserCreated,
		ActorID:      uuid.New(),
		TargetID:     uuid.New(),
		Action:       "create",
		PreviousHash: "genesis",
		CreatedAt:    time.Now(),
	}
	hash := event.ComputeHash()
	assert.NotEmpty(t, hash)
	assert.Len(t, hash, 64)
}

func TestEventTypeConstants(t *testing.T) {
	assert.Equal(t, "USER_CREATED", EventUserCreated)
	assert.Equal(t, "USER_SUSPENDED", EventUserSuspended)
	assert.Equal(t, "LOGIN_SUCCESS", EventLoginSuccess)
	assert.Equal(t, "KILL_SWITCH_ACTIVATED", EventKillSwitchActivated)
}

func TestActorTypeConstants(t *testing.T) {
	assert.Equal(t, "user", ActorUser)
	assert.Equal(t, "agent", ActorAgent)
	assert.Equal(t, "system", ActorSystem)
	assert.Equal(t, "admin", ActorAdmin)
}

func TestJSONDataValue(t *testing.T) {
	data := JSONData{"key": "value"}
	val, err := data.Value()
	assert.NoError(t, err)
	assert.Contains(t, val.(string), "key")
}

func TestJSONDataScan(t *testing.T) {
	var data JSONData
	err := data.Scan([]byte(`{"key":"value"}`))
	assert.NoError(t, err)
	assert.Equal(t, "value", data["key"])
}
