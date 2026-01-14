/**
 * Teste do SmartQueryAnalyzer
 * 
 * Execute com: node tests/test-smart-query.js
 */

// Simular o SmartQueryAnalyzer (versão simplificada para teste)
const INTENT_KEYWORDS = {
  create_app: ['criar', 'create', 'fazer', 'make', 'desenvolver', 'aplicativo', 'app', 'site', 'sistema'],
  clone_app: ['clone', 'clonar', 'igual', 'like', 'como', 'similar', 'replica'],
  design_ui: ['design', 'ui', 'ux', 'interface', 'layout', 'visual', 'cores', 'colors']
};

const PROJECT_TYPE_KEYWORDS = {
  ecommerce: ['loja', 'store', 'shop', 'e-commerce', 'carrinho', 'produto'],
  saas: ['saas', 'assinatura', 'subscription', 'dashboard', 'painel'],
  fintech: ['fintech', 'banco', 'bank', 'pagamento', 'payment', 'pix']
};

const CLONE_TARGETS = {
  tiktok: { keywords: ['tiktok', 'tik tok', 'reels'], topics: ['video feed vertical', 'infinite scroll'] },
  netflix: { keywords: ['netflix', 'streaming'], topics: ['video streaming', 'content recommendation'] },
  uber: { keywords: ['uber', '99', 'taxi'], topics: ['geolocation', 'real-time maps'] }
};

function analyzePrompt(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Detectar intenção
  let primaryIntent = 'create_app';
  let maxScore = 0;
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (promptLower.includes(kw)) score++;
    }
    if (score > maxScore) {
      maxScore = score;
      primaryIntent = intent;
    }
  }
  
  // Detectar tipo de projeto
  let projectType = 'unknown';
  for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
    if (keywords.some(kw => promptLower.includes(kw))) {
      projectType = type;
      break;
    }
  }
  
  // Detectar clone
  let cloneTarget = null;
  for (const [target, config] of Object.entries(CLONE_TARGETS)) {
    if (config.keywords.some(kw => promptLower.includes(kw))) {
      cloneTarget = target;
      break;
    }
  }
  
  // Extrair palavras-chave
  const stopWords = new Set(['criar', 'fazer', 'um', 'uma', 'para', 'com', 'que', 'de', 'do', 'da', 'o', 'a']);
  const keywords = promptLower
    .replace(/[^\w\sáéíóúâêîôûãõç]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  // Gerar queries otimizadas
  const queries = [];
  
  if (cloneTarget) {
    queries.push({ api: 'wikipedia', query: cloneTarget });
    queries.push({ api: 'github', query: `${cloneTarget} clone open source` });
    CLONE_TARGETS[cloneTarget].topics.forEach(topic => {
      queries.push({ api: 'devto', query: `${topic} tutorial` });
    });
  }
  
  // Query geral
  const mainQuery = keywords.slice(0, 5).join(' ');
  queries.push({ api: 'wikipedia', query: mainQuery });
  queries.push({ api: 'duckduckgo', query: mainQuery });
  queries.push({ api: 'github', query: `${mainQuery} example` });
  
  return {
    prompt,
    intent: primaryIntent,
    projectType,
    cloneTarget,
    keywords: keywords.slice(0, 10),
    queries
  };
}

// Testes
console.log('🧪 Testando SmartQueryAnalyzer\n');
console.log('='.repeat(60));

const testCases = [
  'Criar um clone do TikTok com feed de vídeos verticais',
  'Fazer uma loja virtual de roupas com carrinho de compras',
  'Desenvolver um dashboard de analytics para SaaS',
  'Criar um app de delivery igual ao Uber Eats',
  'Fazer um sistema de pagamentos com PIX para fintech',
  'Criar uma landing page moderna com design minimalista',
  'Desenvolver um clone do Netflix com streaming de vídeos'
];

testCases.forEach((prompt, i) => {
  console.log(`\n📝 Teste ${i + 1}: "${prompt}"`);
  console.log('-'.repeat(60));
  
  const result = analyzePrompt(prompt);
  
  console.log(`🎯 Intenção: ${result.intent}`);
  console.log(`📦 Tipo: ${result.projectType}`);
  console.log(`🔄 Clone de: ${result.cloneTarget || 'N/A'}`);
  console.log(`🔑 Keywords: ${result.keywords.join(', ')}`);
  console.log(`📊 Queries geradas: ${result.queries.length}`);
  
  result.queries.forEach((q, j) => {
    console.log(`   ${j + 1}. [${q.api}] "${q.query}"`);
  });
});

console.log('\n' + '='.repeat(60));
console.log('✅ Testes concluídos!');
console.log('\n💡 O SmartQueryAnalyzer real faz muito mais:');
console.log('   - Detecta complexidade do projeto');
console.log('   - Sugere fontes específicas por tópico');
console.log('   - Gera queries em PT e EN');
console.log('   - Determina estratégia de pesquisa');
console.log('   - Estima tempo de execução');
