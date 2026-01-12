package events

import (
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&Event{})
	return db
}

func TestEventService_Emit(t *testing.T) {
	db := setupTestDB(t)
	service := NewEventService(db)

	appID := uuid.New()
	userID := uuid.New()

	// Emitir evento
	service.Emit(appID, EventUserCreated, map[string]interface{}{
		"user_id": userID.String(),
		"email":   "test@example.com",
		"name":    "Test User",
	}, "identity", &userID)

	// Verificar persistência
	events, err := service.GetRecentEvents(appID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 1)
	assert.Equal(t, string(EventUserCreated), events[0].Type)
	assert.Equal(t, appID, events[0].AppID)
	assert.Equal(t, "identity", events[0].Source)
}

func TestEventService_Subscribe(t *testing.T) {
	db := setupTestDB(t)
	service := NewEventService(db)

	appID := uuid.New()
	userID := uuid.New()

	// Contador para verificar se listener foi chamado
	var called bool
	var mu sync.Mutex

	// Registrar listener
	service.Subscribe(EventUserLogin, func(event Event) {
		mu.Lock()
		called = true
		mu.Unlock()
	})

	// Emitir evento
	service.Emit(appID, EventUserLogin, map[string]interface{}{
		"user_id": userID.String(),
		"email":   "test@example.com",
	}, "auth", &userID)

	// Aguardar listener (é async)
	time.Sleep(100 * time.Millisecond)

	mu.Lock()
	assert.True(t, called, "Listener deveria ter sido chamado")
	mu.Unlock()
}

func TestEventService_HelperFunctions(t *testing.T) {
	db := setupTestDB(t)
	service := NewEventService(db)

	appID := uuid.New()
	userID := uuid.New()

	// Testar UserCreated
	service.UserCreated(appID, userID, "test@example.com", "Test User")

	events, err := service.GetRecentEvents(appID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 1)
	assert.Equal(t, string(EventUserCreated), events[0].Type)

	// Testar UserLogin
	service.UserLogin(appID, userID, "test@example.com", "127.0.0.1", "Mozilla/5.0")

	events, err = service.GetRecentEvents(appID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 2)

	// Testar MFAEnabled
	service.MFAEnabled(appID, userID)

	events, err = service.GetRecentEvents(appID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 3)
}

func TestEventService_GetUserEvents(t *testing.T) {
	db := setupTestDB(t)
	service := NewEventService(db)

	appID := uuid.New()
	userID := uuid.New()
	otherUserID := uuid.New()

	// Emitir eventos para diferentes usuários
	service.UserLogin(appID, userID, "user1@example.com", "127.0.0.1", "Chrome")
	service.UserLogin(appID, otherUserID, "user2@example.com", "127.0.0.1", "Firefox")
	service.UserLogout(appID, userID, "session-123")

	// Buscar eventos do primeiro usuário
	events, err := service.GetUserEvents(userID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 2) // login + logout

	// Buscar eventos do segundo usuário
	events, err = service.GetUserEvents(otherUserID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 1) // apenas login
}

func TestEventService_MultipleListeners(t *testing.T) {
	db := setupTestDB(t)
	service := NewEventService(db)

	appID := uuid.New()
	userID := uuid.New()

	var count int
	var mu sync.Mutex

	// Registrar múltiplos listeners
	for i := 0; i < 3; i++ {
		service.Subscribe(EventUserCreated, func(event Event) {
			mu.Lock()
			count++
			mu.Unlock()
		})
	}

	// Emitir evento
	service.UserCreated(appID, userID, "test@example.com", "Test")

	// Aguardar listeners
	time.Sleep(100 * time.Millisecond)

	mu.Lock()
	assert.Equal(t, 3, count, "Todos os 3 listeners deveriam ter sido chamados")
	mu.Unlock()
}

func TestEventService_PaymentEvents(t *testing.T) {
	db := setupTestDB(t)
	service := NewEventService(db)

	appID := uuid.New()
	userID := uuid.New()

	// Testar PaymentSucceeded
	service.PaymentSucceeded(appID, userID, 9900, "BRL")

	events, err := service.GetRecentEvents(appID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 1)
	assert.Equal(t, string(EventPaymentSucceeded), events[0].Type)
	assert.Contains(t, events[0].Payload, "9900")
	assert.Contains(t, events[0].Payload, "BRL")

	// Testar PaymentFailed
	service.PaymentFailed(appID, userID, 9900, "card_declined")

	events, err = service.GetRecentEvents(appID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 2)
}

func TestEventService_AlertTriggered(t *testing.T) {
	db := setupTestDB(t)
	service := NewEventService(db)

	appID := uuid.New()

	// Testar AlertTriggered (sem userID)
	service.AlertTriggered(appID, "high_error_rate", "critical", "Taxa de erro acima de 5%")

	events, err := service.GetRecentEvents(appID, 10)
	require.NoError(t, err)
	assert.Len(t, events, 1)
	assert.Equal(t, string(EventAlertTriggered), events[0].Type)
	assert.Nil(t, events[0].UserID) // Alertas de sistema não têm userID
}
