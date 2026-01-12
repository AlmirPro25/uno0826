package webhook

import (
	"testing"

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

func TestWebhookService_CreateEndpoint(t *testing.T) {
	db := setupTestDB(t)
	service := NewWebhookService(db)

	appID := uuid.New()
	url := "https://example.com/webhook"
	events := []WebhookEventType{EventUserCreated, EventUserLogin}
	description := "Test webhook"

	endpoint, secret, err := service.CreateEndpoint(appID, url, events, description)

	require.NoError(t, err)
	assert.NotNil(t, endpoint)
	assert.NotEmpty(t, secret)
	assert.Equal(t, appID, endpoint.AppID)
	assert.Equal(t, url, endpoint.URL)
	assert.Equal(t, description, endpoint.Description)
	assert.Equal(t, "active", endpoint.Status)
	assert.Equal(t, 0, endpoint.FailCount)
}

func TestWebhookService_ListEndpoints(t *testing.T) {
	db := setupTestDB(t)
	service := NewWebhookService(db)

	appID := uuid.New()

	// Criar alguns endpoints
	_, _, _ = service.CreateEndpoint(appID, "https://example.com/webhook1", []WebhookEventType{EventUserCreated}, "Webhook 1")
	_, _, _ = service.CreateEndpoint(appID, "https://example.com/webhook2", []WebhookEventType{EventUserLogin}, "Webhook 2")
	_, _, _ = service.CreateEndpoint(uuid.New(), "https://other.com/webhook", []WebhookEventType{EventUserCreated}, "Other app")

	endpoints, err := service.ListEndpoints(appID)

	require.NoError(t, err)
	assert.Len(t, endpoints, 2)
}

func TestWebhookService_GetEndpoint(t *testing.T) {
	db := setupTestDB(t)
	service := NewWebhookService(db)

	appID := uuid.New()
	created, _, _ := service.CreateEndpoint(appID, "https://example.com/webhook", []WebhookEventType{EventUserCreated}, "Test")

	endpoint, err := service.GetEndpoint(created.ID)

	require.NoError(t, err)
	assert.Equal(t, created.ID, endpoint.ID)
	assert.Equal(t, created.URL, endpoint.URL)
}

func TestWebhookService_UpdateEndpoint(t *testing.T) {
	db := setupTestDB(t)
	service := NewWebhookService(db)

	appID := uuid.New()
	created, _, _ := service.CreateEndpoint(appID, "https://example.com/webhook", []WebhookEventType{EventUserCreated}, "Test")

	newURL := "https://example.com/new-webhook"
	newEvents := []WebhookEventType{EventUserLogin, EventUserLogout}
	newDescription := "Updated webhook"

	updated, err := service.UpdateEndpoint(created.ID, newURL, newEvents, newDescription)

	require.NoError(t, err)
	assert.Equal(t, newURL, updated.URL)
	assert.Equal(t, newDescription, updated.Description)
}

func TestWebhookService_DeleteEndpoint(t *testing.T) {
	db := setupTestDB(t)
	service := NewWebhookService(db)

	appID := uuid.New()
	created, _, _ := service.CreateEndpoint(appID, "https://example.com/webhook", []WebhookEventType{EventUserCreated}, "Test")

	err := service.DeleteEndpoint(created.ID)
	require.NoError(t, err)

	_, err = service.GetEndpoint(created.ID)
	assert.Error(t, err)
}

func TestWebhookService_DisableEnableEndpoint(t *testing.T) {
	db := setupTestDB(t)
	service := NewWebhookService(db)

	appID := uuid.New()
	created, _, _ := service.CreateEndpoint(appID, "https://example.com/webhook", []WebhookEventType{EventUserCreated}, "Test")

	// Desabilitar
	err := service.DisableEndpoint(created.ID)
	require.NoError(t, err)

	endpoint, _ := service.GetEndpoint(created.ID)
	assert.Equal(t, "disabled", endpoint.Status)

	// Habilitar
	err = service.EnableEndpoint(created.ID)
	require.NoError(t, err)

	endpoint, _ = service.GetEndpoint(created.ID)
	assert.Equal(t, "active", endpoint.Status)
}

func TestWebhookService_RotateSecret(t *testing.T) {
	db := setupTestDB(t)
	service := NewWebhookService(db)

	appID := uuid.New()
	created, originalSecret, _ := service.CreateEndpoint(appID, "https://example.com/webhook", []WebhookEventType{EventUserCreated}, "Test")

	newSecret, err := service.RotateSecret(created.ID)

	require.NoError(t, err)
	assert.NotEmpty(t, newSecret)
	assert.NotEqual(t, originalSecret, newSecret)
}

func TestWebhookService_GetEndpointStats(t *testing.T) {
	db := setupTestDB(t)
	service := NewWebhookService(db)

	appID := uuid.New()
	created, _, _ := service.CreateEndpoint(appID, "https://example.com/webhook", []WebhookEventType{EventUserCreated}, "Test")

	stats, err := service.GetEndpointStats(created.ID)

	require.NoError(t, err)
	assert.Equal(t, created.ID, stats.EndpointID)
	assert.Equal(t, int64(0), stats.TotalDeliveries)
}

func TestContainsEvent(t *testing.T) {
	tests := []struct {
		name     string
		events   []string
		event    string
		expected bool
	}{
		{"exact match", []string{"user.created", "user.login"}, "user.created", true},
		{"no match", []string{"user.created", "user.login"}, "user.deleted", false},
		{"wildcard", []string{"*"}, "user.created", true},
		{"empty events", []string{}, "user.created", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := containsEvent(tt.events, tt.event)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGenerateWebhookSecret(t *testing.T) {
	secret1 := generateWebhookSecret()
	secret2 := generateWebhookSecret()

	assert.Len(t, secret1, 64) // 32 bytes = 64 hex chars
	assert.Len(t, secret2, 64)
	assert.NotEqual(t, secret1, secret2)
}

func TestComputeSignature(t *testing.T) {
	payload := []byte(`{"test": "data"}`)
	secret := "test-secret"

	sig1 := computeSignature(payload, secret)
	sig2 := computeSignature(payload, secret)

	assert.Equal(t, sig1, sig2)
	assert.Len(t, sig1, 64) // SHA256 = 32 bytes = 64 hex chars

	// Different payload = different signature
	sig3 := computeSignature([]byte(`{"other": "data"}`), secret)
	assert.NotEqual(t, sig1, sig3)

	// Different secret = different signature
	sig4 := computeSignature(payload, "other-secret")
	assert.NotEqual(t, sig1, sig4)
}
