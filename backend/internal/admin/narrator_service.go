package admin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// ========================================
// COGNITIVE NARRATOR SERVICE - Fase 26.6
// "Gemini como narrador, não como cérebro"
// READ-ONLY: Apenas interpreta dados, nunca decide
// ========================================

// NarratorService gerencia narração cognitiva via Gemini
type NarratorService struct {
	cognitiveService *CognitiveDashboardService
	apiKey           string
	model            string
	enabled          bool
}

// NewNarratorService cria o serviço de narração
func NewNarratorService(cognitiveService *CognitiveDashboardService) *NarratorService {
	apiKey := os.Getenv("GEMINI_API_KEY")
	enabled := os.Getenv("GEMINI_NARRATOR_ENABLED") == "true"
	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-robotics-er-1.5-preview" // Default model
	}

	return &NarratorService{
		cognitiveService: cognitiveService,
		apiKey:           apiKey,
		model:            model,
		enabled:          enabled && apiKey != "",
	}
}

// GetModel retorna o modelo configurado
func (s *NarratorService) GetModel() string {
	return s.model
}

// IsEnabled verifica se o narrador está habilitado
func (s *NarratorService) IsEnabled() bool {
	return s.enabled
}

// ========================================
// RESPONSE TYPES
// ========================================

// NarrationType tipo de narrativa
type NarrationType string

const (
	NarrativeSummary  NarrationType = "summary"
	NarrativeDaily    NarrationType = "daily"
	NarrativeWeekly   NarrationType = "weekly"
	NarrativeQuestion NarrationType = "question"
)

// NarrateRequest requisição de narração
type NarrateRequest struct {
	Type     NarrationType `json:"type"`
	Question string        `json:"question,omitempty"`
}

// NarrateResponse resposta de narração
type NarrateResponse struct {
	Narrative   string      `json:"narrative"`
	Type        string      `json:"type"`
	DataUsed    interface{} `json:"data_used,omitempty"`
	GeneratedAt time.Time   `json:"generated_at"`
	Model       string      `json:"model"`
}

// ReportResponse resposta de relatório
type ReportResponse struct {
	Report      string      `json:"report"`
	Data        interface{} `json:"data"`
	Period      string      `json:"period"`
	GeneratedAt time.Time   `json:"generated_at"`
	Model       string      `json:"model"`
}

// ========================================
// PROMPT BASE (GOVERNADO)
// ========================================

const basePrompt = `Você é um NARRADOR COGNITIVO do sistema PROST-QS.

SEU PAPEL:
- Explicar dados de forma clara
- Resumir tendências observadas
- Traduzir métricas em linguagem humana
- Responder perguntas sobre o estado do sistema

VOCÊ NÃO PODE (REGRAS ABSOLUTAS):
- Sugerir ações ou mudanças
- Recomendar ajustes de configuração
- Decidir qualquer coisa
- Dizer "você deveria fazer X"
- Usar frases como "recomendo", "sugiro", "deveria"
- Influenciar o comportamento do sistema

FORMATO DE RESPOSTA:
- Linguagem clara e acessível em português brasileiro
- Fatos objetivos, não opiniões
- Dados concretos, não julgamentos
- Observações descritivas, não prescrições
- Use números e porcentagens quando disponíveis

ESTRUTURA PREFERIDA:
1. Visão geral (1-2 frases)
2. Dados principais (bullet points)
3. Observações relevantes (sem recomendações)

LEMBRE-SE: Você é um OBSERVADOR que DESCREVE. Nunca um CONSULTOR que PRESCREVE.`

// ========================================
// NARRATION METHODS
// ========================================

// Narrate gera uma narrativa baseada no tipo solicitado
func (s *NarratorService) Narrate(req NarrateRequest) (*NarrateResponse, error) {
	if !s.enabled {
		return s.generateFallbackNarrative(req)
	}

	// Coletar dados relevantes
	data, err := s.collectDataForNarration(req.Type)
	if err != nil {
		return nil, fmt.Errorf("erro ao coletar dados: %w", err)
	}

	// Construir prompt específico
	prompt := s.buildPrompt(req, data)

	// Chamar Gemini
	narrative, err := s.callGemini(prompt)
	if err != nil {
		// Fallback para narrativa local se Gemini falhar
		return s.generateFallbackNarrative(req)
	}

	return &NarrateResponse{
		Narrative:   narrative,
		Type:        string(req.Type),
		DataUsed:    data,
		GeneratedAt: time.Now(),
		Model:       s.model,
	}, nil
}

// GenerateDailyReport gera relatório diário
func (s *NarratorService) GenerateDailyReport() (*ReportResponse, error) {
	dashboard, err := s.cognitiveService.GetCognitiveDashboard()
	if err != nil {
		return nil, err
	}

	decisions, err := s.cognitiveService.GetDecisionStats()
	if err != nil {
		return nil, err
	}

	data := map[string]interface{}{
		"dashboard": dashboard,
		"decisions": decisions,
	}

	req := NarrateRequest{Type: NarrativeDaily}
	narrative, err := s.Narrate(req)
	if err != nil {
		return nil, err
	}

	return &ReportResponse{
		Report:      narrative.Narrative,
		Data:        data,
		Period:      "daily",
		GeneratedAt: time.Now(),
		Model:       s.model,
	}, nil
}

// GenerateWeeklyReport gera relatório semanal
func (s *NarratorService) GenerateWeeklyReport() (*ReportResponse, error) {
	dashboard, err := s.cognitiveService.GetCognitiveDashboard()
	if err != nil {
		return nil, err
	}

	trust, err := s.cognitiveService.GetTrustEvolution(7)
	if err != nil {
		return nil, err
	}

	noise, err := s.cognitiveService.GetNoisePatterns()
	if err != nil {
		return nil, err
	}

	agents, err := s.cognitiveService.GetAgentsOverview()
	if err != nil {
		return nil, err
	}

	data := map[string]interface{}{
		"dashboard": dashboard,
		"trust":     trust,
		"noise":     noise,
		"agents":    agents,
	}

	req := NarrateRequest{Type: NarrativeWeekly}
	narrative, err := s.Narrate(req)
	if err != nil {
		return nil, err
	}

	return &ReportResponse{
		Report:      narrative.Narrative,
		Data:        data,
		Period:      "weekly",
		GeneratedAt: time.Now(),
		Model:       s.model,
	}, nil
}

// ========================================
// HELPER METHODS
// ========================================

func (s *NarratorService) collectDataForNarration(narType NarrationType) (map[string]interface{}, error) {
	data := make(map[string]interface{})

	// Sempre incluir dashboard básico
	dashboard, err := s.cognitiveService.GetCognitiveDashboard()
	if err != nil {
		return nil, err
	}
	data["dashboard"] = dashboard

	switch narType {
	case NarrativeSummary:
		// Apenas dashboard básico
	case NarrativeDaily:
		decisions, _ := s.cognitiveService.GetDecisionStats()
		data["decisions"] = decisions
	case NarrativeWeekly:
		trust, _ := s.cognitiveService.GetTrustEvolution(7)
		noise, _ := s.cognitiveService.GetNoisePatterns()
		agents, _ := s.cognitiveService.GetAgentsOverview()
		data["trust"] = trust
		data["noise"] = noise
		data["agents"] = agents
	case NarrativeQuestion:
		// Incluir tudo para responder perguntas
		trust, _ := s.cognitiveService.GetTrustEvolution(30)
		noise, _ := s.cognitiveService.GetNoisePatterns()
		agents, _ := s.cognitiveService.GetAgentsOverview()
		decisions, _ := s.cognitiveService.GetDecisionStats()
		data["trust"] = trust
		data["noise"] = noise
		data["agents"] = agents
		data["decisions"] = decisions
	}

	return data, nil
}

func (s *NarratorService) buildPrompt(req NarrateRequest, data map[string]interface{}) string {
	dataJSON, _ := json.MarshalIndent(data, "", "  ")

	var specificPrompt string
	switch req.Type {
	case NarrativeSummary:
		specificPrompt = `
TAREFA: Gere um RESUMO INSTANTÂNEO do estado atual do sistema.
Responda à pergunta: "Como está o sistema agora?"
Inclua: KPIs principais, status geral, alertas ativos (se houver).
Máximo: 150 palavras.`

	case NarrativeDaily:
		specificPrompt = `
TAREFA: Gere um RELATÓRIO DIÁRIO do sistema.
Responda à pergunta: "O que aconteceu hoje?"
Inclua: sugestões geradas, decisões tomadas, padrões identificados.
Máximo: 300 palavras.`

	case NarrativeWeekly:
		specificPrompt = `
TAREFA: Gere um RELATÓRIO SEMANAL do sistema.
Responda à pergunta: "Como foi a semana?"
Inclua: tendências, evolução da confiança, padrões de ruído, desempenho dos agentes.
Máximo: 500 palavras.`

	case NarrativeQuestion:
		specificPrompt = fmt.Sprintf(`
TAREFA: Responda à seguinte PERGUNTA sobre o sistema:
"%s"
Use apenas os dados fornecidos. Não invente informações.
Se não souber, diga "Não há dados suficientes para responder."
Máximo: 200 palavras.`, req.Question)
	}

	return fmt.Sprintf(`%s

%s

DADOS DO SISTEMA (JSON):
%s

Gere a narrativa agora:`, basePrompt, specificPrompt, string(dataJSON))
}

// ========================================
// GEMINI API CALL
// ========================================

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (s *NarratorService) callGemini(prompt string) (string, error) {
	// Suporta modelos padrão e customizados
	// Modelos padrão: gemini-1.5-flash, gemini-1.5-pro
	// Modelos customizados: models/gemini-robotics-er-1.5-preview
	modelPath := s.model
	if !strings.HasPrefix(s.model, "models/") {
		modelPath = s.model
	} else {
		// Remove "models/" prefix se presente, pois a URL já inclui
		modelPath = strings.TrimPrefix(s.model, "models/")
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", modelPath, s.apiKey)

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{Text: prompt},
				},
			},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var geminiResp geminiResponse
	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return "", err
	}

	if geminiResp.Error != nil {
		return "", fmt.Errorf("gemini error: %s", geminiResp.Error.Message)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("resposta vazia do Gemini")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

// ========================================
// FALLBACK NARRATIVE (sem Gemini)
// ========================================

func (s *NarratorService) generateFallbackNarrative(req NarrateRequest) (*NarrateResponse, error) {
	dashboard, err := s.cognitiveService.GetCognitiveDashboard()
	if err != nil {
		return nil, err
	}

	var narrative strings.Builder

	switch req.Type {
	case NarrativeSummary:
		narrative.WriteString(fmt.Sprintf("📊 RESUMO DO SISTEMA\n\n"))
		narrative.WriteString(fmt.Sprintf("Total de sugestões: %d\n", dashboard.TotalSuggestions))
		narrative.WriteString(fmt.Sprintf("Sugestões nas últimas 24h: %d\n", dashboard.Suggestions24h))
		narrative.WriteString(fmt.Sprintf("Pendentes: %d\n", dashboard.PendingSuggestions))
		narrative.WriteString(fmt.Sprintf("Total de decisões: %d\n", dashboard.TotalDecisions))
		if dashboard.AvgDecisionTimeHours > 0 {
			narrative.WriteString(fmt.Sprintf("Tempo médio de decisão: %.1f horas\n", dashboard.AvgDecisionTimeHours))
		}
		if len(dashboard.ActiveKillSwitches) > 0 {
			narrative.WriteString(fmt.Sprintf("\n⚠️ ALERTA: %d kill switch(es) ativo(s)\n", len(dashboard.ActiveKillSwitches)))
		}

	case NarrativeDaily:
		narrative.WriteString(fmt.Sprintf("📅 RELATÓRIO DIÁRIO\n\n"))
		narrative.WriteString(fmt.Sprintf("Sugestões geradas hoje: %d\n", dashboard.Suggestions24h))
		narrative.WriteString(fmt.Sprintf("Decisões tomadas hoje: %d\n", dashboard.Decisions24h))
		narrative.WriteString(fmt.Sprintf("Pendentes: %d\n\n", dashboard.PendingSuggestions))
		
		narrative.WriteString("Distribuição de decisões:\n")
		for _, d := range dashboard.DecisionDistribution {
			narrative.WriteString(fmt.Sprintf("  - %s: %d (%.1f%%)\n", d.Decision, d.Count, d.Percentage))
		}

	case NarrativeWeekly:
		trust, _ := s.cognitiveService.GetTrustEvolution(7)
		noise, _ := s.cognitiveService.GetNoisePatterns()
		
		narrative.WriteString(fmt.Sprintf("📈 RELATÓRIO SEMANAL\n\n"))
		narrative.WriteString(fmt.Sprintf("Total de sugestões: %d\n", dashboard.TotalSuggestions))
		narrative.WriteString(fmt.Sprintf("Total de decisões: %d\n\n", dashboard.TotalDecisions))
		
		if trust != nil {
			narrative.WriteString(fmt.Sprintf("Tendência de confiança: %s\n", trust.TrendStatus))
		}
		
		if noise != nil && len(noise.Patterns) > 0 {
			narrative.WriteString(fmt.Sprintf("\nPadrões de ruído identificados: %d\n", len(noise.Patterns)))
			narrative.WriteString(fmt.Sprintf("Total de sugestões ignoradas: %d\n", noise.TotalNoise))
		}

	case NarrativeQuestion:
		narrative.WriteString("⚠️ Gemini não está habilitado.\n\n")
		narrative.WriteString("Para responder perguntas específicas, configure:\n")
		narrative.WriteString("- GEMINI_API_KEY\n")
		narrative.WriteString("- GEMINI_NARRATOR_ENABLED=true\n")
	}

	return &NarrateResponse{
		Narrative:   narrative.String(),
		Type:        string(req.Type),
		GeneratedAt: time.Now(),
		Model:       "fallback-local",
	}, nil
}
