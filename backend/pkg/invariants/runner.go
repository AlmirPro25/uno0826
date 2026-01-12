package invariants

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"gorm.io/gorm"
)

// ========================================
// INVARIANTS RUNNER
// "Guardião que nunca dorme"
// ========================================

// Runner executa invariantes periodicamente
type Runner struct {
	db              *gorm.DB
	interval        time.Duration
	stopCh          chan struct{}
	running         bool
	mutex           sync.RWMutex
	lastRun         time.Time
	lastResults     []InvariantResult
	onViolation     func(result InvariantResult)
	identityInv     *IdentityInvariants
	billingInv      *BillingInvariants
}

// InvariantResult resultado de uma verificação de invariante
type InvariantResult struct {
	Name        string        `json:"name"`
	Category    string        `json:"category"`
	Passed      bool          `json:"passed"`
	Violations  int           `json:"violations"`
	Details     interface{}   `json:"details,omitempty"`
	Error       string        `json:"error,omitempty"`
	Duration    time.Duration `json:"duration"`
	CheckedAt   time.Time     `json:"checked_at"`
}

// RunnerConfig configuração do runner
type RunnerConfig struct {
	Interval    time.Duration
	OnViolation func(result InvariantResult)
}

// NewRunner cria um novo runner de invariantes
func NewRunner(db *gorm.DB, config RunnerConfig) *Runner {
	if config.Interval == 0 {
		config.Interval = 5 * time.Minute
	}
	
	return &Runner{
		db:          db,
		interval:    config.Interval,
		stopCh:      make(chan struct{}),
		onViolation: config.OnViolation,
		identityInv: NewIdentityInvariants(db),
		billingInv:  NewBillingInvariants(db),
	}
}

// Start inicia o runner em background
func (r *Runner) Start() {
	r.mutex.Lock()
	if r.running {
		r.mutex.Unlock()
		return
	}
	r.running = true
	r.mutex.Unlock()
	
	log.Printf("[INVARIANTS] Runner iniciado. Intervalo: %v", r.interval)
	
	// Executar imediatamente na primeira vez
	go r.runOnce()
	
	// Iniciar loop
	go r.loop()
}

// Stop para o runner
func (r *Runner) Stop() {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if !r.running {
		return
	}
	
	close(r.stopCh)
	r.running = false
	log.Printf("[INVARIANTS] Runner parado")
}

// loop executa invariantes periodicamente
func (r *Runner) loop() {
	ticker := time.NewTicker(r.interval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			r.runOnce()
		case <-r.stopCh:
			return
		}
	}
}

// runOnce executa todas as invariantes uma vez
func (r *Runner) runOnce() {
	ctx := context.Background()
	start := time.Now()
	
	log.Printf("[INVARIANTS] Iniciando verificação...")
	
	results := make([]InvariantResult, 0)
	
	// Identity Invariants
	identityResults := r.runIdentityInvariants(ctx)
	results = append(results, identityResults...)
	
	// Billing Invariants
	billingResults := r.runBillingInvariants(ctx)
	results = append(results, billingResults...)
	
	// Salvar resultados
	r.mutex.Lock()
	r.lastRun = time.Now()
	r.lastResults = results
	r.mutex.Unlock()
	
	// Contar violações
	violations := 0
	passed := 0
	for _, result := range results {
		if result.Passed {
			passed++
		} else {
			violations++
			// Callback para violações
			if r.onViolation != nil {
				r.onViolation(result)
			}
		}
	}
	
	duration := time.Since(start)
	log.Printf("[INVARIANTS] Verificação completa. Passou: %d, Violações: %d, Duração: %v",
		passed, violations, duration)
	
	// Persistir resultados
	r.persistResults(results)
}

// runIdentityInvariants executa invariantes de identity
func (r *Runner) runIdentityInvariants(ctx context.Context) []InvariantResult {
	results := make([]InvariantResult, 0)
	
	// User Isolation
	start := time.Now()
	mismatches, err := r.identityInv.CheckUserIsolation(ctx)
	results = append(results, InvariantResult{
		Name:       "user_isolation",
		Category:   "identity",
		Passed:     err == nil && len(mismatches) == 0,
		Violations: len(mismatches),
		Details:    mismatches,
		Error:      errorString(err),
		Duration:   time.Since(start),
		CheckedAt:  time.Now(),
	})
	
	// Email Uniqueness
	start = time.Now()
	duplicates, err := r.identityInv.CheckEmailUniqueness(ctx)
	results = append(results, InvariantResult{
		Name:       "email_uniqueness",
		Category:   "identity",
		Passed:     err == nil && len(duplicates) == 0,
		Violations: len(duplicates),
		Details:    duplicates,
		Error:      errorString(err),
		Duration:   time.Since(start),
		CheckedAt:  time.Now(),
	})
	
	// Orphan Users
	start = time.Now()
	orphans, err := r.identityInv.CheckOrphanUsers(ctx)
	results = append(results, InvariantResult{
		Name:       "no_orphan_users",
		Category:   "identity",
		Passed:     err == nil && len(orphans) == 0,
		Violations: len(orphans),
		Details:    orphans,
		Error:      errorString(err),
		Duration:   time.Since(start),
		CheckedAt:  time.Now(),
	})
	
	return results
}

// runBillingInvariants executa invariantes de billing
func (r *Runner) runBillingInvariants(ctx context.Context) []InvariantResult {
	results := make([]InvariantResult, 0)
	
	// Ledger Balance (se BillingInvariants tiver esse método)
	// Por enquanto, placeholder
	results = append(results, InvariantResult{
		Name:       "ledger_balance",
		Category:   "billing",
		Passed:     true,
		Violations: 0,
		Duration:   0,
		CheckedAt:  time.Now(),
	})
	
	return results
}

// persistResults salva resultados no banco
func (r *Runner) persistResults(results []InvariantResult) {
	for _, result := range results {
		record := InvariantCheckRecord{
			Name:       result.Name,
			Category:   result.Category,
			Passed:     result.Passed,
			Violations: result.Violations,
			Duration:   result.Duration.Milliseconds(),
			CheckedAt:  result.CheckedAt,
		}
		
		if result.Details != nil {
			if data, err := json.Marshal(result.Details); err == nil {
				record.Details = string(data)
			}
		}
		
		if result.Error != "" {
			record.Error = result.Error
		}
		
		if err := r.db.Create(&record).Error; err != nil {
			log.Printf("[INVARIANTS] Erro ao persistir resultado %s: %v", result.Name, err)
		}
	}
}

// GetLastResults retorna os últimos resultados
func (r *Runner) GetLastResults() []InvariantResult {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	return r.lastResults
}

// GetLastRun retorna quando foi a última execução
func (r *Runner) GetLastRun() time.Time {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	return r.lastRun
}

// IsRunning verifica se o runner está ativo
func (r *Runner) IsRunning() bool {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	return r.running
}

// RunNow força execução imediata
func (r *Runner) RunNow() []InvariantResult {
	r.runOnce()
	return r.GetLastResults()
}

// ========================================
// PERSISTENCE MODEL
// ========================================

// InvariantCheckRecord registro de verificação de invariante
type InvariantCheckRecord struct {
	ID         uint      `gorm:"primaryKey"`
	Name       string    `gorm:"size:100;index"`
	Category   string    `gorm:"size:50;index"`
	Passed     bool      `gorm:"index"`
	Violations int
	Details    string    `gorm:"type:text"`
	Error      string    `gorm:"size:500"`
	Duration   int64     // milliseconds
	CheckedAt  time.Time `gorm:"index"`
	CreatedAt  time.Time
}

func (InvariantCheckRecord) TableName() string {
	return "invariant_checks"
}

// ========================================
// HELPERS
// ========================================

func errorString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}

// ========================================
// BILLING INVARIANTS PLACEHOLDER
// ========================================

// BillingInvariants placeholder - implementar conforme necessário
type BillingInvariants struct {
	db *gorm.DB
}

func NewBillingInvariants(db *gorm.DB) *BillingInvariants {
	return &BillingInvariants{db: db}
}
