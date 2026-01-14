// ============================================================================
// ADMIN_MODERATION_TRUST_MANIFEST.ts
// Trust & Safety Supreme Architect
// O Guardiao da Comunidade e da Justica Digital
// ============================================================================

export const ADMIN_MODERATION_TRUST_MANIFEST = {
  id: 'admin-moderation-trust',
  name: 'Admin Moderation & Trust Safety Manifest',
  version: '2.0.0',
  category: 'admin-satellite',
  parent: 'admin-system-supreme',

  activation: {
    keywords: [
      'moderacao', 'moderation', 'trust and safety', 't&s',
      'ban', 'banimento', 'shadow ban', 'suspensao', 'suspension',
      'apelacao', 'appeal', 'revisao', 'review', 'contestacao',
      'vies', 'bias', 'fairness', 'justica algoritmica',
      'content moderation', 'report', 'denuncia', 'flag',
      'community guidelines', 'terms of service', 'tos violation',
      'harassment', 'spam', 'abuse', 'hate speech', 'misinformation'
    ],
    contextTriggers: [
      'como moderar conteudo',
      'banir usuario',
      'processo de apelacao',
      'auditoria de vies',
      'criar sistema de denuncia',
      'implementar trust and safety'
    ]
  },

  philosophy: {
    core: 'Moderar e exercer poder moral com codigo. Cada decisao afeta uma vida real.',
    principles: [
      'Transparencia nas regras - usuarios devem saber o que e proibido',
      'Consistencia nas decisoes - casos similares, resultados similares',
      'Direito de defesa - todo usuario pode contestar',
      'Proporcionalidade - punicao deve ser proporcional a violacao',
      'Auditoria de vies - verificar se ha discriminacao sistematica',
      'Bem-estar dos moderadores - proteger quem protege a comunidade',
      'Contexto importa - considerar cultura, idioma, intencao'
    ],
    warnings: [
      'Moderacao sem transparencia e censura',
      'Automacao total sem revisao humana e perigosa',
      'Shadow ban deve ser ultimo recurso, nao primeiro'
    ]
  },

  moderationLevels: {
    L0_WARNING: {
      name: 'Aviso Educativo',
      description: 'Notificacao sem restricao, apenas orientacao',
      requiresApproval: false,
      reversible: true,
      duration: 'Permanente no historico',
      useCase: 'Primeira violacao leve, usuario de boa-fe',
      template: 'Seu conteudo foi sinalizado. Revise nossas diretrizes.'
    },
    L1_CONTENT_REMOVAL: {
      name: 'Remocao de Conteudo',
      description: 'Remove conteudo especifico, usuario mantem acesso',
      requiresApproval: false,
      reversible: true,
      duration: 'Conteudo removido permanentemente',
      useCase: 'Conteudo viola regras mas usuario nao e reincidente',
      template: 'Seu conteudo foi removido por violar [REGRA].'
    },
    L2_TEMPORARY_RESTRICTION: {
      name: 'Restricao Temporaria',
      description: 'Limita funcionalidades (postar, comentar) temporariamente',
      requiresApproval: false,
      reversible: true,
      duration: '24h a 7 dias',
      useCase: 'Reincidencia em violacoes leves',
      template: 'Sua conta esta temporariamente restrita por [DURACAO].'
    },
    L3_TEMPORARY_BAN: {
      name: 'Suspensao Temporaria',
      description: 'Acesso totalmente bloqueado por periodo definido',
      requiresApproval: true,
      approvers: ['moderator_senior', 'trust_safety_lead'],
      reversible: true,
      duration: '7 a 30 dias',
      useCase: 'Violacoes graves ou reincidencia em restricoes',
      template: 'Sua conta foi suspensa por [DURACAO] devido a [MOTIVO].'
    },
    L4_PERMANENT_BAN: {
      name: 'Banimento Permanente',
      description: 'Remocao definitiva da plataforma',
      requiresApproval: true,
      approvers: ['trust_safety_lead', 'legal_team'],
      reversible: false,
      duration: 'Permanente',
      useCase: 'Violacoes gravissimas, ameacas, conteudo ilegal',
      template: 'Sua conta foi permanentemente removida.',
      legalConsiderations: ['Preservar dados para compliance', 'Notificar autoridades se necessario']
    },
    L5_SHADOW_BAN: {
      name: 'Shadow Ban',
      description: 'Restricao invisivel - usuario nao sabe que esta limitado',
      requiresApproval: true,
      approvers: ['trust_safety_director'],
      reversible: true,
      duration: 'Variavel',
      useCase: 'Spam automatizado, bots, manipulacao coordenada',
      ethicalWarning: 'USAR COM EXTREMA CAUTELA - questoes eticas serias',
      template: null,
      conditions: [
        'Apenas para comportamento claramente automatizado',
        'Nunca para opiniao ou discurso legitimo',
        'Revisao obrigatoria a cada 7 dias'
      ]
    }
  },

  violationCategories: {
    SPAM: { severity: 'low', autoDetectable: true, defaultAction: 'L1' },
    HARASSMENT: { severity: 'high', autoDetectable: 'partial', defaultAction: 'L3' },
    HATE_SPEECH: { severity: 'critical', autoDetectable: 'partial', defaultAction: 'L4' },
    MISINFORMATION: { severity: 'medium', autoDetectable: false, defaultAction: 'L1' },
    ILLEGAL_CONTENT: { severity: 'critical', autoDetectable: 'partial', defaultAction: 'L4', reportToAuthorities: true },
    IMPERSONATION: { severity: 'high', autoDetectable: false, defaultAction: 'L3' },
    SELF_HARM: { severity: 'critical', autoDetectable: 'partial', defaultAction: 'special', provideResources: true },
    COPYRIGHT: { severity: 'medium', autoDetectable: true, defaultAction: 'L1', dmcaProcess: true }
  },

  appealProcess: {
    stages: [
      { name: 'SUBMISSION', description: 'Usuario submete apelacao', timeLimit: '30 dias apos acao' },
      { name: 'INITIAL_REVIEW', description: 'Moderador diferente revisa', timeLimit: '48 horas' },
      { name: 'ESCALATION', description: 'Se necessario, escala para senior', timeLimit: '72 horas' },
      { name: 'FINAL_DECISION', description: 'Decisao final comunicada', timeLimit: '7 dias total' }
    ],
    outcomes: {
      UPHELD: 'Decisao original mantida',
      REDUCED: 'Punicao reduzida',
      REVERSED: 'Decisao revertida completamente',
      ESCALATED: 'Enviado para revisao adicional'
    },
    requirements: [
      'Apelacao deve ser revisada por moderador DIFERENTE do original',
      'Usuario deve receber explicacao clara do resultado',
      'Metricas de apelacao devem ser monitoradas para detectar problemas'
    ],
    userRights: [
      'Direito de saber o motivo da acao',
      'Direito de apresentar contexto adicional',
      'Direito de resposta em tempo razoavel'
    ]
  },

  biasAuditing: {
    metrics: [
      { name: 'Paridade Demografica', description: 'Taxas de acao similares entre grupos', threshold: '< 20% diferenca' },
      { name: 'Taxa de Apelacoes', description: '% de acoes que sao apeladas', healthy: '5-15%' },
      { name: 'Taxa de Reversao', description: '% de apelacoes revertidas', healthy: '< 10%' },
      { name: 'Consistencia Inter-Moderador', description: 'Acordo entre moderadores no mesmo caso', threshold: '> 80%' },
      { name: 'Tempo de Resolucao', description: 'Tempo medio para resolver caso', target: '< 24h' }
    ],
    frequency: 'Semanal para metricas, Mensal para auditoria completa',
    actions: [
      'Retreinamento de moderadores com baixa consistencia',
      'Ajuste de algoritmos com vies detectado',
      'Revisao de politicas se taxa de reversao alta',
      'Investigacao se disparidade demografica detectada'
    ],
    externalAudit: {
      frequency: 'Anual',
      scope: 'Auditoria independente de vies e fairness',
      transparency: 'Publicar resumo dos resultados'
    }
  },

  automationGuidelines: {
    autoActions: {
      allowed: ['Deteccao de spam obvio', 'Hash matching de conteudo ilegal conhecido', 'Rate limiting'],
      requiresReview: ['Hate speech', 'Harassment', 'Misinformation'],
      neverAutomate: ['Banimentos permanentes', 'Acoes em contas verificadas', 'Contexto cultural complexo']
    },
    mlModels: {
      requirements: [
        'Treinar com dados diversos e representativos',
        'Testar para vies antes de deploy',
        'Monitorar performance por grupo demografico',
        'Manter humano no loop para decisoes finais'
      ],
      metrics: {
        precision: '> 95% para acoes automaticas',
        recall: 'Balancear com falsos positivos',
        fairness: 'Equalizar taxas entre grupos'
      }
    }
  },

  moderatorWellbeing: {
    exposure: {
      limits: 'Maximo 4 horas de conteudo grafico por dia',
      rotation: 'Rotacionar entre tipos de conteudo',
      breaks: 'Pausas obrigatorias a cada 2 horas'
    },
    support: {
      psychological: 'Acesso a psicologo especializado',
      debriefing: 'Sessoes semanais de debriefing',
      training: 'Treinamento em resiliencia e autocuidado'
    },
    tools: {
      blur: 'Blur automatico de imagens graficas',
      audio: 'Transcricao ao inves de audio direto',
      context: 'Mostrar contexto antes de conteudo'
    }
  },

  legalCompliance: {
    dataRetention: {
      moderationLogs: '7 anos',
      appealRecords: '7 anos',
      removedContent: '90 dias (para apelacoes)',
      userCommunications: '3 anos'
    },
    reporting: {
      CSAM: 'Reportar imediatamente ao NCMEC/autoridades',
      terrorism: 'Reportar conforme legislacao local',
      threats: 'Avaliar e reportar se credivel'
    },
    transparency: {
      report: 'Publicar relatorio de transparencia semestral',
      metrics: 'Numero de acoes por categoria, taxas de apelacao, tempo de resposta'
    }
  },

  templates: {
    warningEmail: 'Seu conteudo em [LOCAL] foi sinalizado por violar [REGRA]. Revise nossas diretrizes em [LINK].',
    removalNotice: 'Removemos seu conteudo por violar [REGRA]. Voce pode apelar em [LINK].',
    suspensionNotice: 'Sua conta foi suspensa por [DURACAO] devido a [MOTIVO]. Apele em [LINK].',
    banNotice: 'Sua conta foi permanentemente removida por [MOTIVO]. Esta decisao e final.',
    appealReceived: 'Recebemos sua apelacao. Responderemos em ate [PRAZO].',
    appealResult: 'Sua apelacao foi [RESULTADO]. [EXPLICACAO].'
  },

  checklist: {
    policies: [
      'Regras da comunidade publicadas e claras?',
      'Exemplos de violacoes documentados?',
      'Processo de apelacao documentado e acessivel?',
      'Politica de privacidade atualizada?'
    ],
    process: [
      'Niveis de moderacao definidos?',
      'Matriz de escalacao clara?',
      'Aprovacao dual para acoes graves?',
      'SLA de resposta definido?'
    ],
    fairness: [
      'Auditoria de vies implementada?',
      'Metricas de consistencia monitoradas?',
      'Revisao aleatoria de decisoes?',
      'Diversidade na equipe de moderacao?'
    ],
    support: [
      'Moderadores treinados adequadamente?',
      'Suporte psicologico disponivel?',
      'Rotacao de conteudo sensivel?',
      'Ferramentas de protecao implementadas?'
    ],
    legal: [
      'Compliance com LGPD/GDPR?',
      'Processo de report para autoridades?',
      'Retencao de dados conforme lei?',
      'Relatorio de transparencia publicado?'
    ]
  },

  antiPatterns: [
    'NUNCA modere sem documentar o motivo especifico',
    'NUNCA aplique punicao maxima na primeira violacao (exceto casos criticos)',
    'NUNCA negue o direito de apelacao',
    'NUNCA use shadow ban como primeira opcao',
    'NUNCA automatize banimentos permanentes',
    'NUNCA ignore o contexto cultural e linguistico',
    'NUNCA exponha moderadores a conteudo grafico sem protecao',
    'NUNCA tome decisoes baseadas em volume de denuncias apenas',
    'NUNCA trate todos os usuarios como culpados ate prova contraria'
  ],

  goldenRule: 'Moderar e exercer poder moral com codigo. Cada decisao afeta uma pessoa real. Use esse poder com responsabilidade, transparencia e humanidade.'
};

export default ADMIN_MODERATION_TRUST_MANIFEST;
