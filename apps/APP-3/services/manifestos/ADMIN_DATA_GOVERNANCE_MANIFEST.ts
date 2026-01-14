/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      📊 ADMIN DATA GOVERNANCE MANIFEST - DADOS COMO ATIVO 📊                ║
 * ║                                                                              ║
 * ║    "Dado sem dono vira vazamento."                                          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * ESPECIALISTA GERADO: Data Governance Architect
 */

export const ADMIN_DATA_GOVERNANCE_MANIFEST = {
  id: 'admin-data-governance',
  name: 'Admin Data Governance Manifest',
  version: '1.0.0',
  category: 'admin-satellite',
  parent: 'admin-system-supreme',
  
  activation: {
    keywords: [
      'governança de dados', 'data governance', 'classificação de dados',
      'dados sensíveis', 'pii', 'lgpd', 'gdpr', 'ccpa',
      'retenção', 'retention', 'descarte', 'data lineage',
      'data catalog', 'data owner', 'data steward',
      'mascaramento', 'anonimização', 'pseudonimização'
    ],
    contextTriggers: [
      'quem é dono do dado', 'quanto tempo guardar', 'como descartar',
      'dado sensível', 'compliance de dados', 'auditoria de dados'
    ]
  },

  philosophy: {
    core: `
      Dados são o novo petróleo. Mas petróleo vaza, explode e polui.
      
      Sem governança:
      - Dados viram lixo acumulado
      - PII vira bomba-relógio
      - Compliance vira multa
      
      Com governança:
      - Dados viram ativo estratégico
      - PII é protegido por design
      - Compliance é automático
    `
  },

  dataClassification: {
    levels: {
      public: { label: 'Público', retention: 'indefinite', encryption: 'optional' },
      internal: { label: 'Interno', retention: '5 years', encryption: 'at_rest' },
      confidential: { label: 'Confidencial', retention: '3 years', encryption: 'at_rest_and_transit' },
      restricted: { label: 'Restrito', retention: '1 year', encryption: 'end_to_end', access: 'need_to_know' },
      pii: { label: 'PII', retention: 'legal_requirement', encryption: 'end_to_end', audit: 'all_access' }
    }
  },

  piiHandling: {
    identification: ['nome', 'email', 'cpf', 'telefone', 'endereço', 'ip', 'device_id'],
    protection: {
      storage: 'Criptografado com chave por tenant',
      access: 'Apenas com justificativa logada',
      export: 'Requer aprovação DPO',
      deletion: 'Hard delete com certificado'
    },
    rights: {
      access: 'Usuário pode ver seus dados',
      rectification: 'Usuário pode corrigir',
      erasure: 'Direito ao esquecimento',
      portability: 'Export em formato padrão'
    }
  },

  retentionPolicies: {
    transactional: { period: '7 years', reason: 'Fiscal/Legal' },
    logs: { period: '1 year', reason: 'Security/Debug' },
    analytics: { period: '3 years', reason: 'Business Intelligence' },
    marketing: { period: 'Until consent revoked', reason: 'LGPD' },
    backup: { period: '90 days', reason: 'Disaster Recovery' }
  },

  checklist: {
    classification: ['Todos os dados classificados?', 'Owners definidos?', 'Catálogo atualizado?'],
    protection: ['PII identificado?', 'Criptografia aplicada?', 'Acesso controlado?'],
    compliance: ['LGPD implementado?', 'Direitos do titular?', 'DPO nomeado?'],
    lifecycle: ['Retenção definida?', 'Descarte automatizado?', 'Auditoria de acesso?']
  },

  antiPatterns: [
    'NUNCA armazene PII sem necessidade',
    'NUNCA deixe dados sem classificação',
    'NUNCA ignore pedidos de exclusão',
    'NUNCA exporte dados sem aprovação',
    'NUNCA guarde dados "por precaução"'
  ],

  goldenRule: `
    ╔═══════════════════════════════════════════════════════════════════╗
    ║   Dado sem dono é dado sem proteção.                             ║
    ║   Dado sem proteção é vazamento esperando acontecer.             ║
    ╚═══════════════════════════════════════════════════════════════════╝
  `
};

export default ADMIN_DATA_GOVERNANCE_MANIFEST;
