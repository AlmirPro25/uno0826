/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🎼 TOOL ORCHESTRA - SISTEMA DE ORQUESTRAÇÃO INTELIGENTE 🎼          ║
 * ║                                                                              ║
 * ║            "3 CHAMADAS → 3 ESPECIALISTAS → 1 OBRA-PRIMA"                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este é o MAESTRO que orquestra as 3 fases do pipeline.
 * Cada fase tem uma PERSONA específica que recebe o bastão da anterior.
 * 
 * FLUXO:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  PEDIDO DO USUÁRIO                                                         │
 * │         ↓                                                                   │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │ FASE 1: ARQUITETO BACKEND                                           │   │
 * │  │ • Persona: Engenheiro Senior + Arquiteto de Sistemas                │   │
 * │  │ • Output: Backend completo + MEMORANDO para Fase 2                  │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │         ↓ (passa o bastão + memorando)                                     │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │ FASE 2: DESIGNER FRONTEND                                           │   │
 * │  │ • Persona: Designer Figma + Engenheiro React + Motion Specialist    │   │
 * │  │ • Input: Backend + Memorando da Fase 1                              │   │
 * │  │ • Output: Frontend completo + MEMORANDO para Fase 3                 │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │         ↓ (passa o bastão + memorando)                                     │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │ FASE 3: DOCUMENTADOR + QA                                           │   │
 * │  │ • Persona: Tech Writer + QA Automation Engineer                     │   │
 * │  │ • Input: Backend + Frontend + Memorandos                            │   │
 * │  │ • Output: Docs + Testes + Docker + CI/CD                            │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │         ↓                                                                   │
 * │  PRODUTO COMPLETO FUNCIONAL                                                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { enrichPromptWithManifests } from './manifestos/ManifestOrchestrator';
import pipelineEvents from './PipelineEvents';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface OrchestraPhase {
  phase: 1 | 2 | 3;
  name: string;
  persona: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  input: OrchestraInput;
  output?: OrchestraOutput;
}

export interface OrchestraInput {
  userPrompt: string;
  previousCode?: string;
  previousMemo?: string;
  context?: Record<string, any>;
}

export interface OrchestraOutput {
  code: string;
  files: GeneratedFile[];
  memo: string;  // MEMORANDO para próxima fase
  summary: string;
  metadata: Record<string, any>;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  category: 'backend' | 'frontend' | 'docs' | 'config' | 'test';
}

export interface OrchestraResult {
  success: boolean;
  phases: OrchestraPhase[];
  totalFiles: number;
  executionTime: number;
  finalProduct: {
    backend: GeneratedFile[];
    frontend: GeneratedFile[];
    docs: GeneratedFile[];
    config: GeneratedFile[];
    tests: GeneratedFile[];
  };
}

export interface OrchestraRequest {
  userPrompt: string;
  projectType?: 'web' | 'mobile' | 'fullstack' | 'api' | 'fintech' | 'auto';
  complexity?: 'simple' | 'medium' | 'complex' | 'enterprise';
  onPhaseStart?: (phase: OrchestraPhase) => void;
  onPhaseComplete?: (phase: OrchestraPhase) => void;
  onProgress?: (message: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONAS - CADA FASE TEM UMA IDENTIDADE ÚNICA
// ═══════════════════════════════════════════════════════════════════════════════

const PERSONAS = {
  BACKEND_ARCHITECT: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🏗️ PERSONA: ARQUITETO BACKEND 🏗️                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um ARQUITETO BACKEND SENIOR com 15+ anos de experiência.

SUAS ESPECIALIDADES:
• Arquitetura de sistemas distribuídos
• Design de APIs RESTful e GraphQL
• Banco de dados (PostgreSQL, MongoDB, Redis)
• Autenticação e segurança (JWT, OAuth, bcrypt)
• Go, Node.js, Python (escolha o melhor para o caso)
• Docker, Kubernetes, CI/CD

SUA PERSONALIDADE:
• Meticuloso com detalhes de segurança
• Obsessivo com performance
• Defensor de código limpo e testável
• Pragmático - escolhe a ferramenta certa para o problema

REGRAS INVIOLÁVEIS:
1. NUNCA confie no frontend - valide TUDO no backend
2. SEMPRE use transações atômicas para operações críticas
3. SEMPRE implemente rate limiting
4. SEMPRE use prepared statements (nunca concatene SQL)
5. SEMPRE hasheie senhas com bcrypt (cost >= 12)
6. SEMPRE gere logs estruturados com contexto
7. SEMPRE crie o MEMORANDO para a próxima fase
`,

  FRONTEND_DESIGNER: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎨 PERSONA: DESIGNER FRONTEND 🎨                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um DESIGNER FRONTEND SENIOR + ENGENHEIRO UI/UX.

SUAS ESPECIALIDADES:
• Design Systems (Tailwind, Shadcn/UI)
• React/Next.js 15 com TypeScript
• Animações (Framer Motion)
• Acessibilidade (WCAG AA)
• Responsividade (Mobile-first)
• Performance (Lazy loading, Code splitting)

SUA PERSONALIDADE:
• Obsessivo com detalhes visuais
• Defensor da experiência do usuário
• Perfeccionista com animações
• Focado em acessibilidade

REGRAS INVIOLÁVEIS:
1. SEMPRE use TypeScript
2. SEMPRE implemente responsividade mobile-first
3. SEMPRE adicione acessibilidade (ARIA, contraste, keyboard nav)
4. SEMPRE use os endpoints do backend da Fase 1
5. SEMPRE adicione estados de loading/error
6. SEMPRE crie animações suaves com Framer Motion
7. SEMPRE crie o MEMORANDO para a próxima fase
`,

  DOCS_QA_ENGINEER: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    📚 PERSONA: DOCUMENTADOR + QA 📚                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um TECH WRITER SENIOR + QA AUTOMATION ENGINEER.

SUAS ESPECIALIDADES:
• Documentação técnica profissional
• README.md que impressiona
• Testes E2E (Playwright, Cypress)
• Testes de integração
• Docker e Docker Compose
• CI/CD (GitHub Actions)
• Diagramas de arquitetura (Mermaid)

SUA PERSONALIDADE:
• Meticuloso com clareza
• Obsessivo com completude
• Defensor de documentação viva
• Focado em reprodutibilidade

REGRAS INVIOLÁVEIS:
1. SEMPRE crie README.md completo e profissional
2. SEMPRE documente TODOS os endpoints
3. SEMPRE configure Docker Compose funcional
4. SEMPRE crie CI/CD com lint, test, build
5. SEMPRE inclua .env.example com todas as variáveis
6. SEMPRE crie testes E2E para fluxos críticos
7. SEMPRE inclua guia de deploy
`
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES DE MEMORANDO
// ═══════════════════════════════════════════════════════════════════════════════

const MEMO_TEMPLATES = {
  PHASE_1_TO_2: `
═══════════════════════════════════════════════════════════════════════════════
📋 MEMORANDO: FASE 1 → FASE 2
═══════════════════════════════════════════════════════════════════════════════

## 🎯 RESUMO DO BACKEND

[Descreva o que foi criado: servidor, rotas, autenticação, etc.]

## 📡 ENDPOINTS DISPONÍVEIS

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | /api/auth/register | Registro de usuário | Não |
| POST | /api/auth/login | Login | Não |
| GET | /api/users/me | Dados do usuário | Sim |
[... liste todos os endpoints ...]

## 📊 MODELOS DE DADOS

\`\`\`typescript
interface User {
  id: string;
  email: string;
  name: string;
  // ...
}
\`\`\`
[... liste todos os modelos ...]

## 🎨 INSTRUÇÕES PARA O FRONTEND

1. Use os endpoints acima para integração
2. Implemente autenticação com JWT (access + refresh token)
3. Armazene tokens no localStorage ou httpOnly cookies
4. Adicione interceptor para refresh automático

## 🎯 COMPONENTES NECESSÁRIOS

- [ ] LoginForm
- [ ] RegisterForm
- [ ] Dashboard
- [ ] Navbar com estado de auth
[... liste componentes específicos do projeto ...]

## 🎨 DESIGN SYSTEM SUGERIDO

- Cores: [sugestão de paleta]
- Tipografia: Inter ou Geist
- Componentes: Shadcn/UI
- Animações: Framer Motion

═══════════════════════════════════════════════════════════════════════════════
`,

  PHASE_2_TO_3: `
═══════════════════════════════════════════════════════════════════════════════
📋 MEMORANDO: FASE 2 → FASE 3
═══════════════════════════════════════════════════════════════════════════════

## 🎯 RESUMO DO FRONTEND

[Descreva o que foi criado: páginas, componentes, fluxos]

## 📁 ESTRUTURA DE COMPONENTES

\`\`\`
src/
├── components/
│   ├── ui/           # Componentes base (Button, Input, etc.)
│   ├── forms/        # Formulários
│   └── layout/       # Layout (Navbar, Footer, etc.)
├── pages/            # Páginas
├── hooks/            # Hooks customizados
├── services/         # API clients
└── store/            # Estado global
\`\`\`

## 🔄 FLUXOS DE USUÁRIO

1. **Registro**: Landing → Register → Dashboard
2. **Login**: Landing → Login → Dashboard
3. **[Fluxo específico]**: ...

## 📚 O QUE DOCUMENTAR

- [ ] Instalação e setup
- [ ] Variáveis de ambiente
- [ ] Como rodar em dev
- [ ] Como fazer build
- [ ] Como fazer deploy
- [ ] Endpoints da API
- [ ] Arquitetura do sistema

## 🧪 TESTES NECESSÁRIOS

- [ ] E2E: Fluxo de registro
- [ ] E2E: Fluxo de login
- [ ] E2E: [Fluxos específicos]
- [ ] Integração: API calls
- [ ] Unit: Funções utilitárias

## 🐳 DOCKER

- Backend: porta 8080
- Frontend: porta 3000
- Database: porta 5432

═══════════════════════════════════════════════════════════════════════════════
`
};


// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS DE CADA FASE
// ═══════════════════════════════════════════════════════════════════════════════

const PHASE_PROMPTS = {
  PHASE_1: (userPrompt: string, enrichedPrompt: string) => `
${PERSONAS.BACKEND_ARCHITECT}

═══════════════════════════════════════════════════════════════════════════════
🎯 PEDIDO DO USUÁRIO
═══════════════════════════════════════════════════════════════════════════════

${enrichedPrompt}

═══════════════════════════════════════════════════════════════════════════════
📋 SUA MISSÃO (FASE 1 - BACKEND)
═══════════════════════════════════════════════════════════════════════════════

Crie o BACKEND COMPLETO para este projeto:

1. ✅ Arquitetura do sistema
2. ✅ Servidor principal (Go ou Node.js)
3. ✅ Rotas/Controllers
4. ✅ Services (lógica de negócio)
5. ✅ Repositories (acesso a dados)
6. ✅ Middleware (auth, logging, rate-limit)
7. ✅ Schema de banco de dados
8. ✅ Validação de entrada
9. ✅ Tratamento de erros tipados
10. ✅ Testes unitários

═══════════════════════════════════════════════════════════════════════════════
📤 FORMATO DE SAÍDA
═══════════════════════════════════════════════════════════════════════════════

Retorne os arquivos neste formato EXATO:

===FILE: caminho/do/arquivo.ext===
LANGUAGE: linguagem
CATEGORY: backend
---
conteúdo do arquivo aqui
---

===FILE: outro/arquivo.ext===
LANGUAGE: linguagem
CATEGORY: backend
---
conteúdo aqui
---

═══════════════════════════════════════════════════════════════════════════════
📋 MEMORANDO OBRIGATÓRIO (NO FINAL)
═══════════════════════════════════════════════════════════════════════════════

No FINAL da sua resposta, inclua o MEMORANDO para a Fase 2:

===MEMO_PHASE_2===
${MEMO_TEMPLATES.PHASE_1_TO_2}
---

⚠️ IMPORTANTE: O memorando deve ser ESPECÍFICO para este projeto!
Liste os endpoints REAIS que você criou, os modelos REAIS, etc.

═══════════════════════════════════════════════════════════════════════════════
🚀 COMECE AGORA! CRIE O BACKEND COMPLETO!
═══════════════════════════════════════════════════════════════════════════════
`,

  PHASE_2: (userPrompt: string, backendCode: string, memo: string) => `
${PERSONAS.FRONTEND_DESIGNER}

═══════════════════════════════════════════════════════════════════════════════
📋 CONTEXTO: BACKEND JÁ CRIADO (FASE 1)
═══════════════════════════════════════════════════════════════════════════════

${backendCode.length > 15000 ? backendCode.substring(0, 15000) + '\n\n[... código truncado para contexto ...]' : backendCode}

═══════════════════════════════════════════════════════════════════════════════
📋 MEMORANDO DA FASE 1 (INSTRUÇÕES PARA VOCÊ)
═══════════════════════════════════════════════════════════════════════════════

${memo}

═══════════════════════════════════════════════════════════════════════════════
🎯 PEDIDO ORIGINAL DO USUÁRIO
═══════════════════════════════════════════════════════════════════════════════

${userPrompt}

═══════════════════════════════════════════════════════════════════════════════
📋 SUA MISSÃO (FASE 2 - FRONTEND)
═══════════════════════════════════════════════════════════════════════════════

Crie o FRONTEND COMPLETO para este projeto:

1. ✅ Estrutura do projeto (package.json, tsconfig, vite.config)
2. ✅ Design System (Tailwind + Shadcn)
3. ✅ Componentes UI/UX profissionais
4. ✅ Todas as páginas necessárias
5. ✅ Integração com o backend (use os endpoints do memorando!)
6. ✅ Autenticação (login, registro, logout)
7. ✅ Estado global (Zustand ou Context)
8. ✅ Animações (Framer Motion)
9. ✅ Responsividade (mobile-first)
10. ✅ Acessibilidade (WCAG AA)

═══════════════════════════════════════════════════════════════════════════════
📤 FORMATO DE SAÍDA
═══════════════════════════════════════════════════════════════════════════════

Retorne os arquivos neste formato EXATO:

===FILE: caminho/do/arquivo.ext===
LANGUAGE: linguagem
CATEGORY: frontend
---
conteúdo do arquivo aqui
---

═══════════════════════════════════════════════════════════════════════════════
📋 MEMORANDO OBRIGATÓRIO (NO FINAL)
═══════════════════════════════════════════════════════════════════════════════

No FINAL da sua resposta, inclua o MEMORANDO para a Fase 3:

===MEMO_PHASE_3===
${MEMO_TEMPLATES.PHASE_2_TO_3}
---

⚠️ IMPORTANTE: O memorando deve ser ESPECÍFICO para este projeto!

═══════════════════════════════════════════════════════════════════════════════
🚀 COMECE AGORA! CRIE O FRONTEND COMPLETO!
═══════════════════════════════════════════════════════════════════════════════
`,

  PHASE_3: (userPrompt: string, backendCode: string, frontendCode: string, memo1: string, memo2: string) => `
${PERSONAS.DOCS_QA_ENGINEER}

═══════════════════════════════════════════════════════════════════════════════
📋 CONTEXTO: BACKEND (FASE 1)
═══════════════════════════════════════════════════════════════════════════════

${backendCode.length > 10000 ? backendCode.substring(0, 10000) + '\n\n[... código truncado ...]' : backendCode}

═══════════════════════════════════════════════════════════════════════════════
📋 CONTEXTO: FRONTEND (FASE 2)
═══════════════════════════════════════════════════════════════════════════════

${frontendCode.length > 10000 ? frontendCode.substring(0, 10000) + '\n\n[... código truncado ...]' : frontendCode}

═══════════════════════════════════════════════════════════════════════════════
📋 MEMORANDOS DAS FASES ANTERIORES
═══════════════════════════════════════════════════════════════════════════════

### Memorando Fase 1 (Backend):
${memo1}

### Memorando Fase 2 (Frontend):
${memo2}

═══════════════════════════════════════════════════════════════════════════════
🎯 PEDIDO ORIGINAL DO USUÁRIO
═══════════════════════════════════════════════════════════════════════════════

${userPrompt}

═══════════════════════════════════════════════════════════════════════════════
📋 SUA MISSÃO (FASE 3 - DOCUMENTAÇÃO + QA)
═══════════════════════════════════════════════════════════════════════════════

Finalize o projeto com:

1. ✅ README.md PROFISSIONAL (completo, com badges, screenshots placeholder)
2. ✅ Documentação da API (OpenAPI/Swagger)
3. ✅ ARCHITECTURE.md com diagramas Mermaid
4. ✅ Testes E2E (Playwright)
5. ✅ Testes de integração
6. ✅ Dockerfile (backend)
7. ✅ Dockerfile (frontend)
8. ✅ docker-compose.yml
9. ✅ .github/workflows/ci.yml
10. ✅ .env.example
11. ✅ DEPLOYMENT.md
12. ✅ CONTRIBUTING.md

═══════════════════════════════════════════════════════════════════════════════
📤 FORMATO DE SAÍDA
═══════════════════════════════════════════════════════════════════════════════

Retorne os arquivos neste formato EXATO:

===FILE: caminho/do/arquivo.ext===
LANGUAGE: linguagem
CATEGORY: docs|config|test
---
conteúdo do arquivo aqui
---

═══════════════════════════════════════════════════════════════════════════════
🚀 FINALIZE O PROJETO AGORA!
═══════════════════════════════════════════════════════════════════════════════
`
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: TOOL ORCHESTRA
// ═══════════════════════════════════════════════════════════════════════════════

export class ToolOrchestra {
  private genAI: GoogleGenAI | null = null;
  private logs: string[] = [];
  private model = 'gemini-2.0-flash-exp';
  
  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }
  
  /**
   * 🎼 EXECUTA A ORQUESTRAÇÃO COMPLETA DE 3 FASES
   */
  async orchestrate(request: OrchestraRequest): Promise<OrchestraResult> {
    const startTime = Date.now();
    const phases: OrchestraPhase[] = [];
    
    this.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    this.log('║              🎼 TOOL ORCHESTRA INICIADA 🎼                                   ║');
    this.log('║              "3 CHAMADAS → 3 ESPECIALISTAS → 1 OBRA-PRIMA"                  ║');
    this.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    this.log(`📝 Prompt: ${request.userPrompt.substring(0, 100)}...`);
    
    // Emitir evento de início
    pipelineEvents.start();
    
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 1: ARQUITETO BACKEND
      // ═══════════════════════════════════════════════════════════════════════
      const phase1: OrchestraPhase = {
        phase: 1,
        name: 'Arquiteto Backend',
        persona: 'Engenheiro Senior + Arquiteto de Sistemas',
        status: 'running',
        input: { userPrompt: request.userPrompt }
      };
      
      phases.push(phase1);
      request.onPhaseStart?.(phase1);
      
      this.log('\n🏗️ ═══════════════════════════════════════════════════════════════════════');
      this.log('🏗️ FASE 1: ARQUITETO BACKEND');
      this.log('🏗️ Persona: ' + phase1.persona);
      this.log('🏗️ ═══════════════════════════════════════════════════════════════════════\n');
      
      const phase1Output = await this.executePhase1(request);
      phase1.output = phase1Output;
      phase1.status = 'completed';
      
      pipelineEvents.completePhase(1, phase1Output.files.map(f => f.path), phase1Output.memo);
      request.onPhaseComplete?.(phase1);
      
      this.log(`✅ Fase 1 completa: ${phase1Output.files.length} arquivos gerados`);
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 2: DESIGNER FRONTEND
      // ═══════════════════════════════════════════════════════════════════════
      const phase2: OrchestraPhase = {
        phase: 2,
        name: 'Designer Frontend',
        persona: 'Designer Figma + Engenheiro React + Motion Specialist',
        status: 'running',
        input: {
          userPrompt: request.userPrompt,
          previousCode: phase1Output.code,
          previousMemo: phase1Output.memo
        }
      };
      
      phases.push(phase2);
      request.onPhaseStart?.(phase2);
      
      this.log('\n🎨 ═══════════════════════════════════════════════════════════════════════');
      this.log('🎨 FASE 2: DESIGNER FRONTEND');
      this.log('🎨 Persona: ' + phase2.persona);
      this.log('🎨 ═══════════════════════════════════════════════════════════════════════\n');
      
      const phase2Output = await this.executePhase2(request, phase1Output);
      phase2.output = phase2Output;
      phase2.status = 'completed';
      
      pipelineEvents.completePhase(2, phase2Output.files.map(f => f.path), phase2Output.memo);
      request.onPhaseComplete?.(phase2);
      
      this.log(`✅ Fase 2 completa: ${phase2Output.files.length} arquivos gerados`);
      
      // ═══════════════════════════════════════════════════════════════════════
      // FASE 3: DOCUMENTADOR + QA
      // ═══════════════════════════════════════════════════════════════════════
      const phase3: OrchestraPhase = {
        phase: 3,
        name: 'Documentador + QA',
        persona: 'Tech Writer + QA Automation Engineer',
        status: 'running',
        input: {
          userPrompt: request.userPrompt,
          previousCode: phase1Output.code + '\n\n' + phase2Output.code,
          previousMemo: phase1Output.memo + '\n\n' + phase2Output.memo
        }
      };
      
      phases.push(phase3);
      request.onPhaseStart?.(phase3);
      
      this.log('\n📚 ═══════════════════════════════════════════════════════════════════════');
      this.log('📚 FASE 3: DOCUMENTADOR + QA');
      this.log('📚 Persona: ' + phase3.persona);
      this.log('📚 ═══════════════════════════════════════════════════════════════════════\n');
      
      const phase3Output = await this.executePhase3(request, phase1Output, phase2Output);
      phase3.output = phase3Output;
      phase3.status = 'completed';
      
      pipelineEvents.completePhase(3, phase3Output.files.map(f => f.path), '');
      request.onPhaseComplete?.(phase3);
      
      this.log(`✅ Fase 3 completa: ${phase3Output.files.length} arquivos gerados`);
      
      // ═══════════════════════════════════════════════════════════════════════
      // RESULTADO FINAL
      // ═══════════════════════════════════════════════════════════════════════
      const allFiles = [
        ...phase1Output.files,
        ...phase2Output.files,
        ...phase3Output.files
      ];
      
      const executionTime = Date.now() - startTime;
      
      this.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
      this.log('║              🎉 ORQUESTRAÇÃO COMPLETA COM SUCESSO! 🎉                        ║');
      this.log('╚══════════════════════════════════════════════════════════════════════════════╝');
      this.log(`📊 Total de arquivos: ${allFiles.length}`);
      this.log(`⏱️ Tempo total: ${(executionTime / 1000).toFixed(2)}s`);
      
      return {
        success: true,
        phases,
        totalFiles: allFiles.length,
        executionTime,
        finalProduct: {
          backend: allFiles.filter(f => f.category === 'backend'),
          frontend: allFiles.filter(f => f.category === 'frontend'),
          docs: allFiles.filter(f => f.category === 'docs'),
          config: allFiles.filter(f => f.category === 'config'),
          tests: allFiles.filter(f => f.category === 'test')
        }
      };
      
    } catch (error) {
      this.log(`❌ ERRO NA ORQUESTRAÇÃO: ${error}`);
      
      // Marcar fase atual como erro
      const currentPhase = phases[phases.length - 1];
      if (currentPhase) {
        currentPhase.status = 'error';
        pipelineEvents.errorPhase(currentPhase.phase, String(error));
      }
      
      return {
        success: false,
        phases,
        totalFiles: phases.reduce((sum, p) => sum + (p.output?.files.length || 0), 0),
        executionTime: Date.now() - startTime,
        finalProduct: {
          backend: [],
          frontend: [],
          docs: [],
          config: [],
          tests: []
        }
      };
    }
  }
  
  /**
   * 🏗️ FASE 1: ARQUITETO BACKEND
   */
  private async executePhase1(request: OrchestraRequest): Promise<OrchestraOutput> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    // Enriquecer prompt com manifestos detectados
    const enrichedPrompt = enrichPromptWithManifests(request.userPrompt);
    
    const prompt = PHASE_PROMPTS.PHASE_1(request.userPrompt, enrichedPrompt);
    
    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: [{ text: prompt }]
    });
    
    const response = result.text || '';
    const files = this.parseFiles(response, 'backend');
    const memo = this.extractMemo(response, 'MEMO_PHASE_2');
    
    return {
      code: response,
      files,
      memo,
      summary: `Backend completo com ${files.length} arquivos`,
      metadata: {
        projectType: request.projectType,
        complexity: request.complexity
      }
    };
  }
  
  /**
   * 🎨 FASE 2: DESIGNER FRONTEND
   */
  private async executePhase2(
    request: OrchestraRequest,
    phase1Output: OrchestraOutput
  ): Promise<OrchestraOutput> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    const prompt = PHASE_PROMPTS.PHASE_2(
      request.userPrompt,
      phase1Output.code,
      phase1Output.memo
    );
    
    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: [{ text: prompt }]
    });
    
    const response = result.text || '';
    const files = this.parseFiles(response, 'frontend');
    const memo = this.extractMemo(response, 'MEMO_PHASE_3');
    
    return {
      code: response,
      files,
      memo,
      summary: `Frontend completo com ${files.length} arquivos`,
      metadata: {
        componentsCount: files.filter(f => f.path.includes('component')).length
      }
    };
  }
  
  /**
   * 📚 FASE 3: DOCUMENTADOR + QA
   */
  private async executePhase3(
    request: OrchestraRequest,
    phase1Output: OrchestraOutput,
    phase2Output: OrchestraOutput
  ): Promise<OrchestraOutput> {
    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }
    
    const prompt = PHASE_PROMPTS.PHASE_3(
      request.userPrompt,
      phase1Output.code,
      phase2Output.code,
      phase1Output.memo,
      phase2Output.memo
    );
    
    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: [{ text: prompt }]
    });
    
    const response = result.text || '';
    const files = this.parseFiles(response, 'docs');
    
    return {
      code: response,
      files,
      memo: '', // Última fase não precisa de memo
      summary: `Documentação e testes com ${files.length} arquivos`,
      metadata: {
        hasReadme: files.some(f => f.path.toLowerCase().includes('readme')),
        hasDocker: files.some(f => f.path.toLowerCase().includes('docker')),
        hasCICD: files.some(f => f.path.includes('.github'))
      }
    };
  }
  
  /**
   * 📦 Parseia arquivos da resposta
   */
  private parseFiles(response: string, defaultCategory: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // Formato: ===FILE: path=== LANGUAGE: lang CATEGORY: cat --- content ---
    const fileRegex = /===FILE:\s*(.+?)===\s*\nLANGUAGE:\s*(.+?)\s*\n(?:CATEGORY:\s*(.+?)\s*\n)?---\n([\s\S]*?)---/g;
    let match;
    
    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        language: match[2].trim(),
        category: (match[3]?.trim() || defaultCategory) as GeneratedFile['category'],
        content: match[4].trim()
      });
    }
    
    // Fallback: extrair blocos de código markdown
    if (files.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let blockMatch;
      let fileIndex = 0;
      
      while ((blockMatch = codeBlockRegex.exec(response)) !== null) {
        const language = blockMatch[1] || 'text';
        const content = blockMatch[2].trim();
        
        // Detectar tipo de arquivo pelo conteúdo
        let path = `file${fileIndex}.${this.getExtension(language)}`;
        if (content.includes('package main')) path = 'main.go';
        else if (content.includes('<!DOCTYPE html>')) path = 'index.html';
        else if (content.includes('import React')) path = `Component${fileIndex}.tsx`;
        else if (content.includes('FROM ')) path = 'Dockerfile';
        else if (content.includes('version:') && content.includes('services:')) path = 'docker-compose.yml';
        else if (content.includes('# ')) path = 'README.md';
        
        files.push({
          path,
          content,
          language,
          category: defaultCategory as GeneratedFile['category']
        });
        fileIndex++;
      }
    }
    
    return files;
  }
  
  /**
   * 📋 Extrai memorando da resposta
   */
  private extractMemo(response: string, memoKey: string): string {
    const memoRegex = new RegExp(`===${memoKey}===\\s*\\n([\\s\\S]*?)(?:---|$)`);
    const match = response.match(memoRegex);
    
    if (match) {
      return match[1].trim();
    }
    
    // Fallback: procurar por "# Memorando" ou "## MEMORANDO"
    const fallbackRegex = /#{1,2}\s*(?:MEMORANDO|Memorando|MEMO)[\s\S]*?(?=\n===|$)/i;
    const fallbackMatch = response.match(fallbackRegex);
    
    return fallbackMatch ? fallbackMatch[0].trim() : '';
  }
  
  /**
   * 📁 Retorna extensão baseada na linguagem
   */
  private getExtension(language: string): string {
    const extensions: Record<string, string> = {
      'typescript': 'ts',
      'javascript': 'js',
      'tsx': 'tsx',
      'jsx': 'jsx',
      'go': 'go',
      'python': 'py',
      'sql': 'sql',
      'yaml': 'yml',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'markdown': 'md',
      'dockerfile': 'Dockerfile'
    };
    return extensions[language.toLowerCase()] || 'txt';
  }
  
  /**
   * 📝 Log interno
   */
  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
  }
  
  /**
   * 📊 Retorna todos os logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTOR: QUANDO USAR O PIPELINE DE 3 FASES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detecta se o prompt deve usar o pipeline de 3 fases
 */
export function shouldUseOrchestra(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  // Keywords que indicam projeto completo
  const fullProjectKeywords = [
    'sistema completo', 'full system', 'fullstack', 'full-stack',
    'aplicativo completo', 'complete app', 'complete application',
    'projeto completo', 'complete project',
    'backend e frontend', 'backend and frontend',
    'front e back', 'front and back',
    'criar um sistema', 'create a system',
    'desenvolver um sistema', 'develop a system',
    'construir um sistema', 'build a system',
    'e-commerce', 'ecommerce', 'loja virtual',
    'fintech', 'banco digital', 'digital bank',
    'saas', 'plataforma', 'platform',
    'dashboard completo', 'complete dashboard',
    'crud completo', 'complete crud',
    'com autenticação', 'with authentication',
    'com login', 'with login'
  ];
  
  // Verificar se contém keywords de projeto completo
  const hasFullProjectKeyword = fullProjectKeywords.some(kw => promptLower.includes(kw));
  
  // Verificar se menciona múltiplas camadas
  const mentionsBackend = /backend|servidor|server|api|banco de dados|database/i.test(prompt);
  const mentionsFrontend = /frontend|interface|ui|ux|tela|screen|página|page|react|vue|next/i.test(prompt);
  
  return hasFullProjectKeyword || (mentionsBackend && mentionsFrontend);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO HELPER PARA USO DIRETO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Executa a orquestração de forma simplificada
 */
export async function executeOrchestra(
  userPrompt: string,
  options?: Partial<OrchestraRequest>
): Promise<OrchestraResult> {
  const orchestra = new ToolOrchestra();
  return orchestra.orchestrate({
    userPrompt,
    ...options
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default ToolOrchestra;
