/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              🔒 AI WEB WEAVER - SECURE PROXY SERVER 🔒                       ║
 * ║                                                                              ║
 * ║                    "SEGURANÇA POR DESIGN - ZERO TRUST"                       ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * PROPÓSITO:
 * Este servidor proxy atua como uma camada de segurança entre o frontend e a API
 * do Google Gemini, garantindo que:
 * 
 * 1. API Keys NUNCA são expostas no frontend
 * 2. Rate limiting protege contra abuso
 * 3. Validação de entrada previne ataques
 * 4. Logs auditáveis de todas as requisições
 * 5. CORS configurado corretamente
 * 
 * ARQUITETURA:
 * Frontend → Proxy Server → Google Gemini API → Proxy Server → Frontend
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Carregar variáveis de ambiente
dotenv.config();

// ============================================
// CONFIGURAÇÃO E VALIDAÇÃO
// ============================================

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000'
];

// Validar API Key
if (!GEMINI_API_KEY) {
  console.error('❌ ERRO CRÍTICO: GEMINI_API_KEY não está configurada no arquivo .env');
  console.error('📝 Copie .env.example para .env e configure sua API Key');
  process.exit(1);
}

// Inicializar cliente Gemini
const genAI = new GoogleGenAI(GEMINI_API_KEY);

// ============================================
// CONFIGURAÇÃO DO EXPRESS
// ============================================

const app = express();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para permitir CORS
  crossOriginEmbedderPolicy: false
}));

// CORS configurado
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origem bloqueada por CORS: ${origin}`);
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compressão de respostas
app.use(compression());

// Parser de JSON com limite de 10MB (para prompts longos)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// RATE LIMITING
// ============================================

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15') * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requisições por janela
  message: {
    error: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Identificar usuário por IP
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

// Aplicar rate limiting em todas as rotas /api/*
app.use('/api/', limiter);

// ============================================
// TIPOS E INTERFACES
// ============================================

interface GenerateRequest {
  prompt: string;
  modelName?: string;
  history?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

interface GenerateResponse {
  success: boolean;
  text?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================

const validateGenerateRequest = (req: Request, res: Response, next: NextFunction) => {
  const { prompt, modelName } = req.body as GenerateRequest;

  // Validar prompt
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Campo "prompt" é obrigatório e deve ser uma string'
    });
  }

  if (prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Prompt não pode estar vazio'
    });
  }

  if (prompt.length > 1000000) { // 1MB de texto
    return res.status(400).json({
      success: false,
      error: 'Prompt muito longo (máximo: 1MB)'
    });
  }

  // Validar modelName (opcional)
  if (modelName && typeof modelName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Campo "modelName" deve ser uma string'
    });
  }

  next();
};

// ============================================
// ROTAS
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// Rota principal de geração
app.post('/api/generate', validateGenerateRequest, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    prompt,
    modelName = 'gemini-2.0-flash-exp',
    history = [],
    temperature = 0.7,
    maxOutputTokens = 8192,
    topP = 0.95,
    topK = 40
  } = req.body as GenerateRequest;

  try {
    console.log(`🤖 Gerando resposta com modelo: ${modelName}`);
    console.log(`📝 Prompt length: ${prompt.length} caracteres`);

    // Obter modelo
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP,
        topK
      }
    });

    // Iniciar chat se houver histórico
    let result;
    if (history.length > 0) {
      const chat = model.startChat({ history });
      result = await chat.sendMessage(prompt);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = result.response;
    const text = response.text();

    const duration = Date.now() - startTime;
    console.log(`✅ Resposta gerada em ${duration}ms`);

    // Resposta de sucesso
    const responseData: GenerateResponse = {
      success: true,
      text,
      usage: {
        promptTokens: 0, // Gemini não retorna isso diretamente
        completionTokens: 0,
        totalTokens: 0
      }
    };

    res.json(responseData);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao gerar resposta (${duration}ms):`, error.message);

    // Tratamento de erros específicos
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';

    if (error.message?.includes('API key')) {
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

    const errorResponse: GenerateResponse = {
      success: false,
      error: errorMessage
    };

    res.status(statusCode).json(errorResponse);
  }
});

// Rota de streaming (para futuras implementações)
app.post('/api/generate-stream', validateGenerateRequest, async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: 'Streaming não implementado ainda. Use /api/generate'
  });
});

// Rota 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path
  });
});

// Error handler global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erro não tratado:', err);
  
  res.status(500).json({
    success: false,
    error: NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const server = app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║        🔒 AI WEB WEAVER - PROXY SERVER INICIADO 🔒          ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${NODE_ENV}`);
  console.log(`🔑 API Key configurada: ${GEMINI_API_KEY ? '✅' : '❌'}`);
  console.log(`🛡️  CORS permitido para: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`⏱️  Rate limit: ${process.env.RATE_LIMIT_MAX || 100} req/${process.env.RATE_LIMIT_WINDOW_MS || 15}min`);
  console.log('');
  console.log('📡 Endpoints disponíveis:');
  console.log('   GET  /health           - Health check');
  console.log('   POST /api/generate     - Gerar resposta com IA');
  console.log('');
  console.log('✨ Pronto para receber requisições!');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

// Export para testes
export { app, server };
