# 🧠 Intelligent Navigator Orchestrator

## Visão Geral

O **Intelligent Navigator Orchestrator** é o cérebro do sistema de navegação. Ele:

- 🧠 **Toma decisões inteligentes** sobre onde navegar
- 💬 **Conversa com o usuário** de forma natural
- 📚 **Usa base de conhecimento** de 500+ URLs
- 🎯 **Navega diretamente** sem precisar do Google
- 🔍 **Busca inteligente** usando padrões de URL conhecidos

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO                              │
│  "Quero comprar um iPhone 13 usado até R$ 2000"        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           INTELLIGENT ORCHESTRATOR                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🧠 GEMINI 2.0 FLASH                            │  │
│  │  - Analisa pedido                                │  │
│  │  - Toma decisões                                 │  │
│  │  - Conversa com usuário                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📚 BASE DE CONHECIMENTO                        │  │
│  │  - 500+ URLs conhecidas                          │  │
│  │  - 14 categorias                                 │  │
│  │  - Padrões de busca                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🎯 DECISÃO                                      │  │
│  │  action: "navigate"                              │  │
│  │  urls: [                                         │  │
│  │    "mercadolivre.com.br/iphone-13",             │  │
│  │    "amazon.com.br/s?k=iphone+13"                │  │
│  │  ]                                               │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PLAYWRIGHT NAVIGATOR                       │
│  - Navega para URLs                                     │
│  - Extrai dados estruturados                            │
│  - Retorna produtos, preços, etc                        │
└─────────────────────────────────────────────────────────┘
```

## Base de Conhecimento

### Categorias (14)

1. **Notícias** - G1, UOL, Folha, etc
2. **Buscadores** - DuckDuckGo, Bing, etc
3. **E-commerce** - Mercado Livre, Amazon, OLX
4. **Vídeos** - YouTube, Vimeo
5. **Redes Sociais** - Twitter, LinkedIn
6. **Tecnologia** - GitHub, Stack Overflow
7. **Educação** - Wikipedia, Khan Academy
8. **Governo** - Gov.br, Receita Federal
9. **Mapas** - Google Maps, OpenStreetMap
10. **Clima** - Weather.com, INMET
11. **Finanças** - Banco Central, B3
12. **Saúde** - Ministério da Saúde, OMS
13. **Esportes** - ESPN, GloboEsporte
14. **Entretenimento** - IMDb, Rotten Tomatoes

### Padrões de Busca Conhecidos

#### Mercado Livre
```
Busca: https://lista.mercadolivre.com.br/{query}
Produto: https://www.mercadolivre.com.br/p/{id}
Categoria: https://www.mercadolivre.com.br/c/{category}
```

#### Amazon
```
Busca: https://www.amazon.com.br/s?k={query}
Produto: https://www.amazon.com.br/dp/{id}
Categoria: https://www.amazon.com.br/s?i={category}
```

#### OLX
```
Busca: https://www.olx.com.br/brasil?q={query}
Categoria: https://www.olx.com.br/{category}
```

#### YouTube
```
Busca: https://www.youtube.com/results?search_query={query}
Vídeo: https://www.youtube.com/watch?v={id}
Canal: https://www.youtube.com/@{channel}
```

#### Wikipedia
```
Busca: https://pt.wikipedia.org/wiki/{query}
Artigo: https://pt.wikipedia.org/wiki/{title}
```

#### GitHub
```
Busca: https://github.com/search?q={query}
Repo: https://github.com/{user}/{repo}
User: https://github.com/{user}
```

## Como Funciona

### 1. Usuário faz um pedido

```
"Quero comprar um iPhone 13 usado até R$ 2000"
```

### 2. Orchestrator analisa

O Gemini 2.0 Flash recebe:
- Pedido do usuário
- Base de conhecimento completa
- Padrões de URL conhecidos
- Histórico da conversa

### 3. Orchestrator decide

```json
{
  "action": "navigate",
  "reasoning": "Vou buscar diretamente no Mercado Livre e OLX usando os padrões de URL que conheço, focando em produtos usados",
  "message": "Vou buscar iPhone 13 usado no Mercado Livre e OLX para você!",
  "navigation": {
    "urls": [
      "https://lista.mercadolivre.com.br/iphone-13-usado",
      "https://www.olx.com.br/brasil?q=iphone+13"
    ],
    "strategy": "direct",
    "extractData": ["price", "title", "image", "seller", "condition"]
  }
}
```

### 4. Sistema navega

- Playwright abre as URLs
- Extrai dados estruturados
- Retorna produtos encontrados

### 5. Usuário recebe resultado

```
"Encontrei 47 iPhones 13 usados! Aqui estão os melhores:

1. iPhone 13 128GB - R$ 1.899 (Mercado Livre)
2. iPhone 13 64GB - R$ 1.750 (OLX)
3. iPhone 13 256GB - R$ 1.999 (Mercado Livre)

Qual te interessa mais?"
```

## Tipos de Ação

### 1. navigate
Navegar para URLs específicas

```json
{
  "action": "navigate",
  "navigation": {
    "urls": ["url1", "url2"],
    "strategy": "direct",
    "extractData": ["price", "title"]
  }
}
```

### 2. search
Buscar em sites específicos

```json
{
  "action": "search",
  "navigation": {
    "urls": ["search_url"],
    "strategy": "search",
    "extractData": ["results"]
  }
}
```

### 3. ask
Pedir esclarecimento ao usuário

```json
{
  "action": "ask",
  "message": "Para te ajudar melhor, me diga:",
  "question": "Você prefere novo ou usado?"
}
```

### 4. extract
Extrair dados específicos

```json
{
  "action": "extract",
  "navigation": {
    "urls": ["url"],
    "extractData": ["specific_data"]
  }
}
```

### 5. respond
Responder diretamente

```json
{
  "action": "respond",
  "message": "Resposta direta ao usuário"
}
```

## API

### Inicializar

```javascript
POST /api/orchestrator/initialize
{
  "apiKey": "sua-api-key-gemini"
}
```

### Processar Pedido

```javascript
POST /api/orchestrator/process
{
  "message": "Quero comprar um iPhone 13",
  "context": {},
  "apiKey": "sua-api-key-gemini"
}
```

### Obter Estatísticas

```javascript
GET /api/orchestrator/stats
```

### Limpar Histórico

```javascript
POST /api/orchestrator/clear
```

## Uso no Frontend

```typescript
import { processUserRequest } from './services/intelligentOrchestratorService';

// Processar pedido
const result = await processUserRequest(
  'Quero comprar um iPhone 13',
  { budget: 2000 },
  apiKey
);

console.log(result.message); // Mensagem para o usuário
console.log(result.action); // Ação tomada
console.log(result.navigationResults); // Resultados da navegação
```

## Exemplos de Uso

### Exemplo 1: Comprar Produto

**Usuário**: "Quero comprar um notebook gamer até R$ 5000"

**Orchestrator**:
- Analisa: Busca de produto com orçamento
- Decide: Navegar para Mercado Livre e Amazon
- Executa: Busca "notebook gamer" com filtro de preço
- Retorna: Lista de produtos encontrados

### Exemplo 2: Buscar Informação

**Usuário**: "Me explique o que é machine learning"

**Orchestrator**:
- Analisa: Busca de informação educacional
- Decide: Navegar para Wikipedia
- Executa: Busca artigo sobre machine learning
- Retorna: Resumo do artigo

### Exemplo 3: Assistir Vídeo

**Usuário**: "Quero ver vídeos sobre Python"

**Orchestrator**:
- Analisa: Busca de vídeos
- Decide: Navegar para YouTube
- Executa: Busca "Python tutorial"
- Retorna: Lista de vídeos

### Exemplo 4: Pergunta Ambígua

**Usuário**: "Qual o melhor?"

**Orchestrator**:
- Analisa: Pergunta muito vaga
- Decide: Pedir esclarecimento
- Pergunta: "O melhor o quê? Notebook, celular, TV?"
- Aguarda: Resposta do usuário

## Vantagens

### 1. Sem Google
- Vai direto aos sites relevantes
- Mais rápido
- Mais preciso

### 2. Conversacional
- Fala naturalmente
- Faz perguntas
- Entende contexto

### 3. Inteligente
- Usa base de conhecimento
- Aprende com a conversa
- Toma decisões contextuais

### 4. Eficiente
- Navega apenas onde necessário
- Extrai dados estruturados
- Retorna resultados organizados

## Testes

```bash
cd backend
node test-orchestrator.js
```

Testes incluem:
1. ✅ Inicialização
2. ✅ Busca de produto
3. ✅ Pergunta ambígua
4. ✅ Busca de informação
5. ✅ Busca em site específico

## Configuração

### 1. API Key

Adicione no `.env`:
```
GEMINI_API_KEY=sua-api-key-aqui
```

### 2. Base de Conhecimento

Edite `backend/data/trusted-sites.json` para adicionar mais sites.

### 3. Padrões de Busca

Edite `intelligentNavigatorOrchestrator.js` para adicionar mais padrões.

## Próximas Melhorias

1. **Cache de Decisões** - Lembrar decisões anteriores
2. **Aprendizado** - Melhorar com feedback do usuário
3. **Multi-idioma** - Suporte a outros idiomas
4. **Personalização** - Preferências do usuário
5. **Analytics** - Métricas de uso

## Arquivos

```
backend/
├── services/
│   └── intelligentNavigatorOrchestrator.js  # Orchestrator principal
├── data/
│   └── trusted-sites.json                   # Base de conhecimento
├── test-orchestrator.js                     # Testes
└── server.js                                # Rotas API

frontend/
└── src/
    └── services/
        └── intelligentOrchestratorService.ts  # Cliente frontend
```

## Status

- ✅ Orchestrator implementado
- ✅ Base de conhecimento carregada
- ✅ Padrões de busca configurados
- ✅ API criada
- ✅ Serviço frontend criado
- ✅ Testes criados
- ✅ Documentação completa

## Acesso

O Orchestrator está disponível em:
```
http://localhost:3002/api/orchestrator/*
```

---

**🧠 Cérebro do sistema pronto para uso!**
