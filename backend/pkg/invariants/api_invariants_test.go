package invariants

import (
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// ========================================
// TESTES DE RATE LIMITING
// ========================================

func TestAssertRateLimitNotExceeded_WithinLimit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRateLimitNotExceeded(50, 100, "minute", "client-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Dentro do rate limit não deveria gerar violação")
	t.Log("✅ Rate limit dentro do limite passou")
}

func TestAssertRateLimitNotExceeded_Exceeded_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRateLimitNotExceeded(150, 100, "minute", "client-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar rate limit excedido")
	assert.Equal(t, "rate_limit_exceeded", violations[0].Invariant)
	t.Logf("✅ Detectou rate limit excedido: %s", violations[0].Message)
}

func TestAssertBurstLimitNotExceeded_WithinLimit_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertBurstLimitNotExceeded(5, 10, "client-123")

	violations := GetViolations()
	assert.Empty(t, violations, "Dentro do burst limit não deveria gerar violação")
	t.Log("✅ Burst limit dentro do limite passou")
}

func TestAssertBurstLimitNotExceeded_Exceeded_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertBurstLimitNotExceeded(20, 10, "client-123")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar burst limit excedido")
	assert.Equal(t, "burst_limit_exceeded", violations[0].Invariant)
	t.Logf("✅ Detectou burst limit excedido: %s", violations[0].Message)
}


// ========================================
// TESTES DE PAYLOAD
// ========================================

func TestAssertPayloadSizeWithinLimit_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertPayloadSizeWithinLimit(1024, 10240, "/api/users")

	violations := GetViolations()
	assert.Empty(t, violations, "Payload dentro do limite não deveria gerar violação")
	t.Log("✅ Payload dentro do limite passou")
}

func TestAssertPayloadSizeWithinLimit_TooLarge_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertPayloadSizeWithinLimit(20480, 10240, "/api/users")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar payload muito grande")
	assert.Equal(t, "payload_too_large", violations[0].Invariant)
	t.Logf("✅ Detectou payload muito grande: %s", violations[0].Message)
}

func TestAssertRequestBodyNotEmpty_POST_WithBody_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRequestBodyNotEmpty(100, "POST", "/api/users")

	violations := GetViolations()
	assert.Empty(t, violations, "POST com body não deveria gerar violação")
	t.Log("✅ POST com body passou")
}

func TestAssertRequestBodyNotEmpty_POST_Empty_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRequestBodyNotEmpty(0, "POST", "/api/users")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar POST sem body")
	assert.Equal(t, "empty_request_body", violations[0].Invariant)
	t.Logf("✅ Detectou POST sem body: %s", violations[0].Message)
}

func TestAssertRequestBodyNotEmpty_GET_Empty_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertRequestBodyNotEmpty(0, "GET", "/api/users")

	violations := GetViolations()
	assert.Empty(t, violations, "GET sem body não deveria gerar violação")
	t.Log("✅ GET sem body passou")
}

func TestAssertJSONContentType_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertJSONContentType("application/json", "/api/users")
	assert.True(t, valid)

	violations := GetViolations()
	assert.Empty(t, violations, "Content-Type JSON não deveria gerar violação")
	t.Log("✅ Content-Type JSON passou")
}

func TestAssertJSONContentType_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertJSONContentType("text/plain", "/api/users")
	assert.False(t, valid)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar Content-Type inválido")
	assert.Equal(t, "invalid_content_type", violations[0].Invariant)
	t.Logf("✅ Detectou Content-Type inválido: %s", violations[0].Message)
}

// ========================================
// TESTES DE AUTENTICAÇÃO
// ========================================

func TestAssertAuthHeaderPresent_Present_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthHeaderPresent("Bearer token123", "/api/protected")

	violations := GetViolations()
	assert.Empty(t, violations, "Auth header presente não deveria gerar violação")
	t.Log("✅ Auth header presente passou")
}

func TestAssertAuthHeaderPresent_Missing_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAuthHeaderPresent("", "/api/protected")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar auth header faltando")
	assert.Equal(t, "missing_auth_header", violations[0].Invariant)
	t.Logf("✅ Detectou auth header faltando: %s", violations[0].Message)
}

func TestAssertValidAuthScheme_Bearer_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertValidAuthScheme("Bearer token123", []string{"Bearer", "Basic"}, "/api/protected")

	violations := GetViolations()
	assert.Empty(t, violations, "Scheme Bearer não deveria gerar violação")
	t.Log("✅ Scheme Bearer passou")
}

func TestAssertValidAuthScheme_Invalid_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertValidAuthScheme("Custom token123", []string{"Bearer", "Basic"}, "/api/protected")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar scheme inválido")
	assert.Equal(t, "invalid_auth_scheme", violations[0].Invariant)
	t.Logf("✅ Detectou scheme inválido: %s", violations[0].Message)
}

func TestAssertAPIKeyFormat_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertAPIKeyFormat("pq_pk_1234567890abcdef", "pq_pk_")
	assert.True(t, valid)

	violations := GetViolations()
	assert.Empty(t, violations, "API key válida não deveria gerar violação")
	t.Log("✅ API key válida passou")
}

func TestAssertAPIKeyFormat_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	valid := AssertAPIKeyFormat("invalid_key", "pq_pk_")
	assert.False(t, valid)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar API key inválida")
	assert.Equal(t, "invalid_api_key_format", violations[0].Invariant)
	t.Logf("✅ Detectou API key inválida: %s", violations[0].Message)
}

func TestAssertScopeAuthorized_HasScope_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertScopeAuthorized("read", []string{"read", "write"}, "get_users")

	violations := GetViolations()
	assert.Empty(t, violations, "Scope autorizado não deveria gerar violação")
	t.Log("✅ Scope autorizado passou")
}

func TestAssertScopeAuthorized_AdminScope_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertScopeAuthorized("delete", []string{"admin"}, "delete_user")

	violations := GetViolations()
	assert.Empty(t, violations, "Admin scope deveria autorizar qualquer operação")
	t.Log("✅ Admin scope passou")
}

func TestAssertScopeAuthorized_NotAuthorized_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertScopeAuthorized("delete", []string{"read"}, "delete_user")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar scope não autorizado")
	assert.Equal(t, "scope_not_authorized", violations[0].Invariant)
	t.Logf("✅ Detectou scope não autorizado: %s", violations[0].Message)
}


// ========================================
// TESTES DE HEADERS
// ========================================

func TestAssertRequiredHeaderPresent_Present_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	headers := http.Header{}
	headers.Set("X-Custom-Header", "value")

	present := AssertRequiredHeaderPresent(headers, "X-Custom-Header", "/api/test")
	assert.True(t, present)

	violations := GetViolations()
	assert.Empty(t, violations, "Header presente não deveria gerar violação")
	t.Log("✅ Header presente passou")
}

func TestAssertRequiredHeaderPresent_Missing_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	headers := http.Header{}

	present := AssertRequiredHeaderPresent(headers, "X-Custom-Header", "/api/test")
	assert.False(t, present)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar header faltando")
	assert.Equal(t, "missing_required_header", violations[0].Invariant)
	t.Logf("✅ Detectou header faltando: %s", violations[0].Message)
}

func TestAssertAppIDHeader_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppIDHeader("550e8400-e29b-41d4-a716-446655440000", "/api/test")

	violations := GetViolations()
	assert.Empty(t, violations, "App ID válido não deveria gerar violação")
	t.Log("✅ App ID válido passou")
}

func TestAssertAppIDHeader_Missing_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppIDHeader("", "/api/test")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar App ID faltando")
	assert.Equal(t, "missing_app_id_header", violations[0].Invariant)
	t.Logf("✅ Detectou App ID faltando: %s", violations[0].Message)
}

func TestAssertAppIDHeader_NilUUID_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAppIDHeader("00000000-0000-0000-0000-000000000000", "/api/test")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar App ID nil")
	assert.Equal(t, "missing_app_id_header", violations[0].Invariant)
	t.Logf("✅ Detectou App ID nil: %s", violations[0].Message)
}

func TestAssertIdempotencyKey_POST_WithKey_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertIdempotencyKey("idem-key-123", "POST", "/api/orders")

	violations := GetViolations()
	assert.Empty(t, violations, "POST com idempotency key não deveria gerar violação")
	t.Log("✅ POST com idempotency key passou")
}

func TestAssertIdempotencyKey_POST_Missing_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertIdempotencyKey("", "POST", "/api/orders")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar idempotency key faltando")
	assert.Equal(t, "missing_idempotency_key", violations[0].Invariant)
	t.Logf("✅ Detectou idempotency key faltando: %s", violations[0].Message)
}

func TestAssertIdempotencyKey_GET_Missing_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertIdempotencyKey("", "GET", "/api/orders")

	violations := GetViolations()
	assert.Empty(t, violations, "GET sem idempotency key não deveria gerar violação")
	t.Log("✅ GET sem idempotency key passou")
}

// ========================================
// TESTES DE RESPONSE
// ========================================

func TestAssertResponseStatusValid_Valid_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertResponseStatusValid(200, []int{200, 201, 204}, "/api/users")

	violations := GetViolations()
	assert.Empty(t, violations, "Status válido não deveria gerar violação")
	t.Log("✅ Status válido passou")
}

func TestAssertResponseStatusValid_Invalid_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertResponseStatusValid(500, []int{200, 201, 204}, "/api/users")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar status inválido")
	assert.Equal(t, "unexpected_response_status", violations[0].Invariant)
	t.Logf("✅ Detectou status inválido: %s", violations[0].Message)
}

func TestAssertResponseTimeWithinSLA_Fast_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertResponseTimeWithinSLA(50*time.Millisecond, 100*time.Millisecond, "/api/users")

	violations := GetViolations()
	assert.Empty(t, violations, "Resposta rápida não deveria gerar violação")
	t.Log("✅ Resposta rápida passou")
}

func TestAssertResponseTimeWithinSLA_Slow_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertResponseTimeWithinSLA(200*time.Millisecond, 100*time.Millisecond, "/api/users")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar resposta lenta")
	assert.Equal(t, "response_time_exceeded_sla", violations[0].Invariant)
	t.Logf("✅ Detectou resposta lenta: %s", violations[0].Message)
}

func TestAssertResponseHasRequiredFields_AllPresent_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	response := map[string]interface{}{
		"id":    "123",
		"name":  "Test",
		"email": "test@example.com",
	}

	AssertResponseHasRequiredFields(response, []string{"id", "name"}, "/api/users")

	violations := GetViolations()
	assert.Empty(t, violations, "Resposta completa não deveria gerar violação")
	t.Log("✅ Resposta completa passou")
}

func TestAssertResponseHasRequiredFields_Missing_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	response := map[string]interface{}{
		"id": "123",
	}

	AssertResponseHasRequiredFields(response, []string{"id", "name", "email"}, "/api/users")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar campos faltando")
	assert.Equal(t, "response_missing_fields", violations[0].Invariant)
	t.Logf("✅ Detectou campos faltando: %s", violations[0].Message)
}


// ========================================
// TESTES DE SEGURANÇA
// ========================================

func TestAssertHTTPSOnly_HTTPS_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertHTTPSOnly("https", "production")

	violations := GetViolations()
	assert.Empty(t, violations, "HTTPS em produção não deveria gerar violação")
	t.Log("✅ HTTPS em produção passou")
}

func TestAssertHTTPSOnly_HTTP_Production_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertHTTPSOnly("http", "production")

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar HTTP em produção")
	assert.Equal(t, "http_in_production", violations[0].Invariant)
	t.Logf("✅ Detectou HTTP em produção: %s", violations[0].Message)
}

func TestAssertHTTPSOnly_HTTP_Development_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertHTTPSOnly("http", "development")

	violations := GetViolations()
	assert.Empty(t, violations, "HTTP em development não deveria gerar violação")
	t.Log("✅ HTTP em development passou")
}

func TestAssertOriginAllowed_Allowed_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertOriginAllowed("https://myapp.com", []string{"https://myapp.com", "https://admin.myapp.com"})

	violations := GetViolations()
	assert.Empty(t, violations, "Origin permitido não deveria gerar violação")
	t.Log("✅ Origin permitido passou")
}

func TestAssertOriginAllowed_Wildcard_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertOriginAllowed("https://anysite.com", []string{"*"})

	violations := GetViolations()
	assert.Empty(t, violations, "Wildcard deveria permitir qualquer origin")
	t.Log("✅ Wildcard passou")
}

func TestAssertOriginAllowed_NotAllowed_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	AssertOriginAllowed("https://evil.com", []string{"https://myapp.com"})

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar origin não permitido")
	assert.Equal(t, "origin_not_allowed", violations[0].Invariant)
	t.Logf("✅ Detectou origin não permitido: %s", violations[0].Message)
}

func TestAssertOriginAllowed_Empty_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertOriginAllowed("", []string{"https://myapp.com"})

	violations := GetViolations()
	assert.Empty(t, violations, "Request sem Origin (server-to-server) não deveria gerar violação")
	t.Log("✅ Request sem Origin passou")
}

func TestAssertNoSQLInjection_Clean_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	safe := AssertNoSQLInjection("John Doe", "name")
	assert.True(t, safe)

	violations := GetViolations()
	assert.Empty(t, violations, "Input limpo não deveria gerar violação")
	t.Log("✅ Input limpo passou")
}

func TestAssertNoSQLInjection_Attack_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	safe := AssertNoSQLInjection("'; DROP TABLE users; --", "name")
	assert.False(t, safe)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar SQL injection")
	assert.Equal(t, "sql_injection_attempt", violations[0].Invariant)
	t.Logf("✅ Detectou SQL injection: %s", violations[0].Message)
}

func TestAssertNoSQLInjection_OrAttack_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	safe := AssertNoSQLInjection("' OR '1'='1", "password")
	assert.False(t, safe)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar SQL injection OR")
	t.Logf("✅ Detectou SQL injection OR: %s", violations[0].Message)
}

func TestAssertNoXSS_Clean_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	safe := AssertNoXSS("Hello World", "message")
	assert.True(t, safe)

	violations := GetViolations()
	assert.Empty(t, violations, "Input limpo não deveria gerar violação")
	t.Log("✅ Input limpo passou")
}

func TestAssertNoXSS_ScriptTag_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	safe := AssertNoXSS("<script>alert('xss')</script>", "message")
	assert.False(t, safe)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar XSS")
	assert.Equal(t, "xss_attempt", violations[0].Invariant)
	t.Logf("✅ Detectou XSS: %s", violations[0].Message)
}

func TestAssertNoXSS_EventHandler_Critical(t *testing.T) {
	ClearViolations()
	Enable()

	safe := AssertNoXSS("<img src=x onerror=alert('xss')>", "avatar")
	assert.False(t, safe)

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar XSS via event handler")
	t.Logf("✅ Detectou XSS via event handler: %s", violations[0].Message)
}

// ========================================
// TESTES DE VERSIONING
// ========================================

func TestAssertAPIVersionSupported_Supported_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAPIVersionSupported("v1", []string{"v1", "v2"})

	violations := GetViolations()
	assert.Empty(t, violations, "Versão suportada não deveria gerar violação")
	t.Log("✅ Versão suportada passou")
}

func TestAssertAPIVersionSupported_NotSupported_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAPIVersionSupported("v0", []string{"v1", "v2"})

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar versão não suportada")
	assert.Equal(t, "unsupported_api_version", violations[0].Invariant)
	t.Logf("✅ Detectou versão não suportada: %s", violations[0].Message)
}

func TestAssertAPIVersionNotDeprecated_Current_Passes(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAPIVersionNotDeprecated("v2", []string{"v0", "v1"})

	violations := GetViolations()
	assert.Empty(t, violations, "Versão atual não deveria gerar violação")
	t.Log("✅ Versão atual passou")
}

func TestAssertAPIVersionNotDeprecated_Deprecated_Warning(t *testing.T) {
	ClearViolations()
	Enable()

	AssertAPIVersionNotDeprecated("v1", []string{"v0", "v1"})

	violations := GetViolations()
	assert.Len(t, violations, 1, "Deveria detectar versão deprecated")
	assert.Equal(t, "deprecated_api_version", violations[0].Invariant)
	t.Logf("✅ Detectou versão deprecated: %s", violations[0].Message)
}

// ========================================
// TESTE DE INTEGRAÇÃO
// ========================================

func TestAPIInvariants_FullRequestValidation(t *testing.T) {
	ClearViolations()
	Enable()

	// Simular validação completa de uma request
	endpoint := "/api/v1/users"

	// 1. Rate limit
	AssertRateLimitNotExceeded(50, 100, "minute", "client-123")

	// 2. Payload
	AssertPayloadSizeWithinLimit(1024, 10240, endpoint)
	AssertJSONContentType("application/json; charset=utf-8", endpoint)

	// 3. Auth
	AssertAuthHeaderPresent("Bearer token123", endpoint)
	AssertValidAuthScheme("Bearer token123", []string{"Bearer"}, endpoint)
	AssertScopeAuthorized("read", []string{"read", "write"}, "list_users")

	// 4. Headers
	AssertAppIDHeader("550e8400-e29b-41d4-a716-446655440000", endpoint)

	// 5. Security
	AssertNoSQLInjection("John Doe", "name")
	AssertNoXSS("Hello World", "message")

	// 6. Version
	AssertAPIVersionSupported("v1", []string{"v1", "v2"})

	violations := GetViolations()
	assert.Empty(t, violations, "Request válida não deveria gerar violações")
	t.Log("✅ Validação completa de request passou")
}

func TestAPIInvariants_AttackScenario(t *testing.T) {
	ClearViolations()
	Enable()

	// Simular cenário de ataque
	endpoint := "/api/v1/users"

	// 1. Rate limit excedido (possível DDoS)
	AssertRateLimitNotExceeded(1000, 100, "minute", "attacker-ip")

	// 2. Payload muito grande
	AssertPayloadSizeWithinLimit(1024*1024, 10240, endpoint)

	// 3. SQL Injection
	AssertNoSQLInjection("'; DROP TABLE users; --", "search")

	// 4. XSS
	AssertNoXSS("<script>document.cookie</script>", "comment")

	// 5. Origin suspeito
	AssertOriginAllowed("https://evil-site.com", []string{"https://myapp.com"})

	violations := GetViolations()
	assert.Len(t, violations, 5, "Deveria detectar 5 violações de ataque")

	// Verificar tipos de violação
	invariants := make(map[string]bool)
	for _, v := range violations {
		invariants[v.Invariant] = true
	}

	assert.True(t, invariants["rate_limit_exceeded"])
	assert.True(t, invariants["payload_too_large"])
	assert.True(t, invariants["sql_injection_attempt"])
	assert.True(t, invariants["xss_attempt"])
	assert.True(t, invariants["origin_not_allowed"])

	t.Log("✅ Todas as 5 tentativas de ataque foram detectadas")
}
