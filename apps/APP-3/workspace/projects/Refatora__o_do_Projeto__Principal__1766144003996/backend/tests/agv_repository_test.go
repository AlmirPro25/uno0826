
package tests

import (
	"manifest-architect/backend/internal/repositories"
	"testing"
)

func TestInMemoryAgvMetadataRepository_GetAgvMetadataByID(t *testing.T) {
	// Arrange
	mockRepo := repositories.NewInMemoryAgvMetadataRepository()

	// Add a test entry to the repository's data map (simulating initialization)
	repositories.MockAgvData["test-agv-123"] = repositories.domain.AgvMetadata{
		AgvId:        "test-agv-123",
		ModelName:    "TestModel",
		SerialNumber: "TestSN",
	}

	// Act
	metadata, err := mockRepo.GetAgvMetadataByID("test-agv-123")

	// Assert
	if err != nil {
		t.Errorf("Unexpected error retrieving AGV metadata: %v", err)
	}
	if metadata == nil {
		t.Fatal("Expected AGV metadata, got nil")
	}
	if metadata.AgvId != "test-agv-123" {
		t.Errorf("Expected AGV ID 'test-agv-123', got '%s'", metadata.AgvId)
	}

	// Test case: Non-existent AGV ID
	nonExistentMetadata, err := mockRepo.GetAgvMetadataByID("non-existent-id")
	if err != nil {
		t.Errorf("Unexpected error retrieving non-existent AGV metadata: %v", err)
	}
	if nonExistentMetadata != nil {
		t.Errorf("Expected nil for non-existent AGV metadata, got: %v", nonExistentMetadata)
	}
}
