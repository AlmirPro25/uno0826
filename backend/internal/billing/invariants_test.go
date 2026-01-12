package billing

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"prost-qs/backend/pkg/invariants"
)

/*
================================================================================
TESTES DE INVARIANTS DO BILLING
================================================================================

Estes testes provam que o sistema GRITA quando alguém tenta fazer besteira.

Filosofia:
- Invariants não são testes de CI que morrem após o deploy
- São sensores ontológicos que vivem em produção
- Aqui testamos se os sensores estão calibrados

================================================================================
*/

// setupInvariantsTestDB cria banco de teste para invariants
func setupInvariantsTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate
	err = db.AutoMigrate(
		&BillingAccount{},
		&PaymentIntent{},
		&Subscription{},
		&LedgerEntry{},
		&Payout{},
		&ProcessedWebhook{},
	)
	require.NoError(t, err)

	return db
}

// ========================================
// TESTES DE SALDO NEGATIVO
// ========================================

func TestInvariant_NegativeBalanceDetected(t *testing.T) {
	// Limpar violações anteriores
	invariants.ClearViolations()
	invariants.Enable()

	// Simular: conta com R$ 50, tentando debitar R$ 100
	accountID := uuid.New().String()
	currentBalance := int64(5000)  // R$ 50,00 em centavos
	debitAmount := int64(10000)    // R$ 100,00 em centavos

	// Disparar a invariant
	invariants.AssertNoNegativeBalance(accountID, currentBalance, debitAmount)

	// Verificar que a violação foi registrada
	violations := invariants.GetViolations()
	require.Len(t, violations, 1, "Deveria ter registrado 1 violação")

	v := violations[0]
	assert.Equal(t, "negative_balance_after_debit", v.Invariant)
	assert.Equal(t, invariants.SeverityCritical, v.Severity)
	assert.Contains(t, v.Message, "negative balance")

	// Verificar contexto
	assert.Equal(t, accountID, v.Context["account_id"])
	assert.Equal(t, currentBalance, v.Context["current_balance"])
	assert.Equal(t, debitAmount, v.Context["debit_amount"])
	assert.Equal(t, int64(-5000), v.Context["resulting_balance"])

	t.Logf("✅ Invariant detectou saldo negativo: %s", v.Message)
}

func TestInvariant_PositiveBalanceAllowed(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	// Simular: conta com R$ 100, debitando R$ 50 (válido)
	accountID := uuid.New().String()
	currentBalance := int64(10000) // R$ 100,00
	debitAmount := int64(5000)     // R$ 50,00

	invariants.AssertNoNegativeBalance(accountID, currentBalance, debitAmount)

	violations := invariants.GetViolations()
	assert.Len(t, violations, 0, "Não deveria ter violações para débito válido")

	t.Log("✅ Débito válido passou sem violações")
}

// ========================================
// TESTES DE SUBSCRIPTION SEM OWNER
// ========================================

func TestInvariant_SubscriptionWithoutOwner_Panics(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	subscriptionID := uuid.New()
	nilAccountID := uuid.Nil // Owner inválido

	// AssertFatal deve causar panic
	assert.Panics(t, func() {
		invariants.AssertSubscriptionHasOwner(subscriptionID, nilAccountID)
	}, "Subscription sem owner deveria causar panic")

	t.Log("✅ Subscription sem owner causou panic (comportamento correto)")
}

func TestInvariant_SubscriptionWithOwner_NoPanic(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	subscriptionID := uuid.New()
	validAccountID := uuid.New() // Owner válido

	// Não deve causar panic
	assert.NotPanics(t, func() {
		invariants.AssertSubscriptionHasOwner(subscriptionID, validAccountID)
	}, "Subscription com owner válido não deveria causar panic")

	violations := invariants.GetViolations()
	assert.Len(t, violations, 0, "Não deveria ter violações")

	t.Log("✅ Subscription com owner válido passou")
}

// ========================================
// TESTES DE TRANSAÇÃO SEM ORIGEM
// ========================================

func TestInvariant_TransactionWithoutOrigin_Detected(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	entryID := uuid.New().String()
	emptyReferenceID := "" // Sem origem
	entryType := "credit"

	invariants.AssertTransactionHasOrigin(entryID, emptyReferenceID, entryType)

	violations := invariants.GetViolations()
	require.Len(t, violations, 1)

	v := violations[0]
	assert.Equal(t, "transaction_without_origin", v.Invariant)
	assert.Contains(t, v.Message, "without reference")

	t.Logf("✅ Transação sem origem detectada: %s", v.Message)
}

func TestInvariant_TransactionWithOrigin_Allowed(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	entryID := uuid.New().String()
	validReferenceID := uuid.New().String() // Com origem
	entryType := "credit"

	invariants.AssertTransactionHasOrigin(entryID, validReferenceID, entryType)

	violations := invariants.GetViolations()
	assert.Len(t, violations, 0)

	t.Log("✅ Transação com origem passou")
}

// ========================================
// TESTES DE WEBHOOK DUPLICADO
// ========================================

func TestInvariant_WebhookDuplicate_Detected(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	eventID := "evt_123456789"
	alreadyProcessed := true // Já foi processado

	invariants.AssertWebhookIdempotency(eventID, alreadyProcessed)

	violations := invariants.GetViolations()
	require.Len(t, violations, 1)

	v := violations[0]
	assert.Equal(t, "webhook_duplicate_processing", v.Invariant)
	assert.Contains(t, v.Message, "more than once")

	t.Logf("✅ Webhook duplicado detectado: %s", v.Message)
}

func TestInvariant_WebhookFirstTime_Allowed(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	eventID := "evt_new_event"
	alreadyProcessed := false // Primeira vez

	invariants.AssertWebhookIdempotency(eventID, alreadyProcessed)

	violations := invariants.GetViolations()
	assert.Len(t, violations, 0)

	t.Log("✅ Webhook novo passou")
}

// ========================================
// TESTES DE PAYOUT EXCEDENDO SALDO
// ========================================

func TestInvariant_PayoutExceedsBalance_Panics(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	accountID := uuid.New().String()
	balance := int64(5000)      // R$ 50,00
	payoutAmount := int64(10000) // R$ 100,00 (maior que saldo)

	assert.Panics(t, func() {
		invariants.AssertPayoutWithinBalance(accountID, balance, payoutAmount)
	}, "Payout maior que saldo deveria causar panic")

	t.Log("✅ Payout excedendo saldo causou panic (comportamento correto)")
}

func TestInvariant_PayoutWithinBalance_NoPanic(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	accountID := uuid.New().String()
	balance := int64(10000)     // R$ 100,00
	payoutAmount := int64(5000) // R$ 50,00 (menor que saldo)

	assert.NotPanics(t, func() {
		invariants.AssertPayoutWithinBalance(accountID, balance, payoutAmount)
	})

	violations := invariants.GetViolations()
	assert.Len(t, violations, 0)

	t.Log("✅ Payout dentro do saldo passou")
}

// ========================================
// TESTES DE ISOLAMENTO CROSS-ACCOUNT
// ========================================

func TestInvariant_CrossAccountAccess_Detected(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	intentAccountID := uuid.New()
	requestAccountID := uuid.New() // Diferente!

	invariants.AssertPaymentIntentBelongsToAccount(intentAccountID, requestAccountID)

	violations := invariants.GetViolations()
	require.Len(t, violations, 1)

	v := violations[0]
	assert.Equal(t, "payment_intent_cross_account_access", v.Invariant)
	assert.Contains(t, v.Message, "isolation breach")

	t.Logf("✅ Acesso cross-account detectado: %s", v.Message)
}

func TestInvariant_SameAccountAccess_Allowed(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	accountID := uuid.New()

	invariants.AssertPaymentIntentBelongsToAccount(accountID, accountID)

	violations := invariants.GetViolations()
	assert.Len(t, violations, 0)

	t.Log("✅ Acesso same-account passou")
}

// ========================================
// TESTE DE INTEGRAÇÃO: LEDGER COM INVARIANTS
// ========================================

func TestIntegration_LedgerDebitWithInsufficientBalance(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	db := setupInvariantsTestDB(t)
	service := &BillingService{db: db}

	// Criar conta com saldo zero
	accountID := uuid.New()
	account := &BillingAccount{
		AccountID: accountID,
		UserID:    uuid.New(),
		Balance:   0, // Saldo zero
		Currency:  "BRL",
	}
	require.NoError(t, db.Create(account).Error)

	// Tentar debitar R$ 100 de conta com saldo zero
	err := service.addLedgerEntry(accountID, "debit", 10000, "BRL", "Test debit", "ref-123")

	// A operação pode ou não falhar dependendo da implementação
	// Mas a INVARIANT deve ter sido disparada
	violations := invariants.GetViolations()
	
	// Deve ter pelo menos a violação de saldo negativo
	found := false
	for _, v := range violations {
		if v.Invariant == "negative_balance_after_debit" {
			found = true
			t.Logf("✅ Invariant disparada: %s - %s", v.Invariant, v.Message)
			break
		}
	}

	assert.True(t, found, "Invariant de saldo negativo deveria ter sido disparada")
	_ = err // Ignoramos o erro aqui, o importante é a invariant
}

func TestIntegration_LedgerCreditAllowed(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	db := setupInvariantsTestDB(t)
	service := &BillingService{db: db}

	// Criar conta
	accountID := uuid.New()
	account := &BillingAccount{
		AccountID: accountID,
		UserID:    uuid.New(),
		Balance:   0,
		Currency:  "BRL",
	}
	require.NoError(t, db.Create(account).Error)

	// Creditar R$ 100 (sempre válido)
	err := service.addLedgerEntry(accountID, "credit", 10000, "BRL", "Test credit", "ref-456")
	require.NoError(t, err)

	// Verificar saldo atualizado
	var updated BillingAccount
	require.NoError(t, db.First(&updated, "account_id = ?", accountID).Error)
	assert.Equal(t, int64(10000), updated.Balance)

	// Não deve ter violações
	violations := invariants.GetViolations()
	negativeBalanceViolations := 0
	for _, v := range violations {
		if v.Invariant == "negative_balance_after_debit" {
			negativeBalanceViolations++
		}
	}
	assert.Equal(t, 0, negativeBalanceViolations, "Crédito não deveria disparar violação de saldo negativo")

	t.Log("✅ Crédito processado sem violações de saldo")
}

// ========================================
// TESTE: HANDLER DE VIOLAÇÕES
// ========================================

func TestInvariant_HandlerIsCalled(t *testing.T) {
	invariants.ClearViolations()
	invariants.Enable()

	// Registrar handler customizado
	handlerCalled := false
	var capturedViolation invariants.Violation

	invariants.RegisterHandler(func(v invariants.Violation) {
		handlerCalled = true
		capturedViolation = v
	})

	// Disparar violação
	invariants.AssertNoNegativeBalance("test-account", 100, 200)

	// Aguardar handler async
	// (em produção seria via channel ou similar)
	// Aqui usamos sleep simples para teste
	require.Eventually(t, func() bool {
		return handlerCalled
	}, 1*time.Second, 10*time.Millisecond, "Handler deveria ter sido chamado")

	assert.Equal(t, "negative_balance_after_debit", capturedViolation.Invariant)
	t.Log("✅ Handler de violação foi chamado corretamente")
}

// ========================================
// BENCHMARK: OVERHEAD DAS INVARIANTS
// ========================================

func BenchmarkInvariant_NoViolation(b *testing.B) {
	invariants.Enable()
	accountID := uuid.New().String()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		invariants.AssertNoNegativeBalance(accountID, 10000, 5000)
	}
}

func BenchmarkInvariant_WithViolation(b *testing.B) {
	invariants.Enable()
	accountID := uuid.New().String()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		invariants.AssertNoNegativeBalance(accountID, 5000, 10000)
	}
}