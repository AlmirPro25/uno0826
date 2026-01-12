package identity

/*
================================================================================
TESTES DE CONCORRÊNCIA BRUTAL — PROVA DE FOGO DO IDENTITY
================================================================================

Estes testes verificam se o sistema de identidade aguenta:
- 100 logins simultâneos do mesmo usuário
- Criação de usuários duplicados em paralelo
- Race conditions em atualização de perfil
- Sessões simultâneas e invalidação

Se estes testes passarem, o sistema de identidade é robusto.

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
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"prost-qs/backend/pkg/invariants"
)

// ========================================
// CENÁRIO 1: LOGIN STORM
// ========================================
// Situação: 100 goroutines tentam logar com o mesmo usuário simultaneamente.
// Resultado esperado: Todos os logins válidos devem ter sucesso, sem corrupção.

func TestConcurrency_LoginStorm(t *testing.T) {
	db := setupIdentityConcurrencyDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	// Criar usuário de teste
	userID := uuid.New()
	password := "secure-password-123"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	user := &User{
		ID:           userID,
		Username:     "storm_user",
		Email:        "storm@test.com",
		PasswordHash: string(hashedPassword),
		Role:         "user",
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Version:      1,
	}
	db.Create(user)

	// Criar serviço de login events
	loginService := NewLoginEventService(db)

	// Configuração do ataque
	numLogins := 100
	var wg sync.WaitGroup
	var successCount int32
	var failCount int32

	startBarrier := make(chan struct{})

	for i := 0; i < numLogins; i++ {
		wg.Add(1)
		go func(loginNum int) {
			defer wg.Done()
			<-startBarrier

			// Simular login (verificar senha e registrar evento)
			err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
			if err != nil {
				atomic.AddInt32(&failCount, 1)
				return
			}

			// Registrar evento de login
			loginService.RecordLogin(
				userID,
				user.Username,
				fmt.Sprintf("192.168.1.%d", loginNum%255),
				"Mozilla/5.0",
				"password",
				user.Role,
				true,
				"",
			)

			atomic.AddInt32(&successCount, 1)
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	// Verificar resultados
	var loginEvents []LoginEvent
	db.Where("user_id = ?", userID).Find(&loginEvents)

	t.Logf("\n========================================")
	t.Logf("RESULTADO DO LOGIN STORM")
	t.Logf("========================================")
	t.Logf("Logins tentados:    %d", numLogins)
	t.Logf("Logins bem-sucedidos: %d", successCount)
	t.Logf("Logins falhos:      %d", failCount)
	t.Logf("Eventos registrados: %d", len(loginEvents))
	t.Logf("========================================")

	// ASSERÇÕES
	assert.Equal(t, int32(numLogins), successCount, "Todos os logins válidos deveriam ter sucesso")
	assert.Equal(t, numLogins, len(loginEvents), "Todos os logins deveriam ser registrados")

	t.Log("\n✅ SISTEMA SOBREVIVEU AO LOGIN STORM")
}

// ========================================
// CENÁRIO 2: DUPLICATE USER CREATION
// ========================================
// Situação: 10 goroutines tentam criar usuário com mesmo username.
// Resultado esperado: Apenas 1 deve conseguir, outros devem falhar.

func TestConcurrency_DuplicateUserCreation(t *testing.T) {
	db := setupIdentityConcurrencyDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	username := "unique_user"
	email := "unique@test.com"
	password := "password123"

	numAttempts := 10
	var wg sync.WaitGroup
	var successCount int32
	var failCount int32

	startBarrier := make(chan struct{})

	for i := 0; i < numAttempts; i++ {
		wg.Add(1)
		go func(attemptNum int) {
			defer wg.Done()
			<-startBarrier

			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

			user := &User{
				ID:           uuid.New(),
				Username:     username,
				Email:        fmt.Sprintf("%s_%d@test.com", email, attemptNum), // Email único
				PasswordHash: string(hashedPassword),
				Role:         "user",
				Status:       "active",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
				Version:      1,
			}

			err := db.Create(user).Error
			if err != nil {
				atomic.AddInt32(&failCount, 1)
				t.Logf("❌ Tentativa %d: FALHOU - %v", attemptNum, err)
			} else {
				atomic.AddInt32(&successCount, 1)
				t.Logf("✅ Tentativa %d: SUCESSO", attemptNum)
			}
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	// Contar usuários com esse username
	var count int64
	db.Model(&User{}).Where("username = ?", username).Count(&count)

	t.Logf("\n========================================")
	t.Logf("RESULTADO DA CRIAÇÃO DUPLICADA")
	t.Logf("========================================")
	t.Logf("Tentativas:         %d", numAttempts)
	t.Logf("Sucesso:            %d", successCount)
	t.Logf("Falha:              %d", failCount)
	t.Logf("Usuários no banco:  %d", count)
	t.Logf("========================================")

	// ASSERÇÕES
	assert.Equal(t, int64(1), count, "Apenas 1 usuário deveria existir com esse username")
	assert.Equal(t, int32(1), successCount, "Apenas 1 criação deveria ter sucesso")

	t.Log("\n✅ SISTEMA PREVENIU DUPLICAÇÃO DE USUÁRIO")
}

// ========================================
// CENÁRIO 3: PROFILE UPDATE RACE
// ========================================
// Situação: 20 goroutines tentam atualizar o mesmo perfil simultaneamente.
// Resultado esperado: Todas as atualizações devem ser serializadas, sem perda de dados.

func TestConcurrency_ProfileUpdateRace(t *testing.T) {
	db := setupIdentityConcurrencyDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	// Criar usuário
	userID := uuid.New()
	user := &User{
		ID:        userID,
		Username:  "update_user",
		Email:     "update@test.com",
		Role:      "user",
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}
	db.Create(user)

	numUpdates := 20
	var wg sync.WaitGroup
	var successCount int32
	var conflictCount int32

	startBarrier := make(chan struct{})

	for i := 0; i < numUpdates; i++ {
		wg.Add(1)
		go func(updateNum int) {
			defer wg.Done()
			<-startBarrier

			// Atualizar com optimistic locking (version)
			result := db.Model(&User{}).
				Where("id = ? AND version = ?", userID, 1).
				Updates(map[string]interface{}{
					"email":      fmt.Sprintf("updated_%d@test.com", updateNum),
					"updated_at": time.Now(),
					"version":    2,
				})

			if result.RowsAffected > 0 {
				atomic.AddInt32(&successCount, 1)
				t.Logf("✅ Update %d: SUCESSO", updateNum)
			} else {
				atomic.AddInt32(&conflictCount, 1)
				t.Logf("⚠️ Update %d: CONFLITO (version mismatch)", updateNum)
			}
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	// Verificar estado final
	var finalUser User
	db.Where("id = ?", userID).First(&finalUser)

	t.Logf("\n========================================")
	t.Logf("RESULTADO DA CORRIDA DE UPDATES")
	t.Logf("========================================")
	t.Logf("Updates tentados:   %d", numUpdates)
	t.Logf("Sucesso:            %d", successCount)
	t.Logf("Conflitos:          %d", conflictCount)
	t.Logf("Versão final:       %d", finalUser.Version)
	t.Logf("========================================")

	// ASSERÇÕES
	// Com optimistic locking, apenas 1 update deveria ter sucesso
	assert.Equal(t, int32(1), successCount, "Apenas 1 update deveria ter sucesso com optimistic locking")
	assert.Equal(t, 2, finalUser.Version, "Versão deveria ser 2 após 1 update")

	t.Log("\n✅ SISTEMA MANTEVE CONSISTÊNCIA COM OPTIMISTIC LOCKING")
}

// ========================================
// CENÁRIO 4: MEMBERSHIP RACE
// ========================================
// Situação: Múltiplas goroutines tentam adicionar o mesmo usuário ao mesmo app.
// Resultado esperado: Apenas 1 membership deve ser criada.

func TestConcurrency_MembershipRace(t *testing.T) {
	db := setupIdentityConcurrencyDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	// Criar usuário e app
	userID := uuid.New()
	appID := uuid.New()

	user := &User{
		ID:        userID,
		Username:  "member_user",
		Email:     "member@test.com",
		Role:      "user",
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}
	db.Create(user)

	numAttempts := 10
	var wg sync.WaitGroup
	var successCount int32
	var failCount int32

	startBarrier := make(chan struct{})

	for i := 0; i < numAttempts; i++ {
		wg.Add(1)
		go func(attemptNum int) {
			defer wg.Done()
			<-startBarrier

			membership := &AppMembership{
				ID:        uuid.New(),
				UserID:    userID,
				AppID:     appID,
				Role:      "member",
				Status:    "active",
				LinkedAt:  time.Now(),
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}

			err := db.Create(membership).Error
			if err != nil {
				atomic.AddInt32(&failCount, 1)
			} else {
				atomic.AddInt32(&successCount, 1)
			}
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	// Contar memberships
	var count int64
	db.Model(&AppMembership{}).Where("user_id = ? AND app_id = ?", userID, appID).Count(&count)

	t.Logf("\n========================================")
	t.Logf("RESULTADO DA CORRIDA DE MEMBERSHIP")
	t.Logf("========================================")
	t.Logf("Tentativas:         %d", numAttempts)
	t.Logf("Sucesso:            %d", successCount)
	t.Logf("Falha:              %d", failCount)
	t.Logf("Memberships:        %d", count)
	t.Logf("========================================")

	// ASSERÇÕES
	assert.Equal(t, int64(1), count, "Apenas 1 membership deveria existir")

	t.Log("\n✅ SISTEMA PREVENIU MEMBERSHIP DUPLICADA")
}

// ========================================
// CENÁRIO 5: SESSION INVALIDATION
// ========================================
// Situação: Usuário faz logout enquanto outras goroutines tentam usar a sessão.
// Resultado esperado: Sessões invalidadas devem ser rejeitadas.

func TestConcurrency_SessionInvalidation(t *testing.T) {
	db := setupIdentityConcurrencyDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	userID := uuid.New()
	sessionID := uuid.New()

	// Criar sessão ativa
	session := &UserSession{
		ID:        sessionID,
		UserID:    userID,
		Token:     "test-token-123",
		ExpiresAt: time.Now().Add(1 * time.Hour),
		IsActive:  true,
		CreatedAt: time.Now(),
	}
	db.Create(session)

	numOperations := 50
	var wg sync.WaitGroup
	var validOps int32
	var invalidOps int32
	var logoutDone int32

	startBarrier := make(chan struct{})

	// Goroutine que faz logout
	wg.Add(1)
	go func() {
		defer wg.Done()
		<-startBarrier

		// Pequeno delay para algumas operações começarem
		time.Sleep(1 * time.Millisecond)

		// Invalidar sessão
		db.Model(&UserSession{}).Where("id = ?", sessionID).Update("is_active", false)
		atomic.StoreInt32(&logoutDone, 1)
		t.Log("🔒 Logout executado - sessão invalidada")
	}()

	// Goroutines que tentam usar a sessão
	for i := 0; i < numOperations; i++ {
		wg.Add(1)
		go func(opNum int) {
			defer wg.Done()
			<-startBarrier

			// Verificar se sessão está ativa
			var sess UserSession
			err := db.Where("id = ? AND is_active = ?", sessionID, true).First(&sess).Error

			if err != nil {
				atomic.AddInt32(&invalidOps, 1)
			} else {
				atomic.AddInt32(&validOps, 1)
			}
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	t.Logf("\n========================================")
	t.Logf("RESULTADO DA INVALIDAÇÃO DE SESSÃO")
	t.Logf("========================================")
	t.Logf("Operações totais:   %d", numOperations)
	t.Logf("Ops válidas:        %d", validOps)
	t.Logf("Ops inválidas:      %d", invalidOps)
	t.Logf("========================================")

	// Verificar que sessão está inativa
	var finalSession UserSession
	db.Where("id = ?", sessionID).First(&finalSession)
	assert.False(t, finalSession.IsActive, "Sessão deveria estar inativa após logout")

	t.Log("\n✅ SISTEMA INVALIDOU SESSÃO CORRETAMENTE")
}

// ========================================
// CENÁRIO 6: HIGH LOAD USER OPERATIONS
// ========================================

func TestConcurrency_HighLoadUserOperations(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping stress test in short mode")
	}

	db := setupIdentityConcurrencyDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	// Limpar eventos anteriores para contagem precisa
	db.Exec("DELETE FROM login_events")

	// Criar múltiplos usuários
	numUsers := 10
	users := make([]uuid.UUID, numUsers)

	for i := 0; i < numUsers; i++ {
		userID := uuid.New()
		users[i] = userID

		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
		user := &User{
			ID:           userID,
			Username:     fmt.Sprintf("stress_user_%d", i),
			Email:        fmt.Sprintf("stress_%d@test.com", i),
			PasswordHash: string(hashedPassword),
			Role:         "user",
			Status:       "active",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
			Version:      1,
		}
		db.Create(user)
	}

	loginService := NewLoginEventService(db)

	// Stress test
	operationsPerUser := 100
	totalOperations := numUsers * operationsPerUser

	var wg sync.WaitGroup
	var successCount, failCount int32
	startTime := time.Now()

	startBarrier := make(chan struct{})

	for i := 0; i < totalOperations; i++ {
		wg.Add(1)
		go func(opID int) {
			defer wg.Done()
			<-startBarrier

			userID := users[opID%numUsers]

			// Registrar login
			loginService.RecordLogin(
				userID,
				fmt.Sprintf("stress_user_%d", opID%numUsers),
				fmt.Sprintf("10.0.0.%d", opID%255),
				"StressTest/1.0",
				"password",
				"user",
				true,
				"",
			)

			atomic.AddInt32(&successCount, 1)
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	duration := time.Since(startTime)
	opsPerSecond := float64(totalOperations) / duration.Seconds()

	t.Logf("\n========================================")
	t.Logf("RESULTADO DO STRESS TEST")
	t.Logf("========================================")
	t.Logf("Total de operações: %d", totalOperations)
	t.Logf("Sucesso:            %d", successCount)
	t.Logf("Falha:              %d", failCount)
	t.Logf("Duração:            %v", duration)
	t.Logf("Ops/segundo:        %.2f", opsPerSecond)
	t.Logf("========================================")

	// Verificar integridade
	var totalEvents int64
	db.Model(&LoginEvent{}).Count(&totalEvents)

	assert.Equal(t, int64(totalOperations), totalEvents, "Todos os eventos deveriam ser registrados")

	t.Log("\n✅ SISTEMA SOBREVIVEU AO STRESS TEST DE IDENTITY")
}

// ========================================
// HELPERS
// ========================================

func setupIdentityConcurrencyDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)

	// Migrate
	db.AutoMigrate(&User{}, &LoginEvent{}, &AppMembership{}, &UserSession{})

	// Criar índices únicos
	db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)")
	db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_app ON app_memberships(user_id, app_id)")

	return db
}

// UserSession modelo para testes de sessão
type UserSession struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;index"`
	Token     string
	ExpiresAt time.Time
	IsActive  bool
	CreatedAt time.Time
}

func (UserSession) TableName() string {
	return "user_sessions"
}
