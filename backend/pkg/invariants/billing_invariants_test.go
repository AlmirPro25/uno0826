package invariants

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================================
// BILLING INVARIANTS TESTS
// "Dinheiro não aceita desaforo"
// ========================================

func init() {
	// Limpar violações antes de cada teste
	ClearViolations()
}

// ========================================
// BALANCE INVARIANTS
// ========================================

func TestAssertNoNegativeBalance_ValidDebit_Passes(t *testing.T) {
	ClearViolations()
	
	// Débito que não resulta em saldo negativo
	AssertNoNegativeBalance("acc-123", 1000, 500)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Débito válido não deve gerar violação")
}

func TestAssertNoNegativeBalance_ExactBalance_Passes(t *testing.T) {
	ClearViolations()
	
	// Débito que zera o saldo (permitido)
	AssertNoNegativeBalance("acc-123", 1000, 1000)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Débito que zera saldo deve passar")
}

func TestAssertNoNegativeBalance_NegativeResult_Critical(t *testing.T) {
	ClearViolations()
	
	// Débito que resultaria em saldo negativo
	AssertNoNegativeBalance("acc-123", 500, 1000)
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Débito que resulta em saldo negativo deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "negative_balance_after_debit", violations[0].Invariant)
		assert.Equal(t, SeverityCritical, violations[0].Severity)
		t.Logf("✅ Detectou saldo negativo: %s", violations[0].Message)
	}
}

func TestAssertBalanceConsistency_Matching_Passes(t *testing.T) {
	ClearViolations()
	
	// Saldos iguais
	AssertBalanceConsistency("acc-123", 1000, 1000)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Saldos iguais não devem gerar violação")
}

func TestAssertBalanceConsistency_Mismatch_Critical(t *testing.T) {
	ClearViolations()
	
	// Saldos diferentes
	AssertBalanceConsistency("acc-123", 1000, 950)
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Saldos diferentes devem gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "balance_inconsistency", violations[0].Invariant)
		t.Logf("✅ Detectou inconsistência de saldo: diferença de %d", 950-1000)
	}
}

// ========================================
// SUBSCRIPTION INVARIANTS
// ========================================

func TestAssertSubscriptionHasOwner_ValidOwner_Passes(t *testing.T) {
	ClearViolations()
	
	subID := uuid.New()
	ownerID := uuid.New()
	
	// Não deve panic com owner válido
	AssertSubscriptionHasOwner(subID, ownerID)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Subscription com owner válido não deve gerar violação")
	t.Log("✅ Subscription com owner válido passou")
}

func TestAssertSubscriptionHasOwner_NilOwner_Fatal(t *testing.T) {
	ClearViolations()
	
	subID := uuid.New()
	
	// Deve panic com owner nil
	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou subscription sem owner: %v", r)
		}
	}()
	
	AssertSubscriptionHasOwner(subID, uuid.Nil)
	
	// Se chegou aqui sem panic, falhou
	t.Error("Deveria ter dado panic para subscription sem owner")
}

func TestAssertSubscriptionHasValidPlan_ValidPlan_Passes(t *testing.T) {
	ClearViolations()
	
	subID := uuid.New()
	
	AssertSubscriptionHasValidPlan(subID, "price_pro_monthly")
	
	violations := GetViolations()
	assert.Empty(t, violations, "Subscription com plano válido não deve gerar violação")
}

func TestAssertSubscriptionHasValidPlan_EmptyPlan_Critical(t *testing.T) {
	ClearViolations()
	
	subID := uuid.New()
	
	AssertSubscriptionHasValidPlan(subID, "")
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Subscription sem plano deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "subscription_without_plan", violations[0].Invariant)
		t.Logf("✅ Detectou subscription sem plano")
	}
}

// ========================================
// TRANSACTION INVARIANTS
// ========================================

func TestAssertTransactionHasOrigin_WithReference_Passes(t *testing.T) {
	ClearViolations()
	
	AssertTransactionHasOrigin("entry-123", "payment_intent_xyz", "credit")
	
	violations := GetViolations()
	assert.Empty(t, violations, "Transação com origem não deve gerar violação")
}

func TestAssertTransactionHasOrigin_NoReference_Critical(t *testing.T) {
	ClearViolations()
	
	AssertTransactionHasOrigin("entry-123", "", "credit")
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Transação sem origem deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "transaction_without_origin", violations[0].Invariant)
		t.Logf("✅ Detectou transação sem origem")
	}
}

func TestAssertTransactionAmountPositive_Positive_Passes(t *testing.T) {
	ClearViolations()
	
	AssertTransactionAmountPositive("entry-123", 1000)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Transação com valor positivo não deve gerar violação")
}

func TestAssertTransactionAmountPositive_Zero_Critical(t *testing.T) {
	ClearViolations()
	
	AssertTransactionAmountPositive("entry-123", 0)
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Transação com valor zero deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "transaction_non_positive_amount", violations[0].Invariant)
		t.Logf("✅ Detectou transação com valor zero")
	}
}

func TestAssertTransactionAmountPositive_Negative_Critical(t *testing.T) {
	ClearViolations()
	
	AssertTransactionAmountPositive("entry-123", -500)
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Transação com valor negativo deve gerar violação")
	
	if len(violations) > 0 {
		t.Logf("✅ Detectou transação com valor negativo")
	}
}

// ========================================
// WEBHOOK INVARIANTS
// ========================================

func TestAssertWebhookIdempotency_FirstTime_Passes(t *testing.T) {
	ClearViolations()
	
	AssertWebhookIdempotency("evt_123", false)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Primeiro processamento não deve gerar violação")
}

func TestAssertWebhookIdempotency_Duplicate_Critical(t *testing.T) {
	ClearViolations()
	
	AssertWebhookIdempotency("evt_123", true)
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Processamento duplicado deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "webhook_duplicate_processing", violations[0].Invariant)
		t.Logf("✅ Detectou webhook duplicado")
	}
}

func TestAssertWebhookHasEventID_Valid_Passes(t *testing.T) {
	ClearViolations()
	
	AssertWebhookHasEventID("evt_123456")
	
	violations := GetViolations()
	assert.Empty(t, violations, "Webhook com event ID não deve gerar violação")
}

func TestAssertWebhookHasEventID_Empty_Critical(t *testing.T) {
	ClearViolations()
	
	AssertWebhookHasEventID("")
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Webhook sem event ID deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "webhook_missing_event_id", violations[0].Invariant)
		t.Logf("✅ Detectou webhook sem event ID")
	}
}

// ========================================
// PAYMENT INTENT INVARIANTS
// ========================================

func TestAssertPaymentIntentBelongsToAccount_SameAccount_Passes(t *testing.T) {
	ClearViolations()
	
	accountID := uuid.New()
	
	AssertPaymentIntentBelongsToAccount(accountID, accountID)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Acesso do mesmo account não deve gerar violação")
}

func TestAssertPaymentIntentBelongsToAccount_DifferentAccount_Critical(t *testing.T) {
	ClearViolations()
	
	intentAccount := uuid.New()
	requestAccount := uuid.New()
	
	AssertPaymentIntentBelongsToAccount(intentAccount, requestAccount)
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Acesso cross-account deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "payment_intent_cross_account_access", violations[0].Invariant)
		t.Logf("✅ Detectou acesso cross-account")
	}
}

func TestAssertPaymentIntentValidTransition_ValidTransitions(t *testing.T) {
	ClearViolations()
	
	validCases := []struct {
		from string
		to   string
	}{
		{"pending", "confirmed"},
		{"pending", "failed"},
		{"confirmed", "refunded"},
		{"failed", "pending"}, // Retry
	}
	
	for _, tc := range validCases {
		ClearViolations()
		AssertPaymentIntentValidTransition("intent-123", tc.from, tc.to)
		
		violations := GetViolations()
		assert.Empty(t, violations, "Transição %s → %s deve ser válida", tc.from, tc.to)
	}
	
	t.Log("✅ Todas as transições válidas passaram")
}

func TestAssertPaymentIntentValidTransition_InvalidTransition_Critical(t *testing.T) {
	ClearViolations()
	
	// Transição inválida: confirmed → pending (não pode voltar)
	AssertPaymentIntentValidTransition("intent-123", "confirmed", "pending")
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Transição inválida deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "payment_intent_invalid_transition", violations[0].Invariant)
		t.Logf("✅ Detectou transição inválida: confirmed → pending")
	}
}

// ========================================
// PAYOUT INVARIANTS
// ========================================

func TestAssertPayoutWithinBalance_Valid_Passes(t *testing.T) {
	ClearViolations()
	
	// Payout menor que saldo
	AssertPayoutWithinBalance("acc-123", 10000, 5000)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Payout dentro do saldo não deve gerar violação")
}

func TestAssertPayoutWithinBalance_ExactBalance_Passes(t *testing.T) {
	ClearViolations()
	
	// Payout igual ao saldo (permitido)
	AssertPayoutWithinBalance("acc-123", 10000, 10000)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Payout igual ao saldo deve passar")
}

func TestAssertPayoutWithinBalance_ExceedsBalance_Fatal(t *testing.T) {
	ClearViolations()
	
	// Payout maior que saldo - deve panic
	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou payout que excede saldo: %v", r)
		}
	}()
	
	AssertPayoutWithinBalance("acc-123", 5000, 10000)
	
	t.Error("Deveria ter dado panic para payout que excede saldo")
}

// ========================================
// RECONCILIATION INVARIANTS
// ========================================

func TestAssertLedgerBalanceMatchesAccount_Matching_Passes(t *testing.T) {
	ClearViolations()
	
	AssertLedgerBalanceMatchesAccount("acc-123", 10000, 10000)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Ledger e account iguais não devem gerar violação")
}

func TestAssertLedgerBalanceMatchesAccount_Mismatch_Critical(t *testing.T) {
	ClearViolations()
	
	AssertLedgerBalanceMatchesAccount("acc-123", 10000, 9500)
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Divergência ledger/account deve gerar violação")
	
	if len(violations) > 0 {
		assert.Equal(t, "ledger_account_mismatch", violations[0].Invariant)
		t.Logf("✅ Detectou divergência ledger/account: diferença de %d", 9500-10000)
	}
}

// ========================================
// INTEGRATION TESTS
// ========================================

func TestBillingInvariants_FullPaymentFlow(t *testing.T) {
	ClearViolations()
	
	// Simula fluxo completo de pagamento
	accountID := uuid.New()
	subID := uuid.New()
	
	// 1. Criar subscription com owner
	AssertSubscriptionHasOwner(subID, accountID)
	
	// 2. Subscription tem plano
	AssertSubscriptionHasValidPlan(subID, "price_pro_monthly")
	
	// 3. Webhook chega com event ID
	AssertWebhookHasEventID("evt_payment_123")
	
	// 4. Webhook não é duplicado
	AssertWebhookIdempotency("evt_payment_123", false)
	
	// 5. Transação tem origem
	AssertTransactionHasOrigin("entry-1", "evt_payment_123", "credit")
	
	// 6. Valor é positivo
	AssertTransactionAmountPositive("entry-1", 990) // $9.90 em centavos
	
	// 7. Saldo não fica negativo
	AssertNoNegativeBalance(accountID.String(), 0, 0) // Crédito, não débito
	
	// 8. Ledger bate com account
	AssertLedgerBalanceMatchesAccount(accountID.String(), 990, 990)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Fluxo completo de pagamento não deve gerar violações")
	
	t.Log("✅ Fluxo completo de pagamento passou todas as invariantes")
}

func TestBillingInvariants_RefundFlow(t *testing.T) {
	ClearViolations()
	
	accountID := "acc-123"
	
	// Saldo inicial após pagamento
	currentBalance := int64(990)
	
	// 1. Verificar que refund não deixa saldo negativo
	refundAmount := int64(990)
	AssertNoNegativeBalance(accountID, currentBalance, refundAmount)
	
	// 2. Transição de estado válida
	AssertPaymentIntentValidTransition("intent-123", "confirmed", "refunded")
	
	// 3. Transação de refund tem origem
	AssertTransactionHasOrigin("entry-refund", "refund_123", "debit")
	
	// 4. Valor do refund é positivo
	AssertTransactionAmountPositive("entry-refund", refundAmount)
	
	violations := GetViolations()
	assert.Empty(t, violations, "Fluxo de refund não deve gerar violações")
	
	t.Log("✅ Fluxo de refund passou todas as invariantes")
}

func TestBillingInvariants_FraudAttempt(t *testing.T) {
	ClearViolations()
	
	// Simula tentativa de fraude: acessar payment intent de outro account
	intentAccount := uuid.New()
	attackerAccount := uuid.New()
	
	AssertPaymentIntentBelongsToAccount(intentAccount, attackerAccount)
	
	violations := GetViolations()
	assert.NotEmpty(t, violations, "Tentativa de fraude deve ser detectada")
	
	if len(violations) > 0 {
		assert.Equal(t, "payment_intent_cross_account_access", violations[0].Invariant)
		t.Logf("✅ Tentativa de fraude detectada e bloqueada")
	}
}
