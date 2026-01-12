package authority

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupAuthorityTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	db.AutoMigrate(&DecisionAuthority{})
	return db
}

func createAuthorityTestService(t *testing.T, db *gorm.DB) *AuthorityService {
	return NewAuthorityService(db)
}

// ===========================================
// GRANT TESTS
// ===========================================

func TestGrant(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	grantedBy := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"approve_payment"}, MaxAmount: 100000}}

	auth, err := service.Grant(userID, RoleTechLead, "Tech Lead", scopes, ImpactMedium, grantedBy, "Initial grant", nil)

	assert.NoError(t, err)
	assert.NotNil(t, auth)
	assert.Equal(t, userID, auth.UserID)
	assert.Equal(t, RoleTechLead, auth.Role)
	assert.Equal(t, "Tech Lead", auth.Title)
	assert.True(t, auth.Active)
	assert.Nil(t, auth.ExpiresAt)
}

func TestGrantWithExpiration(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	grantedBy := uuid.New()
	expiresAt := time.Now().Add(24 * time.Hour)
	scopes := AuthorityScopes{{Domain: "*", Actions: []string{"*"}}}

	auth, err := service.Grant(userID, RoleSuperAdmin, "Super Admin", scopes, ImpactCritical, grantedBy, "Temporary access", &expiresAt)

	assert.NoError(t, err)
	assert.NotNil(t, auth.ExpiresAt)
	assert.True(t, auth.ExpiresAt.After(time.Now()))
}

func TestGrantMultipleScopes(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{
		{Domain: "billing", Actions: []string{"approve_payment", "refund"}, MaxAmount: 50000},
		{Domain: "ads", Actions: []string{"create_campaign", "pause_campaign"}, MaxAmount: 100000},
	}

	auth, err := service.Grant(userID, RoleOpsManager, "Ops Manager", scopes, ImpactMedium, uuid.New(), "Multi-scope grant", nil)

	assert.NoError(t, err)
	assert.Len(t, auth.Scopes, 2)
}

// ===========================================
// REVOKE TESTS
// ===========================================

func TestRevoke(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"*"}}}
	auth, _ := service.Grant(userID, RoleTechLead, "Tech Lead", scopes, ImpactMedium, uuid.New(), "Grant", nil)

	revokedBy := uuid.New()
	err := service.Revoke(auth.ID, revokedBy, "No longer needed")

	assert.NoError(t, err)

	// Verificar que foi revogada
	revoked, _ := service.GetByID(auth.ID)
	assert.False(t, revoked.Active)
	assert.NotNil(t, revoked.RevokedAt)
}

func TestRevokeNonExistent(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	err := service.Revoke(uuid.New(), uuid.New(), "Test")
	// Não deve dar erro, apenas não afeta nada
	assert.NoError(t, err)
}

// ===========================================
// QUERY TESTS
// ===========================================

func TestGetByID(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"*"}}}
	auth, _ := service.Grant(uuid.New(), RoleTechLead, "Tech Lead", scopes, ImpactMedium, uuid.New(), "Grant", nil)

	found, err := service.GetByID(auth.ID)

	assert.NoError(t, err)
	assert.Equal(t, auth.ID, found.ID)
}

func TestGetByIDNotFound(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	_, err := service.GetByID(uuid.New())

	assert.Error(t, err)
	assert.Equal(t, ErrAuthorityNotFound, err)
}

func TestGetByUser(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"*"}}}

	service.Grant(userID, RoleTechLead, "Tech Lead", scopes, ImpactMedium, uuid.New(), "Grant 1", nil)
	service.Grant(userID, RoleFinanceOfficer, "Finance", scopes, ImpactHigh, uuid.New(), "Grant 2", nil)

	authorities, err := service.GetByUser(userID)

	assert.NoError(t, err)
	assert.Len(t, authorities, 2)
}

func TestGetActiveByUser(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"*"}}}

	auth1, _ := service.Grant(userID, RoleTechLead, "Tech Lead", scopes, ImpactMedium, uuid.New(), "Grant 1", nil)
	service.Grant(userID, RoleFinanceOfficer, "Finance", scopes, ImpactHigh, uuid.New(), "Grant 2", nil)

	// Revogar uma
	service.Revoke(auth1.ID, uuid.New(), "Revoked")

	active, err := service.GetActiveByUser(userID)

	assert.NoError(t, err)
	assert.Len(t, active, 1)
	assert.Equal(t, RoleFinanceOfficer, active[0].Role)
}

func TestGetAll(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	scopes := AuthorityScopes{{Domain: "*", Actions: []string{"*"}}}
	for i := 0; i < 5; i++ {
		service.Grant(uuid.New(), RoleTechLead, "Tech Lead", scopes, ImpactMedium, uuid.New(), "Grant", nil)
	}

	all, err := service.GetAll()

	assert.NoError(t, err)
	assert.Len(t, all, 5)
}


// ===========================================
// RESOLVE TESTS
// ===========================================

func TestResolveNoAuthorities(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Amount:      10000,
		Impact:      ImpactMedium,
		RequestedBy: uuid.New(),
	}

	result, err := service.Resolve(req)

	assert.NoError(t, err)
	assert.False(t, result.HasEligible)
	assert.True(t, result.RequiresEscalation)
}

func TestResolveWithEligibleAuthority(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"approve_payment"}, MaxAmount: 100000, MaxImpact: "high"}}
	service.Grant(userID, RoleFinanceOfficer, "Finance Officer", scopes, ImpactHigh, uuid.New(), "Grant", nil)

	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Amount:      50000,
		Impact:      ImpactMedium,
		RequestedBy: uuid.New(),
	}

	result, err := service.Resolve(req)

	assert.NoError(t, err)
	assert.True(t, result.HasEligible)
	assert.Len(t, result.Eligible, 1)
	assert.Equal(t, userID, result.Eligible[0].UserID)
}

func TestResolveSelfApprovalExcluded(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"*"}, MaxImpact: "high"}}
	service.Grant(userID, RoleFinanceOfficer, "Finance Officer", scopes, ImpactHigh, uuid.New(), "Grant", nil)

	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Impact:      ImpactMedium,
		RequestedBy: userID, // Mesmo usuário
	}

	result, err := service.Resolve(req)

	assert.NoError(t, err)
	assert.False(t, result.HasEligible)
	assert.Len(t, result.Excluded, 1)
	assert.Equal(t, ExclusionSelfApproval, result.Excluded[0].Reason)
}

func TestResolveInactiveExcluded(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"*"}, MaxImpact: "high"}}
	auth, _ := service.Grant(userID, RoleFinanceOfficer, "Finance Officer", scopes, ImpactHigh, uuid.New(), "Grant", nil)

	// Revogar
	service.Revoke(auth.ID, uuid.New(), "Revoked")

	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Impact:      ImpactMedium,
		RequestedBy: uuid.New(),
	}

	result, err := service.Resolve(req)

	assert.NoError(t, err)
	assert.False(t, result.HasEligible)
}

func TestResolveImpactExceeded(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"*"}, MaxImpact: "low"}}
	service.Grant(userID, RoleFinanceOfficer, "Finance Officer", scopes, ImpactLow, uuid.New(), "Grant", nil)

	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Impact:      ImpactHigh, // Maior que autorizado
		RequestedBy: uuid.New(),
	}

	result, err := service.Resolve(req)

	assert.NoError(t, err)
	assert.False(t, result.HasEligible)
	assert.Contains(t, result.Excluded[0].Reason, "Impacto")
}

func TestResolveAmountExceeded(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"*"}, MaxAmount: 10000, MaxImpact: "high"}}
	service.Grant(userID, RoleFinanceOfficer, "Finance Officer", scopes, ImpactHigh, uuid.New(), "Grant", nil)

	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Amount:      50000, // Maior que autorizado
		Impact:      ImpactMedium,
		RequestedBy: uuid.New(),
	}

	result, err := service.Resolve(req)

	assert.NoError(t, err)
	assert.False(t, result.HasEligible)
	assert.Equal(t, ExclusionAmountExceeded, result.Excluded[0].Reason)
}

func TestResolveDomainMismatch(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "ads", Actions: []string{"*"}, MaxImpact: "high"}}
	service.Grant(userID, RoleOpsManager, "Ops Manager", scopes, ImpactHigh, uuid.New(), "Grant", nil)

	req := ResolutionRequest{
		Domain:      "billing", // Diferente do escopo
		Action:      "approve_payment",
		Impact:      ImpactMedium,
		RequestedBy: uuid.New(),
	}

	result, err := service.Resolve(req)

	assert.NoError(t, err)
	assert.False(t, result.HasEligible)
}

func TestResolveWildcardDomain(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "*", Actions: []string{"*"}, MaxImpact: "critical"}}
	service.Grant(userID, RoleSuperAdmin, "Super Admin", scopes, ImpactCritical, uuid.New(), "Grant", nil)

	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Impact:      ImpactHigh,
		RequestedBy: uuid.New(),
	}

	result, err := service.Resolve(req)

	assert.NoError(t, err)
	assert.True(t, result.HasEligible)
}

// ===========================================
// CAN USER APPROVE TESTS
// ===========================================

func TestCanUserApproveTrue(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	scopes := AuthorityScopes{{Domain: "billing", Actions: []string{"approve_payment"}, MaxImpact: "high"}}
	service.Grant(userID, RoleFinanceOfficer, "Finance Officer", scopes, ImpactHigh, uuid.New(), "Grant", nil)

	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Impact:      ImpactMedium,
		RequestedBy: uuid.New(),
	}

	canApprove, reason := service.CanUserApprove(userID, req)

	assert.True(t, canApprove)
	assert.NotEmpty(t, reason)
}

func TestCanUserApproveFalseNoAuthority(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	userID := uuid.New()
	req := ResolutionRequest{
		Domain:      "billing",
		Action:      "approve_payment",
		Impact:      ImpactMedium,
		RequestedBy: uuid.New(),
	}

	canApprove, reason := service.CanUserApprove(userID, req)

	assert.False(t, canApprove)
	assert.Contains(t, reason, "não possui")
}

// ===========================================
// HISTORY TESTS
// ===========================================

func TestGetGrantHistory(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	scopes := AuthorityScopes{{Domain: "*", Actions: []string{"*"}}}
	for i := 0; i < 3; i++ {
		service.Grant(uuid.New(), RoleTechLead, "Tech Lead", scopes, ImpactMedium, uuid.New(), "Grant", nil)
	}

	history, err := service.GetGrantHistory(time.Now().Add(-1 * time.Hour))

	assert.NoError(t, err)
	assert.Len(t, history, 3)
}

func TestGetRevokeHistory(t *testing.T) {
	db := setupAuthorityTestDB(t)
	service := createAuthorityTestService(t, db)

	scopes := AuthorityScopes{{Domain: "*", Actions: []string{"*"}}}
	auth1, _ := service.Grant(uuid.New(), RoleTechLead, "Tech Lead", scopes, ImpactMedium, uuid.New(), "Grant", nil)
	auth2, _ := service.Grant(uuid.New(), RoleOpsManager, "Ops Manager", scopes, ImpactMedium, uuid.New(), "Grant", nil)

	service.Revoke(auth1.ID, uuid.New(), "Revoked 1")
	service.Revoke(auth2.ID, uuid.New(), "Revoked 2")

	history, err := service.GetRevokeHistory(time.Now().Add(-1 * time.Hour))

	assert.NoError(t, err)
	assert.Len(t, history, 2)
}

// ===========================================
// MODEL TESTS
// ===========================================

func TestDecisionAuthorityTableName(t *testing.T) {
	assert.Equal(t, "decision_authorities", DecisionAuthority{}.TableName())
}

func TestDecisionAuthorityIsValid(t *testing.T) {
	auth := DecisionAuthority{Active: true}
	assert.True(t, auth.IsValid())

	auth.Active = false
	assert.False(t, auth.IsValid())
}

func TestDecisionAuthorityIsValidExpired(t *testing.T) {
	expired := time.Now().Add(-1 * time.Hour)
	auth := DecisionAuthority{Active: true, ExpiresAt: &expired}
	assert.False(t, auth.IsValid())
}

func TestDecisionAuthorityIsValidRevoked(t *testing.T) {
	revoked := time.Now()
	auth := DecisionAuthority{Active: true, RevokedAt: &revoked}
	assert.False(t, auth.IsValid())
}

func TestImpactLevelWeight(t *testing.T) {
	assert.Equal(t, 0, ImpactNone.Weight())
	assert.Equal(t, 1, ImpactLow.Weight())
	assert.Equal(t, 2, ImpactMedium.Weight())
	assert.Equal(t, 3, ImpactHigh.Weight())
	assert.Equal(t, 4, ImpactCritical.Weight())
}

func TestImpactLevelCanApprove(t *testing.T) {
	assert.True(t, ImpactHigh.CanApprove(ImpactMedium))
	assert.True(t, ImpactHigh.CanApprove(ImpactHigh))
	assert.False(t, ImpactMedium.CanApprove(ImpactHigh))
	assert.True(t, ImpactCritical.CanApprove(ImpactCritical))
}

func TestAuthorityRoleConstants(t *testing.T) {
	assert.Equal(t, AuthorityRole("super_admin"), RoleSuperAdmin)
	assert.Equal(t, AuthorityRole("tech_lead"), RoleTechLead)
	assert.Equal(t, AuthorityRole("finance_officer"), RoleFinanceOfficer)
	assert.Equal(t, AuthorityRole("ops_manager"), RoleOpsManager)
	assert.Equal(t, AuthorityRole("auditor"), RoleAuditor)
}

func TestExclusionReasonConstants(t *testing.T) {
	assert.NotEmpty(t, ExclusionInactive)
	assert.NotEmpty(t, ExclusionExpired)
	assert.NotEmpty(t, ExclusionRevoked)
	assert.NotEmpty(t, ExclusionDomainMismatch)
	assert.NotEmpty(t, ExclusionActionMismatch)
	assert.NotEmpty(t, ExclusionAmountExceeded)
	assert.NotEmpty(t, ExclusionImpactExceeded)
	assert.NotEmpty(t, ExclusionSelfApproval)
}
