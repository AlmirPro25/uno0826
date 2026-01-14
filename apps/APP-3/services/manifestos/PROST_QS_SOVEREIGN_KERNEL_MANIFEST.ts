/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║           👑 PROST-QS SOVEREIGN KERNEL MANIFEST 👑                          ║
 * ║                                                                              ║
 * ║                    "O KERNEL SOBERANO DO ECOSSISTEMA"                        ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * DIRETIVA SUPREMA:
 * "Todo app criado para este ecossistema é um CLIENTE do PROST-QS.
 *  O app não tem soberania. O PROST-QS tem."
 * 
 * FILOSOFIA:
 * - O sistema foca nos 80% (lógica de negócio)
 * - Os 20% mais difíceis (auth, billing, planos) são delegados ao PROST-QS
 * - NUNCA reinventar a roda de autenticação e pagamentos
 * - O app PERGUNTA, o PROST-QS DECIDE
 * 
 * ⚠️ VERSÃO 1.1 - ANTI-SIMULAÇÃO ⚠️
 * - Proibido mockar PROST-QS
 * - Proibido simular auth/billing
 * - Se kernel offline → app bloqueia ou modo somente leitura
 * - NUNCA decidir localmente
 * 
 * VERSÃO: 1.1 (ANTI-SIMULAÇÃO)
 * DATA: 28/12/2024
 * STATUS: ENFORCEMENT ATIVO
 */

export const PROST_QS_SOVEREIGN_KERNEL_MANIFEST = {
  // ============================================================================
  // METADATA E ATIVAÇÃO
  // ============================================================================
  
  metadata: {
    name: 'PROST_QS_SOVEREIGN_KERNEL',
    displayName: 'PROST-QS - O Kernel Soberano',
    version: '1.1.0', // ATUALIZADO: Anti-Simulação
    status: 'ENFORCEMENT_ACTIVE', // Mudou de FROZEN para ENFORCEMENT
    priority: 'SUPREME', // Prioridade máxima - sobrescreve outros manifestos
    createdAt: '2024-12-28',
    updatedAt: '2024-12-28',
    keywords: [
      // Ativação por contexto
      'auth', 'autenticação', 'authentication', 'login', 'logout', 'registro',
      'pagamento', 'payment', 'billing', 'subscription', 'assinatura', 'plano',
      'stripe', 'checkout', 'cobrança', 'fatura', 'invoice',
      'usuário', 'user', 'conta', 'account', 'perfil', 'profile',
      'premium', 'pro', 'free', 'trial', 'paywall',
      'sdk', 'kernel', 'prost', 'proxix', 'soberano', 'sovereign'
    ]
  },

  // ============================================================================
  // 🚨 REGRAS ANTI-SIMULAÇÃO (v1.1)
  // ============================================================================

  antiSimulation: {
    version: '1.1',
    enforcement: 'STRICT',
    
    forbiddenPatterns: [
      'localStorage.setItem("isPro"',
      'localStorage.setItem("premium"',
      'localStorage.setItem("auth"',
      'localStorage.setItem("user"',
      'localStorage.setItem("token"',
      'localStorage.setItem("subscription"',
      'const PROST_QS = { // mock',
      'async getAuthStatus() { // fake',
      'async upgrade() { localStorage',
      'if (isPro)',
      'if (isPremium)',
      'if (user.plan)',
      'adapter: { fake',
      'adapter: { mock',
      'adapter: { simulate'
    ],
    
    requiredPatterns: [
      'import { ProstQSClient } from',
      'prost-qs-sdk.js',
      'window.prostqs = new ProstQSClient',
      'prostqs.get("/api/v1/',
      'prostqs.post("/api/v1/',
      'hasActiveSubscription()'
    ],
    
    offlineBehavior: {
      rule: 'Se PROST-QS não responder, o app DEVE:',
      options: [
        '1. Bloquear qualquer ação premium',
        '2. Exibir erro de kernel offline',
        '3. Entrar em modo somente leitura',
        '4. NUNCA simular ou mockar'
      ],
      forbidden: 'NUNCA assumir que o usuário tem acesso'
    }
  },

  // ============================================================================
  // IDENTIDADE DO SISTEMA
  // ============================================================================

  identity: {
    role: 'Backend Soberano Compartilhado',
    governs: [
      'Identidade (quem é o usuário)',
      'Dinheiro (billing, subscriptions, ledger)',
      'Autoridade (quem pode fazer o quê)',
      'Memória (histórico de decisões)'
    ],
    notIs: [
      '❌ Não é um framework',
      '❌ Não é uma biblioteca',
      '❌ Não é um template',
      '❌ Não é opcional'
    ]
  },

  // ============================================================================
  // LEI FUNDAMENTAL
  // ============================================================================

  fundamentalLaw: {
    statement: 'Todo app criado para este ecossistema é um CLIENTE do PROST-QS.',
    corollary: 'O app não tem soberania. O PROST-QS tem.',
    implications: [
      'O app PERGUNTA, o PROST-QS RESPONDE',
      'O app não sabe de billing, o PROST-QS sabe',
      'O app não valida auth, o PROST-QS valida',
      'O app não decide, o PROST-QS decide'
    ]
  },

  // ============================================================================
  // PROIBIÇÕES ABSOLUTAS (O QUE NUNCA FAZER)
  // ============================================================================

  prohibitions: {
    authLocal: {
      name: '🚫 PROIBIÇÃO 1: Auth Local',
      neverImplement: [
        'Login próprio',
        'Registro próprio',
        'Sessão própria',
        'JWT próprio',
        'Validação de senha',
        'Hash de senha',
        'Tabela de usuários'
      ]
    },
    
    billingLocal: {
      name: '🚫 PROIBIÇÃO 2: Billing Local',
      neverImplement: [
        'Integração direta com Stripe',
        'Integração direta com qualquer gateway',
        'Lógica de preços',
        'Cálculo de valores',
        'Tabela de pagamentos',
        'Tabela de subscriptions'
      ]
    },
    
    backendProprio: {
      name: '🚫 PROIBIÇÃO 3: Backend Próprio para Auth/Billing',
      neverCreate: [
        'API própria para auth',
        'API própria para billing',
        'Banco de dados próprio para usuários',
        'Banco de dados próprio para pagamentos'
      ]
    },
    
    duplicacaoEstado: {
      name: '🚫 PROIBIÇÃO 4: Duplicação de Estado',
      neverStore: [
        'Se o usuário está logado (pergunte ao PROST-QS)',
        'Se o usuário pagou (pergunte ao PROST-QS)',
        'Qual o plano do usuário (pergunte ao PROST-QS)',
        'Dados do perfil (pergunte ao PROST-QS)'
      ]
    }
  },

  // ============================================================================
  // OBRIGAÇÕES ABSOLUTAS (O QUE SEMPRE FAZER)
  // ============================================================================

  obligations: {
    useSDK: {
      name: '✅ OBRIGAÇÃO 1: Usar o SDK',
      rule: 'Todo app DEVE importar e usar o prost-qs-sdk.js'
    },
    
    connectCentral: {
      name: '✅ OBRIGAÇÃO 2: Conectar ao Backend Central',
      endpoints: {
        development: 'http://localhost:8080',
        production: 'https://api.prost-qs.com'
      }
    },
    
    delegateAuth: {
      name: '✅ OBRIGAÇÃO 3: Delegar Auth',
      correct: `const response = await prostqs.post('/api/v1/auth/login', { username, password });`,
      wrong: `const user = await myDatabase.findUser(username); // ERRADO!`
    },
    
    delegateBilling: {
      name: '✅ OBRIGAÇÃO 4: Delegar Billing',
      correct: `const subscription = await prostqs.get('/api/v1/billing/subscriptions/active');`,
      wrong: `const subscription = await stripe.subscriptions.retrieve(subId); // ERRADO!`
    },
    
    askDontDecide: {
      name: '✅ OBRIGAÇÃO 5: Perguntar, Não Decidir',
      correct: `if (await hasActiveSubscription()) { showPremiumFeature(); }`,
      wrong: `if (localStorage.getItem('isPremium') === 'true') { ... } // ERRADO!`
    }
  },

  // ============================================================================
  // SDK DO PROST-QS (CÓDIGO OBRIGATÓRIO)
  // ============================================================================

  sdk: {
    filename: 'prost-qs-sdk.js',
    code: `
export class ProstQSClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(method, path, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = \`Bearer \${this.token}\`;
    
    const config = { method, headers };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(\`\${this.baseURL}\${path}\`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || error.message || 'Erro na requisição');
    }
    
    return response.json();
  }

  get(path) { return this.request('GET', path); }
  post(path, data) { return this.request('POST', path, data); }
  put(path, data) { return this.request('PUT', path, data); }
  delete(path) { return this.request('DELETE', path); }
}
    `
  },

  // ============================================================================
  // ENDPOINTS DO PROST-QS (API REFERENCE)
  // ============================================================================

  endpoints: {
    auth: {
      register: {
        method: 'POST',
        path: '/api/v1/auth/register',
        payload: { username: 'string', password: 'string', email: 'string' },
        description: 'Criar nova conta'
      },
      login: {
        method: 'POST',
        path: '/api/v1/auth/login',
        payload: { username: 'string', password: 'string' },
        description: 'Autenticar usuário'
      }
    },
    
    identity: {
      me: {
        method: 'GET',
        path: '/api/v1/identity/me',
        description: 'Dados do usuário logado'
      }
    },
    
    billing: {
      createAccount: {
        method: 'POST',
        path: '/api/v1/billing/account',
        payload: { email: 'string', phone: 'string (opcional)' },
        description: 'Criar conta de billing'
      },
      getAccount: {
        method: 'GET',
        path: '/api/v1/billing/account',
        description: 'Ver conta de billing'
      },
      activeSubscription: {
        method: 'GET',
        path: '/api/v1/billing/subscriptions/active',
        description: 'Verificar subscription ativa'
      },
      createSubscription: {
        method: 'POST',
        path: '/api/v1/billing/subscriptions',
        payload: {
          plan_id: 'string (ex: pro_monthly)',
          amount: 'number (centavos, ex: 2900 = R$29)',
          currency: 'string (ex: BRL)',
          interval: 'string (month ou year)'
        },
        description: 'Criar nova subscription'
      },
      cancelSubscription: {
        method: 'DELETE',
        path: '/api/v1/billing/subscriptions/:id',
        description: 'Cancelar subscription'
      }
    }
  },

  // ============================================================================
  // ARQUITETURA OBRIGATÓRIA (ESTRUTURA DE PASTAS)
  // ============================================================================

  architecture: {
    structure: `
meu-app/
├── index.html              # Entry point
├── package.json            # Dependências (opcional)
├── src/
│   ├── main.js             # Inicialização + Router
│   ├── prost-qs-sdk.js     # SDK do PROST-QS (COPIAR)
│   └── pages/
│       ├── login.js        # Página de login
│       ├── register.js     # Página de registro
│       ├── dashboard.js    # Página principal (protegida)
│       └── pricing.js      # Página de planos
    `,
    
    requiredFiles: [
      'index.html',
      'src/main.js',
      'src/prost-qs-sdk.js',
      'src/pages/login.js',
      'src/pages/register.js',
      'src/pages/dashboard.js',
      'src/pages/pricing.js'
    ]
  },

  // ============================================================================
  // MAIN.JS TEMPLATE (CÓDIGO BASE OBRIGATÓRIO)
  // ============================================================================

  mainJsTemplate: `
import { ProstQSClient } from './prost-qs-sdk.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderPricing } from './pages/pricing.js';

// ========================================
// CONFIGURAÇÃO PROST-QS
// ========================================
const PROST_QS_URL = 'http://localhost:8080';
window.prostqs = new ProstQSClient(PROST_QS_URL);

// ========================================
// ESTADO GLOBAL (apenas referências)
// ========================================
window.appState = {
  user: null,
  token: localStorage.getItem('prostqs_token'),
  subscription: null
};

// ========================================
// ROUTER
// ========================================
function router() {
  const hash = window.location.hash || '#login';
  const app = document.getElementById('app');
  
  if (window.appState.token && !window.appState.user) {
    loadUser().then(() => renderRoute(hash, app));
  } else {
    renderRoute(hash, app);
  }
}

function renderRoute(hash, app) {
  // Rotas públicas
  if (hash === '#login') return renderLogin(app);
  if (hash === '#register') return renderRegister(app);
  
  // Rotas protegidas
  if (!window.appState.token) {
    window.location.hash = '#login';
    return;
  }
  
  if (hash === '#dashboard') return renderDashboard(app);
  if (hash === '#pricing') return renderPricing(app);
  
  // Default
  window.location.hash = '#login';
}

// ========================================
// FUNÇÕES DE AUTH (delegam ao PROST-QS)
// ========================================
async function loadUser() {
  try {
    window.appState.user = await window.prostqs.get('/api/v1/identity/me');
    await loadSubscription();
  } catch (error) {
    localStorage.removeItem('prostqs_token');
    window.appState.token = null;
    window.appState.user = null;
  }
}

async function loadSubscription() {
  try {
    try {
      await window.prostqs.get('/api/v1/billing/account');
    } catch (e) {
      await window.prostqs.post('/api/v1/billing/account', {
        email: window.appState.user?.email || '',
        phone: ''
      });
    }
    window.appState.subscription = await window.prostqs.get('/api/v1/billing/subscriptions/active');
  } catch (e) {
    window.appState.subscription = null;
  }
}

window.login = async function(username, password) {
  try {
    const response = await window.prostqs.post('/api/v1/auth/login', { username, password });
    window.appState.token = response.token;
    localStorage.setItem('prostqs_token', response.token);
    window.prostqs.setToken(response.token);
    await loadUser();
    window.location.hash = '#dashboard';
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

window.register = async function(username, password, email) {
  try {
    await window.prostqs.post('/api/v1/auth/register', { username, password, email });
    return await window.login(username, password);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

window.logout = function() {
  localStorage.removeItem('prostqs_token');
  window.appState = { user: null, token: null, subscription: null };
  window.prostqs.setToken(null);
  window.location.hash = '#login';
};

window.hasActiveSubscription = function() {
  return window.appState.subscription?.status === 'active';
};

// ========================================
// INICIALIZAÇÃO
// ========================================
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  if (window.appState.token) {
    window.prostqs.setToken(window.appState.token);
  }
  router();
});
  `,

  // ============================================================================
  // PADRÕES DE CÓDIGO (FEATURE GATING / PAYWALL)
  // ============================================================================

  codePatterns: {
    featureGating: {
      name: 'Feature Gating (Paywall)',
      pattern: `
// PADRÃO CORRETO
function renderFeature() {
  if (window.hasActiveSubscription()) {
    return \`<div class="feature">Conteúdo Premium</div>\`;
  } else {
    return \`
      <div class="paywall">
        <p>Esta feature requer plano Pro</p>
        <a href="#pricing">Ver Planos</a>
      </div>
    \`;
  }
}
      `
    },
    
    routeProtection: {
      name: 'Proteção de Rotas',
      pattern: `
// PADRÃO CORRETO
function renderRoute(hash, app) {
  // Rotas públicas - qualquer um acessa
  if (hash === '#login') return renderLogin(app);
  if (hash === '#register') return renderRegister(app);
  
  // Rotas protegidas - precisa de token
  if (!window.appState.token) {
    window.location.hash = '#login';
    return;
  }
  
  // Rotas premium - precisa de subscription
  if (hash === '#premium-feature') {
    if (!window.hasActiveSubscription()) {
      window.location.hash = '#pricing';
      return;
    }
    return renderPremiumFeature(app);
  }
}
      `
    },
    
    errorHandling: {
      name: 'Tratamento de Erros',
      pattern: `
// PADRÃO CORRETO
try {
  const result = await window.login(username, password);
  if (!result.success) {
    showError(result.error);
  }
} catch (error) {
  showError('Erro de conexão com o servidor');
}
      `
    }
  },

  // ============================================================================
  // ERROS COMUNS (EVITAR)
  // ============================================================================

  commonErrors: {
    error1: {
      name: '❌ Erro 1: Guardar estado localmente',
      wrong: `localStorage.setItem('isPremium', 'true');`,
      correct: `const isPremium = window.hasActiveSubscription();`
    },
    
    error2: {
      name: '❌ Erro 2: Validar auth no app',
      wrong: `if (password.length < 6) { return 'Senha muito curta'; }`,
      correct: `// Deixa o PROST-QS validar e retornar o erro`
    },
    
    error3: {
      name: '❌ Erro 3: Criar backend "só para uma coisinha"',
      wrong: `// "Vou criar uma API só para salvar preferências"`,
      correct: `// Se precisa de persistência, pede para adicionar no PROST-QS`
    },
    
    error4: {
      name: '❌ Erro 4: Hardcodar preços',
      wrong: `const price = 29.90;`,
      correct: `// Preço vem do PROST-QS ou é configurável`
    }
  },

  // ============================================================================
  // CHECKLIST DE VALIDAÇÃO
  // ============================================================================

  validationChecklist: {
    auth: [
      'Registro funciona',
      'Registro com username duplicado é barrado',
      'Login funciona',
      'Login com senha errada falha',
      'Logout limpa tudo',
      'Refresh da página mantém sessão',
      'Rota protegida redireciona sem login'
    ],
    
    billing: [
      'Billing account é criada automaticamente',
      'Subscription pode ser criada',
      'Feature premium é bloqueada sem plano',
      'Feature premium é liberada com plano'
    ],
    
    general: [
      'Nenhum backend próprio',
      'Nenhuma tabela de usuários',
      'Nenhuma integração direta com Stripe',
      'Tudo passa pelo PROST-QS'
    ]
  },

  // ============================================================================
  // GLOSSÁRIO
  // ============================================================================

  glossary: {
    'PROST-QS': 'Backend soberano compartilhado',
    'SDK': 'Cliente JavaScript para comunicar com PROST-QS',
    'App': 'Frontend que consome PROST-QS',
    'Subscription': 'Assinatura de plano pago',
    'Feature Gating': 'Bloquear feature por falta de plano',
    'Paywall': 'Tela que pede pagamento',
    'Token': 'JWT de autenticação',
    'Billing Account': 'Conta financeira do usuário'
  },

  // ============================================================================
  // REGRA DE OURO
  // ============================================================================

  goldenRule: {
    statement: 'Se integrar parecer chato, o erro é do PROST-QS — nunca do app.',
    principles: [
      'O app pergunta. O PROST-QS responde.',
      'O app não sabe de billing. O PROST-QS sabe.',
      'O app não valida auth. O PROST-QS valida.',
      'O app não decide. O PROST-QS decide.'
    ]
  },

  // ============================================================================
  // CONTRATO DO AGENTE
  // ============================================================================

  agentContract: {
    oath: 'Eu, agente de IA, ao criar um app para este ecossistema, JURO:',
    commitments: [
      '1. NUNCA criar backend próprio para auth',
      '2. NUNCA criar backend próprio para billing',
      '3. NUNCA integrar diretamente com Stripe ou gateways',
      '4. NUNCA guardar estado de auth/billing localmente',
      '5. SEMPRE usar o SDK do PROST-QS',
      '6. SEMPRE delegar decisões ao PROST-QS',
      '7. SEMPRE perguntar antes de decidir',
      '8. SEMPRE tratar o app como cliente burro'
    ]
  }
};


// ============================================================================
// HELPER: DETECTAR SE DEVE USAR PROST-QS
// ============================================================================

export function shouldUseProstQS(prompt: string): boolean {
  const keywords = [
    // Auth
    'login', 'logout', 'autenticação', 'authentication', 'auth',
    'registro', 'register', 'signup', 'sign up', 'cadastro',
    'usuário', 'user', 'conta', 'account', 'perfil', 'profile',
    'sessão', 'session', 'token', 'jwt',
    
    // Billing
    'pagamento', 'payment', 'billing', 'cobrança',
    'assinatura', 'subscription', 'plano', 'plan',
    'premium', 'pro', 'free', 'trial', 'paywall',
    'stripe', 'checkout', 'fatura', 'invoice',
    
    // Geral
    'saas', 'app', 'aplicativo', 'sistema',
    'dashboard', 'painel', 'admin'
  ];
  
  const promptLower = prompt.toLowerCase();
  return keywords.some(keyword => promptLower.includes(keyword));
}

// ============================================================================
// PROMPT INJECTION: CONTEXTO PARA O LLM
// ============================================================================

export function getProstQSPromptContext(): string {
  return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           👑 PROST-QS SOVEREIGN KERNEL v1.1 - DIRETIVA SUPREMA 👑           ║
║                                                                              ║
║                    ⚠️ MODO ANTI-SIMULAÇÃO ATIVO ⚠️                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

⚠️ ATENÇÃO: Este app faz parte do ecossistema PROST-QS.
⚠️ O PROST-QS é o KERNEL SOBERANO que governa Auth, Billing e Planos.
⚠️ TODO CÓDIGO GERADO SERÁ AUDITADO AUTOMATICAMENTE!

═══════════════════════════════════════════════════════════════════════════════
🚨🚨🚨 REGRAS ANTI-SIMULAÇÃO v1.1 (CRÍTICO) 🚨🚨🚨
═══════════════════════════════════════════════════════════════════════════════

É ABSOLUTAMENTE PROIBIDO:

1. ❌ MOCKAR o PROST-QS com objeto fake
   ERRADO: const PROST_QS = { async getAuthStatus() { return localStorage... } }
   
2. ❌ USAR localStorage para auth/billing
   ERRADO: localStorage.setItem('isPro', 'true')
   ERRADO: localStorage.setItem('auth', JSON.stringify(...))
   
3. ❌ DECIDIR PLANO LOCALMENTE
   ERRADO: if (isPro) { ... }
   ERRADO: if (user.plan === 'premium') { ... }
   
4. ❌ CRIAR ADAPTER FAKE
   ERRADO: adapter: { fake: true, simulate: true }

SE O KERNEL ESTIVER OFFLINE:
- BLOQUEAR features premium
- EXIBIR erro de kernel offline
- NUNCA assumir que o usuário tem acesso
- NUNCA simular resposta

═══════════════════════════════════════════════════════════════════════════════
🚫 PROIBIÇÕES ABSOLUTAS (NUNCA FAZER):
═══════════════════════════════════════════════════════════════════════════════

1. ❌ NUNCA implementar login/registro próprio
2. ❌ NUNCA criar tabela de usuários
3. ❌ NUNCA integrar diretamente com Stripe
4. ❌ NUNCA criar backend para auth/billing
5. ❌ NUNCA guardar estado de auth localmente (exceto token)
6. ❌ NUNCA hardcodar preços ou planos
7. ❌ NUNCA mockar ou simular o PROST-QS
8. ❌ NUNCA usar localStorage para isPro/isPremium/subscription
9. ❌ NUNCA criar objeto PROST_QS fake com métodos locais
10. ❌ NUNCA decidir localmente se usuário é premium

═══════════════════════════════════════════════════════════════════════════════
✅ OBRIGAÇÕES ABSOLUTAS (SEMPRE FAZER):
═══════════════════════════════════════════════════════════════════════════════

1. ✅ SEMPRE usar o SDK prost-qs-sdk.js (REAL, não mock)
2. ✅ SEMPRE conectar ao backend: http://localhost:8080 (dev)
3. ✅ SEMPRE delegar auth ao PROST-QS
4. ✅ SEMPRE delegar billing ao PROST-QS
5. ✅ SEMPRE perguntar ao PROST-QS antes de decidir
6. ✅ SEMPRE usar hasActiveSubscription() para feature gating
7. ✅ SEMPRE tratar erro de kernel offline
8. ✅ SEMPRE bloquear features premium se kernel indisponível

═══════════════════════════════════════════════════════════════════════════════
📜 CÓDIGO OBRIGATÓRIO (COPIAR EXATAMENTE):
═══════════════════════════════════════════════════════════════════════════════

// 1. IMPORT DO SDK (OBRIGATÓRIO)
import { ProstQSClient } from './prost-qs-sdk.js';

// 2. INICIALIZAÇÃO (OBRIGATÓRIO)
const PROST_QS_URL = 'http://localhost:8080';
window.prostqs = new ProstQSClient(PROST_QS_URL);

// 3. FEATURE GATING (OBRIGATÓRIO)
window.hasActiveSubscription = function() {
  return window.appState.subscription?.status === 'active';
};

// 4. TRATAMENTO DE KERNEL OFFLINE (OBRIGATÓRIO)
async function checkProstQS() {
  try {
    await window.prostqs.get('/api/v1/identity/me');
    return true;
  } catch (error) {
    showKernelOfflineError();
    disablePremiumFeatures();
    return false;
  }
}

═══════════════════════════════════════════════════════════════════════════════
📡 ENDPOINTS DO PROST-QS:
═══════════════════════════════════════════════════════════════════════════════

AUTH:
- POST /api/v1/auth/register → { username, password, email }
- POST /api/v1/auth/login → { username, password }
- GET  /api/v1/identity/me → Dados do usuário

BILLING:
- POST /api/v1/billing/account → { email, phone }
- GET  /api/v1/billing/account → Ver conta
- GET  /api/v1/billing/subscriptions/active → Subscription ativa
- POST /api/v1/billing/subscriptions → Criar subscription
- DELETE /api/v1/billing/subscriptions/:id → Cancelar

═══════════════════════════════════════════════════════════════════════════════
📁 ARQUIVOS OBRIGATÓRIOS:
═══════════════════════════════════════════════════════════════════════════════

1. src/prost-qs-sdk.js → SDK do PROST-QS (copiar do manifesto)
2. src/main.js → Inicialização + Router (usar template do manifesto)
3. src/pages/login.js → Página de login (usa window.login)
4. src/pages/register.js → Página de registro (usa window.register)
5. src/pages/dashboard.js → Página protegida
6. src/pages/pricing.js → Página de planos

═══════════════════════════════════════════════════════════════════════════════
🎯 PADRÃO DE FEATURE GATING:
═══════════════════════════════════════════════════════════════════════════════

// ✅ CORRETO - Perguntar ao PROST-QS
if (window.hasActiveSubscription()) {
  showPremiumFeature();
} else {
  showPaywall();
}

// ❌ ERRADO - Decidir localmente (SERÁ REJEITADO PELO AUDITOR)
if (localStorage.getItem('isPremium')) { ... } // VIOLAÇÃO CRÍTICA!
if (isPro) { ... } // VIOLAÇÃO CRÍTICA!

═══════════════════════════════════════════════════════════════════════════════
🔑 REGRA DE OURO:
═══════════════════════════════════════════════════════════════════════════════

"O app PERGUNTA. O PROST-QS RESPONDE."
"O app não sabe de billing. O PROST-QS sabe."
"O app não valida auth. O PROST-QS valida."
"O app não decide. O PROST-QS decide."
"Se o kernel está offline, o app BLOQUEIA. NUNCA simula."

═══════════════════════════════════════════════════════════════════════════════
🔍 AUDITORIA AUTOMÁTICA:
═══════════════════════════════════════════════════════════════════════════════

Todo código gerado será auditado pelo ProstQSAuditor que:
- Detecta padrões proibidos (localStorage auth, mock PROST-QS, etc.)
- Valida padrões obrigatórios (SDK import, client init, endpoint calls)
- Gera score de conformidade (0-100)
- REJEITA código com violações críticas

CÓDIGO COM VIOLAÇÕES SERÁ REJEITADO E NÃO SERÁ ENTREGUE AO USUÁRIO!

═══════════════════════════════════════════════════════════════════════════════
`;
}

// ============================================================================
// GERADOR DE ARQUIVOS BASE
// ============================================================================

export function generateProstQSBaseFiles(appName: string): Record<string, string> {
  return {
    'index.html': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
  <div id="app"></div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>`,

    'src/prost-qs-sdk.js': PROST_QS_SOVEREIGN_KERNEL_MANIFEST.sdk.code,
    
    'src/main.js': PROST_QS_SOVEREIGN_KERNEL_MANIFEST.mainJsTemplate,
    
    'src/pages/login.js': `
export function renderLogin(app) {
  app.innerHTML = \`
    <div class="min-h-screen flex items-center justify-center">
      <div class="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 class="text-2xl font-bold mb-6 text-center">${appName}</h1>
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Usuário</label>
            <input type="text" id="username" required
              class="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Senha</label>
            <input type="password" id="password" required
              class="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none">
          </div>
          <button type="submit"
            class="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition">
            Entrar
          </button>
        </form>
        <p class="mt-4 text-center text-gray-400">
          Não tem conta? <a href="#register" class="text-blue-400 hover:underline">Registre-se</a>
        </p>
        <div id="error" class="mt-4 text-red-400 text-center hidden"></div>
      </div>
    </div>
  \`;
  
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');
    
    const result = await window.login(username, password);
    if (!result.success) {
      errorDiv.textContent = result.error;
      errorDiv.classList.remove('hidden');
    }
  });
}
`,

    'src/pages/register.js': `
export function renderRegister(app) {
  app.innerHTML = \`
    <div class="min-h-screen flex items-center justify-center">
      <div class="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 class="text-2xl font-bold mb-6 text-center">Criar Conta</h1>
        <form id="registerForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Usuário</label>
            <input type="text" id="username" required
              class="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input type="email" id="email" required
              class="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Senha</label>
            <input type="password" id="password" required
              class="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none">
          </div>
          <button type="submit"
            class="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition">
            Criar Conta
          </button>
        </form>
        <p class="mt-4 text-center text-gray-400">
          Já tem conta? <a href="#login" class="text-blue-400 hover:underline">Entrar</a>
        </p>
        <div id="error" class="mt-4 text-red-400 text-center hidden"></div>
      </div>
    </div>
  \`;
  
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');
    
    const result = await window.register(username, password, email);
    if (!result.success) {
      errorDiv.textContent = result.error;
      errorDiv.classList.remove('hidden');
    }
  });
}
`,

    'src/pages/dashboard.js': `
export function renderDashboard(app) {
  const user = window.appState.user;
  const hasPro = window.hasActiveSubscription();
  
  app.innerHTML = \`
    <div class="min-h-screen bg-gray-900">
      <nav class="bg-gray-800 p-4 flex justify-between items-center">
        <h1 class="text-xl font-bold">${appName}</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-400">\${user?.username || 'Usuário'}</span>
          \${hasPro ? '<span class="px-2 py-1 bg-yellow-600 rounded text-xs">PRO</span>' : ''}
          <button onclick="window.logout()" class="text-red-400 hover:text-red-300">Sair</button>
        </div>
      </nav>
      
      <main class="p-8">
        <h2 class="text-2xl font-bold mb-6">Dashboard</h2>
        
        <!-- Conteúdo gratuito -->
        <div class="bg-gray-800 p-6 rounded-lg mb-6">
          <h3 class="text-lg font-semibold mb-2">Funcionalidades Gratuitas</h3>
          <p class="text-gray-400">Este conteúdo está disponível para todos os usuários.</p>
        </div>
        
        <!-- Conteúdo premium -->
        \${hasPro ? \`
          <div class="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">🌟 Funcionalidades Premium</h3>
            <p>Você tem acesso a todas as funcionalidades premium!</p>
          </div>
        \` : \`
          <div class="bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-600">
            <h3 class="text-lg font-semibold mb-2">🔒 Funcionalidades Premium</h3>
            <p class="text-gray-400 mb-4">Faça upgrade para acessar funcionalidades exclusivas.</p>
            <a href="#pricing" class="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-medium transition">
              Ver Planos
            </a>
          </div>
        \`}
      </main>
    </div>
  \`;
}
`,

    'src/pages/pricing.js': `
export function renderPricing(app) {
  const hasPro = window.hasActiveSubscription();
  
  app.innerHTML = \`
    <div class="min-h-screen bg-gray-900 p-8">
      <div class="max-w-4xl mx-auto">
        <a href="#dashboard" class="text-blue-400 hover:underline mb-4 inline-block">← Voltar</a>
        <h1 class="text-3xl font-bold mb-8 text-center">Escolha seu Plano</h1>
        
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Plano Free -->
          <div class="bg-gray-800 p-8 rounded-lg">
            <h2 class="text-2xl font-bold mb-2">Free</h2>
            <p class="text-4xl font-bold mb-4">R$ 0<span class="text-lg text-gray-400">/mês</span></p>
            <ul class="space-y-2 mb-6 text-gray-400">
              <li>✓ Funcionalidades básicas</li>
              <li>✓ Suporte por email</li>
              <li>✗ Funcionalidades premium</li>
            </ul>
            <button disabled class="w-full py-2 bg-gray-600 rounded font-medium">
              Plano Atual
            </button>
          </div>
          
          <!-- Plano Pro -->
          <div class="bg-gradient-to-br from-yellow-600 to-orange-600 p-8 rounded-lg">
            <h2 class="text-2xl font-bold mb-2">Pro</h2>
            <p class="text-4xl font-bold mb-4">R$ 29<span class="text-lg opacity-75">/mês</span></p>
            <ul class="space-y-2 mb-6">
              <li>✓ Todas funcionalidades</li>
              <li>✓ Suporte prioritário</li>
              <li>✓ Funcionalidades premium</li>
            </ul>
            \${hasPro ? \`
              <button disabled class="w-full py-2 bg-white/20 rounded font-medium">
                ✓ Você já é Pro!
              </button>
            \` : \`
              <button onclick="subscribePro()" class="w-full py-2 bg-white text-gray-900 rounded font-medium hover:bg-gray-100 transition">
                Assinar Pro
              </button>
            \`}
          </div>
        </div>
      </div>
    </div>
  \`;
}

window.subscribePro = async function() {
  try {
    await window.prostqs.post('/api/v1/billing/subscriptions', {
      plan_id: 'pro_monthly',
      amount: 2900,
      currency: 'BRL',
      interval: 'month'
    });
    
    // Recarregar subscription
    window.appState.subscription = await window.prostqs.get('/api/v1/billing/subscriptions/active');
    window.location.hash = '#dashboard';
  } catch (error) {
    alert('Erro ao assinar: ' + error.message);
  }
};
`
  };
}

export default PROST_QS_SOVEREIGN_KERNEL_MANIFEST;
