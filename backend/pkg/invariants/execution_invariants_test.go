package invariants

import (
	"sync"
	"testing"
	"time"
)

// ========================================
// TESTES DE INVARIANTS DE EXECUÇÃO
// ========================================

func TestAssertNoRuleRecursion_DirectRecursion(t *testing.T) {
	// Limpar estado
	ClearViolations()
	Enable()

	appID := "test-app-recursion"
	ruleID := "rule-A"

	// Simular cadeia onde a regra aparece duas vezes (recursão direta)
	chain := []string{"rule-A", "rule-B", "rule-C", "rule-A"} // rule-A aparece no início e fim

	// Verificar recursão
	AssertNoRuleRecursion(appID, ruleID, chain)

	// Deve ter registrado violação
	violations := GetViolations()
	if len(violations) == 0 {
		t.Error("Expected recursion violation to be recorded")
	}

	found := false
	for _, v := range violations {
		if v.Invariant == "rule_recursion_detected" {
			found = true
			if v.Severity != SeverityCritical {
				t.Errorf("Expected CRITICAL severity, got %s", v.Severity)
			}
			break
		}
	}

	if !found {
		t.Error("Expected 'rule_recursion_detected' violation")
	}
}

func TestAssertNoRuleRecursion_ChainTooDeep(t *testing.T) {
	ClearViolations()
	Enable()

	appID := "test-app-depth"
	ruleID := "rule-new"

	// Criar cadeia com profundidade máxima
	chain := make([]string, MaxRuleRecursionDepth+1)
	for i := range chain {
		chain[i] = "rule-" + string(rune('A'+i))
	}

	AssertNoRuleRecursion(appID, ruleID, chain)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "rule_chain_depth_exceeded" {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected 'rule_chain_depth_exceeded' violation")
	}
}

func TestStartRuleExecution_PreventsRecursion(t *testing.T) {
	// Limpar estado
	activeContextsLock.Lock()
	activeContexts = make(map[string]*ExecutionContext)
	activeContextsLock.Unlock()
	ClearViolations()
	Enable()

	appID := "test-app-exec"
	ruleID := "rule-recursive"

	// Primeira execução - deve funcionar
	cleanup1, err1 := StartRuleExecution(appID, ruleID)
	if err1 != nil {
		t.Fatalf("First execution should succeed: %v", err1)
	}

	// Segunda execução da mesma regra - deve falhar (recursão)
	_, err2 := StartRuleExecution(appID, ruleID)
	if err2 == nil {
		t.Error("Second execution of same rule should fail with recursion error")
	}

	// Cleanup
	if cleanup1 != nil {
		cleanup1()
	}

	// Após cleanup, deve funcionar novamente
	cleanup3, err3 := StartRuleExecution(appID, ruleID)
	if err3 != nil {
		t.Errorf("After cleanup, execution should succeed: %v", err3)
	}
	if cleanup3 != nil {
		cleanup3()
	}
}

func TestStartRuleExecution_ChainDepthLimit(t *testing.T) {
	activeContextsLock.Lock()
	activeContexts = make(map[string]*ExecutionContext)
	activeContextsLock.Unlock()
	ClearViolations()
	Enable()

	appID := "test-app-chain"
	cleanups := make([]func(), 0)

	// Criar cadeia até o limite
	for i := 0; i < MaxRuleRecursionDepth; i++ {
		ruleID := "rule-" + string(rune('A'+i))
		cleanup, err := StartRuleExecution(appID, ruleID)
		if err != nil {
			t.Fatalf("Rule %d should succeed: %v", i, err)
		}
		cleanups = append(cleanups, cleanup)
	}

	// Próxima regra deve falhar (profundidade excedida)
	_, err := StartRuleExecution(appID, "rule-overflow")
	if err == nil {
		t.Error("Should fail when chain depth exceeds maximum")
	}

	// Cleanup
	for i := len(cleanups) - 1; i >= 0; i-- {
		if cleanups[i] != nil {
			cleanups[i]()
		}
	}
}

func TestAssertKillswitchEnforcement_GlobalKillswitch(t *testing.T) {
	ClearViolations()
	Enable()

	// Limpar cache
	killswitchCacheLock.Lock()
	killswitchCache = make(map[string]bool)
	killswitchCacheLock.Unlock()

	appID := "test-app-ks"

	// Sem killswitch - não deve violar
	// (não podemos testar AssertFatal diretamente pois causa panic)

	// Testar CheckKillswitchSafe
	if CheckKillswitchSafe(appID) {
		t.Error("Should not be blocked without killswitch")
	}

	// Ativar killswitch global
	UpdateGlobalKillswitch(true)

	if !CheckKillswitchSafe(appID) {
		t.Error("Should be blocked with global killswitch")
	}

	// Desativar global, ativar app
	UpdateGlobalKillswitch(false)
	UpdateKillswitchCache(appID, true)

	if !CheckKillswitchSafe(appID) {
		t.Error("Should be blocked with app killswitch")
	}

	// Outro app não deve ser afetado
	if CheckKillswitchSafe("other-app") {
		t.Error("Other app should not be blocked")
	}
}

func TestAssertActionWithinRateLimit(t *testing.T) {
	// Limpar estado
	actionRatesLock.Lock()
	actionRates = make(map[string]*RateTracker)
	actionRatesLock.Unlock()
	ClearViolations()
	Enable()

	appID := "test-app-rate"
	actionType := "test_action"

	// Executar ações dentro do limite
	for i := 0; i < MaxActionsPerSecond-1; i++ {
		AssertActionWithinRateLimit(appID, actionType)
	}

	// Não deve ter violações ainda
	violations := GetViolations()
	rateViolations := 0
	for _, v := range violations {
		if v.Invariant == "action_rate_anomaly" {
			rateViolations++
		}
	}
	if rateViolations > 0 {
		t.Errorf("Should not have rate violations within limit, got %d", rateViolations)
	}

	// Executar mais ações para exceder limite
	for i := 0; i < 10; i++ {
		AssertActionWithinRateLimit(appID, actionType)
	}

	// Agora deve ter violação
	violations = GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "action_rate_anomaly" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected rate anomaly violation after exceeding limit")
	}
}

func TestJobExecution_Uniqueness(t *testing.T) {
	// Limpar estado
	runningJobsLock.Lock()
	runningJobs = make(map[string]*JobExecution)
	runningJobsLock.Unlock()
	ClearViolations()
	Enable()

	jobID := "job-123"
	worker1 := "worker-A"
	worker2 := "worker-B"
	jobType := "test_job"

	// Primeiro worker inicia job
	err1 := StartJobExecution(jobID, worker1, jobType)
	if err1 != nil {
		t.Fatalf("First worker should succeed: %v", err1)
	}

	// Segundo worker tenta iniciar mesmo job - deve falhar
	err2 := StartJobExecution(jobID, worker2, jobType)
	if err2 == nil {
		t.Error("Second worker should fail with duplicate error")
	}

	// Verificar violação registrada
	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "job_duplicate_execution" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected job_duplicate_execution violation")
	}

	// Finalizar job
	EndJobExecution(jobID)

	// Agora segundo worker pode pegar
	err3 := StartJobExecution(jobID, worker2, jobType)
	if err3 != nil {
		t.Errorf("After end, second worker should succeed: %v", err3)
	}

	EndJobExecution(jobID)
}

func TestJobExecution_Timeout(t *testing.T) {
	runningJobsLock.Lock()
	runningJobs = make(map[string]*JobExecution)
	runningJobsLock.Unlock()
	ClearViolations()
	Enable()

	jobID := "job-slow"
	workerID := "worker-1"
	jobType := "slow_job"

	// Simular job que começou há muito tempo
	runningJobsLock.Lock()
	runningJobs[jobID] = &JobExecution{
		JobID:     jobID,
		WorkerID:  workerID,
		StartTime: time.Now().Add(-JobMaxExecutionTime - time.Minute), // Começou há mais que o máximo
		JobType:   jobType,
	}
	runningJobsLock.Unlock()

	// Verificar timeout
	AssertJobTimeout(jobID)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "job_timeout_exceeded" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected job_timeout_exceeded violation")
	}
}

func TestCheckStaleJobs(t *testing.T) {
	runningJobsLock.Lock()
	runningJobs = make(map[string]*JobExecution)
	runningJobsLock.Unlock()
	ClearViolations()
	Enable()

	// Adicionar job normal
	runningJobs["job-normal"] = &JobExecution{
		JobID:     "job-normal",
		WorkerID:  "worker-1",
		StartTime: time.Now(),
		JobType:   "normal",
	}

	// Adicionar job travado
	runningJobs["job-stale"] = &JobExecution{
		JobID:     "job-stale",
		WorkerID:  "worker-2",
		StartTime: time.Now().Add(-JobMaxExecutionTime - time.Hour),
		JobType:   "stale",
	}

	staleJobs := CheckStaleJobs()

	if len(staleJobs) != 1 {
		t.Errorf("Expected 1 stale job, got %d", len(staleJobs))
	}

	if len(staleJobs) > 0 && staleJobs[0] != "job-stale" {
		t.Errorf("Expected job-stale, got %s", staleJobs[0])
	}
}

func TestConcurrentRuleExecution(t *testing.T) {
	activeContextsLock.Lock()
	activeContexts = make(map[string]*ExecutionContext)
	activeContextsLock.Unlock()
	ClearViolations()
	Enable()

	appID := "test-concurrent"
	var wg sync.WaitGroup
	errors := make(chan error, 100)

	// Simular 10 goroutines tentando executar regras diferentes
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			ruleID := "rule-" + string(rune('A'+idx))
			cleanup, err := StartRuleExecution(appID, ruleID)
			if err != nil {
				errors <- err
				return
			}
			// Simular trabalho
			time.Sleep(10 * time.Millisecond)
			if cleanup != nil {
				cleanup()
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	// Não deve ter erros (regras diferentes)
	errorCount := 0
	for err := range errors {
		t.Logf("Unexpected error: %v", err)
		errorCount++
	}

	if errorCount > 0 {
		t.Errorf("Expected no errors for different rules, got %d", errorCount)
	}
}

func TestRuleExecutionLimit(t *testing.T) {
	ClearViolations()
	Enable()

	appID := "test-limit"
	ruleID := "rule-spam"

	// Simular muitas execuções
	AssertRuleExecutionLimit(appID, ruleID, MaxRuleExecutionsPerMinute+50)

	violations := GetViolations()
	found := false
	for _, v := range violations {
		if v.Invariant == "rule_execution_rate_exceeded" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected rule_execution_rate_exceeded violation")
	}
}

// ========================================
// BENCHMARK
// ========================================

func BenchmarkCheckKillswitchSafe(b *testing.B) {
	killswitchCacheLock.Lock()
	killswitchCache = make(map[string]bool)
	killswitchCache["app-1"] = true
	killswitchCacheLock.Unlock()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		CheckKillswitchSafe("app-1")
	}
}

func BenchmarkStartRuleExecution(b *testing.B) {
	activeContextsLock.Lock()
	activeContexts = make(map[string]*ExecutionContext)
	activeContextsLock.Unlock()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		cleanup, _ := StartRuleExecution("bench-app", "rule-"+string(rune('A'+(i%26))))
		if cleanup != nil {
			cleanup()
		}
	}
}
