// src/services/GeminiServiceProd.ts - VERSÃO OTIMIZADA PARA PRODUÇÃO

import { GoogleGenAI, GenerateContentResponse, Type, Part } from "@google/genai";
// import { trackApiUsage } from '@/lib/supabase';

// Configuração robusta da API
const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!key) {
    throw new Error('Gemini API Key não configurada. Configure VITE_GEMINI_API_KEY');
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

// Rate limiting e cache
class ApiRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 60; // 60 requests per minute
  private readonly windowMs = 60 * 1000; // 1 minute
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheMs = 5 * 60 * 1000; // 5 minutes cache

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheMs) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCached(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const rateLimiter = new ApiRateLimiter();

// Circuit breaker para falhas
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private readonly maxFailures = 5;
  private readonly resetTimeMs = 60 * 1000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open. Service temporarily unavailable.');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.maxFailures && 
           Date.now() - this.lastFailTime < this.resetTimeMs;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
  }
}

const circuitBreaker = new CircuitBreaker();

// Função principal otimizada
export async function generateAiResponseProd(
  userPrompt: string,
  phase: string,
  modelName: string = 'gemini-2.5-flash',
  options: {
    currentCode?: string;
    currentPlan?: string;
    attachments?: Part[];
    useCache?: boolean;
  } = {}
): Promise<{ content: string; tokensUsed?: number; cost?: number }> {
  
  // Verificar rate limit
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait before making another request.');
  }

  // Verificar cache
  const cacheKey = `${userPrompt}-${phase}-${modelName}`;
  if (options.useCache) {
    const cached = rateLimiter.getCached(cacheKey);
    if (cached) {
      console.log('🎯 Cache hit for request');
      return cached;
    }
  }

  // Executar com circuit breaker
  return circuitBreaker.execute(async () => {
    rateLimiter.recordRequest();
    
    const startTime = Date.now();
    
    try {
      // Construir prompt otimizado
      const optimizedPrompt = buildOptimizedPrompt(userPrompt, phase, options);
      
      // Fazer request para Gemini
      const response = await ai.models.generateContent({
        model: modelName,
        contents: optimizedPrompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      const content = response.text || '';
      const tokensUsed = estimateTokens(userPrompt + content);
      const cost = calculateCost(tokensUsed, modelName);
      
      // Track usage (temporariamente desabilitado - Supabase não configurado)
      // await trackApiUsage('generate-code', tokensUsed, Math.round(cost * 100));
      
      const result = { content, tokensUsed, cost };
      
      // Cache result
      if (options.useCache) {
        rateLimiter.setCached(cacheKey, result);
      }
      
      console.log(`✅ Gemini request completed in ${Date.now() - startTime}ms`);
      return result;
      
    } catch (error: any) {
      console.error('❌ Gemini API Error:', error);
      
      // Retry logic for transient errors
      if (error.status === 429 || error.status >= 500) {
        console.log('🔄 Retrying request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return generateAiResponseProd(userPrompt, phase, modelName, options);
      }
      
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  });
}

// Função para construir prompts otimizados
function buildOptimizedPrompt(userPrompt: string, phase: string, options: any): string {
  const baseInstructions = `
**VOCÊ É UM ARQUITETO DE SOFTWARE SÊNIOR**

Gere código HTML/CSS/JS de alta qualidade, responsivo e acessível.
Use Tailwind CSS, componentes reutilizáveis e boas práticas.
Inclua data-aid em todos os elementos para testes.

**REGRAS CRÍTICAS:**
- NUNCA use Lorem Ipsum - sempre conteúdo real
- SEMPRE implemente funcionalidades reais, não simuladas
- SEMPRE adicione responsividade completa
- SEMPRE inclua acessibilidade (ARIA, data-aid)
`;

  switch (phase) {
    case 'generate_code':
      return `${baseInstructions}

**SOLICITAÇÃO:** ${userPrompt}

${options.currentCode ? `**CÓDIGO ATUAL:**\n${options.currentCode}\n` : ''}

**RESPOSTA:** Apenas o código HTML completo e funcional.`;

    case 'refine_code':
      return `${baseInstructions}

**CÓDIGO ATUAL:**
${options.currentCode}

**MODIFICAÇÃO SOLICITADA:** ${userPrompt}

**RESPOSTA:** Código HTML modificado completo.`;

    default:
      return `${baseInstructions}\n\n**SOLICITAÇÃO:** ${userPrompt}`;
  }
}

// Estimativa de tokens (aproximada)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4); // Aproximação: 1 token = 4 caracteres
}

// Cálculo de custo
function calculateCost(tokens: number, model: string): number {
  const rates = {
    'gemini-2.5-flash': 0.000075, // $0.075 per 1K tokens
    'gemini-2.5-pro': 0.00125,   // $1.25 per 1K tokens
  };
  
  const rate = rates[model as keyof typeof rates] || rates['gemini-2.5-flash'];
  return (tokens / 1000) * rate;
}

// Funções específicas otimizadas
export async function generateCodeWithAI(prompt: string, currentCode?: string): Promise<string> {
  const result = await generateAiResponseProd(prompt, 'generate_code', 'gemini-2.5-flash', {
    currentCode,
    useCache: true
  });
  return result.content;
}

export async function refineCodeWithAI(prompt: string, currentCode: string): Promise<string> {
  const result = await generateAiResponseProd(prompt, 'refine_code', 'gemini-2.5-flash', {
    currentCode,
    useCache: false // Refinements shouldn't be cached
  });
  return result.content;
}

export async function debugCodeWithAI(problemDescription: string, code: string): Promise<string> {
  const debugPrompt = `
**VOCÊ É UM ESPECIALISTA EM DEPURAÇÃO**

**PROBLEMA RELATADO:** ${problemDescription}

**CÓDIGO COM PROBLEMA:**
${code}

**ANÁLISE SOLICITADA:**
1. Identifique o problema
2. Explique a causa
3. Forneça a solução
4. Sugira melhorias preventivas

**FORMATO:** Markdown com explicação clara e código corrigido.
`;

  const result = await generateAiResponseProd(debugPrompt, 'debug', 'gemini-2.5-pro');
  return result.content;
}

// Health check para monitoramento
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; details: any }> {
  try {
    const testPrompt = "Generate a simple HTML hello world";
    const result = await generateAiResponseProd(testPrompt, 'test', 'gemini-2.5-flash');
    
    return {
      status: 'ok',
      details: {
        responseTime: 'fast',
        tokensUsed: result.tokensUsed,
        cost: result.cost
      }
    };
  } catch (error: any) {
    return {
      status: 'error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}