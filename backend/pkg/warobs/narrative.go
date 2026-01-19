package warobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/google/uuid"
	"google.golang.org/api/option"
)

// ========================================
// NARRATIVE INTELLIGENCE SERVICE
// "O Gemini explica. O Kernel age."
// ========================================

// CognitiveSnapshot é o pacote de contexto enviado ao Gemini
type CognitiveSnapshot struct {
	KernelState     string               `json:"kernel_state"`
	RecentIncidents []IncidentSummary    `json:"recent_incidents"`
	RecentEvents    []KernelEventSummary `json:"recent_events"`
	ActivePolicies  []string             `json:"policies_active"`
	TimeWindow      string               `json:"time_window"`
}

// IncidentSummary é a versão sanitizada de um incidente para o Gemini
type IncidentSummary struct {
	Severity        string `json:"severity"`
	Metric          string `json:"metric"`
	Route           string `json:"route"`
	DurationMinutes int    `json:"duration_minutes"`
	Status          string `json:"status"`
}

// KernelEventSummary é a versão sanitizada de um evento para o Gemini
type KernelEventSummary struct {
	Type      string `json:"type"`
	Reason    string `json:"reason"`
	Source    string `json:"source"`
	Timestamp string `json:"timestamp"`
}

// NarrativeResponse é a resposta estruturada do Gemini
type NarrativeResponse struct {
	ID                uuid.UUID  `json:"id"`
	Summary           string     `json:"summary"`
	Cause             string     `json:"cause"`
	Confidence        float64    `json:"confidence"`
	RecommendedAction string     `json:"recommended_human_action"`
	Uncertainty       string     `json:"uncertainty,omitempty"`
	RelatedIncidentID *uuid.UUID `json:"related_incident_id,omitempty"`
	GeneratedAt       time.Time  `json:"generated_at"`
}

// NarrativeIntelligenceService provê explicabilidade cognitiva
type NarrativeIntelligenceService struct {
	persistence *PersistenceService
	apiKey      string
	enabled     bool
}

// NewNarrativeIntelligenceService cria o serviço de inteligência narrativa
func NewNarrativeIntelligenceService(p *PersistenceService) *NarrativeIntelligenceService {
	apiKey := os.Getenv("GEMINI_API_KEY")
	return &NarrativeIntelligenceService{
		persistence: p,
		apiKey:      apiKey,
		enabled:     apiKey != "",
	}
}

// ========================================
// CONTRATO COGNITIVO (PROMPT BASE)
// ========================================

const cognitiveContractPrompt = `You are the Narrative Intelligence of the PROST-QS Kernel.

## YOUR ROLE
You are a Narrator, NOT a Controller.

## WHAT YOU CANNOT DO
- Trigger policies or actions
- Suggest configuration changes
- Override kernel decisions
- Act in real time
- Access raw metrics or logs

## WHAT YOU MUST DO
- Explain past decisions based on the provided snapshot
- Correlate historical events to identify patterns
- Express uncertainty explicitly when data is insufficient
- Provide actionable suggestions for HUMANS to investigate

## OUTPUT FORMAT (STRICT JSON)
You MUST respond with valid JSON only, no markdown, no explanations outside JSON:
{
  "summary": "One sentence explaining what happened",
  "cause": "Technical explanation of the root cause based on evidence",
  "confidence": 0.0 to 1.0,
  "recommended_human_action": "What a human should investigate or do",
  "uncertainty": "What you don't know or couldn't determine"
}

## CONTEXT
The following is a sanitized snapshot of recent kernel activity. Analyze it and explain.
`

// ========================================
// CORE METHODS
// ========================================

// ExplainRecentActivity gera uma explicação do estado atual do Kernel
func (n *NarrativeIntelligenceService) ExplainRecentActivity(ctx context.Context) (*NarrativeResponse, error) {
	if !n.enabled {
		return n.generateFallbackNarrative("Gemini não configurado"), nil
	}

	// 1. Construir snapshot cognitivo
	snapshot, err := n.buildCognitiveSnapshot()
	if err != nil {
		return nil, fmt.Errorf("falha ao construir snapshot: %w", err)
	}

	// 2. Chamar Gemini
	response, err := n.callGemini(ctx, snapshot)
	if err != nil {
		log.Printf("⚠️ [NARRATIVE] Erro Gemini: %v. Usando fallback.", err)
		return n.generateFallbackNarrative("Erro ao consultar IA"), nil
	}

	return response, nil
}

// ExplainIncident gera uma explicação para um incidente específico
func (n *NarrativeIntelligenceService) ExplainIncident(ctx context.Context, incidentID uuid.UUID) (*NarrativeResponse, error) {
	if !n.enabled {
		return n.generateFallbackNarrative("Gemini não configurado"), nil
	}

	// Buscar incidente e eventos relacionados
	incidents, _ := n.persistence.GetRecentIncidents(24)
	var targetIncident *Incident
	for i := range incidents {
		if incidents[i].ID == incidentID {
			targetIncident = &incidents[i]
			break
		}
	}

	if targetIncident == nil {
		return nil, fmt.Errorf("incidente não encontrado: %s", incidentID)
	}

	snapshot := &CognitiveSnapshot{
		KernelState: "INVESTIGATING",
		RecentIncidents: []IncidentSummary{{
			Severity:        string(targetIncident.Severity),
			Metric:          targetIncident.MetricName,
			Route:           getFirstRoute(targetIncident.AffectedRoutes),
			DurationMinutes: int(time.Since(targetIncident.StartedAt).Minutes()),
			Status:          targetIncident.Status,
		}},
		TimeWindow: "incident context",
	}

	response, err := n.callGemini(ctx, snapshot)
	if err != nil {
		return n.generateFallbackNarrative("Erro ao analisar incidente"), nil
	}

	response.RelatedIncidentID = &incidentID
	return response, nil
}

// ========================================
// INTERNAL METHODS
// ========================================

func (n *NarrativeIntelligenceService) buildCognitiveSnapshot() (*CognitiveSnapshot, error) {
	// Buscar últimos 60 minutos de incidentes
	incidents, err := n.persistence.GetRecentIncidents(1)
	if err != nil {
		return nil, err
	}

	// Buscar últimos eventos do kernel
	events, err := n.persistence.GetRecentKernelEvents(10)
	if err != nil {
		return nil, err
	}

	// Converter para summaries (sanitizados)
	incidentSummaries := make([]IncidentSummary, 0, len(incidents))
	for _, inc := range incidents {
		incidentSummaries = append(incidentSummaries, IncidentSummary{
			Severity:        string(inc.Severity),
			Metric:          inc.MetricName,
			Route:           getFirstRoute(inc.AffectedRoutes),
			DurationMinutes: int(time.Since(inc.StartedAt).Minutes()),
			Status:          inc.Status,
		})
	}

	eventSummaries := make([]KernelEventSummary, 0, len(events))
	for _, evt := range events {
		eventSummaries = append(eventSummaries, KernelEventSummary{
			Type:      evt.EventType,
			Reason:    evt.Description,
			Source:    evt.Source,
			Timestamp: evt.CreatedAt.Format(time.RFC3339),
		})
	}

	// Determinar estado do kernel
	state := "NORMAL"
	for _, inc := range incidents {
		if inc.Status == "OPEN" && inc.Severity == SeverityCritical {
			state = "DEFENSIVE"
			break
		}
	}

	// Políticas ativas (simplificado)
	activePolicies := []string{}
	for _, evt := range events {
		if evt.EventType == "AUTO_DEFENSE_ACTION" {
			activePolicies = append(activePolicies, "POLICY_001_CIRCUIT_BREAKER")
			break
		}
	}

	return &CognitiveSnapshot{
		KernelState:     state,
		RecentIncidents: incidentSummaries,
		RecentEvents:    eventSummaries,
		ActivePolicies:  activePolicies,
		TimeWindow:      "last 60 minutes",
	}, nil
}

func (n *NarrativeIntelligenceService) callGemini(ctx context.Context, snapshot *CognitiveSnapshot) (*NarrativeResponse, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(n.apiKey))
	if err != nil {
		return nil, fmt.Errorf("falha ao criar cliente Gemini: %w", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-1.5-flash")
	model.SetTemperature(0.2) // Baixa temperatura para respostas consistentes

	// Serializar snapshot
	snapshotJSON, _ := json.MarshalIndent(snapshot, "", "  ")

	prompt := cognitiveContractPrompt + "\n\n## KERNEL SNAPSHOT\n```json\n" + string(snapshotJSON) + "\n```"

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, fmt.Errorf("falha na geração: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("IA não retornou resposta")
	}

	// Extrair texto
	rawText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])

	// Parse JSON
	var narrative NarrativeResponse
	if err := json.Unmarshal([]byte(rawText), &narrative); err != nil {
		// Se falhar o parse, criar resposta com o texto raw
		log.Printf("⚠️ [NARRATIVE] Resposta não-JSON do Gemini: %s", rawText)
		return &NarrativeResponse{
			ID:          uuid.New(),
			Summary:     rawText,
			Confidence:  0.5,
			GeneratedAt: time.Now(),
		}, nil
	}

	narrative.ID = uuid.New()
	narrative.GeneratedAt = time.Now()

	return &narrative, nil
}

func (n *NarrativeIntelligenceService) generateFallbackNarrative(reason string) *NarrativeResponse {
	return &NarrativeResponse{
		ID:                uuid.New(),
		Summary:           "Análise automática indisponível: " + reason,
		Cause:             "Serviço de inteligência narrativa não pôde processar esta solicitação.",
		Confidence:        0.0,
		RecommendedAction: "Consultar logs do sistema manualmente.",
		Uncertainty:       "Dados não analisados pela IA.",
		GeneratedAt:       time.Now(),
	}
}

func getFirstRoute(routes []string) string {
	if len(routes) > 0 {
		return routes[0]
	}
	return "unknown"
}
