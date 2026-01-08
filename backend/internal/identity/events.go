package identity

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// IDENTITY KERNEL - EVENT DEFINITIONS
// "Phone é identidade. WhatsApp é canal."
// ========================================

// EventType define os tipos de eventos do Identity Kernel
type EventType string

const (
	EventPhoneVerificationRequested EventType = "phone_verification_requested"
	EventPhoneVerificationFailed    EventType = "phone_verification_failed"
	EventPhoneVerificationRateLimited EventType = "phone_verification_rate_limited"
	EventPhoneVerified              EventType = "phone_verified"
	EventIdentityCreated            EventType = "identity_created"
	EventIdentityLinked             EventType = "identity_linked"
	EventSessionCreated             EventType = "session_created"
	EventSessionRevoked             EventType = "session_revoked"
)

// Channel define os canais de entrega de OTP
type Channel string

const (
	ChannelWhatsApp Channel = "whatsapp"
	ChannelSMS      Channel = "sms"
)

// VerificationFailReason define razões de falha
type VerificationFailReason string

const (
	ReasonInvalidCode  VerificationFailReason = "invalid_code"
	ReasonExpired      VerificationFailReason = "expired"
	ReasonRateLimited  VerificationFailReason = "rate_limited"
)

// IdentitySource define a origem da identidade
type IdentitySource string

const (
	SourcePhone     IdentitySource = "phone"
	SourceMigration IdentitySource = "migration"
	SourceAdmin     IdentitySource = "admin"
)

// Provider define provedores de identidade linkáveis
type Provider string

const (
	ProviderGoogle Provider = "google"
	ProviderEmail  Provider = "email"
	ProviderPhone  Provider = "phone"
)

// SessionRevokeReason define razões de revogação
type SessionRevokeReason string

const (
	RevokeLogout  SessionRevokeReason = "logout"
	RevokeExpired SessionRevokeReason = "expired"
	RevokeForced  SessionRevokeReason = "forced"
)

// ========================================
// EVENT PAYLOADS
// ========================================

// PhoneVerificationRequestedPayload - Evento 1
type PhoneVerificationRequestedPayload struct {
	VerificationID uuid.UUID `json:"verification_id"`
	PhoneNumber    string    `json:"phone_number"`
	Channel        Channel   `json:"channel"`
	CodeHash       string    `json:"code_hash"`
	ExpiresAt      time.Time `json:"expires_at"`
	RequestIP      string    `json:"request_ip"`
}

// PhoneVerificationFailedPayload - Evento 2
type PhoneVerificationFailedPayload struct {
	VerificationID uuid.UUID              `json:"verification_id"`
	PhoneNumber    string                 `json:"phone_number"`
	Reason         VerificationFailReason `json:"reason"`
	AttemptCount   int                    `json:"attempt_count"`
	FailedAt       time.Time              `json:"failed_at"`
}

// PhoneVerificationRateLimitedPayload - Evento 2.5 (anti-abuse)
type PhoneVerificationRateLimitedPayload struct {
	PhoneNumber   string    `json:"phone_number"`
	RequestIP     string    `json:"request_ip"`
	BlockedUntil  time.Time `json:"blocked_until"`
	TriggerReason string    `json:"trigger_reason"` // "too_many_attempts" | "ip_abuse"
}

// PhoneVerifiedPayload - Evento 3
type PhoneVerifiedPayload struct {
	VerificationID uuid.UUID `json:"verification_id"`
	PhoneNumber    string    `json:"phone_number"`
	UserID         uuid.UUID `json:"user_id"`
	VerifiedAt     time.Time `json:"verified_at"`
	ChannelUsed    Channel   `json:"channel_used"`
}

// IdentityCreatedPayload - Evento 4
type IdentityCreatedPayload struct {
	UserID       uuid.UUID      `json:"user_id"`
	PrimaryPhone string         `json:"primary_phone"`
	Source       IdentitySource `json:"source"`
	CreatedAt    time.Time      `json:"created_at"`
}

// IdentityLinkedPayload - Evento 5
type IdentityLinkedPayload struct {
	UserID     uuid.UUID `json:"user_id"`
	Provider   Provider  `json:"provider"`
	ProviderID string    `json:"provider_id"`
	LinkedAt   time.Time `json:"linked_at"`
}

// SessionCreatedPayload - Evento 6
type SessionCreatedPayload struct {
	SessionID         uuid.UUID `json:"session_id"`
	UserID            uuid.UUID `json:"user_id"`
	DeviceFingerprint string    `json:"device_fingerprint"`
	ExpiresAt         time.Time `json:"expires_at"`
}

// SessionRevokedPayload - Evento 7
type SessionRevokedPayload struct {
	SessionID uuid.UUID           `json:"session_id"`
	Reason    SessionRevokeReason `json:"reason"`
	RevokedAt time.Time           `json:"revoked_at"`
}
