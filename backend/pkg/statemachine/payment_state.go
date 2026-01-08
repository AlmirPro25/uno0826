package statemachine

import (
	"errors"
	"fmt"
)

// ========================================
// STATE MACHINE - PAYMENT INTENT
// Transições explícitas, eventos inválidos → DISPUTED
// ========================================

// PaymentState estados possíveis de um PaymentIntent
type PaymentState string

const (
	PaymentPending   PaymentState = "pending"
	PaymentConfirmed PaymentState = "confirmed"
	PaymentFailed    PaymentState = "failed"
	PaymentDisputed  PaymentState = "disputed"
	PaymentRefunded  PaymentState = "refunded"
	PaymentCanceled  PaymentState = "canceled"
)

// PaymentEvent eventos que causam transição
type PaymentEvent string

const (
	EventConfirm       PaymentEvent = "confirm"
	EventFail          PaymentEvent = "fail"
	EventDispute       PaymentEvent = "dispute"
	EventRefund        PaymentEvent = "refund"
	EventCancel        PaymentEvent = "cancel"
	EventResolve       PaymentEvent = "resolve"
	EventRetry         PaymentEvent = "retry"
	EventInvalidEvent  PaymentEvent = "invalid_event"
)

var (
	ErrInvalidTransition = errors.New("transição de estado inválida")
	ErrDisputedState     = errors.New("estado disputado requer ação humana")
)

// PaymentStateMachine gerencia transições de estado
type PaymentStateMachine struct {
	transitions map[PaymentState]map[PaymentEvent]PaymentState
}

// NewPaymentStateMachine cria state machine com transições válidas
func NewPaymentStateMachine() *PaymentStateMachine {
	sm := &PaymentStateMachine{
		transitions: make(map[PaymentState]map[PaymentEvent]PaymentState),
	}

	// Definir transições válidas
	// pending → confirmed | failed | canceled | disputed
	sm.addTransition(PaymentPending, EventConfirm, PaymentConfirmed)
	sm.addTransition(PaymentPending, EventFail, PaymentFailed)
	sm.addTransition(PaymentPending, EventCancel, PaymentCanceled)
	sm.addTransition(PaymentPending, EventDispute, PaymentDisputed)
	sm.addTransition(PaymentPending, EventInvalidEvent, PaymentDisputed)

	// confirmed → refunded | disputed
	sm.addTransition(PaymentConfirmed, EventRefund, PaymentRefunded)
	sm.addTransition(PaymentConfirmed, EventDispute, PaymentDisputed)
	sm.addTransition(PaymentConfirmed, EventInvalidEvent, PaymentDisputed)

	// failed → pending (retry) | disputed
	sm.addTransition(PaymentFailed, EventRetry, PaymentPending)
	sm.addTransition(PaymentFailed, EventDispute, PaymentDisputed)
	sm.addTransition(PaymentFailed, EventInvalidEvent, PaymentDisputed)

	// disputed → pending | confirmed | failed (após resolução humana)
	sm.addTransition(PaymentDisputed, EventResolve, PaymentPending)

	// refunded → disputed (se houver problema)
	sm.addTransition(PaymentRefunded, EventDispute, PaymentDisputed)
	sm.addTransition(PaymentRefunded, EventInvalidEvent, PaymentDisputed)

	// canceled é estado final
	sm.addTransition(PaymentCanceled, EventInvalidEvent, PaymentDisputed)

	return sm
}

func (sm *PaymentStateMachine) addTransition(from PaymentState, event PaymentEvent, to PaymentState) {
	if sm.transitions[from] == nil {
		sm.transitions[from] = make(map[PaymentEvent]PaymentState)
	}
	sm.transitions[from][event] = to
}

// CanTransition verifica se transição é válida
func (sm *PaymentStateMachine) CanTransition(from PaymentState, event PaymentEvent) bool {
	if transitions, ok := sm.transitions[from]; ok {
		_, valid := transitions[event]
		return valid
	}
	return false
}

// Transition executa transição e retorna novo estado
func (sm *PaymentStateMachine) Transition(from PaymentState, event PaymentEvent) (PaymentState, error) {
	if transitions, ok := sm.transitions[from]; ok {
		if to, valid := transitions[event]; valid {
			return to, nil
		}
	}

	// Transição inválida → DISPUTED
	return PaymentDisputed, fmt.Errorf("%w: %s + %s", ErrInvalidTransition, from, event)
}

// ValidateExternalEvent valida evento externo (webhook) contra estado atual
func (sm *PaymentStateMachine) ValidateExternalEvent(currentState PaymentState, externalStatus string) (PaymentEvent, bool) {
	// Mapear status externo para evento interno
	event := mapExternalToEvent(externalStatus)

	// Verificar se transição é válida
	if sm.CanTransition(currentState, event) {
		return event, true
	}

	// Evento inválido para estado atual
	return EventInvalidEvent, false
}

// mapExternalToEvent mapeia status externo (Stripe) para evento interno
func mapExternalToEvent(externalStatus string) PaymentEvent {
	switch externalStatus {
	case "succeeded", "paid":
		return EventConfirm
	case "failed", "canceled":
		return EventFail
	case "refunded":
		return EventRefund
	case "disputed", "charge.dispute.created":
		return EventDispute
	default:
		return EventInvalidEvent
	}
}

// TransitionResult resultado de uma transição
type TransitionResult struct {
	FromState   PaymentState `json:"from_state"`
	ToState     PaymentState `json:"to_state"`
	Event       PaymentEvent `json:"event"`
	Valid       bool         `json:"valid"`
	IsDisputed  bool         `json:"is_disputed"`
	Error       string       `json:"error,omitempty"`
}

// ExecuteTransition executa transição com resultado detalhado
func (sm *PaymentStateMachine) ExecuteTransition(from PaymentState, event PaymentEvent) *TransitionResult {
	result := &TransitionResult{
		FromState: from,
		Event:     event,
	}

	newState, err := sm.Transition(from, event)
	result.ToState = newState
	result.IsDisputed = newState == PaymentDisputed

	if err != nil {
		result.Valid = false
		result.Error = err.Error()
	} else {
		result.Valid = true
	}

	return result
}

// Global instance
var paymentSM = NewPaymentStateMachine()

// GetPaymentStateMachine retorna instância global
func GetPaymentStateMachine() *PaymentStateMachine {
	return paymentSM
}
