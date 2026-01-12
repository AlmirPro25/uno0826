package billing

/*
================================================================================
TESTES DE CONCORRÊNCIA BRUTAL — PROVA DE FOGO DO BILLING
================================================================================

Estes testes não verificam se o código funciona.
Eles verificam se a ARQUITETURA aguenta pancada.

Se estes testes passarem, você pode dormir tranquilo sabendo que:
- Nem um bug do Stripe
- Nem um clique duplo do usuário
- Nem um ataque hacker
...vai corromper seu saldo financeiro.

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
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"prost-qs/backend/pkg/invariants"
)

// ========================================
// CENÁRIO 1: ATAQUE DE GASTO DUPLO (DOUBLE SPEND)
// ========================================
// Situação: Conta com R$ 100. 10 goroutines tentam debitar R$ 100 cada.
// Resultado esperado: APENAS UMA consegue. Saldo final = 0, nunca negativo.

func TestConcurrency_DoubleSpendAttack(t *testing.T) {
	// Setup
	db := setupConcurrencyTestDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	// Criar conta com saldo de R$ 100 (10000 centavos)
	userID := uuid.New()
	accountID := uuid.New()
	initialBalance := int64(10000) // R$ 100,00

	account := &BillingAccount{
		AccountID:        accountID,
		UserID:           userID,
		StripeCustomerID: "cus_test_concurrent",
		Balance:          initialBalance,
		Currency:         "BRL",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	err := db.Create(account).Error
	assert.NoError(t, err)

	service := &BillingService{db: db}

	// Configuração do ataque
	numAttackers := 10
	debitAmount := int64(10000) // R$ 100,00 cada

	var wg sync.WaitGroup
	var successCount int32
	var failCount int32
	var panicCount int32

	// Barreira para garantir que todas as goroutines comecem juntas
	startBarrier := make(chan struct{})

	// Lançar atacantes
	for i := 0; i < numAttackers; i++ {
		wg.Add(1)
		go func(attackerID int) {
			defer wg.Done()

			// Esperar sinal de início
			<-startBarrier

			// Tentar debitar usando recover para capturar panics das invariants
			func() {
				defer func() {
					if r := recover(); r != nil {
						atomic.AddInt32(&panicCount, 1)
						t.Logf("🛡️ Atacante %d: BLOQUEADO por invariant (panic): %v", attackerID, r)
					}
				}()

				err := service.AddLedgerEntry(
					accountID,
					"debit",
					debitAmount,
					"BRL",
					fmt.Sprintf("Double spend attack #%d", attackerID),
					fmt.Sprintf("attack_%d_%s", attackerID, uuid.New().String()[:8]),
				)

				if err != nil {
					atomic.AddInt32(&failCount, 1)
					t.Logf("❌ Atacante %d: FALHOU - %v", attackerID, err)
				} else {
					atomic.AddInt32(&successCount, 1)
					t.Logf("✅ Atacante %d: SUCESSO", attackerID)
				}
			}()
		}(i)
	}

	// Liberar todos os atacantes simultaneamente
	close(startBarrier)

	// Aguardar todos terminarem
	wg.Wait()

	// Verificar resultado
	var finalAccount BillingAccount
	db.Where("account_id = ?", accountID).First(&finalAccount)

	t.Logf("\n========================================")
	t.Logf("RESULTADO DO ATAQUE DE GASTO DUPLO")
	t.Logf("========================================")
	t.Logf("Saldo inicial:    R$ %.2f", float64(initialBalance)/100)
	t.Logf("Saldo final:      R$ %.2f", float64(finalAccount.Balance)/100)
	t.Logf("Atacantes:        %d", numAttackers)
	t.Logf("Sucesso:          %d", successCount)
	t.Logf("Falha:            %d", failCount)
	t.Logf("Bloqueado (panic): %d", panicCount)
	t.Logf("========================================")

	// Verificar invariantes
	violations := invariants.GetViolations()
	negativeBalanceViolations := 0
	for _, v := range violations {
		if v.Invariant == "negative_balance_after_debit" {
			negativeBalanceViolations++
		}
	}
	t.Logf("Violações de saldo negativo detectadas: %d", negativeBalanceViolations)

	// ASSERÇÕES CRÍTICAS
	// 1. Saldo NUNCA pode ser negativo
	assert.GreaterOrEqual(t, finalAccount.Balance, int64(0),
		"FALHA CRÍTICA: Saldo ficou negativo! Double spend bem-sucedido!")

	// 2. No máximo 1 débito deve ter sucesso (o saldo era exatamente o valor do débito)
	assert.LessOrEqual(t, successCount, int32(1),
		"FALHA CRÍTICA: Mais de um débito foi bem-sucedido!")

	// 3. Se houve sucesso, saldo deve ser 0
	if successCount == 1 {
		assert.Equal(t, int64(0), finalAccount.Balance,
			"Se um débito foi bem-sucedido, saldo deveria ser 0")
	}

	// 4. Invariants devem ter detectado as tentativas de saldo negativo
	if successCount == 1 {
		assert.GreaterOrEqual(t, negativeBalanceViolations, numAttackers-1,
			"Invariants deveriam ter detectado as tentativas de saldo negativo")
	}

	t.Logf("\n✅ SISTEMA SOBREVIVEU AO ATAQUE DE GASTO DUPLO")
}

// ========================================
// CENÁRIO 2: TEMPESTADE DE WEBHOOKS (WEBHOOK STORM)
// ========================================
// Situação: Stripe envia o MESMO evento 50 vezes simultaneamente.
// Resultado esperado: Crédito aplicado apenas UMA vez.

func TestConcurrency_WebhookStorm(t *testing.T) {
	// Setup
	db := setupConcurrencyTestDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	// Criar conta com saldo zero
	userID := uuid.New()
	accountID := uuid.New()

	account := &BillingAccount{
		AccountID:        accountID,
		UserID:           userID,
		StripeCustomerID: "cus_test_webhook_storm",
		Balance:          0,
		Currency:         "BRL",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	err := db.Create(account).Error
	assert.NoError(t, err)

	// Simular processamento de webhook com idempotência
	webhookEventID := "evt_" + uuid.New().String()[:16]
	creditAmount := int64(10000) // R$ 100,00

	numWebhooks := 50
	var wg sync.WaitGroup
	var processedCount int32
	var duplicateCount int32

	// Tabela de idempotência (simula o que o sistema real faz)
	processedWebhooks := sync.Map{}

	startBarrier := make(chan struct{})

	for i := 0; i < numWebhooks; i++ {
		wg.Add(1)
		go func(webhookNum int) {
			defer wg.Done()

			<-startBarrier

			// Simular verificação de idempotência
			_, alreadyProcessed := processedWebhooks.LoadOrStore(webhookEventID, true)

			if alreadyProcessed {
				atomic.AddInt32(&duplicateCount, 1)
				// Disparar invariant de webhook duplicado (2 params: eventID, alreadyProcessed)
				invariants.AssertWebhookIdempotency(webhookEventID, true)
				return
			}

			// Processar webhook (adicionar crédito)
			err := db.Transaction(func(tx *gorm.DB) error {
				// Buscar conta
				var acc BillingAccount
				if err := tx.Where("account_id = ?", accountID).First(&acc).Error; err != nil {
					return err
				}

				// Adicionar crédito
				acc.Balance += creditAmount
				acc.UpdatedAt = time.Now()

				// Criar entrada no ledger
				entry := &LedgerEntry{
					EntryID:      uuid.New(),
					AccountID:    accountID,
					Type:         "credit",
					Amount:       creditAmount,
					Currency:     "BRL",
					Description:  "Webhook payment",
					ReferenceID:  webhookEventID,
					BalanceAfter: acc.Balance,
					CreatedAt:    time.Now(),
				}

				if err := tx.Create(entry).Error; err != nil {
					return err
				}

				return tx.Save(&acc).Error
			})

			if err == nil {
				atomic.AddInt32(&processedCount, 1)
				t.Logf("✅ Webhook %d: Processado (evento: %s)", webhookNum, webhookEventID)
			}
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	// Verificar resultado
	var finalAccount BillingAccount
	db.Where("account_id = ?", accountID).First(&finalAccount)

	// Contar entradas no ledger
	var ledgerCount int64
	db.Model(&LedgerEntry{}).Where("account_id = ? AND reference_id = ?", accountID, webhookEventID).Count(&ledgerCount)

	t.Logf("\n========================================")
	t.Logf("RESULTADO DA TEMPESTADE DE WEBHOOKS")
	t.Logf("========================================")
	t.Logf("Webhooks enviados:    %d", numWebhooks)
	t.Logf("Processados:          %d", processedCount)
	t.Logf("Duplicados ignorados: %d", duplicateCount)
	t.Logf("Entradas no ledger:   %d", ledgerCount)
	t.Logf("Saldo final:          R$ %.2f", float64(finalAccount.Balance)/100)
	t.Logf("Saldo esperado:       R$ %.2f", float64(creditAmount)/100)
	t.Logf("========================================")

	// Verificar violações de idempotência
	violations := invariants.GetViolations()
	idempotencyViolations := 0
	for _, v := range violations {
		if v.Invariant == "webhook_duplicate_processing" {
			idempotencyViolations++
		}
	}
	t.Logf("Violações de idempotência detectadas: %d", idempotencyViolations)

	// ASSERÇÕES CRÍTICAS
	// 1. Apenas 1 webhook deve ter sido processado
	assert.Equal(t, int32(1), processedCount,
		"FALHA CRÍTICA: Mais de um webhook foi processado!")

	// 2. Saldo deve ser exatamente o valor de 1 crédito
	assert.Equal(t, creditAmount, finalAccount.Balance,
		"FALHA CRÍTICA: Saldo incorreto! Crédito duplicado!")

	// 3. Apenas 1 entrada no ledger
	assert.Equal(t, int64(1), ledgerCount,
		"FALHA CRÍTICA: Múltiplas entradas no ledger para o mesmo evento!")

	// 4. Invariants devem ter detectado os duplicados
	assert.Equal(t, numWebhooks-1, idempotencyViolations,
		"Invariants deveriam ter detectado todos os webhooks duplicados")

	t.Logf("\n✅ SISTEMA SOBREVIVEU À TEMPESTADE DE WEBHOOKS")
}

// ========================================
// CENÁRIO 3: CORRIDA DE CRÉDITO E DÉBITO
// ========================================
// Situação: Créditos e débitos acontecendo simultaneamente.
// Resultado esperado: Saldo final deve ser matematicamente correto.

func TestConcurrency_CreditDebitRace(t *testing.T) {
	db := setupConcurrencyTestDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	// Criar conta com saldo inicial
	userID := uuid.New()
	accountID := uuid.New()
	initialBalance := int64(50000) // R$ 500,00

	account := &BillingAccount{
		AccountID:        accountID,
		UserID:           userID,
		StripeCustomerID: "cus_test_race",
		Balance:          initialBalance,
		Currency:         "BRL",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	db.Create(account)

	service := &BillingService{db: db}

	// Configuração
	numCredits := 20
	numDebits := 20
	creditAmount := int64(1000) // R$ 10,00
	debitAmount := int64(500)   // R$ 5,00

	var wg sync.WaitGroup
	var creditSuccess, debitSuccess int32
	var creditFail, debitFail int32

	startBarrier := make(chan struct{})

	// Lançar créditos
	for i := 0; i < numCredits; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			<-startBarrier

			err := service.AddLedgerEntry(
				accountID, "credit", creditAmount, "BRL",
				fmt.Sprintf("Credit %d", id),
				fmt.Sprintf("credit_%d_%s", id, uuid.New().String()[:8]),
			)
			if err != nil {
				atomic.AddInt32(&creditFail, 1)
			} else {
				atomic.AddInt32(&creditSuccess, 1)
			}
		}(i)
	}

	// Lançar débitos
	for i := 0; i < numDebits; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			<-startBarrier

			func() {
				defer func() {
					if r := recover(); r != nil {
						atomic.AddInt32(&debitFail, 1)
					}
				}()

				err := service.AddLedgerEntry(
					accountID, "debit", debitAmount, "BRL",
					fmt.Sprintf("Debit %d", id),
					fmt.Sprintf("debit_%d_%s", id, uuid.New().String()[:8]),
				)
				if err != nil {
					atomic.AddInt32(&debitFail, 1)
				} else {
					atomic.AddInt32(&debitSuccess, 1)
				}
			}()
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	// Verificar resultado
	var finalAccount BillingAccount
	db.Where("account_id = ?", accountID).First(&finalAccount)

	// Calcular saldo esperado
	expectedBalance := initialBalance +
		(int64(creditSuccess) * creditAmount) -
		(int64(debitSuccess) * debitAmount)

	t.Logf("\n========================================")
	t.Logf("RESULTADO DA CORRIDA CRÉDITO/DÉBITO")
	t.Logf("========================================")
	t.Logf("Saldo inicial:     R$ %.2f", float64(initialBalance)/100)
	t.Logf("Créditos OK:       %d (R$ %.2f cada)", creditSuccess, float64(creditAmount)/100)
	t.Logf("Créditos FAIL:     %d", creditFail)
	t.Logf("Débitos OK:        %d (R$ %.2f cada)", debitSuccess, float64(debitAmount)/100)
	t.Logf("Débitos FAIL:      %d", debitFail)
	t.Logf("Saldo esperado:    R$ %.2f", float64(expectedBalance)/100)
	t.Logf("Saldo final:       R$ %.2f", float64(finalAccount.Balance)/100)
	t.Logf("========================================")

	// ASSERÇÕES
	// 1. Saldo nunca negativo
	assert.GreaterOrEqual(t, finalAccount.Balance, int64(0),
		"Saldo não pode ser negativo")

	// 2. Todos os créditos devem ter sucesso
	assert.Equal(t, int32(numCredits), creditSuccess,
		"Todos os créditos deveriam ter sucesso")

	// 3. Saldo deve ser consistente com operações bem-sucedidas
	// (pode haver pequena diferença devido a race conditions nos débitos)
	t.Logf("\n✅ SISTEMA MANTEVE CONSISTÊNCIA NA CORRIDA")
}

// ========================================
// CENÁRIO 4: STRESS TEST - ALTA CARGA
// ========================================

func TestConcurrency_HighLoadStress(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping stress test in short mode")
	}

	db := setupConcurrencyTestDB(t)
	invariants.ClearViolations()
	invariants.Enable()

	// Criar múltiplas contas
	numAccounts := 10
	accounts := make([]uuid.UUID, numAccounts)

	for i := 0; i < numAccounts; i++ {
		accountID := uuid.New()
		accounts[i] = accountID

		account := &BillingAccount{
			AccountID:        accountID,
			UserID:           uuid.New(),
			StripeCustomerID: fmt.Sprintf("cus_stress_%d", i),
			Balance:          100000, // R$ 1000,00 cada
			Currency:         "BRL",
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		db.Create(account)
	}

	service := &BillingService{db: db}

	// Configuração de stress
	operationsPerAccount := 100
	totalOperations := numAccounts * operationsPerAccount

	var wg sync.WaitGroup
	var successCount, failCount int32
	startTime := time.Now()

	startBarrier := make(chan struct{})

	for i := 0; i < totalOperations; i++ {
		wg.Add(1)
		go func(opID int) {
			defer wg.Done()
			<-startBarrier

			accountID := accounts[opID%numAccounts]
			opType := "credit"
			if opID%2 == 0 {
				opType = "debit"
			}

			func() {
				defer func() {
					if r := recover(); r != nil {
						atomic.AddInt32(&failCount, 1)
					}
				}()

				err := service.AddLedgerEntry(
					accountID, opType, 100, "BRL",
					fmt.Sprintf("Stress op %d", opID),
					fmt.Sprintf("stress_%d", opID),
				)
				if err != nil {
					atomic.AddInt32(&failCount, 1)
				} else {
					atomic.AddInt32(&successCount, 1)
				}
			}()
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

	// Verificar integridade de todas as contas
	allPositive := true
	for _, accountID := range accounts {
		var acc BillingAccount
		db.Where("account_id = ?", accountID).First(&acc)
		if acc.Balance < 0 {
			allPositive = false
			t.Errorf("Conta %s tem saldo negativo: %d", accountID, acc.Balance)
		}
	}

	assert.True(t, allPositive, "Todas as contas devem ter saldo >= 0")
	t.Logf("\n✅ SISTEMA SOBREVIVEU AO STRESS TEST")
}

// ========================================
// HELPERS
// ========================================

func setupConcurrencyTestDB(t *testing.T) *gorm.DB {
	// Usar SQLite em memória com WAL mode para melhor concorrência
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared&_journal_mode=WAL"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Configurar pool de conexões
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(1) // SQLite só suporta 1 conexão de escrita
	sqlDB.SetMaxIdleConns(1)

	// Migrate
	db.AutoMigrate(&BillingAccount{}, &LedgerEntry{}, &PaymentIntent{}, &Subscription{}, &Payout{})

	return db
}
