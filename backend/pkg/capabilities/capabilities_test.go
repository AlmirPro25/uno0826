package capabilities

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// ===========================================
// PLAN TESTS
// ===========================================

func TestGetPlanFree(t *testing.T) {
	plan := GetPlan("free")
	assert.NotNil(t, plan)
	assert.Equal(t, "free", plan.ID)
	assert.Equal(t, "Free", plan.Name)
}

func TestGetPlanPro(t *testing.T) {
	plan := GetPlan("pro")
	assert.NotNil(t, plan)
	assert.Equal(t, "pro", plan.ID)
	assert.Equal(t, "PROST-QS Pro", plan.Name)
}

func TestGetPlanEnterprise(t *testing.T) {
	plan := GetPlan("enterprise")
	assert.NotNil(t, plan)
	assert.Equal(t, "enterprise", plan.ID)
	assert.Equal(t, "Enterprise", plan.Name)
}

func TestGetPlanUnknown(t *testing.T) {
	plan := GetPlan("unknown")
	assert.NotNil(t, plan)
	assert.Equal(t, "free", plan.ID)
}

// ===========================================
// HAS CAPABILITY TESTS
// ===========================================

func TestHasCapabilityFree(t *testing.T) {
	plan := GetPlan("free")
	assert.True(t, plan.HasCapability(CanViewMetrics))
	assert.False(t, plan.HasCapability(CanCreateApp))
	assert.False(t, plan.HasCapability(CanAccessAdmin))
}

func TestHasCapabilityPro(t *testing.T) {
	plan := GetPlan("pro")
	assert.True(t, plan.HasCapability(CanCreateApp))
	assert.True(t, plan.HasCapability(CanUpdateApp))
	assert.True(t, plan.HasCapability(CanViewMetrics))
	assert.True(t, plan.HasCapability(CanExportData))
	assert.False(t, plan.HasCapability(CanDeleteApp))
	assert.False(t, plan.HasCapability(CanAccessAdmin))
}

func TestHasCapabilityEnterprise(t *testing.T) {
	plan := GetPlan("enterprise")
	assert.True(t, plan.HasCapability(CanCreateApp))
	assert.True(t, plan.HasCapability(CanDeleteApp))
	assert.True(t, plan.HasCapability(CanAccessAdmin))
	assert.True(t, plan.HasCapability(CanManageUsers))
	assert.True(t, plan.HasCapability(CanViewAuditLogs))
}

// ===========================================
// CAN CREATE TESTS
// ===========================================

func TestCanCreateAppFree(t *testing.T) {
	plan := GetPlan("free")
	assert.False(t, plan.CanCreate("app", 0))
}

func TestCanCreateAppPro(t *testing.T) {
	plan := GetPlan("pro")
	assert.True(t, plan.CanCreate("app", 0))
	assert.True(t, plan.CanCreate("app", 5))
	assert.True(t, plan.CanCreate("app", 9))
	assert.False(t, plan.CanCreate("app", 10))
	assert.False(t, plan.CanCreate("app", 15))
}

func TestCanCreateAppEnterprise(t *testing.T) {
	plan := GetPlan("enterprise")
	assert.True(t, plan.CanCreate("app", 0))
	assert.True(t, plan.CanCreate("app", 100))
	assert.True(t, plan.CanCreate("app", 1000))
}

func TestCanCreateCredential(t *testing.T) {
	plan := GetPlan("pro")
	assert.True(t, plan.CanCreate("credential", 0))
	assert.True(t, plan.CanCreate("credential", 4))
	assert.False(t, plan.CanCreate("credential", 5))
}

func TestCanCreateAppUser(t *testing.T) {
	plan := GetPlan("pro")
	assert.True(t, plan.CanCreate("app_user", 0))
	assert.True(t, plan.CanCreate("app_user", 999))
	assert.False(t, plan.CanCreate("app_user", 1000))
}

func TestCanCreateUnknownResource(t *testing.T) {
	plan := GetPlan("pro")
	assert.False(t, plan.CanCreate("unknown", 0))
}

// ===========================================
// CAPABILITY CONSTANTS TESTS
// ===========================================

func TestCapabilityConstants(t *testing.T) {
	assert.Equal(t, Capability("CAN_CREATE_APP"), CanCreateApp)
	assert.Equal(t, Capability("CAN_UPDATE_APP"), CanUpdateApp)
	assert.Equal(t, Capability("CAN_DELETE_APP"), CanDeleteApp)
	assert.Equal(t, Capability("CAN_CREATE_CREDENTIAL"), CanCreateCredential)
	assert.Equal(t, Capability("CAN_REVOKE_CREDENTIAL"), CanRevokeCredential)
	assert.Equal(t, Capability("CAN_REVOKE_SESSIONS"), CanRevokeSessions)
	assert.Equal(t, Capability("CAN_MANAGE_APP_USERS"), CanManageAppUsers)
	assert.Equal(t, Capability("CAN_VIEW_METRICS"), CanViewMetrics)
	assert.Equal(t, Capability("CAN_EXPORT_DATA"), CanExportData)
	assert.Equal(t, Capability("CAN_ACCESS_ADMIN"), CanAccessAdmin)
	assert.Equal(t, Capability("CAN_MANAGE_USERS"), CanManageUsers)
	assert.Equal(t, Capability("CAN_VIEW_AUDIT_LOGS"), CanViewAuditLogs)
}

// ===========================================
// PLAN LIMITS TESTS
// ===========================================

func TestPlanLimitsFree(t *testing.T) {
	plan := GetPlan("free")
	assert.Equal(t, 0, plan.Limits.MaxApps)
	assert.Equal(t, 0, plan.Limits.MaxCredentials)
	assert.Equal(t, 0, plan.Limits.MaxAppUsers)
}

func TestPlanLimitsPro(t *testing.T) {
	plan := GetPlan("pro")
	assert.Equal(t, 10, plan.Limits.MaxApps)
	assert.Equal(t, 5, plan.Limits.MaxCredentials)
	assert.Equal(t, 1000, plan.Limits.MaxAppUsers)
}

func TestPlanLimitsEnterprise(t *testing.T) {
	plan := GetPlan("enterprise")
	assert.Equal(t, -1, plan.Limits.MaxApps)
	assert.Equal(t, -1, plan.Limits.MaxCredentials)
	assert.Equal(t, -1, plan.Limits.MaxAppUsers)
}
