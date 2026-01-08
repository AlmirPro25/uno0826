package identity

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// IDENTITY KERNEL - SOVEREIGN MODELS
// Projeções derivadas dos eventos
// ========================================

// SovereignIdentity representa uma identidade soberana no kernel
// Esta é a entidade PRINCIPAL - phone é a identidade, não email
type SovereignIdentity struct {
	UserID       uuid.UUID `gorm:"type:text;primaryKey" json:"user_id"`
	PrimaryPhone string    `gorm:"type:text;uniqueIndex:idx_identity_phone;not null" json:"primary_phone"`
	Source       string    `gorm:"type:text;not null" json:"source"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (SovereignIdentity) TableName() string {
	return "sovereign_identities"
}

// IdentityLink representa um provider linkado à identidade soberana
// Google, email, etc são SECUNDÁRIOS - phone é primário
type IdentityLink struct {
	ID         uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	UserID     uuid.UUID `gorm:"type:text;not null;index:idx_link_user" json:"user_id"`
	Provider   string    `gorm:"type:text;not null" json:"provider"`
	ProviderID string    `gorm:"type:text;not null" json:"provider_id"`
	LinkedAt   time.Time `gorm:"not null" json:"linked_at"`
}

func (IdentityLink) TableName() string {
	return "identity_links"
}

// Constraint: UNIQUE(provider, provider_id) - evita duplicação

// PendingVerification representa uma verificação OTP em andamento
// TTL curto - não é ledger permanente
type PendingVerification struct {
	VerificationID uuid.UUID `gorm:"type:text;primaryKey" json:"verification_id"`
	PhoneNumber    string    `gorm:"type:text;not null;index:idx_pending_phone" json:"phone_number"`
	CodeHash       string    `gorm:"type:text;not null" json:"code_hash"`
	Channel        string    `gorm:"type:text;not null" json:"channel"`
	Attempts       int       `gorm:"default:0" json:"attempts"`
	RequestIP      string    `gorm:"type:text" json:"request_ip"`
	CreatedAt      time.Time `gorm:"not null" json:"created_at"`
	ExpiresAt      time.Time `gorm:"not null;index:idx_pending_expires" json:"expires_at"`
}

func (PendingVerification) TableName() string {
	return "pending_verifications"
}

// SovereignSession representa uma sessão ativa
// Sessão é DERIVADA da identidade, não É a identidade
type SovereignSession struct {
	SessionID         uuid.UUID `gorm:"type:text;primaryKey" json:"session_id"`
	UserID            uuid.UUID `gorm:"type:text;not null;index:idx_session_user" json:"user_id"`
	DeviceFingerprint string    `gorm:"type:text" json:"device_fingerprint"`
	CreatedAt         time.Time `gorm:"not null" json:"created_at"`
	ExpiresAt         time.Time `gorm:"not null;index:idx_session_expires" json:"expires_at"`
	IsActive          bool      `gorm:"default:true" json:"is_active"`
}

func (SovereignSession) TableName() string {
	return "sovereign_sessions"
}

// RateLimitEntry controla rate limiting por phone/IP
type RateLimitEntry struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	Key          string    `gorm:"type:text;not null;uniqueIndex:idx_ratelimit_key" json:"key"` // phone:+5511... ou ip:192.168...
	AttemptCount int       `gorm:"default:0" json:"attempt_count"`
	WindowStart  time.Time `gorm:"not null" json:"window_start"`
	BlockedUntil time.Time `json:"blocked_until"`
}

func (RateLimitEntry) TableName() string {
	return "rate_limit_entries"
}
