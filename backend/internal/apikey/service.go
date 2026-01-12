package apikey

/*
================================================================================
API KEY SERVICE — Autenticação de Apps Externos
================================================================================

Permite que apps externos se autentiquem com o kernel usando API keys.
Cada app pode ter múltiplas API keys com diferentes permissões.

"Apps não usam senha. Apps usam chaves."

================================================================================
*/

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// APIKeyScope define o escopo de permissões
type APIKeyScope string

const (
	ScopeRead      APIKeyScope = "read"       // Apenas leitura
	ScopeWrite     APIKeyScope = "write"      // Leitura e escrita
	ScopeAdmin     APIKeyScope = "admin"      // Acesso administrativo
	ScopeTelemetry APIKeyScope = "telemetry"  // Apenas telemetria
	ScopeIdentity  APIKeyScope = "identity"   // Operações de identidade
	ScopeBilling   APIKeyScope = "billing"    // Operações de billing
)

// APIKey representa uma chave de API
type APIKey struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	AppID       uuid.UUID  `gorm:"type:uuid;index;not null" json:"app_id"`
	Name        string     `gorm:"size:100;not null" json:"name"`
	KeyPrefix   string     `gorm:"size:12;index;not null" json:"key_prefix"` // Primeiros 8 chars para identificação
	KeyHash     string     `gorm:"size:64;not null" json:"-"`                // SHA256 da key completa
	Scopes      string     `gorm:"type:text" json:"scopes"`                  // JSON array de scopes
	Description string     `gorm:"size:255" json:"description"`
	Status      string     `gorm:"size:20;default:active" json:"status"` // active, revoked, expired
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	LastUsedIP  string     `gorm:"size:45" json:"last_used_ip,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	CreatedBy   uuid.UUID  `gorm:"type:uuid" json:"created_by"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
	RevokedBy   *uuid.UUID `gorm:"type:uuid" json:"revoked_by,omitempty"`
}

// APIKeyUsage registra uso de API keys
type APIKeyUsage struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	KeyID     uuid.UUID `gorm:"type:uuid;index;not null" json:"key_id"`
	Endpoint  string    `gorm:"size:255" json:"endpoint"`
	Method    string    `gorm:"size:10" json:"method"`
	IP        string    `gorm:"size:45" json:"ip"`
	UserAgent string    `gorm:"size:255" json:"user_agent"`
	Status    int       `json:"status"`
	Duration  int64     `json:"duration_ms"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

// APIKeyService serviço de API keys
type APIKeyService struct {
	db *gorm.DB
}

// NewAPIKeyService cria novo serviço
func NewAPIKeyService(db *gorm.DB) *APIKeyService {
	db.AutoMigrate(&APIKey{}, &APIKeyUsage{})
	return &APIKeyService{db: db}
}

// CreateKey cria uma nova API key
func (s *APIKeyService) CreateKey(appID, createdBy uuid.UUID, name string, scopes []APIKeyScope, description string, expiresAt *time.Time) (*APIKey, string, error) {
	// Gerar key aleatória (32 bytes = 64 hex chars)
	rawKey := generateAPIKey()
	keyPrefix := rawKey[:8]
	keyHash := hashAPIKey(rawKey)

	// Converter scopes para JSON
	scopeStrings := make([]string, len(scopes))
	for i, s := range scopes {
		scopeStrings[i] = string(s)
	}
	scopesJSON := fmt.Sprintf(`["%s"]`, strings.Join(scopeStrings, `","`))

	key := &APIKey{
		ID:          uuid.New(),
		AppID:       appID,
		Name:        name,
		KeyPrefix:   keyPrefix,
		KeyHash:     keyHash,
		Scopes:      scopesJSON,
		Description: description,
		Status:      "active",
		ExpiresAt:   expiresAt,
		CreatedAt:   time.Now(),
		CreatedBy:   createdBy,
	}

	if err := s.db.Create(key).Error; err != nil {
		return nil, "", fmt.Errorf("erro ao criar API key: %w", err)
	}

	// Retorna a key completa apenas uma vez (formato: pqs_<key>)
	fullKey := fmt.Sprintf("pqs_%s", rawKey)
	return key, fullKey, nil
}

// ValidateKey valida uma API key e retorna os dados
func (s *APIKeyService) ValidateKey(rawKey string) (*APIKey, error) {
	// Remover prefixo se existir
	if strings.HasPrefix(rawKey, "pqs_") {
		rawKey = strings.TrimPrefix(rawKey, "pqs_")
	}

	if len(rawKey) < 8 {
		return nil, fmt.Errorf("API key inválida")
	}

	keyPrefix := rawKey[:8]
	keyHash := hashAPIKey(rawKey)

	var key APIKey
	err := s.db.Where("key_prefix = ? AND key_hash = ? AND status = ?", keyPrefix, keyHash, "active").First(&key).Error
	if err != nil {
		return nil, fmt.Errorf("API key não encontrada ou inválida")
	}

	// Verificar expiração
	if key.ExpiresAt != nil && key.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("API key expirada")
	}

	return &key, nil
}

// RecordUsage registra uso de uma API key
func (s *APIKeyService) RecordUsage(keyID uuid.UUID, endpoint, method, ip, userAgent string, status int, duration int64) {
	// Atualizar last_used
	s.db.Model(&APIKey{}).Where("id = ?", keyID).Updates(map[string]interface{}{
		"last_used_at": time.Now(),
		"last_used_ip": ip,
	})

	// Registrar uso (async para não bloquear)
	go func() {
		usage := &APIKeyUsage{
			ID:        uuid.New(),
			KeyID:     keyID,
			Endpoint:  endpoint,
			Method:    method,
			IP:        ip,
			UserAgent: userAgent,
			Status:    status,
			Duration:  duration,
			CreatedAt: time.Now(),
		}
		s.db.Create(usage)
	}()
}

// ListKeys lista API keys de um app
func (s *APIKeyService) ListKeys(appID uuid.UUID) ([]APIKey, error) {
	var keys []APIKey
	err := s.db.Where("app_id = ?", appID).Order("created_at DESC").Find(&keys).Error
	return keys, err
}

// GetKey busca uma API key por ID
func (s *APIKeyService) GetKey(id uuid.UUID) (*APIKey, error) {
	var key APIKey
	if err := s.db.Where("id = ?", id).First(&key).Error; err != nil {
		return nil, err
	}
	return &key, nil
}

// RevokeKey revoga uma API key
func (s *APIKeyService) RevokeKey(id, revokedBy uuid.UUID) error {
	now := time.Now()
	return s.db.Model(&APIKey{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     "revoked",
		"revoked_at": now,
		"revoked_by": revokedBy,
	}).Error
}

// DeleteKey remove uma API key (soft delete via revoke)
func (s *APIKeyService) DeleteKey(id, deletedBy uuid.UUID) error {
	return s.RevokeKey(id, deletedBy)
}

// GetUsageStats retorna estatísticas de uso de uma key
func (s *APIKeyService) GetUsageStats(keyID uuid.UUID, days int) (*KeyUsageStats, error) {
	stats := &KeyUsageStats{KeyID: keyID}
	since := time.Now().AddDate(0, 0, -days)

	// Total de requisições
	s.db.Model(&APIKeyUsage{}).Where("key_id = ? AND created_at > ?", keyID, since).Count(&stats.TotalRequests)

	// Requisições com sucesso (2xx)
	s.db.Model(&APIKeyUsage{}).Where("key_id = ? AND created_at > ? AND status >= 200 AND status < 300", keyID, since).Count(&stats.SuccessRequests)

	// Requisições com erro
	stats.ErrorRequests = stats.TotalRequests - stats.SuccessRequests

	// Latência média
	var avgDuration float64
	s.db.Model(&APIKeyUsage{}).Where("key_id = ? AND created_at > ?", keyID, since).Select("AVG(duration)").Scan(&avgDuration)
	stats.AvgLatencyMs = avgDuration

	// Endpoints mais usados
	var topEndpoints []EndpointCount
	s.db.Model(&APIKeyUsage{}).
		Select("endpoint, COUNT(*) as count").
		Where("key_id = ? AND created_at > ?", keyID, since).
		Group("endpoint").
		Order("count DESC").
		Limit(5).
		Scan(&topEndpoints)
	stats.TopEndpoints = topEndpoints

	return stats, nil
}

// KeyUsageStats estatísticas de uso
type KeyUsageStats struct {
	KeyID           uuid.UUID       `json:"key_id"`
	TotalRequests   int64           `json:"total_requests"`
	SuccessRequests int64           `json:"success_requests"`
	ErrorRequests   int64           `json:"error_requests"`
	AvgLatencyMs    float64         `json:"avg_latency_ms"`
	TopEndpoints    []EndpointCount `json:"top_endpoints"`
}

// EndpointCount contagem por endpoint
type EndpointCount struct {
	Endpoint string `json:"endpoint"`
	Count    int64  `json:"count"`
}

// HasScope verifica se a key tem um scope específico
func (k *APIKey) HasScope(scope APIKeyScope) bool {
	return strings.Contains(k.Scopes, string(scope)) || strings.Contains(k.Scopes, "admin")
}

// Helpers
func generateAPIKey() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func hashAPIKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}
