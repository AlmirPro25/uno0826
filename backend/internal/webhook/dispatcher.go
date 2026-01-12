package webhook

/*
================================================================================
EVENT DISPATCHER — Conecta Eventos Internos aos Webhooks
================================================================================

O dispatcher é o "fio" que liga eventos do sistema aos webhooks configurados.
Quando algo acontece (user.created, session.revoked, etc.), o dispatcher
encontra todos os endpoints interessados e dispara as notificações.

"Eventos acontecem. Webhooks reagem."

================================================================================
*/

import (
	"log"
	"sync"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EventDispatcher gerencia o dispatch de eventos para webhooks
type EventDispatcher struct {
	db             *gorm.DB
	webhookService *WebhookService
	handlers       map[WebhookEventType][]EventHandler
	mu             sync.RWMutex
}

// EventHandler função que processa um evento antes de enviar
type EventHandler func(appID uuid.UUID, payload map[string]interface{}) map[string]interface{}

// NewEventDispatcher cria novo dispatcher
func NewEventDispatcher(db *gorm.DB, webhookService *WebhookService) *EventDispatcher {
	return &EventDispatcher{
		db:             db,
		webhookService: webhookService,
		handlers:       make(map[WebhookEventType][]EventHandler),
	}
}

// RegisterHandler registra um handler para um tipo de evento
func (d *EventDispatcher) RegisterHandler(eventType WebhookEventType, handler EventHandler) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.handlers[eventType] = append(d.handlers[eventType], handler)
}

// Dispatch envia um evento para todos os webhooks interessados
func (d *EventDispatcher) Dispatch(appID uuid.UUID, eventType WebhookEventType, payload map[string]interface{}) error {
	// Executar handlers registrados
	d.mu.RLock()
	handlers := d.handlers[eventType]
	d.mu.RUnlock()

	for _, handler := range handlers {
		payload = handler(appID, payload)
	}

	// Enviar para webhooks
	if err := d.webhookService.SendWebhook(appID, eventType, payload); err != nil {
		log.Printf("[WEBHOOK DISPATCH] Erro ao enviar %s para app %s: %v", eventType, appID, err)
		return err
	}

	log.Printf("[WEBHOOK DISPATCH] Evento %s enviado para app %s", eventType, appID)
	return nil
}

// DispatchAsync envia evento de forma assíncrona (não bloqueia)
func (d *EventDispatcher) DispatchAsync(appID uuid.UUID, eventType WebhookEventType, payload map[string]interface{}) {
	go func() {
		if err := d.Dispatch(appID, eventType, payload); err != nil {
			log.Printf("[WEBHOOK DISPATCH ASYNC] Falha: %v", err)
		}
	}()
}

// DispatchUserCreated dispara evento de usuário criado
func (d *EventDispatcher) DispatchUserCreated(appID, userID uuid.UUID, email, name string) {
	d.DispatchAsync(appID, EventUserCreated, map[string]interface{}{
		"user_id": userID.String(),
		"email":   email,
		"name":    name,
	})
}

// DispatchUserLogin dispara evento de login
func (d *EventDispatcher) DispatchUserLogin(appID, userID uuid.UUID, email, ip, userAgent string) {
	d.DispatchAsync(appID, EventUserLogin, map[string]interface{}{
		"user_id":    userID.String(),
		"email":      email,
		"ip":         ip,
		"user_agent": userAgent,
	})
}

// DispatchUserLogout dispara evento de logout
func (d *EventDispatcher) DispatchUserLogout(appID, userID uuid.UUID, sessionID string) {
	d.DispatchAsync(appID, EventUserLogout, map[string]interface{}{
		"user_id":    userID.String(),
		"session_id": sessionID,
	})
}

// DispatchSessionRevoked dispara evento de sessão revogada
func (d *EventDispatcher) DispatchSessionRevoked(appID, userID uuid.UUID, sessionID string, revokedBy string) {
	d.DispatchAsync(appID, "session.revoked", map[string]interface{}{
		"user_id":    userID.String(),
		"session_id": sessionID,
		"revoked_by": revokedBy,
	})
}

// DispatchMFAEnabled dispara evento de MFA habilitado
func (d *EventDispatcher) DispatchMFAEnabled(appID, userID uuid.UUID) {
	d.DispatchAsync(appID, "user.mfa.enabled", map[string]interface{}{
		"user_id": userID.String(),
	})
}

// DispatchMFADisabled dispara evento de MFA desabilitado
func (d *EventDispatcher) DispatchMFADisabled(appID, userID uuid.UUID) {
	d.DispatchAsync(appID, "user.mfa.disabled", map[string]interface{}{
		"user_id": userID.String(),
	})
}

// DispatchSubscriptionCreated dispara evento de assinatura criada
func (d *EventDispatcher) DispatchSubscriptionCreated(appID, userID uuid.UUID, plan string, amount int64) {
	d.DispatchAsync(appID, EventSubscriptionCreated, map[string]interface{}{
		"user_id": userID.String(),
		"plan":    plan,
		"amount":  amount,
	})
}

// DispatchSubscriptionCanceled dispara evento de assinatura cancelada
func (d *EventDispatcher) DispatchSubscriptionCanceled(appID, userID uuid.UUID, reason string) {
	d.DispatchAsync(appID, EventSubscriptionCanceled, map[string]interface{}{
		"user_id": userID.String(),
		"reason":  reason,
	})
}

// DispatchPaymentSucceeded dispara evento de pagamento bem-sucedido
func (d *EventDispatcher) DispatchPaymentSucceeded(appID, userID uuid.UUID, amount int64, currency string) {
	d.DispatchAsync(appID, EventPaymentSucceeded, map[string]interface{}{
		"user_id":  userID.String(),
		"amount":   amount,
		"currency": currency,
	})
}

// DispatchPaymentFailed dispara evento de pagamento falhou
func (d *EventDispatcher) DispatchPaymentFailed(appID, userID uuid.UUID, amount int64, reason string) {
	d.DispatchAsync(appID, EventPaymentFailed, map[string]interface{}{
		"user_id": userID.String(),
		"amount":  amount,
		"reason":  reason,
	})
}

// DispatchAppMembershipCreated dispara evento de vínculo criado
func (d *EventDispatcher) DispatchAppMembershipCreated(appID, userID uuid.UUID, role string) {
	d.DispatchAsync(appID, EventAppMembershipCreated, map[string]interface{}{
		"user_id": userID.String(),
		"role":    role,
	})
}

// DispatchAlertTriggered dispara evento de alerta
func (d *EventDispatcher) DispatchAlertTriggered(appID uuid.UUID, alertType, severity, message string) {
	d.DispatchAsync(appID, EventAlertTriggered, map[string]interface{}{
		"alert_type": alertType,
		"severity":   severity,
		"message":    message,
	})
}

// Global dispatcher instance
var globalDispatcher *EventDispatcher
var dispatcherOnce sync.Once

// GetDispatcher retorna o dispatcher global
func GetDispatcher() *EventDispatcher {
	return globalDispatcher
}

// InitDispatcher inicializa o dispatcher global
func InitDispatcher(db *gorm.DB, webhookService *WebhookService) *EventDispatcher {
	dispatcherOnce.Do(func() {
		globalDispatcher = NewEventDispatcher(db, webhookService)
	})
	return globalDispatcher
}
