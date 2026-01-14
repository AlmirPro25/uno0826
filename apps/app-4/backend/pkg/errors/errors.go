package errors

import (
	"fmt"
	"net/http"
)

// AppError represents a standardized application error
type AppError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	Details    string `json:"details,omitempty"`
	HTTPStatus int    `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

// Error codes
const (
	// Authentication errors
	ErrCodeUnauthorized      = "AUTH_UNAUTHORIZED"
	ErrCodeInvalidToken      = "AUTH_INVALID_TOKEN"
	ErrCodeTokenExpired      = "AUTH_TOKEN_EXPIRED"
	ErrCodeInvalidCredentials = "AUTH_INVALID_CREDENTIALS"
	ErrCodeAccountDisabled   = "AUTH_ACCOUNT_DISABLED"

	// Validation errors
	ErrCodeValidation        = "VALIDATION_ERROR"
	ErrCodeInvalidInput      = "INVALID_INPUT"
	ErrCodeMissingField      = "MISSING_FIELD"
	ErrCodeInvalidFormat     = "INVALID_FORMAT"

	// Resource errors
	ErrCodeNotFound          = "RESOURCE_NOT_FOUND"
	ErrCodeAlreadyExists     = "RESOURCE_ALREADY_EXISTS"
	ErrCodeConflict          = "RESOURCE_CONFLICT"

	// Permission errors
	ErrCodeForbidden         = "PERMISSION_DENIED"
	ErrCodeInsufficientRole  = "INSUFFICIENT_ROLE"

	// Business logic errors
	ErrCodeAppointmentConflict = "APPOINTMENT_CONFLICT"
	ErrCodeSlotUnavailable     = "SLOT_UNAVAILABLE"
	ErrCodeTimeBlocked         = "TIME_BLOCKED"
	ErrCodeInvalidStatus       = "INVALID_STATUS"
	ErrCodeCannotCancel        = "CANNOT_CANCEL"

	// Server errors
	ErrCodeInternal          = "INTERNAL_ERROR"
	ErrCodeDatabase          = "DATABASE_ERROR"
	ErrCodeExternalService   = "EXTERNAL_SERVICE_ERROR"

	// Rate limiting
	ErrCodeRateLimited       = "RATE_LIMITED"
)

// Predefined errors
var (
	// Authentication
	ErrUnauthorized = &AppError{
		Code:       ErrCodeUnauthorized,
		Message:    "Autenticação necessária",
		HTTPStatus: http.StatusUnauthorized,
	}
	ErrInvalidToken = &AppError{
		Code:       ErrCodeInvalidToken,
		Message:    "Token inválido ou expirado",
		HTTPStatus: http.StatusUnauthorized,
	}
	ErrInvalidCredentials = &AppError{
		Code:       ErrCodeInvalidCredentials,
		Message:    "Email ou senha incorretos",
		HTTPStatus: http.StatusUnauthorized,
	}

	// Validation
	ErrValidation = &AppError{
		Code:       ErrCodeValidation,
		Message:    "Dados inválidos",
		HTTPStatus: http.StatusBadRequest,
	}
	ErrInvalidInput = &AppError{
		Code:       ErrCodeInvalidInput,
		Message:    "Entrada inválida",
		HTTPStatus: http.StatusBadRequest,
	}

	// Resources
	ErrNotFound = &AppError{
		Code:       ErrCodeNotFound,
		Message:    "Recurso não encontrado",
		HTTPStatus: http.StatusNotFound,
	}
	ErrAlreadyExists = &AppError{
		Code:       ErrCodeAlreadyExists,
		Message:    "Recurso já existe",
		HTTPStatus: http.StatusConflict,
	}

	// Permissions
	ErrForbidden = &AppError{
		Code:       ErrCodeForbidden,
		Message:    "Acesso negado",
		HTTPStatus: http.StatusForbidden,
	}

	// Business
	ErrAppointmentConflict = &AppError{
		Code:       ErrCodeAppointmentConflict,
		Message:    "Conflito de horário",
		HTTPStatus: http.StatusConflict,
	}
	ErrSlotUnavailable = &AppError{
		Code:       ErrCodeSlotUnavailable,
		Message:    "Horário não disponível",
		HTTPStatus: http.StatusConflict,
	}

	// Server
	ErrInternal = &AppError{
		Code:       ErrCodeInternal,
		Message:    "Erro interno do servidor",
		HTTPStatus: http.StatusInternalServerError,
	}

	// Rate limiting
	ErrRateLimited = &AppError{
		Code:       ErrCodeRateLimited,
		Message:    "Muitas requisições. Tente novamente em alguns minutos.",
		HTTPStatus: http.StatusTooManyRequests,
	}
)

// New creates a new AppError
func New(code, message string, status int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		HTTPStatus: status,
	}
}

// WithDetails adds details to an error
func (e *AppError) WithDetails(details string) *AppError {
	return &AppError{
		Code:       e.Code,
		Message:    e.Message,
		Details:    details,
		HTTPStatus: e.HTTPStatus,
	}
}

// Wrap wraps an error with additional context
func Wrap(err error, code, message string, status int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		Details:    err.Error(),
		HTTPStatus: status,
	}
}

// Helper functions for common errors
func NotFound(resource string) *AppError {
	return &AppError{
		Code:       ErrCodeNotFound,
		Message:    fmt.Sprintf("%s não encontrado(a)", resource),
		HTTPStatus: http.StatusNotFound,
	}
}

func ValidationError(field, reason string) *AppError {
	return &AppError{
		Code:       ErrCodeValidation,
		Message:    fmt.Sprintf("Campo '%s' inválido: %s", field, reason),
		HTTPStatus: http.StatusBadRequest,
	}
}

func MissingField(field string) *AppError {
	return &AppError{
		Code:       ErrCodeMissingField,
		Message:    fmt.Sprintf("Campo obrigatório: %s", field),
		HTTPStatus: http.StatusBadRequest,
	}
}

func Conflict(message string) *AppError {
	return &AppError{
		Code:       ErrCodeConflict,
		Message:    message,
		HTTPStatus: http.StatusConflict,
	}
}

func Forbidden(message string) *AppError {
	return &AppError{
		Code:       ErrCodeForbidden,
		Message:    message,
		HTTPStatus: http.StatusForbidden,
	}
}

func Internal(err error) *AppError {
	return &AppError{
		Code:       ErrCodeInternal,
		Message:    "Erro interno do servidor",
		Details:    err.Error(),
		HTTPStatus: http.StatusInternalServerError,
	}
}
