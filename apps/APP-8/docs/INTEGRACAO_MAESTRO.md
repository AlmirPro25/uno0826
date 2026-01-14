# 🎼 Integração Gemini Maestro com Gemini Live

## 🎯 O Que Foi Criado

Um sistema onde o **Gemini Maestro** injeta contexto dinâmico no **System Prompt do Gemini Live** em tempo real, fazendo o modelo se adaptar baseado no histórico, memórias e resumos do banco de dados.

## 🔥 Como Funciona

```
┌─────────────────────────────────────────────────────────┐
│  GEMINI LIVE (Frontend)                                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Usuário conversa normalmente                      │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  useDynamicContext Hook                            │ │
│  │  • Busca System Instruction do backend            │ │
│  │  • Atualiza a cada 1 minuto                       │ │
│  │  • Adiciona contexto de curto prazo               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTP
                          ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (Node.js)                                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │  🎼 GEMINI MAESTRO - Context Builder               │ │
│  │                                                     │ │
│  │  Constrói System Instruction dinâmico:             │ │
│  │  ├─ Perfil do usuário                              │ │
│  │  ├─ Resumo do dia anterior                         │ │
│  │  ├─ Top 5 memórias importantes                     │ │
│  │  ├─ Contexto recente (últimas 5 interações)       │ │
│  │  ├─ Última conversa                                │ │
│  │  └─ Instruções personalizadas                      │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  SQLite3 Database                                  │ │
│  │  • user_profile                                    │ │
│  │  • daily_summaries                                 │ │
│  │  • memories (com embeddings)                       │ │
│  │  • short_term_context                              │ │
│  │  • sessions                                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 📁 Arquivos Criados

### Backend
```
backend/src/services/contextBuilder.ts  # 🎼 Maestro Context Builder
backend/src/routes/context.ts           # API de contexto
```

### Frontend
```
hooks/useDynamicContext.ts              # Hook React para contexto dinâmico
components/UnifiedInterfaceWithMaestro.tsx  # Interface com Maestro
components/DraggablePiP.tsx             # Componente de câmera
```

### Serviços
```
services/backendService.ts              # Atualizado com métodos de contexto
```

## 🚀 Como Usar

### 1. Iniciar Backend

```bash
cd backend
npm run dev
```

### 2. Usar no Frontend

#### Opção A: Substituir UnifiedInterface

Em `App.tsx`:

```typescript
// Antes
import UnifiedInterface from './components/UnifiedInterface';

// Depois
import UnifiedInterface from './components/UnifiedInterfaceWithMaestro';
```

#### Opção B: Usar o Hook Manualmente

```typescript
import { useDynamicContext } from './hooks/useDynamicContext';

function MyComponent() {
  const {
    systemInstruction,    // System Instruction completo
    isLoading,           // Carregando contexto
    error,               // Erro ao carregar
    addToContext,        // Adiciona ao contexto de curto prazo
    updateProfile,       // Atualiza perfil do usuário
    getRelevantContext,  // Busca contexto relevante
    refresh              // Força reload do contexto
  } = useDynamicContext({
    enabled: true,
    refreshInterval: 60000, // Atualiza a cada 1 minuto
    userId: 1
  });

  // Usa systemInstruction no Gemini Live
  const session = await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      systemInstruction: systemInstruction, // 🎼 Contexto dinâmico!
      // ... resto da config
    }
  });
}
```

## 🎯 Exemplo de System Instruction Gerado

```
Você é um assistente de IA avançado que vê a tela do usuário em tempo real.

CAPACIDADES:
- Você vê a tela do usuário continuamente
- Você ouve a voz do usuário
- Você pode analisar código, documentos, imagens
- Você pode ajudar proativamente quando detectar necessidade

COMPORTAMENTO:
- Seja natural e conversacional
- Ajude proativamente quando ver algo relevante
- Seja conciso mas completo
- Use português brasileiro naturalmente

=== PERFIL DO USUÁRIO ===
Nome: João Silva

Preferências:
- linguagem: TypeScript
- framework: React
- estilo_codigo: funcional

Habilidades conhecidas: TypeScript, React, Node.js, Python
Interesses: Backend development, AI, DevOps

=== CONTEXTO DO DIA ANTERIOR ===
Resumo: Usuário trabalhou em desenvolvimento de API REST com Express e TypeScript
Humor: Focado
Produtividade: 8/10
Tópicos trabalhados: backend, api, typescript, express

=== MEMÓRIAS IMPORTANTES ===
- [preference] Usuário prefere usar Docker para deploy
- [skill] Conhece bem PostgreSQL e MongoDB
- [fact] Está aprendendo sobre microserviços
- [preference] Gosta de código limpo e bem documentado
- [context] Trabalha principalmente de manhã

=== CONTEXTO RECENTE ===
- User: Como fazer validação de dados no Express?
- Assistant: Recomendo usar Joi ou Zod para validação...
- User: Vou usar Zod
- Assistant: Ótima escolha! Zod tem excelente integração com TypeScript...
- User: Obrigado!

=== ÚLTIMA CONVERSA ===
Sessão produtiva focada em desenvolvimento de API REST com Express e TypeScript.
Usuário implementou validação de dados e autenticação JWT.

=== INSTRUÇÕES IMPORTANTES ===
- Use TODO esse contexto para personalizar suas respostas
- Lembre-se das preferências e habilidades do usuário
- Seja proativo quando ver algo na tela relacionado ao histórico
- Adapte seu tom baseado no humor detectado
- Continue conversas anteriores naturalmente
- Não mencione explicitamente que você tem acesso a essas informações, apenas use-as naturalmente
```

## 🔄 Fluxo Completo

### 1. Início da Sessão

```typescript
// Frontend carrega contexto
const { systemInstruction } = useDynamicContext({ enabled: true });

// Cria sessão no backend
const sessionId = await backendService.createSession();

// Conecta ao Gemini Live com contexto dinâmico
const session = await ai.live.connect({
  config: {
    systemInstruction: systemInstruction // 🎼 Maestro injeta contexto!
  }
});
```

### 2. Durante a Conversa

```typescript
// Usuário fala
onmessage: async (message) => {
  if (message.serverContent?.turnComplete) {
    const userInput = currentInputTranscriptionRef.current.trim();
    const modelOutput = currentOutputTranscriptionRef.current.trim();
    
    // Salva no backend
    await backendService.addMessage(sessionId, 'user', userInput);
    await backendService.addMessage(sessionId, 'model', modelOutput);
    
    // 🎼 Adiciona ao contexto de curto prazo do Maestro
    await addToContext(`User: ${userInput}`, 1.0);
    await addToContext(`Assistant: ${modelOutput}`, 0.8);
  }
}
```

### 3. Fim da Sessão

```typescript
// Resumir e extrair fatos
await backendService.summarizeSession(sessionId);
await backendService.extractFactsFromConversation(fullTranscript);

// 🎼 Atualiza perfil do usuário
await updateProfile(fullTranscript);

// Próxima sessão terá contexto atualizado!
```

## 🎨 Recursos do Hook

### addToContext
Adiciona informação ao contexto de curto prazo:

```typescript
await addToContext('User está trabalhando em deploy', 1.0);
await addToContext('User mencionou Docker', 0.8);
```

### updateProfile
Atualiza perfil baseado em conversa:

```typescript
const conversation = `
  User: Estou aprendendo Rust
  Assistant: Ótimo! Rust é excelente para...
`;
await updateProfile(conversation);
// Próxima sessão: "Habilidades: TypeScript, React, Rust"
```

### getRelevantContext
Busca contexto relevante para uma query:

```typescript
const context = await getRelevantContext('Como fazer deploy?', 3);
// Retorna: "Usuário prefere Docker, já fez deploy no Heroku, conhece CI/CD"
```

### refresh
Força reload do contexto:

```typescript
await refresh();
// Útil após mudanças importantes no perfil
```

## 🎯 Configuração

### Atualização Automática

```typescript
useDynamicContext({
  enabled: true,
  refreshInterval: 60000, // Atualiza a cada 1 minuto
  userId: 1
});
```

### Sem Atualização Automática

```typescript
useDynamicContext({
  enabled: true,
  // Sem refreshInterval = atualiza apenas no início
  userId: 1
});
```

### Desabilitado (Fallback)

```typescript
useDynamicContext({
  enabled: false // Usa instrução básica
});
```

## 📊 API Endpoints

### GET /api/context/system-instruction
Busca System Instruction completo

```bash
curl "http://localhost:3001/api/context/system-instruction?userId=1"
```

### POST /api/context/short-term
Adiciona ao contexto de curto prazo

```bash
curl -X POST http://localhost:3001/api/context/short-term \
  -H "Content-Type: application/json" \
  -d '{"content":"User está trabalhando em deploy","relevanceScore":1.0}'
```

### POST /api/context/update-profile
Atualiza perfil baseado em conversa

```bash
curl -X POST http://localhost:3001/api/context/update-profile \
  -H "Content-Type: application/json" \
  -d '{"conversation":"User: Estou aprendendo Rust..."}'
```

### POST /api/context/relevant
Busca contexto relevante

```bash
curl -X POST http://localhost:3001/api/context/relevant \
  -H "Content-Type: application/json" \
  -d '{"query":"Como fazer deploy?","limit":3}'
```

## 🔧 Troubleshooting

### Contexto não carrega
```typescript
const { error } = useDynamicContext({ enabled: true });
if (error) {
  console.error('Erro ao carregar contexto:', error);
  // Fallback para instrução básica
}
```

### Backend não responde
```bash
# Verificar se backend está rodando
curl http://localhost:3001/health

# Verificar logs
cd backend
npm run dev
```

### Contexto desatualizado
```typescript
// Força reload
await refresh();
```

## 💡 Dicas

1. **Atualização Periódica**: Use `refreshInterval` para manter contexto atualizado
2. **Relevância**: Use `relevanceScore` para priorizar informações importantes
3. **Perfil**: Atualize o perfil ao final de cada sessão para melhor personalização
4. **Contexto Curto Prazo**: Adicione informações importantes durante a conversa
5. **Fallback**: O sistema funciona mesmo se o backend falhar (usa instrução básica)

## 🎉 Resultado

Agora o Gemini Live:
- ✅ **Lembra** de conversas anteriores
- ✅ **Conhece** suas preferências e habilidades
- ✅ **Adapta** respostas baseado no histórico
- ✅ **Continua** conversas naturalmente
- ✅ **Evolui** com cada interação
- ✅ **Personaliza** baseado no seu perfil

**É como ter um assistente que realmente te conhece! 🤖✨**

---

## 📞 Próximos Passos

1. ✅ Substituir `UnifiedInterface` por `UnifiedInterfaceWithMaestro`
2. ✅ Testar integração
3. ✅ Ajustar `refreshInterval` conforme necessidade
4. ✅ Personalizar instruções no `contextBuilder.ts`
5. ✅ Aproveitar o sistema inteligente!
