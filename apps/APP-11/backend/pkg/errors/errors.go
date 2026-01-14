
package errors

import (
	"errors"
	"fmt"
	"net/http"
)

// ErrorCode defines custom error codes for API responses.
type ErrorCode string

const (
	// Common errors
	CodeInvalidInput      ErrorCode = "INVALID_INPUT"
	CodeNotFound          ErrorCode = "NOT_FOUND"
	CodeUnauthorized      ErrorCode = "UNAUTHORIZED"
	CodeForbidden         ErrorCode = "FORBIDDEN"
	CodeConflict          ErrorCode = "CONFLICT"
	CodeInternal          ErrorCode = "INTERNAL_SERVER_ERROR"
	CodeServiceUnavailable ErrorCode = "SERVICE_UNAVAILABLE"

	// Auth specific errors
	CodeInvalidCredentials ErrorCode = "INVALID_CREDENTIALS"
	CodeEmailTaken        ErrorCode = "EMAIL_TAKEN"
	CodeInvalidToken      ErrorCode = "INVALID_TOKEN"
	CodeTokenExpired      ErrorCode = "TOKEN_EXPIRED"

	// Beta specific errors
	CodeBetaEmailAlreadySubscribed ErrorCode = "BETA_EMAIL_ALREADY_SUBSCRIBED"
)

// APIError represents a structured error returned by the API.
type APIError struct {
	Message    string    `json:"error"`
	Code       ErrorCode `json:"code,omitempty"`
	StatusCode int       `json:"-"` // HTTP status code, not part of JSON response
	Err        error     `json:"-"` // Original error, not exposed in API
}

// Error implements the error interface.
func (e *APIError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("API Error: %s (Code: %s, Status: %d, Original: %v)", e.Message, e.Code, e.StatusCode, e.Err)
	}
	return fmt.Sprintf("API Error: %s (Code: %s, Status: %d)", e.Message, e.Code, e.StatusCode)
}

// NewAPIError creates a new APIError.
func NewAPIError(statusCode int, code ErrorCode, message string, err error) *APIError {
	return &APIError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
		Err:        err,
	}
}

// Wrap wraps an error with context and returns a new APIError.
func Wrap(err error, statusCode int, code ErrorCode, message string) error {
	if err == nil {
		return NewAPIError(statusCode, code, message, nil)
	}
	return NewAPIError(statusCode, code, message, err)
}

// Is checks if the target error is an APIError with a specific code.
func Is(err error, targetCode ErrorCode) bool {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		return apiErr.Code == targetCode
	}
	return false
}

// FromError converts a generic error to an APIError, if possible, or a generic InternalServerError.
func FromError(err error) *APIError {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		return apiErr
	}
	// Default to internal server error if not a known APIError
	return NewAPIError(http.StatusInternalServerError, CodeInternal, "An unexpected internal server error occurred.", err)
}
