package application

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// APPLICATION IDENTITY
// "O PROST-QS não serve usuários. Ele serve aplicativos."
// ========================================

// Application representa um app que integra com o PROST-QS
type Application struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	Name        string    `gorm:"type:text;not null" json:"name"`
	Slug        string    `gorm:"type:text;not null;uniqueIndex" json:"slug"`
	Description string    `gorm:"type:text" json:"description"`
	OwnerID     uuid.UUID `gorm:"type:text;not null;index" json:"owner_id"`     // Quem criou o app
	OwnerType   string    `gorm:"type:text;not null" json:"owner_type"`         // user, org, system
	Status      string    `gorm:"type:text;not null;default:'active'" json:"status"` // active, suspended, deleted
	Settings    string    `gorm:"type:text" json:"settings,omitempty"`          // JSON config
	WebhookURL  string    `gorm:"type:text" json:"webhook_url,omitempty"`
	RedirectURL string    `gorm:"type:text" json:"redirect_url,omitempty"`
	CreatedAt   time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Application) TableName() string {
	return "applications"
}

// AppStatus constantes
const (
	AppStatusActive    = "active"
	AppStatusSuspended = "suspended"
	AppStatusDeleted   = "deleted"
)

// OwnerType constantes
const (
	OwnerTypeUser   = "user"
	OwnerTypeOrg    = "org"
	OwnerTypeSystem = "system"
)

// ========================================
// APP CREDENTIALS
// "Como o sistema reconhece de onde vem a request"
// ========================================

// AppCredential representa as credenciais de um app
type AppCredential struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID        uuid.UUID `gorm:"type:text;not null;index" json:"app_id"`
	Name         string    `gorm:"type:text;not null" json:"name"`              // "Production", "Development"
	PublicKey    string    `gorm:"type:text;not null;uniqueIndex" json:"public_key"` // pq_pk_xxx
	SecretHash   string    `gorm:"type:text;not null" json:"-"`                 // Hash do secret
	Scopes       string    `gorm:"type:text" json:"scopes"`                     // JSON array: ["identity", "billing", "agents"]
	Status       string    `gorm:"type:text;not null;default:'active'" json:"status"`
	LastUsedAt   *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (AppCredential) TableName() string {
	return "app_credentials"
}

// ========================================
// APP USER
// "Usuário sempre existe DENTRO de um app"
// ========================================

// AppUser representa um usuário dentro de um app específico
type AppUser struct {
	ID             uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID          uuid.UUID `gorm:"type:text;not null;index:idx_appuser_app" json:"app_id"`
	UserID         uuid.UUID `gorm:"type:text;not null;index:idx_appuser_user" json:"user_id"` // Referência ao User global
	ExternalUserID string    `gorm:"type:text" json:"external_user_id,omitempty"`             // ID no sistema do cliente
	Status         string    `gorm:"type:text;not null;default:'active'" json:"status"`
	Metadata       string    `gorm:"type:text" json:"metadata,omitempty"`                     // JSON extra
	FirstSeenAt    time.Time `gorm:"not null" json:"first_seen_at"`
	LastSeenAt     time.Time `json:"last_seen_at"`
	CreatedAt      time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (AppUser) TableName() string {
	return "app_users"
}

// Índice único: um user só pode existir uma vez por app
// CREATE UNIQUE INDEX idx_appuser_unique ON app_users(app_id, user_id)

// ========================================
// APP SESSION
// "Quando o usuário logou, em qual app, de onde"
// ========================================

// AppSession representa uma sessão de usuário em um app
type AppSession struct {
	ID          uuid.UUID  `gorm:"type:text;primaryKey" json:"id"`
	AppID       uuid.UUID  `gorm:"type:text;not null;index" json:"app_id"`
	AppUserID   uuid.UUID  `gorm:"type:text;not null;index" json:"app_user_id"`
	UserID      uuid.UUID  `gorm:"type:text;not null;index" json:"user_id"`
	IPAddress   string     `gorm:"type:text" json:"ip_address"`
	UserAgent   string     `gorm:"type:text" json:"user_agent"`
	DeviceType  string     `gorm:"type:text" json:"device_type"`  // mobile, desktop, tablet
	Country     string     `gorm:"type:text" json:"country"`
	Status      string     `gorm:"type:text;not null;default:'active'" json:"status"` // active, expired, revoked
	CreatedAt   time.Time  `gorm:"not null" json:"created_at"`
	ExpiresAt   time.Time  `gorm:"not null" json:"expires_at"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
	RevokeReason string    `gorm:"type:text" json:"revoke_reason,omitempty"`
}

func (AppSession) TableName() string {
	return "app_sessions"
}

// SessionStatus constantes
const (
	SessionStatusActive  = "active"
	SessionStatusExpired = "expired"
	SessionStatusRevoked = "revoked"
)

// ========================================
// REQUEST CONTEXT
// "Toda request carrega app_context"
// ========================================

// RequestContext é o contexto completo de uma request
type RequestContext struct {
	App        *Application `json:"app"`
	AppUser    *AppUser     `json:"app_user,omitempty"`
	Session    *AppSession  `json:"session,omitempty"`
	UserID     uuid.UUID    `json:"user_id"`
	RiskLevel  string       `json:"risk_level"`  // low, medium, high, critical
	Scopes     []string     `json:"scopes"`
	IsInternal bool         `json:"is_internal"` // Request do próprio sistema
}

// ========================================
// APP METRICS (para dashboard)
// ========================================

// AppMetrics métricas agregadas de um app
type AppMetrics struct {
	AppID           uuid.UUID `json:"app_id"`
	TotalUsers      int64     `json:"total_users"`
	ActiveUsers24h  int64     `json:"active_users_24h"`
	TotalSessions   int64     `json:"total_sessions"`
	ActiveSessions  int64     `json:"active_sessions"`
	TotalDecisions  int64     `json:"total_decisions"`
	TotalApprovals  int64     `json:"total_approvals"`
	TotalRevenue    int64     `json:"total_revenue"` // centavos
	RiskScore       float64   `json:"risk_score"`
	LastActivityAt  time.Time `json:"last_activity_at"`
}
