package audit

/*
================================================================================
TESTES DE CONCORRÊNCIA BRUTAIS — AUDIT SERVICE
================================================================================

Estes testes simulam cenários de stress real:
1. Log Storm - Múltiplos eventos simultâneos
2. Chain Integrity - Verificar que hash chain não quebra sob concorrência
3. Query Storm - Múltiplas queries simultâneas
4. Sequence Ordering - Verificar que sequências são únicas
5. High Load Stress - Operações mistas de alta carga

Filosofia: "O audit log é sagrado. Se ele quebrar, perdemos a história."

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

// setupConcurrencyAuditDB cria banco de teste em memória para testes de concorrência
func setupConcurrencyAuditDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Configurar SQLite para modo WAL
	db.Exec("PRAGMA journal_mode=WAL")
	db.Exec("PRAGMA busy_timeout=5000")

	// Auto-migrate
	err = db.AutoMigrate(&AuditEvent{})
	require.NoError(t, err)

	return db
}


// ========================================
// TESTE 1: LOG STORM
// ========================================
// Cenário: 100 goroutines logam eventos simultaneamente
// Esperado: Todos os eventos devem ser registrados com sequências únicas

func TestConcurrency_LogStorm(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	goroutines := 100
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32
	var failCount int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			err := service.LogSimple(
				"test.event",
				uuid.New(),
				uuid.New(),
				"user",
				"resource",
				fmt.Sprintf("action_%d", idx),
				"test reason",
			)

			if err == nil {
				atomic.AddInt32(&successCount, 1)
			} else {
				atomic.AddInt32(&failCount, 1)
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Todos os eventos devem ser registrados
	assert.Equal(t, int32(goroutines), successCount, "Todos os eventos deveriam ser registrados")
	assert.Equal(t, int32(0), failCount, "Nenhum evento deveria falhar")

	// Verificar que todos os eventos existem
	var count int64
	db.Model(&AuditEvent{}).Count(&count)
	assert.Equal(t, int64(goroutines), count, "Deveria ter %d eventos no banco", goroutines)

	t.Logf("✅ Log Storm: %d eventos registrados com sucesso", successCount)
}

// ========================================
// TESTE 2: CHAIN INTEGRITY UNDER LOAD
// ========================================
// Cenário: Múltiplos logs simultâneos, depois verificar integridade da cadeia
// Esperado: Cadeia de hashes deve estar íntegra

func TestConcurrency_ChainIntegrityUnderLoad(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	goroutines := 50
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			err := service.LogSimple(
				"chain.test",
				uuid.New(),
				uuid.New(),
				"system",
				"audit",
				fmt.Sprintf("chain_action_%d", idx),
				"chain test",
			)

			if err == nil {
				atomic.AddInt32(&successCount, 1)
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Verificar integridade da cadeia
	valid, err := service.VerifyChain(1, int64(goroutines))
	require.NoError(t, err)
	assert.True(t, valid, "Cadeia de hashes deveria estar íntegra")

	t.Logf("✅ Chain Integrity: %d eventos, cadeia íntegra", successCount)
}

// ========================================
// TESTE 3: SEQUENCE UNIQUENESS
// ========================================
// Cenário: Verificar que sequências são únicas mesmo sob concorrência
// Esperado: Nenhuma sequência duplicada

func TestConcurrency_SequenceUniqueness(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	goroutines := 100
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	sequences := make([]int64, 0, goroutines)
	var mu sync.Mutex

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			event := &AuditEvent{
				Type:       "sequence.test",
				ActorID:    uuid.New(),
				ActorType:  "user",
				TargetID:   uuid.New(),
				TargetType: "resource",
				Action:     fmt.Sprintf("seq_action_%d", idx),
			}

			err := service.Log(event)
			if err == nil {
				mu.Lock()
				sequences = append(sequences, event.Sequence)
				mu.Unlock()
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Verificar unicidade das sequências
	seqMap := make(map[int64]bool)
	duplicates := 0
	for _, seq := range sequences {
		if seqMap[seq] {
			duplicates++
		}
		seqMap[seq] = true
	}

	assert.Equal(t, 0, duplicates, "Não deveria haver sequências duplicadas")
	assert.Equal(t, goroutines, len(seqMap), "Deveria ter %d sequências únicas", goroutines)

	t.Logf("✅ Sequence Uniqueness: %d sequências únicas, 0 duplicatas", len(seqMap))
}


// ========================================
// TESTE 4: QUERY STORM
// ========================================
// Cenário: Múltiplas queries simultâneas enquanto logs acontecem
// Esperado: Queries devem retornar resultados consistentes

func TestConcurrency_QueryStorm(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	// Primeiro, criar alguns eventos
	actorID := uuid.New()
	for i := 0; i < 50; i++ {
		service.LogSimple(
			"query.test",
			actorID,
			uuid.New(),
			"user",
			"resource",
			fmt.Sprintf("action_%d", i),
			"test",
		)
	}

	goroutines := 100
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var querySuccess int32
	var logSuccess int32

	// Metade faz queries, metade faz logs
	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			if idx%2 == 0 {
				// Query
				events, _, err := service.Query(AuditQuery{
					Type:  "query.test",
					Limit: 10,
				})
				if err == nil && len(events) > 0 {
					atomic.AddInt32(&querySuccess, 1)
				}
			} else {
				// Log
				err := service.LogSimple(
					"query.test",
					actorID,
					uuid.New(),
					"user",
					"resource",
					fmt.Sprintf("concurrent_action_%d", idx),
					"concurrent test",
				)
				if err == nil {
					atomic.AddInt32(&logSuccess, 1)
				}
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Verificações
	assert.Greater(t, querySuccess, int32(0), "Deveria ter queries bem-sucedidas")
	assert.Greater(t, logSuccess, int32(0), "Deveria ter logs bem-sucedidos")

	t.Logf("✅ Query Storm: %d queries, %d logs bem-sucedidos", querySuccess, logSuccess)
}

// ========================================
// TESTE 5: MULTI-APP ISOLATION
// ========================================
// Cenário: Eventos de múltiplos apps simultaneamente
// Esperado: Eventos devem estar corretamente associados aos apps

func TestConcurrency_MultiAppIsolation(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	// Criar 5 apps
	apps := make([]uuid.UUID, 5)
	for i := 0; i < 5; i++ {
		apps[i] = uuid.New()
	}

	goroutines := 100
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			appID := apps[idx%5]
			err := service.LogAppEvent(
				&appID,
				"app.event",
				uuid.New(),
				uuid.New(),
				"user",
				"resource",
				fmt.Sprintf("app_action_%d", idx),
				"app test",
			)

			if err == nil {
				atomic.AddInt32(&successCount, 1)
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Verificar que cada app tem ~20 eventos
	for _, appID := range apps {
		events, err := service.GetEventsByApp(appID, 100)
		require.NoError(t, err)
		assert.Greater(t, len(events), 0, "App deveria ter eventos")

		// Verificar que todos os eventos pertencem ao app correto
		for _, event := range events {
			assert.Equal(t, appID, *event.AppID, "Evento deveria pertencer ao app correto")
		}
	}

	t.Logf("✅ Multi-App Isolation: %d eventos distribuídos entre 5 apps", successCount)
}

// ========================================
// TESTE 6: VERIFY CHAIN CONCURRENT
// ========================================
// Cenário: Verificar cadeia enquanto novos eventos são adicionados
// Esperado: Verificação deve funcionar mesmo com writes concorrentes

func TestConcurrency_VerifyChainConcurrent(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	// Criar eventos iniciais
	for i := 0; i < 20; i++ {
		service.LogSimple(
			"verify.test",
			uuid.New(),
			uuid.New(),
			"system",
			"audit",
			fmt.Sprintf("initial_%d", i),
			"initial",
		)
	}

	goroutines := 50
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var verifySuccess int32
	var logSuccess int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			if idx%3 == 0 {
				// Verificar cadeia
				valid, err := service.VerifyChain(1, 20)
				if err == nil && valid {
					atomic.AddInt32(&verifySuccess, 1)
				}
			} else {
				// Adicionar evento
				err := service.LogSimple(
					"verify.test",
					uuid.New(),
					uuid.New(),
					"system",
					"audit",
					fmt.Sprintf("concurrent_%d", idx),
					"concurrent",
				)
				if err == nil {
					atomic.AddInt32(&logSuccess, 1)
				}
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Verificações
	assert.Greater(t, verifySuccess, int32(0), "Deveria ter verificações bem-sucedidas")
	assert.Greater(t, logSuccess, int32(0), "Deveria ter logs bem-sucedidos")

	// Verificação final da cadeia completa
	var count int64
	db.Model(&AuditEvent{}).Count(&count)
	valid, err := service.VerifyChain(1, count)
	require.NoError(t, err)
	assert.True(t, valid, "Cadeia final deveria estar íntegra")

	t.Logf("✅ Verify Chain Concurrent: %d verificações, %d logs, cadeia íntegra", verifySuccess, logSuccess)
}


// ========================================
// TESTE 7: HIGH LOAD STRESS TEST
// ========================================
// Cenário: Operações mistas de alta carga
// Esperado: Sistema deve manter consistência sob pressão

func TestConcurrency_HighLoadStress(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	goroutines := 100
	operationsPerGoroutine := 50
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var totalOps int64
	var successOps int64
	var failOps int64

	startTime := time.Now()

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			for j := 0; j < operationsPerGoroutine; j++ {
				atomic.AddInt64(&totalOps, 1)
				opType := (idx + j) % 4

				var err error
				switch opType {
				case 0: // Log simples
					err = service.LogSimple(
						"stress.test",
						uuid.New(),
						uuid.New(),
						"user",
						"resource",
						"stress_action",
						"stress test",
					)
				case 1: // Log com dados
					err = service.LogWithData(
						"stress.data",
						uuid.New(),
						uuid.New(),
						"user",
						"resource",
						"data_action",
						map[string]any{"before": "old"},
						map[string]any{"after": "new"},
						map[string]any{"meta": "data"},
						"data test",
					)
				case 2: // Query
					_, _, err = service.Query(AuditQuery{
						Type:  "stress.test",
						Limit: 10,
					})
				case 3: // Get recent
					_, err = service.GetRecentEvents(10)
				}

				if err == nil {
					atomic.AddInt64(&successOps, 1)
				} else {
					atomic.AddInt64(&failOps, 1)
				}
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	duration := time.Since(startTime)
	opsPerSecond := float64(totalOps) / duration.Seconds()

	// Verificações
	assert.Greater(t, successOps, int64(0), "Deveria ter operações bem-sucedidas")

	// Taxa de sucesso deve ser alta (>95%)
	successRate := float64(successOps) / float64(totalOps) * 100
	assert.Greater(t, successRate, 95.0, "Taxa de sucesso deveria ser >95%%")

	// Verificar integridade final
	var count int64
	db.Model(&AuditEvent{}).Count(&count)
	valid, err := service.VerifyChain(1, count)
	require.NoError(t, err)
	assert.True(t, valid, "Cadeia final deveria estar íntegra")

	t.Logf("✅ High Load Stress Test:")
	t.Logf("   Total: %d operações em %v", totalOps, duration)
	t.Logf("   Sucesso: %d (%.2f%%)", successOps, successRate)
	t.Logf("   Falhas: %d", failOps)
	t.Logf("   Throughput: %.2f ops/sec", opsPerSecond)
	t.Logf("   Eventos no banco: %d", count)
	t.Logf("   Cadeia íntegra: %v", valid)
}

// ========================================
// TESTE 8: HASH COLLISION RESISTANCE
// ========================================
// Cenário: Criar muitos eventos e verificar que não há colisões de hash
// Esperado: Todos os hashes devem ser únicos

func TestConcurrency_HashCollisionResistance(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	goroutines := 100
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	hashes := make([]string, 0, goroutines)
	var mu sync.Mutex

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			event := &AuditEvent{
				Type:       "hash.test",
				ActorID:    uuid.New(),
				ActorType:  "user",
				TargetID:   uuid.New(),
				TargetType: "resource",
				Action:     fmt.Sprintf("hash_action_%d_%d", idx, time.Now().UnixNano()),
			}

			err := service.Log(event)
			if err == nil {
				mu.Lock()
				hashes = append(hashes, event.Hash)
				mu.Unlock()
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Verificar unicidade dos hashes
	hashMap := make(map[string]bool)
	collisions := 0
	for _, hash := range hashes {
		if hashMap[hash] {
			collisions++
		}
		hashMap[hash] = true
	}

	assert.Equal(t, 0, collisions, "Não deveria haver colisões de hash")
	assert.Equal(t, goroutines, len(hashMap), "Deveria ter %d hashes únicos", goroutines)

	t.Logf("✅ Hash Collision Resistance: %d hashes únicos, 0 colisões", len(hashMap))
}

// ========================================
// TESTE 9: ACTOR QUERY CONCURRENT
// ========================================
// Cenário: Múltiplas queries por ator enquanto novos eventos são adicionados
// Esperado: Queries devem retornar eventos corretos do ator

func TestConcurrency_ActorQueryConcurrent(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	// Criar ator específico
	actorID := uuid.New()

	// Criar eventos iniciais para o ator
	for i := 0; i < 20; i++ {
		service.LogSimple(
			"actor.test",
			actorID,
			uuid.New(),
			"user",
			"resource",
			fmt.Sprintf("actor_action_%d", i),
			"actor test",
		)
	}

	goroutines := 50
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var querySuccess int32
	var logSuccess int32
	var wrongActorCount int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			if idx%2 == 0 {
				// Query por ator
				events, err := service.GetEventsByActor(actorID, 50)
				if err == nil {
					atomic.AddInt32(&querySuccess, 1)
					// Verificar que todos os eventos são do ator correto
					for _, event := range events {
						if event.ActorID != actorID {
							atomic.AddInt32(&wrongActorCount, 1)
						}
					}
				}
			} else {
				// Adicionar evento do ator
				err := service.LogSimple(
					"actor.test",
					actorID,
					uuid.New(),
					"user",
					"resource",
					fmt.Sprintf("concurrent_actor_%d", idx),
					"concurrent",
				)
				if err == nil {
					atomic.AddInt32(&logSuccess, 1)
				}
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Verificações
	assert.Greater(t, querySuccess, int32(0), "Deveria ter queries bem-sucedidas")
	assert.Greater(t, logSuccess, int32(0), "Deveria ter logs bem-sucedidos")
	assert.Equal(t, int32(0), wrongActorCount, "Não deveria retornar eventos de outros atores")

	t.Logf("✅ Actor Query Concurrent: %d queries, %d logs, 0 eventos de outros atores", querySuccess, logSuccess)
}

// ========================================
// TESTE 10: TIMESTAMP ORDERING
// ========================================
// Cenário: Verificar que timestamps são ordenados corretamente
// Esperado: Eventos com sequência maior devem ter timestamp >= anterior

func TestConcurrency_TimestampOrdering(t *testing.T) {
	db := setupConcurrencyAuditDB(t)
	service := NewAuditService(db)

	goroutines := 50
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			service.LogSimple(
				"timestamp.test",
				uuid.New(),
				uuid.New(),
				"user",
				"resource",
				fmt.Sprintf("ts_action_%d", idx),
				"timestamp test",
			)
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Buscar todos os eventos ordenados por sequência
	var events []AuditEvent
	db.Order("sequence ASC").Find(&events)

	// Verificar ordenação de timestamps
	outOfOrder := 0
	for i := 1; i < len(events); i++ {
		if events[i].CreatedAt.Before(events[i-1].CreatedAt) {
			outOfOrder++
		}
	}

	// Permitir pequena margem de erro devido a clock skew
	maxOutOfOrder := len(events) / 10 // 10% de tolerância
	assert.LessOrEqual(t, outOfOrder, maxOutOfOrder, "Timestamps deveriam estar majoritariamente ordenados")

	t.Logf("✅ Timestamp Ordering: %d eventos, %d fora de ordem (tolerância: %d)", len(events), outOfOrder, maxOutOfOrder)
}

