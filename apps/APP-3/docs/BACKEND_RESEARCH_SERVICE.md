# 🌐 BACKEND RESEARCH SERVICE

## Visão Geral

O **Research Service** é um serviço de pesquisa web que roda no **backend** (Node.js/Express), resolvendo os problemas de CORS que existiam quando a pesquisa rodava no frontend.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                               │
│                                                                             │
│   BackendResearchClient.ts                                                  │
│   └── POST /api/research/search                                             │
│   └── GET /api/research/wikipedia/:query                                    │
│   └── GET /api/research/arxiv/:query                                        │
│   └── GET /api/research/github/:query                                       │
│   └── GET /api/research/stackoverflow/:query                                │
│   └── GET /api/research/hackernews/:query                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP (sem CORS!)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Node.js)                              │
│                                                                             │
│   ResearchService.ts                                                        │
│   ├── searchWikipedia()                                                     │
│   ├── searchDuckDuckGo()                                                    │
│   ├── searchHackerNews()                                                    │
│   ├── searchArXiv()        ← AGORA FUNCIONA! (sem CORS)                     │
│   ├── searchGitHub()                                                        │
│   ├── searchStackOverflow()                                                 │
│   ├── searchDevTo()                                                         │
│   └── searchWithPlaywright() ← SCRAPING AVANÇADO                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP (servidor → APIs)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APIs EXTERNAS                                  │
│                                                                             │
│   Wikipedia │ DuckDuckGo │ Hacker News │ ArXiv │ GitHub │ Stack Overflow   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Por Que Backend?

### Problema Original (Frontend)
```
Frontend (localhost:5173) → ArXiv (export.arxiv.org)
                         ↓
                    CORS BLOCKED! ❌
```

O navegador bloqueia requisições cross-origin para APIs que não têm headers CORS configurados.

### Solução (Backend)
```
Frontend → Backend (localhost:3001) → ArXiv
                                   ↓
                              SEM CORS! ✅
```

O servidor Node.js não tem restrições de CORS - pode chamar qualquer API.

## Arquivos Criados

```
backend/
├── src/
│   ├── core/services/
│   │   └── ResearchService.ts      # Serviço principal
│   └── api/
│       ├── controllers/
│       │   └── researchController.ts
│       └── routes/
│           └── researchRoutes.ts
└── test-research-api.js            # Script de teste

services/
└── BackendResearchClient.ts        # Cliente para o frontend
```

## Endpoints da API

### POST /api/research/search
Pesquisa completa usando múltiplas fontes.

```typescript
// Request
{
  "query": "Liquid Neural Networks",
  "maxResults": 10,
  "language": "en",
  "includeCode": true,
  "includeNews": true,
  "includePapers": true,
  "usePlaywright": false
}

// Response
{
  "success": true,
  "data": {
    "query": "Liquid Neural Networks",
    "packets": [...],
    "summary": "...",
    "sources": ["Wikipedia", "ArXiv", "GitHub"],
    "totalResults": 15,
    "searchTime": 2340,
    "timestamp": "2025-12-11T..."
  }
}
```

### GET /api/research/wikipedia/:query
```bash
GET /api/research/wikipedia/TypeScript?lang=en
```

### GET /api/research/arxiv/:query
```bash
GET /api/research/arxiv/transformer%20attention?max=5
```

### GET /api/research/github/:query
```bash
GET /api/research/github/react?max=5
```

### GET /api/research/stackoverflow/:query
```bash
GET /api/research/stackoverflow/react%20hooks?max=5
```

### GET /api/research/hackernews/:query
```bash
GET /api/research/hackernews/AI
```

### GET /api/research/status
```bash
GET /api/research/status
```

## Como Usar

### 1. Instalar Dependências do Backend
```bash
cd backend
npm install
npm install playwright  # Opcional, para scraping avançado
```

### 2. Iniciar o Backend
```bash
npm run dev
```

### 3. Testar a API
```bash
node test-research-api.js
```

### 4. Usar no Frontend
```typescript
import { backendResearchClient, smartResearch } from './services/BackendResearchClient';

// Opção 1: Usar cliente diretamente
const result = await backendResearchClient.search({
  query: 'Liquid Neural Networks',
  includePapers: true
});

// Opção 2: Usar smartResearch (tenta backend, fallback para frontend)
const result = await smartResearch({
  query: 'React hooks',
  includeCode: true
});
```

## APIs Disponíveis

| API | Tipo | Rate Limit | Status |
|-----|------|------------|--------|
| Wikipedia | Conhecimento | 200/min | ✅ |
| DuckDuckGo | Respostas | 60/min | ✅ |
| Hacker News | Notícias | 100/min | ✅ |
| ArXiv | Papers | 20/min | ✅ |
| GitHub | Código | 60/hora | ✅ |
| Stack Overflow | Q&A | 300/dia | ✅ |
| DEV.to | Tutoriais | 30/min | ✅ |

## Playwright (Opcional)

Se Playwright estiver instalado, o serviço pode fazer scraping avançado de sites como MDN, React Docs, etc.

```bash
# Instalar Playwright
cd backend
npm install playwright

# Instalar browsers
npx playwright install chromium
```

Depois, use `usePlaywright: true` na pesquisa:
```typescript
const result = await backendResearchClient.search({
  query: 'React hooks',
  usePlaywright: true  // Ativa scraping com Playwright
});
```

## Variáveis de Ambiente

No frontend (`.env`):
```env
VITE_BACKEND_URL=http://localhost:3001
```

## Troubleshooting

### Backend não está rodando
```
❌ Falha: fetch failed
```
**Solução:** Inicie o backend com `npm run dev`

### CORS ainda aparece
```
❌ CORS policy blocked
```
**Solução:** Verifique se está chamando o backend (localhost:3001), não a API diretamente

### Playwright não disponível
```
⚠️ Playwright não instalado
```
**Solução:** `npm install playwright && npx playwright install chromium`

---

## ✅ Integração Completa

O `GeminiService.ts` foi atualizado para:

1. **Tentar o Backend primeiro** (sem CORS, com Playwright)
2. **Fallback para frontend** se backend não disponível

```typescript
// Fluxo automático em executeWebResearch():
1. Verifica se backend está disponível (GET /api/research/status)
2. Se SIM → Chama POST /api/research/search
3. Se NÃO → Usa AIResearchBrain local (fallback)
```

### Teste Final

```
Prompt: "Pesquise no ArXiv sobre 'Liquid Neural Networks' e me dê um resumo técnico"

Esperado:
1. ✅ Backend recebe a requisição
2. ✅ Backend chama ArXiv (sem CORS!)
3. ✅ Backend retorna papers científicos
4. ✅ IA resume os resultados
```

---

**Criado em:** 11/12/2025  
**Versão:** 1.0.0  
**Atualizado:** 11/12/2025 - Integração com GeminiService
