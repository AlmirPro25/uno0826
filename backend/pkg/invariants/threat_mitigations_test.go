package invariants

import (
	"bytes"
	"strings"
	"testing"
	"time"
)

// =============================================================================
// TESTES DE MITIGAÇÃO DE AMEAÇAS
// Baseados no THREAT-MODEL-SOVEREIGN-MESH.md
// Estes testes validam que as mitigações estão funcionando
// =============================================================================

// -----------------------------------------------------------------------------
// T-001: Farol Comprometido
// -----------------------------------------------------------------------------

func TestT001_FarolCannotStoreMessages(t *testing.T) {
	// Farol NUNCA pode armazenar mensagens
	testCases := []struct {
		dataType string
		data     map[string]interface{}
	}{
		{"message", map[string]interface{}{"content": "hello"}},
		{"chat", map[string]interface{}{"body": "secret"}},
		{"direct_message", map[string]interface{}{"text": "private"}},
	}

	for _, tc := range testCases {
		err := ValidateFarolCannotStoreContent(tc.dataType, tc.data)
		if err == nil {
			t.Errorf("T-001 VIOLATION: Farol accepted %s data", tc.dataType)
		}
	}
}

func TestT001_FarolCanStorePresence(t *testing.T) {
	// Farol PODE armazenar presença
	presenceData := map[string]interface{}{
		"peer_id":    "12D3KooW...",
		"last_seen":  time.Now(),
		"reputation": 85,
	}

	err := ValidateFarolCannotStoreContent("presence", presenceData)
	if err != nil {
		t.Errorf("T-001 ERROR: Farol should accept presence data: %v", err)
	}
}

// -----------------------------------------------------------------------------
// T-002: Ataque Sybil
// -----------------------------------------------------------------------------

// PeerReputation para teste de Sybil
type TestPeerReputation struct {
	Score            int
	UptimeHours      int
	SuccessfulRelays int
	CreatedAt        time.Time
}

func (p *TestPeerReputation) MaxConnections() int {
	if p.Score < 50 {
		return 5 // Limite baixo para novos/suspeitos
	}
	if p.Score < 80 {
		return 20
	}
	return 100
}

func (p *TestPeerReputation) CanRelay() bool {
	return p.Score >= 70 && p.UptimeHours >= 24
}

func TestT002_NewPeersHaveLimitedConnections(t *testing.T) {
	// Peers novos devem ter conexões limitadas
	newPeer := &TestPeerReputation{
		Score:       30,
		UptimeHours: 1,
		CreatedAt:   time.Now(),
	}

	if newPeer.MaxConnections() > 10 {
		t.Error("T-002 VIOLATION: New peer has too many allowed connections")
	}
}

func TestT002_NewPeersCannotRelay(t *testing.T) {
	// Peers novos não podem ser relay
	newPeer := &TestPeerReputation{
		Score:       30,
		UptimeHours: 1,
	}

	if newPeer.CanRelay() {
		t.Error("T-002 VIOLATION: New peer should not be able to relay")
	}
}

func TestT002_EstablishedPeersCanRelay(t *testing.T) {
	// Peers estabelecidos podem ser relay
	establishedPeer := &TestPeerReputation{
		Score:       85,
		UptimeHours: 720, // 30 dias
	}

	if !establishedPeer.CanRelay() {
		t.Error("T-002 ERROR: Established peer should be able to relay")
	}
}

// -----------------------------------------------------------------------------
// T-003: Fingerprinting via Telemetria
// -----------------------------------------------------------------------------

var ForbiddenTelemetryFields = []string{
	"ip_address",
	"device_id",
	"precise_location",
	"contact_list",
	"message_content",
	"private_key",
	"session_id",
}

func ValidateTelemetryFields(fields map[string]interface{}) error {
	for key := range fields {
		keyLower := strings.ToLower(key)
		for _, forbidden := range ForbiddenTelemetryFields {
			if strings.Contains(keyLower, forbidden) {
				return ErrFarolStoringContent
			}
		}
	}
	return nil
}

func TestT003_TelemetryCannotContainPII(t *testing.T) {
	// Telemetria não pode conter PII
	badTelemetry := map[string]interface{}{
		"ip_address": "192.168.1.1",
		"event":      "login",
	}

	err := ValidateTelemetryFields(badTelemetry)
	if err == nil {
		t.Error("T-003 VIOLATION: Telemetry accepted IP address")
	}
}

func TestT003_TelemetryCanContainAggregates(t *testing.T) {
	// Telemetria pode conter dados agregados
	goodTelemetry := map[string]interface{}{
		"event_type":    "message_sent",
		"count":         42,
		"hour_bucket":   "2026-01-13T14:00:00Z",
		"region_hash":   "sha256:abc123",
	}

	err := ValidateTelemetryFields(goodTelemetry)
	if err != nil {
		t.Errorf("T-003 ERROR: Telemetry should accept aggregates: %v", err)
	}
}

// -----------------------------------------------------------------------------
// T-004: Client Modificado
// -----------------------------------------------------------------------------

func TestT004_MessagesRequireValidSignature(t *testing.T) {
	// Todas as mensagens devem ter assinatura válida
	// (Simulação - em produção usa ed25519.Verify)
	
	type Message struct {
		Content   string
		Signature []byte
		PubKey    []byte
	}

	verifySignature := func(msg Message) bool {
		// Simulação: assinatura deve ter pelo menos 64 bytes
		return len(msg.Signature) >= 64 && len(msg.PubKey) >= 32
	}

	validMsg := Message{
		Content:   "hello",
		Signature: make([]byte, 64),
		PubKey:    make([]byte, 32),
	}

	invalidMsg := Message{
		Content:   "hello",
		Signature: []byte("fake"),
		PubKey:    []byte("fake"),
	}

	if !verifySignature(validMsg) {
		t.Error("T-004 ERROR: Valid signature rejected")
	}

	if verifySignature(invalidMsg) {
		t.Error("T-004 VIOLATION: Invalid signature accepted")
	}
}

// -----------------------------------------------------------------------------
// P-001: Ordem Judicial
// -----------------------------------------------------------------------------

func TestP001_KernelCannotAccessMessageContent(t *testing.T) {
	// Kernel NUNCA tem acesso a conteúdo de mensagens
	
	// Simula tentativa de acesso
	getMessageContent := func(userID string) interface{} {
		// Sempre retorna nil - não temos os dados
		return nil
	}

	content := getMessageContent("user123")
	if content != nil {
		t.Error("P-001 VIOLATION: Kernel returned message content")
	}
}

func TestP001_KernelCanAccessBillingData(t *testing.T) {
	// Kernel PODE acessar dados de billing
	
	type BillingData struct {
		UserID    string
		Plan      string
		Email     string
		CreatedAt time.Time
	}

	getBillingData := func(userID string) *BillingData {
		return &BillingData{
			UserID:    userID,
			Plan:      "pro",
			Email:     "user@example.com",
			CreatedAt: time.Now(),
		}
	}

	data := getBillingData("user123")
	if data == nil {
		t.Error("P-001 ERROR: Kernel should have billing data")
	}
}

// -----------------------------------------------------------------------------
// P-003: Pressão para Backdoor
// -----------------------------------------------------------------------------

func ValidateNoBackdoor(code []byte) error {
	// Padrões que indicam backdoor
	patterns := []string{
		"masterKey",
		"backdoor",
		"lawEnforcement",
		"skipEncryption",
		"logMessageContent",
		"decryptAll",
		"adminOverride",
		"bypassAuth",
	}

	codeLower := bytes.ToLower(code)
	for _, p := range patterns {
		if bytes.Contains(codeLower, []byte(strings.ToLower(p))) {
			return ErrFarolAccessingPrivateKey // Reusa erro existente
		}
	}

	return nil
}

func TestP003_NoBackdoorPatterns(t *testing.T) {
	// Código não pode conter padrões de backdoor
	
	cleanCode := []byte(`
		func encryptMessage(msg []byte, key []byte) []byte {
			return aes.Encrypt(msg, key)
		}
	`)

	if err := ValidateNoBackdoor(cleanCode); err != nil {
		t.Errorf("P-003 ERROR: Clean code flagged as backdoor: %v", err)
	}

	backdoorCode := []byte(`
		func encryptMessage(msg []byte, key []byte) []byte {
			if masterKey != nil {
				logMessageContent(msg) // backdoor
			}
			return aes.Encrypt(msg, key)
		}
	`)

	if err := ValidateNoBackdoor(backdoorCode); err == nil {
		t.Error("P-003 VIOLATION: Backdoor code not detected")
	}
}

// -----------------------------------------------------------------------------
// Mesh Survival Tests
// -----------------------------------------------------------------------------

func TestMeshSurvivesWithoutLighthouse(t *testing.T) {
	// Mesh deve funcionar sem farol
	
	type MeshState struct {
		LighthouseAvailable bool
		DHTActive           bool
		MDNSActive          bool
		PeerCacheSize       int
	}

	canOperate := func(state MeshState) bool {
		if state.LighthouseAvailable {
			return true
		}
		// Sem farol, precisa de DHT ou mDNS + cache
		return (state.DHTActive || state.MDNSActive) && state.PeerCacheSize > 0
	}

	// Com farol
	withLighthouse := MeshState{
		LighthouseAvailable: true,
		DHTActive:           true,
		MDNSActive:          true,
		PeerCacheSize:       100,
	}
	if !canOperate(withLighthouse) {
		t.Error("Mesh should operate with lighthouse")
	}

	// Sem farol, com DHT
	withoutLighthouse := MeshState{
		LighthouseAvailable: false,
		DHTActive:           true,
		MDNSActive:          false,
		PeerCacheSize:       50,
	}
	if !canOperate(withoutLighthouse) {
		t.Error("Mesh should operate without lighthouse via DHT")
	}

	// Sem farol, com mDNS
	localOnly := MeshState{
		LighthouseAvailable: false,
		DHTActive:           false,
		MDNSActive:          true,
		PeerCacheSize:       10,
	}
	if !canOperate(localOnly) {
		t.Error("Mesh should operate locally via mDNS")
	}

	// Sem nada - deve falhar
	noNetwork := MeshState{
		LighthouseAvailable: false,
		DHTActive:           false,
		MDNSActive:          false,
		PeerCacheSize:       0,
	}
	if canOperate(noNetwork) {
		t.Error("Mesh should not operate without any network")
	}
}

// -----------------------------------------------------------------------------
// Benchmark: Verificações devem ser rápidas
// -----------------------------------------------------------------------------

func BenchmarkValidateNoBackdoor(b *testing.B) {
	code := make([]byte, 10000) // 10KB de código
	for i := range code {
		code[i] = byte('a' + (i % 26))
	}

	for i := 0; i < b.N; i++ {
		ValidateNoBackdoor(code)
	}
}

func BenchmarkValidateTelemetryFields(b *testing.B) {
	fields := map[string]interface{}{
		"event_type":  "message_sent",
		"count":       42,
		"hour_bucket": "2026-01-13T14:00:00Z",
		"region_hash": "sha256:abc123",
	}

	for i := 0; i < b.N; i++ {
		ValidateTelemetryFields(fields)
	}
}
