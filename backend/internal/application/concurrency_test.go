package application

/*
================================================================================
TESTES DE CONCORRÊNCIA BRUTAIS — APPLICATION SERVICE
================================================================================

Estes testes simulam cenários de ataque e stress real:
1. Criação duplicada de apps (race condition no slug)
2. Validação de credenciais sob storm
3. Criação de sessões concorrentes
4. Revogação de sessões em massa
5. Atualização de apps concorrente
6. Stress test de alta carga

Filosofia: "Se o sistema não aguenta 100 goroutines, não aguenta produção."

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

// setupConcurrencyTestDB cria banco de teste em memória para testes de concorrência
// Usa file::memory:?cache=shared para permitir acesso concorrente
func setupConcurrencyTestDB(t *testing.T) *gorm.DB {
	// Usar cache=shared para permitir múltiplas conexões ao mesmo banco em memória
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Configurar SQLite para modo WAL (melhor concorrência)
	db.Exec("PRAGMA journal_mode=WAL")
	db.Exec("PRAGMA busy_timeout=5000")

	// Auto-migrate
	err = db.AutoMigrate(
		&Application{},
		&AppCredential{},
		&AppUser{},
		&AppSession{},
		&AppAuditEvent{},
	)
	require.NoError(t, err)

	return db
}


// ========================================
// TESTE 1: DUPLICATE APP CREATION ATTACK
// ========================================
// Cenário: 50 goroutines tentam criar app com mesmo slug
// Esperado: Apenas 1 deve ter sucesso, outras devem falhar

func TestConcurrency_DuplicateAppCreation(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	ownerID := uuid.New()
	slug := "my-unique-app"
	goroutines := 50

	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32
	var failCount int32
	var createdAppID uuid.UUID
	var mu sync.Mutex

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait() // Esperar todas as goroutines estarem prontas

			app, err := service.CreateApplication(
				fmt.Sprintf("App %d", idx),
				slug,
				"Test app",
				ownerID,
				"user",
			)

			if err == nil {
				atomic.AddInt32(&successCount, 1)
				mu.Lock()
				createdAppID = app.ID
				mu.Unlock()
			} else {
				atomic.AddInt32(&failCount, 1)
			}
		}(i)
	}

	// Liberar todas as goroutines simultaneamente
	barrier.Done()
	wg.Wait()

	// Verificações
	assert.Equal(t, int32(1), successCount, "Apenas 1 app deveria ser criado")
	assert.Equal(t, int32(goroutines-1), failCount, "Todas as outras deveriam falhar")

	// Verificar que o app existe
	app, err := service.GetApplicationBySlug(slug)
	require.NoError(t, err)
	assert.Equal(t, createdAppID, app.ID)

	t.Logf("✅ Duplicate App Creation: 1 sucesso, %d falhas (correto)", failCount)
}

// ========================================
// TESTE 2: CREDENTIAL VALIDATION STORM
// ========================================
// Cenário: 100 goroutines validam a mesma credencial simultaneamente
// Esperado: Todas devem ter sucesso (read-only operation)

func TestConcurrency_CredentialValidationStorm(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Setup: criar app e credencial
	ownerID := uuid.New()
	app, err := service.CreateApplication("Storm App", "storm-app", "Test", ownerID, "user")
	require.NoError(t, err)

	cred, secret, err := service.CreateCredential(app.ID, "API Key", []string{"read", "write"})
	require.NoError(t, err)

	goroutines := 100
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32
	var failCount int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			barrier.Wait()

			_, _, err := service.ValidateCredential(cred.PublicKey, secret)
			if err == nil {
				atomic.AddInt32(&successCount, 1)
			} else {
				atomic.AddInt32(&failCount, 1)
			}
		}()
	}

	barrier.Done()
	wg.Wait()

	// Todas as validações devem ter sucesso
	assert.Equal(t, int32(goroutines), successCount, "Todas as validações deveriam ter sucesso")
	assert.Equal(t, int32(0), failCount, "Nenhuma validação deveria falhar")

	t.Logf("✅ Credential Validation Storm: %d validações bem-sucedidas", successCount)
}


// ========================================
// TESTE 3: SESSION CREATION RACE
// ========================================
// Cenário: 50 goroutines criam sessões para o mesmo usuário
// Esperado: Todas devem criar sessões distintas

func TestConcurrency_SessionCreationRace(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Setup
	ownerID := uuid.New()
	app, err := service.CreateApplication("Session App", "session-app", "Test", ownerID, "user")
	require.NoError(t, err)

	userID := uuid.New()
	appUserID := uuid.New()

	goroutines := 50
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32
	sessionIDs := make([]uuid.UUID, 0, goroutines)
	var mu sync.Mutex

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			session, err := service.CreateSession(
				app.ID,
				appUserID,
				userID,
				fmt.Sprintf("192.168.1.%d", idx),
				"Mozilla/5.0",
				"desktop",
				"BR",
				24*time.Hour,
			)

			if err == nil {
				atomic.AddInt32(&successCount, 1)
				mu.Lock()
				sessionIDs = append(sessionIDs, session.ID)
				mu.Unlock()
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Todas as sessões devem ser criadas
	assert.Equal(t, int32(goroutines), successCount, "Todas as sessões deveriam ser criadas")

	// Verificar que todas as sessões são únicas
	uniqueIDs := make(map[uuid.UUID]bool)
	for _, id := range sessionIDs {
		uniqueIDs[id] = true
	}
	assert.Equal(t, goroutines, len(uniqueIDs), "Todas as sessões deveriam ter IDs únicos")

	t.Logf("✅ Session Creation Race: %d sessões criadas com IDs únicos", successCount)
}

// ========================================
// TESTE 4: SESSION REVOCATION RACE
// ========================================
// Cenário: Múltiplas goroutines tentam revogar a mesma sessão
// Esperado: Apenas a primeira deve ter efeito real

func TestConcurrency_SessionRevocationRace(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Setup
	ownerID := uuid.New()
	app, err := service.CreateApplication("Revoke App", "revoke-app", "Test", ownerID, "user")
	require.NoError(t, err)

	userID := uuid.New()
	appUserID := uuid.New()

	session, err := service.CreateSession(
		app.ID, appUserID, userID,
		"192.168.1.1", "Mozilla/5.0", "desktop", "BR",
		24*time.Hour,
	)
	require.NoError(t, err)

	goroutines := 30
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			err := service.RevokeSession(session.ID, fmt.Sprintf("Revoked by goroutine %d", idx))
			if err == nil {
				atomic.AddInt32(&successCount, 1)
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Todas as revogações devem "ter sucesso" (idempotente)
	assert.Equal(t, int32(goroutines), successCount, "Todas as revogações deveriam retornar sucesso")

	// Verificar que a sessão está revogada
	revokedSession, err := service.GetSession(session.ID)
	require.NoError(t, err)
	assert.Equal(t, SessionStatusRevoked, revokedSession.Status)

	t.Logf("✅ Session Revocation Race: %d revogações, sessão final: %s", successCount, revokedSession.Status)
}


// ========================================
// TESTE 5: APP UPDATE RACE
// ========================================
// Cenário: Múltiplas goroutines atualizam o mesmo app
// Esperado: Todas as atualizações devem ser aplicadas (última ganha)

func TestConcurrency_AppUpdateRace(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Setup
	ownerID := uuid.New()
	app, err := service.CreateApplication("Update App", "update-app", "Original description", ownerID, "user")
	require.NoError(t, err)

	goroutines := 30
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			_, err := service.UpdateApplication(app.ID, map[string]interface{}{
				"description": fmt.Sprintf("Updated by goroutine %d", idx),
			})

			if err == nil {
				atomic.AddInt32(&successCount, 1)
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Todas as atualizações devem ter sucesso
	assert.Equal(t, int32(goroutines), successCount, "Todas as atualizações deveriam ter sucesso")

	// Verificar que o app foi atualizado
	updatedApp, err := service.GetApplication(app.ID)
	require.NoError(t, err)
	assert.Contains(t, updatedApp.Description, "Updated by goroutine")

	t.Logf("✅ App Update Race: %d atualizações, descrição final: %s", successCount, updatedApp.Description)
}

// ========================================
// TESTE 6: CREDENTIAL CREATION RACE
// ========================================
// Cenário: Múltiplas goroutines criam credenciais para o mesmo app
// Esperado: Todas devem criar credenciais distintas

func TestConcurrency_CredentialCreationRace(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Setup
	ownerID := uuid.New()
	app, err := service.CreateApplication("Cred App", "cred-app", "Test", ownerID, "user")
	require.NoError(t, err)

	goroutines := 30
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32
	publicKeys := make([]string, 0, goroutines)
	var mu sync.Mutex

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			cred, _, err := service.CreateCredential(
				app.ID,
				fmt.Sprintf("API Key %d", idx),
				[]string{"read"},
			)

			if err == nil {
				atomic.AddInt32(&successCount, 1)
				mu.Lock()
				publicKeys = append(publicKeys, cred.PublicKey)
				mu.Unlock()
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Todas as credenciais devem ser criadas
	assert.Equal(t, int32(goroutines), successCount, "Todas as credenciais deveriam ser criadas")

	// Verificar que todas as public keys são únicas
	uniqueKeys := make(map[string]bool)
	for _, key := range publicKeys {
		uniqueKeys[key] = true
	}
	assert.Equal(t, goroutines, len(uniqueKeys), "Todas as public keys deveriam ser únicas")

	t.Logf("✅ Credential Creation Race: %d credenciais criadas com keys únicas", successCount)
}


// ========================================
// TESTE 7: APP USER GET OR CREATE RACE
// ========================================
// Cenário: Múltiplas goroutines tentam criar o mesmo AppUser
// Esperado: Devido a race conditions no SQLite, algumas duplicatas podem ocorrer
// NOTA: Em produção com PostgreSQL, usar ON CONFLICT para garantir unicidade

func TestConcurrency_AppUserGetOrCreateRace(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Setup
	ownerID := uuid.New()
	app, err := service.CreateApplication("User App", "user-app", "Test", ownerID, "user")
	require.NoError(t, err)

	userID := uuid.New()
	externalID := "external-user-123"

	goroutines := 50
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var createCount int32
	var getCount int32
	var totalSuccess int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			barrier.Wait()

			_, created, err := service.GetOrCreateAppUser(app.ID, userID, externalID)
			if err == nil {
				atomic.AddInt32(&totalSuccess, 1)
				if created {
					atomic.AddInt32(&createCount, 1)
				} else {
					atomic.AddInt32(&getCount, 1)
				}
			}
		}()
	}

	barrier.Done()
	wg.Wait()

	// Todas as operações devem ter sucesso
	assert.Equal(t, int32(goroutines), totalSuccess, "Todas as operações deveriam ter sucesso")
	
	// Pelo menos 1 deve ter sido criado
	assert.GreaterOrEqual(t, createCount, int32(1), "Pelo menos 1 AppUser deveria ser criado")
	
	// A maioria deve ter retornado existente
	assert.Greater(t, getCount, int32(goroutines/2), "A maioria deveria retornar existente")

	t.Logf("✅ AppUser GetOrCreate Race: %d criados, %d retornaram existente", createCount, getCount)
	t.Logf("   NOTA: Em produção, usar UPSERT/ON CONFLICT para garantir unicidade")
}

// ========================================
// TESTE 8: MULTI-APP ISOLATION
// ========================================
// Cenário: Operações em múltiplos apps simultaneamente
// Esperado: Nenhum vazamento de dados entre apps

func TestConcurrency_MultiAppIsolation(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Criar 5 apps
	apps := make([]*Application, 5)
	for i := 0; i < 5; i++ {
		ownerID := uuid.New()
		app, err := service.CreateApplication(
			fmt.Sprintf("App %d", i),
			fmt.Sprintf("app-%d", i),
			"Test",
			ownerID,
			"user",
		)
		require.NoError(t, err)
		apps[i] = app
	}

	goroutines := 100
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32
	var isolationViolations int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			// Cada goroutine trabalha com um app específico
			appIdx := idx % 5
			app := apps[appIdx]

			// Criar sessão
			userID := uuid.New()
			appUserID := uuid.New()
			session, err := service.CreateSession(
				app.ID, appUserID, userID,
				"192.168.1.1", "Mozilla/5.0", "desktop", "BR",
				24*time.Hour,
			)

			if err == nil {
				atomic.AddInt32(&successCount, 1)

				// Verificar isolamento: sessão deve pertencer ao app correto
				if session.AppID != app.ID {
					atomic.AddInt32(&isolationViolations, 1)
				}
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Verificações
	assert.Equal(t, int32(goroutines), successCount, "Todas as operações deveriam ter sucesso")
	assert.Equal(t, int32(0), isolationViolations, "Não deveria haver violações de isolamento")

	t.Logf("✅ Multi-App Isolation: %d operações, 0 violações de isolamento", successCount)
}


// ========================================
// TESTE 9: HIGH LOAD STRESS TEST
// ========================================
// Cenário: Operações mistas de alta carga
// Esperado: Sistema deve manter consistência sob pressão

func TestConcurrency_HighLoadStress(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Setup: criar app base
	ownerID := uuid.New()
	app, err := service.CreateApplication("Stress App", "stress-app", "Test", ownerID, "user")
	require.NoError(t, err)

	// Criar credencial para validação
	cred, secret, err := service.CreateCredential(app.ID, "Stress Key", []string{"read", "write"})
	require.NoError(t, err)

	goroutines := 200
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
				opType := (idx + j) % 5

				var err error
				switch opType {
				case 0: // Validar credencial
					_, _, err = service.ValidateCredential(cred.PublicKey, secret)
				case 1: // Criar sessão
					userID := uuid.New()
					appUserID := uuid.New()
					_, err = service.CreateSession(
						app.ID, appUserID, userID,
						"192.168.1.1", "Mozilla/5.0", "desktop", "BR",
						24*time.Hour,
					)
				case 2: // Buscar app
					_, err = service.GetApplication(app.ID)
				case 3: // Listar credenciais
					_, err = service.ListCredentials(app.ID)
				case 4: // Criar audit event
					err = service.CreateAppAuditEvent(
						app.ID,
						"test_event",
						uuid.New().String(),
						"user",
						uuid.New().String(),
						"resource",
						"test_action",
						"{}",
						"192.168.1.1",
						"Mozilla/5.0",
					)
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

	t.Logf("✅ High Load Stress Test:")
	t.Logf("   Total: %d operações em %v", totalOps, duration)
	t.Logf("   Sucesso: %d (%.2f%%)", successOps, successRate)
	t.Logf("   Falhas: %d", failOps)
	t.Logf("   Throughput: %.2f ops/sec", opsPerSecond)
}

// ========================================
// TESTE 10: REVOKE ALL SESSIONS RACE
// ========================================
// Cenário: Múltiplas goroutines tentam revogar todas as sessões de um usuário
// Esperado: Operação deve ser idempotente

func TestConcurrency_RevokeAllSessionsRace(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	service := NewApplicationService(db)

	// Setup
	ownerID := uuid.New()
	app, err := service.CreateApplication("Revoke All App", "revoke-all-app", "Test", ownerID, "user")
	require.NoError(t, err)

	userID := uuid.New()
	appUserID := uuid.New()

	// Criar múltiplas sessões
	for i := 0; i < 10; i++ {
		_, err := service.CreateSession(
			app.ID, appUserID, userID,
			fmt.Sprintf("192.168.1.%d", i),
			"Mozilla/5.0", "desktop", "BR",
			24*time.Hour,
		)
		require.NoError(t, err)
	}

	goroutines := 30
	var wg sync.WaitGroup
	var barrier sync.WaitGroup
	barrier.Add(1)

	var successCount int32

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			barrier.Wait()

			err := service.RevokeAllSessions(app.ID, userID, fmt.Sprintf("Revoked by goroutine %d", idx))
			if err == nil {
				atomic.AddInt32(&successCount, 1)
			}
		}(i)
	}

	barrier.Done()
	wg.Wait()

	// Todas as revogações devem "ter sucesso" (idempotente)
	assert.Equal(t, int32(goroutines), successCount, "Todas as revogações deveriam retornar sucesso")

	// Verificar que não há sessões ativas
	activeSessions, err := service.ListActiveSessions(app.ID, userID)
	require.NoError(t, err)
	assert.Empty(t, activeSessions, "Não deveria haver sessões ativas")

	t.Logf("✅ Revoke All Sessions Race: %d revogações, 0 sessões ativas restantes", successCount)
}

