package telemetry

/*
================================================================================
TESTES DE CONCORRÊNCIA BRUTAIS — TELEMETRY SERVICE
================================================================================

Estes testes verificam que o sistema de telemetria:
1. Processa eventos concorrentes sem perda
2. Mantém sessões consistentes sob carga
3. Atualiza métricas corretamente
4. Isola dados entre apps
5. Não cria sessões zumbi

Se estes testes falharem, há risco de:
- Perda de eventos
- Métricas incorretas
- Sessões fantasma
- Vazamento de dados entre apps

================================================================================
*/

import (
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupTelemetryConcurrencyDB cria banco em memória compartilhado para testes de concorrência
func setupTelemetryConcurrencyDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Migrar modelos
	err = db.AutoMigrate(&AppSession{}, &TelemetryEvent{}, &AppMetricsSnapshot{}, &AlertHistory{})
	require.NoError(t, err)

	return db
}

// ========================================
// TESTE 1: INGESTÃO DE EVENTOS EM MASSA
// ========================================

func TestConcurrent_EventIngestion_Storm(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	appID := uuid.New()
	numGoroutines := 50
	eventsPerGoroutine := 100
	
	var wg sync.WaitGroup
	var successCount int64
	barrier := make(chan struct{})
	
	// Ingerir eventos concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			userID := uuid.New()
			sessionID := uuid.New()
			
			for j := 0; j < eventsPerGoroutine; j++ {
				event := TelemetryEvent{
					ID:         uuid.New(),
					AppID:      appID,
					UserID:     userID,
					SessionID:  sessionID,
					Type:       fmt.Sprintf("test.event.%d", j%10),
					Feature:    "test_feature",
					Context:    fmt.Sprintf(`{"worker":%d,"iteration":%d}`, workerID, j),
					Timestamp:  time.Now(),
					IngestedAt: time.Now(),
				}
				
				if err := db.Create(&event).Error; err == nil {
					atomic.AddInt64(&successCount, 1)
				}
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar resultados
	var totalEvents int64
	db.Model(&TelemetryEvent{}).Where("app_id = ?", appID).Count(&totalEvents)
	
	expectedTotal := int64(numGoroutines * eventsPerGoroutine)
	assert.Equal(t, expectedTotal, successCount, "Todos os eventos deveriam ser criados")
	assert.Equal(t, expectedTotal, totalEvents, "Contagem no banco deveria bater")
	
	opsPerSec := float64(successCount) / duration.Seconds()
	t.Logf("✅ Ingestão de eventos: %d eventos em %v (%.0f ops/sec)", successCount, duration, opsPerSec)
}

// ========================================
// TESTE 2: CRIAÇÃO DE SESSÕES CONCORRENTE
// ========================================

func TestConcurrent_SessionCreation_Storm(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	appID := uuid.New()
	numGoroutines := 50
	sessionsPerGoroutine := 20
	
	var wg sync.WaitGroup
	var successCount int64
	barrier := make(chan struct{})
	
	// Criar sessões concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < sessionsPerGoroutine; j++ {
				session := AppSession{
					ID:             uuid.New(),
					AppID:          appID,
					UserID:         uuid.New(),
					StartedAt:      time.Now(),
					LastSeenAt:     time.Now(),
					IPAddress:      fmt.Sprintf("192.168.%d.%d", workerID%256, j%256),
					UserAgent:      fmt.Sprintf("TestAgent/%d.%d", workerID, j),
					CurrentFeature: "test",
					EventCount:     0,
					CreatedAt:      time.Now(),
					UpdatedAt:      time.Now(),
				}
				
				if err := db.Create(&session).Error; err == nil {
					atomic.AddInt64(&successCount, 1)
				}
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar resultados
	var totalSessions int64
	db.Model(&AppSession{}).Where("app_id = ?", appID).Count(&totalSessions)
	
	expectedTotal := int64(numGoroutines * sessionsPerGoroutine)
	assert.Equal(t, expectedTotal, successCount, "Todas as sessões deveriam ser criadas")
	assert.Equal(t, expectedTotal, totalSessions, "Contagem no banco deveria bater")
	
	opsPerSec := float64(successCount) / duration.Seconds()
	t.Logf("✅ Criação de sessões: %d sessões em %v (%.0f ops/sec)", successCount, duration, opsPerSec)
}

// ========================================
// TESTE 3: ATUALIZAÇÃO DE SESSÃO (HEARTBEAT)
// ========================================

func TestConcurrent_SessionHeartbeat_Race(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	appID := uuid.New()
	
	// Criar sessão inicial
	session := AppSession{
		ID:         uuid.New(),
		AppID:      appID,
		UserID:     uuid.New(),
		StartedAt:  time.Now(),
		LastSeenAt: time.Now(),
		EventCount: 0,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	require.NoError(t, db.Create(&session).Error)
	
	numGoroutines := 100
	var wg sync.WaitGroup
	var updateCount int64
	barrier := make(chan struct{})
	
	// Atualizar sessão concorrentemente (simula heartbeats)
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			<-barrier
			
			db.Model(&AppSession{}).Where("id = ?", session.ID).Updates(map[string]interface{}{
				"last_seen_at": time.Now(),
				"event_count":  gorm.Expr("event_count + 1"),
				"updated_at":   time.Now(),
			})
			atomic.AddInt64(&updateCount, 1)
		}(i)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar estado final
	var finalSession AppSession
	require.NoError(t, db.First(&finalSession, "id = ?", session.ID).Error)
	
	assert.Equal(t, int64(numGoroutines), updateCount, "Todas as atualizações deveriam completar")
	assert.Equal(t, numGoroutines, finalSession.EventCount, "Event count deveria ser incrementado corretamente")
	
	t.Logf("✅ Heartbeat concorrente: %d atualizações, event_count final: %d", updateCount, finalSession.EventCount)
}

// ========================================
// TESTE 4: ISOLAMENTO MULTI-APP
// ========================================

func TestConcurrent_MultiApp_Isolation(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	numApps := 10
	eventsPerApp := 100
	appIDs := make([]uuid.UUID, numApps)
	
	for i := 0; i < numApps; i++ {
		appIDs[i] = uuid.New()
	}
	
	var wg sync.WaitGroup
	barrier := make(chan struct{})
	
	// Criar eventos para cada app concorrentemente
	for appIdx, appID := range appIDs {
		wg.Add(1)
		go func(idx int, id uuid.UUID) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < eventsPerApp; j++ {
				event := TelemetryEvent{
					ID:         uuid.New(),
					AppID:      id,
					UserID:     uuid.New(),
					SessionID:  uuid.New(),
					Type:       fmt.Sprintf("app_%d.event", idx),
					Timestamp:  time.Now(),
					IngestedAt: time.Now(),
				}
				db.Create(&event)
			}
		}(appIdx, appID)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar isolamento
	for i, appID := range appIDs {
		var count int64
		db.Model(&TelemetryEvent{}).Where("app_id = ?", appID).Count(&count)
		assert.Equal(t, int64(eventsPerApp), count, 
			"App %d deveria ter exatamente %d eventos", i, eventsPerApp)
		
		// Verificar que não há eventos de outros apps
		var events []TelemetryEvent
		db.Where("app_id = ?", appID).Find(&events)
		for _, event := range events {
			assert.Equal(t, appID, event.AppID, "Evento deveria pertencer ao app correto")
			assert.Contains(t, event.Type, fmt.Sprintf("app_%d", i), "Tipo deveria conter ID do app")
		}
	}
	
	t.Logf("✅ Isolamento verificado: %d apps com %d eventos cada", numApps, eventsPerApp)
}

// ========================================
// TESTE 5: SNAPSHOT DE MÉTRICAS CONCORRENTE
// ========================================

func TestConcurrent_MetricsSnapshot_Race(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	appID := uuid.New()
	
	// Criar snapshot inicial
	snapshot := AppMetricsSnapshot{
		ID:           uuid.New(),
		AppID:        appID,
		TotalUsers:   0,
		TotalEvents:  0,
		OnlineNow:    0,
		UpdatedAt:    time.Now(),
	}
	require.NoError(t, db.Create(&snapshot).Error)
	
	numGoroutines := 100
	var wg sync.WaitGroup
	barrier := make(chan struct{})
	
	// Atualizar métricas concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			<-barrier
			
			db.Model(&AppMetricsSnapshot{}).Where("app_id = ?", appID).Updates(map[string]interface{}{
				"total_events": gorm.Expr("total_events + 1"),
				"online_now":   idx % 10,
				"updated_at":   time.Now(),
			})
		}(i)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar estado final
	var finalSnapshot AppMetricsSnapshot
	require.NoError(t, db.Where("app_id = ?", appID).First(&finalSnapshot).Error)
	
	assert.Equal(t, int64(numGoroutines), finalSnapshot.TotalEvents, "Total events deveria ser incrementado corretamente")
	
	t.Logf("✅ Snapshot concorrente: total_events final: %d", finalSnapshot.TotalEvents)
}


// ========================================
// TESTE 6: ALERTAS CONCORRENTES
// ========================================

func TestConcurrent_AlertCreation_Storm(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	appID := uuid.New()
	numGoroutines := 30
	alertsPerGoroutine := 20
	
	var wg sync.WaitGroup
	var successCount int64
	barrier := make(chan struct{})
	
	// Criar alertas concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < alertsPerGoroutine; j++ {
				alert := AlertHistory{
					ID:        uuid.New(),
					AppID:     appID,
					Type:      fmt.Sprintf("test_alert_%d", j%5),
					Severity:  []string{"info", "warning", "critical"}[j%3],
					Title:     fmt.Sprintf("Test Alert W%d-A%d", workerID, j),
					Message:   "Test alert message",
					Data:      fmt.Sprintf(`{"worker":%d,"alert":%d}`, workerID, j),
					Source:    "test",
					CreatedAt: time.Now(),
				}
				
				if err := db.Create(&alert).Error; err == nil {
					atomic.AddInt64(&successCount, 1)
				}
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar resultados
	var totalAlerts int64
	db.Model(&AlertHistory{}).Where("app_id = ?", appID).Count(&totalAlerts)
	
	expectedTotal := int64(numGoroutines * alertsPerGoroutine)
	assert.Equal(t, expectedTotal, successCount, "Todos os alertas deveriam ser criados")
	
	opsPerSec := float64(successCount) / duration.Seconds()
	t.Logf("✅ Criação de alertas: %d alertas em %v (%.0f ops/sec)", successCount, duration, opsPerSec)
}

// ========================================
// TESTE 7: ENCERRAMENTO DE SESSÕES CONCORRENTE
// ========================================

func TestConcurrent_SessionEnd_Race(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	appID := uuid.New()
	numSessions := 100
	
	// Criar sessões
	sessionIDs := make([]uuid.UUID, numSessions)
	for i := 0; i < numSessions; i++ {
		session := AppSession{
			ID:         uuid.New(),
			AppID:      appID,
			UserID:     uuid.New(),
			StartedAt:  time.Now().Add(-time.Duration(i) * time.Minute),
			LastSeenAt: time.Now(),
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		require.NoError(t, db.Create(&session).Error)
		sessionIDs[i] = session.ID
	}
	
	var wg sync.WaitGroup
	var endCount int64
	barrier := make(chan struct{})
	
	// Encerrar sessões concorrentemente (cada sessão pode ser encerrada por múltiplas goroutines)
	for i := 0; i < numSessions*2; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			<-barrier
			
			sessionID := sessionIDs[idx%numSessions]
			now := time.Now()
			
			result := db.Model(&AppSession{}).
				Where("id = ? AND ended_at IS NULL", sessionID).
				Updates(map[string]interface{}{
					"ended_at":   now,
					"updated_at": now,
				})
			
			if result.RowsAffected > 0 {
				atomic.AddInt64(&endCount, 1)
			}
		}(i)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar que todas as sessões foram encerradas exatamente uma vez
	var openSessions int64
	db.Model(&AppSession{}).Where("app_id = ? AND ended_at IS NULL", appID).Count(&openSessions)
	
	assert.Zero(t, openSessions, "Todas as sessões deveriam estar encerradas")
	assert.Equal(t, int64(numSessions), endCount, "Cada sessão deveria ser encerrada exatamente uma vez")
	
	t.Logf("✅ Encerramento concorrente: %d sessões encerradas, %d abertas", endCount, openSessions)
}

// ========================================
// TESTE 8: QUERY CONCORRENTE
// ========================================

func TestConcurrent_Query_Storm(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	appID := uuid.New()
	numEvents := 500
	
	// Criar eventos
	for i := 0; i < numEvents; i++ {
		event := TelemetryEvent{
			ID:         uuid.New(),
			AppID:      appID,
			UserID:     uuid.New(),
			SessionID:  uuid.New(),
			Type:       fmt.Sprintf("event.type.%d", i%10),
			Feature:    fmt.Sprintf("feature_%d", i%5),
			Timestamp:  time.Now().Add(-time.Duration(i) * time.Second),
			IngestedAt: time.Now(),
		}
		require.NoError(t, db.Create(&event).Error)
	}
	
	numGoroutines := 50
	queriesPerGoroutine := 50
	var wg sync.WaitGroup
	var queryCount int64
	barrier := make(chan struct{})
	
	// Queries concorrentes
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < queriesPerGoroutine; j++ {
				queryType := j % 4
				
				switch queryType {
				case 0: // Buscar todos
					var events []TelemetryEvent
					db.Where("app_id = ?", appID).Limit(100).Find(&events)
					
				case 1: // Buscar por tipo
					var events []TelemetryEvent
					db.Where("app_id = ? AND type = ?", appID, fmt.Sprintf("event.type.%d", j%10)).Find(&events)
					
				case 2: // Buscar por feature
					var events []TelemetryEvent
					db.Where("app_id = ? AND feature = ?", appID, fmt.Sprintf("feature_%d", j%5)).Find(&events)
					
				case 3: // Contar eventos
					var count int64
					db.Model(&TelemetryEvent{}).Where("app_id = ?", appID).Count(&count)
				}
				
				atomic.AddInt64(&queryCount, 1)
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	expectedQueries := int64(numGoroutines * queriesPerGoroutine)
	assert.Equal(t, expectedQueries, queryCount, "Todas as queries deveriam completar")
	
	opsPerSec := float64(queryCount) / duration.Seconds()
	t.Logf("✅ Query storm: %d queries em %v (%.0f ops/sec)", queryCount, duration, opsPerSec)
}

// ========================================
// TESTE 9: HIGH LOAD STRESS TEST
// ========================================

func TestConcurrent_HighLoad_Stress(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	numApps := 5
	numGoroutines := 20
	operationsPerGoroutine := 100
	
	appIDs := make([]uuid.UUID, numApps)
	for i := 0; i < numApps; i++ {
		appIDs[i] = uuid.New()
	}
	
	var wg sync.WaitGroup
	var totalOps int64
	barrier := make(chan struct{})
	
	// Mix de operações concorrentes
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			appID := appIDs[workerID%numApps]
			
			for j := 0; j < operationsPerGoroutine; j++ {
				op := j % 5
				
				switch op {
				case 0: // Criar evento
					event := TelemetryEvent{
						ID:         uuid.New(),
						AppID:      appID,
						UserID:     uuid.New(),
						SessionID:  uuid.New(),
						Type:       "stress.event",
						Timestamp:  time.Now(),
						IngestedAt: time.Now(),
					}
					db.Create(&event)
					
				case 1: // Criar sessão
					session := AppSession{
						ID:         uuid.New(),
						AppID:      appID,
						UserID:     uuid.New(),
						StartedAt:  time.Now(),
						LastSeenAt: time.Now(),
						CreatedAt:  time.Now(),
						UpdatedAt:  time.Now(),
					}
					db.Create(&session)
					
				case 2: // Atualizar sessão
					var session AppSession
					if db.Where("app_id = ?", appID).First(&session).Error == nil {
						db.Model(&session).Update("last_seen_at", time.Now())
					}
					
				case 3: // Criar alerta
					alert := AlertHistory{
						ID:        uuid.New(),
						AppID:     appID,
						Type:      "stress_alert",
						Severity:  "info",
						Title:     "Stress Test",
						CreatedAt: time.Now(),
					}
					db.Create(&alert)
					
				case 4: // Query
					var count int64
					db.Model(&TelemetryEvent{}).Where("app_id = ?", appID).Count(&count)
				}
				
				atomic.AddInt64(&totalOps, 1)
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar integridade
	for _, appID := range appIDs {
		var eventCount, sessionCount, alertCount int64
		db.Model(&TelemetryEvent{}).Where("app_id = ?", appID).Count(&eventCount)
		db.Model(&AppSession{}).Where("app_id = ?", appID).Count(&sessionCount)
		db.Model(&AlertHistory{}).Where("app_id = ?", appID).Count(&alertCount)
		
		assert.Greater(t, eventCount+sessionCount+alertCount, int64(0), "App deveria ter dados")
	}
	
	opsPerSec := float64(totalOps) / duration.Seconds()
	t.Logf("✅ High load stress: %d operações em %v (%.0f ops/sec)", totalOps, duration, opsPerSec)
}

// ========================================
// TESTE 10: ACKNOWLEDGE ALERTAS CONCORRENTE
// ========================================

func TestConcurrent_AlertAcknowledge_Race(t *testing.T) {
	db := setupTelemetryConcurrencyDB(t)
	
	appID := uuid.New()
	numAlerts := 50
	
	// Criar alertas
	alertIDs := make([]uuid.UUID, numAlerts)
	for i := 0; i < numAlerts; i++ {
		alert := AlertHistory{
			ID:           uuid.New(),
			AppID:        appID,
			Type:         "test_alert",
			Severity:     "warning",
			Title:        fmt.Sprintf("Alert %d", i),
			Acknowledged: false,
			CreatedAt:    time.Now(),
		}
		require.NoError(t, db.Create(&alert).Error)
		alertIDs[i] = alert.ID
	}
	
	var wg sync.WaitGroup
	var ackCount int64
	barrier := make(chan struct{})
	
	// Acknowledge concorrentemente (cada alerta pode ser ack por múltiplas goroutines)
	for i := 0; i < numAlerts*2; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			<-barrier
			
			alertID := alertIDs[idx%numAlerts]
			now := time.Now()
			
			result := db.Model(&AlertHistory{}).
				Where("id = ? AND acknowledged = ?", alertID, false).
				Updates(map[string]interface{}{
					"acknowledged":    true,
					"acknowledged_at": now,
					"acknowledged_by": fmt.Sprintf("user_%d", idx),
				})
			
			if result.RowsAffected > 0 {
				atomic.AddInt64(&ackCount, 1)
			}
		}(i)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar que todos os alertas foram acknowledged exatamente uma vez
	var unackedAlerts int64
	db.Model(&AlertHistory{}).Where("app_id = ? AND acknowledged = ?", appID, false).Count(&unackedAlerts)
	
	assert.Zero(t, unackedAlerts, "Todos os alertas deveriam estar acknowledged")
	assert.Equal(t, int64(numAlerts), ackCount, "Cada alerta deveria ser ack exatamente uma vez")
	
	t.Logf("✅ Acknowledge concorrente: %d alertas ack, %d não ack", ackCount, unackedAlerts)
}
