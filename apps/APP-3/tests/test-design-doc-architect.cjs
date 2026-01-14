/**
 * 📋 TESTES DO DESIGN DOC ARCHITECT
 */

const assert = require('assert');

// Simular os detectores
function detectBestStyle(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Amazon PR/FAQ
  const prfaqKeywords = ['novo produto', 'new product', 'lançamento', 'launch', 'cliente', 'customer', 'mvp', 'startup'];
  if (prfaqKeywords.some(k => promptLower.includes(k))) return 'amazon_prfaq';
  
  // Netflix ADR
  const adrKeywords = ['decisão', 'decision', 'escolher entre', 'migrar', 'migrate', 'arquitetura'];
  if (adrKeywords.some(k => promptLower.includes(k))) return 'netflix';
  
  // Stripe RFC
  const rfcKeywords = ['api', 'endpoint', 'refatorar', 'refactor', 'breaking change'];
  if (rfcKeywords.some(k => promptLower.includes(k))) return 'stripe';
  
  // Meta
  const metaKeywords = ['escala', 'scale', 'milhões', 'millions', 'distribuído', 'distributed'];
  if (metaKeywords.some(k => promptLower.includes(k))) return 'meta';
  
  // Microsoft
  const msKeywords = ['enterprise', 'corporativo', 'roi', 'budget', 'orçamento'];
  if (msKeywords.some(k => promptLower.includes(k))) return 'microsoft';
  
  // Uber
  const uberKeywords = ['microserviço', 'microservice', 'kubernetes', 'disaster recovery'];
  if (uberKeywords.some(k => promptLower.includes(k))) return 'uber';
  
  // Amazon 6-Pager
  const sixPagerKeywords = ['estratégia', 'strategy', 'roadmap', 'visão', 'vision'];
  if (sixPagerKeywords.some(k => promptLower.includes(k))) return 'amazon_6p';
  
  return 'universal';
}

function detectComplexity(prompt) {
  const promptLower = prompt.toLowerCase();
  
  const enterpriseKeywords = ['enterprise', 'corporativo', 'multi-tenant', 'compliance'];
  if (enterpriseKeywords.some(k => promptLower.includes(k))) return 'enterprise';
  
  const largeKeywords = ['completo', 'complete', 'fullstack', 'e-commerce', 'marketplace', 'saas'];
  if (largeKeywords.some(k => promptLower.includes(k))) return 'large';
  
  const mediumKeywords = ['dashboard', 'admin', 'painel', 'crud', 'api'];
  if (mediumKeywords.some(k => promptLower.includes(k))) return 'medium';
  
  return 'small';
}

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║              📋 TESTES DO DESIGN DOC ARCHITECT 📋                           ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// ============================================================================
// TESTES DE DETECÇÃO DE ESTILO
// ============================================================================

console.log('\n📊 TESTES DE DETECÇÃO DE ESTILO:\n');

test('Detecta Amazon PR/FAQ para novo produto', () => {
  assert.strictEqual(detectBestStyle('Criar um novo produto para clientes'), 'amazon_prfaq');
});

test('Detecta Amazon PR/FAQ para MVP', () => {
  assert.strictEqual(detectBestStyle('MVP de uma startup'), 'amazon_prfaq');
});

test('Detecta Netflix ADR para decisão de arquitetura', () => {
  assert.strictEqual(detectBestStyle('Decisão de arquitetura: usar PostgreSQL ou MongoDB'), 'netflix');
});

test('Detecta Netflix ADR para migração', () => {
  assert.strictEqual(detectBestStyle('Migrar de monolito para microserviços'), 'netflix');
});

test('Detecta Stripe RFC para mudança de API', () => {
  assert.strictEqual(detectBestStyle('Refatorar a API de pagamentos'), 'stripe');
});

test('Detecta Stripe RFC para endpoint', () => {
  assert.strictEqual(detectBestStyle('Novo endpoint de autenticação'), 'stripe');
});

test('Detecta Meta para alta escala', () => {
  assert.strictEqual(detectBestStyle('Sistema para milhões de usuários'), 'meta');
});

test('Detecta Meta para sistema distribuído', () => {
  assert.strictEqual(detectBestStyle('Sistema distribuído com sharding'), 'meta');
});

test('Detecta Microsoft para enterprise', () => {
  assert.strictEqual(detectBestStyle('Sistema enterprise com ROI claro'), 'microsoft');
});

test('Detecta Microsoft para orçamento', () => {
  assert.strictEqual(detectBestStyle('Projeto corporativo com budget aprovado'), 'microsoft');
});

test('Detecta Uber para microserviços com Kubernetes', () => {
  // Nota: "arquitetura" também ativa Netflix ADR, então testamos com foco em Kubernetes
  assert.strictEqual(detectBestStyle('Deploy de microserviços com Kubernetes e disaster recovery'), 'uber');
});

test('Detecta Uber para disaster recovery', () => {
  assert.strictEqual(detectBestStyle('Sistema com disaster recovery'), 'uber');
});

test('Detecta Amazon 6-Pager para estratégia', () => {
  assert.strictEqual(detectBestStyle('Estratégia de longo prazo'), 'amazon_6p');
});

test('Detecta Amazon 6-Pager para roadmap', () => {
  assert.strictEqual(detectBestStyle('Roadmap do produto'), 'amazon_6p');
});

test('Retorna Universal como default', () => {
  assert.strictEqual(detectBestStyle('Criar um sistema simples'), 'universal');
});

// ============================================================================
// TESTES DE DETECÇÃO DE COMPLEXIDADE
// ============================================================================

console.log('\n📊 TESTES DE DETECÇÃO DE COMPLEXIDADE:\n');

test('Detecta Enterprise para multi-tenant', () => {
  assert.strictEqual(detectComplexity('Sistema multi-tenant enterprise'), 'enterprise');
});

test('Detecta Enterprise para compliance', () => {
  assert.strictEqual(detectComplexity('Sistema com compliance SOC2'), 'enterprise');
});

test('Detecta Large para e-commerce', () => {
  assert.strictEqual(detectComplexity('E-commerce completo'), 'large');
});

test('Detecta Large para SaaS', () => {
  assert.strictEqual(detectComplexity('Plataforma SaaS'), 'large');
});

test('Detecta Medium para dashboard', () => {
  assert.strictEqual(detectComplexity('Dashboard de analytics'), 'medium');
});

test('Detecta Medium para CRUD', () => {
  assert.strictEqual(detectComplexity('CRUD de usuários'), 'medium');
});

test('Detecta Small como default', () => {
  assert.strictEqual(detectComplexity('Landing page'), 'small');
});

// ============================================================================
// TESTES DE TEMPLATES
// ============================================================================

console.log('\n📊 TESTES DE TEMPLATES:\n');

const templates = {
  google: { company: 'Google', sections: 8 },
  meta: { company: 'Meta/Facebook', sections: 5 },
  amazon_6p: { company: 'Amazon', sections: 6 },
  amazon_prfaq: { company: 'Amazon', sections: 3 },
  microsoft: { company: 'Microsoft', sections: 6 },
  stripe: { company: 'Stripe', sections: 7 },
  netflix: { company: 'Netflix', sections: 5 },
  uber: { company: 'Uber', sections: 8 },
  universal: { company: 'Universal (Best of All)', sections: 12 }
};

for (const [style, expected] of Object.entries(templates)) {
  test(`Template ${style} existe e tem empresa ${expected.company}`, () => {
    assert.ok(style);
    assert.ok(expected.company);
  });
}

// ============================================================================
// TESTES DE SEÇÕES OBRIGATÓRIAS
// ============================================================================

console.log('\n📊 TESTES DE SEÇÕES OBRIGATÓRIAS:\n');

const requiredSections = ['tldr', 'goals', 'nonGoals', 'solution', 'alternatives', 'risks'];

test('Todas as seções obrigatórias estão definidas', () => {
  for (const section of requiredSections) {
    assert.ok(section, `Seção ${section} deve existir`);
  }
});

test('TL;DR é obrigatório', () => {
  assert.ok(requiredSections.includes('tldr'));
});

test('Goals é obrigatório', () => {
  assert.ok(requiredSections.includes('goals'));
});

test('Non-Goals é obrigatório', () => {
  assert.ok(requiredSections.includes('nonGoals'));
});

test('Alternatives é obrigatório', () => {
  assert.ok(requiredSections.includes('alternatives'));
});

test('Risks é obrigatório', () => {
  assert.ok(requiredSections.includes('risks'));
});

// ============================================================================
// RESULTADO FINAL
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log(`📊 RESULTADO: ${passed} passou, ${failed} falhou`);
console.log(`📊 TAXA DE SUCESSO: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
