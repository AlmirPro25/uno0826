package ucp

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestClient_Discover(t *testing.T) {
	// 1. Mock Server (The Store)
	mockManifest := DiscoveryManifest{
		UCPVersion: "1.0",
		Merchant:   MerchantInfo{ID: "test-store", Name: "Test Store"},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/.well-known/ucp", r.URL.Path)
		json.NewEncoder(w).Encode(mockManifest)
	}))
	defer server.Close()

	// 2. Client (The Agent)
	client := NewClient()

	// 3. Action
	manifest, err := client.Discover(context.Background(), server.URL)

	// 4. Assert
	assert.NoError(t, err)
	assert.Equal(t, "test-store", manifest.Merchant.ID)
	assert.Equal(t, "1.0", manifest.UCPVersion)
}

func TestClient_SearchRemote(t *testing.T) {
	// 1. Mock Server
	mockResponse := SearchResponse{
		Items:      []ProductItem{{ID: "1", Name: "Item A"}},
		TotalItems: 1,
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/api/ucp/catalog", r.URL.Path)
		var req SearchRequest
		json.NewDecoder(r.Body).Decode(&req)
		assert.Equal(t, "laptop", req.Query)

		json.NewEncoder(w).Encode(mockResponse)
	}))
	defer server.Close()

	// 2. Client
	client := NewClient()

	// 3. Action -> Use the FULL URL to the endpoint
	endpoint := server.URL + "/api/ucp/catalog"

	results, err := client.SearchRemote(context.Background(), endpoint, "laptop")

	// 4. Assert
	assert.NoError(t, err)
	assert.Equal(t, 1, results.TotalItems)
	assert.Equal(t, "Item A", results.Items[0].Name)
}
