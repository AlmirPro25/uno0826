package rules

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ========================================
// POLÍTICA DE AÇÕES AUTOMÁTICAS
// "O cérebro tem leis. Sem leis, é caos."
// ========================================

// ActionPermission define se uma ação pode ser automática
type ActionPermission string

const (
	PermissionAutomatic    ActionPermission = "automatic"    // Pode executar sem humano
	PermissionConfirmation ActionPermission = "confirmation" // Precisa confirmação humana
	PermissionNever        ActionPermission = "never"        // Nunca automático
)

// ActionPolicy política de uma ação
type ActionPolicy struct {
	ActionType       RuleActionType   `json:"action_type"`
	Permission       ActionPermission `json:"permission"`
	MaxBlastRadius   BlastRadius      `json:"max_blast_radius"`
	MaxDuration      string           `json:"max_duration"`       // Ex: "24h", "7d"
	RequiresApproval bool             `json:"requires_approval"`
	Description      string           `json:"description"`
}

// BlastRadius define o escopo máximo de impacto
type BlastRadius struct {
	Scope       string `json:"scope"`        // "config", "feature", "app", "platform"
	MaxAffected int    `json:"max_affected"` // Máximo de entidades afetadas
}

// DefaultActionPolicies políticas padrão do sistema
var DefaultActionPolicies = map[RuleActionType]ActionPolicy{
	ActionAlert: {
		ActionType:       ActionAlert,
		Permission:       PermissionAutomatic,
		MaxBlastRadius:   BlastRadius{Scope: "app", MaxAffected: -1}, // Sem limite
		MaxDuration:      "",                                          // Sem limite
		RequiresApproval: false,
		Description:      "Criar alertas é sempre seguro",
	},
	ActionWebhook: {
		ActionType:       ActionWebhook,
		Permission:       PermissionAutomatic,
		MaxBlastRadius:   BlastRadius{Scope: "app", MaxAffected: 1},
		MaxDuration:      "",
		RequiresApproval: false,
		Description:      "Webhooks são externos, risco controlado",
	},
	ActionFlag: {
		ActionType:       ActionFlag,
		Permission:       PermissionAutomatic,
		MaxBlastRadius:   BlastRadius{Scope: "feature", MaxAffected: 1000},
		MaxDuration:      "7d",
		RequiresApproval: false,
		Description:      "Flags são reversíveis",
	},
	ActionAdjust: {
		ActionType:       ActionAdjust,
		Permission:       PermissionAutomatic,
		MaxBlastRadius:   BlastRadius{Scope: "config", MaxAffected: 1},
		MaxDuration:      "24h",
		RequiresApproval: false,
		Description:      "Ajustes de config são temporários por padrão",
	},
	ActionCreateRule: {
		ActionType:       ActionCreateRule,
		Permission:       PermissionAutomatic,
		MaxBlastRadius:   BlastRadius{Scope: "app", MaxAffected: 1},
		MaxDuration:      "24h", // Regras criadas automaticamente são temporárias
		RequiresApproval: false,
		Description:      "Meta-regras só criam regras temporárias",
	},
	ActionDisableRule: {
		ActionType:       ActionDisableRule,
		Permission:       PermissionConfirmation,
		MaxBlastRadius:   BlastRadius{Scope: "app", MaxAffected: 1},
		MaxDuration:      "1h",
		RequiresApproval: true,
		Description:      "Desativar regras pode ter efeitos colaterais",
	},
	ActionEscalate: {
		ActionType:       ActionEscalate,
		Permission:       PermissionAutomatic,
		MaxBlastRadius:   BlastRadius{Scope: "app", MaxAffected: 100},
		MaxDuration:      "",
		RequiresApproval: false,
		Description:      "Escalação é segura, só muda severidade",
	},
	ActionNotify: {
		ActionType:       ActionNotify,
		Permission:       PermissionAutomatic,
		MaxBlastRadius:   BlastRadius{Scope: "app", MaxAffected: 10},
		MaxDuration:      "",
		RequiresApproval: false,
		Description:      "Notificações são informativas",
	},
}

// ========================================
// AÇÕES PROIBIDAS (NUNCA AUTOMÁTICAS)
// ========================================

// ProhibitedActions ações que NUNCA podem ser automáticas
var ProhibitedActions = []string{
	"billing.charge",
	"billing.refund",
	"user.delete",
	"user.ban_permanent",
	"app.delete",
	"app.suspend",
	"data.export",
	"data.delete",
	"auth.revoke_all",
	"platform.shutdown",
}

// IsProhibitedAction verifica se uma ação é proibida
func IsProhibitedAction(action string) bool {
	for _, prohibited := range ProhibitedActions {
		if action == prohibited {
			return true
		}
	}
	return false
}


// ========================================
// KILL SWITCH GLOBAL - Pausa Humana
// ========================================

// GlobalKillSwitch controle global de ações automáticas
type GlobalKillSwitch struct {
	mu              sync.RWMutex
	active          bool
	activatedAt     *time.Time
	activatedBy     string
	reason          string
	autoResumeAt    *time.Time
	pausedActions   map[RuleActionType]bool // Ações específicas pausadas
}

var globalKillSwitch = &GlobalKillSwitch{
	pausedActions: make(map[RuleActionType]bool),
}

// ActivateKillSwitch ativa o kill switch global
func ActivateKillSwitch(activatedBy, reason string, autoResumeAfter *time.Duration) {
	globalKillSwitch.mu.Lock()
	defer globalKillSwitch.mu.Unlock()
	
	now := time.Now()
	globalKillSwitch.active = true
	globalKillSwitch.activatedAt = &now
	globalKillSwitch.activatedBy = activatedBy
	globalKillSwitch.reason = reason
	
	if autoResumeAfter != nil {
		resumeAt := now.Add(*autoResumeAfter)
		globalKillSwitch.autoResumeAt = &resumeAt
	}
}

// DeactivateKillSwitch desativa o kill switch
func DeactivateKillSwitch() {
	globalKillSwitch.mu.Lock()
	defer globalKillSwitch.mu.Unlock()
	
	globalKillSwitch.active = false
	globalKillSwitch.activatedAt = nil
	globalKillSwitch.activatedBy = ""
	globalKillSwitch.reason = ""
	globalKillSwitch.autoResumeAt = nil
}

// IsKillSwitchActive verifica se o kill switch está ativo
func IsKillSwitchActive() bool {
	globalKillSwitch.mu.RLock()
	defer globalKillSwitch.mu.RUnlock()
	
	if !globalKillSwitch.active {
		return false
	}
	
	// Verificar auto-resume
	if globalKillSwitch.autoResumeAt != nil && time.Now().After(*globalKillSwitch.autoResumeAt) {
		// Auto-resume expirou, desativar
		globalKillSwitch.active = false
		return false
	}
	
	return true
}

// GetKillSwitchStatus retorna status do kill switch
func GetKillSwitchStatus() map[string]interface{} {
	globalKillSwitch.mu.RLock()
	defer globalKillSwitch.mu.RUnlock()
	
	return map[string]interface{}{
		"active":          globalKillSwitch.active,
		"activated_at":    globalKillSwitch.activatedAt,
		"activated_by":    globalKillSwitch.activatedBy,
		"reason":          globalKillSwitch.reason,
		"auto_resume_at":  globalKillSwitch.autoResumeAt,
		"paused_actions":  globalKillSwitch.pausedActions,
	}
}

// PauseActionType pausa um tipo específico de ação
func PauseActionType(actionType RuleActionType) {
	globalKillSwitch.mu.Lock()
	defer globalKillSwitch.mu.Unlock()
	globalKillSwitch.pausedActions[actionType] = true
}

// ResumeActionType resume um tipo específico de ação
func ResumeActionType(actionType RuleActionType) {
	globalKillSwitch.mu.Lock()
	defer globalKillSwitch.mu.Unlock()
	delete(globalKillSwitch.pausedActions, actionType)
}

// IsActionTypePaused verifica se um tipo de ação está pausado
func IsActionTypePaused(actionType RuleActionType) bool {
	globalKillSwitch.mu.RLock()
	defer globalKillSwitch.mu.RUnlock()
	return globalKillSwitch.pausedActions[actionType]
}

// ========================================
// VALIDAÇÃO DE AÇÃO
// ========================================

// ActionValidationResult resultado da validação
type ActionValidationResult struct {
	Allowed      bool   `json:"allowed"`
	Reason       string `json:"reason"`
	RequiresApproval bool `json:"requires_approval"`
}

// ValidateAction valida se uma ação pode ser executada
func ValidateAction(actionType RuleActionType, appID uuid.UUID, config interface{}) ActionValidationResult {
	// 1. Kill switch global
	if IsKillSwitchActive() {
		return ActionValidationResult{
			Allowed: false,
			Reason:  "Kill switch global ativo - todas as ações automáticas pausadas",
		}
	}
	
	// 2. Ação específica pausada
	if IsActionTypePaused(actionType) {
		return ActionValidationResult{
			Allowed: false,
			Reason:  fmt.Sprintf("Ação %s está pausada", actionType),
		}
	}
	
	// 3. Verificar política
	policy, exists := DefaultActionPolicies[actionType]
	if !exists {
		return ActionValidationResult{
			Allowed: false,
			Reason:  fmt.Sprintf("Ação %s não tem política definida", actionType),
		}
	}
	
	// 4. Verificar permissão
	if policy.Permission == PermissionNever {
		return ActionValidationResult{
			Allowed: false,
			Reason:  fmt.Sprintf("Ação %s nunca pode ser automática", actionType),
		}
	}
	
	if policy.Permission == PermissionConfirmation {
		return ActionValidationResult{
			Allowed:          false,
			Reason:           fmt.Sprintf("Ação %s requer confirmação humana", actionType),
			RequiresApproval: true,
		}
	}
	
	// 5. Ação permitida
	return ActionValidationResult{
		Allowed: true,
		Reason:  "Ação permitida pela política",
	}
}

// ========================================
// AUDIT LOG DE AÇÕES
// ========================================

// ActionAuditLog registro de auditoria de ação
type ActionAuditLog struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	AppID        uuid.UUID      `gorm:"type:uuid;index" json:"app_id"`
	RuleID       *uuid.UUID     `gorm:"type:uuid" json:"rule_id"`
	ActionType   RuleActionType `gorm:"size:30" json:"action_type"`
	ActionConfig string         `gorm:"type:text" json:"action_config"`
	
	// Validação
	WasAllowed   bool   `json:"was_allowed"`
	BlockReason  string `gorm:"size:500" json:"block_reason"`
	
	// Resultado
	WasExecuted  bool   `json:"was_executed"`
	Result       string `gorm:"type:text" json:"result"`
	Error        string `gorm:"size:500" json:"error"`
	
	// Contexto
	TriggeredBy  string    `gorm:"size:100" json:"triggered_by"` // "rule", "manual", "api"
	ExecutedAt   time.Time `json:"executed_at"`
	DurationMs   int64     `json:"duration_ms"`
}

func (ActionAuditLog) TableName() string {
	return "action_audit_logs"
}
