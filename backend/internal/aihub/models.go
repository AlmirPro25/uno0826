// Package aihub implements the AI Hub - Central Intelligence for PROST-QS Kernel
// This is the brain that connects multiple AI providers and has full system access
package aihub

import (
	"time"
)

// Provider represents an AI provider (OpenAI, Anthropic, Google, etc)
type Provider string

const (
	ProviderGemini    Provider = "gemini"
	ProviderOpenAI    Provider = "openai"
	ProviderAnthropic Provider = "anthropic"
	ProviderLocal     Provider = "local" // For future local models
)

// ProviderConfig stores API configuration for each provider
type ProviderConfig struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	AppID     string    `json:"app_id" gorm:"type:varchar(36);index:idx_provider_app"`
	Provider  Provider  `json:"provider" gorm:"type:varchar(20);index:idx_provider_app"`
	APIKey    string    `json:"-" gorm:"type:text"` // Never expose in JSON
	Model     string    `json:"model" gorm:"type:varchar(100)"`
	IsDefault bool      `json:"is_default" gorm:"default:false"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName returns the table name for GORM
func (ProviderConfig) TableName() string {
	return "ai_provider_configs"
}

// AIConversation represents a chat conversation (GORM model)
type AIConversation struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	AppID     string    `json:"app_id" gorm:"type:varchar(36);index:idx_conv_app_user"`
	UserID    string    `json:"user_id" gorm:"type:varchar(36);index:idx_conv_app_user"`
	Title     string    `json:"title" gorm:"type:varchar(255)"`
	Messages  string    `json:"-" gorm:"type:text"` // JSON stored as text
	Provider  Provider  `json:"provider" gorm:"type:varchar(20)"`
	Model     string    `json:"model" gorm:"type:varchar(100)"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName returns the table name for GORM
func (AIConversation) TableName() string {
	return "ai_conversations"
}

// Message represents a chat message (not stored directly, part of Conversation.Messages JSON)
type Message struct {
	ID        string    `json:"id"`
	Role      string    `json:"role"` // user, assistant, system
	Content   string    `json:"content"`
	Provider  Provider  `json:"provider,omitempty"`
	Model     string    `json:"model,omitempty"`
	Timestamp time.Time `json:"timestamp"`
	Tokens    int       `json:"tokens,omitempty"`
}

// Conversation represents a chat conversation (used in service layer)
type Conversation struct {
	ID        string    `json:"id"`
	AppID     string    `json:"app_id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Messages  []Message `json:"messages"`
	Provider  Provider  `json:"provider"`
	Model     string    `json:"model"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ChatRequest represents a request to the AI Hub
type ChatRequest struct {
	ConversationID string   `json:"conversation_id,omitempty"`
	Message        string   `json:"message"`
	Provider       Provider `json:"provider,omitempty"` // Optional, uses default if not set
	Model          string   `json:"model,omitempty"`
	SystemPrompt   string   `json:"system_prompt,omitempty"`
	Stream         bool     `json:"stream,omitempty"`
}

// ChatResponse represents a response from the AI Hub
type ChatResponse struct {
	ConversationID string   `json:"conversation_id"`
	Message        Message  `json:"message"`
	Provider       Provider `json:"provider"`
	Model          string   `json:"model"`
	Tokens         struct {
		Input  int `json:"input"`
		Output int `json:"output"`
		Total  int `json:"total"`
	} `json:"tokens"`
}

// SystemContext contains all system data the AI can access
type SystemContext struct {
	// User context
	UserID   string `json:"user_id"`
	UserRole string `json:"user_role"`
	AppID    string `json:"app_id"`
	AppName  string `json:"app_name"`

	// System state
	SystemHealth    map[string]interface{} `json:"system_health"`
	RecentEvents    []interface{}          `json:"recent_events"`
	RecentTelemetry []interface{}          `json:"recent_telemetry"`
	ActiveAlerts    []interface{}          `json:"active_alerts"`
	
	// Capabilities
	AvailableActions []string `json:"available_actions"`
}

// AIAction represents an action the AI can execute
type AIAction struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Parameters  map[string]interface{} `json:"parameters"`
	RequiresApproval bool              `json:"requires_approval"`
}

// ActionResult represents the result of an AI action
type ActionResult struct {
	Action    string      `json:"action"`
	Success   bool        `json:"success"`
	Result    interface{} `json:"result,omitempty"`
	Error     string      `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// Available AI Actions (the AI can call these)
var AvailableActions = []AIAction{
	{
		Name:        "generate_api_key",
		Description: "Generate a new API key for the current application",
		Parameters:  map[string]interface{}{"name": "string", "permissions": "[]string"},
		RequiresApproval: false,
	},
	{
		Name:        "get_telemetry",
		Description: "Get recent telemetry events",
		Parameters:  map[string]interface{}{"limit": "int", "type": "string"},
		RequiresApproval: false,
	},
	{
		Name:        "get_system_health",
		Description: "Get current system health status",
		Parameters:  map[string]interface{}{},
		RequiresApproval: false,
	},
	{
		Name:        "create_rule",
		Description: "Create a new automation rule",
		Parameters:  map[string]interface{}{"name": "string", "condition": "string", "action": "string"},
		RequiresApproval: true,
	},
	{
		Name:        "configure_provider",
		Description: "Configure an AI provider with API key",
		Parameters:  map[string]interface{}{"provider": "string", "api_key": "string", "model": "string"},
		RequiresApproval: false,
	},
	{
		Name:        "get_logs",
		Description: "Get recent system logs",
		Parameters:  map[string]interface{}{"limit": "int", "level": "string"},
		RequiresApproval: false,
	},
	{
		Name:        "get_alerts",
		Description: "Get active alerts",
		Parameters:  map[string]interface{}{},
		RequiresApproval: false,
	},
	{
		Name:        "execute_killswitch",
		Description: "Execute emergency killswitch for an application",
		Parameters:  map[string]interface{}{"app_id": "string", "reason": "string"},
		RequiresApproval: true,
	},
	{
		Name:        "get_billing_status",
		Description: "Get billing and usage status",
		Parameters:  map[string]interface{}{},
		RequiresApproval: false,
	},
	{
		Name:        "list_applications",
		Description: "List all applications",
		Parameters:  map[string]interface{}{},
		RequiresApproval: false,
	},
}
