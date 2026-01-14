# Sistema de Canvas Dinâmico - Índice Completo

## 📚 Documentação

### Visão Geral
- [Sistema de Templates Dinâmicos](./SISTEMA_TEMPLATES_DINAMICOS.md) - Arquitetura e conceitos
- [Exemplo de Integração](./EXEMPLO_INTEGRACAO_CANVAS.md) - Como integrar no ChatView
- [Guia de Criação de Templates](./GUIA_CRIAR_TEMPLATES.md) - Como criar novos templates

## 🎨 Templates Disponíveis

### 1. NewsTemplate
**Uso**: Exibição de notícias e artigos
**Detecta**: Palavras como "notícia", "aconteceu", "jornal"
**Estrutura**:
```tsx
{
  articles: [
    {
      title: string;
      content: string;
      source?: string;
      image?: string;
      url?: string;
      publishedAt?: string;
    }
  ]
}
```

### 2. ProductsTemplate
**Uso**: Exibição de produtos e preços
**Detecta**: Palavras como "comprar", "preço", "produto", "R$"
**Estrutura**:
```tsx
{
  products: [
    {
      title: string;
      price: string;
      image?: string;
      url?: string;
      rating?: number;
      store?: string;
    }
  ]
}
```

### 3. TableTemplate
**Uso**: Comparações e dados tabulares
**Detecta**: Palavras como "comparar", "tabela", "versus"
**Estrutura**:
```tsx
{
  headers: string[];
  rows: string[][];
  totalRows: number;
}
```

### 4. MediaTemplate
**Uso**: Galerias de imagens e vídeos
**Detecta**: Palavras como "imagem", "foto", "vídeo", "galeria"
**Estrutura**:
```tsx
{
  images: MediaItem[];
  videos: MediaItem[];
  totalItems: number;
}
```

### 5. RichTextTemplate
**Uso**: Artigos longos e conteúdo formatado
**Detecta**: Textos com mais de 1000 palavras ou formatação markdown
**Estrutura**:
```tsx
{
  content: string;
  sections: string[];
  wordCount: number;
}
```

## 🧠 Componentes Principais

### TemplateMaestroService
**Localização**: `src/services/templateMaestroService.ts`
**Função**: Orquestrador inteligente que analisa e escolhe templates

**Métodos principais**:
- `analyzeAndChooseTemplate()` - Analisa e escolhe template
- `detectContentType()` - Detecta tipo de conteúdo
- `extractStructuredData()` - Extrai dados estruturados

### DynamicCanvas
**Localização**: `src/components/DynamicCanvas.tsx`
**Função**: Renderizador de canvas de fundo

**Props**:
- `templateData: TemplateData | null`
- `isVisible: boolean`

### useTemplateCanvas Hook
**Localização**: `src/hooks/useTemplateCanvas.ts`
**Função**: Hook para gerenciar estado do canvas

**Retorna**:
```tsx
{
  templateData: TemplateData | null;
  isVisible: boolean;
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  analyzeAndRender: (query, response, context) => Promise<AnalysisResult>;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  clear: () => void;
  updateTemplateData: (data) => void;
}
```

## 🔄 Fluxo de Dados

```
1. Usuário faz pergunta
   ↓
2. Sistema gera resposta (Gemini)
   ↓
3. analyzeAndRender() é chamado
   ↓
4. TemplateMaestro analisa contexto
   ↓
5. detectContentType() identifica tipo
   ↓
6. extractStructuredData() extrai dados
   ↓
7. DynamicCanvas renderiza template
   ↓
8. Animação de entrada
   ↓
9. Canvas visível no fundo
```

## 💡 Exemplos de Uso

### Exemplo 1: Busca de Produtos
```tsx
const context = {
  hasProducts: true,
  products: [
    { title: 'Notebook', price: 'R$ 3.500', image: '...' }
  ]
};

await analyzeAndRender(
  'notebook dell',
  'Encontrei alguns notebooks...',
  context
);
// Resultado: ProductsTemplate
```

### Exemplo 2: Notícias
```tsx
const context = {
  hasNews: true,
  news: [
    { title: 'Nova tecnologia...', content: '...', source: 'TechNews' }
  ]
};

await analyzeAndRender(
  'notícias de tecnologia',
  'Aqui estão as últimas notícias...',
  context
);
// Resultado: NewsTemplate
```

### Exemplo 3: Comparação
```tsx
await analyzeAndRender(
  'compare iphone vs samsung',
  '| Feature | iPhone | Samsung |\n|---------|--------|---------|',
  {}
);
// Resultado: TableTemplate
```

## 🎯 Casos de Uso

### 1. E-commerce
- Busca de produtos
- Comparação de preços
- Avaliações e reviews

### 2. Portal de Notícias
- Feed de notícias
- Artigos relacionados
- Categorias

### 3. Educação
- Artigos educativos
- Tutoriais passo a passo
- Recursos visuais

### 4. Entretenimento
- Galeria de imagens
- Vídeos relacionados
- Playlists

### 5. Análise de Dados
- Gráficos e tabelas
- Comparações
- Estatísticas

## 🚀 Próximos Passos

### Templates Sugeridos
1. **TimelineTemplate** - Para eventos cronológicos
2. **MapTemplate** - Para localizações geográficas
3. **ChartTemplate** - Para gráficos e visualizações
4. **RecipeTemplate** - Para receitas culinárias
5. **WeatherTemplate** - Para previsão do tempo
6. **CalendarTemplate** - Para eventos e agendas
7. **ContactTemplate** - Para informações de contato
8. **CodeTemplate** - Para snippets de código
9. **MusicTemplate** - Para playlists e músicas
10. **SocialTemplate** - Para posts de redes sociais

### Melhorias Futuras
- [ ] Transições entre templates
- [ ] Histórico de templates
- [ ] Favoritos
- [ ] Compartilhamento
- [ ] Exportação (PDF, imagem)
- [ ] Temas personalizáveis
- [ ] Modo escuro/claro
- [ ] Acessibilidade completa
- [ ] Suporte a PWA
- [ ] Cache de templates

## 📖 Referências

### Arquivos Principais
```
src/
├── services/
│   └── templateMaestroService.ts
├── components/
│   ├── DynamicCanvas.tsx
│   └── templates/
│       ├── NewsTemplate.tsx
│       ├── ProductsTemplate.tsx
│       ├── TableTemplate.tsx
│       ├── MediaTemplate.tsx
│       └── RichTextTemplate.tsx
└── hooks/
    └── useTemplateCanvas.ts
```

### Dependências
- React 18+
- TypeScript
- react-markdown (para RichTextTemplate)

## 🤝 Contribuindo

Para adicionar um novo template:
1. Leia o [Guia de Criação de Templates](./GUIA_CRIAR_TEMPLATES.md)
2. Crie o componente em `src/components/templates/`
3. Adicione a lógica no `TemplateMaestroService`
4. Teste com dados reais
5. Documente o uso

## 📝 Notas

- Todos os templates são responsivos
- Animações são suaves e performáticas
- Dados são validados antes da renderização
- Fallback para template padrão em caso de erro
- Sistema é extensível e modular

## 🎨 Design System

### Cores
- Background: `#1a1a2e` → `#16213e`
- Accent: `#4a9eff`
- Text: `rgba(255, 255, 255, 0.9)`
- Secondary: `rgba(255, 255, 255, 0.6)`

### Espaçamentos
- Small: `0.5rem`
- Medium: `1rem`
- Large: `1.5rem`
- XLarge: `2rem`

### Bordas
- Radius: `12px`
- Cards: `12px`
- Buttons: `8px`
- Pills: `50px`

### Animações
- Duration: `0.3s`
- Easing: `ease-in-out`
- Hover: `transform: translateY(-5px)`
