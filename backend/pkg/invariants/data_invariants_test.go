package invariants

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// ========================================
// TESTES DE CAMPOS OBRIGATÓRIOS
// ========================================

func TestAssertRequiredField_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRequiredField("name", "John Doe", "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Campo preenchido não deveria gerar violação")
	t.Log("✅ Campo obrigatório preenchido passou")
}

func TestAssertRequiredField_Empty_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRequiredField("email", "", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar campo vazio")
	assert.Equal(t, "required_field_empty", violations[0].Invariant)
	t.Logf("✅ Detectou campo obrigatório vazio: %s", violations[0].Message)
}

func TestAssertRequiredUUID_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRequiredUUID("app_id", "550e8400-e29b-41d4-a716-446655440000", "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "UUID válido não deveria gerar violação")
	t.Log("✅ UUID válido passou")
}

func TestAssertRequiredUUID_Nil_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRequiredUUID("app_id", "00000000-0000-0000-0000-000000000000", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar UUID nil")
	assert.Equal(t, "required_uuid_nil", violations[0].Invariant)
	t.Logf("✅ Detectou UUID nil: %s", violations[0].Message)
}


func TestAssertRequiredUUID_Empty_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRequiredUUID("user_id", "", "session", "session-456")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar UUID vazio")
	assert.Equal(t, "required_uuid_nil", violations[0].Invariant)
	t.Logf("✅ Detectou UUID vazio: %s", violations[0].Message)
}

// ========================================
// TESTES DE TIMESTAMPS
// ========================================

func TestAssertTimestampCoherence_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	created := time.Now().Add(-1 * time.Hour)
	updated := time.Now()

	AssertTimestampCoherence(created, updated, "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Timestamps coerentes não deveriam gerar violação")
	t.Log("✅ Timestamps coerentes passaram")
}

func TestAssertTimestampCoherence_SameTime_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	now := time.Now()
	AssertTimestampCoherence(now, now, "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Timestamps iguais não deveriam gerar violação")
	t.Log("✅ Timestamps iguais passaram")
}

func TestAssertTimestampCoherence_UpdatedBeforeCreated_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	created := time.Now()
	updated := time.Now().Add(-1 * time.Hour) // Antes de created!

	AssertTimestampCoherence(created, updated, "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar incoerência de timestamps")
	assert.Equal(t, "timestamp_incoherence", violations[0].Invariant)
	t.Logf("✅ Detectou timestamp incoerente: %s", violations[0].Message)
}

func TestAssertTimestampNotFuture_Past_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	past := time.Now().Add(-1 * time.Hour)
	AssertTimestampNotFuture(past, "created_at", "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Timestamp no passado não deveria gerar violação")
	t.Log("✅ Timestamp no passado passou")
}

func TestAssertTimestampNotFuture_FarFuture_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	future := time.Now().Add(1 * time.Hour) // Muito no futuro
	AssertTimestampNotFuture(future, "created_at", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar timestamp no futuro")
	assert.Equal(t, "timestamp_future", violations[0].Invariant)
	t.Logf("✅ Detectou timestamp no futuro: %s", violations[0].Message)
}

func TestAssertTimestampNotTooOld_Recent_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	recent := time.Now().Add(-1 * time.Hour)
	AssertTimestampNotTooOld(recent, 24*time.Hour, "last_login", "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Timestamp recente não deveria gerar violação")
	t.Log("✅ Timestamp recente passou")
}

func TestAssertTimestampNotTooOld_Ancient_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	ancient := time.Now().Add(-365 * 24 * time.Hour) // 1 ano atrás
	AssertTimestampNotTooOld(ancient, 30*24*time.Hour, "last_login", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar timestamp muito antigo")
	assert.Equal(t, "timestamp_too_old", violations[0].Invariant)
	t.Logf("✅ Detectou timestamp muito antigo: %s", violations[0].Message)
}


// ========================================
// TESTES DE VERSÕES
// ========================================

func TestAssertVersionIncremental_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertVersionIncremental(1, 2, "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Versão incremental não deveria gerar violação")
	t.Log("✅ Versão incremental passou")
}

func TestAssertVersionIncremental_Skip_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertVersionIncremental(1, 5, "user", "user-123") // Pulou versões

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar pulo de versão")
	assert.Equal(t, "version_not_incremental", violations[0].Invariant)
	t.Logf("✅ Detectou pulo de versão: %s", violations[0].Message)
}

func TestAssertVersionIncremental_Backwards_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertVersionIncremental(5, 3, "user", "user-123") // Voltou versão

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar versão regressiva")
	assert.Equal(t, "version_not_incremental", violations[0].Invariant)
	t.Logf("✅ Detectou versão regressiva: %s", violations[0].Message)
}

func TestAssertVersionPositive_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertVersionPositive(1, "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Versão positiva não deveria gerar violação")
	t.Log("✅ Versão positiva passou")
}

func TestAssertVersionPositive_Zero_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertVersionPositive(0, "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar versão zero")
	assert.Equal(t, "version_not_positive", violations[0].Invariant)
	t.Logf("✅ Detectou versão zero: %s", violations[0].Message)
}

func TestAssertVersionPositive_Negative_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertVersionPositive(-1, "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar versão negativa")
	assert.Equal(t, "version_not_positive", violations[0].Invariant)
	t.Logf("✅ Detectou versão negativa: %s", violations[0].Message)
}

// ========================================
// TESTES DE REFERÊNCIAS
// ========================================

func TestAssertForeignKeyExists_Exists_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertForeignKeyExists("app_id", "app-123", true, "user", "user-456")

	violations := GetViolations()
	assert.Empty(t, violations, "FK existente não deveria gerar violação")
	t.Log("✅ FK existente passou")
}

func TestAssertForeignKeyExists_Orphan_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertForeignKeyExists("app_id", "app-deleted", false, "user", "user-456")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar FK órfã")
	assert.Equal(t, "foreign_key_orphan", violations[0].Invariant)
	t.Logf("✅ Detectou FK órfã: %s", violations[0].Message)
}

func TestAssertNoCircularReference_NoCircle_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Hierarquia: A -> B -> C (sem ciclo)
	AssertNoCircularReference("C", "B", []string{"A", "B"})

	violations := GetViolations()
	assert.Empty(t, violations, "Hierarquia sem ciclo não deveria gerar violação")
	t.Log("✅ Hierarquia sem ciclo passou")
}

func TestAssertNoCircularReference_Circle_Fatal(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou referência circular: %v", r)
			assert.Contains(t, r.(string), "circular_reference")
		} else {
			t.Fatal("Deveria ter dado panic para referência circular")
		}
	}()

	// Hierarquia: A -> B -> C -> A (ciclo!)
	AssertNoCircularReference("A", "C", []string{"A", "B", "C"})
}


// ========================================
// TESTES DE FORMATO
// ========================================

func TestAssertValidEmail_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidEmail("user@example.com", "user", "user-123")
	assert.True(t, valid, "Email válido deveria passar")

	violations := GetViolations()
	assert.Empty(t, violations, "Email válido não deveria gerar violação")
	t.Log("✅ Email válido passou")
}

func TestAssertValidEmail_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidEmail("invalid-email", "user", "user-123")
	assert.False(t, valid, "Email inválido deveria falhar")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar email inválido")
	assert.Equal(t, "invalid_email_format", violations[0].Invariant)
	t.Logf("✅ Detectou email inválido: %s", violations[0].Message)
}

func TestAssertValidEmail_MasksEmail(t *testing.T) {
	ClearViolations()
	Enable()

	AssertValidEmail("invalid", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1)
	// Verifica que email foi mascarado no contexto
	email := violations[0].Context["email"].(string)
	assert.NotEqual(t, "invalid", email, "Email deveria estar mascarado")
	t.Logf("✅ Email mascarado no log: %s", email)
}

func TestAssertValidPhone_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidPhone("+5511999999999", "user", "user-123")
	assert.True(t, valid, "Telefone válido deveria passar")

	violations := GetViolations()
	assert.Empty(t, violations, "Telefone válido não deveria gerar violação")
	t.Log("✅ Telefone válido passou")
}

func TestAssertValidPhone_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidPhone("abc", "user", "user-123")
	assert.False(t, valid, "Telefone inválido deveria falhar")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar telefone inválido")
	assert.Equal(t, "invalid_phone_format", violations[0].Invariant)
	t.Logf("✅ Detectou telefone inválido: %s", violations[0].Message)
}

func TestAssertValidURL_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidURL("https://example.com/webhook", "webhook", "webhook-123")
	assert.True(t, valid, "URL válida deveria passar")

	violations := GetViolations()
	assert.Empty(t, violations, "URL válida não deveria gerar violação")
	t.Log("✅ URL válida passou")
}

func TestAssertValidURL_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidURL("not-a-url", "webhook", "webhook-123")
	assert.False(t, valid, "URL inválida deveria falhar")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar URL inválida")
	assert.Equal(t, "invalid_url_format", violations[0].Invariant)
	t.Logf("✅ Detectou URL inválida: %s", violations[0].Message)
}

func TestAssertValidURL_HTTP_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidURL("http://localhost:8080/callback", "webhook", "webhook-123")
	assert.True(t, valid, "URL HTTP deveria passar")

	violations := GetViolations()
	assert.Empty(t, violations, "URL HTTP não deveria gerar violação")
	t.Log("✅ URL HTTP passou")
}


// ========================================
// TESTES DE ESTADO
// ========================================

func TestAssertValidStatus_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	validStatuses := []string{"pending", "active", "suspended", "deleted"}
	AssertValidStatus("active", validStatuses, "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Status válido não deveria gerar violação")
	t.Log("✅ Status válido passou")
}

func TestAssertValidStatus_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	validStatuses := []string{"pending", "active", "suspended", "deleted"}
	AssertValidStatus("unknown", validStatuses, "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar status inválido")
	assert.Equal(t, "invalid_status", violations[0].Invariant)
	t.Logf("✅ Detectou status inválido: %s", violations[0].Message)
}

func TestAssertValidStateTransition_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	transitions := map[string][]string{
		"pending":   {"active", "deleted"},
		"active":    {"suspended", "deleted"},
		"suspended": {"active", "deleted"},
		"deleted":   {},
	}

	AssertValidStateTransition("pending", "active", transitions, "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Transição válida não deveria gerar violação")
	t.Log("✅ Transição válida passou")
}

func TestAssertValidStateTransition_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	transitions := map[string][]string{
		"pending":   {"active", "deleted"},
		"active":    {"suspended", "deleted"},
		"suspended": {"active", "deleted"},
		"deleted":   {},
	}

	// Tentar ir de pending direto para suspended (não permitido)
	AssertValidStateTransition("pending", "suspended", transitions, "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar transição inválida")
	assert.Equal(t, "invalid_state_transition", violations[0].Invariant)
	t.Logf("✅ Detectou transição inválida: %s", violations[0].Message)
}

func TestAssertValidStateTransition_FromDeleted_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	transitions := map[string][]string{
		"pending":   {"active", "deleted"},
		"active":    {"suspended", "deleted"},
		"suspended": {"active", "deleted"},
		"deleted":   {},
	}

	// Tentar ressuscitar entidade deletada
	AssertValidStateTransition("deleted", "active", transitions, "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar ressurreição de deletado")
	assert.Equal(t, "invalid_state_transition", violations[0].Invariant)
	t.Logf("✅ Detectou tentativa de ressurreição: %s", violations[0].Message)
}

func TestAssertValidStateTransition_UnknownState_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	transitions := map[string][]string{
		"pending": {"active"},
		"active":  {"deleted"},
	}

	// Estado atual não existe no mapa
	AssertValidStateTransition("unknown", "active", transitions, "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar estado desconhecido")
	assert.Equal(t, "invalid_state_transition", violations[0].Invariant)
	t.Logf("✅ Detectou estado desconhecido: %s", violations[0].Message)
}


// ========================================
// TESTES DE LIMITES
// ========================================

func TestAssertWithinRange_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWithinRange(50, 0, 100, "age", "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Valor dentro do range não deveria gerar violação")
	t.Log("✅ Valor dentro do range passou")
}

func TestAssertWithinRange_AtMin_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWithinRange(0, 0, 100, "age", "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Valor no mínimo não deveria gerar violação")
	t.Log("✅ Valor no mínimo passou")
}

func TestAssertWithinRange_AtMax_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWithinRange(100, 0, 100, "age", "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Valor no máximo não deveria gerar violação")
	t.Log("✅ Valor no máximo passou")
}

func TestAssertWithinRange_BelowMin_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWithinRange(-10, 0, 100, "age", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar valor abaixo do mínimo")
	assert.Equal(t, "value_out_of_range", violations[0].Invariant)
	t.Logf("✅ Detectou valor abaixo do mínimo: %s", violations[0].Message)
}

func TestAssertWithinRange_AboveMax_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertWithinRange(150, 0, 100, "age", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar valor acima do máximo")
	assert.Equal(t, "value_out_of_range", violations[0].Invariant)
	t.Logf("✅ Detectou valor acima do máximo: %s", violations[0].Message)
}

func TestAssertStringLength_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertStringLength("hello", 1, 10, "name", "user", "user-123")

	violations := GetViolations()
	assert.Empty(t, violations, "String com tamanho válido não deveria gerar violação")
	t.Log("✅ String com tamanho válido passou")
}

func TestAssertStringLength_TooShort_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertStringLength("ab", 3, 10, "name", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar string muito curta")
	assert.Equal(t, "string_length_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou string muito curta: %s", violations[0].Message)
}

func TestAssertStringLength_TooLong_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertStringLength("this is a very long string", 1, 10, "name", "user", "user-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar string muito longa")
	assert.Equal(t, "string_length_invalid", violations[0].Invariant)
	t.Logf("✅ Detectou string muito longa: %s", violations[0].Message)
}

func TestAssertNonNegative_Positive_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertNonNegative(100, "balance", "account", "acc-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Valor positivo não deveria gerar violação")
	t.Log("✅ Valor positivo passou")
}

func TestAssertNonNegative_Zero_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertNonNegative(0, "balance", "account", "acc-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Valor zero não deveria gerar violação")
	t.Log("✅ Valor zero passou")
}

func TestAssertNonNegative_Negative_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertNonNegative(-100, "balance", "account", "acc-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar valor negativo")
	assert.Equal(t, "negative_value", violations[0].Invariant)
	t.Logf("✅ Detectou valor negativo: %s", violations[0].Message)
}


// ========================================
// TESTES DE UNICIDADE
// ========================================

func TestAssertUnique_NotDuplicate_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertUnique("email", "new@example.com", false, "user")

	violations := GetViolations()
	assert.Empty(t, violations, "Valor único não deveria gerar violação")
	t.Log("✅ Valor único passou")
}

func TestAssertUnique_Duplicate_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertUnique("email", "existing@example.com", true, "user")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar duplicata")
	assert.Equal(t, "duplicate_value", violations[0].Invariant)
	t.Logf("✅ Detectou duplicata: %s", violations[0].Message)
}

// ========================================
// TESTES DE CONSISTÊNCIA
// ========================================

func TestAssertConsistentTotals_Match_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertConsistentTotals(1000, 1000, "total_amount", "order", "order-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Totais consistentes não deveriam gerar violação")
	t.Log("✅ Totais consistentes passaram")
}

func TestAssertConsistentTotals_Mismatch_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertConsistentTotals(1000, 900, "total_amount", "order", "order-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar totais inconsistentes")
	assert.Equal(t, "inconsistent_totals", violations[0].Invariant)
	t.Logf("✅ Detectou totais inconsistentes: %s", violations[0].Message)
}

func TestAssertBalanceEquation_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Balance = Credits - Debits
	// 500 = 1000 - 500
	AssertBalanceEquation(500, 1000, 500, "account", "acc-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Equação de saldo correta não deveria gerar violação")
	t.Log("✅ Equação de saldo correta passou")
}

func TestAssertBalanceEquation_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	// Balance deveria ser 500, mas está 600
	AssertBalanceEquation(600, 1000, 500, "account", "acc-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar equação de saldo violada")
	assert.Equal(t, "balance_equation_violated", violations[0].Invariant)
	t.Logf("✅ Detectou equação de saldo violada: %s", violations[0].Message)
}

func TestAssertBalanceEquation_ZeroBalance_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Balance = 0 quando Credits = Debits
	AssertBalanceEquation(0, 1000, 1000, "account", "acc-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Saldo zero com créditos = débitos não deveria gerar violação")
	t.Log("✅ Saldo zero passou")
}

func TestAssertBalanceEquation_NegativeBalance_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Balance negativo é matematicamente válido (débitos > créditos)
	// -500 = 500 - 1000
	AssertBalanceEquation(-500, 500, 1000, "account", "acc-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Saldo negativo matematicamente correto não deveria gerar violação")
	t.Log("✅ Saldo negativo matematicamente correto passou")
}


// ========================================
// TESTES DE HELPERS
// ========================================

func TestMaskEmail_Valid(t *testing.T) {
	masked := maskEmail("john.doe@example.com")
	assert.Equal(t, "jo****@example.com", masked)
	t.Logf("✅ Email mascarado: %s", masked)
}

func TestMaskEmail_Short(t *testing.T) {
	masked := maskEmail("ab@x.com")
	assert.Equal(t, "**@x.com", masked)
	t.Logf("✅ Email curto mascarado: %s", masked)
}

func TestMaskEmail_Invalid(t *testing.T) {
	masked := maskEmail("invalid")
	assert.Equal(t, "****", masked)
	t.Logf("✅ Email inválido mascarado: %s", masked)
}

func TestMaskPhone_Valid(t *testing.T) {
	masked := maskPhone("+5511999999999")
	assert.Equal(t, "****9999", masked)
	t.Logf("✅ Telefone mascarado: %s", masked)
}

func TestMaskPhone_Short(t *testing.T) {
	masked := maskPhone("1234")
	assert.Equal(t, "****", masked)
	t.Logf("✅ Telefone curto mascarado: %s", masked)
}

// ========================================
// TESTES DE INTEGRAÇÃO
// ========================================

func TestDataIntegrity_FullEntityValidation(t *testing.T) {
	ClearViolations()
	Enable()

	// Simular validação completa de uma entidade
	entityID := "user-123"
	entityType := "user"

	// 1. Campos obrigatórios
	AssertRequiredField("name", "John Doe", entityType, entityID)
	AssertRequiredUUID("app_id", "550e8400-e29b-41d4-a716-446655440000", entityType, entityID)

	// 2. Timestamps
	created := time.Now().Add(-1 * time.Hour)
	updated := time.Now()
	AssertTimestampCoherence(created, updated, entityType, entityID)
	AssertTimestampNotFuture(created, "created_at", entityType, entityID)

	// 3. Versão
	AssertVersionPositive(1, entityType, entityID)

	// 4. Formato
	AssertValidEmail("john@example.com", entityType, entityID)

	// 5. Status
	validStatuses := []string{"pending", "active", "suspended", "deleted"}
	AssertValidStatus("active", validStatuses, entityType, entityID)

	violations := GetViolations()
	assert.Empty(t, violations, "Entidade válida não deveria gerar violações")
	t.Log("✅ Validação completa de entidade passou")
}

func TestDataIntegrity_CorruptedEntity(t *testing.T) {
	ClearViolations()
	Enable()

	entityID := "user-corrupted"
	entityType := "user"

	// Entidade com múltiplos problemas
	AssertRequiredField("name", "", entityType, entityID)                                       // Campo vazio
	AssertRequiredUUID("app_id", "00000000-0000-0000-0000-000000000000", entityType, entityID)  // UUID nil
	AssertTimestampCoherence(time.Now(), time.Now().Add(-1*time.Hour), entityType, entityID)   // Timestamps invertidos
	AssertVersionPositive(0, entityType, entityID)                                              // Versão zero
	AssertValidEmail("invalid", entityType, entityID)                                           // Email inválido
	AssertValidStatus("unknown", []string{"active", "deleted"}, entityType, entityID)          // Status inválido

	violations := GetViolations()
	assert.Len(t, violations, 6, "Deveria detectar 6 violações")

	// Verificar tipos de violação
	invariants := make(map[string]bool)
	for _, v := range violations {
		invariants[v.Invariant] = true
	}

	assert.True(t, invariants["required_field_empty"])
	assert.True(t, invariants["required_uuid_nil"])
	assert.True(t, invariants["timestamp_incoherence"])
	assert.True(t, invariants["version_not_positive"])
	assert.True(t, invariants["invalid_email_format"])
	assert.True(t, invariants["invalid_status"])

	t.Log("✅ Todas as 6 corrupções foram detectadas")
}

func TestDataIntegrity_FinancialConsistency(t *testing.T) {
	ClearViolations()
	Enable()

	// Simular validação de conta financeira
	accountID := "acc-123"
	entityType := "account"

	// Cenário 1: Conta consistente
	AssertBalanceEquation(500, 1000, 500, entityType, accountID)
	AssertNonNegative(500, "balance", entityType, accountID)
	AssertConsistentTotals(1000, 1000, "total_credits", entityType, accountID)

	violations := GetViolations()
	assert.Empty(t, violations, "Conta consistente não deveria gerar violações")
	t.Log("✅ Conta financeira consistente passou")
}

func TestDataIntegrity_StateMachineTransitions(t *testing.T) {
	ClearViolations()
	Enable()

	transitions := map[string][]string{
		"draft":     {"pending", "deleted"},
		"pending":   {"approved", "rejected", "deleted"},
		"approved":  {"completed", "cancelled"},
		"rejected":  {"draft", "deleted"},
		"completed": {},
		"cancelled": {},
		"deleted":   {},
	}

	entityType := "order"
	entityID := "order-123"

	// Transições válidas
	AssertValidStateTransition("draft", "pending", transitions, entityType, entityID)
	AssertValidStateTransition("pending", "approved", transitions, entityType, entityID)
	AssertValidStateTransition("approved", "completed", transitions, entityType, entityID)

	violations := GetViolations()
	assert.Empty(t, violations, "Transições válidas não deveriam gerar violações")
	t.Log("✅ Transições de state machine válidas passaram")
}

func TestDataIntegrity_StateMachineInvalidTransitions(t *testing.T) {
	ClearViolations()
	Enable()

	transitions := map[string][]string{
		"draft":     {"pending"},
		"pending":   {"approved", "rejected"},
		"approved":  {"completed"},
		"rejected":  {"draft"},
		"completed": {},
	}

	entityType := "order"
	entityID := "order-456"

	// Transições inválidas
	AssertValidStateTransition("draft", "approved", transitions, entityType, entityID)     // Pular pending
	AssertValidStateTransition("completed", "draft", transitions, entityType, entityID)    // Voltar de completed
	AssertValidStateTransition("pending", "completed", transitions, entityType, entityID)  // Pular approved

	violations := GetViolations()
	assert.Len(t, violations, 3, "Deveria detectar 3 transições inválidas")

	for _, v := range violations {
		assert.Equal(t, "invalid_state_transition", v.Invariant)
	}

	t.Log("✅ Todas as 3 transições inválidas foram detectadas")
}
