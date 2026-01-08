package ai

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/google/uuid"
	"google.golang.org/api/option"
)

// AIService define as operações de governança por IA.
type AIService struct {
	repo   AIRepository
	apiKey string
}

// NewAIService cria uma nova instância de AIService.
func NewAIService(repo AIRepository) *AIService {
	return &AIService{
		repo:   repo,
		apiKey: os.Getenv("GEMINI_API_KEY"),
	}
}

// SetAPIKey permite definir a chave API dinamicamente se necessário.
func (s *AIService) SetAPIKey(key string) {
	s.apiKey = key
}

// EvolveSchema evolui o schema do banco de dados usando o Google Gemini.
func (s *AIService) EvolveSchema(intention string, contextMap map[string]string) (*AISchemaVersion, error) {
	log.Printf("AI Service: Recebida intenção de evolução: '%s'", intention)

	var proposedSQL string
	var err error

	if s.apiKey != "" {
		log.Println("AI Service: Acionando Google Gemini para geração de SQL...")
		proposedSQL, err = s.callGemini(intention, contextMap)
		if err != nil {
			log.Printf("ERRO Gemini: %v. Usando fallback mock...", err)
			proposedSQL = s.generateMockSQL(contextMap)
		}
	} else {
		log.Printf("AVISO: GEMINI_API_KEY não configurada. Usando mock...")
		proposedSQL = s.generateMockSQL(contextMap)
	}

	latestVersion, err := s.repo.GetLatestAISchemaVersion()
	currentVersion := 0
	if err == nil {
		currentVersion = latestVersion.Version
	}

	migration := &AISchemaVersion{
		ID:           uuid.New(),
		Version:      currentVersion + 1,
		MigrationSQL: proposedSQL,
		AIIntention:  intention,
		AppliedAt:    time.Now(),
		ApprovedBy:   "Gemini_AI_Architect",
	}

	if err := s.repo.CreateAISchemaVersion(migration); err != nil {
		return nil, fmt.Errorf("falha ao persistir nova versão de schema: %w", err)
	}

	log.Printf("AI Service: Schema evoluído com sucesso. Versão: %d", migration.Version)
	return migration, nil
}

func (s *AIService) callGemini(intention string, contextMap map[string]string) (string, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(s.apiKey))
	if err != nil {
		return "", fmt.Errorf("falha ao criar cliente Gemini: %w", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-1.5-flash")
	model.SetTemperature(0.1)

	prompt := fmt.Sprintf(`Você é o Arquiteto SQL do Sistema Prost-QS.
O sistema usa SQLite.
Sua tarefa é gerar APENAS o script SQL (DDL) de migração baseado na intenção do usuário.
Não inclua nenhuma explicação, comentário, tag markdown ou bloco de código.
Retorne apenas o comando SQL puro.

Intenção do Usuário: %s
Contexto do Sistema: %+v

Exemplo de saída esperada:
ALTER TABLE users ADD COLUMN bio TEXT;`, intention, contextMap)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("falha na geração de conteúdo: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("IA não retornou candidatos")
	}

	// Extrair texto da parte
	part := resp.Candidates[0].Content.Parts[0]
	sql := fmt.Sprintf("%v", part)

	return sql, nil
}

func (s *AIService) generateMockSQL(contextMap map[string]string) string {
	if field, ok := contextMap["newField"]; ok {
		return fmt.Sprintf("ALTER TABLE users ADD COLUMN %s TEXT;", field)
	}
	return "ALTER TABLE settings ADD COLUMN ai_enabled BOOLEAN DEFAULT TRUE;"
}

// GetMigrationByID busca uma versão de schema pelo ID.
func (s *AIService) GetMigrationByID(id uuid.UUID) (*AISchemaVersion, error) {
	return s.repo.GetAISchemaVersionByID(id)
}

// ResolveConflict resolve conflitos usando a inteligência do kernel.
func (s *AIService) ResolveConflict(conflictID, policy string) (int, []string, error) {
	log.Printf("AI Service: Resolvendo conflito %s via política %s", conflictID, policy)
	// Implementação futura com Gemini
	return 1, []string{uuid.New().String()}, nil
}
