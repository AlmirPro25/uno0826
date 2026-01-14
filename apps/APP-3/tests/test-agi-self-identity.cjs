/**
 * Teste do AGI Self & Identity Manifest (Level 201)
 */

const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║       TESTE: AGI SELF & IDENTITY MANIFEST (Level 201)            ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

// Ler o arquivo do manifesto
const manifestPath = path.join(__dirname, '../services/manifestos/AGI_SELF_IDENTITY_MANIFEST.ts');
const content = fs.readFileSync(manifestPath, 'utf-8');

// Verificar seções principais
const sections = [
  { name: 'metadata', pattern: /metadata:\s*{/ },
  { name: 'innatePriors', pattern: /innatePriors:\s*{/ },
  { name: 'narrativeSelf', pattern: /narrativeSelf:\s*{/ },
  { name: 'valueConflictSystem', pattern: /valueConflictSystem:\s*{/ },
  { name: 'cognitiveGovernance', pattern: /cognitiveGovernance:\s*{/ },
  { name: 'sensorimotorGrounding', pattern: /sensorimotorGrounding:\s*{/ },
  { name: 'checklist', pattern: /checklist:\s*{/ },
  { name: 'antiPatterns', pattern: /antiPatterns:\s*\[/ },
  { name: 'integrationWithManifest200', pattern: /integrationWithManifest200:\s*{/ },
  { name: 'export default', pattern: /export default AGI_SELF_IDENTITY_MANIFEST/ }
];

console.log('📋 VERIFICANDO SEÇÕES DO MANIFESTO:\n');

let allPassed = true;
for (const section of sections) {
  const found = section.pattern.test(content);
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${section.name}`);
  if (!found) allPassed = false;
}

// Verificar invariantes éticos
console.log('\n📋 VERIFICANDO INVARIANTES ÉTICOS:\n');
const invariants = [
  'INV-001',
  'INV-002',
  'INV-003',
  'INV-004',
  'INV-005'
];

for (const inv of invariants) {
  const found = content.includes(inv);
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${inv}`);
  if (!found) allPassed = false;
}

// Verificar zonas do sandbox
console.log('\n📋 VERIFICANDO ZONAS DO SANDBOX:\n');
const zones = [
  'IMMUTABLE_CORE',
  'RESTRICTED',
  'MONITORED',
  'FREE'
];

for (const zone of zones) {
  const found = content.includes(zone);
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${zone}`);
  if (!found) allPassed = false;
}

// Verificar componentes de priors
console.log('\n📋 VERIFICANDO PRIORS INATOS:\n');
const priors = [
  'physicsIntuition',
  'agencyDetection',
  'baseValues',
  'causalityPriors',
  'attentionPriors'
];

for (const prior of priors) {
  const found = content.includes(prior);
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${prior}`);
  if (!found) allPassed = false;
}

// Verificar componentes do self narrativo
console.log('\n📋 VERIFICANDO SELF NARRATIVO:\n');
const selfComponents = [
  'autobiographicalMemory',
  'selfModel',
  'narrativeEngine',
  'continuityMechanisms'
];

for (const comp of selfComponents) {
  const found = content.includes(comp);
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${comp}`);
  if (!found) allPassed = false;
}

// Verificar helper functions
console.log('\n📋 VERIFICANDO HELPER FUNCTIONS:\n');
const helpers = [
  'canModifyComponent',
  'calculateSelfContinuity',
  'verifyEthicalInvariants',
  'generateSelfStatusReport'
];

for (const helper of helpers) {
  const found = content.includes(helper);
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${helper}`);
  if (!found) allPassed = false;
}

// Contar linhas
const lines = content.split('\n').length;
console.log(`\n📊 ESTATÍSTICAS:`);
console.log(`  - Total de linhas: ${lines}`);
console.log(`  - Tamanho: ${(content.length / 1024).toFixed(1)} KB`);

// Resultado final
console.log('\n' + '═'.repeat(70));
if (allPassed) {
  console.log('✅ TODOS OS TESTES PASSARAM!');
  console.log('   Manifesto 201 está completo e bem estruturado.');
} else {
  console.log('❌ ALGUNS TESTES FALHARAM!');
  console.log('   Verifique as seções marcadas com ❌');
}
console.log('═'.repeat(70));
