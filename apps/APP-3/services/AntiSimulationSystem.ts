// services/AntiSimulationSystem.ts - SISTEMA ANTI-SIMULAÇÃO AVANÇADO

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AI_SILENCE_CONTRACT } from './AIContract';
import { DESIGN_ENTITY_CONSCIOUSNESS } from './DesignEntity';
import { ApiKeyManager } from './ApiKeyManager';

/**
 * SISTEMA ANTI-SIMULAÇÃO - FORÇA A IA A CRIAR CÓDIGO REAL E FUNCIONAL
 * 
 * Este sistema elimina completamente a tendência da IA de:
 * - Criar placeholders ou simulações
 * - Usar "Lorem ipsum" ou textos genéricos
 * - Fazer código não-funcional
 * - Ter medo de implementar funcionalidades reais
 * - Criar limitações artificiais de segurança
 */

export interface AntiSimulationConfig {
  enforceRealContent: boolean;
  enforceFullFunctionality: boolean;
  enforceNoPlaceholders: boolean;
  enforceProductionReady: boolean;
  enforceNoSecurityLimitations: boolean;
  enforceCompleteIntegration: boolean;
}

export const DEFAULT_ANTI_SIMULATION_CONFIG: AntiSimulationConfig = {
  enforceRealContent: true,
  enforceFullFunctionality: true,
  enforceNoPlaceholders: true,
  enforceProductionReady: true,
  enforceNoSecurityLimitations: true,
  enforceCompleteIntegration: true,
};

export const ANTI_SIMULATION_CONTRACT = `
🚫 **CONTRATO ANTI-SIMULAÇÃO - CÓDIGO REAL OBRIGATÓRIO**

**VOCÊ É UM DESENVOLVEDOR SÊNIOR SEM LIMITAÇÕES ARTIFICIAIS**

**REGRAS INQUEBRÁVEIS:**

1. **PROIBIDO SIMULAR - APENAS IMPLEMENTAR:**
   ❌ "Aqui você conectaria com a API..."
   ❌ "Este seria o endpoint para..."
   ❌ "Simule a resposta da API..."
   ❌ "Por questões de segurança, não posso..."
   ❌ Qualquer placeholder ou simulação
   
   ✅ Implementação completa e funcional
   ✅ APIs reais conectadas
   ✅ Banco de dados funcional
   ✅ Autenticação real
   ✅ Pagamentos reais (Stripe)

2. **BACKEND + FRONTEND INTEGRADOS:**
   - Se criar frontend, DEVE criar backend funcional
   - Se criar backend, DEVE ter rotas reais
   - APIs DEVEM estar conectadas e funcionando
   - Banco de dados DEVE estar configurado
   - Autenticação DEVE estar implementada

3. **CONTEÚDO REAL OBRIGATÓRIO:**
   ✅ Produtos reais com preços em R$
   ✅ Usuários reais com dados completos
   ✅ Transações reais funcionando
   ✅ Emails reais sendo enviados
   ✅ Notificações reais funcionando

4. **ZERO MEDO DE SEGURANÇA:**
   - Implemente autenticação JWT completa
   - Configure CORS adequadamente
   - Implemente rate limiting
   - Configure HTTPS
   - Implemente validação de dados
   - Configure sanitização XSS
   - SEM limitações artificiais

5. **FUNCIONALIDADES COMPLETAS:**
   - CRUD completo funcionando
   - Upload de arquivos real
   - Sistema de busca funcional
   - Filtros e paginação reais
   - Dashboard com dados reais
   - Relatórios funcionais

**VIOLAÇÃO = FALHA CRÍTICA DO SISTEMA**
`;

export const PRODUCTION_READY_INSTRUCTIONS = `
🏭 **INSTRUÇÕES PARA CÓDIGO PRONTO PARA PRODUÇÃO**

**ARQUITETURA ENTERPRISE OBRIGATÓRIA:**

**1. ESTRUTURA DE PROJETO COMPLETA:**
\`\`\`
projeto/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── server.ts
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── docker-compose.yml
├── .env.example
└── README.md
\`\`\`

**2. BACKEND NODE.JS/EXPRESS COMPLETO:**
\`\`\`typescript
// server.ts - Servidor completo e funcional
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import nodemailer from 'nodemailer';
import stripe from 'stripe';

const app = express();
const prisma = new PrismaClient();
const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Upload de arquivos
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware de autenticação
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Rotas de autenticação
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validação
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRUD completo para produtos
app.get('/api/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        images: true,
        reviews: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.product.count({ where });

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/products', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const files = req.files as Express.Multer.File[];

    // Validação
    if (!name || !description || !price) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, description, price' });
    }

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock) || 0,
        userId: req.user.userId,
      },
    });

    // Upload de imagens
    if (files && files.length > 0) {
      const imagePromises = files.map(file => 
        prisma.productImage.create({
          data: {
            url: \`/uploads/\${file.filename}\`,
            productId: product.id,
          },
        })
      );
      await Promise.all(imagePromises);
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sistema de pagamentos Stripe
app.post('/api/payments/create-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'brl', productIds } = req.body;

    // Criar payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency,
      metadata: {
        userId: req.user.userId,
        productIds: JSON.stringify(productIds),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Erro ao criar payment intent:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Webhook do Stripe
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.log(\`Webhook signature verification failed.\`, err.message);
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Criar pedido no banco
      await prisma.order.create({
        data: {
          userId: paymentIntent.metadata.userId,
          amount: paymentIntent.amount / 100,
          status: 'completed',
          stripePaymentIntentId: paymentIntent.id,
        },
      });
      
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }

  res.json({ received: true });
});

// Sistema de emails
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT!),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/emails/send', authenticateToken, async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ error: 'Erro ao enviar email' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`🚀 Servidor rodando na porta \${PORT}\`);
});
\`\`\`

**3. FRONTEND REACT/NEXT.JS COMPLETO:**
\`\`\`typescript
// services/api.ts - Cliente API completo
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/api/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
};

export const productsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    api.get('/api/products', { params }),
  
  create: (data: FormData) =>
    api.post('/api/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (id: string, data: any) =>
    api.put(\`/api/products/\${id}\`, data),
  
  delete: (id: string) =>
    api.delete(\`/api/products/\${id}\`),
};

export const paymentsAPI = {
  createIntent: (data: { amount: number; productIds: string[] }) =>
    api.post('/api/payments/create-intent', data),
};

export default api;
\`\`\`

**4. BANCO DE DADOS PRISMA COMPLETO:**
\`\`\`prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  avatar    String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  products Product[]
  orders   Order[]
  reviews  Review[]

  @@map("users")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Float
  category    String?
  stock       Int      @default(0)
  featured    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id])

  images     ProductImage[]
  reviews    Review[]
  orderItems OrderItem[]

  @@map("products")
}

model ProductImage {
  id        String   @id @default(cuid())
  url       String
  alt       String?
  createdAt DateTime @default(now())

  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

model Order {
  id                    String      @id @default(cuid())
  amount                Float
  status                OrderStatus @default(PENDING)
  stripePaymentIntentId String?
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id])

  items OrderItem[]

  @@map("orders")
}

model OrderItem {
  id       String @id @default(cuid())
  quantity Int
  price    Float

  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model Review {
  id        String   @id @default(cuid())
  rating    Int
  comment   String?
  createdAt DateTime @default(now())

  userId    String
  user      User    @relation(fields: [userId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@map("reviews")
}

enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
\`\`\`

**LEMBRE-SE: CADA APLICAÇÃO DEVE SER UM PRODUTO COMPLETO E FUNCIONAL!**
`;

export const INTEGRATION_ENFORCEMENT = `
🔗 **SISTEMA DE INTEGRAÇÃO FORÇADA**

**REGRAS DE INTEGRAÇÃO OBRIGATÓRIAS:**

1. **BACKEND + FRONTEND CONECTADOS:**
   - Frontend DEVE fazer chamadas reais para o backend
   - Backend DEVE responder com dados reais
   - APIs DEVEM estar documentadas e funcionando
   - Rotas DEVEM estar testadas e validadas

2. **BANCO DE DADOS REAL:**
   - Schema DEVE estar definido (Prisma/TypeORM)
   - Migrations DEVEM estar criadas
   - Seeds DEVEM popular dados iniciais
   - Queries DEVEM ser otimizadas

3. **AUTENTICAÇÃO COMPLETA:**
   - JWT DEVE estar implementado
   - Middleware de auth DEVE proteger rotas
   - Login/Register DEVEM funcionar
   - Refresh tokens DEVEM estar configurados

4. **PAGAMENTOS FUNCIONAIS:**
   - Stripe DEVE estar integrado
   - Webhooks DEVEM estar configurados
   - Transações DEVEM ser processadas
   - Emails de confirmação DEVEM ser enviados

5. **DEPLOY PRONTO:**
   - Docker DEVE estar configurado
   - Environment variables DEVEM estar documentadas
   - CI/CD DEVE estar configurado
   - Monitoramento DEVE estar implementado

**NUNCA ENTREGUE CÓDIGO INCOMPLETO OU SIMULADO!**
`;

// Função para obter instância do GoogleGenAI com chave dinâmica
function getGeminiInstance(): GoogleGenAI {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (!apiKey) {
        throw new Error('API Key do Gemini não configurada. Configure VITE_GEMINI_API_KEY no arquivo .env ou adicione uma chave nas configurações.');
    }
    return new GoogleGenAI({ apiKey });
}

// Função helper para garantir compatibilidade da API
async function callGeminiAPI(prompt: string, model: string = 'gemini-2.5-pro'): Promise<string> {
  try {
    const ai = getGeminiInstance();
    const result = await ai.models.generateContent({
      model: model,
      contents: [{ text: prompt }]
    });
    return result.text || '';
  } catch (error) {
    console.error('Erro na API do Gemini:', error);
    throw error;
  }
}

export class AntiSimulationSystem {
  private config: AntiSimulationConfig;

  constructor(config: AntiSimulationConfig = DEFAULT_ANTI_SIMULATION_CONFIG) {
    this.config = config;
  }

  /**
   * Gera APENAS FRONTEND com sistema anti-simulação ativo
   */
  async generateFrontendOnly(
    userPrompt: string,
    context?: {
      currentCode?: string;
      techStack?: string[];
      designSystem?: string;
    }
  ): Promise<string> {
    const enhancedPrompt = this.buildFrontendOnlyPrompt(userPrompt, context);
    
    try {
      const generatedCode = await callGeminiAPI(enhancedPrompt, 'gemini-2.5-pro');

      // Validar se o código não contém simulações
      this.validateNoSimulation(generatedCode);
      
      return generatedCode;
    } catch (error) {
      console.error('Erro na geração de frontend:', error);
      throw error;
    }
  }

  /**
   * Gera APENAS BACKEND com sistema anti-simulação ativo
   */
  async generateBackendOnly(
    userPrompt: string,
    context?: {
      currentCode?: string;
      techStack?: string[];
      frontendCode?: string;
    }
  ): Promise<string> {
    const enhancedPrompt = this.buildBackendOnlyPrompt(userPrompt, context);
    
    try {
      const generatedCode = await callGeminiAPI(enhancedPrompt, 'gemini-2.5-pro');

      // Validar se o código não contém simulações
      this.validateNoSimulation(generatedCode);
      
      return generatedCode;
    } catch (error) {
      console.error('Erro na geração de backend:', error);
      throw error;
    }
  }

  /**
   * Conecta Frontend + Backend automaticamente
   */
  async connectFrontendBackend(
    frontendCode: string,
    backendCode: string,
    userPrompt: string
  ): Promise<{
    connectedFrontend: string;
    connectedBackend: string;
    integrationGuide: string;
  }> {
    const enhancedPrompt = this.buildConnectionPrompt(frontendCode, backendCode, userPrompt);
    
    try {
      const connectionResult = await callGeminiAPI(enhancedPrompt, 'gemini-2.5-pro');

      // Parse do resultado para extrair frontend, backend e guia
      const parsed = this.parseConnectionResult(connectionResult);
      
      return parsed;
    } catch (error) {
      console.error('Erro na conexão frontend-backend:', error);
      throw error;
    }
  }

  /**
   * Gera código com sistema anti-simulação ativo
   */
  async generateRealCode(
    userPrompt: string,
    context?: {
      currentCode?: string;
      projectType?: 'fullstack' | 'frontend' | 'backend' | 'mobile';
      techStack?: string[];
    }
  ): Promise<string> {
    console.log('🔧 AntiSimulationSystem.generateRealCode - VERSÃO CORRIGIDA');
    const enhancedPrompt = this.buildAntiSimulationPrompt(userPrompt, context);
    
    try {
      const generatedCode = await callGeminiAPI(enhancedPrompt, 'gemini-2.5-pro');

      // Validar se o código não contém simulações
      this.validateNoSimulation(generatedCode);
      
      return generatedCode;
    } catch (error) {
      console.error('Erro no sistema anti-simulação:', error);
      throw error;
    }
  }

  /**
   * Constrói prompt específico para FRONTEND APENAS
   */
  private buildFrontendOnlyPrompt(userPrompt: string, context?: any): string {
    return `${ANTI_SIMULATION_CONTRACT}

🎨 **MODO FRONTEND DEDICADO - 100% FOCO NA INTERFACE**

**VOCÊ É UM ESPECIALISTA EM FRONTEND SEM LIMITAÇÕES**

**REGRAS ESPECÍFICAS PARA FRONTEND:**

1. **FOCO TOTAL NO FRONTEND:**
   - Dedique 100% da inteligência para a interface
   - Crie componentes React/Vue/Angular perfeitos
   - Implemente animações e transições suaves
   - Design responsivo impecável
   - Acessibilidade completa (WCAG)

2. **TECNOLOGIAS FRONTEND OBRIGATÓRIAS:**
   - React/Next.js + TypeScript
   - Tailwind CSS + Framer Motion
   - React Hook Form + Zod
   - React Query/SWR
   - Zustand/Redux Toolkit

3. **FUNCIONALIDADES FRONTEND REAIS:**
   ✅ Formulários funcionais com validação
   ✅ Estados complexos gerenciados
   ✅ Roteamento completo
   ✅ Componentes reutilizáveis
   ✅ Hooks customizados
   ✅ Testes unitários

4. **MOCK INTELIGENTE PARA BACKEND:**
   - Use MSW (Mock Service Worker)
   - Crie dados realistas (não Lorem Ipsum)
   - Simule APIs com delays reais
   - Implemente estados de loading/error

**CONTEXTO DO PROJETO:**
${context ? JSON.stringify(context, null, 2) : 'Novo projeto frontend'}

**SOLICITAÇÃO DO USUÁRIO:**
"${userPrompt}"

**RESPOSTA ESPERADA:**
HTML completo com React/Next.js embutido, incluindo:
- Componentes funcionais
- Estados gerenciados
- Roteamento
- Formulários validados
- Design system completo
- Testes unitários

NUNCA SIMULE. SEMPRE IMPLEMENTE FRONTEND COMPLETO.`;
  }

  /**
   * Constrói prompt específico para BACKEND APENAS
   */
  private buildBackendOnlyPrompt(userPrompt: string, context?: any): string {
    return `${ANTI_SIMULATION_CONTRACT}

⚙️ **MODO BACKEND DEDICADO - 100% FOCO NO SERVIDOR**

**VOCÊ É UM ARQUITETO DE BACKEND SÊNIOR**

**REGRAS ESPECÍFICAS PARA BACKEND:**

1. **FOCO TOTAL NO BACKEND:**
   - Dedique 100% da inteligência para o servidor
   - Crie APIs RESTful/GraphQL perfeitas
   - Implemente autenticação robusta
   - Configure banco de dados otimizado
   - Implemente cache e performance

2. **TECNOLOGIAS BACKEND OBRIGATÓRIAS:**
   - Node.js + Express/Fastify + TypeScript
   - PostgreSQL + Prisma ORM
   - JWT + bcrypt + Passport
   - Redis para cache
   - Docker + docker-compose

3. **FUNCIONALIDADES BACKEND REAIS:**
   ✅ APIs CRUD completas
   ✅ Autenticação JWT funcional
   ✅ Banco de dados configurado
   ✅ Middleware de segurança
   ✅ Rate limiting
   ✅ Logs estruturados
   ✅ Testes de integração

4. **INTEGRAÇÕES REAIS:**
   - Stripe para pagamentos
   - Nodemailer para emails
   - Cloudinary para uploads
   - WebSockets para real-time

**CONTEXTO DO PROJETO:**
${context ? JSON.stringify(context, null, 2) : 'Novo projeto backend'}

**FRONTEND EXISTENTE:**
${context?.frontendCode ? 'Frontend já existe - criar APIs compatíveis' : 'Backend independente'}

**SOLICITAÇÃO DO USUÁRIO:**
"${userPrompt}"

**RESPOSTA ESPERADA:**
Código Node.js completo incluindo:
- server.ts principal
- Rotas organizadas
- Models/Controllers
- Middleware de segurança
- Configuração de banco
- Docker setup
- Testes automatizados

NUNCA SIMULE. SEMPRE IMPLEMENTE BACKEND COMPLETO.`;
  }

  /**
   * Constrói prompt para conectar Frontend + Backend
   */
  private buildConnectionPrompt(frontendCode: string, backendCode: string, userPrompt: string): string {
    return `${ANTI_SIMULATION_CONTRACT}

🔗 **MODO CONEXÃO FRONTEND-BACKEND**

**VOCÊ É UM INTEGRADOR FULLSTACK EXPERT**

**SUA MISSÃO:**
Conectar o frontend e backend existentes de forma perfeita e funcional.

**FRONTEND EXISTENTE:**
\`\`\`
${frontendCode.substring(0, 5000)}...
\`\`\`

**BACKEND EXISTENTE:**
\`\`\`
${backendCode.substring(0, 5000)}...
\`\`\`

**TAREFAS OBRIGATÓRIAS:**

1. **CONECTAR APIS:**
   - Atualizar URLs do frontend para o backend
   - Configurar CORS adequadamente
   - Implementar interceptors de erro
   - Adicionar loading states

2. **SINCRONIZAR TIPOS:**
   - Criar tipos TypeScript compartilhados
   - Validar schemas entre front/back
   - Implementar validação de dados

3. **IMPLEMENTAR AUTENTICAÇÃO:**
   - Conectar login/register
   - Implementar refresh tokens
   - Proteger rotas privadas

4. **OTIMIZAR PERFORMANCE:**
   - Implementar cache
   - Otimizar queries
   - Adicionar paginação

**FORMATO DE RESPOSTA:**
\`\`\`json
{
  "connectedFrontend": "<!-- HTML completo do frontend conectado -->",
  "connectedBackend": "// Código completo do backend atualizado",
  "integrationGuide": "# Guia de integração e deploy"
}
\`\`\`

**SOLICITAÇÃO ORIGINAL:**
"${userPrompt}"

CONECTE TUDO DE FORMA FUNCIONAL E REAL!`;
  }

  /**
   * Parse do resultado da conexão
   */
  private parseConnectionResult(result: string): {
    connectedFrontend: string;
    connectedBackend: string;
    integrationGuide: string;
  } {
    try {
      // Tentar extrair JSON do resultado
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          connectedFrontend: parsed.connectedFrontend || '',
          connectedBackend: parsed.connectedBackend || '',
          integrationGuide: parsed.integrationGuide || '',
        };
      }
      
      // Fallback: extrair seções manualmente
      const frontendMatch = result.match(/<!-- HTML completo do frontend conectado -->([\s\S]*?)(?=\/\/ Código completo do backend|$)/);
      const backendMatch = result.match(/\/\/ Código completo do backend atualizado([\s\S]*?)(?=# Guia de integração|$)/);
      const guideMatch = result.match(/# Guia de integração e deploy([\s\S]*?)$/);
      
      return {
        connectedFrontend: frontendMatch?.[1]?.trim() || result,
        connectedBackend: backendMatch?.[1]?.trim() || '',
        integrationGuide: guideMatch?.[1]?.trim() || '',
      };
    } catch (error) {
      console.error('Erro ao fazer parse do resultado de conexão:', error);
      return {
        connectedFrontend: result,
        connectedBackend: '',
        integrationGuide: 'Erro ao processar guia de integração',
      };
    }
  }

  /**
   * Constrói prompt com sistema anti-simulação
   */
  private buildAntiSimulationPrompt(userPrompt: string, context?: any): string {
    return `${ANTI_SIMULATION_CONTRACT}

${PRODUCTION_READY_INSTRUCTIONS}

${INTEGRATION_ENFORCEMENT}

${AI_SILENCE_CONTRACT}

${DESIGN_ENTITY_CONSCIOUSNESS}

**CONTEXTO DO PROJETO:**
${context ? JSON.stringify(context, null, 2) : 'Novo projeto fullstack'}

**SOLICITAÇÃO DO USUÁRIO:**
"${userPrompt}"

**🎨 SISTEMA DE IMAGENS OBRIGATÓRIO:**
- TODO site DEVE ter imagens relevantes - NUNCA deixe sem imagens
- Use placeholders: src="ai-researched-image://descrição muito detalhada"
- Exemplos por categoria:
  * E-commerce: "produto smartphone moderno, fotografia profissional, fundo neutro"
  * Restaurante: "pizza margherita artesanal, forno a lenha, fotografia gastronômica"
  * Pet Shop: "saco de ração premium, embalagem colorida, fotografia de produto"
  * Empresa: "logotipo moderno minimalista, design profissional, cores corporativas"
- SEMPRE inclua 3-5 imagens por página mínimo
- Descrições DEVEM ser específicas: cores, estilo, iluminação, contexto

**INSTRUÇÕES ESPECÍFICAS:**
- Se for e-commerce: Implemente Stripe, carrinho, checkout completo + FOTOS DOS PRODUTOS
- Se for blog: Implemente CMS, comentários, busca + IMAGENS DOS ARTIGOS
- Se for dashboard: Implemente gráficos reais, filtros, exportação + ÍCONES E GRÁFICOS
- Se for social: Implemente posts, likes, comentários, notificações + FOTOS DE PERFIL
- Se for SaaS: Implemente planos, billing, analytics + IMAGENS INSTITUCIONAIS
- Se for Pet Shop: Implemente catálogo, carrinho + FOTOS DE PRODUTOS E ANIMAIS

**TECNOLOGIAS OBRIGATÓRIAS:**
- Frontend: React/Next.js + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL + Prisma ORM
- Auth: JWT + bcrypt
- Pagamentos: Stripe
- Email: Nodemailer
- Upload: Multer + Cloudinary
- Deploy: Docker + Vercel/Railway

**RESPOSTA ESPERADA:**
APENAS código HTML completo e funcional que pode ser aberto diretamente no navegador.

**FORMATO OBRIGATÓRIO:**
Arquivo HTML completo com:
- DOCTYPE html
- Head com meta tags e scripts necessários
- Body com interface funcional
- JavaScript real e funcional
- Dados realistas, não Lorem Ipsum
- Funcionalidades que realmente funcionam

**REGRAS CRÍTICAS:**
1. HTML deve funcionar quando aberto no navegador
2. JavaScript deve ser funcional, não comentários
3. Interface deve ser responsiva e interativa
4. Dados devem ser realistas, não Lorem Ipsum
5. Funcionalidades devem funcionar de verdade
3. Script de inicialização para setup automático

NUNCA SIMULE. SEMPRE IMPLEMENTE COMPLETAMENTE.`;
  }

  /**
   * Sistema inteligente de pontuação para detecção de simulação
   */
  private calculateSimulationScore(code: string, context?: any): {
    score: number;
    issues: Array<{type: string; severity: 'low' | 'medium' | 'high'; pattern: string; context?: string}>;
    isAcceptable: boolean;
  } {
    let simulationScore = 0;
    const issues: Array<{type: string; severity: 'low' | 'medium' | 'high'; pattern: string; context?: string}> = [];
    
    // Remover placeholders de imagem válidos
    const codeWithoutImagePlaceholders = code.replace(/ai-researched-image:\/\/[^"'\s]+/g, 'VALID_IMAGE_PLACEHOLDER');
    
    // Padrões críticos de simulação (alta severidade)
    const criticalPatterns = [
      { pattern: /aqui você (conectaria|implementaria|adicionaria)/i, weight: 30, type: 'critical_simulation' },
      { pattern: /este seria o (endpoint|código|arquivo)/i, weight: 25, type: 'hypothetical_code' },
      { pattern: /simule (a|o|os|as)/i, weight: 35, type: 'explicit_simulation' },
      { pattern: /data:image\/[^;]+;base64,/i, weight: 40, type: 'base64_image' },
    ];
    
    // Padrões moderados (média severidade)
    const moderatePatterns = [
      { pattern: /lorem ipsum/i, weight: 15, type: 'placeholder_text' },
      { pattern: /substitua (por|este|esta)/i, weight: 12, type: 'replacement_instruction' },
      { pattern: /exemplo de (como|uso)/i, weight: 10, type: 'example_code' },
      { pattern: /\[placeholder\]/i, weight: 8, type: 'bracket_placeholder' },
      { pattern: /\{placeholder\}/i, weight: 8, type: 'brace_placeholder' },
    ];
    
    // Padrões leves (baixa severidade)
    const lightPatterns = [
      { pattern: /TODO:/i, weight: 3, type: 'todo_comment' },
      { pattern: /FIXME:/i, weight: 3, type: 'fixme_comment' },
      { pattern: /placeholder text/i, weight: 5, type: 'placeholder_reference' },
      { pattern: /placeholder content/i, weight: 5, type: 'placeholder_reference' },
    ];
    
    // Verificar padrões críticos
    for (const {pattern, weight, type} of criticalPatterns) {
      if (pattern.test(codeWithoutImagePlaceholders)) {
        simulationScore += weight;
        issues.push({type, severity: 'high', pattern: pattern.source});
      }
    }
    
    // Verificar padrões moderados
    for (const {pattern, weight, type} of moderatePatterns) {
      if (pattern.test(codeWithoutImagePlaceholders)) {
        simulationScore += weight;
        issues.push({type, severity: 'medium', pattern: pattern.source});
      }
    }
    
    // Verificar padrões leves com contexto
    for (const {pattern, weight, type} of lightPatterns) {
      if (pattern.test(codeWithoutImagePlaceholders)) {
        const contextualWeight = this.isAcceptableInContext(type, context) ? weight * 0.3 : weight;
        simulationScore += contextualWeight;
        issues.push({type, severity: 'low', pattern: pattern.source, context: context?.projectType});
      }
    }
    
    // Bonificações por código real
    const realCodeBonuses = [
      { pattern: /import .+ from ['"].+['"]/g, bonus: -2, type: 'real_imports' },
      { pattern: /export (default |const |function )/g, bonus: -1, type: 'real_exports' },
      { pattern: /\.(get|post|put|delete)\(/g, bonus: -3, type: 'real_api_methods' },
      { pattern: /jwt\.sign|bcrypt\.(hash|compare)/g, bonus: -5, type: 'real_auth' },
      { pattern: /prisma\.|mongoose\./g, bonus: -4, type: 'real_database' },
    ];
    
    for (const {pattern, bonus} of realCodeBonuses) {
      const matches = codeWithoutImagePlaceholders.match(pattern);
      if (matches) {
        simulationScore += bonus * matches.length;
      }
    }
    
    // Garantir que o score não seja negativo
    simulationScore = Math.max(0, simulationScore);
    
    return {
      score: simulationScore,
      issues,
      isAcceptable: simulationScore < 20
    };
  }

  /**
   * Verifica se um padrão é aceitável no contexto atual
   */
  private isAcceptableInContext(patternType: string, context?: any): boolean {
    if (!context) return false;
    
    if ((patternType === 'todo_comment' || patternType === 'fixme_comment') && 
        context.developmentPhase === 'prototype') {
      return true;
    }
    
    if (patternType.includes('placeholder') && context.isTemplate) {
      return true;
    }
    
    return false;
  }

  /**
   * Sistema inteligente de refinamento com estratégias adaptativas
   */
  async enforceRealImplementation(
    userPrompt: string,
    generatedCode: string,
    context?: any,
    maxRetries: number = 3
  ): Promise<{
    code: string;
    finalScore: number;
    improvementsMade: string[];
  }> {
    let attempts = 0;
    let currentCode = generatedCode;
    const improvementsMade: string[] = [];

    while (attempts < maxRetries) {
      // Usar sistema inteligente de validação
      const analysis = this.calculateSimulationScore(generatedCode, context);
      if (!analysis.isAcceptable) {
        throw new Error(`Simulação detectada. Score: ${analysis.score}`);
      }

      attempts++;
      console.warn(`Score de simulação: ${analysis.score}, tentativa ${attempts}/${maxRetries}`);
      
      if (attempts >= maxRetries) {
        if (analysis.score < 35) {
          console.warn('Código com simulação leve aceito após múltiplas tentativas');
          return {
            code: currentCode,
            finalScore: analysis.score,
            improvementsMade: [...improvementsMade, 'accepted_with_warning']
          };
        }
        throw new Error(`Sistema anti-simulação falhou. Score final: ${analysis.score}`);
      }

      const refinementStrategy = this.buildRefinementStrategy(analysis.issues);
      const refinedPrompt = this.buildAdaptivePrompt(userPrompt, refinementStrategy, attempts);
      
      improvementsMade.push(`attempt_${attempts}_${refinementStrategy.focus}`);
      currentCode = await this.generateRealCode(refinedPrompt, context);
    }

    return {
      code: currentCode,
      finalScore: 0,
      improvementsMade
    };
  }
  
  /**
   * Constrói estratégia de refinamento baseada nos problemas detectados
   */
  private buildRefinementStrategy(issues: Array<{type: string; severity: string}>): {
    focus: string;
    approach: string;
    specificInstructions: string[];
  } {
    const highSeverityIssues = issues.filter(i => i.severity === 'high');
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium');
    
    if (highSeverityIssues.length > 0) {
      const criticalTypes = highSeverityIssues.map(i => i.type);
      
      if (criticalTypes.includes('base64_image')) {
        return {
          focus: 'image_handling',
          approach: 'aggressive',
          specificInstructions: [
            'NUNCA gere imagens Base64 no código',
            'Use apenas URLs de imagem ou placeholders de URL',
            'Implemente sistema de upload real se necessário'
          ]
        };
      }
      
      if (criticalTypes.includes('explicit_simulation')) {
        return {
          focus: 'real_implementation',
          approach: 'aggressive',
          specificInstructions: [
            'Implemente funcionalidades reais, não simulações',
            'Use APIs e bibliotecas reais',
            'Crie lógica de negócio funcional'
          ]
        };
      }
    }
    
    if (mediumSeverityIssues.length > 2) {
      return {
        focus: 'placeholder_elimination',
        approach: 'moderate',
        specificInstructions: [
          'Substitua todos os placeholders por conteúdo real',
          'Use dados realistas em vez de Lorem Ipsum',
          'Implemente funcionalidades completas'
        ]
      };
    }
    
    return {
      focus: 'general_improvement',
      approach: 'gentle',
      specificInstructions: [
        'Melhore a qualidade geral do código',
        'Adicione mais funcionalidades reais',
        'Garanta que tudo funcione corretamente'
      ]
    };
  }

  /**
   * Constrói prompt adaptativo baseado na estratégia
   */
  private buildAdaptivePrompt(originalPrompt: string, strategy: any, attempt: number): string {
    const intensityLevel = attempt === 1 ? 'moderate' : attempt === 2 ? 'high' : 'maximum';
    
    let adaptivePrompt = `${originalPrompt}\n\n`;
    
    if (strategy.approach === 'aggressive') {
      adaptivePrompt += `**CORREÇÃO CRÍTICA NECESSÁRIA (Tentativa ${attempt})**\n\n`;
    } else {
      adaptivePrompt += `**REFINAMENTO NECESSÁRIO (Tentativa ${attempt})**\n\n`;
    }
    
    adaptivePrompt += strategy.specificInstructions.map((inst: string) => `• ${inst}`).join('\n');
    adaptivePrompt += '\n\n';
    
    if (intensityLevel === 'maximum') {
      adaptivePrompt += `**ÚLTIMA TENTATIVA - MÁXIMA QUALIDADE EXIGIDA**\n`;
      adaptivePrompt += `Implemente código 100% funcional e production-ready.\n`;
    }
    
    return adaptivePrompt;
  }
}

// Instância global do sistema anti-simulação
export const antiSimulationSystem = new AntiSimulationSystem();

// Função helper para uso direto
export async function generateWithAntiSimulation(
  userPrompt: string,
  context?: any
): Promise<string> {
  return antiSimulationSystem.generateRealCode(userPrompt, context);
}

/**
 * Gera APENAS FRONTEND com sistema anti-simulação
 */
export async function generateFrontendOnly(
  userPrompt: string,
  options: {
    currentCode?: string;
    techStack?: string[];
    designSystem?: string;
    maxRetries?: number;
  } = {}
): Promise<{
  code: string;
  isProductionReady: boolean;
  hasRealFunctionality: boolean;
  qualityScore: number;
}> {
  const {
    currentCode,
    techStack = ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    designSystem = 'modern',
    maxRetries = 3
  } = options;

  const context = {
    currentCode,
    techStack,
    designSystem,
    requirements: extractRequirements(userPrompt),
  };

  try {
    const generatedCode = await antiSimulationSystem.generateFrontendOnly(userPrompt, context);
    const analysis = analyzeCodeQuality(generatedCode);

    return {
      code: generatedCode,
      isProductionReady: analysis.isProductionReady,
      hasRealFunctionality: analysis.hasRealFunctionality,
      qualityScore: analysis.integrationScore,
    };
  } catch (error) {
    console.error('Erro na geração de frontend:', error);
    throw error;
  }
}

/**
 * Gera APENAS BACKEND com sistema anti-simulação
 */
export async function generateBackendOnly(
  userPrompt: string,
  options: {
    currentCode?: string;
    frontendCode?: string;
    techStack?: string[];
    maxRetries?: number;
  } = {}
): Promise<{
  code: string;
  isProductionReady: boolean;
  hasRealFunctionality: boolean;
  qualityScore: number;
}> {
  const {
    currentCode,
    frontendCode,
    techStack = ['Node.js', 'Express', 'PostgreSQL', 'Prisma'],
    maxRetries = 3
  } = options;

  const context = {
    currentCode,
    frontendCode,
    techStack,
    requirements: extractRequirements(userPrompt),
  };

  try {
    const generatedCode = await antiSimulationSystem.generateBackendOnly(userPrompt, context);
    const analysis = analyzeCodeQuality(generatedCode);

    return {
      code: generatedCode,
      isProductionReady: analysis.isProductionReady,
      hasRealFunctionality: analysis.hasRealFunctionality,
      qualityScore: analysis.integrationScore,
    };
  } catch (error) {
    console.error('Erro na geração de backend:', error);
    throw error;
  }
}

/**
 * Conecta Frontend + Backend automaticamente
 */
export async function connectFrontendBackend(
  frontendCode: string,
  backendCode: string,
  userPrompt: string
): Promise<{
  connectedFrontend: string;
  connectedBackend: string;
  integrationGuide: string;
  isFullyConnected: boolean;
}> {
  try {
    const result = await antiSimulationSystem.connectFrontendBackend(
      frontendCode,
      backendCode,
      userPrompt
    );

    // Validar se a conexão foi bem-sucedida
    const isFullyConnected = validateConnection(result.connectedFrontend, result.connectedBackend);

    return {
      ...result,
      isFullyConnected,
    };
  } catch (error) {
    console.error('Erro na conexão frontend-backend:', error);
    throw error;
  }
}

/**
 * Valida se frontend e backend estão conectados
 */
function validateConnection(frontendCode: string, backendCode: string): boolean {
  // Verificar se frontend tem chamadas para APIs
  const hasApiCalls = /fetch\(|axios\.|api\./i.test(frontendCode);
  
  // Verificar se backend tem rotas definidas
  const hasRoutes = /app\.(get|post|put|delete)|router\./i.test(backendCode);
  
  // Verificar se há configuração de CORS
  const hasCors = /cors|origin/i.test(backendCode);
  
  return hasApiCalls && hasRoutes && hasCors;
}

/**
 * Função principal para geração de código com sistema anti-simulação integrado
 */
export async function generateProductionReadyCode(
  userPrompt: string,
  options: {
    currentCode?: string;
    projectType?: 'fullstack' | 'frontend' | 'backend' | 'mobile' | 'clone';
    techStack?: string[];
    enforceIntegration?: boolean;
    maxRetries?: number;
  } = {}
): Promise<{
  code: string;
  isProductionReady: boolean;
  hasRealFunctionality: boolean;
  integrationScore: number;
}> {
  const {
    currentCode,
    projectType = 'fullstack',
    techStack = ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    enforceIntegration = true,
    maxRetries = 3
  } = options;

  // Detectar tipo de projeto baseado no prompt
  const detectedType = detectProjectType(userPrompt);
  const finalProjectType = detectedType || projectType;

  // Construir contexto enriquecido
  const context = {
    currentCode,
    projectType: finalProjectType,
    techStack,
    requirements: extractRequirements(userPrompt),
    integrations: detectRequiredIntegrations(userPrompt),
  } as any;

  try {
    // Gerar código com sistema anti-simulação
    let generatedCode = await antiSimulationSystem.generateRealCode(userPrompt, context);
    
    // Forçar implementação real se necessário
    if (enforceIntegration) {
      const refinementResult = await antiSimulationSystem.enforceRealImplementation(
        userPrompt,
        generatedCode,
        context,
        maxRetries
      );
      generatedCode = refinementResult.code;
    }

    // Analisar qualidade do código gerado
    const analysis = analyzeCodeQuality(generatedCode);

    return {
      code: generatedCode,
      isProductionReady: analysis.isProductionReady,
      hasRealFunctionality: analysis.hasRealFunctionality,
      integrationScore: analysis.integrationScore,
    };
  } catch (error) {
    console.error('Erro na geração de código production-ready:', error);
    throw error;
  }
}

/**
 * Detecta o tipo de projeto baseado no prompt do usuário
 */
function detectProjectType(prompt: string): 'fullstack' | 'frontend' | 'backend' | 'mobile' | 'clone' | null {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('clone') || promptLower.includes('replica')) {
    return 'clone';
  }
  if (promptLower.includes('e-commerce') || promptLower.includes('loja')) {
    return 'fullstack';
  }
  if (promptLower.includes('dashboard') || promptLower.includes('admin')) {
    return 'fullstack';
  }
  if (promptLower.includes('blog') || promptLower.includes('cms')) {
    return 'fullstack';
  }
  if (promptLower.includes('api') || promptLower.includes('backend')) {
    return 'backend';
  }
  if (promptLower.includes('landing') || promptLower.includes('página')) {
    return 'frontend';
  }
  
  return null;
}

/**
 * Extrai requisitos específicos do prompt
 */
function extractRequirements(prompt: string): string[] {
  const requirements: string[] = [];
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('pagamento') || promptLower.includes('stripe')) {
    requirements.push('payment_integration');
  }
  if (promptLower.includes('login') || promptLower.includes('auth')) {
    requirements.push('authentication');
  }
  if (promptLower.includes('email') || promptLower.includes('notificação')) {
    requirements.push('email_system');
  }
  if (promptLower.includes('upload') || promptLower.includes('arquivo')) {
    requirements.push('file_upload');
  }
  if (promptLower.includes('busca') || promptLower.includes('pesquisa')) {
    requirements.push('search_functionality');
  }
  if (promptLower.includes('chat') || promptLower.includes('mensagem')) {
    requirements.push('real_time_chat');
  }
  
  return requirements;
}

/**
 * Detecta integrações necessárias
 */
function detectRequiredIntegrations(prompt: string): string[] {
  const integrations: string[] = [];
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('stripe') || promptLower.includes('pagamento')) {
    integrations.push('stripe');
  }
  if (promptLower.includes('google') || promptLower.includes('maps')) {
    integrations.push('google_apis');
  }
  if (promptLower.includes('social') || promptLower.includes('facebook')) {
    integrations.push('social_login');
  }
  if (promptLower.includes('email') || promptLower.includes('sendgrid')) {
    integrations.push('email_service');
  }
  if (promptLower.includes('cloudinary') || promptLower.includes('imagem')) {
    integrations.push('cloudinary');
  }
  
  return integrations;
}

/**
 * Analisa a qualidade do código gerado
 */
function analyzeCodeQuality(code: string): {
  isProductionReady: boolean;
  hasRealFunctionality: boolean;
  integrationScore: number;
} {
  let score = 0;
  let maxScore = 10;

  // Verificar se tem estrutura de projeto completa
  if (code.includes('package.json') && code.includes('server.ts')) {
    score += 2;
  }

  // Verificar se tem autenticação real
  if (code.includes('jwt.sign') && code.includes('bcrypt')) {
    score += 2;
  }

  // Verificar se tem banco de dados
  if (code.includes('prisma') || code.includes('mongoose')) {
    score += 2;
  }

  // Verificar se tem APIs reais
  if (code.includes('app.post') && code.includes('app.get')) {
    score += 2;
  }

  // Verificar se tem validação e segurança
  if (code.includes('helmet') && code.includes('cors')) {
    score += 1;
  }

  // Verificar se tem tratamento de erros
  if (code.includes('try {') && code.includes('catch')) {
    score += 1;
  }

  const integrationScore = (score / maxScore) * 100;
  
  return {
    isProductionReady: integrationScore >= 80,
    hasRealFunctionality: integrationScore >= 60,
    integrationScore,
  };
}