package invariants

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

/*
================================================================================
TESTES DAS INVARIANTS DE AUDIT
================================================================================

Estes testes garantem que o sistema:
1. BLOQUEIA modificação de eventos de audit
2. DETECTA cadeia de hashes quebrada
3. ALERTA sobre operações sem audit trail
4. VALIDA timestamps e sequências

================================================================================
*/

// ========================================
// TESTES: AssertAuditEventImmutable
// ========================================

func TestAssertAuditEventImmutable_SameHash_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	hash := "abc123def456"
	AssertAuditEventImmutable("event-1", hash, hash)

	violations := GetViolations()
	fatalViolations := 0
	for _, v := range violations {
		if v.Severity == SeverityFatal {
			fatalViolations++
		}
	}

	assert.Equal(t, 0, fatalViolations, "Hashes iguais não deveriam gerar violação")
	t.Log("✅ Evento imutável passou verificação")
}

func TestAssertAuditEventImmutable_DifferentHash_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou modificação de audit: %v", r)
			assert.Contains(t, r.(string), "FATAL INVARIANT")
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu modificação de audit!")
		}
	}()

	AssertAuditEventImmutable("event-1", "original-hash", "modified-hash")
}

// ========================================
// TESTES: AssertAuditChainIntegrity
// ========================================

func TestAssertAuditChainIntegrity_ValidChain_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	previousHash := "hash-of-previous-event"
	AssertAuditChainIntegrity("event-2", previousHash, previousHash)

	t.Log("✅ Cadeia íntegra passou verificação")
}

func TestAssertAuditChainIntegrity_BrokenChain_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema detectou cadeia quebrada: %v", r)
		} else {
			t.Fatal("❌ FALHA: Sistema não detectou cadeia quebrada!")
		}
	}()

	AssertAuditChainIntegrity("event-2", "expected-hash", "different-hash")
}

// ========================================
// TESTES: AssertNoAuditDeletion
// ========================================

func TestAssertNoAuditDeletion_ReadOperation_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertNoAuditDeletion("SELECT", "event-1")
	AssertNoAuditDeletion("read", "event-2")
	AssertNoAuditDeletion("INSERT", "event-3")

	t.Log("✅ Operações de leitura/inserção passaram")
}

func TestAssertNoAuditDeletion_DeleteOperation_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou deleção de audit: %v", r)
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu deleção de audit!")
		}
	}()

	AssertNoAuditDeletion("DELETE", "event-1")
}

func TestAssertNoAuditDeletion_RemoveOperation_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou remoção de audit: %v", r)
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu remoção de audit!")
		}
	}()

	AssertNoAuditDeletion("remove", "event-1")
}

// ========================================
// TESTES: AssertCriticalOperationAudited
// ========================================

func TestAssertCriticalOperationAudited_WithAudit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertCriticalOperationAudited("user_create", "user-123", true)
	AssertCriticalOperationAudited("secret_access", "secret-456", true)
	AssertCriticalOperationAudited("payment_process", "payment-789", true)

	violations := GetViolations()
	auditViolations := 0
	for _, v := range violations {
		if v.Invariant == "critical_operation_not_audited" {
			auditViolations++
		}
	}

	assert.Equal(t, 0, auditViolations, "Operações com audit não deveriam gerar violação")
	t.Log("✅ Operações críticas com audit passaram")
}

func TestAssertCriticalOperationAudited_WithoutAudit_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertCriticalOperationAudited("user_delete", "user-123", false)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "critical_operation_not_audited" {
			found = true
			t.Logf("✅ Detectou operação sem audit: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar operação crítica sem audit")
}

func TestAssertCriticalOperationAudited_NonCritical_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Operação não crítica sem audit não deveria gerar violação
	AssertCriticalOperationAudited("user_view", "user-123", false)

	violations := GetViolations()
	auditViolations := 0
	for _, v := range violations {
		if v.Invariant == "critical_operation_not_audited" {
			auditViolations++
		}
	}

	assert.Equal(t, 0, auditViolations, "Operação não crítica não deveria exigir audit")
	t.Log("✅ Operação não crítica passou sem audit")
}

// ========================================
// TESTES: AssertAuditHasActor
// ========================================

func TestAssertAuditHasActor_ValidActor_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditHasActor("event-1", "user-123", "user")

	violations := GetViolations()
	actorViolations := 0
	for _, v := range violations {
		if v.Invariant == "audit_missing_actor" {
			actorViolations++
		}
	}

	assert.Equal(t, 0, actorViolations, "Evento com ator válido não deveria gerar violação")
	t.Log("✅ Evento com ator válido passou")
}

func TestAssertAuditHasActor_MissingActor_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditHasActor("event-1", "", "user")

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "audit_missing_actor" {
			found = true
		}
	}

	assert.True(t, found, "Deveria detectar evento sem ator")
	t.Log("✅ Detectou evento sem ator")
}

func TestAssertAuditHasActor_NilUUIDActor_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditHasActor("event-1", "00000000-0000-0000-0000-000000000000", "user")

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "audit_missing_actor" {
			found = true
		}
	}

	assert.True(t, found, "Deveria detectar evento com UUID nil como ator")
	t.Log("✅ Detectou evento com UUID nil como ator")
}

// ========================================
// TESTES: AssertAuditTimestampValid
// ========================================

func TestAssertAuditTimestampValid_CurrentTime_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditTimestampValid("event-1", time.Now())

	violations := GetViolations()
	timestampViolations := 0
	for _, v := range violations {
		if v.Invariant == "audit_timestamp_future" || v.Invariant == "audit_timestamp_suspicious" {
			timestampViolations++
		}
	}

	assert.Equal(t, 0, timestampViolations, "Timestamp atual não deveria gerar violação")
	t.Log("✅ Timestamp atual passou")
}

func TestAssertAuditTimestampValid_FutureTime_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	futureTime := time.Now().Add(1 * time.Hour)
	AssertAuditTimestampValid("event-1", futureTime)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "audit_timestamp_future" {
			found = true
			t.Logf("✅ Detectou timestamp futuro: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar timestamp no futuro")
}

func TestAssertAuditTimestampValid_VeryOldTime_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	oldTime := time.Now().AddDate(-2, 0, 0) // 2 anos atrás
	AssertAuditTimestampValid("event-1", oldTime)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "audit_timestamp_suspicious" {
			found = true
			t.Logf("✅ Detectou timestamp suspeito: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar timestamp muito antigo")
}

// ========================================
// TESTES: AssertAuditSequenceValid
// ========================================

func TestAssertAuditSequenceValid_CorrectSequence_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditSequenceValid("event-5", 5, 5)

	violations := GetViolations()
	seqViolations := 0
	for _, v := range violations {
		if v.Invariant == "audit_sequence_invalid" {
			seqViolations++
		}
	}

	assert.Equal(t, 0, seqViolations, "Sequência correta não deveria gerar violação")
	t.Log("✅ Sequência correta passou")
}

func TestAssertAuditSequenceValid_WrongSequence_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditSequenceValid("event-5", 10, 5) // Sequência 10 quando esperava 5

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "audit_sequence_invalid" {
			found = true
			t.Logf("✅ Detectou sequência inválida: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar sequência fora de ordem")
}

// ========================================
// TESTES: AssertAuditBelongsToApp
// ========================================

func TestAssertAuditBelongsToApp_SameApp_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditBelongsToApp("app-123", "app-123")

	violations := GetViolations()
	crossAppViolations := 0
	for _, v := range violations {
		if v.Invariant == "audit_cross_app_access" {
			crossAppViolations++
		}
	}

	assert.Equal(t, 0, crossAppViolations, "Mesmo app não deveria gerar violação")
	t.Log("✅ Acesso do mesmo app passou")
}

func TestAssertAuditBelongsToApp_DifferentApp_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditBelongsToApp("app-123", "app-456")

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "audit_cross_app_access" {
			found = true
			t.Logf("✅ Detectou acesso cross-app: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar acesso cross-app")
}

func TestAssertAuditBelongsToApp_GlobalEvent_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Evento global pode ser acessado por qualquer app
	AssertAuditBelongsToApp("", "app-456")
	AssertAuditBelongsToApp("00000000-0000-0000-0000-000000000000", "app-789")

	violations := GetViolations()
	crossAppViolations := 0
	for _, v := range violations {
		if v.Invariant == "audit_cross_app_access" {
			crossAppViolations++
		}
	}

	assert.Equal(t, 0, crossAppViolations, "Evento global não deveria gerar violação")
	t.Log("✅ Evento global acessível por qualquer app")
}

// ========================================
// TESTES: AssertAuditRateNormal
// ========================================

func TestAssertAuditRateNormal_NormalRate_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditRateNormal("app-123", 50, 100)

	violations := GetViolations()
	rateViolations := 0
	for _, v := range violations {
		if v.Invariant == "audit_rate_anomaly" {
			rateViolations++
		}
	}

	assert.Equal(t, 0, rateViolations, "Taxa normal não deveria gerar violação")
	t.Log("✅ Taxa normal passou")
}

func TestAssertAuditRateNormal_HighRate_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuditRateNormal("app-123", 500, 100) // 5x acima do limite

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "audit_rate_anomaly" {
			found = true
			t.Logf("✅ Detectou taxa anômala: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar taxa anômala")
}

// ========================================
// TESTES: VerifyAuditChainIntegrity
// ========================================

func TestVerifyAuditChainIntegrity_ValidChain_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	events := []AuditEventData{
		{EventID: "event-1", Sequence: 1, StoredHash: "hash1", ComputedHash: "hash1", PreviousHash: "genesis"},
		{EventID: "event-2", Sequence: 2, StoredHash: "hash2", ComputedHash: "hash2", PreviousHash: "hash1"},
		{EventID: "event-3", Sequence: 3, StoredHash: "hash3", ComputedHash: "hash3", PreviousHash: "hash2"},
	}

	result := VerifyAuditChainIntegrity(events)

	assert.True(t, result.IsValid, "Cadeia válida deveria passar")
	assert.Equal(t, int64(3), result.TotalEvents)
	assert.Equal(t, int64(3), result.VerifiedEvents)
	t.Log("✅ Cadeia válida verificada com sucesso")
}

func TestVerifyAuditChainIntegrity_HashMismatch_Fails(t *testing.T) {
	ClearViolations()
	Enable()

	events := []AuditEventData{
		{EventID: "event-1", Sequence: 1, StoredHash: "hash1", ComputedHash: "hash1", PreviousHash: "genesis"},
		{EventID: "event-2", Sequence: 2, StoredHash: "hash2", ComputedHash: "WRONG_HASH", PreviousHash: "hash1"},
	}

	result := VerifyAuditChainIntegrity(events)

	assert.False(t, result.IsValid, "Cadeia com hash errado deveria falhar")
	assert.Equal(t, "event-2", result.FirstBrokenEvent)
	assert.Equal(t, "hash_mismatch", result.ErrorType)
	t.Logf("✅ Detectou hash mismatch no evento %s", result.FirstBrokenEvent)
}

func TestVerifyAuditChainIntegrity_EmptyChain_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	events := []AuditEventData{}

	result := VerifyAuditChainIntegrity(events)

	assert.True(t, result.IsValid, "Cadeia vazia deveria passar")
	assert.Equal(t, int64(0), result.TotalEvents)
	t.Log("✅ Cadeia vazia verificada")
}

// ========================================
// TESTES: AuditContextBuilder
// ========================================

func TestAuditContextBuilder_Complete_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	ctx := NewAuditContext().
		WithActor("user-123", "user").
		WithTarget("resource-456", "document").
		WithApp("app-789").
		WithRequest("192.168.1.1", "Mozilla/5.0")

	ctx.Validate("event-1")

	violations := GetViolations()
	contextViolations := 0
	for _, v := range violations {
		if v.Invariant == "audit_missing_actor" || v.Invariant == "audit_missing_target" {
			contextViolations++
		}
	}

	assert.Equal(t, 0, contextViolations, "Contexto completo não deveria gerar violação")
	t.Log("✅ Contexto completo validado")
}

func TestAuditContextBuilder_MissingActor_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	ctx := NewAuditContext().
		WithTarget("resource-456", "document")

	ctx.Validate("event-1")

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "audit_missing_actor" {
			found = true
		}
	}

	assert.True(t, found, "Deveria detectar ator faltando")
	t.Log("✅ Detectou ator faltando no contexto")
}
