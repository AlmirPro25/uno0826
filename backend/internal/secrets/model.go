package secrets

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ========================================
// SECRETS SYSTEM - FASE 20
// "Segredos pertencem à plataforma, não ao app"
// ========================================

// Secret representa um segredo armazenado
type Secret struct {
	ID          uuid.UUID  `gorm:"type:text;primaryKey" json:"id"`
	AppID       *uuid.UUID `gorm:"type:text;index" json:"app_id,omitempty"`      // nil = global
	Environment string     `gorm:"type:text;not null;index" json:"environment"` // production, staging, development
	Name        string     `gorm:"type:text;not null;index" json:"name"`        // STRIPE_SECRET_KEY, etc
	
	// Valor criptografado (AES-256)
	EncryptedValue string `gorm:"type:text;not null" json:"-"` // Nunca expor
	
	// Metadados
	Description string `gorm:"type:text" json:"description"`
	Category    string `gorm:"type:text" json:"category"` // api_key, oauth, database, custom
	
	// Versionamento
	Version   int       `gorm:"not null;default:1" json:"version"`
	ExpiresAt *time.Time `gorm:"index" json:"expires_at,omitempty"`
	
	// Controle
	IsActive  bool      `gorm:"not null;default:true" json:"is_active"`
	CreatedBy uuid.UUID `gorm:"type:text;not null" json:"created_by"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null" json:"updated_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	RevokedBy *uuid.UUID `gorm:"type:text" json:"revoked_by,omitempty"`
}

func (Secret) TableName() string {
	return "secrets"
}

// SecretVersion histórico de versões
type SecretVersion struct {
	ID             uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	SecretID       uuid.UUID `gorm:"type:text;not null;index" json:"secret_id"`
	Version        int       `gorm:"not null" json:"version"`
	EncryptedValue string    `gorm:"type:text;not null" json:"-"`
	CreatedBy      uuid.UUID `gorm:"type:text;not null" json:"created_by"`
	CreatedAt      time.Time `gorm:"not null" json:"created_at"`
	Reason         string    `gorm:"type:text" json:"reason"` // rotation, update, etc
}

func (SecretVersion) TableName() string {
	return "secret_versions"
}


// SecretAccess log de acesso a secrets
type SecretAccess struct {
	ID        uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	SecretID  uuid.UUID `gorm:"type:text;not null;index" json:"secret_id"`
	AppID     *uuid.UUID `gorm:"type:text;index" json:"app_id,omitempty"`
	ActorID   uuid.UUID `gorm:"type:text;not null" json:"actor_id"`
	ActorType string    `gorm:"type:text;not null" json:"actor_type"` // user, agent, system
	Action    string    `gorm:"type:text;not null" json:"action"`     // read, inject, list
	IP        string    `gorm:"type:text" json:"ip"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	Success   bool      `gorm:"not null" json:"success"`
	Error     string    `gorm:"type:text" json:"error,omitempty"`
	Timestamp time.Time `gorm:"not null;index" json:"timestamp"`
}

func (SecretAccess) TableName() string {
	return "secret_accesses"
}

// ========================================
// ENUMS E CONSTANTES
// ========================================

// Environments ambientes válidos
var ValidEnvironments = []string{"production", "staging", "development", "test"}

// Categories categorias de secrets
var ValidCategories = []string{"api_key", "oauth", "database", "webhook", "encryption", "custom"}

// ========================================
// DTOs
// ========================================

// CreateSecretRequest request para criar secret
type CreateSecretRequest struct {
	AppID       *uuid.UUID `json:"app_id,omitempty"`
	Environment string     `json:"environment" binding:"required"`
	Name        string     `json:"name" binding:"required"`
	Value       string     `json:"value" binding:"required"` // Plaintext - será criptografado
	Description string     `json:"description"`
	Category    string     `json:"category"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

// UpdateSecretRequest request para atualizar secret
type UpdateSecretRequest struct {
	Value       string     `json:"value" binding:"required"` // Novo valor
	Reason      string     `json:"reason" binding:"required"` // Motivo da atualização
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

// SecretResponse resposta segura (sem valor)
type SecretResponse struct {
	ID          uuid.UUID  `json:"id"`
	AppID       *uuid.UUID `json:"app_id,omitempty"`
	Environment string     `json:"environment"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Category    string     `json:"category"`
	Version     int        `json:"version"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	IsActive    bool       `json:"is_active"`
	IsExpired   bool       `json:"is_expired"`
	LastChars   string     `json:"last_chars"` // Últimos 4 caracteres (mascarado)
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// SecretListResponse lista de secrets
type SecretListResponse struct {
	Secrets []SecretResponse `json:"secrets"`
	Total   int64            `json:"total"`
}

// SecretInjectRequest request para injetar secrets em app
type SecretInjectRequest struct {
	AppID       uuid.UUID `json:"app_id" binding:"required"`
	Environment string    `json:"environment" binding:"required"`
	Names       []string  `json:"names"` // Se vazio, injeta todos do app/env
}

// SecretInjectResponse resposta de injeção (valores descriptografados)
// ATENÇÃO: Só usar internamente, nunca expor via API pública
type SecretInjectResponse struct {
	Secrets map[string]string `json:"secrets"` // name -> value
	Count   int               `json:"count"`
}

// ========================================
// HELPERS
// ========================================

// StringSlice para serialização GORM
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

func (s *StringSlice) Scan(value any) error {
	if value == nil {
		*s = []string{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		*s = []string{}
		return nil
	}
	return json.Unmarshal(bytes, s)
}

// IsValidEnvironment verifica se ambiente é válido
func IsValidEnvironment(env string) bool {
	for _, e := range ValidEnvironments {
		if e == env {
			return true
		}
	}
	return false
}

// IsValidCategory verifica se categoria é válida
func IsValidCategory(cat string) bool {
	if cat == "" {
		return true // Opcional
	}
	for _, c := range ValidCategories {
		if c == cat {
			return true
		}
	}
	return false
}
