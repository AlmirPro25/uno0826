# Exemplo Completo: UI Generativa

## Integração no App Principal

```tsx
// src/App.tsx
import React, { useState } from 'react';
import GenerativeHome from './components/GenerativeHome';
import ChatView from './components/ChatView';
import { useUserContext } from './hooks/useUserContext';

export const App: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  
  const {
    trackInteraction,
    addTopic,
    getUIContext
  } = useUserContext();

  const handleActionClick = (action: string) => {
    // Registra interação
    trackInteraction(action);
    
    // Mapeia ação para prompt
    const prompts: Record<string, string> = {
      'debug': 'Me ajude a debugar um código',
      'test': 'Gerar testes unitários para meu código',
      'review': 'Revisar qualidade do meu código',
      'document': 'Gerar documentação para minha API',
      'colors': 'Gerar uma paleta de cores harmoniosa',
      'mockup': 'Criar um mockup de interface',
      'inspiration': 'Buscar inspiração de design',
      'export': 'Preparar assets para exportação',
      'summarize': 'Resumir este artigo',
      'explain': 'Explicar este conceito',
      'solve': 'Resolver este exercício',
      'flashcards': 'Criar flashcards para estudo',
      'email': 'Escrever um e-mail profissional',
      'analyze': 'Analisar estes dados',
      'presentation': 'Criar uma apresentação',
      'research': 'Fazer pesquisa de mercado',
      'art': 'Gerar uma arte única',
      'story': 'Escrever uma história criativa',
      'music': 'Compor uma melodia',
      'brainstorm': 'Fazer brainstorm de ideias',
      'compare': 'Comparar preços de produtos',
      'news': 'Buscar últimas notícias'
    };

    setInitialPrompt(prompts[action] || action);
    setShowChat(true);
  };

  const handleNewChat = () => {
    setShowChat(false);
    setInitialPrompt('');
  };

  if (showChat) {
    return (
      <ChatView 
        initialPrompt={initialPrompt}
        onNewChat={handleNewChat}
        onTopicChange={addTopic}
      />
    );
  }

  return (
    <GenerativeHome 
      context={getUIContext()}
      onActionClick={handleActionClick}
    />
  );
};
```

## Exemplo de Uso no ChatView

```tsx
// src/components/ChatView.tsx
import React, { useEffect } from 'react';
import { useUserContext } from '../hooks/useUserContext';
import { useTemplateCanvas } from '../hooks/useTemplateCanvas';
import DynamicCanvas from './DynamicCanvas';

interface ChatViewProps {
  initialPrompt?: string;
  onNewChat?: () => void;
  onTopicChange?: (topic: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  initialPrompt,
  onNewChat,
  onTopicChange
}) => {
  const { trackInteraction, addTopic } = useUserContext();
  const {
    templateData,
    isVisible,
    analyzeAndRender,
    toggle
  } = useTemplateCanvas();

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (message: string) => {
    // Registra interação
    trackInteraction('send_message', message);
    
    // Adiciona tópico
    const keywords = extractKeywords(message);
    keywords.forEach(k => addTopic(k));
    if (onTopicChange) {
      keywords.forEach(k => onTopicChange(k));
    }

    // Envia para IA e recebe resposta
    const response = await sendToAI(message);
    
    // Analisa e renderiza template se apropriado
    await analyzeAndRender(message, response, {
      // Contexto adicional aqui
    });
  };

  const extractKeywords = (text: string): string[] => {
    // Extrai palavras-chave relevantes
    const words = text.toLowerCase().split(/\s+/);
    const keywords = words.filter(w => w.length > 4);
    return keywords.slice(0, 5);
  };

  const sendToAI = async (message: string): Promise<string> => {
    // Implementação da chamada à IA
    return 'Resposta da IA...';
  };

  return (
    <div className="chat-view">
      {/* Canvas de fundo */}
      <DynamicCanvas 
        templateData={templateData}
        isVisible={isVisible}
      />

      {/* Chat overlay */}
      <div className="chat-overlay">
        <button onClick={onNewChat} className="new-chat-btn">
          🏠 Nova Conversa
        </button>

        <button onClick={toggle} className="toggle-canvas-btn">
          {isVisible ? '💬 Chat' : '🎨 Canvas'}
        </button>

        {/* Mensagens do chat */}
        <div className="messages">
          {/* Suas mensagens aqui */}
        </div>
      </div>
    </div>
  );
};
```

## Fluxo Completo

### 1. Usuário Abre o App

```
┌─────────────────────────────────────┐
│  GenerativeHome carrega             │
│  ↓                                  │
│  useUserContext lê perfil salvo     │
│  ↓                                  │
│  getUIContext() gera contexto       │
│  ↓                                  │
│  uiComposer.composeUI()             │
│  ↓                                  │
│  Interface personalizada renderizada│
└─────────────────────────────────────┘
```

### 2. Usuário Clica em Card

```
┌─────────────────────────────────────┐
│  handleActionClick(action)          │
│  ↓                                  │
│  trackInteraction(action)           │
│  ↓                                  │
│  Mapeia action → prompt             │
│  ↓                                  │
│  Abre ChatView com prompt           │
└─────────────────────────────────────┘
```

### 3. Chat Processa Mensagem

```
┌─────────────────────────────────────┐
│  handleSendMessage(message)         │
│  ↓                                  │
│  trackInteraction('send_message')   │
│  ↓                                  │
│  extractKeywords() → addTopic()     │
│  ↓                                  │
│  sendToAI() → resposta              │
│  ↓                                  │
│  analyzeAndRender()                 │
│  ↓                                  │
│  Template renderizado no canvas     │
└─────────────────────────────────────┘
```

### 4. Sistema Aprende

```
┌─────────────────────────────────────┐
│  Cada interação é registrada        │
│  ↓                                  │
│  Padrões são analisados             │
│  ↓                                  │
│  Tipo de usuário é inferido         │
│  ↓                                  │
│  Próxima UI é mais personalizada    │
└─────────────────────────────────────┘
```

## Exemplos de Evolução da UI

### Primeira Visita
```tsx
// Usuário novo, sem histórico
{
  userType: undefined,
  recentTopics: [],
  interactions: []
}

// UI Gerada: Genérica, cards variados
- Criar um site
- Escrever e-mail
- Brainstorming
- Gerar imagem
```

### Após 5 Interações de Código
```tsx
{
  userType: 'developer',
  recentTopics: ['javascript', 'react', 'api', 'debug'],
  interactions: [
    { action: 'debug', ... },
    { action: 'test', ... },
    { action: 'review', ... }
  ]
}

// UI Gerada: Focada em desenvolvimento
- Debugar código
- Gerar testes
- Revisar código
- Documentar API
```

### Após 20 Interações Mistas
```tsx
{
  userType: 'developer',
  recentTopics: ['produto', 'preço', 'notebook', 'javascript'],
  interactions: [...]
}

// UI Gerada: Híbrida com contexto
- Comparar preços (contextual!)
- Debugar código
- Gerar testes
- Buscar produtos
```

## Personalização Avançada

### Por Hora do Dia

```tsx
// Manhã (6h-12h)
{
  hero: {
    greeting: '☀️ Bom dia, Almir!',
    subtitle: 'Pronto para começar o dia?',
    gradient: ['#FF6B6B', '#FFE66D']
  }
}

// Noite (22h-5h)
{
  hero: {
    greeting: '🌙 Boa noite, Almir!',
    subtitle: 'Vamos criar algo incrível?',
    gradient: ['#667EEA', '#764BA2']
  }
}
```

### Por Tipo de Usuário

```tsx
// Developer
{
  theme: {
    primary: '#00ff88',
    background: '#0a0e27'
  },
  cards: ['Debug', 'Test', 'Review', 'Document']
}

// Designer
{
  theme: {
    primary: '#ff6b9d',
    background: '#f8f9fa'
  },
  cards: ['Colors', 'Mockup', 'Inspiration', 'Export']
}
```

### Por Contexto Recente

```tsx
// Usuário acabou de buscar produtos
{
  actionCards: [
    {
      id: 'compare-prices',
      title: 'Comparar preços',
      priority: 11 // Maior prioridade!
    },
    // ... outros cards
  ]
}
```

## Configurações do Usuário

```tsx
// Componente de Configurações
const SettingsPanel = () => {
  const { profile, updatePreferences, setUserType } = useUserContext();

  return (
    <div className="settings">
      <h2>Personalização</h2>
      
      <label>
        Tipo de Usuário:
        <select 
          value={profile.userType} 
          onChange={e => setUserType(e.target.value)}
        >
          <option value="developer">Desenvolvedor</option>
          <option value="designer">Designer</option>
          <option value="student">Estudante</option>
          <option value="business">Negócios</option>
          <option value="creative">Criativo</option>
        </select>
      </label>

      <label>
        Layout:
        <select 
          value={profile.preferences.layout}
          onChange={e => updatePreferences({ layout: e.target.value })}
        >
          <option value="grid">Grade</option>
          <option value="list">Lista</option>
          <option value="masonry">Masonry</option>
        </select>
      </label>

      <label>
        <input 
          type="checkbox"
          checked={profile.preferences.animations}
          onChange={e => updatePreferences({ animations: e.target.checked })}
        />
        Animações
      </label>
    </div>
  );
};
```

## Métricas e Analytics

```tsx
const patterns = analyzePatterns();

console.log({
  mostFrequentActions: patterns.mostFrequentActions,
  // ['debug', 'test', 'review', 'document', 'code']
  
  preferredTime: patterns.preferredTime,
  // 'evening'
  
  totalInteractions: patterns.totalInteractions,
  // 156
  
  last24hInteractions: patterns.last24hInteractions
  // 23
});
```

Este sistema cria uma experiência verdadeiramente personalizada que evolui com o uso!
