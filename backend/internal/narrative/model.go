package narrative

import (
	"time"

	"github.com/google/uuid"
)

// FailureNarrative explica uma falha em linguagem humana
// Isso não é log. É explicação.
type FailureNarrative struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID     uuid.UUID `gorm:"type:text;not null;index:idx_narrative_app" json:"app_id"`
	
	// O QUE aconteceu
	What      string `gorm:"type:text;not null" json:"what"`
	
	// QUANDO aconteceu
	When      time.Time `gorm:"not null" json:"when"`
	
	// ONDE aconteceu (fase, componente)
	Where     string `gorm:"type:text;not null" json:"where"`
	
	// POR QUE aconteceu (causa técnica)
	Why       string `gorm:"type:text;not null" json:"why"`
	
	// CONTEXTO adicional
	Context   string `gorm:"type:text" json:"context"`
	
	// AÇÃO TOMADA pelo sistema
	ActionTaken string `gorm:"type:text" json:"action_taken"`
	
	// PRÓXIMO PASSO sugerido
	NextStep  string `gorm:"type:text" json:"next_step"`
	
	// Severidade: info, warning, error, critical
	Severity  string `gorm:"type:text;not null;default:'error'" json:"severity"`
	
	// Referências
	DeployID    *uuid.UUID `gorm:"type:text" json:"deploy_id,omitempty"`
	ContainerID string     `gorm:"type:text" json:"container_id,omitempty"`
	RuleID      *uuid.UUID `gorm:"type:text" json:"rule_id,omitempty"`
	
	// Status: open, acknowledged, resolved
	Status    string `gorm:"type:text;not null;default:'open'" json:"status"`
	
	// Quem resolveu (se resolvido)
	ResolvedBy *uuid.UUID `gorm:"type:text" json:"resolved_by,omitempty"`
	ResolvedAt *time.Time `json:"resolved_at,omitempty"`
	
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
}

func (FailureNarrative) TableName() string {
	return "failure_narratives"
}

// NarrativeBuilder ajuda a construir narrativas
type NarrativeBuilder struct {
	narrative FailureNarrative
}

func NewNarrative(appID uuid.UUID) *NarrativeBuilder {
	return &NarrativeBuilder{
		narrative: FailureNarrative{
			ID:        uuid.New(),
			AppID:     appID,
			When:      time.Now(),
			Severity:  "error",
			Status:    "open",
			CreatedAt: time.Now(),
		},
	}
}

func (b *NarrativeBuilder) What(what string) *NarrativeBuilder {
	b.narrative.What = what
	return b
}

func (b *NarrativeBuilder) Where(where string) *NarrativeBuilder {
	b.narrative.Where = where
	return b
}

func (b *NarrativeBuilder) Why(why string) *NarrativeBuilder {
	b.narrative.Why = why
	return b
}

func (b *NarrativeBuilder) Context(context string) *NarrativeBuilder {
	b.narrative.Context = context
	return b
}

func (b *NarrativeBuilder) ActionTaken(action string) *NarrativeBuilder {
	b.narrative.ActionTaken = action
	return b
}

func (b *NarrativeBuilder) NextStep(step string) *NarrativeBuilder {
	b.narrative.NextStep = step
	return b
}

func (b *NarrativeBuilder) Severity(severity string) *NarrativeBuilder {
	b.narrative.Severity = severity
	return b
}

func (b *NarrativeBuilder) DeployID(id uuid.UUID) *NarrativeBuilder {
	b.narrative.DeployID = &id
	return b
}

func (b *NarrativeBuilder) ContainerID(id string) *NarrativeBuilder {
	b.narrative.ContainerID = id
	return b
}

func (b *NarrativeBuilder) Build() FailureNarrative {
	return b.narrative
}

// Narrativas pré-definidas para casos comuns
var CommonNarratives = map[string]func(appID uuid.UUID, details map[string]string) FailureNarrative{
	"deploy_build_failed": func(appID uuid.UUID, d map[string]string) FailureNarrative {
		return NewNarrative(appID).
			What("Deploy do app \"" + d["app_name"] + "\" falhou").
			Where("Fase de build").
			Why(d["error"]).
			Context(d["context"]).
			ActionTaken("Nenhuma (erro de código)").
			NextStep("Usuário deve corrigir o código e tentar novamente").
			Severity("error").
			Build()
	},
	"deploy_infra_failed": func(appID uuid.UUID, d map[string]string) FailureNarrative {
		return NewNarrative(appID).
			What("Deploy do app \"" + d["app_name"] + "\" falhou").
			Where("Infraestrutura").
			Why(d["error"]).
			Context("Problema na infraestrutura do sistema").
			ActionTaken("Sistema tentará retry automático").
			NextStep("Aguardar retry ou contatar suporte").
			Severity("critical").
			Build()
	},
	"container_crash": func(appID uuid.UUID, d map[string]string) FailureNarrative {
		return NewNarrative(appID).
			What("Container do app \"" + d["app_name"] + "\" crashou").
			Where("Runtime").
			Why("Exit code: " + d["exit_code"]).
			Context(d["logs"]).
			ActionTaken("Sistema tentará restart automático").
			NextStep("Verificar logs e corrigir erro no código").
			Severity("error").
			Build()
	},
	"container_oom": func(appID uuid.UUID, d map[string]string) FailureNarrative {
		return NewNarrative(appID).
			What("Container do app \"" + d["app_name"] + "\" foi encerrado por falta de memória").
			Where("Runtime").
			Why("Out of Memory (OOM)").
			Context("Limite de memória: " + d["memory_limit"]).
			ActionTaken("Container parado").
			NextStep("Aumentar limite de memória ou otimizar código").
			Severity("error").
			Build()
	},
	"health_check_failed": func(appID uuid.UUID, d map[string]string) FailureNarrative {
		return NewNarrative(appID).
			What("Health check do app \"" + d["app_name"] + "\" falhou").
			Where("Monitoramento").
			Why("Endpoint não respondeu em " + d["timeout"]).
			Context("Tentativas: " + d["attempts"]).
			ActionTaken("Rollback para versão anterior").
			NextStep("Verificar se app está respondendo corretamente").
			Severity("warning").
			Build()
	},
}
