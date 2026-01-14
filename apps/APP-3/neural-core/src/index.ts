/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              🧠 NEURAL CORE - ORQUESTRADOR INTELIGENTE 🧠                    ║
 * ║                                                                              ║
 * ║                    "O CÉREBRO CENTRAL DO AI WEB WEAVER"                      ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * PROPÓSITO:
 * Este servidor é o CÉREBRO CENTRAL que:
 * 
 * 1. 🧠 INJETA SABEDORIA: Enriquece prompts com manifestos e protocolos
 * 2. 🔒 PROTEGE SEGREDOS: API Keys nunca expostas no frontend
 * 3. 🎯 DETECTA INTENÇÕES: Identifica contexto (game, fintech, fullstack)
 * 4. ⚡ OTIMIZA RESPOSTAS: Streaming para UX fluida
 * 5. 🛡️ VALIDA TUDO: Zod para garantir integridade
 * 
 * ARQUITETURA:
 * Frontend → Neural Core → Context Injection → Gemini API → Streaming → Frontend
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { compress } from 'hono/compress';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { buildEnrichedPrompt, analyzePromptContext } from './lib/ContextManager.js';
import { GenerateRequestSchema, sanitizePrompt, isValidModel } from './lib/validators.js';

// Carregar variáveis de ambiente
dotenv.config();

// ============================================
// CONFIGURAÇÃO E VALIDAÇÃO
// ============================================

const PORT = parseInt(process.env.PORT || '3000');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
];

// Validar API Key
if (!GEMINI_API_KEY) {
  console.error('❌ ERRO CRÍTICO: GEMINI_API_KEY não está configurada');
  console.error('📝 Copie .env.example para .env e configure sua API Key');
  process.exit(1);
}

// Inicializar cliente Gemini
const genAI = new GoogleGenAI(GEMINI_API_KEY);

// ============================================
// CONFIGURAÇÃO DO HONO
// ============================================

const app = new Hono();

// Middleware global
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', compress());

// CORS
app.use('*', cors({
  origin: ALLOWED_ORIGINS,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ============================================
// ROTAS
// ============================================

/**
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'neural-core',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

/**
 * Análise de contexto (sem gerar código)
 */
app.post('/api/analyze-context', async (c) => {
  try {
    const body = await c.req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return c.json({
        success: false,
        error: 'Campo "prompt" é obrigatório'
      }, 400);
    }

    const context = analyzePromptContext(prompt);

    return c.json({
      success: true,
      context,
      message: 'Contexto analisado com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao analisar contexto:', error);
    return c.json({
      success: false,
      error: 'Erro ao analisar contexto'
    }, 500);
  }
});

/**
 * Geração de código com Context Injection
 */
app.post('/api/generate', async (c) => {
  const startTime = Date.now();

  try {
    // 1. Validar requisição
    const body = await c.req.json();
    const validatedData = GenerateRequestSchema.parse(body);

    const {
      prompt: rawPrompt,
      modelName,
      history,
      temperature,
      maxOutputTokens,
      topP,
      topK,
      stream
    } = validatedData;

    // 2. Sanitizar prompt
    const userPrompt = sanitizePrompt(rawPrompt);

    // 3. Validar modelo
    if (!isValidModel(modelName)) {
      return c.json({
        success: false,
        error: `Modelo "${modelName}" não é suportado`
      }, 400);
    }

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  🧠 NEURAL CORE - PROCESSANDO REQUISIÇÃO                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`📝 Prompt original: ${userPrompt.substring(0, 100)}...`);
    console.log(`🤖 Modelo: ${modelName}`);
    console.log(`🌡️  Temperatura: ${temperature}`);
    console.log(`📊 Modelos suportados: gemini-2.5-pro, gemini-2.5-flash, gemini-flash-latest, gemini-flash-lite-latest`);

    // 4. INJEÇÃO DE CONTEXTO - O CORAÇÃO DO NEURAL CORE
    const enrichmentResult = buildEnrichedPrompt(userPrompt);
    const { enrichedPrompt, detectedContext, appliedProtocols } = enrichmentResult;

    console.log('🎯 Protocolos aplicados:', appliedProtocols.join(', '));
    console.log(`📊 Tamanho do prompt enriquecido: ${enrichedPrompt.length} caracteres`);

    // 5. Configurar modelo Gemini
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP,
        topK
      }
    });

    // 6. Gerar resposta
    let result;
    if (history.length > 0) {
      const chat = model.startChat({ history });
      result = await chat.sendMessage(enrichedPrompt);
    } else {
      result = await model.generateContent(enrichedPrompt);
    }

    const response = result.response;
    const text = response.text();

    const duration = Date.now() - startTime;
    console.log(`✅ Resposta gerada em ${duration}ms`);
    console.log(`📏 Tamanho da resposta: ${text.length} caracteres`);
    console.log('');

    // 7. Retornar resposta
    return c.json({
      success: true,
      text,
      metadata: {
        detectedContext,
        appliedProtocols,
        duration,
        model: modelName,
        promptLength: userPrompt.length,
        enrichedPromptLength: enrichedPrompt.length,
        responseLength: text.length
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao gerar resposta (${duration}ms):`, error.message);

    // Tratamento de erros específicos
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';

    if (error.name === 'ZodError') {
      statusCode = 400;
      errorMessage = 'Dados de entrada inválidos: ' + error.errors[0].message;
    } else if (error.message?.includes('API key')) {
      statusCode = 401;
      errorMessage = 'API Key inválida ou expirada';
    } else if (error.message?.includes('quota')) {
      statusCode = 429;
      errorMessage = 'Cota da API excedida. Tente novamente mais tarde.';
    } else if (error.message?.includes('safety')) {
      statusCode = 400;
      errorMessage = 'Conteúdo bloqueado por filtros de segurança';
    } else if (error.message?.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'Timeout ao gerar resposta. Tente novamente.';
    }

    return c.json({
      success: false,
      error: errorMessage,
      details: NODE_ENV === 'development' ? error.message : undefined
    }, statusCode);
  }
});

/**
 * Geração com streaming (para futuras implementações)
 */
app.post('/api/generate-stream', async (c) => {
  return c.json({
    success: false,
    error: 'Streaming será implementado em breve. Use /api/generate por enquanto.'
  }, 501);
});

/**
 * Rota 404
 */
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Rota não encontrada',
    path: c.req.path
  }, 404);
});

/**
 * Error handler global
 */
app.onError((err, c) => {
  console.error('❌ Erro não tratado:', err);
  
  return c.json({
    success: false,
    error: NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  }, 500);
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                                                              ║');
console.log('║        🧠 NEURAL CORE - ORQUESTRADOR INTELIGENTE 🧠          ║');
console.log('║                                                              ║');
console.log('║              "O CÉREBRO CENTRAL DO SISTEMA"                  ║');
console.log('║                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
console.log(`🌍 Ambiente: ${NODE_ENV}`);
console.log(`🔑 API Key configurada: ✅`);
console.log(`🛡️  CORS permitido para: ${ALLOWED_ORIGINS.join(', ')}`);
console.log('');
console.log('📡 Endpoints disponíveis:');
console.log('   GET  /health                - Health check');
console.log('   POST /api/analyze-context   - Analisar contexto do prompt');
console.log('   POST /api/generate          - Gerar código com IA');
console.log('   POST /api/generate-stream   - Streaming (em breve)');
console.log('');
console.log('🧠 Protocolos carregados:');
console.log('   ✅ ARTISAN_DIGITAL_MANIFESTO');
console.log('   ✅ FINTECH_ARCHITECT_PROTOCOL');
console.log('   ✅ FULLSTACK_PRO_PROTOCOL');
console.log('   ✅ GAME_DEV_PROTOCOL');
console.log('   ✅ EXCELLENCE_CRITERIA');
console.log('');
console.log('✨ Neural Core pronto para injetar sabedoria!');
console.log('');

serve({
  fetch: app.fetch,
  port: PORT
});
