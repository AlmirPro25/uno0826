package capabilities

// ========================================
// CAPABILITIES - Permissões Estruturais
// "Capacidade primeiro. Preço depois."
// ========================================

// Capability representa uma permissão estrutural no sistema
type Capability string

const (
	// Apps
	CanCreateApp       Capability = "CAN_CREATE_APP"
	CanUpdateApp       Capability = "CAN_UPDATE_APP"
	CanDeleteApp       Capability = "CAN_DELETE_APP"
	
	// Credentials
	CanCreateCredential Capability = "CAN_CREATE_CREDENTIAL"
	CanRevokeCredential Capability = "CAN_REVOKE_CREDENTIAL"
	
	// Sessions
	CanRevokeSessions   Capability = "CAN_REVOKE_SESSIONS"
	
	// Users (dentro do app)
	CanManageAppUsers   Capability = "CAN_MANAGE_APP_USERS"
	
	// Metrics
	CanViewMetrics      Capability = "CAN_VIEW_METRICS"
	CanExportData       Capability = "CAN_EXPORT_DATA"
	
	// Admin
	CanAccessAdmin      Capability = "CAN_ACCESS_ADMIN"
	CanManageUsers      Capability = "CAN_MANAGE_USERS"
	CanViewAuditLogs    Capability = "CAN_VIEW_AUDIT_LOGS"
)

// Plan representa um plano com suas capacidades
type Plan struct {
	ID           string
	Name         string
	Capabilities []Capability
	Limits       PlanLimits
}

// PlanLimits define limites quantitativos do plano
type PlanLimits struct {
	MaxApps        int  // -1 = ilimitado
	MaxCredentials int  // por app
	MaxAppUsers    int  // por app
}

// Planos disponíveis
var (
	PlanFree = Plan{
		ID:           "free",
		Name:         "Free",
		Capabilities: []Capability{
			CanViewMetrics,
		},
		Limits: PlanLimits{
			MaxApps:        0,
			MaxCredentials: 0,
			MaxAppUsers:    0,
		},
	}

	PlanPro = Plan{
		ID:           "pro",
		Name:         "PROST-QS Pro",
		Capabilities: []Capability{
			CanCreateApp,
			CanUpdateApp,
			CanCreateCredential,
			CanRevokeCredential,
			CanRevokeSessions,
			CanManageAppUsers,
			CanViewMetrics,
			CanExportData,
		},
		Limits: PlanLimits{
			MaxApps:        10,
			MaxCredentials: 5,
			MaxAppUsers:    1000,
		},
	}

	PlanEnterprise = Plan{
		ID:           "enterprise",
		Name:         "Enterprise",
		Capabilities: []Capability{
			CanCreateApp,
			CanUpdateApp,
			CanDeleteApp,
			CanCreateCredential,
			CanRevokeCredential,
			CanRevokeSessions,
			CanManageAppUsers,
			CanViewMetrics,
			CanExportData,
			CanAccessAdmin,
			CanManageUsers,
			CanViewAuditLogs,
		},
		Limits: PlanLimits{
			MaxApps:        -1, // ilimitado
			MaxCredentials: -1,
			MaxAppUsers:    -1,
		},
	}
)

// GetPlan retorna o plano pelo ID
func GetPlan(planID string) *Plan {
	switch planID {
	case "pro":
		return &PlanPro
	case "enterprise":
		return &PlanEnterprise
	default:
		return &PlanFree
	}
}

// HasCapability verifica se o plano tem uma capacidade
func (p *Plan) HasCapability(cap Capability) bool {
	for _, c := range p.Capabilities {
		if c == cap {
			return true
		}
	}
	return false
}

// CanCreate verifica se pode criar mais recursos
func (p *Plan) CanCreate(resourceType string, currentCount int) bool {
	switch resourceType {
	case "app":
		return p.Limits.MaxApps == -1 || currentCount < p.Limits.MaxApps
	case "credential":
		return p.Limits.MaxCredentials == -1 || currentCount < p.Limits.MaxCredentials
	case "app_user":
		return p.Limits.MaxAppUsers == -1 || currentCount < p.Limits.MaxAppUsers
	default:
		return false
	}
}
