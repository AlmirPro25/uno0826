package federation

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// FEDERATION KERNEL - MODELS
// Projeções derivadas dos eventos
// ========================================

// OAuthState armazena estado temporário do fluxo OAuth
// TTL curto - não é ledger permanente
type OAuthState struct {
	StateID     uuid.UUID `gorm:"type:text;primaryKey" json:"state_id"`
	Provider    string    `gorm:"type:text;not null" json:"provider"`
	RedirectURI string    `gorm:"type:text" json:"redirect_uri"`
	UserID      uuid.UUID `gorm:"type:text" json:"user_id"` // Se linking a conta existente
	RequestIP   string    `gorm:"type:text" json:"request_ip"`
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	ExpiresAt   time.Time `gorm:"not null;index:idx_oauth_expires" json:"expires_at"`
	Used        bool      `gorm:"default:false" json:"used"`
}

func (OAuthState) TableName() string {
	return "oauth_states"
}

// FederatedIdentity representa um link entre provider externo e identity soberana
type FederatedIdentity struct {
	LinkID      uuid.UUID `gorm:"type:text;primaryKey" json:"link_id"`
	UserID      uuid.UUID `gorm:"type:text;not null;index:idx_federated_user" json:"user_id"`
	Provider    string    `gorm:"type:text;not null" json:"provider"`
	ProviderID  string    `gorm:"type:text;not null" json:"provider_id"` // Google sub, etc
	Email       string    `gorm:"type:text" json:"email"`
	Name        string    `gorm:"type:text" json:"name"`
	Picture     string    `gorm:"type:text" json:"picture"`
	AccessToken string    `gorm:"type:text" json:"-"` // Não expor
	TokenExpiry time.Time `json:"-"`
	LinkedAt    time.Time `gorm:"not null" json:"linked_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (FederatedIdentity) TableName() string {
	return "federated_identities"
}

// Constraint: UNIQUE(provider, provider_id) - um Google account só pode linkar a uma identity

// GoogleUserInfo representa dados retornados pelo Google
type GoogleUserInfo struct {
	Sub           string `json:"sub"`            // ID único do Google
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
}
