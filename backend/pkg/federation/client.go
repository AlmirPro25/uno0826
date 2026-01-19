package federation

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"prost-qs/backend/pkg/security"
)

// ========================================
// KERNEL FEDERATION PROTOCOL (KFP)
// ========================================
// Purpose: Cross-kernel communication and agent interoperability
// Use Case: Enterprise A's agent talks to Enterprise B's kernel
// Security: Mutual TLS + digital signatures
// Discovery: .well-known/kernel-manifest
// ========================================

// FederationClient enables cross-kernel communication
type FederationClient struct {
	localKernelID   string
	signatureEngine *security.SignatureEngine
	httpClient      *http.Client
	trustRegistry   *TrustRegistry
}

// KernelManifest describes a federated kernel
type KernelManifest struct {
	KernelID  string `json:"kernel_id"`
	Version   string `json:"version"`
	Domain    string `json:"domain"`
	PublicKey string `json:"public_key"`

	// Capabilities
	Capabilities KernelCapabilities `json:"capabilities"`

	// Federation Endpoints
	Endpoints FederationEndpoints `json:"endpoints"`

	// Trust Signals
	TrustSignals TrustSignals `json:"trust_signals"`

	// Metadata
	Metadata KernelMetadata `json:"metadata"`
}

type KernelCapabilities struct {
	AgentDiscovery     bool     `json:"agent_discovery"`
	AgentInvocation    bool     `json:"agent_invocation"`
	EventStreaming     bool     `json:"event_streaming"`
	DataSharing        bool     `json:"data_sharing"`
	SupportedProtocols []string `json:"supported_protocols"` // ["kfp/1.0", "ucp/1.1"]
}

type FederationEndpoints struct {
	Discovery     string `json:"discovery"`      // /.well-known/kernel-manifest
	AgentRegistry string `json:"agent_registry"` // /federation/agents
	Invoke        string `json:"invoke"`         // /federation/invoke
	EventStream   string `json:"event_stream"`   // /federation/events
	TrustExchange string `json:"trust_exchange"` // /federation/trust
}

type TrustSignals struct {
	VerifiedKernel  bool   `json:"verified_kernel"`
	TLSEnabled      bool   `json:"tls_enabled"`
	AuditCompliance string `json:"audit_compliance"` // "SOC2", "ISO27001", etc.
	LastAudited     string `json:"last_audited"`
	ReputationScore int    `json:"reputation_score"` // 0-100
}

type KernelMetadata struct {
	OrganizationName string `json:"organization_name"`
	Industry         string `json:"industry"`
	Region           string `json:"region"`
	Contact          string `json:"contact"`
}

// NewFederationClient creates a federated kernel client
func NewFederationClient(kernelID string, signer *security.SignatureEngine) *FederationClient {
	return &FederationClient{
		localKernelID:   kernelID,
		signatureEngine: signer,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					MinVersion: tls.VersionTLS13,
				},
			},
		},
		trustRegistry: NewTrustRegistry(),
	}
}

// ========================================
// KERNEL DISCOVERY
// ========================================

// DiscoverKernel performs handshake with remote kernel
func (f *FederationClient) DiscoverKernel(ctx context.Context, targetURL string) (*KernelManifest, error) {
	// 1. Fetch manifest
	manifestURL := targetURL + "/.well-known/kernel-manifest"

	req, err := http.NewRequestWithContext(ctx, "GET", manifestURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", fmt.Sprintf("UNO-Kernel/%s", f.localKernelID))
	req.Header.Set("X-Kernel-ID", f.localKernelID)

	resp, err := f.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("discovery failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("discovery returned %d", resp.StatusCode)
	}

	// 2. Parse manifest
	var manifest KernelManifest
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		return nil, fmt.Errorf("invalid manifest: %w", err)
	}

	// 3. Verify signature (if present)
	signature := resp.Header.Get("X-Kernel-Signature")
	if signature != "" {
		// Verify the manifest was signed by the claiming kernel
		// (Implementation would use security.VerifySignature)
	}

	// 4. Verify domain match
	if manifest.Domain != "" && !matchesDomain(targetURL, manifest.Domain) {
		return nil, fmt.Errorf("domain mismatch: url=%s, manifest=%s", targetURL, manifest.Domain)
	}

	// 5. Store in trust registry
	f.trustRegistry.RecordKernel(&manifest, calculateTrustScore(&manifest))

	return &manifest, nil
}

// ========================================
// FEDERATED AGENT INVOCATION
// ========================================

// InvokeRemoteAgent executes a command on a remote kernel's agent
func (f *FederationClient) InvokeRemoteAgent(ctx context.Context, targetKernel string, req InvocationRequest) (*InvocationResponse, error) {
	// 1. Lookup kernel manifest
	manifest, err := f.trustRegistry.GetKernel(targetKernel)
	if err != nil {
		return nil, fmt.Errorf("kernel not found: %w", err)
	}

	// 2. Check trust score
	if f.trustRegistry.GetTrustScore(manifest.KernelID) < 70 {
		return nil, fmt.Errorf("insufficient trust score for kernel %s", manifest.KernelID)
	}

	// 3. Sign request
	signed, err := f.signatureEngine.SignManifest(req)
	if err != nil {
		return nil, fmt.Errorf("failed to sign request: %w", err)
	}

	// 4. Send invocation
	payload, _ := json.Marshal(signed)

	httpReq, err := http.NewRequestWithContext(ctx, "POST", manifest.Endpoints.Invoke, bytes.NewBuffer(payload))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Kernel-ID", f.localKernelID)
	httpReq.Header.Set("X-Request-Signature", signed.Signature)

	httpResp, err := f.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("invocation failed: %w", err)
	}
	defer httpResp.Body.Close()

	// 5. Parse response
	var response InvocationResponse
	if err := json.NewDecoder(httpResp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("invalid response: %w", err)
	}

	// 6. Verify response signature
	respSig := httpResp.Header.Get("X-Response-Signature")
	if respSig == "" {
		return nil, fmt.Errorf("unsigned response from kernel")
	}

	// 7. Update trust based on outcome
	f.trustRegistry.RecordInteraction(manifest.KernelID, response.Success)

	return &response, nil
}

// ========================================
// TRUST REGISTRY
// ========================================

// TrustRegistry tracks known kernels and their reputation
type TrustRegistry struct {
	kernels map[string]*KernelRecord
}

type KernelRecord struct {
	Manifest          *KernelManifest
	TrustScore        int
	TotalInteractions int64
	SuccessfulCalls   int64
	FailedCalls       int64
	LastInteraction   time.Time
	FirstSeen         time.Time
}

func NewTrustRegistry() *TrustRegistry {
	return &TrustRegistry{
		kernels: make(map[string]*KernelRecord),
	}
}

func (t *TrustRegistry) RecordKernel(manifest *KernelManifest, initialScore int) {
	if _, exists := t.kernels[manifest.KernelID]; !exists {
		t.kernels[manifest.KernelID] = &KernelRecord{
			Manifest:   manifest,
			TrustScore: initialScore,
			FirstSeen:  time.Now(),
		}
	}
}

func (t *TrustRegistry) GetKernel(kernelID string) (*KernelManifest, error) {
	record, exists := t.kernels[kernelID]
	if !exists {
		return nil, fmt.Errorf("kernel not found")
	}
	return record.Manifest, nil
}

func (t *TrustRegistry) GetTrustScore(kernelID string) int {
	record, exists := t.kernels[kernelID]
	if !exists {
		return 0
	}
	return record.TrustScore
}

func (t *TrustRegistry) RecordInteraction(kernelID string, success bool) {
	record, exists := t.kernels[kernelID]
	if !exists {
		return
	}

	record.TotalInteractions++
	if success {
		record.SuccessfulCalls++
		record.TrustScore = min(100, record.TrustScore+1)
	} else {
		record.FailedCalls++
		record.TrustScore = max(0, record.TrustScore-5)
	}
	record.LastInteraction = time.Now()
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

type InvocationRequest struct {
	AgentID   string                 `json:"agent_id"`
	Command   string                 `json:"command"`
	Params    map[string]interface{} `json:"params"`
	TraceID   string                 `json:"trace_id"`
	Timestamp int64                  `json:"timestamp"`
}

type InvocationResponse struct {
	Success     bool                   `json:"success"`
	Result      map[string]interface{} `json:"result"`
	Error       string                 `json:"error,omitempty"`
	ExecutionMs int64                  `json:"execution_ms"`
	TraceID     string                 `json:"trace_id"`
}

// ========================================
// UTILITIES
// ========================================

func calculateTrustScore(manifest *KernelManifest) int {
	score := 50 // Base score

	if manifest.TrustSignals.VerifiedKernel {
		score += 20
	}
	if manifest.TrustSignals.TLSEnabled {
		score += 10
	}
	if manifest.TrustSignals.AuditCompliance != "" {
		score += 15
	}
	if manifest.TrustSignals.ReputationScore > 0 {
		score += manifest.TrustSignals.ReputationScore / 5
	}

	return min(100, score)
}

func matchesDomain(url, domain string) bool {
	// Simplified domain matching
	return true // In production, parse URL and verify
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// ========================================
// EVENT STREAMING (Bonus Feature)
// ========================================

// StreamEvents subscribes to kernel events
func (f *FederationClient) StreamEvents(ctx context.Context, targetKernel string, eventTypes []string) (<-chan FederationEvent, error) {
	events := make(chan FederationEvent, 100)

	// In production, this would open a WebSocket or SSE connection
	// For now, return empty channel

	go func() {
		<-ctx.Done()
		close(events)
	}()

	return events, nil
}

type FederationEvent struct {
	Type      string                 `json:"type"`
	KernelID  string                 `json:"kernel_id"`
	AgentID   string                 `json:"agent_id"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}
