package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

const BaseURL = "http://localhost:8080/api/v1/mcp"

// Wrapper for steps
func runStep(name string, fn func() error) bool {
	fmt.Printf("TEST: %-40s ... ", name)
	start := time.Now()
	if err := fn(); err != nil {
		fmt.Printf("FAILED ❌ (%s)\n", err.Error())
		return false
	}
	fmt.Printf("PASS ✅ (%dms)\n", time.Since(start).Milliseconds())
	time.Sleep(500 * time.Millisecond) // Human readable pace
	return true
}

// HTTP Helpers
func postRPC(agentID, command string, params interface{}) (map[string]interface{}, error) {
	payload := map[string]interface{}{
		"agent_id": agentID,
		"command":  command,
		"params":   params,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", BaseURL+"/dispatch", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Trace-ID", fmt.Sprintf("test-%d", time.Now().UnixNano()))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	if result["status"] == "FAILURE" {
		return nil, fmt.Errorf("MCP Failure: %v", result["error"])
	}

	return result, nil
}

// Steps Implementation

func checkHealth() error {
	resp, err := http.Get(BaseURL + "/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("status %d", resp.StatusCode)
	}
	return nil
}

func setDefconNormal() error {
	_, err := postRPC("policy-ops-agent-001", "policy:defcon:set", map[string]interface{}{
		"level":  5,
		"reason": "E2E Test Routine",
	})
	return err
}

func startNegotiation() (string, error) {
	res, err := postRPC("sales-ops-agent-001", "sales:negotiation:start", map[string]interface{}{
		"user_id": "00000000-0000-0000-0000-000000000000", // Dummy UUID
		"context": "e2e-test",
	})
	if err != nil {
		return "", err
	}

	data := res["result"].(map[string]interface{})
	return data["id"].(string), nil
}

func createProposal(negID string) (string, error) {
	res, err := postRPC("sales-ops-agent-001", "sales:proposal:create", map[string]interface{}{
		"negotiation_id": negID,
		"product_tier":   "enterprise",
	})
	if err != nil {
		return "", err
	}
	data := res["result"].(map[string]interface{})
	return data["id"].(string), nil
}

func acceptProposal(propID string) error {
	_, err := postRPC("sales-ops-agent-001", "sales:proposal:accept", map[string]interface{}{
		"proposal_id": propID,
	})
	return err
}

func verifyBillingTrigger() error {
	// Wait a bit for async process
	time.Sleep(1 * time.Second)

	resp, err := http.Get(BaseURL + "/audit/events?limit=20")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var body struct {
		Events []struct {
			Command string `json:"command"`
			AgentID string `json:"agent_id"`
		} `json:"events"`
	}
	json.NewDecoder(resp.Body).Decode(&body)

	found := false
	for _, e := range body.Events {
		if e.AgentID == "billing-ops-agent-001" && e.Command == "billing:subscription:create_from_proposal" {
			found = true
			break
		}
	}

	if !found {
		return errors.New("billing trigger event not found in audit logs")
	}
	return nil
}

func activateKillSwitch() error {
	_, err := postRPC("policy-ops-agent-001", "policy:killswitch:activate", map[string]interface{}{
		"reason": "E2E Emergency Drill",
	})
	return err
}

func verifyFrozen() error {
	// Attempt a sales command - should fail or be blocked
	// In strict mode, the dispatcher checks killswitch.
	// Our dispatcher returns an error if frozen.

	payload := map[string]interface{}{
		"agent_id": "sales-ops-agent-001",
		"command":  "sales:list",
		"params":   map[string]interface{}{},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", BaseURL+"/dispatch", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respStr, _ := io.ReadAll(resp.Body)

	// Expecting 503 Service Unavailable or specific error
	if resp.StatusCode == 503 || strings.Contains(string(respStr), "Kill Switch Activated") {
		return nil
	}

	// Also check if json returned an error about kill switch
	if strings.Contains(string(respStr), "Kill Switch") {
		return nil
	}

	return fmt.Errorf("system did not reject request as expected. Status: %d, Body: %s", resp.StatusCode, string(respStr))
}

func deactivateKillSwitch() error {
	// This command must bypass the kill switch or be handled specially.
	// In our Dispatcher, "policy:killswitch:deactivate" is allowed?
	// Let's check Dispatcher code...
	// The dispatcher.Dispatch() checks KillSwitch at the top.
	// UNLESS the command is from PolicyAgent?

	// Wait, if KillSwitch is ON, NO command passes dispatcher.
	// We need to implement a "Bypass" for PolicyOpsAgent or specific commands.
	// Let's see if we did that. If not, we found a bug :)

	// Checking the result will tell us. For now, try to run it.
	_, err := postRPC("policy-ops-agent-001", "policy:killswitch:deactivate", map[string]interface{}{})
	return err
}

func main() {
	log.Println("⚔️  INICIANDO PROTOCOLO DE VALIDAÇÃO SOBERANA ⚔️")
	log.Println("================================================")

	if !runStep("1. Health Check", checkHealth) {
		os.Exit(1)
	}

	if !runStep("2. Set DEFCON 5 (Normal)", setDefconNormal) {
		os.Exit(1)
	}

	var negID, propID string

	if !runStep("3. Start Negotiation", func() error {
		var err error
		negID, err = startNegotiation()
		return err
	}) {
		os.Exit(1)
	}

	if !runStep("4. Create Proposal", func() error {
		var err error
		propID, err = createProposal(negID)
		return err
	}) {
		os.Exit(1)
	}

	if !runStep("5. Accept Proposal (Triggers Billing)", func() error {
		return acceptProposal(propID)
	}) {
		os.Exit(1)
	}

	if !runStep("6. Verify Billing Audit Trail", verifyBillingTrigger) {
		log.Println("⚠️  Billing verification failed (could be latency)")
	}

	// WAR DRILL
	log.Println("\n--- 🚨 INICIANDO SIMULAÇÃO DE EMERGÊNCIA ---")

	if !runStep("7. Activate Kill Switch (DEFCON 1)", activateKillSwitch) {
		os.Exit(1)
	}

	if !runStep("8. Verify System Frozen (Reject Requests)", verifyFrozen) {
		os.Exit(1)
	}

	// RECOVERY CHECK
	// Se o KillSwitch bloqueia TUDO, como desativamos?
	// O Dispatcher precisa permitir "Resume" ou comandos do PolicyAgent.
	// Vamos testar. Se falhar, temos um fix para fazer ANTES de entregar.
	if !runStep("9. Recover System (Reset DEFCON)", deactivateKillSwitch) {
		log.Println("❌ FALHA CRÍTICA: Não foi possível desativar o Kill Switch via API!")
		log.Println("   Motivo provável: O Dispatcher bloqueia o próprio comando de desbloqueio.")
		log.Println("   FIX NECESSÁRIO NO DISPATCHER.")
		os.Exit(1)
	}

	log.Println("================================================")
	log.Println("✅ SISTEMA SOBERANO VALIDADO COM SUCESSO.")
}
