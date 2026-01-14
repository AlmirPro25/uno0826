# 🚀 INTEGRAÇÃO DO MAESTRO - GUIA RÁPIDO

## ⚡ INTEGRAÇÃO EM 3 PASSOS

### PASSO 1: Importar o Maestro no App.tsx

```typescript
// No início do arquivo App.tsx
import { 
  orchestrateSearch, 
  clearContext, 
  getContextStats 
} from './services/searchMaestroService';
```

### PASSO 2: Modificar a Função handleSend

**ANTES:**
```typescript
const handleSend = async (prompt: string) => {
  // Código antigo que não mantém contexto
  const response = await generateIntelligentResponse(prompt);
  addMessage({ role: 'model', content: response });
};
```

**DEPOIS:**
```typescript
const handleSend = async (prompt: string, attachments?: Attachment[]) => {
  if (!prompt.trim() && (!attachments || attachments.length === 0)) return;

  // Adicionar mensagem do usuário
  const userMessage: MessageType = {
    id: Date.now().toString(),
    role: 'user',
    content: prompt,
    attachments,
    timestamp: new Date()
  };
  
  addMessage(userMessage);
  setIsLoading(true);

  try {
    // 🎼 USAR O MAESTRO para orquestrar
    const maestroResponse = await orchestrateSearch(prompt);

    // Adicionar resposta do assistente
    const assistantMessage: MessageType = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: maestroResponse.answer,
      timestamp: new Date(),
      metadata: {
        usedContext: maestroResponse.usedContext,
        madeNewSearch: maestroResponse.madeNewSearch,
        searchQuery: maestroResponse.searchQuery,
        sources: maestroResponse.sources
      }
    };

    addMessage(assistantMessage);

    // Log para debug
    if (maestroResponse.usedContext) {
      console.log('📚 Resposta baseada em contexto anterior');
    }
    if (maestroResponse.madeNewSearch) {
      console.log('🔍 Nova pesquisa:', maestroResponse.searchQuery);
    }

  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: '❌ Desculpe, ocorreu um erro. Por favor, tente novamente.',
      timestamp: new Date()
    });
  } finally {
    setIsLoading(false);
  }
};
```

### PASSO 3: Adicionar Botão para Limpar Contexto (Opcional)

```typescript
// No componente Header ou Sidebar
<button 
  onClick={() => {
    clearContext();
    alert('🧹 Contexto limpo! Próxima mensagem iniciará nova conversa.');
  }}
  className="clear-context-btn"
>
  🧹 Limpar Contexto
</button>
```

---

## 🎨 ADICIONAR INDICADORES VISUAIS

### 1. Badge de Contexto na Mensagem

**Arquivo:** `src/components/Message.tsx`

```typescript
// Adicionar no componente Message
{message.metadata?.usedContext && (
  <div className="context-badge">
    <i className="fa-solid fa-book"></i>
    <span>Resposta baseada em contexto anterior</span>
  </div>
)}

{message.metadata?.madeNewSearch && (
  <div className="search-badge">
    <i className="fa-solid fa-magnifying-glass"></i>
    <span>Nova pesquisa: {message.metadata.searchQuery}</span>
  </div>
)}
```

**CSS:**
```css
.context-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: rgb(59, 130, 246);
  margin-top: 0.5rem;
}

.search-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: rgb(16, 185, 129);
  margin-top: 0.5rem;
}
```

### 2. Painel de Histórico de Pesquisas

**Arquivo:** `src/components/SearchHistoryPanel.tsx`

```typescript
import React from 'react';
import contextManager from '../services/conversationContextService';

export const SearchHistoryPanel: React.FC = () => {
  const searchHistory = contextManager.getSearchHistory();

  if (searchHistory.length === 0) {
    return null;
  }

  return (
    <div className="search-history-panel">
      <h3>📚 Histórico de Pesquisas</h3>
      <div className="search-list">
        {searchHistory.map((search, i) => (
          <div key={i} className="search-item">
            <div className="search-query">
              <i className="fa-solid fa-magnifying-glass"></i>
              <span>{search.query}</span>
            </div>
            <div className="search-sources">
              {search.sources.map((source, j) => (
                <span key={j} className="source-tag">{source}</span>
              ))}
            </div>
            <div className="search-time">
              {new Date(search.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Indicador de Contexto Ativo

**No Header:**
```typescript
import { getContextStats } from '../services/searchMaestroService';

const ContextIndicator: React.FC = () => {
  const stats = getContextStats();

  if (!stats.hasContext) {
    return null;
  }

  return (
    <div className="context-indicator">
      <i className="fa-solid fa-brain"></i>
      <span>Contexto ativo: {stats.lastSearch}</span>
      <button onClick={() => clearContext()}>
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};
```

---

## 🧪 TESTAR A INTEGRAÇÃO

### Teste 1: Follow-up Básico
```
1. Digite: "O que aconteceu no Rio de Janeiro?"
   Resultado: Nova pesquisa, badge verde "Nova pesquisa"

2. Digite: "Quantos mortos?"
   Resultado: Usa contexto, badge azul "Baseado em contexto"
```

### Teste 2: Mudança de Tópico
```
1. Digite: "Python programming"
   Resultado: Nova pesquisa

2. Digite: "JavaScript frameworks"
   Resultado: Nova pesquisa (novo tópico)
```

### Teste 3: Múltiplos Follow-ups
```
1. Digite: "Notícias sobre tecnologia"
2. Digite: "Qual a mais importante?"
3. Digite: "Me dê mais detalhes"
4. Digite: "Quais as fontes?"

Todos os follow-ups devem usar contexto (badge azul)
```

---

## 📊 MONITORAMENTO

### Ver Estatísticas no Console
```typescript
// Adicionar no useEffect ou em um botão
const stats = getContextStats();
console.log('📊 Estatísticas do Contexto:', stats);
// {
//   searchHistory: 3,
//   conversationHistory: 6,
//   lastSearch: "Rio de Janeiro",
//   hasContext: true
// }
```

### Logs Automáticos
O Maestro já loga automaticamente:
```
🎼 ========== MAESTRO INICIADO ==========
📝 Mensagem: "Quantos mortos?"
🎼 Maestro analisando intenção do usuário...
🎯 Decisão: É follow-up da pesquisa anterior
📚 Respondendo com base no contexto...
✅ Maestro concluído
```

---

## 🎯 EXEMPLO COMPLETO DE INTEGRAÇÃO

```typescript
// App.tsx - Exemplo completo

import React, { useState } from 'react';
import { 
  orchestrateSearch, 
  clearContext, 
  getContextStats 
} from './services/searchMaestroService';

function App() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (prompt: string) => {
    if (!prompt.trim()) return;

    // Adicionar mensagem do usuário
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 🎼 MAESTRO orquestra tudo
      const maestroResponse = await orchestrateSearch(prompt);

      // Adicionar resposta
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: maestroResponse.answer,
        timestamp: new Date(),
        metadata: {
          usedContext: maestroResponse.usedContext,
          madeNewSearch: maestroResponse.madeNewSearch,
          searchQuery: maestroResponse.searchQuery,
          sources: maestroResponse.sources
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Logs
      console.log('📊 Stats:', getContextStats());
      
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearContext = () => {
    clearContext();
    alert('🧹 Contexto limpo!');
  };

  return (
    <div className="app">
      <Header onClearContext={handleClearContext} />
      <ChatView 
        messages={messages}
        onSend={handleSend}
        isLoading={isLoading}
      />
    </div>
  );
}
```

---

## ✅ CHECKLIST DE INTEGRAÇÃO

- [ ] Importar `orchestrateSearch` no App.tsx
- [ ] Modificar função `handleSend`
- [ ] Adicionar metadata nas mensagens
- [ ] Adicionar badge de contexto na UI
- [ ] Adicionar badge de nova pesquisa na UI
- [ ] Adicionar botão "Limpar Contexto"
- [ ] Testar follow-up básico
- [ ] Testar mudança de tópico
- [ ] Testar múltiplos follow-ups
- [ ] Verificar logs no console

---

## 🐛 PROBLEMAS COMUNS

### Problema: "Cannot find module 'searchMaestroService'"
**Solução:** Verifique se os arquivos foram criados:
- `src/services/conversationContextService.ts`
- `src/services/searchMaestroService.ts`

### Problema: Badges não aparecem
**Solução:** Verifique se `message.metadata` está sendo passado corretamente

### Problema: Contexto não funciona
**Solução:** Verifique se `orchestrateSearch` está sendo chamado (não `generateIntelligentResponse`)

---

## 🎉 RESULTADO ESPERADO

Após a integração, você deve ter:

1. **Follow-up Funcionando**
   - ✅ Perguntas sobre pesquisas anteriores são respondidas
   - ✅ Badge azul indica uso de contexto

2. **Nova Pesquisa Automática**
   - ✅ Novos tópicos disparam pesquisa automática
   - ✅ Badge verde indica nova pesquisa

3. **Indicadores Visuais**
   - ✅ Badges coloridos nas mensagens
   - ✅ Histórico de pesquisas visível
   - ✅ Botão para limpar contexto

4. **Logs Claros**
   - ✅ Logs do Maestro no console
   - ✅ Estatísticas disponíveis
   - ✅ Debug facilitado

---

**🎊 Integração Completa!**

Agora seu sistema tem contexto conversacional inteligente! 🚀
