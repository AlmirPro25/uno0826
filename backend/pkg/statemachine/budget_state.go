package statemachine

import (
	"fmt"
)

// ========================================
// STATE MACHINE - AD BUDGET
// ========================================

// BudgetState estados possíveis de um orçamento
type BudgetState string

const (
	BudgetStateActive    BudgetState = "active"
	BudgetStateExhausted BudgetState = "exhausted"
	BudgetStateDisputed  BudgetState = "disputed"
)

// BudgetEvent eventos que causam transição
type BudgetEvent string

const (
	BudgetEventExhaust      BudgetEvent = "exhaust"
	BudgetEventRefill       BudgetEvent = "refill"
	BudgetEventInconsistency BudgetEvent = "inconsistency"
	BudgetEventResolve      BudgetEvent = "resolve"
	BudgetEventInvalid      BudgetEvent = "invalid"
)

// BudgetStateMachine gerencia transições de orçamento
type BudgetStateMachine struct {
	transitions map[BudgetState]map[BudgetEvent]BudgetState
}

// NewBudgetStateMachine cria state machine
func NewBudgetStateMachine() *BudgetStateMachine {
	sm := &BudgetStateMachine{
		transitions: make(map[BudgetState]map[BudgetEvent]BudgetState),
	}

	// active → exhausted | disputed
	sm.addTransition(BudgetStateActive, BudgetEventExhaust, BudgetStateExhausted)
	sm.addTransition(BudgetStateActive, BudgetEventInconsistency, BudgetStateDisputed)
	sm.addTransition(BudgetStateActive, BudgetEventInvalid, BudgetStateDisputed)

	// exhausted → active (refill) | disputed
	sm.addTransition(BudgetStateExhausted, BudgetEventRefill, BudgetStateActive)
	sm.addTransition(BudgetStateExhausted, BudgetEventInconsistency, BudgetStateDisputed)
	sm.addTransition(BudgetStateExhausted, BudgetEventInvalid, BudgetStateDisputed)

	// disputed → active (após resolução manual)
	sm.addTransition(BudgetStateDisputed, BudgetEventResolve, BudgetStateActive)

	return sm
}

func (sm *BudgetStateMachine) addTransition(from BudgetState, event BudgetEvent, to BudgetState) {
	if sm.transitions[from] == nil {
		sm.transitions[from] = make(map[BudgetEvent]BudgetState)
	}
	sm.transitions[from][event] = to
}

// CanTransition verifica se transição é válida
func (sm *BudgetStateMachine) CanTransition(from BudgetState, event BudgetEvent) bool {
	if transitions, ok := sm.transitions[from]; ok {
		_, valid := transitions[event]
		return valid
	}
	return false
}

// Transition executa transição
func (sm *BudgetStateMachine) Transition(from BudgetState, event BudgetEvent) (BudgetState, error) {
	if transitions, ok := sm.transitions[from]; ok {
		if to, valid := transitions[event]; valid {
			return to, nil
		}
	}
	return BudgetStateDisputed, fmt.Errorf("%w: budget %s + %s", ErrInvalidTransition, from, event)
}

// Global instance
var budgetSM = NewBudgetStateMachine()

// GetBudgetStateMachine retorna instância global
func GetBudgetStateMachine() *BudgetStateMachine {
	return budgetSM
}
