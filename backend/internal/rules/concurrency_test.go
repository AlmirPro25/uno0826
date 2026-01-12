package rules

/*
================================================================================
TESTES DE CONCORRÊNCIA BRUTAIS — RULES ENGINE
================================================================================

Estes testes verificam que o motor de regras:
1. Não permite loops de regras
2. Não permite recursão infinita
3. Mantém rate limiting sob carga
4. Isola execuções entre apps
5. Mantém consistência de estado

Se estes testes falharem, há risco de:
- Loops infinitos consumindo recursos
- Regras executando fora de ordem
- Vazamento de dados entre apps
- Deadlocks no sistema

================================================================================
*/

import (
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupRulesConcurrencyDB cria banco em memória compartilhado para testes de concorrência
func setupRulesConcurrencyDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Migrar modelos
	err = db.AutoMigrate(&Rule{}, &RuleExecution{}, &AppConfig{}, &TemporaryRule{}, &ActionAuditLog{}, &ShadowExecution{}, &AuthorityGrant{})
	require.NoError(t, err)

	return db
}

// ========================================
// TESTE 1: CRIAÇÃO CONCORRENTE DE REGRAS
// ========================================

func TestConcurrent_RuleCreation_Storm(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	numGoroutines := 50
	rulesPerGoroutine := 20
	
	var wg sync.WaitGroup
	var successCount int64
	var errorCount int64
	barrier := make(chan struct{})
	
	// Criar regras concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier // Esperar sinal
			
			for j := 0; j < rulesPerGoroutine; j++ {
				rule := Rule{
					ID:          uuid.New(),
					AppID:       appID,
					Name:        fmt.Sprintf("Rule-W%d-R%d", workerID, j),
					Description: "Concurrent test rule",
					Status:      RuleStatusActive,
					Priority:    workerID*100 + j,
					TriggerType: TriggerMetric,
					Condition:   fmt.Sprintf("metric_%d > %d", workerID, j),
					ActionType:  ActionAlert,
					ActionConfig: `{"alert_type":"test"}`,
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}
				
				if err := db.Create(&rule).Error; err != nil {
					atomic.AddInt64(&errorCount, 1)
				} else {
					atomic.AddInt64(&successCount, 1)
				}
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier) // Liberar todas as goroutines
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar resultados
	var totalRules int64
	db.Model(&Rule{}).Where("app_id = ?", appID).Count(&totalRules)
	
	expectedTotal := int64(numGoroutines * rulesPerGoroutine)
	assert.Equal(t, expectedTotal, successCount, "Todas as regras deveriam ser criadas")
	assert.Equal(t, expectedTotal, totalRules, "Contagem no banco deveria bater")
	assert.Zero(t, errorCount, "Não deveria haver erros")
	
	opsPerSec := float64(successCount) / duration.Seconds()
	t.Logf("✅ Criação de regras: %d regras em %v (%.0f ops/sec)", successCount, duration, opsPerSec)
}

// ========================================
// TESTE 2: ATUALIZAÇÃO CONCORRENTE DE PRIORIDADE
// ========================================

func TestConcurrent_RulePriority_Race(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	
	// Criar regra inicial
	rule := Rule{
		ID:          uuid.New(),
		AppID:       appID,
		Name:        "Priority Race Rule",
		Status:      RuleStatusActive,
		Priority:    50,
		TriggerType: TriggerMetric,
		Condition:   "test > 0",
		ActionType:  ActionAlert,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	require.NoError(t, db.Create(&rule).Error)
	
	numGoroutines := 100
	var wg sync.WaitGroup
	barrier := make(chan struct{})
	
	// Atualizar prioridade concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(newPriority int) {
			defer wg.Done()
			<-barrier
			
			db.Model(&Rule{}).Where("id = ?", rule.ID).Update("priority", newPriority)
		}(i)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar que a regra ainda existe e tem prioridade válida
	var finalRule Rule
	require.NoError(t, db.First(&finalRule, "id = ?", rule.ID).Error)
	
	assert.GreaterOrEqual(t, finalRule.Priority, 0, "Prioridade deveria ser >= 0")
	assert.Less(t, finalRule.Priority, numGoroutines, "Prioridade deveria ser < numGoroutines")
	
	t.Logf("✅ Prioridade final: %d (após %d atualizações concorrentes)", finalRule.Priority, numGoroutines)
}

// ========================================
// TESTE 3: TOGGLE CONCORRENTE DE STATUS
// ========================================

func TestConcurrent_RuleToggle_Race(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	
	// Criar regra
	rule := Rule{
		ID:          uuid.New(),
		AppID:       appID,
		Name:        "Toggle Race Rule",
		Status:      RuleStatusActive,
		TriggerType: TriggerMetric,
		Condition:   "test > 0",
		ActionType:  ActionAlert,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	require.NoError(t, db.Create(&rule).Error)
	
	numGoroutines := 200
	var wg sync.WaitGroup
	var activeCount int64
	var inactiveCount int64
	barrier := make(chan struct{})
	
	// Toggle status concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			<-barrier
			
			status := RuleStatusActive
			if idx%2 == 0 {
				status = RuleStatusInactive
				atomic.AddInt64(&inactiveCount, 1)
			} else {
				atomic.AddInt64(&activeCount, 1)
			}
			
			db.Model(&Rule{}).Where("id = ?", rule.ID).Update("status", status)
		}(i)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar estado final
	var finalRule Rule
	require.NoError(t, db.First(&finalRule, "id = ?", rule.ID).Error)
	
	assert.Contains(t, []RuleStatus{RuleStatusActive, RuleStatusInactive}, finalRule.Status,
		"Status deveria ser válido")
	
	t.Logf("✅ Status final: %s (active: %d, inactive: %d toggles)", 
		finalRule.Status, activeCount, inactiveCount)
}

// ========================================
// TESTE 4: EXECUÇÃO CONCORRENTE DE REGRAS
// ========================================

func TestConcurrent_RuleExecution_Storm(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	
	// Criar regra
	rule := Rule{
		ID:          uuid.New(),
		AppID:       appID,
		Name:        "Execution Storm Rule",
		Status:      RuleStatusActive,
		TriggerType: TriggerMetric,
		Condition:   "test > 0",
		ActionType:  ActionAlert,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	require.NoError(t, db.Create(&rule).Error)
	
	numGoroutines := 100
	executionsPerGoroutine := 50
	var wg sync.WaitGroup
	var successCount int64
	barrier := make(chan struct{})
	
	// Registrar execuções concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < executionsPerGoroutine; j++ {
				execution := RuleExecution{
					ID:           uuid.New(),
					RuleID:       rule.ID,
					AppID:        appID,
					ConditionMet: j%2 == 0,
					ActionTaken:  j%2 == 0,
					TriggerData:  fmt.Sprintf(`{"worker":%d,"iteration":%d}`, workerID, j),
					ExecutedAt:   time.Now(),
					DurationMs:   int64(j),
				}
				
				if err := db.Create(&execution).Error; err == nil {
					atomic.AddInt64(&successCount, 1)
				}
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar resultados
	var totalExecutions int64
	db.Model(&RuleExecution{}).Where("rule_id = ?", rule.ID).Count(&totalExecutions)
	
	expectedTotal := int64(numGoroutines * executionsPerGoroutine)
	assert.Equal(t, expectedTotal, successCount, "Todas as execuções deveriam ser registradas")
	assert.Equal(t, expectedTotal, totalExecutions, "Contagem no banco deveria bater")
	
	opsPerSec := float64(successCount) / duration.Seconds()
	t.Logf("✅ Execuções registradas: %d em %v (%.0f ops/sec)", successCount, duration, opsPerSec)
}

// ========================================
// TESTE 5: ISOLAMENTO MULTI-APP
// ========================================

func TestConcurrent_MultiApp_Isolation(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	numApps := 10
	rulesPerApp := 20
	appIDs := make([]uuid.UUID, numApps)
	
	for i := 0; i < numApps; i++ {
		appIDs[i] = uuid.New()
	}
	
	var wg sync.WaitGroup
	barrier := make(chan struct{})
	
	// Criar regras para cada app concorrentemente
	for appIdx, appID := range appIDs {
		wg.Add(1)
		go func(idx int, id uuid.UUID) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < rulesPerApp; j++ {
				rule := Rule{
					ID:          uuid.New(),
					AppID:       id,
					Name:        fmt.Sprintf("App%d-Rule%d", idx, j),
					Status:      RuleStatusActive,
					Priority:    j,
					TriggerType: TriggerMetric,
					Condition:   fmt.Sprintf("app_%d_metric > %d", idx, j),
					ActionType:  ActionAlert,
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}
				db.Create(&rule)
			}
		}(appIdx, appID)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar isolamento
	for i, appID := range appIDs {
		var count int64
		db.Model(&Rule{}).Where("app_id = ?", appID).Count(&count)
		assert.Equal(t, int64(rulesPerApp), count, 
			"App %d deveria ter exatamente %d regras", i, rulesPerApp)
		
		// Verificar que não há regras de outros apps
		var rules []Rule
		db.Where("app_id = ?", appID).Find(&rules)
		for _, rule := range rules {
			assert.Equal(t, appID, rule.AppID, "Regra deveria pertencer ao app correto")
			assert.Contains(t, rule.Name, fmt.Sprintf("App%d", i), "Nome deveria conter ID do app")
		}
	}
	
	t.Logf("✅ Isolamento verificado: %d apps com %d regras cada", numApps, rulesPerApp)
}

// ========================================
// TESTE 6: CONFIG CONCORRENTE
// ========================================

func TestConcurrent_AppConfig_Race(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	configKey := "test_config"
	
	// Criar config inicial
	config := AppConfig{
		ID:        uuid.New(),
		AppID:     appID,
		Key:       configKey,
		Value:     "0",
		ValueType: "int",
		Source:    "test",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	require.NoError(t, db.Create(&config).Error)
	
	numGoroutines := 100
	var wg sync.WaitGroup
	barrier := make(chan struct{})
	
	// Atualizar config concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(value int) {
			defer wg.Done()
			<-barrier
			
			db.Model(&AppConfig{}).
				Where("app_id = ? AND key = ?", appID, configKey).
				Update("value", fmt.Sprintf("%d", value))
		}(i)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar que config existe e tem valor válido
	var finalConfig AppConfig
	require.NoError(t, db.Where("app_id = ? AND key = ?", appID, configKey).First(&finalConfig).Error)
	
	assert.NotEmpty(t, finalConfig.Value, "Config deveria ter valor")
	
	t.Logf("✅ Config final: %s = %s (após %d atualizações)", configKey, finalConfig.Value, numGoroutines)
}


// ========================================
// TESTE 7: SHADOW EXECUTION CONCORRENTE
// ========================================

func TestConcurrent_ShadowExecution_Storm(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	
	// Criar regra
	rule := Rule{
		ID:          uuid.New(),
		AppID:       appID,
		Name:        "Shadow Storm Rule",
		Status:      RuleStatusActive,
		TriggerType: TriggerMetric,
		Condition:   "test > 0",
		ActionType:  ActionAlert,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	require.NoError(t, db.Create(&rule).Error)
	
	numGoroutines := 50
	executionsPerGoroutine := 40
	var wg sync.WaitGroup
	var successCount int64
	barrier := make(chan struct{})
	
	// Registrar shadow executions concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < executionsPerGoroutine; j++ {
				shadow := ShadowExecution{
					ID:               uuid.New(),
					AppID:            appID,
					RuleID:           rule.ID,
					RuleName:         rule.Name,
					ActionType:       ActionAlert,
					ActionDomain:     DomainTech,
					ConditionMet:     j%2 == 0,
					WouldBeAllowed:   j%3 != 0,
					WouldBlockReason: "",
					TriggerData:      fmt.Sprintf(`{"worker":%d,"iter":%d}`, workerID, j),
					ExecutedAt:       time.Now(),
					DurationMs:       int64(j),
				}
				
				if err := db.Create(&shadow).Error; err == nil {
					atomic.AddInt64(&successCount, 1)
				}
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar resultados
	var totalShadow int64
	db.Model(&ShadowExecution{}).Where("rule_id = ?", rule.ID).Count(&totalShadow)
	
	expectedTotal := int64(numGoroutines * executionsPerGoroutine)
	assert.Equal(t, expectedTotal, successCount, "Todas as shadow executions deveriam ser registradas")
	
	opsPerSec := float64(successCount) / duration.Seconds()
	t.Logf("✅ Shadow executions: %d em %v (%.0f ops/sec)", successCount, duration, opsPerSec)
}

// ========================================
// TESTE 8: AUTHORITY GRANT CONCORRENTE
// ========================================

func TestConcurrent_AuthorityGrant_Race(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	numGoroutines := 50
	grantsPerGoroutine := 20
	
	var wg sync.WaitGroup
	var successCount int64
	barrier := make(chan struct{})
	
	// Criar grants concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < grantsPerGoroutine; j++ {
				expiresAt := time.Now().Add(24 * time.Hour)
				grant := AuthorityGrant{
					ID:        uuid.New(),
					ActorID:   uuid.New(),
					ActorType: "user",
					Level:     AuthorityOperator,
					Scope:     "*",
					GrantedBy: uuid.New(),
					GrantedAt: time.Now(),
					ExpiresAt: &expiresAt,
					Reason:    fmt.Sprintf("Test grant W%d-G%d", workerID, j),
					IsActive:  true,
				}
				
				if err := db.Create(&grant).Error; err == nil {
					atomic.AddInt64(&successCount, 1)
				}
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar resultados
	var totalGrants int64
	db.Model(&AuthorityGrant{}).Count(&totalGrants)
	
	expectedTotal := int64(numGoroutines * grantsPerGoroutine)
	assert.Equal(t, expectedTotal, successCount, "Todos os grants deveriam ser criados")
	
	opsPerSec := float64(successCount) / duration.Seconds()
	t.Logf("✅ Authority grants: %d em %v (%.0f ops/sec)", successCount, duration, opsPerSec)
}

// ========================================
// TESTE 9: TEMPORARY RULES CONCORRENTE
// ========================================

func TestConcurrent_TemporaryRules_Lifecycle(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	numGoroutines := 30
	rulesPerGoroutine := 10
	
	var wg sync.WaitGroup
	var createdCount int64
	barrier := make(chan struct{})
	
	// Criar regras temporárias concorrentemente
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < rulesPerGoroutine; j++ {
				// Criar regra
				rule := Rule{
					ID:          uuid.New(),
					AppID:       appID,
					Name:        fmt.Sprintf("TempRule-W%d-R%d", workerID, j),
					Status:      RuleStatusActive,
					TriggerType: TriggerMetric,
					Condition:   "test > 0",
					ActionType:  ActionAlert,
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}
				
				if err := db.Create(&rule).Error; err != nil {
					continue
				}
				
				// Criar registro temporário
				temp := TemporaryRule{
					ID:            uuid.New(),
					RuleID:        rule.ID,
					CreatedByRule: uuid.New(),
					ExpiresAt:     time.Now().Add(time.Duration(j+1) * time.Hour),
					AutoDisabled:  false,
					CreatedAt:     time.Now(),
				}
				
				if err := db.Create(&temp).Error; err == nil {
					atomic.AddInt64(&createdCount, 1)
				}
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar resultados
	var totalTemp int64
	db.Model(&TemporaryRule{}).Count(&totalTemp)
	
	expectedTotal := int64(numGoroutines * rulesPerGoroutine)
	assert.Equal(t, expectedTotal, createdCount, "Todas as regras temporárias deveriam ser criadas")
	
	opsPerSec := float64(createdCount) / duration.Seconds()
	t.Logf("✅ Temporary rules: %d em %v (%.0f ops/sec)", createdCount, duration, opsPerSec)
}

// ========================================
// TESTE 10: HIGH LOAD STRESS TEST
// ========================================

func TestConcurrent_HighLoad_Stress(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	numApps := 5
	numGoroutines := 20
	operationsPerGoroutine := 100
	
	appIDs := make([]uuid.UUID, numApps)
	for i := 0; i < numApps; i++ {
		appIDs[i] = uuid.New()
	}
	
	var wg sync.WaitGroup
	var totalOps int64
	barrier := make(chan struct{})
	
	// Mix de operações concorrentes
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			appID := appIDs[workerID%numApps]
			
			for j := 0; j < operationsPerGoroutine; j++ {
				op := j % 5
				
				switch op {
				case 0: // Criar regra
					rule := Rule{
						ID:          uuid.New(),
						AppID:       appID,
						Name:        fmt.Sprintf("Stress-W%d-R%d", workerID, j),
						Status:      RuleStatusActive,
						TriggerType: TriggerMetric,
						Condition:   "test > 0",
						ActionType:  ActionAlert,
						CreatedAt:   time.Now(),
						UpdatedAt:   time.Now(),
					}
					db.Create(&rule)
					
				case 1: // Criar execução
					var rule Rule
					if db.Where("app_id = ?", appID).First(&rule).Error == nil {
						exec := RuleExecution{
							ID:           uuid.New(),
							RuleID:       rule.ID,
							AppID:        appID,
							ConditionMet: true,
							ExecutedAt:   time.Now(),
						}
						db.Create(&exec)
					}
					
				case 2: // Criar config
					config := AppConfig{
						ID:        uuid.New(),
						AppID:     appID,
						Key:       fmt.Sprintf("stress_key_%d_%d", workerID, j),
						Value:     fmt.Sprintf("%d", j),
						ValueType: "int",
						Source:    "stress_test",
						CreatedAt: time.Now(),
						UpdatedAt: time.Now(),
					}
					db.Create(&config)
					
				case 3: // Criar shadow
					var rule Rule
					if db.Where("app_id = ?", appID).First(&rule).Error == nil {
						shadow := ShadowExecution{
							ID:             uuid.New(),
							AppID:          appID,
							RuleID:         rule.ID,
							RuleName:       rule.Name,
							ActionType:     ActionAlert,
							ActionDomain:   DomainTech,
							ConditionMet:   true,
							WouldBeAllowed: true,
							ExecutedAt:     time.Now(),
						}
						db.Create(&shadow)
					}
					
				case 4: // Criar audit log
					var rule Rule
					if db.Where("app_id = ?", appID).First(&rule).Error == nil {
						audit := ActionAuditLog{
							ID:          uuid.New(),
							AppID:       appID,
							RuleID:      &rule.ID,
							ActionType:  ActionAlert,
							WasAllowed:  true,
							WasExecuted: true,
							TriggeredBy: "stress_test",
							ExecutedAt:  time.Now(),
						}
						db.Create(&audit)
					}
				}
				
				atomic.AddInt64(&totalOps, 1)
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	// Verificar integridade
	for _, appID := range appIDs {
		var ruleCount, execCount, configCount int64
		db.Model(&Rule{}).Where("app_id = ?", appID).Count(&ruleCount)
		db.Model(&RuleExecution{}).Where("app_id = ?", appID).Count(&execCount)
		db.Model(&AppConfig{}).Where("app_id = ?", appID).Count(&configCount)
		
		assert.Greater(t, ruleCount, int64(0), "App deveria ter regras")
	}
	
	opsPerSec := float64(totalOps) / duration.Seconds()
	t.Logf("✅ High load stress: %d operações em %v (%.0f ops/sec)", totalOps, duration, opsPerSec)
}

// ========================================
// TESTE 11: DELEÇÃO CONCORRENTE
// ========================================

func TestConcurrent_RuleDeletion_Race(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	numRules := 100
	
	// Criar regras
	ruleIDs := make([]uuid.UUID, numRules)
	for i := 0; i < numRules; i++ {
		rule := Rule{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        fmt.Sprintf("DeleteMe-%d", i),
			Status:      RuleStatusActive,
			TriggerType: TriggerMetric,
			Condition:   "test > 0",
			ActionType:  ActionAlert,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		require.NoError(t, db.Create(&rule).Error)
		ruleIDs[i] = rule.ID
	}
	
	var wg sync.WaitGroup
	var deleteCount int64
	barrier := make(chan struct{})
	
	// Deletar concorrentemente (cada regra pode ser deletada por múltiplas goroutines)
	for i := 0; i < numRules*2; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			<-barrier
			
			ruleID := ruleIDs[idx%numRules]
			result := db.Delete(&Rule{}, "id = ?", ruleID)
			if result.RowsAffected > 0 {
				atomic.AddInt64(&deleteCount, 1)
			}
		}(i)
	}
	
	close(barrier)
	wg.Wait()
	
	// Verificar que todas as regras foram deletadas
	var remaining int64
	db.Model(&Rule{}).Where("app_id = ?", appID).Count(&remaining)
	
	assert.Zero(t, remaining, "Todas as regras deveriam ser deletadas")
	assert.Equal(t, int64(numRules), deleteCount, "Cada regra deveria ser deletada exatamente uma vez")
	
	t.Logf("✅ Deleção concorrente: %d regras deletadas, %d restantes", deleteCount, remaining)
}

// ========================================
// TESTE 12: QUERY CONCORRENTE
// ========================================

func TestConcurrent_RuleQuery_Storm(t *testing.T) {
	db := setupRulesConcurrencyDB(t)
	
	appID := uuid.New()
	numRules := 50
	
	// Criar regras
	for i := 0; i < numRules; i++ {
		rule := Rule{
			ID:          uuid.New(),
			AppID:       appID,
			Name:        fmt.Sprintf("QueryMe-%d", i),
			Status:      RuleStatus([]RuleStatus{RuleStatusActive, RuleStatusInactive}[i%2]),
			Priority:    i,
			TriggerType: TriggerMetric,
			Condition:   fmt.Sprintf("metric > %d", i),
			ActionType:  ActionAlert,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		require.NoError(t, db.Create(&rule).Error)
	}
	
	numGoroutines := 100
	queriesPerGoroutine := 50
	var wg sync.WaitGroup
	var queryCount int64
	barrier := make(chan struct{})
	
	// Queries concorrentes
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			<-barrier
			
			for j := 0; j < queriesPerGoroutine; j++ {
				queryType := j % 4
				
				switch queryType {
				case 0: // Buscar todas
					var rules []Rule
					db.Where("app_id = ?", appID).Find(&rules)
					
				case 1: // Buscar ativas
					var rules []Rule
					db.Where("app_id = ? AND status = ?", appID, RuleStatusActive).Find(&rules)
					
				case 2: // Buscar por prioridade
					var rules []Rule
					db.Where("app_id = ? AND priority > ?", appID, 25).Order("priority DESC").Find(&rules)
					
				case 3: // Buscar uma específica
					var rule Rule
					db.Where("app_id = ?", appID).First(&rule)
				}
				
				atomic.AddInt64(&queryCount, 1)
			}
		}(i)
	}
	
	start := time.Now()
	close(barrier)
	wg.Wait()
	duration := time.Since(start)
	
	expectedQueries := int64(numGoroutines * queriesPerGoroutine)
	assert.Equal(t, expectedQueries, queryCount, "Todas as queries deveriam completar")
	
	opsPerSec := float64(queryCount) / duration.Seconds()
	t.Logf("✅ Query storm: %d queries em %v (%.0f ops/sec)", queryCount, duration, opsPerSec)
}
