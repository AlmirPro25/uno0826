package invariants

import (
	"testing"
)

// =============================================================================
// TESTES DE INVARIANTES DE SOBERANIA
// Estes testes DEVEM passar. Se falharem, o sistema está violando princípios fundamentais.
// =============================================================================

func TestFarolCannotStoreContent(t *testing.T) {
	tests := []struct {
		name      string
		dataType  string
		data      interface{}
		wantError bool
	}{
		// DEVE BLOQUEAR
		{"block_message", "message", map[string]interface{}{"content": "hello"}, true},
		{"block_chat", "chat_data", nil, true},
		{"block_file", "file_upload", nil, true},
		{"block_private_key", "private_key", nil, true},
		{"block_content_field", "metadata", map[string]interface{}{"content": "data"}, true},
		{"block_message_field", "metadata", map[string]interface{}{"message": "data"}, true},
		
		// DEVE PERMITIR
		{"allow_presence", "presence", map[string]interface{}{"peer_id": "123"}, false},
		{"allow_capability", "capability", map[string]interface{}{"bandwidth": 100}, false},
		{"allow_heartbeat", "heartbeat", map[string]interface{}{"timestamp": 123}, false},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFarolCannotStoreContent(tt.dataType, tt.data)
			if tt.wantError && err == nil {
				t.Errorf("Expected error for %s, got nil", tt.dataType)
			}
			if !tt.wantError && err != nil {
				t.Errorf("Unexpected error for %s: %v", tt.dataType, err)
			}
		})
	}
}

func TestFarolCannotAccessPrivateKey(t *testing.T) {
	tests := []struct {
		name      string
		fieldName string
		value     interface{}
		wantError bool
	}{
		// DEVE BLOQUEAR
		{"block_private_key", "private_key", "abc123", true},
		{"block_secret_key", "secret_key", "xyz789", true},
		{"block_signing_key", "signing_key", "key", true},
		{"block_mnemonic", "mnemonic", "word word word", true},
		{"block_seed", "seed_phrase", "seed", true},
		
		// DEVE PERMITIR
		{"allow_public_key", "public_key", "pubkey123", false},
		{"allow_peer_id", "peer_id", "12D3KooW...", false},
		{"allow_capability", "capability", "relay", false},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFarolCannotAccessPrivateKey(tt.fieldName, tt.value)
			if tt.wantError && err == nil {
				t.Errorf("Expected error for %s, got nil", tt.fieldName)
			}
			if !tt.wantError && err != nil {
				t.Errorf("Unexpected error for %s: %v", tt.fieldName, err)
			}
		})
	}
}

func TestMeshCanSurviveWithoutFarol(t *testing.T) {
	// Configuração VÁLIDA - mesh sobrevive
	validReq := MeshSurvivalRequirements{
		HasLocalDiscovery:  true,
		HasDHTRouting:      true,
		HasLocalStorage:    true,
		HasOfflineIdentity: true,
		HasPeerCache:       true,
	}
	
	if err := ValidateMeshCanSurviveWithoutFarol(validReq); err != nil {
		t.Errorf("Valid mesh config should pass: %v", err)
	}
	
	// Configuração INVÁLIDA - sem mDNS
	invalidReq := MeshSurvivalRequirements{
		HasLocalDiscovery:  false, // FALHA
		HasDHTRouting:      true,
		HasLocalStorage:    true,
		HasOfflineIdentity: true,
	}
	
	if err := ValidateMeshCanSurviveWithoutFarol(invalidReq); err == nil {
		t.Error("Mesh without local discovery should fail")
	}
	
	// Configuração INVÁLIDA - sem DHT
	invalidReq2 := MeshSurvivalRequirements{
		HasLocalDiscovery:  true,
		HasDHTRouting:      false, // FALHA
		HasLocalStorage:    true,
		HasOfflineIdentity: true,
	}
	
	if err := ValidateMeshCanSurviveWithoutFarol(invalidReq2); err == nil {
		t.Error("Mesh without DHT should fail")
	}
}

func TestMeshEntryIndependence(t *testing.T) {
	// VÁLIDO: Não requer cloud
	validReq := MeshEntryRequirements{
		RequiresCloudAuth:      false,
		RequiresFarolBootstrap: false,
		HasLocalFallback:       true,
		HasPeerBootstrap:       true,
	}
	
	if err := ValidateMeshEntryIndependence(validReq); err != nil {
		t.Errorf("Independent mesh entry should pass: %v", err)
	}
	
	// VÁLIDO: Requer farol MAS tem fallback
	validReq2 := MeshEntryRequirements{
		RequiresCloudAuth:      false,
		RequiresFarolBootstrap: true,
		HasLocalFallback:       true, // TEM FALLBACK
		HasPeerBootstrap:       false,
	}
	
	if err := ValidateMeshEntryIndependence(validReq2); err != nil {
		t.Errorf("Farol with fallback should pass: %v", err)
	}
	
	// INVÁLIDO: Requer cloud sem fallback
	invalidReq := MeshEntryRequirements{
		RequiresCloudAuth:      true,
		RequiresFarolBootstrap: false,
		HasLocalFallback:       false, // SEM FALLBACK
		HasPeerBootstrap:       false,
	}
	
	if err := ValidateMeshEntryIndependence(invalidReq); err == nil {
		t.Error("Cloud-dependent entry without fallback should fail")
	}
}

func TestDataSourceOfTruth(t *testing.T) {
	tests := []struct {
		name            string
		dataType        string
		attemptedSource string
		wantError       bool
	}{
		// DEVE BLOQUEAR - dados locais no cloud
		{"block_messages_cloud", "messages", "cloud", true},
		{"block_private_key_cloud", "private_key", "cloud", true},
		{"block_files_farol", "files", "farol", true},
		{"block_chat_history_cloud", "chat_history", "cloud", true},
		
		// DEVE PERMITIR - dados locais no local
		{"allow_messages_local", "messages", "local", false},
		{"allow_private_key_local", "private_key", "local", false},
		
		// DEVE PERMITIR - metadados no cloud
		{"allow_presence_cloud", "presence", "cloud", false},
		{"allow_billing_cloud", "billing", "cloud", false},
		{"allow_capabilities_farol", "capabilities", "farol", false},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateDataSourceOfTruth(tt.dataType, tt.attemptedSource)
			if tt.wantError && err == nil {
				t.Errorf("Expected error for %s in %s, got nil", tt.dataType, tt.attemptedSource)
			}
			if !tt.wantError && err != nil {
				t.Errorf("Unexpected error for %s in %s: %v", tt.dataType, tt.attemptedSource, err)
			}
		})
	}
}

func TestRunAllSovereigntyInvariants(t *testing.T) {
	// Configuração válida
	meshReq := MeshSurvivalRequirements{
		HasLocalDiscovery:  true,
		HasDHTRouting:      true,
		HasLocalStorage:    true,
		HasOfflineIdentity: true,
		HasPeerCache:       true,
	}
	
	entryReq := MeshEntryRequirements{
		RequiresCloudAuth:      false,
		RequiresFarolBootstrap: true,
		HasLocalFallback:       true,
		HasPeerBootstrap:       true,
	}
	
	results := RunAllSovereigntyInvariants(meshReq, entryReq)
	
	for _, r := range results {
		if !r.Passed {
			t.Errorf("Invariant %s failed: %v", r.Name, r.Error)
		}
	}
}

// =============================================================================
// BENCHMARK: Garantir que as verificações são rápidas
// =============================================================================

func BenchmarkValidateFarolCannotStoreContent(b *testing.B) {
	data := map[string]interface{}{"peer_id": "123", "capability": "relay"}
	
	for i := 0; i < b.N; i++ {
		ValidateFarolCannotStoreContent("presence", data)
	}
}

func BenchmarkRunAllSovereigntyInvariants(b *testing.B) {
	meshReq := MeshSurvivalRequirements{
		HasLocalDiscovery:  true,
		HasDHTRouting:      true,
		HasLocalStorage:    true,
		HasOfflineIdentity: true,
	}
	
	entryReq := MeshEntryRequirements{
		RequiresCloudAuth:      false,
		RequiresFarolBootstrap: true,
		HasLocalFallback:       true,
	}
	
	for i := 0; i < b.N; i++ {
		RunAllSovereigntyInvariants(meshReq, entryReq)
	}
}
