// +build ignore

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	lighthouseURL = "https://uno0826-pr57.vercel.app"
	// Para teste local: "http://localhost:8080"
)

func main() {
	fmt.Println("=== TESTE DE MENSAGENS P2P ===")
	fmt.Println()

	// 1. Testar Bootstrap do Lighthouse
	fmt.Println("1. Testando Bootstrap do Lighthouse...")
	bootstrap, err := testBootstrap()
	if err != nil {
		fmt.Printf("   ❌ Erro: %v\n", err)
	} else {
		fmt.Printf("   ✅ Lighthouse: %s\n", bootstrap.LighthouseID)
		fmt.Printf("   ✅ Região: %s\n", bootstrap.Region)
		fmt.Printf("   ✅ Peers online: %d\n", len(bootstrap.Peers))
		fmt.Printf("   ✅ Relays disponíveis: %d\n", len(bootstrap.Relays))
	}
	fmt.Println()

	// 2. Testar Announce
	fmt.Println("2. Testando Announce de Peer...")
	peerID := fmt.Sprintf("12D3KooWTest%d", time.Now().UnixNano()%1000000)
	err = testAnnounce(peerID)
	if err != nil {
		fmt.Printf("   ❌ Erro: %v\n", err)
	} else {
		fmt.Printf("   ✅ Peer anunciado: %s\n", peerID[:20])
	}
	fmt.Println()

	// 3. Testar Heartbeat
	fmt.Println("3. Testando Heartbeat...")
	err = testHeartbeat(peerID)
	if err != nil {
		fmt.Printf("   ❌ Erro: %v\n", err)
	} else {
		fmt.Printf("   ✅ Heartbeat enviado\n")
	}
	fmt.Println()

	// 4. Listar Peers
	fmt.Println("4. Listando Peers Online...")
	peers, err := testListPeers()
	if err != nil {
		fmt.Printf("   ❌ Erro: %v\n", err)
	} else {
		fmt.Printf("   ✅ Peers encontrados: %d\n", len(peers))
		for i, p := range peers {
			if i >= 5 {
				fmt.Printf("   ... e mais %d peers\n", len(peers)-5)
				break
			}
			fmt.Printf("   - %s (rep: %d)\n", p.PeerID[:20], p.Reputation)
		}
	}
	fmt.Println()

	// 5. Testar Status
	fmt.Println("5. Status do Lighthouse...")
	status, err := testStatus()
	if err != nil {
		fmt.Printf("   ❌ Erro: %v\n", err)
	} else {
		fmt.Printf("   ✅ Status: %v\n", status["status"])
		fmt.Printf("   ✅ Peers em cache: %v\n", status["peers_cached"])
	}
	fmt.Println()

	fmt.Println("=== TESTE CONCLUÍDO ===")
}

type BootstrapResponse struct {
	LighthouseID string       `json:"lighthouse_id"`
	Region       string       `json:"region"`
	Peers        []PeerInfo   `json:"peers"`
	Relays       []RelayInfo  `json:"relays"`
}

type PeerInfo struct {
	PeerID      string `json:"peer_id"`
	Reputation  int    `json:"reputation"`
	RelayCapable bool  `json:"relay_capable"`
}

type RelayInfo struct {
	URL      string `json:"url"`
	Region   string `json:"region"`
	Protocol string `json:"protocol"`
}

func testBootstrap() (*BootstrapResponse, error) {
	resp, err := http.Get(lighthouseURL + "/api/v1/lighthouse/bootstrap?region=sa-east")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}

	var result BootstrapResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func testAnnounce(peerID string) error {
	body := map[string]interface{}{
		"peer_id": peerID,
		"addrs":   []string{"/ip4/127.0.0.1/tcp/4001"},
		"capabilities": map[string]interface{}{
			"bandwidth_mbps": 100,
			"storage_gb":     50,
			"uptime_hours":   24,
			"relay_capable":  true,
			"webrtc_capable": true,
		},
		"region": "sa-east",
	}

	jsonBody, _ := json.Marshal(body)
	resp, err := http.Post(
		lighthouseURL+"/api/v1/lighthouse/announce",
		"application/json",
		bytes.NewReader(jsonBody),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func testHeartbeat(peerID string) error {
	body := map[string]string{"peer_id": peerID}
	jsonBody, _ := json.Marshal(body)

	resp, err := http.Post(
		lighthouseURL+"/api/v1/lighthouse/heartbeat",
		"application/json",
		bytes.NewReader(jsonBody),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func testListPeers() ([]PeerInfo, error) {
	resp, err := http.Get(lighthouseURL + "/api/v1/lighthouse/peers")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Peers []PeerInfo `json:"peers"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Peers, nil
}

func testStatus() (map[string]interface{}, error) {
	resp, err := http.Get(lighthouseURL + "/api/v1/lighthouse/status")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}
