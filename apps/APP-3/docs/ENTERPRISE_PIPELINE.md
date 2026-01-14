# 🏢 Enterprise Pipeline - Sistema de Múltiplas Chamadas (INTEGRADO)

> "3-5 CHAMADAS ESPECIALIZADAS → MÁXIMO OUTPUT → EMPRESA COMPLETA"

## ✅ STATUS: INTEGRADO COM O SISTEMA PRINCIPAL

O Enterprise Pipeline agora está **totalmente integrado** com o GeminiService e a UI existente:

- ✅ **Detecção automática** de complexidade do projeto
- ✅ **Streaming em tempo real** para o Monaco editor (igual ao sistema atual)
- ✅ **MiniPipelineIndicator** expandido para 5 fases (na barra do preview)
- ✅ **Checkpoint/Resume** para pausar e continuar
- ✅ **Relay Race Pattern** - cada fase passa contexto para a próxima

## 📋 O Problema Resolvido

**Antes (1 chamada com 70+ manifestos):**
- Contexto de entrada: ~150KB
- Output: ~3.000 linhas (modelo "gasta" tokens processando instruções)

**Agora (3-5 chamadas com manifesto FOCADO):**
- Contexto de entrada: ~10KB por fase
- Output: ~8.000 linhas POR FASE
- Total: ~40.000 linhas de código!

## 🎯 Como Funciona

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RELAY RACE PATTERN - Cada corredor passa o bastão (contexto)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🧠 FASE 1: ARQUITETO                                                     │
│   └── Output: Blueprint, OpenAPI, Schema, Estrutura                        │
│                    ↓ passa contexto                                         │
│   ⚙️ FASE 2: BACKEND                                                       │
│   └── Output: APIs, Services, Auth, Testes                                 │
│                    ↓ passa contexto                                         │
│   🎨 FASE 3: FRONTEND                                                      │
│   └── Output: Pages, Components, Hooks, Styles                             │
│                    ↓ passa contexto                                         │
│   🔗 FASE 4: INTEGRAÇÃO                                                    │
│   └── Output: API clients, hooks, WebSocket, estado                        │
│                    ↓ passa contexto                                         │
│   📚 FASE 5: DEVOPS                                                        │
│   └── Output: Docker, CI/CD, Docs, Testes E2E                              │
│                                                                             │
│   ═══════════════════════════════════════════════════════════════════════  │
│   TOTAL: ~40.000 linhas de código pronto para produção!                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Uso Automático

O sistema **detecta automaticamente** quando usar multi-chamadas baseado no prompt:

```typescript
// Exemplo de prompts que ativam o modo enterprise:

// Score 70+ → 5 chamadas
"Crie uma fintech completa com PIX, transferências e empréstimos"

// Score 50-69 → 4 chamadas
"Crie um SaaS de gestão de projetos com dashboard e assinaturas"

// Score 30-49 → 3 chamadas
"Crie um e-commerce com carrinho e checkout"

// Score < 30 → 1 chamada (modo normal)
"Crie uma landing page simples"
```

## 📊 Palavras-Chave de Detecção

| Categoria | Palavras-Chave | Peso |
|-----------|----------------|------|
| **Fintech** | fintech, banco, pix, pagamento, transferência | +20 |
| **Enterprise** | empresa, completo, fullstack, produção, deploy | +15 |
| **SaaS** | saas, multi-tenant, assinatura, dashboard | +15 |
| **E-commerce** | loja, carrinho, checkout, produto, estoque | +15 |
| **Social** | rede social, feed, followers, posts | +12 |
| **Backend** | api, rest, graphql, auth, jwt, database | +8 |
| **Frontend** | react, next.js, componentes, responsivo | +5 |
| **Simples** | simples, básico, landing page, formulário | -20 |

## 🔢 Modos de Execução

### Modo 3 (Compacto)
- **Fase 1:** 🧠 Arquiteto
- **Fase 2:** ⚙️ Fullstack (Backend + Frontend)
- **Fase 5:** 📚 DevOps

### Modo 4 (Balanceado)
- **Fase 1:** 🧠 Arquiteto
- **Fase 2:** ⚙️ Backend
- **Fase 3:** 🎨 Frontend
- **Fase 5:** 📚 DevOps

### Modo 5 (Completo)
- **Fase 1:** 🧠 Arquiteto
- **Fase 2:** ⚙️ Backend
- **Fase 3:** 🎨 Frontend
- **Fase 4:** 🔗 Integração
- **Fase 5:** 📚 DevOps

## 🎨 Integração com UI

### MiniPipelineIndicator (na barra do preview)

O indicador mostra o progresso em tempo real:

```
┌─────────────────────────────────────────┐
│  🧠 ● ● ○ ○ ○  2/5                     │
│     ↑ ↑ ↑ ↑ ↑                          │
│     │ │ │ │ └── DevOps (waiting)       │
│     │ │ │ └──── Integração (waiting)   │
│     │ │ └────── Frontend (running)     │
│     │ └──────── Backend (completed)    │
│     └────────── Arquiteto (completed)  │
└─────────────────────────────────────────┘
```

### Cores dos Status

- 🟢 **Verde** - Fase completa
- 🟣 **Roxo pulsante** - Fase em execução
- 🟡 **Amarelo** - Fase pausada
- 🔴 **Vermelho** - Erro na fase
- ⚫ **Cinza** - Aguardando

## 💾 Checkpoint/Resume

O sistema salva automaticamente o progresso:

```typescript
// Pausar execução
pipelineEvents.pause();

// Verificar se há checkpoint pendente
if (hasPendingCheckpoint()) {
  const checkpoint = loadCheckpoint();
  console.log(`Checkpoint: Fase ${checkpoint.currentPhase}/${checkpoint.mode}`);
}

// Continuar de onde parou
await executor.resumeFromCheckpoint(config);

// Limpar checkpoint
clearCheckpoint();
```

## 📁 Arquivos do Sistema

```
services/
├── PipelineEvents.ts              # Sistema de eventos (3-5 fases)
├── EnterprisePipelineIntegration.ts  # Detecção de complexidade
├── EnterprisePipelineExecutor.ts     # Executor com streaming
└── EnterprisePipeline.ts          # Lógica original (backup)

components/
├── MiniPipelineIndicator.tsx      # Indicador visual (5 fases)
└── ResponsivePreview.tsx          # Integração com preview

docs/
└── ENTERPRISE_PIPELINE.md         # Esta documentação
```

## 🧪 Testando

```typescript
import { analyzeComplexity } from './services/EnterprisePipelineIntegration';
import { getEnterprisePipelineExecutor } from './services/EnterprisePipelineExecutor';

// Testar detecção de complexidade
const analysis = analyzeComplexity("Crie uma fintech com PIX");
console.log(analysis);
// { score: 75, mode: 5, reason: "Projeto enterprise complexo..." }

// Executar pipeline
const executor = getEnterprisePipelineExecutor();
const result = await executor.execute({
  userPrompt: "Crie uma fintech com PIX",
  mode: 'auto',
  onStreamChunk: (chunk, phase, accumulated) => {
    // Código aparece em tempo real no Monaco
    console.log(chunk);
  }
});
```

## 📊 Comparativo

| Aspecto | 1 Chamada | 5 Chamadas Enterprise |
|---------|-----------|----------------------|
| Contexto entrada | ~150KB | ~10KB/fase |
| Output/chamada | ~3.000 linhas | ~8.000 linhas |
| Output total | ~3.000 linhas | ~40.000 linhas |
| Especialização | Genérica | Focada por fase |
| Qualidade | Superficial | Profunda |
| Tempo | ~30s | ~2-3min |

## ⚠️ Mitigações de Risco Implementadas

### 1. "Amnésia" entre Fases
**Problema:** O Backend pode esquecer detalhes que o Arquiteto definiu.

**Solução:** Schema e OpenAPI são SEMPRE reinjetados no topo do prompt como "Verdade Absoluta":
```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️ VERDADE ABSOLUTA - SIGA EXATAMENTE ESTAS DEFINIÇÕES ⚠️                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 🗄️ SCHEMA DO BANCO DE DADOS (IMUTÁVEL)
[schema.prisma completo]

### 📋 CONTRATOS DE API (IMUTÁVEIS)
[openapi.yaml completo]
```

### 2. Custo e Tempo
**Problema:** 5 chamadas custam 5x mais e demoram 5x mais.

**Solução:** Sistema de modos automáticos:
- **Modo 1:** Projetos simples (landing pages, formulários)
- **Modo 3:** MVPs rápidos (e-commerce básico)
- **Modo 4:** Projetos médios (SaaS)
- **Modo 5:** Enterprise Grade (fintechs, bancos)

### 3. Conflito de Arquivos
**Problema:** Fase 2 gera `user.ts` e Fase 3 gera outro `user.ts` diferente.

**Solução:** Namespaces claros e obrigatórios por fase:
```
FASE 2 (Backend):  backend/src/models/user.ts
FASE 3 (Frontend): frontend/src/types/user.ts
FASE 4 (Integração): shared/types/user.ts
```

Cada fase recebe instruções explícitas de onde colocar seus arquivos.

## 🔮 Próximos Passos

- [ ] Integrar com CommandBar (botão de modo enterprise)
- [ ] Adicionar modal de seleção manual de modo
- [ ] Paralelização de fases independentes
- [ ] Cache de contexto entre execuções

---

**Sistema Alexandria - Enterprise Pipeline**

*"Não economize chamadas. Economize tempo do desenvolvedor."*
