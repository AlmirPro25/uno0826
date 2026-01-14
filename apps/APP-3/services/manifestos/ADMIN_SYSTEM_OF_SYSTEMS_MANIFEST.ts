/**
 * ADMIN SYSTEM OF SYSTEMS MANIFEST - O ORQUESTRADOR DOS MANIFESTOS
 * "Administrar o admin e o ultimo nivel."
 * ESPECIALISTA GERADO: Chief Systems Architect / Meta-Admin
 */

export const ADMIN_SYSTEM_OF_SYSTEMS_MANIFEST = {
  id: 'admin-system-of-systems',
  name: 'Admin System of Systems Manifest',
  version: '1.0.0',
  category: 'admin-meta',
  parent: null,
  
  activation: {
    keywords: [
      'sistema de sistemas', 'system of systems', 'meta-admin',
      'orquestrador', 'orchestrator', 'integracao admin',
      'conflito de autoridade', 'governanca geral',
      'arquitetura admin', 'admin architecture'
    ],
    contextTriggers: [
      'como integrar todos os admins', 'conflito entre sistemas',
      'visao geral do admin', 'arquitetura completa'
    ]
  },

  philosophy: {
    core: 'Administrar o admin e o ultimo nivel. Quando voce tem multiplos sistemas de administracao, voce precisa de um sistema para administra-los. Isso nao e burocracia - e necessidade.',
    principles: [
      'Cada manifesto e autonomo mas conectado',
      'Conflitos sao resolvidos por hierarquia clara',
      'Nenhum sistema opera em isolamento',
      'A soma e maior que as partes',
      'Meta-admin nao substitui, orquestra'
    ]
  },

  constellation: {
    description: 'A constelacao de manifestos de administracao',
    
    kernel: {
      id: 'admin-system-supreme',
      name: 'ADMIN SYSTEM MANIFEST',
      role: 'Nucleo central - principios fundamentais de admin',
      generates: 'Admin System Architect'
    },
    
    satellites: [
      {
        id: 'admin-governance',
        name: 'ADMIN GOVERNANCE MANIFEST',
        role: 'Governo, poder e responsabilidade',
        generates: 'Chief Governance Officer',
        connects: ['admin-iam', 'admin-ethics-power']
      },
      {
        id: 'admin-observability',
        name: 'ADMIN OBSERVABILITY MANIFEST',
        role: 'Ver, medir, entender o sistema vivo',
        generates: 'Observability & System Intelligence Engineer',
        connects: ['admin-incident-crisis', 'admin-finops']
      },
      {
        id: 'admin-incident-crisis',
        name: 'ADMIN INCIDENT & CRISIS MANIFEST',
        role: 'Quando tudo da errado',
        generates: 'Incident Commander / Crisis Architect',
        connects: ['admin-observability', 'admin-governance']
      },
      {
        id: 'admin-data-governance',
        name: 'ADMIN DATA GOVERNANCE MANIFEST',
        role: 'Dados como ativo, nao lixo',
        generates: 'Data Governance Architect',
        connects: ['admin-ethics-power', 'admin-governance']
      },
      {
        id: 'admin-finops',
        name: 'ADMIN FINOPS MANIFEST',
        role: 'O dinheiro invisivel',
        generates: 'FinOps & Revenue Control Architect',
        connects: ['admin-observability', 'admin-governance']
      },
      {
        id: 'admin-moderation-trust',
        name: 'ADMIN MODERATION & TRUST MANIFEST',
        role: 'Poder sobre pessoas',
        generates: 'Trust & Safety Architect',
        connects: ['admin-ethics-power', 'admin-governance']
      },
      {
        id: 'admin-iam',
        name: 'ADMIN IAM MANIFEST',
        role: 'Quem e quem de verdade',
        generates: 'Identity & Access Architect',
        connects: ['admin-governance', 'admin-ethics-power']
      },
      {
        id: 'admin-internal-tools',
        name: 'ADMIN INTERNAL TOOLS MANIFEST',
        role: 'Ferramentas internas sao produtos',
        generates: 'Internal Tools & Automation Architect',
        connects: ['admin-observability', 'admin-governance']
      },
      {
        id: 'admin-ethics-power',
        name: 'ADMIN ETHICS & POWER MANIFEST',
        role: 'A parte que ninguem quer escrever',
        generates: 'Ethical Systems Architect',
        connects: ['admin-governance', 'admin-moderation-trust', 'admin-data-governance']
      }
    ],
    
    diagram: `
      ┌─────────────────────────────────────────────────────────────────┐
      │              CONSTELACAO DE ADMIN MANIFESTOS                    │
      ├─────────────────────────────────────────────────────────────────┤
      │                                                                 │
      │                    ┌─────────────────┐                         │
      │                    │   GOVERNANCE    │                         │
      │                    │   (Poder)       │                         │
      │                    └────────┬────────┘                         │
      │                             │                                   │
      │     ┌───────────────────────┼───────────────────────┐          │
      │     │                       │                       │          │
      │     ▼                       ▼                       ▼          │
      │ ┌────────┐           ┌─────────────┐          ┌────────┐      │
      │ │  IAM   │           │   KERNEL    │          │ ETHICS │      │
      │ │(Quem)  │◄─────────►│   ADMIN     │◄────────►│(Limites)│     │
      │ └────────┘           │   SYSTEM    │          └────────┘      │
      │                      └──────┬──────┘                          │
      │                             │                                  │
      │     ┌───────────────────────┼───────────────────────┐         │
      │     │           │           │           │           │         │
      │     ▼           ▼           ▼           ▼           ▼         │
      │ ┌───────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
      │ │OBSERV │ │INCIDENT │ │  DATA   │ │ FINOPS  │ │MODERAT. │    │
      │ │(Ver)  │ │(Crise)  │ │(Dados)  │ │($$)     │ │(Pessoas)│    │
      │ └───────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
      │                             │                                  │
      │                             ▼                                  │
      │                      ┌─────────────┐                          │
      │                      │  INTERNAL   │                          │
      │                      │   TOOLS     │                          │
      │                      │(Ferramentas)│                          │
      │                      └─────────────┘                          │
      │                                                                │
      └─────────────────────────────────────────────────────────────────┘
    `
  },

  conflictResolution: {
    description: 'Como resolver conflitos entre manifestos',
    
    hierarchy: [
      '1. ETHICS - Limites morais sao inviolaveis',
      '2. GOVERNANCE - Regras de poder prevalecem',
      '3. SECURITY (IAM) - Seguranca sobre conveniencia',
      '4. DATA GOVERNANCE - Protecao de dados',
      '5. FINOPS - Sustentabilidade financeira',
      '6. OBSERVABILITY - Visibilidade do sistema',
      '7. INCIDENT - Resposta a crises',
      '8. MODERATION - Decisoes sobre usuarios',
      '9. INTERNAL TOOLS - Ferramentas operacionais'
    ],
    
    commonConflicts: {
      SPEED_VS_SECURITY: {
        conflict: 'Velocidade de operacao vs Seguranca',
        resolution: 'Seguranca prevalece, otimize o processo seguro',
        example: 'Dual approval pode ser assincrono, mas nao eliminado'
      },
      PRIVACY_VS_OBSERVABILITY: {
        conflict: 'Privacidade do usuario vs Necessidade de monitorar',
        resolution: 'Minimo necessario, anonimizacao quando possivel',
        example: 'Metricas agregadas ao inves de rastreamento individual'
      },
      AUTOMATION_VS_HUMAN: {
        conflict: 'Eficiencia de automacao vs Julgamento humano',
        resolution: 'Automacao para triagem, humano para decisao',
        example: 'IA filtra, humano decide em moderacao'
      },
      COST_VS_COMPLIANCE: {
        conflict: 'Reducao de custos vs Requisitos de compliance',
        resolution: 'Compliance nao e negociavel, otimize dentro dos limites',
        example: 'Retencao de logs pode ser otimizada, nao eliminada'
      }
    }
  },

  integrationPatterns: {
    description: 'Como os manifestos se comunicam',
    
    patterns: {
      EVENT_DRIVEN: {
        name: 'Eventos entre sistemas',
        description: 'Manifestos publicam eventos que outros consomem',
        example: 'IAM publica login_suspicious, Incident consome e escala'
      },
      SHARED_CONTEXT: {
        name: 'Contexto compartilhado',
        description: 'Informacoes comuns acessiveis a todos',
        example: 'User risk score disponivel para todos os manifestos'
      },
      ESCALATION_CHAIN: {
        name: 'Cadeia de escalacao',
        description: 'Problemas sobem na hierarquia',
        example: 'Moderation escala para Governance em casos graves'
      },
      AUDIT_AGGREGATION: {
        name: 'Agregacao de auditoria',
        description: 'Todos os logs fluem para sistema central',
        example: 'Observability agrega logs de todos os manifestos'
      }
    }
  },

  metaGovernance: {
    description: 'Governanca do proprio sistema de manifestos',
    
    rules: [
      'Novos manifestos precisam de sponsor de manifesto existente',
      'Mudancas em manifestos requerem revisao de impacto',
      'Conflitos nao resolvidos sobem para Chief Systems Architect',
      'Revisao anual de todos os manifestos',
      'Metricas de efetividade por manifesto'
    ],
    
    evolution: {
      description: 'Como o sistema evolui',
      process: [
        '1. Identificar gap ou problema',
        '2. Propor novo manifesto ou mudanca',
        '3. Revisao de impacto em outros manifestos',
        '4. Aprovacao por Governance',
        '5. Implementacao gradual',
        '6. Monitoramento de efetividade'
      ]
    }
  },

  templates: {
    manifestIntegration: `
interface ManifestIntegration {
  sourceManifest: string;
  targetManifest: string;
  integrationType: 'event' | 'query' | 'escalation' | 'audit';
  
  // Para eventos
  eventTypes?: string[];
  
  // Para queries
  dataShared?: string[];
  
  // Para escalacao
  escalationTriggers?: string[];
  
  // Configuracao
  enabled: boolean;
  priority: number;
}
`,
    conflictLog: `
interface ConflictLog {
  id: string;
  timestamp: Date;
  
  manifests: string[];
  conflictType: string;
  description: string;
  
  resolution: {
    decision: string;
    justification: string;
    decidedBy: string;
    hierarchyApplied: string;
  };
  
  impact: {
    affectedSystems: string[];
    changes: string[];
  };
}
`
  },

  checklist: {
    architecture: [
      'Todos os manifestos mapeados?',
      'Conexoes entre manifestos definidas?',
      'Hierarquia de resolucao clara?',
      'Eventos entre sistemas configurados?'
    ],
    governance: [
      'Processo de mudanca definido?',
      'Revisao periodica agendada?',
      'Metricas de efetividade?',
      'Escalacao clara?'
    ],
    operation: [
      'Logs agregados funcionando?',
      'Alertas cross-system?',
      'Dashboard unificado?',
      'Runbooks integrados?'
    ]
  },

  antiPatterns: [
    'NUNCA crie manifesto sem conexao com outros',
    'NUNCA ignore conflitos entre manifestos',
    'NUNCA deixe hierarquia ambigua',
    'NUNCA opere manifestos em silos',
    'NUNCA mude um manifesto sem avaliar impacto',
    'NUNCA deixe o meta-admin virar burocracia'
  ],

  goldenRule: 'Administrar o admin e o ultimo nivel. A constelacao de manifestos so funciona se cada estrela conhece seu lugar e sua conexao com as outras. O meta-admin nao e mais um nivel de burocracia - e o sistema nervoso que conecta tudo.'
};

export default ADMIN_SYSTEM_OF_SYSTEMS_MANIFEST;
