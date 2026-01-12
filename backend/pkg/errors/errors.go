package errors

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// ========================================
// AJUSTE 1: CLASSIFICAÇÃO DE ERROS
// Diferenciar ERRO DE NEGÓCIO vs ERRO DE SISTEMA
// ========================================

// ErrorType classifica o tipo de erro para observabilidade e decisões automáticas
type ErrorType string

const (
	// ErrValidation - Dados inválidos do cliente (4xx)
	// Exemplo: email inválido, campo obrigatório faltando
	// Ação: Retornar erro ao cliente, não alertar
	ErrValidation ErrorType = "VALIDATION"

	// ErrBusiness - Regra de negócio violada (4xx)
	// Exemplo: saldo insuficiente, limite excedido, plano não permite
	// Ação: Retornar erro ao cliente, logar para análise
	ErrBusiness ErrorType = "BUSINESS"

	// ErrSystem - Falha interna do sistema (5xx)
	// Exemplo: banco caiu, serviço externo falhou, panic
	// Ação: Alertar imediatamente, retry automático
	ErrSystem ErrorType = "SYSTEM"

	// ErrSecurity - Tentativa de violação de segurança (4xx/5xx)
	// Exemplo: token inválido, acesso negado, rate limit, ataque detectado
	// Ação: Alertar, logar IP, possível quarentena
	ErrSecurity ErrorType = "SECURITY"

	// ErrExternal - Falha em serviço externo (5xx)
	// Exemplo: Stripe falhou, webhook não respondeu
	// Ação: Retry com backoff, alertar se persistir
	ErrExternal ErrorType = "EXTERNAL"

	// ErrInvariant - Invariante do sistema violada (5xx CRÍTICO)
	// Exemplo: ledger desbalanceado, dados inconsistentes
	// Ação: ALERTA CRÍTICO, possível kill switch
	ErrInvariant ErrorType = "INVARIANT"
)

// ========================================
// STRUCTURED ERROR
// ========================================

// AppError é o erro estruturado padrão do sistema
type AppError struct {
	// Identificação
	ID        string    `json:"id"`
	Type      ErrorType `json:"type"`
	Code      string    `json:"code"`
	Message   string    `json:"message"`
	
	// Contexto
	AppID     string    `json:"app_id,omitempty"`
	UserID    string    `json:"user_id,omitempty"`
	RequestID string    `json:"request_id,omitempty"`
	
	// Detalhes
	Details   []ErrorDetail `json:"details,omitempty"`
	Cause     string        `json:"cause,omitempty"`
	Stack     string        `json:"stack,omitempty"`
	
	// Metadata
	Timestamp time.Time         `json:"timestamp"`
	Metadata  map[string]string `json:"metadata,omitempty"`
	
	// HTTP
	HTTPStatus int `json:"-"`
}

// ErrorDetail detalha campos específicos com erro
type ErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// Error implementa interface error
func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s: %s", e.Type, e.Code, e.Message)
}

// ToJSON serializa o erro para resposta HTTP
func (e *AppError) ToJSON() []byte {
	data, _ := json.Marshal(map[string]any{
		"error": e,
	})
	return data
}

// ========================================
// CONSTRUTORES
// ========================================

// NewValidationError cria erro de validação
func NewValidationError(code, message string, details ...ErrorDetail) *AppError {
	return &AppError{
		ID:         uuid.New().String(),
		Type:       ErrValidation,
		Code:       code,
		Message:    message,
		Details:    details,
		Timestamp:  time.Now(),
		HTTPStatus: http.StatusBadRequest,
	}
}

// NewBusinessError cria erro de regra de negócio
func NewBusinessError(code, message string) *AppError {
	return &AppError{
		ID:         uuid.New().String(),
		Type:       ErrBusiness,
		Code:       code,
		Message:    message,
		Timestamp:  time.Now(),
		HTTPStatus: http.StatusUnprocessableEntity,
	}
}

// NewSystemError cria erro de sistema
func NewSystemError(code, message string, cause error) *AppError {
	var causeStr string
	if cause != nil {
		causeStr = cause.Error()
	}
	return &AppError{
		ID:         uuid.New().String(),
		Type:       ErrSystem,
		Code:       code,
		Message:    message,
		Cause:      causeStr,
		Timestamp:  time.Now(),
		HTTPStatus: http.StatusInternalServerError,
	}
}

// NewSecurityError cria erro de segurança
func NewSecurityError(code, message string) *AppError {
	return &AppError{
		ID:         uuid.New().String(),
		Type:       ErrSecurity,
		Code:       code,
		Message:    message,
		Timestamp:  time.Now(),
		HTTPStatus: http.StatusForbidden,
	}
}

// NewExternalError cria erro de serviço externo
func NewExternalError(code, message string, service string) *AppError {
	return &AppError{
		ID:         uuid.New().String(),
		Type:       ErrExternal,
		Code:       code,
		Message:    message,
		Metadata:   map[string]string{"service": service},
		Timestamp:  time.Now(),
		HTTPStatus: http.StatusBadGateway,
	}
}

// NewInvariantError cria erro de invariante violada (CRÍTICO)
func NewInvariantError(code, message string) *AppError {
	return &AppError{
		ID:         uuid.New().String(),
		Type:       ErrInvariant,
		Code:       code,
		Message:    message,
		Timestamp:  time.Now(),
		HTTPStatus: http.StatusInternalServerError,
	}
}

// ========================================
// HELPERS
// ========================================

// WithContext adiciona contexto ao erro
func (e *AppError) WithContext(appID, userID, requestID string) *AppError {
	e.AppID = appID
	e.UserID = userID
	e.RequestID = requestID
	return e
}

// WithMetadata adiciona metadata ao erro
func (e *AppError) WithMetadata(key, value string) *AppError {
	if e.Metadata == nil {
		e.Metadata = make(map[string]string)
	}
	e.Metadata[key] = value
	return e
}

// WithDetails adiciona detalhes ao erro
func (e *AppError) WithDetails(details ...ErrorDetail) *AppError {
	e.Details = append(e.Details, details...)
	return e
}

// ========================================
// CÓDIGOS DE ERRO PADRÃO
// ========================================

// Validation errors
const (
	CodeValidationRequired    = "VALIDATION_REQUIRED"
	CodeValidationInvalid     = "VALIDATION_INVALID"
	CodeValidationFormat      = "VALIDATION_FORMAT"
	CodeValidationRange       = "VALIDATION_RANGE"
)

// Business errors
const (
	CodeBusinessInsufficientFunds = "BUSINESS_INSUFFICIENT_FUNDS"
	CodeBusinessLimitExceeded     = "BUSINESS_LIMIT_EXCEEDED"
	CodeBusinessPlanNotAllowed    = "BUSINESS_PLAN_NOT_ALLOWED"
	CodeBusinessAlreadyExists     = "BUSINESS_ALREADY_EXISTS"
	CodeBusinessNotFound          = "BUSINESS_NOT_FOUND"
	CodeBusinessExpired           = "BUSINESS_EXPIRED"
)

// System errors
const (
	CodeSystemDatabase    = "SYSTEM_DATABASE"
	CodeSystemInternal    = "SYSTEM_INTERNAL"
	CodeSystemTimeout     = "SYSTEM_TIMEOUT"
	CodeSystemUnavailable = "SYSTEM_UNAVAILABLE"
)

// Security errors
const (
	CodeSecurityUnauthorized = "SECURITY_UNAUTHORIZED"
	CodeSecurityForbidden    = "SECURITY_FORBIDDEN"
	CodeSecurityRateLimit    = "SECURITY_RATE_LIMIT"
	CodeSecurityTokenInvalid = "SECURITY_TOKEN_INVALID"
	CodeSecurityTokenExpired = "SECURITY_TOKEN_EXPIRED"
	CodeSecurityAttack       = "SECURITY_ATTACK_DETECTED"
)

// External errors
const (
	CodeExternalStripe   = "EXTERNAL_STRIPE"
	CodeExternalWebhook  = "EXTERNAL_WEBHOOK"
	CodeExternalProvider = "EXTERNAL_PROVIDER"
)

// Invariant errors
const (
	CodeInvariantLedger     = "INVARIANT_LEDGER_MISMATCH"
	CodeInvariantData       = "INVARIANT_DATA_INCONSISTENT"
	CodeInvariantSecurity   = "INVARIANT_SECURITY_BREACH"
)

// ========================================
// SEVERITY MAPPING
// ========================================

// Severity retorna a severidade do erro para alerting
func (e *AppError) Severity() string {
	switch e.Type {
	case ErrValidation:
		return "low"
	case ErrBusiness:
		return "low"
	case ErrSystem:
		return "high"
	case ErrSecurity:
		return "high"
	case ErrExternal:
		return "medium"
	case ErrInvariant:
		return "critical"
	default:
		return "medium"
	}
}

// ShouldAlert retorna se o erro deve gerar alerta
func (e *AppError) ShouldAlert() bool {
	switch e.Type {
	case ErrValidation, ErrBusiness:
		return false
	case ErrSystem, ErrSecurity, ErrExternal, ErrInvariant:
		return true
	default:
		return false
	}
}

// ShouldRetry retorna se a operação deve ser retentada
func (e *AppError) ShouldRetry() bool {
	switch e.Type {
	case ErrSystem, ErrExternal:
		return true
	default:
		return false
	}
}
