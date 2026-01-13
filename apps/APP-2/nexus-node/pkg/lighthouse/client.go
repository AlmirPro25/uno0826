package lighthouse

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client cliente para comunicação com faróis
type Client struct {
	httpClient   *http.Client
	lighthouses  []string
	currentIndex int
	peerID       string
	region       string
}

// BootstrapResponse resposta do bootstrap
type BootstrapResponse struct {
	LighthouseID string          `json:"lighthouse_id"`
	Region       string          `json:"region"`
	Peers        []PeerInfo      `json:"peers"`
	Relays       []RelayInfo     `json:"relays"`
	Lighthouses  []LighthouseInfo `json:"lighthouses"`
}

// PeerInfo informações de um peer
type PeerInfo struct {
	PeerID       string `json:"peer_id"`
	Reputation   int    `json:"reputation"`
	RelayCapable bool   `json:"relay_capable"`
}

// RelayInfo informações de relay
type RelayInfo struct {
	URL      string `json:"url"`
	Region   string `json:"region"`
	Protocol string `json:"protocol"`
	Priority int    `json:"priority"`
}

// LighthouseInfo informações de um farol
type LighthouseInfo struct {
	ID     string `json:"id"`
	Region string `json:"region"`
	URL    string `json:"url"`
	Status string `json:"status"`
}

// AnnounceRequest request para anunciar presença
type AnnounceRequest struct {
	PeerID       string       `json:"peer_id"`
	Addrs        []string     `json:"addrs"`
	Capabilities Capabilities `json:"capabilities"`
	Region       string       `json:"region,omitempty"`
}

// Capabilities capacidades do peer
type Capabilities struct {
	BandwidthMbps int  `json:"bandwidth_mbps"`
	StorageGB     int  `json:"storage_gb"`
	UptimeHours   int  `json:"uptime_hours"`
	RelayCapable  bool `json:"relay_capable"`
	WebRTCCapable bool `json:"webrtc_capable"`
}

// NewClient cria um novo cliente de lighthouse
func NewClient(peerID, region string, lighthouses []string) *Client {
	if len(lighthouses) == 0 {
		// Faróis padrão
		lighthouses = []string{
			"https://uno0826-pr57.vercel.app",
			"https://nexus-sa.railway.app",
		}
	}

	return &Client{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		lighthouses:  lighthouses,
		currentIndex: 0,
		peerID:       peerID,
		region:       region,
	}
}

// Bootstrap obtém informações de bootstrap do farol
func (c *Client) Bootstrap(ctx context.Context) (*BootstrapResponse, error) {
	url := fmt.Sprintf("%s/api/v1/lighthouse/bootstrap?region=%s", c.currentLighthouse(), c.region)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		// Tentar próximo farol
		c.rotateToNext()
		return nil, fmt.Errorf("lighthouse unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.rotateToNext()
		return nil, fmt.Errorf("lighthouse returned %d", resp.StatusCode)
	}

	var result BootstrapResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// Atualizar lista de faróis se recebemos novos
	if len(result.Lighthouses) > 0 {
		c.updateLighthouses(result.Lighthouses)
	}

	return &result, nil
}

// Announce anuncia presença no farol
func (c *Client) Announce(ctx context.Context, addrs []string, caps Capabilities) error {
	url := fmt.Sprintf("%s/api/v1/lighthouse/announce", c.currentLighthouse())

	body := AnnounceRequest{
		PeerID:       c.peerID,
		Addrs:        addrs,
		Capabilities: caps,
		Region:       c.region,
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.rotateToNext()
		return fmt.Errorf("announce failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("announce returned %d", resp.StatusCode)
	}

	return nil
}

// Heartbeat envia heartbeat para manter presença
func (c *Client) Heartbeat(ctx context.Context) error {
	url := fmt.Sprintf("%s/api/v1/lighthouse/heartbeat", c.currentLighthouse())

	body := map[string]string{"peer_id": c.peerID}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.rotateToNext()
		return err
	}
	defer resp.Body.Close()

	return nil
}

// GetRelays obtém lista de relays
func (c *Client) GetRelays(ctx context.Context) ([]RelayInfo, error) {
	url := fmt.Sprintf("%s/api/v1/lighthouse/relays", c.currentLighthouse())

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Relays []RelayInfo `json:"relays"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Relays, nil
}

// StartHeartbeatLoop inicia loop de heartbeat
func (c *Client) StartHeartbeatLoop(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := c.Heartbeat(ctx); err != nil {
				// Log error but continue
				fmt.Printf("[LIGHTHOUSE] Heartbeat failed: %v\n", err)
			}
		}
	}
}

// currentLighthouse retorna o farol atual
func (c *Client) currentLighthouse() string {
	return c.lighthouses[c.currentIndex]
}

// rotateToNext muda para o próximo farol
func (c *Client) rotateToNext() {
	c.currentIndex = (c.currentIndex + 1) % len(c.lighthouses)
}

// updateLighthouses atualiza lista de faróis
func (c *Client) updateLighthouses(lighthouses []LighthouseInfo) {
	urls := make([]string, 0, len(lighthouses))
	for _, l := range lighthouses {
		if l.Status == "active" {
			urls = append(urls, l.URL)
		}
	}
	if len(urls) > 0 {
		c.lighthouses = urls
		c.currentIndex = 0
	}
}
