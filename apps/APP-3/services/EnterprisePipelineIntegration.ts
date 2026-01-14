/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║    🏢 ENTERPRISE PIPELINE INTEGRATION - SISTEMA DE MULTI-CHAMADAS 🏢        ║
 * ║                                                                              ║
 * ║     INTEGRAÇÃO COM GEMINISERVICE PARA GERAÇÃO ENTERPRISE                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo integra o sistema de multi-chamadas diretamente no fluxo de
 * geração do GeminiService, detectando automaticamente quando usar o modo
 * enterprise (3-5 chamadas) vs modo normal (1 chamada).
 * 
 * PADRÃO RELAY RACE:
 * - Cada fase passa o contexto completo para a próxima
 * - Sem reiniciar, sem perder contexto
 * - Streaming em tempo real para o Monaco editor
 */

import { pipelineEvents, type PipelineMode, type PipelinePhase, PIPELINE_PHASES } from './PipelineEvents';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ComplexityAnalysis {
  score: number; // 0-100
  mode: PipelineMode;
  reason: string;
  detectedFeatures: string[];
}

export interface PhaseContext {
  phaseId: PipelinePhase;
  phaseName: string;
  previousOutput: string;
  contracts: string[];
  schema: string;
  generatedFiles: string[];
  totalLinesGenerated: number;
}

export interface EnterprisePipelineConfig {
  mode: PipelineMode;
  userPrompt: string;
  onStreamChunk?: (chunk: string, phase: PipelinePhase) => void;
  onPhaseComplete?: (phase: PipelinePhase, output: string, lines: number) => void;
  onError?: (phase: PipelinePhase, error: Error) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTOR DE COMPLEXIDADE - AUTO-DETECTA QUANDO USAR MULTI-CHAMADAS
// ═══════════════════════════════════════════════════════════════════════════════

const COMPLEXITY_KEYWORDS = {
  // Palavras que indicam projeto enterprise (peso alto)
  enterprise: [
    'empresa', 'enterprise', 'completo', 'full-stack', 'fullstack',
    'produção', 'production', 'deploy', 'ci/cd', 'docker',
    'microserviços', 'microservices', 'escalável', 'scalable'
  ],
  
  // Palavras que indicam fintech (peso muito alto)
  fintech: [
    'fintech', 'banco', 'bank', 'pagamento', 'payment', 'pix',
    'transferência', 'transfer', 'carteira', 'wallet', 'crédito',
    'empréstimo', 'loan', 'transação', 'transaction'
  ],
  
  // Palavras que indicam SaaS (peso alto)
  saas: [
    'saas', 'multi-tenant', 'assinatura', 'subscription',
    'planos', 'pricing', 'dashboard', 'admin', 'painel'
  ],
  
  // Palavras que indicam e-commerce (peso alto)
  ecommerce: [
    'ecommerce', 'e-commerce', 'loja', 'store', 'carrinho',
    'cart', 'checkout', 'produto', 'product', 'estoque', 'inventory'
  ],
  
  // Palavras que indicam rede social (peso médio-alto)
  social: [
    'rede social', 'social network', 'feed', 'timeline',
    'followers', 'seguidores', 'posts', 'comentários', 'likes'
  ],
  
  // Palavras que indicam backend complexo (peso médio)
  backend: [
    'api', 'rest', 'graphql', 'websocket', 'real-time',
    'autenticação', 'auth', 'jwt', 'oauth', 'database',
    'postgresql', 'mongodb', 'redis', 'queue', 'fila'
  ],
  
  // Palavras que indicam frontend complexo (peso médio)
  frontend: [
    'react', 'next.js', 'vue', 'angular', 'componentes',
    'design system', 'responsivo', 'mobile', 'pwa', 'spa'
  ],
  
  // Palavras que indicam projeto simples (peso negativo)
  simple: [
    'simples', 'simple', 'básico', 'basic', 'landing page',
    'página única', 'single page', 'formulário', 'form',
    'calculadora', 'calculator', 'todo', 'lista'
  ]
};

/**
 * 🔍 Analisa a complexidade do prompt e decide o modo do pipeline
 */
export function analyzeComplexity(userPrompt: string): ComplexityAnalysis {
  const promptLower = userPrompt.toLowerCase();
  let score = 0;
  const detectedFeatures: string[] = [];
  
  // Verificar palavras-chave enterprise
  for (const keyword of COMPLEXITY_KEYWORDS.enterprise) {
    if (promptLower.includes(keyword)) {
      score += 15;
      detectedFeatures.push(`enterprise:${keyword}`);
    }
  }
  
  // Verificar palavras-chave fintech (peso maior)
  for (const keyword of COMPLEXITY_KEYWORDS.fintech) {
    if (promptLower.includes(keyword)) {
      score += 20;
      detectedFeatures.push(`fintech:${keyword}`);
    }
  }
  
  // Verificar palavras-chave SaaS
  for (const keyword of COMPLEXITY_KEYWORDS.saas) {
    if (promptLower.includes(keyword)) {
      score += 15;
      detectedFeatures.push(`saas:${keyword}`);
    }
  }
  
  // Verificar palavras-chave e-commerce
  for (const keyword of COMPLEXITY_KEYWORDS.ecommerce) {
    if (promptLower.includes(keyword)) {
      score += 15;
      detectedFeatures.push(`ecommerce:${keyword}`);
    }
  }
  
  // Verificar palavras-chave social
  for (const keyword of COMPLEXITY_KEYWORDS.social) {
    if (promptLower.includes(keyword)) {
      score += 12;
      detectedFeatures.push(`social:${keyword}`);
    }
  }
  
  // Verificar palavras-chave backend
  for (const keyword of COMPLEXITY_KEYWORDS.backend) {
    if (promptLower.includes(keyword)) {
      score += 8;
      detectedFeatures.push(`backend:${keyword}`);
    }
  }
  
  // Verificar palavras-chave frontend
  for (const keyword of COMPLEXITY_KEYWORDS.frontend) {
    if (promptLower.includes(keyword)) {
      score += 5;
      detectedFeatures.push(`frontend:${keyword}`);
    }
  }
  
  // Verificar palavras-chave simples (reduz score)
  for (const keyword of COMPLEXITY_KEYWORDS.simple) {
    if (promptLower.includes(keyword)) {
      score -= 20;
      detectedFeatures.push(`simple:${keyword}`);
    }
  }
  
  // Bônus por tamanho do prompt (prompts longos = mais complexos)
  if (userPrompt.length > 500) score += 10;
  if (userPrompt.length > 1000) score += 15;
  if (userPrompt.length > 2000) score += 20;
  
  // Garantir score entre 0 e 100
  score = Math.max(0, Math.min(100, score));
  
  // Decidir modo baseado no score
  let mode: PipelineMode;
  let reason: string;
  
  if (score >= 70) {
    mode = 5;
    reason = 'Projeto enterprise complexo detectado - usando 5 fases para máxima qualidade';
  } else if (score >= 50) {
    mode = 4;
    reason = 'Projeto fullstack detectado - usando 4 fases';
  } else if (score >= 30) {
    mode = 3;
    reason = 'Projeto médio detectado - usando 3 fases';
  } else {
    mode = 1;
    reason = 'Projeto simples - usando modo normal (1 chamada)';
  }
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  🔍 ANÁLISE DE COMPLEXIDADE                                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Score: ${String(score).padEnd(70)}║
║  Modo: ${String(mode + ' chamadas').padEnd(71)}║
║  Razão: ${reason.substring(0, 69).padEnd(69)}║
║  Features: ${detectedFeatures.slice(0, 5).join(', ').substring(0, 66).padEnd(66)}║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
  
  return { score, mode, reason, detectedFeatures };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANIFESTOS FOCADOS POR FASE (Compactos para maximizar output)
// ═══════════════════════════════════════════════════════════════════════════════

export const PHASE_MANIFESTS = {
  ARCHITECT: `
🧠 VOCÊ É O ARQUITETO-CHEFE. SUA MISSÃO: PLANEJAR TUDO.

REGRAS ABSOLUTAS:
1. Analise o pedido e identifique TODAS as funcionalidades necessárias
2. Defina a arquitetura completa (monolito ou microserviços)
3. Crie contratos de API detalhados (OpenAPI/Swagger)
4. Defina schema de banco de dados (Prisma ou SQL)
5. Liste TODOS os arquivos que serão criados nas próximas fases

OUTPUT OBRIGATÓRIO:
1. architecture.json - Decisões arquiteturais
2. openapi.yaml - Contratos de TODAS as APIs
3. schema.prisma - Schema completo do banco
4. project-structure.md - Estrutura de pastas
5. phase2-instructions.md - Instruções detalhadas para o Backend

FORMATO DE SAÍDA:
===FILE: caminho/arquivo.ext===
LANGUAGE: linguagem
---
conteúdo completo
---

NÃO ECONOMIZE. Seja EXTREMAMENTE detalhado nos contratos.
`,

  BACKEND: `
⚙️ VOCÊ É O ENGENHEIRO DE BACKEND SÊNIOR. SUA MISSÃO: IMPLEMENTAR TUDO.

VOCÊ RECEBE:
- Contratos de API da Fase 1
- Schema de banco da Fase 1
- Instruções do Arquiteto

REGRAS ABSOLUTAS:
1. Implemente TODAS as rotas definidas nos contratos
2. Crie services com lógica de negócio COMPLETA
3. Implemente autenticação JWT com refresh tokens
4. Adicione validação em TODAS as entradas
5. Crie testes unitários para cada service
6. Use transações atômicas para operações críticas

STACK PADRÃO:
- Go (Gin/Fiber) OU Node.js (Hono/Fastify)
- PostgreSQL com Prisma
- JWT + bcrypt
- Zod para validação

⚠️ FORMATO DE SAÍDA OBRIGATÓRIO (CRÍTICO - NÃO IGNORE):
===FILE: caminho/arquivo.ext===
LANGUAGE: linguagem
---
conteúdo completo do arquivo
---

OUTPUT: Código COMPLETO e FUNCIONAL. Sem TODOs, sem placeholders.
Gere o MÁXIMO de código possível. Cada arquivo deve estar 100% implementado.
`,

  FRONTEND: `
🎨 VOCÊ É O DESIGNER/FRONTEND LEAD. SUA MISSÃO: CRIAR A UI COMPLETA.

VOCÊ RECEBE:
- Contratos de API (endpoints disponíveis)
- Schema de dados (modelos)
- Instruções das fases anteriores

REGRAS ABSOLUTAS:
1. Crie TODAS as páginas necessárias
2. Implemente componentes reutilizáveis
3. Use Tailwind CSS + Shadcn/UI
4. Adicione animações com Framer Motion
5. Implemente responsividade (mobile-first)
6. Adicione acessibilidade (ARIA, labels)

STACK PADRÃO:
- Next.js 14+ ou React + Vite
- TypeScript obrigatório
- Tailwind CSS
- Shadcn/UI components
- Zustand para estado
- React Hook Form + Zod

⚠️ FORMATO DE SAÍDA OBRIGATÓRIO (CRÍTICO - NÃO IGNORE):
===FILE: caminho/arquivo.ext===
LANGUAGE: linguagem
---
conteúdo completo do arquivo
---

OUTPUT: UI COMPLETA e BONITA. Cada componente deve estar estilizado.
Gere o MÁXIMO de código possível. Sem componentes vazios.
`,

  INTEGRATION: `
🔗 VOCÊ É O ESPECIALISTA EM INTEGRAÇÃO. SUA MISSÃO: CONECTAR TUDO.

VOCÊ RECEBE:
- Backend completo (APIs implementadas)
- Frontend completo (UI implementada)
- Contratos de API

REGRAS ABSOLUTAS:
1. Crie API clients tipados para TODAS as rotas
2. Implemente hooks customizados (useAuth, useData, etc.)
3. Configure estado global (Zustand stores)
4. Adicione WebSocket se necessário
5. Implemente tratamento de erros global
6. Adicione loading states e skeleton loaders
7. Configure interceptors para auth

⚠️ FORMATO DE SAÍDA OBRIGATÓRIO (CRÍTICO - NÃO IGNORE):
===FILE: caminho/arquivo.ext===
LANGUAGE: linguagem
---
conteúdo completo do arquivo
---

OUTPUT:
- services/api/*.ts - Clients para cada domínio
- hooks/use*.ts - Hooks customizados
- stores/*.ts - Zustand stores
- lib/axios.ts - Configuração do cliente HTTP
- types/*.ts - Tipos compartilhados

Gere código que CONECTE PERFEITAMENTE frontend e backend.
`,

  DEVOPS: `
📚 VOCÊ É O DEVOPS/SRE SÊNIOR. SUA MISSÃO: PREPARAR PARA PRODUÇÃO.

VOCÊ RECEBE:
- Projeto completo (backend + frontend + integração)
- Estrutura de pastas
- Dependências

REGRAS ABSOLUTAS:
1. Crie Dockerfiles otimizados (multi-stage build)
2. Configure docker-compose para dev e prod
3. Crie GitHub Actions para CI/CD
4. Escreva README.md COMPLETO
5. Adicione testes E2E (Playwright)
6. Configure variáveis de ambiente
7. Adicione scripts de deploy

⚠️ FORMATO DE SAÍDA OBRIGATÓRIO (CRÍTICO - NÃO IGNORE):
===FILE: caminho/arquivo.ext===
LANGUAGE: linguagem
---
conteúdo completo do arquivo
---

OUTPUT:
- Dockerfile (backend)
- Dockerfile (frontend)
- docker-compose.yml
- docker-compose.prod.yml
- .github/workflows/ci.yml
- .github/workflows/deploy.yml
- README.md (completo com screenshots)
- DEPLOYMENT.md
- .env.example
- tests/e2e/*.spec.ts

Gere configurações PRONTAS PARA PRODUÇÃO.
`
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTRUTOR DE PROMPT POR FASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 📝 Constrói o prompt para uma fase específica com contexto das anteriores
 * 
 * MITIGAÇÃO DE RISCOS:
 * 1. "Amnésia" entre fases → Schema e OpenAPI são SEMPRE reinjetados como "Verdade Absoluta"
 * 2. Conflito de arquivos → Namespaces claros por fase (backend/, frontend/, etc.)
 */
export function buildPhasePrompt(
  phaseId: PipelinePhase,
  userPrompt: string,
  previousContext: PhaseContext | null,
  allPreviousContexts: PhaseContext[] = [] // Todos os contextos anteriores para evitar amnésia
): string {
  const phaseInfo = PIPELINE_PHASES.find(p => p.id === phaseId)!;
  const manifestKey = getManifestKeyForPhase(phaseId);
  const manifest = PHASE_MANIFESTS[manifestKey as keyof typeof PHASE_MANIFESTS];
  
  // Extrair schema e contratos de TODAS as fases anteriores (evitar amnésia)
  const allSchemas = allPreviousContexts
    .filter(ctx => ctx.schema)
    .map(ctx => ctx.schema);
  const allContracts = allPreviousContexts
    .flatMap(ctx => ctx.contracts);
  
  let prompt = `
╔══════════════════════════════════════════════════════════════════════════════╗
║  ${phaseInfo.emoji} FASE ${phaseId}: ${phaseInfo.name.toUpperCase()}
║  ${phaseInfo.description}
╚══════════════════════════════════════════════════════════════════════════════╝

${manifest}

`;

  // ═══════════════════════════════════════════════════════════════════════════════
  // VERDADE ABSOLUTA - Schema e Contratos (SEMPRE no topo para evitar amnésia)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (allSchemas.length > 0 || allContracts.length > 0) {
    prompt += `
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️ VERDADE ABSOLUTA - SIGA EXATAMENTE ESTAS DEFINIÇÕES ⚠️                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

`;
    
    if (allSchemas.length > 0) {
      prompt += `### 🗄️ SCHEMA DO BANCO DE DADOS (IMUTÁVEL)
\`\`\`prisma
${allSchemas.join('\n\n')}
\`\`\`

REGRA: Use EXATAMENTE estes modelos. Não invente campos. Não mude tipos.

`;
    }
    
    if (allContracts.length > 0) {
      prompt += `### 📋 CONTRATOS DE API (IMUTÁVEIS)
${allContracts.join('\n')}

REGRA: Implemente EXATAMENTE estas rotas. Não mude paths. Não mude métodos.

`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // NAMESPACES OBRIGATÓRIOS (evitar conflito de arquivos)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  prompt += `
╔══════════════════════════════════════════════════════════════════════════════╗
║  📁 NAMESPACES OBRIGATÓRIOS - EVITAR CONFLITO DE ARQUIVOS                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

${getNamespaceRulesForPhase(phaseId)}

`;

  prompt += `
═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

${userPrompt}

`;

  // Adicionar contexto da fase anterior (relay race - passar o bastão)
  if (previousContext && previousContext.previousOutput) {
    prompt += `
═══════════════════════════════════════════════════════════════════════════════
📦 CONTEXTO DA FASE ANTERIOR (${previousContext.phaseName}):
═══════════════════════════════════════════════════════════════════════════════

Arquivos gerados: ${previousContext.generatedFiles.join(', ')}
Total de linhas: ${previousContext.totalLinesGenerated}

${previousContext.previousOutput}

`;
  }

  prompt += `
═══════════════════════════════════════════════════════════════════════════════
🎯 EXECUTE A FASE ${phaseId} AGORA!
═══════════════════════════════════════════════════════════════════════════════

LEMBRE-SE:
- Gere o MÁXIMO de código possível
- Cada arquivo deve estar 100% implementado
- Sem TODOs, sem placeholders, sem "..."
- Use o formato ===FILE: caminho=== para cada arquivo
- RESPEITE os namespaces da sua fase (${getNamespacePrefixForPhase(phaseId)})
- SIGA a Verdade Absoluta (schema e contratos)

COMECE AGORA!
`;

  return prompt;
}

/**
 * 📁 Retorna as regras de namespace para cada fase
 */
function getNamespaceRulesForPhase(phaseId: PipelinePhase): string {
  switch (phaseId) {
    case 1: // Arquiteto
      return `FASE 1 (Arquiteto) - Seus arquivos devem estar em:
- docs/architecture.json
- docs/openapi.yaml
- prisma/schema.prisma
- docs/project-structure.md
- docs/phase-instructions.md`;
    
    case 2: // Backend
      return `FASE 2 (Backend) - Seus arquivos devem estar em:
- backend/src/routes/*.ts
- backend/src/controllers/*.ts
- backend/src/services/*.ts
- backend/src/repositories/*.ts
- backend/src/middleware/*.ts
- backend/src/models/*.ts (tipos TypeScript, NÃO Prisma)
- backend/tests/*.test.ts
- backend/package.json
- backend/tsconfig.json

⚠️ NÃO GERE arquivos em frontend/ ou prisma/ (já foram gerados)`;
    
    case 3: // Frontend
      return `FASE 3 (Frontend) - Seus arquivos devem estar em:
- frontend/src/pages/*.tsx
- frontend/src/components/*.tsx
- frontend/src/hooks/*.ts
- frontend/src/styles/*.css
- frontend/src/types/*.ts (tipos do frontend)
- frontend/package.json
- frontend/tailwind.config.js
- frontend/tsconfig.json

⚠️ NÃO GERE arquivos em backend/ (já foram gerados)
⚠️ Use os MESMOS nomes de tipos do schema.prisma`;
    
    case 4: // Integração
      return `FASE 4 (Integração) - Seus arquivos devem estar em:
- frontend/src/services/api/*.ts (clients de API)
- frontend/src/hooks/use*.ts (hooks de dados)
- frontend/src/stores/*.ts (Zustand stores)
- frontend/src/lib/axios.ts (configuração HTTP)
- shared/types/*.ts (tipos compartilhados)

⚠️ NÃO MODIFIQUE arquivos existentes, apenas ADICIONE novos
⚠️ Importe tipos do schema.prisma`;
    
    case 5: // DevOps
      return `FASE 5 (DevOps) - Seus arquivos devem estar em:
- docker/Dockerfile.backend
- docker/Dockerfile.frontend
- docker-compose.yml
- docker-compose.prod.yml
- .github/workflows/ci.yml
- .github/workflows/deploy.yml
- README.md
- DEPLOYMENT.md
- .env.example
- tests/e2e/*.spec.ts

⚠️ NÃO MODIFIQUE código de backend/ ou frontend/`;
    
    default:
      return '';
  }
}

/**
 * 📁 Retorna o prefixo de namespace para cada fase
 */
function getNamespacePrefixForPhase(phaseId: PipelinePhase): string {
  switch (phaseId) {
    case 1: return 'docs/, prisma/';
    case 2: return 'backend/';
    case 3: return 'frontend/';
    case 4: return 'frontend/src/services/, frontend/src/stores/, shared/';
    case 5: return 'docker/, .github/, raiz';
    default: return '';
  }
}

/**
 * 🔑 Obtém a chave do manifesto para uma fase
 */
function getManifestKeyForPhase(phaseId: PipelinePhase): string {
  switch (phaseId) {
    case 1: return 'ARCHITECT';
    case 2: return 'BACKEND';
    case 3: return 'FRONTEND';
    case 4: return 'INTEGRATION';
    case 5: return 'DEVOPS';
    default: return 'ARCHITECT';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSER DE OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 📦 Extrai arquivos do output de uma fase
 */
export function parsePhaseOutput(output: string): {
  files: string[];
  contracts: string[];
  schema: string;
  linesOfCode: number;
} {
  const files: string[] = [];
  const contracts: string[] = [];
  let schema = '';
  let linesOfCode = 0;
  
  // Extrair arquivos no formato ===FILE: path===
  const fileRegex = /===FILE:\s*(.+?)===\s*\n(?:LANGUAGE:\s*(.+?)\s*\n)?---\n([\s\S]*?)---/g;
  let match;
  
  while ((match = fileRegex.exec(output)) !== null) {
    const path = match[1].trim();
    const content = match[3].trim();
    files.push(path);
    linesOfCode += content.split('\n').length;
    
    // Detectar schema
    if (path.includes('schema') || path.includes('prisma')) {
      schema = content;
    }
  }
  
  // Extrair contratos de API
  const contractRegex = /(GET|POST|PUT|PATCH|DELETE)\s+([\/\w\-\{\}:]+)\s*[-:]\s*(.+)/gi;
  while ((match = contractRegex.exec(output)) !== null) {
    contracts.push(`${match[1]} ${match[2]}: ${match[3]}`);
  }
  
  // Fallback: contar linhas de blocos de código markdown
  if (files.length === 0) {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    while ((match = codeBlockRegex.exec(output)) !== null) {
      linesOfCode += match[1].split('\n').length;
    }
  }
  
  return { files, contracts, schema, linesOfCode };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKPOINT STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

const CHECKPOINT_KEY = 'alexandria_enterprise_checkpoint';

export interface PipelineCheckpoint {
  id: string;
  userPrompt: string;
  mode: PipelineMode;
  currentPhase: PipelinePhase;
  completedPhases: PhaseContext[];
  timestamp: number;
}

/**
 * 💾 Salva checkpoint para continuar depois
 */
export function saveCheckpoint(checkpoint: PipelineCheckpoint): void {
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));
    console.log(`💾 Checkpoint salvo: Fase ${checkpoint.currentPhase}/${checkpoint.mode}`);
  } catch (error) {
    console.warn('⚠️ Erro ao salvar checkpoint:', error);
  }
}

/**
 * 📂 Carrega checkpoint salvo
 */
export function loadCheckpoint(): PipelineCheckpoint | null {
  try {
    const saved = localStorage.getItem(CHECKPOINT_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar checkpoint:', error);
  }
  return null;
}

/**
 * 🗑️ Limpa checkpoint
 */
export function clearCheckpoint(): void {
  try {
    localStorage.removeItem(CHECKPOINT_KEY);
    console.log('🗑️ Checkpoint limpo');
  } catch (error) {
    console.warn('⚠️ Erro ao limpar checkpoint:', error);
  }
}

/**
 * 🔄 Verifica se há checkpoint pendente
 */
export function hasPendingCheckpoint(): boolean {
  const checkpoint = loadCheckpoint();
  if (!checkpoint) return false;
  
  const activePhasesForMode = pipelineEvents.getPhasesForMode(checkpoint.mode);
  return checkpoint.completedPhases.length < activePhasesForMode.length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  pipelineEvents,
  PIPELINE_PHASES
};
