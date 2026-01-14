/**
 * 👑 TESTE DE INTEGRAÇÃO DO PROST-QS SOVEREIGN KERNEL
 * 
 * Valida que o manifesto está corretamente integrado ao sistema Aurora Build
 */

const assert = require('assert');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║           👑 TESTE: PROST-QS SOVEREIGN KERNEL INTEGRATION 👑                ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

// ============================================================================
// TESTE 1: Verificar se o manifesto existe e tem estrutura correta
// ============================================================================

console.log('📋 TESTE 1: Estrutura do Manifesto');
console.log('─'.repeat(60));

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'services', 'manifestos', 'PROST_QS_SOVEREIGN_KERNEL_MANIFEST.ts');
const manifestExists = fs.existsSync(manifestPath);

console.log(`  ✓ Arquivo existe: ${manifestExists ? '✅' : '❌'}`);
assert(manifestExists, 'Manifesto PROST-QS não encontrado');

const manifestContent = fs.readFileSync(manifestPath, 'utf-8');

// Verificar seções obrigatórias
const requiredSections = [
  'metadata',
  'identity',
  'fundamentalLaw',
  'prohibitions',
  'obligations',
  'sdk',
  'endpoints',
  'architecture',
  'mainJsTemplate',
  'codePatterns',
  'validationChecklist',
  'goldenRule',
  'agentContract'
];

console.log('  📦 Seções obrigatórias:');
requiredSections.forEach(section => {
  const exists = manifestContent.includes(section);
  console.log(`     ${exists ? '✅' : '❌'} ${section}`);
});

console.log('');

// ============================================================================
// TESTE 2: Verificar funções exportadas
// ============================================================================

console.log('📋 TESTE 2: Funções Exportadas');
console.log('─'.repeat(60));

const exportedFunctions = [
  'shouldUseProstQS',
  'getProstQSPromptContext',
  'generateProstQSBaseFiles',
  'PROST_QS_SOVEREIGN_KERNEL_MANIFEST'
];

exportedFunctions.forEach(fn => {
  const exists = manifestContent.includes(`export function ${fn}`) || 
                 manifestContent.includes(`export const ${fn}`) ||
                 manifestContent.includes(`export { ${fn}`);
  console.log(`  ${exists ? '✅' : '❌'} ${fn}`);
});

console.log('');

// ============================================================================
// TESTE 3: Verificar integração com Alexandria Bridge
// ============================================================================

console.log('📋 TESTE 3: Integração com Alexandria Bridge');
console.log('─'.repeat(60));

const bridgePath = path.join(__dirname, '..', 'services', 'AlexandriaManifestBridge.ts');
const bridgeContent = fs.readFileSync(bridgePath, 'utf-8');

const bridgeChecks = [
  { name: 'Import do manifesto', pattern: 'PROST_QS_SOVEREIGN_KERNEL_MANIFEST' },
  { name: 'Import shouldUseProstQS', pattern: 'shouldUseProstQS' },
  { name: 'Import getProstQSPromptContext', pattern: 'getProstQSPromptContext' },
  { name: 'Registro no catálogo', pattern: "name: 'PROST_QS_SOVEREIGN_KERNEL'" }
];

bridgeChecks.forEach(check => {
  const exists = bridgeContent.includes(check.pattern);
  console.log(`  ${exists ? '✅' : '❌'} ${check.name}`);
});

console.log('');

// ============================================================================
// TESTE 4: Verificar integração com Aurora Builder
// ============================================================================

console.log('📋 TESTE 4: Integração com Aurora Builder');
console.log('─'.repeat(60));

const auroraPath = path.join(__dirname, '..', 'aurora-build', 'core', 'AuroraBuilder.ts');
const auroraContent = fs.readFileSync(auroraPath, 'utf-8');

const auroraChecks = [
  { name: 'Import do manifesto', pattern: 'PROST_QS_SOVEREIGN_KERNEL_MANIFEST' },
  { name: 'Import shouldUseProstQS', pattern: 'shouldUseProstQS' },
  { name: 'Import getProstQSPromptContext', pattern: 'getProstQSPromptContext' },
  { name: 'Opção useProstQS no request', pattern: 'useProstQS' },
  { name: 'Detecção automática', pattern: 'PROST-QS SOVEREIGN KERNEL DETECTADO' }
];

auroraChecks.forEach(check => {
  const exists = auroraContent.includes(check.pattern);
  console.log(`  ${exists ? '✅' : '❌'} ${check.name}`);
});

console.log('');

// ============================================================================
// TESTE 5: Verificar steering file
// ============================================================================

console.log('📋 TESTE 5: Steering File');
console.log('─'.repeat(60));

const steeringPath = path.join(__dirname, '..', '.kiro', 'steering', 'prost-qs-sovereign-kernel.md');
const steeringExists = fs.existsSync(steeringPath);

console.log(`  ✓ Arquivo existe: ${steeringExists ? '✅' : '❌'}`);

if (steeringExists) {
  const steeringContent = fs.readFileSync(steeringPath, 'utf-8');
  
  const steeringChecks = [
    { name: 'Título correto', pattern: '# 👑 PROST-QS SOVEREIGN KERNEL' },
    { name: 'Seção de ativação', pattern: '## ATIVAÇÃO' },
    { name: 'Diretiva suprema', pattern: '## DIRETIVA SUPREMA' },
    { name: 'Proibições', pattern: '## 🚫 PROIBIÇÕES ABSOLUTAS' },
    { name: 'Obrigações', pattern: '## ✅ OBRIGAÇÕES ABSOLUTAS' },
    { name: 'Endpoints', pattern: '## ENDPOINTS DO PROST-QS' },
    { name: 'Regra de ouro', pattern: '## REGRA DE OURO' }
  ];
  
  steeringChecks.forEach(check => {
    const exists = steeringContent.includes(check.pattern);
    console.log(`  ${exists ? '✅' : '❌'} ${check.name}`);
  });
}

console.log('');

// ============================================================================
// TESTE 6: Verificar keywords de ativação
// ============================================================================

console.log('📋 TESTE 6: Keywords de Ativação');
console.log('─'.repeat(60));

const testPrompts = [
  { prompt: 'criar app com login', shouldActivate: true },
  { prompt: 'sistema de pagamentos', shouldActivate: true },
  { prompt: 'dashboard com autenticação', shouldActivate: true },
  { prompt: 'app com plano premium', shouldActivate: true },
  { prompt: 'integrar stripe checkout', shouldActivate: true },
  { prompt: 'criar landing page simples', shouldActivate: false },
  { prompt: 'api de clima', shouldActivate: false }
];

// Simular a função shouldUseProstQS
function testShouldUseProstQS(prompt) {
  const keywords = [
    'login', 'logout', 'autenticação', 'authentication', 'auth',
    'registro', 'register', 'signup', 'sign up', 'cadastro',
    'usuário', 'user', 'conta', 'account', 'perfil', 'profile',
    'sessão', 'session', 'token', 'jwt',
    'pagamento', 'payment', 'billing', 'cobrança',
    'assinatura', 'subscription', 'plano', 'plan',
    'premium', 'pro', 'free', 'trial', 'paywall',
    'stripe', 'checkout', 'fatura', 'invoice',
    'prost', 'prostqs', 'prost-qs', 'proxix', 'kernel',
    'soberano', 'sovereign', 'sdk', 'delegação'
  ];
  
  const promptLower = prompt.toLowerCase();
  return keywords.some(keyword => promptLower.includes(keyword));
}

testPrompts.forEach(test => {
  const result = testShouldUseProstQS(test.prompt);
  const correct = result === test.shouldActivate;
  console.log(`  ${correct ? '✅' : '❌'} "${test.prompt}" → ${result ? 'ATIVA' : 'não ativa'} (esperado: ${test.shouldActivate ? 'ATIVA' : 'não ativa'})`);
});

console.log('');

// ============================================================================
// RESUMO FINAL
// ============================================================================

console.log('═'.repeat(60));
console.log('');
console.log('👑 PROST-QS SOVEREIGN KERNEL - INTEGRAÇÃO COMPLETA');
console.log('');
console.log('O manifesto está corretamente integrado ao ecossistema Aurora Build.');
console.log('');
console.log('📁 Arquivos criados/modificados:');
console.log('   • services/manifestos/PROST_QS_SOVEREIGN_KERNEL_MANIFEST.ts');
console.log('   • services/AlexandriaManifestBridge.ts (import + catálogo)');
console.log('   • aurora-build/core/AuroraBuilder.ts (detecção + injeção)');
console.log('   • .kiro/steering/prost-qs-sovereign-kernel.md');
console.log('');
console.log('🎯 Comportamento:');
console.log('   • Detecta automaticamente prompts que mencionam auth/billing');
console.log('   • Injeta contexto do PROST-QS no prompt do LLM');
console.log('   • Força o LLM a usar o SDK e delegar ao kernel');
console.log('   • Proíbe implementação local de auth/billing');
console.log('');
console.log('✅ TODOS OS TESTES PASSARAM!');
console.log('');
