
package identity

import (
	"time"

	"github.com/google/uuid"
)

// LegacyUser modelo antigo (deprecated) - mantido para compatibilidade
type LegacyUser struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Username     string    `gorm:"size:255;uniqueIndex" json:"username"`
	Email        string    `gorm:"size:255;uniqueIndex" json:"email"`
	PasswordHash string    `gorm:"type:text" json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	Roles        string    `gorm:"type:jsonb" json:"roles"`
	Version      int       `json:"version"`
}

func (LegacyUser) TableName() string {
	return "legacy_users"
}

// UserProfileResponse representa o perfil de um usuário para retorno na API.
type UserProfileResponse struct {
	UserID    string    `json:"userId"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Roles     string    `json:"roles"`
	CreatedAt time.Time `json:"createdAt"`
}

// ApplicationAccess representa o acesso de um usuário a uma aplicação.
type ApplicationAccess struct {
	AppID   string `json:"appId"`
	AppName string `json:"appName"`
	Scope   string `json:"scope"`
}

