/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🔐 ADMIN ACCESS & IDENTITY MANIFEST - QUEM É QUEM 🔐                   ║
 * ║                                                                              ║
 * ║    "Identidade é o novo perímetro."                                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * ESPECIALISTA GERADO: Identity & Access Architect (IAM)
 */

export const ADMIN_IAM_MANIFEST = {
  id: 'admin-iam',
  name: 'Admin Access & Identity Manifest',
  version: '1.0.0',
  category: 'admin-satellite',
  parent: 'admin-system-supreme',
  
  activation: {
    keywords: [
      'iam', 'identity', 'identidade', 'access management',
      'sso', 'single sign-on', 'saml', 'oidc', 'oauth',
      'pam', 'privileged access', 'acesso privilegiado',
      'device trust', 'confiança de dispositivo',
      'session', 'sessão', 'mfa', '2fa', 'passwordless'
    ],
    contextTriggers: [
      'quem é esse usuário', 'verificar identidade', 'gerenciar acesso',
      'sessão suspeita', 'dispositivo novo'
    ]
  },

  philosophy: {
    core: `
      No mundo Zero Trust, identidade é tudo.
      
      Não basta saber QUEM é. Precisa saber:
      - De ONDE está acessando
      - Com QUAL dispositivo
      - Em QUAL contexto
      - Com QUAL risco
      
      Identidade não é binária. É um espectro de confiança.
    `
  },

  identityLifecycle: {
    stages: {
      provisioning: {
        description: 'Criação de identidade',
        controls: ['Verificação de identidade', 'Aprovação de manager', 'Baseline de acesso']
      },
      active: {
        description: 'Identidade em uso',
        controls: ['MFA obrigatório', 'Session management', 'Continuous authentication']
      },
      modification: {
        description: 'Mudança de acesso',
        controls: ['Aprovação para novos acessos', 'Recertificação periódica']
      },
      deprovisioning: {
        description: 'Remoção de identidade',
        controls: ['Revogação imediata', 'Transferência de ownership', 'Audit trail']
      }
    }
  },

  deviceTrust: {
    levels: {
      untrusted: { access: 'none', description: 'Dispositivo desconhecido' },
      known: { access: 'limited', description: 'Dispositivo registrado mas não verificado' },
      trusted: { access: 'standard', description: 'Dispositivo verificado e compliant' },
      managed: { access: 'full', description: 'Dispositivo gerenciado pela empresa' }
    },
    signals: ['MDM enrollment', 'OS version', 'Encryption status', 'Antivirus', 'Last patch']
  },

  sessionRiskScoring: {
    factors: [
      { factor: 'new_device', weight: 30 },
      { factor: 'new_location', weight: 20 },
      { factor: 'impossible_travel', weight: 50 },
      { factor: 'unusual_time', weight: 10 },
      { factor: 'vpn_proxy', weight: 15 },
      { factor: 'failed_mfa', weight: 40 }
    ],
    actions: {
      low: 'Allow',
      medium: 'Step-up authentication',
      high: 'Block and alert',
      critical: 'Block, alert, and investigate'
    }
  },

  checklist: {
    identity: ['SSO implementado?', 'MFA obrigatório?', 'Passwordless disponível?'],
    access: ['RBAC/ABAC definido?', 'Least privilege aplicado?', 'JIT access disponível?'],
    device: ['Device trust implementado?', 'MDM integrado?', 'Compliance verificado?'],
    session: ['Risk scoring ativo?', 'Session timeout configurado?', 'Concurrent sessions limitadas?']
  },

  antiPatterns: [
    'NUNCA confie apenas em senha',
    'NUNCA ignore contexto de acesso',
    'NUNCA permita sessões eternas',
    'NUNCA trate todos os dispositivos igual',
    'NUNCA ignore sinais de risco'
  ],

  goldenRule: `
    ╔═══════════════════════════════════════════════════════════════════╗
    ║   Identidade não é um checkbox.                                  ║
    ║   É um espectro contínuo de confiança.                          ║
    ╚═══════════════════════════════════════════════════════════════════╝
  `
};

export default ADMIN_IAM_MANIFEST;
