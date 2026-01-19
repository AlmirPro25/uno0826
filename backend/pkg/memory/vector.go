package memory

import (
	"context"
	"fmt"
	"math"
	"time"

	"gorm.io/gorm"
)

// ========================================
// VECTOR MEMORY LAYER
// ========================================
// Purpose: Long-term agent learning via semantic memory
// Technology: Vector embeddings + similarity search
// Use Case: Remember negotiations, customer preferences, deal patterns
// Storage: pgvector (Postgres extension) or in-memory for dev
// ========================================

// VectorMemory stores agent memories with semantic embeddings
type VectorMemory struct {
	db        *gorm.DB
	embedder  EmbeddingService
	dimension int // e.g., 768 for sentence-transformers, 1536 for OpenAI
}

// MemoryRecord stores a single memory with vector embedding
type MemoryRecord struct {
	ID        string    `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"index"`
	UpdatedAt time.Time

	// Ownership
	TenantID string `gorm:"index;not null"`
	AgentID  string `gorm:"index;not null"`

	// Memory Content
	Content    string  `gorm:"type:text;not null"`
	Summary    string  `gorm:"type:text"`
	MemoryType string  `gorm:"index"`       // negotiation, preference, outcome, insight
	Importance float32 `gorm:"default:0.5"` // 0.0 to 1.0

	// Semantic Embedding (for similarity search)
	Embedding []float32 `gorm:"type:vector(768)"` // pgvector extension

	// Context
	Metadata   map[string]interface{} `gorm:"type:jsonb"`
	Tags       []string               `gorm:"type:text[]"`
	RelatedIDs []string               `gorm:"type:text[]"` // Link to related memories

	// Temporal Decay
	AccessCount  int `gorm:"default:0"`
	LastAccessed time.Time
	DecayFactor  float32 `gorm:"default:1.0"` // Fades to 0 over time
}

// NewVectorMemory creates a vector memory system
func NewVectorMemory(db *gorm.DB, embedder EmbeddingService) *VectorMemory {
	return &VectorMemory{
		db:        db,
		embedder:  embedder,
		dimension: embedder.Dimension(),
	}
}

// ========================================
// MEMORY STORAGE
// ========================================

// Store creates a new memory with semantic embedding
func (v *VectorMemory) Store(ctx context.Context, req StoreMemoryRequest) (*MemoryRecord, error) {
	// 1. Generate semantic embedding
	embedding, err := v.embedder.Embed(ctx, req.Content)
	if err != nil {
		return nil, fmt.Errorf("failed to create embedding: %w", err)
	}

	// 2. Create memory record
	memory := &MemoryRecord{
		ID:           generateMemoryID(),
		TenantID:     req.TenantID,
		AgentID:      req.AgentID,
		Content:      req.Content,
		Summary:      req.Summary,
		MemoryType:   req.MemoryType,
		Importance:   req.Importance,
		Embedding:    embedding,
		Metadata:     req.Metadata,
		Tags:         req.Tags,
		LastAccessed: time.Now(),
		DecayFactor:  1.0,
	}

	// 3. Persist to database
	if err := v.db.WithContext(ctx).Create(memory).Error; err != nil {
		return nil, fmt.Errorf("failed to store memory: %w", err)
	}

	return memory, nil
}

// ========================================
// SEMANTIC SEARCH
// ========================================

// Recall retrieves relevant memories using semantic similarity
func (v *VectorMemory) Recall(ctx context.Context, req RecallRequest) ([]*MemoryRecord, error) {
	// 1. Generate query embedding
	queryEmbedding, err := v.embedder.Embed(ctx, req.Query)
	if err != nil {
		return nil, fmt.Errorf("failed to create query embedding: %w", err)
	}

	// 2. Find similar memories using cosine similarity
	// NOTE: In production with pgvector, use:
	// SELECT * FROM memory_records ORDER BY embedding <=> $1 LIMIT $2;

	var memories []*MemoryRecord

	// For now, load all tenant memories and compute similarity in Go
	// (In production, this should be pushed to database with pgvector)
	var allMemories []*MemoryRecord
	query := v.db.WithContext(ctx).Where("tenant_id = ? AND agent_id = ?", req.TenantID, req.AgentID)

	if req.MemoryType != "" {
		query = query.Where("memory_type = ?", req.MemoryType)
	}

	if err := query.Find(&allMemories).Error; err != nil {
		return nil, err
	}

	// 3. Compute similarity scores

	scored := make([]scoredMemory, 0, len(allMemories))
	for _, mem := range allMemories {
		sim := cosineSimilarity(queryEmbedding, mem.Embedding)

		// Apply temporal decay
		mem.DecayFactor = calculateDecay(mem.CreatedAt, time.Now())

		// Relevance = similarity * importance * decay
		relevance := sim * mem.Importance * mem.DecayFactor

		scored = append(scored, scoredMemory{
			memory:     mem,
			similarity: sim,
			relevance:  relevance,
		})
	}

	// 4. Sort by relevance
	sortByRelevance(scored)

	// 5. Return top K
	limit := req.Limit
	if limit == 0 {
		limit = 10
	}
	if limit > len(scored) {
		limit = len(scored)
	}

	for i := 0; i < limit; i++ {
		if scored[i].similarity >= req.MinSimilarity {
			memories = append(memories, scored[i].memory)

			// Update access tracking
			v.trackAccess(ctx, scored[i].memory.ID)
		}
	}

	return memories, nil
}

// ========================================
// MEMORY CONSOLIDATION
// ========================================

// Consolidate merges similar memories to prevent redundancy
func (v *VectorMemory) Consolidate(ctx context.Context, tenantID, agentID string) error {
	// 1. Find all memories for agent
	var memories []*MemoryRecord
	if err := v.db.WithContext(ctx).
		Where("tenant_id = ? AND agent_id = ?", tenantID, agentID).
		Find(&memories).Error; err != nil {
		return err
	}

	// 2. Find highly similar pairs (cosine > 0.95)
	merged := make(map[string]bool)

	for i := 0; i < len(memories); i++ {
		if merged[memories[i].ID] {
			continue
		}

		for j := i + 1; j < len(memories); j++ {
			if merged[memories[j].ID] {
				continue
			}

			sim := cosineSimilarity(memories[i].Embedding, memories[j].Embedding)
			if sim > 0.95 {
				// Merge j into i
				err := v.mergeMemories(ctx, memories[i], memories[j])
				if err != nil {
					continue
				}
				merged[memories[j].ID] = true
			}
		}
	}

	return nil
}

func (v *VectorMemory) mergeMemories(ctx context.Context, target *MemoryRecord, source *MemoryRecord) error {
	// Combine content
	target.Content = target.Content + "\n\nAdditional context: " + source.Content

	// Increase importance if both are important
	target.Importance = (target.Importance + source.Importance) / 2

	// Merge metadata
	for k, v := range source.Metadata {
		if _, exists := target.Metadata[k]; !exists {
			target.Metadata[k] = v
		}
	}

	// Add to related IDs
	target.RelatedIDs = append(target.RelatedIDs, source.ID)

	// Update target
	if err := v.db.WithContext(ctx).Save(target).Error; err != nil {
		return err
	}

	// Delete source
	return v.db.WithContext(ctx).Delete(source).Error
}

// ========================================
// MEMORY PRUNING (Forgetting)
// ========================================

// Prune removes old, unimportant memories to prevent bloat
func (v *VectorMemory) Prune(ctx context.Context, tenantID, agentID string, threshold float32) error {
	// Delete memories with low relevance score
	// relevance = importance * decay_factor * (access_count / 100)

	return v.db.WithContext(ctx).
		Where("tenant_id = ? AND agent_id = ?", tenantID, agentID).
		Where("importance * decay_factor * (access_count::float / 100) < ?", threshold).
		Delete(&MemoryRecord{}).Error
}

// ========================================
// UTILITIES
// ========================================

func (v *VectorMemory) trackAccess(ctx context.Context, memoryID string) {
	v.db.WithContext(ctx).Model(&MemoryRecord{}).
		Where("id = ?", memoryID).
		Updates(map[string]interface{}{
			"access_count":  gorm.Expr("access_count + ?", 1),
			"last_accessed": time.Now(),
		})
}

// calculateDecay applies exponential decay based on age
func calculateDecay(createdAt, now time.Time) float32 {
	age := now.Sub(createdAt)
	halfLife := 30 * 24 * time.Hour // 30 days

	decay := math.Exp(-0.693 * age.Hours() / halfLife.Hours())
	return float32(decay)
}

// cosineSimilarity computes similarity between two vectors
func cosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) {
		return 0.0
	}

	var dotProduct, normA, normB float32
	for i := range a {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0.0
	}

	return dotProduct / (float32(math.Sqrt(float64(normA))) * float32(math.Sqrt(float64(normB))))
}

func sortByRelevance(scored []scoredMemory) {
	// Simple bubble sort (for production, use sort.Slice)
	for i := 0; i < len(scored); i++ {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].relevance > scored[i].relevance {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}
}

func generateMemoryID() string {
	return fmt.Sprintf("mem_%d", time.Now().UnixNano())
}

// ========================================
// REQUEST TYPES
// ========================================

type StoreMemoryRequest struct {
	TenantID   string
	AgentID    string
	Content    string
	Summary    string
	MemoryType string
	Importance float32
	Metadata   map[string]interface{}
	Tags       []string
}

type RecallRequest struct {
	TenantID      string
	AgentID       string
	Query         string
	MemoryType    string
	MinSimilarity float32
	Limit         int
}

// ========================================
// EMBEDDING SERVICE INTERFACE
// ========================================

// EmbeddingService generates vector embeddings from text
type EmbeddingService interface {
	Embed(ctx context.Context, text string) ([]float32, error)
	Dimension() int
}

// MockEmbedder for development (returns random vectors)
type MockEmbedder struct {
	dimension int
}

func NewMockEmbedder(dimension int) *MockEmbedder {
	return &MockEmbedder{dimension: dimension}
}

func (m *MockEmbedder) Embed(ctx context.Context, text string) ([]float32, error) {
	// In production, call sentence-transformers or OpenAI embeddings API
	// For now, return a deterministic vector based on text hash

	vec := make([]float32, m.dimension)
	hash := 0
	for _, c := range text {
		hash = hash*31 + int(c)
	}

	// Generate pseudo-random but deterministic vector
	for i := range vec {
		hash = hash*31 + i
		vec[i] = float32(hash%1000) / 1000.0
	}

	// Normalize
	var norm float32
	for _, v := range vec {
		norm += v * v
	}
	norm = float32(math.Sqrt(float64(norm)))

	for i := range vec {
		vec[i] /= norm
	}

	return vec, nil
}

func (m *MockEmbedder) Dimension() int {
	return m.dimension
}

// ========================================
// MIGRATIONS
// ========================================

// AutoMigrate creates memory tables
// NOTE: Requires pgvector extension: CREATE EXTENSION vector;
func (v *VectorMemory) AutoMigrate() error {
	// Enable pgvector extension (Postgres only)
	// v.db.Exec("CREATE EXTENSION IF NOT EXISTS vector")

	return v.db.AutoMigrate(&MemoryRecord{})
}

// ========================================
// USAGE-AWARE MEMORY
// ========================================

type scoredMemory struct {
	memory     *MemoryRecord
	similarity float32
	relevance  float32
}
