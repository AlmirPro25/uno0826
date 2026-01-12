package invariants

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

/*
================================================================================
TESTES DAS INVARIANTS DE SECRETS
================================================================================

Estes testes garantem que o sistema:
1. RECUSA salvar secrets em plaintext
2. DETECTA secrets em logs
3. ALERTA sobre acessos sem audit

================================================================================
*/

// ========================================
// TESTES: AssertSecretEncrypted
// ========================================

func TestAssertSecretEncrypted_PlaintextStripeKey_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	// Tentar salvar uma Stripe key em plaintext deve causar PANIC
	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou Stripe key em plaintext: %v", r)
			assert.Contains(t, r.(string), "FATAL INVARIANT")
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu salvar Stripe key em plaintext!")
		}
	}()

	AssertSecretEncrypted("STRIPE_SECRET_KEY", "sk_test_FAKE_KEY_FOR_TESTING_ONLY")
}

func TestAssertSecretEncrypted_PlaintextAWSKey_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou AWS key em plaintext: %v", r)
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu salvar AWS key em plaintext!")
		}
	}()

	AssertSecretEncrypted("AWS_ACCESS_KEY", "AKIAIOSFODNN7EXAMPLE")
}

func TestAssertSecretEncrypted_PlaintextJWT_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou JWT em plaintext: %v", r)
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu salvar JWT em plaintext!")
		}
	}()

	// JWT típico
	jwt := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
	AssertSecretEncrypted("AUTH_TOKEN", jwt)
}

func TestAssertSecretEncrypted_PlaintextGitHubToken_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou GitHub token em plaintext: %v", r)
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu salvar GitHub token em plaintext!")
		}
	}()

	AssertSecretEncrypted("GITHUB_TOKEN", "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
}

func TestAssertSecretEncrypted_WeakPassword_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou senha fraca: %v", r)
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu salvar senha fraca!")
		}
	}()

	AssertSecretEncrypted("DB_PASSWORD", "123456")
}

func TestAssertSecretEncrypted_EncryptedValue_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Valor que parece criptografado (base64 de alta entropia)
	encryptedValue := "dGhpcyBpcyBhIHRlc3QgZW5jcnlwdGVkIHZhbHVlIHdpdGggaGlnaCBlbnRyb3B5"

	// Não deve causar panic
	AssertSecretEncrypted("ENCRYPTED_SECRET", encryptedValue)

	violations := GetViolations()
	fatalViolations := 0
	for _, v := range violations {
		if v.Severity == SeverityFatal {
			fatalViolations++
		}
	}

	assert.Equal(t, 0, fatalViolations, "Valor criptografado não deveria causar violação FATAL")
	t.Log("✅ Valor criptografado passou sem bloqueio")
}

func TestAssertSecretEncrypted_BcryptHash_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Hash bcrypt válido
	bcryptHash := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

	AssertSecretEncrypted("PASSWORD_HASH", bcryptHash)

	t.Log("✅ Hash bcrypt passou sem bloqueio")
}

func TestAssertSecretEncrypted_EmptyValue_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Valor vazio não deve causar problema
	AssertSecretEncrypted("OPTIONAL_SECRET", "")

	t.Log("✅ Valor vazio passou sem bloqueio")
}

// ========================================
// TESTES: AssertNoSecretInLogs
// ========================================

func TestAssertNoSecretInLogs_StripeKeyInLog_Detected(t *testing.T) {
	ClearViolations()
	Enable()

	logMessage := "Processing payment with key sk_test_FAKE_KEY_FOR_TESTING_ONLY"

	AssertNoSecretInLogs(logMessage)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "secret_in_log_detected" || v.Invariant == "secret_inline_in_log" {
			found = true
			t.Logf("✅ Detectou Stripe key em log: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar Stripe key em log")
}

func TestAssertNoSecretInLogs_JWTInLog_Detected(t *testing.T) {
	ClearViolations()
	Enable()

	jwt := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
	logMessage := "User authenticated with token: " + jwt

	AssertNoSecretInLogs(logMessage)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "secret_in_log_detected" || strings.Contains(v.Invariant, "secret") {
			found = true
		}
	}

	assert.True(t, found, "Deveria detectar JWT em log")
	t.Log("✅ Detectou JWT em log")
}

func TestAssertNoSecretInLogs_InlineApiKey_Detected(t *testing.T) {
	ClearViolations()
	Enable()

	logMessage := "Request failed: api_key=super_secret_key_12345678901234567890"

	AssertNoSecretInLogs(logMessage)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "secret_inline_in_log" {
			found = true
			t.Logf("✅ Detectou API key inline em log: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar API key inline em log")
}

func TestAssertNoSecretInLogs_InlinePassword_Detected(t *testing.T) {
	ClearViolations()
	Enable()

	logMessage := "Database connection: password=mysupersecretpassword123"

	AssertNoSecretInLogs(logMessage)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if strings.Contains(v.Invariant, "secret") {
			found = true
		}
	}

	assert.True(t, found, "Deveria detectar password inline em log")
	t.Log("✅ Detectou password inline em log")
}

func TestAssertNoSecretInLogs_SafeMessage_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	logMessage := "User john@example.com logged in successfully from IP 192.168.1.1"

	AssertNoSecretInLogs(logMessage)

	violations := GetViolations()
	secretViolations := 0
	for _, v := range violations {
		if strings.Contains(v.Invariant, "secret") {
			secretViolations++
		}
	}

	assert.Equal(t, 0, secretViolations, "Mensagem segura não deveria gerar violação")
	t.Log("✅ Mensagem segura passou sem violação")
}

// ========================================
// TESTES: AssertSecretAccessLogged
// ========================================

func TestAssertSecretAccessLogged_WithAudit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSecretAccessLogged("secret-123", "user-456", "read", true)

	violations := GetViolations()
	accessViolations := 0
	for _, v := range violations {
		if v.Invariant == "secret_access_not_logged" {
			accessViolations++
		}
	}

	assert.Equal(t, 0, accessViolations, "Acesso com audit não deveria gerar violação")
	t.Log("✅ Acesso com audit passou")
}

func TestAssertSecretAccessLogged_WithoutAudit_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSecretAccessLogged("secret-123", "user-456", "read", false)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "secret_access_not_logged" {
			found = true
			t.Logf("✅ Detectou acesso sem audit: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar acesso sem audit")
}

// ========================================
// TESTES: AssertSecretBelongsToApp
// ========================================

func TestAssertSecretBelongsToApp_SameApp_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSecretBelongsToApp("app-123", "app-123")

	violations := GetViolations()
	crossAppViolations := 0
	for _, v := range violations {
		if v.Invariant == "secret_cross_app_access" {
			crossAppViolations++
		}
	}

	assert.Equal(t, 0, crossAppViolations, "Mesmo app não deveria gerar violação")
	t.Log("✅ Acesso do mesmo app passou")
}

func TestAssertSecretBelongsToApp_DifferentApp_Detected(t *testing.T) {
	ClearViolations()
	Enable()

	AssertSecretBelongsToApp("app-123", "app-456")

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "secret_cross_app_access" {
			found = true
			t.Logf("✅ Detectou acesso cross-app: %s", v.Message)
		}
	}

	assert.True(t, found, "Deveria detectar acesso cross-app")
}

func TestAssertSecretBelongsToApp_GlobalSecret_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// Secret global (sem app) pode ser acessado por qualquer app
	AssertSecretBelongsToApp("", "app-456")
	AssertSecretBelongsToApp("00000000-0000-0000-0000-000000000000", "app-789")

	violations := GetViolations()
	crossAppViolations := 0
	for _, v := range violations {
		if v.Invariant == "secret_cross_app_access" {
			crossAppViolations++
		}
	}

	assert.Equal(t, 0, crossAppViolations, "Secret global não deveria gerar violação")
	t.Log("✅ Secret global acessível por qualquer app")
}

// ========================================
// TESTES: AssertMasterKeyValid
// ========================================

func TestAssertMasterKeyValid_CorrectLength_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	// 32 bytes é o tamanho correto para AES-256
	AssertMasterKeyValid(32)

	t.Log("✅ Master key de 32 bytes passou")
}

func TestAssertMasterKeyValid_WrongLength_Panics(t *testing.T) {
	ClearViolations()
	Enable()

	defer func() {
		if r := recover(); r != nil {
			t.Logf("✅ Sistema bloqueou master key inválida: %v", r)
		} else {
			t.Fatal("❌ FALHA: Sistema permitiu master key inválida!")
		}
	}()

	AssertMasterKeyValid(16) // Tamanho errado
}

// ========================================
// TESTES: SanitizeForLog
// ========================================

func TestSanitizeForLog_RemovesStripeKey(t *testing.T) {
	input := "Payment processed with sk_test_FAKE_KEY_FOR_TESTING_ONLY"
	result := SanitizeForLog(input)

	// Verifica que a key foi redacted
	assert.NotEqual(t, input, result, "Deveria ter modificado a string")
	t.Logf("✅ Stripe key sanitizada: %s", result)
}

func TestSanitizeForLog_RemovesInlinePassword(t *testing.T) {
	input := "Connection string: password=mysecretpassword123 host=localhost"
	result := SanitizeForLog(input)

	assert.Contains(t, result, "[REDACTED]")
	assert.NotContains(t, result, "mysecretpassword123")
	t.Logf("✅ Password inline removido: %s", result)
}

func TestSanitizeForLog_PreservesSafeContent(t *testing.T) {
	input := "User john@example.com logged in from 192.168.1.1"
	result := SanitizeForLog(input)

	assert.Equal(t, input, result)
	t.Log("✅ Conteúdo seguro preservado")
}

// ========================================
// TESTES: Helpers
// ========================================

func TestCalculateEntropy(t *testing.T) {
	// String com baixa entropia (repetitiva)
	lowEntropy := calculateEntropy("aaaaaaaaaa")
	assert.Less(t, lowEntropy, 1.0, "String repetitiva deveria ter baixa entropia")

	// String com alta entropia (aleatória)
	highEntropy := calculateEntropy("aB3$xY9@kL2#mN5&")
	assert.Greater(t, highEntropy, 3.0, "String aleatória deveria ter alta entropia")

	t.Logf("Entropia baixa: %.2f, Entropia alta: %.2f", lowEntropy, highEntropy)
}

func TestLooksLikeEncrypted(t *testing.T) {
	// Base64 válido com tamanho adequado
	assert.True(t, looksLikeEncrypted("dGhpcyBpcyBhIHRlc3Q="))

	// Bcrypt hash
	assert.True(t, looksLikeEncrypted("$2a$10$N9qo8uLOickgx2ZMRZoMye"))

	// Plaintext curto
	assert.False(t, looksLikeEncrypted("plaintext"))

	t.Log("✅ Detecção de criptografia funcionando")
}

func TestMaskForLog(t *testing.T) {
	assert.Equal(t, "sk_t****ONLY", maskForLog("sk_test_FAKE_KEY_FOR_TESTING_ONLY"))
	assert.Equal(t, "****", maskForLog("short"))
	assert.Equal(t, "****", maskForLog(""))

	t.Log("✅ Mascaramento funcionando")
}
