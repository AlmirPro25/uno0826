package ad

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ========================================
// AD SERVICE TESTS
// ========================================

func TestNewAdService(t *testing.T) {
	service := NewAdService(nil)
	assert.NotNil(t, service)
}

func TestAd_Model(t *testing.T) {
	id := uuid.New()
	now := time.Now()

	ad := &Ad{
		ID:             id,
		Title:          "Test Ad",
		Content:        "This is a test advertisement",
		TargetURL:      "https://example.com/promo",
		ImpressionCost: 0.05,
		Status:         "active",
		AppID:          "app-123",
		CreatedAt:      now,
	}

	assert.Equal(t, id, ad.ID)
	assert.Equal(t, "Test Ad", ad.Title)
	assert.Equal(t, "This is a test advertisement", ad.Content)
	assert.Equal(t, "https://example.com/promo", ad.TargetURL)
	assert.Equal(t, 0.05, ad.ImpressionCost)
	assert.Equal(t, "active", ad.Status)
	assert.Equal(t, "app-123", ad.AppID)
	assert.Equal(t, now, ad.CreatedAt)
}

func TestAd_StatusValues(t *testing.T) {
	tests := []struct {
		name   string
		status string
	}{
		{"active status", "active"},
		{"paused status", "paused"},
		{"finished status", "finished"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ad := &Ad{
				ID:     uuid.New(),
				Status: tt.status,
			}
			assert.Equal(t, tt.status, ad.Status)
		})
	}
}

func TestAdEventPayload_Model(t *testing.T) {
	now := time.Now()

	payload := &AdEventPayload{
		AdID:      "ad-123",
		Type:      "impression",
		Cost:      0.05,
		AppID:     "app-456",
		Timestamp: now,
	}

	assert.Equal(t, "ad-123", payload.AdID)
	assert.Equal(t, "impression", payload.Type)
	assert.Equal(t, 0.05, payload.Cost)
	assert.Equal(t, "app-456", payload.AppID)
	assert.Equal(t, now, payload.Timestamp)
}

func TestAdEventPayload_Types(t *testing.T) {
	tests := []struct {
		name      string
		eventType string
	}{
		{"impression event", "impression"},
		{"click event", "click"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := &AdEventPayload{
				AdID: "ad-123",
				Type: tt.eventType,
			}
			assert.Equal(t, tt.eventType, payload.Type)
		})
	}
}

func TestAdService_RegisterAd(t *testing.T) {
	service := NewAdService(nil)

	ad, err := service.RegisterAd(
		"Summer Sale",
		"Get 50% off on all items",
		"https://shop.example.com/summer",
		0.10,
		"app-789",
	)

	require.NoError(t, err)
	require.NotNil(t, ad)

	assert.NotEqual(t, uuid.Nil, ad.ID)
	assert.Equal(t, "Summer Sale", ad.Title)
	assert.Equal(t, "Get 50% off on all items", ad.Content)
	assert.Equal(t, "https://shop.example.com/summer", ad.TargetURL)
	assert.Equal(t, 0.10, ad.ImpressionCost)
	assert.Equal(t, "active", ad.Status)
	assert.Equal(t, "app-789", ad.AppID)
	assert.False(t, ad.CreatedAt.IsZero())
}

func TestAdService_RegisterAd_MultipleAds(t *testing.T) {
	service := NewAdService(nil)

	ad1, err1 := service.RegisterAd("Ad 1", "Content 1", "https://url1.com", 0.05, "app-1")
	ad2, err2 := service.RegisterAd("Ad 2", "Content 2", "https://url2.com", 0.10, "app-2")

	require.NoError(t, err1)
	require.NoError(t, err2)

	// IDs should be unique
	assert.NotEqual(t, ad1.ID, ad2.ID)
}

func TestAdService_RegisterAd_ZeroCost(t *testing.T) {
	service := NewAdService(nil)

	ad, err := service.RegisterAd(
		"Free Promo",
		"Free advertisement",
		"https://free.example.com",
		0.0,
		"app-free",
	)

	require.NoError(t, err)
	assert.Equal(t, 0.0, ad.ImpressionCost)
}

func TestAdService_RegisterAd_EmptyFields(t *testing.T) {
	service := NewAdService(nil)

	ad, err := service.RegisterAd("", "", "", 0.0, "")

	require.NoError(t, err)
	require.NotNil(t, ad)
	assert.NotEqual(t, uuid.Nil, ad.ID)
	assert.Equal(t, "active", ad.Status)
}
