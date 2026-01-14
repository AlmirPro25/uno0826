# Sistema Visual Completo com Geração de Imagens

## Visão Geral

Sistema que gera layouts visuais ricos com:
- **Imagens geradas** via APIs gratuitas (Unsplash, Pexels)
- **Screenshots de sites** capturados em tempo real
- **Análise de imagens** com Gemini Vision
- **Layouts inteligentes** que combinam fotos + informações + links

## Arquitetura

```
Usuário faz pergunta
    ↓
IA responde
    ↓
VisualComposer analisa necessidades visuais
    ↓
┌─────────────────────────────────────┐
│  Backend gera recursos visuais:     │
│  ├─ Imagens (Unsplash/Pexels)      │
│  ├─ Screenshots (Puppeteer)         │
│  └─ Análise (Gemini Vision)         │
└─────────────────────────────────────┘
    ↓
VisualCanvas renderiza layout
    ↓
Interface rica com fotos + dados + links
```

## Componentes

### 1. VisualComposerService (Frontend)
**Arquivo**: `src/services/visualComposerService.ts`

**Responsabilidade**: Analisa e compõe layouts visuais

**Métodos principais**:
```typescript
// Compõe layout visual completo
composeVisualLayout(query, aiResponse, context): Promise<VisualLayout>

// Analisa necessidades visuais
analyzeVisualNeeds(query, response, context): VisualNeeds

// Compõe seções específicas
composeProductShowcase(images, screenshots, context): VisualSection[]
composeNewsVisual(images, context): VisualSection[]
composeGallery(images): VisualSection[]
```

### 2. ImageGenerationService (Backend)
**Arquivo**: `backend/services/imageGenerationService.js`

**Responsabilidade**: Gera imagens e captura screenshots

**Métodos principais**:
```javascript
// Gera imagem via API gratuita
generateImage(prompt, type): Promise<Image>

// Captura screenshot de site
captureScreenshot(url, options): Promise<string>

// Analisa imagem com Gemini Vision
analyzeImage(imageUrl): Promise<string>

// Gera composição visual completa
generateVisualComposition(query, context): Promise<Image[]>
```

### 3. VisualCanvas (Frontend)
**Arquivo**: `src/components/VisualCanvas.tsx`

**Responsabilidade**: Renderiza layouts visuais

**Seções suportadas**:
- **Hero**: Seção principal com imagem de fundo
- **Grid**: Grade de itens com imagens
- **Comparison**: Comparação lado a lado
- **Gallery**: Galeria de imagens

### 4. useVisualCanvas (Hook)
**Arquivo**: `src/hooks/useVisualCanvas.ts`

**Responsabilidade**: Gerencia estado do canvas visual

**API**:
```typescript
const {
  visualLayout,        // Layout atual
  isVisible,          // Canvas visível?
  isGenerating,       // Gerando recursos?
  progress,           // Progresso (0-100)
  
  generateVisualLayout,  // Gera layout
  show,                  // Mostra canvas
  hide,                  // Esconde canvas
  toggle,                // Alterna
  clear,                 // Limpa
  regenerateImages       // Regenera imagens
} = useVisualCanvas();
```

## Tipos de Layout

### 1. Product Showcase
**Quando usar**: Busca de produtos, e-commerce

**Estrutura**:
```
┌─────────────────────────────────────┐
│  HERO com imagem de fundo           │
│  "Produtos Encontrados"             │
└─────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐
│ [Foto]   │ │ [Foto]   │ │ [Foto]   │
│ Produto 1│ │ Produto 2│ │ Produto 3│
│ R$ 100   │ │ R$ 200   │ │ R$ 300   │
│ ⭐⭐⭐⭐⭐ │ │ ⭐⭐⭐⭐   │ │ ⭐⭐⭐⭐⭐ │
│ [Ver]    │ │ [Ver]    │ │ [Ver]    │
└──────────┘ └──────────┘ └──────────┘
```

**Recursos visuais**:
- Foto do produto (API ou screenshot)
- Screenshot da página do produto
- Imagem de fundo no hero

### 2. News Visual
**Quando usar**: Notícias, artigos

**Estrutura**:
```
┌─────────────────────────────────────┐
│  [Imagem]  │  Notícia Principal     │
│            │  Título grande         │
│            │  Descrição...          │
└─────────────────────────────────────┘

┌──────────┐ ┌──────────┐
│ [Foto]   │ │ [Foto]   │
│ Notícia 2│ │ Notícia 3│
└──────────┘ └──────────┘
```

**Recursos visuais**:
- Ilustrações temáticas
- Fotos relacionadas ao tema
- Imagens de capa

### 3. Comparison
**Quando usar**: Comparações, versus

**Estrutura**:
```
┌──────────────┐   VS   ┌──────────────┐
│  [Imagem A]  │        │  [Imagem B]  │
│  Opção A     │        │  Opção B     │
│  - Feature 1 │        │  - Feature 1 │
│  - Feature 2 │        │  - Feature 2 │
└──────────────┘        └──────────────┘
```

**Recursos visuais**:
- Ícones de comparação
- Fotos dos itens comparados
- Gráficos visuais

### 4. Gallery
**Quando usar**: Múltiplas imagens, portfólio

**Estrutura**:
```
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 1  │ │ 2  │ │ 3  │ │ 4  │
└────┘ └────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 5  │ │ 6  │ │ 7  │ │ 8  │
└────┘ └────┘ └────┘ └────┘
```

**Recursos visuais**:
- Múltiplas imagens geradas
- Grid responsivo
- Modal de visualização

### 5. Infographic
**Quando usar**: Dados, estatísticas, informações complexas

**Estrutura**:
```
┌─────────────────────────────────────┐
│  [Imagem de fundo]                  │
│                                     │
│  📊 Dados e Estatísticas            │
│  ├─ Informação 1                    │
│  ├─ Informação 2                    │
│  └─ Informação 3                    │
└─────────────────────────────────────┘
```

**Recursos visuais**:
- Background temático
- Ícones ilustrativos
- Gráficos visuais

## APIs de Imagens Gratuitas

### 1. Unsplash
**URL**: https://unsplash.com/developers
**Limite**: 50 requisições/hora (gratuito)

**Configuração**:
```bash
# .env
UNSPLASH_API_KEY=your_key_here
```

**Uso**:
```javascript
const response = await axios.get('https://api.unsplash.com/photos/random', {
  params: { query: 'laptop', orientation: 'landscape' },
  headers: { 'Authorization': `Client-ID ${UNSPLASH_API_KEY}` }
});
```

### 2. Pexels
**URL**: https://www.pexels.com/api/
**Limite**: 200 requisições/hora (gratuito)

**Configuração**:
```bash
# .env
PEXELS_API_KEY=your_key_here
```

**Uso**:
```javascript
const response = await axios.get('https://api.pexels.com/v1/search', {
  params: { query: 'technology', per_page: 1 },
  headers: { 'Authorization': PEXELS_API_KEY }
});
```

### 3. Pixabay
**URL**: https://pixabay.com/api/docs/
**Limite**: 5000 requisições/hora (gratuito)

**Configuração**:
```bash
# .env
PIXABAY_API_KEY=your_key_here
```

## Captura de Screenshots

### Usando Puppeteer

**Instalação**:
```bash
npm install puppeteer
```

**Uso**:
```javascript
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 768 });
await page.goto(url);
const screenshot = await page.screenshot({ type: 'jpeg', quality: 85 });
```

**Otimizações**:
- Reutilizar instância do browser
- Timeout de 30s
- Aguardar networkidle2
- Qualidade 85% (balanço tamanho/qualidade)

### APIs de Screenshot (Alternativas)

1. **ScreenshotAPI.net**
   - Gratuito: 100 screenshots/mês
   - URL: `https://shot.screenshotapi.net/screenshot?url=...`

2. **URLBox.io**
   - Gratuito: 1000 screenshots/mês
   - URL: `https://api.urlbox.io/v1/...`

3. **ApiFlash**
   - Gratuito: 100 screenshots/mês
   - URL: `https://api.apiflash.com/v1/urltoimage`

## Gemini Vision

### Análise de Imagens

**Uso**:
```javascript
const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

const result = await model.generateContent([
  'Describe this image in detail',
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64ImageData
    }
  }
]);

const description = result.response.text();
```

**Casos de uso**:
- Descrever produtos em imagens
- Extrair texto de screenshots
- Identificar elementos visuais
- Gerar alt text automático

## Fluxo Completo

### Exemplo: Busca de Produtos

```typescript
// 1. Usuário busca "notebook dell"
const query = "notebook dell";

// 2. Sistema busca produtos
const products = await searchProducts(query);

// 3. Gera layout visual
const layout = await generateVisualLayout(query, aiResponse, {
  products,
  urls: products.map(p => p.url)
});

// Resultado:
{
  type: 'product-showcase',
  sections: [
    {
      type: 'hero',
      title: 'Notebooks Dell Encontrados',
      images: ['background-image.jpg'],
      layout: { imagePosition: 'background' }
    },
    {
      type: 'grid',
      content: [
        {
          title: 'Dell Inspiron 15',
          price: 'R$ 3.500',
          rating: 4.5,
          image: 'product-photo.jpg',      // ← Gerada
          screenshot: 'page-screenshot.jpg', // ← Capturada
          url: 'https://...'
        },
        // ... mais produtos
      ]
    }
  ],
  images: [/* imagens geradas */],
  screenshots: [/* screenshots capturados */]
}
```

### Exemplo: Notícias

```typescript
// 1. Usuário busca "notícias de tecnologia"
const query = "notícias de tecnologia";

// 2. Sistema busca notícias
const news = await searchNews(query);

// 3. Gera layout visual
const layout = await generateVisualLayout(query, aiResponse, {
  news
});

// Resultado:
{
  type: 'news-visual',
  sections: [
    {
      type: 'hero',
      title: 'Últimas Notícias',
      content: news[0],
      images: ['tech-illustration.jpg'], // ← Gerada
      layout: { imagePosition: 'left' }
    },
    {
      type: 'grid',
      content: news.slice(1).map((article, i) => ({
        ...article,
        image: `news-${i}.jpg` // ← Gerada
      }))
    }
  ]
}
```

## Integração no ChatView

```typescript
import { useVisualCanvas } from '../hooks/useVisualCanvas';
import VisualCanvas from '../components/VisualCanvas';

export const ChatView = () => {
  const {
    visualLayout,
    isVisible,
    isGenerating,
    progress,
    generateVisualLayout,
    toggle
  } = useVisualCanvas();

  const handleAIResponse = async (query, response, context) => {
    // Gera layout visual
    await generateVisualLayout(query, response, context);
  };

  return (
    <div className="chat-view">
      {/* Canvas visual */}
      <VisualCanvas 
        layout={visualLayout}
        isVisible={isVisible}
      />

      {/* Indicador de progresso */}
      {isGenerating && (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
          <span>Gerando recursos visuais... {progress}%</span>
        </div>
      )}

      {/* Botão toggle */}
      <button onClick={toggle}>
        {isVisible ? '💬 Chat' : '🎨 Visual'}
      </button>

      {/* Chat */}
      <div className="chat-content">
        {/* ... */}
      </div>
    </div>
  );
};
```

## Performance

### Otimizações Implementadas

1. **Cache de Imagens**
   - Imagens são cacheadas no navegador
   - Reutilização de recursos

2. **Lazy Loading**
   - Imagens carregam sob demanda
   - Melhora tempo inicial

3. **Compressão**
   - Screenshots em JPEG 85%
   - Redimensionamento automático

4. **Paralelização**
   - Geração de imagens em paralelo
   - Screenshots simultâneos (máx 3)

5. **Fallbacks**
   - Placeholders se API falhar
   - Degradação graciosa

## Configuração

### Variáveis de Ambiente

```bash
# .env

# Gemini
GEMINI_API_KEY=your_gemini_key

# APIs de Imagens (opcional)
UNSPLASH_API_KEY=your_unsplash_key
PEXELS_API_KEY=your_pexels_key
PIXABAY_API_KEY=your_pixabay_key

# Screenshot API (opcional)
SCREENSHOT_API_KEY=your_screenshot_key
```

### Instalação de Dependências

```bash
# Backend
npm install puppeteer axios

# Frontend
npm install axios
```

## Benefícios

✅ **Visual Rico** - Layouts com fotos reais
✅ **Screenshots Reais** - Captura páginas de produtos
✅ **Imagens Gratuitas** - APIs gratuitas de alta qualidade
✅ **IA Visual** - Gemini Vision analisa imagens
✅ **Layouts Inteligentes** - Composição automática
✅ **Performance** - Otimizado e cacheado
✅ **Fallbacks** - Funciona mesmo se APIs falharem

Este sistema transforma respostas de texto em experiências visuais ricas e imersivas!
