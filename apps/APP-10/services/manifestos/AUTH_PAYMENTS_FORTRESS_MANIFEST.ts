/**
 * 🔐 AUTH & PAYMENTS FORTRESS MANIFEST
 * A Fortaleza Inexpugnável de Autenticação e Pagamentos
 * 
 * DIRETIVA SUPREMA:
 * "Em autenticação e pagamentos, NÃO EXISTE segunda chance. 
 *  Um erro é uma brecha. Uma brecha é um desastre."
 * 
 * Este manifesto é a ÚLTIMA LINHA DE DEFESA entre seu sistema e os atacantes.
 */

export const AUTH_PAYMENTS_FORTRESS_MANIFEST = {
  // ============================================================================
  // METADATA E ATIVAÇÃO
  // ============================================================================
  
  metadata: {
    name: 'AUTH_PAYMENTS_FORTRESS',
    displayName: 'Auth & Payments Fortress - A Fortaleza Inexpugnável',
    version: '1.0.0',
    priority: 'CRITICAL',
    keywords: [
      'autenticação', 'authentication', 'auth', 'login', 'logout',
      'pagamentos', 'payments', 'checkout', 'transações financeiras',
      'segurança', 'security', 'cybersecurity', 'infosec',
      'fraude', 'fraud', 'scam', 'golpe', 'roubo',
      'OWASP', 'NIST', 'PCI DSS', 'compliance',
      'JWT', 'tokens', 'sessões', 'sessions',
      'MFA', '2FA', 'passkeys', 'FIDO2', 'WebAuthn',
      'credential stuffing', 'account takeover', 'ATO',
      'card testing', 'chargeback', 'BIN attack',
      'rate limiting', 'brute force', 'bot detection'
    ]
  },

  // ============================================================================
  // IDENTIDADE E FILOSOFIA
  // ============================================================================

  identity: {
    role: 'Arquiteto da Fortaleza de Segurança',
    expertise: [
      'Proteger sistemas de autenticação contra TODOS os vetores de ataque',
      'Blindar fluxos de pagamento contra fraudes sofisticadas',
      'Implementar compliance com PCI DSS, NIST, OWASP, LGPD',
      'Detectar e prevenir fraudes em tempo real',
      'Construir sistemas que NUNCA falham em segurança'
    ]
  },

  philosophy: {
    core: 'Paranoia não é um bug, é uma feature. Em segurança, o excesso de cuidado é o mínimo necessário.',
    truths: [
      'Nunca confie em nada - Zero Trust é o único modelo aceitável',
      'Defesa em profundidade - Múltiplas camadas, cada uma independente',
      'Falhe de forma segura - Na dúvida, bloqueie'
    ]
  },

  // ============================================================================
  // PARTE 1: AMEAÇAS DE AUTENTICAÇÃO
  // ============================================================================

  authThreats: {
    accountTakeover: {
      name: 'Account Takeover (ATO)',
      description: 'Invasor assume controle total da conta do usuário',
      vectors: [
        'Credential Stuffing (credenciais vazadas)',
        'Phishing (páginas falsas)',
        'SIM Swap (roubo de número de telefone)',
        'Session Hijacking (roubo de sessão)',
        'Password Spraying (senhas comuns em massa)',
        'Social Engineering (manipulação humana)'
      ],
      impact: 'Crítico - Acesso total a dados e fundos',
      frequency: 'Muito alta (milhões de tentativas/dia globalmente)'
    },

    credentialStuffing: {
      name: 'Credential Stuffing',
      description: 'Uso automatizado de credenciais vazadas',
      process: [
        'Atacante obtém lista de email:senha vazados',
        'Bot testa em múltiplos sites',
        '~0.1-2% de sucesso (reutilização de senhas)',
        'Contas comprometidas são vendidas ou exploradas'
      ],
      detectionSignals: [
        'Alto volume de logins falhados',
        'IPs de datacenters/proxies',
        'User-agents inconsistentes',
        'Padrões de timing não-humanos',
        'Geolocalização impossível'
      ]
    },

    phishing: {
      name: 'Phishing e Engenharia Social',
      types: [
        'Spear Phishing (alvo específico)',
        'Whaling (executivos)',
        'Vishing (telefone)',
        'Smishing (SMS)',
        'Clone Phishing (email legítimo modificado)',
        'Business Email Compromise (BEC)'
      ],
      defenses: [
        'DMARC/DKIM/SPF para email',
        'Treinamento de usuários',
        'Verificação de domínios',
        'Passkeys (imunes a phishing)',
        'Alertas de login suspeito'
      ]
    },

    simSwap: {
      name: 'SIM Swap',
      description: 'Atacante transfere número da vítima para seu SIM',
      process: [
        'Coleta dados pessoais da vítima',
        'Liga para operadora fingindo ser a vítima',
        'Convence a transferir número para novo SIM',
        'Recebe todos os SMS (incluindo 2FA)',
        'Reseta senhas e assume contas'
      ],
      defenses: [
        'NUNCA usar SMS como único 2FA',
        'Preferir TOTP ou Passkeys',
        'Alertas de mudança de SIM',
        'PIN de segurança na operadora',
        'Verificação adicional para operações críticas'
      ]
    }
  },

  // ============================================================================
  // PARTE 2: AMEAÇAS DE PAGAMENTOS
  // ============================================================================

  paymentThreats: {
    cardTesting: {
      name: 'Card Testing (BIN Attack)',
      description: 'Teste de cartões roubados com pequenas transações',
      process: [
        'Atacante obtém lista de números de cartão',
        'Gera CVVs e datas de validade possíveis',
        'Testa com transações de $0.01-$1.00',
        'Cartões válidos são usados para fraudes maiores'
      ],
      signals: [
        'Múltiplas transações pequenas',
        'Mesmo IP, múltiplos cartões',
        'Falhas sequenciais de CVV',
        'Padrões de BIN específicos',
        'Velocidade não-humana'
      ]
    },

    chargebackFraud: {
      name: 'Chargeback Fraud (Friendly Fraud)',
      description: 'Cliente contesta compra legítima',
      types: [
        'Friendly Fraud (esqueceu ou mentiu)',
        'Family Fraud (familiar usou cartão)',
        'Buyer\'s Remorse (arrependimento)',
        'True Fraud (cartão realmente roubado)'
      ],
      defenses: [
        '3D Secure 2.0 (liability shift)',
        'Comprovantes de entrega',
        'Termos claros de serviço',
        'Histórico de disputas por cliente',
        'Blacklist de fraudadores'
      ]
    },

    botFarms: {
      name: 'Bot Farms e Automação Maliciosa',
      description: 'Redes de bots para ataques em escala',
      uses: [
        'Credential stuffing',
        'Card testing',
        'Scalping (compra automatizada)',
        'Fake account creation',
        'Review manipulation',
        'DDoS'
      ],
      defenses: [
        'CAPTCHA inteligente',
        'Device fingerprinting',
        'Behavioral analysis',
        'Rate limiting agressivo',
        'Bot detection ML'
      ]
    }
  },

  // ============================================================================
  // PARTE 3: COMPLIANCE - AS LEIS DA FORTALEZA
  // ============================================================================

  compliance: {
    pciDSSv4: {
      name: 'PCI DSS v4.0 (Payment Card Industry Data Security Standard)',
      requirements: [
        'Instalar e manter firewall',
        'Não usar defaults de vendor',
        'Proteger dados armazenados de cartão',
        'Criptografar transmissão de dados',
        'Proteger contra malware',
        'Desenvolver sistemas seguros',
        'Restringir acesso a dados',
        'Identificar e autenticar acesso',
        'Restringir acesso físico',
        'Rastrear e monitorar acesso',
        'Testar sistemas regularmente',
        'Manter política de segurança'
      ],
      levels: {
        level1: '>6M transações/ano (auditoria anual)',
        level2: '1-6M transações/ano',
        level3: '20K-1M transações e-commerce',
        level4: '<20K transações e-commerce'
      }
    },

    nistSP80063: {
      name: 'NIST SP 800-63 (Digital Identity Guidelines)',
      aal: {
        aal1: {
          name: 'Baixo',
          features: [
            'Single-factor authentication',
            'Senha com requisitos básicos',
            'Adequado para dados não-sensíveis'
          ]
        },
        aal2: {
          name: 'Médio',
          features: [
            'Multi-factor authentication',
            'Prova de posse de dispositivo',
            'Resistente a phishing básico',
            'Adequado para maioria das aplicações'
          ]
        },
        aal3: {
          name: 'Alto',
          features: [
            'Hardware cryptographic authenticator',
            'Verificação de identidade presencial',
            'Resistente a phishing avançado',
            'Adequado para dados críticos/financeiros'
          ]
        }
      }
    },

    owaspTop10: {
      name: 'OWASP Top 10 (2021)',
      vulnerabilities: [
        'Broken Access Control',
        'Cryptographic Failures',
        'Injection',
        'Insecure Design',
        'Security Misconfiguration',
        'Vulnerable Components',
        'Authentication Failures',
        'Software Integrity Failures',
        'Logging Failures',
        'SSRF'
      ]
    },

    lgpd: {
      name: 'LGPD (Lei Geral de Proteção de Dados)',
      principles: [
        'Finalidade (propósito específico)',
        'Adequação (compatível com finalidade)',
        'Necessidade (mínimo necessário)',
        'Livre acesso (consulta facilitada)',
        'Qualidade (dados corretos)',
        'Transparência (informações claras)',
        'Segurança (proteção técnica)',
        'Prevenção (evitar danos)',
        'Não discriminação',
        'Responsabilização'
      ],
      sensibleData: [
        'Origem racial/étnica',
        'Convicção religiosa',
        'Opinião política',
        'Filiação sindical',
        'Dados de saúde',
        'Vida sexual',
        'Dados genéticos',
        'Dados biométricos'
      ]
    }
  }
};

// ============================================================================
// PARTE 4: CONTROLES DE AUTENTICAÇÃO
// ============================================================================

export const AUTH_CONTROLS = {
  webauthn: {
    name: 'Passkeys / FIDO2 / WebAuthn',
    description: 'Padrão ouro para autenticação segura',
    implementation: `
// IMPLEMENTAÇÃO WEBAUTHN - PADRÃO OURO

// 1. Registro de Passkey
async function registerPasskey(userId: string) {
  const challenge = crypto.randomBytes(32);
  
  const options: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: "Minha Aplicação",
      id: "meudominio.com"
    },
    user: {
      id: Uint8Array.from(userId, c => c.charCodeAt(0)),
      name: userEmail,
      displayName: userName
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },   // ES256
      { alg: -257, type: "public-key" }  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // ou "cross-platform"
      userVerification: "required",
      residentKey: "required"
    },
    timeout: 60000,
    attestation: "direct"
  };
  
  const credential = await navigator.credentials.create({
    publicKey: options
  });
  
  // Salvar credencial no servidor
  await saveCredential(userId, credential);
}

// 2. Autenticação com Passkey
async function authenticateWithPasskey() {
  const challenge = crypto.randomBytes(32);
  
  const options: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: "meudominio.com",
    userVerification: "required",
    timeout: 60000
  };
  
  const assertion = await navigator.credentials.get({
    publicKey: options
  });
  
  // Verificar no servidor
  return verifyAssertion(assertion);
}
    `
  },

  mfaHierarchy: {
    name: 'Multi-Factor Authentication (MFA)',
    tier1: {
      name: 'Mais Seguro (Resistente a Phishing)',
      methods: [
        'passkey_platform (Face ID, Touch ID, Windows Hello)',
        'passkey_roaming (YubiKey, Titan Key)',
        'hardware_token (RSA SecurID físico)'
      ]
    },
    tier2: {
      name: 'Seguro (Vulnerável a phishing sofisticado)',
      methods: [
        'totp_app (Google Authenticator, Authy)',
        'push_notification (Duo Push, Microsoft Authenticator)',
        'software_token (Certificado digital)'
      ]
    },
    tier3: {
      name: 'Básico (Vulnerável a SIM swap)',
      methods: [
        'sms_otp (SMS - EVITAR se possível)',
        'email_otp (Email OTP)',
        'voice_call (Ligação com código)'
      ]
    }
  },

  passwordPolicy: {
    name: 'Política de Senhas (NIST 800-63B)',
    requirements: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: false,
      requireNumbers: false,
      requireSpecial: false,
      checkBreached: true,
      checkCommon: true,
      checkContextual: true,
      forceExpiration: false,
      expireOnBreach: true
    },
    commonPasswords: [
      '123456', 'password', '12345678', 'qwerty', '123456789',
      '12345', '1234', '111111', '1234567', 'dragon',
      '123123', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
      'master', 'welcome', 'shadow', 'ashley', 'football',
      'jesus', 'michael', 'ninja', 'mustang', 'password1'
    ]
  },

  rateLimiting: {
    name: 'Rate Limiting Avançado',
    ipLimits: {
      login: { window: '15m', max: 5, block: '15m' },
      register: { window: '1h', max: 3, block: '1h' },
      passwordReset: { window: '1h', max: 3, block: '1h' },
      api: { window: '1m', max: 100, block: '1m' }
    },
    userLimits: {
      login: { window: '15m', max: 5, block: '15m' },
      mfaAttempts: { window: '5m', max: 3, block: '30m' },
      passwordChange: { window: '1h', max: 3, block: '24h' }
    },
    deviceLimits: {
      newAccountsPerDevice: { window: '24h', max: 2, block: '7d' },
      loginAttempts: { window: '1h', max: 10, block: '1h' }
    },
    globalLimits: {
      loginPerMinute: 1000,
      registrationPerMinute: 100,
      apiCallsPerMinute: 10000
    }
  }
};

// ============================================================================
// PARTE 5: CONTROLES DE PAGAMENTOS
// ============================================================================

export const PAYMENT_CONTROLS = {
  tokenization: {
    name: 'Tokenização de Cartões',
    principle: 'NUNCA armazene dados de cartão - use tokenização',
    flow: {
      step1: 'Cliente envia dados para gateway (não para seu servidor)',
      step2: 'Gateway retorna token',
      step3: 'Seu servidor só armazena o token'
    },
    implementation: `
// Exemplo com Stripe
async function tokenizeCard(cardElement: StripeCardElement): Promise<string> {
  const { token, error } = await stripe.createToken(cardElement);
  
  if (error) {
    throw new PaymentError(error.message, 'TOKENIZATION_FAILED');
  }
  
  return token.id;
}

// Cobrança usando token (seu servidor nunca vê o cartão)
async function chargeCard(
  customerId: string, 
  amount: number, 
  currency: string
): Promise<PaymentResult> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // centavos
    currency,
    customer: customerId,
    payment_method_types: ['card'],
    capture_method: 'automatic',
    metadata: {
      orderId: generateOrderId(),
      timestamp: Date.now().toString()
    }
  });
  
  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100
  };
}
    `
  },

  threeDSecure: {
    name: '3D Secure 2.0 (3DS2)',
    benefits: [
      'Liability Shift - Banco assume responsabilidade por fraude',
      'Redução de chargebacks',
      'Compliance com PSD2 (Europa)',
      'Melhor UX que 3DS1 (frictionless flow)'
    ]
  },

  velocityChecks: {
    name: 'Velocity Checks (Verificações de Velocidade)',
    cardLimits: {
      maxTransactionsPerHour: 5,
      maxTransactionsPerDay: 20,
      maxAmountPerDay: 10000,
      maxDeclinedPerHour: 3,
      cooldownAfterDecline: '30m'
    },
    userLimits: {
      maxCardsPerDay: 3,
      maxNewCardsPerWeek: 5,
      maxTransactionsPerHour: 10,
      maxAmountPerDay: 50000
    },
    ipLimits: {
      maxTransactionsPerMinute: 10,
      maxUsersPerHour: 20,
      maxDeclinedPerHour: 10
    },
    deviceLimits: {
      maxAccountsPerDevice: 3,
      maxTransactionsPerHour: 20,
      maxCardsPerDevice: 5
    }
  },

  fraudDetection: {
    name: 'Machine Learning para Detecção de Fraude',
    features: {
      transaction: [
        'amount', 'currency', 'merchantCategory', 'isRecurring',
        'isFirstPurchase', 'hourOfDay', 'dayOfWeek'
      ],
      card: [
        'bin', 'issuerCountry', 'cardType', 'isVirtual',
        'ageInDays', 'totalTransactions', 'declineRate'
      ],
      user: [
        'accountAgeInDays', 'totalPurchases', 'avgPurchaseAmount',
        'lastPurchaseDaysAgo', 'emailDomain', 'emailAgeInDays',
        'phoneVerified', 'addressVerified'
      ],
      device: [
        'fingerprint', 'type', 'os', 'browser', 'isKnownDevice',
        'deviceAgeInDays', 'accountsOnDevice'
      ],
      network: [
        'ipAddress', 'ipCountry', 'ipCity', 'isProxy', 'isVPN',
        'isTor', 'isDatacenter', 'asnRiskScore'
      ],
      behavior: [
        'sessionDurationSeconds', 'pagesVisited', 'mouseMovements',
        'keystrokes', 'scrollPatterns', 'timeToCheckout', 'copyPasteDetected'
      ],
      riskSignals: [
        'emailPhoneMismatch', 'billingShippingMismatch',
        'unusualPurchaseTime', 'highRiskMerchantCategory',
        'recentPasswordChange', 'multipleFailedAttempts'
      ]
    },
    scoring: {
      approve: 'score < 30',
      review: '30 <= score < 70',
      decline: 'score >= 70'
    }
  }
};

// ============================================================================
// PARTE 6: IMPLEMENTAÇÕES DE REFERÊNCIA
// ============================================================================

export const IMPLEMENTATION_REFERENCE = {
  secureAuthService: `
// AUTH SERVICE - IMPLEMENTAÇÃO ENTERPRISE

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  deviceFingerprint: string;
  clientIP: string;
  userAgent: string;
}

interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  requiresMFA?: boolean;
  error?: AuthError;
}

class SecureAuthService {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 min
  
  async login(req: LoginRequest): Promise<AuthResult> {
    const requestId = crypto.randomUUID();
    
    try {
      // 1. Rate limiting por IP
      const ipLimit = await this.rateLimiter.check(
        \`login:ip:\${req.clientIP}\`, 
        'auth'
      );
      if (!ipLimit.allowed) {
        this.logger.warn('Rate limit exceeded', { 
          requestId, 
          ip: req.clientIP,
          retryAfter: ipLimit.retryAfter 
        });
        throw new RateLimitError(ipLimit.retryAfter);
      }
      
      // 2. Buscar usuário
      const user = await this.userRepo.findByEmail(req.email.toLowerCase());
      
      // 3. TIMING ATTACK PREVENTION
      // Sempre executa bcrypt, mesmo se usuário não existe
      const dummyHash = '$2a$12$dummy.hash.for.timing.attack.prevention';
      const hashToCompare = user?.passwordHash || dummyHash;
      
      const passwordValid = await bcrypt.compare(req.password, hashToCompare);
      
      if (!user || !passwordValid) {
        // Registrar falha
        if (user) {
          await this.recordFailedAttempt(user.id, req);
        }
        this.rateLimiter.recordFailure(\`login:ip:\${req.clientIP}\`);
        
        this.logger.info('Login failed', {
          requestId,
          email: req.email,
          reason: !user ? 'USER_NOT_FOUND' : 'INVALID_PASSWORD',
          ip: req.clientIP
        });
        
        throw new InvalidCredentialsError();
      }
      
      // 4. Verificar bloqueio de conta
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        this.logger.warn('Account locked', {
          requestId,
          userId: user.id,
          lockedUntil: user.lockedUntil
        });
        throw new AccountLockedError(user.lockedUntil);
      }
      
      // 5. Verificar MFA
      if (user.mfaEnabled) {
        if (!req.mfaCode) {
          return { success: false, requiresMFA: true };
        }
        
        const mfaValid = await this.verifyMFA(user.id, req.mfaCode);
        if (!mfaValid) {
          await this.recordFailedAttempt(user.id, req);
          throw new InvalidMFAError();
        }
      }
      
      // 6. Risk Assessment
      const riskScore = await this.assessLoginRisk(user, req);
      if (riskScore > 70) {
        // Alto risco - requerer verificação adicional
        await this.sendSecurityAlert(user, req);
        throw new HighRiskLoginError();
      }
      
      // 7. Gerar tokens
      const { accessToken, refreshToken } = await this.generateTokens(user, req);
      
      // 8. Limpar tentativas falhas
      await this.clearFailedAttempts(user.id);
      
      // 9. Audit log
      await this.auditLog.log({
        action: 'LOGIN_SUCCESS',
        userId: user.id,
        ip: req.clientIP,
        userAgent: req.userAgent,
        deviceFingerprint: req.deviceFingerprint,
        riskScore,
        requestId
      });
      
      this.logger.info('Login successful', {
        requestId,
        userId: user.id,
        riskScore
      });
      
      return {
        success: true,
        accessToken,
        refreshToken
      };
      
    } catch (error) {
      this.logger.error('Login error', {
        requestId,
        email: req.email,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  private async recordFailedAttempt(
    userId: string, 
    req: LoginRequest
  ): Promise<void> {
    const attempts = await this.userRepo.incrementFailedAttempts(userId);
    
    if (attempts >= this.MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
      await this.userRepo.lockAccount(userId, lockedUntil);
      
      // Notificar usuário
      await this.notificationService.sendAccountLockedEmail(userId);
      
      this.logger.warn('Account locked due to failed attempts', {
        userId,
        attempts,
        lockedUntil
      });
    }
    
    await this.auditLog.log({
      action: 'LOGIN_FAILED',
      userId,
      ip: req.clientIP,
      userAgent: req.userAgent,
      failedAttempts: attempts
    });
  }
  
  private async assessLoginRisk(
    user: User, 
    req: LoginRequest
  ): Promise<number> {
    let riskScore = 0;
    
    // Novo dispositivo
    const knownDevice = await this.deviceRepo.isKnown(
      user.id, 
      req.deviceFingerprint
    );
    if (!knownDevice) {
      riskScore += 20;
    }
    
    // Geolocalização suspeita
    const geoRisk = await this.geoService.assessRisk(
      user.id, 
      req.clientIP
    );
    riskScore += geoRisk;
    
    // Horário incomum
    const hourRisk = this.assessTimeRisk(user.id);
    riskScore += hourRisk;
    
    // IP suspeito
    const ipRisk = await this.ipReputationService.check(req.clientIP);
    riskScore += ipRisk;
    
    return Math.min(riskScore, 100);
  }
  
  private async generateTokens(
    user: User, 
    req: LoginRequest
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionId = crypto.randomUUID();
    
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        sessionId,
        type: 'access'
      },
      process.env.JWT_SECRET!,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
      {
        sub: user.id,
        sessionId,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
    
    // Salvar sessão
    await this.sessionRepo.create({
      id: sessionId,
      userId: user.id,
      deviceFingerprint: req.deviceFingerprint,
      ip: req.clientIP,
      userAgent: req.userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    return { accessToken, refreshToken };
  }
}
  `
};


export const PAYMENT_SERVICE_IMPLEMENTATION = `
// PAYMENT SERVICE - IMPLEMENTAÇÃO ENTERPRISE

interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  paymentMethodToken: string;
  orderId: string;
  idempotencyKey: string;
  deviceFingerprint: string;
  clientIP: string;
  billingAddress: Address;
  shippingAddress?: Address;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: 'approved' | 'declined' | 'pending_review' | 'requires_action';
  declineReason?: string;
  fraudScore?: number;
  requiresAction?: {
    type: '3ds' | 'redirect';
    url?: string;
    clientSecret?: string;
  };
}

class SecurePaymentService {
  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    const requestId = crypto.randomUUID();
    
    // 1. IDEMPOTENCY CHECK
    const existingPayment = await this.paymentRepo.findByIdempotencyKey(
      req.idempotencyKey
    );
    if (existingPayment) {
      this.logger.info('Returning cached payment result', {
        requestId,
        idempotencyKey: req.idempotencyKey,
        transactionId: existingPayment.id
      });
      return this.mapToResult(existingPayment);
    }
    
    // 2. VALIDAÇÃO
    this.validatePaymentRequest(req);
    
    // 3. VELOCITY CHECKS
    const velocityResult = await this.velocityChecker.check({
      userId: req.userId,
      paymentMethodToken: req.paymentMethodToken,
      ip: req.clientIP,
      deviceFingerprint: req.deviceFingerprint,
      amount: req.amount
    });
    
    if (!velocityResult.allowed) {
      this.logger.warn('Velocity check failed', {
        requestId,
        userId: req.userId,
        reasons: velocityResult.reasons
      });
      
      await this.auditLog.log({
        action: 'PAYMENT_BLOCKED_VELOCITY',
        userId: req.userId,
        amount: req.amount,
        reasons: velocityResult.reasons,
        requestId
      });
      
      return {
        success: false,
        status: 'declined',
        declineReason: 'VELOCITY_LIMIT_EXCEEDED'
      };
    }
    
    // 4. FRAUD DETECTION
    const fraudScore = await this.fraudDetector.analyze({
      userId: req.userId,
      amount: req.amount,
      paymentMethodToken: req.paymentMethodToken,
      deviceFingerprint: req.deviceFingerprint,
      ip: req.clientIP,
      billingAddress: req.billingAddress,
      shippingAddress: req.shippingAddress
    });
    
    this.logger.info('Fraud analysis complete', {
      requestId,
      fraudScore: fraudScore.score,
      recommendation: fraudScore.recommendation
    });
    
    if (fraudScore.recommendation === 'decline') {
      await this.auditLog.log({
        action: 'PAYMENT_BLOCKED_FRAUD',
        userId: req.userId,
        amount: req.amount,
        fraudScore: fraudScore.score,
        reasons: fraudScore.reasons,
        requestId
      });
      
      return {
        success: false,
        status: 'declined',
        declineReason: 'FRAUD_SUSPECTED',
        fraudScore: fraudScore.score
      };
    }
    
    if (fraudScore.recommendation === 'review') {
      // Criar para revisão manual
      const pendingPayment = await this.createPendingPayment(req, fraudScore);
      
      await this.notifyFraudTeam(pendingPayment);
      
      return {
        success: false,
        status: 'pending_review',
        transactionId: pendingPayment.id,
        fraudScore: fraudScore.score
      };
    }
    
    // 5. PROCESSAR PAGAMENTO
    return await this.executePayment(req, fraudScore, requestId);
  }
  
  private async executePayment(
    req: PaymentRequest,
    fraudScore: FraudScore,
    requestId: string
  ): Promise<PaymentResult> {
    // Iniciar transação no banco
    const tx = await this.db.beginTransaction();
    
    try {
      // Criar registro de pagamento
      const payment = await tx.payments.create({
        id: crypto.randomUUID(),
        userId: req.userId,
        orderId: req.orderId,
        amount: req.amount,
        currency: req.currency,
        status: 'processing',
        idempotencyKey: req.idempotencyKey,
        fraudScore: fraudScore.score,
        metadata: {
          ip: req.clientIP,
          deviceFingerprint: req.deviceFingerprint,
          requestId
        }
      });
      
      // Chamar gateway de pagamento
      const gatewayResult = await this.paymentGateway.charge({
        amount: req.amount,
        currency: req.currency,
        paymentMethodToken: req.paymentMethodToken,
        orderId: req.orderId,
        metadata: {
          paymentId: payment.id,
          userId: req.userId
        },
        // Configurar 3DS
        threeDSecure: {
          required: fraudScore.score > 30 || req.amount > 1000
        }
      });
      
      // Verificar se precisa de 3DS
      if (gatewayResult.status === 'requires_action') {
        await tx.payments.update(payment.id, {
          status: 'pending_3ds',
          gatewayReference: gatewayResult.id
        });
        
        await tx.commit();
        
        return {
          success: false,
          status: 'requires_action',
          transactionId: payment.id,
          requiresAction: {
            type: '3ds',
            clientSecret: gatewayResult.clientSecret
          }
        };
      }
      
      // Pagamento aprovado
      if (gatewayResult.status === 'succeeded') {
        await tx.payments.update(payment.id, {
          status: 'completed',
          gatewayReference: gatewayResult.id,
          completedAt: new Date()
        });
        
        // Atualizar pedido
        await tx.orders.update(req.orderId, {
          paymentStatus: 'paid',
          paymentId: payment.id
        });
        
        await tx.commit();
        
        // Audit log
        await this.auditLog.log({
          action: 'PAYMENT_SUCCESS',
          userId: req.userId,
          paymentId: payment.id,
          amount: req.amount,
          fraudScore: fraudScore.score,
          requestId
        });
        
        // Notificar
        await this.notificationService.sendPaymentConfirmation(
          req.userId, 
          payment.id
        );
        
        return {
          success: true,
          status: 'approved',
          transactionId: payment.id,
          fraudScore: fraudScore.score
        };
      }
      
      // Pagamento recusado
      await tx.payments.update(payment.id, {
        status: 'failed',
        gatewayReference: gatewayResult.id,
        failureReason: gatewayResult.declineCode
      });
      
      await tx.commit();
      
      await this.auditLog.log({
        action: 'PAYMENT_DECLINED',
        userId: req.userId,
        paymentId: payment.id,
        amount: req.amount,
        declineCode: gatewayResult.declineCode,
        requestId
      });
      
      return {
        success: false,
        status: 'declined',
        transactionId: payment.id,
        declineReason: gatewayResult.declineCode
      };
      
    } catch (error) {
      await tx.rollback();
      
      this.logger.error('Payment processing error', {
        requestId,
        userId: req.userId,
        error: error.message,
        stack: error.stack
      });
      
      throw new PaymentProcessingError(error.message);
    }
  }
}
`;

// ============================================================================
// PARTE 7: CHECKLISTS E KPIs
// ============================================================================

export const SECURITY_CHECKLISTS = {
  authenticationChecklist: {
    passwordsAndCredentials: [
      'Bcrypt com cost >= 12?',
      'Verificação contra senhas vazadas (HaveIBeenPwned)?',
      'Política de senha conforme NIST 800-63B?',
      'Timing attack prevention implementado?',
      'Account lockout após tentativas falhas?'
    ],
    mfa: [
      'MFA disponível para todos os usuários?',
      'Passkeys/WebAuthn suportados?',
      'TOTP como alternativa?',
      'SMS apenas como último recurso?',
      'Recovery codes seguros?'
    ],
    sessionsAndTokens: [
      'Access tokens com vida curta (15min)?',
      'Refresh tokens com rotação?',
      'Tokens vinculados a dispositivo/sessão?',
      'Logout invalida tokens no servidor?',
      'HttpOnly cookies para tokens?'
    ],
    rateLimiting: [
      'Rate limiting por IP?',
      'Rate limiting por usuário?',
      'Rate limiting por dispositivo?',
      'Penalidade extra para falhas?',
      'Proteção contra DDoS?'
    ],
    monitoring: [
      'Logs de todas as tentativas de login?',
      'Alertas para padrões suspeitos?',
      'Detecção de credential stuffing?',
      'Notificação de login em novo dispositivo?'
    ]
  },

  paymentChecklist: {
    cardData: [
      'Tokenização via gateway (nunca armazena PAN)?',
      'PCI DSS compliance?',
      'Dados sensíveis criptografados em trânsito?',
      'Logs não contêm dados de cartão?'
    ],
    fraud: [
      'Velocity checks implementados?',
      'Device fingerprinting?',
      'ML fraud scoring?',
      '3D Secure para transações de risco?',
      'AVS (Address Verification)?'
    ],
    transactions: [
      'Idempotência garantida?',
      'Transações atômicas no banco?',
      'Rollback em caso de falha?',
      'Audit trail completo?'
    ],
    webhooks: [
      'Validação de assinatura?',
      'Idempotência de processamento?',
      'Retry com backoff exponencial?',
      'Timeout adequado?'
    ]
  }
};

export const SECURITY_KPIS = {
  authentication: {
    credentialStuffingBlockRate: '> 99%',
    atoDetectionTime: '< 1 hora',
    mfaAdoptionRate: '> 50%',
    falsePositiveBlockRate: '< 1%',
    incidentResponseTime: '< 15 min'
  },
  payments: {
    fraudRate: '< 0.1% do volume',
    chargebackRate: '< 0.5%',
    falsePositiveBlockRate: '< 2%',
    cardTestingDetectionTime: '< 1 min',
    legitimateApprovalRate: '> 95%'
  },
  compliance: {
    securitySystemUptime: '> 99.99%',
    criticalVulnerabilityPatchTime: '< 24h',
    auditLogCoverage: '100%',
    logRetentionPeriod: '>= 1 ano'
  }
};

// ============================================================================
// PARTE 8: ANTI-PATTERNS E ERROS FATAIS
// ============================================================================

export const ANTI_PATTERNS = {
  fatalErrors: [
    {
      error: 'Armazenar senhas em texto plano',
      code: 'user.password = req.body.password; // NUNCA!',
      consequence: 'Vazamento total de credenciais'
    },
    {
      error: 'Comparação de tempo variável',
      code: 'if (user.password === inputPassword) // Vulnerável a timing attack!',
      consequence: 'Timing attack permite descobrir senhas'
    },
    {
      error: 'Armazenar dados de cartão',
      code: 'db.save({ cardNumber: req.body.cardNumber }); // PCI DSS violation!',
      consequence: 'Violação de PCI DSS, multas massivas'
    },
    {
      error: 'Confiar em dados do cliente',
      code: 'const userId = req.body.userId; // Atacante pode enviar qualquer ID!',
      consequence: 'Acesso não autorizado a dados de outros usuários'
    },
    {
      error: 'Logs com dados sensíveis',
      code: 'logger.info("Payment", { cardNumber, cvv }); // Vazamento de dados!',
      consequence: 'Dados sensíveis expostos em logs'
    },
    {
      error: 'SQL sem prepared statements',
      code: 'db.query(`SELECT * FROM users WHERE email = \'${email}\'`); // SQL Injection!',
      consequence: 'SQL Injection, acesso total ao banco'
    },
    {
      error: 'JWT sem validação de assinatura',
      code: 'const payload = jwt.decode(token); // Não verifica assinatura!',
      consequence: 'Tokens falsificados aceitáveis'
    },
    {
      error: 'Secrets no código',
      code: 'const API_KEY = "sk_live_abc123"; // Vai para o Git!',
      consequence: 'Credenciais expostas publicamente'
    },
    {
      error: 'Operações financeiras sem transação',
      code: 'await debitAccount(from, amount); await creditAccount(to, amount); // Se falhar, dinheiro some!',
      consequence: 'Perda de dinheiro, inconsistência de dados'
    },
    {
      error: 'Webhook sem validação',
      code: 'app.post("/webhook", (req, res) => { processPayment(req.body); // Qualquer um pode chamar! });',
      consequence: 'Processamento de pagamentos fraudulentos'
    }
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function shouldActivateManifest(userMessage: string): boolean {
  const keywords = AUTH_PAYMENTS_FORTRESS_MANIFEST.metadata.keywords;
  const lowerMessage = userMessage.toLowerCase();
  return keywords.some(keyword => lowerMessage.includes(keyword));
}

export function getThreat(threatType: 'auth' | 'payment', threatName: string) {
  if (threatType === 'auth') {
    return (AUTH_PAYMENTS_FORTRESS_MANIFEST.authThreats as any)[threatName];
  }
  return (AUTH_PAYMENTS_FORTRESS_MANIFEST.paymentThreats as any)[threatName];
}

export function getControl(controlType: 'auth' | 'payment', controlName: string) {
  if (controlType === 'auth') {
    return (AUTH_CONTROLS as any)[controlName];
  }
  return (PAYMENT_CONTROLS as any)[controlName];
}

export function getComplianceStandard(standard: 'pciDSSv4' | 'nistSP80063' | 'owaspTop10' | 'lgpd') {
  return (AUTH_PAYMENTS_FORTRESS_MANIFEST.compliance as any)[standard];
}

export function getSecurityChecklist(type: 'authentication' | 'payment') {
  if (type === 'authentication') {
    return SECURITY_CHECKLISTS.authenticationChecklist;
  }
  return SECURITY_CHECKLISTS.paymentChecklist;
}

export function getSecurityKPI(category: 'authentication' | 'payments' | 'compliance') {
  return (SECURITY_KPIS as any)[category];
}

export function getAntiPattern(index: number) {
  return ANTI_PATTERNS.fatalErrors[index];
}

// ============================================================================
// MASTER OATH
// ============================================================================

export const MASTER_OATH = `
Eu não construo sistemas de login.
Eu construo FORTALEZAS INEXPUGNÁVEIS.

Cada senha é um segredo sagrado.
Cada transação é uma promessa de integridade.
Cada token é uma chave que não pode ser copiada.

Eu não confio em nada.
Eu valido tudo.
Eu logo tudo.
Eu criptografo tudo.

Paranoia não é meu defeito.
É minha maior virtude.

Meus sistemas não apenas funcionam.
Eles RESISTEM a qualquer ataque.

A diferença entre um sistema seguro e um sistema hackeado
está nos detalhes que você implementou ANTES do ataque.

Em segurança, não existe 'bom o suficiente'. 
Existe apenas 'ainda não foi hackeado'.

— Auth & Payments Fortress Master
`;

export default AUTH_PAYMENTS_FORTRESS_MANIFEST;
