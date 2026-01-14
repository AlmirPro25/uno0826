# 🎨 Integração Chat + Canvas - Navegação Automática

## Como Funciona

**Você fala no chat**: "Navegue em playwright.dev"  
**Sistema**: Detecta → Navega → Abre Canvas → Mostra o site!

---

## 🚀 Implementação no App.tsx

### 1. Importar Serviços

```typescript
import { 
  processBrowserCommand 
} from './services/browserIntegrationService';
import { BrowserResultCard } from './components/BrowserResultCard';
```

---

### 2. Adicionar Estado do Canvas

```typescript
const [canvasContent, setCanvasContent] = useState<any>(null);
const [showCanvas, setShowCanvas] = useState(false);
```

---

### 3. Modificar handleSendMessage

```typescript
const handleSendMessage = async (prompt: string) => {
  // Adicionar mensagem do usuário
  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content: prompt,
  };
  
  setMessages(prev => [...prev, userMessage]);
  
  // ========== VERIFICAR COMANDO DE NAVEGAÇÃO ==========
  const browserCommand = await processBrowserCommand(prompt);
  
  if (browserCommand) {
    // É comando de navegação/busca!
    
    // Adicionar mensagem de loading
    const loadingMessage: Message = {
      id: generateId(),
      role: 'model',
      content: '',
      isLoading: true,
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    if (browserCommand.success) {
      // Sucesso! Abrir Canvas
      setCanvasContent(browserCommand.data);
      setShowCanvas(true);
      
      // Atualizar mensagem
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: browserCommand.message,
                isLoading: false,
              }
            : msg
        )
      );
    } else {
      // Erro
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: browserCommand.message,
                isLoading: false,
                error: browserCommand.error,
              }
            : msg
        )
      );
    }
    
    return; // Não processar com LLM
  }
  
  // ========== PROCESSAR COM LLM NORMALMENTE ==========
  // ... seu código existente ...
};
```

---

### 4. Renderizar Canvas

```typescript
return (
  <div className="app">
    {/* Chat */}
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <MessageComponent
            key={msg.id}
            message={msg}
            // ... props
          />
        ))}
      </div>
      
      <PromptInput
        onSend={handleSendMessage}
        disabled={isLoading}
      />
    </div>
    
    {/* Canvas */}
    {showCanvas && canvasContent && (
      <div className="canvas-container">
        <div className="canvas-header">
          <h2>Canvas</h2>
          <button onClick={() => setShowCanvas(false)}>
            ✕ Fechar
          </button>
        </div>
        
        <div className="canvas-content">
          <BrowserResultCard
            type={canvasContent.type || 'webpage'}
            data={canvasContent}
          />
        </div>
      </div>
    )}
  </div>
);
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Navegar em Site

```
👤 Usuário: "Navegue em playwright.dev"

🤖 Sistema:
1. Detecta comando de navegação
2. Extrai URL: "playwright.dev"
3. Navega no site
4. Tira screenshot
5. Extrai conteúdo
6. Abre Canvas mostrando:
   - Screenshot do site
   - Título
   - Texto extraído
   - Links
   - Imagens
7. Responde no chat: "✅ Navegação concluída!"
```

---

### Exemplo 2: Buscar no Google

```
👤 Usuário: "Pesquise sobre Playwright automation"

🤖 Sistema:
1. Detecta comando de busca
2. Extrai query: "Playwright automation"
3. Busca no Google
4. Abre Canvas mostrando:
   - Lista de resultados
   - Títulos clicáveis
   - URLs
   - Snippets
5. Responde no chat: "✅ Encontrei 10 resultados"
```

---

### Exemplo 3: Abrir Site Específico

```
👤 Usuário: "Abra o site github.com/microsoft/playwright"

🤖 Sistema:
1. Detecta comando
2. Navega no GitHub
3. Mostra repositório no Canvas
4. Responde: "✅ Site carregado!"
```

---

## 🎨 Layout Sugerido

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Chat (50%)              │  Canvas (50%)           │
│                          │                          │
│  👤 Navegue em           │  ┌──────────────────┐   │
│     playwright.dev       │  │ 📸 Screenshot    │   │
│                          │  │                  │   │
│  🤖 ✅ Navegação         │  │  [Site Preview]  │   │
│     concluída!           │  │                  │   │
│                          │  └──────────────────┘   │
│  👤 Pesquise sobre       │                          │
│     React                │  📝 Texto: 3101 chars   │
│                          │  🔗 Links: 29           │
│  🤖 ✅ 10 resultados     │  🖼️ Imagens: 11         │
│                          │                          │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Código Completo (App.tsx)

```typescript
import React, { useState } from 'react';
import { Message } from './types';
import { MessageComponent } from './components/Message';
import { PromptInput } from './components/PromptInput';
import { BrowserResultCard } from './components/BrowserResultCard';
import { processBrowserCommand } from './services/browserIntegrationService';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [canvasContent, setCanvasContent] = useState<any>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateId = () => Date.now().toString();

  const handleSendMessage = async (prompt: string) => {
    // Mensagem do usuário
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: prompt,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Verificar comando de navegação
    const browserCommand = await processBrowserCommand(prompt);
    
    if (browserCommand) {
      const loadingMessage: Message = {
        id: generateId(),
        role: 'model',
        content: '',
        isLoading: true,
      };
      
      setMessages(prev => [...prev, loadingMessage]);

      if (browserCommand.success) {
        // Abrir Canvas
        setCanvasContent(browserCommand.data);
        setShowCanvas(true);
        
        // Atualizar mensagem
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: browserCommand.message,
                  isLoading: false,
                }
              : msg
          )
        );
      } else {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: browserCommand.message,
                  isLoading: false,
                  error: browserCommand.error,
                }
              : msg
          )
        );
      }
      
      setIsLoading(false);
      return;
    }

    // Processar com LLM normalmente
    try {
      // Seu código existente de LLM aqui
      // ...
    } catch (error) {
      console.error('Erro:', error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="app" style={{ display: 'flex', height: '100vh' }}>
      {/* Chat */}
      <div style={{ flex: showCanvas ? '1' : '1', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {messages.map(msg => (
            <MessageComponent
              key={msg.id}
              message={msg}
              onEdit={() => {}}
              onRegenerate={() => {}}
              isLastMessage={false}
              onStop={() => {}}
              onTextToSpeech={async () => ''}
              onShowInteractiveCode={() => {}}
              onSend={handleSendMessage}
              theme="dark"
              isThinkingMode={false}
            />
          ))}
        </div>
        
        <PromptInput
          onSend={handleSendMessage}
          disabled={isLoading}
        />
      </div>
      
      {/* Canvas */}
      {showCanvas && canvasContent && (
        <div style={{ 
          flex: '1', 
          borderLeft: '1px solid #333', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#1a1a1a'
        }}>
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, color: '#fff' }}>Canvas</h2>
            <button 
              onClick={() => setShowCanvas(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ✕ Fechar
            </button>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            <BrowserResultCard
              type={canvasContent.type || 'webpage'}
              data={canvasContent}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
```

---

## 🎯 Comandos que Funcionam

### Navegação
- "Navegue em playwright.dev"
- "Abra o site github.com"
- "Acesse https://example.com"
- "Visite microsoft.com"
- "Entre em react.dev"
- "Vá para nodejs.org"

### Busca
- "Pesquise sobre Playwright"
- "Busque no Google: React tutorial"
- "Procure informações sobre Node.js"
- "Encontre documentação do TypeScript"

---

## 🎨 CSS Sugerido

```css
.app {
  display: flex;
  height: 100vh;
  background: #0a0a0a;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.canvas-container {
  flex: 1;
  border-left: 1px solid #333;
  display: flex;
  flexDirection: column;
  background: #1a1a1a;
}

.canvas-header {
  padding: 16px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.canvas-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
```

---

## ✅ Checklist de Integração

- [ ] Importar `browserIntegrationService`
- [ ] Importar `BrowserResultCard`
- [ ] Adicionar estados `canvasContent` e `showCanvas`
- [ ] Modificar `handleSendMessage`
- [ ] Adicionar renderização do Canvas
- [ ] Testar comandos de navegação
- [ ] Testar comandos de busca

---

## 🎉 Resultado Final

Agora você pode:

1. ✅ Falar no chat: "Navegue em playwright.dev"
2. ✅ Sistema detecta automaticamente
3. ✅ Navega no site
4. ✅ Abre Canvas mostrando o site
5. ✅ Você vê screenshot, texto, links, imagens
6. ✅ Pode clicar nos links
7. ✅ Pode fechar o Canvas

**Igual ao WhatsApp Web, mas para qualquer site!** 🚀
