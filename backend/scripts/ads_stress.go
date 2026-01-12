// +build ignore

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
)

/*
================================================================================
AD GATEWAY STRESS TEST
================================================================================

Este script simula 3 cenários de estresse no Ad Edge Gateway:

CENÁRIO A: Fluxo Feliz
- 100 pedidos legítimos de apps diferentes
- Deve ter fill rate alto e zero fraude

CENÁRIO B: Ataque de Fraude (Replay Attack)
- 10 pedidos com o MESMO request_id
- Deve disparar AssertAdImpressionNotDuplicated

CENÁRIO C: Omissão de Dados
- Pedidos sem User-Agent ou IP
- Deve subir o Fraud Score e bloquear

Uso:
  go run scripts/ads_stress_test.go [baseURL]

Exemplo:
  go run scripts/ads_stress_test.go http://localhost:8080

================================================================================
*/

const (
	defaultBaseURL = "http://localhost:8080"
)

type AdDecisionRequest struct {
	Slot       string            `json:"slot"`
	AppID      string            `json:"app_id"`
	UserID     string            `json:"user_id,omitempty"`
	DeviceID   string            `json:"device_id,omitempty"`
	Plan       string            `json:"plan,omitempty"`
	Country    string            `json:"country,omitempty"`
	Language   string            `json:"language,omitempty"`
	DeviceType string            `json:"device_type,omitempty"`
	Metadata   map[string]string `json:"metadata,omitempty"`
}

type AdResponse struct {
	RequestID    string `json:"request_id"`
	AdID         string `json:"ad_id,omitempty"`
	NoFill       bool   `json:"no_fill"`
	Reason       string `json:"reason,omitempty"`
	Latency      int64  `json:"latency_ms"`
}

type StressTestResult struct {
	Scenario       string
	TotalRequests  int
	Successful     int
	Fills          int
	NoFills        int
	Blocked        int
	Errors         int
	AvgLatencyMs   float64
	TotalTimeMs    int64
}

func main() {
	baseURL := defaultBaseURL
	if len(os.Args) > 1 {
		baseURL = os.Args[1]
	}

	fmt.Println("================================================================================")
	fmt.Println("AD GATEWAY STRESS TEST")
	fmt.Println("================================================================================")
	fmt.Printf("Target: %s\n", baseURL)
	fmt.Println()

	// Cenário A: Fluxo Feliz
	fmt.Println("🟢 CENÁRIO A: Fluxo Feliz (100 pedidos legítimos)")
	fmt.Println("--------------------------------------------------------------------------------")
	resultA := runScenarioA(baseURL)
	printResult(resultA)

	time.Sleep(2 * time.Second)

	// Cenário B: Ataque de Fraude
	fmt.Println("\n🔴 CENÁRIO B: Ataque de Fraude (10 pedidos com mesmo request_id)")
	fmt.Println("--------------------------------------------------------------------------------")
	resultB := runScenarioB(baseURL)
	printResult(resultB)

	time.Sleep(2 * time.Second)

	// Cenário C: Omissão de Dados
	fmt.Println("\n🟡 CENÁRIO C: Omissão de Dados (pedidos sem User-Agent/IP)")
	fmt.Println("--------------------------------------------------------------------------------")
	resultC := runScenarioC(baseURL)
	printResult(resultC)

	// Resumo Final
	fmt.Println("\n================================================================================")
	fmt.Println("RESUMO FINAL")
	fmt.Println("================================================================================")
	fmt.Printf("Cenário A (Feliz):    %d/%d fills (%.1f%% fill rate)\n", 
		resultA.Fills, resultA.TotalRequests, float64(resultA.Fills)/float64(resultA.TotalRequests)*100)
	fmt.Printf("Cenário B (Fraude):   %d/%d bloqueados (esperado: todos após o primeiro)\n", 
		resultB.Blocked, resultB.TotalRequests)
	fmt.Printf("Cenário C (Omissão):  %d/%d bloqueados por fraud score alto\n", 
		resultC.Blocked, resultC.TotalRequests)
	
	// Verificar invariants
	fmt.Println("\n🔍 Verificando Invariants...")
	checkInvariants(baseURL)
}

// runScenarioA: Fluxo Feliz - 100 pedidos legítimos
func runScenarioA(baseURL string) StressTestResult {
	result := StressTestResult{
		Scenario:      "A - Fluxo Feliz",
		TotalRequests: 100,
	}

	start := time.Now()
	var wg sync.WaitGroup
	var mu sync.Mutex
	var totalLatency int64

	// Gerar 10 app_ids diferentes
	appIDs := make([]string, 10)
	for i := 0; i < 10; i++ {
		appIDs[i] = uuid.New().String()
	}

	slots := []string{"homepage.hero", "sidebar.banner", "footer.native", "article.inline"}
	countries := []string{"BR", "US", "PT", "ES", "MX"}
	plans := []string{"free", "starter", "pro"}

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			req := AdDecisionRequest{
				Slot:       slots[idx%len(slots)],
				AppID:      appIDs[idx%len(appIDs)],
				UserID:     uuid.New().String(),
				DeviceID:   fmt.Sprintf("device_%d", idx),
				Plan:       plans[idx%len(plans)],
				Country:    countries[idx%len(countries)],
				Language:   "pt",
				DeviceType: "desktop",
			}

			resp, latency, err := sendAdRequest(baseURL, req, map[string]string{
				"User-Agent": "Mozilla/5.0 StressTest",
				"X-Forwarded-For": fmt.Sprintf("192.168.1.%d", idx%255),
			})

			mu.Lock()
			defer mu.Unlock()

			totalLatency += latency

			if err != nil {
				result.Errors++
				return
			}

			result.Successful++
			if resp.NoFill {
				result.NoFills++
			} else {
				result.Fills++
			}
		}(i)
	}

	wg.Wait()
	result.TotalTimeMs = time.Since(start).Milliseconds()
	result.AvgLatencyMs = float64(totalLatency) / float64(result.Successful)

	return result
}

// runScenarioB: Ataque de Fraude - mesmo request_id
func runScenarioB(baseURL string) StressTestResult {
	result := StressTestResult{
		Scenario:      "B - Ataque de Fraude",
		TotalRequests: 10,
	}

	start := time.Now()
	var totalLatency int64

	// Usar o MESMO request_id para todos (simulando replay attack)
	fixedRequestID := uuid.New().String()
	appID := uuid.New().String()

	for i := 0; i < 10; i++ {
		req := AdDecisionRequest{
			Slot:       "homepage.hero",
			AppID:      appID,
			UserID:     uuid.New().String(),
			DeviceID:   fmt.Sprintf("device_%d", i),
			Plan:       "free",
			Country:    "BR",
			Language:   "pt",
			DeviceType: "desktop",
		}

		resp, latency, err := sendAdRequest(baseURL, req, map[string]string{
			"User-Agent":    "Mozilla/5.0 FraudBot",
			"X-Forwarded-For": "10.0.0.1",
			"X-Request-ID":  fixedRequestID, // MESMO ID PARA TODOS
		})

		totalLatency += latency

		if err != nil {
			result.Errors++
			continue
		}

		result.Successful++
		if resp.NoFill {
			if resp.Reason == "fraud_detected" || resp.Reason == "rate_limited" {
				result.Blocked++
			} else {
				result.NoFills++
			}
		} else {
			result.Fills++
		}

		// Pequeno delay para simular ataque real
		time.Sleep(50 * time.Millisecond)
	}

	result.TotalTimeMs = time.Since(start).Milliseconds()
	if result.Successful > 0 {
		result.AvgLatencyMs = float64(totalLatency) / float64(result.Successful)
	}

	return result
}

// runScenarioC: Omissão de Dados - sem User-Agent/IP
func runScenarioC(baseURL string) StressTestResult {
	result := StressTestResult{
		Scenario:      "C - Omissão de Dados",
		TotalRequests: 20,
	}

	start := time.Now()
	var totalLatency int64

	appID := uuid.New().String()

	for i := 0; i < 20; i++ {
		req := AdDecisionRequest{
			Slot:   "homepage.hero",
			AppID:  appID,
			// SEM UserID
			// SEM DeviceID
			Plan:    "free",
			Country: "BR",
		}

		headers := map[string]string{}
		
		// Metade sem User-Agent, metade sem IP
		if i%2 == 0 {
			// Sem User-Agent
			headers["X-Forwarded-For"] = fmt.Sprintf("192.168.1.%d", i)
		} else {
			// Sem IP (User-Agent presente)
			headers["User-Agent"] = "Mozilla/5.0"
		}

		resp, latency, err := sendAdRequest(baseURL, req, headers)

		totalLatency += latency

		if err != nil {
			result.Errors++
			continue
		}

		result.Successful++
		if resp.NoFill {
			if resp.Reason == "fraud_detected" {
				result.Blocked++
			} else {
				result.NoFills++
			}
		} else {
			result.Fills++
		}
	}

	result.TotalTimeMs = time.Since(start).Milliseconds()
	if result.Successful > 0 {
		result.AvgLatencyMs = float64(totalLatency) / float64(result.Successful)
	}

	return result
}

func sendAdRequest(baseURL string, req AdDecisionRequest, headers map[string]string) (*AdResponse, int64, error) {
	body, _ := json.Marshal(req)
	
	httpReq, err := http.NewRequest("POST", baseURL+"/api/v1/ads/decide", bytes.NewBuffer(body))
	if err != nil {
		return nil, 0, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		httpReq.Header.Set(k, v)
	}

	start := time.Now()
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return nil, latency, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	
	var adResp AdResponse
	json.Unmarshal(respBody, &adResp)

	return &adResp, latency, nil
}

func checkInvariants(baseURL string) {
	resp, err := http.Get(baseURL + "/api/v1/admin/invariants/violations?category=ads")
	if err != nil {
		fmt.Printf("❌ Erro ao verificar invariants: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	
	var result struct {
		Violations []struct {
			Invariant string `json:"invariant"`
			Message   string `json:"message"`
			Severity  string `json:"severity"`
		} `json:"violations"`
		Count int `json:"count"`
	}
	json.Unmarshal(body, &result)

	if result.Count == 0 {
		fmt.Println("✅ Nenhuma violação de invariant detectada")
	} else {
		fmt.Printf("🚨 %d violações detectadas:\n", result.Count)
		for _, v := range result.Violations {
			fmt.Printf("   [%s] %s: %s\n", v.Severity, v.Invariant, v.Message)
		}
	}
}

func printResult(r StressTestResult) {
	fmt.Printf("Total Requests:  %d\n", r.TotalRequests)
	fmt.Printf("Successful:      %d\n", r.Successful)
	fmt.Printf("Fills:           %d\n", r.Fills)
	fmt.Printf("No-Fills:        %d\n", r.NoFills)
	fmt.Printf("Blocked (Fraud): %d\n", r.Blocked)
	fmt.Printf("Errors:          %d\n", r.Errors)
	fmt.Printf("Avg Latency:     %.2f ms\n", r.AvgLatencyMs)
	fmt.Printf("Total Time:      %d ms\n", r.TotalTimeMs)
}

// Suprimir warning de rand não usado
var _ = rand.Int
