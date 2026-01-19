package federation

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// ========================================
// FEDERATION SANDBOX CONTROLS
// ========================================
// Purpose: Prevent federation from becoming attack vector
// Risk: Malicious external kernel could exploit federation
// Solution: Whitelist, rate limiting, kill-switch
// ========================================

// FederationSandbox wraps FederationClient with security controls
type FederationSandbox struct {
	client *FederationClient
	mu     sync.RWMutex

	// Security Controls
	whitelist map[string]bool           // kernelID -> allowed
	blacklist map[string]BlacklistEntry // kernelID -> reason
	rateLimit *FederationRateLimiter

	// Configuration
	config SandboxConfig

	// State
	sandboxMode   bool // If true, only whitelisted kernels allowed
	emergencyStop bool // If true, ALL federation blocked
}

// SandboxConfig defines federation security settings
type SandboxConfig struct {
	// Whitelist Mode
	SandboxMode          bool // If true, only whitelist allowed
	AutoDiscoveryEnabled bool // If false, manual whitelist only

	// Rate Limiting
	MaxRequestsPerMinute  int // Per remote kernel
	MaxConcurrentRequests int // Total across all kernels

	// Trust Requirements
	MinTrustScore          int  // Minimum trust score to accept
	RequireVerifiedKernel  bool // Require verified status
	RequireTLS             bool // Require HTTPS
	RequireAuditCompliance bool // Require SOC2/ISO27001

	// Timeouts
	HandshakeTimeout  time.Duration
	InvocationTimeout time.Duration

	// Kill-Switch
	EmergencyContactEmail string
}

// BlacklistEntry records why a kernel was blocked
type BlacklistEntry struct {
	KernelID  string
	Reason    string
	BlockedAt time.Time
	BlockedBy string // Admin who blocked it
	Expiry    *time.Time
}

// NewFederationSandbox creates a sandboxed federation client
func NewFederationSandbox(client *FederationClient, config SandboxConfig) *FederationSandbox {
	return &FederationSandbox{
		client:      client,
		whitelist:   make(map[string]bool),
		blacklist:   make(map[string]BlacklistEntry),
		rateLimit:   NewFederationRateLimiter(config.MaxRequestsPerMinute),
		config:      config,
		sandboxMode: config.SandboxMode,
	}
}

// ========================================
// WHITELIST MANAGEMENT
// ========================================

// WhitelistKernel explicitly allows a kernel
func (s *FederationSandbox) WhitelistKernel(kernelID string, approvedBy string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.whitelist[kernelID] = true

	// Remove from blacklist if present
	delete(s.blacklist, kernelID)

	fmt.Printf("[FEDERATION SANDBOX] Kernel %s whitelisted by %s\n", kernelID, approvedBy)
}

// BlacklistKernel blocks a kernel with reason
func (s *FederationSandbox) BlacklistKernel(kernelID string, reason string, blockedBy string, expiry *time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.blacklist[kernelID] = BlacklistEntry{
		KernelID:  kernelID,
		Reason:    reason,
		BlockedAt: time.Now(),
		BlockedBy: blockedBy,
		Expiry:    expiry,
	}

	// Remove from whitelist
	delete(s.whitelist, kernelID)

	fmt.Printf("[FEDERATION SANDBOX] Kernel %s blacklisted by %s. Reason: %s\n", kernelID, blockedBy, reason)
}

// IsAllowed checks if communication with kernel is permitted
func (s *FederationSandbox) IsAllowed(kernelID string) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Check emergency stop
	if s.emergencyStop {
		return fmt.Errorf("federation emergency stop active")
	}

	// Check blacklist
	if entry, blocked := s.blacklist[kernelID]; blocked {
		// Check if temporary blacklist expired
		if entry.Expiry != nil && time.Now().After(*entry.Expiry) {
			// Auto-unblock (would need mutex upgrade)
			fmt.Printf("[FEDERATION SANDBOX] Temporary blacklist expired for %s\n", kernelID)
		} else {
			return fmt.Errorf("kernel %s is blacklisted: %s", kernelID, entry.Reason)
		}
	}

	// Check whitelist if sandbox mode enabled
	if s.sandboxMode {
		if !s.whitelist[kernelID] {
			return fmt.Errorf("kernel %s not whitelisted (sandbox mode active)", kernelID)
		}
	}

	return nil
}

// ========================================
// SANDBOXED OPERATIONS
// ========================================

// DiscoverKernel with security checks
func (s *FederationSandbox) DiscoverKernel(ctx context.Context, targetURL string) (*KernelManifest, error) {
	// Check if auto-discovery enabled
	if !s.config.AutoDiscoveryEnabled {
		return nil, fmt.Errorf("auto-discovery disabled (manual whitelist only)")
	}

	// Apply timeout
	ctx, cancel := context.WithTimeout(ctx, s.config.HandshakeTimeout)
	defer cancel()

	// Discover
	manifest, err := s.client.DiscoverKernel(ctx, targetURL)
	if err != nil {
		return nil, fmt.Errorf("discovery failed: %w", err)
	}

	// Validate trust requirements
	if err := s.validateManifest(manifest); err != nil {
		// Auto-blacklist if fails validation
		s.BlacklistKernel(manifest.KernelID, fmt.Sprintf("validation failed: %s", err), "system", nil)
		return nil, err
	}

	// Check if meets minimum trust score
	trustScore := calculateTrustScore(manifest)
	if trustScore < s.config.MinTrustScore {
		return nil, fmt.Errorf("trust score too low: %d < %d", trustScore, s.config.MinTrustScore)
	}

	// Success - add to whitelist if sandbox mode
	if s.sandboxMode {
		fmt.Printf("[FEDERATION SANDBOX] Discovered kernel %s with trust score %d. Manual approval required.\n",
			manifest.KernelID, trustScore)
	}

	return manifest, nil
}

// InvokeRemoteAgent with security checks
func (s *FederationSandbox) InvokeRemoteAgent(ctx context.Context, targetKernel string, req InvocationRequest) (*InvocationResponse, error) {
	// Check if allowed
	if err := s.IsAllowed(targetKernel); err != nil {
		return nil, err
	}

	// Check rate limit
	if !s.rateLimit.Allow(targetKernel) {
		return nil, fmt.Errorf("rate limit exceeded for kernel %s", targetKernel)
	}

	// Apply timeout
	ctx, cancel := context.WithTimeout(ctx, s.config.InvocationTimeout)
	defer cancel()

	// Invoke
	resp, err := s.client.InvokeRemoteAgent(ctx, targetKernel, req)

	// Track failure for trust adjustment
	if err != nil {
		s.client.trustRegistry.RecordInteraction(targetKernel, false)

		// If repeated failures, consider auto-blacklist
		trustScore := s.client.trustRegistry.GetTrustScore(targetKernel)
		if trustScore < 30 {
			s.BlacklistKernel(targetKernel, "trust score dropped below 30", "system", nil)
		}
	} else {
		s.client.trustRegistry.RecordInteraction(targetKernel, true)
	}

	return resp, err
}

// ========================================
// SECURITY VALIDATION
// ========================================

func (s *FederationSandbox) validateManifest(manifest *KernelManifest) error {
	// Require verified kernel
	if s.config.RequireVerifiedKernel && !manifest.TrustSignals.VerifiedKernel {
		return fmt.Errorf("kernel not verified")
	}

	// Require TLS
	if s.config.RequireTLS && !manifest.TrustSignals.TLSEnabled {
		return fmt.Errorf("TLS not enabled")
	}

	// Require audit compliance
	if s.config.RequireAuditCompliance && manifest.TrustSignals.AuditCompliance == "" {
		return fmt.Errorf("no audit compliance certification")
	}

	// Validate public key present
	if manifest.PublicKey == "" {
		return fmt.Errorf("no public key provided")
	}

	return nil
}

// ========================================
// EMERGENCY CONTROLS
// ========================================

// EmergencyStop halts ALL federation immediately
func (s *FederationSandbox) EmergencyStop(reason string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.emergencyStop = true

	fmt.Printf("🚨 [FEDERATION EMERGENCY STOP] Reason: %s\n", reason)

	// Send alert (in production, trigger PagerDuty/email)
	if s.config.EmergencyContactEmail != "" {
		fmt.Printf("Alert sent to: %s\n", s.config.EmergencyContactEmail)
	}
}

// Resume resumes federation after emergency stop
func (s *FederationSandbox) Resume(authorizedBy string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.emergencyStop = false

	fmt.Printf("✅ [FEDERATION RESUMED] Authorized by: %s\n", authorizedBy)
}

// ========================================
// RATE LIMITING
// ========================================

type FederationRateLimiter struct {
	mu           sync.Mutex
	limits       map[string]*RateLimitBucket
	maxPerMinute int
}

type RateLimitBucket struct {
	count   int
	resetAt time.Time
}

func NewFederationRateLimiter(maxPerMinute int) *FederationRateLimiter {
	return &FederationRateLimiter{
		limits:       make(map[string]*RateLimitBucket),
		maxPerMinute: maxPerMinute,
	}
}

func (r *FederationRateLimiter) Allow(kernelID string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	bucket, exists := r.limits[kernelID]
	if !exists {
		bucket = &RateLimitBucket{
			count:   0,
			resetAt: time.Now().Add(time.Minute),
		}
		r.limits[kernelID] = bucket
	}

	// Reset if time expired
	if time.Now().After(bucket.resetAt) {
		bucket.count = 0
		bucket.resetAt = time.Now().Add(time.Minute)
	}

	// Check limit
	if bucket.count >= r.maxPerMinute {
		return false
	}

	bucket.count++
	return true
}

// ========================================
// REPORTING
// ========================================

// GetFederationStats returns security status
func (s *FederationSandbox) GetFederationStats() *FederationStats {
	s.mu.RLock()
	defer s.mu.RUnlock()

	whitelistedKernels := make([]string, 0, len(s.whitelist))
	for kernelID := range s.whitelist {
		whitelistedKernels = append(whitelistedKernels, kernelID)
	}

	blacklistedKernels := make([]BlacklistEntry, 0, len(s.blacklist))
	for _, entry := range s.blacklist {
		blacklistedKernels = append(blacklistedKernels, entry)
	}

	return &FederationStats{
		SandboxMode:        s.sandboxMode,
		EmergencyStop:      s.emergencyStop,
		WhitelistedCount:   len(s.whitelist),
		BlacklistedCount:   len(s.blacklist),
		WhitelistedKernels: whitelistedKernels,
		BlacklistedKernels: blacklistedKernels,
	}
}

type FederationStats struct {
	SandboxMode        bool
	EmergencyStop      bool
	WhitelistedCount   int
	BlacklistedCount   int
	WhitelistedKernels []string
	BlacklistedKernels []BlacklistEntry
}

// ========================================
// DEFAULT CONFIGURATION
// ========================================

// ProductionSandboxConfig returns secure defaults for production
func ProductionSandboxConfig() SandboxConfig {
	return SandboxConfig{
		SandboxMode:            true,  // Whitelist only
		AutoDiscoveryEnabled:   false, // Manual approval required
		MaxRequestsPerMinute:   60,
		MaxConcurrentRequests:  10,
		MinTrustScore:          70,
		RequireVerifiedKernel:  true,
		RequireTLS:             true,
		RequireAuditCompliance: true,
		HandshakeTimeout:       10 * time.Second,
		InvocationTimeout:      30 * time.Second,
	}
}

// DevelopmentSandboxConfig returns permissive settings for dev
func DevelopmentSandboxConfig() SandboxConfig {
	return SandboxConfig{
		SandboxMode:            false,
		AutoDiscoveryEnabled:   true,
		MaxRequestsPerMinute:   600,
		MaxConcurrentRequests:  100,
		MinTrustScore:          50,
		RequireVerifiedKernel:  false,
		RequireTLS:             false,
		RequireAuditCompliance: false,
		HandshakeTimeout:       30 * time.Second,
		InvocationTimeout:      60 * time.Second,
	}
}
