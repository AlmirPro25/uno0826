package rules

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupRulesTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&Rule{}, &RuleExecution{}, &AppConfig{}, &TemporaryRule{}, &ActionAuditLog{}, &ShadowExecution{}, &AuthorityGrant{})
	
	// Criar tabelas auxiliares para PlanGuard
	db.Exec(`CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, owner_id TEXT, name TEXT)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS billing_accounts (account_id TEXT PRIMARY KEY, user_id TEXT UNIQUE)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS subscriptions (subscription_id TEXT PRIMARY KEY, account_id TEXT, plan_id TEXT, status TEXT)`)
	
	return db
}

func createRulesTestService(t *testing.T, db *gorm.DB) *RulesService {
	return &RulesService{
		db:        db,
		stopEval:  make(chan struct{}),
		planGuard: NewPlanGuard(db), // Adicionar PlanGuard
	}
}

// setupTestAppWithPlan cria um app com owner que tem um plano específico
func setupTestAppWithPlan(t *testing.T, db *gorm.DB, planID string) uuid.UUID {
	userID := uuid.New()
	appID := uuid.New()
	accountID := uuid.New()

	// Criar app
	db.Exec(`INSERT INTO applications (id, owner_id, name) VALUES (?, ?, ?)`,
		appID.String(), userID.String(), "Test App")

	// Criar billing account
	db.Exec(`INSERT INTO billing_accounts (account_id, user_id) VALUES (?, ?)`,
		accountID.String(), userID.String())

	// Criar subscription se não for free
	if planID != "free" {
		subID := uuid.New()
		db.Exec(`INSERT INTO subscriptions (subscription_id, account_id, plan_id, status) VALUES (?, ?, ?, ?)`,
			subID.String(), accountID.String(), planID, "active")
	}

	return appID
}

// ===========================================
// CRUD TESTS
// ===========================================

func TestCreateRule(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	
	// Criar app com plano Pro (pode usar Alert)
	appID := setupTestAppWithPlan(t, db, "pro")
	
	rule := &Rule{
		AppID:       appID,
		Name:        "Test Rule",
		Description: "Test description",
		Status:      RuleStatusActive,
		TriggerType: TriggerMetric,
		Condition:   "bounce_rate > 50",
		ActionType:  ActionAlert,
	}
	err := service.CreateRule(rule)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, rule.ID)
}

func TestGetRule(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	
	// Criar app com plano Pro
	appID := setupTestAppWithPlan(t, db, "pro")
	
	rule := &Rule{AppID: appID, Name: "Test", Status: RuleStatusActive, TriggerType: TriggerMetric, ActionType: ActionAlert}
	service.CreateRule(rule)
	found, err := service.GetRule(rule.ID)
	assert.NoError(t, err)
	assert.Equal(t, "Test", found.Name)
}

func TestGetRulesByApp(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	
	// Criar app com plano Pro
	appID := setupTestAppWithPlan(t, db, "pro")
	
	for i := 0; i < 3; i++ {
		service.CreateRule(&Rule{AppID: appID, Name: "Rule", Status: RuleStatusActive, TriggerType: TriggerMetric, ActionType: ActionAlert})
	}
	rules, err := service.GetRulesByApp(appID)
	assert.NoError(t, err)
	assert.Len(t, rules, 3)
}

func TestUpdateRule(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	
	// Criar app com plano Pro
	appID := setupTestAppWithPlan(t, db, "pro")
	
	rule := &Rule{AppID: appID, Name: "Original", Status: RuleStatusActive, TriggerType: TriggerMetric, ActionType: ActionAlert}
	service.CreateRule(rule)
	rule.Name = "Updated"
	err := service.UpdateRule(rule)
	assert.NoError(t, err)
	found, _ := service.GetRule(rule.ID)
	assert.Equal(t, "Updated", found.Name)
}

func TestDeleteRule(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	
	// Criar app com plano Pro
	appID := setupTestAppWithPlan(t, db, "pro")
	
	rule := &Rule{AppID: appID, Name: "ToDelete", Status: RuleStatusActive, TriggerType: TriggerMetric, ActionType: ActionAlert}
	service.CreateRule(rule)
	err := service.DeleteRule(rule.ID)
	assert.NoError(t, err)
	_, err = service.GetRule(rule.ID)
	assert.Error(t, err)
}

func TestToggleRule(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	
	// Criar app com plano Pro
	appID := setupTestAppWithPlan(t, db, "pro")
	
	rule := &Rule{AppID: appID, Name: "Toggle", Status: RuleStatusActive, TriggerType: TriggerMetric, ActionType: ActionAlert}
	service.CreateRule(rule)
	err := service.ToggleRule(rule.ID, false)
	assert.NoError(t, err)
	found, _ := service.GetRule(rule.ID)
	assert.Equal(t, RuleStatusInactive, found.Status)
	service.ToggleRule(rule.ID, true)
	found, _ = service.GetRule(rule.ID)
	assert.Equal(t, RuleStatusActive, found.Status)
}


// ===========================================
// CONDITION EVALUATION TESTS
// ===========================================

func TestEvalComparisonLessThan(t *testing.T) {
	service := &RulesService{}
	result, err := service.evalComparison("10.5 < 20")
	assert.NoError(t, err)
	assert.True(t, result)
	result, err = service.evalComparison("30 < 20")
	assert.NoError(t, err)
	assert.False(t, result)
}

func TestEvalComparisonGreaterThan(t *testing.T) {
	service := &RulesService{}
	result, err := service.evalComparison("50 > 20")
	assert.NoError(t, err)
	assert.True(t, result)
	result, err = service.evalComparison("10 > 20")
	assert.NoError(t, err)
	assert.False(t, result)
}

func TestEvalComparisonEquals(t *testing.T) {
	service := &RulesService{}
	result, err := service.evalComparison("10 == 10")
	assert.NoError(t, err)
	assert.True(t, result)
	result, err = service.evalComparison("10 == 20")
	assert.NoError(t, err)
	assert.False(t, result)
}

func TestEvalComparisonNotEquals(t *testing.T) {
	service := &RulesService{}
	result, err := service.evalComparison("10 != 20")
	assert.NoError(t, err)
	assert.True(t, result)
}

func TestEvalComparisonLessOrEqual(t *testing.T) {
	service := &RulesService{}
	result, err := service.evalComparison("10 <= 10")
	assert.NoError(t, err)
	assert.True(t, result)
	result, err = service.evalComparison("10 <= 20")
	assert.NoError(t, err)
	assert.True(t, result)
}

func TestEvalComparisonGreaterOrEqual(t *testing.T) {
	service := &RulesService{}
	result, err := service.evalComparison("20 >= 10")
	assert.NoError(t, err)
	assert.True(t, result)
	result, err = service.evalComparison("10 >= 10")
	assert.NoError(t, err)
	assert.True(t, result)
}

func TestEvalExpressionAND(t *testing.T) {
	service := &RulesService{}
	result, err := service.evalExpression("10 > 5 AND 20 > 10")
	assert.NoError(t, err)
	assert.True(t, result)
	result, err = service.evalExpression("10 > 5 AND 5 > 10")
	assert.NoError(t, err)
	assert.False(t, result)
}

func TestEvalExpressionOR(t *testing.T) {
	service := &RulesService{}
	result, err := service.evalExpression("10 > 5 OR 5 > 10")
	assert.NoError(t, err)
	assert.True(t, result)
	result, err = service.evalExpression("1 > 5 OR 2 > 10")
	assert.NoError(t, err)
	assert.False(t, result)
}

func TestEvaluateConditionWithMetrics(t *testing.T) {
	service := &RulesService{}
	metrics := map[string]float64{
		"bounce_rate":    75.0,
		"online_now":     50,
		"active_sessions": 100,
	}
	result, err := service.evaluateCondition("bounce_rate > 70", metrics)
	assert.NoError(t, err)
	assert.True(t, result)
	result, err = service.evaluateCondition("bounce_rate < 50", metrics)
	assert.NoError(t, err)
	assert.False(t, result)
}

func TestEvaluateConditionComplex(t *testing.T) {
	service := &RulesService{}
	metrics := map[string]float64{
		"bounce_rate":    75.0,
		"online_now":     50,
		"active_sessions": 100,
	}
	result, err := service.evaluateCondition("bounce_rate > 70 AND online_now > 10", metrics)
	assert.NoError(t, err)
	assert.True(t, result)
}

func TestEvaluateConditionEmpty(t *testing.T) {
	service := &RulesService{}
	result, err := service.evaluateCondition("", nil)
	assert.NoError(t, err)
	assert.True(t, result)
}


// ===========================================
// CONSTANTS AND MODELS TESTS
// ===========================================

func TestRuleStatusConstants(t *testing.T) {
	assert.Equal(t, RuleStatus("active"), RuleStatusActive)
	assert.Equal(t, RuleStatus("inactive"), RuleStatusInactive)
	assert.Equal(t, RuleStatus("paused"), RuleStatusPaused)
}

func TestRuleTriggerTypeConstants(t *testing.T) {
	assert.Equal(t, RuleTriggerType("metric"), TriggerMetric)
	assert.Equal(t, RuleTriggerType("event"), TriggerEvent)
	assert.Equal(t, RuleTriggerType("schedule"), TriggerSchedule)
	assert.Equal(t, RuleTriggerType("threshold"), TriggerThreshold)
}

func TestRuleActionTypeConstants(t *testing.T) {
	assert.Equal(t, RuleActionType("alert"), ActionAlert)
	assert.Equal(t, RuleActionType("webhook"), ActionWebhook)
	assert.Equal(t, RuleActionType("flag"), ActionFlag)
	assert.Equal(t, RuleActionType("notify"), ActionNotify)
	assert.Equal(t, RuleActionType("adjust"), ActionAdjust)
	assert.Equal(t, RuleActionType("create_rule"), ActionCreateRule)
	assert.Equal(t, RuleActionType("disable_rule"), ActionDisableRule)
	assert.Equal(t, RuleActionType("escalate"), ActionEscalate)
}

func TestGetPredefinedRules(t *testing.T) {
	rules := GetPredefinedRules()
	assert.NotEmpty(t, rules)
	assert.GreaterOrEqual(t, len(rules), 5)
	for _, r := range rules {
		assert.NotEmpty(t, r.ID)
		assert.NotEmpty(t, r.Name)
		assert.NotEmpty(t, r.Category)
	}
}

func TestAppConfigTableName(t *testing.T) {
	assert.Equal(t, "app_configs", AppConfig{}.TableName())
}

func TestTemporaryRuleTableName(t *testing.T) {
	assert.Equal(t, "temporary_rules", TemporaryRule{}.TableName())
}

// ===========================================
// CALLBACK TESTS
// ===========================================

func TestSetAlertCallback(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	service.SetAlertCallback(func(appID uuid.UUID, alertType, message string, data map[string]interface{}) {
	})
	assert.NotNil(t, service.alertCallback)
}

func TestSetWebhookCallback(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	service.SetWebhookCallback(func(url, method string, headers map[string]string, body string) error {
		return nil
	})
	assert.NotNil(t, service.webhookCallback)
}

func TestSetFlagCallback(t *testing.T) {
	db := setupRulesTestDB(t)
	service := createRulesTestService(t, db)
	service.SetFlagCallback(func(appID uuid.UUID, target, flagName, flagValue string, ttl time.Duration) error {
		return nil
	})
	assert.NotNil(t, service.flagCallback)
}

// ===========================================
// APP CONFIG TESTS
// ===========================================

func TestAppConfigCRUD(t *testing.T) {
	db := setupRulesTestDB(t)
	appID := uuid.New()
	config := AppConfig{
		ID:        uuid.New(),
		AppID:     appID,
		Key:       "test_key",
		Value:     "test_value",
		ValueType: "string",
		Source:    "manual",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err := db.Create(&config).Error
	assert.NoError(t, err)
	var found AppConfig
	err = db.Where("app_id = ? AND key = ?", appID, "test_key").First(&found).Error
	assert.NoError(t, err)
	assert.Equal(t, "test_value", found.Value)
}

func TestTemporaryRuleCRUD(t *testing.T) {
	db := setupRulesTestDB(t)
	ruleID := uuid.New()
	createdByRule := uuid.New()
	temp := TemporaryRule{
		ID:            uuid.New(),
		RuleID:        ruleID,
		CreatedByRule: createdByRule,
		ExpiresAt:     time.Now().Add(24 * time.Hour),
		AutoDisabled:  false,
		CreatedAt:     time.Now(),
	}
	err := db.Create(&temp).Error
	assert.NoError(t, err)
	var found TemporaryRule
	err = db.Where("rule_id = ?", ruleID).First(&found).Error
	assert.NoError(t, err)
	assert.Equal(t, createdByRule, found.CreatedByRule)
}
