package invariants

/*
================================================================================
API INVARIANTS — PROTEÇÃO DE ENDPOINTS
================================================================================

Estas invariants garantem que:
1. Requests não excedem rate limits
2. Payloads não excedem tamanhos permitidos
3. Autenticação é sempre verificada em rotas protegidas
4. Headers obrigatórios estão presentes
5. Respostas seguem contratos esperados

Se estas invariants falharem, há ataque ou bug de integração.

================================================================================
*/

import (
	"fmt"
	"net/http"
	"strings"
	"time"
)

// ========================================
// RATE LIMITING
// ========================================

// AssertRateLimitNotExceeded verifica se rate limit não foi excedido
// WARNING: Rate limit excedido pode indicar ataque ou bug de cliente
func AssertRateLimitNotExceeded(current, limit int64, window string, clientID string) {
	Assert(
		current <= limit,
		"rate_limit_exceeded",
		fmt.Sprintf("Rate limit exceeded: %d/%d requests in %s", current, limit, window),
		map[string]interface{}{
			"current":   current,
			"limit":     limit,
			"window":    window,
			"client_id": clientID,
		},
	)
}

// AssertBurstLimitNotExceeded verifica burst limit (picos instantâneos)
// CRITICAL: Burst excessivo pode derrubar o sistema
func AssertBurstLimitNotExceeded(current, limit int64, clientID string) {
	AssertCritical(
		current <= limit,
		"burst_limit_exceeded",
		fmt.Sprintf("Burst limit exceeded: %d/%d concurrent requests", current, limit),
		map[string]interface{}{
			"current":   current,
			"limit":     limit,
			"client_id": clientID,
		},
	)
}


// ========================================
// PAYLOAD VALIDATION
// ========================================

// AssertPayloadSizeWithinLimit verifica se payload não excede limite
// WARNING: Payload grande pode indicar ataque ou bug
func AssertPayloadSizeWithinLimit(size, maxSize int64, endpoint string) {
	Assert(
		size <= maxSize,
		"payload_too_large",
		fmt.Sprintf("Payload size %d exceeds limit %d for %s", size, maxSize, endpoint),
		map[string]interface{}{
			"size":     size,
			"max_size": maxSize,
			"endpoint": endpoint,
		},
	)
}

// AssertRequestBodyNotEmpty verifica se body não está vazio quando esperado
// WARNING: Body vazio em POST/PUT pode indicar bug de cliente
func AssertRequestBodyNotEmpty(contentLength int64, method, endpoint string) {
	if method == "POST" || method == "PUT" || method == "PATCH" {
		Assert(
			contentLength > 0,
			"empty_request_body",
			fmt.Sprintf("Empty request body for %s %s", method, endpoint),
			map[string]interface{}{
				"method":         method,
				"endpoint":       endpoint,
				"content_length": contentLength,
			},
		)
	}
}

// AssertJSONContentType verifica se Content-Type é JSON quando esperado
// WARNING: Content-Type errado pode causar parsing incorreto
func AssertJSONContentType(contentType, endpoint string) bool {
	isJSON := strings.Contains(strings.ToLower(contentType), "application/json")
	Assert(
		isJSON,
		"invalid_content_type",
		fmt.Sprintf("Expected JSON content type, got '%s' for %s", contentType, endpoint),
		map[string]interface{}{
			"content_type": contentType,
			"endpoint":     endpoint,
			"expected":     "application/json",
		},
	)
	return isJSON
}

// ========================================
// AUTHENTICATION & AUTHORIZATION
// ========================================

// AssertAuthHeaderPresent verifica se header de auth está presente
// CRITICAL: Rota protegida sem auth é vulnerabilidade
func AssertAuthHeaderPresent(authHeader, endpoint string) {
	AssertCritical(
		authHeader != "",
		"missing_auth_header",
		fmt.Sprintf("Missing Authorization header for protected endpoint %s", endpoint),
		map[string]interface{}{
			"endpoint": endpoint,
		},
	)
}

// AssertValidAuthScheme verifica se scheme de auth é válido
// CRITICAL: Scheme inválido pode indicar ataque
func AssertValidAuthScheme(authHeader string, validSchemes []string, endpoint string) {
	scheme := ""
	if parts := strings.SplitN(authHeader, " ", 2); len(parts) > 0 {
		scheme = strings.ToLower(parts[0])
	}

	valid := false
	for _, s := range validSchemes {
		if strings.ToLower(s) == scheme {
			valid = true
			break
		}
	}

	AssertCritical(
		valid,
		"invalid_auth_scheme",
		fmt.Sprintf("Invalid auth scheme '%s' for %s (valid: %v)", scheme, endpoint, validSchemes),
		map[string]interface{}{
			"scheme":        scheme,
			"valid_schemes": validSchemes,
			"endpoint":      endpoint,
		},
	)
}

// AssertAPIKeyFormat verifica se API key tem formato válido
// WARNING: Formato inválido pode indicar tentativa de brute force
func AssertAPIKeyFormat(apiKey, prefix string) bool {
	valid := strings.HasPrefix(apiKey, prefix) && len(apiKey) > len(prefix)+10
	Assert(
		valid,
		"invalid_api_key_format",
		"API key has invalid format",
		map[string]interface{}{
			"prefix":          prefix,
			"key_length":      len(apiKey),
			"expected_prefix": prefix,
		},
	)
	return valid
}

// AssertScopeAuthorized verifica se scope está autorizado para operação
// CRITICAL: Operação sem scope é violação de segurança
func AssertScopeAuthorized(requiredScope string, grantedScopes []string, operation string) {
	hasScope := false
	for _, scope := range grantedScopes {
		if scope == requiredScope || scope == "*" || scope == "admin" {
			hasScope = true
			break
		}
	}

	AssertCritical(
		hasScope,
		"scope_not_authorized",
		fmt.Sprintf("Scope '%s' not authorized for operation '%s'", requiredScope, operation),
		map[string]interface{}{
			"required_scope":  requiredScope,
			"granted_scopes":  grantedScopes,
			"operation":       operation,
		},
	)
}


// ========================================
// REQUEST HEADERS
// ========================================

// AssertRequiredHeaderPresent verifica se header obrigatório está presente
// WARNING: Header faltando pode indicar cliente mal configurado
func AssertRequiredHeaderPresent(headers http.Header, headerName, endpoint string) bool {
	value := headers.Get(headerName)
	present := value != ""
	Assert(
		present,
		"missing_required_header",
		fmt.Sprintf("Missing required header '%s' for %s", headerName, endpoint),
		map[string]interface{}{
			"header":   headerName,
			"endpoint": endpoint,
		},
	)
	return present
}

// AssertAppIDHeader verifica se X-App-ID está presente e válido
// CRITICAL: Requests sem App-ID não podem ser processadas
func AssertAppIDHeader(appID, endpoint string) {
	AssertCritical(
		appID != "" && appID != "00000000-0000-0000-0000-000000000000",
		"missing_app_id_header",
		fmt.Sprintf("Missing or invalid X-App-ID header for %s", endpoint),
		map[string]interface{}{
			"app_id":   appID,
			"endpoint": endpoint,
		},
	)
}

// AssertRequestIDHeader verifica se X-Request-ID está presente
// WARNING: Sem Request-ID, tracing fica impossível
func AssertRequestIDHeader(requestID, endpoint string) {
	Assert(
		requestID != "",
		"missing_request_id",
		fmt.Sprintf("Missing X-Request-ID header for %s", endpoint),
		map[string]interface{}{
			"endpoint": endpoint,
		},
	)
}

// AssertIdempotencyKey verifica se Idempotency-Key está presente para operações mutáveis
// WARNING: Sem idempotency key, retries podem causar duplicatas
func AssertIdempotencyKey(key, method, endpoint string) {
	if method == "POST" || method == "PUT" {
		Assert(
			key != "",
			"missing_idempotency_key",
			fmt.Sprintf("Missing Idempotency-Key header for %s %s", method, endpoint),
			map[string]interface{}{
				"method":   method,
				"endpoint": endpoint,
			},
		)
	}
}

// ========================================
// RESPONSE VALIDATION
// ========================================

// AssertResponseStatusValid verifica se status code é esperado
// WARNING: Status inesperado pode indicar bug
func AssertResponseStatusValid(status int, validStatuses []int, endpoint string) {
	valid := false
	for _, s := range validStatuses {
		if s == status {
			valid = true
			break
		}
	}

	Assert(
		valid,
		"unexpected_response_status",
		fmt.Sprintf("Unexpected response status %d for %s (valid: %v)", status, endpoint, validStatuses),
		map[string]interface{}{
			"status":         status,
			"valid_statuses": validStatuses,
			"endpoint":       endpoint,
		},
	)
}

// AssertResponseTimeWithinSLA verifica se tempo de resposta está dentro do SLA
// WARNING: Resposta lenta pode indicar problema de performance
func AssertResponseTimeWithinSLA(duration time.Duration, sla time.Duration, endpoint string) {
	Assert(
		duration <= sla,
		"response_time_exceeded_sla",
		fmt.Sprintf("Response time %v exceeded SLA %v for %s", duration, sla, endpoint),
		map[string]interface{}{
			"duration_ms": duration.Milliseconds(),
			"sla_ms":      sla.Milliseconds(),
			"endpoint":    endpoint,
		},
	)
}

// AssertResponseHasRequiredFields verifica se resposta tem campos obrigatórios
// WARNING: Campos faltando podem quebrar clientes
func AssertResponseHasRequiredFields(response map[string]interface{}, requiredFields []string, endpoint string) {
	missingFields := []string{}
	for _, field := range requiredFields {
		if _, exists := response[field]; !exists {
			missingFields = append(missingFields, field)
		}
	}

	Assert(
		len(missingFields) == 0,
		"response_missing_fields",
		fmt.Sprintf("Response missing required fields for %s: %v", endpoint, missingFields),
		map[string]interface{}{
			"missing_fields":  missingFields,
			"required_fields": requiredFields,
			"endpoint":        endpoint,
		},
	)
}


// ========================================
// ENDPOINT SECURITY
// ========================================

// AssertEndpointNotDeprecated verifica se endpoint não está deprecated
// WARNING: Uso de endpoint deprecated deve ser alertado
func AssertEndpointNotDeprecated(endpoint string, deprecatedEndpoints []string) {
	isDeprecated := false
	for _, dep := range deprecatedEndpoints {
		if dep == endpoint {
			isDeprecated = true
			break
		}
	}

	Assert(
		!isDeprecated,
		"deprecated_endpoint_used",
		fmt.Sprintf("Deprecated endpoint used: %s", endpoint),
		map[string]interface{}{
			"endpoint": endpoint,
		},
	)
}

// AssertHTTPSOnly verifica se request veio via HTTPS
// CRITICAL: HTTP em produção é vulnerabilidade
func AssertHTTPSOnly(scheme, environment string) {
	if environment == "production" {
		AssertCritical(
			scheme == "https",
			"http_in_production",
			"HTTP request in production environment",
			map[string]interface{}{
				"scheme":      scheme,
				"environment": environment,
			},
		)
	}
}

// AssertOriginAllowed verifica se Origin está na whitelist
// CRITICAL: Origin não permitido pode ser CSRF
func AssertOriginAllowed(origin string, allowedOrigins []string) {
	if origin == "" {
		return // Requests sem Origin (server-to-server) são OK
	}

	allowed := false
	for _, ao := range allowedOrigins {
		if ao == "*" || ao == origin {
			allowed = true
			break
		}
	}

	AssertCritical(
		allowed,
		"origin_not_allowed",
		fmt.Sprintf("Origin '%s' not in allowed list", origin),
		map[string]interface{}{
			"origin":          origin,
			"allowed_origins": allowedOrigins,
		},
	)
}

// AssertNoSQLInjection verifica padrões básicos de SQL injection
// CRITICAL: SQL injection é vulnerabilidade grave
func AssertNoSQLInjection(input, fieldName string) bool {
	// Padrões suspeitos de SQL injection
	suspiciousPatterns := []string{
		"'--", "'; --", "' OR ", "' AND ",
		"1=1", "1 = 1", "' OR '1'='1",
		"DROP TABLE", "DELETE FROM", "INSERT INTO",
		"UNION SELECT", "EXEC ", "EXECUTE ",
	}

	inputUpper := strings.ToUpper(input)
	for _, pattern := range suspiciousPatterns {
		if strings.Contains(inputUpper, strings.ToUpper(pattern)) {
			AssertCritical(
				false,
				"sql_injection_attempt",
				fmt.Sprintf("Possible SQL injection in field '%s'", fieldName),
				map[string]interface{}{
					"field":   fieldName,
					"pattern": pattern,
				},
			)
			return false
		}
	}
	return true
}

// AssertNoXSS verifica padrões básicos de XSS
// CRITICAL: XSS é vulnerabilidade grave
func AssertNoXSS(input, fieldName string) bool {
	// Padrões suspeitos de XSS
	suspiciousPatterns := []string{
		"<script", "</script>", "javascript:",
		"onerror=", "onload=", "onclick=",
		"<iframe", "<object", "<embed",
		"eval(", "document.cookie",
	}

	inputLower := strings.ToLower(input)
	for _, pattern := range suspiciousPatterns {
		if strings.Contains(inputLower, strings.ToLower(pattern)) {
			AssertCritical(
				false,
				"xss_attempt",
				fmt.Sprintf("Possible XSS in field '%s'", fieldName),
				map[string]interface{}{
					"field":   fieldName,
					"pattern": pattern,
				},
			)
			return false
		}
	}
	return true
}

// ========================================
// API VERSIONING
// ========================================

// AssertAPIVersionSupported verifica se versão da API é suportada
// WARNING: Versão não suportada deve ser migrada
func AssertAPIVersionSupported(version string, supportedVersions []string) {
	supported := false
	for _, v := range supportedVersions {
		if v == version {
			supported = true
			break
		}
	}

	Assert(
		supported,
		"unsupported_api_version",
		fmt.Sprintf("API version '%s' not supported (supported: %v)", version, supportedVersions),
		map[string]interface{}{
			"version":            version,
			"supported_versions": supportedVersions,
		},
	)
}

// AssertAPIVersionNotDeprecated verifica se versão não está deprecated
// WARNING: Versão deprecated deve ser migrada
func AssertAPIVersionNotDeprecated(version string, deprecatedVersions []string) {
	deprecated := false
	for _, v := range deprecatedVersions {
		if v == version {
			deprecated = true
			break
		}
	}

	Assert(
		!deprecated,
		"deprecated_api_version",
		fmt.Sprintf("API version '%s' is deprecated", version),
		map[string]interface{}{
			"version":             version,
			"deprecated_versions": deprecatedVersions,
		},
	)
}
