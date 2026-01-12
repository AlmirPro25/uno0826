package events

/*
================================================================================
EVENT INTEGRATIONS — Conecta Serviços ao Event System
================================================================================

Este arquivo fornece funções helper para integrar serviços existentes
ao sistema de eventos sem modificar o código original.

Uso nos handlers:
  events.EmitUserLogin(appID, userID, email, ip, userAgent)
  events.EmitMFAEnabled(appID, userID)

"Integração sem invasão."

================================================================================
*/

import (
	"log"

	"github.com/google/uuid"
)

// ============================================================================
// USER EVENTS
// ============================================================================

// EmitUserCreated emite evento de usuário criado
func EmitUserCreated(appID, userID uuid.UUID, email, name string) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping UserCreated event")
		return
	}
	svc.UserCreated(appID, userID, email, name)
}

// EmitUserLogin emite evento de login
func EmitUserLogin(appID, userID uuid.UUID, email, ip, userAgent string) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping UserLogin event")
		return
	}
	svc.UserLogin(appID, userID, email, ip, userAgent)
}

// EmitUserLogout emite evento de logout
func EmitUserLogout(appID, userID uuid.UUID, sessionID string) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping UserLogout event")
		return
	}
	svc.UserLogout(appID, userID, sessionID)
}

// ============================================================================
// SESSION EVENTS
// ============================================================================

// EmitSessionCreated emite evento de sessão criada
func EmitSessionCreated(appID, userID, sessionID uuid.UUID, ip, device string) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping SessionCreated event")
		return
	}
	svc.SessionCreated(appID, userID, sessionID, ip, device)
}

// EmitSessionRevoked emite evento de sessão revogada
func EmitSessionRevoked(appID, userID, sessionID uuid.UUID, revokedBy string) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping SessionRevoked event")
		return
	}
	svc.SessionRevoked(appID, userID, sessionID, revokedBy)
}

// ============================================================================
// MFA EVENTS
// ============================================================================

// EmitMFAEnabled emite evento de MFA habilitado
func EmitMFAEnabled(appID, userID uuid.UUID) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping MFAEnabled event")
		return
	}
	svc.MFAEnabled(appID, userID)
}

// EmitMFADisabled emite evento de MFA desabilitado
func EmitMFADisabled(appID, userID uuid.UUID) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping MFADisabled event")
		return
	}
	svc.MFADisabled(appID, userID)
}

// ============================================================================
// BILLING EVENTS
// ============================================================================

// EmitPaymentSucceeded emite evento de pagamento bem-sucedido
func EmitPaymentSucceeded(appID, userID uuid.UUID, amount int64, currency string) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping PaymentSucceeded event")
		return
	}
	svc.PaymentSucceeded(appID, userID, amount, currency)
}

// EmitPaymentFailed emite evento de pagamento falhou
func EmitPaymentFailed(appID, userID uuid.UUID, amount int64, reason string) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping PaymentFailed event")
		return
	}
	svc.PaymentFailed(appID, userID, amount, reason)
}

// ============================================================================
// SYSTEM EVENTS
// ============================================================================

// EmitAlertTriggered emite evento de alerta
func EmitAlertTriggered(appID uuid.UUID, alertType, severity, message string) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping AlertTriggered event")
		return
	}
	svc.AlertTriggered(appID, alertType, severity, message)
}

// ============================================================================
// GENERIC EMIT
// ============================================================================

// Emit emite um evento genérico
func Emit(appID uuid.UUID, eventType EventType, payload map[string]interface{}, source string, userID *uuid.UUID) {
	svc := GetEventService()
	if svc == nil {
		log.Println("[EVENTS] Service not initialized, skipping event")
		return
	}
	svc.Emit(appID, eventType, payload, source, userID)
}
