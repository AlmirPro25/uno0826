# 🎼 TOOL ORCHESTRA - Sistema de Orquestração Inteligente

> "3 CHAMADAS → 3 ESPECIALISTAS → 1 OBRA-PRIMA"

## 📋 Visão Geral

O **Tool Orchestra** é um sistema de orquestração que divide a criação de projetos completos em **3 fases especializadas**, cada uma com sua própria **persona** e **responsabilidades**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PEDIDO DO USUÁRIO                                                         │
│         ↓                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ FASE 1: ARQUITETO BACKEND                                           │   │
│  │ • Persona: Engenheiro Senior + Arquiteto de Sistemas                │   │
│  │ • Output: Backend completo + MEMORANDO para Fase 2                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ↓ (passa o bastão + memorando)                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ FASE 2: DESIGNER FRONTEND                                           │   │
│  │ • Persona: Designer Figma + Engenheiro React + Motion Specialist    │   │
│  │ • Input: Backend + Memorando da Fase 1                              │   │
│  │ • Output: Frontend completo + MEMORANDO para Fase 3                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ↓ (passa o bastão + memorando)                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ FASE 3: DOCUMENTADOR + QA                                           │   │
│  │ • Persona: Tech Writer + QA Automation Engineer                     │   │
│  │ • Input: Backend + Frontend + Memorandos                            │   │
│  │ • Output: Docs + Testes + Docker + CI/CD                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ↓                                                                   │
│  PRODUTO COMPLETO FUNCIONAL                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Por Que 3 Fases?

### O Problema
- Uma única chamada tentando fazer tudo perde **foco**
- O modelo tenta pensar em backend, frontend e docs ao mesmo tempo
- Resultado: código genérico, incompleto ou com alucinações

### A Solução
- Cada fase tem uma **persona especializada**
- Cada fase recebe **contexto completo** das anteriores
- Cada fase gera um **memorando** com instruções para a próxima
- Resultado: código focado, completo e profissional

## 📦 Estrutura do Sistema

```
services/
├── ToolOrchestra.ts              # Motor principal de orquestração
├── PipelineEvents.ts             # Sistema de eventos para UI
└── manifestos/
    └── TOOL_ORCHESTRA_CONFIG.ts  # Configuração JSON do pipeline

tests/
└── test-tool-orchestra.ts        # Testes do sistema
```

## 🚀 Como Usar

### Uso Básico

```typescript
import { executeOrchestra } from './services/ToolOrchestra';

const result = await executeOrchestra(
  'Crie um sistema de e-commerce com carrinho de compras'
);

console.log(`Arquivos gerados: ${result.totalFiles}`);
console.log(`Tempo: ${result.executionTime}ms`);
```

### Uso Avançado com Callbacks

```typescript
import { ToolOrchestra } from './services/ToolOrchestra';

const orchestra = new ToolOrchestra();

const result = await orchestra.orchestrate({
  userPrompt: 'Crie uma fintech com dashboard de investimentos',
  projectType: 'fintech',
  complexity: 'enterprise',
  
  onPhaseStart: (phase) => {
    console.log(`🎬 Iniciando Fase ${phase.phase}: ${phase.name}`);
    console.log(`   Persona: ${phase.persona}`);
  },
  
  onPhaseComplete: (phase) => {
    console.log(`✅ Fase ${phase.phase} completa`);
    console.log(`   Arquivos: ${phase.output?.files.length}`);
    console.log(`   Memorando: ${phase.output?.memo.substring(0, 100)}...`);
  }
});
```

### Detecção Automática

```typescript
import { shouldUseOrchestra } from './services/ToolOrchestra';

const prompt = 'Crie um sistema completo de gestão';

if (shouldUseOrchestra(prompt)) {
  // Usar pipeline de 3 fases
  const result = await executeOrchestra(prompt);
} else {
  // Usar chamada única
  const result = await geminiService.generate(prompt);
}
```

## 🎭 As 3 Personas

### Fase 1: Arquiteto Backend 🏗️

**Identidade:** Engenheiro Senior com 15+ anos de experiência

**Especialidades:**
- Arquitetura de sistemas distribuídos
- Design de APIs RESTful e GraphQL
- Banco de dados (PostgreSQL, MongoDB, Redis)
- Autenticação e segurança (JWT, OAuth, bcrypt)
- Go, Node.js, Python

**Responsabilidades:**
1. Arquitetura do sistema
2. Servidor principal
3. Rotas/Controllers
4. Services (lógica de negócio)
5. Repositories (acesso a dados)
6. Middleware (auth, logging, rate-limit)
7. Schema de banco de dados
8. Validação de entrada
9. Tratamento de erros tipados
10. Testes unitários

**Regras Invioláveis:**
- NUNCA confie no frontend - valide TUDO no backend
- SEMPRE use transações atômicas para operações críticas
- SEMPRE implemente rate limiting
- SEMPRE use prepared statements
- SEMPRE hasheie senhas com bcrypt (cost >= 12)

### Fase 2: Designer Frontend 🎨

**Identidade:** Designer Senior + Engenheiro UI/UX

**Especialidades:**
- Design Systems (Tailwind, Shadcn/UI)
- React/Next.js 15 com TypeScript
- Animações (Framer Motion)
- Acessibilidade (WCAG AA)
- Responsividade (Mobile-first)

**Responsabilidades:**
1. Estrutura do projeto
2. Design System (Tailwind + Shadcn)
3. Componentes UI/UX profissionais
4. Todas as páginas necessárias
5. Integração com o backend
6. Autenticação (login, registro, logout)
7. Estado global (Zustand ou Context)
8. Animações (Framer Motion)
9. Responsividade (mobile-first)
10. Acessibilidade (WCAG AA)

**Regras Invioláveis:**
- SEMPRE use TypeScript
- SEMPRE implemente responsividade mobile-first
- SEMPRE adicione acessibilidade
- SEMPRE use os endpoints do backend da Fase 1
- SEMPRE adicione estados de loading/error

### Fase 3: Documentador + QA 📚

**Identidade:** Tech Writer Senior + QA Automation Engineer

**Especialidades:**
- Documentação técnica profissional
- README.md que impressiona
- Testes E2E (Playwright, Cypress)
- Docker e Docker Compose
- CI/CD (GitHub Actions)

**Responsabilidades:**
1. README.md profissional
2. Documentação da API (OpenAPI/Swagger)
3. ARCHITECTURE.md com diagramas Mermaid
4. Testes E2E (Playwright)
5. Testes de integração
6. Dockerfile (backend e frontend)
7. docker-compose.yml
8. .github/workflows/ci.yml
9. .env.example
10. DEPLOYMENT.md e CONTRIBUTING.md

## 📋 O Sistema de Memorandos

O **memorando** é a chave da passagem de bastão. Cada fase gera um memorando estruturado para a próxima.

### Memorando Fase 1 → Fase 2

```markdown
═══════════════════════════════════════════════════════════════════════════════
📋 MEMORANDO: FASE 1 → FASE 2
═══════════════════════════════════════════════════════════════════════════════

## 🎯 RESUMO DO BACKEND
[O que foi criado: servidor, rotas, autenticação, etc.]

## 📡 ENDPOINTS DISPONÍVEIS
| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | /api/auth/register | Registro de usuário | Não |
| POST | /api/auth/login | Login | Não |
| GET | /api/users/me | Dados do usuário | Sim |

## 📊 MODELOS DE DADOS
[Interfaces TypeScript dos modelos]

## 🎨 INSTRUÇÕES PARA O FRONTEND
[Como integrar, onde armazenar tokens, etc.]

## 🎯 COMPONENTES NECESSÁRIOS
[Lista de componentes que o frontend deve criar]

## 🎨 DESIGN SYSTEM SUGERIDO
[Cores, tipografia, componentes base]
```

### Memorando Fase 2 → Fase 3

```markdown
═══════════════════════════════════════════════════════════════════════════════
📋 MEMORANDO: FASE 2 → FASE 3
═══════════════════════════════════════════════════════════════════════════════

## 🎯 RESUMO DO FRONTEND
[O que foi criado: páginas, componentes, fluxos]

## 📁 ESTRUTURA DE COMPONENTES
[Árvore de diretórios]

## 🔄 FLUXOS DE USUÁRIO
[Jornadas do usuário no sistema]

## 📚 O QUE DOCUMENTAR
[Lista do que precisa de documentação]

## 🧪 TESTES NECESSÁRIOS
[Fluxos críticos para testar]

## 🐳 DOCKER
[Portas, serviços, configurações]
```

## 🔍 Quando o Orchestra é Ativado

O sistema detecta automaticamente quando usar o pipeline de 3 fases:

### Keywords que Ativam

```typescript
const fullProjectKeywords = [
  'sistema completo', 'full system', 'fullstack',
  'aplicativo completo', 'complete app',
  'projeto completo', 'complete project',
  'backend e frontend', 'e-commerce',
  'fintech', 'banco digital', 'saas',
  'plataforma', 'dashboard completo',
  'crud completo', 'com autenticação'
];
```

### Regras de Detecção

1. Se contém keyword de projeto completo → **usar Orchestra**
2. Se menciona backend E frontend → **usar Orchestra**
3. Se é apenas backend OU apenas frontend → **chamada única**

## 📊 Resultado Final

```typescript
interface OrchestraResult {
  success: boolean;
  phases: OrchestraPhase[];
  totalFiles: number;
  executionTime: number;
  finalProduct: {
    backend: GeneratedFile[];   // Arquivos do backend
    frontend: GeneratedFile[];  // Arquivos do frontend
    docs: GeneratedFile[];      // Documentação
    config: GeneratedFile[];    // Configurações
    tests: GeneratedFile[];     // Testes
  };
}
```

## 🧪 Testando

```bash
# Testes básicos (sem API key)
npx tsx tests/test-tool-orchestra.ts

# Teste completo (requer API key)
npx tsx tests/test-tool-orchestra.ts --full
```

## 🎯 Benefícios

| Antes (1 chamada) | Depois (3 fases) |
|-------------------|------------------|
| Código genérico | Código especializado |
| Falta de foco | Foco total em cada área |
| Integração fraca | Integração via memorandos |
| Docs incompletos | Docs profissionais |
| Sem testes | Testes E2E inclusos |

## 🔥 Filosofia

> "Deus mora no detalhe que salva. O diabo mora no detalhe que você ignorou."

O Tool Orchestra garante que cada detalhe receba a atenção que merece, com especialistas focados em cada área do projeto.

---

*Desenvolvido para o Sistema de Manifestos Integrado*
