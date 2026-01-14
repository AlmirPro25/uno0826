// Multi-AI Provider Service
// Suporte para múltiplas APIs de IA gratuitas

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  CLAUDE: 'claude',
  GROQ: 'groq',
  HUGGINGFACE: 'huggingface',
  TOGETHER: 'together'
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

// Configurações dos modelos por provider
export const MODEL_CONFIGS = {
  [AI_PROVIDERS.GEMINI]: {
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
    baseUrl: 'https://generativelanguage.googleapis.com',
    free: true,
    limit: 'Ilimitado'
  },
  [AI_PROVIDERS.OPENAI]: {
    models: ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o'],
    baseUrl: 'https://api.openai.com/v1',
    free: '$5 inicial',
    limit: '$5/mês por 3 meses'
  },
  [AI_PROVIDERS.CLAUDE]: {
    models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
    baseUrl: 'https://api.anthropic.com',
    free: '$5 inicial',
    limit: 'Até esgotar crédito'
  },
  [AI_PROVIDERS.GROQ]: {
    models: ['llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    baseUrl: 'https://api.groq.com/openai/v1',
    free: true,
    limit: '14,400 requests/dia'
  },
  [AI_PROVIDERS.HUGGINGFACE]: {
    models: ['microsoft/DialoGPT-large', 'meta-llama/Llama-2-7b-chat-hf'],
    baseUrl: 'https://api-inference.huggingface.co',
    free: true,
    limit: '30,000 requests/mês'
  },
  [AI_PROVIDERS.TOGETHER]: {
    models: ['meta-llama/Llama-3-8b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    baseUrl: 'https://api.together.xyz',
    free: '$25 inicial',
    limit: 'Até esgotar crédito'
  }
};

// Classe principal do serviço multi-AI
export class MultiAIService {
  private configs: Map<AIProvider, AIConfig> = new Map();

  // Adiciona configuração de um provider
  addProvider(config: AIConfig) {
    this.configs.set(config.provider, config);
  }

  // Remove um provider
  removeProvider(provider: AIProvider) {
    this.configs.delete(provider);
  }

  // Lista providers configurados
  getConfiguredProviders(): AIProvider[] {
    return Array.from(this.configs.keys());
  }

  // Envia mensagem para um provider específico
  async sendMessage(provider: AIProvider, prompt: string): Promise<string> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Provider ${provider} não configurado`);
    }

    switch (provider) {
      case AI_PROVIDERS.GEMINI:
        return this.sendToGemini(config, prompt);
      case AI_PROVIDERS.OPENAI:
        return this.sendToOpenAI(config, prompt);
      case AI_PROVIDERS.CLAUDE:
        return this.sendToClaude(config, prompt);
      case AI_PROVIDERS.GROQ:
        return this.sendToGroq(config, prompt);
      case AI_PROVIDERS.HUGGINGFACE:
        return this.sendToHuggingFace(config, prompt);
      case AI_PROVIDERS.TOGETHER:
        return this.sendToTogether(config, prompt);
      default:
        throw new Error(`Provider ${provider} não suportado`);
    }
  }

  // Implementações específicas para cada provider
  private async sendToGemini(config: AIConfig, prompt: string): Promise<string> {
    const response = await fetch(`${config.baseUrl}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async sendToOpenAI(config: AIConfig, prompt: string): Promise<string> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async sendToClaude(config: AIConfig, prompt: string): Promise<string> {
    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }

  private async sendToGroq(config: AIConfig, prompt: string): Promise<string> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async sendToHuggingFace(config: AIConfig, prompt: string): Promise<string> {
    const response = await fetch(`${config.baseUrl}/models/${config.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const data = await response.json();
    return data[0].generated_text || data.generated_text;
  }

  private async sendToTogether(config: AIConfig, prompt: string): Promise<string> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Testa se um provider está funcionando
  async testProvider(provider: AIProvider): Promise<boolean> {
    try {
      const response = await this.sendMessage(provider, 'Responda apenas: OK');
      return response.toLowerCase().includes('ok');
    } catch (error) {
      console.error(`Erro testando ${provider}:`, error);
      return false;
    }
  }

  // Envia para múltiplos providers e retorna o primeiro que responder
  async sendToFirstAvailable(prompt: string): Promise<{ provider: AIProvider, response: string }> {
    const providers = this.getConfiguredProviders();
    
    for (const provider of providers) {
      try {
        const response = await this.sendMessage(provider, prompt);
        return { provider, response };
      } catch (error) {
        console.warn(`Falha no ${provider}, tentando próximo...`);
        continue;
      }
    }
    
    throw new Error('Nenhum provider disponível');
  }
}

// Instância global do serviço
export const multiAI = new MultiAIService();

// Funções de conveniência
export const addAIProvider = (config: AIConfig) => multiAI.addProvider(config);
export const sendToAI = (provider: AIProvider, prompt: string) => multiAI.sendMessage(provider, prompt);
export const sendToAnyAI = (prompt: string) => multiAI.sendToFirstAvailable(prompt);
