// Package localstore implementa Write-Ahead Log local com sync assíncrono para Neon.
// Padrão: Local-first write + async upstream sync
// Uso: Logs, telemetria, auditoria, eventos - dados append-only
package localstore

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SyncStatus representa o estado de sincronização de um registro
type SyncStatus string

const (
	StatusPending   SyncStatus = "pending"   // Aguardando sync
	StatusSyncing   SyncStatus = "syncing"   // Em processo de sync
	StatusConfirmed SyncStatus = "confirmed" // Confirmado pelo Neon
	StatusFailed    SyncStatus = "failed"    // Falhou (vai para retry)
)

// LocalEvent é o modelo base para eventos locais
// Todos os eventos herdam deste modelo
type LocalEvent struct {
	ID          string     `gorm:"primaryKey;type:text"`
	EventType   string     `gorm:"index;not null"`
	AppID       string     `gorm:"index"`
	Payload     string     `gorm:"type:text"` // JSON
	CreatedAt   time.Time  `gorm:"index;not null"`
	SyncStatus  SyncStatus `gorm:"index;default:'pending'"`
	SyncedAt    *time.Time
	SyncRetries int       `gorm:"default:0"`
	LastError   string    `gorm:"type:text"`
}

// TableName define o nome da tabela
func (LocalEvent) TableName() string {
	return "local_events"
}

// LocalStore gerencia o armazenamento local com sync assíncrono
type LocalStore struct {
	localDB  *gorm.DB // SQLite local
	remoteDB *gorm.DB // Neon/Postgres remoto
	
	syncInterval time.Duration
	batchSize    int
	maxRetries   int
	
	stopCh   chan struct{}
	wg       sync.WaitGroup
	mu       sync.RWMutex
	running  bool
}

// Config configura o LocalStore
type Config struct {
	SyncInterval time.Duration // Intervalo entre syncs (default: 5s)
	BatchSize    int           // Eventos por batch (default: 100)
	MaxRetries   int           // Máximo de retries (default: 5)
}

// DefaultConfig retorna configuração padrão
func DefaultConfig() Config {
	return Config{
		SyncInterval: 5 * time.Second,
		BatchSize:    100,
		MaxRetries:   5,
	}
}

// New cria um novo LocalStore
func New(localDB, remoteDB *gorm.DB, cfg Config) (*LocalStore, error) {
	if cfg.SyncInterval == 0 {
		cfg.SyncInterval = 5 * time.Second
	}
	if cfg.BatchSize == 0 {
		cfg.BatchSize = 100
	}
	if cfg.MaxRetries == 0 {
		cfg.MaxRetries = 5
	}

	// Migrar schema local
	if err := localDB.AutoMigrate(&LocalEvent{}); err != nil {
		return nil, err
	}

	return &LocalStore{
		localDB:      localDB,
		remoteDB:     remoteDB,
		syncInterval: cfg.SyncInterval,
		batchSize:    cfg.BatchSize,
		maxRetries:   cfg.MaxRetries,
		stopCh:       make(chan struct{}),
	}, nil
}

// Write escreve um evento localmente (rápido, sem latência de rede)
func (s *LocalStore) Write(ctx context.Context, eventType, appID string, payload string) (string, error) {
	event := LocalEvent{
		ID:         uuid.NewString(),
		EventType:  eventType,
		AppID:      appID,
		Payload:    payload,
		CreatedAt:  time.Now().UTC(),
		SyncStatus: StatusPending,
	}

	if err := s.localDB.WithContext(ctx).Create(&event).Error; err != nil {
		return "", err
	}

	return event.ID, nil
}

// Start inicia o worker de sincronização
func (s *LocalStore) Start() {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return
	}
	s.running = true
	s.mu.Unlock()

	s.wg.Add(1)
	go s.syncWorker()
	log.Println("[LocalStore] Sync worker iniciado")
}

// Stop para o worker de sincronização
func (s *LocalStore) Stop() {
	s.mu.Lock()
	if !s.running {
		s.mu.Unlock()
		return
	}
	s.running = false
	s.mu.Unlock()

	close(s.stopCh)
	s.wg.Wait()
	log.Println("[LocalStore] Sync worker parado")
}

// syncWorker é o loop principal de sincronização
func (s *LocalStore) syncWorker() {
	defer s.wg.Done()

	ticker := time.NewTicker(s.syncInterval)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopCh:
			// Sync final antes de parar
			s.syncBatch()
			return
		case <-ticker.C:
			s.syncBatch()
		}
	}
}

// syncBatch sincroniza um lote de eventos pendentes
func (s *LocalStore) syncBatch() {
	ctx := context.Background()

	// Buscar eventos pendentes
	var events []LocalEvent
	err := s.localDB.WithContext(ctx).
		Where("sync_status IN ?", []SyncStatus{StatusPending, StatusFailed}).
		Where("sync_retries < ?", s.maxRetries).
		Order("created_at ASC").
		Limit(s.batchSize).
		Find(&events).Error

	if err != nil {
		log.Printf("[LocalStore] Erro ao buscar eventos: %v", err)
		return
	}

	if len(events) == 0 {
		return
	}

	log.Printf("[LocalStore] Sincronizando %d eventos...", len(events))

	// Marcar como syncing
	ids := make([]string, len(events))
	for i, e := range events {
		ids[i] = e.ID
	}
	s.localDB.Model(&LocalEvent{}).
		Where("id IN ?", ids).
		Update("sync_status", StatusSyncing)

	now := time.Now().UTC()

	// Enviar para Neon em transação
	err = s.remoteDB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, event := range events {
			// Upsert idempotente - se já existe, ignora
			// Usa GORM para compatibilidade SQLite/Postgres
			remoteEvent := LocalEvent{
				ID:         event.ID,
				EventType:  event.EventType,
				AppID:      event.AppID,
				Payload:    event.Payload,
				CreatedAt:  event.CreatedAt,
				SyncStatus: StatusConfirmed,
				SyncedAt:   &now,
			}
			
			// Tenta criar, ignora se já existe (idempotente)
			result := tx.Create(&remoteEvent)
			if result.Error != nil {
				// Ignora erro de duplicata (já existe)
				if result.RowsAffected == 0 {
					continue
				}
				return result.Error
			}
		}
		return nil
	})
	if err != nil {
		// Falhou - incrementar retry
		log.Printf("[LocalStore] Erro no sync: %v", err)
		s.localDB.Model(&LocalEvent{}).
			Where("id IN ?", ids).
			Updates(map[string]interface{}{
				"sync_status":  StatusFailed,
				"sync_retries": gorm.Expr("sync_retries + 1"),
				"last_error":   err.Error(),
			})
		return
	}

	// Sucesso - marcar como confirmado
	s.localDB.Model(&LocalEvent{}).
		Where("id IN ?", ids).
		Updates(map[string]interface{}{
			"sync_status": StatusConfirmed,
			"synced_at":   now,
		})

	log.Printf("[LocalStore] %d eventos sincronizados com sucesso", len(events))
}

// Stats retorna estatísticas do store
type Stats struct {
	Pending   int64
	Syncing   int64
	Confirmed int64
	Failed    int64
	Total     int64
}

func (s *LocalStore) Stats(ctx context.Context) (Stats, error) {
	var stats Stats
	
	s.localDB.WithContext(ctx).Model(&LocalEvent{}).
		Where("sync_status = ?", StatusPending).Count(&stats.Pending)
	s.localDB.WithContext(ctx).Model(&LocalEvent{}).
		Where("sync_status = ?", StatusSyncing).Count(&stats.Syncing)
	s.localDB.WithContext(ctx).Model(&LocalEvent{}).
		Where("sync_status = ?", StatusConfirmed).Count(&stats.Confirmed)
	s.localDB.WithContext(ctx).Model(&LocalEvent{}).
		Where("sync_status = ?", StatusFailed).Count(&stats.Failed)
	s.localDB.WithContext(ctx).Model(&LocalEvent{}).Count(&stats.Total)

	return stats, nil
}

// Cleanup remove eventos confirmados mais antigos que a duração especificada
func (s *LocalStore) Cleanup(ctx context.Context, olderThan time.Duration) (int64, error) {
	cutoff := time.Now().UTC().Add(-olderThan)
	result := s.localDB.WithContext(ctx).
		Where("sync_status = ?", StatusConfirmed).
		Where("synced_at < ?", cutoff).
		Delete(&LocalEvent{})
	
	return result.RowsAffected, result.Error
}
