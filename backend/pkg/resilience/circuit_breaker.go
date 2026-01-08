package resilience

import (
	"errors"
	"sync"
	"time"
)

// ========================================
// CIRCUIT BREAKER - PROTEÇÃO DO KERNEL
// "Se Stripe está instável, sistema não cai junto"
// ========================================

// CircuitState estado do circuit breaker
type CircuitState int

const (
	StateClosed   CircuitState = iota // Normal - requests passam
	StateOpen                         // Aberto - requests bloqueados
	StateHalfOpen                     // Teste - permite 1 request
)

func (s CircuitState) String() string {
	switch s {
	case StateClosed:
		return "CLOSED"
	case StateOpen:
		return "OPEN"
	case StateHalfOpen:
		return "HALF_OPEN"
	default:
		return "UNKNOWN"
	}
}

var (
	ErrCircuitOpen = errors.New("circuit breaker is open")
)

// CircuitBreakerConfig configuração do circuit breaker
type CircuitBreakerConfig struct {
	Name             string
	MaxFailures      int           // Falhas para abrir
	FailureWindow    time.Duration // Janela de tempo para contar falhas
	RecoveryTimeout  time.Duration // Tempo até tentar half-open
	HalfOpenMaxCalls int           // Calls permitidos em half-open
}

// DefaultCircuitConfig configuração padrão
func DefaultCircuitConfig(name string) *CircuitBreakerConfig {
	return &CircuitBreakerConfig{
		Name:             name,
		MaxFailures:      5,
		FailureWindow:    time.Minute,
		RecoveryTimeout:  30 * time.Second,
		HalfOpenMaxCalls: 1,
	}
}

// CircuitBreaker implementa o padrão circuit breaker
type CircuitBreaker struct {
	config       *CircuitBreakerConfig
	state        CircuitState
	failures     []time.Time
	lastFailure  time.Time
	openedAt     time.Time
	halfOpenCalls int
	mu           sync.RWMutex
}

// NewCircuitBreaker cria novo circuit breaker
func NewCircuitBreaker(config *CircuitBreakerConfig) *CircuitBreaker {
	return &CircuitBreaker{
		config:   config,
		state:    StateClosed,
		failures: make([]time.Time, 0),
	}
}

// Execute executa operação através do circuit breaker
func (cb *CircuitBreaker) Execute(operation func() error) error {
	if !cb.allowRequest() {
		return ErrCircuitOpen
	}

	err := operation()

	cb.recordResult(err)

	return err
}

// allowRequest verifica se request é permitido
func (cb *CircuitBreaker) allowRequest() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	switch cb.state {
	case StateClosed:
		return true

	case StateOpen:
		// Verificar se passou tempo de recovery
		if time.Since(cb.openedAt) >= cb.config.RecoveryTimeout {
			cb.state = StateHalfOpen
			cb.halfOpenCalls = 0
			return true
		}
		return false

	case StateHalfOpen:
		// Permitir apenas N calls em half-open
		if cb.halfOpenCalls < cb.config.HalfOpenMaxCalls {
			cb.halfOpenCalls++
			return true
		}
		return false
	}

	return false
}

// recordResult registra resultado da operação
func (cb *CircuitBreaker) recordResult(err error) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if err == nil {
		cb.onSuccess()
		return
	}

	// Só conta como falha se for retryable (problema de infra)
	if IsRetryable(err) {
		cb.onFailure()
	}
}

// onSuccess trata sucesso
func (cb *CircuitBreaker) onSuccess() {
	switch cb.state {
	case StateHalfOpen:
		// Sucesso em half-open -> fecha circuit
		cb.state = StateClosed
		cb.failures = make([]time.Time, 0)
	case StateClosed:
		// Limpar falhas antigas
		cb.cleanOldFailures()
	}
}

// onFailure trata falha
func (cb *CircuitBreaker) onFailure() {
	now := time.Now()
	cb.lastFailure = now

	switch cb.state {
	case StateClosed:
		cb.failures = append(cb.failures, now)
		cb.cleanOldFailures()

		if len(cb.failures) >= cb.config.MaxFailures {
			cb.state = StateOpen
			cb.openedAt = now
		}

	case StateHalfOpen:
		// Falha em half-open -> abre novamente
		cb.state = StateOpen
		cb.openedAt = now
	}
}

// cleanOldFailures remove falhas fora da janela
func (cb *CircuitBreaker) cleanOldFailures() {
	cutoff := time.Now().Add(-cb.config.FailureWindow)
	newFailures := make([]time.Time, 0)

	for _, f := range cb.failures {
		if f.After(cutoff) {
			newFailures = append(newFailures, f)
		}
	}

	cb.failures = newFailures
}

// State retorna estado atual
func (cb *CircuitBreaker) State() CircuitState {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}

// Stats retorna estatísticas do circuit breaker
func (cb *CircuitBreaker) Stats() CircuitStats {
	cb.mu.RLock()
	defer cb.mu.RUnlock()

	return CircuitStats{
		Name:           cb.config.Name,
		State:          cb.state.String(),
		Failures:       len(cb.failures),
		LastFailure:    cb.lastFailure,
		OpenedAt:       cb.openedAt,
		HalfOpenCalls:  cb.halfOpenCalls,
	}
}

// CircuitStats estatísticas do circuit breaker
type CircuitStats struct {
	Name          string    `json:"name"`
	State         string    `json:"state"`
	Failures      int       `json:"failures"`
	LastFailure   time.Time `json:"last_failure,omitempty"`
	OpenedAt      time.Time `json:"opened_at,omitempty"`
	HalfOpenCalls int       `json:"half_open_calls"`
}

// ========================================
// CIRCUIT BREAKER REGISTRY
// Gerencia múltiplos breakers por executor
// ========================================

// CircuitRegistry registro global de circuit breakers
type CircuitRegistry struct {
	breakers map[string]*CircuitBreaker
	mu       sync.RWMutex
}

// NewCircuitRegistry cria novo registry
func NewCircuitRegistry() *CircuitRegistry {
	return &CircuitRegistry{
		breakers: make(map[string]*CircuitBreaker),
	}
}

// Get obtém ou cria circuit breaker
func (r *CircuitRegistry) Get(name string) *CircuitBreaker {
	r.mu.RLock()
	if cb, exists := r.breakers[name]; exists {
		r.mu.RUnlock()
		return cb
	}
	r.mu.RUnlock()

	r.mu.Lock()
	defer r.mu.Unlock()

	// Double-check
	if cb, exists := r.breakers[name]; exists {
		return cb
	}

	cb := NewCircuitBreaker(DefaultCircuitConfig(name))
	r.breakers[name] = cb
	return cb
}

// AllStats retorna stats de todos os breakers
func (r *CircuitRegistry) AllStats() []CircuitStats {
	r.mu.RLock()
	defer r.mu.RUnlock()

	stats := make([]CircuitStats, 0, len(r.breakers))
	for _, cb := range r.breakers {
		stats = append(stats, cb.Stats())
	}
	return stats
}

// Global registry
var globalRegistry = NewCircuitRegistry()

// GetCircuitBreaker obtém circuit breaker do registry global
func GetCircuitBreaker(name string) *CircuitBreaker {
	return globalRegistry.Get(name)
}

// GetAllCircuitStats retorna stats de todos os breakers
func GetAllCircuitStats() []CircuitStats {
	return globalRegistry.AllStats()
}
