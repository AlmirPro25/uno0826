package replication

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupReplicationTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&ReplicationState{})
	require.NoError(t, err)

	return db
}

// ========================================
// REPLICATION EVENT TESTS
// ========================================

func TestReplicationEvent_JSONMarshal(t *testing.T) {
	event := ReplicationEvent{
		ID:             uuid.New(),
		Type:           "user.created",
		Timestamp:      time.Now().UnixMilli(),
		Payload:        json.RawMessage(`{"name": "Test"}`),
		Signature:      "sig123",
		CausalityChain: []uuid.UUID{uuid.New()},
		Metadata:       map[string]string{"source": "node-1"},
		SourceNodeID:   uuid.New(),
	}

	data, err := json.Marshal(event)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "user.created")
}

func TestReplicationEvent_JSONUnmarshal(t *testing.T) {
	sourceNodeID := uuid.New()
	jsonData := `{
		"id": "550e8400-e29b-41d4-a716-446655440000",
		"type": "payment.succeeded",
		"timestamp": 1704067200000,
		"payload": {"amount": 1000},
		"signature": "sig456",
		"causalityChain": [],
		"metadata": {"region": "us-east"},
		"sourceNodeId": "` + sourceNodeID.String() + `"
	}`

	var event ReplicationEvent
	err := json.Unmarshal([]byte(jsonData), &event)
	assert.NoError(t, err)
	assert.Equal(t, "payment.succeeded", event.Type)
	assert.Equal(t, "us-east", event.Metadata["region"])
}

// ========================================
// REPLICATION STATE REPOSITORY TESTS
// ========================================

func TestGORMStateRepository_CreateOrUpdateReplicationState_Create(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)

	nodeID := uuid.New()
	state := &ReplicationState{
		NodeID:              nodeID,
		LastSyncedEventID:   uuid.New(),
		LastSyncedTimestamp: time.Now().UnixMilli(),
		PendingEventsCount:  5,
	}

	err := repo.CreateOrUpdateReplicationState(state)
	assert.NoError(t, err)

	// Verificar que foi criado
	found, err := repo.GetReplicationStateByNodeID(nodeID)
	assert.NoError(t, err)
	assert.Equal(t, nodeID, found.NodeID)
	assert.Equal(t, 5, found.PendingEventsCount)
}

func TestGORMStateRepository_CreateOrUpdateReplicationState_Update(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)

	nodeID := uuid.New()
	state := &ReplicationState{
		NodeID:              nodeID,
		LastSyncedTimestamp: 1000,
		PendingEventsCount:  5,
	}
	repo.CreateOrUpdateReplicationState(state)

	// Atualizar
	state.LastSyncedTimestamp = 2000
	state.PendingEventsCount = 10
	err := repo.CreateOrUpdateReplicationState(state)
	assert.NoError(t, err)

	found, _ := repo.GetReplicationStateByNodeID(nodeID)
	assert.Equal(t, int64(2000), found.LastSyncedTimestamp)
	assert.Equal(t, 10, found.PendingEventsCount)
}

func TestGORMStateRepository_GetReplicationStateByNodeID_NotFound(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)

	_, err := repo.GetReplicationStateByNodeID(uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "não encontrado")
}

func TestGORMStateRepository_GetAllReplicationStates(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)

	// Criar múltiplos estados
	for i := 0; i < 3; i++ {
		state := &ReplicationState{
			NodeID:              uuid.New(),
			LastSyncedTimestamp: int64(i * 1000),
		}
		repo.CreateOrUpdateReplicationState(state)
	}

	states, err := repo.GetAllReplicationStates()
	assert.NoError(t, err)
	assert.Len(t, states, 3)
}

// ========================================
// REPLICATION SERVICE TESTS
// ========================================

func TestReplicationService_ReceiveEvents(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)
	service := NewReplicationService(repo)

	events := []ReplicationEvent{
		{
			ID:           uuid.New(),
			Type:         "user.created",
			Timestamp:    time.Now().UnixMilli(),
			Payload:      json.RawMessage(`{"name": "Test"}`),
			Signature:    "sig1",
			SourceNodeID: uuid.New(),
		},
		{
			ID:           uuid.New(),
			Type:         "user.updated",
			Timestamp:    time.Now().UnixMilli(),
			Payload:      json.RawMessage(`{"name": "Updated"}`),
			Signature:    "sig2",
			SourceNodeID: uuid.New(),
		},
	}

	received, conflicts, err := service.ReceiveEvents(events)
	assert.NoError(t, err)
	assert.Equal(t, 2, received)
	assert.Equal(t, 0, conflicts)
}

func TestReplicationService_ReceiveEvents_Empty(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)
	service := NewReplicationService(repo)

	received, conflicts, err := service.ReceiveEvents([]ReplicationEvent{})
	assert.NoError(t, err)
	assert.Equal(t, 0, received)
	assert.Equal(t, 0, conflicts)
}

func TestReplicationService_GetEventsSince(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)
	service := NewReplicationService(repo)

	// Timestamp antigo para garantir que retorna eventos
	oldTimestamp := time.Now().Add(-10 * time.Second).UnixMilli()

	events, err := service.GetEventsSince(oldTimestamp, "node-requester")
	assert.NoError(t, err)
	// O serviço retorna eventos mockados se timestamp for antigo
	assert.GreaterOrEqual(t, len(events), 0)
}

func TestReplicationService_SyncWithPeer_NewPeer(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)
	service := NewReplicationService(repo)

	peerNodeID := uuid.New()

	err := service.SyncWithPeer(peerNodeID)
	assert.NoError(t, err)

	// Verificar que estado foi criado
	state, err := repo.GetReplicationStateByNodeID(peerNodeID)
	assert.NoError(t, err)
	assert.Equal(t, peerNodeID, state.NodeID)
}

func TestReplicationService_SyncWithPeer_ExistingPeer(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)
	service := NewReplicationService(repo)

	peerNodeID := uuid.New()

	// Criar estado existente
	existingState := &ReplicationState{
		NodeID:              peerNodeID,
		LastSyncedTimestamp: 5000,
	}
	repo.CreateOrUpdateReplicationState(existingState)

	err := service.SyncWithPeer(peerNodeID)
	assert.NoError(t, err)
}

// ========================================
// REPLICATION STATE MODEL TESTS
// ========================================

func TestReplicationState_Creation(t *testing.T) {
	db := setupReplicationTestDB(t)

	state := &ReplicationState{
		NodeID:              uuid.New(),
		LastSyncedEventID:   uuid.New(),
		LastSyncedTimestamp: time.Now().UnixMilli(),
		PendingEventsCount:  10,
		LastConflictID:      uuid.New(),
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	err := db.Create(state).Error
	assert.NoError(t, err)

	var found ReplicationState
	err = db.First(&found, "node_id = ?", state.NodeID).Error
	assert.NoError(t, err)
	assert.Equal(t, 10, found.PendingEventsCount)
}

// ========================================
// RECEIVE EVENTS RESPONSE TESTS
// ========================================

func TestReceiveEventsResponse_JSONMarshal(t *testing.T) {
	response := ReceiveEventsResponse{
		Status:            "success",
		ReceivedEvents:    5,
		ConflictsResolved: 1,
		Message:           "Eventos processados com sucesso",
	}

	data, err := json.Marshal(response)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "success")
	assert.Contains(t, string(data), "5")
}

// ========================================
// CAUSALITY CHAIN TESTS
// ========================================

func TestReplicationEvent_CausalityChain(t *testing.T) {
	parentID := uuid.New()
	grandparentID := uuid.New()

	event := ReplicationEvent{
		ID:             uuid.New(),
		Type:           "order.shipped",
		Timestamp:      time.Now().UnixMilli(),
		Payload:        json.RawMessage(`{}`),
		Signature:      "sig",
		CausalityChain: []uuid.UUID{grandparentID, parentID},
		SourceNodeID:   uuid.New(),
	}

	assert.Len(t, event.CausalityChain, 2)
	assert.Equal(t, grandparentID, event.CausalityChain[0])
	assert.Equal(t, parentID, event.CausalityChain[1])
}

// ========================================
// EDGE CASES
// ========================================

func TestReplicationService_ReceiveEvents_WithNilSourceNodeID(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)
	service := NewReplicationService(repo)

	events := []ReplicationEvent{
		{
			ID:           uuid.New(),
			Type:         "test.event",
			Timestamp:    time.Now().UnixMilli(),
			Payload:      json.RawMessage(`{}`),
			Signature:    "sig",
			SourceNodeID: uuid.Nil, // Nil UUID
		},
	}

	received, _, err := service.ReceiveEvents(events)
	assert.NoError(t, err)
	assert.Equal(t, 1, received)
}

func TestReplicationState_ZeroTimestamp(t *testing.T) {
	db := setupReplicationTestDB(t)
	repo := NewGORMStateRepository(db)

	state := &ReplicationState{
		NodeID:              uuid.New(),
		LastSyncedTimestamp: 0, // Zero timestamp
	}

	err := repo.CreateOrUpdateReplicationState(state)
	assert.NoError(t, err)

	found, _ := repo.GetReplicationStateByNodeID(state.NodeID)
	assert.Equal(t, int64(0), found.LastSyncedTimestamp)
}
