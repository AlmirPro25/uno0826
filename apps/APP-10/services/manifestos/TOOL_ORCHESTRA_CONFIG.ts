/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🎼 TOOL ORCHESTRA CONFIG - CONFIGURAÇÃO DO PIPELINE 🎼              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este arquivo contém a configuração JSON do Tool Orchestra.
 * Pode ser usado para customizar o comportamento do pipeline.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO JSON DO PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

export const TOOL_ORCHESTRA_CONFIG = {
  name: "Tool Orchestra",
  version: "1.0.0",
  description: "Sistema de orquestração de 3 fases para criação de projetos completos",
  
  phases: [
    {
      phase: 1,
      name: "BACKEND",
      persona: "Arquiteto + Engenheiro Backend Senior",
      description: "Cria todo o backend: API, banco de dados, autenticação, validação",
      input: {
        required: ["userPrompt"],
        optional: ["projectType", "complexity"]
      },
      output: {
        code: "Backend completo",
        memo: "Memorando para Fase 2 com endpoints, modelos, instruções"
      },
      responsibilities: [
        "Arquitetura do sistema",
        "Servidor principal (Go/Node.js)",
        "Rotas/Controllers",
        "Services (lógica de negócio)",
        "Repositories (acesso a dados)",
        "Middleware (auth, logging, rate-limit)",
        "Schema de banco de dados",
        "Validação de entrada",
        "Tratamento de erros tipados",
        "Testes unitários"
      ],
      rules: [
        "NUNCA confie no frontend - valide TUDO no backend",
        "SEMPRE use transações atômicas para operações críticas",
        "SEMPRE implemente rate limiting",
        "SEMPRE use prepared statements",
        "SEMPRE hasheie senhas com bcrypt (cost >= 12)",
        "SEMPRE gere logs estruturados"
      ]
    },
    {
      phase: 2,
      name: "FRONTEND",
      persona: "Designer Figma + Engenheiro React + Motion Designer",
      description: "Cria todo o frontend: UI/UX, componentes, integração com backend",
      input: {
        required: ["userPrompt", "backendCode", "memoPhase1"],
        optional: []
      },
      output: {
        code: "Frontend completo",
        memo: "Memorando para Fase 3 com estrutura, fluxos, o que documentar"
      },
      responsibilities: [
        "Estrutura do projeto (package.json, tsconfig, vite.config)",
        "Design System (Tailwind + Shadcn)",
        "Componentes UI/UX profissionais",
        "Todas as páginas necessárias",
        "Integração com o backend",
        "Autenticação (login, registro, logout)",
        "Estado global (Zustand ou Context)",
        "Animações (Framer Motion)",
        "Responsividade (mobile-first)",
        "Acessibilidade (WCAG AA)"
      ],
      rules: [
        "SEMPRE use TypeScript",
        "SEMPRE implemente responsividade mobile-first",
        "SEMPRE adicione acessibilidade",
        "SEMPRE use os endpoints do backend da Fase 1",
        "SEMPRE adicione estados de loading/error",
        "SEMPRE crie animações suaves"
      ]
    },
    {
      phase: 3,
      name: "DOCS_TESTS",
      persona: "Tech Writer + QA Automation Engineer",
      description: "Finaliza o projeto com documentação, testes, Docker, CI/CD",
      input: {
        required: ["userPrompt", "backendCode", "frontendCode", "memoPhase1", "memoPhase2"],
        optional: []
      },
      output: {
        code: "Documentação e configurações",
        memo: null
      },
      responsibilities: [
        "README.md profissional",
        "Documentação da API (OpenAPI/Swagger)",
        "ARCHITECTURE.md com diagramas Mermaid",
        "Testes E2E (Playwright)",
        "Testes de integração",
        "Dockerfile (backend)",
        "Dockerfile (frontend)",
        "docker-compose.yml",
        ".github/workflows/ci.yml",
        ".env.example",
        "DEPLOYMENT.md",
        "CONTRIBUTING.md"
      ],
      rules: [
        "SEMPRE crie README.md completo e profissional",
        "SEMPRE documente TODOS os endpoints",
        "SEMPRE configure Docker Compose funcional",
        "SEMPRE crie CI/CD com lint, test, build",
        "SEMPRE inclua .env.example",
        "SEMPRE crie testes E2E para fluxos críticos"
      ]
    }
  ],
  
  memoTemplates: {
    phase1To2: {
      sections: [
        "RESUMO DO BACKEND",
        "ENDPOINTS DISPONÍVEIS",
        "MODELOS DE DADOS",
        "INSTRUÇÕES PARA O FRONTEND",
        "COMPONENTES NECESSÁRIOS",
        "DESIGN SYSTEM SUGERIDO"
      ]
    },
    phase2To3: {
      sections: [
        "RESUMO DO FRONTEND",
        "ESTRUTURA DE COMPONENTES",
        "FLUXOS DE USUÁRIO",
        "O QUE DOCUMENTAR",
        "TESTES NECESSÁRIOS",
        "DOCKER"
      ]
    }
  },
  
  detection: {
    keywords: {
      fullProject: [
        "sistema completo", "full system", "fullstack", "full-stack",
        "aplicativo completo", "complete app", "complete application",
        "projeto completo", "complete project",
        "backend e frontend", "backend and frontend",
        "e-commerce", "ecommerce", "loja virtual",
        "fintech", "banco digital", "digital bank",
        "saas", "plataforma", "platform",
        "dashboard completo", "complete dashboard",
        "crud completo", "complete crud"
      ],
      backend: [
        "backend", "servidor", "server", "api",
        "banco de dados", "database", "postgresql", "mongodb"
      ],
      frontend: [
        "frontend", "interface", "ui", "ux",
        "tela", "screen", "página", "page",
        "react", "vue", "next", "angular"
      ]
    },
    rules: [
      "Se contém keyword de fullProject → usar Orchestra",
      "Se menciona backend E frontend → usar Orchestra",
      "Se é apenas backend OU apenas frontend → usar chamada única"
    ]
  },
  
  models: {
    default: "gemini-2.0-flash-exp",
    alternatives: [
      "gemini-1.5-pro",
      "gemini-1.5-flash"
    ]
  },
  
  limits: {
    maxContextLength: 30000,
    maxOutputLength: 8000,
    truncateAt: 15000
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS EXPORTADOS
// ═══════════════════════════════════════════════════════════════════════════════

export type PhaseNumber = 1 | 2 | 3;
export type PhaseName = 'BACKEND' | 'FRONTEND' | 'DOCS_TESTS';

export interface PhaseConfig {
  phase: PhaseNumber;
  name: PhaseName;
  persona: string;
  description: string;
  input: {
    required: string[];
    optional: string[];
  };
  output: {
    code: string;
    memo: string | null;
  };
  responsibilities: string[];
  rules: string[];
}

export interface OrchestraConfig {
  name: string;
  version: string;
  description: string;
  phases: PhaseConfig[];
  memoTemplates: {
    phase1To2: { sections: string[] };
    phase2To3: { sections: string[] };
  };
  detection: {
    keywords: {
      fullProject: string[];
      backend: string[];
      frontend: string[];
    };
    rules: string[];
  };
  models: {
    default: string;
    alternatives: string[];
  };
  limits: {
    maxContextLength: number;
    maxOutputLength: number;
    truncateAt: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES UTILITÁRIAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Retorna a configuração de uma fase específica
 */
export function getPhaseConfig(phase: PhaseNumber): PhaseConfig | undefined {
  return TOOL_ORCHESTRA_CONFIG.phases.find(p => p.phase === phase);
}

/**
 * Retorna todas as responsabilidades de uma fase
 */
export function getPhaseResponsibilities(phase: PhaseNumber): string[] {
  const config = getPhaseConfig(phase);
  return config?.responsibilities || [];
}

/**
 * Retorna todas as regras de uma fase
 */
export function getPhaseRules(phase: PhaseNumber): string[] {
  const config = getPhaseConfig(phase);
  return config?.rules || [];
}

/**
 * Verifica se um prompt deve usar o Orchestra baseado na config
 */
export function shouldUseOrchestraFromConfig(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  const { keywords } = TOOL_ORCHESTRA_CONFIG.detection;
  
  // Verifica keywords de projeto completo
  const hasFullProjectKeyword = keywords.fullProject.some(kw => 
    promptLower.includes(kw.toLowerCase())
  );
  
  if (hasFullProjectKeyword) return true;
  
  // Verifica se menciona backend E frontend
  const mentionsBackend = keywords.backend.some(kw => 
    promptLower.includes(kw.toLowerCase())
  );
  const mentionsFrontend = keywords.frontend.some(kw => 
    promptLower.includes(kw.toLowerCase())
  );
  
  return mentionsBackend && mentionsFrontend;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default TOOL_ORCHESTRA_CONFIG;
