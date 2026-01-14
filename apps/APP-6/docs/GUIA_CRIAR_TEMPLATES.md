# Guia: Como Criar Novos Templates

## Estrutura de um Template

Cada template é um componente React que recebe dados estruturados e os renderiza de forma visual.

## Passo a Passo

### 1. Criar o Componente do Template

```tsx
// src/components/templates/MeuTemplate.tsx

import React from 'react';

interface MeuTemplateProps {
  data: {
    // Defina a estrutura dos dados
    items: any[];
    title: string;
  };
}

export const MeuTemplate: React.FC<MeuTemplateProps> = ({ data }) => {
  return (
    <div className="meu-template">
      <div className="template-header">
        <h2>{data.title}</h2>
      </div>

      <div className="template-content">
        {data.items.map((item, index) => (
          <div key={index} className="item">
            {/* Renderize seus itens */}
          </div>
        ))}
      </div>

      <style>{`
        .meu-template {
          /* Seus estilos */
        }
      `}</style>
    </div>
  );
};

export default MeuTemplate;
```

### 2. Adicionar Tipo no Maestro

```tsx
// src/services/templateMaestroService.ts

export type TemplateType = 
  | 'news'
  | 'products'
  | 'table'
  | 'media'
  | 'rich-text'
  | 'meu-template' // ← Adicione aqui
  | 'default';
```

### 3. Adicionar Detecção no Maestro

```tsx
// src/services/templateMaestroService.ts

private detectContentType(
  query: string,
  response: string,
  context?: any
): TemplateType {
  // ... código existente ...

  // Adicione sua lógica de detecção
  if (
    /\b(palavra-chave|padrão)\b/i.test(query) ||
    context?.hasMeuTipo
  ) {
    return 'meu-template';
  }

  return 'default';
}
```

### 4. Adicionar Extração de Dados

```tsx
// src/services/templateMaestroService.ts

private async extractStructuredData(
  response: string,
  type: TemplateType,
  context?: any
): Promise<any> {
  switch (type) {
    // ... casos existentes ...
    
    case 'meu-template':
      return this.extractMeuTemplateDados(response, context);
    
    default:
      return { content: response };
  }
}

private extractMeuTemplateDados(response: string, context?: any): any {
  // Sua lógica de extração
  return {
    items: [],
    title: 'Meu Template'
  };
}
```

### 5. Adicionar no DynamicCanvas

```tsx
// src/components/DynamicCanvas.tsx

import MeuTemplate from './templates/MeuTemplate';

const renderTemplate = () => {
  if (!templateData) return null;

  switch (templateData.type) {
    // ... casos existentes ...
    
    case 'meu-template':
      return <MeuTemplate data={templateData.data} />;
    
    default:
      return <div>...</div>;
  }
};
```

## Exemplos de Templates

### Template de Timeline

```tsx
// TimelineTemplate.tsx
export const TimelineTemplate: React.FC<TimelineTemplateProps> = ({ data }) => {
  return (
    <div className="timeline-template">
      <div className="timeline">
        {data.events.map((event, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-marker">{event.date}</div>
            <div className="timeline-content">
              <h3>{event.title}</h3>
              <p>{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Template de Mapa

```tsx
// MapTemplate.tsx
export const MapTemplate: React.FC<MapTemplateProps> = ({ data }) => {
  return (
    <div className="map-template">
      <div className="map-container">
        {/* Integração com Google Maps ou Leaflet */}
      </div>
      <div className="locations-list">
        {data.locations.map((loc, index) => (
          <div key={index} className="location-card">
            <h3>{loc.name}</h3>
            <p>{loc.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Template de Gráficos

```tsx
// ChartTemplate.tsx
import { Line, Bar, Pie } from 'react-chartjs-2';

export const ChartTemplate: React.FC<ChartTemplateProps> = ({ data }) => {
  return (
    <div className="chart-template">
      <h2>{data.title}</h2>
      
      {data.chartType === 'line' && <Line data={data.chartData} />}
      {data.chartType === 'bar' && <Bar data={data.chartData} />}
      {data.chartType === 'pie' && <Pie data={data.chartData} />}
    </div>
  );
};
```

### Template de Receitas

```tsx
// RecipeTemplate.tsx
export const RecipeTemplate: React.FC<RecipeTemplateProps> = ({ data }) => {
  return (
    <div className="recipe-template">
      <div className="recipe-header">
        <img src={data.image} alt={data.title} />
        <h2>{data.title}</h2>
        <div className="recipe-meta">
          <span>⏱️ {data.prepTime}</span>
          <span>👥 {data.servings} porções</span>
          <span>⭐ {data.rating}</span>
        </div>
      </div>

      <div className="recipe-content">
        <section className="ingredients">
          <h3>Ingredientes</h3>
          <ul>
            {data.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </section>

        <section className="instructions">
          <h3>Modo de Preparo</h3>
          <ol>
            {data.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};
```

## Dicas de Design

### 1. Consistência Visual
- Use a mesma paleta de cores
- Mantenha espaçamentos consistentes
- Use animações suaves

### 2. Responsividade
```css
.meu-template {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .meu-template {
    grid-template-columns: 1fr;
  }
}
```

### 3. Performance
- Use `React.memo` para componentes pesados
- Lazy load de imagens
- Virtualize listas longas

```tsx
import { memo } from 'react';

export const MeuTemplate = memo<MeuTemplateProps>(({ data }) => {
  // ...
});
```

### 4. Acessibilidade
```tsx
<div 
  role="article"
  aria-label={data.title}
  tabIndex={0}
>
  {/* conteúdo */}
</div>
```

## Padrões de Extração de Dados

### Regex para Preços
```tsx
const priceRegex = /R\$\s*(\d+(?:[.,]\d{2})?)/g;
const prices = text.match(priceRegex);
```

### Regex para Datas
```tsx
const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/g;
const dates = text.match(dateRegex);
```

### Regex para URLs
```tsx
const urlRegex = /(https?:\/\/[^\s]+)/g;
const urls = text.match(urlRegex);
```

### Extração de Listas
```tsx
const listItems = text
  .split('\n')
  .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
  .map(line => line.replace(/^[-•]\s*/, '').trim());
```

## Testando seu Template

```tsx
// Teste manual
const testData = {
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ],
  title: 'Teste'
};

// No console do navegador
analyzeAndRender(
  'teste meu template',
  'resposta qualquer',
  { hasMeuTipo: true, ...testData }
);
```

## Checklist de Criação

- [ ] Componente criado em `src/components/templates/`
- [ ] Tipo adicionado em `TemplateType`
- [ ] Lógica de detecção implementada
- [ ] Extração de dados implementada
- [ ] Adicionado no `DynamicCanvas`
- [ ] Estilos responsivos
- [ ] Testado com dados reais
- [ ] Documentado
