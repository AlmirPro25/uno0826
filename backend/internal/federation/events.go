package federation

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// FEDERATION KERNEL - EVENT DEFINITIONS
// "Google é provider. Identity é soberana."
// ========================================

// EventType define os tipos de eventos de Federation
type EventType string

const (
	EventOAuthStarted       EventType = "oauth_started"
	EventOAuthCompleted     EventType = "oauth_completed"
	EventOAuthFailed        EventType = "oauth_failed"
	EventIdentityLinked     EventType = "identity_linked"
	EventIdentityUnlinked   EventType = "identity_unlinked"
	EventAccountMerged      EventType = "account_merged"
	EventAccountMergeFailed EventType = "account_merge_failed"
)

// Provider define provedores OAuth suportados
type Provider string

const (
	ProviderGoogle   Provider = "google"
	ProviderApple    Provider = "apple"    // Futuro
	ProviderFacebook Provider = "facebook" // Futuro
)

// ========================================
// EVENT PAYLOADS
// ========================================

// OAuthStartedPayload - Início do fluxo OAuth
type OAuthStartedPayload struct {
	StateID     uuid.UUID `json:"state_id"`
	Provider    Provider  `json:"provider"`
	RedirectURI string    `json:"redirect_uri"`
	RequestIP   string    `json:"request_ip"`
	StartedAt   time.Time `json:"started_at"`
}

// OAuthCompletedPayload - OAuth concluído com sucesso
type OAuthCompletedPayload struct {
	StateID      uuid.UUID `json:"state_id"`
	Provider     Provider  `json:"provider"`
	ProviderID   string    `json:"provider_id"`   // ID único do provider (Google sub)
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	Picture      string    `json:"picture"`
	UserID       uuid.UUID `json:"user_id"`       // Identity soberana linkada
	IsNewUser    bool      `json:"is_new_user"`
	CompletedAt  time.Time `json:"completed_at"`
}

// OAuthFailedPayload - OAuth falhou
type OAuthFailedPayload struct {
	StateID   uuid.UUID `json:"state_id"`
	Provider  Provider  `json:"provider"`
	Error     string    `json:"error"`
	ErrorDesc string    `json:"error_description"`
	FailedAt  time.Time `json:"failed_at"`
}

// IdentityLinkedPayload - Provider linkado à identity existente
type IdentityLinkedPayload struct {
	LinkID     uuid.UUID `json:"link_id"`
	UserID     uuid.UUID `json:"user_id"`
	Provider   Provider  `json:"provider"`
	ProviderID string    `json:"provider_id"`
	Email      string    `json:"email"`
	LinkedAt   time.Time `json:"linked_at"`
}

// IdentityUnlinkedPayload - Provider desvinculado
type IdentityUnlinkedPayload struct {
	LinkID     uuid.UUID `json:"link_id"`
	UserID     uuid.UUID `json:"user_id"`
	Provider   Provider  `json:"provider"`
	Reason     string    `json:"reason"`
	UnlinkedAt time.Time `json:"unlinked_at"`
}

// AccountMergedPayload - Duas identities foram mescladas
type AccountMergedPayload struct {
	PrimaryUserID   uuid.UUID `json:"primary_user_id"`
	SecondaryUserID uuid.UUID `json:"secondary_user_id"`
	MergedAt        time.Time `json:"merged_at"`
}

// AccountMergeFailedPayload - Merge falhou
type AccountMergeFailedPayload struct {
	PrimaryUserID   uuid.UUID `json:"primary_user_id"`
	SecondaryUserID uuid.UUID `json:"secondary_user_id"`
	Reason          string    `json:"reason"`
	FailedAt        time.Time `json:"failed_at"`
}
