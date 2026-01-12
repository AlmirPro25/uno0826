package apikey

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	return db
}

func TestAPIKeyService_CreateKey(t *testing.T) {
	db := setupTestDB(t)
	service := NewAPIKeyService(db)

	appID := uuid.New()
	userID := uuid.New()
	scopes := []APIKeyScope{ScopeRead, ScopeTelemetry}

	key, rawKey, err := service.CreateKey(appID, userID, "Test Key", scopes, "Test description", nil)

	require.NoError(t, err)
	assert.NotNil(t, key)
	assert.NotEmpty(t, rawKey)
	assert.True(t, len(rawKey) > 10)
	assert.Equal(t, "pqs_", rawKey[:4])
	assert.Equal(t, appID, key.AppID)
	assert.Equal(t, "Test Key", key.Name)
	assert.Equal(t, "active", key.Status)
}

func TestAPIKeyService_ValidateKey(t *testing.T) {
	db := setupTestDB(t)
	service := NewAPIKeyService(db)

	appID := uuid.New()
	userID := uuid.New()
	_, rawKey, _ := service.CreateKey(appID, userID, "Test Key", []APIKeyScope{ScopeRead}, "", nil)

	// Validar key válida
	key, err := service.ValidateKey(rawKey)
	require.NoError(t, err)
	assert.NotNil(t, key)
	assert.Equal(t, appID, key.AppID)

	// Validar key inválida
	_, err = service.ValidateKey("pqs_invalid_key_12345678901234567890")
	assert.Error(t, err)
}

func TestAPIKeyService_ListKeys(t *testing.T) {
	db := setupTestDB(t)
	service := NewAPIKeyService(db)

	appID := uuid.New()
	userID := uuid.New()

	// Criar algumas keys
	service.CreateKey(appID, userID, "Key 1", []APIKeyScope{ScopeRead}, "", nil)
	service.CreateKey(appID, userID, "Key 2", []APIKeyScope{ScopeWrite}, "", nil)
	service.CreateKey(uuid.New(), userID, "Other App Key", []APIKeyScope{ScopeRead}, "", nil)

	keys, err := service.ListKeys(appID)

	require.NoError(t, err)
	assert.Len(t, keys, 2)
}

func TestAPIKeyService_RevokeKey(t *testing.T) {
	db := setupTestDB(t)
	service := NewAPIKeyService(db)

	appID := uuid.New()
	userID := uuid.New()
	key, rawKey, _ := service.CreateKey(appID, userID, "Test Key", []APIKeyScope{ScopeRead}, "", nil)

	// Revogar
	err := service.RevokeKey(key.ID, userID)
	require.NoError(t, err)

	// Verificar que não valida mais
	_, err = service.ValidateKey(rawKey)
	assert.Error(t, err)

	// Verificar status
	revokedKey, _ := service.GetKey(key.ID)
	assert.Equal(t, "revoked", revokedKey.Status)
}

func TestAPIKeyService_ExpiredKey(t *testing.T) {
	db := setupTestDB(t)
	service := NewAPIKeyService(db)

	appID := uuid.New()
	userID := uuid.New()
	
	// Criar key que já expirou
	expiredAt := time.Now().Add(-1 * time.Hour)
	_, rawKey, _ := service.CreateKey(appID, userID, "Expired Key", []APIKeyScope{ScopeRead}, "", &expiredAt)

	// Validar key expirada
	_, err := service.ValidateKey(rawKey)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "expirada")
}

func TestAPIKey_HasScope(t *testing.T) {
	tests := []struct {
		name     string
		scopes   string
		scope    APIKeyScope
		expected bool
	}{
		{"has read scope", `["read"]`, ScopeRead, true},
		{"no write scope", `["read"]`, ScopeWrite, false},
		{"admin has all", `["admin"]`, ScopeWrite, true},
		{"multiple scopes", `["read","write"]`, ScopeWrite, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			key := &APIKey{Scopes: tt.scopes}
			result := key.HasScope(tt.scope)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGenerateAPIKey(t *testing.T) {
	key1 := generateAPIKey()
	key2 := generateAPIKey()

	assert.Len(t, key1, 64) // 32 bytes = 64 hex chars
	assert.Len(t, key2, 64)
	assert.NotEqual(t, key1, key2)
}

func TestHashAPIKey(t *testing.T) {
	key := "test-api-key"
	hash1 := hashAPIKey(key)
	hash2 := hashAPIKey(key)

	assert.Equal(t, hash1, hash2)
	assert.Len(t, hash1, 64) // SHA256 = 32 bytes = 64 hex chars

	// Different key = different hash
	hash3 := hashAPIKey("different-key")
	assert.NotEqual(t, hash1, hash3)
}
