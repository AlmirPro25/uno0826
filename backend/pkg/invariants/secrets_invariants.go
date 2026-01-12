package invariants

/*
================================================================================
LEIS DE SEGREDOS DO KERNEL — SECRETS INVARIANTS
================================================================================

"Se uma credencial vazar, o sistema inteiro cai."

Estas invariants protegem contra o risco existencial: vazamento de secrets.
- API Keys em plaintext no banco
- Secrets logados em texto puro
- Acesso a secrets sem audit trail

Severidades:
- WARNING: Log + alerta (acesso sem audit)
- CRITICAL: Log + alerta + bloqueio (secret em log)
- FATAL: PANIC imediato (plaintext no banco)

================================================================================
*/

import (
	"encoding/base64"
	"math"
	"regexp"
	"strings"
)

// ========================================
// PADRÕES DE SECRETS CONHECIDOS
// ========================================

// Padrões de API keys e tokens conhecidos que NUNCA devem aparecer em plaintext
var sensitivePatterns = []*regexp.Regexp{
	// Stripe
	regexp.MustCompile(`sk_live_[a-zA-Z0-9]{20,}`),
	regexp.MustCompile(`sk_test_[a-zA-Z0-9]{20,}`),
	regexp.MustCompile(`pk_live_[a-zA-Z0-9]{20,}`),
	regexp.MustCompile(`pk_test_[a-zA-Z0-9]{20,}`),
	regexp.MustCompile(`whsec_[a-zA-Z0-9]{20,}`),

	// AWS
	regexp.MustCompile(`AKIA[0-9A-Z]{16}`),

	// JWT/Bearer tokens (formato: header.payload.signature)
	regexp.MustCompile(`eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`),

	// GitHub
	regexp.MustCompile(`ghp_[a-zA-Z0-9]{36}`),
	regexp.MustCompile(`gho_[a-zA-Z0-9]{36}`),
	regexp.MustCompile(`ghu_[a-zA-Z0-9]{36}`),
	regexp.MustCompile(`ghs_[a-zA-Z0-9]{36}`),
	regexp.MustCompile(`ghr_[a-zA-Z0-9]{36}`),

	// Google
	regexp.MustCompile(`AIza[0-9A-Za-z_-]{35}`),

	// Senhas fracas comuns (nunca devem ser usadas)
	regexp.MustCompile(`^(password|123456|admin|root|secret|test)$`),
}

// Prefixos que indicam valor criptografado válido
var encryptedPrefixes = []string{
	"$2a$", "$2b$", "$2y$", // bcrypt
	"$argon2",              // argon2
	"$scrypt",              // scrypt
	"$pbkdf2",              // pbkdf2
}

// ========================================
// INVARIANTS DE SECRETS
// ========================================

// AssertSecretEncrypted verifica se um valor parece estar criptografado antes de salvar
// FATAL: Salvar secret em plaintext é risco existencial
func AssertSecretEncrypted(secretName, value string) {
	// Se está vazio, não é problema (validação de required é outra camada)
	if value == "" {
		return
	}

	// Verificar se é um padrão de secret conhecido em plaintext
	isPlaintext := false
	matchedPattern := ""

	for _, pattern := range sensitivePatterns {
		if pattern.MatchString(value) {
			isPlaintext = true
			matchedPattern = pattern.String()
			break
		}
	}

	// Verificar se parece ser base64 (indicativo de criptografia)
	looksEncrypted := looksLikeEncrypted(value)

	// Verificar entropia (secrets criptografados têm alta entropia)
	entropy := calculateEntropy(value)
	hasHighEntropy := entropy > 4.0 // Threshold para dados aleatórios

	// Se é um padrão conhecido de plaintext, FATAL
	if isPlaintext {
		AssertFatal(
			false,
			"secret_plaintext_detected",
			"CRITICAL: Attempting to store known secret pattern in plaintext - this is a security breach",
			map[string]interface{}{
				"secret_name":     secretName,
				"matched_pattern": matchedPattern,
				"value_preview":   maskForLog(value),
			},
		)
		return
	}

	// Se não parece criptografado E tem baixa entropia, WARNING
	// (pode ser um valor legítimo simples, mas merece atenção)
	if !looksEncrypted && !hasHighEntropy && len(value) > 8 {
		Assert(
			false,
			"secret_low_entropy_warning",
			"Secret value has low entropy - may not be properly encrypted",
			map[string]interface{}{
				"secret_name": secretName,
				"entropy":     entropy,
				"length":      len(value),
			},
		)
	}
}

// AssertNoSecretInLogs verifica se um valor contém padrões de secrets
// CRITICAL: Logar secrets é vazamento de dados
func AssertNoSecretInLogs(logMessage string) {
	// Verificar se a mensagem contém padrões de secrets
	for _, pattern := range sensitivePatterns {
		if pattern.MatchString(logMessage) {
			AssertCritical(
				false,
				"secret_in_log_detected",
				"CRITICAL: Log message contains sensitive secret pattern - potential data leak",
				map[string]interface{}{
					"log_preview":     truncateForSafety(logMessage, 50),
					"pattern_matched": pattern.String(),
				},
			)
			return
		}
	}

	// Verificar padrões inline (ex: "api_key=sk_live_xxx")
	inlinePatterns := []string{
		"api_key=", "apikey=", "api-key=",
		"secret=", "password=", "passwd=",
		"token=", "bearer ", "authorization:",
		"aws_secret", "stripe_key", "private_key",
	}

	lowerMsg := strings.ToLower(logMessage)
	for _, pattern := range inlinePatterns {
		if strings.Contains(lowerMsg, pattern) {
			// Verificar se o valor após o padrão parece ser um secret real
			idx := strings.Index(lowerMsg, pattern)
			if idx >= 0 {
				remaining := logMessage[idx+len(pattern):]
				// Se tem mais de 10 chars após o padrão, pode ser um secret
				if len(remaining) > 10 {
					AssertCritical(
						false,
						"secret_inline_in_log",
						"Log message may contain inline secret value",
						map[string]interface{}{
							"pattern_found": pattern,
							"log_preview":   truncateForSafety(logMessage, 50),
						},
					)
					return
				}
			}
		}
	}
}

// AssertSecretAccessLogged verifica se acesso a secret tem audit trail
// WARNING: Acesso sem audit é ponto cego de segurança
func AssertSecretAccessLogged(secretID, actorID, action string, hasAuditEntry bool) {
	Assert(
		hasAuditEntry,
		"secret_access_not_logged",
		"Secret access without audit trail - security blind spot",
		map[string]interface{}{
			"secret_id": secretID,
			"actor_id":  actorID,
			"action":    action,
		},
	)
}

// AssertSecretNotExpired verifica se secret não está expirado antes de uso
// WARNING: Usar secret expirado pode indicar problema de rotação
func AssertSecretNotExpired(secretID, secretName string, isExpired bool) {
	Assert(
		!isExpired,
		"secret_expired_usage",
		"Attempting to use expired secret - rotation may be needed",
		map[string]interface{}{
			"secret_id":   secretID,
			"secret_name": secretName,
		},
	)
}

// AssertSecretBelongsToApp verifica isolamento de secrets entre apps
// CRITICAL: Acesso cross-app a secrets é vazamento
func AssertSecretBelongsToApp(secretAppID, requestAppID string) {
	// Se secret é global (sem app), qualquer app pode acessar
	if secretAppID == "" || secretAppID == "00000000-0000-0000-0000-000000000000" {
		return
	}

	AssertCritical(
		secretAppID == requestAppID,
		"secret_cross_app_access",
		"Secret accessed by different app - data isolation breach",
		map[string]interface{}{
			"secret_app_id":  secretAppID,
			"request_app_id": requestAppID,
		},
	)
}

// AssertMasterKeyValid verifica se master key tem tamanho correto
// FATAL: Master key inválida compromete toda criptografia
func AssertMasterKeyValid(keyLength int) {
	AssertFatal(
		keyLength == 32, // AES-256 requer 32 bytes
		"master_key_invalid_length",
		"CRITICAL: Master key has invalid length - all encryption is compromised",
		map[string]interface{}{
			"key_length":     keyLength,
			"required_length": 32,
		},
	)
}

// ========================================
// HELPERS
// ========================================

// looksLikeEncrypted verifica se valor parece estar criptografado
func looksLikeEncrypted(value string) bool {
	// Verificar prefixos de hash conhecidos
	for _, prefix := range encryptedPrefixes {
		if strings.HasPrefix(value, prefix) {
			return true
		}
	}

	// Verificar se é base64 válido (criptografia geralmente produz base64)
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err == nil && len(decoded) > 0 {
		// Base64 válido com tamanho razoável indica criptografia
		if len(value) >= 20 {
			return true
		}
	}

	return false
}

// calculateEntropy calcula a entropia de Shannon de uma string
// Valores criptografados têm entropia alta (próximo de 8 para bytes aleatórios)
func calculateEntropy(s string) float64 {
	if len(s) == 0 {
		return 0
	}

	// Contar frequência de cada caractere
	freq := make(map[rune]float64)
	for _, c := range s {
		freq[c]++
	}

	// Calcular entropia
	length := float64(len(s))
	entropy := 0.0
	for _, count := range freq {
		p := count / length
		if p > 0 {
			entropy -= p * math.Log2(p)
		}
	}

	return entropy
}

// maskForLog mascara valor para log seguro
func maskForLog(value string) string {
	if len(value) <= 8 {
		return "****"
	}
	return value[:4] + "****" + value[len(value)-4:]
}

// truncateForSafety trunca string para tamanho seguro
func truncateForSafety(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// ========================================
// SAFE LOGGING HELPER
// ========================================

// SanitizeForLog remove secrets de uma string antes de logar
// Use isso em vez de logar diretamente valores que podem conter secrets
func SanitizeForLog(message string) string {
	result := message

	// Substituir padrões conhecidos
	for _, pattern := range sensitivePatterns {
		result = pattern.ReplaceAllString(result, "[REDACTED]")
	}

	// Substituir valores após padrões inline
	inlineReplacements := map[string]string{
		"api_key=":       "api_key=[REDACTED]",
		"apikey=":        "apikey=[REDACTED]",
		"secret=":        "secret=[REDACTED]",
		"password=":      "password=[REDACTED]",
		"token=":         "token=[REDACTED]",
		"authorization:": "authorization:[REDACTED]",
	}

	lowerResult := strings.ToLower(result)
	for pattern, replacement := range inlineReplacements {
		if strings.Contains(lowerResult, pattern) {
			// Encontrar e substituir o valor após o padrão
			idx := strings.Index(lowerResult, pattern)
			if idx >= 0 {
				// Encontrar fim do valor (espaço, &, ou fim da string)
				endIdx := idx + len(pattern)
				for endIdx < len(result) && result[endIdx] != ' ' && result[endIdx] != '&' && result[endIdx] != '\n' {
					endIdx++
				}
				result = result[:idx] + replacement + result[endIdx:]
				lowerResult = strings.ToLower(result)
			}
		}
	}

	return result
}
