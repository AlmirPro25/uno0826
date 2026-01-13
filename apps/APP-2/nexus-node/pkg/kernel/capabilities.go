package kernel

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Capability constants for Nexus features
const (
	CapVideoCalls       = "nexus.video_calls"
	CapUnlimitedPeers   = "nexus.unlimited_peers"
	CapLargeFiles       = "nexus.large_files"
	CapUnlimitedHistory = "nexus.unlimited_history"
	CapCommunities      = "nexus.communities"
	CapPriorityRelay    = "nexus.priority_relay"
)

// PlanLimits defines limits for different plans
type PlanLimits struct {
	MaxPeers          int   `json:"max_peers"`
	MaxFileSizeMB     int   `json:"max_file_size_mb"`
	MaxCommunities    int   `json:"max_communities"`
	HistoryDays       int   `json:"history_days"`
	VideoCalls        bool  `json:"video_calls"`
	PriorityRelay     bool  `json:"priority_relay"`
}

// DefaultFreeLimits returns the default limits for free users
func DefaultFreeLimits() *PlanLimits {
	return &PlanLimits{
		MaxPeers:       10,
		MaxFileSizeMB:  50,
		MaxCommunities: 3,
		HistoryDays:    7,
		VideoCalls:     false,
		PriorityRelay:  false,
	}
}

// DefaultProLimits returns the limits for pro users
func DefaultProLimits() *PlanLimits {
	return &PlanLimits{
		MaxPeers:       -1, // Unlimited
		MaxFileSizeMB:  1024,
		MaxCommunities: -1, // Unlimited
		HistoryDays:    -1, // Unlimited
		VideoCalls:     true,
		PriorityRelay:  true,
	}
}

// CheckCapability checks if a capability is allowed
func (b *Bridge) CheckCapability(capability string) bool {
	if !b.IsEnabled() || !b.IsLinked() {
		// Not linked = free tier
		return b.checkFreeCapability(capability)
	}

	// Check cache first
	b.mu.RLock()
	if time.Since(b.lastCapCheck) < 5*time.Minute {
		if allowed, ok := b.capabilities[capability]; ok {
			b.mu.RUnlock()
			return allowed
		}
	}
	b.mu.RUnlock()

	// Fetch from kernel
	allowed := b.fetchCapability(capability)
	
	// Cache result
	b.mu.Lock()
	b.capabilities[capability] = allowed
	b.lastCapCheck = time.Now()
	b.mu.Unlock()

	return allowed
}

// checkFreeCapability checks capability for free tier
func (b *Bridge) checkFreeCapability(capability string) bool {
	switch capability {
	case CapVideoCalls:
		return false
	case CapUnlimitedPeers:
		return false
	case CapLargeFiles:
		return false
	case CapUnlimitedHistory:
		return false
	case CapPriorityRelay:
		return false
	default:
		return true // Allow unknown capabilities by default
	}
}

// fetchCapability fetches capability status from kernel
func (b *Bridge) fetchCapability(capability string) bool {
	b.mu.RLock()
	kernelURL := b.kernelURL
	accessToken := b.accessToken
	b.mu.RUnlock()

	if accessToken == "" {
		return b.checkFreeCapability(capability)
	}

	url := fmt.Sprintf("%s/api/v1/capabilities/check?capability=%s", kernelURL, capability)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Printf("[KERNEL] Erro ao criar request: %v", err)
		return b.checkFreeCapability(capability)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := b.client.Do(req)
	if err != nil {
		log.Printf("[KERNEL] Erro ao verificar capability: %v", err)
		return b.checkFreeCapability(capability)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return b.checkFreeCapability(capability)
	}

	var check CapabilityCheck
	if err := json.NewDecoder(resp.Body).Decode(&check); err != nil {
		return b.checkFreeCapability(capability)
	}

	return check.Allowed
}

// GetLimits returns the current plan limits
func (b *Bridge) GetLimits() *PlanLimits {
	if !b.IsEnabled() || !b.IsLinked() {
		return DefaultFreeLimits()
	}

	b.mu.RLock()
	kernelURL := b.kernelURL
	accessToken := b.accessToken
	b.mu.RUnlock()

	if accessToken == "" {
		return DefaultFreeLimits()
	}

	req, err := http.NewRequest("GET", kernelURL+"/api/v1/billing/subscription", nil)
	if err != nil {
		return DefaultFreeLimits()
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := b.client.Do(req)
	if err != nil {
		return DefaultFreeLimits()
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		// No subscription = free tier
		return DefaultFreeLimits()
	}

	if resp.StatusCode != http.StatusOK {
		return DefaultFreeLimits()
	}

	var sub struct {
		PlanID string `json:"plan_id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&sub); err != nil {
		return DefaultFreeLimits()
	}

	if sub.Status != "active" {
		return DefaultFreeLimits()
	}

	// Return pro limits for any active subscription
	return DefaultProLimits()
}

// CanConnectPeer checks if a new peer connection is allowed
func (b *Bridge) CanConnectPeer(currentPeerCount int) bool {
	limits := b.GetLimits()
	if limits.MaxPeers < 0 {
		return true // Unlimited
	}
	return currentPeerCount < limits.MaxPeers
}

// CanShareFile checks if a file can be shared based on size
func (b *Bridge) CanShareFile(fileSizeBytes int64) bool {
	limits := b.GetLimits()
	if limits.MaxFileSizeMB < 0 {
		return true // Unlimited
	}
	maxBytes := int64(limits.MaxFileSizeMB) * 1024 * 1024
	return fileSizeBytes <= maxBytes
}

// CanJoinCommunity checks if user can join another community
func (b *Bridge) CanJoinCommunity(currentCommunityCount int) bool {
	limits := b.GetLimits()
	if limits.MaxCommunities < 0 {
		return true // Unlimited
	}
	return currentCommunityCount < limits.MaxCommunities
}

// CanMakeVideoCall checks if video calls are allowed
func (b *Bridge) CanMakeVideoCall() bool {
	return b.CheckCapability(CapVideoCalls)
}

// GetCheckoutURL returns a Stripe checkout URL for upgrading
func (b *Bridge) GetCheckoutURL(planID, successURL, cancelURL string) (string, error) {
	if !b.IsEnabled() {
		return "", fmt.Errorf("kernel bridge not enabled")
	}

	b.mu.RLock()
	kernelURL := b.kernelURL
	accessToken := b.accessToken
	b.mu.RUnlock()

	if accessToken == "" {
		return "", fmt.Errorf("not authenticated")
	}

	payload := map[string]string{
		"plan_id":     planID,
		"success_url": successURL,
		"cancel_url":  cancelURL,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", kernelURL+"/api/v1/billing/checkout", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Body = http.NoBody
	req, _ = http.NewRequest("POST", kernelURL+"/api/v1/billing/checkout", 
		&readCloser{data: body})
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := b.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to create checkout")
	}

	var result struct {
		CheckoutURL string `json:"checkout_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.CheckoutURL, nil
}

// readCloser wraps a byte slice to implement io.ReadCloser
type readCloser struct {
	data []byte
	pos  int
}

func (r *readCloser) Read(p []byte) (n int, err error) {
	if r.pos >= len(r.data) {
		return 0, fmt.Errorf("EOF")
	}
	n = copy(p, r.data[r.pos:])
	r.pos += n
	return n, nil
}

func (r *readCloser) Close() error {
	return nil
}
