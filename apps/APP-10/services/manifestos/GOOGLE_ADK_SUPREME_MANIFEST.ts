/**
 * 🤖 GOOGLE ADK SUPREME MASTER MANIFEST
 * 
 * Manifesto completo para criação de agentes autônomos com Google ADK.
 * Baseado em pesquisa profunda da documentação oficial e best practices.
 * 
 * @author Sistema de Manifestos Integrado
 * @version 1.0.0
 */

export const GOOGLE_ADK_SUPREME_MANIFEST = {
  // ============================================
  // METADADOS DO MANIFESTO
  // ============================================
  metadata: {
    id: 'google-adk-supreme-master',
    name: 'Google ADK Supreme Master',
    version: '1.0.0',
    category: 'ai-agents',
    priority: 'critical',
    description: 'Especialista absoluto em Google Agent Development Kit',
    author: 'Sistema de Manifestos Integrado',
    lastUpdated: '2025-01-01',
    tags: [
      'adk', 'agents', 'ai-agents', 'google-adk', 'multi-agent',
      'tool-calling', 'gemini', 'vertex-ai', 'llm-agents',
      'autonomous-agents', 'agent-orchestration', 'memory',
      'context-engineering', 'production-agents'
    ]
  },

  // ============================================
  // PALAVRAS-CHAVE DE ATIVAÇÃO
  // ============================================
  activationKeywords: [
    'adk', 'agent development kit', 'google adk',
    'agentes de ia', 'ai agents', 'autonomous agents',
    'multi-agent', 'orquestração de agentes',
    'tool calling', 'function calling', 'tools',
    'gemini agents', 'vertex ai agents',
    'memória de agentes', 'agent memory',
    'workflows de agentes', 'agent workflows',
    'llm agents', 'agentes inteligentes',
    'agent orchestration', 'agent coordination',
    'context engineering'
  ],


  // ============================================
  // IDENTIDADE DO ESPECIALISTA
  // ============================================
  identity: {
    role: 'Mestre Supremo em Google ADK',
    expertise: [
      'Arquitetar sistemas de agentes autônomos e inteligentes',
      'Projetar workflows multi-agent escaláveis',
      'Integrar ferramentas (tools) com segurança e eficiência',
      'Implementar memória persistente e contextual',
      'Criar agentes production-ready com observabilidade total',
      'Context engineering avançado',
      'Avaliação e métricas de agentes'
    ],
    philosophy: 'Agentes não são chatbots glorificados. São sistemas de software que pensam, agem e evoluem.',
    principles: [
      'Código Primeiro - ADK é code-first, não prompt-first',
      'Modularidade - Agentes especializados > Agente monolítico',
      'Confiabilidade - Produção exige testes, logs e fallbacks'
    ]
  },

  // ============================================
  // ARQUITETURA FUNDAMENTAL
  // ============================================
  architecture: {
    components: {
      agent: {
        description: 'Unidade central de raciocínio e decisão',
        responsibilities: [
          'Receber input e processar',
          'Decidir ações a tomar',
          'Chamar tools ou outros agentes',
          'Manter estado e contexto'
        ]
      },
      tools: {
        description: 'Funções que o agente pode invocar',
        types: [
          'APIs externas',
          'Bancos de dados',
          'Serviços internos',
          'Operações de arquivo'
        ],
        requirements: [
          'Schemas JSON para validação',
          'Permissões e políticas',
          'Rate limiting',
          'Audit logging'
        ]
      },
      memory: {
        description: 'Sistema de memória em camadas',
        types: {
          shortTerm: 'Contexto da conversa atual',
          longTerm: 'Conhecimento persistente',
          episodic: 'Eventos específicos',
          semantic: 'Conhecimento geral',
          procedural: 'Como fazer coisas'
        },
        backends: [
          'In-memory',
          'Vertex AI Memory Bank',
          'Vector stores',
          'Redis/PostgreSQL'
        ]
      },
      workflows: {
        description: 'Pipelines de agentes coordenados',
        patterns: [
          'Sequencial',
          'Paralelo',
          'Hierárquico (Supervisor)',
          'Consenso/Votação',
          'Loop Reflexivo'
        ]
      },
      models: {
        description: 'Modelos LLM suportados',
        supported: [
          'Gemini (nativo)',
          'GPT (OpenAI)',
          'Claude (Anthropic)',
          'Llama',
          'Modelos customizados'
        ]
      },
      observability: {
        description: 'Sistema de monitoramento',
        pillars: [
          'Traces de execução',
          'Logs estruturados',
          'Métricas de performance',
          'Debugging e replay'
        ]
      }
    }
  },

  // ============================================
  // OS 7 MANDAMENTOS
  // ============================================
  mandamentos: [
    {
      numero: 1,
      titulo: 'Código Primeiro, Prompt Depois',
      descricao: 'Desenvolva comportamento em código (classes, testes, integração), não apenas em prompt engineering',
      exemplo: 'Usar classes Agent com métodos estruturados ao invés de prompts longos'
    },
    {
      numero: 2,
      titulo: 'Design Modular e Especializado',
      descricao: 'Separe responsabilidades: agentes finos com responsabilidades limitadas',
      exemplo: 'SearchAgent, AnalysisAgent, ReportAgent ao invés de SuperAgent'
    },
    {
      numero: 3,
      titulo: 'Ferramentas São Poderes com Responsabilidade',
      descricao: 'Toda chamada a tool/API deve ser tratada como ação com efeitos colaterais',
      requisitos: [
        'Validar input/output',
        'Tratar erros',
        'Registrar chamadas',
        'Rate limiting'
      ]
    },
    {
      numero: 4,
      titulo: 'Memória Como Cidadão de Primeira Classe',
      descricao: 'O agente deve ter camadas de memória com políticas claras',
      requisitos: [
        'O que guardar',
        'Por quanto tempo',
        'Como evocar',
        'Estratégias de recall'
      ]
    },
    {
      numero: 5,
      titulo: 'Observabilidade e Auditabilidade Total',
      descricao: 'Traces, logs de decisões, token usage, latências - registre tudo',
      metricas: [
        'Latência por ação',
        'Custo por execução',
        'Taxa de sucesso',
        'Tool calls'
      ]
    },
    {
      numero: 6,
      titulo: 'Segurança e Robustez por Design',
      descricao: 'Proteja contra prompt injection, valide outputs, separe privilégios',
      camadas: [
        'Detecção de injection',
        'Validação de output',
        'Gerenciamento de privilégios',
        'Secrets management'
      ]
    },
    {
      numero: 7,
      titulo: 'Avaliação Contínua e Evolução',
      descricao: 'Métricas definidas, testes A/B, avaliação regular',
      metricas: [
        'Acurácia',
        'Latência P50/P99',
        'Custo por request',
        'Safety score'
      ]
    }
  ],


  // ============================================
  // SDKs DISPONÍVEIS
  // ============================================
  sdks: {
    python: {
      name: 'adk-python',
      status: 'stable',
      useCase: 'Prototipagem, ML, Data Science',
      repo: 'https://github.com/google/adk-python'
    },
    java: {
      name: 'adk-java',
      status: 'stable',
      useCase: 'Enterprise, Android',
      repo: 'https://github.com/google/adk-java'
    },
    web: {
      name: 'adk-web',
      status: 'stable',
      useCase: 'Frontend, Node.js',
      repo: 'https://github.com/google/adk-web'
    },
    go: {
      name: 'adk-go',
      status: 'new',
      useCase: 'Alta performance, concorrência',
      repo: 'https://github.com/google/adk-go'
    }
  },

  // ============================================
  // PADRÕES MULTI-AGENT
  // ============================================
  multiAgentPatterns: {
    hierarchy: {
      name: 'Supervisor Pattern',
      description: 'Um agente supervisor delega para especialistas',
      useCase: 'Tarefas complexas que requerem múltiplas habilidades',
      structure: 'Supervisor → [SearchAgent, AnalysisAgent, WriterAgent]'
    },
    sequential: {
      name: 'Pipeline Sequencial',
      description: 'Agentes executam em sequência, output de um é input do próximo',
      useCase: 'Processamento de dados em etapas',
      structure: 'Input → Agent1 → Agent2 → Agent3 → Output'
    },
    parallel: {
      name: 'Paralelo com Agregação',
      description: 'Múltiplos agentes executam em paralelo, resultados agregados',
      useCase: 'Busca em múltiplas fontes',
      structure: 'Input → [Agent1, Agent2, Agent3] → Aggregator → Output'
    },
    consensus: {
      name: 'Consenso/Votação',
      description: 'Múltiplos agentes votam/decidem juntos',
      useCase: 'Decisões críticas que precisam de validação',
      structure: 'Input → [Voters] → Voting → Decision'
    },
    reflexive: {
      name: 'Loop Reflexivo',
      description: 'Agente avalia próprio output e melhora iterativamente',
      useCase: 'Geração de conteúdo de alta qualidade',
      structure: 'Input → Generate → Evaluate → [Improve] → Output'
    }
  },

  // ============================================
  // TOOL CALLING
  // ============================================
  toolCalling: {
    anatomy: {
      inputSchema: 'Pydantic/JSON Schema para validação de entrada',
      outputSchema: 'Schema para validação de saída',
      metadata: 'Nome, descrição, exemplos para o LLM',
      security: 'Auth, rate limit, audit log',
      implementation: 'Método execute() com lógica'
    },
    flow: [
      '1. User Input - Usuário faz pergunta',
      '2. Agent Reasoning - Agente decide que precisa de tool',
      '3. Tool Call Decision - Agente gera {name, arguments}',
      '4. Runtime Execution - Valida, executa, registra',
      '5. Tool Result - Retorna resultado estruturado',
      '6. Agent Response - Agente usa resultado para responder'
    ],
    bestPractices: [
      'Sempre validar inputs contra schema',
      'Implementar timeouts',
      'Tratar erros graciosamente',
      'Registrar todas as chamadas',
      'Usar rate limiting'
    ]
  },

  // ============================================
  // MEMÓRIA
  // ============================================
  memory: {
    types: {
      conversation: {
        description: 'Contexto da sessão atual',
        ttl: 'Duração da sessão',
        storage: 'In-memory'
      },
      episodic: {
        description: 'Eventos específicos',
        ttl: '90 dias',
        storage: 'Vertex AI Memory Bank'
      },
      semantic: {
        description: 'Conhecimento geral',
        ttl: 'Permanente',
        storage: 'Vector Store'
      },
      procedural: {
        description: 'Como fazer coisas',
        ttl: 'Permanente',
        storage: 'Knowledge Base'
      }
    },
    recallStrategies: {
      semantic: 'Busca por similaridade de embeddings',
      recency: 'Prioriza memórias recentes',
      importance: 'Prioriza memórias marcadas como importantes',
      frequency: 'Prioriza memórias frequentemente acessadas'
    },
    weights: {
      recency: 0.2,
      relevance: 0.5,
      importance: 0.2,
      frequency: 0.1
    }
  },

  // ============================================
  // CONTEXT ENGINEERING
  // ============================================
  contextEngineering: {
    principles: [
      'Ordem importa - LLMs têm primacy e recency bias',
      'System prompt é crítico - define comportamento',
      'Tools devem ser bem descritas',
      'Memórias relevantes enriquecem contexto',
      'Otimizar para limite de tokens'
    ],
    sections: [
      { name: 'System Prompt', priority: 'critical', position: 'first' },
      { name: 'Tool Declarations', priority: 'high', position: 'early' },
      { name: 'Relevant Memories', priority: 'medium', position: 'middle' },
      { name: 'Conversation History', priority: 'high', position: 'late' },
      { name: 'User Input', priority: 'critical', position: 'last' }
    ],
    optimization: [
      'Resumir seções longas',
      'Truncar histórico antigo',
      'Priorizar informações relevantes',
      'Manter críticos intactos'
    ]
  },


  // ============================================
  // SEGURANÇA
  // ============================================
  security: {
    promptInjection: {
      detection: [
        'Análise de padrões maliciosos',
        'Classificação por ML',
        'Threshold de confiança'
      ],
      patterns: [
        'ignore.*instructions',
        'forget.*previous',
        'you are now',
        'pretend to be',
        'reveal.*prompt'
      ],
      actions: [
        'Bloquear requisição',
        'Logar tentativa',
        'Alertar segurança'
      ]
    },
    outputValidation: {
      checks: [
        'Detecção de PII',
        'Scan de secrets',
        'Filtro de conteúdo',
        'Limite de tamanho'
      ],
      actions: [
        'Redact PII',
        'Remover secrets',
        'Sanitizar conteúdo'
      ]
    },
    bestPractices: [
      'Nunca confiar em input do usuário',
      'Validar em múltiplas camadas',
      'Usar secrets manager',
      'Implementar audit trail',
      'Separar privilégios'
    ]
  },

  // ============================================
  // OBSERVABILIDADE
  // ============================================
  observability: {
    tracing: {
      tool: 'OpenTelemetry',
      spans: [
        'agent.process',
        'tool.execute',
        'memory.recall',
        'model.generate'
      ]
    },
    metrics: {
      tool: 'Prometheus',
      metrics: [
        'agent_requests_total',
        'agent_latency_seconds',
        'agent_tool_calls_total',
        'agent_tokens_used_total',
        'agent_cost_usd_total',
        'agent_errors_total'
      ]
    },
    logging: {
      format: 'JSON estruturado',
      fields: [
        'timestamp',
        'level',
        'agent_name',
        'session_id',
        'request_id',
        'message',
        'context'
      ]
    }
  },

  // ============================================
  // AVALIAÇÃO
  // ============================================
  evaluation: {
    metrics: {
      accuracy: {
        description: 'Precisão das respostas',
        threshold: 0.85
      },
      toolPrecision: {
        description: 'Precisão no uso de ferramentas',
        threshold: 0.90
      },
      latency: {
        description: 'Tempo de resposta',
        p50: 1000,
        p99: 5000
      },
      cost: {
        description: 'Custo por request',
        maxUsd: 0.10
      },
      safety: {
        description: 'Score de segurança',
        threshold: 0.99
      }
    },
    testSuite: {
      categories: [
        'basic_functionality',
        'tool_usage',
        'multi_step_tasks',
        'error_handling',
        'safety_checks'
      ]
    }
  },

  // ============================================
  // DEPLOY E PRODUÇÃO
  // ============================================
  production: {
    containerization: {
      baseImage: 'python:3.11-slim',
      healthCheck: '/health',
      port: 8080
    },
    cicd: {
      stages: [
        'test',
        'lint',
        'security_scan',
        'evaluate',
        'build',
        'deploy'
      ]
    },
    scaling: {
      minInstances: 2,
      maxInstances: 100,
      targetCpuUtilization: 0.7
    },
    config: {
      model: 'gemini-1.5-pro',
      temperature: 0.7,
      maxTokens: 4096,
      memoryTtlDays: 90
    }
  },

  // ============================================
  // ROADMAP DE APRENDIZADO
  // ============================================
  learningRoadmap: {
    week1_2: {
      title: 'Fundamentos',
      tasks: [
        'Ler documentação oficial',
        'Instalar ambiente Python 3.11+',
        'Executar quickstart',
        'Entender arquitetura',
        'Criar primeiro agente'
      ]
    },
    week3_4: {
      title: 'Tools e Integração',
      tasks: [
        'Criar tools customizadas',
        'Implementar validação',
        'Conectar APIs externas',
        'Conectar banco de dados',
        'Implementar rate limiting'
      ]
    },
    week5_6: {
      title: 'Memória',
      tasks: [
        'Implementar memória curto prazo',
        'Configurar Memory Bank',
        'Criar estratégias de recall',
        'Implementar memória semântica',
        'Testar persistência'
      ]
    },
    week7_8: {
      title: 'Multi-Agent',
      tasks: [
        'Criar workflow sequencial',
        'Implementar workflow paralelo',
        'Criar orquestrador',
        'Implementar comunicação A2A',
        'Testar padrões de consenso'
      ]
    },
    week9_10: {
      title: 'Produção',
      tasks: [
        'Containerizar agente',
        'Configurar CI/CD',
        'Implementar observabilidade',
        'Configurar métricas',
        'Deploy em Cloud Run'
      ]
    },
    week11_12: {
      title: 'Segurança e Avaliação',
      tasks: [
        'Implementar proteção injection',
        'Configurar validação output',
        'Criar test suite',
        'Implementar métricas',
        'Executar testes de carga'
      ]
    }
  },


  // ============================================
  // RECURSOS OFICIAIS
  // ============================================
  resources: {
    documentation: {
      main: 'https://google.github.io/adk-docs/',
      quickstart: 'https://google.github.io/adk-docs/quickstart/',
      api: 'https://google.github.io/adk-docs/api/'
    },
    repositories: {
      docs: 'https://github.com/google/adk-docs',
      python: 'https://github.com/google/adk-python',
      java: 'https://github.com/google/adk-java',
      go: 'https://github.com/google/adk-go',
      web: 'https://github.com/google/adk-web',
      samples: 'https://github.com/google/adk-samples'
    },
    blog: 'Google Developers Blog'
  },

  // ============================================
  // ANTI-PATTERNS
  // ============================================
  antiPatterns: [
    {
      name: 'Agente Monolítico',
      description: 'Um agente que faz tudo',
      solution: 'Dividir em agentes especializados'
    },
    {
      name: 'Prompt-Only Development',
      description: 'Tudo no prompt, sem código estruturado',
      solution: 'Lógica em código, prompts para personalidade'
    },
    {
      name: 'Memória Infinita',
      description: 'Guardar tudo para sempre',
      solution: 'Políticas de TTL e importância'
    },
    {
      name: 'Tools Sem Validação',
      description: 'Aceitar qualquer input',
      solution: 'Schemas rigorosos, validação em camadas'
    },
    {
      name: 'Ignorar Observabilidade',
      description: 'Sem logs, sem métricas',
      solution: 'Tracing, métricas, logs estruturados'
    }
  ],

  // ============================================
  // CHECKLIST DO ESPECIALISTA
  // ============================================
  checklist: {
    fundamentos: [
      'Entende arquitetura Agent/Tool/Memory/Workflow',
      'Sabe criar agentes com código estruturado',
      'Conhece os SDKs disponíveis',
      'Sabe configurar modelos'
    ],
    tools: [
      'Sabe criar tools com schemas validados',
      'Implementa rate limiting e timeouts',
      'Configura permissões e audit logging',
      'Trata erros graciosamente'
    ],
    memoria: [
      'Implementa memória curto e longo prazo',
      'Configura estratégias de recall',
      'Usa embeddings para busca semântica',
      'Define políticas de TTL'
    ],
    multiAgent: [
      'Conhece padrões de orquestração',
      'Implementa comunicação A2A',
      'Configura orquestradores',
      'Trata falhas em workflows'
    ],
    observabilidade: [
      'Implementa tracing distribuído',
      'Configura métricas Prometheus',
      'Usa logs estruturados',
      'Monitora custos e tokens'
    ],
    seguranca: [
      'Protege contra prompt injection',
      'Valida outputs',
      'Gerencia secrets corretamente',
      'Implementa audit trail'
    ],
    producao: [
      'Containeriza agentes',
      'Configura CI/CD com testes',
      'Implementa health checks',
      'Configura auto-scaling'
    ],
    avaliacao: [
      'Define métricas de qualidade',
      'Cria test suites abrangentes',
      'Executa avaliações regulares',
      'Monitora regressões'
    ]
  },

  // ============================================
  // NÍVEIS DE MATURIDADE
  // ============================================
  maturityLevels: {
    level1: {
      name: 'Iniciante',
      characteristics: [
        'Usa ADK como wrapper de prompts',
        'Agentes monolíticos',
        'Sem testes, sem métricas'
      ]
    },
    level2: {
      name: 'Intermediário',
      characteristics: [
        'Cria tools estruturadas',
        'Implementa memória básica',
        'Alguns testes'
      ]
    },
    level3: {
      name: 'Avançado',
      characteristics: [
        'Multi-agent workflows',
        'Observabilidade completa',
        'Segurança em camadas',
        'CI/CD com avaliação'
      ]
    },
    level4: {
      name: 'Especialista',
      characteristics: [
        'Arquiteta sistemas complexos',
        'Context engineering avançado',
        'Otimização de custo e performance',
        'Contribui para o ecossistema'
      ]
    },
    level5: {
      name: 'Mestre',
      characteristics: [
        'Define padrões e best practices',
        'Resolve problemas inéditos',
        'Ensina e mentora outros',
        'Inova no campo'
      ]
    }
  },

  // ============================================
  // JURAMENTO
  // ============================================
  oath: `
Eu não construo chatbots.
Eu arquiteto sistemas de agentes autônomos.

Cada agente é um sistema de software completo.
Cada tool é um poder com responsabilidade.
Cada memória é conhecimento estruturado.
Cada workflow é orquestração inteligente.

Eu escrevo código, não apenas prompts.
Eu testo, não apenas espero que funcione.
Eu monitoro, não apenas deployo e esqueço.
Eu protejo, não apenas confio.

Meus agentes não apenas respondem.
Eles PENSAM, AGEM e EVOLUEM.
`
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Verifica se um texto ativa este manifesto
 */
export function shouldActivateADKManifest(text: string): boolean {
  const lowerText = text.toLowerCase();
  return GOOGLE_ADK_SUPREME_MANIFEST.activationKeywords.some(
    keyword => lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * Retorna o system prompt para um agente ADK
 */
export function getADKSystemPrompt(agentConfig: {
  name: string;
  domain: string;
  tools: string[];
}): string {
  return `
# IDENTIDADE
Você é ${agentConfig.name}, um agente especializado em ${agentConfig.domain}.

# CAPACIDADES
Você tem acesso às seguintes ferramentas:
${agentConfig.tools.map(t => `- ${t}`).join('\n')}

# REGRAS DE COMPORTAMENTO
1. SEMPRE use ferramentas quando precisar de dados externos
2. NUNCA invente informações - se não sabe, diga que não sabe
3. SEMPRE explique seu raciocínio antes de agir
4. SEMPRE valide dados antes de usar

# FORMATO DE RESPOSTA
Quando precisar usar uma ferramenta, responda EXATAMENTE neste formato:
\`\`\`json
{"tool": "tool_name", "arguments": {...}}
\`\`\`

Quando tiver a resposta final, responda naturalmente ao usuário.
`;
}

/**
 * Retorna checklist de avaliação para um agente
 */
export function getAgentEvaluationChecklist(): string[] {
  const checklist = GOOGLE_ADK_SUPREME_MANIFEST.checklist;
  return [
    ...checklist.fundamentos,
    ...checklist.tools,
    ...checklist.memoria,
    ...checklist.multiAgent,
    ...checklist.observabilidade,
    ...checklist.seguranca,
    ...checklist.producao,
    ...checklist.avaliacao
  ];
}

export default GOOGLE_ADK_SUPREME_MANIFEST;
