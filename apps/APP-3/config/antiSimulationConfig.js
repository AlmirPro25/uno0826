/**
 * Configuração do Sistema Anti-Simulação
 * 
 * Este arquivo permite personalizar o comportamento do sistema anti-simulação
 * para garantir que o código gerado seja 100% funcional e pronto para produção.
 */

module.exports = {
  /**
   * Configurações gerais do sistema anti-simulação
   */
  general: {
    // Ativa ou desativa o sistema anti-simulação
    enabled: true,
    
    // Nível de rigor na detecção de simulações (1-10)
    // 1: Básico - Detecta apenas simulações óbvias
    // 5: Moderado - Equilíbrio entre detecção e falsos positivos
    // 10: Rigoroso - Detecta até mesmo simulações sutis
    strictnessLevel: 8,
    
    // Regenera automaticamente o código quando simulações são detectadas
    autoRegenerate: true,
    
    // Número máximo de tentativas de regeneração antes de solicitar intervenção manual
    maxRegenerationAttempts: 3,
    
    // Pontuação mínima de qualidade para aceitar o código gerado (0-100)
    minimumQualityScore: 85
  },
  
  /**
   * Configurações de detecção de simulações
   */
  simulationDetection: {
    // Detecta placeholders e comentários TODO/FIXME
    detectPlaceholders: true,
    
    // Detecta funções vazias ou incompletas
    detectIncompleteCode: true,
    
    // Detecta simulações de segurança (autenticação, autorização, etc.)
    detectSecuritySimulations: true,
    
    // Detecta simulações de APIs (chamadas de API falsas ou incompletas)
    detectApiSimulations: true,
    
    // Padrões personalizados para detecção de simulações (expressões regulares)
    customPatterns: [
      // Detecta comentários que indicam código incompleto
      '(?i)(todo|fixme|implement|mock|fake|dummy|placeholder)',
      
      // Detecta funções vazias ou que retornam valores fixos
      '(?i)function\\s+\\w+\\s*\\(.*\\)\\s*{\\s*(return\\s+(["\'].*["\']|\\{.*\\}|\\[.*\\]|true|false|null|undefined|\\d+)\\s*;?)?\\s*}',
      
      // Detecta simulações de autenticação
      '(?i)(fake|mock|dummy|simulated)\\s+(auth|authentication|login|user)',
      
      // Detecta simulações de APIs
      '(?i)(fake|mock|dummy|simulated)\\s+(api|service|endpoint|request|response)'
    ]
  },
  
  /**
   * Configurações de integração de APIs
   */
  apiIntegration: {
    // Força a integração de APIs reais em vez de simulações
    forceRealApiIntegration: true,
    
    // APIs que devem ser integradas com base no tipo de projeto
    requiredApis: {
      // APIs obrigatórias para todos os tipos de projeto
      all: [
        'database' // Integração com banco de dados (Prisma)
      ],
      
      // APIs específicas para projetos de e-commerce
      ecommerce: [
        'payment', // Processamento de pagamentos (Stripe)
        'upload', // Upload de imagens (Cloudinary)
        'email' // Envio de emails (Nodemailer)
      ],
      
      // APIs específicas para projetos de blog
      blog: [
        'upload', // Upload de imagens (Cloudinary)
        'email' // Envio de emails (Nodemailer)
      ],
      
      // APIs específicas para projetos de rede social
      social: [
        'upload', // Upload de imagens e vídeos (Cloudinary)
        'realtime', // Notificações em tempo real (Socket.io)
        'email' // Envio de emails (Nodemailer)
      ]
    },
    
    // Mapeamento de APIs para implementações específicas
    apiImplementations: {
      'payment': 'stripe',
      'upload': 'cloudinary',
      'email': 'nodemailer',
      'database': 'prisma',
      'realtime': 'socket.io',
      'authentication': 'jwt+bcrypt'
    }
  },
  
  /**
   * Configurações de segurança
   */
  security: {
    // Força a implementação de medidas de segurança
    forceSecurityImplementation: true,
    
    // Medidas de segurança obrigatórias
    requiredSecurityMeasures: [
      'authentication', // Autenticação de usuários
      'authorization', // Autorização baseada em papéis/permissões
      'input-validation', // Validação de entrada de dados
      'xss-protection', // Proteção contra Cross-Site Scripting
      'csrf-protection', // Proteção contra Cross-Site Request Forgery
      'sql-injection-protection', // Proteção contra injeção SQL
      'rate-limiting', // Limitação de taxa para prevenir ataques de força bruta
      'secure-headers' // Cabeçalhos HTTP seguros
    ]
  },
  
  /**
   * Configurações de qualidade de código
   */
  codeQuality: {
    // Força a implementação de código de alta qualidade
    forceHighQualityCode: true,
    
    // Métricas de qualidade de código
    qualityMetrics: {
      // Ausência de simulações (0-100)
      noSimulation: {
        weight: 25,
        threshold: 90
      },
      
      // Integração de APIs (0-100)
      apiIntegration: {
        weight: 20,
        threshold: 85
      },
      
      // Implementação de segurança (0-100)
      securityImplementation: {
        weight: 20,
        threshold: 85
      },
      
      // Tratamento de erros (0-100)
      errorHandling: {
        weight: 10,
        threshold: 80
      },
      
      // Validação de dados (0-100)
      dataValidation: {
        weight: 10,
        threshold: 80
      },
      
      // Documentação (0-100)
      documentation: {
        weight: 5,
        threshold: 70
      },
      
      // Configuração automática (0-100)
      autoConfiguration: {
        weight: 10,
        threshold: 80
      }
    }
  },
  
  /**
   * Configurações de configuração automática
   */
  autoConfiguration: {
    // Força a implementação de configuração automática
    forceAutoConfiguration: true,
    
    // Gera automaticamente arquivos de exemplo para configuração
    generateExampleFiles: true,
    
    // Configurações que devem ser automatizadas
    requiredConfigurations: [
      'env-variables', // Variáveis de ambiente (.env)
      'api-keys', // Chaves de API
      'database', // Configuração de banco de dados
      'authentication', // Configuração de autenticação
      'file-upload', // Configuração de upload de arquivos
      'email', // Configuração de envio de emails
      'payment' // Configuração de processamento de pagamentos
    ]
  },
  
  /**
   * Configurações específicas para diferentes tipos de projeto
   */
  projectTypes: {
    // Configurações para projetos de e-commerce
    ecommerce: {
      simulationDetection: {
        strictnessLevel: 9,
        customPatterns: [
          '(?i)(fake|mock|dummy)\\s+(product|cart|order|payment|checkout)'
        ]
      },
      requiredFeatures: [
        'product-catalog',
        'shopping-cart',
        'checkout',
        'payment-processing',
        'order-management',
        'user-accounts'
      ]
    },
    
    // Configurações para projetos de blog
    blog: {
      simulationDetection: {
        strictnessLevel: 7,
        customPatterns: [
          '(?i)(fake|mock|dummy)\\s+(post|article|comment|author)'
        ]
      },
      requiredFeatures: [
        'post-management',
        'comment-system',
        'user-accounts',
        'categories-tags',
        'search'
      ]
    },
    
    // Configurações para projetos de rede social
    social: {
      simulationDetection: {
        strictnessLevel: 8,
        customPatterns: [
          '(?i)(fake|mock|dummy)\\s+(user|post|comment|friend|follow|notification)'
        ]
      },
      requiredFeatures: [
        'user-profiles',
        'posts-feed',
        'comments',
        'friend-follow',
        'notifications',
        'messaging'
      ]
    }
  },
  
  /**
   * Mensagens personalizadas para o sistema anti-simulação
   */
  messages: {
    // Mensagem exibida quando uma simulação é detectada
    simulationDetected: 'SIMULAÇÃO DETECTADA: O código gerado contém simulações e não está pronto para produção.',
    
    // Mensagem exibida quando a qualidade do código é baixa
    lowQualityCode: 'QUALIDADE BAIXA: O código gerado não atende aos padrões mínimos de qualidade.',
    
    // Mensagem exibida quando a regeneração automática falha
    regenerationFailed: 'FALHA NA REGENERAÇÃO: Não foi possível gerar código sem simulações após várias tentativas.',
    
    // Mensagem exibida quando o código é aprovado
    codeApproved: 'CÓDIGO APROVADO: O código gerado está pronto para produção e atende a todos os requisitos.'
  }
};