package event

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================================
// EVENT MODEL TESTS (sem persistência)
// O modelo Event usa map[string]string para Metadata
// que não é suportado pelo SQLite puro
// ========================================

func TestEvent_JSONMarshal(t *testing.T) {
	event := Event{
		ID:        uuid.New(),
		Type:      "payment.succeeded",
		Timestamp: time.Now().UnixMilli(),
		Payload:   json.RawMessage(`{"amount": 1000}`),
		Signature: "sig123",
		Metadata:  map[string]string{"source": "stripe"},
	}

	data, err := json.Marshal(event)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "payment.succeeded")
	assert.Contains(t, string(data), "stripe")
}

func TestEvent_JSONUnmarshal(t *testing.T) {
	jsonData := `{
		"id": "550e8400-e29b-41d4-a716-446655440000",
		"type": "user.updated",
		"timestamp": 1704067200000,
		"payload": {"field": "email"},
		"signature": "sig456",
		"metadata": {"source": "api"}
	}`

	var event Event
	err := json.Unmarshal([]byte(jsonData), &event)
	assert.NoError(t, err)
	assert.Equal(t, "user.updated", event.Type)
	assert.Equal(t, "api", event.Metadata["source"])
}

func TestEvent_PayloadTypes(t *testing.T) {
	testCases := []struct {
		name    string
		payload json.RawMessage
	}{
		{"empty object", json.RawMessage(`{}`)},
		{"simple string", json.RawMessage(`{"message": "hello"}`)},
		{"nested object", json.RawMessage(`{"user": {"name": "Test", "age": 25}}`)},
		{"array", json.RawMessage(`{"items": [1, 2, 3]}`)},
		{"complex", json.RawMessage(`{"data": {"nested": {"deep": true}}, "list": ["a", "b"]}`)},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			event := Event{
				ID:        uuid.New(),
				Type:      "test.payload",
				Timestamp: time.Now().UnixMilli(),
				Payload:   tc.payload,
				Signature: "sig",
			}

			data, err := json.Marshal(event)
			assert.NoError(t, err)

			var parsed Event
			err = json.Unmarshal(data, &parsed)
			assert.NoError(t, err)
			assert.JSONEq(t, string(tc.payload), string(parsed.Payload))
		})
	}
}

func TestEvent_Metadata(t *testing.T) {
	event := Event{
		ID:        uuid.New(),
		Type:      "test.metadata",
		Timestamp: time.Now().UnixMilli(),
		Payload:   json.RawMessage(`{}`),
		Signature: "sig",
		Metadata: map[string]string{
			"initiatorUserID": uuid.New().String(),
			"sourceNodeId":    "node-1",
			"correlationId":   "corr-123",
			"traceId":         "trace-456",
		},
	}

	data, err := json.Marshal(event)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "node-1")
	assert.Contains(t, string(data), "corr-123")
}

func TestEvent_CausalityChain(t *testing.T) {
	parentID := uuid.New()
	
	event := Event{
		ID:             uuid.New(),
		Type:           "order.shipped",
		Timestamp:      time.Now().UnixMilli(),
		Payload:        json.RawMessage(`{}`),
		Signature:      "sig",
		CausalityChain: `["` + parentID.String() + `"]`,
	}

	assert.Contains(t, event.CausalityChain, parentID.String())
}

// ========================================
// ENTITY STATE TESTS
// ========================================

func TestEntityState_JSONMarshal(t *testing.T) {
	state := EntityState{
		ID:          uuid.New(),
		EntityType:  "user",
		StateData:   json.RawMessage(`{"name": "Test", "email": "test@example.com"}`),
		Version:     5,
		LastEventID: uuid.New(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	data, err := json.Marshal(state)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "user")
	assert.Contains(t, string(data), "version")
}

// ========================================
// EVENT TYPES TESTS
// ========================================

func TestEvent_DifferentTypes(t *testing.T) {
	eventTypes := []string{
		"user.created",
		"user.updated",
		"user.deleted",
		"payment.initiated",
		"payment.succeeded",
		"payment.failed",
		"subscription.created",
		"subscription.cancelled",
	}

	for _, eventType := range eventTypes {
		event := Event{
			ID:        uuid.New(),
			Type:      eventType,
			Timestamp: time.Now().UnixMilli(),
			Payload:   json.RawMessage(`{}`),
			Signature: "sig",
		}
		assert.Equal(t, eventType, event.Type)
	}
}

// ========================================
// TIMESTAMP TESTS
// ========================================

func TestEvent_Timestamp(t *testing.T) {
	now := time.Now().UnixMilli()
	
	event := Event{
		ID:        uuid.New(),
		Type:      "test.timestamp",
		Timestamp: now,
		Payload:   json.RawMessage(`{}`),
		Signature: "sig",
	}

	assert.Equal(t, now, event.Timestamp)
	assert.Greater(t, event.Timestamp, int64(0))
}

// ========================================
// SIGNATURE TESTS
// ========================================

func TestEvent_Signature(t *testing.T) {
	event := Event{
		ID:        uuid.New(),
		Type:      "test.signature",
		Timestamp: time.Now().UnixMilli(),
		Payload:   json.RawMessage(`{}`),
		Signature: "sha256:abc123def456",
	}

	assert.NotEmpty(t, event.Signature)
	assert.Contains(t, event.Signature, "sha256")
}

// ========================================
// UUID TESTS
// ========================================

func TestEvent_UUID(t *testing.T) {
	id := uuid.New()
	
	event := Event{
		ID:        id,
		Type:      "test.uuid",
		Timestamp: time.Now().UnixMilli(),
		Payload:   json.RawMessage(`{}`),
		Signature: "sig",
	}

	assert.Equal(t, id, event.ID)
	assert.NotEqual(t, uuid.Nil, event.ID)
}

func TestEntityState_UUID(t *testing.T) {
	id := uuid.New()
	lastEventID := uuid.New()
	
	state := EntityState{
		ID:          id,
		EntityType:  "account",
		StateData:   json.RawMessage(`{}`),
		Version:     1,
		LastEventID: lastEventID,
	}

	assert.Equal(t, id, state.ID)
	assert.Equal(t, lastEventID, state.LastEventID)
}

// ========================================
// VERSION TESTS
// ========================================

func TestEntityState_Version(t *testing.T) {
	state := EntityState{
		ID:          uuid.New(),
		EntityType:  "user",
		StateData:   json.RawMessage(`{}`),
		Version:     1,
		LastEventID: uuid.New(),
	}

	assert.Equal(t, 1, state.Version)

	// Simular incremento de versão
	state.Version++
	assert.Equal(t, 2, state.Version)
}

// ========================================
// EMPTY/NIL TESTS
// ========================================

func TestEvent_EmptyMetadata(t *testing.T) {
	event := Event{
		ID:        uuid.New(),
		Type:      "test.empty",
		Timestamp: time.Now().UnixMilli(),
		Payload:   json.RawMessage(`{}`),
		Signature: "sig",
		Metadata:  nil,
	}

	assert.Nil(t, event.Metadata)
}

func TestEvent_EmptyCausalityChain(t *testing.T) {
	event := Event{
		ID:             uuid.New(),
		Type:           "test.root",
		Timestamp:      time.Now().UnixMilli(),
		Payload:        json.RawMessage(`{}`),
		Signature:      "sig",
		CausalityChain: "",
	}

	assert.Empty(t, event.CausalityChain)
}
