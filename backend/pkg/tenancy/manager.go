package tenancy

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"gorm.io/gorm"
)

// ========================================
// MULTI-TENANCY MANAGER
// ========================================
// Purpose: Enable SaaS deployment with complete tenant isolation
// Use Case: Multiple enterprises running their own sovereign kernels
// Security: Cryptographic tenant IDs, isolated databases, separate budgets
// Business Model: $50k+ MRR per enterprise tenant
// ========================================

// TenantManager handles multi-tenant kernel instances
type TenantManager struct {
	mu       sync.RWMutex
	tenants  map[string]*Tenant
	db       *gorm.DB
	isolated bool // If true, use schema-per-tenant (Postgres)
}

// Tenant represents an isolated kernel instance
type Tenant struct {
	ID        string    `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"index"`
	UpdatedAt time.Time

	// Identity
	Name         string `gorm:"not null"`
	Domain       string `gorm:"uniqueIndex;not null"` // e.g., "acme-corp"
	DisplayName  string
	ContactEmail string

	// Security
	APIKey       string `gorm:"uniqueIndex;not null"` // For API authentication
	SecretKey    string // For webhook signing
	PublicKeyHex string // For UCP signature verification

	// Configuration
	Config TenantConfig `gorm:"type:jsonb;serializer:json"`

	// Status
	Status       TenantStatus `gorm:"default:'active'"`
	TrialEndsAt  *time.Time
	SubscribedAt *time.Time
	PlanTier     string `gorm:"default:'starter'"` // starter, professional, enterprise

	// Limits
	MaxAgents         int   `gorm:"default:5"`
	MaxAICalls        int64 `gorm:"default:10000"` // per month
	MaxUCPConnections int   `gorm:"default:10"`

	// Usage Tracking
	CurrentAICalls int64
	CurrentAgents  int
	MonthlyResetAt time.Time
	LastActivityAt *time.Time

	// Metadata
	Metadata map[string]string `gorm:"type:jsonb;serializer:json"`
}

// TenantConfig holds tenant-specific settings
type TenantConfig struct {
	// AI Budget
	AIBudgetDailyUSD   float64 `json:"ai_budget_daily_usd"`
	AIBudgetMonthlyUSD float64 `json:"ai_budget_monthly_usd"`

	// Security
	AllowedOrigins []string `json:"allowed_origins"`
	WebhookURL     string   `json:"webhook_url"`
	IPWhitelist    []string `json:"ip_whitelist"`

	// Features
	EnableUCP         bool `json:"enable_ucp"`
	EnableCognitive   bool `json:"enable_cognitive"`
	EnableTelemetry   bool `json:"enable_telemetry"`
	EnableAutoscaling bool `json:"enable_autoscaling"`

	// Branding
	LogoURL   string `json:"logo_url"`
	ThemeMode string `json:"theme_mode"` // light, dark, custom
}

// TenantStatus represents tenant lifecycle
type TenantStatus string

const (
	TenantStatusActive    TenantStatus = "active"
	TenantStatusTrialing  TenantStatus = "trialing"
	TenantStatusSuspended TenantStatus = "suspended"
	TenantStatusCanceled  TenantStatus = "canceled"
)

// NewTenantManager creates a multi-tenant manager
func NewTenantManager(db *gorm.DB, isolated bool) *TenantManager {
	return &TenantManager{
		tenants:  make(map[string]*Tenant),
		db:       db,
		isolated: isolated,
	}
}

// ========================================
// TENANT PROVISIONING
// ========================================

// CreateTenant provisions a new tenant with isolated resources
func (m *TenantManager) CreateTenant(ctx context.Context, req CreateTenantRequest) (*Tenant, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Validate domain uniqueness
	var existing Tenant
	if err := m.db.Where("domain = ?", req.Domain).First(&existing).Error; err == nil {
		return nil, fmt.Errorf("tenant domain '%s' already exists", req.Domain)
	}

	// Generate cryptographic credentials
	apiKey, err := generateAPIKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate API key: %w", err)
	}

	secretKey, err := generateSecretKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate secret key: %w", err)
	}

	// Create tenant
	tenant := &Tenant{
		ID:             generateTenantID(),
		Name:           req.Name,
		Domain:         req.Domain,
		DisplayName:    req.DisplayName,
		ContactEmail:   req.ContactEmail,
		APIKey:         apiKey,
		SecretKey:      secretKey,
		Status:         TenantStatusTrialing,
		PlanTier:       req.PlanTier,
		Config:         req.Config,
		MonthlyResetAt: nextMonth(),
	}

	// Set trial period (14 days)
	trialEnd := time.Now().Add(14 * 24 * time.Hour)
	tenant.TrialEndsAt = &trialEnd

	// Apply tier limits
	m.applyTierLimits(tenant, req.PlanTier)

	// Persist to database
	if err := m.db.WithContext(ctx).Create(tenant).Error; err != nil {
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	// If schema isolation enabled, create dedicated schema
	if m.isolated {
		if err := m.createTenantSchema(ctx, tenant.ID); err != nil {
			return nil, fmt.Errorf("failed to create tenant schema: %w", err)
		}
	}

	// Cache in memory
	m.tenants[tenant.ID] = tenant

	return tenant, nil
}

// createTenantSchema creates a dedicated Postgres schema for tenant isolation
func (m *TenantManager) createTenantSchema(ctx context.Context, tenantID string) error {
	schemaName := fmt.Sprintf("tenant_%s", tenantID)

	// Create schema
	if err := m.db.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaName)).Error; err != nil {
		return err
	}

	// Run migrations in tenant schema
	// (This would be implemented by your migration system)

	return nil
}

// applyTierLimits sets resource limits based on plan tier
func (m *TenantManager) applyTierLimits(tenant *Tenant, tier string) {
	switch tier {
	case "starter":
		tenant.MaxAgents = 5
		tenant.MaxAICalls = 10_000
		tenant.MaxUCPConnections = 10
		tenant.Config.AIBudgetDailyUSD = 5.00
		tenant.Config.AIBudgetMonthlyUSD = 100.00

	case "professional":
		tenant.MaxAgents = 25
		tenant.MaxAICalls = 100_000
		tenant.MaxUCPConnections = 50
		tenant.Config.AIBudgetDailyUSD = 50.00
		tenant.Config.AIBudgetMonthlyUSD = 1000.00

	case "enterprise":
		tenant.MaxAgents = 100
		tenant.MaxAICalls = 1_000_000
		tenant.MaxUCPConnections = 500
		tenant.Config.AIBudgetDailyUSD = 500.00
		tenant.Config.AIBudgetMonthlyUSD = 10000.00

	default:
		// Default to starter
		m.applyTierLimits(tenant, "starter")
	}
}

// ========================================
// TENANT MANAGEMENT
// ========================================

// GetTenant retrieves a tenant by ID
func (m *TenantManager) GetTenant(ctx context.Context, tenantID string) (*Tenant, error) {
	m.mu.RLock()
	if tenant, ok := m.tenants[tenantID]; ok {
		m.mu.RUnlock()
		return tenant, nil
	}
	m.mu.RUnlock()

	// Load from database
	var tenant Tenant
	if err := m.db.WithContext(ctx).Where("id = ?", tenantID).First(&tenant).Error; err != nil {
		return nil, fmt.Errorf("tenant not found: %w", err)
	}

	// Cache
	m.mu.Lock()
	m.tenants[tenantID] = &tenant
	m.mu.Unlock()

	return &tenant, nil
}

// GetTenantByAPIKey retrieves a tenant by API key (for authentication)
func (m *TenantManager) GetTenantByAPIKey(ctx context.Context, apiKey string) (*Tenant, error) {
	var tenant Tenant
	if err := m.db.WithContext(ctx).Where("api_key = ?", apiKey).First(&tenant).Error; err != nil {
		return nil, fmt.Errorf("invalid API key: %w", err)
	}

	// Verify tenant is active
	if tenant.Status != TenantStatusActive && tenant.Status != TenantStatusTrialing {
		return nil, fmt.Errorf("tenant is %s", tenant.Status)
	}

	// Update last activity
	tenant.LastActivityAt = timePtr(time.Now())
	m.db.WithContext(ctx).Model(&tenant).Update("last_activity_at", tenant.LastActivityAt)

	return &tenant, nil
}

// UpdateTenant modifies tenant settings
func (m *TenantManager) UpdateTenant(ctx context.Context, tenantID string, updates map[string]interface{}) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	result := m.db.WithContext(ctx).Model(&Tenant{}).Where("id = ?", tenantID).Updates(updates)
	if result.Error != nil {
		return result.Error
	}

	// Invalidate cache
	delete(m.tenants, tenantID)

	return nil
}

// SuspendTenant temporarily disables a tenant
func (m *TenantManager) SuspendTenant(ctx context.Context, tenantID string, reason string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Use struct-based update to ensure GORM handles type conversion/serialization correctly
	updates := Tenant{
		Status: TenantStatusSuspended,
		Metadata: map[string]string{
			"suspension_reason": reason,
			"suspended_at":      time.Now().Format(time.RFC3339),
		},
	}

	result := m.db.WithContext(ctx).Model(&Tenant{}).Where("id = ?", tenantID).Updates(updates)
	if result.Error != nil {
		return result.Error
	}

	// Invalidate cache
	delete(m.tenants, tenantID)

	return nil
}

// ActivateTenant re-enables a suspended tenant
func (m *TenantManager) ActivateTenant(ctx context.Context, tenantID string) error {
	return m.UpdateTenant(ctx, tenantID, map[string]interface{}{
		"status": TenantStatusActive,
	})
}

// ========================================
// USAGE TRACKING
// ========================================

// TrackAICall increments tenant's AI usage counter
func (m *TenantManager) TrackAICall(ctx context.Context, tenantID string) error {
	err := m.db.WithContext(ctx).Model(&Tenant{}).
		Where("id = ?", tenantID).
		UpdateColumn("current_ai_calls", gorm.Expr("current_ai_calls + ?", 1)).Error

	if err != nil {
		return err
	}

	// Invalidate cache to force reload of usage stats
	m.mu.Lock()
	delete(m.tenants, tenantID)
	m.mu.Unlock()

	return nil
}

// CheckQuota verifies if tenant is within limits
func (m *TenantManager) CheckQuota(ctx context.Context, tenantID string, resourceType string) error {
	tenant, err := m.GetTenant(ctx, tenantID)
	if err != nil {
		return err
	}

	// Reset monthly counters if needed
	if time.Now().After(tenant.MonthlyResetAt) {
		m.resetMonthlyUsage(ctx, tenantID)
		tenant.CurrentAICalls = 0
	}

	switch resourceType {
	case "ai_call":
		if tenant.CurrentAICalls >= tenant.MaxAICalls {
			return fmt.Errorf("tenant %s exceeded AI call quota: %d/%d", tenantID, tenant.CurrentAICalls, tenant.MaxAICalls)
		}

	case "agent":
		if tenant.CurrentAgents >= tenant.MaxAgents {
			return fmt.Errorf("tenant %s exceeded agent quota: %d/%d", tenantID, tenant.CurrentAgents, tenant.MaxAgents)
		}
	}

	return nil
}

// resetMonthlyUsage resets monthly counters
func (m *TenantManager) resetMonthlyUsage(ctx context.Context, tenantID string) error {
	return m.db.WithContext(ctx).Model(&Tenant{}).
		Where("id = ?", tenantID).
		Updates(map[string]interface{}{
			"current_ai_calls": 0,
			"monthly_reset_at": nextMonth(),
		}).Error
}

// ========================================
// UTILITIES
// ========================================

// CreateTenantRequest holds tenant creation parameters
type CreateTenantRequest struct {
	Name         string
	Domain       string
	DisplayName  string
	ContactEmail string
	PlanTier     string
	Config       TenantConfig
}

func generateTenantID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("tnt_%s", hex.EncodeToString(b)[:24])
}

func generateAPIKey() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("prost_live_%s", hex.EncodeToString(b)), nil
}

func generateSecretKey() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("sk_%s", hex.EncodeToString(b)), nil
}

func timePtr(t time.Time) *time.Time {
	return &t
}

func nextMonth() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
}

// ========================================
// MIGRATIONS
// ========================================

// AutoMigrate creates tenant tables
func (m *TenantManager) AutoMigrate() error {
	return m.db.AutoMigrate(&Tenant{})
}
