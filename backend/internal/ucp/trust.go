package ucp

import (
	"crypto/rsa"
	"errors"
	"fmt"
	"net/url"
	"strings"
)

// ==========================================
// UCP TRUST ENGINE
// ==========================================
// Implements the security verification layers:
// 1. Profile Verification (Domain Match)
// 2. Transport Security (HTTPS Strict)
// 3. Signature Validation (Mocking JWS/JWK for now)
// 4. Trust Scoring
// ==========================================

// TrustEngine handles verification of remote UCP partners
type TrustEngine struct {
	// History of interactions for reputation scoring (Simple Map for v1)
	reputationStore map[string]int
}

func NewTrustEngine() *TrustEngine {
	return &TrustEngine{
		reputationStore: make(map[string]int),
	}
}

// VerificationResult contains the detailed security audit of a connection
type VerificationResult struct {
	IsTrusted       bool
	TrustScore      int // 0 to 100
	DomainVerified  bool
	SecureTransport bool
	SignatureValid  bool
	Issues          []string
}

// VerifyEndpoint performs a deep security check on a target UCP endpoint and its manifest
func (t *TrustEngine) VerifyEndpoint(targetURL string, manifest *DiscoveryManifest) (*VerificationResult, error) {
	result := &VerificationResult{
		Issues: []string{},
	}

	// 1. Transport Security Check (Must be HTTPS)
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return nil, fmt.Errorf("malformed url: %v", err)
	}

	if parsedURL.Scheme == "https" {
		result.SecureTransport = true
	} else if parsedURL.Scheme == "http" && (parsedURL.Hostname() == "localhost" || parsedURL.Hostname() == "127.0.0.1") {
		// Exception for local dev
		result.SecureTransport = true
		result.Issues = append(result.Issues, "⚠️ Allowing HTTP for localhost")
	} else {
		result.SecureTransport = false
		result.Issues = append(result.Issues, "❌ Insecure Transport (HTTP)")
	}

	// 2. Profile Verification (Domain Match)
	// The manifest.merchant.domain MUST match the URL host
	if manifest.Merchant.Domain == "" {
		result.Issues = append(result.Issues, "❌ Manifest missing info.merchant.domain")
	} else if strings.EqualFold(parsedURL.Host, manifest.Merchant.Domain) {
		result.DomainVerified = true
	} else if parsedURL.Hostname() == "localhost" {
		// Loose check for demo
		result.DomainVerified = true
		result.Issues = append(result.Issues, "⚠️ Loosened domain check for localhost")
	} else {
		result.Issues = append(result.Issues, fmt.Sprintf("❌ Domain Mismatch: URL(%s) != Manifest(%s)", parsedURL.Host, manifest.Merchant.Domain))
	}

	// 3. Trust Signals Analysis (Heuristics)
	score := 0

	// Start with baseline if basic checks pass
	if result.SecureTransport && result.DomainVerified {
		score += 50
	}

	// Analyze declared signals
	if manifest.TrustSignals.VerifiedMerchant {
		score += 20
	}
	if manifest.TrustSignals.SSLCertificate {
		score += 10
	}
	if manifest.TrustSignals.RefundPolicy != "" {
		score += 5
	}

	// Check Reputation Store (Historical)
	if rep, exists := t.reputationStore[manifest.Merchant.ID]; exists {
		score += rep
	}

	// Cap Score
	if score > 100 {
		score = 100
	}
	result.TrustScore = score

	// Final Decision Threshold
	result.IsTrusted = score >= 70
	if !result.IsTrusted {
		result.Issues = append(result.Issues, fmt.Sprintf("⚠️ Low Trust Score: %d/100", score))
	}

	return result, nil
}

// VerifySignature simulates checking an AP2 Mandate cryptographic signature via Public Key
// In a real implementation, this would use go-jose to verify JWS against provided JWK.
func (t *TrustEngine) VerifySignature(payload []byte, signature string, publicKey *rsa.PublicKey) error {
	if signature == "" {
		return errors.New("missing signature")
	}

	// MOCK IMPLEMENTATION for demonstration
	// In reality: jws.Parse(signature).Verify(publicKey)

	if signature == "INVALID_SIG" {
		return errors.New("crypto: invalid signature")
	}

	// Assume success for demo if signature is present and not explicitly invalid
	return nil
}

// RecordInteraction updates the local reputation based on transaction outcome
func (t *TrustEngine) RecordInteraction(merchantID string, success bool) {
	if success {
		t.reputationStore[merchantID] += 1
	} else {
		t.reputationStore[merchantID] -= 5 // Penalize failures heavily
	}
}
