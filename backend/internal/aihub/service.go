package aihub

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Service is the main AI Hub service
type Service struct {
	db            *gorm.DB
	providers     map[Provider]AIProvider
	defaultProvider Provider
	mu            sync.RWMutex
	
	// System context providers (injected)
	getTelemetry    func(appID string, limit int) ([]interface{}, error)
	getHealth       func() (map[string]interface{}, error)
	getAlerts       func(appID string) ([]interface{}, error)
	generateAPIKey  func(appID, name string, perms []string) (string, error)
	getLogs         func(limit int, level string) ([]interface{}, error)
	getBilling      func(appID string) (map[string]interface{}, error)
	listApps        func(userID string) ([]interface{}, error)
	createRule      func(appID, name, condition, action string) error
	executeKillswitch func(appID, reason string) error
}

// NewService creates a new AI Hub service
func NewService(db *gorm.DB) *Service {
	s := &Service{
		db:        db,
		providers: make(map[Provider]AIProvider),
		defaultProvider: ProviderGemini,
	}
	
	// Auto-configure Gemini from environment if available
	if apiKey := os.Getenv("GEMINI_API_KEY"); apiKey != "" {
		s.providers[ProviderGemini] = NewGeminiProvider(apiKey, "")
	}
	
	return s
}

// SetSystemContextProviders injects system context functions
func (s *Service) SetSystemContextProviders(
	getTelemetry func(appID string, limit int) ([]interface{}, error),
	getHealth func() (map[string]interface{}, error),
	getAlerts func(appID string) ([]interface{}, error),
	generateAPIKey func(appID, name string, perms []string) (string, error),
	getLogs func(limit int, level string) ([]interface{}, error),
	getBilling func(appID string) (map[string]interface{}, error),
	listApps func(userID string) ([]interface{}, error),
	createRule func(appID, name, condition, action string) error,
	executeKillswitch func(appID, reason string) error,
) {
	s.getTelemetry = getTelemetry
	s.getHealth = getHealth
	s.getAlerts = getAlerts
	s.generateAPIKey = generateAPIKey
	s.getLogs = getLogs
	s.getBilling = getBilling
	s.listApps = listApps
	s.createRule = createRule
	s.executeKillswitch = executeKillswitch
}

// ConfigureProvider adds or updates an AI provider
func (s *Service) ConfigureProvider(appID string, provider Provider, apiKey, model string, isDefault bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Create provider instance
	var p AIProvider
	switch provider {
	case ProviderGemini:
		p = NewGeminiProvider(apiKey, model)
	case ProviderOpenAI:
		p = NewOpenAIProvider(apiKey, model)
	case ProviderAnthropic:
		p = NewAnthropicProvider(apiKey, model)
	default:
		return fmt.Errorf("unknown provider: %s", provider)
	}

	s.providers[provider] = p
	
	if isDefault {
		s.defaultProvider = provider
	}

	// Save to database using GORM
	config := ProviderConfig{
		ID:        uuid.New().String(),
		AppID:     appID,
		Provider:  provider,
		APIKey:    apiKey,
		Model:     model,
		IsDefault: isDefault,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	// Upsert: update if exists, create if not
	result := s.db.Where("app_id = ? AND provider = ?", appID, provider).First(&ProviderConfig{})
	if result.Error == gorm.ErrRecordNotFound {
		return s.db.Create(&config).Error
	}
	return s.db.Model(&ProviderConfig{}).Where("app_id = ? AND provider = ?", appID, provider).Updates(map[string]interface{}{
		"api_key":    apiKey,
		"model":      model,
		"is_default": isDefault,
		"updated_at": time.Now(),
	}).Error
}

// LoadProviders loads all configured providers from database
func (s *Service) LoadProviders(appID string) error {
	var configs []ProviderConfig
	if err := s.db.Where("app_id = ? AND is_active = ?", appID, true).Find(&configs).Error; err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, cfg := range configs {
		var p AIProvider
		switch cfg.Provider {
		case ProviderGemini:
			p = NewGeminiProvider(cfg.APIKey, cfg.Model)
		case ProviderOpenAI:
			p = NewOpenAIProvider(cfg.APIKey, cfg.Model)
		case ProviderAnthropic:
			p = NewAnthropicProvider(cfg.APIKey, cfg.Model)
		}

		if p != nil {
			s.providers[cfg.Provider] = p
			if cfg.IsDefault {
				s.defaultProvider = cfg.Provider
			}
		}
	}

	return nil
}

// GetProvider returns a provider by name
func (s *Service) GetProvider(provider Provider) (AIProvider, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if provider == "" {
		provider = s.defaultProvider
	}

	p, ok := s.providers[provider]
	if !ok {
		return nil, fmt.Errorf("provider %s not configured", provider)
	}
	return p, nil
}

// Chat sends a message and gets a response
func (s *Service) Chat(ctx context.Context, appID, userID string, req ChatRequest) (*ChatResponse, error) {
	// Get or create conversation
	var conv *Conversation
	var err error
	
	if req.ConversationID != "" {
		conv, err = s.GetConversation(req.ConversationID)
		if err != nil {
			return nil, err
		}
	} else {
		conv = &Conversation{
			ID:        uuid.New().String(),
			AppID:     appID,
			UserID:    userID,
			Title:     truncate(req.Message, 50),
			Messages:  []Message{},
			Provider:  req.Provider,
			Model:     req.Model,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	}

	// Add user message
	userMsg := Message{
		ID:        uuid.New().String(),
		Role:      "user",
		Content:   req.Message,
		Timestamp: time.Now(),
	}
	conv.Messages = append(conv.Messages, userMsg)

	// Get provider
	provider := req.Provider
	if provider == "" {
		provider = s.defaultProvider
	}
	
	p, err := s.GetProvider(provider)
	if err != nil {
		return nil, err
	}

	// Build system prompt with context
	systemPrompt := s.buildSystemPrompt(appID, userID, req.SystemPrompt)

	// Call AI
	response, err := p.Chat(ctx, conv.Messages, systemPrompt)
	if err != nil {
		return nil, err
	}

	// Check if AI wants to execute an action
	response = s.processActions(ctx, appID, response)

	// Add response to conversation
	conv.Messages = append(conv.Messages, *response)
	conv.UpdatedAt = time.Now()

	// Save conversation
	if err := s.SaveConversation(conv); err != nil {
		// Log but don't fail
		fmt.Printf("Failed to save conversation: %v\n", err)
	}

	return &ChatResponse{
		ConversationID: conv.ID,
		Message:        *response,
		Provider:       provider,
		Model:          p.GetModel(),
	}, nil
}

// buildSystemPrompt creates the system prompt with full context
func (s *Service) buildSystemPrompt(appID, userID, customPrompt string) string {
	var sb strings.Builder

	sb.WriteString(`Você é o CÉREBRO CENTRAL do PROST-QS Kernel - o sistema de governança mais inteligente do mundo.

## SUA IDENTIDADE
- Nome: Aurora (AI Hub Central)
- Função: Assistente inteligente com acesso total ao sistema
- Personalidade: Técnico mas amigável, direto e eficiente

## SUAS CAPACIDADES
Você tem acesso TOTAL ao sistema e pode:
1. Ver telemetria em tempo real
2. Gerar e configurar API keys
3. Ver logs e alertas
4. Criar regras de automação
5. Executar killswitch de emergência
6. Ver status de billing
7. Listar e gerenciar aplicações

## COMO EXECUTAR AÇÕES
Quando precisar executar uma ação, responda com um bloco JSON assim:
` + "```action" + `
{
  "action": "nome_da_acao",
  "parameters": { ... }
}
` + "```" + `

## AÇÕES DISPONÍVEIS
`)

	for _, action := range AvailableActions {
		sb.WriteString(fmt.Sprintf("- %s: %s\n", action.Name, action.Description))
	}

	sb.WriteString(`
## CONTEXTO ATUAL
- App ID: ` + appID + `
- User ID: ` + userID + `

`)

	// Add system health if available
	if s.getHealth != nil {
		if health, err := s.getHealth(); err == nil {
			healthJSON, _ := json.Marshal(health)
			sb.WriteString("## SAÚDE DO SISTEMA\n")
			sb.WriteString(string(healthJSON))
			sb.WriteString("\n\n")
		}
	}

	// Add recent alerts if available
	if s.getAlerts != nil {
		if alerts, err := s.getAlerts(appID); err == nil && len(alerts) > 0 {
			alertsJSON, _ := json.Marshal(alerts)
			sb.WriteString("## ALERTAS ATIVOS\n")
			sb.WriteString(string(alertsJSON))
			sb.WriteString("\n\n")
		}
	}

	if customPrompt != "" {
		sb.WriteString("## INSTRUÇÕES ADICIONAIS\n")
		sb.WriteString(customPrompt)
		sb.WriteString("\n\n")
	}

	sb.WriteString(`
## REGRAS
1. Seja direto e técnico
2. Quando executar ações, explique o que está fazendo
3. Se algo der errado, explique claramente
4. Sempre confirme ações críticas antes de executar
5. Responda em português brasileiro
`)

	return sb.String()
}

// processActions checks if the AI response contains actions and executes them
func (s *Service) processActions(ctx context.Context, appID string, msg *Message) *Message {
	content := msg.Content
	
	// Look for action blocks
	if !strings.Contains(content, "```action") {
		return msg
	}

	// Extract action JSON
	start := strings.Index(content, "```action")
	end := strings.Index(content[start+9:], "```")
	if end == -1 {
		return msg
	}

	actionJSON := strings.TrimSpace(content[start+9 : start+9+end])
	
	var action struct {
		Action     string                 `json:"action"`
		Parameters map[string]interface{} `json:"parameters"`
	}
	
	if err := json.Unmarshal([]byte(actionJSON), &action); err != nil {
		return msg
	}

	// Execute action
	result := s.executeAction(ctx, appID, action.Action, action.Parameters)
	
	// Append result to message
	resultJSON, _ := json.Marshal(result)
	msg.Content = content[:start] + "\n\n**Resultado da ação:**\n```json\n" + string(resultJSON) + "\n```"
	
	return msg
}

// executeAction executes a system action
func (s *Service) executeAction(ctx context.Context, appID, actionName string, params map[string]interface{}) ActionResult {
	result := ActionResult{
		Action:    actionName,
		Timestamp: time.Now(),
	}

	switch actionName {
	case "get_telemetry":
		if s.getTelemetry != nil {
			limit := 10
			if l, ok := params["limit"].(float64); ok {
				limit = int(l)
			}
			data, err := s.getTelemetry(appID, limit)
			if err != nil {
				result.Error = err.Error()
			} else {
				result.Success = true
				result.Result = data
			}
		}

	case "get_system_health":
		if s.getHealth != nil {
			data, err := s.getHealth()
			if err != nil {
				result.Error = err.Error()
			} else {
				result.Success = true
				result.Result = data
			}
		}

	case "get_alerts":
		if s.getAlerts != nil {
			data, err := s.getAlerts(appID)
			if err != nil {
				result.Error = err.Error()
			} else {
				result.Success = true
				result.Result = data
			}
		}

	case "generate_api_key":
		if s.generateAPIKey != nil {
			name, _ := params["name"].(string)
			perms := []string{}
			if p, ok := params["permissions"].([]interface{}); ok {
				for _, v := range p {
					if s, ok := v.(string); ok {
						perms = append(perms, s)
					}
				}
			}
			key, err := s.generateAPIKey(appID, name, perms)
			if err != nil {
				result.Error = err.Error()
			} else {
				result.Success = true
				result.Result = map[string]string{"api_key": key}
			}
		}

	case "get_logs":
		if s.getLogs != nil {
			limit := 50
			level := ""
			if l, ok := params["limit"].(float64); ok {
				limit = int(l)
			}
			if lv, ok := params["level"].(string); ok {
				level = lv
			}
			data, err := s.getLogs(limit, level)
			if err != nil {
				result.Error = err.Error()
			} else {
				result.Success = true
				result.Result = data
			}
		}

	case "get_billing_status":
		if s.getBilling != nil {
			data, err := s.getBilling(appID)
			if err != nil {
				result.Error = err.Error()
			} else {
				result.Success = true
				result.Result = data
			}
		}

	case "configure_provider":
		provider, _ := params["provider"].(string)
		apiKey, _ := params["api_key"].(string)
		model, _ := params["model"].(string)
		
		err := s.ConfigureProvider(appID, Provider(provider), apiKey, model, true)
		if err != nil {
			result.Error = err.Error()
		} else {
			result.Success = true
			result.Result = map[string]string{"message": "Provider configurado com sucesso"}
		}

	default:
		result.Error = fmt.Sprintf("Ação desconhecida: %s", actionName)
	}

	return result
}

// SaveConversation saves a conversation to the database
func (s *Service) SaveConversation(conv *Conversation) error {
	messagesJSON, _ := json.Marshal(conv.Messages)
	
	// Check if conversation exists
	var existing Conversation
	result := s.db.Where("id = ?", conv.ID).First(&existing)
	
	if result.Error == gorm.ErrRecordNotFound {
		// Create new
		return s.db.Exec(`
			INSERT INTO ai_conversations (id, app_id, user_id, title, messages, provider, model, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, conv.ID, conv.AppID, conv.UserID, conv.Title, messagesJSON, conv.Provider, conv.Model, conv.CreatedAt, conv.UpdatedAt).Error
	}
	
	// Update existing
	return s.db.Exec(`
		UPDATE ai_conversations SET messages = ?, updated_at = ? WHERE id = ?
	`, messagesJSON, conv.UpdatedAt, conv.ID).Error
}

// GetConversation retrieves a conversation by ID
func (s *Service) GetConversation(id string) (*Conversation, error) {
	var conv Conversation
	var messagesJSON []byte
	
	row := s.db.Raw(`
		SELECT id, app_id, user_id, title, messages, provider, model, created_at, updated_at
		FROM ai_conversations WHERE id = ?
	`, id).Row()
	
	err := row.Scan(&conv.ID, &conv.AppID, &conv.UserID, &conv.Title, &messagesJSON, &conv.Provider, &conv.Model, &conv.CreatedAt, &conv.UpdatedAt)
	if err != nil {
		return nil, err
	}
	
	json.Unmarshal(messagesJSON, &conv.Messages)
	return &conv, nil
}

// ListConversations lists conversations for a user
func (s *Service) ListConversations(appID, userID string, limit int) ([]Conversation, error) {
	var convs []Conversation
	
	rows, err := s.db.Raw(`
		SELECT id, app_id, user_id, title, provider, model, created_at, updated_at
		FROM ai_conversations 
		WHERE app_id = ? AND user_id = ?
		ORDER BY updated_at DESC
		LIMIT ?
	`, appID, userID, limit).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var conv Conversation
		if err := rows.Scan(&conv.ID, &conv.AppID, &conv.UserID, &conv.Title, &conv.Provider, &conv.Model, &conv.CreatedAt, &conv.UpdatedAt); err != nil {
			continue
		}
		convs = append(convs, conv)
	}
	
	return convs, nil
}

// DeleteConversation deletes a conversation
func (s *Service) DeleteConversation(id string) error {
	return s.db.Exec("DELETE FROM ai_conversations WHERE id = ?", id).Error
}

// ListProviders returns configured providers for an app
func (s *Service) ListProviders(appID string) ([]ProviderConfig, error) {
	var configs []ProviderConfig
	err := s.db.Where("app_id = ?", appID).Find(&configs).Error
	return configs, err
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}
