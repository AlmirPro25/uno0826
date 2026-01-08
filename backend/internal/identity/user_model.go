package identity

import (
	"time"

	"github.com/google/uuid"
)

// ========================================
// USER MODELS - IDENTIDADE REAL
// Telefone é credencial, não identidade
// ========================================

// User é a entidade principal - a pessoa real
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Status    string    `gorm:"size:50;default:active" json:"status"` // active, suspended, banned
	Role      string    `gorm:"size:50;default:user" json:"role"`     // user, admin, super_admin
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Legacy fields for compatibility
	Username     string `gorm:"size:255" json:"username,omitempty"`
	Email        string `gorm:"size:255" json:"email,omitempty"`
	PasswordHash string `gorm:"type:text" json:"-"`
	Roles        string `gorm:"type:text" json:"roles,omitempty"`
	Version      int    `json:"version,omitempty"`

	// Relations
	Profile     *UserProfile  `gorm:"foreignKey:UserID" json:"profile,omitempty"`
	AuthMethods []AuthMethod  `gorm:"foreignKey:UserID" json:"auth_methods,omitempty"`
}

// UserProfile são os dados humanos do usuário
type UserProfile struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"user_id"`
	Name      string    `gorm:"size:255" json:"name"`
	Email     string    `gorm:"size:255;index" json:"email"`
	AvatarURL string    `gorm:"size:500" json:"avatar_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// AuthMethod são as formas de login (telefone, google, etc)
type AuthMethod struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	Type       string    `gorm:"size:50" json:"type"`                  // phone, google, apple, email
	Identifier string    `gorm:"size:255;uniqueIndex" json:"identifier"` // +5511999999999 ou email
	Verified   bool      `gorm:"default:false" json:"verified"`
	CreatedAt  time.Time `json:"created_at"`
}

// UserStatus constants
const (
	UserStatusActive    = "active"
	UserStatusSuspended = "suspended"
	UserStatusBanned    = "banned"
)

// UserRole constants
const (
	UserRoleUser       = "user"
	UserRoleAdmin      = "admin"
	UserRoleSuperAdmin = "super_admin"
)

// AuthMethodType constants
const (
	AuthMethodPhone  = "phone"
	AuthMethodGoogle = "google"
	AuthMethodApple  = "apple"
	AuthMethodEmail  = "email"
)

// TableName for User
func (User) TableName() string {
	return "users"
}

// TableName for UserProfile
func (UserProfile) TableName() string {
	return "user_profiles"
}

// TableName for AuthMethod
func (AuthMethod) TableName() string {
	return "auth_methods"
}
