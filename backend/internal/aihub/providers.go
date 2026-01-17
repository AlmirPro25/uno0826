package aihub

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// AIProvider interface for all AI providers
type AIProvider interface {
	Chat(ctx context.Context, messages []Message, systemPrompt string) (*Message, error)
	ChatStream(ctx context.Context, messages []Message, systemPrompt string, onChunk func(string)) (*Message, error)
	GetName() Provider
	GetModel() string
}

// =============================================================================
// GEMINI PROVIDER (Primary)
// =============================================================================

type GeminiProvider struct {
	apiKey string
	model  string
}

func NewGeminiProvider(apiKey, model string) *GeminiProvider {
	if model == "" {
		model = "gemini-1.5-flash"
	}
	return &GeminiProvider{apiKey: apiKey, model: model}
}

func (g *GeminiProvider) GetName() Provider { return ProviderGemini }
func (g *GeminiProvider) GetModel() string  { return g.model }

func (g *GeminiProvider) Chat(ctx context.Context, messages []Message, systemPrompt string) (*Message, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", g.model, g.apiKey)

	// Build contents array
	contents := make([]map[string]interface{}, 0)
	
	// Add system instruction if provided
	systemInstruction := map[string]interface{}{}
	if systemPrompt != "" {
		systemInstruction = map[string]interface{}{
			"parts": []map[string]string{{"text": systemPrompt}},
		}
	}

	for _, msg := range messages {
		role := "user"
		if msg.Role == "assistant" {
			role = "model"
		}
		contents = append(contents, map[string]interface{}{
			"role":  role,
			"parts": []map[string]string{{"text": msg.Content}},
		})
	}

	reqBody := map[string]interface{}{
		"contents": contents,
		"generationConfig": map[string]interface{}{
			"temperature":     0.7,
			"maxOutputTokens": 8192,
		},
	}
	
	if systemPrompt != "" {
		reqBody["systemInstruction"] = systemInstruction
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gemini request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("gemini error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
		UsageMetadata struct {
			PromptTokenCount     int `json:"promptTokenCount"`
			CandidatesTokenCount int `json:"candidatesTokenCount"`
		} `json:"usageMetadata"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse gemini response: %w", err)
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty response from gemini")
	}

	return &Message{
		ID:        fmt.Sprintf("msg_%d", time.Now().UnixNano()),
		Role:      "assistant",
		Content:   result.Candidates[0].Content.Parts[0].Text,
		Provider:  ProviderGemini,
		Model:     g.model,
		Timestamp: time.Now(),
		Tokens:    result.UsageMetadata.CandidatesTokenCount,
	}, nil
}

func (g *GeminiProvider) ChatStream(ctx context.Context, messages []Message, systemPrompt string, onChunk func(string)) (*Message, error) {
	// For now, use non-streaming and simulate chunks
	msg, err := g.Chat(ctx, messages, systemPrompt)
	if err != nil {
		return nil, err
	}
	
	// Simulate streaming by sending chunks
	words := strings.Split(msg.Content, " ")
	for i, word := range words {
		if i > 0 {
			onChunk(" ")
		}
		onChunk(word)
	}
	
	return msg, nil
}

// =============================================================================
// OPENAI PROVIDER
// =============================================================================

type OpenAIProvider struct {
	apiKey string
	model  string
}

func NewOpenAIProvider(apiKey, model string) *OpenAIProvider {
	if model == "" {
		model = "gpt-4o-mini"
	}
	return &OpenAIProvider{apiKey: apiKey, model: model}
}

func (o *OpenAIProvider) GetName() Provider { return ProviderOpenAI }
func (o *OpenAIProvider) GetModel() string  { return o.model }

func (o *OpenAIProvider) Chat(ctx context.Context, messages []Message, systemPrompt string) (*Message, error) {
	url := "https://api.openai.com/v1/chat/completions"

	// Build messages array
	openaiMessages := make([]map[string]string, 0)
	
	if systemPrompt != "" {
		openaiMessages = append(openaiMessages, map[string]string{
			"role":    "system",
			"content": systemPrompt,
		})
	}

	for _, msg := range messages {
		openaiMessages = append(openaiMessages, map[string]string{
			"role":    msg.Role,
			"content": msg.Content,
		})
	}

	reqBody := map[string]interface{}{
		"model":       o.model,
		"messages":    openaiMessages,
		"temperature": 0.7,
		"max_tokens":  4096,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+o.apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("openai request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("openai error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			CompletionTokens int `json:"completion_tokens"`
		} `json:"usage"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse openai response: %w", err)
	}

	if len(result.Choices) == 0 {
		return nil, fmt.Errorf("empty response from openai")
	}

	return &Message{
		ID:        fmt.Sprintf("msg_%d", time.Now().UnixNano()),
		Role:      "assistant",
		Content:   result.Choices[0].Message.Content,
		Provider:  ProviderOpenAI,
		Model:     o.model,
		Timestamp: time.Now(),
		Tokens:    result.Usage.CompletionTokens,
	}, nil
}

func (o *OpenAIProvider) ChatStream(ctx context.Context, messages []Message, systemPrompt string, onChunk func(string)) (*Message, error) {
	msg, err := o.Chat(ctx, messages, systemPrompt)
	if err != nil {
		return nil, err
	}
	onChunk(msg.Content)
	return msg, nil
}

// =============================================================================
// ANTHROPIC PROVIDER
// =============================================================================

type AnthropicProvider struct {
	apiKey string
	model  string
}

func NewAnthropicProvider(apiKey, model string) *AnthropicProvider {
	if model == "" {
		model = "claude-3-haiku-20240307"
	}
	return &AnthropicProvider{apiKey: apiKey, model: model}
}

func (a *AnthropicProvider) GetName() Provider { return ProviderAnthropic }
func (a *AnthropicProvider) GetModel() string  { return a.model }

func (a *AnthropicProvider) Chat(ctx context.Context, messages []Message, systemPrompt string) (*Message, error) {
	url := "https://api.anthropic.com/v1/messages"

	// Build messages array
	anthropicMessages := make([]map[string]string, 0)
	for _, msg := range messages {
		anthropicMessages = append(anthropicMessages, map[string]string{
			"role":    msg.Role,
			"content": msg.Content,
		})
	}

	reqBody := map[string]interface{}{
		"model":      a.model,
		"messages":   anthropicMessages,
		"max_tokens": 4096,
	}
	
	if systemPrompt != "" {
		reqBody["system"] = systemPrompt
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", a.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("anthropic request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("anthropic error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
		Usage struct {
			OutputTokens int `json:"output_tokens"`
		} `json:"usage"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse anthropic response: %w", err)
	}

	if len(result.Content) == 0 {
		return nil, fmt.Errorf("empty response from anthropic")
	}

	return &Message{
		ID:        fmt.Sprintf("msg_%d", time.Now().UnixNano()),
		Role:      "assistant",
		Content:   result.Content[0].Text,
		Provider:  ProviderAnthropic,
		Model:     a.model,
		Timestamp: time.Now(),
		Tokens:    result.Usage.OutputTokens,
	}, nil
}

func (a *AnthropicProvider) ChatStream(ctx context.Context, messages []Message, systemPrompt string, onChunk func(string)) (*Message, error) {
	msg, err := a.Chat(ctx, messages, systemPrompt)
	if err != nil {
		return nil, err
	}
	onChunk(msg.Content)
	return msg, nil
}
