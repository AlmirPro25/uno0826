package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupSessionTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	return db
}

func TestSessionService_CreateSession(t *testing.T) {
	db := setupSessionTestDB(t)
	service := NewSessionService(db)

	userID := uuid.New()
	token := "test-token-123"
	deviceInfo := "Chrome • Windows"
	ipAddress := "192.168.1.1"
	userAgent := "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
	expiresAt := time.Now().Add(24 * time.Hour)

	session, err := service.CreateSession(userID, token, deviceInfo, ipAddress, userAgent, expiresAt)
	require.NoError(t, err)
	assert.NotNil(t, session)
	assert.Equal(t, userID, session.UserID)
	assert.NotEmpty(t, session.TokenHash)
	assert.Equal(t, ipAddress, session.IPAddress)
}

func TestSessionService_GetUserSessions(t *testing.T) {
	db := setupSessionTestDB(t)
	service := NewSessionService(db)

	userID := uuid.New()
	token1 := "token-1"
	token2 := "token-2"

	// Criar duas sessões
	_, err := service.CreateSession(userID, token1, "Chrome", "1.1.1.1", "UA1", time.Now().Add(24*time.Hour))
	require.NoError(t, err)
	_, err = service.CreateSession(userID, token2, "Firefox", "2.2.2.2", "UA2", time.Now().Add(24*time.Hour))
	require.NoError(t, err)

	// Buscar sessões
	sessions, err := service.GetUserSessions(userID, token1)
	require.NoError(t, err)
	assert.Len(t, sessions, 2)

	// Verificar que a sessão atual está marcada
	var currentFound bool
	for _, s := range sessions {
		if s.IsCurrent {
			currentFound = true
		}
	}
	assert.True(t, currentFound)
}

func TestSessionService_RevokeSession(t *testing.T) {
	db := setupSessionTestDB(t)
	service := NewSessionService(db)

	userID := uuid.New()
	session, err := service.CreateSession(userID, "token", "Chrome", "1.1.1.1", "UA", time.Now().Add(24*time.Hour))
	require.NoError(t, err)

	// Revogar sessão
	err = service.RevokeSession(userID, session.ID)
	require.NoError(t, err)

	// Verificar que não aparece mais
	sessions, err := service.GetUserSessions(userID, "")
	require.NoError(t, err)
	assert.Len(t, sessions, 0)
}

func TestSessionService_RevokeSession_WrongUser(t *testing.T) {
	db := setupSessionTestDB(t)
	service := NewSessionService(db)

	userID := uuid.New()
	otherUserID := uuid.New()
	session, err := service.CreateSession(userID, "token", "Chrome", "1.1.1.1", "UA", time.Now().Add(24*time.Hour))
	require.NoError(t, err)

	// Tentar revogar sessão de outro usuário
	err = service.RevokeSession(otherUserID, session.ID)
	assert.Error(t, err)
}

func TestSessionService_RevokeAllSessions(t *testing.T) {
	db := setupSessionTestDB(t)
	service := NewSessionService(db)

	userID := uuid.New()
	currentToken := "current-token"

	// Criar várias sessões
	_, err := service.CreateSession(userID, currentToken, "Chrome", "1.1.1.1", "UA1", time.Now().Add(24*time.Hour))
	require.NoError(t, err)
	_, err = service.CreateSession(userID, "other-1", "Firefox", "2.2.2.2", "UA2", time.Now().Add(24*time.Hour))
	require.NoError(t, err)
	_, err = service.CreateSession(userID, "other-2", "Safari", "3.3.3.3", "UA3", time.Now().Add(24*time.Hour))
	require.NoError(t, err)

	// Revogar todas exceto a atual
	count, err := service.RevokeAllSessions(userID, currentToken)
	require.NoError(t, err)
	assert.Equal(t, int64(2), count)

	// Verificar que só sobrou a atual
	sessions, err := service.GetUserSessions(userID, currentToken)
	require.NoError(t, err)
	assert.Len(t, sessions, 1)
	assert.True(t, sessions[0].IsCurrent)
}

func TestSessionService_IsSessionValid(t *testing.T) {
	db := setupSessionTestDB(t)
	service := NewSessionService(db)

	userID := uuid.New()
	token := "valid-token"

	// Criar sessão válida
	_, err := service.CreateSession(userID, token, "Chrome", "1.1.1.1", "UA", time.Now().Add(24*time.Hour))
	require.NoError(t, err)

	// Verificar validade
	assert.True(t, service.IsSessionValid(token))
	assert.False(t, service.IsSessionValid("invalid-token"))
}

func TestSessionService_IsSessionValid_Expired(t *testing.T) {
	db := setupSessionTestDB(t)
	service := NewSessionService(db)

	userID := uuid.New()
	token := "expired-token"

	// Criar sessão expirada
	_, err := service.CreateSession(userID, token, "Chrome", "1.1.1.1", "UA", time.Now().Add(-1*time.Hour))
	require.NoError(t, err)

	// Verificar que não é válida
	assert.False(t, service.IsSessionValid(token))
}

func TestSessionService_GetSessionStats(t *testing.T) {
	db := setupSessionTestDB(t)
	service := NewSessionService(db)

	userID := uuid.New()

	// Criar sessões
	_, err := service.CreateSession(userID, "token-1", "Chrome", "1.1.1.1", "UA1", time.Now().Add(24*time.Hour))
	require.NoError(t, err)
	_, err = service.CreateSession(userID, "token-2", "Firefox", "2.2.2.2", "UA2", time.Now().Add(24*time.Hour))
	require.NoError(t, err)

	// Obter estatísticas
	stats, err := service.GetSessionStats(userID)
	require.NoError(t, err)
	assert.Equal(t, int64(2), stats.ActiveSessions)
	assert.Equal(t, int64(2), stats.UniqueIPs)
}

func TestParseDeviceInfo(t *testing.T) {
	tests := []struct {
		userAgent string
		expected  string
	}{
		{"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0", "Chrome • Windows"},
		{"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", "Safari • macOS"},
		{"Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0", "Chrome • Android"},
		{"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604.1", "Safari • iOS"},
		{"Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0", "Firefox • Linux"},
		{"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/120.0", "Edge • Windows"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := parseDeviceInfo(tt.userAgent)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestHashToken(t *testing.T) {
	token := "my-secret-token"
	hash1 := hashToken(token)
	hash2 := hashToken(token)

	// Mesmo token deve gerar mesmo hash
	assert.Equal(t, hash1, hash2)

	// Hash deve ter 64 caracteres (SHA256 em hex)
	assert.Len(t, hash1, 64)

	// Tokens diferentes devem gerar hashes diferentes
	hash3 := hashToken("different-token")
	assert.NotEqual(t, hash1, hash3)
}
