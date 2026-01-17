package aihub

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler handles AI Hub HTTP requests
type Handler struct {
	service *Service
}

// NewHandler creates a new AI Hub handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers AI Hub routes
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	ai := r.Group("/ai")
	{
		// Chat
		ai.POST("/chat", h.Chat)
		ai.POST("/chat/stream", h.ChatStream)
		ai.POST("/configure", h.ConfigureFromChat)
		
		// Conversations
		ai.GET("/conversations", h.ListConversations)
		ai.GET("/conversations/:id", h.GetConversation)
		ai.DELETE("/conversations/:id", h.DeleteConversation)
		
		// Providers
		ai.GET("/providers", h.ListProviders)
		ai.POST("/providers", h.ConfigureProvider)
		ai.DELETE("/providers/:provider", h.RemoveProvider)
		
		// Actions
		ai.GET("/actions", h.ListActions)
	}
}

// Chat handles chat requests
func (h *Handler) Chat(c *gin.Context) {
	appID := c.GetString("app_id")
	userID := c.GetString("user_id")

	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.service.Chat(c.Request.Context(), appID, userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// ChatStream handles streaming chat requests
func (h *Handler) ChatStream(c *gin.Context) {
	appID := c.GetString("app_id")
	userID := c.GetString("user_id")

	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.Stream = true

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// Get provider
	provider := req.Provider
	if provider == "" {
		provider = h.service.defaultProvider
	}

	p, err := h.service.GetProvider(provider)
	if err != nil {
		c.SSEvent("error", gin.H{"error": err.Error()})
		return
	}

	// Build messages
	var messages []Message
	if req.ConversationID != "" {
		conv, err := h.service.GetConversation(req.ConversationID)
		if err == nil {
			messages = conv.Messages
		}
	}
	messages = append(messages, Message{Role: "user", Content: req.Message})

	// Stream response
	systemPrompt := h.service.buildSystemPrompt(appID, userID, req.SystemPrompt)
	
	response, err := p.ChatStream(c.Request.Context(), messages, systemPrompt, func(chunk string) {
		c.SSEvent("chunk", gin.H{"content": chunk})
		c.Writer.Flush()
	})

	if err != nil {
		c.SSEvent("error", gin.H{"error": err.Error()})
		return
	}

	c.SSEvent("done", gin.H{
		"message":  response,
		"provider": provider,
		"model":    p.GetModel(),
	})
}

// ListConversations lists user conversations
func (h *Handler) ListConversations(c *gin.Context) {
	appID := c.GetString("app_id")
	userID := c.GetString("user_id")

	convs, err := h.service.ListConversations(appID, userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"conversations": convs})
}

// GetConversation gets a specific conversation
func (h *Handler) GetConversation(c *gin.Context) {
	id := c.Param("id")

	conv, err := h.service.GetConversation(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	c.JSON(http.StatusOK, conv)
}

// DeleteConversation deletes a conversation
func (h *Handler) DeleteConversation(c *gin.Context) {
	id := c.Param("id")

	if err := h.service.DeleteConversation(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Conversation deleted"})
}

// ListProviders lists configured providers
func (h *Handler) ListProviders(c *gin.Context) {
	appID := c.GetString("app_id")

	providers, err := h.service.ListProviders(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"providers": providers})
}

// ConfigureProvider configures an AI provider
func (h *Handler) ConfigureProvider(c *gin.Context) {
	appID := c.GetString("app_id")

	var req struct {
		Provider  Provider `json:"provider" binding:"required"`
		APIKey    string   `json:"api_key" binding:"required"`
		Model     string   `json:"model"`
		IsDefault bool     `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ConfigureProvider(appID, req.Provider, req.APIKey, req.Model, req.IsDefault); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Provider configured successfully"})
}

// RemoveProvider removes a provider configuration
func (h *Handler) RemoveProvider(c *gin.Context) {
	appID := c.GetString("app_id")
	provider := c.Param("provider")

	err := h.service.db.Where("app_id = ? AND provider = ?", appID, provider).Delete(&ProviderConfig{}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Provider removed"})
}

// ListActions lists available AI actions
func (h *Handler) ListActions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"actions": AvailableActions})
}

// QuickChat is a simplified chat endpoint for quick interactions
func (h *Handler) QuickChat(c *gin.Context) {
	appID := c.GetString("app_id")
	userID := c.GetString("user_id")

	var req struct {
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.service.Chat(c.Request.Context(), appID, userID, ChatRequest{
		Message: req.Message,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": resp.Message.Content,
		"provider": resp.Provider,
	})
}

// ConfigureFromChat allows configuring providers via chat command
// Example: "configure gemini AIzaSy..."
func (h *Handler) ConfigureFromChat(c *gin.Context) {
	appID := c.GetString("app_id")

	var req struct {
		Command string `json:"command" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse command: "configure <provider> <api_key> [model]"
	var provider, apiKey, model string
	parts := splitCommand(req.Command)
	
	if len(parts) < 3 || parts[0] != "configure" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid command. Use: configure <provider> <api_key> [model]"})
		return
	}

	provider = parts[1]
	apiKey = parts[2]
	if len(parts) > 3 {
		model = parts[3]
	}

	if err := h.service.ConfigureProvider(appID, Provider(provider), apiKey, model, true); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Provider " + provider + " configurado com sucesso!",
		"provider": provider,
		"model": model,
	})
}

func splitCommand(cmd string) []string {
	var parts []string
	var current string
	inQuote := false
	
	for _, r := range cmd {
		if r == '"' {
			inQuote = !inQuote
		} else if r == ' ' && !inQuote {
			if current != "" {
				parts = append(parts, current)
				current = ""
			}
		} else {
			current += string(r)
		}
	}
	if current != "" {
		parts = append(parts, current)
	}
	return parts
}

// Middleware to inject default Gemini provider if configured via env
func (h *Handler) InjectDefaultProvider() gin.HandlerFunc {
	return func(c *gin.Context) {
		appID := c.GetString("app_id")
		
		// Try to load providers for this app
		h.service.LoadProviders(appID)
		
		c.Next()
	}
}
