# Arquitetura Visual do Sistema de Canvas Dinâmico

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERFACE DO USUÁRIO                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                   ChatView Component                │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │         DynamicCanvas (Fundo)                │  │    │
│  │  │  ┌────────────────────────────────────────┐  │  │    │
│  │  │  │                                         │  │  │    │
│  │  │  │     Template Renderizado Aqui          │  │  │    │
│  │  │  │     (News, Products, Table, etc.)      │  │  │    │
│  │  │  │                                         │  │  │    │
│  │  │  └────────────────────────────────────────┘  │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │      Chat Overlay (Sobreposto)               │  │    │
│  │  │  ┌────────────────────────────────────────┐  │  │    │
│  │  │  │  Mensagens do Chat                     │  │  │    │
│  │  │  │  - Usuário                             │  │  │    │
│  │  │  │  - IA                                  │  │  │    │
│  │  │  └────────────────────────────────────────┘  │  │    │
│  │  │                                                │  │    │
│  │  │  [Botão Toggle Canvas] 🎨                     │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Processamento

```
┌──────────────┐
│   Usuário    │
│ faz pergunta │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│   Sistema Gemini     │
│  gera resposta AI    │
└──────┬───────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│           useTemplateCanvas Hook                     │
│                                                      │
│  analyzeAndRender(query, response, context)         │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│         TemplateMaestroService                       │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  1. detectContentType()                    │    │
│  │     - Analisa query                        │    │
│  │     - Analisa response                     │    │
│  │     - Verifica context                     │    │
│  │     → Retorna: TemplateType                │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  2. extractStructuredData()                │    │
│  │     - Extrai dados relevantes              │    │
│  │     - Estrutura informações                │    │
│  │     - Valida dados                         │    │
│  │     → Retorna: ExtractedData               │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  3. calculateConfidence()                  │    │
│  │     - Avalia qualidade dos dados           │    │
│  │     - Calcula score de confiança           │    │
│  │     → Retorna: 0.0 - 1.0                   │    │
│  └────────────────────────────────────────────┘    │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              AnalysisResult                          │
│  {                                                   │
│    templateType: 'products',                         │
│    extractedData: { products: [...] },               │
│    confidence: 0.9,                                  │
│    reasoning: 'Detectei busca por produtos'          │
│  }                                                   │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              DynamicCanvas                           │
│                                                      │
│  renderTemplate() {                                  │
│    switch(templateType) {                            │
│      case 'products': → ProductsTemplate             │
│      case 'news':     → NewsTemplate                 │
│      case 'table':    → TableTemplate                │
│      case 'media':    → MediaTemplate                │
│      case 'rich-text': → RichTextTemplate            │
│    }                                                 │
│  }                                                   │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│           Template Específico                        │
│                                                      │
│  Renderiza dados de forma visual e interativa       │
└─────────────────────────────────────────────────────┘
```

## 🎯 Decisão de Template

```
                    ┌─────────────────┐
                    │  Análise Inicial │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │   Query     │          │  Response   │
         │  Analysis   │          │  Analysis   │
         └──────┬──────┘          └──────┬──────┘
                │                         │
                └────────────┬────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Context Check   │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │ Produtos│         │ Notícias│         │ Tabelas │
   │ Pattern │         │ Pattern │         │ Pattern │
   └────┬────┘         └────┬────┘         └────┬────┘
        │                    │                    │
        │    ┌───────────────┼───────────────┐   │
        │    │               │               │   │
   ┌────▼────▼────┐    ┌────▼────┐    ┌────▼───▼────┐
   │  Products    │    │  News   │    │   Table     │
   │  Template    │    │Template │    │  Template   │
   └──────────────┘    └─────────┘    └─────────────┘
```

## 🧩 Componentes e Responsabilidades

```
┌─────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  DynamicCanvas.tsx                                       │
│  ├─ Gerencia renderização do canvas                     │
│  ├─ Controla visibilidade                               │
│  ├─ Aplica animações                                    │
│  └─ Delega para templates específicos                   │
│                                                          │
│  Templates/                                              │
│  ├─ NewsTemplate.tsx        → Notícias                  │
│  ├─ ProductsTemplate.tsx    → Produtos                  │
│  ├─ TableTemplate.tsx       → Tabelas                   │
│  ├─ MediaTemplate.tsx       → Mídia                     │
│  └─ RichTextTemplate.tsx    → Texto Rico                │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    CAMADA DE LÓGICA                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  templateMaestroService.ts                               │
│  ├─ analyzeAndChooseTemplate()                          │
│  │  └─ Orquestra todo o processo                        │
│  │                                                       │
│  ├─ detectContentType()                                 │
│  │  └─ Identifica tipo de conteúdo                      │
│  │                                                       │
│  ├─ extractStructuredData()                             │
│  │  ├─ extractProductData()                             │
│  │  ├─ extractNewsData()                                │
│  │  ├─ extractTableData()                               │
│  │  ├─ extractMediaData()                               │
│  │  └─ extractRichTextData()                            │
│  │                                                       │
│  ├─ calculateConfidence()                               │
│  │  └─ Avalia qualidade da detecção                     │
│  │                                                       │
│  └─ generateReasoning()                                 │
│     └─ Explica a escolha                                │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    CAMADA DE ESTADO                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  useTemplateCanvas.ts                                    │
│  ├─ Estado                                               │
│  │  ├─ templateData                                     │
│  │  ├─ isVisible                                        │
│  │  ├─ isAnalyzing                                      │
│  │  └─ analysisResult                                   │
│  │                                                       │
│  └─ Ações                                                │
│     ├─ analyzeAndRender()                               │
│     ├─ show()                                            │
│     ├─ hide()                                            │
│     ├─ toggle()                                          │
│     ├─ clear()                                           │
│     └─ updateTemplateData()                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 📊 Matriz de Decisão de Templates

```
┌──────────────┬─────────────┬──────────────┬─────────────┐
│   Padrão     │  Template   │  Confiança   │  Contexto   │
├──────────────┼─────────────┼──────────────┼─────────────┤
│ "comprar"    │  Products   │    0.9       │ hasProducts │
│ "preço"      │  Products   │    0.9       │ hasProducts │
│ "R$"         │  Products   │    0.85      │ -           │
├──────────────┼─────────────┼──────────────┼─────────────┤
│ "notícia"    │  News       │    0.9       │ hasNews     │
│ "aconteceu"  │  News       │    0.85      │ -           │
│ "jornal"     │  News       │    0.8       │ -           │
├──────────────┼─────────────┼──────────────┼─────────────┤
│ "comparar"   │  Table      │    0.85      │ -           │
│ "versus"     │  Table      │    0.85      │ -           │
│ "|" (pipe)   │  Table      │    0.9       │ -           │
├──────────────┼─────────────┼──────────────┼─────────────┤
│ "imagem"     │  Media      │    0.9       │ hasMedia    │
│ "foto"       │  Media      │    0.9       │ hasMedia    │
│ "vídeo"      │  Media      │    0.9       │ hasMedia    │
├──────────────┼─────────────┼──────────────┼─────────────┤
│ >1000 chars  │  RichText   │    0.8       │ -           │
│ markdown     │  RichText   │    0.85      │ -           │
└──────────────┴─────────────┴──────────────┴─────────────┘
```

## 🎨 Hierarquia Visual

```
Z-Index Layers:

┌─────────────────────────────────────┐  z-index: 100
│   Toggle Button (Botão Flutuante)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐  z-index: 10
│   Chat Overlay                       │
│   (Mensagens, Input)                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐  z-index: 0
│   DynamicCanvas                      │
│   (Templates de Fundo)               │
└─────────────────────────────────────┘
```

## 🔀 Estados do Sistema

```
┌─────────────┐
│   Initial   │  (Sem template)
└──────┬──────┘
       │
       │ analyzeAndRender()
       ▼
┌─────────────┐
│  Analyzing  │  (isAnalyzing = true)
└──────┬──────┘
       │
       │ Análise completa
       ▼
┌─────────────┐
│   Ready     │  (templateData definido)
└──────┬──────┘
       │
       │ show() / autoShow
       ▼
┌─────────────┐
│   Visible   │  (isVisible = true)
└──────┬──────┘
       │
       │ hide() / toggle()
       ▼
┌─────────────┐
│   Hidden    │  (isVisible = false)
└──────┬──────┘
       │
       │ clear()
       ▼
┌─────────────┐
│   Initial   │
└─────────────┘
```

## 💾 Estrutura de Dados

```typescript
// TemplateData
{
  type: 'products' | 'news' | 'table' | 'media' | 'rich-text',
  data: {
    // Dados específicos do template
  },
  metadata: {
    source: string,
    timestamp: number,
    confidence: number
  }
}

// AnalysisResult
{
  templateType: TemplateType,
  extractedData: any,
  confidence: number,
  reasoning: string
}

// Context (opcional)
{
  hasProducts?: boolean,
  products?: Product[],
  hasNews?: boolean,
  news?: NewsArticle[],
  hasMedia?: boolean,
  images?: string[],
  videos?: string[]
}
```

## 🚀 Performance

```
Otimizações Implementadas:

1. Lazy Loading
   └─ Templates carregados sob demanda

2. Memoization
   └─ React.memo nos templates pesados

3. Debouncing
   └─ Análise com delay para evitar múltiplas chamadas

4. Virtual Scrolling
   └─ Para listas longas de produtos/notícias

5. Image Lazy Loading
   └─ Imagens carregadas quando visíveis

6. CSS Animations
   └─ Animações via CSS (GPU accelerated)
```

Esta arquitetura cria um sistema modular, extensível e performático para renderização de templates dinâmicos!
