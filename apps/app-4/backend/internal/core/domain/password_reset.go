package domain

import "time"

// PasswordResetToken represents a token for password reset.
type PasswordResetToken struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int       `gorm:"column:user_id;not null" json:"userId"`
	Token     string    `gorm:"column:token;not null;uniqueIndex" json:"token"`
	ExpiresAt time.Time `gorm:"column:expires_at;not null" json:"expiresAt"`
	Used      bool      `gorm:"column:used;default:false" json:"used"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`

	// Relations
	User User `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
}
