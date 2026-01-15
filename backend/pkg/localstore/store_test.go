package localstore

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to connect to test db: %v", err)
	}
	return db
}

func TestLocalStore_Write(t *testing.T) {
	localDB := setupTestDB(t)
	remoteDB := setupTestDB(t) // Simula Neon com SQLite em memória

	store, err := New(localDB, remoteDB, DefaultConfig())
	if err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	ctx := context.Background()

	// Escrever evento
	id, err := store.Write(ctx, "test.event", "app-123", `{"key": "value"}`)
	if err != nil {
		t.Fatalf("failed to write event: %v", err)
	}

	if id == "" {
		t.Error("expected non-empty ID")
	}

	// Verificar que foi salvo localmente
	var event LocalEvent
	err = localDB.First(&event, "id = ?", id).Error
	if err != nil {
		t.Fatalf("event not found in local db: %v", err)
	}

	if event.SyncStatus != StatusPending {
		t.Errorf("expected status pending, got %s", event.SyncStatus)
	}
}

func TestLocalStore_Stats(t *testing.T) {
	localDB := setupTestDB(t)
	remoteDB := setupTestDB(t)

	store, err := New(localDB, remoteDB, DefaultConfig())
	if err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	ctx := context.Background()

	// Escrever alguns eventos
	for i := 0; i < 5; i++ {
		_, err := store.Write(ctx, "test.event", "app-123", `{}`)
		if err != nil {
			t.Fatalf("failed to write event: %v", err)
		}
	}

	stats, err := store.Stats(ctx)
	if err != nil {
		t.Fatalf("failed to get stats: %v", err)
	}

	if stats.Pending != 5 {
		t.Errorf("expected 5 pending, got %d", stats.Pending)
	}

	if stats.Total != 5 {
		t.Errorf("expected 5 total, got %d", stats.Total)
	}
}

func TestLocalStore_SyncBatch(t *testing.T) {
	localDB := setupTestDB(t)
	remoteDB := setupTestDB(t)

	// Migrar tabela no "remoto" também
	remoteDB.AutoMigrate(&LocalEvent{})

	store, err := New(localDB, remoteDB, Config{
		SyncInterval: 100 * time.Millisecond,
		BatchSize:    10,
		MaxRetries:   3,
	})
	if err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	ctx := context.Background()

	// Escrever eventos
	for i := 0; i < 3; i++ {
		_, err := store.Write(ctx, "test.event", "app-123", `{"i": `+string(rune('0'+i))+`}`)
		if err != nil {
			t.Fatalf("failed to write event: %v", err)
		}
	}

	// Forçar sync
	store.syncBatch()

	// Verificar que foram sincronizados
	stats, _ := store.Stats(ctx)
	if stats.Confirmed != 3 {
		t.Errorf("expected 3 confirmed, got %d", stats.Confirmed)
	}

	// Verificar no "remoto"
	var count int64
	remoteDB.Model(&LocalEvent{}).Count(&count)
	if count != 3 {
		t.Errorf("expected 3 events in remote, got %d", count)
	}
}

func TestTelemetryAdapter(t *testing.T) {
	localDB := setupTestDB(t)
	remoteDB := setupTestDB(t)

	store, _ := New(localDB, remoteDB, DefaultConfig())
	adapter := NewTelemetryAdapter(store)

	ctx := context.Background()

	// Track event
	id, err := adapter.TrackEvent(ctx, "app-123", TelemetryPayload{
		EventName: "button.click",
		EventData: map[string]interface{}{"button": "submit"},
	})
	if err != nil {
		t.Fatalf("failed to track event: %v", err)
	}

	if id == "" {
		t.Error("expected non-empty ID")
	}

	// Track session
	_, err = adapter.TrackSessionStart(ctx, "app-123", "session-1", "user-1")
	if err != nil {
		t.Fatalf("failed to track session start: %v", err)
	}

	_, err = adapter.TrackSessionEnd(ctx, "app-123", "session-1", 5000, 10)
	if err != nil {
		t.Fatalf("failed to track session end: %v", err)
	}

	stats, _ := store.Stats(ctx)
	if stats.Total != 3 {
		t.Errorf("expected 3 events, got %d", stats.Total)
	}
}

func TestAuditAdapter(t *testing.T) {
	localDB := setupTestDB(t)
	remoteDB := setupTestDB(t)

	store, _ := New(localDB, remoteDB, DefaultConfig())
	adapter := NewAuditAdapter(store)

	ctx := context.Background()

	id, err := adapter.Log(ctx, "app-123", AuditPayload{
		Action:       "user.login",
		ActorID:      "user-1",
		ActorType:    "user",
		IPAddress:    "192.168.1.1",
	})
	if err != nil {
		t.Fatalf("failed to log audit: %v", err)
	}

	if id == "" {
		t.Error("expected non-empty ID")
	}
}

func TestMain(m *testing.M) {
	os.Exit(m.Run())
}
