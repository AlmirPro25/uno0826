-- AI Hub Tables for PROST-QS Kernel
-- Central AI Intelligence with multi-provider support

-- Provider configurations (API keys for each provider)
CREATE TABLE IF NOT EXISTS ai_provider_configs (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- gemini, openai, anthropic
    api_key TEXT NOT NULL,  -- Encrypted
    model TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_id, provider)
);

-- Conversations (chat history)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT,
    messages TEXT, -- JSON array of messages
    provider TEXT,
    model TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Action logs (what the AI executed)
CREATE TABLE IF NOT EXISTS ai_action_logs (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    conversation_id TEXT,
    action TEXT NOT NULL,
    parameters TEXT, -- JSON
    result TEXT,     -- JSON
    success BOOLEAN,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id)
);

-- Usage tracking (tokens, costs)
CREATE TABLE IF NOT EXISTS ai_usage (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_app ON ai_provider_configs(app_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_app_user ON ai_conversations(app_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_app ON ai_action_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_app ON ai_usage(app_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at);

-- Insert default Gemini config if GEMINI_API_KEY is set (done via code)
