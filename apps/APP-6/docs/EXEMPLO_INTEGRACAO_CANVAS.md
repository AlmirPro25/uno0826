# Exemplo de Integração do Canvas Dinâmico

## Como Integrar no ChatView

```tsx
import React, { useEffect } from 'react';
import { DynamicCanvas } from './components/DynamicCanvas';
import { useTemplateCanvas } from './hooks/useTemplateCanvas';

export const ChatView: React.FC = () => {
  const {
    templateData,
    isVisible,
    isAnalyzing,
    analysisResult,
    analyzeAndRender,
    toggle,
    clear
  } = useTemplateCanvas({ autoShow: true });

  // Quando receber uma nova resposta da IA
  const handleAIResponse = async (userQuery: string, aiResponse: string, context?: any) => {
    // Analisa e renderiza automaticamente
    const result = await analyzeAndRender(userQuery, aiResponse, context);
    
    if (result) {
      console.log('Template escolhido:', result.templateType);
      console.log('Confiança:', result.confidence);
      console.log('Razão:', result.reasoning);
    }
  };

  return (
    <div className="chat-container">
      {/* Canvas de fundo */}
      <DynamicCanvas 
        templateData={templateData}
        isVisible={isVisible}
      />

      {/* Chat sobreposto */}
      <div className="chat-overlay">
        {/* Botão para alternar canvas */}
        <button onClick={toggle} className="toggle-canvas-btn">
          {isVisible ? '💬 Mostrar Chat' : '🎨 Mostrar Canvas'}
        </button>

        {/* Indicador de análise */}
        {isAnalyzing && (
          <div className="analyzing-indicator">
            🔍 Analisando melhor forma de apresentar...
          </div>
        )}

        {/* Resultado da análise */}
        {analysisResult && (
          <div className="analysis-info">
            <span>Template: {analysisResult.templateType}</span>
            <span>Confiança: {(analysisResult.confidence * 100).toFixed(0)}%</span>
          </div>
        )}

        {/* Mensagens do chat */}
        <div className="messages">
          {/* Suas mensagens aqui */}
        </div>
      </div>
    </div>
  );
};
```

## Exemplos de Uso

### 1. Busca por Produtos

```tsx
// Quando o usuário busca produtos
const context = {
  hasProducts: true,
  products: [
    {
      title: 'Notebook Dell',
      price: 'R$ 3.500',
      image: 'url...',
      store: 'Amazon'
    }
  ]
};

await analyzeAndRender(
  'notebook dell',
  'Encontrei alguns notebooks Dell...',
  context
);
// Resultado: Template de Produtos
```

### 2. Busca por Notícias

```tsx
const context = {
  hasNews: true,
  news: [
    {
      title: 'Nova tecnologia revoluciona mercado',
      content: 'Descrição da notícia...',
      source: 'TechNews',
      image: 'url...'
    }
  ]
};

await analyzeAndRender(
  'notícias de tecnologia',
  'Aqui estão as últimas notícias...',
  context
);
// Resultado: Template de Notícias
```

### 3. Comparação (Tabela)

```tsx
await analyzeAndRender(
  'compare iphone vs samsung',
  `
  | Característica | iPhone | Samsung |
  |---------------|--------|---------|
  | Preço         | R$ 5000| R$ 4000 |
  | Câmera        | 12MP   | 108MP   |
  `,
  {}
);
// Resultado: Template de Tabela
```

### 4. Artigo Longo

```tsx
await analyzeAndRender(
  'explique inteligência artificial',
  'Inteligência Artificial é... [texto longo com mais de 1000 palavras]',
  {}
);
// Resultado: Template de Texto Rico
```

## Controle Manual

```tsx
// Mostrar canvas manualmente
show();

// Esconder canvas
hide();

// Alternar
toggle();

// Limpar tudo
clear();

// Atualizar dados
updateTemplateData({
  data: { /* novos dados */ }
});
```

## Estilização do Container

```css
.chat-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.chat-overlay {
  position: relative;
  z-index: 10;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  transition: opacity 0.3s;
}

.chat-overlay.canvas-visible {
  opacity: 0.3;
  pointer-events: none;
}

.toggle-canvas-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
  background: #4a9eff;
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 4px 20px rgba(74, 158, 255, 0.3);
  transition: all 0.3s;
}

.toggle-canvas-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 30px rgba(74, 158, 255, 0.5);
}

.analyzing-indicator {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: rgba(74, 158, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.analysis-info {
  position: fixed;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: white;
  font-size: 0.85rem;
  display: flex;
  gap: 1rem;
}
```

## Fluxo Completo

1. **Usuário faz pergunta** → Sistema detecta intenção
2. **IA gera resposta** → Maestro analisa contexto
3. **Maestro escolhe template** → Baseado em padrões e dados
4. **Extrai dados estruturados** → Do contexto e resposta
5. **Renderiza no canvas** → Com animação suave
6. **Chat fica sobreposto** → Usuário pode alternar entre views

## Benefícios

- ✅ Interface mais rica e visual
- ✅ Melhor aproveitamento do espaço
- ✅ Experiência mais imersiva
- ✅ Separação clara de conteúdo
- ✅ Reutilização de templates
- ✅ Fácil extensão com novos templates
