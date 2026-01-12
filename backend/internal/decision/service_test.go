package decision

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// ========================================
// DECISION SERVICE TESTS
// "O que o sistema DECIDIU, não só o que aconteceu"
// ========================================

var testDBCounter int
var testDBMutex sync.Mutex

func setupTestDB(t *testing.T) *gorm.DB {
	testDBMutex.Lock()
	testDBCounter++
	dbName := fmt.Sprintf("file:testdb%d?mode=memory&cache=shared", testDBCounter)
	testDBMutex.Unlock()
	
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	require.NoError(t, err)
	
	// Migrate
	err = db.AutoMigrate(&Decision{})
	require.NoError(t, err)
	
	return db
}

func TestNewService(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	
	assert.NotNil(t, service)
	assert.NotNil(t, service.db)
}

// ========================================
// RECORD DECISION TESTS
// ========================================

func TestRecordDecision_Basic(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	decision := &Decision{
		AppID:    uuid.New(),
		Type:     DecisionAccessAllowed,
		Outcome:  OutcomeAllowed,
		Reason:   "User authenticated successfully",
		Severity: SeverityLow,
	}
	
	err := service.RecordDecision(ctx, decision)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, decision.ID)
	assert.False(t, decision.DecidedAt.IsZero())
	
	t.Logf("✅ Decisão registrada: %s", decision.ID)
}

func TestRecordDecision_WithAllFields(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	userID := uuid.New()
	sessionID := uuid.New()
	
	decision := &Decision{
		AppID:        uuid.New(),
		Type:         DecisionPaymentBlocked,
		Outcome:      OutcomeBlocked,
		Reason:       "Insufficient funds",
		ReasonCode:   "INSUFFICIENT_FUNDS",
		UserID:       &userID,
		SessionID:    &sessionID,
		ResourceID:   "payment_123",
		ResourceType: "payment",
		TriggerType:  TriggerRule,
		TriggerID:    "rule_balance_check",
		Severity:     SeverityMedium,
		Reversible:   false,
	}
	
	err := service.RecordDecision(ctx, decision)
	assert.NoError(t, err)
	
	// Verify saved
	var saved Decision
	err = db.First(&saved, "id = ?", decision.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionPaymentBlocked, saved.Type)
	assert.Equal(t, OutcomeBlocked, saved.Outcome)
	assert.Equal(t, "INSUFFICIENT_FUNDS", saved.ReasonCode)
	
	t.Logf("✅ Decisão com todos os campos registrada")
}

// ========================================
// RECORD ACCESS TESTS
// ========================================

func TestRecordAccess_Allowed(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	userID := uuid.New()
	
	err := service.RecordAccess(ctx, appID, userID, true, "User authenticated", "AUTH_SUCCESS")
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionAccessAllowed, decision.Type)
	assert.Equal(t, OutcomeAllowed, decision.Outcome)
	
	t.Logf("✅ Acesso permitido registrado")
}

func TestRecordAccess_Denied(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	userID := uuid.New()
	
	err := service.RecordAccess(ctx, appID, userID, false, "Invalid credentials", "INVALID_CREDENTIALS")
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionAccessDenied, decision.Type)
	assert.Equal(t, OutcomeBlocked, decision.Outcome)
	
	t.Logf("✅ Acesso negado registrado")
}

// ========================================
// RECORD PAYMENT DECISION TESTS
// ========================================

func TestRecordPaymentDecision_Allowed(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	userID := uuid.New()
	metadata := map[string]any{
		"amount":   9900,
		"currency": "usd",
	}
	
	err := service.RecordPaymentDecision(ctx, appID, userID, true, "Payment processed", "PAYMENT_SUCCESS", metadata)
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionPaymentAllowed, decision.Type)
	assert.Contains(t, decision.Metadata, "9900")
	
	t.Logf("✅ Pagamento permitido registrado")
}

func TestRecordPaymentDecision_Blocked(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	userID := uuid.New()
	
	err := service.RecordPaymentDecision(ctx, appID, userID, false, "Card declined", "CARD_DECLINED", nil)
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionPaymentBlocked, decision.Type)
	assert.Equal(t, SeverityMedium, decision.Severity)
	
	t.Logf("✅ Pagamento bloqueado registrado")
}

// ========================================
// RECORD RULE DECISION TESTS
// ========================================

func TestRecordRuleDecision_Triggered(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	err := service.RecordRuleDecision(ctx, appID, "rule_fraud_check", true, false, "Fraud pattern detected")
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionRuleTriggered, decision.Type)
	assert.Equal(t, TriggerRule, decision.TriggerType)
	
	t.Logf("✅ Regra disparada registrada")
}

func TestRecordRuleDecision_Shadow(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	err := service.RecordRuleDecision(ctx, appID, "rule_new_feature", true, true, "Would have blocked")
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionRuleShadow, decision.Type)
	
	t.Logf("✅ Regra em shadow mode registrada")
}

func TestRecordRuleDecision_Skipped(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	err := service.RecordRuleDecision(ctx, appID, "rule_check", false, false, "Condition not met")
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionRuleSkipped, decision.Type)
	assert.Equal(t, OutcomeAllowed, decision.Outcome)
	
	t.Logf("✅ Regra não disparada registrada")
}

// ========================================
// RECORD KILLSWITCH DECISION TESTS
// ========================================

func TestRecordKillswitchDecision_Blocked(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	err := service.RecordKillswitchDecision(ctx, appID, "billing:global", true, "Emergency shutdown")
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionKillswitchBlock, decision.Type)
	assert.Equal(t, SeverityHigh, decision.Severity)
	assert.Equal(t, TriggerKillswitch, decision.TriggerType)
	
	t.Logf("✅ Kill switch bloqueio registrado")
}

func TestRecordKillswitchDecision_Allowed(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	err := service.RecordKillswitchDecision(ctx, appID, "billing:global", false, "Kill switch not active")
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionKillswitchAllow, decision.Type)
	assert.Equal(t, OutcomeAllowed, decision.Outcome)
	
	t.Logf("✅ Kill switch permitido registrado")
}

// ========================================
// RECORD SECURITY DECISION TESTS
// ========================================

func TestRecordSecurityDecision(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	userID := uuid.New()
	metadata := map[string]any{
		"ip":         "192.168.1.1",
		"user_agent": "suspicious-bot",
	}
	
	err := service.RecordSecurityDecision(ctx, appID, &userID, "block_suspicious", "Bot detected", "BOT_DETECTED", metadata)
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionSecurityBlock, decision.Type)
	assert.Equal(t, SeverityHigh, decision.Severity)
	assert.False(t, decision.Reversible)
	
	t.Logf("✅ Decisão de segurança registrada")
}

// ========================================
// RECORD INVARIANT VIOLATION TESTS
// ========================================

func TestRecordInvariantViolation(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	metadata := map[string]any{
		"expected": 1000,
		"actual":   950,
	}
	
	err := service.RecordInvariantViolation(ctx, appID, "balance_consistency", "Balance mismatch detected", metadata)
	assert.NoError(t, err)
	
	// Verify
	var decision Decision
	err = db.First(&decision, "app_id = ?", appID).Error
	assert.NoError(t, err)
	assert.Equal(t, DecisionInvariantViolation, decision.Type)
	assert.Equal(t, OutcomeEscalated, decision.Outcome)
	assert.Equal(t, SeverityCritical, decision.Severity)
	assert.Equal(t, TriggerInvariant, decision.TriggerType)
	
	t.Logf("✅ Violação de invariante registrada")
}

// ========================================
// QUERY TESTS
// ========================================

func TestGetByApp(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	otherAppID := uuid.New()
	
	// Create decisions for different apps
	for i := 0; i < 5; i++ {
		service.RecordAccess(ctx, appID, uuid.New(), true, "Test", "TEST")
	}
	for i := 0; i < 3; i++ {
		service.RecordAccess(ctx, otherAppID, uuid.New(), true, "Test", "TEST")
	}
	
	// Query
	decisions, err := service.GetByApp(ctx, appID, 10)
	assert.NoError(t, err)
	assert.Len(t, decisions, 5)
	
	t.Logf("✅ GetByApp retornou %d decisões", len(decisions))
}

func TestGetByUser(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	userID := uuid.New()
	appID := uuid.New()
	
	// Create decisions for user
	for i := 0; i < 3; i++ {
		service.RecordAccess(ctx, appID, userID, true, "Test", "TEST")
	}
	// Create decisions for other user
	service.RecordAccess(ctx, appID, uuid.New(), true, "Test", "TEST")
	
	// Query
	decisions, err := service.GetByUser(ctx, userID, 10)
	assert.NoError(t, err)
	assert.Len(t, decisions, 3)
	
	t.Logf("✅ GetByUser retornou %d decisões", len(decisions))
}

func TestGetByType(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	// Create different types
	service.RecordAccess(ctx, appID, uuid.New(), true, "Test", "TEST")
	service.RecordAccess(ctx, appID, uuid.New(), false, "Test", "TEST")
	service.RecordPaymentDecision(ctx, appID, uuid.New(), true, "Test", "TEST", nil)
	
	// Query access allowed
	decisions, err := service.GetByType(ctx, appID, DecisionAccessAllowed, 10)
	assert.NoError(t, err)
	assert.Len(t, decisions, 1)
	
	// Query access denied
	decisions, err = service.GetByType(ctx, appID, DecisionAccessDenied, 10)
	assert.NoError(t, err)
	assert.Len(t, decisions, 1)
	
	t.Logf("✅ GetByType funcionando corretamente")
}

func TestGetCritical(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	// Create decisions with different severities
	service.RecordAccess(ctx, appID, uuid.New(), true, "Test", "TEST") // Low
	service.RecordInvariantViolation(ctx, appID, "test", "Test", nil)  // Critical
	service.RecordSecurityDecision(ctx, appID, nil, "test", "Test", "TEST", nil) // High
	
	// Query critical only
	since := time.Now().Add(-1 * time.Hour)
	decisions, err := service.GetCritical(ctx, since)
	assert.NoError(t, err)
	assert.Len(t, decisions, 1)
	assert.Equal(t, SeverityCritical, decisions[0].Severity)
	
	t.Logf("✅ GetCritical retornou apenas decisões críticas")
}

func TestCountByOutcome(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	// Create decisions with different outcomes
	for i := 0; i < 5; i++ {
		service.RecordAccess(ctx, appID, uuid.New(), true, "Test", "TEST") // Allowed
	}
	for i := 0; i < 3; i++ {
		service.RecordAccess(ctx, appID, uuid.New(), false, "Test", "TEST") // Blocked
	}
	
	// Count
	since := time.Now().Add(-1 * time.Hour)
	counts, err := service.CountByOutcome(ctx, appID, since)
	assert.NoError(t, err)
	assert.Equal(t, int64(5), counts[OutcomeAllowed])
	assert.Equal(t, int64(3), counts[OutcomeBlocked])
	
	t.Logf("✅ CountByOutcome: allowed=%d, blocked=%d", counts[OutcomeAllowed], counts[OutcomeBlocked])
}

func TestGetAll(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	// Create decisions for multiple apps
	for i := 0; i < 10; i++ {
		service.RecordAccess(ctx, uuid.New(), uuid.New(), true, "Test", "TEST")
	}
	
	// Query all
	decisions, err := service.GetAll(ctx, 5)
	assert.NoError(t, err)
	assert.Len(t, decisions, 5)
	
	t.Logf("✅ GetAll retornou %d decisões (limit 5)", len(decisions))
}

func TestGetRecent(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	
	// Create recent decisions
	for i := 0; i < 5; i++ {
		service.RecordAccess(ctx, appID, uuid.New(), true, "Test", "TEST")
	}
	
	// Query recent
	since := time.Now().Add(-1 * time.Hour)
	decisions, err := service.GetRecent(ctx, since, 10)
	assert.NoError(t, err)
	assert.Len(t, decisions, 5)
	
	t.Logf("✅ GetRecent retornou %d decisões", len(decisions))
}

// ========================================
// EDGE CASES
// ========================================

func TestDecisionService_EdgeCases(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	t.Run("Empty metadata", func(t *testing.T) {
		appID := uuid.New()
		err := service.RecordPaymentDecision(ctx, appID, uuid.New(), true, "Test", "TEST", nil)
		assert.NoError(t, err)
	})
	
	t.Run("Nil user ID in security decision", func(t *testing.T) {
		appID := uuid.New()
		err := service.RecordSecurityDecision(ctx, appID, nil, "test", "Test", "TEST", nil)
		assert.NoError(t, err)
	})
	
	t.Run("Very long reason", func(t *testing.T) {
		appID := uuid.New()
		longReason := ""
		for i := 0; i < 100; i++ {
			longReason += "This is a very long reason. "
		}
		// Should truncate or handle gracefully
		err := service.RecordAccess(ctx, appID, uuid.New(), true, longReason[:500], "TEST")
		assert.NoError(t, err)
	})
	
	t.Run("Query with zero limit", func(t *testing.T) {
		appID := uuid.New()
		service.RecordAccess(ctx, appID, uuid.New(), true, "Test", "TEST")
		
		decisions, err := service.GetByApp(ctx, appID, 0)
		assert.NoError(t, err)
		// Should return empty or handle gracefully
		assert.Empty(t, decisions)
	})
	
	t.Log("✅ Edge cases handled correctly")
}

// ========================================
// CONCURRENCY TESTS
// ========================================

func TestDecisionService_Concurrency(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	
	appID := uuid.New()
	errChan := make(chan error, 10)
	
	// Concurrent writes - use sync.WaitGroup for proper synchronization
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			err := service.RecordAccess(ctx, appID, uuid.New(), true, "Concurrent test", "TEST")
			if err != nil {
				errChan <- err
			}
		}()
	}
	
	// Wait for all goroutines to complete
	wg.Wait()
	close(errChan)
	
	// Check for errors
	for err := range errChan {
		t.Errorf("Concurrent write error: %v", err)
	}
	
	// Verify all were saved
	decisions, err := service.GetByApp(ctx, appID, 20)
	assert.NoError(t, err)
	assert.Len(t, decisions, 10)
	
	t.Logf("✅ 10 decisões concorrentes registradas com sucesso")
}
