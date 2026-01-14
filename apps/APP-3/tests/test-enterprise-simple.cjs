/**
 * 🧪 TESTE SIMPLES DO ENTERPRISE PIPELINE
 * 
 * Testa a lógica de detecção de complexidade sem dependências externas.
 */

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧪 TESTE SIMPLES - ENTERPRISE PIPELINE                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// ═══════════════════════════════════════════════════════════════════════════════
// LÓGICA DE DETECÇÃO DE COMPLEXIDADE (cópia do módulo)
// ═══════════════════════════════════════════════════════════════════════════════

const COMPLEXITY_KEYWORDS = {
  enterprise: [
    'empresa', 'enterprise', 'completo', 'full-stack', 'fullstack',
    'produção', 'production', 'deploy', 'ci/cd', 'docker',
    'microserviços', 'microservices', 'escalável', 'scalable'
  ],
  fintech: [
    'fintech', 'banco', 'bank', 'pagamento', 'payment', 'pix',
    'transferência', 'transfer', 'carteira', 'wallet', 'crédito',
    'empréstimo', 'loan', 'transação', 'transaction'
  ],
  saas: [
    'saas', 'multi-tenant', 'assinatura', 'subscription',
    'planos', 'pricing', 'dashboard', 'admin', 'painel'
  ],
  ecommerce: [
    'ecommerce', 'e-commerce', 'loja', 'store', 'carrinho',
    'cart', 'checkout', 'produto', 'product', 'estoque', 'inventory'
  ],
  social: [
    'rede social', 'social network', 'feed', 'timeline',
    'followers', 'seguidores', 'posts', 'comentários', 'likes'
  ],
  backend: [
    'api', 'rest', 'graphql', 'websocket', 'real-time',
    'autenticação', 'auth', 'jwt', 'oauth', 'database',
    'postgresql', 'mongodb', 'redis', 'queue', 'fila'
  ],
  frontend: [
    'react', 'next.js', 'vue', 'angular', 'componentes',
    'design system', 'responsivo', 'mobile', 'pwa', 'spa'
  ],
  simple: [
    'simples', 'simple', 'básico', 'basic', 'landing page',
    'página única', 'single page', 'formulário', 'form',
    'calculadora', 'calculator', 'todo', 'lista'
  ]
};

function analyzeComplexity(userPrompt) {
  const promptLower = userPrompt.toLowerCase();
  let score = 0;
  const detectedFeatures = [];
  
  for (const keyword of COMPLEXITY_KEYWORDS.enterprise) {
    if (promptLower.includes(keyword)) {
      score += 15;
      detectedFeatures.push(`enterprise:${keyword}`);
    }
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.fintech) {
    if (promptLower.includes(keyword)) {
      score += 20;
      detectedFeatures.push(`fintech:${keyword}`);
    }
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.saas) {
    if (promptLower.includes(keyword)) {
      score += 15;
      detectedFeatures.push(`saas:${keyword}`);
    }
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.ecommerce) {
    if (promptLower.includes(keyword)) {
      score += 15;
      detectedFeatures.push(`ecommerce:${keyword}`);
    }
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.social) {
    if (promptLower.includes(keyword)) {
      score += 12;
      detectedFeatures.push(`social:${keyword}`);
    }
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.backend) {
    if (promptLower.includes(keyword)) {
      score += 8;
      detectedFeatures.push(`backend:${keyword}`);
    }
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.frontend) {
    if (promptLower.includes(keyword)) {
      score += 5;
      detectedFeatures.push(`frontend:${keyword}`);
    }
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.simple) {
    if (promptLower.includes(keyword)) {
      score -= 20;
      detectedFeatures.push(`simple:${keyword}`);
    }
  }
  
  if (userPrompt.length > 500) score += 10;
  if (userPrompt.length > 1000) score += 15;
  if (userPrompt.length > 2000) score += 20;
  
  score = Math.max(0, Math.min(100, score));
  
  let mode;
  let reason;
  
  if (score >= 70) {
    mode = 5;
    reason = 'Projeto enterprise complexo detectado - usando 5 fases';
  } else if (score >= 50) {
    mode = 4;
    reason = 'Projeto fullstack detectado - usando 4 fases';
  } else if (score >= 30) {
    mode = 3;
    reason = 'Projeto médio detectado - usando 3 fases';
  } else {
    mode = 1;
    reason = 'Projeto simples - usando modo normal (1 chamada)';
  }
  
  return { score, mode, reason, detectedFeatures };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📊 TESTE: Detecção de Complexidade\n');

const testPrompts = [
  {
    prompt: 'Crie uma landing page simples',
    expectedMode: 1,
    description: 'Projeto simples'
  },
  {
    prompt: 'Crie um formulário de contato básico',
    expectedMode: 1,
    description: 'Projeto básico'
  },
  {
    prompt: 'Crie um e-commerce com carrinho e checkout',
    expectedMode: 3,
    description: 'E-commerce médio'
  },
  {
    prompt: 'Crie um SaaS de gestão de projetos com dashboard, assinaturas e multi-tenant',
    expectedMode: 4,
    description: 'SaaS complexo'
  },
  {
    prompt: 'Crie uma fintech completa com PIX, transferências, empréstimos, autenticação JWT, dashboard admin, deploy com Docker e CI/CD',
    expectedMode: 5,
    description: 'Fintech enterprise'
  },
  {
    prompt: 'Crie um banco digital completo com sistema de pagamentos, carteira virtual, empréstimos, investimentos, cartão de crédito virtual, PIX, TED, boletos, extrato, notificações push, autenticação biométrica, KYC, compliance BACEN, dashboard admin, relatórios, auditoria, deploy em Kubernetes com CI/CD',
    expectedMode: 5,
    description: 'Banco digital completo'
  }
];

let passedTests = 0;
let failedTests = 0;

for (const test of testPrompts) {
  const analysis = analyzeComplexity(test.prompt);
  const passed = analysis.mode === test.expectedMode;
  
  if (passed) {
    passedTests++;
    console.log(`✅ ${test.description}`);
  } else {
    failedTests++;
    console.log(`❌ ${test.description}`);
    console.log(`   Esperado: ${test.expectedMode} chamadas`);
    console.log(`   Obtido: ${analysis.mode} chamadas`);
  }
  
  console.log(`   Score: ${analysis.score}`);
  console.log(`   Modo: ${analysis.mode} chamadas`);
  console.log(`   Features: ${analysis.detectedFeatures.slice(0, 5).join(', ')}`);
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           RESULTADO FINAL                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ✅ Testes passados: ${String(passedTests).padEnd(55)}║
║  ❌ Testes falhados: ${String(failedTests).padEnd(55)}║
║  📊 Taxa de sucesso: ${String(((passedTests / (passedTests + failedTests)) * 100).toFixed(1) + '%').padEnd(55)}║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

if (failedTests === 0) {
  console.log('🎉 Todos os testes passaram! O sistema de detecção está funcionando corretamente.');
} else {
  console.log('⚠️ Alguns testes falharam. Verifique os pesos das palavras-chave.');
}
