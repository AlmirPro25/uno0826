package kernel

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/libp2p/go-libp2p/core/crypto"
)

// AuthResponse represents the kernel authentication response
type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	} `json:"user"`
}

// LoginWithEmail authenticates with the kernel using email/password
func (b *Bridge) LoginWithEmail(email, password string) (*AuthResponse, error) {
	if !b.IsEnabled() {
		return nil, fmt.Errorf("kernel bridge not enabled")
	}

	b.mu.RLock()
	kernelURL := b.kernelURL
	b.mu.RUnlock()

	payload := map[string]string{
		"email":    email,
		"password": password,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", kernelURL+"/api/v1/auth/login", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := b.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("login failed: %s", string(bodyBytes))
	}

	var authResp AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return nil, err
	}

	// Store tokens
	b.mu.Lock()
	b.accessToken = authResp.AccessToken
	b.refreshToken = authResp.RefreshToken
	b.linkedUserID = authResp.User.ID
	b.mu.Unlock()

	log.Printf("[KERNEL] Login bem-sucedido - User: %s", authResp.User.Email)
	return &authResp, nil
}

// LinkIdentity links the P2P identity to the kernel user
func (b *Bridge) LinkIdentity(privKey crypto.PrivKey) error {
	if !b.IsEnabled() {
		return fmt.Errorf("kernel bridge not enabled")
	}

	b.mu.RLock()
	if b.accessToken == "" {
		b.mu.RUnlock()
		return fmt.Errorf("not authenticated - login first")
	}
	kernelURL := b.kernelURL
	accessToken := b.accessToken
	localPeerID := b.localPeerID
	b.mu.RUnlock()

	// Get public key bytes
	pubKey := privKey.GetPublic()
	pubKeyBytes, err := crypto.MarshalPublicKey(pubKey)
	if err != nil {
		return fmt.Errorf("failed to marshal public key: %w", err)
	}

	// Sign the peer ID to prove ownership
	signature, err := privKey.Sign([]byte(localPeerID))
	if err != nil {
		return fmt.Errorf("failed to sign peer ID: %w", err)
	}

	payload := LinkRequest{
		PeerID:    localPeerID,
		PublicKey: base64.StdEncoding.EncodeToString(pubKeyBytes),
		Signature: base64.StdEncoding.EncodeToString(signature),
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", kernelURL+"/api/v1/identity/link-p2p", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := b.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("link failed: %s", string(bodyBytes))
	}

	var linkResp LinkResponse
	if err := json.NewDecoder(resp.Body).Decode(&linkResp); err != nil {
		return err
	}

	if !linkResp.Success {
		return fmt.Errorf("link failed: %s", linkResp.Message)
	}

	log.Printf("[KERNEL] Identidade P2P vinculada ao usuário %s", linkResp.UserID)
	return nil
}

// Logout clears the authentication state
func (b *Bridge) Logout() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.accessToken = ""
	b.refreshToken = ""
	b.linkedUserID = ""
	log.Println("[KERNEL] Logout realizado")
}

// IsLinked returns whether the P2P identity is linked to a kernel user
func (b *Bridge) IsLinked() bool {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.linkedUserID != ""
}

// GetLinkedUser returns the linked kernel user ID
func (b *Bridge) GetLinkedUser() string {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.linkedUserID
}

// RefreshTokens refreshes the access token using the refresh token
func (b *Bridge) RefreshTokens() error {
	b.mu.RLock()
	if b.refreshToken == "" {
		b.mu.RUnlock()
		return fmt.Errorf("no refresh token available")
	}
	kernelURL := b.kernelURL
	refreshToken := b.refreshToken
	b.mu.RUnlock()

	payload := map[string]string{
		"refresh_token": refreshToken,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", kernelURL+"/api/v1/auth/refresh", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := b.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Refresh failed, clear tokens
		b.Logout()
		return fmt.Errorf("refresh failed")
	}

	var authResp AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return err
	}

	b.mu.Lock()
	b.accessToken = authResp.AccessToken
	b.refreshToken = authResp.RefreshToken
	b.mu.Unlock()

	return nil
}

// GetProfile fetches the current user profile from the kernel
func (b *Bridge) GetProfile() (map[string]interface{}, error) {
	if !b.IsEnabled() {
		return nil, fmt.Errorf("kernel bridge not enabled")
	}

	b.mu.RLock()
	if b.accessToken == "" {
		b.mu.RUnlock()
		return nil, fmt.Errorf("not authenticated")
	}
	kernelURL := b.kernelURL
	accessToken := b.accessToken
	b.mu.RUnlock()

	req, err := http.NewRequest("GET", kernelURL+"/api/v1/identity/me", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := b.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		// Try to refresh token
		if err := b.RefreshTokens(); err != nil {
			return nil, fmt.Errorf("session expired")
		}
		return b.GetProfile() // Retry
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get profile")
	}

	var profile map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return nil, err
	}

	return profile, nil
}
