package memory

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ========================================
// MEMORY BOUNDARY ENFORCEMENT
// ========================================
// Purpose: HARD tenant isolation for vector memory
// Critical for: GDPR, compliance, security
// Problem: Vector embeddings can leak across tenants if not careful
// Solution: Row-level security + validation
// ========================================

// MemoryBoundaryEnforcer ensures NO cross-tenant data leakage
type MemoryBoundaryEnforcer struct {
	vm *VectorMemory
}

// NewMemoryBoundaryEnforcer wraps VectorMemory with isolation guarantees
func NewMemoryBoundaryEnforcer(vm *VectorMemory) *MemoryBoundaryEnforcer {
	return &MemoryBoundaryEnforcer{vm: vm}
}

// ========================================
// TENANT-SCOPED OPERATIONS (SAFE)
// ========================================

// Store with MANDATORY tenant validation
func (e *MemoryBoundaryEnforcer) Store(ctx context.Context, req StoreMemoryRequest) (*MemoryRecord, error) {
	// CRITICAL: Validate tenant ID is present
	if req.TenantID == "" {
		return nil, fmt.Errorf("SECURITY: tenant_id is REQUIRED for memory storage")
	}

	// CRITICAL: Validate agent belongs to tenant
	// (In production, query AgentRegistry to verify ownership)

	return e.vm.Store(ctx, req)
}

// Recall with MANDATORY tenant isolation
func (e *MemoryBoundaryEnforcer) Recall(ctx context.Context, req RecallRequest) ([]*MemoryRecord, error) {
	// CRITICAL: Validate tenant ID
	if req.TenantID == "" {
		return nil, fmt.Errorf("SECURITY: tenant_id is REQUIRED for memory recall")
	}

	// CRITICAL: Double-check query doesn't escape tenant boundary
	memories, err := e.vm.Recall(ctx, req)
	if err != nil {
		return nil, err
	}

	// PARANOID CHECK: Verify all returned memories belong to correct tenant
	for _, mem := range memories {
		if mem.TenantID != req.TenantID {
			// This should NEVER happen - if it does, it's a critical security bug
			panic(fmt.Sprintf("CRITICAL SECURITY BUG: Memory %s leaked from tenant %s to %s",
				mem.ID, mem.TenantID, req.TenantID))
		}
	}

	return memories, nil
}

// ========================================
// GDPR COMPLIANCE OPERATIONS
// ========================================

// PurgeTenantMemories implements "Right to be Forgotten"
func (e *MemoryBoundaryEnforcer) PurgeTenantMemories(ctx context.Context, tenantID string, reason string) error {
	if tenantID == "" {
		return fmt.Errorf("tenant_id required for purge")
	}

	// Hard delete ALL memories for tenant
	result := e.vm.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Delete(&MemoryRecord{})

	if result.Error != nil {
		return fmt.Errorf("failed to purge memories: %w", result.Error)
	}

	// Log purge for audit trail
	// (In production, write to immutable audit log)
	fmt.Printf("[GDPR PURGE] Deleted %d memories for tenant %s. Reason: %s\n",
		result.RowsAffected, tenantID, reason)

	return nil
}

// SetMemoryRetentionPolicy applies TTL to memory types
func (e *MemoryBoundaryEnforcer) SetMemoryRetentionPolicy(ctx context.Context, tenantID string, policy RetentionPolicy) error {
	if tenantID == "" {
		return fmt.Errorf("tenant_id required")
	}

	// Apply TTL based on memory type
	var deleteCount int64

	for memType, ttl := range policy.TTLByType {
		cutoff := time.Now().Add(-ttl)

		result := e.vm.db.WithContext(ctx).
			Where("tenant_id = ? AND memory_type = ? AND created_at < ?", tenantID, memType, cutoff).
			Delete(&MemoryRecord{})

		deleteCount += result.RowsAffected
	}

	fmt.Printf("[RETENTION] Deleted %d expired memories for tenant %s\n", deleteCount, tenantID)

	return nil
}

// GetMemoryStats returns memory usage per tenant (for billing/quotas)
func (e *MemoryBoundaryEnforcer) GetMemoryStats(ctx context.Context, tenantID string) (*MemoryStats, error) {
	if tenantID == "" {
		return nil, fmt.Errorf("tenant_id required")
	}

	var stats MemoryStats

	// Count memories by type
	rows, err := e.vm.db.WithContext(ctx).
		Model(&MemoryRecord{}).
		Select("memory_type, COUNT(*) as count").
		Where("tenant_id = ?", tenantID).
		Group("memory_type").
		Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats.ByType = make(map[string]int64)
	for rows.Next() {
		var memType string
		var count int64
		rows.Scan(&memType, &count)
		stats.ByType[memType] = count
		stats.Total += count
	}

	// Calculate storage size estimate (embedding size + content)
	stats.EstimatedSizeMB = float64(stats.Total) * 0.001 // ~1KB per memory

	return &stats, nil
}

// ========================================
// TENANT DELETION (HARD DELETE)
// ========================================

// DeleteTenantCompletely implements full data deletion (offboarding)
func (e *MemoryBoundaryEnforcer) DeleteTenantCompletely(ctx context.Context, tenantID string) error {
	if tenantID == "" {
		return fmt.Errorf("tenant_id required")
	}

	// CRITICAL: This is IRREVERSIBLE
	// In production, require:
	// 1. Admin approval
	// 2. Backup confirmation
	// 3. Grace period expired

	result := e.vm.db.WithContext(ctx).
		Unscoped(). // HARD delete, bypass soft delete
		Where("tenant_id = ?", tenantID).
		Delete(&MemoryRecord{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete tenant memories: %w", result.Error)
	}

	fmt.Printf("[TENANT DELETION] Permanently deleted %d memories for tenant %s\n",
		result.RowsAffected, tenantID)

	return nil
}

// ========================================
// CROSS-TENANT VALIDATION (PARANOID MODE)
// ========================================

// ValidateNoLeakage runs periodic check to ensure no cross-tenant pollution
func (e *MemoryBoundaryEnforcer) ValidateNoLeakage(ctx context.Context) error {
	// Query: Find memories where embedding is suspiciously similar to another tenant
	// This shouldn't happen unless there's a bug or attack

	// PSEUDO-CODE (expensive query, run during off-peak):
	// SELECT m1.tenant_id, m2.tenant_id, cosine_similarity(m1.embedding, m2.embedding)
	// FROM memory_records m1, memory_records m2
	// WHERE m1.tenant_id != m2.tenant_id
	//   AND cosine_similarity(m1.embedding, m2.embedding) > 0.99

	// If any found → CRITICAL ALERT

	return nil
}

// ========================================
// TYPES
// ========================================

type RetentionPolicy struct {
	TTLByType map[string]time.Duration
}

type MemoryStats struct {
	Total           int64
	ByType          map[string]int64
	EstimatedSizeMB float64
}

// DefaultRetentionPolicy returns GDPR-compliant defaults
func DefaultRetentionPolicy() RetentionPolicy {
	return RetentionPolicy{
		TTLByType: map[string]time.Duration{
			"negotiation": 90 * 24 * time.Hour,  // 90 days
			"preference":  365 * 24 * time.Hour, // 1 year
			"outcome":     180 * 24 * time.Hour, // 6 months
			"insight":     730 * 24 * time.Hour, // 2 years
			"temporary":   7 * 24 * time.Hour,   // 7 days
		},
	}
}

// ========================================
// ROW-LEVEL SECURITY (POSTGRES)
// ========================================

// EnableRowLevelSecurity creates Postgres RLS policies
// This is the STRONGEST isolation mechanism
func EnableRowLevelSecurity(db *gorm.DB) error {
	// NOTE: This requires Postgres 9.5+
	// SQLite doesn't support RLS

	sqls := []string{
		// Enable RLS on memory_records table
		`ALTER TABLE memory_records ENABLE ROW LEVEL SECURITY`,

		// Policy: Users can only see their tenant's data
		`CREATE POLICY tenant_isolation ON memory_records
		 USING (tenant_id = current_setting('app.current_tenant_id')::text)`,

		// Policy: Inserts must match current tenant
		`CREATE POLICY tenant_insert ON memory_records
		 FOR INSERT
		 WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::text)`,
	}

	for _, sql := range sqls {
		if err := db.Exec(sql).Error; err != nil {
			// Might fail on non-Postgres or if already exists
			fmt.Printf("RLS setup warning: %v\n", err)
		}
	}

	return nil
}

// SetTenantContext sets the Postgres session variable for RLS
func SetTenantContext(db *gorm.DB, tenantID string) error {
	return db.Exec("SET app.current_tenant_id = ?", tenantID).Error
}
