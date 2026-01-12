package ai

import (
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ========================================
// AI SERVICE TESTS
// ========================================

// MockAIRepository implements AIRepository for testing
type MockAIRepository struct {
	versions       map[uuid.UUID]*AISchemaVersion
	latestVersion  *AISchemaVersion
	createError    error
	getLatestError error
	getByIDError   error
}

func NewMockAIRepository() *MockAIRepository {
	return &MockAIRepository{
		versions:       make(map[uuid.UUID]*AISchemaVersion),
		getLatestError: fmt.Errorf("no version found"), // Default: no version exists
	}
}

func (m *MockAIRepository) CreateAISchemaVersion(version *AISchemaVersion) error {
	if m.createError != nil {
		return m.createError
	}
	m.versions[version.ID] = version
	m.latestVersion = version
	m.getLatestError = nil // Now we have a version
	return nil
}

func (m *MockAIRepository) GetLatestAISchemaVersion() (*AISchemaVersion, error) {
	if m.getLatestError != nil {
		return nil, m.getLatestError
	}
	if m.latestVersion == nil {
		return nil, fmt.Errorf("no version found")
	}
	return m.latestVersion, nil
}

func (m *MockAIRepository) GetAISchemaVersionByID(id uuid.UUID) (*AISchemaVersion, error) {
	if m.getByIDError != nil {
		return nil, m.getByIDError
	}
	if v, ok := m.versions[id]; ok {
		return v, nil
	}
	return nil, nil
}

func TestNewAIService(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)

	assert.NotNil(t, service)
}

func TestAIService_SetAPIKey(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)

	service.SetAPIKey("test-api-key")
	assert.Equal(t, "test-api-key", service.apiKey)
}

func TestAISchemaVersion_Model(t *testing.T) {
	id := uuid.New()
	now := time.Now()

	version := &AISchemaVersion{
		ID:           id,
		Version:      1,
		MigrationSQL: "ALTER TABLE users ADD COLUMN bio TEXT;",
		AIIntention:  "Add bio field to users",
		AppliedAt:    now,
		ApprovedBy:   "Gemini_AI_Architect",
	}

	assert.Equal(t, id, version.ID)
	assert.Equal(t, 1, version.Version)
	assert.Equal(t, "ALTER TABLE users ADD COLUMN bio TEXT;", version.MigrationSQL)
	assert.Equal(t, "Add bio field to users", version.AIIntention)
	assert.Equal(t, now, version.AppliedAt)
	assert.Equal(t, "Gemini_AI_Architect", version.ApprovedBy)
}

func TestAIService_EvolveSchema_MockMode(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)
	// No API key = mock mode

	contextMap := map[string]string{
		"newField": "preferences",
	}

	version, err := service.EvolveSchema("Add preferences field", contextMap)

	require.NoError(t, err)
	require.NotNil(t, version)

	assert.Equal(t, 1, version.Version)
	assert.Contains(t, version.MigrationSQL, "preferences")
	assert.Equal(t, "Add preferences field", version.AIIntention)
	assert.Equal(t, "Gemini_AI_Architect", version.ApprovedBy)
}

func TestAIService_EvolveSchema_DefaultMock(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)

	// Empty context = default mock SQL
	contextMap := map[string]string{}

	version, err := service.EvolveSchema("Enable AI features", contextMap)

	require.NoError(t, err)
	require.NotNil(t, version)

	assert.Contains(t, version.MigrationSQL, "ai_enabled")
}

func TestAIService_EvolveSchema_IncrementVersion(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)

	// First evolution
	v1, err := service.EvolveSchema("First change", map[string]string{})
	require.NoError(t, err)
	assert.Equal(t, 1, v1.Version)

	// Second evolution
	v2, err := service.EvolveSchema("Second change", map[string]string{})
	require.NoError(t, err)
	assert.Equal(t, 2, v2.Version)

	// Third evolution
	v3, err := service.EvolveSchema("Third change", map[string]string{})
	require.NoError(t, err)
	assert.Equal(t, 3, v3.Version)
}

func TestAIService_GetMigrationByID(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)

	// Create a version first
	version, err := service.EvolveSchema("Test migration", map[string]string{})
	require.NoError(t, err)

	// Retrieve it
	retrieved, err := service.GetMigrationByID(version.ID)
	require.NoError(t, err)
	require.NotNil(t, retrieved)

	assert.Equal(t, version.ID, retrieved.ID)
	assert.Equal(t, version.Version, retrieved.Version)
}

func TestAIService_GetMigrationByID_NotFound(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)

	retrieved, err := service.GetMigrationByID(uuid.New())
	require.NoError(t, err)
	assert.Nil(t, retrieved)
}

func TestAIService_ResolveConflict(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)

	count, ids, err := service.ResolveConflict("conflict-123", "auto_merge")

	require.NoError(t, err)
	assert.Equal(t, 1, count)
	assert.Len(t, ids, 1)
	// ID should be a valid UUID
	_, err = uuid.Parse(ids[0])
	assert.NoError(t, err)
}

func TestAIService_GenerateMockSQL(t *testing.T) {
	repo := NewMockAIRepository()
	service := NewAIService(repo)

	tests := []struct {
		name       string
		contextMap map[string]string
		expected   string
	}{
		{
			name:       "with newField",
			contextMap: map[string]string{"newField": "avatar_url"},
			expected:   "ALTER TABLE users ADD COLUMN avatar_url TEXT;",
		},
		{
			name:       "without newField",
			contextMap: map[string]string{"other": "value"},
			expected:   "ALTER TABLE settings ADD COLUMN ai_enabled BOOLEAN DEFAULT TRUE;",
		},
		{
			name:       "empty context",
			contextMap: map[string]string{},
			expected:   "ALTER TABLE settings ADD COLUMN ai_enabled BOOLEAN DEFAULT TRUE;",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.generateMockSQL(tt.contextMap)
			assert.Equal(t, tt.expected, result)
		})
	}
}
