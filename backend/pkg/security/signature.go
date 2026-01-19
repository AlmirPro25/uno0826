package security

import (
	"crypto"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

// ========================================
// DIGITAL SIGNATURE ENGINE
// ========================================
// Purpose: Cryptographic signing and verification of UCP manifests
// Algorithm: Ed25519 (fast, secure, 256-bit)
// Use Case: Prevent manifest spoofing and MitM attacks
// ========================================

// SignatureEngine handles cryptographic operations
type SignatureEngine struct {
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
}

// NewSignatureEngine creates a new signature engine with generated keys
func NewSignatureEngine() (*SignatureEngine, error) {
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate keypair: %w", err)
	}

	return &SignatureEngine{
		privateKey: privateKey,
		publicKey:  publicKey,
	}, nil
}

// NewSignatureEngineFromSeed creates engine from a deterministic seed
func NewSignatureEngineFromSeed(seed []byte) (*SignatureEngine, error) {
	if len(seed) != ed25519.SeedSize {
		return nil, fmt.Errorf("invalid seed size: expected %d, got %d", ed25519.SeedSize, len(seed))
	}

	privateKey := ed25519.NewKeyFromSeed(seed)
	publicKey := privateKey.Public().(ed25519.PublicKey)

	return &SignatureEngine{
		privateKey: privateKey,
		publicKey:  publicKey,
	}, nil
}

// ========================================
// SIGNING OPERATIONS
// ========================================

// SignedPayload wraps data with cryptographic proof
type SignedPayload struct {
	Data      json.RawMessage `json:"data"`
	Signature string          `json:"signature"`
	PublicKey string          `json:"public_key"`
	Algorithm string          `json:"algorithm"`
	Timestamp int64           `json:"timestamp"`
}

// SignManifest signs any JSON-serializable data
func (s *SignatureEngine) SignManifest(data interface{}) (*SignedPayload, error) {
	// 1. Serialize data to canonical JSON
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal data: %w", err)
	}

	// 2. Create deterministic hash
	hash := sha256.Sum256(dataBytes)

	// 3. Sign the hash
	signature := ed25519.Sign(s.privateKey, hash[:])

	// 4. Encode signature and public key
	sigBase64 := base64.StdEncoding.EncodeToString(signature)
	pubKeyHex := hex.EncodeToString(s.publicKey)

	return &SignedPayload{
		Data:      dataBytes,
		Signature: sigBase64,
		PublicKey: pubKeyHex,
		Algorithm: "Ed25519-SHA256",
		Timestamp: time.Now().Unix(),
	}, nil
}

// VerifySignature verifies a signed payload
func VerifySignature(payload *SignedPayload) error {
	// 1. Decode public key
	publicKeyBytes, err := hex.DecodeString(payload.PublicKey)
	if err != nil {
		return fmt.Errorf("invalid public key encoding: %w", err)
	}

	if len(publicKeyBytes) != ed25519.PublicKeySize {
		return fmt.Errorf("invalid public key size: expected %d, got %d", ed25519.PublicKeySize, len(publicKeyBytes))
	}

	publicKey := ed25519.PublicKey(publicKeyBytes)

	// 2. Decode signature
	signature, err := base64.StdEncoding.DecodeString(payload.Signature)
	if err != nil {
		return fmt.Errorf("invalid signature encoding: %w", err)
	}

	// 3. Recompute hash of data
	hash := sha256.Sum256(payload.Data)

	// 4. Verify signature
	if !ed25519.Verify(publicKey, hash[:], signature) {
		return ErrInvalidSignature
	}

	// 5. Check timestamp freshness (prevent replay attacks)
	age := time.Now().Unix() - payload.Timestamp
	if age > 300 { // 5 minutes max age
		return fmt.Errorf("signature expired: %d seconds old (max 300)", age)
	}

	return nil
}

// ========================================
// UTILITY METHODS
// ========================================

// GetPublicKeyHex returns the public key as hex string
func (s *SignatureEngine) GetPublicKeyHex() string {
	return hex.EncodeToString(s.publicKey)
}

// GetPublicKeyBase64 returns the public key as base64 string
func (s *SignatureEngine) GetPublicKeyBase64() string {
	return base64.StdEncoding.EncodeToString(s.publicKey)
}

// HashData creates a deterministic hash of any data
func HashData(data interface{}) (string, error) {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	hash := sha256.Sum256(dataBytes)
	return hex.EncodeToString(hash[:]), nil
}

// ========================================
// FINGERPRINTING (For Trust Verification)
// ========================================

// ManifestFingerprint creates a unique ID for a manifest
type ManifestFingerprint struct {
	Hash      string `json:"hash"`
	PublicKey string `json:"public_key"`
	Domain    string `json:"domain"`
}

// CreateFingerprint generates a tamper-proof ID for a UCP manifest
func CreateFingerprint(manifestData interface{}, domain string, publicKey string) (*ManifestFingerprint, error) {
	hash, err := HashData(manifestData)
	if err != nil {
		return nil, err
	}

	return &ManifestFingerprint{
		Hash:      hash,
		PublicKey: publicKey,
		Domain:    domain,
	}, nil
}

// VerifyFingerprint checks if a manifest matches its claimed fingerprint
func VerifyFingerprint(manifestData interface{}, fingerprint *ManifestFingerprint) error {
	computedHash, err := HashData(manifestData)
	if err != nil {
		return err
	}

	if computedHash != fingerprint.Hash {
		return fmt.Errorf("fingerprint mismatch: expected %s, got %s", fingerprint.Hash, computedHash)
	}

	return nil
}

// ========================================
// ADVANCED: JWT-STYLE COMPACT SIGNATURES
// ========================================

// CompactSign creates a compact signature string (header.payload.signature)
func (s *SignatureEngine) CompactSign(data interface{}) (string, error) {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	hash := sha256.Sum256(dataBytes)
	signature := ed25519.Sign(s.privateKey, hash[:])

	// Format: base64(data).base64(signature)
	dataB64 := base64.RawURLEncoding.EncodeToString(dataBytes)
	sigB64 := base64.RawURLEncoding.EncodeToString(signature)

	return fmt.Sprintf("%s.%s", dataB64, sigB64), nil
}

// CompactVerify verifies a compact signature
func CompactVerify(compactSig string, publicKeyHex string) (json.RawMessage, error) {
	// Parse compact format
	parts := splitCompact(compactSig)
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid compact signature format")
	}

	dataBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, fmt.Errorf("invalid data encoding: %w", err)
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid signature encoding: %w", err)
	}

	publicKey, err := hex.DecodeString(publicKeyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid public key: %w", err)
	}

	hash := sha256.Sum256(dataBytes)
	if !ed25519.Verify(publicKey, hash[:], signature) {
		return nil, ErrInvalidSignature
	}

	return dataBytes, nil
}

func splitCompact(s string) []string {
	parts := make([]string, 0, 2)
	lastIdx := 0

	for i, c := range s {
		if c == '.' {
			parts = append(parts, s[lastIdx:i])
			lastIdx = i + 1
		}
	}

	if lastIdx < len(s) {
		parts = append(parts, s[lastIdx:])
	}

	return parts
}

// ========================================
// ERRORS
// ========================================

var (
	ErrInvalidSignature = fmt.Errorf("cryptographic signature verification failed")
	ErrExpiredSignature = fmt.Errorf("signature timestamp expired")
)

// ========================================
// BACKWARD COMPATIBILITY (Mock RSA)
// ========================================

// MockRSAVerifier for legacy systems
func MockRSAVerifier(payload []byte, signature string) error {
	// This is a placeholder for backward compatibility
	// In production, implement actual RSA verification if needed
	if signature == "" {
		return fmt.Errorf("missing signature")
	}
	return nil
}

// ========================================
// HASH UTILITIES
// ========================================

// QuickHash creates a fast hash for non-cryptographic purposes
func QuickHash(data string) string {
	h := crypto.SHA256.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))[:16]
}
