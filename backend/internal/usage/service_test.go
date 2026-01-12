package usage

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupUsageTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&UsageRecord{})
	return db
}

func createUsageTestService(t *testing.T, db *gorm.DB) *UsageService {
	return NewUsageService(db)
}

// ===========================================
// GET OR CREATE PERIOD TESTS
// ===========================================

func TestGetOrCreateCurrentPeriod(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	record, err := service.GetOrCreateCurrentPeriod(appID)
	assert.NoError(t, err)
	assert.NotNil(t, record)
	assert.Equal(t, appID, record.AppID)
}

func TestGetOrCreateCurrentPeriodIdempotent(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	record1, _ := service.GetOrCreateCurrentPeriod(appID)
	record2, _ := service.GetOrCreateCurrentPeriod(appID)
	assert.Equal(t, record1.ID, record2.ID)
}

// ===========================================
// INCREMENT TESTS
// ===========================================

func TestIncrementDeploySuccess(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	err := service.IncrementDeploy(appID, true)
	assert.NoError(t, err)
	record, _ := service.GetOrCreateCurrentPeriod(appID)
	assert.Equal(t, 1, record.DeployCount)
	assert.Equal(t, 1, record.DeploySuccessful)
	assert.Equal(t, 0, record.DeployFailed)
}

func TestIncrementDeployFailed(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	err := service.IncrementDeploy(appID, false)
	assert.NoError(t, err)
	record, _ := service.GetOrCreateCurrentPeriod(appID)
	assert.Equal(t, 1, record.DeployCount)
	assert.Equal(t, 0, record.DeploySuccessful)
	assert.Equal(t, 1, record.DeployFailed)
}

func TestIncrementTelemetry(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	err := service.IncrementTelemetry(appID, 100)
	assert.NoError(t, err)
	record, _ := service.GetOrCreateCurrentPeriod(appID)
	assert.Equal(t, 100, record.TelemetryEvents)
}

func TestIncrementWebhook(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	for i := 0; i < 5; i++ {
		service.IncrementWebhook(appID)
	}
	record, _ := service.GetOrCreateCurrentPeriod(appID)
	assert.Equal(t, 5, record.WebhookCalls)
}

func TestIncrementCrash(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	service.IncrementCrash(appID)
	service.IncrementCrash(appID)
	record, _ := service.GetOrCreateCurrentPeriod(appID)
	assert.Equal(t, 2, record.CrashCount)
}

func TestIncrementRetry(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	service.IncrementRetry(appID)
	record, _ := service.GetOrCreateCurrentPeriod(appID)
	assert.Equal(t, 1, record.RetryCount)
}

func TestAddContainerTime(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	err := service.AddContainerTime(appID, 10.5, 5.0, 2.5)
	assert.NoError(t, err)
	record, _ := service.GetOrCreateCurrentPeriod(appID)
	assert.Equal(t, 10.5, record.ContainerHours)
	assert.Equal(t, 5.0, record.CPUHours)
	assert.Equal(t, 2.5, record.MemoryGBHours)
}


// ===========================================
// GET USAGE TESTS
// ===========================================

func TestGetUsage(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	service.GetOrCreateCurrentPeriod(appID)
	now := time.Now()
	period := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	record, err := service.GetUsage(appID, period)
	assert.NoError(t, err)
	assert.NotNil(t, record)
}

func TestGetUsageNotFound(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	oldPeriod := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
	_, err := service.GetUsage(appID, oldPeriod)
	assert.Error(t, err)
}

func TestGetUsageHistory(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	service.GetOrCreateCurrentPeriod(appID)
	records, err := service.GetUsageHistory(appID, 12)
	assert.NoError(t, err)
	assert.Len(t, records, 1)
}

// ===========================================
// CHECK LIMIT TESTS
// ===========================================

func TestCheckLimitFree(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	allowed, current, max := service.CheckLimit(appID, "free", "deploys")
	assert.True(t, allowed)
	assert.Equal(t, 0, current)
	assert.Equal(t, 5, max)
}

func TestCheckLimitEnterprise(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	allowed, _, max := service.CheckLimit(appID, "enterprise", "deploys")
	assert.True(t, allowed)
	assert.Equal(t, -1, max)
}

func TestCheckLimitUnknownResource(t *testing.T) {
	db := setupUsageTestDB(t)
	service := createUsageTestService(t, db)
	appID := uuid.New()
	allowed, _, _ := service.CheckLimit(appID, "free", "unknown")
	assert.True(t, allowed)
}

// ===========================================
// PLAN LIMITS TESTS
// ===========================================

func TestGetLimitFree(t *testing.T) {
	limit := GetLimit("free")
	assert.Equal(t, "free", limit.PlanID)
	assert.Equal(t, 1, limit.MaxApps)
	assert.Equal(t, 5, limit.MaxDeploysPerDay)
}

func TestGetLimitPro(t *testing.T) {
	limit := GetLimit("pro")
	assert.Equal(t, "pro", limit.PlanID)
	assert.Equal(t, 10, limit.MaxApps)
	assert.Equal(t, 50, limit.MaxDeploysPerDay)
}

func TestGetLimitEnterprise(t *testing.T) {
	limit := GetLimit("enterprise")
	assert.Equal(t, "enterprise", limit.PlanID)
	assert.Equal(t, -1, limit.MaxApps)
	assert.Equal(t, -1, limit.MaxDeploysPerDay)
}

func TestGetLimitUnknownPlan(t *testing.T) {
	limit := GetLimit("unknown")
	assert.Equal(t, "free", limit.PlanID)
}

// ===========================================
// MODEL TESTS
// ===========================================

func TestUsageRecordTableName(t *testing.T) {
	assert.Equal(t, "usage_records", UsageRecord{}.TableName())
}

func TestPlanLimitsExist(t *testing.T) {
	assert.Contains(t, PlanLimits, "free")
	assert.Contains(t, PlanLimits, "pro")
	assert.Contains(t, PlanLimits, "enterprise")
}
