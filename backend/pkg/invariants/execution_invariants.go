package invariants

/*
================================================================================
INVARIANTS DE EXECUÇÃO — Proteção do Cérebro do Sistema
================================================================================

Este arquivo protege a camada de EXECUÇÃO do Kernel:
- Rules Engine (motor de regras)
- Killswitch (freio de emergência)
- Jobs (processamento em background)

Filosofia:
"O sistema pode ser configurado errado, mas NUNCA pode se destruir."

Cenários protegidos:
1. Loop infinito de regras (A dispara B que dispara A)
2. Killswitch ignorado por cache/processo em background
3. Job duplicado ou travado eternamente
4. Ação executada mais rápido que o humanamente possível (ataque)

================================================================================
*/

import (
	"fmt"
	"runtime"
	"sync"
	"time"
)

// ========================================
// CONSTANTES DE PROTEÇÃO
// ========================================

const (
	// MaxRuleRecursionDepth é a profundidade máxima de regras encadeadas
	// Se uma regra dispara outra que dispara outra... até este limite
	MaxRuleRecursionDepth = 10

	// MaxRuleExecutionsPerMinute é o limite de execuções de uma mesma regra por minuto
	MaxRuleExecutionsPerMinute = 100

	// MaxActionsPerSecond é o limite de ações por segundo por app (anomalia)
	MaxActionsPerSecond = 50

	// JobMaxExecutionTime é o tempo máximo que um job pode rodar
	JobMaxExecutionTime = 30 * time.Minute
)

// ========================================
// TRACKING DE EXECUÇÃO
// ========================================

// ExecutionContext rastreia o contexto de execução atual
type ExecutionContext struct {
	AppID          string
	RuleChain      []string          // IDs das regras na cadeia atual
	ActionCounts   map[string]int    // Contagem de ações por tipo
	StartTime      time.Time
	LastActionTime time.Time
}

// Contextos ativos por goroutine/request
var (
	activeContexts     = make(map[string]*ExecutionContext)
	activeContextsLock sync.RWMutex

	// Rate limiting por app
	actionRates     = make(map[string]*RateTracker)
	actionRatesLock sync.RWMutex

	// Jobs em execução
	runningJobs     = make(map[string]*JobExecution)
	runningJobsLock sync.RWMutex

	// Killswitch cache (para verificação rápida)
	killswitchCache     = make(map[string]bool)
	killswitchCacheLock sync.RWMutex
)

// RateTracker rastreia taxa de ações
type RateTracker struct {
	Actions    []time.Time
	LastReset  time.Time
	sync.Mutex
}

// JobExecution rastreia execução de job
type JobExecution struct {
	JobID     string
	WorkerID  string
	StartTime time.Time
	JobType   string
}

// ========================================
// 1. PROTEÇÃO CONTRA RECURSÃO DE REGRAS
// ========================================

// StartRuleExecution inicia tracking de execução de regra
// Retorna um cleanup function que DEVE ser chamado com defer
// NOTA: Usa goroutine ID para evitar falsos positivos em execuções paralelas
func StartRuleExecution(appID, ruleID string) (cleanup func(), err error) {
	// Usar goroutine ID para contexto único por execução
	// Isso evita falsos positivos quando múltiplas goroutines avaliam regras do mesmo app
	contextKey := fmt.Sprintf("%s:%d", appID, getGoroutineID())
	
	activeContextsLock.Lock()
	defer activeContextsLock.Unlock()

	ctx, exists := activeContexts[contextKey]
	if !exists {
		ctx = &ExecutionContext{
			AppID:        appID,
			RuleChain:    []string{},
			ActionCounts: make(map[string]int),
			StartTime:    time.Now(),
		}
		activeContexts[contextKey] = ctx
	}

	// Verificar recursão
	for _, existingRuleID := range ctx.RuleChain {
		if existingRuleID == ruleID {
			// RECURSÃO DETECTADA!
			AssertCritical(false, "rule_recursion_detected",
				"Rule is calling itself directly or indirectly",
				map[string]interface{}{
					"app_id":      appID,
					"rule_id":     ruleID,
					"rule_chain":  ctx.RuleChain,
					"chain_depth": len(ctx.RuleChain),
				})
			return nil, fmt.Errorf("RECURSION: rule %s already in execution chain", ruleID)
		}
	}

	// Verificar profundidade
	if len(ctx.RuleChain) >= MaxRuleRecursionDepth {
		AssertCritical(false, "rule_chain_too_deep",
			"Rule execution chain exceeded maximum depth",
			map[string]interface{}{
				"app_id":      appID,
				"rule_id":     ruleID,
				"rule_chain":  ctx.RuleChain,
				"max_depth":   MaxRuleRecursionDepth,
				"chain_depth": len(ctx.RuleChain),
			})
		return nil, fmt.Errorf("DEPTH: rule chain exceeded %d levels", MaxRuleRecursionDepth)
	}

	// Adicionar à cadeia
	ctx.RuleChain = append(ctx.RuleChain, ruleID)

	// Retornar cleanup
	cleanup = func() {
		activeContextsLock.Lock()
		defer activeContextsLock.Unlock()

		if ctx, exists := activeContexts[contextKey]; exists {
			// Remover última regra da cadeia
			if len(ctx.RuleChain) > 0 {
				ctx.RuleChain = ctx.RuleChain[:len(ctx.RuleChain)-1]
			}
			// Se cadeia vazia, remover contexto
			if len(ctx.RuleChain) == 0 {
				delete(activeContexts, contextKey)
			}
		}
	}

	return cleanup, nil
}

// getGoroutineID retorna um ID único para a goroutine atual
// Usado para isolar contextos de execução paralela
func getGoroutineID() uint64 {
	b := make([]byte, 64)
	b = b[:runtime.Stack(b, false)]
	// Parse "goroutine 123 [running]:"
	for i := len("goroutine "); i < len(b); i++ {
		if b[i] < '0' || b[i] > '9' {
			var id uint64
			for j := len("goroutine "); j < i; j++ {
				id = id*10 + uint64(b[j]-'0')
			}
			return id
		}
	}
	return 0
}

// AssertNoRuleRecursion verifica se não há recursão na cadeia atual
func AssertNoRuleRecursion(appID, ruleID string, currentChain []string) {
	// Verificar se a regra já está na cadeia
	for i, existingRuleID := range currentChain {
		if existingRuleID == ruleID {
			AssertCritical(false, "rule_recursion_detected",
				fmt.Sprintf("Rule %s found at position %d in chain of %d", ruleID, i, len(currentChain)),
				map[string]interface{}{
					"app_id":         appID,
					"rule_id":        ruleID,
					"trigger_chain":  currentChain,
					"recursion_at":   i,
					"chain_length":   len(currentChain),
				})
			return
		}
	}

	// Verificar profundidade máxima
	Assert(len(currentChain) < MaxRuleRecursionDepth, "rule_chain_depth_exceeded",
		fmt.Sprintf("Rule chain depth %d exceeds maximum %d", len(currentChain), MaxRuleRecursionDepth),
		map[string]interface{}{
			"app_id":        appID,
			"rule_id":       ruleID,
			"trigger_chain": currentChain,
			"depth":         len(currentChain),
			"max_depth":     MaxRuleRecursionDepth,
		})
}

// AssertRuleExecutionLimit verifica se regra não está executando demais
func AssertRuleExecutionLimit(appID, ruleID string, executionsLastMinute int) {
	Assert(executionsLastMinute <= MaxRuleExecutionsPerMinute, "rule_execution_rate_exceeded",
		fmt.Sprintf("Rule %s executed %d times in last minute (max: %d)", ruleID, executionsLastMinute, MaxRuleExecutionsPerMinute),
		map[string]interface{}{
			"app_id":              appID,
			"rule_id":             ruleID,
			"executions":          executionsLastMinute,
			"max_per_minute":      MaxRuleExecutionsPerMinute,
		})
}

// ========================================
// 2. PROTEÇÃO DO KILLSWITCH
// ========================================

// UpdateKillswitchCache atualiza o cache local do killswitch
// Deve ser chamado sempre que o killswitch mudar
func UpdateKillswitchCache(appID string, isActive bool) {
	killswitchCacheLock.Lock()
	defer killswitchCacheLock.Unlock()
	killswitchCache[appID] = isActive
}

// UpdateGlobalKillswitch atualiza o killswitch global
func UpdateGlobalKillswitch(isActive bool) {
	killswitchCacheLock.Lock()
	defer killswitchCacheLock.Unlock()
	killswitchCache["__GLOBAL__"] = isActive
}

// AssertKillswitchEnforcement verifica se o killswitch está sendo respeitado
// Esta é uma invariant FATAL — se falhar, o sistema DEVE parar
func AssertKillswitchEnforcement(appID string, operationType string) {
	killswitchCacheLock.RLock()
	globalActive := killswitchCache["__GLOBAL__"]
	appActive := killswitchCache[appID]
	killswitchCacheLock.RUnlock()

	if globalActive {
		AssertFatal(false, "killswitch_global_bypass_attempt",
			"Operation attempted while GLOBAL killswitch is active",
			map[string]interface{}{
				"app_id":         appID,
				"operation_type": operationType,
				"killswitch":     "GLOBAL",
				"action":         "BLOCKED",
			})
	}

	if appActive {
		AssertFatal(false, "killswitch_app_bypass_attempt",
			"Operation attempted while APP killswitch is active",
			map[string]interface{}{
				"app_id":         appID,
				"operation_type": operationType,
				"killswitch":     "APP",
				"action":         "BLOCKED",
			})
	}
}

// CheckKillswitchSafe verifica killswitch sem panic (para uso em middleware)
// Retorna true se a operação deve ser bloqueada
func CheckKillswitchSafe(appID string) bool {
	killswitchCacheLock.RLock()
	defer killswitchCacheLock.RUnlock()

	if killswitchCache["__GLOBAL__"] {
		return true
	}
	return killswitchCache[appID]
}

// ========================================
// 3. PROTEÇÃO DE RATE LIMIT (ANOMALIA)
// ========================================

// AssertActionWithinRateLimit verifica se ações não estão acontecendo rápido demais
func AssertActionWithinRateLimit(appID, actionType string) {
	actionRatesLock.Lock()
	defer actionRatesLock.Unlock()

	key := appID + ":" + actionType
	tracker, exists := actionRates[key]
	if !exists {
		tracker = &RateTracker{
			Actions:   make([]time.Time, 0),
			LastReset: time.Now(),
		}
		actionRates[key] = tracker
	}

	tracker.Lock()
	defer tracker.Unlock()

	now := time.Now()
	oneSecondAgo := now.Add(-1 * time.Second)

	// Limpar ações antigas
	newActions := make([]time.Time, 0)
	for _, t := range tracker.Actions {
		if t.After(oneSecondAgo) {
			newActions = append(newActions, t)
		}
	}
	tracker.Actions = newActions

	// Verificar rate
	rate := len(tracker.Actions)
	if rate >= MaxActionsPerSecond {
		Assert(false, "action_rate_anomaly",
			fmt.Sprintf("Action rate %d/sec exceeds maximum %d/sec", rate, MaxActionsPerSecond),
			map[string]interface{}{
				"app_id":      appID,
				"action_type": actionType,
				"rate":        rate,
				"max_rate":    MaxActionsPerSecond,
				"window":      "1 second",
			})
	}

	// Registrar ação
	tracker.Actions = append(tracker.Actions, now)
}

// ========================================
// 4. PROTEÇÃO DE JOBS
// ========================================

// StartJobExecution registra início de execução de job
// Retorna erro se job já está em execução (duplicidade)
func StartJobExecution(jobID, workerID, jobType string) error {
	runningJobsLock.Lock()
	defer runningJobsLock.Unlock()

	if existing, exists := runningJobs[jobID]; exists {
		// Job já está rodando!
		AssertCritical(false, "job_duplicate_execution",
			"Job is already being executed by another worker",
			map[string]interface{}{
				"job_id":          jobID,
				"job_type":        jobType,
				"current_worker":  existing.WorkerID,
				"new_worker":      workerID,
				"running_since":   existing.StartTime,
				"running_for":     time.Since(existing.StartTime).String(),
			})
		return fmt.Errorf("DUPLICATE: job %s already running on worker %s", jobID, existing.WorkerID)
	}

	runningJobs[jobID] = &JobExecution{
		JobID:     jobID,
		WorkerID:  workerID,
		StartTime: time.Now(),
		JobType:   jobType,
	}

	return nil
}

// EndJobExecution registra fim de execução de job
func EndJobExecution(jobID string) {
	runningJobsLock.Lock()
	defer runningJobsLock.Unlock()
	delete(runningJobs, jobID)
}

// AssertJobUniqueness verifica que job não está duplicado
func AssertJobUniqueness(jobID, workerID string) {
	runningJobsLock.RLock()
	defer runningJobsLock.RUnlock()

	if existing, exists := runningJobs[jobID]; exists && existing.WorkerID != workerID {
		AssertCritical(false, "job_uniqueness_violation",
			"Job is being processed by multiple workers",
			map[string]interface{}{
				"job_id":         jobID,
				"worker_1":       existing.WorkerID,
				"worker_2":       workerID,
				"started_at":     existing.StartTime,
			})
	}
}

// AssertJobTimeout verifica se job não está rodando há muito tempo
func AssertJobTimeout(jobID string) {
	runningJobsLock.RLock()
	defer runningJobsLock.RUnlock()

	if job, exists := runningJobs[jobID]; exists {
		runningTime := time.Since(job.StartTime)
		if runningTime > JobMaxExecutionTime {
			AssertCritical(false, "job_timeout_exceeded",
				fmt.Sprintf("Job running for %s exceeds maximum %s", runningTime, JobMaxExecutionTime),
				map[string]interface{}{
					"job_id":       jobID,
					"job_type":     job.JobType,
					"worker_id":    job.WorkerID,
					"running_time": runningTime.String(),
					"max_time":     JobMaxExecutionTime.String(),
					"started_at":   job.StartTime,
				})
		}
	}
}

// CheckStaleJobs verifica jobs que podem estar travados
// Deve ser chamado periodicamente
func CheckStaleJobs() []string {
	runningJobsLock.RLock()
	defer runningJobsLock.RUnlock()

	staleJobs := make([]string, 0)
	for jobID, job := range runningJobs {
		if time.Since(job.StartTime) > JobMaxExecutionTime {
			staleJobs = append(staleJobs, jobID)
			AssertCritical(false, "job_stale_detected",
				"Job appears to be stale/stuck",
				map[string]interface{}{
					"job_id":       jobID,
					"job_type":     job.JobType,
					"worker_id":    job.WorkerID,
					"running_time": time.Since(job.StartTime).String(),
				})
		}
	}
	return staleJobs
}

// ========================================
// CLEANUP
// ========================================

// CleanupExecutionTracking limpa dados de tracking antigos
// Deve ser chamado periodicamente
func CleanupExecutionTracking() {
	// Limpar rate trackers antigos
	actionRatesLock.Lock()
	for key, tracker := range actionRates {
		tracker.Lock()
		if time.Since(tracker.LastReset) > 5*time.Minute && len(tracker.Actions) == 0 {
			delete(actionRates, key)
		}
		tracker.Unlock()
	}
	actionRatesLock.Unlock()

	// Verificar jobs travados
	CheckStaleJobs()
}
