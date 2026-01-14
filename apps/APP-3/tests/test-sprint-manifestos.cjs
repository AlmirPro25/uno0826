/**
 * Teste dos Manifestos dos Sprints 1, 2 e 3 no Alexandria Bridge
 */

const path = require('path');
const fs = require('fs');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║     🧪 TESTE: MANIFESTOS SPRINTS 1, 2 E 3 NO ALEXANDRIA         ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

// Manifestos esperados por Sprint
const SPRINT_MANIFESTOS = {
  sprint1: {
    name: 'Sprint 1 - Maior ROI (Infraestrutura Core)',
    manifestos: [
      { file: 'REDIS_CACHING_MANIFEST.ts', export: 'REDIS_CACHING_MANIFEST', level: 60 },
      { file: 'MESSAGE_QUEUES_MANIFEST.ts', export: 'MESSAGE_QUEUES_MANIFEST', level: 61 },
      { file: 'GRPC_MANIFEST.ts', export: 'GRPC_MANIFEST', level: 62 },
      { file: 'NGINX_LOADBALANCER_MANIFEST.ts', export: 'NGINX_LOADBALANCER_MANIFEST', level: 63 },
    ]
  },
  sprint2: {
    name: 'Sprint 2 - Alta Demanda (AI & Payments)',
    manifestos: [
      { file: 'AI_AGENTS_LANGCHAIN_MANIFEST.ts', export: 'AI_AGENTS_LANGCHAIN_MANIFEST', level: 64 },
      { file: 'VECTOR_DATABASES_MANIFEST.ts', export: 'VECTOR_DATABASES_MANIFEST', level: 65 },
      { file: 'STRIPE_CONNECT_MANIFEST.ts', export: 'STRIPE_CONNECT_MANIFEST', level: 66 },
      { file: 'TWILIO_COMMUNICATIONS_MANIFEST.ts', export: 'TWILIO_COMMUNICATIONS_MANIFEST', level: 67 },
    ]
  },
  sprint3: {
    name: 'Sprint 3 - Enterprise (Cloud & DevOps)',
    manifestos: [
      { file: 'AWS_SERVICES_DEEP_MANIFEST.ts', export: 'AWS_SERVICES_DEEP_MANIFEST', level: 68 },
      { file: 'TERRAFORM_ADVANCED_MANIFEST.ts', export: 'TERRAFORM_ADVANCED_MANIFEST', level: 69 },
      { file: 'GITHUB_ACTIONS_ADVANCED_MANIFEST.ts', export: 'GITHUB_ACTIONS_ADVANCED_MANIFEST', level: 70 },
      { file: 'STORYBOOK_DESIGN_SYSTEM_MANIFEST.ts', export: 'STORYBOOK_DESIGN_SYSTEM_MANIFEST', level: 71 },
    ]
  }
};

const manifestosDir = path.join(__dirname, '..', 'services', 'manifestos');
const bridgePath = path.join(__dirname, '..', 'services', 'AlexandriaManifestBridge.ts');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, condition) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ ${description}`);
    return true;
  } else {
    failedTests++;
    console.log(`  ❌ ${description}`);
    return false;
  }
}

// Ler o conteúdo do Alexandria Bridge
let bridgeContent = '';
try {
  bridgeContent = fs.readFileSync(bridgePath, 'utf-8');
  console.log('📚 Alexandria Bridge carregado com sucesso\n');
} catch (err) {
  console.error('❌ Erro ao ler Alexandria Bridge:', err.message);
  process.exit(1);
}

// Testar cada Sprint
for (const [sprintKey, sprint] of Object.entries(SPRINT_MANIFESTOS)) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📦 ${sprint.name}`);
  console.log(`${'═'.repeat(60)}`);
  
  for (const manifest of sprint.manifestos) {
    console.log(`\n  📄 ${manifest.file}:`);
    
    // 1. Verificar se o arquivo existe
    const filePath = path.join(manifestosDir, manifest.file);
    const fileExists = fs.existsSync(filePath);
    test(`Arquivo existe`, fileExists);
    
    if (fileExists) {
      // 2. Verificar se tem o export correto
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const hasExport = fileContent.includes(`export const ${manifest.export}`) || 
                        fileContent.includes(`export { ${manifest.export}`);
      test(`Export '${manifest.export}' presente`, hasExport);
      
      // 3. Verificar se está importado no Bridge
      const importPattern = new RegExp(`import.*${manifest.export}.*from.*${manifest.file.replace('.ts', '')}`);
      const isImported = importPattern.test(bridgeContent) || 
                         bridgeContent.includes(`'./manifestos/${manifest.file.replace('.ts', '')}'`);
      test(`Importado no Alexandria Bridge`, isImported);
      
      // 4. Verificar se está no catálogo
      const catalogPattern = new RegExp(`name:\\s*['"]\\w+['"].*level:\\s*${manifest.level}`, 's');
      const inCatalog = bridgeContent.includes(`level: ${manifest.level}`) ||
                        bridgeContent.includes(`JSON.stringify(${manifest.export})`);
      test(`Registrado no MANIFEST_CATALOG (level ${manifest.level})`, inCatalog);
      
      // 5. Verificar estrutura básica do manifesto
      const hasId = fileContent.includes('id:') || fileContent.includes('"id"');
      const hasName = fileContent.includes('name:') || fileContent.includes('"name"');
      const hasActivation = fileContent.includes('activation') || fileContent.includes('keywords');
      test(`Estrutura válida (id, name, keywords)`, hasId && hasName && hasActivation);
    }
  }
}

// Teste de keywords no Bridge
console.log(`\n${'═'.repeat(60)}`);
console.log('🔍 VERIFICAÇÃO DE KEYWORDS NO CATÁLOGO');
console.log(`${'═'.repeat(60)}\n`);

const keywordTests = [
  { keyword: 'redis', expected: 'REDIS_CACHING' },
  { keyword: 'rabbitmq', expected: 'MESSAGE_QUEUES' },
  { keyword: 'grpc', expected: 'GRPC' },
  { keyword: 'nginx', expected: 'NGINX_LOADBALANCER' },
  { keyword: 'langchain', expected: 'AI_AGENTS_LANGCHAIN' },
  { keyword: 'pinecone', expected: 'VECTOR_DATABASES' },
  { keyword: 'stripe connect', expected: 'STRIPE_CONNECT' },
  { keyword: 'twilio', expected: 'TWILIO_COMMUNICATIONS' },
  { keyword: 'aws cdk', expected: 'AWS_SERVICES_DEEP' },
  { keyword: 'terraform', expected: 'TERRAFORM_ADVANCED' },
  { keyword: 'github actions', expected: 'GITHUB_ACTIONS_ADVANCED' },
  { keyword: 'storybook', expected: 'STORYBOOK_DESIGN_SYSTEM' },
];

for (const kt of keywordTests) {
  const hasKeyword = bridgeContent.toLowerCase().includes(kt.keyword.toLowerCase());
  test(`Keyword '${kt.keyword}' → ${kt.expected}`, hasKeyword);
}

// Resumo Final
console.log(`\n${'═'.repeat(60)}`);
console.log('📊 RESUMO FINAL');
console.log(`${'═'.repeat(60)}\n`);

console.log(`  Total de testes: ${totalTests}`);
console.log(`  ✅ Passou: ${passedTests}`);
console.log(`  ❌ Falhou: ${failedTests}`);
console.log(`  📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM! Os 12 manifestos estão integrados corretamente.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failedTests} teste(s) falharam. Verifique os erros acima.\n`);
  process.exit(1);
}
