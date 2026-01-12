package resilience

import (
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// ========================================
// CIRCUIT BREAKER TESTS
// ========================================

func TestNewCircuitBreaker(t *testing.T) {
	config := DefaultCircuitConfig("test")
	cb := NewCircuitBreaker(config)
	
	assert.NotNil(t, cb)
	assert.Equal(t, StateClosed, cb.State())
}

func TestDefaultCircuitConfig(t *testing.T) {
	config := DefaultCircuitConfig("test-service")
	
	assert.Equal(t, "test-service", config.Name)
	assert.Equal(t, 5, config.MaxFailures)
	assert.Equal(t, time.Minute, config.FailureWindow)
	assert.Equal(t, 30*time.Second, config.RecoveryTimeout)
	assert.Equal(t, 1, config.HalfOpenMaxCalls)
}

func TestCircuitState_String(t *testing.T) {
	assert.Equal(t, "CLOSED", StateClosed.String())
	assert.Equal(t, "OPEN", StateOpen.String())
	assert.Equal(t, "HALF_OPEN", StateHalfOpen.String())
	assert.Equal(t, "UNKNOWN", CircuitState(99).String())
}

func TestExecute_Success(t *testing.T) {
	config := DefaultCircuitConfig("test")
	cb := NewCircuitBreaker(config)

	err := cb.Execute(func() error {
		return nil
	})

	assert.NoError(t, err)
	assert.Equal(t, StateClosed, cb.State())
}

func TestExecute_NonRetryableError(t *testing.T) {
	config := DefaultCircuitConfig("test")
	cb := NewCircuitBreaker(config)

	// Erros não-retryable não devem abrir o circuit
	for i := 0; i < 10; i++ {
		err := cb.Execute(func() error {
			return errors.New("business error")
		})
		assert.Error(t, err)
	}

	// Circuit deve permanecer fechado
	assert.Equal(t, StateClosed, cb.State())
}


func TestExecute_CircuitOpens(t *testing.T) {
	config := &CircuitBreakerConfig{
		Name:             "test",
		MaxFailures:      3,
		FailureWindow:    time.Minute,
		RecoveryTimeout:  100 * time.Millisecond,
		HalfOpenMaxCalls: 1,
	}
	cb := NewCircuitBreaker(config)

	// Simular erros retryable (usando NewRetryableError)
	retryableErr := NewRetryableError(errors.New("connection timeout"), true)

	for i := 0; i < 3; i++ {
		_ = cb.Execute(func() error {
			return retryableErr
		})
	}

	// Circuit deve estar aberto
	assert.Equal(t, StateOpen, cb.State())

	// Requests devem ser bloqueados
	err := cb.Execute(func() error {
		return nil
	})
	assert.ErrorIs(t, err, ErrCircuitOpen)
}

func TestExecute_HalfOpen(t *testing.T) {
	config := &CircuitBreakerConfig{
		Name:             "test",
		MaxFailures:      2,
		FailureWindow:    time.Minute,
		RecoveryTimeout:  50 * time.Millisecond,
		HalfOpenMaxCalls: 1,
	}
	cb := NewCircuitBreaker(config)

	retryableErr := NewRetryableError(errors.New("timeout"), true)

	// Abrir circuit
	for i := 0; i < 2; i++ {
		_ = cb.Execute(func() error {
			return retryableErr
		})
	}
	assert.Equal(t, StateOpen, cb.State())

	// Esperar recovery timeout
	time.Sleep(60 * time.Millisecond)

	// Próximo request deve ser permitido (half-open)
	err := cb.Execute(func() error {
		return nil
	})
	assert.NoError(t, err)

	// Circuit deve fechar após sucesso em half-open
	assert.Equal(t, StateClosed, cb.State())
}

func TestExecute_HalfOpenFailure(t *testing.T) {
	config := &CircuitBreakerConfig{
		Name:             "test",
		MaxFailures:      2,
		FailureWindow:    time.Minute,
		RecoveryTimeout:  50 * time.Millisecond,
		HalfOpenMaxCalls: 1,
	}
	cb := NewCircuitBreaker(config)

	retryableErr := NewRetryableError(errors.New("timeout"), true)

	// Abrir circuit
	for i := 0; i < 2; i++ {
		_ = cb.Execute(func() error {
			return retryableErr
		})
	}

	// Esperar recovery timeout
	time.Sleep(60 * time.Millisecond)

	// Falhar em half-open
	_ = cb.Execute(func() error {
		return retryableErr
	})

	// Circuit deve abrir novamente
	assert.Equal(t, StateOpen, cb.State())
}

func TestStats(t *testing.T) {
	config := DefaultCircuitConfig("test-stats")
	cb := NewCircuitBreaker(config)

	stats := cb.Stats()
	assert.Equal(t, "test-stats", stats.Name)
	assert.Equal(t, "CLOSED", stats.State)
	assert.Equal(t, 0, stats.Failures)
}

// ========================================
// CIRCUIT REGISTRY TESTS
// ========================================

func TestNewCircuitRegistry(t *testing.T) {
	registry := NewCircuitRegistry()
	assert.NotNil(t, registry)
	assert.NotNil(t, registry.breakers)
}

func TestRegistry_Get(t *testing.T) {
	registry := NewCircuitRegistry()

	cb1 := registry.Get("service-a")
	assert.NotNil(t, cb1)

	// Deve retornar o mesmo breaker
	cb2 := registry.Get("service-a")
	assert.Same(t, cb1, cb2)

	// Diferente serviço = diferente breaker
	cb3 := registry.Get("service-b")
	assert.NotSame(t, cb1, cb3)
}

func TestRegistry_AllStats(t *testing.T) {
	registry := NewCircuitRegistry()

	registry.Get("service-a")
	registry.Get("service-b")
	registry.Get("service-c")

	stats := registry.AllStats()
	assert.Len(t, stats, 3)
}

func TestGetCircuitBreaker_Global(t *testing.T) {
	cb := GetCircuitBreaker("global-test")
	assert.NotNil(t, cb)

	// Deve retornar o mesmo
	cb2 := GetCircuitBreaker("global-test")
	assert.Same(t, cb, cb2)
}

func TestGetAllCircuitStats_Global(t *testing.T) {
	// Criar alguns breakers
	GetCircuitBreaker("stats-test-1")
	GetCircuitBreaker("stats-test-2")

	stats := GetAllCircuitStats()
	assert.NotEmpty(t, stats)
}

// Verificar se IsRetryable funciona
func TestIsRetryable(t *testing.T) {
	// Erro normal não é retryable
	normalErr := errors.New("normal error")
	assert.False(t, IsRetryable(normalErr))

	// Erro retryable usando NewRetryableError
	retryableErr := NewRetryableError(errors.New("timeout"), true)
	assert.True(t, IsRetryable(retryableErr))

	// Erro não-retryable explícito
	nonRetryableErr := NewRetryableError(errors.New("invalid"), false)
	assert.False(t, IsRetryable(nonRetryableErr))
}
