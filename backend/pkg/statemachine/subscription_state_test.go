package statemachine

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// ========================================
// SUBSCRIPTION STATE MACHINE TESTS
// ========================================

func TestNewSubscriptionStateMachine(t *testing.T) {
	sm := NewSubscriptionStateMachine()
	assert.NotNil(t, sm)
	assert.NotEmpty(t, sm.transitions)
}

func TestCanTransition_ValidTransitions(t *testing.T) {
	sm := NewSubscriptionStateMachine()

	tests := []struct {
		from  SubscriptionState
		event SubscriptionEvent
		valid bool
	}{
		// pending transitions
		{SubPending, SubEventActivate, true},
		{SubPending, SubEventCancel, true},
		{SubPending, SubEventDispute, true},
		
		// active transitions
		{SubActive, SubEventPaymentFail, true},
		{SubActive, SubEventCancel, true},
		{SubActive, SubEventPause, true},
		{SubActive, SubEventExpire, true},
		{SubActive, SubEventDispute, true},
		
		// past_due transitions
		{SubPastDue, SubEventPaymentOk, true},
		{SubPastDue, SubEventCancel, true},
		{SubPastDue, SubEventDispute, true},
		
		// paused transitions
		{SubPaused, SubEventResume, true},
		{SubPaused, SubEventCancel, true},
		
		// disputed transitions
		{SubDisputed, SubEventResolve, true},
		
		// invalid transitions
		{SubCanceled, SubEventActivate, false},
		{SubExpired, SubEventActivate, false},
		{SubActive, SubEventResolve, false},
	}

	for _, tt := range tests {
		t.Run(string(tt.from)+"_"+string(tt.event), func(t *testing.T) {
			result := sm.CanTransition(tt.from, tt.event)
			assert.Equal(t, tt.valid, result)
		})
	}
}


func TestTransition_Success(t *testing.T) {
	sm := NewSubscriptionStateMachine()

	tests := []struct {
		from     SubscriptionState
		event    SubscriptionEvent
		expected SubscriptionState
	}{
		{SubPending, SubEventActivate, SubActive},
		{SubActive, SubEventPaymentFail, SubPastDue},
		{SubPastDue, SubEventPaymentOk, SubActive},
		{SubActive, SubEventCancel, SubCanceled},
		{SubActive, SubEventPause, SubPaused},
		{SubPaused, SubEventResume, SubActive},
		{SubActive, SubEventExpire, SubExpired},
		{SubDisputed, SubEventResolve, SubPending},
	}

	for _, tt := range tests {
		t.Run(string(tt.from)+"_"+string(tt.event), func(t *testing.T) {
			result, err := sm.Transition(tt.from, tt.event)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestTransition_Invalid(t *testing.T) {
	sm := NewSubscriptionStateMachine()

	// Tentar transição inválida
	result, err := sm.Transition(SubCanceled, SubEventActivate)
	assert.Error(t, err)
	assert.ErrorIs(t, err, ErrInvalidTransition)
	assert.Equal(t, SubDisputed, result) // Retorna disputed em caso de erro
}

func TestTransition_ToDisputed(t *testing.T) {
	sm := NewSubscriptionStateMachine()

	// Qualquer estado pode ir para disputed via invalid event
	states := []SubscriptionState{SubPending, SubActive, SubPastDue, SubPaused, SubCanceled, SubExpired}
	
	for _, state := range states {
		t.Run(string(state)+"_to_disputed", func(t *testing.T) {
			result, err := sm.Transition(state, SubEventInvalid)
			assert.NoError(t, err)
			assert.Equal(t, SubDisputed, result)
		})
	}
}

func TestMapStripeSubscriptionStatus(t *testing.T) {
	tests := []struct {
		stripeStatus string
		expected     SubscriptionEvent
	}{
		{"active", SubEventActivate},
		{"past_due", SubEventPaymentFail},
		{"canceled", SubEventCancel},
		{"paused", SubEventPause},
		{"unpaid", SubEventPaymentFail},
		{"unknown", SubEventInvalid},
		{"", SubEventInvalid},
	}

	for _, tt := range tests {
		t.Run(tt.stripeStatus, func(t *testing.T) {
			result := MapStripeSubscriptionStatus(tt.stripeStatus)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetSubscriptionStateMachine(t *testing.T) {
	sm := GetSubscriptionStateMachine()
	assert.NotNil(t, sm)
	
	// Deve retornar a mesma instância
	sm2 := GetSubscriptionStateMachine()
	assert.Same(t, sm, sm2)
}

// ========================================
// SUBSCRIPTION STATE CONSTANTS TESTS
// ========================================

func TestSubscriptionState_Constants(t *testing.T) {
	assert.Equal(t, SubscriptionState("pending"), SubPending)
	assert.Equal(t, SubscriptionState("active"), SubActive)
	assert.Equal(t, SubscriptionState("past_due"), SubPastDue)
	assert.Equal(t, SubscriptionState("canceled"), SubCanceled)
	assert.Equal(t, SubscriptionState("paused"), SubPaused)
	assert.Equal(t, SubscriptionState("disputed"), SubDisputed)
	assert.Equal(t, SubscriptionState("expired"), SubExpired)
}

func TestSubscriptionEvent_Constants(t *testing.T) {
	assert.Equal(t, SubscriptionEvent("activate"), SubEventActivate)
	assert.Equal(t, SubscriptionEvent("payment_fail"), SubEventPaymentFail)
	assert.Equal(t, SubscriptionEvent("payment_ok"), SubEventPaymentOk)
	assert.Equal(t, SubscriptionEvent("cancel"), SubEventCancel)
	assert.Equal(t, SubscriptionEvent("pause"), SubEventPause)
	assert.Equal(t, SubscriptionEvent("resume"), SubEventResume)
	assert.Equal(t, SubscriptionEvent("expire"), SubEventExpire)
	assert.Equal(t, SubscriptionEvent("dispute"), SubEventDispute)
	assert.Equal(t, SubscriptionEvent("resolve"), SubEventResolve)
	assert.Equal(t, SubscriptionEvent("invalid"), SubEventInvalid)
}

// ========================================
// LIFECYCLE TESTS
// ========================================

func TestSubscriptionLifecycle_HappyPath(t *testing.T) {
	sm := NewSubscriptionStateMachine()

	// pending -> active -> canceled
	state := SubPending
	
	state, err := sm.Transition(state, SubEventActivate)
	assert.NoError(t, err)
	assert.Equal(t, SubActive, state)
	
	state, err = sm.Transition(state, SubEventCancel)
	assert.NoError(t, err)
	assert.Equal(t, SubCanceled, state)
}

func TestSubscriptionLifecycle_PaymentFailure(t *testing.T) {
	sm := NewSubscriptionStateMachine()

	// pending -> active -> past_due -> active
	state := SubPending
	
	state, _ = sm.Transition(state, SubEventActivate)
	assert.Equal(t, SubActive, state)
	
	state, _ = sm.Transition(state, SubEventPaymentFail)
	assert.Equal(t, SubPastDue, state)
	
	state, _ = sm.Transition(state, SubEventPaymentOk)
	assert.Equal(t, SubActive, state)
}

func TestSubscriptionLifecycle_PauseResume(t *testing.T) {
	sm := NewSubscriptionStateMachine()

	// pending -> active -> paused -> active
	state := SubPending
	
	state, _ = sm.Transition(state, SubEventActivate)
	state, _ = sm.Transition(state, SubEventPause)
	assert.Equal(t, SubPaused, state)
	
	state, _ = sm.Transition(state, SubEventResume)
	assert.Equal(t, SubActive, state)
}

func TestSubscriptionLifecycle_DisputeResolution(t *testing.T) {
	sm := NewSubscriptionStateMachine()

	// active -> disputed -> pending -> active
	state := SubActive
	
	state, _ = sm.Transition(state, SubEventDispute)
	assert.Equal(t, SubDisputed, state)
	
	state, _ = sm.Transition(state, SubEventResolve)
	assert.Equal(t, SubPending, state)
	
	state, _ = sm.Transition(state, SubEventActivate)
	assert.Equal(t, SubActive, state)
}
