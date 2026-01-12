package immunity

/*
================================================================================
CIRCUIT BREAKER — CORTA CONEXÕES PROBLEMÁTICAS
================================================================================

Quando um serviço/endpoint está falhando muito:
1. CLOSED → Funcionando normal, deixa passar
2. OPEN → Muitas falhas, bloqueia tudo
3. HALF-OPEN → Testando se voltou, deixa passar algumas

Evita:
- Cascata de falhas
- Sobrecarga em serviços doentes
- Timeout infinito esperando resposta

"Melhor falhar rápido do que falhar devagar"

================================================================================
*/

import (
	"errors"
	"log"
	"sync"
	"time"
)

// CircuitState estado do circuit breaker
type CircuitState string

const (
	CircuitClosed   CircuitState = "closed"    // Normal, deixa passar
	CircuitOpen     CircuitState = "open"      // Bloqueado, rejeita tudo
	CircuitHalfOpen CircuitState = "half_open" // Testando, deixa passar algumas
)

// CircuitBreakerConfig configuração do circuit breaker
type CircuitBreakerConfig struct {
	Name               string        // Nome do circuito
	MaxFailures        int           // Falhas para abrir (default: 5)
	ResetTimeout       time.Duration // Tempo para tentar half-open (default: 30s)
	HalfOpenMaxCalls   int           // Chamadas permitidas em half-open (default: 3)
	SuccessThreshold   int           // Sucessos para fechar (default: 2)
	FailureRateWindow  time.Duration // Janela para calcular taxa de falha (default: 1min)
	MinCallsInWindow   int           // Mínimo de chamadas para avaliar (default: 10)
}

// CircuitBreaker implementação do circuit breaker
type CircuitBreaker struct {
	mu              sync.RWMutex
	config          CircuitBreakerConfig
	state           CircuitState
	failures        int
	successes       int
	lastFailureAt   time.Time
	lastStateChange time.Time
	halfOpenCalls   int
	
	// Métricas
	totalCalls      int64
	totalFailures   int64
	totalSuccesses  int64
	totalRejected   int64
	
	// Callbacks
	onStateChange   func(from, to CircuitState)
}

// ErrCircuitOpen erro quando circuito está aberto
var ErrCircuitOpen = errors.New("circuit breaker is open")

// DefaultCircuitBreakerConfig configuração padrão
func DefaultCircuitBreakerConfig(name string) CircuitBreakerConfig {
	return CircuitBreakerConfig{
		Name:              name,
		MaxFailures:       5,
		ResetTimeout:      30 * time.Second,
		HalfOpenMaxCalls:  3,
		SuccessThreshold:  2,
		FailureRateWindow: time.Minute,
		MinCallsInWindow:  10,
	}
}

// NewCircuitBreaker cria novo circuit breaker
func NewCircuitBreaker(config CircuitBreakerConfig) *CircuitBreaker {
	return &CircuitBreaker{
		config:          config,
		state:           CircuitClosed,
		lastStateChange: time.Now(),
	}
}

// SetOnStateChange define callback para mudança de estado
func (cb *CircuitBreaker) SetOnStateChange(fn func(from, to CircuitState)) {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.onStateChange = fn
}

// State retorna estado atual
func (cb *CircuitBreaker) State() CircuitState {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}

// Allow verifica se chamada é permitida
func (cb *CircuitBreaker) Allow() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	
	cb.totalCalls++
	
	switch cb.state {
	case CircuitClosed:
		return true
		
	case CircuitOpen:
		// Verificar se é hora de tentar half-open
		if time.Since(cb.lastStateChange) >= cb.config.ResetTimeout {
			cb.transitionTo(CircuitHalfOpen)
			cb.halfOpenCalls = 1
			return true
		}
		cb.totalRejected++
		return false
		
	case CircuitHalfOpen:
		// Permitir apenas algumas chamadas
		if cb.halfOpenCalls < cb.config.HalfOpenMaxCalls {
			cb.halfOpenCalls++
			return true
		}
		cb.totalRejected++
		return false
	}
	
	return false
}

// Success registra sucesso
func (cb *CircuitBreaker) Success() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	
	cb.totalSuccesses++
	
	switch cb.state {
	case CircuitClosed:
		cb.failures = 0 // Reset failures on success
		
	case CircuitHalfOpen:
		cb.successes++
		if cb.successes >= cb.config.SuccessThreshold {
			cb.transitionTo(CircuitClosed)
		}
	}
}

// Failure registra falha
func (cb *CircuitBreaker) Failure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	
	cb.totalFailures++
	cb.lastFailureAt = time.Now()
	
	switch cb.state {
	case CircuitClosed:
		cb.failures++
		if cb.failures >= cb.config.MaxFailures {
			cb.transitionTo(CircuitOpen)
		}
		
	case CircuitHalfOpen:
		// Uma falha em half-open volta para open
		cb.transitionTo(CircuitOpen)
	}
}

// transitionTo muda estado (deve ser chamado com lock)
func (cb *CircuitBreaker) transitionTo(newState CircuitState) {
	oldState := cb.state
	cb.state = newState
	cb.lastStateChange = time.Now()
	cb.failures = 0
	cb.successes = 0
	cb.halfOpenCalls = 0
	
	log.Printf("⚡ [CIRCUIT-BREAKER] %s: %s → %s", cb.config.Name, oldState, newState)
	
	if cb.onStateChange != nil {
		go cb.onStateChange(oldState, newState)
	}
}

// Execute executa função com circuit breaker
func (cb *CircuitBreaker) Execute(fn func() error) error {
	if !cb.Allow() {
		return ErrCircuitOpen
	}
	
	err := fn()
	if err != nil {
		cb.Failure()
		return err
	}
	
	cb.Success()
	return nil
}

// ExecuteWithFallback executa com fallback se circuito aberto
func (cb *CircuitBreaker) ExecuteWithFallback(fn func() error, fallback func() error) error {
	if !cb.Allow() {
		if fallback != nil {
			return fallback()
		}
		return ErrCircuitOpen
	}
	
	err := fn()
	if err != nil {
		cb.Failure()
		return err
	}
	
	cb.Success()
	return nil
}

// Stats retorna estatísticas
func (cb *CircuitBreaker) Stats() map[string]interface{} {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	
	return map[string]interface{}{
		"name":            cb.config.Name,
		"state":           cb.state,
		"total_calls":     cb.totalCalls,
		"total_successes": cb.totalSuccesses,
		"total_failures":  cb.totalFailures,
		"total_rejected":  cb.totalRejected,
		"current_failures": cb.failures,
		"last_failure_at": cb.lastFailureAt,
		"last_state_change": cb.lastStateChange,
	}
}

// Reset força reset do circuit breaker
func (cb *CircuitBreaker) Reset() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	
	cb.transitionTo(CircuitClosed)
	log.Printf("🔄 [CIRCUIT-BREAKER] %s: reset forçado", cb.config.Name)
}

// ========================================
// CIRCUIT BREAKER REGISTRY
// ========================================

// CircuitBreakerRegistry gerencia múltiplos circuit breakers
type CircuitBreakerRegistry struct {
	mu       sync.RWMutex
	breakers map[string]*CircuitBreaker
}

// NewCircuitBreakerRegistry cria novo registry
func NewCircuitBreakerRegistry() *CircuitBreakerRegistry {
	return &CircuitBreakerRegistry{
		breakers: make(map[string]*CircuitBreaker),
	}
}

// Get retorna ou cria circuit breaker
func (r *CircuitBreakerRegistry) Get(name string) *CircuitBreaker {
	r.mu.RLock()
	if cb, exists := r.breakers[name]; exists {
		r.mu.RUnlock()
		return cb
	}
	r.mu.RUnlock()
	
	// Criar novo
	r.mu.Lock()
	defer r.mu.Unlock()
	
	// Double-check
	if cb, exists := r.breakers[name]; exists {
		return cb
	}
	
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig(name))
	r.breakers[name] = cb
	
	return cb
}

// GetWithConfig retorna ou cria com config específica
func (r *CircuitBreakerRegistry) GetWithConfig(config CircuitBreakerConfig) *CircuitBreaker {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if cb, exists := r.breakers[config.Name]; exists {
		return cb
	}
	
	cb := NewCircuitBreaker(config)
	r.breakers[config.Name] = cb
	
	return cb
}

// AllStats retorna stats de todos os breakers
func (r *CircuitBreakerRegistry) AllStats() map[string]map[string]interface{} {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	stats := make(map[string]map[string]interface{})
	for name, cb := range r.breakers {
		stats[name] = cb.Stats()
	}
	
	return stats
}

// OpenCircuits retorna circuitos abertos
func (r *CircuitBreakerRegistry) OpenCircuits() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var open []string
	for name, cb := range r.breakers {
		if cb.State() == CircuitOpen {
			open = append(open, name)
		}
	}
	
	return open
}

// Global registry
var globalCircuitRegistry = NewCircuitBreakerRegistry()

// GetCircuitBreaker retorna circuit breaker global
func GetCircuitBreaker(name string) *CircuitBreaker {
	return globalCircuitRegistry.Get(name)
}

// GetCircuitBreakerWithConfig retorna circuit breaker com config
func GetCircuitBreakerWithConfig(config CircuitBreakerConfig) *CircuitBreaker {
	return globalCircuitRegistry.GetWithConfig(config)
}

// GetAllCircuitStats retorna stats de todos os circuitos
func GetAllCircuitStats() map[string]map[string]interface{} {
	return globalCircuitRegistry.AllStats()
}
