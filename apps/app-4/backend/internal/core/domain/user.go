package domain

import "time"

// Role represents the user's role in the system.
type Role struct {
	ID   int    `gorm:"primaryKey" json:"id"`
	Name string `gorm:"unique;not null" json:"name"` // ADMIN, MEDICO, PACIENTE
}

// User represents a user (admin, doctor, or patient) in the system.
type User struct {
	ID           int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Email        string    `gorm:"unique;not null" json:"email"`
	PasswordHash string    `gorm:"column:password_hash" json:"-"`
	FullName     string    `gorm:"column:full_name" json:"fullName"`
	Phone        *string   `gorm:"column:phone" json:"phone"`
	Specialty    *string   `gorm:"column:specialty" json:"specialty"` // For doctors only
	CRM          *string   `gorm:"column:crm" json:"crm"`             // Doctor's registration number
	RoleID       int       `gorm:"column:role_id;not null" json:"-"`
	Role         Role      `gorm:"foreignKey:RoleID" json:"role"`
	IsActive     bool      `gorm:"column:is_active;default:true" json:"isActive"`
	TokenVersion int       `gorm:"column:token_version;default:0" json:"-"` // Incremented to invalidate all tokens
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}

// UserRole constants for better type safety
const (
	RoleAdmin    = "ADMIN"
	RoleMedico   = "MEDICO"
	RolePaciente = "PACIENTE"
)
