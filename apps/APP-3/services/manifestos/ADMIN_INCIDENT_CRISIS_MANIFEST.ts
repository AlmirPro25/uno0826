/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🚨 ADMIN INCIDENT & CRISIS MANIFEST - QUANDO TUDO DÁ ERRADO 🚨         ║
 * ║                                                                              ║
 * ║    "Crise não se resolve com código, se resolve com comando."               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * ESPECIALISTA GERADO: Incident Commander / Crisis Architect
 * 
 * Admin não é só operar no dia bom. Admin é comandar no caos.
 */

export const ADMIN_INCIDENT_CRISIS_MANIFEST = {
  id: 'admin-incident-crisis',
  name: 'Admin Incident & Crisis Manifest',
  version: '1.0.0',
  category: 'admin-satellite',
  parent: 'admin-system-supreme',
  
  activation: {
    keywords: [
      'incidente', 'incident', 'crise', 'crisis', 'outage',
      'war room', 'sala de guerra', 'escalação', 'escalation',
      'playbook', 'runbook', 'post-mortem', 'postmortem',
      'rollback', 'recovery', 'disaster recovery', 'dr',
      'comunicação de crise', 'status page', 'downtime'
    ],
    contextTriggers: [
      'sistema caiu', 'está fora do ar', 'emergência',
      'o que fazer quando', 'como comunicar', 'post-mortem'
    ]
  },

  philosophy: {
    core: `
      Incidentes são inevitáveis. Caos é opcional.
      
      A diferença entre empresa amadora e profissional:
      - Amadora: Pânico, culpa, improviso
      - Profissional: Processo, comando, aprendizado
      
      Você não sobe de nível evitando incidentes.
      Você sobe de nível respondendo bem a eles.
    `,
    principles: [
      'Processo > Heroísmo',
      'Comunicação > Velocidade',
      'Comando claro > Democracia',
      'Blameless > Culpa',
      'Aprendizado > Punição'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INCIDENT SEVERITY LEVELS
  // ═══════════════════════════════════════════════════════════════════════════
  
  severityLevels: {
    sev1: {
      name: 'Critical',
      description: 'Sistema completamente fora do ar ou perda de dados',
      response: '5 minutes',
      warRoom: true,
      externalComm: true,
      examples: ['Site down', 'Data breach', 'Payment system failure']
    },
    sev2: {
      name: 'High',
      description: 'Funcionalidade crítica degradada',
      response: '30 minutes',
      warRoom: 'if escalated',
      externalComm: 'if prolonged',
      examples: ['Checkout lento', 'Login intermitente', 'API errors > 10%']
    },
    sev3: {
      name: 'Medium',
      description: 'Funcionalidade não-crítica afetada',
      response: '4 hours',
      warRoom: false,
      externalComm: false,
      examples: ['Feature secundária quebrada', 'Performance degradada']
    },
    sev4: {
      name: 'Low',
      description: 'Issue menor, workaround disponível',
      response: '24 hours',
      warRoom: false,
      externalComm: false,
      examples: ['Bug visual', 'Erro em relatório']
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INCIDENT COMMAND STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════
  
  commandStructure: {
    incidentCommander: {
      role: 'Líder absoluto durante o incidente',
      responsibilities: [
        'Declarar início e fim do incidente',
        'Coordenar todos os esforços',
        'Tomar decisões finais',
        'Aprovar comunicações externas'
      ],
      authority: 'Pode requisitar qualquer recurso'
    },
    
    techLead: {
      role: 'Líder técnico da resolução',
      responsibilities: [
        'Diagnosticar causa raiz',
        'Coordenar engenheiros',
        'Propor e executar fixes',
        'Reportar status ao IC'
      ]
    },
    
    communicationsLead: {
      role: 'Responsável por toda comunicação',
      responsibilities: [
        'Atualizar status page',
        'Comunicar stakeholders internos',
        'Preparar comunicação externa',
        'Documentar timeline'
      ]
    },
    
    scribe: {
      role: 'Documentador oficial',
      responsibilities: [
        'Registrar todas as ações',
        'Manter timeline atualizada',
        'Capturar decisões e razões',
        'Preparar material para post-mortem'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYBOOKS
  // ═══════════════════════════════════════════════════════════════════════════
  
  playbooks: {
    siteDown: {
      name: 'Site Completamente Fora do Ar',
      steps: [
        { order: 1, action: 'Verificar status de CDN/DNS', owner: 'tech_lead' },
        { order: 2, action: 'Verificar status de cloud provider', owner: 'tech_lead' },
        { order: 3, action: 'Verificar deploys recentes', owner: 'tech_lead' },
        { order: 4, action: 'Ativar status page', owner: 'comms_lead' },
        { order: 5, action: 'Considerar rollback', owner: 'incident_commander' },
        { order: 6, action: 'Notificar stakeholders', owner: 'comms_lead' }
      ]
    },
    
    dataBreach: {
      name: 'Suspeita de Vazamento de Dados',
      steps: [
        { order: 1, action: 'Isolar sistemas afetados', owner: 'tech_lead' },
        { order: 2, action: 'Preservar evidências', owner: 'security' },
        { order: 3, action: 'Notificar jurídico', owner: 'incident_commander' },
        { order: 4, action: 'Avaliar escopo do vazamento', owner: 'security' },
        { order: 5, action: 'Preparar notificação LGPD (72h)', owner: 'legal' },
        { order: 6, action: 'Comunicar usuários afetados', owner: 'comms_lead' }
      ]
    },
    
    paymentFailure: {
      name: 'Sistema de Pagamentos Fora',
      steps: [
        { order: 1, action: 'Verificar status do gateway', owner: 'tech_lead' },
        { order: 2, action: 'Ativar gateway backup se disponível', owner: 'tech_lead' },
        { order: 3, action: 'Pausar campanhas de marketing', owner: 'comms_lead' },
        { order: 4, action: 'Comunicar suporte para preparar', owner: 'comms_lead' },
        { order: 5, action: 'Estimar impacto financeiro', owner: 'finops' }
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // POST-MORTEM (BLAMELESS)
  // ═══════════════════════════════════════════════════════════════════════════
  
  postMortem: {
    principle: 'Blameless - Foco em sistemas, não em pessoas',
    
    template: `
      ## Post-Mortem: [Título do Incidente]
      
      **Data:** [Data]
      **Duração:** [Início] - [Fim] ([X] horas)
      **Severidade:** [SEV1/2/3/4]
      **Incident Commander:** [Nome]
      
      ### Resumo Executivo
      [2-3 frases sobre o que aconteceu e impacto]
      
      ### Timeline
      | Hora | Evento |
      |------|--------|
      | HH:MM | Primeiro alerta |
      | HH:MM | IC declarado |
      | HH:MM | Causa identificada |
      | HH:MM | Fix aplicado |
      | HH:MM | Incidente encerrado |
      
      ### Impacto
      - Usuários afetados: [X]
      - Receita perdida: [R$ X]
      - Duração do impacto: [X minutos]
      
      ### Causa Raiz
      [Descrição técnica da causa raiz]
      
      ### O que funcionou bem
      - [Item 1]
      - [Item 2]
      
      ### O que pode melhorar
      - [Item 1]
      - [Item 2]
      
      ### Action Items
      | Item | Owner | Prazo | Status |
      |------|-------|-------|--------|
      | [Ação] | [Nome] | [Data] | [ ] |
    `,
    
    rules: [
      'Realizar em até 5 dias úteis',
      'Todos os envolvidos participam',
      'Foco em sistemas, não pessoas',
      'Action items com owner e prazo',
      'Compartilhar aprendizados com a empresa'
    ]
  },

  checklist: {
    preparation: ['Playbooks documentados?', 'Roles definidos?', 'Canais de comunicação?', 'Status page configurada?'],
    response: ['IC declarado?', 'War room ativo?', 'Timeline sendo documentada?', 'Comunicação fluindo?'],
    recovery: ['Causa raiz identificada?', 'Fix validado?', 'Rollback disponível?', 'Monitoramento intensificado?'],
    postIncident: ['Post-mortem agendado?', 'Action items definidos?', 'Aprendizados compartilhados?']
  },

  antiPatterns: [
    'NUNCA culpe indivíduos',
    'NUNCA pule o post-mortem',
    'NUNCA comunique sem fatos',
    'NUNCA deixe IC sem autoridade',
    'NUNCA improvise em crise'
  ],

  goldenRule: `
    ╔═══════════════════════════════════════════════════════════════════╗
    ║   Incidentes revelam a maturidade real da sua organização.       ║
    ║   Processo > Heroísmo. Sempre.                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
  `
};

export default ADMIN_INCIDENT_CRISIS_MANIFEST;
