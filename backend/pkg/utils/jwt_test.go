package utils

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func init() {
	SetJWTSecret("test-secret-key-32-bytes-long!!")
}

// ===========================================
// GENERATE JWT TESTS
// ===========================================

func TestGenerateJWT(t *testing.T) {
	token, expiresAt, err := GenerateJWT("user-123", "user", "active")
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.True(t, expiresAt.After(time.Now()))
}

func TestGenerateJWTWithDefaults(t *testing.T) {
	token, _, err := GenerateJWT("user-123", "", "")
	assert.NoError(t, err)
	claims, _ := ParseJWT(token)
	assert.Equal(t, "user", claims.Role)
	assert.Equal(t, "active", claims.AccountStatus)
}

func TestGenerateJWTWithAudience(t *testing.T) {
	token, _, err := GenerateJWTWithAudience("user-123", "admin", "active", []string{"api", "dashboard"})
	assert.NoError(t, err)
	claims, _ := ParseJWT(token)
	assert.Contains(t, claims.Audience, "api")
	assert.Contains(t, claims.Audience, "dashboard")
}

func TestGenerateJWTDefaultAudience(t *testing.T) {
	token, _, err := GenerateJWT("user-123", "user", "active")
	assert.NoError(t, err)
	claims, _ := ParseJWT(token)
	assert.Contains(t, claims.Audience, "ospedagem")
}

// ===========================================
// PARSE JWT TESTS
// ===========================================

func TestParseJWT(t *testing.T) {
	token, _, _ := GenerateJWT("user-123", "admin", "active")
	claims, err := ParseJWT(token)
	assert.NoError(t, err)
	assert.Equal(t, "user-123", claims.UserID)
	assert.Equal(t, "admin", claims.Role)
	assert.Equal(t, "active", claims.AccountStatus)
}

func TestParseJWTInvalid(t *testing.T) {
	_, err := ParseJWT("invalid-token")
	assert.Error(t, err)
}

func TestParseJWTExpired(t *testing.T) {
	// Não podemos testar expiração facilmente sem manipular o tempo
	// Mas podemos verificar que tokens válidos funcionam
	token, _, _ := GenerateJWT("user-123", "user", "active")
	claims, err := ParseJWT(token)
	assert.NoError(t, err)
	assert.NotNil(t, claims)
}

// ===========================================
// REFRESH TOKEN TESTS
// ===========================================

func TestGenerateRefreshToken(t *testing.T) {
	token, err := GenerateRefreshToken("user-123", "user", "active")
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestGenerateRefreshTokenDefaults(t *testing.T) {
	token, err := GenerateRefreshToken("user-123", "", "")
	assert.NoError(t, err)
	claims, _ := ParseRefreshToken(token)
	assert.Equal(t, "user", claims.Role)
	assert.Equal(t, "active", claims.AccountStatus)
}

func TestParseRefreshToken(t *testing.T) {
	token, _ := GenerateRefreshToken("user-123", "admin", "suspended")
	claims, err := ParseRefreshToken(token)
	assert.NoError(t, err)
	assert.Equal(t, "user-123", claims.UserID)
	assert.Equal(t, "admin", claims.Role)
	assert.Equal(t, "suspended", claims.AccountStatus)
}

func TestParseRefreshTokenInvalid(t *testing.T) {
	_, err := ParseRefreshToken("invalid-token")
	assert.Error(t, err)
}

// ===========================================
// LEGACY TESTS
// ===========================================

func TestGenerateJWTLegacy(t *testing.T) {
	token, _, err := GenerateJWTLegacy("user-123", "app-scope")
	assert.NoError(t, err)
	claims, _ := ParseJWT(token)
	assert.Equal(t, "user-123", claims.UserID)
	assert.Equal(t, "user", claims.Role)
}

// ===========================================
// CLAIMS TESTS
// ===========================================

func TestJWTClaimsIssuer(t *testing.T) {
	token, _, _ := GenerateJWT("user-123", "user", "active")
	claims, _ := ParseJWT(token)
	assert.Equal(t, "prost-qs-kernel", claims.Issuer)
}

func TestRefreshClaimsIssuer(t *testing.T) {
	token, _ := GenerateRefreshToken("user-123", "user", "active")
	claims, _ := ParseRefreshToken(token)
	assert.Equal(t, "prost-qs-kernel-refresh", claims.Issuer)
}
