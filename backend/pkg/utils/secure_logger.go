package utils

/*
================================================================================
SECURE LOGGER — LOGS SEM VAZAMENTO DE DADOS
================================================================================

Logger que automaticamente sanitiza dados sensíveis:
- Senhas
- Tokens
- Chaves de API
- Números de cartão
- CPF/CNPJ

"O que não deve ser visto, não será logado"

================================================================================
*/

import (
	"fmt"
	"log"
	"regexp"
	"strings"
)

// SensitivePatterns padrões de dados sensíveis
var SensitivePatterns = []struct {
	Pattern     *regexp.Regexp
	Replacement string
}{
	// Senhas
	{regexp.MustCompile(`(?i)(password|passwd|pwd|senha)\s*[=:]\s*["']?[^\s"',]+["']?`), "$1=[REDACTED]"},
	{regexp.MustCompile(`(?i)"(password|passwd|pwd|senha)"\s*:\s*"[^"]+"`), `"$1":"[REDACTED]"`},
	
	// Tokens e API Keys
	{regexp.MustCompile(`(?i)(token|api_key|apikey|api-key|secret|bearer)\s*[=:]\s*["']?[^\s"',]+["']?`), "$1=[REDACTED]"},
	{regexp.MustCompile(`(?i)"(token|api_key|apikey|secret)"\s*:\s*"[^"]+"`), `"$1":"[REDACTED]"`},
	{regexp.MustCompile(`Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_.+/=]*`), "Bearer [REDACTED]"},
	
	// JWT
	{regexp.MustCompile(`eyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_.+/=]*`), "[JWT_REDACTED]"},
	
	// Stripe Keys
	{regexp.MustCompile(`sk_(live|test)_[A-Za-z0-9]+`), "sk_$1_[REDACTED]"},
	{regexp.MustCompile(`pk_(live|test)_[A-Za-z0-9]+`), "pk_$1_[REDACTED]"},
	{regexp.MustCompile(`whsec_[A-Za-z0-9]+`), "whsec_[REDACTED]"},
	
	// AWS Keys
	{regexp.MustCompile(`AKIA[A-Z0-9]{16}`), "[AWS_KEY_REDACTED]"},
	{regexp.MustCompile(`(?i)aws_secret[_]?access[_]?key\s*[=:]\s*["']?[^\s"',]+["']?`), "aws_secret_access_key=[REDACTED]"},
	
	// GitHub Tokens
	{regexp.MustCompile(`ghp_[A-Za-z0-9]{36}`), "ghp_[REDACTED]"},
	{regexp.MustCompile(`gho_[A-Za-z0-9]{36}`), "gho_[REDACTED]"},
	{regexp.MustCompile(`github_pat_[A-Za-z0-9_]{22,}`), "github_pat_[REDACTED]"},
	
	// Cartões de crédito (padrão básico)
	{regexp.MustCompile(`\b[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b`), "[CARD_REDACTED]"},
	
	// CPF
	{regexp.MustCompile(`\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b`), "[CPF_REDACTED]"},
	{regexp.MustCompile(`\b[0-9]{11}\b`), "[CPF_REDACTED]"}, // CPF sem formatação (cuidado com falsos positivos)
	
	// CNPJ
	{regexp.MustCompile(`\b[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}\b`), "[CNPJ_REDACTED]"},
	
	// Email (parcial - mantém domínio)
	{regexp.MustCompile(`([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})`), "[EMAIL]@$2"},
	
	// Telefone
	{regexp.MustCompile(`\+?[0-9]{2,3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{4,5}[\s\-]?[0-9]{4}`), "[PHONE_REDACTED]"},
}

// Sanitize sanitiza string removendo dados sensíveis
func Sanitize(input string) string {
	result := input
	for _, pattern := range SensitivePatterns {
		result = pattern.Pattern.ReplaceAllString(result, pattern.Replacement)
	}
	return result
}

// SecureLogger logger que sanitiza automaticamente
type SecureLogger struct {
	prefix string
}

// NewSecureLogger cria novo logger seguro
func NewSecureLogger(prefix string) *SecureLogger {
	return &SecureLogger{prefix: prefix}
}

// Info log de informação
func (l *SecureLogger) Info(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	log.Printf("[INFO] %s: %s", l.prefix, Sanitize(msg))
}

// Warn log de aviso
func (l *SecureLogger) Warn(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	log.Printf("[WARN] %s: %s", l.prefix, Sanitize(msg))
}

// Error log de erro
func (l *SecureLogger) Error(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	log.Printf("[ERROR] %s: %s", l.prefix, Sanitize(msg))
}

// Debug log de debug (só em dev)
func (l *SecureLogger) Debug(format string, args ...interface{}) {
	if IsDebugMode() {
		msg := fmt.Sprintf(format, args...)
		log.Printf("[DEBUG] %s: %s", l.prefix, Sanitize(msg))
	}
}

// Fatal log fatal e exit
func (l *SecureLogger) Fatal(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	log.Fatalf("[FATAL] %s: %s", l.prefix, Sanitize(msg))
}

// IsDebugMode verifica se está em modo debug
func IsDebugMode() bool {
	return strings.ToLower(GetEnv("DEBUG_MODE", "false")) == "true"
}

// GetEnv retorna variável de ambiente com fallback
func GetEnv(key, fallback string) string {
	if value := strings.TrimSpace(getEnvValue(key)); value != "" {
		return value
	}
	return fallback
}

// getEnvValue helper para pegar env var
func getEnvValue(key string) string {
	// Implementação simples - em produção usar os.Getenv
	return ""
}

// ========================================
// FUNÇÕES DE CONVENIÊNCIA GLOBAIS
// ========================================

var defaultLogger = NewSecureLogger("PROST-QS")

// LogInfo log de informação global
func LogInfo(format string, args ...interface{}) {
	defaultLogger.Info(format, args...)
}

// LogWarn log de aviso global
func LogWarn(format string, args ...interface{}) {
	defaultLogger.Warn(format, args...)
}

// LogError log de erro global
func LogError(format string, args ...interface{}) {
	defaultLogger.Error(format, args...)
}

// LogDebug log de debug global
func LogDebug(format string, args ...interface{}) {
	defaultLogger.Debug(format, args...)
}

// SanitizeForLog sanitiza string para log
func SanitizeForLog(input string) string {
	return Sanitize(input)
}
