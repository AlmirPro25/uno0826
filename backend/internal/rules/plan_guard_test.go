package rules

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

/*
================================================================================
TESTES DO PLAN GUARD - Cérebro conectado ao Bolso
================================================================================

Estes testes provam que:
1. Usuário Free só pode criar regras com ActionAlert
2. Usuário Pro pode usar webhook, flag, adjust
3. Usuário Enterprise pode usar meta-regras
4. Limites de regras são respeitados

================================================================================
*/

// setupPlanGuardTestDB cria banco de teste com estrutura completa
func setupPlanGuardTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Criar tabelas necessárias
	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS applications (
			id TEXT PRIMARY KEY,
			owner_id TEXT NOT NULL,
			name TEXT,
			created_at DATETIME
		)
	`).Error
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS billing_accounts (
			account_id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL UNIQUE,
			balance INTEGER DEFAULT 0,
			currency TEXT DEFAULT 'BRL'
		)
	`).Error
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS subscriptions (
			subscription_id TEXT PRIMARY KEY,
			account_id TEXT NOT NULL,
			plan_id TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active'
		)
	`).Error
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS rules (
			id TEXT PRIMARY KEY,
			app_id TEXT NOT NULL,
			name TEXT,
			action_type TEXT,
			status TEXT DEFAULT 'active',
			created_at DATETIME
		)
	`).Error
	require.NoError(t, err)

	return db
}

// createTestUser cria usuário com plano específico
func createTestUserWithPlan(t *testing.T, db *gorm.DB, planID string) (userID, appID uuid.UUID) {
	userID = uuid.New()
	appID = uuid.New()
	accountID := uuid.New()

	// Criar app
	err := db.Exec(`INSERT INTO applications (id, owner_id, name) VALUES (?, ?, ?)`,
		appID.String(), userID.String(), "Test App").Error
	require.NoError(t, err)

	// Criar billing account
	err = db.Exec(`INSERT INTO billing_accounts (account_id, user_id) VALUES (?, ?)`,
		accountID.String(), userID.String()).Error
	require.NoError(t, err)

	// Criar subscription com o plano
	if planID != "free" {
		subID := uuid.New()
		err = db.Exec(`INSERT INTO subscriptions (subscription_id, account_id, plan_id, status) VALUES (?, ?, ?, ?)`,
			subID.String(), accountID.String(), planID, "active").Error
		require.NoError(t, err)
	}

	return userID, appID
}

// ========================================
// TESTES DE CAPABILITIES POR PLANO
// ========================================

func TestPlanGuard_FreeUserCanOnlyUseAlert(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	guard := NewPlanGuard(db)
	_, appID := createTestUserWithPlan(t, db, "free")

	// Free pode usar Alert
	result := guard.ValidateRuleCreation(appID, ActionAlert)
	assert.True(t, result.Allowed, "Free deveria poder usar Alert")
	assert.Equal(t, "free", result.PlanID)

	// Free NÃO pode usar Webhook
	result = guard.ValidateRuleCreation(appID, ActionWebhook)
	assert.False(t, result.Allowed, "Free NÃO deveria poder usar Webhook")
	assert.Contains(t, result.Reason, "não disponível")
	assert.Equal(t, "pro", result.UpgradeTo)

	// Free NÃO pode usar Flag
	result = guard.ValidateRuleCreation(appID, ActionFlag)
	assert.False(t, result.Allowed, "Free NÃO deveria poder usar Flag")

	// Free NÃO pode usar CreateRule (meta-regra)
	result = guard.ValidateRuleCreation(appID, ActionCreateRule)
	assert.False(t, result.Allowed, "Free NÃO deveria poder usar CreateRule")
	assert.Equal(t, "enterprise", result.UpgradeTo)

	t.Log("✅ Usuário Free corretamente limitado a Alert")
}

func TestPlanGuard_ProUserCanUseIntermediateActions(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	guard := NewPlanGuard(db)
	_, appID := createTestUserWithPlan(t, db, "pro")

	// Pro pode usar Alert
	result := guard.ValidateRuleCreation(appID, ActionAlert)
	assert.True(t, result.Allowed)

	// Pro pode usar Webhook
	result = guard.ValidateRuleCreation(appID, ActionWebhook)
	assert.True(t, result.Allowed, "Pro deveria poder usar Webhook")

	// Pro pode usar Flag
	result = guard.ValidateRuleCreation(appID, ActionFlag)
	assert.True(t, result.Allowed, "Pro deveria poder usar Flag")

	// Pro pode usar Adjust
	result = guard.ValidateRuleCreation(appID, ActionAdjust)
	assert.True(t, result.Allowed, "Pro deveria poder usar Adjust")

	// Pro NÃO pode usar CreateRule (meta-regra)
	result = guard.ValidateRuleCreation(appID, ActionCreateRule)
	assert.False(t, result.Allowed, "Pro NÃO deveria poder usar CreateRule")
	assert.Equal(t, "enterprise", result.UpgradeTo)

	t.Log("✅ Usuário Pro tem acesso a ações intermediárias")
}

func TestPlanGuard_EnterpriseUserCanUseAllActions(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	guard := NewPlanGuard(db)
	_, appID := createTestUserWithPlan(t, db, "enterprise")

	// Enterprise pode usar tudo
	actions := []RuleActionType{
		ActionAlert,
		ActionWebhook,
		ActionFlag,
		ActionAdjust,
		ActionNotify,
		ActionEscalate,
		ActionCreateRule,
		ActionDisableRule,
	}

	for _, action := range actions {
		result := guard.ValidateRuleCreation(appID, action)
		assert.True(t, result.Allowed, "Enterprise deveria poder usar %s", action)
		assert.Equal(t, "enterprise", result.PlanID)
	}

	t.Log("✅ Usuário Enterprise tem acesso a todas as ações")
}

// ========================================
// TESTES DE LIMITES DE REGRAS
// ========================================

func TestPlanGuard_FreeUserRuleLimit(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	guard := NewPlanGuard(db)
	_, appID := createTestUserWithPlan(t, db, "free")

	// Free tem limite de 5 regras
	limit := GetPlanRuleLimit("free")
	assert.Equal(t, 5, limit)

	// Criar 5 regras
	for i := 0; i < 5; i++ {
		ruleID := uuid.New()
		err := db.Exec(`INSERT INTO rules (id, app_id, name, action_type) VALUES (?, ?, ?, ?)`,
			ruleID.String(), appID.String(), "Rule "+string(rune('A'+i)), "alert").Error
		require.NoError(t, err)
	}

	// Verificar que não pode criar mais
	canCreate, maxLimit, current := guard.CanCreateMoreRules(appID)
	assert.False(t, canCreate, "Não deveria poder criar mais regras")
	assert.Equal(t, 5, maxLimit)
	assert.Equal(t, 5, current)

	// Validação deve falhar
	result := guard.ValidateRuleCreation(appID, ActionAlert)
	assert.False(t, result.Allowed)
	assert.Contains(t, result.Reason, "Limite de regras atingido")

	t.Log("✅ Limite de regras do plano Free respeitado")
}

func TestPlanGuard_EnterpriseUnlimitedRules(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	guard := NewPlanGuard(db)
	_, appID := createTestUserWithPlan(t, db, "enterprise")

	// Enterprise tem limite ilimitado (-1)
	limit := GetPlanRuleLimit("enterprise")
	assert.Equal(t, -1, limit)

	// Criar 100 regras
	for i := 0; i < 100; i++ {
		ruleID := uuid.New()
		err := db.Exec(`INSERT INTO rules (id, app_id, name, action_type) VALUES (?, ?, ?, ?)`,
			ruleID.String(), appID.String(), "Rule", "alert").Error
		require.NoError(t, err)
	}

	// Ainda pode criar mais
	canCreate, maxLimit, _ := guard.CanCreateMoreRules(appID)
	assert.True(t, canCreate, "Enterprise deveria poder criar regras ilimitadas")
	assert.Equal(t, -1, maxLimit)

	t.Log("✅ Enterprise tem regras ilimitadas")
}

// ========================================
// TESTES DE EXECUÇÃO DE AÇÃO
// ========================================

func TestPlanGuard_ExecutionBlockedByPlan(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	guard := NewPlanGuard(db)
	_, appID := createTestUserWithPlan(t, db, "free")

	// Tentar executar webhook com plano Free
	result := guard.ValidateActionExecution(appID, ActionWebhook)
	assert.False(t, result.Allowed)
	assert.Contains(t, result.Reason, "bloqueada")
	assert.Equal(t, "pro", result.UpgradeTo)

	t.Log("✅ Execução de ação bloqueada corretamente por plano")
}

func TestPlanGuard_ExecutionAllowedByPlan(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	guard := NewPlanGuard(db)
	_, appID := createTestUserWithPlan(t, db, "pro")

	// Executar webhook com plano Pro
	result := guard.ValidateActionExecution(appID, ActionWebhook)
	assert.True(t, result.Allowed)
	assert.Equal(t, "pro", result.PlanID)

	t.Log("✅ Execução de ação permitida pelo plano")
}

// ========================================
// TESTES DE INTEGRAÇÃO COM SERVICE
// ========================================

func TestRulesService_CreateRuleBlockedByPlan(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	
	// Migrate rules table completa
	db.AutoMigrate(&Rule{})
	
	service := &RulesService{
		db:        db,
		planGuard: NewPlanGuard(db),
	}
	
	_, appID := createTestUserWithPlan(t, db, "free")

	// Tentar criar regra com webhook (Free não pode)
	rule := &Rule{
		AppID:      appID,
		Name:       "Test Webhook Rule",
		ActionType: ActionWebhook,
		Status:     RuleStatusActive,
	}

	err := service.CreateRule(rule)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "PLAN_BLOCKED")

	t.Log("✅ CreateRule bloqueado corretamente por plano")
}

func TestRulesService_CreateRuleAllowedByPlan(t *testing.T) {
	db := setupPlanGuardTestDB(t)
	
	// Migrate rules table completa com todas as colunas
	err := db.Exec(`
		DROP TABLE IF EXISTS rules;
		CREATE TABLE rules (
			id TEXT PRIMARY KEY,
			app_id TEXT NOT NULL,
			name TEXT,
			description TEXT,
			status TEXT DEFAULT 'active',
			priority INTEGER DEFAULT 0,
			trigger_type TEXT,
			trigger_config TEXT,
			condition TEXT,
			action_type TEXT,
			action_config TEXT,
			cooldown_minutes INTEGER DEFAULT 60,
			last_triggered_at DATETIME,
			trigger_count INTEGER DEFAULT 0,
			created_at DATETIME,
			updated_at DATETIME,
			created_by TEXT
		)
	`).Error
	require.NoError(t, err)
	
	service := &RulesService{
		db:        db,
		planGuard: NewPlanGuard(db),
	}
	
	_, appID := createTestUserWithPlan(t, db, "pro")

	// Criar regra com webhook (Pro pode)
	rule := &Rule{
		AppID:       appID,
		Name:        "Test Webhook Rule",
		ActionType:  ActionWebhook,
		Status:      RuleStatusActive,
		TriggerType: TriggerMetric,
		Condition:   "events > 10",
	}

	err = service.CreateRule(rule)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, rule.ID)

	t.Log("✅ CreateRule permitido pelo plano Pro")
}

// ========================================
// TESTES DE CAPABILITIES
// ========================================

func TestGetPlanCapabilities(t *testing.T) {
	// Free
	freeCaps := GetPlanCapabilities("free")
	assert.Len(t, freeCaps, 1)
	assert.Contains(t, freeCaps, CapRuleAlert)

	// Pro
	proCaps := GetPlanCapabilities("pro")
	assert.Len(t, proCaps, 6)
	assert.Contains(t, proCaps, CapRuleAlert)
	assert.Contains(t, proCaps, CapRuleWebhook)
	assert.Contains(t, proCaps, CapRuleFlag)

	// Enterprise
	entCaps := GetPlanCapabilities("enterprise")
	assert.Len(t, entCaps, 11)
	assert.Contains(t, entCaps, CapRuleCreateRule)
	assert.Contains(t, entCaps, CapRuleUnlimitedRules)

	t.Log("✅ Capabilities por plano corretas")
}

func TestActionTypeToCapabilityMapping(t *testing.T) {
	// Verificar que todas as ações têm capability mapeada
	actions := []RuleActionType{
		ActionAlert,
		ActionWebhook,
		ActionFlag,
		ActionAdjust,
		ActionNotify,
		ActionEscalate,
		ActionCreateRule,
		ActionDisableRule,
	}

	for _, action := range actions {
		cap, exists := ActionTypeToCapability[action]
		assert.True(t, exists, "Ação %s deveria ter capability mapeada", action)
		assert.NotEmpty(t, cap)
	}

	t.Log("✅ Todas as ações têm capabilities mapeadas")
}
