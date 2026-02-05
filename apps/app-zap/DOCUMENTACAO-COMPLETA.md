# 👻 GHOST PROTOCOL v5.0 - DOCUMENTAÇÃO COMPLETA

## Sistema de IA Autônoma para WhatsApp

**Autor:** Almir  
**Versão:** 5.0 Enterprise  
**Data:** Janeiro 2026  
**Stack:** Node.js + TypeScript + Next.js + Prisma + SQLite + Gemini AI

---

# 📚 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Backend - Services](#3-backend---services)
4. [Backend - Controllers](#4-backend---controllers)
5. [Frontend - Command Center](#5-frontend---command-center)
6. [Database Schema](#6-database-schema)
7. [API Endpoints](#7-api-endpoints)
8. [Fluxo de Mensagens](#8-fluxo-de-mensagens)
9. [Configuração e Deploy](#9-configuração-e-deploy)
10. [Conceitos Avançados](#10-conceitos-avançados)

---

# 1. VISÃO GERAL

## O que é o Ghost Protocol?

O **Ghost Protocol** é um sistema de IA autônoma que controla uma conta de WhatsApp, respondendo mensagens de forma inteligente e humanizada. Ele foi projetado para:

- 🤖 **Responder automaticamente** como se fosse uma pessoa real
- 🧠 **Aprender o estilo de escrita** do operador humano
- 💰 **Converter leads em vendas** usando técnicas de persuasão
- 🛡️ **Detectar riscos** em tempo real (polícia, golpes, etc)
- 📊 **Gerar analytics** sobre conversas e conversões

## Para que serve?

1. **Atendimento 24/7** - A IA responde enquanto você dorme
2. **Escalabilidade** - Atenda milhares de contatos simultaneamente
3. **Consistência** - Respostas sempre no tom certo
4. **Conversão** - IA treinada para fechar vendas

## Diagrama Simplificado

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   WhatsApp   │ ──▶ │  Ghost Protocol │ ──▶ │   Gemini AI  │
│   (Baileys)  │ ◀── │    (Node.js)    │ ◀── │   (Google)   │
└──────────────┘     └─────────────────┘     └──────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Command Center │
                     │   (Next.js UI)  │
                     └─────────────────┘
```

---

# 2. ARQUITETURA DO SISTEMA

## Estrutura de Pastas

```
apps/app-zap/
├── backend/                    # API Node.js + Express
│   ├── prisma/
│   │   └── schema.prisma       # Modelos do banco de dados
│   ├── src/
│   │   ├── config/             # Configurações (env, etc)
│   │   ├── controllers/        # Endpoints da API (10 arquivos)
│   │   ├── repositories/       # Acesso ao banco de dados
│   │   ├── services/           # Lógica de negócio (25 arquivos)
│   │   ├── routes/             # Definição de rotas
│   │   └── index.ts            # Entry point
│   └── Dockerfile
├── frontend/                   # Interface React/Next.js
│   ├── src/
│   │   ├── app/
│   │   │   └── command-center/ # 13 páginas do dashboard
│   │   ├── services/
│   │   │   └── ghost-api.ts    # Cliente HTTP para API
│   │   └── lib/
│   │       └── api.ts          # Axios configurado
│   └── Dockerfile
└── docker-compose.yml          # Deploy com Docker
```

## Tecnologias Usadas

| Tecnologia | Uso |
|------------|-----|
| **Node.js** | Runtime do backend |
| **TypeScript** | Linguagem tipada |
| **Express** | Framework HTTP |
| **Prisma** | ORM para banco de dados |
| **SQLite** | Banco de dados local |
| **Baileys** | Biblioteca WhatsApp Web |
| **Google Gemini** | IA para gerar respostas |
| **Next.js 14** | Framework React para frontend |
| **TailwindCSS** | Estilização |
| **Lucide React** | Ícones |

---

# 3. BACKEND - SERVICES

Os **Services** contêm toda a lógica de negócio. Cada um tem uma responsabilidade específica.

## 3.1 WhatsApp Service
📁 `whatsapp.service.ts`

**O que faz:** Conecta ao WhatsApp via Baileys e gerencia envio/recebimento de mensagens.

```typescript
// Exemplo de uso:
const whatsapp = new WhatsAppService();
await whatsapp.sendMessage('5511999999999@c.us', 'Olá!');
```

**Funções principais:**
- `initialize()` - Inicia conexão com WhatsApp
- `sendMessage(to, message)` - Envia mensagem de texto
- `sendAudio(to, audioPath)` - Envia áudio
- `sendImage(to, imagePath)` - Envia imagem
- `onMessage(callback)` - Escuta novas mensagens

---

## 3.2 Gemini Service
📁 `gemini.service.ts`

**O que faz:** Integração com Google Gemini para gerar respostas inteligentes.

```typescript
// Exemplo de uso:
const gemini = new GeminiService();
const response = await gemini.generateResponse(contact, messageHistory);
```

**Funções principais:**
- `generateResponse(contact, history)` - Gera resposta contextual
- `analyzeImage(contact, imageBase64)` - Analisa imagem recebida
- `processAudio(contact, audioBase64)` - Transcreve áudio
- `generateImage(prompt)` - Gera imagem com Imagen 4

**Como funciona a geração de resposta:**
1. Recebe histórico de mensagens do contato
2. Busca memórias relevantes (via MemoryService)
3. Busca estilo de escrita (via StyleExtractorService)
4. Monta prompt com todas as informações
5. Chama Gemini API
6. Retorna resposta humanizada

---

## 3.3 Style Extractor Service
📁 `style-extractor.service.ts`

**O que faz:** Analisa mensagens do operador humano e extrai seu "DNA de escrita".

```typescript
// Exemplo de uso:
const extractor = new StyleExtractorService();
const styleDNA = await extractor.extractStyleFromOperator('id-contato');
```

**O que extrai:**
- `avgWordsPerMessage` - Média de palavras por mensagem
- `emojiFrequency` - Frequência de emojis (0 a 1)
- `punctuationStyle` - Estilo de pontuação ("formal" ou "casual")
- `usesAbbreviations` - Se usa vc, tb, pq, etc
- `topSlangWords` - Gírias mais usadas
- `topExpressions` - Expressões frequentes

**Por que é importante:**
A IA usa essas informações para imitar o estilo do operador, tornando as respostas indistinguíveis de uma pessoa real.

---

## 3.4 Memory Service
📁 `memory.service.ts`

**O que faz:** Gerencia memória de longo prazo, criando resumos diários das conversas.

```typescript
// Exemplo de uso:
const memory = new MemoryService();
const summary = await memory.generateDailySummary('id-contato');
const memories = await memory.getRelevantMemories('id-contato', 'pergunta sobre preço');
```

**Funções principais:**
- `generateDailySummary(contactId)` - Cria resumo do dia
- `generateContactProfile(contactId)` - Cria perfil psicológico
- `getRelevantMemories(contactId, context)` - Busca memórias relevantes

**Tipos de memória salvos:**
- DAILY_SUMMARY - Resumo diário
- CONTACT_PROFILE - Perfil do contato
- IMPORTANT_TOPIC - Assuntos importantes
- OBJECTION_HANDLED - Objeções superadas

---

## 3.5 Objection Learner Service
📁 `objection-learner.service.ts`

**O que faz:** Aprende técnicas de vendas observando como o operador responde objeções.

```typescript
// Exemplo de uso:
const learner = new ObjectionLearnerService();
const handled = await learner.detectAndLearnObjection(contact, messages);
const prompt = await learner.generateObjectionHandlingPrompt('PRICE');
```

**5 categorias de objeções:**
1. **PRICE** - "Tá caro", "Não tenho dinheiro"
2. **TRUST** - "Não confio", "É golpe?"
3. **TIMING** - "Agora não", "Depois eu vejo"
4. **NEED** - "Não preciso", "Não quero"
5. **COMPETITION** - "Vi mais barato", "Outro lugar tem"

**Como aprende:**
1. Detecta objeção na mensagem do contato
2. Espera resposta do operador
3. Analisa se a objeção foi superada (contato continua conversa)
4. Salva padrão de resposta que funcionou
5. Usa em futuras objeções similares

---

## 3.6 Hunter Service (Proatividade)
📁 `hunter.service.ts`

**O que faz:** Busca contatos inativos e envia mensagens proativas para reativá-los.

```typescript
// Exemplo de uso:
const hunter = new HunterService();
const candidates = await hunter.findHuntingCandidates();
const message = await hunter.generateHuntingMessage(contact);
```

**Tipos de estratégias:**
- `WARM_REACTIVATION` - Contatos com boa intimidade que sumiram
- `COLD_FOLLOWUP` - Contatos que nunca responderam
- `HOT_CONVERSION` - Contatos prontos para comprar

**Configurações:**
- `minDaysSinceLastMessage` - Dias mínimos sem contato
- `maxMessagesWithoutResponse` - Máximo de msgs sem resposta
- `blacklistPatterns` - Padrões para ignorar

---

## 3.7 Watchdog Service (Segurança)
📁 `watchdog.service.ts`

**O que faz:** Monitora conversas em tempo real detectando riscos.

```typescript
// Exemplo de uso:
const watchdog = new WatchdogService();
const risk = await watchdog.analyzeMessage(contact, message);
// { level: 'HIGH', category: 'LAW_ENFORCEMENT', score: 85 }
```

**Níveis de risco:**
- `LOW` - Risco baixo, continuar normalmente
- `MEDIUM` - Atenção, pode precisar intervenção
- `HIGH` - Pausar contato imediatamente
- `CRITICAL` - Alerta urgente para operador

**Categorias detectadas:**
- `LAW_ENFORCEMENT` - Polícia, delegacia, investigação
- `SCAM` - Golpes, fraudes
- `LEGAL_THREAT` - Ameaças legais
- `EMOTIONAL_CRISIS` - Crise emocional
- `COMPETITION` - Tentativa de identificar concorrência

---

## 3.8 Presence Service
📁 `presence.service.ts`

**O que faz:** Simula comportamento humano com horários de presença.

```typescript
// Exemplo de uso:
const presence = new PresenceService();
const isAvailable = presence.isAvailable();
const delay = presence.getTypingDelay(messageLength);
```

**Configurações de horário:**
- `wakeUpHour` - Hora de acordar (ex: 8)
- `sleepHour` - Hora de dormir (ex: 23)
- `lunchStart/End` - Intervalo de almoço
- `weekendLazy` - Responde mais devagar no fim de semana

**O que simula:**
- Atrasos variáveis no "digitando..."
- Resposta mais lenta de madrugada
- Pausas para almoço
- Comportamento diferente no fim de semana

---

## 3.9 Analytics Service
📁 `analytics.service.ts`

**O que faz:** Calcula métricas e gera relatórios sobre o desempenho.

```typescript
// Exemplo de uso:
const analytics = new AnalyticsService();
const daily = await analytics.getDailyMetrics();
const funnel = await analytics.getConversionFunnel();
```

**Métricas disponíveis:**
- Mensagens enviadas/recebidas por dia
- Taxa de resposta da IA vs humano
- Horários de pico
- Top contatos por engajamento
- Funil de conversão
- Keywords mais frequentes

---

## 3.10 Voice Service (TTS)
📁 `voice.service.ts`

**O que faz:** Gera áudios com a voz do Gemini.

```typescript
// Exemplo de uso:
const voice = new VoiceService();
const audioPath = await voice.generateAudio('Oi amor, tudo bem?', 'happy');
```

**Emoções suportadas:**
- `neutral` - Neutro
- `happy` - Feliz
- `sad` - Triste
- `angry` - Com raiva

---

## 3.11 Image Service
📁 `image.service.ts`

**O que faz:** Gera imagens com Imagen 4.

```typescript
// Exemplo de uso:
const image = new ImageService();
const imagePath = await image.generateImage('selfie na praia ao pôr do sol');
const selfie = await image.generateSelfie('happy', 'beach');
```

**Modos:**
- `generateImage(prompt)` - Imagem custom
- `generateSelfie(mood, setting)` - Selfie da persona

---

## 3.12 Lead Scoring Service
📁 `lead-scoring.service.ts`

**O que faz:** Calcula pontuação de cada lead para priorizar atendimento.

```typescript
// Exemplo de uso:
const scoring = new LeadScoringService();
const score = await scoring.calculateLeadScore('id-contato');
// { overallScore: 85, tier: 'GOLD', recommendations: [...] }
```

**Dimensões avaliadas:**
- `engagementScore` - Quanto o contato interage
- `intentScore` - Sinais de compra detectados
- `recencyScore` - Quão recente foi o último contato
- `frequencyScore` - Frequência de mensagens
- `monetaryPotential` - Poder de compra estimado

**Tiers de classificação:**
- 💎 **DIAMOND** (85+) - Pronto para comprar AGORA
- 🏆 **GOLD** (70-84) - Precisa de um pequeno empurrão
- 🥈 **SILVER** (50-69) - Em fase de consideração
- 🥉 **BRONZE** (30-49) - Precisa de nutrição
- ❄️ **COLD** (0-29) - Lead frio, baixa prioridade

---

## 3.13 Template Service
📁 `template.service.ts`

**O que faz:** Gerencia templates de mensagens com personalização por IA.

```typescript
// Exemplo de uso:
const template = new TemplateService();
const message = template.applyTemplate('greeting-flirty', { nome: 'João' });
// "Oii João... estava pensando em você agora 💭😏"
```

**Categorias de templates:**
- `GREETING` - Saudações
- `FOLLOWUP` - Follow-ups
- `CLOSING` - Fechamento de venda
- `OBJECTION` - Resposta a objeções
- `REACTIVATION` - Reativação de contato
- `PROMO` - Promoções

---

## 3.14 Backup Service
📁 `backup.service.ts`

**O que faz:** Faz backup automático do banco de dados.

```typescript
// Exemplo de uso:
const backup = new BackupService();
await backup.createBackup();
const backups = backup.listBackups();
await backup.restoreBackup('ghost-backup-2026-01-24.json');
```

---

## 3.15 Scheduler Service
📁 `scheduler.service.ts`

**O que faz:** Executa tarefas em horários programados (cron jobs).

**Tarefas agendadas:**
| Tarefa | Horário | O que faz |
|--------|---------|-----------|
| `extract-styles` | 04:00 | Extrai estilos de escrita |
| `generate-summaries` | 23:00 | Gera resumos diários |
| `learn-objections` | 05:00 | Aprende objeções |
| `hunter-scan` | 10:00, 15:00, 20:00 | Busca candidatos para Hunter |
| `cleanup` | 03:00 | Limpa caches |
| `backup` | 02:00 | Faz backup |
| `analytics-digest` | 08:00 | Gera relatório diário |

---

## 3.16 Webhook Service
📁 `webhook.service.ts`

**O que faz:** Envia notificações para sistemas externos.

**Eventos que disparam webhooks:**
- `MESSAGE_RECEIVED` - Nova mensagem recebida
- `MESSAGE_SENT` - Mensagem enviada
- `RISK_DETECTED` - Risco detectado
- `CONVERSION` - Conversão realizada
- `HUMAN_TAKEOVER` - Humano assumiu conversa

---

## 3.17 A/B Testing Service
📁 `abtesting.service.ts`

**O que faz:** Gerencia testes A/B para otimizar respostas.

```typescript
// Exemplo de uso:
const ab = new ABTestingService();
const variant = ab.getVariant('greeting-style');
ab.recordConversion('greeting-style', variant);
```

---

## 3.18 Campaign Service
📁 `campaign.service.ts`

**O que faz:** Gerencia campanhas de outreach (Hunter).

**Campanhas pré-configuradas:**
- `cold-reactivation` - Contatos frios
- `hot-followup` - Follow-up quente
- `warm-nurture` - Nutrição de leads
- `vip-exclusive` - Contatos VIP

---

## 3.19 Rate Limiter Service
📁 `rate-limiter.service.ts`

**O que faz:** Controla frequência de ações para evitar spam.

**Limites configurados:**
| Tipo | Limite | Janela |
|------|--------|--------|
| `MESSAGE_OUTBOUND` | 10/min | Por contato |
| `MESSAGE_GLOBAL` | 60/min | Total |
| `GEMINI_API` | 30/min | Chamadas AI |
| `IMAGE_GENERATION` | 30/hora | Imagens |

---

## 3.20 Metrics Collector Service
📁 `metrics-collector.service.ts`

**O que faz:** Coleta métricas em tempo real para monitoramento.

**Métricas coletadas:**
- Contadores (mensagens, erros, etc)
- Gauges (memória, conexões ativas)
- Histogramas (tempo de resposta)

---

## 3.21 Telegram Operator Service
📁 `telegram-operator.service.ts`

**O que faz:** Notifica operador via Telegram e aceita comandos.

**Comandos disponíveis:**
- `/status` - Status do sistema
- `/stats` - Estatísticas do dia
- `/hot` - Leads quentes
- `/pause <telefone>` - Pausar contato
- `/resume <telefone>` - Retomar contato

---

# 4. BACKEND - CONTROLLERS

Os **Controllers** definem os endpoints da API.

## 4.1 Cognitive Controller
📁 `cognitive.controller.ts`

**Endpoints:**
- `GET /cognitive/style-dna/:contactId` - Obtém DNA de escrita
- `POST /cognitive/style-dna/extract` - Extrai estilo do operador
- `GET /cognitive/memory/:contactId` - Obtém memórias
- `POST /cognitive/memory/generate-summary` - Gera resumo
- `GET /cognitive/objections/:contactId` - Obtém objeções
- `POST /cognitive/objections/learn` - Aprende objeções

---

## 4.2 Operations Controller
📁 `operations.controller.ts`

**Endpoints:**
- `GET /operations/hunter/status` - Status do Hunter
- `POST /operations/hunter/execute` - Executa Hunter
- `GET /operations/watchdog/alerts` - Alertas ativos
- `POST /operations/watchdog/acknowledge` - Confirma alerta
- `GET /operations/presence/config` - Config de presença
- `PUT /operations/presence/config` - Atualiza presença

---

## 4.3 Analytics Controller
📁 `analytics.controller.ts`

**Endpoints:**
- `GET /analytics/daily` - Métricas diárias
- `GET /analytics/funnel` - Funil de conversão
- `GET /analytics/peak-hours` - Horários de pico
- `GET /analytics/top-contacts` - Top contatos

---

## 4.4 Media Controller
📁 `media.controller.ts`

**Endpoints:**
- `POST /media/voice/generate` - Gera áudio
- `POST /media/image/generate` - Gera imagem
- `POST /media/image/selfie` - Gera selfie

---

## 4.5 Advanced Controller
📁 `advanced.controller.ts`

**Endpoints:**
- `GET /advanced/scheduler/tasks` - Lista tarefas
- `POST /advanced/scheduler/run/:taskId` - Executa tarefa
- `GET /advanced/webhooks` - Lista webhooks
- `POST /advanced/webhooks` - Cria webhook
- `GET /advanced/abtests` - Lista testes A/B
- `POST /advanced/abtests/:testId/record` - Registra resultado

---

## 4.6 Leads Controller
📁 `leads.controller.ts`

**Endpoints:**
- `GET /leads/scores` - Todos os scores
- `GET /leads/scores/:contactId` - Score específico
- `GET /leads/tier/:tier` - Leads por tier
- `GET /leads/hot` - Leads quentes
- `GET /leads/campaigns` - Campanhas
- `POST /leads/campaigns/:id/execute` - Executa campanha
- `GET /leads/templates` - Templates
- `POST /leads/templates/:id/apply` - Aplica template

---

## 4.7 Backup Controller
📁 `backup.controller.ts`

**Endpoints:**
- `GET /backup/list` - Lista backups
- `POST /backup/create` - Cria backup
- `POST /backup/restore/:filename` - Restaura backup
- `DELETE /backup/:filename` - Deleta backup

---

## 4.8 Metrics Controller
📁 `metrics.controller.ts`

**Endpoints:**
- `GET /metrics` - Todas as métricas
- `GET /metrics/prometheus` - Formato Prometheus
- `GET /metrics/health` - Health check
- `GET /metrics/summary` - Resumo rápido

---

# 5. FRONTEND - COMMAND CENTER

O **Command Center** é o painel de controle do Ghost Protocol.

## 5.1 Overview (Página Inicial)
📁 `command-center/page.tsx`

**O que mostra:**
- Métricas principais (mensagens, taxa IA, conversões)
- Alertas ativos
- Tarefas pendentes
- Status dos módulos

---

## 5.2 Chat
📁 `command-center/chat/page.tsx`

**O que faz:**
- Lista de conversas na sidebar
- Histórico de mensagens
- Indicador de quem enviou (IA ou Humano)
- Botão para pausar/retomar IA
- Input para enviar mensagem manual

---

## 5.3 Operations
📁 `command-center/operations/page.tsx`

**Tabs:**
- **Hunter** - Controle de proatividade
- **Watchdog** - Alertas de risco
- **Presence** - Configuração de horários

---

## 5.4 Cognitive
📁 `command-center/cognitive/page.tsx`

**Seções:**
- **Style DNA** - Mostra estilo de escrita extraído
- **Long-term Memory** - Gerencia memórias
- **Sales IQ** - Mostra objeções aprendidas

---

## 5.5 Leads
📁 `command-center/leads/page.tsx`

**O que mostra:**
- Lista de leads com scores
- Filtro por tier (Diamond/Gold/Silver/Bronze/Cold)
- Cards expansíveis com detalhes
- Recomendações de ação

---

## 5.6 Analytics
📁 `command-center/analytics/page.tsx`

**Gráficos:**
- Funil de conversão
- Horários de pico
- Top contatos
- Keywords cloud

---

## 5.7 Media
📁 `command-center/media/page.tsx`

**Seções:**
- **Voice TTS** - Gerar áudios
- **Image Generation** - Gerar imagens
- **Persona Selfies** - Gerar selfies

---

## 5.8 Advanced
📁 `command-center/advanced/page.tsx`

**Tabs:**
- **Scheduler** - Gerenciar tarefas cron
- **Webhooks** - Configurar integrações
- **A/B Testing** - Ver experimentos

---

## 5.9 Settings
📁 `command-center/settings/page.tsx`

**Configurações:**
- Persona (nome, idade, personalidade)
- Horários de presença
- Níveis de risco do Watchdog
- Notificações

---

## 5.10 Status
📁 `command-center/status/page.tsx`

**O que mostra:**
- Status de cada serviço (online/offline)
- Uptime do sistema
- Uso de CPU/Memória
- Histórico de 90 dias

---

## 5.11 Backups
📁 `command-center/backups/page.tsx`

**Funcionalidades:**
- Lista de backups disponíveis
- Criar novo backup
- Restaurar backup
- Deletar backup
- Configurar backup automático

---

# 6. DATABASE SCHEMA

## Modelo Contact (Contato)
```prisma
model Contact {
  id              String    @id  // Ex: 5511999999999@c.us
  name            String?
  pushName        String?
  profilePicUrl   String?
  
  isPaused        Boolean   @default(false)
  lastInteraction DateTime
  
  // Perfil Cognitivo
  trustLevel      Int       @default(0)    // 0-100
  intimacyLevel   Int       @default(0)    // 0-100
  emotionalState  String    @default("NEUTRAL")
  engagementScore Int       @default(0)    // 0-100
  salesReadiness  Int       @default(0)    // 0-100
  
  messages        Message[]
}
```

## Modelo Message (Mensagem)
```prisma
model Message {
  id            String   @id
  contactId     String
  fromMe        Boolean
  isOperator    Boolean
  body          String
  timestamp     DateTime
  
  // Análise
  sentimentScore Float?
  intent         String?
  emotion        String?
  
  contact       Contact  @relation(...)
}
```

## Modelo MemorySummary (Memória)
```prisma
model MemorySummary {
  id        String   @id
  contactId String
  type      String   // DAILY_SUMMARY, CONTACT_PROFILE, etc
  content   String
  createdAt DateTime
}
```

## Modelo ObjectionPattern (Padrão de Objeção)
```prisma
model ObjectionPattern {
  id              String   @id
  category        String   // PRICE, TRUST, TIMING, etc
  objectionPhrase String   // Frase da objeção
  responsePhrase  String   // Resposta que funcionou
  successCount    Int
}
```

---

# 7. API ENDPOINTS

## Resumo de Todos os Endpoints

| Módulo | Endpoints | Descrição |
|--------|-----------|-----------|
| `/cognitive` | 8 | Style DNA, Memory, Objections |
| `/operations` | 12 | Hunter, Watchdog, Presence |
| `/analytics` | 6 | Métricas e relatórios |
| `/media` | 5 | Voice e Image generation |
| `/advanced` | 10 | Scheduler, Webhooks, A/B |
| `/leads` | 12 | Scoring, Campaigns, Templates |
| `/backup` | 5 | Backup e restore |
| `/metrics` | 5 | Health e monitoramento |
| `/contacts` | 5 | CRUD de contatos |
| **TOTAL** | **100+** | |

---

# 8. FLUXO DE MENSAGENS

## Quando uma mensagem chega:

```
1. WhatsApp (Baileys) recebe mensagem
         ↓
2. WhatsAppService.onMessage() é chamado
         ↓
3. Busca ou cria Contact no banco
         ↓
4. Salva Message no banco
         ↓
5. WatchdogService.analyzeMessage() verifica riscos
         ↓
   Se risco CRITICAL → Pausa contato e notifica operador
         ↓
6. PresenceService.isAvailable() verifica horário
         ↓
   Se não disponível → Não responde (ou resposta genérica)
         ↓
7. GeminiService.generateResponse() gera resposta
         ↓
   7a. StyleExtractorService fornece DNA de escrita
   7b. MemoryService fornece memórias relevantes
   7c. ObjectionLearnerService fornece técnicas de objeção
         ↓
8. PresenceService.getTypingDelay() calcula delay
         ↓
9. Aguarda delay (simula digitação)
         ↓
10. WhatsAppService.sendMessage() envia resposta
         ↓
11. Salva resposta no banco
         ↓
12. WebhookService.emit('MESSAGE_SENT') notifica sistemas
         ↓
13. MetricsCollector.increment() atualiza métricas
```

---

# 9. CONFIGURAÇÃO E DEPLOY

## Variáveis de Ambiente

```env
# Backend
PORT=3001
NODE_ENV=production
DATABASE_URL="file:./ghost.db"
GEMINI_API_KEY="sua-api-key-aqui"
JWT_SECRET="um-segredo-forte"
FRONTEND_URL="http://localhost:3000"

# Telegram (opcional)
TELEGRAM_BOT_TOKEN="bot-token"
TELEGRAM_CHAT_ID="seu-chat-id"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Rodando Localmente

```bash
# Backend
cd apps/app-zap/backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Frontend (outro terminal)
cd apps/app-zap/frontend
npm install
npm run dev
```

## Deploy com Docker

```bash
cd apps/app-zap
docker-compose up -d
```

---

# 10. CONCEITOS AVANÇADOS

## 10.1 Como a IA aprende o estilo?

1. **Coleta**: Quando o humano responde (isPaused=true), a mensagem é marcada como `isOperator=true`
2. **Análise**: O StyleExtractorService analisa todas as mensagens do operador
3. **Extração**: Extrai padrões (emojis, gírias, tamanho de mensagem)
4. **Prompt**: Esses padrões vão no prompt do Gemini
5. **Geração**: O Gemini imita o estilo nas respostas

## 10.2 Como funciona o Lead Scoring?

Fórmula:
```
Score = (Engagement * 0.25) + (Intent * 0.30) + 
        (Recency * 0.20) + (Frequency * 0.15) + 
        (Monetary * 0.10)
```

- **Engagement**: Quanto responde, tamanho das mensagens
- **Intent**: Sinais de compra ("quanto custa", "pix")
- **Recency**: Última interação (hoje = 100, 30 dias = 15)
- **Frequency**: Mensagens nos últimos 7 dias
- **Monetary**: Sinais de poder aquisitivo

## 10.3 Como o Watchdog detecta riscos?

1. **Pattern Matching**: Busca palavras-chave (polícia, delegacia)
2. **Análise de Contexto**: Gemini analisa o contexto completo
3. **Score Calculation**: Cada padrão tem um peso
4. **Threshold**: Acima de 70 = HIGH, acima de 90 = CRITICAL

## 10.4 Como o Hunter escolhe candidatos?

Critérios:
- Dias sem contato > X (configurável)
- Intimidade > Y (não abordar contatos frios demais)
- Não está pausado
- Não é horário de dormir

---

# 📌 GLOSSÁRIO

| Termo | Significado |
|-------|-------------|
| **Contact** | Uma pessoa que conversa no WhatsApp |
| **Message** | Uma mensagem enviada ou recebida |
| **Operator** | O humano que controla o sistema |
| **Persona** | A "personalidade" da IA |
| **Style DNA** | Padrões de escrita extraídos do operador |
| **Hunter** | Módulo de proatividade |
| **Watchdog** | Módulo de segurança |
| **Presence** | Módulo de horários |
| **Lead Scoring** | Sistema de pontuação de leads |
| **Tier** | Classificação do lead (Diamond/Gold/etc) |

---

# 🎓 DICAS PARA ESTUDO

1. **Comece pelo WhatsAppService** - Entenda como mensagens são enviadas/recebidas
2. **Depois GeminiService** - Entenda como prompts são montados
3. **Explore os Controllers** - Veja como a API é organizada
4. **Teste no Command Center** - Use a interface visual para ver tudo funcionando
5. **Leia o schema.prisma** - Entenda a estrutura do banco de dados

---

**🔥 Parabéns! Você agora entende o Ghost Protocol! 🔥**

Qualquer dúvida, pergunte ao seu Notebook LLM! 👻
