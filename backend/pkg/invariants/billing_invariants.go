package invariants

/*
================================================================================
LEIS FINANCEIRAS DO KERNEL — BILLING INVARIANTS
================================================================================

"Dinheiro não aceita desaforo."

Estas invariants protegem o Economic Kernel contra estados impossíveis:
- Saldo negativo por débito (não por crédito intencional)
- Assinaturas órfãs (sem dono)
- Transações sem origem rastreável
- Webhooks processados em duplicidade

Severidades:
- CRITICAL: Log + alerta, operação continua mas alguém é acordado
- FATAL: Operação é BLOQUEADA, panic se necessário

================================================================================
*/

import (
	"github.com/google/uuid"
)

// ========================================
// INVARIANTS DE SALDO
// ========================================

// AssertNoNegativeBalance verifica que um débito não resultará em saldo negativo
// CRITICAL: Saldo negativo por débito é bug, não feature
func AssertNoNegativeBalance(accountID string, currentBalance, debitAmount int64) {
	resultingBalance := currentBalance - debitAmount
	AssertCritical(
		resultingBalance >= 0,
		"negative_balance_after_debit",
		"Debit operation would result in negative balance - this is a calculation error",
		map[string]interface{}{
			"account_id":        accountID,
			"current_balance":   currentBalance,
			"debit_amount":      debitAmount,
			"resulting_balance": resultingBalance,
		},
	)
}

// AssertBalanceConsistency verifica que o saldo após operação bate com o esperado
// CRITICAL: Inconsistência de saldo indica race condition ou bug
func AssertBalanceConsistency(accountID string, expectedBalance, actualBalance int64) {
	AssertCritical(
		expectedBalance == actualBalance,
		"balance_inconsistency",
		"Account balance does not match expected value after operation",
		map[string]interface{}{
			"account_id":       accountID,
			"expected_balance": expectedBalance,
			"actual_balance":   actualBalance,
			"difference":       actualBalance - expectedBalance,
		},
	)
}

// ========================================
// INVARIANTS DE SUBSCRIPTION
// ========================================

// AssertSubscriptionHasOwner verifica que toda subscription tem um dono válido
// FATAL: Subscription sem dono é dinheiro perdido
func AssertSubscriptionHasOwner(subscriptionID, accountID uuid.UUID) {
	isValid := accountID != uuid.Nil
	AssertFatal(
		isValid,
		"subscription_without_owner",
		"CRITICAL: Subscription created without valid owner - money would be lost",
		map[string]interface{}{
			"subscription_id": subscriptionID.String(),
			"account_id":      accountID.String(),
		},
	)
}

// AssertSubscriptionHasValidPlan verifica que subscription tem plano válido
// CRITICAL: Subscription sem plano não sabe o que cobrar
func AssertSubscriptionHasValidPlan(subscriptionID uuid.UUID, planID string) {
	AssertCritical(
		planID != "",
		"subscription_without_plan",
		"Subscription created without valid plan ID",
		map[string]interface{}{
			"subscription_id": subscriptionID.String(),
			"plan_id":         planID,
		},
	)
}

// ========================================
// INVARIANTS DE TRANSAÇÃO
// ========================================

// AssertTransactionHasOrigin verifica que toda entrada no ledger tem origem rastreável
// CRITICAL: Dinheiro aparecendo do nada é fraude ou bug
func AssertTransactionHasOrigin(entryID, referenceID, entryType string) {
	AssertCritical(
		referenceID != "",
		"transaction_without_origin",
		"Ledger entry created without reference to origin - money appeared from nowhere",
		map[string]interface{}{
			"entry_id":     entryID,
			"entry_type":   entryType,
			"reference_id": referenceID,
		},
	)
}

// AssertTransactionAmountPositive verifica que valor da transação é positivo
// CRITICAL: Valor negativo em transação indica inversão de lógica
func AssertTransactionAmountPositive(entryID string, amount int64) {
	AssertCritical(
		amount > 0,
		"transaction_non_positive_amount",
		"Ledger entry with non-positive amount - logic inversion detected",
		map[string]interface{}{
			"entry_id": entryID,
			"amount":   amount,
		},
	)
}

// ========================================
// INVARIANTS DE WEBHOOK
// ========================================

// AssertWebhookIdempotency verifica que webhook não está sendo processado em duplicidade
// CRITICAL: Webhook duplicado pode cobrar duas vezes
func AssertWebhookIdempotency(eventID string, alreadyProcessed bool) {
	AssertCritical(
		!alreadyProcessed,
		"webhook_duplicate_processing",
		"Webhook event being processed more than once - potential double charge",
		map[string]interface{}{
			"event_id":          eventID,
			"already_processed": alreadyProcessed,
		},
	)
}

// AssertWebhookHasEventID verifica que webhook tem ID de evento
// CRITICAL: Sem event ID não há como garantir idempotência
func AssertWebhookHasEventID(eventID string) {
	AssertCritical(
		eventID != "",
		"webhook_missing_event_id",
		"Webhook received without event ID - cannot guarantee idempotency",
		map[string]interface{}{
			"event_id": eventID,
		},
	)
}

// ========================================
// INVARIANTS DE PAYMENT INTENT
// ========================================

// AssertPaymentIntentBelongsToAccount verifica isolamento de payment intent
// CRITICAL: Acesso cross-account é vazamento de dados financeiros
func AssertPaymentIntentBelongsToAccount(intentAccountID, requestAccountID uuid.UUID) {
	AssertCritical(
		intentAccountID == requestAccountID,
		"payment_intent_cross_account_access",
		"Payment intent accessed by different account - data isolation breach",
		map[string]interface{}{
			"intent_account_id":  intentAccountID.String(),
			"request_account_id": requestAccountID.String(),
		},
	)
}

// AssertPaymentIntentValidTransition verifica transição de estado válida
// CRITICAL: Transição inválida pode confirmar pagamento não pago
func AssertPaymentIntentValidTransition(intentID string, fromStatus, toStatus string) {
	validTransitions := map[string][]string{
		"pending":   {"confirmed", "failed", "disputed"},
		"confirmed": {"refunded", "disputed"},
		"failed":    {"pending"}, // Retry permitido
		"disputed":  {"confirmed", "failed", "refunded"}, // Resolução humana
	}

	allowed := false
	if validTo, exists := validTransitions[fromStatus]; exists {
		for _, valid := range validTo {
			if valid == toStatus {
				allowed = true
				break
			}
		}
	}

	AssertCritical(
		allowed,
		"payment_intent_invalid_transition",
		"Payment intent state transition not allowed",
		map[string]interface{}{
			"intent_id":   intentID,
			"from_status": fromStatus,
			"to_status":   toStatus,
		},
	)
}

// ========================================
// INVARIANTS DE PAYOUT
// ========================================

// AssertPayoutWithinBalance verifica que payout não excede saldo
// FATAL: Payout maior que saldo é dinheiro que não existe
func AssertPayoutWithinBalance(accountID string, balance, payoutAmount int64) {
	AssertFatal(
		payoutAmount <= balance,
		"payout_exceeds_balance",
		"CRITICAL: Payout request exceeds available balance - would create debt",
		map[string]interface{}{
			"account_id":    accountID,
			"balance":       balance,
			"payout_amount": payoutAmount,
			"shortfall":     payoutAmount - balance,
		},
	)
}

// ========================================
// INVARIANTS DE RECONCILIAÇÃO
// ========================================

// AssertLedgerBalanceMatchesAccount verifica que soma do ledger bate com saldo
// CRITICAL: Divergência indica corrupção de dados
func AssertLedgerBalanceMatchesAccount(accountID string, ledgerSum, accountBalance int64) {
	AssertCritical(
		ledgerSum == accountBalance,
		"ledger_account_mismatch",
		"Ledger sum does not match account balance - data corruption detected",
		map[string]interface{}{
			"account_id":      accountID,
			"ledger_sum":      ledgerSum,
			"account_balance": accountBalance,
			"difference":      accountBalance - ledgerSum,
		},
	)
}
