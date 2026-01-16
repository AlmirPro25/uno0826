package chaos

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

// ========================================
// CHAOS ENGINEERING - Nível Netflix
// "Quebre seu sistema antes que ele quebre sozinho"
// ========================================

// ChaosMonkey é o orquestrador de experimentos de caos
type ChaosMonkey struct {
	enabled     bool
	experiments map[string]*Experiment
	mu          sync.RWMutex
	metrics     *ChaosMetrics
}

// Experiment representa um experimento de caos
type Experiment struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Type        ExperimentType    `json:"type"`
	Config      ExperimentConfig  `json:"config"`
	Status      ExperimentStatus  `json:"status"`
	StartTime   time.Time         `json:"start_time,omitempty"`
	EndTime     time.Time         `json:"end_time,omitempty"`
	Results     *ExperimentResult `json:"results,omitempty"`
}

type ExperimentType string

const (
	// Fault Injection
	ExperimentTypeLatency     ExperimentType = "latency"      // Adiciona latência
	ExperimentTypeError       ExperimentType = "error"        // Injeta erros
	ExperimentTypeTimeout     ExperimentType = "timeout"      // Força timeouts
	ExperimentTypeException   ExperimentType = "exception"    // Lança exceções
	
	// Resource Exhaustion
	ExperimentTypeMemory      ExperimentType = "memory"       // Pressão de memória
	ExperimentTypeCPU         ExperimentType = "cpu"          // Pressão de CPU
	ExperimentTypeDisk        ExperimentType = "disk"         // Pressão de disco
	
	// Network Chaos
	ExperimentTypePacketLoss  ExperimentType = "packet_loss"  // Perda de pacotes
	ExperimentTypePartition   ExperimentType = "partition"    // Partição de rede
	
	// Application Chaos
	ExperimentTypeKillProcess ExperimentType = "kill_process" // Mata processos
	ExperimentTypeBlackhole   ExperimentType = "blackhole"    // Bloqueia requests
)

type ExperimentStatus string

const (
	ExperimentStatusPending  ExperimentStatus = "pending"
	ExperimentStatusRunning  ExperimentStatus = "running"
	ExperimentStatusComplete ExperimentStatus = "completed"
	ExperimentStatusFailed   ExperimentStatus = "failed"
	ExperimentStatusAborted  ExperimentStatus = "aborted"
)

type ExperimentConfig struct {
	// Targeting
	TargetService  string   `json:"target_service,omitempty"`
	TargetEndpoint string   `json:"target_endpoint,omitempty"`
	TargetPercent  float64  `json:"target_percent,omitempty"` // % de requests afetados
	
	// Timing
	Duration       time.Duration `json:"duration,omitempty"`
	Cooldown       time.Duration `json:"cooldown,omitempty"`
	
	// Fault specific
	LatencyMs      int     `json:"latency_ms,omitempty"`
	ErrorRate      float64 `json:"error_rate,omitempty"`
	ErrorCode      int     `json:"error_code,omitempty"`
	MemoryMB       int     `json:"memory_mb,omitempty"`
	CPUPercent     int     `json:"cpu_percent,omitempty"`
	PacketLossRate float64 `json:"packet_loss_rate,omitempty"`
}

type ExperimentResult struct {
	TotalRequests    int64         `json:"total_requests"`
	AffectedRequests int64         `json:"affected_requests"`
	ErrorsInjected   int64         `json:"errors_injected"`
	AvgLatencyAdded  time.Duration `json:"avg_latency_added"`
	SystemRecovered  bool          `json:"system_recovered"`
	Notes            []string      `json:"notes,omitempty"`
}

type ChaosMetrics struct {
	ExperimentsRun     int64
	FaultsInjected     int64
	SystemRecoveries   int64
	SystemFailures     int64
}

// NewChaosMonkey cria uma nova instância
func NewChaosMonkey() *ChaosMonkey {
	return &ChaosMonkey{
		enabled:     false, // Desabilitado por padrão!
		experiments: make(map[string]*Experiment),
		metrics:     &ChaosMetrics{},
	}
}

// Enable habilita o chaos monkey (CUIDADO!)
func (cm *ChaosMonkey) Enable() {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.enabled = true
	log.Println("🐒 CHAOS MONKEY ENABLED - System may experience intentional failures")
}

// Disable desabilita o chaos monkey
func (cm *ChaosMonkey) Disable() {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.enabled = false
	log.Println("🐒 Chaos Monkey disabled")
}

// IsEnabled verifica se está habilitado
func (cm *ChaosMonkey) IsEnabled() bool {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.enabled
}

// RegisterExperiment registra um experimento
func (cm *ChaosMonkey) RegisterExperiment(exp *Experiment) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	exp.Status = ExperimentStatusPending
	cm.experiments[exp.ID] = exp
}

// StartExperiment inicia um experimento
func (cm *ChaosMonkey) StartExperiment(id string) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	if !cm.enabled {
		return errors.New("chaos monkey is disabled")
	}

	exp, exists := cm.experiments[id]
	if !exists {
		return errors.New("experiment not found")
	}

	exp.Status = ExperimentStatusRunning
	exp.StartTime = time.Now()
	exp.Results = &ExperimentResult{}

	log.Printf("🐒 Starting chaos experiment: %s (%s)", exp.Name, exp.Type)

	// Auto-stop após duração
	if exp.Config.Duration > 0 {
		go func() {
			time.Sleep(exp.Config.Duration)
			cm.StopExperiment(id)
		}()
	}

	return nil
}

// StopExperiment para um experimento
func (cm *ChaosMonkey) StopExperiment(id string) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	exp, exists := cm.experiments[id]
	if !exists {
		return errors.New("experiment not found")
	}

	exp.Status = ExperimentStatusComplete
	exp.EndTime = time.Now()
	cm.metrics.ExperimentsRun++

	log.Printf("🐒 Stopped chaos experiment: %s", exp.Name)
	return nil
}

// GetActiveExperiments retorna experimentos ativos
func (cm *ChaosMonkey) GetActiveExperiments() []*Experiment {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	var active []*Experiment
	for _, exp := range cm.experiments {
		if exp.Status == ExperimentStatusRunning {
			active = append(active, exp)
		}
	}
	return active
}

// ========================================
// FAULT INJECTORS
// ========================================

// LatencyInjector adiciona latência artificial
type LatencyInjector struct {
	chaos     *ChaosMonkey
	minMs     int
	maxMs     int
	targetPct float64
}

func NewLatencyInjector(chaos *ChaosMonkey, minMs, maxMs int, targetPct float64) *LatencyInjector {
	return &LatencyInjector{
		chaos:     chaos,
		minMs:     minMs,
		maxMs:     maxMs,
		targetPct: targetPct,
	}
}

func (li *LatencyInjector) MaybeInject(ctx context.Context) {
	if !li.chaos.IsEnabled() {
		return
	}

	// Verificar se há experimento de latência ativo
	for _, exp := range li.chaos.GetActiveExperiments() {
		if exp.Type != ExperimentTypeLatency {
			continue
		}

		// Decidir se afeta este request
		if rand.Float64() > exp.Config.TargetPercent/100 {
			continue
		}

		// Injetar latência
		latency := time.Duration(exp.Config.LatencyMs) * time.Millisecond
		if li.maxMs > li.minMs {
			latency = time.Duration(li.minMs+rand.Intn(li.maxMs-li.minMs)) * time.Millisecond
		}

		select {
		case <-ctx.Done():
			return
		case <-time.After(latency):
			exp.Results.AffectedRequests++
		}
	}
}

// ErrorInjector injeta erros
type ErrorInjector struct {
	chaos *ChaosMonkey
}

func NewErrorInjector(chaos *ChaosMonkey) *ErrorInjector {
	return &ErrorInjector{chaos: chaos}
}

func (ei *ErrorInjector) MaybeInjectError() error {
	if !ei.chaos.IsEnabled() {
		return nil
	}

	for _, exp := range ei.chaos.GetActiveExperiments() {
		if exp.Type != ExperimentTypeError {
			continue
		}

		if rand.Float64() < exp.Config.ErrorRate/100 {
			exp.Results.ErrorsInjected++
			return &ChaosError{
				Code:    exp.Config.ErrorCode,
				Message: "Chaos monkey injected error",
			}
		}
	}

	return nil
}

// ChaosError é um erro injetado pelo chaos monkey
type ChaosError struct {
	Code    int
	Message string
}

func (e *ChaosError) Error() string {
	return e.Message
}

// ========================================
// HTTP MIDDLEWARE
// ========================================

// ChaosMiddleware é um middleware HTTP para injeção de falhas
func ChaosMiddleware(chaos *ChaosMonkey) func(http.Handler) http.Handler {
	latencyInjector := NewLatencyInjector(chaos, 100, 5000, 10)
	errorInjector := NewErrorInjector(chaos)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !chaos.IsEnabled() {
				next.ServeHTTP(w, r)
				return
			}

			// Verificar blackhole
			for _, exp := range chaos.GetActiveExperiments() {
				if exp.Type == ExperimentTypeBlackhole {
					if exp.Config.TargetEndpoint == "" || exp.Config.TargetEndpoint == r.URL.Path {
						if rand.Float64() < exp.Config.TargetPercent/100 {
							exp.Results.AffectedRequests++
							// Não responde - simula request perdido
							return
						}
					}
				}
			}

			// Injetar latência
			latencyInjector.MaybeInject(r.Context())

			// Injetar erro
			if err := errorInjector.MaybeInjectError(); err != nil {
				if chaosErr, ok := err.(*ChaosError); ok {
					http.Error(w, chaosErr.Message, chaosErr.Code)
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// ========================================
// PRE-DEFINED EXPERIMENTS
// ========================================

// CreateLatencyExperiment cria experimento de latência
func CreateLatencyExperiment(name string, latencyMs int, durationMin int, targetPct float64) *Experiment {
	return &Experiment{
		ID:          fmt.Sprintf("latency-%d", time.Now().Unix()),
		Name:        name,
		Description: fmt.Sprintf("Inject %dms latency to %v%% of requests", latencyMs, targetPct),
		Type:        ExperimentTypeLatency,
		Config: ExperimentConfig{
			LatencyMs:     latencyMs,
			Duration:      time.Duration(durationMin) * time.Minute,
			TargetPercent: targetPct,
		},
	}
}

// CreateErrorExperiment cria experimento de erro
func CreateErrorExperiment(name string, errorRate float64, errorCode int, durationMin int) *Experiment {
	return &Experiment{
		ID:          fmt.Sprintf("error-%d", time.Now().Unix()),
		Name:        name,
		Description: fmt.Sprintf("Inject %v%% error rate with code %d", errorRate, errorCode),
		Type:        ExperimentTypeError,
		Config: ExperimentConfig{
			ErrorRate: errorRate,
			ErrorCode: errorCode,
			Duration:  time.Duration(durationMin) * time.Minute,
		},
	}
}

// CreateBlackholeExperiment cria experimento de blackhole
func CreateBlackholeExperiment(name, endpoint string, targetPct float64, durationMin int) *Experiment {
	return &Experiment{
		ID:          fmt.Sprintf("blackhole-%d", time.Now().Unix()),
		Name:        name,
		Description: fmt.Sprintf("Blackhole %v%% of requests to %s", targetPct, endpoint),
		Type:        ExperimentTypeBlackhole,
		Config: ExperimentConfig{
			TargetEndpoint: endpoint,
			TargetPercent:  targetPct,
			Duration:       time.Duration(durationMin) * time.Minute,
		},
	}
}

// ========================================
// GAME DAYS - Exercícios de resiliência
// ========================================

// GameDay representa um exercício de resiliência planejado
type GameDay struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Experiments []*Experiment `json:"experiments"`
	Schedule    time.Time     `json:"schedule"`
	Status      string        `json:"status"`
}

// CreateGameDay cria um game day com múltiplos experimentos
func CreateGameDay(name, description string, experiments []*Experiment) *GameDay {
	return &GameDay{
		ID:          fmt.Sprintf("gameday-%d", time.Now().Unix()),
		Name:        name,
		Description: description,
		Experiments: experiments,
		Status:      "scheduled",
	}
}

// StandardGameDay retorna um game day padrão para testar resiliência
func StandardGameDay() *GameDay {
	return CreateGameDay(
		"Standard Resilience Test",
		"Test system resilience with common failure scenarios",
		[]*Experiment{
			CreateLatencyExperiment("High Latency Test", 500, 5, 20),
			CreateErrorExperiment("Error Injection Test", 5, 500, 5),
			CreateBlackholeExperiment("Partial Outage Test", "/api/v1/telemetry", 50, 3),
		},
	)
}
