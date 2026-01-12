package autonomy

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupAutonomyTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&AutonomyProfile{})
	require.NoError(t, err)

	return db
}

// ========================================
// MATRIX TESTS
// ========================================

func TestGetActionDefinition(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)

	// Buscar ação específica
	def, err := service.GetActionDefinition("ads", "pause_campaign")
	require.NoError(t, err)
	assert.Equal(t, "pause_campaign", def.Action)
	assert.Equal(t, "ads", def.Domain)
	assert.Equal(t, AutonomyAudited, def.MaxAutonomy)
}

func TestGetActionDefinition_Generic(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)

	// Buscar ação genérica (domain = "*")
	def, err := service.GetActionDefinition("any", "read_data")
	require.NoError(t, err)
	assert.Equal(t, "read_data", def.Action)
	assert.Equal(t, "*", def.Domain)
	assert.Equal(t, AutonomyFull, def.MaxAutonomy)
}

func TestGetActionDefinition_NotFound(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)

	_, err := service.GetActionDefinition("unknown", "unknown_action")
	assert.ErrorIs(t, err, ErrActionNotDefined)
}


func TestGetAllDefinitions(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)

	defs := service.GetAllDefinitions()
	assert.NotEmpty(t, defs)
	assert.GreaterOrEqual(t, len(defs), 8) // Pelo menos as definições padrão
}

// ========================================
// PROFILE TESTS
// ========================================

func TestCreateProfile(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()
	createdBy := uuid.New()

	profile, err := service.CreateProfile(agentID, createdBy, AutonomyShadow, "Test profile")
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, profile.ID)
	assert.Equal(t, agentID, profile.AgentID)
	assert.Equal(t, AutonomyShadow, profile.BaseLevel)
	assert.Equal(t, createdBy, profile.CreatedBy)
	assert.Equal(t, "Test profile", profile.Reason)
	assert.Equal(t, 100, profile.MaxDailyActions)
	assert.Equal(t, int64(10000), profile.MaxAmountPerAction)
}

func TestGetProfile(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()
	createdBy := uuid.New()

	// Criar profile
	created, err := service.CreateProfile(agentID, createdBy, AutonomyAudited, "Test")
	require.NoError(t, err)

	// Buscar
	found, err := service.GetProfile(agentID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, found.ID)
	assert.Equal(t, AutonomyAudited, found.BaseLevel)
}

func TestGetProfile_NotFound(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)

	_, err := service.GetProfile(uuid.New())
	assert.ErrorIs(t, err, ErrNoAutonomyProfile)
}

func TestUpdateProfile(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()
	createdBy := uuid.New()

	profile, err := service.CreateProfile(agentID, createdBy, AutonomyShadow, "Test")
	require.NoError(t, err)

	// Atualizar
	profile.BaseLevel = AutonomyAudited
	profile.MaxDailyActions = 200
	err = service.UpdateProfile(profile)
	require.NoError(t, err)

	// Verificar
	updated, err := service.GetProfile(agentID)
	require.NoError(t, err)
	assert.Equal(t, AutonomyAudited, updated.BaseLevel)
	assert.Equal(t, 200, updated.MaxDailyActions)
}

func TestSetActionOverride(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()
	createdBy := uuid.New()

	_, err := service.CreateProfile(agentID, createdBy, AutonomyShadow, "Test")
	require.NoError(t, err)

	// Definir override para ação genérica (domain = "*")
	err = service.SetActionOverride(agentID, "read_data", AutonomyFull)
	require.NoError(t, err)

	// Verificar
	profile, err := service.GetProfile(agentID)
	require.NoError(t, err)
	assert.Equal(t, AutonomyFull, profile.ActionOverrides["read_data"])
}

func TestSetActionOverride_ExceedsMax(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()
	createdBy := uuid.New()

	_, err := service.CreateProfile(agentID, createdBy, AutonomyShadow, "Test")
	require.NoError(t, err)

	// Tentar definir override acima do máximo permitido
	// update_config tem MaxAutonomy = Shadow, tentar definir como Full
	err = service.SetActionOverride(agentID, "update_config", AutonomyFull)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "excede máximo")
}


// ========================================
// CHECK TESTS (CORE)
// ========================================

func TestCheck_ForbiddenAction(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()

	req := AutonomyCheckRequest{
		AgentID: agentID,
		Action:  "transfer_funds",
		Domain:  "billing",
	}

	resp, err := service.Check(req)
	require.NoError(t, err)
	assert.False(t, resp.Allowed)
	assert.Equal(t, AutonomyForbidden, resp.AutonomyLevel)
	assert.True(t, resp.RequiresHuman)
}

func TestCheck_NoProfile_ShadowOnly(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()

	req := AutonomyCheckRequest{
		AgentID: agentID,
		Action:  "pause_campaign",
		Domain:  "ads",
	}

	resp, err := service.Check(req)
	require.NoError(t, err)
	assert.True(t, resp.Allowed)
	assert.Equal(t, AutonomyShadow, resp.AutonomyLevel)
	assert.True(t, resp.ShadowOnly)
	assert.Contains(t, resp.Reason, "sem perfil")
}

func TestCheck_WithProfile(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()
	createdBy := uuid.New()

	// Criar profile com nível audited
	_, err := service.CreateProfile(agentID, createdBy, AutonomyAudited, "Test")
	require.NoError(t, err)

	req := AutonomyCheckRequest{
		AgentID: agentID,
		Action:  "pause_campaign",
		Domain:  "ads",
	}

	resp, err := service.Check(req)
	require.NoError(t, err)
	assert.True(t, resp.Allowed)
	assert.Equal(t, AutonomyAudited, resp.AutonomyLevel)
	assert.False(t, resp.ShadowOnly)
}

func TestCheck_AmountExceedsLimit(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()
	createdBy := uuid.New()

	// Criar profile com limite de 10000 centavos (R$ 100)
	_, err := service.CreateProfile(agentID, createdBy, AutonomyAudited, "Test")
	require.NoError(t, err)

	req := AutonomyCheckRequest{
		AgentID: agentID,
		Action:  "pause_campaign",
		Domain:  "ads",
		Amount:  50000, // R$ 500 - acima do limite
	}

	resp, err := service.Check(req)
	require.NoError(t, err)
	assert.False(t, resp.Allowed)
	assert.True(t, resp.RequiresHuman)
	assert.Contains(t, resp.Reason, "excede limite")
}

func TestCheck_ReadData_FullAutonomy(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()
	createdBy := uuid.New()

	_, err := service.CreateProfile(agentID, createdBy, AutonomyFull, "Test")
	require.NoError(t, err)

	req := AutonomyCheckRequest{
		AgentID: agentID,
		Action:  "read_data",
		Domain:  "any",
	}

	resp, err := service.Check(req)
	require.NoError(t, err)
	assert.True(t, resp.Allowed)
	assert.Equal(t, AutonomyFull, resp.AutonomyLevel)
	assert.False(t, resp.RequiresHuman)
	assert.False(t, resp.ShadowOnly)
}

// ========================================
// VALIDATION TESTS
// ========================================

func TestValidateAgentCanAttempt(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()

	// Ação válida
	err := service.ValidateAgentCanAttempt(agentID, "ads", "pause_campaign")
	assert.NoError(t, err)
}

func TestValidateAgentCanAttempt_ActionNotDefined(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()

	err := service.ValidateAgentCanAttempt(agentID, "unknown", "unknown_action")
	assert.ErrorIs(t, err, ErrActionNotDefined)
}

func TestValidateAgentCanAttempt_Forbidden(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)
	agentID := uuid.New()

	err := service.ValidateAgentCanAttempt(agentID, "billing", "transfer_funds")
	assert.ErrorIs(t, err, ErrAutonomyForbidden)
}


// ========================================
// QUERY TESTS
// ========================================

func TestGetForbiddenActions(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)

	forbidden := service.GetForbiddenActions()
	assert.NotEmpty(t, forbidden)

	// Verificar que todas são realmente forbidden
	for _, def := range forbidden {
		assert.Equal(t, AutonomyForbidden, def.MaxAutonomy)
	}

	// Verificar que transfer_funds está na lista
	found := false
	for _, def := range forbidden {
		if def.Action == "transfer_funds" {
			found = true
			break
		}
	}
	assert.True(t, found, "transfer_funds deveria estar na lista de forbidden")
}

func TestGetShadowOnlyActions(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)

	shadowOnly := service.GetShadowOnlyActions()
	
	// Verificar que todas são shadow only
	for _, def := range shadowOnly {
		assert.Equal(t, AutonomyShadow, def.MaxAutonomy)
	}
}

func TestGetAutonomousActions(t *testing.T) {
	db := setupAutonomyTestDB(t)
	service := NewAutonomyService(db)

	autonomous := service.GetAutonomousActions()
	assert.NotEmpty(t, autonomous)

	// Verificar que todas podem executar
	for _, def := range autonomous {
		assert.GreaterOrEqual(t, def.MaxAutonomy, AutonomyAudited)
	}
}

// ========================================
// MODEL TESTS
// ========================================

func TestAutonomyLevel_String(t *testing.T) {
	tests := []struct {
		level    AutonomyLevel
		expected string
	}{
		{AutonomyForbidden, "forbidden"},
		{AutonomyShadow, "shadow"},
		{AutonomyAudited, "audited"},
		{AutonomyFull, "full"},
		{AutonomyLevel(99), "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.level.String())
		})
	}
}

func TestAutonomyLevel_CanExecute(t *testing.T) {
	assert.False(t, AutonomyForbidden.CanExecute())
	assert.False(t, AutonomyShadow.CanExecute())
	assert.True(t, AutonomyAudited.CanExecute())
	assert.True(t, AutonomyFull.CanExecute())
}

func TestAutonomyLevel_RequiresAudit(t *testing.T) {
	assert.False(t, AutonomyForbidden.RequiresAudit())
	assert.False(t, AutonomyShadow.RequiresAudit())
	assert.True(t, AutonomyAudited.RequiresAudit())
	assert.False(t, AutonomyFull.RequiresAudit())
}

func TestAutonomyLevel_IsShadowOnly(t *testing.T) {
	assert.False(t, AutonomyForbidden.IsShadowOnly())
	assert.True(t, AutonomyShadow.IsShadowOnly())
	assert.False(t, AutonomyAudited.IsShadowOnly())
	assert.False(t, AutonomyFull.IsShadowOnly())
}

func TestAutonomyProfile_GetActionLevel(t *testing.T) {
	profile := &AutonomyProfile{
		BaseLevel: AutonomyShadow,
		ActionOverrides: map[string]AutonomyLevel{
			"pause_campaign": AutonomyAudited,
		},
	}

	// Com override
	assert.Equal(t, AutonomyAudited, profile.GetActionLevel("pause_campaign"))

	// Sem override - usa base
	assert.Equal(t, AutonomyShadow, profile.GetActionLevel("other_action"))
}
