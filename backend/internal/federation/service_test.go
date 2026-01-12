package federation

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================================
// FEDERATION SERVICE TESTS
// ========================================

func TestFederatedIdentity_Model(t *testing.T) {
	linkID := uuid.New()
	userID := uuid.New()
	now := time.Now()
	expiry := now.Add(time.Hour)

	fed := &FederatedIdentity{
		LinkID:      linkID,
		UserID:      userID,
		Provider:    "google",
		ProviderID:  "google-123456",
		Email:       "user@gmail.com",
		Name:        "Test User",
		Picture:     "https://example.com/avatar.jpg",
		AccessToken: "access-token-xyz",
		TokenExpiry: expiry,
		LinkedAt:    now,
		UpdatedAt:   now,
	}

	assert.Equal(t, linkID, fed.LinkID)
	assert.Equal(t, userID, fed.UserID)
	assert.Equal(t, "google", fed.Provider)
	assert.Equal(t, "google-123456", fed.ProviderID)
	assert.Equal(t, "user@gmail.com", fed.Email)
	assert.Equal(t, "Test User", fed.Name)
	assert.Equal(t, "https://example.com/avatar.jpg", fed.Picture)
	assert.Equal(t, "access-token-xyz", fed.AccessToken)
	assert.Equal(t, expiry, fed.TokenExpiry)
}

func TestOAuthState_Model(t *testing.T) {
	stateID := uuid.New()
	userID := uuid.New()
	now := time.Now()
	expires := now.Add(OAuthStateExpiration)

	state := &OAuthState{
		StateID:     stateID,
		UserID:      userID,
		Provider:    "google",
		RedirectURI: "https://app.example.com/callback",
		RequestIP:   "192.168.1.1",
		CreatedAt:   now,
		ExpiresAt:   expires,
		Used:        false,
	}

	assert.Equal(t, stateID, state.StateID)
	assert.Equal(t, userID, state.UserID)
	assert.Equal(t, "google", state.Provider)
	assert.Equal(t, "https://app.example.com/callback", state.RedirectURI)
	assert.Equal(t, "192.168.1.1", state.RequestIP)
	assert.False(t, state.Used)
}

func TestOAuthState_Expiration(t *testing.T) {
	now := time.Now()

	// Not expired
	state := &OAuthState{
		StateID:   uuid.New(),
		CreatedAt: now,
		ExpiresAt: now.Add(OAuthStateExpiration),
	}
	assert.True(t, time.Now().Before(state.ExpiresAt))

	// Expired
	expiredState := &OAuthState{
		StateID:   uuid.New(),
		CreatedAt: now.Add(-20 * time.Minute),
		ExpiresAt: now.Add(-10 * time.Minute),
	}
	assert.True(t, time.Now().After(expiredState.ExpiresAt))
}

func TestProvider_Constants(t *testing.T) {
	assert.Equal(t, Provider("google"), ProviderGoogle)
	assert.Equal(t, Provider("apple"), ProviderApple)
	assert.Equal(t, Provider("facebook"), ProviderFacebook)
}

func TestOAuthStateExpiration_Value(t *testing.T) {
	assert.Equal(t, 10*time.Minute, OAuthStateExpiration)
}

func TestErrors(t *testing.T) {
	tests := []struct {
		name string
		err  error
		msg  string
	}{
		{"ErrStateNotFound", ErrStateNotFound, "oauth state not found"},
		{"ErrStateExpired", ErrStateExpired, "oauth state expired"},
		{"ErrStateAlreadyUsed", ErrStateAlreadyUsed, "oauth state already used"},
		{"ErrProviderNotLinked", ErrProviderNotLinked, "provider not linked to any identity"},
		{"ErrAlreadyLinked", ErrAlreadyLinked, "provider already linked to another identity"},
		{"ErrCannotUnlink", ErrCannotUnlink, "cannot unlink primary identity provider"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.msg, tt.err.Error())
		})
	}
}

func TestGoogleUserInfo_Model(t *testing.T) {
	info := &GoogleUserInfo{
		Sub:           "google-sub-123",
		Email:         "user@gmail.com",
		EmailVerified: true,
		Name:          "Test User",
		Picture:       "https://lh3.googleusercontent.com/avatar",
		GivenName:     "Test",
		FamilyName:    "User",
	}

	assert.Equal(t, "google-sub-123", info.Sub)
	assert.Equal(t, "user@gmail.com", info.Email)
	assert.True(t, info.EmailVerified)
	assert.Equal(t, "Test User", info.Name)
	assert.Equal(t, "https://lh3.googleusercontent.com/avatar", info.Picture)
	assert.Equal(t, "Test", info.GivenName)
	assert.Equal(t, "User", info.FamilyName)
}

func TestTokenResponse_Model(t *testing.T) {
	resp := &TokenResponse{
		AccessToken:  "ya29.access-token",
		TokenType:    "Bearer",
		ExpiresIn:    3600,
		RefreshToken: "1//refresh-token",
		Scope:        "openid email profile",
		IDToken:      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
	}

	assert.Equal(t, "ya29.access-token", resp.AccessToken)
	assert.Equal(t, "Bearer", resp.TokenType)
	assert.Equal(t, 3600, resp.ExpiresIn)
	assert.Equal(t, "1//refresh-token", resp.RefreshToken)
	assert.Equal(t, "openid email profile", resp.Scope)
	assert.NotEmpty(t, resp.IDToken)
}

func TestNewFederationService(t *testing.T) {
	service := NewFederationService(nil, nil)
	assert.NotNil(t, service)
}

func TestFederatedIdentity_TokenExpiry(t *testing.T) {
	now := time.Now()

	// Token not expired
	fed := &FederatedIdentity{
		LinkID:      uuid.New(),
		TokenExpiry: now.Add(time.Hour),
	}
	assert.True(t, time.Now().Before(fed.TokenExpiry))

	// Token expired
	expiredFed := &FederatedIdentity{
		LinkID:      uuid.New(),
		TokenExpiry: now.Add(-time.Hour),
	}
	assert.True(t, time.Now().After(expiredFed.TokenExpiry))
}

func TestOAuthState_MarkAsUsed(t *testing.T) {
	state := &OAuthState{
		StateID: uuid.New(),
		Used:    false,
	}

	assert.False(t, state.Used)

	state.Used = true
	assert.True(t, state.Used)
}

func TestFederatedIdentity_MultipleProviders(t *testing.T) {
	userID := uuid.New()

	googleLink := &FederatedIdentity{
		LinkID:     uuid.New(),
		UserID:     userID,
		Provider:   "google",
		ProviderID: "google-123",
		Email:      "user@gmail.com",
	}

	appleLink := &FederatedIdentity{
		LinkID:     uuid.New(),
		UserID:     userID,
		Provider:   "apple",
		ProviderID: "apple-456",
		Email:      "user@icloud.com",
	}

	// Same user, different providers
	assert.Equal(t, googleLink.UserID, appleLink.UserID)
	assert.NotEqual(t, googleLink.Provider, appleLink.Provider)
	assert.NotEqual(t, googleLink.LinkID, appleLink.LinkID)
}
