package financial

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupFinancialTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		// Desabilitar logs para testes mais limpos
		Logger: nil,
	})
	require.NoError(t, err)

	// Migrar todas as tabelas necessárias
	err = db.AutoMigrate(
		&FinancialEvent{},
		&ProcessedWebhook{},
		&AppFinancialMetrics{},
		&DailyFinancialSnapshot{},
		&GlobalFinancialMetrics{},
		&ReconciliationResult{},
	)
	require.NoError(t, err)

	return db
}

// setupReconciliationTestDB cria DB separado para testes de reconciliação
// que precisam de tabelas específicas
func setupReconciliationTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrar tabelas na ordem correta
	err = db.AutoMigrate(
		&FinancialEvent{},
		&ProcessedWebhook{},
		&AppFinancialMetrics{},
		&DailyFinancialSnapshot{},
		&GlobalFinancialMetrics{},
		&ReconciliationResult{},
	)
	require.NoError(t, err)

	return db
}

// ========================================
// EVENT TYPE TESTS
// ========================================

func TestEventType_IsPayment(t *testing.T) {
	paymentTypes := []EventType{
		EventPaymentCreated,
		EventPaymentSucceeded,
		EventPaymentFailed,
		EventPaymentCanceled,
	}

	for _, et := range paymentTypes {
		assert.True(t, et.IsPayment(), "%s should be payment", et)
	}

	nonPaymentTypes := []EventType{
		EventRefundCreated,
		EventSubscriptionCreated,
		EventDisputeCreated,
	}

	for _, et := range nonPaymentTypes {
		assert.False(t, et.IsPayment(), "%s should not be payment", et)
	}
}

func TestEventType_IsRefund(t *testing.T) {
	refundTypes := []EventType{
		EventRefundCreated,
		EventRefundSucceeded,
		EventRefundFailed,
	}

	for _, et := range refundTypes {
		assert.True(t, et.IsRefund(), "%s should be refund", et)
	}
}

func TestEventType_IsPositive(t *testing.T) {
	assert.True(t, EventPaymentSucceeded.IsPositive())
	assert.True(t, EventSubscriptionRenewed.IsPositive())
	assert.False(t, EventRefundSucceeded.IsPositive())
}

func TestEventType_IsNegative(t *testing.T) {
	assert.True(t, EventRefundSucceeded.IsNegative())
	assert.True(t, EventDisputeLost.IsNegative())
	assert.True(t, EventPayoutPaid.IsNegative())
	assert.False(t, EventPaymentSucceeded.IsNegative())
}

// ========================================
// IDEMPOTENCY SERVICE TESTS
// ========================================

func TestIdempotencyService_CheckAndReserve_New(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewIdempotencyService(db)

	result, err := service.CheckAndReserve(
		ProviderStripe,
		"evt_new123",
		uuid.New(),
		"payment.succeeded",
		[]byte(`{"test": true}`),
	)

	assert.NoError(t, err)
	assert.False(t, result.IsDuplicate)
	assert.NotNil(t, result.ProcessedWebhook)
	assert.Equal(t, "processing", result.ProcessedWebhook.Status)
}

func TestIdempotencyService_CheckAndReserve_Duplicate(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewIdempotencyService(db)

	appID := uuid.New()
	externalID := "evt_dup123"
	payload := []byte(`{"test": true}`)

	// Primeira chamada
	result1, err := service.CheckAndReserve(ProviderStripe, externalID, appID, "payment.succeeded", payload)
	assert.NoError(t, err)
	assert.False(t, result1.IsDuplicate)

	// Segunda chamada (duplicada)
	result2, err := service.CheckAndReserve(ProviderStripe, externalID, appID, "payment.succeeded", payload)
	assert.NoError(t, err)
	assert.True(t, result2.IsDuplicate)
}

func TestIdempotencyService_MarkProcessed(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewIdempotencyService(db)

	result, _ := service.CheckAndReserve(
		ProviderStripe,
		"evt_mark123",
		uuid.New(),
		"payment.succeeded",
		[]byte(`{}`),
	)

	financialEventID := uuid.New()
	err := service.MarkProcessed(result.ProcessedWebhook.ID, financialEventID)
	assert.NoError(t, err)

	// Verificar status
	found, _ := service.GetByExternalID(ProviderStripe, "evt_mark123")
	assert.Equal(t, "processed", found.Status)
	assert.NotNil(t, found.FinancialEventID)
}

func TestIdempotencyService_MarkFailed(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewIdempotencyService(db)

	result, _ := service.CheckAndReserve(
		ProviderStripe,
		"evt_fail123",
		uuid.New(),
		"payment.succeeded",
		[]byte(`{}`),
	)

	err := service.MarkFailed(result.ProcessedWebhook.ID, "Erro de processamento")
	assert.NoError(t, err)

	found, _ := service.GetByExternalID(ProviderStripe, "evt_fail123")
	assert.Equal(t, "failed", found.Status)
	assert.Equal(t, "Erro de processamento", found.ErrorMessage)
}

func TestIdempotencyService_GetStats(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewIdempotencyService(db)

	appID := uuid.New()
	since := time.Now().Add(-1 * time.Hour)

	// Criar alguns registros
	for i := 0; i < 3; i++ {
		service.CheckAndReserve(ProviderStripe, uuid.New().String(), appID, "payment.succeeded", []byte(`{}`))
	}

	stats, err := service.GetStats(since)
	assert.NoError(t, err)
	assert.Equal(t, int64(3), stats["processing"])
	assert.Equal(t, int64(3), stats["total"])
}

// ========================================
// RECONCILIATION STATUS TESTS
// ========================================

func TestReconciliationStatus_Values(t *testing.T) {
	statuses := []ReconciliationStatus{
		ReconciliationPending,
		ReconciliationRunning,
		ReconciliationMatched,
		ReconciliationMismatched,
		ReconciliationFailed,
	}

	for _, status := range statuses {
		assert.NotEmpty(t, string(status))
	}
}

// ========================================
// FINANCIAL EVENT MODEL TESTS
// ========================================

func TestFinancialEvent_TableName(t *testing.T) {
	event := FinancialEvent{}
	assert.Equal(t, "financial_events", event.TableName())
}

func TestProcessedWebhook_TableName(t *testing.T) {
	webhook := ProcessedWebhook{}
	assert.Equal(t, "processed_webhooks", webhook.TableName())
}

func TestAppFinancialMetrics_TableName(t *testing.T) {
	metrics := AppFinancialMetrics{}
	assert.Equal(t, "app_financial_metrics", metrics.TableName())
}

func TestDailyFinancialSnapshot_TableName(t *testing.T) {
	snapshot := DailyFinancialSnapshot{}
	assert.Equal(t, "daily_financial_snapshots", snapshot.TableName())
}

func TestGlobalFinancialMetrics_TableName(t *testing.T) {
	metrics := GlobalFinancialMetrics{}
	assert.Equal(t, "global_financial_metrics", metrics.TableName())
}

func TestReconciliationResult_TableName(t *testing.T) {
	result := ReconciliationResult{}
	assert.Equal(t, "reconciliation_results", result.TableName())
}

// ========================================
// PROVIDER CONSTANTS TESTS
// ========================================

func TestProviderConstants(t *testing.T) {
	assert.Equal(t, "stripe", ProviderStripe)
	assert.Equal(t, "mercadopago", ProviderMercadoPago)
	assert.Equal(t, "manual", ProviderManual)
}

// ========================================
// EVENT STATUS TESTS
// ========================================

func TestEventStatus_Values(t *testing.T) {
	statuses := []EventStatus{
		StatusPending,
		StatusProcessed,
		StatusFailed,
		StatusIgnored,
	}

	for _, status := range statuses {
		assert.NotEmpty(t, string(status))
	}
}

// ========================================
// DISCREPANCY TESTS
// ========================================

func TestDiscrepancy_Struct(t *testing.T) {
	discrepancy := Discrepancy{
		Type:          "missing_in_ledger",
		ExternalID:    "pi_123",
		LedgerValue:   0,
		ProviderValue: 10000,
		Difference:    10000,
		EventType:     "payment.succeeded",
		OccurredAt:    time.Now(),
		Details:       "Pagamento não encontrado no ledger",
	}

	assert.Equal(t, "missing_in_ledger", discrepancy.Type)
	assert.Equal(t, int64(10000), discrepancy.Difference)
}

// ========================================
// LEDGER STATS TESTS
// ========================================

func TestLedgerStats_Struct(t *testing.T) {
	stats := LedgerStats{
		Revenue: 100000,
		Refunds: 5000,
		Count:   50,
	}

	assert.Equal(t, int64(100000), stats.Revenue)
	assert.Equal(t, int64(5000), stats.Refunds)
	assert.Equal(t, int64(50), stats.Count)
}

// ========================================
// RECONCILIATION SUMMARY TESTS
// ========================================

func TestReconciliationSummary_Struct(t *testing.T) {
	now := time.Now()
	summary := ReconciliationSummary{
		TotalReconciliations: 100,
		Matched:              90,
		Mismatched:           8,
		Failed:               2,
		TotalDiscrepancies:   15,
		LastReconciliationAt: &now,
	}

	assert.Equal(t, int64(100), summary.TotalReconciliations)
	assert.Equal(t, int64(90), summary.Matched)
	assert.NotNil(t, summary.LastReconciliationAt)
}

// ========================================
// HELPER FUNCTION TESTS
// ========================================

func TestContains(t *testing.T) {
	assert.True(t, contains("UNIQUE constraint failed", "UNIQUE"))
	assert.True(t, contains("duplicate key value", "duplicate"))
	assert.False(t, contains("some error", "UNIQUE"))
}

type testError string

func (e testError) Error() string {
	return string(e)
}

func TestIsUniqueConstraintError(t *testing.T) {
	// SQLite
	sqliteErr := testError("UNIQUE constraint failed: table.column")
	assert.True(t, isUniqueConstraintError(sqliteErr))
	
	// PostgreSQL
	pgErr := testError("duplicate key value violates unique constraint")
	assert.True(t, isUniqueConstraintError(pgErr))
	
	// MySQL
	mysqlErr := testError("Duplicate entry 'value' for key 'index'")
	assert.True(t, isUniqueConstraintError(mysqlErr))
	
	// Nil error
	assert.False(t, isUniqueConstraintError(nil))
	
	// Other error
	otherErr := testError("some other error")
	assert.False(t, isUniqueConstraintError(otherErr))
}

// ========================================
// CREATE EVENT INPUT TESTS
// ========================================

func TestCreateEventInput_Struct(t *testing.T) {
	userID := uuid.New()
	parentID := uuid.New()
	
	input := CreateEventInput{
		AppID:       uuid.New(),
		Provider:    ProviderStripe,
		Type:        EventPaymentSucceeded,
		Amount:      10000,
		Currency:    "BRL",
		NetAmount:   9700,
		FeeAmount:   300,
		ExternalID:  "pi_test123",
		CustomerID:  "cus_test",
		UserID:      &userID,
		Description: "Pagamento teste",
		Metadata:    map[string]interface{}{"order_id": "123"},
		RawPayload:  []byte(`{}`),
		ParentID:    &parentID,
		OccurredAt:  time.Now(),
	}

	assert.Equal(t, int64(10000), input.Amount)
	assert.Equal(t, "BRL", input.Currency)
	assert.NotNil(t, input.UserID)
	assert.NotNil(t, input.ParentID)
}

// ========================================
// IDEMPOTENCY RESULT TESTS
// ========================================

func TestIdempotencyResult_Struct(t *testing.T) {
	webhook := &ProcessedWebhook{
		ID:              uuid.New(),
		Provider:        ProviderStripe,
		ExternalEventID: "evt_123",
		Status:          "processing",
	}

	result := IdempotencyResult{
		IsDuplicate:      false,
		ProcessedWebhook: webhook,
	}

	assert.False(t, result.IsDuplicate)
	assert.NotNil(t, result.ProcessedWebhook)
}

// ========================================
// CLEANUP TESTS
// ========================================

func TestIdempotencyService_CleanupOld(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewIdempotencyService(db)

	// Criar registro antigo
	oldWebhook := ProcessedWebhook{
		ID:              uuid.New(),
		Provider:        ProviderStripe,
		ExternalEventID: "evt_old",
		AppID:           uuid.New(),
		Status:          "processed",
		ReceivedAt:      time.Now().Add(-48 * time.Hour),
		CreatedAt:       time.Now().Add(-48 * time.Hour),
	}
	db.Create(&oldWebhook)

	// Criar registro recente
	newWebhook := ProcessedWebhook{
		ID:              uuid.New(),
		Provider:        ProviderStripe,
		ExternalEventID: "evt_new",
		AppID:           uuid.New(),
		Status:          "processed",
		ReceivedAt:      time.Now(),
		CreatedAt:       time.Now(),
	}
	db.Create(&newWebhook)

	// Limpar registros mais antigos que 24h
	deleted, err := service.CleanupOld(24 * time.Hour)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), deleted)

	// Verificar que o novo ainda existe
	var count int64
	db.Model(&ProcessedWebhook{}).Count(&count)
	assert.Equal(t, int64(1), count)
}

// ========================================
// FINANCIAL EVENT SERVICE TESTS
// ========================================

func TestFinancialEventService_CreateEvent(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()
	userID := uuid.New()

	input := CreateEventInput{
		AppID:       appID,
		Provider:    ProviderStripe,
		Type:        EventPaymentSucceeded,
		Amount:      10000,
		Currency:    "BRL",
		NetAmount:   9700,
		FeeAmount:   300,
		ExternalID:  "pi_test123",
		CustomerID:  "cus_test",
		UserID:      &userID,
		Description: "Pagamento teste",
		Metadata:    map[string]interface{}{"order_id": "123"},
		RawPayload:  []byte(`{"test": true}`),
		OccurredAt:  time.Now(),
	}

	event, err := service.CreateEvent(input)
	assert.NoError(t, err)
	assert.NotNil(t, event)
	assert.Equal(t, int64(10000), event.Amount)
	assert.Equal(t, EventPaymentSucceeded, event.Type)
	assert.Equal(t, "pi_test123", event.ExternalID)
}

func TestFinancialEventService_CreateEvent_Duplicate(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()
	input := CreateEventInput{
		AppID:      appID,
		Provider:   ProviderStripe,
		Type:       EventPaymentSucceeded,
		Amount:     10000,
		Currency:   "BRL",
		ExternalID: "pi_duplicate",
		OccurredAt: time.Now(),
	}

	// Primeira criação
	_, err := service.CreateEvent(input)
	assert.NoError(t, err)

	// Segunda criação (duplicada)
	_, err = service.CreateEvent(input)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "duplicado")
}

func TestFinancialEventService_GetEvent(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()
	input := CreateEventInput{
		AppID:      appID,
		Provider:   ProviderStripe,
		Type:       EventPaymentSucceeded,
		Amount:     5000,
		Currency:   "BRL",
		ExternalID: "pi_get_test",
		OccurredAt: time.Now(),
	}

	created, _ := service.CreateEvent(input)

	found, err := service.GetEvent(created.ID)
	assert.NoError(t, err)
	assert.Equal(t, created.ID, found.ID)
	assert.Equal(t, int64(5000), found.Amount)
}

func TestFinancialEventService_GetEventByExternalID(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()
	input := CreateEventInput{
		AppID:      appID,
		Provider:   ProviderStripe,
		Type:       EventPaymentSucceeded,
		Amount:     7500,
		Currency:   "BRL",
		ExternalID: "pi_external_test",
		OccurredAt: time.Now(),
	}

	service.CreateEvent(input)

	found, err := service.GetEventByExternalID(ProviderStripe, "pi_external_test")
	assert.NoError(t, err)
	assert.Equal(t, int64(7500), found.Amount)
}

func TestFinancialEventService_ListEventsByApp(t *testing.T) {
	db := setupReconciliationTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()

	// Criar múltiplos eventos diretamente no banco
	for i := 0; i < 5; i++ {
		event := FinancialEvent{
			ID:          uuid.New(),
			AppID:       appID,
			Provider:    ProviderStripe,
			Type:        EventPaymentSucceeded,
			Status:      StatusProcessed,
			Amount:      int64(1000 * (i + 1)),
			Currency:    "BRL",
			ExternalID:  uuid.New().String(),
			OccurredAt:  time.Now(),
			ProcessedAt: time.Now(),
			CreatedAt:   time.Now(),
		}
		db.Create(&event)
	}

	events, total, err := service.ListEventsByApp(appID, 10, 0)
	assert.NoError(t, err)
	assert.Len(t, events, 5)
	assert.Equal(t, int64(5), total)
}

func TestFinancialEventService_ListEventsByType(t *testing.T) {
	db := setupReconciliationTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()

	// Criar eventos de diferentes tipos diretamente no banco
	types := []EventType{EventPaymentSucceeded, EventPaymentSucceeded, EventRefundSucceeded}
	for i, et := range types {
		event := FinancialEvent{
			ID:          uuid.New(),
			AppID:       appID,
			Provider:    ProviderStripe,
			Type:        et,
			Status:      StatusProcessed,
			Amount:      int64(1000 * (i + 1)),
			Currency:    "BRL",
			ExternalID:  uuid.New().String(),
			OccurredAt:  time.Now(),
			ProcessedAt: time.Now(),
			CreatedAt:   time.Now(),
		}
		db.Create(&event)
	}

	payments, err := service.ListEventsByType(appID, EventPaymentSucceeded, 10)
	assert.NoError(t, err)
	assert.Len(t, payments, 2)

	refunds, err := service.ListEventsByType(appID, EventRefundSucceeded, 10)
	assert.NoError(t, err)
	assert.Len(t, refunds, 1)
}

func TestFinancialEventService_GetAppRevenue(t *testing.T) {
	db := setupReconciliationTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()
	since := time.Now().Add(-1 * time.Hour)

	// Criar pagamentos diretamente no banco
	amounts := []int64{10000, 20000, 30000}
	for _, amount := range amounts {
		event := FinancialEvent{
			ID:          uuid.New(),
			AppID:       appID,
			Provider:    ProviderStripe,
			Type:        EventPaymentSucceeded,
			Status:      StatusProcessed,
			Amount:      amount,
			Currency:    "BRL",
			ExternalID:  uuid.New().String(),
			OccurredAt:  time.Now(),
			ProcessedAt: time.Now(),
			CreatedAt:   time.Now(),
		}
		db.Create(&event)
	}

	revenue, err := service.GetAppRevenue(appID, since)
	assert.NoError(t, err)
	assert.Equal(t, int64(60000), revenue) // 10000 + 20000 + 30000
}

func TestFinancialEventService_GetAppRefunds(t *testing.T) {
	db := setupReconciliationTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()
	since := time.Now().Add(-1 * time.Hour)

	// Criar reembolsos diretamente no banco
	amounts := []int64{5000, 3000}
	for _, amount := range amounts {
		event := FinancialEvent{
			ID:          uuid.New(),
			AppID:       appID,
			Provider:    ProviderStripe,
			Type:        EventRefundSucceeded,
			Status:      StatusProcessed,
			Amount:      amount,
			Currency:    "BRL",
			ExternalID:  uuid.New().String(),
			OccurredAt:  time.Now(),
			ProcessedAt: time.Now(),
			CreatedAt:   time.Now(),
		}
		db.Create(&event)
	}

	refunds, err := service.GetAppRefunds(appID, since)
	assert.NoError(t, err)
	assert.Equal(t, int64(8000), refunds) // 5000 + 3000
}

func TestFinancialEventService_GetEventCounts(t *testing.T) {
	db := setupReconciliationTestDB(t)
	service := NewFinancialEventService(db)

	appID := uuid.New()
	since := time.Now().Add(-1 * time.Hour)

	// Criar eventos diretamente no banco (evita goroutines assíncronas)
	eventTypes := []EventType{
		EventPaymentSucceeded,
		EventPaymentSucceeded,
		EventPaymentSucceeded,
		EventRefundSucceeded,
		EventPaymentFailed,
	}

	for _, et := range eventTypes {
		event := FinancialEvent{
			ID:          uuid.New(),
			AppID:       appID,
			Provider:    ProviderStripe,
			Type:        et,
			Status:      StatusProcessed,
			Amount:      1000,
			Currency:    "BRL",
			ExternalID:  uuid.New().String(),
			OccurredAt:  time.Now(),
			ProcessedAt: time.Now(),
			CreatedAt:   time.Now(),
		}
		db.Create(&event)
	}

	counts, err := service.GetEventCounts(appID, since)
	assert.NoError(t, err)
	assert.Equal(t, int64(3), counts[EventPaymentSucceeded])
	assert.Equal(t, int64(1), counts[EventRefundSucceeded])
	assert.Equal(t, int64(1), counts[EventPaymentFailed])
}

// ========================================
// METRICS SERVICE TESTS
// ========================================

func TestMetricsService_GetAppMetrics_Empty(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewMetricsService(db)

	appID := uuid.New()
	metrics, err := service.GetAppMetrics(appID)

	assert.NoError(t, err)
	assert.NotNil(t, metrics)
	assert.Equal(t, appID, metrics.AppID)
	assert.Equal(t, int64(0), metrics.TotalRevenue)
}

func TestMetricsService_GetAppMetrics_WithData(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewMetricsService(db)

	appID := uuid.New()

	// Criar métricas
	metrics := AppFinancialMetrics{
		ID:              uuid.New(),
		AppID:           appID,
		TotalRevenue:    100000,
		TotalRefunds:    5000,
		TotalFees:       3000,
		NetRevenue:      92000,
		PaymentsSuccess: 50,
		PaymentsFailed:  5,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	db.Create(&metrics)

	found, err := service.GetAppMetrics(appID)
	assert.NoError(t, err)
	assert.Equal(t, int64(100000), found.TotalRevenue)
	assert.Equal(t, int64(50), found.PaymentsSuccess)
}

func TestMetricsService_GetGlobalMetrics_Empty(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewMetricsService(db)

	metrics, err := service.GetGlobalMetrics()
	assert.NoError(t, err)
	assert.NotNil(t, metrics)
	assert.Equal(t, int64(0), metrics.TotalRevenue)
}

func TestMetricsService_GetGlobalMetrics_WithData(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewMetricsService(db)

	// Criar métricas globais
	global := GlobalFinancialMetrics{
		ID:            uuid.New(),
		TotalRevenue:  500000,
		TotalRefunds:  25000,
		TotalFees:     15000,
		NetRevenue:    460000,
		TotalPayments: 200,
		UpdatedAt:     time.Now(),
	}
	db.Create(&global)

	metrics, err := service.GetGlobalMetrics()
	assert.NoError(t, err)
	assert.Equal(t, int64(500000), metrics.TotalRevenue)
	assert.Equal(t, int64(200), metrics.TotalPayments)
}

func TestMetricsService_GetDailySnapshots(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewMetricsService(db)

	appID := uuid.New()
	today := time.Now().Truncate(24 * time.Hour)

	// Criar snapshots
	for i := 0; i < 7; i++ {
		snapshot := DailyFinancialSnapshot{
			ID:              uuid.New(),
			AppID:           appID,
			Date:            today.AddDate(0, 0, -i),
			Revenue:         int64(10000 * (i + 1)),
			PaymentsSuccess: int64(10 * (i + 1)),
			CreatedAt:       time.Now(),
		}
		db.Create(&snapshot)
	}

	snapshots, err := service.GetDailySnapshots(appID, 7)
	assert.NoError(t, err)
	assert.Len(t, snapshots, 7)
}

func TestMetricsService_GetTopAppsByRevenue(t *testing.T) {
	db := setupFinancialTestDB(t)
	service := NewMetricsService(db)

	// Criar métricas para múltiplos apps
	revenues := []int64{100000, 50000, 200000, 75000}
	for _, revenue := range revenues {
		metrics := AppFinancialMetrics{
			ID:              uuid.New(),
			AppID:           uuid.New(),
			TotalRevenue:    revenue,
			NetRevenue:      revenue - 1000,
			PaymentsSuccess: revenue / 1000,
			CreatedAt:       time.Now(),
		}
		db.Create(&metrics)
	}

	top, err := service.GetTopAppsByRevenue(3)
	assert.NoError(t, err)
	assert.Len(t, top, 3)
	assert.Equal(t, int64(200000), top[0].TotalRevenue) // Maior primeiro
}

func TestMetricsService_RecalculateAppMetrics(t *testing.T) {
	db := setupReconciliationTestDB(t)
	metricsService := NewMetricsService(db)

	appID := uuid.New()

	// Criar eventos diretamente no banco
	payments := []int64{10000, 20000, 30000}
	for _, amount := range payments {
		event := FinancialEvent{
			ID:          uuid.New(),
			AppID:       appID,
			Provider:    ProviderStripe,
			Type:        EventPaymentSucceeded,
			Status:      StatusProcessed,
			Amount:      amount,
			FeeAmount:   amount / 100 * 3, // 3% fee
			Currency:    "BRL",
			ExternalID:  uuid.New().String(),
			OccurredAt:  time.Now(),
			ProcessedAt: time.Now(),
			CreatedAt:   time.Now(),
		}
		db.Create(&event)
	}

	// Criar um reembolso
	refundEvent := FinancialEvent{
		ID:          uuid.New(),
		AppID:       appID,
		Provider:    ProviderStripe,
		Type:        EventRefundSucceeded,
		Status:      StatusProcessed,
		Amount:      5000,
		Currency:    "BRL",
		ExternalID:  uuid.New().String(),
		OccurredAt:  time.Now(),
		ProcessedAt: time.Now(),
		CreatedAt:   time.Now(),
	}
	db.Create(&refundEvent)

	// Recalcular métricas
	err := metricsService.RecalculateAppMetrics(appID)
	assert.NoError(t, err)

	// Verificar métricas recalculadas
	metrics, err := metricsService.GetAppMetrics(appID)
	assert.NoError(t, err)
	assert.Equal(t, int64(60000), metrics.TotalRevenue) // 10000 + 20000 + 30000
	assert.Equal(t, int64(5000), metrics.TotalRefunds)
	assert.Equal(t, int64(3), metrics.PaymentsSuccess)
	assert.Equal(t, int64(1), metrics.RefundsCount)
}

// ========================================
// RECONCILIATION SERVICE TESTS
// ========================================

func TestReconciliationService_ReconcileApp_NoEvents(t *testing.T) {
	db := setupFinancialTestDB(t)
	eventService := NewFinancialEventService(db)
	service := NewReconciliationService(db, eventService)

	appID := uuid.New()
	periodStart := time.Now().Add(-24 * time.Hour)
	periodEnd := time.Now()

	result, err := service.ReconcileApp(appID, periodStart, periodEnd, "test_user")
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, ReconciliationMatched, result.Status)
	assert.Equal(t, int64(0), result.LedgerRevenue)
}

func TestReconciliationService_ReconcileApp_WithEvents(t *testing.T) {
	db := setupReconciliationTestDB(t)
	eventService := NewFinancialEventService(db)
	service := NewReconciliationService(db, eventService)

	appID := uuid.New()
	periodStart := time.Now().Add(-24 * time.Hour)
	periodEnd := time.Now().Add(1 * time.Hour)

	// Criar eventos diretamente no banco (para evitar async updates)
	for i := 0; i < 3; i++ {
		event := FinancialEvent{
			ID:          uuid.New(),
			AppID:       appID,
			Provider:    ProviderStripe,
			Type:        EventPaymentSucceeded,
			Status:      StatusProcessed,
			Amount:      10000,
			Currency:    "BRL",
			ExternalID:  uuid.New().String(),
			OccurredAt:  time.Now(),
			ProcessedAt: time.Now(),
			CreatedAt:   time.Now(),
		}
		db.Create(&event)
	}

	result, err := service.ReconcileApp(appID, periodStart, periodEnd, "test_user")
	assert.NoError(t, err)
	assert.Equal(t, int64(30000), result.LedgerRevenue)
	assert.Equal(t, int64(3), result.LedgerCount)
}

func TestReconciliationService_GetReconciliationResult(t *testing.T) {
	db := setupFinancialTestDB(t)
	eventService := NewFinancialEventService(db)
	service := NewReconciliationService(db, eventService)

	appID := uuid.New()
	periodStart := time.Now().Add(-24 * time.Hour)
	periodEnd := time.Now()

	created, _ := service.ReconcileApp(appID, periodStart, periodEnd, "test_user")

	found, err := service.GetReconciliationResult(created.ID)
	assert.NoError(t, err)
	assert.Equal(t, created.ID, found.ID)
}

func TestReconciliationService_ListReconciliations(t *testing.T) {
	db := setupFinancialTestDB(t)
	eventService := NewFinancialEventService(db)
	service := NewReconciliationService(db, eventService)

	appID := uuid.New()

	// Criar múltiplas reconciliações
	for i := 0; i < 3; i++ {
		periodStart := time.Now().Add(-time.Duration(24*(i+1)) * time.Hour)
		periodEnd := time.Now().Add(-time.Duration(24*i) * time.Hour)
		service.ReconcileApp(appID, periodStart, periodEnd, "test_user")
	}

	results, err := service.ListReconciliations(appID, 10)
	assert.NoError(t, err)
	assert.Len(t, results, 3)
}

func TestReconciliationService_GetLastReconciliation(t *testing.T) {
	db := setupFinancialTestDB(t)
	eventService := NewFinancialEventService(db)
	service := NewReconciliationService(db, eventService)

	appID := uuid.New()

	// Criar reconciliações
	for i := 0; i < 3; i++ {
		periodStart := time.Now().Add(-time.Duration(24*(i+1)) * time.Hour)
		periodEnd := time.Now().Add(-time.Duration(24*i) * time.Hour)
		service.ReconcileApp(appID, periodStart, periodEnd, "test_user")
	}

	last, err := service.GetLastReconciliation(appID)
	assert.NoError(t, err)
	assert.NotNil(t, last)
}

func TestReconciliationService_GetReconciliationSummary(t *testing.T) {
	db := setupFinancialTestDB(t)
	eventService := NewFinancialEventService(db)
	service := NewReconciliationService(db, eventService)

	// Criar reconciliações para diferentes apps
	for i := 0; i < 5; i++ {
		appID := uuid.New()
		periodStart := time.Now().Add(-24 * time.Hour)
		periodEnd := time.Now()
		service.ReconcileApp(appID, periodStart, periodEnd, "test_user")
	}

	summary, err := service.GetReconciliationSummary()
	assert.NoError(t, err)
	assert.Equal(t, int64(5), summary.TotalReconciliations)
	assert.NotNil(t, summary.LastReconciliationAt)
}

func TestReconciliationService_GetDiscrepancies(t *testing.T) {
	db := setupFinancialTestDB(t)
	eventService := NewFinancialEventService(db)
	service := NewReconciliationService(db, eventService)

	appID := uuid.New()

	// Criar evento com valor negativo (vai gerar discrepância)
	event := FinancialEvent{
		ID:         uuid.New(),
		AppID:      appID,
		Provider:   ProviderStripe,
		Type:       EventPaymentSucceeded,
		Amount:     -1000, // Valor negativo inválido
		Currency:   "BRL",
		ExternalID: "pi_negative",
		OccurredAt: time.Now(),
		CreatedAt:  time.Now(),
	}
	db.Create(&event)

	periodStart := time.Now().Add(-24 * time.Hour)
	periodEnd := time.Now().Add(1 * time.Hour)

	result, _ := service.ReconcileApp(appID, periodStart, periodEnd, "test_user")

	discrepancies, err := service.GetDiscrepancies(result)
	assert.NoError(t, err)
	assert.Greater(t, len(discrepancies), 0)
}

// ========================================
// APP METRICS RESPONSE TESTS
// ========================================

func TestAppMetricsResponse_Struct(t *testing.T) {
	now := time.Now()
	resp := AppMetricsResponse{
		AppID:               uuid.New(),
		TotalRevenue:        100000,
		TotalRefunds:        5000,
		TotalFees:           3000,
		NetRevenue:          92000,
		PaymentsSuccess:     50,
		PaymentsFailed:      5,
		RefundsCount:        3,
		DisputesCount:       1,
		ActiveSubscriptions: 10,
		RevenueToday:        5000,
		Revenue7d:           35000,
		Revenue30d:          100000,
		LastPaymentAt:       &now,
		LastEventAt:         &now,
	}

	assert.Equal(t, int64(100000), resp.TotalRevenue)
	assert.Equal(t, int64(92000), resp.NetRevenue)
	assert.NotNil(t, resp.LastPaymentAt)
}

func TestGlobalMetricsResponse_Struct(t *testing.T) {
	resp := GlobalMetricsResponse{
		TotalRevenue:  500000,
		TotalRefunds:  25000,
		TotalFees:     15000,
		NetRevenue:    460000,
		TotalPayments: 200,
		TotalApps:     10,
		ActiveApps:    8,
		RevenueToday:  10000,
		Revenue7d:     70000,
		Revenue30d:    300000,
		VolumeToday:   50,
		Volume7d:      350,
		Volume30d:     1500,
		UpdatedAt:     time.Now(),
	}

	assert.Equal(t, int64(500000), resp.TotalRevenue)
	assert.Equal(t, int64(10), resp.TotalApps)
}

func TestGlobalDailySnapshot_Struct(t *testing.T) {
	snapshot := GlobalDailySnapshot{
		Date:            time.Now().Truncate(24 * time.Hour),
		Revenue:         50000,
		Refunds:         2500,
		NetRevenue:      47500,
		PaymentsSuccess: 25,
	}

	assert.Equal(t, int64(50000), snapshot.Revenue)
	assert.Equal(t, int64(25), snapshot.PaymentsSuccess)
}

func TestAppRevenueRank_Struct(t *testing.T) {
	rank := AppRevenueRank{
		AppID:           uuid.New(),
		TotalRevenue:    100000,
		NetRevenue:      95000,
		PaymentsSuccess: 50,
	}

	assert.Equal(t, int64(100000), rank.TotalRevenue)
	assert.Equal(t, int64(50), rank.PaymentsSuccess)
}
