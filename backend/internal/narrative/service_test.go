package narrative

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupNarrativeTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&FailureNarrative{})
	return db
}

func createNarrativeTestService(t *testing.T, db *gorm.DB) *NarrativeService {
	return NewNarrativeService(db)
}

// ===========================================
// CREATE TESTS
// ===========================================

func TestCreate(t *testing.T) {
	db := setupNarrativeTestDB(t)
	service := createNarrativeTestService(t, db)
	appID := uuid.New()
	narrative := NewNarrative(appID).
		What("Deploy failed").
		Where("Build phase").
		Why("Compilation error").
		Build()
	err := service.Create(narrative)
	assert.NoError(t, err)
}

func TestCreateFromTemplate(t *testing.T) {
	db := setupNarrativeTestDB(t)
	service := createNarrativeTestService(t, db)
	appID := uuid.New()
	details := map[string]string{
		"app_name": "MyApp",
		"error":    "npm install failed",
		"context":  "Missing dependencies",
	}
	narrative, err := service.CreateFromTemplate("deploy_build_failed", appID, details)
	assert.NoError(t, err)
	assert.NotNil(t, narrative)
	assert.Contains(t, narrative.What, "MyApp")
}

func TestCreateFromTemplateNotFound(t *testing.T) {
	db := setupNarrativeTestDB(t)
	service := createNarrativeTestService(t, db)
	_, err := service.CreateFromTemplate("nonexistent", uuid.New(), nil)
	assert.Error(t, err)
}

// ===========================================
// GET TESTS
// ===========================================

func TestGetByApp(t *testing.T) {
	db := setupNarrativeTestDB(t)
	service := createNarrativeTestService(t, db)
	appID := uuid.New()
	for i := 0; i < 5; i++ {
		service.Create(NewNarrative(appID).What("Test").Where("Test").Why("Test").Build())
	}
	narratives, err := service.GetByApp(appID, 10)
	assert.NoError(t, err)
	assert.Len(t, narratives, 5)
}

func TestGetOpen(t *testing.T) {
	db := setupNarrativeTestDB(t)
	service := createNarrativeTestService(t, db)
	appID := uuid.New()
	for i := 0; i < 3; i++ {
		service.Create(NewNarrative(appID).What("Test").Where("Test").Why("Test").Build())
	}
	narratives, err := service.GetOpen(appID)
	assert.NoError(t, err)
	assert.Len(t, narratives, 3)
}

// ===========================================
// STATUS TESTS
// ===========================================

func TestAcknowledge(t *testing.T) {
	db := setupNarrativeTestDB(t)
	service := createNarrativeTestService(t, db)
	appID := uuid.New()
	narrative := NewNarrative(appID).What("Test").Where("Test").Why("Test").Build()
	service.Create(narrative)
	err := service.Acknowledge(narrative.ID)
	assert.NoError(t, err)
	narratives, _ := service.GetOpen(appID)
	assert.Len(t, narratives, 0)
}

func TestResolve(t *testing.T) {
	db := setupNarrativeTestDB(t)
	service := createNarrativeTestService(t, db)
	appID := uuid.New()
	resolverID := uuid.New()
	narrative := NewNarrative(appID).What("Test").Where("Test").Why("Test").Build()
	service.Create(narrative)
	err := service.Resolve(narrative.ID, resolverID)
	assert.NoError(t, err)
	narratives, _ := service.GetOpen(appID)
	assert.Len(t, narratives, 0)
}

func TestGetStats(t *testing.T) {
	db := setupNarrativeTestDB(t)
	service := createNarrativeTestService(t, db)
	appID := uuid.New()
	for i := 0; i < 3; i++ {
		service.Create(NewNarrative(appID).What("Test").Where("Test").Why("Test").Build())
	}
	stats, err := service.GetStats(appID)
	assert.NoError(t, err)
	assert.Equal(t, 3, stats["total"])
	assert.Equal(t, 3, stats["open"])
}


// ===========================================
// MODEL TESTS
// ===========================================

func TestFailureNarrativeTableName(t *testing.T) {
	assert.Equal(t, "failure_narratives", FailureNarrative{}.TableName())
}

func TestNarrativeBuilder(t *testing.T) {
	appID := uuid.New()
	deployID := uuid.New()
	narrative := NewNarrative(appID).
		What("Deploy failed").
		Where("Build phase").
		Why("Compilation error").
		Context("Missing package").
		ActionTaken("Rollback").
		NextStep("Fix code").
		Severity("error").
		DeployID(deployID).
		ContainerID("container-123").
		Build()
	assert.Equal(t, "Deploy failed", narrative.What)
	assert.Equal(t, "Build phase", narrative.Where)
	assert.Equal(t, "Compilation error", narrative.Why)
	assert.Equal(t, "Missing package", narrative.Context)
	assert.Equal(t, "Rollback", narrative.ActionTaken)
	assert.Equal(t, "Fix code", narrative.NextStep)
	assert.Equal(t, "error", narrative.Severity)
	assert.Equal(t, deployID, *narrative.DeployID)
	assert.Equal(t, "container-123", narrative.ContainerID)
}

func TestCommonNarratives(t *testing.T) {
	assert.Contains(t, CommonNarratives, "deploy_build_failed")
	assert.Contains(t, CommonNarratives, "deploy_infra_failed")
	assert.Contains(t, CommonNarratives, "container_crash")
	assert.Contains(t, CommonNarratives, "container_oom")
	assert.Contains(t, CommonNarratives, "health_check_failed")
}

func TestCommonNarrativeDeployBuildFailed(t *testing.T) {
	appID := uuid.New()
	details := map[string]string{
		"app_name": "TestApp",
		"error":    "npm error",
		"context":  "build context",
	}
	narrative := CommonNarratives["deploy_build_failed"](appID, details)
	assert.Contains(t, narrative.What, "TestApp")
	assert.Equal(t, "Fase de build", narrative.Where)
	assert.Equal(t, "error", narrative.Severity)
}

func TestCommonNarrativeContainerCrash(t *testing.T) {
	appID := uuid.New()
	details := map[string]string{
		"app_name":  "TestApp",
		"exit_code": "137",
		"logs":      "some logs",
	}
	narrative := CommonNarratives["container_crash"](appID, details)
	assert.Contains(t, narrative.What, "crashou")
	assert.Contains(t, narrative.Why, "137")
}

func TestCommonNarrativeContainerOOM(t *testing.T) {
	appID := uuid.New()
	details := map[string]string{
		"app_name":     "TestApp",
		"memory_limit": "512MB",
	}
	narrative := CommonNarratives["container_oom"](appID, details)
	assert.Contains(t, narrative.Why, "OOM")
	assert.Contains(t, narrative.Context, "512MB")
}

func TestCommonNarrativeHealthCheckFailed(t *testing.T) {
	appID := uuid.New()
	details := map[string]string{
		"app_name": "TestApp",
		"timeout":  "30s",
		"attempts": "3",
	}
	narrative := CommonNarratives["health_check_failed"](appID, details)
	assert.Contains(t, narrative.What, "Health check")
	assert.Equal(t, "warning", narrative.Severity)
}

func TestNarrativeDefaultValues(t *testing.T) {
	appID := uuid.New()
	narrative := NewNarrative(appID).Build()
	assert.Equal(t, "error", narrative.Severity)
	assert.Equal(t, "open", narrative.Status)
	assert.NotEqual(t, uuid.Nil, narrative.ID)
	assert.False(t, narrative.When.IsZero())
}
