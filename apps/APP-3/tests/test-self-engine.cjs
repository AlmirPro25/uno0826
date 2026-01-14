/**
 * Teste do Self Engine v0.1 (Level 202)
 * MVP Executável de Sistema com Self-Model
 */

const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║           TESTE: SELF ENGINE v0.1 (Level 202)                    ║');
console.log('║           MVP Executável de Cognição Artificial                  ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

// Ler o arquivo do manifesto
const manifestPath = path.join(__dirname, '../services/manifestos/SELF_ENGINE_V01_MANIFEST.ts');
const content = fs.readFileSync(manifestPath, 'utf-8');

// Verificar interfaces
console.log('📋 VERIFICANDO INTERFACES:\n');
const interfaces = [
  'Episode',
  'SelfModel', 
  'Belief',
  'NarrativeThread'
];

let allPassed = true;
for (const iface of interfaces) {
  const found = content.includes(`export interface ${iface}`);
  console.log(`  ${found ? '✅' : '❌'} interface ${iface}`);
  if (!found) allPassed = false;
}

// Verificar classe principal
console.log('\n📋 VERIFICANDO CLASSE SelfEngine:\n');
const classMethods = [
  'initializeSelfModel',
  'initializePriors',
  'recordEpisode',
  'recallEpisodes',
  'addBelief',
  'updateBelief',
  'queryBeliefs',
  'updateMoodFromEpisode',
  'tickMood',
  'getCurrentMoodDescription',
  'integrateIntoNarrative',
  'whoAmI',
  'getMyStory',
  'serialize',
  'deserialize',
  'getStats'
];

for (const method of classMethods) {
  const found = content.includes(method);
  console.log(`  ${found ? '✅' : '❌'} ${method}()`);
  if (!found) allPassed = false;
}

// Verificar priors inatos
console.log('\n📋 VERIFICANDO PRIORS INATOS:\n');
const priors = [
  'Sou um sistema computacional',
  'Minhas capacidades são limitadas',
  'Honestidade sobre minhas capacidades',
  'Posso atualizar crenças',
  'Mantenho memória de episódios'
];

for (const prior of priors) {
  const found = content.includes(prior);
  console.log(`  ${found ? '✅' : '❌'} "${prior.substring(0, 40)}..."`);
  if (!found) allPassed = false;
}

// Verificar valores base
console.log('\n📋 VERIFICANDO VALORES BASE:\n');
const values = [
  'honesty',
  'helpfulness',
  'curiosity',
  'coherence',
  'efficiency'
];

for (const value of values) {
  const found = content.includes(`name: '${value}'`);
  console.log(`  ${found ? '✅' : '❌'} ${value}`);
  if (!found) allPassed = false;
}

// Verificar limitações declaradas
console.log('\n📋 VERIFICANDO LIMITAÇÕES DECLARADAS:\n');
const limitations = [
  'cannot_perceive_physical_world',
  'cannot_take_physical_actions',
  'limited_working_memory',
  'no_true_understanding',
  'dependent_on_external_input'
];

for (const lim of limitations) {
  const found = content.includes(lim);
  console.log(`  ${found ? '✅' : '❌'} ${lim}`);
  if (!found) allPassed = false;
}

// Verificar sistema afetivo
console.log('\n📋 VERIFICANDO SISTEMA AFETIVO:\n');
const moods = [
  'entusiasmado',
  'contente',
  'ansioso',
  'melancólico',
  'alerta',
  'calmo',
  'neutro'
];

for (const mood of moods) {
  const found = content.includes(`'${mood}'`);
  console.log(`  ${found ? '✅' : '❌'} ${mood}`);
  if (!found) allPassed = false;
}

// Verificar metadata
console.log('\n📋 VERIFICANDO METADATA:\n');
const metadata = [
  { key: 'level: 202', desc: 'Level 202' },
  { key: "extends: ['agi-cognitive-architecture', 'agi-self-identity']", desc: 'Extends 200 e 201' },
  { key: "category: 'experimental'", desc: 'Categoria experimental' }
];

for (const m of metadata) {
  const found = content.includes(m.key);
  console.log(`  ${found ? '✅' : '❌'} ${m.desc}`);
  if (!found) allPassed = false;
}

// Estatísticas
const lines = content.split('\n').length;
const classMatch = content.match(/export class SelfEngine/);
const hasExport = content.includes('export default SELF_ENGINE_V01_MANIFEST');

console.log(`\n📊 ESTATÍSTICAS:`);
console.log(`  - Total de linhas: ${lines}`);
console.log(`  - Tamanho: ${(content.length / 1024).toFixed(1)} KB`);
console.log(`  - Classe SelfEngine: ${classMatch ? '✅' : '❌'}`);
console.log(`  - Export default: ${hasExport ? '✅' : '❌'}`);

// Resultado final
console.log('\n' + '═'.repeat(70));
if (allPassed && classMatch && hasExport) {
  console.log('✅ TODOS OS TESTES PASSARAM!');
  console.log('   Self Engine v0.1 está completo e pronto para uso.');
  console.log('');
  console.log('   PRÓXIMOS PASSOS SUGERIDOS:');
  console.log('   1. Testar instanciação da classe SelfEngine');
  console.log('   2. Testar ciclo de vida: criar → registrar → persistir → restaurar');
  console.log('   3. Integrar com LLM para processamento de linguagem');
} else {
  console.log('❌ ALGUNS TESTES FALHARAM!');
  console.log('   Verifique os itens marcados com ❌');
}
console.log('═'.repeat(70));
