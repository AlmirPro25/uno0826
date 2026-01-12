package health

import (
	"context"
	"sync"
	"time"

	"gorm.io/gorm"
	"prost-qs/backend/pkg/invariants"
)

// ========================================
// HEALTH SERVICE
// "O sistema está saudável?"
// ========================================

type Service struct {
	db               *gorm.DB
	invariantsRunner *invariants.Runner
	startTime        time.Time
	checks           map[string]CheckFunc
	mutex            sync.RWMutex
}

type CheckFunc func(ctx context.Context) CheckResult

type CheckResult struct {
	Status   string        `json:"status"` // healthy, degraded, unhealthy
	Message  string        `json:"message,omitempty"`
	Duration time.Duration `json:"duration"`
	Details  interface{}   `json:"details,omitempty"`
}

type HealthStatus struct {
	Status      string                  `json:"status"`
	Version     string                  `json:"version"`
	Uptime      string                  `json:"uptime"`
	UptimeMs    int64                   `json:"uptime_ms"`
	Timestamp   time.Time               `json:"timestamp"`
	Checks      map[string]CheckResult  `json:"checks"`
	Invariants  *InvariantsStatus       `json:"invariants,omitempty"`
}

type InvariantsStatus struct {
	LastRun    time.Time `json:"last_run"`
	Passed     int       `json:"passed"`
	Failed     int       `json:"failed"`
	IsRunning  bool      `json:"is_running"`
}

func NewService(db *gorm.DB, runner *invariants.Runner) *Service {
	s := &Service{
		db:               db,
		invariantsRunner: runner,
		startTime:        time.Now(),
		checks:           make(map[string]CheckFunc),
	}
	
	// Registrar checks padrão
	s.RegisterCheck("database", s.checkDatabase)
	
	return s
}

// RegisterCheck registra um novo health check
func (s *Service) RegisterCheck(name string, check CheckFunc) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.checks[name] = check
}

// GetHealth retorna o status de saúde completo
func (s *Service) GetHealth(ctx context.Context) *HealthStatus {
	uptime := time.Since(s.startTime)
	
	status := &HealthStatus{
		Status:    "healthy",
		Version:   "1.0.0", // TODO: pegar da config
		Uptime:    uptime.String(),
		UptimeMs:  uptime.Milliseconds(),
		Timestamp: time.Now(),
		Checks:    make(map[string]CheckResult),
	}
	
	// Executar todos os checks
	s.mutex.RLock()
	checks := make(map[string]CheckFunc)
	for k, v := range s.checks {
		checks[k] = v
	}
	s.mutex.RUnlock()
	
	for name, check := range checks {
		result := check(ctx)
		status.Checks[name] = result
		
		// Atualizar status geral
		if result.Status == "unhealthy" {
			status.Status = "unhealthy"
		} else if result.Status == "degraded" && status.Status == "healthy" {
			status.Status = "degraded"
		}
	}
	
	// Adicionar status das invariantes
	if s.invariantsRunner != nil {
		results := s.invariantsRunner.GetLastResults()
		passed := 0
		failed := 0
		for _, r := range results {
			if r.Passed {
				passed++
			} else {
				failed++
			}
		}
		
		status.Invariants = &InvariantsStatus{
			LastRun:   s.invariantsRunner.GetLastRun(),
			Passed:    passed,
			Failed:    failed,
			IsRunning: s.invariantsRunner.IsRunning(),
		}
		
		// Se invariantes falharam, sistema está degraded
		if failed > 0 && status.Status == "healthy" {
			status.Status = "degraded"
		}
	}
	
	return status
}

// GetLiveness retorna status simples para k8s liveness probe
func (s *Service) GetLiveness(ctx context.Context) bool {
	return true // Se o processo está rodando, está vivo
}

// GetReadiness retorna status para k8s readiness probe
func (s *Service) GetReadiness(ctx context.Context) bool {
	// Verificar se banco está acessível
	result := s.checkDatabase(ctx)
	return result.Status != "unhealthy"
}

// ========================================
// CHECKS
// ========================================

func (s *Service) checkDatabase(ctx context.Context) CheckResult {
	start := time.Now()
	
	sqlDB, err := s.db.DB()
	if err != nil {
		return CheckResult{
			Status:   "unhealthy",
			Message:  "Não foi possível obter conexão: " + err.Error(),
			Duration: time.Since(start),
		}
	}
	
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	
	if err := sqlDB.PingContext(ctx); err != nil {
		return CheckResult{
			Status:   "unhealthy",
			Message:  "Ping falhou: " + err.Error(),
			Duration: time.Since(start),
		}
	}
	
	// Verificar stats da conexão
	stats := sqlDB.Stats()
	
	// Se muitas conexões em uso, está degraded
	if stats.InUse > stats.MaxOpenConnections*80/100 {
		return CheckResult{
			Status:   "degraded",
			Message:  "Pool de conexões quase cheio",
			Duration: time.Since(start),
			Details: map[string]int{
				"in_use":     stats.InUse,
				"max_open":   stats.MaxOpenConnections,
				"idle":       stats.Idle,
				"wait_count": int(stats.WaitCount),
			},
		}
	}
	
	return CheckResult{
		Status:   "healthy",
		Duration: time.Since(start),
		Details: map[string]int{
			"in_use":   stats.InUse,
			"max_open": stats.MaxOpenConnections,
			"idle":     stats.Idle,
		},
	}
}
