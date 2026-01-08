package resilience

import (
	"context"
	"errors"
	"math/rand"
	"net"
	"strings"
	"time"
)

// ========================================
// RETRY POLICY - TOLERÂNCIA A FALHAS
// "Retry não é tentar de novo, é política"
// ========================================

// RetryPolicy define política de retry
type RetryPolicy struct {
	MaxAttempts int
	BaseDelay   time.Duration
	MaxDelay    time.Duration
	Jitter      bool
}

// DefaultRetryPolicy política padrão para executores externos
func DefaultRetryPolicy() *RetryPolicy {
	return &RetryPolicy{
		MaxAttempts: 3,
		BaseDelay:   time.Second,
		MaxDelay:    30 * time.Second,
		Jitter:      true,
	}
}

// RetryableError indica se um erro é retryable
type RetryableError struct {
	Err       error
	Retryable bool
}

func (e *RetryableError) Error() string {
	return e.Err.Error()
}

func (e *RetryableError) Unwrap() error {
	return e.Err
}

// IsRetryable verifica se erro permite retry
// Retry SOMENTE para: timeout, 5xx, network error
// NUNCA para: 4xx, validação, assinatura inválida
func IsRetryable(err error) bool {
	if err == nil {
		return false
	}

	// Verificar se é RetryableError explícito
	var retryErr *RetryableError
	if errors.As(err, &retryErr) {
		return retryErr.Retryable
	}

	errStr := strings.ToLower(err.Error())

	// Network errors - retryable
	var netErr net.Error
	if errors.As(err, &netErr) {
		return netErr.Timeout() || netErr.Temporary()
	}

	// Timeout - retryable
	if errors.Is(err, context.DeadlineExceeded) {
		return true
	}

	// 5xx errors - retryable
	if strings.Contains(errStr, "500") ||
		strings.Contains(errStr, "502") ||
		strings.Contains(errStr, "503") ||
		strings.Contains(errStr, "504") ||
		strings.Contains(errStr, "internal server error") ||
		strings.Contains(errStr, "bad gateway") ||
		strings.Contains(errStr, "service unavailable") ||
		strings.Contains(errStr, "gateway timeout") {
		return true
	}

	// Connection errors - retryable
	if strings.Contains(errStr, "connection refused") ||
		strings.Contains(errStr, "connection reset") ||
		strings.Contains(errStr, "no such host") ||
		strings.Contains(errStr, "timeout") ||
		strings.Contains(errStr, "temporary failure") {
		return true
	}

	// 4xx errors - NOT retryable
	if strings.Contains(errStr, "400") ||
		strings.Contains(errStr, "401") ||
		strings.Contains(errStr, "403") ||
		strings.Contains(errStr, "404") ||
		strings.Contains(errStr, "422") ||
		strings.Contains(errStr, "invalid") ||
		strings.Contains(errStr, "unauthorized") ||
		strings.Contains(errStr, "forbidden") {
		return false
	}

	// Default: não retry para erros desconhecidos
	return false
}

// RetryResult resultado de operação com retry
type RetryResult struct {
	Attempts int
	LastErr  error
	Success  bool
}

// ExecuteWithRetry executa função com retry policy
func ExecuteWithRetry(ctx context.Context, policy *RetryPolicy, operation func() error) *RetryResult {
	result := &RetryResult{}

	for attempt := 1; attempt <= policy.MaxAttempts; attempt++ {
		result.Attempts = attempt

		err := operation()
		if err == nil {
			result.Success = true
			return result
		}

		result.LastErr = err

		// Verificar se é retryable
		if !IsRetryable(err) {
			return result
		}

		// Último attempt - não esperar
		if attempt == policy.MaxAttempts {
			return result
		}

		// Calcular delay com backoff exponencial
		delay := policy.calculateDelay(attempt)

		// Esperar ou cancelar
		select {
		case <-ctx.Done():
			result.LastErr = ctx.Err()
			return result
		case <-time.After(delay):
			// Continuar para próximo attempt
		}
	}

	return result
}

// calculateDelay calcula delay com exponential backoff + jitter
func (p *RetryPolicy) calculateDelay(attempt int) time.Duration {
	// Exponential: base * 2^(attempt-1)
	delay := p.BaseDelay * time.Duration(1<<uint(attempt-1))

	// Cap no máximo
	if delay > p.MaxDelay {
		delay = p.MaxDelay
	}

	// Jitter: ±25% para evitar thundering herd
	if p.Jitter {
		jitterRange := float64(delay) * 0.25
		jitter := (rand.Float64() * 2 * jitterRange) - jitterRange
		delay = time.Duration(float64(delay) + jitter)
	}

	return delay
}

// NewRetryableError cria erro retryable
func NewRetryableError(err error, retryable bool) error {
	return &RetryableError{Err: err, Retryable: retryable}
}
