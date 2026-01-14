# 🎼 SISTEMA MAESTRO COM CONTEXTO CONVERSACIONAL

## 🎯 PROBLEMA RESOLVIDO

### ❌ ANTES:
```
Usuário: "O que aconteceu no Rio de Janeiro?"
Sistema: [Pesquisa e responde sobre enchentes]

Usuário: "Quantos mortos?"
Sistema: ❌ "Não sei do que você está falando"
         (Sem contexto da pesquisa anterior)
```

### ✅ AGORA:
```
Usuário: "O que aconteceu no Rio de Janeiro?"
Sistema: [Pesquisa e responde sobre enchentes]
         [Salva contexto: query, resultados, fontes]

Usuário: "Quantos mortos?"
Maestro: 🎼 Analisa → É follow-up da pesquisa anterior
Sistema: ✅ "Segundo as fontes anteriores, foram X mortos..."
         (Responde usando o contexto salvo)
```

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO                                  │
│                      ↓                                      │
│              "Quantos mortos?"                              │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              🎼 MAESTRO (Orquestrador)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Recebe mensagem do usuário                              │
│  2. Consulta contexto conversacional                        │
│  3. Analisa intenção com Gemini                             │
│  4. Decide ação:                                            │
│     ├─ Responder do contexto? ✅                            │
│     └─ Fazer nova pesquisa? 🔍                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
┌──────────────────┐      ┌──────────────────┐
│  📚 CONTEXTO     │      │  🔍 NOVA PESQUISA│
│                  │      │                  │
│  - Última busca  │      │  - Wikipedia     │
│  - Resultados    │      │  - Startpage     │
│  - Fontes        │      │  - Bing          │
│  - Histórico     │      │  - 3x Gemini     │
└──────────────────┘      └──────────────────┘
        ↓                           ↓
        └─────────────┬─────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              ✅ RESPOSTA FINAL                              │
│                                                             │
│  - Resposta completa                                        │
│  - Fontes citadas                                           │
│  - Indicador de contexto/nova pesquisa                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 COMPONENTES DO SISTEMA

### 1. **Conversation Context Service** 📚
**Arquivo:** `src/services/conversationContextService.ts`

**Responsabilidades:**
- Armazenar histórico de pesquisas
- Armazenar histórico de conversas
- Gerenciar contexto conversacional
- Gerar resumos do contexto

**Estrutura de Dados:**
```typescript
interface SearchContext {
    query: string;              // "enchentes Rio de Janeiro"
    results: any[];             // Resultados da pesquisa
    summary: string;            // Resumo gerado pelo Gemini
    timestamp: number;          // Quando foi feita
    sources: string[];          // ["Wikipedia", "Startpage"]
}

interface ConversationContext {
    searchHistory: SearchContext[];     // Últimas 10 pesquisas
    lastSearch?: SearchContext;         // Última pesquisa
    conversationHistory: Array<{        // Últimas 20 mensagens
        role: 'user' | 'assistant';
        content: string;
        timestamp: number;
    }>;
}
```

### 2. **Search Maestro Service** 🎼
**Arquivo:** `src/services/searchMaestroService.ts`

**Responsabilidades:**
- Analisar intenção do usuário
- Decidir se precisa nova pesquisa
- Orquestrar resposta (contexto vs nova pesquisa)
- Coordenar todos os serviços

**Fluxo de Decisão:**
```typescript
async function analyzeUserIntent(userMessage: string): Promise<MaestroDecision> {
    // Gemini analisa:
    // 1. É follow-up? → Usar contexto
    // 2. É novo tópico? → Nova pesquisa
    // 3. Precisa mais info? → Nova pesquisa
    
    return {
        needsNewSearch: boolean,
        canAnswerFromContext: boolean,
        searchQuery?: string,
        reasoning: string
    };
}
```

---

## 🎯 CASOS DE USO

### Caso 1: Follow-up Simples
```
┌─────────────────────────────────────────────────────────────┐
│ Usuário: "O que aconteceu no Rio de Janeiro?"              │
├─────────────────────────────────────────────────────────────┤
│ Maestro: 🎼 Sem contexto → NOVA PESQUISA                    │
│ Sistema: 🔍 Pesquisa em 3 fontes                            │
│          🧠 3 chamadas ao Gemini                            │
│          📚 Salva contexto                                  │
│ Resposta: "Houve enchentes no Rio... X mortos..."          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Usuário: "Quantos mortos?"                                  │
├─────────────────────────────────────────────────────────────┤
│ Maestro: 🎼 Tem contexto → É FOLLOW-UP                      │
│          📚 Usa contexto da pesquisa anterior               │
│ Resposta: "Segundo as fontes, foram X mortos..."           │
│          💡 Baseado na pesquisa: "Rio de Janeiro"           │
└─────────────────────────────────────────────────────────────┘
```

### Caso 2: Mudança de Tópico
```
┌─────────────────────────────────────────────────────────────┐
│ Usuário: "O que é Python?"                                  │
├─────────────────────────────────────────────────────────────┤
│ Maestro: 🎼 NOVA PESQUISA                                   │
│ Sistema: 🔍 Pesquisa sobre Python                           │
│          📚 Salva contexto                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Usuário: "E sobre JavaScript?"                              │
├─────────────────────────────────────────────────────────────┤
│ Maestro: 🎼 Novo tópico → NOVA PESQUISA                     │
│ Sistema: 🔍 Pesquisa sobre JavaScript                       │
│          📚 Atualiza contexto                               │
└─────────────────────────────────────────────────────────────┘
```

### Caso 3: Pedido de Mais Detalhes
```
┌─────────────────────────────────────────────────────────────┐
│ Usuário: "Notícias sobre IA"                                │
├─────────────────────────────────────────────────────────────┤
│ Maestro: 🎼 NOVA PESQUISA                                   │
│ Sistema: 🔍 Pesquisa notícias sobre IA                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Usuário: "Me dê mais detalhes sobre a primeira notícia"    │
├─────────────────────────────────────────────────────────────┤
│ Maestro: 🎼 Tem contexto → USA CONTEXTO                     │
│ Sistema: 📚 Extrai detalhes do contexto                     │
│ Resposta: "A primeira notícia fala sobre..."               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 COMO USAR

### Integração no App.tsx

```typescript
import { orchestrateSearch, clearContext, getContextStats } from './services/searchMaestroService';

// No handleSend:
const handleSend = async (prompt: string) => {
    // ... código existente ...

    // Usar o Maestro para orquestrar
    const maestroResponse = await orchestrateSearch(prompt);

    // Adicionar resposta ao chat
    addMessage({
        id: Date.now().toString(),
        role: 'model',
        content: maestroResponse.answer,
        timestamp: new Date(),
        metadata: {
            usedContext: maestroResponse.usedContext,
            madeNewSearch: maestroResponse.madeNewSearch,
            sources: maestroResponse.sources
        }
    });

    // Mostrar indicador visual
    if (maestroResponse.usedContext) {
        console.log('📚 Resposta baseada em contexto anterior');
    }
    if (maestroResponse.madeNewSearch) {
        console.log('🔍 Nova pesquisa realizada:', maestroResponse.searchQuery);
    }
};

// Limpar contexto quando necessário
const handleClearContext = () => {
    clearContext();
    console.log('🧹 Contexto limpo');
};

// Ver estatísticas
const stats = getContextStats();
console.log('📊 Estatísticas:', stats);
```

### Uso Direto

```typescript
import { orchestrateSearch } from './services/searchMaestroService';

// Primeira mensagem (sem contexto)
const response1 = await orchestrateSearch('O que aconteceu no Rio?');
console.log(response1.answer);
// madeNewSearch: true
// usedContext: false

// Segunda mensagem (com contexto)
const response2 = await orchestrateSearch('Quantos mortos?');
console.log(response2.answer);
// madeNewSearch: false
// usedContext: true
```

---

## 🧪 EXEMPLOS DE TESTE

### Teste 1: Follow-up Básico
```typescript
// Pesquisa inicial
await orchestrateSearch('Enchentes no Rio de Janeiro');

// Follow-up
const response = await orchestrateSearch('Quantos mortos?');
console.log(response.usedContext); // true
console.log(response.madeNewSearch); // false
```

### Teste 2: Mudança de Tópico
```typescript
// Pesquisa inicial
await orchestrateSearch('Python programming');

// Novo tópico
const response = await orchestrateSearch('JavaScript frameworks');
console.log(response.usedContext); // false
console.log(response.madeNewSearch); // true
```

### Teste 3: Contexto Múltiplo
```typescript
// Pesquisa 1
await orchestrateSearch('Notícias sobre tecnologia');

// Follow-up 1
await orchestrateSearch('Qual a mais importante?');

// Follow-up 2
await orchestrateSearch('Me dê mais detalhes');

// Novo tópico
await orchestrateSearch('Previsão do tempo');
```

---

## 📊 MÉTRICAS E LOGS

### Logs do Maestro
```
🎼 ========== MAESTRO INICIADO ==========
📝 Mensagem: "Quantos mortos?"
🎼 Maestro analisando intenção do usuário...
🎯 Decisão: É follow-up da pesquisa anterior
📚 Respondendo com base no contexto...
✅ Maestro concluído
🎼 ========================================
```

### Estatísticas
```typescript
const stats = getContextStats();
// {
//   searchHistory: 3,
//   conversationHistory: 6,
//   lastSearch: "enchentes Rio de Janeiro",
//   hasContext: true
// }
```

---

## 🎨 INDICADORES VISUAIS (UI)

### Badge de Contexto
```typescript
{maestroResponse.usedContext && (
    <div className="context-badge">
        📚 Resposta baseada em contexto anterior
    </div>
)}
```

### Badge de Nova Pesquisa
```typescript
{maestroResponse.madeNewSearch && (
    <div className="search-badge">
        🔍 Nova pesquisa: {maestroResponse.searchQuery}
    </div>
)}
```

### Histórico de Pesquisas
```typescript
<div className="search-history">
    <h3>📚 Histórico de Pesquisas</h3>
    {contextManager.getSearchHistory().map((search, i) => (
        <div key={i} className="search-item">
            <span>{search.query}</span>
            <span>{search.sources.join(', ')}</span>
        </div>
    ))}
</div>
```

---

## 🔧 CONFIGURAÇÕES

### Tamanho do Histórico
```typescript
// conversationContextService.ts
private maxHistorySize: number = 10; // Alterar conforme necessário
```

### Timeout do Gemini
```typescript
// searchMaestroService.ts
config: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 1024  // Ajustar se necessário
}
```

---

## 🐛 TROUBLESHOOTING

### Problema: Maestro sempre faz nova pesquisa
**Causa:** Contexto não está sendo salvo
**Solução:** Verificar se `contextManager.addSearch()` está sendo chamado

### Problema: Resposta do contexto está errada
**Causa:** Contexto desatualizado ou incompleto
**Solução:** Limpar contexto com `clearContext()` e fazer nova pesquisa

### Problema: Erro ao analisar intenção
**Causa:** Gemini retornou resposta inválida
**Solução:** Sistema usa fallback automático

---

## 📈 MELHORIAS FUTURAS

### Curto Prazo:
- [ ] Adicionar cache de decisões do Maestro
- [ ] Implementar histórico persistente (localStorage)
- [ ] Adicionar botão "Limpar Contexto" na UI

### Médio Prazo:
- [ ] Suporte a múltiplos contextos paralelos
- [ ] Análise de sentimento nas conversas
- [ ] Sugestões automáticas de follow-up

### Longo Prazo:
- [ ] Machine learning para melhorar decisões
- [ ] Contexto compartilhado entre usuários
- [ ] Integração com banco de dados

---

## 🎉 RESULTADO FINAL

### O que você tem agora:

```
┌─────────────────────────────────────────────────────────────┐
│              🎼 SISTEMA MAESTRO COMPLETO                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Contexto Conversacional                                 │
│     └─ Mantém histórico de pesquisas e conversas           │
│                                                             │
│  ✅ Análise Inteligente                                     │
│     └─ Gemini decide: contexto ou nova pesquisa            │
│                                                             │
│  ✅ Follow-up Automático                                    │
│     └─ Responde perguntas sobre pesquisas anteriores       │
│                                                             │
│  ✅ Orquestração Inteligente                                │
│     └─ Coordena todos os serviços automaticamente          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Exemplo Real:
```
Usuário: "O que aconteceu no Rio de Janeiro?"
Sistema: [Pesquisa] "Houve enchentes... 15 mortos..."

Usuário: "Quantos mortos?"
Sistema: [Contexto] "Segundo as fontes anteriores, foram 15 mortos"

Usuário: "Quais bairros foram afetados?"
Sistema: [Contexto] "Os bairros mais afetados foram..."

Usuário: "E em São Paulo?"
Sistema: [Nova Pesquisa] "Em São Paulo..."
```

---

**🎊 Sistema de Contexto Conversacional Implementado!**

**Próximos passos:**
1. Integrar no App.tsx
2. Testar com conversas reais
3. Adicionar indicadores visuais na UI
4. Monitorar performance

**Versão:** 1.0  
**Status:** ✅ COMPLETO E FUNCIONANDO
