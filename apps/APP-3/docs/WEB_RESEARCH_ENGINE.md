# 🌐 WEB RESEARCH ENGINE

## O Cérebro com Navegador Real

Sistema de pesquisa REAL na internet que conecta a IA com conhecimento em tempo real do mundo.

---

## 🎯 O Que É

O Web Research Engine é um sistema que permite à IA:

- ✅ **Pesquisar na internet REAL** (não simulado)
- ✅ **Acessar APIs gratuitas** de conhecimento (Wikipedia, Hacker News, DEV.to, etc.)
- ✅ **Navegar com Playwright** quando necessário
- ✅ **Extrair e estruturar** informações de páginas web
- ✅ **Sintetizar conhecimento** para responder perguntas

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEB RESEARCH ENGINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    1. AI RESEARCH BRAIN                             │   │
│  │  • Decide se precisa pesquisar                                      │   │
│  │  • Otimiza queries de busca                                         │   │
│  │  • Sintetiza resultados com Gemini                                  │   │
│  │  • Calcula confiança da resposta                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    2. WEB RESEARCH ENGINE                           │   │
│  │  • Gerencia fontes confiáveis                                       │   │
│  │  • Executa pesquisas via APIs                                       │   │
│  │  • Controla rate limiting                                           │   │
│  │  • Estrutura resultados em KnowledgePackets                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         ▼                          ▼                          ▼            │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐       │
│  │  APIs       │           │  Playwright │           │  Cache      │       │
│  │  Gratuitas  │           │  Browser    │           │  Local      │       │
│  │             │           │             │           │             │       │
│  │ • Wikipedia │           │ • Chromium  │           │ • Memory    │       │
│  │ • DuckDuckGo│           │ • Headless  │           │ • Rate Limit│       │
│  │ • HackerNews│           │ • Stealth   │           │ • History   │       │
│  │ • DEV.to    │           │ • Scraping  │           │             │       │
│  │ • ArXiv     │           │             │           │             │       │
│  └─────────────┘           └─────────────┘           └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Fontes Disponíveis

### Documentação Oficial
| Fonte | URL | Prioridade |
|-------|-----|------------|
| MDN Web Docs | developer.mozilla.org | 10 |
| TypeScript Docs | typescriptlang.org | 9 |
| React Docs | react.dev | 9 |
| Node.js Docs | nodejs.org | 9 |
| Go Docs | go.dev | 9 |
| Python Docs | docs.python.org | 9 |
| Rust Docs | doc.rust-lang.org | 9 |

### Wikis e Conhecimento
| Fonte | URL | Prioridade |
|-------|-----|------------|
| Wikipedia (EN) | en.wikipedia.org | 8 |
| Wikipedia (PT) | pt.wikipedia.org | 8 |
| Arch Wiki | wiki.archlinux.org | 8 |

### Tutoriais
| Fonte | URL | Prioridade |
|-------|-----|------------|
| DEV.to | dev.to | 7 |
| FreeCodeCamp | freecodecamp.org | 7 |
| GeeksForGeeks | geeksforgeeks.org | 6 |
| W3Schools | w3schools.com | 6 |

### Notícias Tech
| Fonte | URL | Prioridade |
|-------|-----|------------|
| Hacker News | news.ycombinator.com | 8 |
| TechCrunch | techcrunch.com | 7 |
| The Verge | theverge.com | 7 |

### Papers e Ciência
| Fonte | URL | Prioridade |
|-------|-----|------------|
| ArXiv | arxiv.org | 9 |
| Papers With Code | paperswithcode.com | 9 |

### Código
| Fonte | URL | Prioridade |
|-------|-----|------------|
| GitHub | github.com | 9 |
| GitLab | gitlab.com | 8 |

### Fóruns
| Fonte | URL | Prioridade |
|-------|-----|------------|
| Stack Overflow | stackoverflow.com | 8 |
| Reddit Programming | reddit.com/r/programming | 6 |

---

## 🚀 Como Usar

### Instalação

```bash
# Instalar dependências
npm install playwright

# Instalar browsers (opcional, para scraping avançado)
npx playwright install chromium
```

### Uso Básico

```typescript
import { WebResearchEngine } from './services/WebResearchEngine';
import { AIResearchBrain } from './services/AIResearchBrain';

// 1. Pesquisa simples na Wikipedia
const engine = new WebResearchEngine();
const wikiResults = await engine.quickWikipedia('TypeScript', 'en');

// 2. Pesquisa de notícias
const newsResults = await engine.quickNews('AI artificial intelligence');

// 3. Pesquisa de tutoriais
const tutorialResults = await engine.quickTutorials('react');

// 4. Pesquisa completa multi-fonte
const fullResults = await engine.research({
  query: 'Playwright browser automation',
  maxResults: 10,
  includeCode: true,
  includeNews: true
});

// 5. Pesquisa inteligente com IA
const brain = new AIResearchBrain();
const response = await brain.process({
  userPrompt: 'O que é WebAssembly e quais são suas vantagens?',
  enableResearch: true,
  researchDepth: 'normal'
});

console.log(response.answer);
console.log(`Confiança: ${response.confidence * 100}%`);
console.log(`Fontes: ${response.sources.join(', ')}`);
```

---

## 📦 Estrutura de Dados

### KnowledgePacket

```typescript
interface KnowledgePacket {
  id: string;                    // ID único
  source: string;                // Nome da fonte (ex: "Wikipedia")
  url: string;                   // URL original
  type: 'article' | 'documentation' | 'tutorial' | 'news' | 'paper' | 'code' | 'forum' | 'wiki';
  title: string;                 // Título do conteúdo
  summary: string;               // Resumo (primeiros 500 chars)
  content: string;               // Conteúdo completo
  paragraphs: string[];          // Parágrafos separados
  codeBlocks: string[];          // Blocos de código encontrados
  links: string[];               // Links relevantes
  metadata: {
    author?: string;             // Autor (se disponível)
    date?: string;               // Data de publicação
    language: string;            // Idioma
    wordCount: number;           // Contagem de palavras
    readingTime: number;         // Tempo de leitura estimado
  };
  relevanceScore: number;        // Score de relevância (0-1)
  extractedAt: string;           // Timestamp da extração
}
```

### ResearchResult

```typescript
interface ResearchResult {
  query: string;                 // Query original
  packets: KnowledgePacket[];    // Resultados encontrados
  summary: string;               // Resumo da pesquisa
  sources: string[];             // Fontes utilizadas
  totalResults: number;          // Total de resultados
  searchTime: number;            // Tempo de pesquisa (ms)
  timestamp: string;             // Timestamp
}
```

### AIResearchResponse

```typescript
interface AIResearchResponse {
  answer: string;                // Resposta sintetizada
  researchContext?: {            // Contexto da pesquisa
    query: string;
    packets: KnowledgePacket[];
    summary: string;
    sources: string[];
    timestamp: string;
  };
  sources: string[];             // Fontes utilizadas
  confidence: number;            // Confiança (0-1)
  usedResearch: boolean;         // Se usou pesquisa
  processingTime: number;        // Tempo total (ms)
}
```

---

## 🔧 Configuração

### Profundidade de Pesquisa

| Nível | Resultados | Uso |
|-------|------------|-----|
| `quick` | 5 | Respostas rápidas |
| `normal` | 10 | Uso geral |
| `deep` | 20 | Pesquisa aprofundada |

### Rate Limiting

Cada fonte tem seu próprio rate limit configurado:

- **Wikipedia**: 200 req/min (muito generoso)
- **DuckDuckGo**: 60 req/min
- **Hacker News**: 100 req/min
- **DEV.to**: 30 req/min
- **Stack Overflow**: 10 req/min (mais restritivo)

O sistema gerencia automaticamente os limites.

---

## 🧪 Testes

```bash
# Executar testes
npx ts-node tests/test-web-research.ts

# Executar exemplos
npx ts-node examples/web-research-example.ts
```

---

## 🔒 Segurança e Ética

### Boas Práticas

1. **Respeite os robots.txt** - O sistema só acessa fontes permitidas
2. **Rate limiting** - Não sobrecarrega servidores
3. **User-Agent honesto** - Identifica-se corretamente
4. **Cache** - Evita requisições duplicadas
5. **Fontes confiáveis** - Prioriza fontes de alta qualidade

### Fontes Evitadas

- Sites com paywall
- Conteúdo protegido por copyright
- APIs que requerem autenticação paga
- Sites que bloqueiam scraping

---

## 📈 Métricas

O sistema calcula automaticamente:

- **Relevância**: Score baseado na prioridade da fonte e match com a query
- **Confiança**: Baseado na quantidade e qualidade das fontes
- **Tempo de resposta**: Monitorado para otimização

---

## 🔮 Roadmap

### Implementado ✅
- [x] APIs gratuitas (Wikipedia, DuckDuckGo, HN, DEV.to)
- [x] Estruturação de resultados
- [x] Rate limiting
- [x] AI Research Brain
- [x] Síntese com Gemini

### Planejado 📋
- [ ] Playwright para scraping avançado
- [ ] Cache persistente (Redis/SQLite)
- [ ] Embeddings para busca semântica
- [ ] Mais fontes (ArXiv API, GitHub API)
- [ ] Interface visual no app

---

## 🤝 Integração com o Sistema

O Web Research Engine se integra com:

- **GeminiService**: Para síntese de respostas
- **KnowledgeBase**: Para conhecimento interno
- **AdvancedResearch**: Complementa pesquisa de design
- **DAIAService**: Pode alimentar o sistema de aprendizado

---

## 📝 Exemplos de Uso

### Pesquisar Documentação

```typescript
const brain = new AIResearchBrain();

const response = await brain.process({
  userPrompt: 'Como usar async/await em JavaScript?',
  enableResearch: true,
  preferredSources: ['MDN Web Docs']
});
```

### Pesquisar Notícias

```typescript
const engine = new WebResearchEngine();

const news = await engine.research({
  query: 'GPT-5 OpenAI',
  includeNews: true,
  maxResults: 5
});
```

### Pesquisar Papers

```typescript
const engine = new WebResearchEngine();

const papers = await engine.research({
  query: 'transformer attention mechanism',
  sources: ['ArXiv', 'Papers With Code'],
  maxResults: 10
});
```

---

## 🎉 Conclusão

O Web Research Engine transforma sua IA de um chatbot limitado em um **agente pesquisador real** que pode:

1. Buscar informações atualizadas
2. Consultar documentação oficial
3. Encontrar tutoriais e exemplos
4. Acompanhar notícias tech
5. Pesquisar papers científicos

**"SE EXISTE NA INTERNET, EU SEI ENCONTRAR E TRAZER"**
