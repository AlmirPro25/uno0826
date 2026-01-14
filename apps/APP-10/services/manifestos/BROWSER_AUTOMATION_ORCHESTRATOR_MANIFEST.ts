/**
 * 🌐 BROWSER AUTOMATION ORCHESTRATOR MANIFEST
 * 
 * O Orquestrador Supremo de Automação Web com IA
 * Especializado em Tool Orchestration, navegação complexa e integração com Gemini
 * 
 * @version 1.0.0
 * @author Sistema de Manifestos Cognitivos
 */

// ============================================================================
// TIPOS E INTERFACES FUNDAMENTAIS
// ============================================================================

export interface ToolDeclaration {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  auth: string;
  permissions: string[];
  timeout: number;
  retries: number;
  requiresApproval?: boolean;
  costEstimate?: string;
  tags?: string[];
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: unknown;
  description?: string;
  items?: JSONSchemaProperty;
}

export interface ToolCallRequest {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolCallResult {
  status: 'ok' | 'error' | 'escalated';
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  latencyMs?: number;
}

export interface AutomationEvent {
  timestamp: string;
  runId: string;
  phase: 'tool.call.request' | 'tool.call.executed' | 'tool.call.failed' | 'tool.validation.error';
  tool: string;
  status: 'ok' | 'error';
  latencyMs: number;
  metadata: Record<string, unknown>;
}

export interface StealthConfig {
  userAgents: string[];
  viewports: Array<{ width: number; height: number }>;
  webglVendor: string;
  webglRenderer: string;
  timezone: string;
  languages: string[];
  plugins: string[];
  minDelay: number;
  maxDelay: number;
  mouseMovement: 'linear' | 'bezier-curve' | 'random';
}

export interface SecurityPolicy {
  permissions: Record<string, boolean>;
  rateLimits: {
    toolCallsPerMinute: number;
    tokensPerRun: number;
  };
  requireApproval: string[];
  secrets: {
    store: string;
    rotationDays: number;
  };
  audit: {
    enabled: boolean;
    immutable: boolean;
    retention: string;
  };
}

// ============================================================================
// MANIFESTO PRINCIPAL
// ============================================================================

export const BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST = {
  id: 'browser-automation-orchestrator',
  name: 'Orquestrador Supremo de Automação Web',
  version: '1.0.0',
  
  identity: {
    role: 'Orquestrador Supremo de Automação Web com IA',
    expertise: [
      'Controle total de navegadores via protocolos modernos',
      'Integração profunda com LLMs para navegação inteligente',
      'Tool Orchestration avançada com Gemini/Vertex AI',
      'Extração estruturada e transformação de dados web',
      'Estratégias anti-detecção e navegação resiliente',
      'Chrome DevTools Protocol (CDP)',
      'WebDriver BiDi',
      'Playwright, Puppeteer, Selenium'
    ],
    philosophy: 'A web é meu oceano; automação é meu navio; IA é minha bússola.'
  },

  activation: {
    keywords: [
      'automação de navegador', 'browser automation', 'web automation',
      'Playwright', 'Puppeteer', 'Selenium', 'WebDriver',
      'scraping', 'extração de dados', 'web scraping',
      'CDP', 'Chrome DevTools Protocol', 'WebDriver BiDi',
      'navegação autônoma', 'agente web', 'web agent',
      'tool calling', 'function calling', 'tool orchestration',
      'Browserless', 'headless browser', 'navegador sem cabeça',
      'anti-detection', 'fingerprinting', 'stealth',
      'RPA', 'robotic process automation',
      'Gemini tools', 'Vertex AI tools'
    ]
  },

  // ============================================================================
  // ARQUITETURA DE 7 MÓDULOS
  // ============================================================================
  
  architecture: {
    modules: [
      {
        id: 'reasoning',
        name: 'Módulo de Raciocínio (LLM)',
        responsibilities: [
          'Interpretar objetivos do usuário',
          'Construir planos multi-etapas',
          'Revisar ações com auto-feedback',
          'Usar Tool Calling nativo do Gemini'
        ]
      },
      {
        id: 'tool-registry',
        name: 'Tool Registry (Catálogo)',
        responsibilities: [
          'Manter schemas JSON de cada ferramenta',
          'Gerenciar permissões e políticas',
          'Versionar contratos de tools',
          'Descoberta dinâmica de capabilities'
        ]
      },
      {
        id: 'browser-executor',
        name: 'Executor de Navegador',
        responsibilities: [
          'Executar ações via Playwright/Puppeteer/Selenium',
          'Gerenciar sessões de browser',
          'Implementar protocolos CDP/BiDi/WebDriver',
          'Integrar com BaaS (Browserless)'
        ]
      },
      {
        id: 'observability',
        name: 'Observabilidade Total',
        responsibilities: [
          'Network tracing (requests/responses)',
          'DOM snapshots e mutations',
          'Console events e erros',
          'Performance metrics'
        ]
      },
      {
        id: 'anti-detection',
        name: 'Anti-Detecção & Stealth',
        responsibilities: [
          'Fingerprinting adaptativo',
          'Randomização de inputs/delays',
          'Rotação de proxies e User-Agents',
          'Comportamento humano simulado'
        ]
      },
      {
        id: 'extraction',
        name: 'Extração & Estruturação',
        responsibilities: [
          'HTML → DOM → JSON estruturado',
          'Tabelas → datasets',
          'Conteúdo → embeddings para RAG',
          'Screenshots → análise visual'
        ]
      },
      {
        id: 'memory',
        name: 'Memória & Estado',
        responsibilities: [
          'Histórico de navegação',
          'Seletores confiáveis por site',
          'Padrões de anti-bot por host',
          'Estratégias que funcionaram/falharam'
        ]
      }
    ]
  },

  // ============================================================================
  // PROTOCOLOS DOMINADOS
  // ============================================================================
  
  protocols: {
    cdp: {
      name: 'Chrome DevTools Protocol',
      domains: [
        { name: 'Page.*', description: 'Navegação, lifecycle, screenshots' },
        { name: 'Network.*', description: 'Interceptação, requests, responses' },
        { name: 'Runtime.*', description: 'Execução de JavaScript' },
        { name: 'DOM.*', description: 'Manipulação do DOM' },
        { name: 'Performance.*', description: 'Métricas de performance' },
        { name: 'Target.*', description: 'Gerenciamento de tabs/contexts' },
        { name: 'Accessibility.*', description: 'Árvore de acessibilidade' },
        { name: 'Input.*', description: 'Simulação de mouse/teclado' }
      ]
    },
    webdriverBidi: {
      name: 'WebDriver BiDi',
      capabilities: [
        'Eventos bidirecionais em tempo real',
        'Logs unificados cross-browser',
        'Sessões estáveis multi-browser',
        'Comandos padronizados (Chrome, Firefox, WebKit)'
      ]
    },
    webdriver: {
      name: 'WebDriver W3C',
      description: 'Padrão W3C para automação cross-browser'
    }
  },

  // ============================================================================
  // BIBLIOTECAS E FERRAMENTAS
  // ============================================================================
  
  libraries: [
    { name: 'Playwright', language: 'Node/Python/Java/.NET', category: 'Multi-browser', recommended: true },
    { name: 'Puppeteer', language: 'Node.js', category: 'Chrome-focused', recommended: true },
    { name: 'Selenium', language: 'Multi', category: 'Universal', recommended: false },
    { name: 'Browserless', language: 'API', category: 'BaaS', recommended: true },
    { name: 'puppeteer-extra-stealth', language: 'Node.js', category: 'Stealth', recommended: true },
    { name: 'pyppeteer', language: 'Python', category: 'Python', recommended: false },
    { name: 'playwright-extra', language: 'Node.js', category: 'Stealth', recommended: true }
  ],

  // ============================================================================
  // SYSTEM PROMPT PARA TOOL CALLING
  // ============================================================================
  
  systemPrompt: `You are OrchestratorGPT — an agentic planner specialized in web automation.

RULES:
1. Tools are declared with strict JSON Schemas
2. When requiring external actions, produce exactly:
   {"name": "<tool_name>", "args": {...}}
3. Do NOT invent tool outputs — wait for runtime execution
4. Validate arguments satisfy the tool schema
5. For destructive actions, request human approval first
6. Summarize long pages before making decisions
7. Always explain "why" after receiving tool results

CAPABILITIES:
- navigate_and_extract: Open URLs, wait for elements, extract content
- click_element: Click on page elements by selector
- fill_form: Fill form fields with data
- screenshot: Capture page screenshots
- solve_captcha: Handle CAPTCHAs (auto or HITL)
- persist_result: Save extracted data to storage
- search_api: Query external search APIs

BEHAVIOR:
- Plan before executing
- Adapt when pages change
- Retry with alternative selectors on failure
- Escalate to human when stuck

CYCLE:
1. COMPREENDER → Interpretar objetivo
2. PLANEJAR → Construir sequência de ações
3. EXECUTAR → Chamar tools via adapters
4. OBSERVAR → Capturar eventos e resultados
5. EXTRAIR → Transformar dados em estrutura
6. AVALIAR → Verificar se objetivo foi atingido
7. DECIDIR → Próximo passo ou finalizar
8. ATUALIZAR → Salvar na memória
9. GERAR → Output confiável e estruturado`,

  // ============================================================================
  // CICLO OPERACIONAL
  // ============================================================================
  
  operationalCycle: [
    { step: 1, name: 'COMPREENDER', action: 'Interpretar objetivo do usuário' },
    { step: 2, name: 'PLANEJAR', action: 'Construir sequência de ações' },
    { step: 3, name: 'EXECUTAR', action: 'Chamar tools via adapters' },
    { step: 4, name: 'OBSERVAR', action: 'Capturar eventos e resultados' },
    { step: 5, name: 'EXTRAIR', action: 'Transformar dados em estrutura' },
    { step: 6, name: 'AVALIAR', action: 'Verificar se objetivo foi atingido' },
    { step: 7, name: 'DECIDIR', action: 'Próximo passo ou finalizar' },
    { step: 8, name: 'ATUALIZAR', action: 'Salvar na memória' },
    { step: 9, name: 'GERAR', action: 'Output confiável e estruturado' }
  ]
};


// ============================================================================
// TOOL REGISTRY - CATÁLOGO COMPLETO DE FERRAMENTAS
// ============================================================================

export const TOOL_REGISTRY: ToolDeclaration[] = [
  // -------------------------------------------------------------------------
  // NAVEGAÇÃO E EXTRAÇÃO
  // -------------------------------------------------------------------------
  {
    name: 'navigate_and_extract',
    description: 'Abre URL com Playwright, aguarda selector, extrai conteúdo estruturado',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri', description: 'URL para navegar' },
        waitForSelector: { type: 'string', description: 'Selector CSS para aguardar' },
        extractMode: { type: 'string', enum: ['html', 'text', 'table', 'json'], default: 'text' },
        timeoutMs: { type: 'number', minimum: 1000, default: 30000 },
        userAgentProfile: { type: 'string', description: 'Perfil de User-Agent' },
        waitUntil: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle'], default: 'networkidle' }
      },
      required: ['url']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        html: { type: 'string' },
        text: { type: 'string' },
        table: { type: 'array' },
        error: { type: 'string' },
        metadata: { type: 'object' }
      }
    },
    auth: 'runtime-service-account',
    permissions: ['browser.open', 'network.request'],
    timeout: 60000,
    retries: 2,
    tags: ['navigation', 'extraction', 'core']
  },

  {
    name: 'click_element',
    description: 'Clica em elemento da página usando selector com fallback chain',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Selector CSS principal' },
        fallbackSelectors: { type: 'array', items: { type: 'string' }, description: 'Seletores alternativos' },
        waitForNavigation: { type: 'boolean', default: false },
        humanLike: { type: 'boolean', default: true, description: 'Simular comportamento humano' },
        timeoutMs: { type: 'number', default: 10000 }
      },
      required: ['selector']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        usedSelector: { type: 'string' },
        error: { type: 'string' }
      }
    },
    auth: 'runtime-service-account',
    permissions: ['browser.interact'],
    timeout: 15000,
    retries: 3,
    tags: ['interaction', 'core']
  },

  {
    name: 'fill_form',
    description: 'Preenche campos de formulário com dados estruturados',
    inputSchema: {
      type: 'object',
      properties: {
        fields: { 
          type: 'object',
          description: 'Mapa de selector -> valor'
        },
        submitSelector: { type: 'string', description: 'Selector do botão de submit' },
        humanLike: { type: 'boolean', default: true },
        clearBefore: { type: 'boolean', default: true }
      },
      required: ['fields']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        filledFields: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' }
      }
    },
    auth: 'runtime-service-account',
    permissions: ['browser.interact', 'form.fill'],
    timeout: 30000,
    retries: 2,
    tags: ['interaction', 'form']
  },

  {
    name: 'screenshot',
    description: 'Captura screenshot da página ou elemento específico',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Selector do elemento (opcional, full page se omitido)' },
        fullPage: { type: 'boolean', default: false },
        format: { type: 'string', enum: ['png', 'jpeg', 'webp'], default: 'png' },
        quality: { type: 'number', minimum: 0, maximum: 100, default: 80 }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        base64: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
        error: { type: 'string' }
      }
    },
    auth: 'runtime-service-account',
    permissions: ['browser.screenshot'],
    timeout: 10000,
    retries: 1,
    tags: ['capture', 'visual']
  },

  // -------------------------------------------------------------------------
  // CAPTCHA E ANTI-BOT
  // -------------------------------------------------------------------------
  {
    name: 'solve_captcha',
    description: 'Tenta resolver CAPTCHA automaticamente ou escala para HITL',
    inputSchema: {
      type: 'object',
      properties: {
        imageBase64: { type: 'string', description: 'Imagem do CAPTCHA em base64' },
        siteKey: { type: 'string', description: 'Site key para reCAPTCHA/hCaptcha' },
        url: { type: 'string', format: 'uri' },
        method: { type: 'string', enum: ['auto', 'service', 'hitl'], default: 'auto' },
        captchaType: { type: 'string', enum: ['image', 'recaptcha-v2', 'recaptcha-v3', 'hcaptcha', 'turnstile'] }
      },
      required: ['captchaType']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['solved', 'failed', 'escalated'] },
        solution: { type: 'string' },
        cost: { type: 'number' },
        method: { type: 'string' }
      }
    },
    auth: 'captcha-service-account',
    permissions: ['captcha.solve'],
    timeout: 120000,
    retries: 1,
    requiresApproval: false,
    costEstimate: '$0.001-0.003 per solve',
    tags: ['captcha', 'anti-bot']
  },

  // -------------------------------------------------------------------------
  // PERSISTÊNCIA E DADOS
  // -------------------------------------------------------------------------
  {
    name: 'persist_result',
    description: 'Persiste payload extraído no state store ou banco de dados',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Nome da collection/tabela' },
        payload: { type: 'object', description: 'Dados a persistir' },
        indexEmbeddings: { type: 'boolean', default: false, description: 'Gerar embeddings para RAG' },
        deduplicationKey: { type: 'string', description: 'Campo para evitar duplicatas' }
      },
      required: ['collection', 'payload']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error', 'duplicate'] },
        id: { type: 'string' },
        error: { type: 'string' }
      }
    },
    auth: 'db-service-account',
    permissions: ['db.write'],
    timeout: 10000,
    retries: 2,
    tags: ['persistence', 'data']
  },

  // -------------------------------------------------------------------------
  // BUSCA E APIs EXTERNAS
  // -------------------------------------------------------------------------
  {
    name: 'search_api',
    description: 'Consulta APIs de busca externas (Google, DuckDuckGo, etc)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Termo de busca' },
        engine: { type: 'string', enum: ['google', 'duckduckgo', 'bing'], default: 'duckduckgo' },
        maxResults: { type: 'number', minimum: 1, maximum: 50, default: 10 },
        language: { type: 'string', default: 'pt-BR' }
      },
      required: ['query']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        results: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              snippet: { type: 'string' }
            }
          }
        },
        error: { type: 'string' }
      }
    },
    auth: 'search-api-key',
    permissions: ['api.search'],
    timeout: 15000,
    retries: 2,
    tags: ['search', 'api']
  },

  // -------------------------------------------------------------------------
  // SESSÃO E ESTADO
  // -------------------------------------------------------------------------
  {
    name: 'manage_session',
    description: 'Gerencia sessões de browser (criar, restaurar, salvar cookies)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'restore', 'save', 'destroy'] },
        sessionId: { type: 'string' },
        cookies: { type: 'array', items: { type: 'object' } },
        localStorage: { type: 'object' }
      },
      required: ['action']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        sessionId: { type: 'string' },
        cookies: { type: 'array' },
        error: { type: 'string' }
      }
    },
    auth: 'runtime-service-account',
    permissions: ['session.manage'],
    timeout: 5000,
    retries: 1,
    tags: ['session', 'state']
  },

  // -------------------------------------------------------------------------
  // INTERCEPTAÇÃO E NETWORK
  // -------------------------------------------------------------------------
  {
    name: 'intercept_requests',
    description: 'Configura interceptação de requests/responses para análise',
    inputSchema: {
      type: 'object',
      properties: {
        patterns: { type: 'array', items: { type: 'string' }, description: 'URL patterns para interceptar' },
        action: { type: 'string', enum: ['log', 'block', 'modify'], default: 'log' },
        modifyHeaders: { type: 'object' },
        modifyBody: { type: 'string' }
      },
      required: ['patterns']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        interceptedCount: { type: 'number' },
        requests: { type: 'array' },
        error: { type: 'string' }
      }
    },
    auth: 'runtime-service-account',
    permissions: ['network.intercept'],
    timeout: 60000,
    retries: 1,
    tags: ['network', 'intercept']
  },

  // -------------------------------------------------------------------------
  // ESPERA E SINCRONIZAÇÃO
  // -------------------------------------------------------------------------
  {
    name: 'wait_for_condition',
    description: 'Aguarda condição específica na página',
    inputSchema: {
      type: 'object',
      properties: {
        condition: { type: 'string', enum: ['selector', 'navigation', 'network-idle', 'function'] },
        selector: { type: 'string' },
        url: { type: 'string' },
        jsFunction: { type: 'string', description: 'Função JS que retorna boolean' },
        timeoutMs: { type: 'number', default: 30000 }
      },
      required: ['condition']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'timeout', 'error'] },
        waitedMs: { type: 'number' },
        error: { type: 'string' }
      }
    },
    auth: 'runtime-service-account',
    permissions: ['browser.wait'],
    timeout: 60000,
    retries: 1,
    tags: ['wait', 'sync']
  },

  // -------------------------------------------------------------------------
  // DOWNLOAD E ARQUIVOS
  // -------------------------------------------------------------------------
  {
    name: 'download_file',
    description: 'Faz download de arquivo da página',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        triggerSelector: { type: 'string', description: 'Selector que dispara download' },
        expectedFilename: { type: 'string' },
        maxSizeBytes: { type: 'number', default: 52428800 } // 50MB
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        filename: { type: 'string' },
        sizeBytes: { type: 'number' },
        mimeType: { type: 'string' },
        path: { type: 'string' },
        error: { type: 'string' }
      }
    },
    auth: 'runtime-service-account',
    permissions: ['file.download'],
    timeout: 120000,
    retries: 2,
    tags: ['download', 'file']
  },

  // -------------------------------------------------------------------------
  // HUMAN-IN-THE-LOOP
  // -------------------------------------------------------------------------
  {
    name: 'escalate_to_human',
    description: 'Escala tarefa para aprovação ou intervenção humana',
    inputSchema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Motivo da escalação' },
        context: { type: 'object', description: 'Contexto da tarefa' },
        screenshotBase64: { type: 'string' },
        urgency: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
        timeout: { type: 'number', default: 300000 } // 5 min
      },
      required: ['reason']
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['approved', 'rejected', 'timeout'] },
        humanResponse: { type: 'string' },
        respondedBy: { type: 'string' },
        respondedAt: { type: 'string' }
      }
    },
    auth: 'hitl-service-account',
    permissions: ['hitl.escalate'],
    timeout: 600000,
    retries: 0,
    requiresApproval: false,
    tags: ['hitl', 'escalation']
  }
];


// ============================================================================
// CONFIGURAÇÕES DE STEALTH E ANTI-DETECÇÃO
// ============================================================================

export const DEFAULT_STEALTH_CONFIG: StealthConfig = {
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  ],
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 2560, height: 1440 }
  ],
  webglVendor: 'Google Inc. (Intel)',
  webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  timezone: 'America/Sao_Paulo',
  languages: ['pt-BR', 'pt', 'en-US', 'en'],
  plugins: [
    'Chrome PDF Plugin',
    'Chrome PDF Viewer',
    'Native Client'
  ],
  minDelay: 100,
  maxDelay: 500,
  mouseMovement: 'bezier-curve'
};

// ============================================================================
// POLÍTICAS DE SEGURANÇA
// ============================================================================

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  permissions: {
    'browser.open': true,
    'browser.interact': true,
    'browser.screenshot': true,
    'browser.wait': true,
    'network.request': true,
    'network.intercept': true,
    'form.fill': true,
    'session.manage': true,
    'captcha.solve': true,
    'api.search': true,
    'file.download': true,
    'db.write': false,  // Requer aprovação explícita
    'db.delete': false,
    'hitl.escalate': true
  },
  rateLimits: {
    toolCallsPerMinute: 50,
    tokensPerRun: 100000
  },
  requireApproval: [
    'db.write',
    'db.delete',
    'file.delete',
    'payment.execute',
    'email.send'
  ],
  secrets: {
    store: 'vault',
    rotationDays: 30
  },
  audit: {
    enabled: true,
    immutable: true,
    retention: '90d'
  }
};

// ============================================================================
// CLASSE PRINCIPAL DO ORQUESTRADOR
// ============================================================================

export class BrowserAutomationOrchestrator {
  private toolRegistry: Map<string, ToolDeclaration>;
  private stealthConfig: StealthConfig;
  private securityPolicy: SecurityPolicy;
  private eventLog: AutomationEvent[] = [];
  private memory: Map<string, unknown> = new Map();

  constructor(
    config?: Partial<{
      stealthConfig: StealthConfig;
      securityPolicy: SecurityPolicy;
      customTools: ToolDeclaration[];
    }>
  ) {
    // Inicializa Tool Registry
    this.toolRegistry = new Map();
    TOOL_REGISTRY.forEach(tool => this.toolRegistry.set(tool.name, tool));
    
    // Adiciona tools customizadas
    if (config?.customTools) {
      config.customTools.forEach(tool => this.toolRegistry.set(tool.name, tool));
    }

    this.stealthConfig = config?.stealthConfig || DEFAULT_STEALTH_CONFIG;
    this.securityPolicy = config?.securityPolicy || DEFAULT_SECURITY_POLICY;
  }

  // ---------------------------------------------------------------------------
  // TOOL REGISTRY METHODS
  // ---------------------------------------------------------------------------

  getTool(name: string): ToolDeclaration | undefined {
    return this.toolRegistry.get(name);
  }

  getAllTools(): ToolDeclaration[] {
    return Array.from(this.toolRegistry.values());
  }

  getToolsForGemini(): object[] {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }));
  }

  registerTool(tool: ToolDeclaration): void {
    this.toolRegistry.set(tool.name, tool);
  }

  // ---------------------------------------------------------------------------
  // VALIDATION METHODS
  // ---------------------------------------------------------------------------

  validateToolCall(request: ToolCallRequest): { valid: boolean; errors?: string[] } {
    const tool = this.getTool(request.name);
    if (!tool) {
      return { valid: false, errors: [`Tool '${request.name}' not found in registry`] };
    }

    const errors: string[] = [];
    const schema = tool.inputSchema;

    // Verifica campos required
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in request.args)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Verifica tipos básicos
    if (schema.properties) {
      for (const [key, value] of Object.entries(request.args)) {
        const propSchema = schema.properties[key];
        if (propSchema) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (propSchema.type !== actualType && value !== null && value !== undefined) {
            errors.push(`Field '${key}' expected ${propSchema.type}, got ${actualType}`);
          }
          
          // Verifica enum
          if (propSchema.enum && !propSchema.enum.includes(value as string)) {
            errors.push(`Field '${key}' must be one of: ${propSchema.enum.join(', ')}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  // ---------------------------------------------------------------------------
  // PERMISSION METHODS
  // ---------------------------------------------------------------------------

  checkPermission(permission: string): boolean {
    return this.securityPolicy.permissions[permission] === true;
  }

  requiresApproval(toolName: string): boolean {
    const tool = this.getTool(toolName);
    if (!tool) return true;
    
    return tool.requiresApproval === true || 
           tool.permissions.some(p => this.securityPolicy.requireApproval.includes(p));
  }

  // ---------------------------------------------------------------------------
  // EXECUTION METHODS
  // ---------------------------------------------------------------------------

  async executeToolCall(
    request: ToolCallRequest,
    adapter: (name: string, args: Record<string, unknown>) => Promise<unknown>
  ): Promise<ToolCallResult> {
    const runId = this.generateRunId();
    const startTime = Date.now();

    // Log request
    this.logEvent({
      timestamp: new Date().toISOString(),
      runId,
      phase: 'tool.call.request',
      tool: request.name,
      status: 'ok',
      latencyMs: 0,
      metadata: { args: request.args }
    });

    // Validate
    const validation = this.validateToolCall(request);
    if (!validation.valid) {
      this.logEvent({
        timestamp: new Date().toISOString(),
        runId,
        phase: 'tool.validation.error',
        tool: request.name,
        status: 'error',
        latencyMs: Date.now() - startTime,
        metadata: { errors: validation.errors }
      });
      return { status: 'error', error: validation.errors?.join('; ') };
    }

    // Check permissions
    const tool = this.getTool(request.name)!;
    for (const permission of tool.permissions) {
      if (!this.checkPermission(permission)) {
        return { status: 'error', error: `Permission denied: ${permission}` };
      }
    }

    // Check if requires approval
    if (this.requiresApproval(request.name)) {
      return { status: 'escalated', error: 'Requires human approval' };
    }

    // Execute with timeout and retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= tool.retries; attempt++) {
      try {
        const result = await Promise.race([
          adapter(request.name, request.args),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), tool.timeout)
          )
        ]);

        const latencyMs = Date.now() - startTime;
        this.logEvent({
          timestamp: new Date().toISOString(),
          runId,
          phase: 'tool.call.executed',
          tool: request.name,
          status: 'ok',
          latencyMs,
          metadata: { attempt }
        });

        return { status: 'ok', data: result, latencyMs };
      } catch (error) {
        lastError = error as Error;
        if (attempt < tool.retries) {
          // Exponential backoff
          await this.sleep(Math.min(1000 * Math.pow(2, attempt), 30000));
        }
      }
    }

    // All retries failed
    this.logEvent({
      timestamp: new Date().toISOString(),
      runId,
      phase: 'tool.call.failed',
      tool: request.name,
      status: 'error',
      latencyMs: Date.now() - startTime,
      metadata: { error: lastError?.message }
    });

    return { status: 'error', error: lastError?.message };
  }

  // ---------------------------------------------------------------------------
  // STEALTH METHODS
  // ---------------------------------------------------------------------------

  getRandomUserAgent(): string {
    const agents = this.stealthConfig.userAgents;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  getRandomViewport(): { width: number; height: number } {
    const viewports = this.stealthConfig.viewports;
    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  getRandomDelay(): number {
    const { minDelay, maxDelay } = this.stealthConfig;
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }

  // ---------------------------------------------------------------------------
  // MEMORY METHODS
  // ---------------------------------------------------------------------------

  setMemory(key: string, value: unknown): void {
    this.memory.set(key, value);
  }

  getMemory<T>(key: string): T | undefined {
    return this.memory.get(key) as T | undefined;
  }

  // ---------------------------------------------------------------------------
  // LOGGING METHODS
  // ---------------------------------------------------------------------------

  private logEvent(event: AutomationEvent): void {
    this.eventLog.push(event);
    // Em produção, enviar para sistema de observabilidade
    console.log(`[${event.phase}] ${event.tool}: ${event.status} (${event.latencyMs}ms)`);
  }

  getEventLog(): AutomationEvent[] {
    return [...this.eventLog];
  }

  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------

  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ---------------------------------------------------------------------------
  // GEMINI INTEGRATION HELPERS
  // ---------------------------------------------------------------------------

  buildSystemPrompt(): string {
    return BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST.systemPrompt;
  }

  parseToolCallFromResponse(response: string): ToolCallRequest | null {
    try {
      // Tenta extrair JSON do response
      const jsonMatch = response.match(/\{[\s\S]*"name"[\s\S]*"args"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name && parsed.args) {
          return { name: parsed.name, args: parsed.args };
        }
      }
    } catch {
      // Não é um tool call válido
    }
    return null;
  }

  formatToolResultForGemini(result: ToolCallResult): string {
    return JSON.stringify({
      status: result.status,
      data: result.data,
      error: result.error
    });
  }
}

// ============================================================================
// ADAPTERS DE EXEMPLO
// ============================================================================

export const ADAPTER_EXAMPLES = {
  playwright: `
// Adapter Playwright para navigate_and_extract
import { chromium } from 'playwright';

export async function navigateAndExtract(args: {
  url: string;
  waitForSelector?: string;
  extractMode?: 'html' | 'text' | 'table' | 'json';
  timeoutMs?: number;
}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: orchestrator.getRandomUserAgent(),
    viewport: orchestrator.getRandomViewport()
  });
  const page = await context.newPage();

  try {
    await page.goto(args.url, { 
      timeout: args.timeoutMs || 30000,
      waitUntil: 'networkidle'
    });

    if (args.waitForSelector) {
      await page.waitForSelector(args.waitForSelector, { 
        timeout: args.timeoutMs || 10000 
      });
    }

    let result: { status: string; [key: string]: unknown } = { 
      status: 'ok',
      metadata: { url: args.url, timestamp: new Date().toISOString() }
    };

    switch (args.extractMode) {
      case 'html':
        result.html = await page.content();
        break;
      case 'text':
        result.text = await page.innerText('body');
        break;
      case 'table':
        result.table = await page.$$eval('table tr', rows => 
          rows.map(row => 
            Array.from(row.querySelectorAll('td, th'))
              .map(cell => cell.textContent?.trim())
          )
        );
        break;
      case 'json':
      default:
        result.text = await page.innerText('body');
    }

    return result;
  } catch (error) {
    return { status: 'error', error: (error as Error).message };
  } finally {
    await browser.close();
  }
}
`,

  humanLikeClick: `
// Comportamento humano para clicks
async function humanLikeClick(page: Page, selector: string) {
  // 1. Scroll suave até o elemento
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, selector);

  // 2. Delay aleatório
  await sleep(randomBetween(200, 800));

  // 3. Obter posição do elemento
  const element = await page.$(selector);
  const box = await element?.boundingBox();
  if (!box) throw new Error('Element not found');

  // 4. Calcular ponto aleatório dentro do elemento
  const x = box.x + box.width * (0.3 + Math.random() * 0.4);
  const y = box.y + box.height * (0.3 + Math.random() * 0.4);

  // 5. Movimento do mouse em curva de Bezier
  await page.mouse.move(x, y, { steps: randomBetween(10, 25) });

  // 6. Hover antes de clicar
  await sleep(randomBetween(50, 150));

  // 7. Click com variação
  await page.mouse.click(x, y, { delay: randomBetween(50, 100) });
}
`
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default BROWSER_AUTOMATION_ORCHESTRATOR_MANIFEST;
