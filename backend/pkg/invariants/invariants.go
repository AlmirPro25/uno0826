package invariants

/*
================================================================================
SISTEMA IMUNOLÓGICO DO KERNEL — INVARIANTS
================================================================================

Este pacote implementa TESTES ATIVOS que rodam em produção.

Diferença fundamental:
- Testes de CI: rodam antes do deploy, depois morrem
- Invariants: vivem dentro do sistema, defendem em tempo real

Quando uma invariant é violada:
1. Log de CRITICAL é emitido
2. Métrica é incrementada
3. Alerta pode ser disparado
4. Operação pode ser bloqueada

Filosofia:
"Se algo impossível acontecer, o sistema grita antes de quebrar."

================================================================================
*/

import (
	"fmt"
	"log"
	"runtime"
	"sync"
	"time"
)

// ========================================
// TIPOS
// ========================================

// Violation representa uma violação de invariant
type Violation struct {
	ID          string                 `json:"id"`
	Invariant   string                 `json:"invariant"`
	Message     string                 `json:"message"`
	Context     map[string]interface{} `json:"context"`
	StackTrace  string                 `json:"stack_trace"`
	Timestamp   time.Time              `json:"timestamp"`
	Severity    Severity               `json:"severity"`
	Recovered   bool                   `json:"recovered"`
}

// Severity define a gravidade da violação
type Severity int

const (
	SeverityWarning  Severity = iota // Log + métrica
	SeverityCritical                 // Log + métrica + alerta
	SeverityFatal                    // Log + métrica + alerta + panic
)

func (s Severity) String() string {
	switch s {
	case SeverityWarning:
		return "WARNING"
	case SeverityCritical:
		return "CRITICAL"
	case SeverityFatal:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

// ViolationHandler é chamado quando uma invariant é violada
type ViolationHandler func(v Violation)

// ========================================
// REGISTRY GLOBAL
// ========================================

var (
	handlers     []ViolationHandler
	handlersLock sync.RWMutex
	violations   []Violation
	violLock     sync.RWMutex
	enabled      = true
)

// RegisterHandler adiciona um handler para violações
func RegisterHandler(h ViolationHandler) {
	handlersLock.Lock()
	defer handlersLock.Unlock()
	handlers = append(handlers, h)
}

// Enable ativa o sistema de invariants
func Enable() {
	enabled = true
}

// Disable desativa (útil para testes)
func Disable() {
	enabled = false
}

// GetViolations retorna todas as violações registradas
func GetViolations() []Violation {
	violLock.RLock()
	defer violLock.RUnlock()
	result := make([]Violation, len(violations))
	copy(result, violations)
	return result
}

// ClearViolations limpa o histórico (útil para testes)
func ClearViolations() {
	violLock.Lock()
	defer violLock.Unlock()
	violations = nil
}

// ========================================
// FUNÇÕES PRINCIPAIS
// ========================================

// Assert verifica uma condição e registra violação se falsa
// Uso: invariants.Assert(user.ID != uuid.Nil, "user_id_nil", "User ID cannot be nil")
func Assert(condition bool, name string, message string, ctx ...map[string]interface{}) {
	if !enabled || condition {
		return
	}

	context := make(map[string]interface{})
	if len(ctx) > 0 && ctx[0] != nil {
		context = ctx[0]
	}

	violation := Violation{
		ID:         fmt.Sprintf("%s-%d", name, time.Now().UnixNano()),
		Invariant:  name,
		Message:    message,
		Context:    context,
		StackTrace: getStackTrace(),
		Timestamp:  time.Now(),
		Severity:   SeverityWarning,
	}

	recordViolation(violation)
}

// AssertCritical como Assert, mas com severidade CRITICAL
func AssertCritical(condition bool, name string, message string, ctx ...map[string]interface{}) {
	if !enabled || condition {
		return
	}

	context := make(map[string]interface{})
	if len(ctx) > 0 && ctx[0] != nil {
		context = ctx[0]
	}

	violation := Violation{
		ID:         fmt.Sprintf("%s-%d", name, time.Now().UnixNano()),
		Invariant:  name,
		Message:    message,
		Context:    context,
		StackTrace: getStackTrace(),
		Timestamp:  time.Now(),
		Severity:   SeverityCritical,
	}

	recordViolation(violation)
}

// AssertFatal como Assert, mas causa panic após registrar
func AssertFatal(condition bool, name string, message string, ctx ...map[string]interface{}) {
	if !enabled || condition {
		return
	}

	context := make(map[string]interface{})
	if len(ctx) > 0 && ctx[0] != nil {
		context = ctx[0]
	}

	violation := Violation{
		ID:         fmt.Sprintf("%s-%d", name, time.Now().UnixNano()),
		Invariant:  name,
		Message:    message,
		Context:    context,
		StackTrace: getStackTrace(),
		Timestamp:  time.Now(),
		Severity:   SeverityFatal,
	}

	recordViolation(violation)
	panic(fmt.Sprintf("FATAL INVARIANT VIOLATION: %s - %s", name, message))
}

// Never deve ser chamado em código que nunca deveria executar
// Uso: default: invariants.Never("invalid_state", "This state should never happen")
func Never(name string, message string, ctx ...map[string]interface{}) {
	AssertFatal(false, name, message, ctx...)
}

// ========================================
// INVARIANTS ESPECÍFICAS DO KERNEL
// ========================================

// AssertUserHasSingleOrigin verifica que usuário tem apenas uma origem
func AssertUserHasSingleOrigin(userID string, originCount int) {
	AssertCritical(
		originCount <= 1,
		"user_multiple_origins",
		"User cannot have multiple origins",
		map[string]interface{}{
			"user_id":      userID,
			"origin_count": originCount,
		},
	)
}

// AssertAppIsolation verifica que dados não vazam entre apps
func AssertAppIsolation(requestAppID, dataAppID string) {
	AssertCritical(
		requestAppID == dataAppID,
		"app_isolation_breach",
		"Data from one app accessed by another",
		map[string]interface{}{
			"request_app_id": requestAppID,
			"data_app_id":    dataAppID,
		},
	)
}

// AssertValidMembership verifica que membership é válida
func AssertValidMembership(userID, appID string, status string) {
	validStatuses := map[string]bool{"active": true, "pending": true, "suspended": true}
	AssertCritical(
		validStatuses[status],
		"invalid_membership_status",
		"Membership has invalid status",
		map[string]interface{}{
			"user_id": userID,
			"app_id":  appID,
			"status":  status,
		},
	)
}

// AssertTokenNotExpired verifica que token não está expirado
func AssertTokenNotExpired(tokenExp int64) {
	now := time.Now().Unix()
	Assert(
		tokenExp > now,
		"expired_token_used",
		"Expired token was used in operation",
		map[string]interface{}{
			"token_exp": tokenExp,
			"now":       now,
			"diff_sec":  now - tokenExp,
		},
	)
}

// AssertNoPasswordInJWT verifica que senha não está no JWT
func AssertNoPasswordInJWT(claims map[string]interface{}) {
	_, hasPassword := claims["password"]
	_, hasPasswordHash := claims["password_hash"]
	_, hasSecret := claims["secret"]

	AssertFatal(
		!hasPassword && !hasPasswordHash && !hasSecret,
		"password_in_jwt",
		"CRITICAL: Password or secret found in JWT claims",
		claims,
	)
}

// AssertTelemetryHasAppID verifica que telemetria tem app_id
func AssertTelemetryHasAppID(appID string) {
	AssertCritical(
		appID != "" && appID != "00000000-0000-0000-0000-000000000000",
		"telemetry_missing_app_id",
		"Telemetry event without valid app_id",
		map[string]interface{}{
			"app_id": appID,
		},
	)
}

// AssertTelemetryBelongsToApp verifica que evento pertence ao app do request
func AssertTelemetryBelongsToApp(requestAppID, eventAppID string) {
	AssertCritical(
		requestAppID == eventAppID,
		"telemetry_cross_app_violation",
		"Telemetry event app_id does not match request app_id",
		map[string]interface{}{
			"request_app_id": requestAppID,
			"event_app_id":   eventAppID,
		},
	)
}

// ========================================
// HELPERS
// ========================================

func recordViolation(v Violation) {
	// Registrar no histórico
	violLock.Lock()
	violations = append(violations, v)
	// Manter apenas últimas 1000 violações
	if len(violations) > 1000 {
		violations = violations[len(violations)-1000:]
	}
	violLock.Unlock()

	// Log
	log.Printf("🚨 [INVARIANT %s] %s: %s | context=%v",
		v.Severity, v.Invariant, v.Message, v.Context)

	// Chamar handlers
	handlersLock.RLock()
	for _, h := range handlers {
		go h(v) // Async para não bloquear
	}
	handlersLock.RUnlock()
}

func getStackTrace() string {
	buf := make([]byte, 4096)
	n := runtime.Stack(buf, false)
	return string(buf[:n])
}

// ========================================
// MIDDLEWARE PARA GIN
// ========================================

// GinMiddleware retorna um middleware que verifica invariants por request
func GinMiddleware() func(c interface{}) {
	// Retorna função genérica para evitar import circular
	// Na prática, seria tipado como gin.HandlerFunc
	return func(c interface{}) {
		// Verificações por request podem ser adicionadas aqui
	}
}
