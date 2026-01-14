
package repositories

import (
	"log"
	"manifest-architect/backend/internal/core/domain"
	"sync"
)

// AgvMetadataRepository defines the interface for accessing static AGV metadata.
// In this implementation, we simulate a database using an in-memory map.
type AgvMetadataRepository interface {
	GetAgvMetadataByID(agvId string) (*domain.AgvMetadata, error)
	// CreateCommandLog(log domain.AgvCommandLog) error // Example: Add command log function
}

// InMemoryAgvMetadataRepository implements the AgvMetadataRepository interface using an in-memory map.
type InMemoryAgvMetadataRepository struct {
	data  map[string]domain.AgvMetadata
	mutex sync.RWMutex
}

// MockAgvData is used for initializing sample data in main.go.
var MockAgvData map[string]domain.AgvMetadata

// NewInMemoryAgvMetadataRepository creates a new instance of the in-memory repository.
func NewInMemoryAgvMetadataRepository() *InMemoryAgvMetadataRepository {
	repo := &InMemoryAgvMetadataRepository{
		data:  make(map[string]domain.AgvMetadata),
		mutex: sync.RWMutex{},
	}
	// Load initial mock data
	for id, metadata := range MockAgvData {
		repo.data[id] = metadata
	}
	return repo
}

// GetAgvMetadataByID retrieves metadata for a specific AGV by ID.
func (r *InMemoryAgvMetadataRepository) GetAgvMetadataByID(agvId string) (*domain.AgvMetadata, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	metadata, ok := r.data[agvId]
	if !ok {
		return nil, nil // AGV not found
	}
	return &metadata, nil
}
