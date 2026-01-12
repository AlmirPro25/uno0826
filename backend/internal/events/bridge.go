package events

/*
================================================================================
EVENT BRIDGE — Conecta Event Service ao Webhook Dispatcher
================================================================================

O bridge é a "cola" entre o sistema de eventos interno e os webhooks externos.
Quando um evento é emitido, o bridge automaticamente dispara os webhooks
configurados para aquele tipo de evento.

Fluxo:
  1. Serviço interno chama EventService.UserCreated()
  2. EventService persiste o evento e notifica listeners
  3. Bridge (listener) recebe o evento
  4. Bridge chama WebhookDispatcher.DispatchUserCreated()
  5. Dispatcher encontra webhooks interessados e envia

"Eventos internos viram notificações externas."

================================================================================
*/

import (
	"encoding/json"
	"log"

	"github.com/google/uuid"
	"prost-qs/backend/internal/webhook"
)

// EventBridge conecta eventos ao dispatcher de webhooks
type EventBridge struct {
	eventService *EventService
	dispatcher   *webhook.EventDispatcher
}

// NewEventBridge cria novo bridge
func NewEventBridge(eventService *EventService, dispatcher *webhook.EventDispatcher) *EventBridge {
	bridge := &EventBridge{
		eventService: eventService,
		dispatcher:   dispatcher,
	}
	bridge.setupListeners()
	return bridge
}

// setupListeners configura os listeners para cada tipo de evento
func (b *EventBridge) setupListeners() {
	// User events
	b.eventService.Subscribe(EventUserCreated, b.onUserCreated)
	b.eventService.Subscribe(EventUserLogin, b.onUserLogin)
	b.eventService.Subscribe(EventUserLogout, b.onUserLogout)
	b.eventService.Subscribe(EventUserMFAEnabled, b.onMFAEnabled)
	b.eventService.Subscribe(EventUserMFADisabled, b.onMFADisabled)

	// Session events
	b.eventService.Subscribe(EventSessionCreated, b.onSessionCreated)
	b.eventService.Subscribe(EventSessionRevoked, b.onSessionRevoked)

	// Billing events
	b.eventService.Subscribe(EventSubscriptionCreated, b.onSubscriptionCreated)
	b.eventService.Subscribe(EventSubscriptionCanceled, b.onSubscriptionCanceled)
	b.eventService.Subscribe(EventPaymentSucceeded, b.onPaymentSucceeded)
	b.eventService.Subscribe(EventPaymentFailed, b.onPaymentFailed)

	// App events
	b.eventService.Subscribe(EventAppMembershipCreated, b.onAppMembershipCreated)

	// System events
	b.eventService.Subscribe(EventAlertTriggered, b.onAlertTriggered)

	log.Println("✅ Event Bridge configurado - eventos conectados aos webhooks")
}

// parsePayload converte payload JSON para map
func parsePayload(payloadJSON string) map[string]interface{} {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(payloadJSON), &payload); err != nil {
		return map[string]interface{}{}
	}
	return payload
}

// ============================================================================
// USER EVENT HANDLERS
// ============================================================================

func (b *EventBridge) onUserCreated(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	email, _ := payload["email"].(string)
	name, _ := payload["name"].(string)
	
	b.dispatcher.DispatchUserCreated(event.AppID, userID, email, name)
}

func (b *EventBridge) onUserLogin(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	email, _ := payload["email"].(string)
	ip, _ := payload["ip"].(string)
	userAgent, _ := payload["user_agent"].(string)
	
	b.dispatcher.DispatchUserLogin(event.AppID, userID, email, ip, userAgent)
}

func (b *EventBridge) onUserLogout(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	sessionID, _ := payload["session_id"].(string)
	
	b.dispatcher.DispatchUserLogout(event.AppID, userID, sessionID)
}

func (b *EventBridge) onMFAEnabled(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	
	b.dispatcher.DispatchMFAEnabled(event.AppID, userID)
}

func (b *EventBridge) onMFADisabled(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	
	b.dispatcher.DispatchMFADisabled(event.AppID, userID)
}

// ============================================================================
// SESSION EVENT HANDLERS
// ============================================================================

func (b *EventBridge) onSessionCreated(event Event) {
	payload := parsePayload(event.Payload)
	// Session created é informativo, não precisa de webhook específico
	// O user.login já cobre esse caso
	log.Printf("[BRIDGE] Session created: %v", payload)
}

func (b *EventBridge) onSessionRevoked(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	sessionID, _ := payload["session_id"].(string)
	revokedBy, _ := payload["revoked_by"].(string)
	
	b.dispatcher.DispatchSessionRevoked(event.AppID, userID, sessionID, revokedBy)
}

// ============================================================================
// BILLING EVENT HANDLERS
// ============================================================================

func (b *EventBridge) onSubscriptionCreated(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	plan, _ := payload["plan"].(string)
	amount, _ := payload["amount"].(float64)
	
	b.dispatcher.DispatchSubscriptionCreated(event.AppID, userID, plan, int64(amount))
}

func (b *EventBridge) onSubscriptionCanceled(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	reason, _ := payload["reason"].(string)
	
	b.dispatcher.DispatchSubscriptionCanceled(event.AppID, userID, reason)
}

func (b *EventBridge) onPaymentSucceeded(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	amount, _ := payload["amount"].(float64)
	currency, _ := payload["currency"].(string)
	
	b.dispatcher.DispatchPaymentSucceeded(event.AppID, userID, int64(amount), currency)
}

func (b *EventBridge) onPaymentFailed(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	amount, _ := payload["amount"].(float64)
	reason, _ := payload["reason"].(string)
	
	b.dispatcher.DispatchPaymentFailed(event.AppID, userID, int64(amount), reason)
}

// ============================================================================
// APP EVENT HANDLERS
// ============================================================================

func (b *EventBridge) onAppMembershipCreated(event Event) {
	payload := parsePayload(event.Payload)
	userID, _ := uuid.Parse(payload["user_id"].(string))
	role, _ := payload["role"].(string)
	
	b.dispatcher.DispatchAppMembershipCreated(event.AppID, userID, role)
}

// ============================================================================
// SYSTEM EVENT HANDLERS
// ============================================================================

func (b *EventBridge) onAlertTriggered(event Event) {
	payload := parsePayload(event.Payload)
	alertType, _ := payload["alert_type"].(string)
	severity, _ := payload["severity"].(string)
	message, _ := payload["message"].(string)
	
	b.dispatcher.DispatchAlertTriggered(event.AppID, alertType, severity, message)
}

// ============================================================================
// GLOBAL BRIDGE
// ============================================================================

var globalBridge *EventBridge

// InitBridge inicializa o bridge global
func InitBridge(eventService *EventService, dispatcher *webhook.EventDispatcher) *EventBridge {
	globalBridge = NewEventBridge(eventService, dispatcher)
	return globalBridge
}

// GetBridge retorna o bridge global
func GetBridge() *EventBridge {
	return globalBridge
}
