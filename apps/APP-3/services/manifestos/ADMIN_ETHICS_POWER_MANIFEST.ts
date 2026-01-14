/**
 * ADMIN ETHICS & POWER MANIFEST - A PARTE QUE NINGUEM QUER ESCREVER
 * "Todo sistema de admin e um sistema de poder."
 * ESPECIALISTA GERADO: Ethical Systems Architect
 */

export const ADMIN_ETHICS_POWER_MANIFEST = {
  id: 'admin-ethics-power',
  name: 'Admin Ethics & Power Manifest',
  version: '1.0.0',
  category: 'admin-satellite',
  parent: 'admin-system-supreme',
  
  activation: {
    keywords: [
      'etica', 'ethics', 'poder', 'power', 'abuso',
      'vigilancia', 'surveillance', 'privacidade', 'privacy',
      'dark patterns', 'manipulacao', 'controle',
      'limites morais', 'responsabilidade', 'accountability',
      'transparencia', 'consentimento', 'consent'
    ],
    contextTriggers: [
      'limites do admin', 'o que nao fazer', 'abuso de poder',
      'vigilancia de usuarios', 'etica em sistemas'
    ]
  },

  philosophy: {
    core: 'Todo sistema de admin e um sistema de poder. Poder sem limites e tirania. Poder sem transparencia e abuso. Poder sem responsabilidade e corrupcao.',
    principles: [
      'Poder minimo necessario',
      'Transparencia maxima possivel',
      'Responsabilidade proporcional ao poder',
      'Limites explicitos e auditaveis',
      'Consentimento informado'
    ],
    warning: 'Este manifesto existe porque a maioria dos sistemas ignora essas questoes ate ser tarde demais.'
  },

  powerAbuse: {
    description: 'Formas de abuso de poder em sistemas admin',
    
    types: {
      EXCESSIVE_ACCESS: {
        name: 'Acesso Excessivo',
        description: 'Admin tem acesso a mais dados do que precisa',
        examples: ['Ver senhas', 'Ler mensagens privadas sem motivo', 'Acessar dados financeiros'],
        prevention: 'Principio do minimo privilegio, logs de acesso, justificativa obrigatoria'
      },
      SELECTIVE_ENFORCEMENT: {
        name: 'Aplicacao Seletiva',
        description: 'Regras aplicadas de forma desigual',
        examples: ['Punir uns e nao outros', 'Favorecer amigos', 'Perseguir desafetos'],
        prevention: 'Auditoria de vies, revisao por pares, metricas de consistencia'
      },
      SURVEILLANCE_CREEP: {
        name: 'Expansao de Vigilancia',
        description: 'Monitoramento alem do necessario',
        examples: ['Rastrear localizacao sem necessidade', 'Monitorar comportamento off-platform'],
        prevention: 'Limites explicitos, revisao periodica, consentimento'
      },
      DATA_WEAPONIZATION: {
        name: 'Armamentizacao de Dados',
        description: 'Usar dados contra usuarios',
        examples: ['Chantagear com historico', 'Vazar dados de desafetos'],
        prevention: 'Criptografia, acesso auditado, separacao de funcoes'
      }
    }
  },

  surveillanceLimits: {
    description: 'O que voce PODE e NAO PODE monitorar',
    
    acceptable: {
      description: 'Monitoramento legitimo',
      examples: [
        'Logs de acoes publicas na plataforma',
        'Metricas agregadas de uso',
        'Deteccao de fraude em transacoes',
        'Violacoes de termos de servico'
      ],
      requirements: ['Documentado em termos', 'Proposito claro', 'Retencao limitada']
    },
    
    questionable: {
      description: 'Zona cinzenta - requer justificativa forte',
      examples: [
        'Leitura de mensagens privadas',
        'Rastreamento de localizacao',
        'Analise de padroes de comportamento',
        'Correlacao com dados externos'
      ],
      requirements: ['Consentimento explicito', 'Caso de uso especifico', 'Auditoria externa']
    },
    
    prohibited: {
      description: 'NUNCA faca isso',
      examples: [
        'Monitorar sem qualquer justificativa',
        'Compartilhar dados com terceiros sem consentimento',
        'Usar dados para manipulacao',
        'Reter dados alem do necessario',
        'Criar perfis psicologicos sem consentimento'
      ]
    }
  },

  darkPatterns: {
    description: 'Padroes manipulativos a evitar em admin',
    
    patterns: {
      HIDDEN_COSTS: {
        name: 'Custos Ocultos',
        description: 'Esconder consequencias de acoes',
        example: 'Deletar conta sem avisar que perde dados',
        fix: 'Sempre mostrar consequencias antes de confirmar'
      },
      FORCED_CONTINUITY: {
        name: 'Continuidade Forcada',
        description: 'Dificultar cancelamento',
        example: 'Esconder opcao de cancelar assinatura',
        fix: 'Cancelamento tao facil quanto assinatura'
      },
      PRIVACY_ZUCKERING: {
        name: 'Zuckering de Privacidade',
        description: 'Enganar sobre coleta de dados',
        example: 'Coletar mais dados do que o usuario pensa',
        fix: 'Transparencia total sobre coleta'
      },
      CONFIRMSHAMING: {
        name: 'Confirmshaming',
        description: 'Envergonhar usuario por escolha',
        example: 'Nao quero economizar dinheiro como opcao de cancelar',
        fix: 'Opcoes neutras e respeitosas'
      },
      ROACH_MOTEL: {
        name: 'Roach Motel',
        description: 'Facil entrar, dificil sair',
        example: 'Cadastro em 1 clique, exclusao em 10 passos',
        fix: 'Simetria de esforco'
      }
    }
  },

  moralLimits: {
    description: 'Limites que NUNCA devem ser cruzados',
    
    absoluteLimits: [
      'NUNCA use dados para discriminar',
      'NUNCA venda dados sem consentimento explicito',
      'NUNCA manipule usuarios para beneficio proprio',
      'NUNCA retenha dados alem do necessario',
      'NUNCA negue acesso aos proprios dados',
      'NUNCA puna sem possibilidade de defesa',
      'NUNCA use posicao para ganho pessoal'
    ],
    
    ethicalQuestions: {
      description: 'Perguntas a fazer antes de implementar feature',
      questions: [
        'Eu usaria isso se fosse o usuario?',
        'Isso respeita a autonomia do usuario?',
        'Isso e transparente sobre o que faz?',
        'Isso pode ser usado para prejudicar alguem?',
        'Isso sobreviveria a um vazamento publico?',
        'Isso e proporcional ao problema que resolve?'
      ]
    }
  },

  accountability: {
    description: 'Responsabilizacao por acoes de admin',
    
    mechanisms: {
      AUDIT_TRAIL: {
        name: 'Trilha de Auditoria',
        description: 'Toda acao e registrada e rastreavel',
        implementation: 'Logs imutaveis, quem/quando/porque'
      },
      PEER_REVIEW: {
        name: 'Revisao por Pares',
        description: 'Acoes criticas revisadas por outro admin',
        implementation: 'Dual approval para acoes de alto impacto'
      },
      EXTERNAL_AUDIT: {
        name: 'Auditoria Externa',
        description: 'Revisao periodica por entidade independente',
        implementation: 'Auditoria anual, relatorio publico'
      },
      WHISTLEBLOWER: {
        name: 'Canal de Denuncia',
        description: 'Forma segura de reportar abusos',
        implementation: 'Canal anonimo, protecao ao denunciante'
      }
    }
  },

  templates: {
    ethicsReview: `
interface EthicsReview {
  featureId: string;
  reviewedBy: string;
  reviewedAt: Date;
  
  questions: {
    respectsAutonomy: boolean;
    isTransparent: boolean;
    couldHarm: boolean;
    survivesLeakTest: boolean;
    isProportional: boolean;
  };
  
  concerns: string[];
  mitigations: string[];
  
  decision: 'approved' | 'needs_changes' | 'rejected';
  justification: string;
}
`,
    powerAudit: `
interface PowerAudit {
  adminId: string;
  period: { start: Date; end: Date };
  
  accessPatterns: {
    sensitiveDataAccess: number;
    unusualHoursAccess: number;
    bulkOperations: number;
  };
  
  decisions: {
    total: number;
    appealed: number;
    reversed: number;
    consistencyScore: number;
  };
  
  flags: string[];
  recommendations: string[];
}
`
  },

  checklist: {
    design: [
      'Feature respeita autonomia do usuario?',
      'Coleta minima de dados?',
      'Transparente sobre o que faz?',
      'Facil de entender e controlar?'
    ],
    implementation: [
      'Logs de auditoria completos?',
      'Acesso restrito ao necessario?',
      'Revisao por pares para acoes criticas?',
      'Canal de denuncia disponivel?'
    ],
    operation: [
      'Auditorias periodicas?',
      'Metricas de abuso monitoradas?',
      'Treinamento de etica para admins?',
      'Processo de escalacao claro?'
    ]
  },

  antiPatterns: [
    'NUNCA colete dados so porque pode',
    'NUNCA monitore sem proposito claro',
    'NUNCA use dark patterns',
    'NUNCA dificulte exercicio de direitos',
    'NUNCA ignore denuncias de abuso',
    'NUNCA trate usuarios como produto',
    'NUNCA priorize metricas sobre pessoas'
  ],

  goldenRule: 'Todo sistema de admin e um sistema de poder. A diferenca entre ferramenta e arma esta em quem controla e como. Se voce nao pode explicar publicamente o que seu sistema faz, voce nao deveria estar fazendo.'
};

export default ADMIN_ETHICS_POWER_MANIFEST;
