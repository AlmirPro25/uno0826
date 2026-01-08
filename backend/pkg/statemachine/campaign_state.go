package statemachine

import (
	"fmt"
)

// ========================================
// STATE MACHINE - AD CAMPAIGN
// Transições explícitas, eventos inválidos → DISPUTED
// ========================================

// CampaignState estados possíveis de uma campanha
type CampaignState string

const (
	CampaignDraft     CampaignState = "draft"
	CampaignActive    CampaignState = "active"
	CampaignPaused    CampaignState = "paused"
	CampaignCompleted CampaignState = "completed"
	CampaignDisputed  CampaignState = "disputed"
)

// CampaignEvent eventos que causam transição
type CampaignEvent string

const (
	CampaignEventActivate        CampaignEvent = "activate"
	CampaignEventPause           CampaignEvent = "pause"
	CampaignEventResume          CampaignEvent = "resume"
	CampaignEventComplete        CampaignEvent = "complete"
	CampaignEventBudgetExhausted CampaignEvent = "budget_exhausted"
	CampaignEventInvalidSpend    CampaignEvent = "invalid_spend"
	CampaignEventDispute         CampaignEvent = "dispute"
	CampaignEventResolve         CampaignEvent = "resolve"
	CampaignEventInvalid         CampaignEvent = "invalid"
)

// CampaignStateMachine gerencia transições de campanha
type CampaignStateMachine struct {
	transitions map[CampaignState]map[CampaignEvent]CampaignState
}

// NewCampaignStateMachine cria state machine com transições válidas
func NewCampaignStateMachine() *CampaignStateMachine {
	sm := &CampaignStateMachine{
		transitions: make(map[CampaignState]map[CampaignEvent]CampaignState),
	}

	// draft → active
	sm.addTransition(CampaignDraft, CampaignEventActivate, CampaignActive)
	sm.addTransition(CampaignDraft, CampaignEventInvalid, CampaignDisputed)

	// active → paused | completed | disputed
	sm.addTransition(CampaignActive, CampaignEventPause, CampaignPaused)
	sm.addTransition(CampaignActive, CampaignEventBudgetExhausted, CampaignPaused)
	sm.addTransition(CampaignActive, CampaignEventComplete, CampaignCompleted)
	sm.addTransition(CampaignActive, CampaignEventInvalidSpend, CampaignDisputed)
	sm.addTransition(CampaignActive, CampaignEventDispute, CampaignDisputed)
	sm.addTransition(CampaignActive, CampaignEventInvalid, CampaignDisputed)

	// paused → active | disputed
	sm.addTransition(CampaignPaused, CampaignEventResume, CampaignActive)
	sm.addTransition(CampaignPaused, CampaignEventComplete, CampaignCompleted)
	sm.addTransition(CampaignPaused, CampaignEventDispute, CampaignDisputed)
	sm.addTransition(CampaignPaused, CampaignEventInvalid, CampaignDisputed)

	// disputed → paused (após resolução manual)
	sm.addTransition(CampaignDisputed, CampaignEventResolve, CampaignPaused)

	// completed é estado final
	sm.addTransition(CampaignCompleted, CampaignEventInvalid, CampaignDisputed)

	return sm
}

func (sm *CampaignStateMachine) addTransition(from CampaignState, event CampaignEvent, to CampaignState) {
	if sm.transitions[from] == nil {
		sm.transitions[from] = make(map[CampaignEvent]CampaignState)
	}
	sm.transitions[from][event] = to
}

// CanTransition verifica se transição é válida
func (sm *CampaignStateMachine) CanTransition(from CampaignState, event CampaignEvent) bool {
	if transitions, ok := sm.transitions[from]; ok {
		_, valid := transitions[event]
		return valid
	}
	return false
}

// Transition executa transição e retorna novo estado
func (sm *CampaignStateMachine) Transition(from CampaignState, event CampaignEvent) (CampaignState, error) {
	if transitions, ok := sm.transitions[from]; ok {
		if to, valid := transitions[event]; valid {
			return to, nil
		}
	}

	// Transição inválida → DISPUTED
	return CampaignDisputed, fmt.Errorf("%w: campaign %s + %s", ErrInvalidTransition, from, event)
}

// Global instance
var campaignSM = NewCampaignStateMachine()

// GetCampaignStateMachine retorna instância global
func GetCampaignStateMachine() *CampaignStateMachine {
	return campaignSM
}
