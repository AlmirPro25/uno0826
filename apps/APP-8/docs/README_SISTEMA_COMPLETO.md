# 🎼 Sistema Completo: Gemini Live + Maestro + SQLite3

> **O sistema mais avançado de IA conversacional com memória real e contexto dinâmico**

## 🌟 O Que É

Um sistema completo onde:
- **Gemini Live** vê sua tela e ouve sua voz
- **Gemini Maestro** orquestra toda a inteligência
- **SQLite3** armazena tudo sem limites
- **Contexto Dinâmico** é injetado no System Prompt em tempo real

## 🔥 Principais Recursos

### 1. Gemini Live com Contexto Dinâmico 🎼
- System Prompt atualizado automaticamente
- Modelo lembra de TODAS as conversas anteriores
- Personalização baseada no seu perfil
- Continuidade natural entre sessões

### 2. Gemini Maestro (Orquestrador)
- Extrai fatos automaticamente
- Cria resumos inteligentes
- Analisa imagens e screenshots
- Gera embeddings para busca semântica
- Detecta padrões e tendências

### 3. Armazenamento Ilimitado
- SQLite3 nativo (até 281TB)
- Fotos em BLOB
- Embeddings reais
- Resumos diários automáticos

### 4. Inteligência Contextual
- Perfil do usuário
- Memórias de longo prazo
- Contexto de curto prazo
- Resumos diários
- Análise de tendências

## 🚀 Quick Start (5 minutos)

### 1. Backend
```bash
cd backend
npm install
echo "GEMINI_API_KEY=sua_chave" > .env
npm run dev
```

### 2. Frontend
```typescript
// Em App.tsx, substituir:
import UnifiedInterface from './components/UnifiedInterface';
// Por:
import UnifiedInterface from './components/UnifiedInterfaceWithMaestro';
```

### 3. Pronto!
```bash
npm run dev
```

## 📊 Arquitetura

```
VOCÊ (fala + tela + câmera)
        │
        ▼
FRONTEND (React)
  ├─ UnifiedInterfaceWithMaestro
  ├─ useDynamicContext Hook 🎼
  └─ Gemini Live API
        │
        ▼
BACKEND (Node.js)
  ├─ 🎼 Gemini Maestro
  ├─ Context Builder 🆕
  ├─ Session Service
  ├─ Memory Service
  ├─ Capture Service
  └─ Daily Summary Service
        │
        ▼
SQLite3 Database
  ├─ sessions
  ├─ messages
  ├─ memories (com embeddings)
  ├─ captures (fotos em BLOB)
  ├─ daily_summaries
  ├─ user_profile
  └─ short_term_context 🆕
```

## 🎯 Como Funciona

### Início da Sessão
```
1. Frontend busca contexto do Maestro
2. Maestro consulta banco de dados:
   • Perfil do usuário
   • Resumo do dia anterior
   • Top 5 memórias importantes
   • Últimas 5 interações
   • Última conversa
3. Maestro monta System Instruction completo
4. Gemini Live recebe contexto dinâmico
5. Modelo responde conhecendo TODO seu histórico!
```

### Durante a Conversa
```
1. Você fala: "Como fazer deploy?"
2. Gemini responde usando contexto:
   "Baseado no seu histórico com Docker..."
3. Mensagens são salvas no banco
4. Contexto de curto prazo é atualizado
5. Próxima resposta terá esse novo contexto!
```

### Fim da Sessão
```
1. Maestro cria resumo da sessão
2. Extrai fatos importantes
3. Atualiza perfil do usuário
4. Salva tudo no banco
5. Próxima sessão terá TODO esse contexto!
```

## 🎨 Exemplo Real

### Dia 1
```
Você: "Estou aprendendo TypeScript"
Gemini: "Ótimo! TypeScript adiciona tipagem..."

Maestro extrai:
✓ [skill] Aprendendo TypeScript
✓ [interest] Programação
```

### Dia 2
```
System Instruction agora inclui:
"Habilidades: TypeScript (aprendendo)"

Você: "Como fazer uma API?"
Gemini: "Como você está aprendendo TypeScript,
         recomendo Express com TypeScript..."
```

### Dia 3
```
System Instruction agora inclui:
"Habilidades: TypeScript
 Interesses: Backend, APIs
 Resumo ontem: Trabalhou em API com Express"

Você: "Como fazer deploy?"
Gemini: "Para sua API Express com TypeScript,
         recomendo Docker. Quer que eu te ajude?"

✅ Modelo LEMBRA de tudo!
```

## 📁 Estrutura do Projeto

### Backend (Novo)
```
backend/
├── src/
│   ├── database/
│   │   ├── db.ts
│   │   └── schema.ts
│   ├── services/
│   │   ├── geminiMaestro.ts       # Orquestrador
│   │   ├── contextBuilder.ts      # 🆕 Context Builder
│   │   ├── sessionService.ts
│   │   ├── memoryService.ts
│   │   ├── captureService.ts
│   │   └── dailySummaryService.ts
│   ├── routes/
│   │   ├── sessions.ts
│   │   ├── memories.ts
│   │   ├── captures.ts
│   │   ├── summaries.ts
│   │   └── context.ts             # 🆕 API de contexto
│   └── server.ts
└── data/
    └── companion.db               # SQLite3
```

### Frontend (Atualizado)
```
src/
├── components/
│   ├── UnifiedInterfaceWithMaestro.tsx  # 🆕 Com contexto dinâmico
│   ├── DraggablePiP.tsx                 # 🆕 Componente de câmera
│   └── ...
├── hooks/
│   └── useDynamicContext.ts             # 🆕 Hook de contexto
├── services/
│   └── backendService.ts                # Atualizado
└── ...
```

## 🎼 Gemini Maestro

O Maestro orquestra 5 componentes:

1. **🧠 Analista** - Extrai fatos de conversas
2. **📝 Escritor** - Cria resumos inteligentes
3. **👁️ Visionário** - Analisa imagens
4. **🧠 Memorialista** - Gera embeddings e busca semântica
5. **🎯 Context Builder** 🆕 - Monta System Instruction dinâmico

## 📚 Documentação

### Início Rápido
- **[LEIA_ME.md](LEIA_ME.md)** - Resumo em português
- **[QUICK_START_BACKEND.md](QUICK_START_BACKEND.md)** - Início rápido (5 min)
- **[RESUMO_INTEGRACAO.md](RESUMO_INTEGRACAO.md)** - Resumo da integração

### Integração Maestro
- **[INTEGRACAO_MAESTRO.md](INTEGRACAO_MAESTRO.md)** ⭐ - Guia completo
- **[DIAGRAMA_SISTEMA_COMPLETO.md](DIAGRAMA_SISTEMA_COMPLETO.md)** - Diagramas visuais

### Backend
- **[backend/README.md](backend/README.md)** - Documentação do backend
- **[backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)** - Arquitetura
- **[backend/GEMINI_MAESTRO.md](backend/GEMINI_MAESTRO.md)** - Como funciona
- **[backend/COMANDOS_UTEIS.md](backend/COMANDOS_UTEIS.md)** - Comandos úteis

### Migração
- **[MIGRATION_TO_BACKEND.md](MIGRATION_TO_BACKEND.md)** - Guia de migração
- **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** - Checklist

### Índice Completo
- **[INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)** - Índice geral

## 🔧 API Endpoints

### Contexto (Novo) 🎼
```
GET  /api/context/system-instruction  # Busca contexto completo
POST /api/context/short-term          # Adiciona contexto recente
POST /api/context/update-profile      # Atualiza perfil
POST /api/context/relevant            # Busca contexto relevante
```

### Sessões
```
POST   /api/sessions                  # Criar sessão
POST   /api/sessions/:id/messages     # Adicionar mensagem
GET    /api/sessions/:id              # Buscar sessão
POST   /api/sessions/:id/summarize    # Resumir sessão
```

### Memórias
```
POST   /api/memories                  # Adicionar memória
GET    /api/memories/search           # Buscar memórias
POST   /api/memories/extract-facts    # Extrair fatos
```

### Capturas
```
POST   /api/captures                  # Upload de imagem
GET    /api/captures/:id              # Buscar captura
```

### Resumos
```
POST   /api/summaries                 # Criar resumo diário
GET    /api/summaries/:date           # Buscar resumo
GET    /api/summaries/trends/weekly   # Análise semanal
```

## 💡 Recursos do Hook

```typescript
const {
  systemInstruction,    // Contexto completo do Maestro
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
```

## 🎯 Comparação

| Recurso | Antes | Agora |
|---------|-------|-------|
| Armazenamento | 5-10MB | ♾️ Ilimitado |
| Memória | ❌ Nenhuma | ✅ Completa |
| Contexto | ❌ Fixo | ✅ Dinâmico 🎼 |
| Fotos | ❌ | ✅ BLOB |
| Busca | Texto | Semântica |
| Resumos | ❌ | ✅ Automáticos |
| Personalização | ❌ | ✅ Total |

## 🎉 Resultado

Agora você tem:
- ✅ **Armazenamento ilimitado** (SQLite3)
- ✅ **Memória real** (modelo lembra de tudo)
- ✅ **Contexto dinâmico** (System Prompt atualizado)
- ✅ **Busca semântica** (embeddings reais)
- ✅ **Fotos no banco** (BLOB)
- ✅ **Resumos automáticos** (diários)
- ✅ **Personalização total** (perfil do usuário)
- ✅ **Evolução contínua** (fica mais inteligente)

## 🚀 Próximos Passos

1. ✅ Leia [INTEGRACAO_MAESTRO.md](INTEGRACAO_MAESTRO.md)
2. ✅ Instale o backend
3. ✅ Substitua o componente
4. ✅ Teste o sistema
5. ✅ Aproveite a inteligência real!

---

```
╔═══════════════════════════════════════════════════════╗
║  🎼 Gemini Maestro + Live + SQLite3                   ║
║                                                        ║
║  O sistema mais avançado de IA conversacional         ║
║  com memória real e contexto dinâmico                 ║
║                                                        ║
║  🤖 Assistente que realmente te conhece! ✨          ║
╚═══════════════════════════════════════════════════════╝
```

**Pronto para começar? Vamos lá! 🚀🎼**
