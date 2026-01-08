package autonomy

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// AUTONOMY MODEL - LINGUAGEM INSTITUCIONAL
// "O sistema sabe responder perguntas antes de agir"
// ========================================

// AutonomyLevel - níveis de autonomia do sistema
// Regra: Autonomia total só existe onde não há mutação
type AutonomyLevel int

const (
	// AutonomyForbidden - Proibido, sempre bloqueado
	// Usado para: transfer_funds, delete_*, suspend_user
	// Justificativa: Dinheiro nunca é autônomo. Impacto humano direto nunca é delegado.
	AutonomyForbidden AutonomyLevel = 0

	// AutonomyShadow - Simulação apenas, nada executa
	// Usado para: update_config, ações de risco médio
	// Justificativa: Permite observar intenção, medir risco, ajustar policies sem custo real
	AutonomyShadow AutonomyLevel = 1

	// AutonomyAudited - Execução com auditoria reforçada e janela de reversão
	// Usado para: pause_campaign, create_ad
	// Justificativa: Reversível, impacto limitado, custo mensurável
	AutonomyAudited AutonomyLevel = 2

	// AutonomyFull - Execução plena (raríssima)
	// Usado para: read_data, consultas
	// Justificativa: Leitura não altera estado, não cria efeito colateral
	// Regra implícita: Autonomia total só existe onde não há mutação
	AutonomyFull AutonomyLevel = 3
)

// String retorna nome legível do nível
func (l AutonomyLevel) String() string {
	switch l {
	case AutonomyForbidden:
		return "forbidden"
	case AutonomyShadow:
		return "shadow"
	case AutonomyAudited:
		return "audited"
	case AutonomyFull:
		return "full"
	default:
		return "unknown"
	}
}

// CanExecute retorna se o nível permite execução real
func (l AutonomyLevel) CanExecute() bool {
	return l >= AutonomyAudited
}

// RequiresAudit retorna se o nível exige auditoria reforçada
func (l AutonomyLevel) RequiresAudit() bool {
	return l == AutonomyAudited
}

// IsShadowOnly retorna se o nível é apenas simulação
func (l AutonomyLevel) IsShadowOnly() bool {
	return l == AutonomyShadow
}

// ========================================
// IMPACT LEVEL - CLASSIFICAÇÃO DE IMPACTO
// ========================================

// ImpactLevel - nível de impacto de uma ação
type ImpactLevel string

const (
	ImpactNone     ImpactLevel = "none"     // Sem impacto (leitura)
	ImpactLow      ImpactLevel = "low"      // Baixo impacto, facilmente reversível
	ImpactMedium   ImpactLevel = "medium"   // Impacto moderado, reversível com esforço
	ImpactHigh     ImpactLevel = "high"     // Alto impacto, difícil reverter
	ImpactCritical ImpactLevel = "critical" // Crítico, irreversível ou impacto humano
)

// ========================================
// ACTION DEFINITION - DEFINIÇÃO DE AÇÃO
// ========================================

// ActionDefinition - define uma ação e seus limites de autonomia
// Este é o "dicionário" do sistema - responde perguntas, não executa
type ActionDefinition struct {
	// Identificação
	Action   string `json:"action"`   // ex: "transfer_funds", "read_data"
	Domain   string `json:"domain"`   // ex: "billing", "agent", "ads"
	
	// Limites de Autonomia
	MaxAutonomy   AutonomyLevel `json:"max_autonomy"`   // nível máximo permitido
	DefaultLevel  AutonomyLevel `json:"default_level"`  // nível padrão para novos agentes
	
	// Classificação de Impacto
	ImpactLevel   ImpactLevel `json:"impact_level"`
	Reversible    bool        `json:"reversible"`      // pode ser revertido?
	MutatesState  bool        `json:"mutates_state"`   // altera estado do sistema?
	
	// Restrições
	RequiresHuman bool   `json:"requires_human"` // sempre precisa de humano?
	Reason        string `json:"reason"`         // justificativa institucional
}

// ========================================
// AUTONOMY PROFILE - PERFIL DE AUTONOMIA
// ========================================

// AutonomyProfile - perfil de autonomia de um agente
// Define o que um agente específico pode ou não fazer
type AutonomyProfile struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	AgentID   uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"agent_id"`
	
	// Nível base do agente
	BaseLevel AutonomyLevel `json:"base_level"` // nível padrão para ações não definidas
	
	// Overrides por ação (JSON)
	// map[action]AutonomyLevel
	ActionOverrides map[string]AutonomyLevel `gorm:"type:text;serializer:json" json:"action_overrides"`
	
	// Limites globais
	MaxDailyActions   int   `json:"max_daily_actions"`   // máximo de ações por dia
	MaxAmountPerAction int64 `json:"max_amount_per_action"` // valor máximo por ação (centavos)
	
	// Metadados
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	CreatedBy uuid.UUID  `gorm:"type:uuid" json:"created_by"` // quem definiu
	Reason    string     `gorm:"size:500" json:"reason"`      // justificativa
}

// TableName for AutonomyProfile
func (AutonomyProfile) TableName() string {
	return "autonomy_profiles"
}

// GetActionLevel retorna o nível de autonomia para uma ação específica
func (p *AutonomyProfile) GetActionLevel(action string) AutonomyLevel {
	if override, exists := p.ActionOverrides[action]; exists {
		return override
	}
	return p.BaseLevel
}

// ========================================
// AUTONOMY MATRIX - MATRIZ DE AUTONOMIA
// "Documento público sem vergonha"
// ========================================

// DefaultActionDefinitions - definições padrão do sistema
// Esta matriz é a "constituição" de autonomia do PROST-QS
var DefaultActionDefinitions = []ActionDefinition{
	// === LEITURA (Autonomia Full) ===
	{
		Action:       "read_data",
		Domain:       "*",
		MaxAutonomy:  AutonomyFull,
		DefaultLevel: AutonomyFull,
		ImpactLevel:  ImpactNone,
		Reversible:   true, // não há o que reverter
		MutatesState: false,
		RequiresHuman: false,
		Reason:       "Leitura não altera estado, não cria efeito colateral",
	},
	
	// === CONFIGURAÇÃO (Autonomia Shadow) ===
	{
		Action:       "update_config",
		Domain:       "*",
		MaxAutonomy:  AutonomyShadow,
		DefaultLevel: AutonomyShadow,
		ImpactLevel:  ImpactMedium,
		Reversible:   true,
		MutatesState: true,
		RequiresHuman: false,
		Reason:       "Configuração pode quebrar sistema silenciosamente",
	},
	
	// === CAMPANHAS (Autonomia Audited) ===
	{
		Action:       "pause_campaign",
		Domain:       "ads",
		MaxAutonomy:  AutonomyAudited,
		DefaultLevel: AutonomyShadow,
		ImpactLevel:  ImpactLow,
		Reversible:   true,
		MutatesState: true,
		RequiresHuman: false,
		Reason:       "Reversível, impacto limitado",
	},
	{
		Action:       "create_ad",
		Domain:       "ads",
		MaxAutonomy:  AutonomyAudited,
		DefaultLevel: AutonomyShadow,
		ImpactLevel:  ImpactMedium,
		Reversible:   true, // pode desativar
		MutatesState: true,
		RequiresHuman: false,
		Reason:       "Gasto indireto, requer limite de budget e policy de teto",
	},
	
	// === DINHEIRO (Autonomia Forbidden) ===
	{
		Action:       "transfer_funds",
		Domain:       "billing",
		MaxAutonomy:  AutonomyForbidden,
		DefaultLevel: AutonomyForbidden,
		ImpactLevel:  ImpactCritical,
		Reversible:   false, // dinheiro não volta sozinho
		MutatesState: true,
		RequiresHuman: true,
		Reason:       "LEI CONSTITUCIONAL: Dinheiro nunca é autônomo, nunca é implícito, nunca é otimizado",
	},
	{
		Action:       "debit",
		Domain:       "billing",
		MaxAutonomy:  AutonomyForbidden,
		DefaultLevel: AutonomyForbidden,
		ImpactLevel:  ImpactCritical,
		Reversible:   false,
		MutatesState: true,
		RequiresHuman: true,
		Reason:       "Débito é transferência de valor, mesma regra de transfer_funds",
	},
	
	// === DELEÇÃO (Autonomia Forbidden) ===
	{
		Action:       "delete",
		Domain:       "*",
		MaxAutonomy:  AutonomyForbidden,
		DefaultLevel: AutonomyForbidden,
		ImpactLevel:  ImpactCritical,
		Reversible:   false,
		MutatesState: true,
		RequiresHuman: true,
		Reason:       "Delete é poder absoluto. Poder absoluto só existe com humano responsável",
	},
	
	// === USUÁRIOS (Autonomia Forbidden) ===
	{
		Action:       "suspend_user",
		Domain:       "identity",
		MaxAutonomy:  AutonomyForbidden,
		DefaultLevel: AutonomyForbidden,
		ImpactLevel:  ImpactCritical,
		Reversible:   true, // tecnicamente reversível
		MutatesState: true,
		RequiresHuman: true,
		Reason:       "Impacto humano direto nunca é delegado",
	},
	{
		Action:       "ban_user",
		Domain:       "identity",
		MaxAutonomy:  AutonomyForbidden,
		DefaultLevel: AutonomyForbidden,
		ImpactLevel:  ImpactCritical,
		Reversible:   true,
		MutatesState: true,
		RequiresHuman: true,
		Reason:       "Banimento é decisão ética, não técnica",
	},
}

// ========================================
// AUTONOMY CHECK REQUEST/RESPONSE
// "O sistema responde perguntas"
// ========================================

// AutonomyCheckRequest - pergunta ao sistema
type AutonomyCheckRequest struct {
	AgentID uuid.UUID `json:"agent_id"`
	Action  string    `json:"action"`
	Domain  string    `json:"domain"`
	Amount  int64     `json:"amount,omitempty"` // valor envolvido (centavos)
}

// AutonomyCheckResponse - resposta do sistema
type AutonomyCheckResponse struct {
	// Pode executar?
	Allowed       bool          `json:"allowed"`
	AutonomyLevel AutonomyLevel `json:"autonomy_level"`
	
	// Por quê?
	Reason        string        `json:"reason"`
	ActionDef     *ActionDefinition `json:"action_definition,omitempty"`
	
	// O que fazer?
	RequiresHuman bool   `json:"requires_human"`
	ShadowOnly    bool   `json:"shadow_only"`
	
	// Limites
	MaxAmount     int64  `json:"max_amount,omitempty"`
	DailyRemaining int   `json:"daily_remaining,omitempty"`
}
