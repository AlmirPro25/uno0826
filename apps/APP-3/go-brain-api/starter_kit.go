package main

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    STARTER KIT MARKETPLACE - Core Types                       ║
║                                                                               ║
║              "Cada geração é um ativo econômico reutilizável"                ║
╚══════════════════════════════════════════════════════════════════════════════╝

FILOSOFIA:
- O código não é o produto final
- O código é o resíduo valioso do processo
- Vendemos atalhos cognitivos, não templates

MODELO DE NEGÓCIO:
- Usuário gera de graça
- Código dele é dele (juridicamente)
- Sistema pode vender versões genéricas
- Dataset treina modelo interno (lock-in cognitivo)
*/

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"
)

// ═══════════════════════════════════════════════════════════════════════════════
// STARTER KIT - O Ativo Econômico
// ═══════════════════════════════════════════════════════════════════════════════

// StarterKit representa um artefato imutável de geração
type StarterKit struct {
	// Identificação
	ID        string    `json:"id" db:"id"`                 // Hash único do código
	Version   int       `json:"version" db:"version"`       // Versão do kit
	CreatedAt time.Time `json:"created_at" db:"created_at"` // Timestamp imutável
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// Conteúdo Principal
	Code         string `json:"code" db:"code"`                   // Código completo
	Prompt       string `json:"prompt" db:"prompt"`               // Prompt original
	README       string `json:"readme" db:"readme"`               // Documentação gerada
	Architecture string `json:"architecture" db:"architecture"`   // Diagrama/descrição

	// Metadados Semânticos (OURO)
	Metadata StarterKitMetadata `json:"metadata" db:"metadata"`

	// Classificação pelo Modelo Pequeno
	Classification StarterKitClassification `json:"classification" db:"classification"`

	// Status de Marketplace
	MarketplaceStatus MarketplaceStatus `json:"marketplace_status" db:"marketplace_status"`

	// Ownership
	OwnerID     string `json:"owner_id" db:"owner_id"`         // Quem gerou
	IsPublic    bool   `json:"is_public" db:"is_public"`       // Visível no marketplace
	LicenseType string `json:"license_type" db:"license_type"` // MIT, proprietary, etc
}

// StarterKitMetadata contém os metadados semânticos (crítico para valor)
type StarterKitMetadata struct {
	// Tipo de Produto
	ProductType string `json:"product_type"` // SaaS, API, App, Landing, Dashboard, etc

	// Complexidade
	Complexity      string `json:"complexity"`        // low, medium, high, enterprise
	EstimatedHours  int    `json:"estimated_hours"`   // Tempo que humano levaria
	LinesOfCode     int    `json:"lines_of_code"`     // LOC total
	ComponentsCount int    `json:"components_count"`  // Número de componentes

	// Stack Técnica
	Technologies []string `json:"technologies"` // React, Go, Tailwind, etc
	Patterns     []string `json:"patterns"`     // MVC, Clean Architecture, etc
	Integrations []string `json:"integrations"` // Stripe, Auth0, Supabase, etc

	// Trade-offs Documentados
	TradeOffs []TradeOff `json:"trade_offs"`

	// Tags para Busca
	Tags     []string `json:"tags"`
	Category string   `json:"category"`

	// Geração
	GeneratedBy   string    `json:"generated_by"`   // Qual manifesto/pipeline
	GeneratedAt   time.Time `json:"generated_at"`
	ModelUsed     string    `json:"model_used"`     // gemini-2.5-flash, etc
	ManifestUsed  string    `json:"manifest_used"`  // ECOMMERCE_SUPREME, etc
}

// TradeOff documenta decisões arquiteturais
type TradeOff struct {
	Decision    string `json:"decision"`    // O que foi decidido
	Reason      string `json:"reason"`      // Por que
	Alternative string `json:"alternative"` // O que poderia ser diferente
	Impact      string `json:"impact"`      // Impacto da decisão
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO PELO MODELO PEQUENO
// ═══════════════════════════════════════════════════════════════════════════════

// StarterKitClassification é o julgamento do modelo pequeno
type StarterKitClassification struct {
	// Scores (0-100)
	QualityScore      int `json:"quality_score"`      // Qualidade geral
	ArchitectureScore int `json:"architecture_score"` // Arquitetura
	SecurityScore     int `json:"security_score"`     // Segurança
	AccessibilityScore int `json:"accessibility_score"` // Acessibilidade
	PerformanceScore  int `json:"performance_score"`  // Performance
	MaintainabilityScore int `json:"maintainability_score"` // Manutenibilidade

	// Grade Final
	Grade string `json:"grade"` // A, B, C, D, F

	// Padrões Identificados
	PatternsDetected []string `json:"patterns_detected"`
	AntiPatterns     []string `json:"anti_patterns"`

	// Sugestões de Melhoria
	Improvements []string `json:"improvements"`

	// Validação
	IsValid       bool     `json:"is_valid"`        // Código funcional?
	ValidationErrors []string `json:"validation_errors"`

	// Classificado por
	ClassifiedBy string    `json:"classified_by"` // Modelo que classificou
	ClassifiedAt time.Time `json:"classified_at"`
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS NO MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════════

// MarketplaceStatus controla a vida do kit no marketplace
type MarketplaceStatus struct {
	// Visibilidade
	IsListed    bool      `json:"is_listed"`
	ListedAt    time.Time `json:"listed_at,omitempty"`
	UnlistedAt  time.Time `json:"unlisted_at,omitempty"`

	// Preço
	PriceTier   string  `json:"price_tier"`   // free, starter, pro, enterprise
	PriceUSD    float64 `json:"price_usd"`
	PriceBRL    float64 `json:"price_brl"`

	// Métricas
	Views       int `json:"views"`
	Downloads   int `json:"downloads"`
	Purchases   int `json:"purchases"`
	Stars       int `json:"stars"`

	// Curadoria
	IsCurated   bool   `json:"is_curated"`   // Passou por curadoria humana?
	CuratedBy   string `json:"curated_by,omitempty"`
	CuratedAt   time.Time `json:"curated_at,omitempty"`
	CurationNotes string `json:"curation_notes,omitempty"`

	// Featured
	IsFeatured  bool `json:"is_featured"`
	FeaturedUntil time.Time `json:"featured_until,omitempty"`
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE CRIAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

// NewStarterKit cria um novo Starter Kit a partir de uma geração
func NewStarterKit(code, prompt, ownerID string) *StarterKit {
	now := time.Now().UTC()
	
	// Gera ID único baseado no código
	hash := sha256.Sum256([]byte(code))
	id := "sk_" + hex.EncodeToString(hash[:])[:16]

	return &StarterKit{
		ID:        id,
		Version:   1,
		CreatedAt: now,
		UpdatedAt: now,
		Code:      code,
		Prompt:    prompt,
		OwnerID:   ownerID,
		IsPublic:  false, // Começa privado
		LicenseType: "user_owned",
		Metadata: StarterKitMetadata{
			GeneratedAt: now,
		},
		Classification: StarterKitClassification{},
		MarketplaceStatus: MarketplaceStatus{
			PriceTier: "free",
		},
	}
}

// GenerateID gera ID único para o código
func GenerateID(code string) string {
	hash := sha256.Sum256([]byte(code))
	return "sk_" + hex.EncodeToString(hash[:])[:16]
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

// ToJSON serializa para JSON
func (sk *StarterKit) ToJSON() ([]byte, error) {
	return json.Marshal(sk)
}

// FromJSON deserializa de JSON
func StarterKitFromJSON(data []byte) (*StarterKit, error) {
	var sk StarterKit
	err := json.Unmarshal(data, &sk)
	return &sk, err
}

// ═══════════════════════════════════════════════════════════════════════════════
// CÁLCULO DE PREÇO SUGERIDO
// ═══════════════════════════════════════════════════════════════════════════════

// CalculateSuggestedPrice calcula preço baseado em métricas
func (sk *StarterKit) CalculateSuggestedPrice() float64 {
	basePrice := 0.0

	// Base por complexidade
	switch sk.Metadata.Complexity {
	case "low":
		basePrice = 29.0
	case "medium":
		basePrice = 99.0
	case "high":
		basePrice = 299.0
	case "enterprise":
		basePrice = 999.0
	default:
		basePrice = 49.0
	}

	// Multiplicador por qualidade
	qualityMultiplier := float64(sk.Classification.QualityScore) / 100.0
	if qualityMultiplier < 0.5 {
		qualityMultiplier = 0.5
	}

	// Multiplicador por horas economizadas
	hoursMultiplier := 1.0
	if sk.Metadata.EstimatedHours > 40 {
		hoursMultiplier = 1.5
	} else if sk.Metadata.EstimatedHours > 100 {
		hoursMultiplier = 2.0
	}

	// Bônus por integrações
	integrationBonus := float64(len(sk.Metadata.Integrations)) * 10.0

	finalPrice := (basePrice * qualityMultiplier * hoursMultiplier) + integrationBonus

	// Arredonda para .99
	return float64(int(finalPrice)) + 0.99
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO PARA MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════════

// CanBeListed verifica se pode ser listado no marketplace
func (sk *StarterKit) CanBeListed() (bool, []string) {
	var reasons []string

	// Precisa ter sido classificado
	if sk.Classification.ClassifiedAt.IsZero() {
		reasons = append(reasons, "Não foi classificado pelo modelo")
	}

	// Precisa ter qualidade mínima
	if sk.Classification.QualityScore < 60 {
		reasons = append(reasons, "Qualidade abaixo do mínimo (60)")
	}

	// Precisa ser válido
	if !sk.Classification.IsValid {
		reasons = append(reasons, "Código não passou na validação")
	}

	// Precisa ter README
	if sk.README == "" {
		reasons = append(reasons, "Falta documentação (README)")
	}

	// Precisa ter metadados mínimos
	if sk.Metadata.ProductType == "" {
		reasons = append(reasons, "Falta tipo de produto")
	}

	return len(reasons) == 0, reasons
}
