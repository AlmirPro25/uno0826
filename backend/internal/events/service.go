package events

/*
================================================================================
EVENT SERVICE — Centraliza Emissão de Eventos do Sistema
================================================================================

Este serviço é o ponto central para emitir eventos do sistema.
Ele conecta os serviços internos ao webhook dispatcher.

Uso:
  events.Emit(appID, "user.created", payload)
  events.UserCreated(appID, userID, email, name)

"Um lugar para emitir. Muitos lugares para ouvir."

================================================================================
*/

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EventType tipos de eventos do sistema
type EventType string

const (
	// User events
	EventUserCreated     EventType = "user.created"
	EventUserUpdated     EventType = "user.updated"
	EventUserDeleted     EventType = "user.deleted"
	EventUserLogin       EventType = "user.login"
	EventUserLogout      EventType = "user.logout"
	EventUserMFAEnabled  EventType = "user.mfa.enabled"
	EventUserMFADisabled EventType = "user.mfa.disabled"

	// Session events
	EventSessionCreated EventType = "session.created"
	EventSessionRevoked EventType = "session.revoked"
	EventSessionExpired EventType = "session.expired"

	// Billing events
	EventSubscriptionCreated  EventType = "subscription.created"
	EventSubscriptionUpdated  EventType = "subscription.updated"
	EventSubscriptionCanceled EventType = "subscription.canceled"
	EventPaymentSucceeded     EventType = "payment.succeeded"
	EventPaymentFailed        EventType = "payment.failed"

	// App events
	EventAppMembershipCreated EventType = "app.membership.created"
	EventAppMembershipRemoved EventType = "app.membership.removed"

	// System events
	EventAlertTriggered  EventType = "alert.triggered"
	EventIncidentCreated EventType = "incident.created"
)

// Event representa um evento do sistema
type Event struct {
	ID        uuid.UUID              `gorm:"type:uuid;primaryKey" json:"id"`
	AppID     uuid.UUID              `gorm:"type:uuid;index" json:"app_id"`
	Type      string                 `gorm:"size:100;index" json:"type"`
	Payload   string                 `gorm:"type:text" json:"payload"` // JSON
	Source    string                 `gorm:"size:100" json:"source"`   // Serviço que emitiu
	UserID    *uuid.UUID             `gorm:"type:uuid;index" json:"user_id,omitempty"`
	CreatedAt time.Time              `gorm:"index" json:"created_at"`
}

// EventListener função que escuta eventos
type EventListener func(event Event)

// EventService serviço de eventos
type EventService struct {
	db        *gorm.DB
	listeners map[EventType][]EventListener
	mu        sync.RWMutex
}

var (
	globalEventService *EventService
	eventServiceOnce   sync.Once
)

// NewEventService cria novo serviço
func NewEventService(db *gorm.DB) *EventService {
	db.AutoMigrate(&Event{})
	return &EventService{
		db:        db,
		listeners: make(map[EventType][]EventListener),
	}
}

// InitEventService inicializa o serviço global
func InitEventService(db *gorm.DB) *EventService {
	eventServiceOnce.Do(func() {
		globalEventService = NewEventService(db)
	})
	return globalEventService
}

// GetEventService retorna o serviço global
func GetEventService() *EventService {
	return globalEventService
}

// Subscribe registra um listener para um tipo de evento
func (s *EventService) Subscribe(eventType EventType, listener EventListener) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.listeners[eventType] = append(s.listeners[eventType], listener)
}

// Emit emite um evento
func (s *EventService) Emit(appID uuid.UUID, eventType EventType, payload map[string]interface{}, source string, userID *uuid.UUID) {
	// Serializar payload
	payloadJSON, _ := json.Marshal(payload)

	event := Event{
		ID:        uuid.New(),
		AppID:     appID,
		Type:      string(eventType),
		Payload:   string(payloadJSON),
		Source:    source,
		UserID:    userID,
		CreatedAt: time.Now(),
	}

	// Persistir evento
	if err := s.db.Create(&event).Error; err != nil {
		log.Printf("[EVENT] Erro ao persistir evento %s: %v", eventType, err)
	}

	// Notificar listeners
	s.mu.RLock()
	listeners := s.listeners[eventType]
	s.mu.RUnlock()

	for _, listener := range listeners {
		go listener(event)
	}

	log.Printf("[EVENT] Emitido: %s (app=%s)", eventType, appID)
}


// ============================================================================
// HELPER FUNCTIONS — Atalhos para emitir eventos comuns
// ============================================================================

// UserCreated emite evento de usuário criado
func (s *EventService) UserCreated(appID, userID uuid.UUID, email, name string) {
	s.Emit(appID, EventUserCreated, map[string]interface{}{
		"user_id": userID.String(),
		"email":   email,
		"name":    name,
	}, "identity", &userID)
}

// UserLogin emite evento de login
func (s *EventService) UserLogin(appID, userID uuid.UUID, email, ip, userAgent string) {
	s.Emit(appID, EventUserLogin, map[string]interface{}{
		"user_id":    userID.String(),
		"email":      email,
		"ip":         ip,
		"user_agent": userAgent,
	}, "auth", &userID)
}

// UserLogout emite evento de logout
func (s *EventService) UserLogout(appID, userID uuid.UUID, sessionID string) {
	s.Emit(appID, EventUserLogout, map[string]interface{}{
		"user_id":    userID.String(),
		"session_id": sessionID,
	}, "auth", &userID)
}

// SessionCreated emite evento de sessão criada
func (s *EventService) SessionCreated(appID, userID, sessionID uuid.UUID, ip, device string) {
	s.Emit(appID, EventSessionCreated, map[string]interface{}{
		"user_id":    userID.String(),
		"session_id": sessionID.String(),
		"ip":         ip,
		"device":     device,
	}, "auth", &userID)
}

// SessionRevoked emite evento de sessão revogada
func (s *EventService) SessionRevoked(appID, userID, sessionID uuid.UUID, revokedBy string) {
	s.Emit(appID, EventSessionRevoked, map[string]interface{}{
		"user_id":    userID.String(),
		"session_id": sessionID.String(),
		"revoked_by": revokedBy,
	}, "auth", &userID)
}

// MFAEnabled emite evento de MFA habilitado
func (s *EventService) MFAEnabled(appID, userID uuid.UUID) {
	s.Emit(appID, EventUserMFAEnabled, map[string]interface{}{
		"user_id": userID.String(),
	}, "auth", &userID)
}

// MFADisabled emite evento de MFA desabilitado
func (s *EventService) MFADisabled(appID, userID uuid.UUID) {
	s.Emit(appID, EventUserMFADisabled, map[string]interface{}{
		"user_id": userID.String(),
	}, "auth", &userID)
}

// PaymentSucceeded emite evento de pagamento bem-sucedido
func (s *EventService) PaymentSucceeded(appID, userID uuid.UUID, amount int64, currency string) {
	s.Emit(appID, EventPaymentSucceeded, map[string]interface{}{
		"user_id":  userID.String(),
		"amount":   amount,
		"currency": currency,
	}, "billing", &userID)
}

// PaymentFailed emite evento de pagamento falhou
func (s *EventService) PaymentFailed(appID, userID uuid.UUID, amount int64, reason string) {
	s.Emit(appID, EventPaymentFailed, map[string]interface{}{
		"user_id": userID.String(),
		"amount":  amount,
		"reason":  reason,
	}, "billing", &userID)
}

// AlertTriggered emite evento de alerta
func (s *EventService) AlertTriggered(appID uuid.UUID, alertType, severity, message string) {
	s.Emit(appID, EventAlertTriggered, map[string]interface{}{
		"alert_type": alertType,
		"severity":   severity,
		"message":    message,
	}, "system", nil)
}

// GetRecentEvents retorna eventos recentes de um app
func (s *EventService) GetRecentEvents(appID uuid.UUID, limit int) ([]Event, error) {
	var events []Event
	err := s.db.Where("app_id = ?", appID).
		Order("created_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetUserEvents retorna eventos de um usuário
func (s *EventService) GetUserEvents(userID uuid.UUID, limit int) ([]Event, error) {
	var events []Event
	err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

// GetEventStats retorna estatísticas de eventos de um app
func (s *EventService) GetEventStats(appID uuid.UUID) (map[string]interface{}, error) {
	var total int64
	s.db.Model(&Event{}).Where("app_id = ?", appID).Count(&total)

	// Contagem por tipo
	type TypeCount struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
	}
	var typeCounts []TypeCount
	s.db.Model(&Event{}).
		Select("type, count(*) as count").
		Where("app_id = ?", appID).
		Group("type").
		Order("count DESC").
		Scan(&typeCounts)

	// Eventos nas últimas 24h
	var last24h int64
	s.db.Model(&Event{}).
		Where("app_id = ? AND created_at > NOW() - INTERVAL '24 hours'", appID).
		Count(&last24h)

	// Eventos na última hora
	var lastHour int64
	s.db.Model(&Event{}).
		Where("app_id = ? AND created_at > NOW() - INTERVAL '1 hour'", appID).
		Count(&lastHour)

	return map[string]interface{}{
		"app_id":      appID,
		"total":       total,
		"by_type":     typeCounts,
		"last_24h":    last24h,
		"last_hour":   lastHour,
	}, nil
}
