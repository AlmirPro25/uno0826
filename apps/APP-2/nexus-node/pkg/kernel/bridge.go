// Package kernel provides integration with the Prost-QS governance kernel.
// This integration is OPTIONAL and opt-in - Nexus remains fully functional without it.
package kernel

import (
	"log"
	"net/http"
	"sync"
	"time"
)

// Bridge connects the Nexus P2P node to the Prost-QS kernel.
// All operations are non-blocking and fail gracefully.
type Bridge struct {
	mu            sync.RWMutex
	enabled       bool
	kernelURL     string
	appKey        string
	appSecret     string
	accessToken   string
	refreshToken  string
	localPeerID   string
	linkedUserID  string
	client        *http.Client
	eventQueue    chan *TelemetryEvent
	capabilities  map[string]bool
	lastCapCheck  time.Time
}

// Config holds kernel bridge configuration
type Config struct {
	Enabled   bool
	KernelURL string
	AppKey    string
	AppSecret string
}

// TelemetryEvent represents an event to send to the kernel
type TelemetryEvent struct {
	Type       string                 `json:"type"`
	UserID     string                 `json:"user_id,omitempty"`
	SessionID  string                 `json:"session_id,omitempty"`
	TargetID   string                 `json:"target_id,omitempty"`
	TargetType string                 `json:"target_type,omitempty"`
	Feature    string                 `json:"feature,omitempty"`
	Context    map[string]interface{} `json:"context,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	Timestamp  string                 `json:"timestamp"`
}

// LinkRequest represents a request to link P2P identity to kernel
type LinkRequest struct {
	PeerID    string `json:"peer_id"`
	PublicKey string `json:"public_key"`
	Signature string `json:"signature"`
}

// LinkResponse represents the kernel's response to a link request
type LinkResponse struct {
	Success  bool   `json:"success"`
	UserID   string `json:"user_id,omitempty"`
	Message  string `json:"message,omitempty"`
}

// CapabilityCheck represents a capability check result
type CapabilityCheck struct {
	Capability string `json:"capability"`
	Allowed    bool   `json:"allowed"`
	Reason     string `json:"reason,omitempty"`
	Limit      int    `json:"limit,omitempty"`
}

// NewBridge creates a new kernel bridge instance
func NewBridge(cfg *Config, localPeerID string) *Bridge {
	b := &Bridge{
		enabled:      cfg.Enabled,
		kernelURL:    cfg.KernelURL,
		appKey:       cfg.AppKey,
		appSecret:    cfg.AppSecret,
		localPeerID:  localPeerID,
		client: &http.Client{
			Timeout: 30 * time.Second, // Increased for cold start
		},
		eventQueue:   make(chan *TelemetryEvent, 1000),
		capabilities: make(map[string]bool),
	}

	if b.enabled {
		go b.processEventQueue()
		log.Printf("[KERNEL] Bridge inicializada - URL: %s", cfg.KernelURL)
	}

	return b
}

// IsEnabled returns whether the kernel bridge is enabled
func (b *Bridge) IsEnabled() bool {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.enabled
}

// Enable enables the kernel bridge
func (b *Bridge) Enable(kernelURL, appKey, appSecret string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.enabled = true
	b.kernelURL = kernelURL
	b.appKey = appKey
	b.appSecret = appSecret
	log.Printf("[KERNEL] Bridge habilitada - URL: %s", kernelURL)
}

// Disable disables the kernel bridge
func (b *Bridge) Disable() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.enabled = false
	b.accessToken = ""
	b.refreshToken = ""
	b.linkedUserID = ""
	log.Println("[KERNEL] Bridge desabilitada")
}

// GetStatus returns the current bridge status
func (b *Bridge) GetStatus() map[string]interface{} {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return map[string]interface{}{
		"enabled":       b.enabled,
		"kernel_url":    b.kernelURL,
		"linked":        b.linkedUserID != "",
		"linked_user":   b.linkedUserID,
		"local_peer_id": b.localPeerID,
		"queue_size":    len(b.eventQueue),
	}
}
