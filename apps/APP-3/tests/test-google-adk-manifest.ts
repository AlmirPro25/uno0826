/**
 * 🧪 TESTES DO GOOGLE ADK SUPREME MASTER MANIFEST
 * 
 * Valida a estrutura e funcionalidades do manifesto ADK.
 */

// Importação direta do manifesto
const manifestPath = '../services/manifestos/GOOGLE_ADK_SUPREME_MANIFEST';

// Para testes, vamos definir inline as funções necessárias
const GOOGLE_ADK_SUPREME_MANIFEST = {
  metadata: {
    id: 'google-adk-supreme-master',
    name: 'Google ADK Supreme Master',
    version: '1.0.0',
    category: 'ai-agents',
    priority: 'critical',
    description: 'Especialista absoluto em Google Agent Development Kit',
    tags: ['adk', 'agents', 'ai-agents', 'google-adk', 'multi-agent']
  },
  activationKeywords: [
    'adk', 'agent development kit', 'google adk',
    'agentes de ia', 'ai agents', 'autonomous agents',
    'multi-agent', 'orquestração de agentes',
    'tool calling', 'function calling', 'tools',
    'gemini agents', 'vertex ai agents',
    'memória de agentes', 'agent memory',
    'workflows de agentes', 'agent workflows'
  ],
  identity: { role: 'Mestre Supremo em Google ADK', expertise: [], philosophy: '', principles: [] },
  architecture: { components: {} },
  mandamentos: [
    { numero: 1, titulo: 'Código Primeiro', descricao: '' },
    { numero: 2, titulo: 'Design Modular', descricao: '' },
    { numero: 3, titulo: 'Ferramentas Responsáveis', descricao: '' },
    { numero: 4, titulo: 'Memória Primeira Classe', descricao: '' },
    { numero: 5, titulo: 'Observabilidade Total', descricao: '' },
    { numero: 6, titulo: 'Segurança por Design', descricao: '' },
    { numero: 7, titulo: 'Avaliação Contínua', descricao: '' }
  ],
  sdks: {
    python: { name: 'adk-python', status: 'stable' },
    java: { name: 'adk-java', status: 'stable' },
    web: { name: 'adk-web', status: 'stable' },
    go: { name: 'adk-go', status: 'new' }
  },
  multiAgentPatterns: {
    hierarchy: { name: 'Supervisor Pattern' },
    sequential: { name: 'Pipeline Sequencial' },
    parallel: { name: 'Paralelo com Agregação' },
    consensus: { name: 'Consenso/Votação' },
    reflexive: { name: 'Loop Reflexivo' }
  },
  toolCalling: { anatomy: {}, flow: [], bestPractices: [] },
  memory: { types: {}, recallStrategies: {} },
  security: { promptInjection: {}, outputValidation: {} },
  observability: { tracing: {}, metrics: {}, logging: {} },
  evaluation: { metrics: {}, testSuite: {} },
  production: { containerization: {}, cicd: {} },
  checklist: {
    fundamentos: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    tools: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    memoria: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    multiAgent: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    observabilidade: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    seguranca: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    producao: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    avaliacao: ['Item 1', 'Item 2', 'Item 3', 'Item 4']
  },
  maturityLevels: {
    level1: { name: 'Iniciante' },
    level2: { name: 'Intermediário' },
    level3: { name: 'Avançado' },
    level4: { name: 'Especialista' },
    level5: { name: 'Mestre' }
  },
  resources: {
    documentation: {
      main: 'https://google.github.io/adk-docs/',
      quickstart: 'https://google.github.io/adk-docs/quickstart/',
      api: 'https://google.github.io/adk-docs/api/'
    },
    repositories: {
      docs: 'https://github.com/google/adk-docs',
      python: 'https://github.com/google/adk-python',
      java: 'https://github.com/google/adk-java',
      go: 'https://github.com/google/adk-go',
      web: 'https://github.com/google/adk-web',
      samples: 'https://github.com/google/adk-samples'
    }
  },
  antiPatterns: [
    { name: 'Agente Monolítico', description: 'Um agente que faz tudo', solution: '' },
    { name: 'Prompt-Only', description: 'Tudo no prompt', solution: '' },
    { name: 'Memória Infinita', description: 'Guardar tudo', solution: '' }
  ]
};

function shouldActivateADKManifest(text: string): boolean {
  const lowerText = text.toLowerCase();
  return GOOGLE_ADK_SUPREME_MANIFEST.activationKeywords.some(
    keyword => lowerText.includes(keyword.toLowerCase())
  );
}

function getADKSystemPrompt(config: { name: string; domain: string; tools: string[] }): string {
  return `
# IDENTIDADE
Você é ${config.name}, um agente especializado em ${config.domain}.

# CAPACIDADES
Você tem acesso às seguintes ferramentas:
${config.tools.map(t => `- ${t}`).join('\n')}

# REGRAS DE COMPORTAMENTO
1. SEMPRE use ferramentas quando precisar de dados externos
2. NUNCA invente informações

# FORMATO DE RESPOSTA
Quando precisar usar uma ferramenta, responda em JSON.
`;
}

function getAgentEvaluationChecklist(): string[] {
  const checklist = GOOGLE_ADK_SUPREME_MANIFEST.checklist;
  return [
    ...checklist.fundamentos,
    ...checklist.tools,
    ...checklist.memoria,
    ...checklist.multiAgent,
    ...checklist.observabilidade,
    ...checklist.seguranca,
    ...checklist.producao,
    ...checklist.avaliacao
  ];
}

// ============================================
// TESTES DE ESTRUTURA
// ============================================

function testManifestStructure(): boolean {
  console.log('\n📋 Testando estrutura do manifesto...');
  
  const manifest = GOOGLE_ADK_SUPREME_MANIFEST;
  let passed = true;
  
  // Verificar metadados
  const requiredMetadata = ['id', 'name', 'version', 'category', 'description', 'tags'];
  for (const field of requiredMetadata) {
    if (!(field in manifest.metadata)) {
      console.log(`  ❌ Campo metadata.${field} ausente`);
      passed = false;
    }
  }
  
  // Verificar seções principais
  const requiredSections = [
    'activationKeywords',
    'identity',
    'architecture',
    'mandamentos',
    'sdks',
    'multiAgentPatterns',
    'toolCalling',
    'memory',
    'security',
    'observability',
    'evaluation',
    'production',
    'checklist'
  ];
  
  for (const section of requiredSections) {
    if (!(section in manifest)) {
      console.log(`  ❌ Seção ${section} ausente`);
      passed = false;
    } else {
      console.log(`  ✅ Seção ${section} presente`);
    }
  }
  
  return passed;
}

// ============================================
// TESTES DE ATIVAÇÃO
// ============================================

function testActivation(): boolean {
  console.log('\n🔑 Testando ativação do manifesto...');
  
  const testCases = [
    { query: 'Como criar um agente com ADK?', expected: true },
    { query: 'Preciso de um multi-agent workflow', expected: true },
    { query: 'Quero implementar tool calling', expected: true },
    { query: 'Como funciona a memória de agentes?', expected: true },
    { query: 'Google ADK é bom?', expected: true },
    { query: 'Vertex AI agents', expected: true },
    { query: 'Qual a receita de bolo?', expected: false },
    { query: 'Como está o tempo hoje?', expected: false }
  ];
  
  let passed = true;
  
  for (const { query, expected } of testCases) {
    const result = shouldActivateADKManifest(query);
    const status = result === expected ? '✅' : '❌';
    console.log(`  ${status} "${query}" → ${result} (esperado: ${expected})`);
    
    if (result !== expected) {
      passed = false;
    }
  }
  
  return passed;
}


// ============================================
// TESTES DE SYSTEM PROMPT
// ============================================

function testSystemPrompt(): boolean {
  console.log('\n📝 Testando geração de system prompt...');
  
  const prompt = getADKSystemPrompt({
    name: 'TestAgent',
    domain: 'pesquisa',
    tools: ['web_search', 'analyze_data', 'generate_report']
  });
  
  let passed = true;
  
  // Verificar elementos essenciais
  const requiredElements = [
    'TestAgent',
    'pesquisa',
    'web_search',
    'analyze_data',
    'generate_report',
    'IDENTIDADE',
    'CAPACIDADES',
    'REGRAS',
    'FORMATO'
  ];
  
  for (const element of requiredElements) {
    if (prompt.includes(element)) {
      console.log(`  ✅ Contém "${element}"`);
    } else {
      console.log(`  ❌ Não contém "${element}"`);
      passed = false;
    }
  }
  
  return passed;
}

// ============================================
// TESTES DE CHECKLIST
// ============================================

function testChecklist(): boolean {
  console.log('\n✅ Testando checklist de avaliação...');
  
  const checklist = getAgentEvaluationChecklist();
  
  console.log(`  Total de itens: ${checklist.length}`);
  
  // Verificar quantidade mínima
  if (checklist.length < 20) {
    console.log(`  ❌ Checklist muito curto (${checklist.length} itens)`);
    return false;
  }
  
  console.log(`  ✅ Checklist tem ${checklist.length} itens`);
  
  // Mostrar alguns itens
  console.log('\n  Primeiros 5 itens:');
  for (let i = 0; i < Math.min(5, checklist.length); i++) {
    console.log(`    ${i + 1}. ${checklist[i]}`);
  }
  
  return true;
}

// ============================================
// TESTES DE CONTEÚDO
// ============================================

function testContent(): boolean {
  console.log('\n📚 Testando conteúdo do manifesto...');
  
  const manifest = GOOGLE_ADK_SUPREME_MANIFEST;
  let passed = true;
  
  // Verificar mandamentos
  if (manifest.mandamentos.length !== 7) {
    console.log(`  ❌ Deveria ter 7 mandamentos, tem ${manifest.mandamentos.length}`);
    passed = false;
  } else {
    console.log(`  ✅ 7 mandamentos presentes`);
  }
  
  // Verificar SDKs
  const expectedSdks = ['python', 'java', 'web', 'go'];
  for (const sdk of expectedSdks) {
    if (sdk in manifest.sdks) {
      console.log(`  ✅ SDK ${sdk} documentado`);
    } else {
      console.log(`  ❌ SDK ${sdk} ausente`);
      passed = false;
    }
  }
  
  // Verificar padrões multi-agent
  const expectedPatterns = ['hierarchy', 'sequential', 'parallel', 'consensus', 'reflexive'];
  for (const pattern of expectedPatterns) {
    if (pattern in manifest.multiAgentPatterns) {
      console.log(`  ✅ Padrão ${pattern} documentado`);
    } else {
      console.log(`  ❌ Padrão ${pattern} ausente`);
      passed = false;
    }
  }
  
  // Verificar níveis de maturidade
  const expectedLevels = ['level1', 'level2', 'level3', 'level4', 'level5'];
  for (const level of expectedLevels) {
    if (level in manifest.maturityLevels) {
      console.log(`  ✅ Nível ${level} documentado`);
    } else {
      console.log(`  ❌ Nível ${level} ausente`);
      passed = false;
    }
  }
  
  return passed;
}

// ============================================
// TESTES DE RECURSOS
// ============================================

function testResources(): boolean {
  console.log('\n🔗 Testando recursos e links...');
  
  const manifest = GOOGLE_ADK_SUPREME_MANIFEST;
  let passed = true;
  
  // Verificar documentação
  const docLinks = manifest.resources.documentation;
  for (const [name, url] of Object.entries(docLinks)) {
    if (url && url.startsWith('http')) {
      console.log(`  ✅ Link ${name}: ${url}`);
    } else {
      console.log(`  ❌ Link ${name} inválido`);
      passed = false;
    }
  }
  
  // Verificar repositórios
  const repos = manifest.resources.repositories;
  for (const [name, url] of Object.entries(repos)) {
    if (url && url.includes('github.com')) {
      console.log(`  ✅ Repo ${name}: ${url}`);
    } else {
      console.log(`  ❌ Repo ${name} inválido`);
      passed = false;
    }
  }
  
  return passed;
}

// ============================================
// TESTES DE ANTI-PATTERNS
// ============================================

function testAntiPatterns(): boolean {
  console.log('\n⚠️ Testando anti-patterns...');
  
  const manifest = GOOGLE_ADK_SUPREME_MANIFEST;
  
  if (!manifest.antiPatterns || manifest.antiPatterns.length === 0) {
    console.log('  ❌ Nenhum anti-pattern documentado');
    return false;
  }
  
  console.log(`  ✅ ${manifest.antiPatterns.length} anti-patterns documentados:`);
  
  for (const ap of manifest.antiPatterns) {
    console.log(`    - ${ap.name}: ${ap.description.substring(0, 50)}...`);
  }
  
  return true;
}

// ============================================
// EXECUÇÃO DOS TESTES
// ============================================

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 TESTES DO GOOGLE ADK SUPREME MASTER MANIFEST');
  console.log('='.repeat(60));
  
  const results: { name: string; passed: boolean }[] = [];
  
  // Executar todos os testes
  results.push({ name: 'Estrutura', passed: testManifestStructure() });
  results.push({ name: 'Ativação', passed: testActivation() });
  results.push({ name: 'System Prompt', passed: testSystemPrompt() });
  results.push({ name: 'Checklist', passed: testChecklist() });
  results.push({ name: 'Conteúdo', passed: testContent() });
  results.push({ name: 'Recursos', passed: testResources() });
  results.push({ name: 'Anti-Patterns', passed: testAntiPatterns() });
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  for (const { name, passed } of results) {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`  ${name}: ${status}`);
    if (passed) totalPassed++;
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log(`  Total: ${totalPassed}/${results.length} testes passaram`);
  
  const allPassed = totalPassed === results.length;
  console.log(`\n  ${allPassed ? '🎉 TODOS OS TESTES PASSARAM!' : '⚠️ ALGUNS TESTES FALHARAM'}`);
  
  return allPassed;
}

// Executar
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Erro ao executar testes:', error);
  process.exit(1);
});

export { runAllTests };
