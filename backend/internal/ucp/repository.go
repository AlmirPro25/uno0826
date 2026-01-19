package ucp

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ========================================
// UCP DISCOVERY PERSISTENCE
// ========================================
// Purpose: Store UCP manifests and sessions in database
// Replaces: In-memory storage (lost on restart)
// Benefits:
//   - Survives restarts
//   - Historical tracking
//   - Trust reputation persistence
// ========================================

// DiscoveryRepository handles UCP manifest persistence
type DiscoveryRepository struct {
	db *gorm.DB
}

// NewDiscoveryRepository creates a new repository
func NewDiscoveryRepository(db *gorm.DB) *DiscoveryRepository {
	return &DiscoveryRepository{db: db}
}

// ========================================
// DATABASE MODELS
// ========================================

// UCPManifestRecord stores discovered UCP endpoints
type UCPManifestRecord struct {
	ID        uint      `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"index"`
	UpdatedAt time.Time

	// Identity
	TargetURL  string `gorm:"uniqueIndex;not null"` // e.g., https://example.com
	MerchantID string `gorm:"index"`
	Domain     string `gorm:"index"`

	// Manifest (stored as JSON)
	ManifestJSON []byte `gorm:"type:jsonb"` // Full manifest

	// Trust Metrics
	TrustScore      int   `gorm:"default:0"`
	SuccessfulCalls int64 `gorm:"default:0"`
	FailedCalls     int64 `gorm:"default:0"`
	LastInteraction *time.Time
	IsBlacklisted   bool `gorm:"default:false"`
	BlacklistReason string

	// Cryptographic Verification
	PublicKeyHex   string
	SignatureValid bool `gorm:"default:false"`
	LastVerified   *time.Time

	// Session Management
	SessionExpiresAt *time.Time
}

// UCPInteractionLog stores transaction history
type UCPInteractionLog struct {
	ID        uint      `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"index"`

	// Related entities
	ManifestID uint   `gorm:"index"` // FK to UCPManifestRecord
	TargetURL  string `gorm:"index"`
	AgentID    string `gorm:"index"`

	// Interaction details
	InteractionType string `gorm:"index"` // "discovery", "catalog", "negotiation", "checkout"
	Success         bool
	ErrorMessage    string
	LatencyMs       int64

	// Payload
	RequestJSON  []byte `gorm:"type:jsonb"`
	ResponseJSON []byte `gorm:"type:jsonb"`
}

// ========================================
// REPOSITORY METHODS
// ========================================

// StoreManifest saves or updates a UCP manifest
func (r *DiscoveryRepository) StoreManifest(ctx context.Context, targetURL string, manifest *DiscoveryManifest, trustScore int, publicKey string) error {
	manifestJSON, err := json.Marshal(manifest)
	if err != nil {
		return fmt.Errorf("failed to marshal manifest: %w", err)
	}

	record := UCPManifestRecord{
		TargetURL:    targetURL,
		MerchantID:   manifest.Merchant.ID,
		Domain:       manifest.Merchant.Domain,
		ManifestJSON: manifestJSON,
		TrustScore:   trustScore,
		PublicKeyHex: publicKey,
	}

	// Upsert (insert or update if exists)
	result := r.db.WithContext(ctx).
		Where("target_url = ?", targetURL).
		Assign(map[string]interface{}{
			"manifest_json":  manifestJSON,
			"trust_score":    trustScore,
			"public_key_hex": publicKey,
			"updated_at":     time.Now(),
		}).
		FirstOrCreate(&record)

	return result.Error
}

// GetManifest retrieves a cached manifest
func (r *DiscoveryRepository) GetManifest(ctx context.Context, targetURL string) (*DiscoveryManifest, int, error) {
	var record UCPManifestRecord

	result := r.db.WithContext(ctx).
		Where("target_url = ?", targetURL).
		First(&record)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, 0, ErrManifestNotFound
		}
		return nil, 0, result.Error
	}

	var manifest DiscoveryManifest
	if err := json.Unmarshal(record.ManifestJSON, &manifest); err != nil {
		return nil, 0, fmt.Errorf("failed to unmarshal manifest: %w", err)
	}

	return &manifest, record.TrustScore, nil
}

// UpdateTrustScore updates trust metrics after interaction
func (r *DiscoveryRepository) UpdateTrustScore(ctx context.Context, targetURL string, success bool, newScore int) error {
	updates := map[string]interface{}{
		"trust_score":      newScore,
		"last_interaction": time.Now(),
	}

	if success {
		updates["successful_calls"] = gorm.Expr("successful_calls + ?", 1)
	} else {
		updates["failed_calls"] = gorm.Expr("failed_calls + ?", 1)
	}

	result := r.db.WithContext(ctx).
		Model(&UCPManifestRecord{}).
		Where("target_url = ?", targetURL).
		Updates(updates)

	return result.Error
}

// BlacklistEndpoint marks an endpoint as untrusted
func (r *DiscoveryRepository) BlacklistEndpoint(ctx context.Context, targetURL string, reason string) error {
	result := r.db.WithContext(ctx).
		Model(&UCPManifestRecord{}).
		Where("target_url = ?", targetURL).
		Updates(map[string]interface{}{
			"is_blacklisted":   true,
			"blacklist_reason": reason,
		})

	return result.Error
}

// IsBlacklisted checks if an endpoint is blacklisted
func (r *DiscoveryRepository) IsBlacklisted(ctx context.Context, targetURL string) (bool, error) {
	var record UCPManifestRecord

	result := r.db.WithContext(ctx).
		Select("is_blacklisted").
		Where("target_url = ?", targetURL).
		First(&record)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return false, nil
		}
		return false, result.Error
	}

	return record.IsBlacklisted, nil
}

// ListManifests returns all discovered endpoints
func (r *DiscoveryRepository) ListManifests(ctx context.Context, limit int, offset int) ([]UCPManifestRecord, error) {
	var records []UCPManifestRecord

	result := r.db.WithContext(ctx).
		Order("trust_score DESC, updated_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&records)

	return records, result.Error
}

// ========================================
// INTERACTION LOGGING
// ========================================

// LogInteraction records a UCP interaction
func (r *DiscoveryRepository) LogInteraction(ctx context.Context, log *UCPInteractionLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

// GetInteractionHistory retrieves interaction logs
func (r *DiscoveryRepository) GetInteractionHistory(ctx context.Context, targetURL string, limit int) ([]UCPInteractionLog, error) {
	var logs []UCPInteractionLog

	result := r.db.WithContext(ctx).
		Where("target_url = ?", targetURL).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs)

	return logs, result.Error
}

// ========================================
// ANALYTICS
// ========================================

// GetTrustStats returns trust metrics summary
func (r *DiscoveryRepository) GetTrustStats(ctx context.Context) (map[string]interface{}, error) {
	var stats struct {
		TotalEndpoints   int64
		TrustedCount     int64 // trust_score >= 70
		BlacklistedCount int64
		AvgTrustScore    float64
	}

	r.db.WithContext(ctx).
		Model(&UCPManifestRecord{}).
		Count(&stats.TotalEndpoints)

	r.db.WithContext(ctx).
		Model(&UCPManifestRecord{}).
		Where("trust_score >= ?", 70).
		Count(&stats.TrustedCount)

	r.db.WithContext(ctx).
		Model(&UCPManifestRecord{}).
		Where("is_blacklisted = ?", true).
		Count(&stats.BlacklistedCount)

	r.db.WithContext(ctx).
		Model(&UCPManifestRecord{}).
		Select("AVG(trust_score) as avg_trust_score").
		Scan(&stats.AvgTrustScore)

	return map[string]interface{}{
		"total_endpoints":   stats.TotalEndpoints,
		"trusted_count":     stats.TrustedCount,
		"blacklisted_count": stats.BlacklistedCount,
		"avg_trust_score":   stats.AvgTrustScore,
	}, nil
}

// ========================================
// CACHE INVALIDATION
// ========================================

// InvalidateOldSessions deletes expired sessions
func (r *DiscoveryRepository) InvalidateOldSessions(ctx context.Context) error {
	result := r.db.WithContext(ctx).
		Where("session_expires_at < ?", time.Now()).
		Delete(&UCPManifestRecord{})

	return result.Error
}

// ========================================
// MIGRATION HELPER
// ========================================

// AutoMigrate creates/updates database tables
func (r *DiscoveryRepository) AutoMigrate() error {
	return r.db.AutoMigrate(
		&UCPManifestRecord{},
		&UCPInteractionLog{},
	)
}

// ========================================
// ERRORS
// ========================================

var (
	ErrManifestNotFound = fmt.Errorf("ucp manifest not found in cache")
)
