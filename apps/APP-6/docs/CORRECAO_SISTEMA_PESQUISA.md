# 🔧 CORREÇÃO: Sistema de Pesquisa

**Problema identificado:** Sistema de pesquisa piorou e não está retornando bons resultados

---

## 🔍 DIAGNÓSTICO

### O que está acontecendo:

1. **Detecção de busca muito simples** - Só detecta palavras-chave básicas
2. **Gera apenas LINKS** - Não busca de verdade, só mostra links para clicar
3. **Não usa busca massiva** - O sistema de busca paralela não está sendo chamado
4. **Fallback fraco** - Quando falha, só mostra Wikipedia

### Código problemático (App.tsx linha 350-400):

```typescript
// ❌ PROBLEMA: Só gera links, não busca de verdade
const executeMultiSearch = async (query: string) => {
  // Gera links para o usuário clicar
  const searchLinks = generateSearchLinks(query);
  
  // Mostra os links
  response += `🔗 [Buscar no ${link.source}](${link.url})\n`;
  
  // ❌ NÃO BUSCA! Só mostra links!
}
```

### O que deveria fazer:

```typescript
// ✅ CORRETO: Buscar de verdade usando busca massiva
const executeMultiSearch = async (query: string) => {
  // Chamar busca massiva do backend
  const result = await fetch('http://localhost:3002/api/search/massive', {
    method: 'POST',
    body: JSON.stringify({ query, maxSites: 10 })
  });
  
  // Retornar resultados REAIS
  return result.results; // URLs, títulos, snippets
}
```

---

## 🛠️ SOLUÇÃO

### 1. Corrigir detecção de busca

**Problema:** Detecção muito simples, só pega palavras óbvias

**Solução:** Usar Gemini para detectar intenção de busca

```typescript
async function detectSearchIntent(message: string): Promise<boolean> {
  // Usar Gemini para detectar se é busca
  const prompt = `A mensagem abaixo é uma solicitação de busca/pesquisa na internet?
  
Mensagem: "${message}"

Responda apenas: SIM ou NAO`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt
  });

  return response.text.toUpperCase().includes('SIM');
}
```

### 2. Usar busca massiva REAL

**Problema:** Só gera links, não busca

**Solução:** Chamar API de busca massiva do backend

```typescript
const executeIntelligentSearch = async (query: string) => {
  const userMessage: Message = { 
    id: `user_${Date.now()}`, 
    role: 'user', 
    content: query
  };
  const newHistory = [...messages, userMessage];
  setMessages(newHistory);
  setIsLoading(true);

  const loadingMessageId = `ai_${Date.now()}`;
  
  setMessages([...newHistory, { 
    id: loadingMessageId, 
    role: 'model', 
    content: '🚀 **Buscando em 10 sites simultaneamente...**', 
    isLoading: true 
  }]);

  try {
    // ✅ USAR BUSCA MASSIVA REAL
    const response = await fetch('http://localhost:3002/api/search/massive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query,
        maxSites: 10,
        timeout: 60000
      })
    });

    const data = await response.json();

    if (!data.success || data.totalResults === 0) {
      throw new Error('Nenhum resultado encontrado');
    }

    console.log(`✅ ${data.totalResults} resultados de ${data.successfulSites} sites`);

    // Formatar resposta com resultados REAIS
    let responseText = `✅ **Encontrei ${data.totalResults} resultados para "${query}"**\n\n`;
    responseText += `🔍 Busquei em ${data.successfulSites} sites (${Math.round(data.duration / 1000)}s)\n`;
    responseText += `🌐 Fontes: ${data.sites.join(', ')}\n\n`;
    responseText += `📋 **Principais Resultados:**\n\n`;
    
    // Mostrar top 10 resultados
    data.results.slice(0, 10).forEach((r: any, i: number) => {
      responseText += `**${i + 1}. ${r.title}**\n`;
      responseText += `   🌐 ${r.source}\n`;
      responseText += `   🔗 ${r.url}\n`;
      if (r.snippet) {
        responseText += `   📝 ${r.snippet.substring(0, 150)}...\n`;
      }
      responseText += `\n`;
    });

    const finalMessage: Message = {
      id: loadingMessageId,
      role: 'model',
      content: responseText,
    };

    const finalMessages = [...newHistory, finalMessage];
    setMessages(finalMessages);
    updateChatHistory(finalMessages);
  } catch (error) {
    console.error('❌ Erro na busca:', error);
    
    // Fallback melhorado
    const fallbackMessage: Message = {
      id: loadingMessageId,
      role: 'model',
      content: `❌ **Erro na busca**\n\nNão consegui buscar em múltiplos sites. Tente:\n\n1. Verificar se o backend está rodando\n2. Reformular a pergunta\n3. Tentar novamente em alguns segundos`
    };

    const finalMessages = [...newHistory, fallbackMessage];
    setMessages(finalMessages);
    updateChatHistory(finalMessages);
  }
  
  setIsLoading(false);
};
```

### 3. Melhorar fallback

**Problema:** Fallback só usa Wikipedia

**Solução:** Usar Gemini com contexto quando busca falhar

```typescript
// Fallback inteligente
if (data.totalResults === 0) {
  console.log('⚠️ Sem resultados, usando Gemini com contexto...');
  
  const geminiPrompt = `Responda de forma completa e detalhada sobre: "${query}"
  
INSTRUÇÕES:
- Use seu conhecimento geral
- Seja específico e informativo
- Cite fontes quando possível
- Adicione emojis para visualização
- Organize em seções se necessário

IMPORTANTE: Deixe claro que você não tem acesso a dados em tempo real.`;

  const geminiResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: geminiPrompt
  });

  let responseText = geminiResponse.text;
  responseText += '\n\n---\n';
  responseText += '💡 *Resposta gerada pelo modelo sem busca na internet. Para informações atualizadas, tente novamente ou busque em sites especializados.*';

  return responseText;
}
```

---

## 📝 CÓDIGO COMPLETO CORRIGIDO

Vou criar um novo arquivo com a implementação correta:

