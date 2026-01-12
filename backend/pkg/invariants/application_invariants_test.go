package invariants

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// ========================================
// TESTES DE ISOLAMENTO DE DADOS
// ========================================

func TestAssertDataBelongsToApp_SameApp_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Mesmo app acessando seus dados
	AssertDataBelongsToApp("app-123", "app-123", "user", "user-456")

	violations := GetViolations()
	assert.Empty(t, violations, "Acesso do mesmo app não deveria gerar violação")
	t.Log("✅ Acesso do mesmo app passou")
}

func TestAssertDataBelongsToApp_GlobalData_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Dados globais acessíveis por qualquer app
	AssertDataBelongsToApp("", "app-123", "config", "global-config")
	AssertDataBelongsToApp("global", "app-456", "setting", "system-setting")

	violations := GetViolations()
	assert.Empty(t, violations, "Dados globais deveriam ser acessíveis")
	t.Log("✅ Dados globais acessíveis por qualquer app")
}

func TestAssertDataBelongsToApp_CrossApp_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	// App tentando acessar dados de outro app
	AssertDataBelongsToApp("app-123", "app-456", "secret", "secret-789")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar violação de isolamento")
	assert.Equal(t, "data_isolation_breach", violations[0].Invariant)
	t.Logf("✅ Detectou acesso cross-app: %s", violations[0].Message)
}

// ========================================
// TESTES DE CREDENCIAIS
// ========================================

func TestAssertCredentialBelongsToApp_SameApp_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Credencial usada pelo app correto
	AssertCredentialBelongsToApp("app-123", "app-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Credencial do mesmo app não deveria gerar violação")
	t.Log("✅ Credencial do mesmo app passou")
}

func TestAssertCredentialBelongsToApp_WrongApp_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou uso de credencial de outro app: %v", r)
			assert.Contains(t, r.(string), "credential_app_mismatch")
		} else {
			t.Fatal("Deveria ter dado panic para credencial de outro app")
		}
	}()

	// Credencial de app-123 usada por app-456
	AssertCredentialBelongsToApp("app-123", "app-456")
}

func TestAssertCredentialNotRevoked_Active_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertCredentialNotRevoked("cred-123", "active")

	violations := GetViolations()
	assert.Empty(t, violations, "Credencial ativa não deveria gerar violação")
	t.Log("✅ Credencial ativa passou")
}

func TestAssertCredentialNotRevoked_Revoked_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertCredentialNotRevoked("cred-123", "revoked")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar uso de credencial revogada")
	assert.Equal(t, "revoked_credential_used", violations[0].Invariant)
	t.Logf("✅ Detectou credencial revogada: %s", violations[0].Message)
}

func TestAssertCredentialSecretNotExposed_Safe_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Dados seguros (sem secrets)
	data := map[string]interface{}{
		"app_id":     "app-123",
		"public_key": "pq_pk_abc123",
		"name":       "My App",
	}

	AssertCredentialSecretNotExposed(data)

	violations := GetViolations()
	assert.Empty(t, violations, "Dados sem secrets não deveriam gerar violação")
	t.Log("✅ Dados seguros passaram")
}

func TestAssertCredentialSecretNotExposed_MaskedSecret_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Secret mascarado é OK
	data := map[string]interface{}{
		"secret": "****abcd",
	}

	AssertCredentialSecretNotExposed(data)

	violations := GetViolations()
	assert.Empty(t, violations, "Secret mascarado não deveria gerar violação")
	t.Log("✅ Secret mascarado passou")
}

func TestAssertCredentialSecretNotExposed_PlainSecret_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou exposição de secret: %v", r)
			assert.Contains(t, r.(string), "credential_secret_exposed")
		} else {
			t.Fatal("Deveria ter dado panic para secret exposto")
		}
	}()

	// Secret em texto plano
	data := map[string]interface{}{
		"api_secret": "pq_sk_1234567890abcdef",
	}

	AssertCredentialSecretNotExposed(data)
}

// ========================================
// TESTES DE SESSÕES
// ========================================

func TestAssertSessionBelongsToApp_SameApp_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionBelongsToApp("app-123", "app-123", "session-456")

	violations := GetViolations()
	assert.Empty(t, violations, "Sessão do mesmo app não deveria gerar violação")
	t.Log("✅ Sessão do mesmo app passou")
}

func TestAssertSessionBelongsToApp_WrongApp_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionBelongsToApp("app-123", "app-456", "session-789")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar sessão de outro app")
	assert.Equal(t, "session_app_mismatch", violations[0].Invariant)
	t.Logf("✅ Detectou sessão de outro app: %s", violations[0].Message)
}

func TestAssertSessionNotExpired_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	futureTime := time.Now().Add(1 * time.Hour)
	AssertSessionNotExpired("session-123", futureTime)

	violations := GetViolations()
	assert.Empty(t, violations, "Sessão válida não deveria gerar violação")
	t.Log("✅ Sessão válida passou")
}

func TestAssertSessionNotExpired_Expired_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	pastTime := time.Now().Add(-1 * time.Hour)
	AssertSessionNotExpired("session-123", pastTime)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar sessão expirada")
	assert.Equal(t, "expired_session_used", violations[0].Invariant)
	t.Logf("✅ Detectou sessão expirada: %s", violations[0].Message)
}

func TestAssertSessionUserMatch_SameUser_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionUserMatch("user-123", "user-123", "session-456")

	violations := GetViolations()
	assert.Empty(t, violations, "Sessão do mesmo usuário não deveria gerar violação")
	t.Log("✅ Sessão do mesmo usuário passou")
}

func TestAssertSessionUserMatch_WrongUser_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSessionUserMatch("user-123", "user-456", "session-789")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar sessão de outro usuário")
	assert.Equal(t, "session_user_mismatch", violations[0].Invariant)
	t.Logf("✅ Detectou sessão de outro usuário: %s", violations[0].Message)
}

// ========================================
// TESTES DE SLUG
// ========================================

func TestAssertSlugUnique_New_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSlugUnique("my-new-app", false)

	violations := GetViolations()
	assert.Empty(t, violations, "Slug único não deveria gerar violação")
	t.Log("✅ Slug único passou")
}

func TestAssertSlugUnique_Duplicate_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSlugUnique("existing-app", true)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar slug duplicado")
	assert.Equal(t, "duplicate_slug_attempt", violations[0].Invariant)
	t.Logf("✅ Detectou slug duplicado: %s", violations[0].Message)
}

func TestAssertValidSlug_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidSlug("my-app-123")
	assert.True(t, valid, "Slug válido deveria passar")

	violations := GetViolations()
	assert.Empty(t, violations, "Slug válido não deveria gerar violação")
	t.Log("✅ Slug válido passou")
}

func TestAssertValidSlug_TooShort_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidSlug("ab")
	assert.False(t, valid, "Slug muito curto deveria falhar")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar slug muito curto")
	assert.Equal(t, "invalid_slug_length", violations[0].Invariant)
	t.Logf("✅ Detectou slug muito curto: %s", violations[0].Message)
}

func TestAssertValidSlug_InvalidChars_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertValidSlug("my_app@123")
	assert.False(t, valid, "Slug com caracteres inválidos deveria falhar")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar caracteres inválidos")
	assert.Equal(t, "invalid_slug_chars", violations[0].Invariant)
	t.Logf("✅ Detectou caracteres inválidos: %s", violations[0].Message)
}

// ========================================
// TESTES DE STATUS DE APP
// ========================================

func TestAssertAppActive_Active_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppActive("app-123", "active", "create_user")

	violations := GetViolations()
	assert.Empty(t, violations, "App ativo não deveria gerar violação")
	t.Log("✅ App ativo passou")
}

func TestAssertAppActive_Suspended_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppActive("app-123", "suspended", "create_user")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar operação em app suspenso")
	assert.Equal(t, "inactive_app_operation", violations[0].Invariant)
	t.Logf("✅ Detectou operação em app suspenso: %s", violations[0].Message)
}

func TestAssertAppNotDeleted_Active_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppNotDeleted("app-123", "active")

	violations := GetViolations()
	assert.Empty(t, violations, "App não deletado não deveria gerar violação")
	t.Log("✅ App não deletado passou")
}

func TestAssertAppNotDeleted_Deleted_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou acesso a app deletado: %v", r)
			assert.Contains(t, r.(string), "deleted_app_access")
		} else {
			t.Fatal("Deveria ter dado panic para app deletado")
		}
	}()

	AssertAppNotDeleted("app-123", "deleted")
}

// ========================================
// TESTES DE RATE LIMIT E QUOTA
// ========================================

func TestAssertAppRateLimit_WithinLimit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppRateLimit("app-123", 50, 100, "minute")

	violations := GetViolations()
	assert.Empty(t, violations, "Dentro do limite não deveria gerar violação")
	t.Log("✅ Dentro do rate limit passou")
}

func TestAssertAppRateLimit_Exceeded_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppRateLimit("app-123", 150, 100, "minute")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar rate limit excedido")
	assert.Equal(t, "app_rate_limit_exceeded", violations[0].Invariant)
	t.Logf("✅ Detectou rate limit excedido: %s", violations[0].Message)
}

func TestAssertAppQuota_WithinQuota_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppQuota("app-123", "users", 500, 1000)

	violations := GetViolations()
	assert.Empty(t, violations, "Dentro da quota não deveria gerar violação")
	t.Log("✅ Dentro da quota passou")
}

func TestAssertAppQuota_Exceeded_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppQuota("app-123", "users", 1500, 1000)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar quota excedida")
	assert.Equal(t, "app_quota_exceeded", violations[0].Invariant)
	t.Logf("✅ Detectou quota excedida: %s", violations[0].Message)
}

// ========================================
// TESTES DE HELPERS
// ========================================

func TestLooksLikeHash_SHA256(t *testing.T) {
	// SHA256 hash (64 chars hex)
	hash := "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
	assert.True(t, looksLikeHashApp(hash), "SHA256 deveria ser reconhecido como hash")
	t.Log("✅ SHA256 reconhecido como hash")
}

func TestLooksLikeHash_Bcrypt(t *testing.T) {
	// bcrypt hash
	hash := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
	assert.True(t, looksLikeHashApp(hash), "bcrypt deveria ser reconhecido como hash")
	t.Log("✅ bcrypt reconhecido como hash")
}

func TestLooksLikeHash_PlainText(t *testing.T) {
	// Texto plano
	plain := "my-secret-password"
	assert.False(t, looksLikeHashApp(plain), "Texto plano não deveria ser reconhecido como hash")
	t.Log("✅ Texto plano não reconhecido como hash")
}

// ========================================
// TESTE DE INTEGRAÇÃO
// ========================================

func TestApplicationIsolation_FullScenario(t *testing.T) {
	ClearViolations()
	Enable()

	// Cenário: App A tenta acessar recursos de App B
	appA := "app-a-123"
	appB := "app-b-456"

	// 1. Tentar acessar dados de outro app
	AssertDataBelongsToApp(appB, appA, "user", "user-789")

	// 2. Tentar usar sessão de outro app
	AssertSessionBelongsToApp(appB, appA, "session-xyz")

	// 3. Verificar que violações foram registradas
	violations := GetViolations()
	assert.Len(t, violations, 2, "Deveria ter 2 violações de isolamento")

	// Verificar tipos de violação
	codes := make([]string, len(violations))
	for i, v := range violations {
		codes[i] = v.Invariant
	}

	assert.Contains(t, codes, "data_isolation_breach")
	assert.Contains(t, codes, "session_app_mismatch")

	t.Log("✅ Cenário completo de isolamento detectou todas as violações")
}

func TestApplicationOwnership_AdminOperations(t *testing.T) {
	ClearViolations()
	Enable()

	owner := "user-owner-123"
	attacker := "user-attacker-456"

	// Tentativa de operação admin por não-dono
	AssertAppOwnership(owner, attacker, "delete_app")
	AssertAppOwnership(owner, attacker, "update_settings")
	AssertAppOwnership(owner, attacker, "revoke_credentials")

	violations := GetViolations()
	assert.Len(t, violations, 3, "Deveria ter 3 violações de ownership")

	for _, v := range violations {
		assert.Equal(t, "app_ownership_violation", v.Invariant)
		assert.Contains(t, v.Message, attacker)
	}

	t.Log("✅ Todas as tentativas de operação admin por não-dono foram detectadas")
}

func TestHashedSecretNotExposed(t *testing.T) {
	ClearViolations()
	Enable()

	// Secret hashado é seguro
	data := map[string]interface{}{
		"secret_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	}

	AssertCredentialSecretNotExposed(data)

	violations := GetViolations()
	assert.Empty(t, violations, "Secret hashado não deveria gerar violação")
	t.Log("✅ Secret hashado passou sem violação")
}

func TestMultipleViolationsInSequence(t *testing.T) {
	ClearViolations()
	Enable()

	// Simular múltiplas violações em sequência (ataque)
	for i := 0; i < 5; i++ {
		AssertDataBelongsToApp("app-victim", "app-attacker", "secret", "secret-"+string(rune('0'+i)))
	}

	violations := GetViolations()
	assert.Len(t, violations, 5, "Deveria registrar todas as 5 tentativas")

	// Todas deveriam ser do mesmo tipo
	for _, v := range violations {
		assert.Equal(t, "data_isolation_breach", v.Invariant)
		assert.True(t, strings.Contains(v.Message, "app-victim"))
		assert.True(t, strings.Contains(v.Message, "app-attacker"))
	}

	t.Log("✅ Todas as 5 tentativas de ataque foram registradas")
}
