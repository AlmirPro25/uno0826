# Design Document

## Overview

Este documento detalha o design técnico para refinar a interface do AI Web Weaver, focando em melhorar a experiência do usuário durante operações de IA e corrigir problemas específicos de usabilidade identificados no sistema atual.

## Architecture

### Component Structure
```
App.tsx (Main Container)
├── AiResearchPanel.tsx (Refined)
├── HtmlEditor.tsx (Enhanced)
├── CommandBar.tsx (Status Updates)
└── Loading States Manager (New)
```

### State Management Approach
- Utilizar o Zustand store existente (`useAppStore`)
- Adicionar novos estados granulares para loading
- Implementar sistema de streaming para código
- Manter separação clara entre UI state e business logic

## Components and Interfaces

### 1. Enhanced AiResearchPanel

**Current Issues:**
- Cards com alturas inconsistentes
- Alinhamento irregular entre categorias
- Espaçamento inadequado

**Design Solution:**
```typescript
interface EnhancedResearchPanelProps {
  findings: ResearchFinding[] | null;
  onClose: () => void;
}

// CSS Grid Layout com altura fixa para cards
.research-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  align-items: start; // Alinhamento consistente
}

.research-card {
  height: 160px; // Altura fixa
  display: flex;
  flex-direction: column;
}
```

### 2. Non-Blocking Editor Interface

**Current Issues:**
- `pointer-events-none` bloqueia toda interação
- Mouse não funciona durante geração
- Scroll travado

**Design Solution:**
```typescript
interface EditorInteractionState {
  canEdit: boolean;        // Bloqueia apenas edição
  canNavigate: boolean;    // Sempre true para navegação
  canSelect: boolean;      // Sempre true para seleção
  isStreaming: boolean;    // Indica streaming ativo
}

// Aplicar bloqueio seletivo apenas em elementos específicos
.editor-content {
  pointer-events: auto; // Sempre permitir navegação
}

.editor-content.editing-disabled textarea {
  pointer-events: none; // Bloquear apenas edição
}
```

### 3. Real-time Code Streaming

**Current Issues:**
- Código aparece todo de uma vez
- Não acompanha progresso
- Sem feedback visual de construção

**Design Solution:**
```typescript
interface CodeStreamingManager {
  streamContent: (content: string, onChunk: (chunk: string) => void) => void;
  autoScroll: boolean;
  cursorPosition: number;
}

// Implementação de streaming character-by-character
const streamCodeToEditor = (fullCode: string, editor: editor.IStandaloneCodeEditor) => {
  const chunks = fullCode.split('');
  let currentIndex = 0;
  
  const streamInterval = setInterval(() => {
    if (currentIndex < chunks.length) {
      const currentContent = editor.getValue();
      editor.setValue(currentContent + chunks[currentIndex]);
      
      // Auto-scroll para acompanhar
      const lineCount = editor.getModel()?.getLineCount() || 1;
      editor.revealLine(lineCount);
      
      currentIndex++;
    } else {
      clearInterval(streamInterval);
    }
  }, 50); // 50ms por caractere
};
```

### 4. Granular Status Messages

**Current Issues:**
- Mensagens genéricas de loading
- Falta de contexto específico
- Não diferencia backend/frontend

**Design Solution:**
```typescript
interface DetailedStatusManager {
  currentOperation: string;
  subOperations: string[];
  progress: number;
  estimatedTime?: number;
}

const statusMessages = {
  'generate_backend': [
    'Analisando requisitos do backend...',
    'Criando estrutura de APIs...',
    'Implementando lógica de negócio...',
    'Configurando banco de dados...',
    'Finalizando backend...'
  ],
  'generate_frontend': [
    'Projetando interface do usuário...',
    'Criando componentes React...',
    'Implementando interações...',
    'Aplicando estilos e responsividade...',
    'Integrando com backend...'
  ]
};
```

## Data Models

### Enhanced Loading State
```typescript
interface GranularLoadingState {
  operation: string;
  phase: string;
  message: string;
  progress: number; // 0-100
  startTime: number;
  estimatedDuration?: number;
  canCancel: boolean;
}

interface EditorState {
  isStreaming: boolean;
  streamingSpeed: number; // chars per second
  allowNavigation: boolean;
  allowSelection: boolean;
  allowEditing: boolean;
  autoScroll: boolean;
}
```

### Research Panel Layout
```typescript
interface ResearchCardLayout {
  minHeight: number;
  maxHeight: number;
  aspectRatio?: string;
  gridColumns: number;
  gap: number;
}
```

## Error Handling

### Editor Interaction Errors
- **Scenario:** Editor trava durante streaming
- **Solution:** Implementar timeout e recovery mechanism
- **Fallback:** Permitir cancelamento manual da operação

### Research Panel Rendering
- **Scenario:** Cards com conteúdo muito longo
- **Solution:** Truncar texto com "..." e tooltip
- **Fallback:** Altura máxima com scroll interno

### Streaming Interruption
- **Scenario:** Conexão perdida durante streaming
- **Solution:** Salvar estado parcial e permitir retomada
- **Fallback:** Mostrar código parcial com indicador de interrupção

## Testing Strategy

### Unit Tests
- Testar componente `AiResearchPanel` com diferentes tamanhos de conteúdo
- Testar `EditorInteractionManager` com vários estados de loading
- Testar `CodeStreamingManager` com interrupções

### Integration Tests
- Testar fluxo completo de geração com streaming
- Testar interação do usuário durante operações de IA
- Testar responsividade do painel de pesquisa

### User Experience Tests
- Verificar que mouse funciona durante geração
- Confirmar que mensagens de status são claras
- Validar que streaming é suave e não causa lag

## Implementation Notes

### CSS Improvements
```css
/* Research Panel Fixes */
.research-panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  align-items: stretch;
}

.research-card {
  height: 180px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.research-card-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* Editor Non-blocking */
.editor-container {
  position: relative;
}

.editor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none; /* Não bloqueia interação */
  z-index: 1;
}

.editor-overlay.editing-disabled {
  pointer-events: auto; /* Bloqueia apenas quando necessário */
}
```

### Performance Considerations
- Debounce scroll events durante streaming
- Usar `requestAnimationFrame` para animações suaves
- Implementar virtual scrolling para listas longas de resultados
- Lazy loading para conteúdo de pesquisa

### Accessibility
- Manter foco visível durante operações
- Anunciar mudanças de status para screen readers
- Preservar navegação por teclado
- Indicadores visuais claros para estados de loading