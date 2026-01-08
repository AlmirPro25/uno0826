package statemachine

import (
	"fmt"
)

// ========================================
// STATE MACHINE - SUBSCRIPTION
// ========================================

// SubscriptionState estados possíveis
type SubscriptionState string

const (
	SubPending    SubscriptionState = "pending"
	SubActive     SubscriptionState = "active"
	SubPastDue    SubscriptionState = "past_due"
	SubCanceled   SubscriptionState = "canceled"
	SubPaused     SubscriptionState = "paused"
	SubDisputed   SubscriptionState = "disputed"
	SubExpired    SubscriptionState = "expired"
)

// SubscriptionEvent eventos de transição
type SubscriptionEvent string

const (
	SubEventActivate    SubscriptionEvent = "activate"
	SubEventPaymentFail SubscriptionEvent = "payment_fail"
	SubEventPaymentOk   SubscriptionEvent = "payment_ok"
	SubEventCancel      SubscriptionEvent = "cancel"
	SubEventPause       SubscriptionEvent = "pause"
	SubEventResume      SubscriptionEvent = "resume"
	SubEventExpire      SubscriptionEvent = "expire"
	SubEventDispute     SubscriptionEvent = "dispute"
	SubEventResolve     SubscriptionEvent = "resolve"
	SubEventInvalid     SubscriptionEvent = "invalid"
)

// SubscriptionStateMachine gerencia transições
type SubscriptionStateMachine struct {
	transitions map[SubscriptionState]map[SubscriptionEvent]SubscriptionState
}

// NewSubscriptionStateMachine cria state machine
func NewSubscriptionStateMachine() *SubscriptionStateMachine {
	sm := &SubscriptionStateMachine{
		transitions: make(map[SubscriptionState]map[SubscriptionEvent]SubscriptionState),
	}

	// pending → active | canceled | disputed
	sm.addTransition(SubPending, SubEventActivate, SubActive)
	sm.addTransition(SubPending, SubEventCancel, SubCanceled)
	sm.addTransition(SubPending, SubEventDispute, SubDisputed)
	sm.addTransition(SubPending, SubEventInvalid, SubDisputed)

	// active → past_due | canceled | paused | disputed | expired
	sm.addTransition(SubActive, SubEventPaymentFail, SubPastDue)
	sm.addTransition(SubActive, SubEventCancel, SubCanceled)
	sm.addTransition(SubActive, SubEventPause, SubPaused)
	sm.addTransition(SubActive, SubEventExpire, SubExpired)
	sm.addTransition(SubActive, SubEventDispute, SubDisputed)
	sm.addTransition(SubActive, SubEventInvalid, SubDisputed)

	// past_due → active | canceled | disputed
	sm.addTransition(SubPastDue, SubEventPaymentOk, SubActive)
	sm.addTransition(SubPastDue, SubEventCancel, SubCanceled)
	sm.addTransition(SubPastDue, SubEventDispute, SubDisputed)
	sm.addTransition(SubPastDue, SubEventInvalid, SubDisputed)

	// paused → active | canceled | disputed
	sm.addTransition(SubPaused, SubEventResume, SubActive)
	sm.addTransition(SubPaused, SubEventCancel, SubCanceled)
	sm.addTransition(SubPaused, SubEventDispute, SubDisputed)
	sm.addTransition(SubPaused, SubEventInvalid, SubDisputed)

	// disputed → pending (após resolução)
	sm.addTransition(SubDisputed, SubEventResolve, SubPending)

	// canceled e expired são estados finais
	sm.addTransition(SubCanceled, SubEventInvalid, SubDisputed)
	sm.addTransition(SubExpired, SubEventInvalid, SubDisputed)

	return sm
}

func (sm *SubscriptionStateMachine) addTransition(from SubscriptionState, event SubscriptionEvent, to SubscriptionState) {
	if sm.transitions[from] == nil {
		sm.transitions[from] = make(map[SubscriptionEvent]SubscriptionState)
	}
	sm.transitions[from][event] = to
}

// CanTransition verifica se transição é válida
func (sm *SubscriptionStateMachine) CanTransition(from SubscriptionState, event SubscriptionEvent) bool {
	if transitions, ok := sm.transitions[from]; ok {
		_, valid := transitions[event]
		return valid
	}
	return false
}

// Transition executa transição
func (sm *SubscriptionStateMachine) Transition(from SubscriptionState, event SubscriptionEvent) (SubscriptionState, error) {
	if transitions, ok := sm.transitions[from]; ok {
		if to, valid := transitions[event]; valid {
			return to, nil
		}
	}
	return SubDisputed, fmt.Errorf("%w: %s + %s", ErrInvalidTransition, from, event)
}

// MapStripeStatus mapeia status do Stripe para evento
func MapStripeSubscriptionStatus(stripeStatus string) SubscriptionEvent {
	switch stripeStatus {
	case "active":
		return SubEventActivate
	case "past_due":
		return SubEventPaymentFail
	case "canceled":
		return SubEventCancel
	case "paused":
		return SubEventPause
	case "unpaid":
		return SubEventPaymentFail
	default:
		return SubEventInvalid
	}
}

// Global instance
var subscriptionSM = NewSubscriptionStateMachine()

// GetSubscriptionStateMachine retorna instância global
func GetSubscriptionStateMachine() *SubscriptionStateMachine {
	return subscriptionSM
}
