package invariants

import (
	"errors"
	"strings"
)

// =============================================================================
// INVARIANTES DE SOBERANIA DO SISTEMA
// =============================================================================
// Estas regras NUNCA podem ser violadas. São limitações técnicas, não filosofia.
// Se alguma dessas funções retornar erro, a operação DEVE ser bloqueada.
// =============================================================================

var (
	// Erros de violação de soberania
	ErrFarolStoringContent     = errors.New("SOVEREIGNTY_VIOLATION: farol cannot store user content")
	ErrFarolReadingMessages    = errors.New("SOVEREIGNTY_VIOLATION: farol cannot read messages")
	ErrFarolAccessingPrivateKey = errors.New("SOVEREIGNTY_VIOLATION: farol cannot access private keys")
	ErrFarolDecidingConnections = errors.New("SOVEREIGNTY_VIOLATION: farol cannot decide peer connections")
	ErrCloudAsSourceOfTruth    = errors.New("SOVEREIGNTY_VIOLATION: cloud cannot be source of truth for user data")
	ErrCloudRequiredForEntry   = errors.New("SOVEREIGNTY_VIOLATION: cloud cannot be required for mesh entry")
)

// =============================================================================
// INVARIANTE 1: FAROL NUNCA ARMAZENA CONTEÚDO
// =============================================================================

// ForbiddenContentTypes tipos de conteúdo que NUNCA podem ser armazenados no farol
var ForbiddenContentTypes = []string{
	"message",
	"chat",
	"file",
	"media",
	"post_content",
	"private_data",
	"encryption_key",
	"private_key",
}

// ValidateFarolCannotStoreContent verifica se o farol está tentando armazenar conteúdo proibido
func ValidateFarolCannotStoreContent(dataType string, data interface{}) error {
	dataTypeLower := strings.ToLower(dataType)
	
	for _, forbidden := range ForbiddenContentTypes {
		if strings.Contains(dataTypeLower, forbidden) {
			return ErrFarolStoringContent
		}
	}
	
	// Verificar se o payload contém campos proibidos
	if m, ok := data.(map[string]interface{}); ok {
		for key := range m {
			keyLower := strings.ToLower(key)
			if keyLower == "content" || keyLower == "message" || keyLower == "body" ||
			   keyLower == "private_key" || keyLower == "secret" || keyLower == "file_data" {
				return ErrFarolStoringContent
			}
		}
	}
	
	return nil
}

// =============================================================================
// INVARIANTE 2: FAROL NUNCA LÊ MENSAGENS
// =============================================================================

// AllowedFarolDataTypes dados que o farol PODE processar
var AllowedFarolDataTypes = []string{
	"peer_id",
	"presence",
	"capability",
	"reputation",
	"network_hash",
	"lighthouse_id",
	"timestamp",
	"heartbeat",
	"relay_info",
	"bootstrap",
}

// ValidateFarolDataAccess verifica se o farol está acessando apenas dados permitidos
func ValidateFarolDataAccess(dataType string) error {
	dataTypeLower := strings.ToLower(dataType)
	
	// Verificar se é um tipo permitido
	for _, allowed := range AllowedFarolDataTypes {
		if strings.Contains(dataTypeLower, allowed) {
			return nil
		}
	}
	
	// Se não está na lista de permitidos, verificar se é proibido
	for _, forbidden := range ForbiddenContentTypes {
		if strings.Contains(dataTypeLower, forbidden) {
			return ErrFarolReadingMessages
		}
	}
	
	return nil
}

// =============================================================================
// INVARIANTE 3: FAROL NUNCA ACESSA CHAVES PRIVADAS
// =============================================================================

// ValidateFarolCannotAccessPrivateKey garante que o farol nunca recebe chaves privadas
func ValidateFarolCannotAccessPrivateKey(fieldName string, value interface{}) error {
	fieldLower := strings.ToLower(fieldName)
	
	// Campos que indicam chave privada
	privateKeyIndicators := []string{
		"private_key",
		"secret_key",
		"signing_key",
		"encryption_key",
		"seed",
		"mnemonic",
	}
	
	for _, indicator := range privateKeyIndicators {
		if strings.Contains(fieldLower, indicator) {
			return ErrFarolAccessingPrivateKey
		}
	}
	
	// Verificar formato de chave privada (Ed25519, etc)
	if str, ok := value.(string); ok {
		if len(str) == 64 || len(str) == 128 { // Hex encoded keys
			if strings.HasPrefix(fieldLower, "priv") || strings.HasPrefix(fieldLower, "secret") {
				return ErrFarolAccessingPrivateKey
			}
		}
	}
	
	return nil
}

// =============================================================================
// INVARIANTE 4: MESH DEVE SOBREVIVER SEM FAROL
// =============================================================================

// MeshSurvivalRequirements requisitos para a mesh sobreviver sem farol
type MeshSurvivalRequirements struct {
	HasLocalDiscovery    bool // mDNS
	HasDHTRouting        bool // Kademlia DHT
	HasLocalStorage      bool // SQLCipher
	HasOfflineIdentity   bool // Ed25519 local
	HasPeerCache         bool // Cache de peers conhecidos
}

// ValidateMeshCanSurviveWithoutFarol verifica se a mesh pode operar sem farol
func ValidateMeshCanSurviveWithoutFarol(req MeshSurvivalRequirements) error {
	// Requisitos mínimos para sobrevivência
	if !req.HasLocalDiscovery {
		return errors.New("MESH_SURVIVAL: local discovery (mDNS) required")
	}
	if !req.HasDHTRouting {
		return errors.New("MESH_SURVIVAL: DHT routing required")
	}
	if !req.HasLocalStorage {
		return errors.New("MESH_SURVIVAL: local storage required")
	}
	if !req.HasOfflineIdentity {
		return errors.New("MESH_SURVIVAL: offline identity required")
	}
	
	return nil
}

// =============================================================================
// INVARIANTE 5: CLOUD NÃO É FONTE DE VERDADE PARA DADOS DO USUÁRIO
// =============================================================================

// UserDataSourceOfTruth define onde cada tipo de dado deve residir
type UserDataSourceOfTruth struct {
	DataType string
	Source   string // "local", "p2p", "cloud_allowed", "cloud_forbidden"
}

var DataSourceRules = []UserDataSourceOfTruth{
	// SEMPRE LOCAL
	{DataType: "private_key", Source: "local"},
	{DataType: "messages", Source: "local"},
	{DataType: "files", Source: "local"},
	{DataType: "contacts", Source: "local"},
	{DataType: "chat_history", Source: "local"},
	
	// P2P (sincronizado entre peers)
	{DataType: "public_posts", Source: "p2p"},
	{DataType: "community_data", Source: "p2p"},
	{DataType: "peer_reputation", Source: "p2p"},
	
	// CLOUD PERMITIDO (metadados operacionais)
	{DataType: "presence", Source: "cloud_allowed"},
	{DataType: "capabilities", Source: "cloud_allowed"},
	{DataType: "billing", Source: "cloud_allowed"},
	{DataType: "identity_link", Source: "cloud_allowed"},
	{DataType: "telemetry_aggregated", Source: "cloud_allowed"},
}

// ValidateDataSourceOfTruth verifica se o dado está sendo armazenado no lugar correto
func ValidateDataSourceOfTruth(dataType, attemptedSource string) error {
	for _, rule := range DataSourceRules {
		if strings.Contains(strings.ToLower(dataType), rule.DataType) {
			switch rule.Source {
			case "local":
				if attemptedSource == "cloud" || attemptedSource == "farol" {
					return ErrCloudAsSourceOfTruth
				}
			case "cloud_forbidden":
				if attemptedSource == "cloud" || attemptedSource == "farol" {
					return ErrCloudAsSourceOfTruth
				}
			}
		}
	}
	return nil
}

// =============================================================================
// INVARIANTE 6: ENTRADA NA MESH NÃO PODE DEPENDER DE CLOUD
// =============================================================================

// MeshEntryRequirements requisitos para entrar na mesh
type MeshEntryRequirements struct {
	RequiresCloudAuth     bool
	RequiresFarolBootstrap bool
	HasLocalFallback      bool
	HasPeerBootstrap      bool
}

// ValidateMeshEntryIndependence verifica se a entrada na mesh não depende de cloud
func ValidateMeshEntryIndependence(req MeshEntryRequirements) error {
	// Se requer cloud/farol, DEVE ter fallback local
	if req.RequiresCloudAuth && !req.HasLocalFallback {
		return ErrCloudRequiredForEntry
	}
	
	if req.RequiresFarolBootstrap && !req.HasPeerBootstrap && !req.HasLocalFallback {
		return ErrCloudRequiredForEntry
	}
	
	return nil
}

// =============================================================================
// RUNNER: Executa todas as invariantes de soberania
// =============================================================================

// SovereigntyInvariantResult resultado da verificação de invariante
type SovereigntyInvariantResult struct {
	Name    string
	Passed  bool
	Error   error
	Details string
}

// RunAllSovereigntyInvariants executa todas as verificações de soberania
func RunAllSovereigntyInvariants(
	meshReq MeshSurvivalRequirements,
	entryReq MeshEntryRequirements,
) []SovereigntyInvariantResult {
	results := []SovereigntyInvariantResult{}
	
	// Invariante: Mesh sobrevive sem farol
	if err := ValidateMeshCanSurviveWithoutFarol(meshReq); err != nil {
		results = append(results, SovereigntyInvariantResult{
			Name:    "mesh_survival",
			Passed:  false,
			Error:   err,
			Details: "Mesh must be able to operate without lighthouse",
		})
	} else {
		results = append(results, SovereigntyInvariantResult{
			Name:    "mesh_survival",
			Passed:  true,
			Details: "Mesh can survive without lighthouse",
		})
	}
	
	// Invariante: Entrada independente de cloud
	if err := ValidateMeshEntryIndependence(entryReq); err != nil {
		results = append(results, SovereigntyInvariantResult{
			Name:    "mesh_entry_independence",
			Passed:  false,
			Error:   err,
			Details: "Mesh entry must not require cloud",
		})
	} else {
		results = append(results, SovereigntyInvariantResult{
			Name:    "mesh_entry_independence",
			Passed:  true,
			Details: "Mesh entry is cloud-independent",
		})
	}
	
	return results
}
