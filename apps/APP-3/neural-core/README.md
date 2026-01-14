# 🧠 Neural Core - Orquestrador Inteligente

> **O Cérebro Central do AI Web Weaver com Context Injection System**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.0+-orange.svg)](https://hono.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

## 🎯 O Que É o Neural Core?

O **Neural Core** é um servidor proxy inteligente que atua como o **cérebro central** do AI Web Weaver. Ele não é apenas um "túnel burro" - é um **orquestrador de sabedoria** que:

### 🧠 Funcionalidades Principais

1. **Context Injection System**
   - Detecta automaticamente o tipo de projeto (game, fintech, fullstack)
   - Injeta manifestos e protocolos específicos no prompt
   - Enriquece prompts simples com toda a sabedoria do sistema

2. **Segurança por Design**
   - API Keys NUNCA expostas no frontend
   - Validação rigorosa com Zod
   - Rate limiting integrado
   - CORS configurável

3. **Detecção Inteligente**
   - 🎮 Game Dev Protocol (jogos)
   - 🏦 Fintech Architect Protocol (bancos/pagamentos)
   - ⚡ Fullstack Pro Protocol (apps completos)
   - 📄 Single File App (apps portáteis)

4. **Performance**
   - Construído com Hono (ultra-rápido)
   - Suporte a streaming (em breve)
   - Compressão automática
   - Logs estruturados

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- npm ou yarn
- API Key do Google Gemini

### Instalação

```bash
# 1. Entre na pasta
cd neural-core

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY

# 4. Execute em desenvolvimento
npm run dev

# Ou com Docker
docker-compose up
```

### Teste

```bash
# Health check
curl http://localhost:3000/health

# Analisar contexto
curl -X POST http://localhost:3000/api/analyze-context \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Crie um jogo de plataforma"}'

# Gerar código
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Crie um app de pizzaria",
    "modelName": "gemini-2.5-flash"
  }'
```

## 📐 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│  (React - AI Web Weaver)                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ POST /api/generate
                  │ { prompt: "Crie um app de pizzaria" }
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEURAL CORE                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  1. Context Manager                                   │  │
│  │     - Detecta: Fullstack App                          │  │
│  │     - Injeta: ARTISAN_MANIFESTO                       │  │
│  │     - Injeta: FULLSTACK_PRO_PROTOCOL                  │  │
│  │     - Injeta: EXCELLENCE_CRITERIA                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Prompt Original: "Crie um app de pizzaria"                │
│                                                             │
│  Prompt Enriquecido:                                        │
│  "🚀 DIRETIVA SUPREMA: APLICATIVOS VIVOS...                │
│   ⚡ PROTOCOLO FULLSTACK PROFISSIONAL...                   │
│   🏆 CRITÉRIOS DE EXCELÊNCIA MÁXIMA...                     │
│   ### PEDIDO DO USUÁRIO ###                                │
│   Crie um app de pizzaria"                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Prompt Enriquecido
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   GEMINI API                                │
│  - Recebe prompt com TODA a sabedoria                       │
│  - Gera código seguindo TODOS os protocolos                 │
│  - Retorna app fullstack completo                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Código Gerado
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│  - Recebe código pronto                                     │
│  - Exibe no editor                                          │
│  - Preview funcional                                        │
└─────────────────────────────────────────────────────────────┘
```

## 🧠 Context Injection System

### Como Funciona

1. **Detecção Automática**
   ```typescript
   const context = analyzePromptContext("Crie um jogo de plataforma");
   // { isGame: true, isFintech: false, isFullstack: false }
   ```

2. **Seleção de Protocolos**
   ```typescript
   if (isGame) {
     systemInstruction += GAME_DEV_PROTOCOL;
   }
   if (isFintech) {
     systemInstruction += FINTECH_ARCHITECT_PROTOCOL;
   }
   if (isFullstack) {
     systemInstruction += FULLSTACK_PRO_PROTOCOL;
   }
   ```

3. **Enriquecimento**
   ```typescript
   const enrichedPrompt = `
     ${ARTISAN_DIGITAL_MANIFESTO}
     ${selectedProtocols}
     ${EXCELLENCE_CRITERIA}
     
     ### PEDIDO DO USUÁRIO ###
     ${userPrompt}
   `;
   ```

### Protocolos Disponíveis

#### 🎨 ARTISAN_DIGITAL_MANIFESTO
- Princípios de código vivo e funcional
- Proibições absolutas (blueprints, TODOs, placeholders)
- Mentalidade de aplicativos reais

#### 🏦 FINTECH_ARCHITECT_PROTOCOL
- Arquitetura de contas virtuais
- Fluxos PIX (depósito, saque, empréstimo)
- Schema PostgreSQL obrigatório
- Transações atômicas
- Compliance BACEN

#### ⚡ FULLSTACK_PRO_PROTOCOL
- Estrutura backend + frontend
- Prisma + PostgreSQL
- Autenticação JWT
- Docker Compose
- API REST completa

#### 🎮 GAME_DEV_PROTOCOL
- Game loop sólido
- Sistema de física e colisões
- Áudio e feedback
- Progressão e recompensas

#### 🏆 EXCELLENCE_CRITERIA
- 7 critérios de avaliação
- Score mínimo 100/100
- Acessibilidade prioritária
- Responsividade obrigatória

## 📡 API Reference

### POST /api/generate

Gera código com context injection.

**Request:**
```json
{
  "prompt": "Crie um app de tarefas",
  "modelName": "gemini-2.5-flash",
  "temperature": 0.7,
  "maxOutputTokens": 8192
}
```

**Response:**
```json
{
  "success": true,
  "text": "<!DOCTYPE html>...",
  "metadata": {
    "detectedContext": {
      "isGame": false,
      "isFintech": false,
      "isFullstack": true,
      "isSingleFile": false
    },
    "appliedProtocols": [
      "ARTISAN_DIGITAL_MANIFESTO",
      "FULLSTACK_PRO_PROTOCOL",
      "EXCELLENCE_CRITERIA"
    ],
    "duration": 3542,
    "promptLength": 25,
    "enrichedPromptLength": 15420,
    "responseLength": 45230
  }
}
```

### POST /api/analyze-context

Analisa o contexto sem gerar código.

**Request:**
```json
{
  "prompt": "Crie um banco digital"
}
```

**Response:**
```json
{
  "success": true,
  "context": {
    "isGame": false,
    "isFintech": true,
    "isFullstack": true,
    "isSingleFile": false
  }
}
```

### GET /health

Health check do servidor.

**Response:**
```json
{
  "status": "ok",
  "service": "neural-core",
  "version": "2.0.0",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Obrigatório
GEMINI_API_KEY=sua_chave_aqui

# Opcional
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=15
```

### Modelos Suportados

**Modelos Mais Recentes (2025):**
- `gemini-2.5-pro` - Modelo mais poderoso e inteligente
- `gemini-2.5-flash` (padrão) - Rápido e eficiente
- `gemini-flash-latest` - Sempre a versão mais recente do Flash
- `gemini-flash-lite-latest` - Versão leve e ultra-rápida

**Modelos Anteriores (Compatibilidade):**
- `gemini-2.0-flash-exp` - Experimental
- `gemini-1.5-flash` - Versão anterior
- `gemini-1.5-pro` - Versão anterior Pro

## 🐳 Docker

### Build

```bash
docker build -t neural-core .
```

### Run

```bash
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=sua_chave \
  neural-core
```

### Docker Compose

```bash
docker-compose up -d
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📊 Métricas

### Antes do Neural Core (Frontend pesado)

- ❌ Manifestos no bundle do frontend (~500KB)
- ❌ API Key exposta no cliente
- ❌ Lógica de detecção no frontend
- ❌ Sem cache de contexto
- ❌ Prompts inconsistentes

### Depois do Neural Core (Backend inteligente)

- ✅ Frontend leve (~50KB a menos)
- ✅ API Key 100% segura
- ✅ Detecção centralizada e consistente
- ✅ Cache de contexto (Redis)
- ✅ Prompts sempre enriquecidos
- ✅ Logs auditáveis
- ✅ Rate limiting integrado

## 🛣️ Roadmap

- [ ] Streaming de respostas (SSE)
- [ ] Cache Redis para contextos
- [ ] Métricas com Prometheus
- [ ] Webhooks para notificações
- [ ] Suporte a múltiplas APIs de IA
- [ ] Dashboard de monitoramento
- [ ] A/B testing de protocolos

## 📝 Licença

MIT

## 🙏 Créditos

Desenvolvido com ❤️ por Almir Felix

---

**Neural Core** - O Cérebro que Transforma Prompts Simples em Código Excepcional 🧠✨
