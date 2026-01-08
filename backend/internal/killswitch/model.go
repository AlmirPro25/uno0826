package killswitch

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// KILL SWITCH - CONTROLE DE EMERGÊNCIA
// "Botão vermelho que pausa automações"
// ========================================

// Scope - escopos do kill switch
const (
	ScopeAll      = "all"      // Para tudo
	ScopeBilling  = "billing"  // Para billing/ledger
	ScopeAgents   = "agents"   // Para agentes
	ScopeAds      = "ads"      // Para ads
	ScopeJobs     = "jobs"     // Para jobs
	ScopePayments = "payments" // Para pagamentos
)

// KillSwitch - controle de emergência
type KillSwitch struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Scope       string     `gorm:"size:50;uniqueIndex" json:"scope"` // all, billing, agents, ads, jobs
	Active      bool       `gorm:"default:false" json:"active"`
	Reason      string     `gorm:"size:500" json:"reason"`
	ActivatedBy uuid.UUID  `gorm:"type:uuid" json:"activated_by"`
	ActivatedAt time.Time  `json:"activated_at"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"` // opcional: expira automaticamente
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// TableName for KillSwitch
func (KillSwitch) TableName() string {
	return "kill_switches"
}

// KillSwitchStatus - status atual de todos os switches
type KillSwitchStatus struct {
	All      bool `json:"all"`
	Billing  bool `json:"billing"`
	Agents   bool `json:"agents"`
	Ads      bool `json:"ads"`
	Jobs     bool `json:"jobs"`
	Payments bool `json:"payments"`
}

// ActivateRequest - request para ativar kill switch
type ActivateRequest struct {
	Scope     string `json:"scope" binding:"required,oneof=all billing agents ads jobs payments"`
	Reason    string `json:"reason" binding:"required"`
	ExpiresIn *int   `json:"expires_in_minutes,omitempty"` // minutos até expirar
}
