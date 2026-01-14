# Design Document

## Overview

Este documento detalha o design técnico para implementar um sistema de múltiplos editores especializados no AI Web Weaver, com IAs especialistas separadas para Frontend e Backend, permitindo trabalho paralelo e coordenado em diferentes stacks tecnológicos.

## Architecture

### High-Level Architecture
```
AI Web Weaver Multi-Editor System
├── Editor Manager (Gerencia múltiplas abas)
├── AI Specialist Router (Roteia para IA correta)
├── Frontend AI Specialist (Especialista em UI/UX)
├── Backend AI Specialist (Especialista em APIs/DB)
├── General AI (IA original do sistema)
├── Stack Template Manager (Gerencia templates de tecnologia)
└── Cross-Editor Communication (Sincronização entre editores)
```

### Component Structure
```
App.tsx
├── EditorTabManager.tsx (NEW)
│   ├── EditorTab.tsx (NEW)
│   ├── NewEditorModal.tsx (NEW)
│   └── StackSelector.tsx (NEW)
├── AISpecialistSelector.tsx (NEW)
├── MultiEditorLayout.tsx (NEW)
├── HtmlEditor.tsx (Enhanced)
├── FrontendAIService.tsx (NEW)
├── BackendAIService.tsx (NEW)
└── CrossEditorSync.tsx (NEW)
```

## Components and Interfaces

### 1. Editor Tab Manager

**Purpose:** Gerenciar múltiplos editores em sistema de abas

```typescript
interface EditorTab {
  id: string;
  name: string;
  stack: TechStack;
  content: string;
  isActive: boolean;
  isDirty: boolean;
  aiSpecialist: 'general' | 'frontend' | 'backend';
  createdAt: Date;
  lastModified: Date;
}

interface EditorTabManagerProps {
  tabs: EditorTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabCreate: (stack: TechStack) => void;
  onTabClose: (tabId: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
}
```

### 2. Stack Selector

**Purpose:** Permitir seleção de tecnologia antes de criar editor

```typescript
type TechStack = 
  | 'html5-vanilla'
  | 'react-typescript'
  | 'vue-composition'
  | 'angular-standalone'
  | 'nodejs-express'
  | 'python-flask'
  | 'python-fastapi'
  | 'php-laravel'
  | 'java-spring'
  | 'csharp-dotnet';

interface StackTemplate {
  id: TechStack;
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'fullstack';
  icon: string;
  defaultFiles: {
    name: string;
    content: string;
    language: string;
  }[];
  aiInstructions: string;
}

const stackTemplates: Record<TechStack, StackTemplate> = {
  'html5-vanilla': {
    id: 'html5-vanilla',
    name: 'HTML5 + CSS + JavaScript',
    description: 'HTML5 puro com CSS moderno e JavaScript vanilla',
    category: 'frontend',
    icon: 'fab fa-html5',
    defaultFiles: [
      { name: 'index.html', content: '<!DOCTYPE html>...', language: 'html' },
      { name: 'style.css', content: '/* CSS moderno */', language: 'css' },
      { name: 'script.js', content: '// JavaScript ES6+', language: 'javascript' }
    ],
    aiInstructions: 'Foque em HTML5 semântico, CSS Grid/Flexbox, JavaScript ES6+ vanilla'
  },
  'react-typescript': {
    id: 'react-typescript',
    name: 'React + TypeScript',
    description: 'React moderno com TypeScript e hooks',
    category: 'frontend',
    icon: 'fab fa-react',
    defaultFiles: [
      { name: 'App.tsx', content: 'import React from "react";...', language: 'typescript' },
      { name: 'index.tsx', content: 'import ReactDOM from "react-dom";...', language: 'typescript' }
    ],
    aiInstructions: 'Use React hooks, TypeScript strict, componentes funcionais, props tipadas'
  }
  // ... outros stacks
};
```

### 3. AI Specialist Services

**Purpose:** IAs especializadas com conhecimento específico

```typescript
// Frontend AI Specialist
class FrontendAISpecialist {
  private instructions = `
    **VOCÊ É UM ESPECIALISTA FRONTEND SÊNIOR**
    
    **FOCO EXCLUSIVO:**
    - UI/UX Design e Implementação
    - Componentes Reutilizáveis
    - Responsividade e Acessibilidade
    - Performance Frontend
    - Animações e Interações
    - State Management (Redux, Zustand, Context)
    - Integração com APIs (consumo)
    
    **TECNOLOGIAS DOMINADAS:**
    - HTML5 Semântico
    - CSS3/SCSS/Tailwind
    - JavaScript/TypeScript
    - React/Vue/Angular
    - Next.js/Nuxt.js
    - Webpack/Vite
    - Testing (Jest, Cypress)
    
    **NUNCA GERE:**
    - Código de backend/servidor
    - Configurações de banco de dados
    - APIs ou endpoints
    - Lógica de autenticação do servidor
  `;

  async generateCode(prompt: string, stack: TechStack, context?: string): Promise<string> {
    const stackInstructions = stackTemplates[stack].aiInstructions;
    const fullPrompt = `${this.instructions}\n\n**STACK ATUAL:** ${stackInstructions}\n\n**SOLICITAÇÃO:** ${prompt}`;
    
    // Usar GeminiService com instruções específicas
    return await this.callGeminiWithSpecialistInstructions(fullPrompt, context);
  }
}

// Backend AI Specialist
class BackendAISpecialist {
  private instructions = `
    **VOCÊ É UM ESPECIALISTA BACKEND SÊNIOR**
    
    **FOCO EXCLUSIVO:**
    - APIs RESTful e GraphQL
    - Banco de Dados e ORMs
    - Autenticação e Autorização
    - Arquitetura de Microserviços
    - Performance e Escalabilidade
    - Segurança Backend
    - DevOps e Deploy
    - Testes de Integração
    
    **TECNOLOGIAS DOMINADAS:**
    - Node.js/Express/Fastify
    - Python/Flask/Django/FastAPI
    - Java/Spring Boot
    - C#/.NET Core
    - PHP/Laravel
    - PostgreSQL/MySQL/MongoDB
    - Redis/Elasticsearch
    - Docker/Kubernetes
    
    **NUNCA GERE:**
    - Código de interface/frontend
    - Componentes visuais
    - CSS ou estilos
    - Lógica de apresentação
  `;

  async generateCode(prompt: string, stack: TechStack, context?: string): Promise<string> {
    const stackInstructions = stackTemplates[stack].aiInstructions;
    const fullPrompt = `${this.instructions}\n\n**STACK ATUAL:** ${stackInstructions}\n\n**SOLICITAÇÃO:** ${prompt}`;
    
    return await this.callGeminiWithSpecialistInstructions(fullPrompt, context);
  }
}
```

### 4. Cross-Editor Communication

**Purpose:** Sincronização e comunicação entre editores

```typescript
interface CrossEditorMessage {
  type: 'api_created' | 'component_needs_data' | 'schema_updated' | 'deployment_ready';
  sourceEditorId: string;
  targetEditorId?: string; // null = broadcast
  data: any;
  timestamp: Date;
}

class CrossEditorSync {
  private subscribers = new Map<string, (message: CrossEditorMessage) => void>();
  
  subscribe(editorId: string, callback: (message: CrossEditorMessage) => void) {
    this.subscribers.set(editorId, callback);
  }
  
  broadcast(message: CrossEditorMessage) {
    this.subscribers.forEach((callback, editorId) => {
      if (editorId !== message.sourceEditorId) {
        callback(message);
      }
    });
  }
  
  // Exemplo: Backend criou uma API
  notifyApiCreated(editorId: string, apiSpec: any) {
    this.broadcast({
      type: 'api_created',
      sourceEditorId: editorId,
      data: apiSpec,
      timestamp: new Date()
    });
  }
  
  // Exemplo: Frontend precisa de dados
  requestBackendData(editorId: string, dataRequirement: any) {
    this.broadcast({
      type: 'component_needs_data',
      sourceEditorId: editorId,
      data: dataRequirement,
      timestamp: new Date()
    });
  }
}
```

## Data Models

### Enhanced Store State
```typescript
interface MultiEditorState {
  // Editor Management
  editors: EditorTab[];
  activeEditorId: string;
  
  // AI Specialists
  activeAiSpecialist: 'general' | 'frontend' | 'backend';
  frontendAI: FrontendAISpecialist;
  backendAI: BackendAISpecialist;
  
  // Cross-Editor Communication
  crossEditorSync: CrossEditorSync;
  sharedContext: {
    apis: any[];
    schemas: any[];
    components: any[];
  };
  
  // Stack Templates
  availableStacks: StackTemplate[];
  
  // UI State
  isNewEditorModalOpen: boolean;
  selectedStackForNewEditor: TechStack | null;
}
```

### Editor Configuration
```typescript
interface EditorConfig {
  id: string;
  name: string;
  stack: TechStack;
  aiSpecialist: 'general' | 'frontend' | 'backend';
  files: {
    name: string;
    content: string;
    language: string;
    isActive: boolean;
  }[];
  settings: {
    theme: string;
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
  };
  aiContext: string; // Contexto específico para IA
}
```

## Error Handling

### AI Specialist Conflicts
- **Scenario:** Frontend AI tenta gerar código backend
- **Solution:** Validação de escopo antes da geração
- **Fallback:** Sugerir IA correta para a tarefa

### Cross-Editor Sync Failures
- **Scenario:** Mensagem entre editores falha
- **Solution:** Retry mechanism com timeout
- **Fallback:** Notificação manual ao usuário

### Stack Template Loading
- **Scenario:** Template de stack não carrega
- **Solution:** Fallback para template básico
- **Fallback:** Permitir criação manual

## Testing Strategy

### Unit Tests
- Testar cada AI Specialist isoladamente
- Testar CrossEditorSync com diferentes cenários
- Testar StackSelector com todos os templates

### Integration Tests
- Testar comunicação entre Frontend e Backend AI
- Testar criação e gerenciamento de múltiplos editores
- Testar sincronização de contexto entre editores

### User Experience Tests
- Verificar fluxo de criação de novo editor
- Testar alternância entre IAs especialistas
- Validar que contexto é mantido entre abas

## Implementation Notes

### Performance Considerations
- Lazy loading de editores não ativos
- Debounce para sincronização cross-editor
- Virtual scrolling para lista de abas
- Code splitting por stack template

### UI/UX Design
```css
/* Tab System */
.editor-tabs {
  display: flex;
  background: var(--slate-800);
  border-bottom: 1px solid var(--slate-700);
  overflow-x: auto;
}

.editor-tab {
  padding: 8px 16px;
  border-right: 1px solid var(--slate-700);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.editor-tab.active {
  background: var(--slate-700);
  border-bottom: 2px solid var(--blue-500);
}

.editor-tab.dirty::after {
  content: '•';
  color: var(--orange-500);
  font-weight: bold;
}

/* AI Specialist Selector */
.ai-specialist-selector {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--slate-800);
  border-radius: 6px;
}

.ai-specialist-button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.ai-specialist-button.active {
  background: var(--blue-600);
  color: white;
}

.ai-specialist-button.frontend {
  border-left: 3px solid var(--green-500);
}

.ai-specialist-button.backend {
  border-left: 3px solid var(--purple-500);
}

/* Stack Selector Modal */
.stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.stack-card {
  padding: 20px;
  border: 2px solid var(--slate-700);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.stack-card:hover {
  border-color: var(--blue-500);
  transform: translateY(-2px);
}

.stack-card.selected {
  border-color: var(--blue-500);
  background: var(--blue-500/10);
}
```

### Accessibility
- Keyboard navigation entre abas
- Screen reader support para AI specialist status
- Focus management ao criar/fechar editores
- ARIA labels para todos os controles

### Extensibility
- Plugin system para novos stacks
- Custom AI specialist creation
- Template sharing between users
- Export/import editor configurations