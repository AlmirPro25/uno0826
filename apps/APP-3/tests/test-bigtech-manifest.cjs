/**
 * 🏢 TESTE DO BIGTECH ARCHITECT MANIFEST
 * 
 * Verifica se o manifesto está completo e funcional
 * 
 * Executar: node tests/test-bigtech-manifest.cjs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('');
console.log('🏢 ═══════════════════════════════════════════════════════════════');
console.log('   TESTE DO BIGTECH ARCHITECT MANIFEST');
console.log('   Verificando estrutura e integridade do manifesto');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

// ============================================================
// CARREGAR MANIFESTO
// ============================================================
const manifestPath = path.join(__dirname, '../services/manifestos/BIGTECH_ARCHITECT_MANIFEST.ts');
let manifestContent = '';

try {
  manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  console.log('✅ Arquivo do manifesto encontrado');
} catch (error) {
  console.log('❌ Arquivo do manifesto não encontrado:', manifestPath);
  process.exit(1);
}

// ============================================================
// TESTES
// ============================================================
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Erro: ${error.message}`);
    failed++;
  }
}

// ============================================================
// TESTES DE ESTRUTURA
// ============================================================
console.log('\n📋 TESTES DE ESTRUTURA');
console.log('─'.repeat(50));

test('Manifesto deve ter metadata', () => {
  assert.ok(manifestContent.includes('metadata:'), 'metadata não encontrado');
  assert.ok(manifestContent.includes("id: 'bigtech-architect'"), 'id não encontrado');
  assert.ok(manifestContent.includes('level: 100'), 'level não encontrado');
});

test('Manifesto deve ter philosophy', () => {
  assert.ok(manifestContent.includes('philosophy:'), 'philosophy não encontrado');
  assert.ok(manifestContent.includes('core:'), 'core philosophy não encontrado');
  assert.ok(manifestContent.includes('principles:'), 'principles não encontrado');
});

test('Manifesto deve ter as 6 gigantes', () => {
  assert.ok(manifestContent.includes('giants:'), 'giants não encontrado');
  assert.ok(manifestContent.includes('google:'), 'google não encontrado');
  assert.ok(manifestContent.includes('meta:'), 'meta não encontrado');
  assert.ok(manifestContent.includes('amazon:'), 'amazon não encontrado');
  assert.ok(manifestContent.includes('microsoft:'), 'microsoft não encontrado');
  assert.ok(manifestContent.includes('apple:'), 'apple não encontrado');
  assert.ok(manifestContent.includes('netflix:'), 'netflix não encontrado');
});

test('Manifesto deve ter architecturePatterns', () => {
  assert.ok(manifestContent.includes('architecturePatterns:'), 'architecturePatterns não encontrado');
  assert.ok(manifestContent.includes('microservices:'), 'microservices não encontrado');
  assert.ok(manifestContent.includes('eventDriven:'), 'eventDriven não encontrado');
  assert.ok(manifestContent.includes('dataMesh:'), 'dataMesh não encontrado');
  assert.ok(manifestContent.includes('cellBased:'), 'cellBased não encontrado');
  assert.ok(manifestContent.includes('edgeComputing:'), 'edgeComputing não encontrado');
});

test('Manifesto deve ter scaleNumbers', () => {
  assert.ok(manifestContent.includes('scaleNumbers:'), 'scaleNumbers não encontrado');
  assert.ok(manifestContent.includes('8.5 bilhões'), 'Google search queries não encontrado');
  assert.ok(manifestContent.includes('3.19 bilhões'), 'Meta DAU não encontrado');
});

test('Manifesto deve ter techStack', () => {
  assert.ok(manifestContent.includes('techStack:'), 'techStack não encontrado');
  assert.ok(manifestContent.includes('languages:'), 'languages não encontrado');
  assert.ok(manifestContent.includes('databases:'), 'databases não encontrado');
  assert.ok(manifestContent.includes('infrastructure:'), 'infrastructure não encontrado');
});

test('Manifesto deve ter engineeringPractices', () => {
  assert.ok(manifestContent.includes('engineeringPractices:'), 'engineeringPractices não encontrado');
  assert.ok(manifestContent.includes('development:'), 'development não encontrado');
  assert.ok(manifestContent.includes('operations:'), 'operations não encontrado');
  assert.ok(manifestContent.includes('security:'), 'security não encontrado');
});

test('Manifesto deve ter fundamentalPapers', () => {
  assert.ok(manifestContent.includes('fundamentalPapers:'), 'fundamentalPapers não encontrado');
  assert.ok(manifestContent.includes('MapReduce'), 'MapReduce paper não encontrado');
  assert.ok(manifestContent.includes('Dynamo'), 'Dynamo paper não encontrado');
  assert.ok(manifestContent.includes('Spanner'), 'Spanner paper não encontrado');
  assert.ok(manifestContent.includes('Borg'), 'Borg paper não encontrado');
});

test('Manifesto deve ter systemTemplate', () => {
  assert.ok(manifestContent.includes('systemTemplate:'), 'systemTemplate não encontrado');
  assert.ok(manifestContent.includes('sampleArchitecture:'), 'sampleArchitecture não encontrado');
  assert.ok(manifestContent.includes('BIGTECH ARCHITECTURE'), 'ASCII diagram não encontrado');
});

test('Manifesto deve ter metricsAndSLOs', () => {
  assert.ok(manifestContent.includes('metricsAndSLOs:'), 'metricsAndSLOs não encontrado');
  assert.ok(manifestContent.includes('goldenSignals:'), 'goldenSignals não encontrado');
  assert.ok(manifestContent.includes('sloExamples:'), 'sloExamples não encontrado');
  assert.ok(manifestContent.includes('errorBudget:'), 'errorBudget não encontrado');
});

test('Manifesto deve ter cultureAndOrg', () => {
  assert.ok(manifestContent.includes('cultureAndOrg:'), 'cultureAndOrg não encontrado');
  assert.ok(manifestContent.includes('teamStructure:'), 'teamStructure não encontrado');
  assert.ok(manifestContent.includes('engineeringLevels:'), 'engineeringLevels não encontrado');
  assert.ok(manifestContent.includes('interviewProcess:'), 'interviewProcess não encontrado');
});

test('Manifesto deve ter checklist', () => {
  assert.ok(manifestContent.includes('checklist:'), 'checklist não encontrado');
  assert.ok(manifestContent.includes('architecture:'), 'architecture checklist não encontrado');
  assert.ok(manifestContent.includes('observability:'), 'observability checklist não encontrado');
});

test('Manifesto deve ter antiPatterns', () => {
  assert.ok(manifestContent.includes('antiPatterns:'), 'antiPatterns não encontrado');
  assert.ok(manifestContent.includes('Distributed Monolith'), 'Distributed Monolith não encontrado');
  assert.ok(manifestContent.includes('Shared Database'), 'Shared Database não encontrado');
});

// ============================================================
// TESTES DE EXPORTS
// ============================================================
console.log('\n📦 TESTES DE EXPORTS');
console.log('─'.repeat(50));

test('Manifesto deve exportar BIGTECH_ARCHITECT_MANIFEST', () => {
  assert.ok(manifestContent.includes('export const BIGTECH_ARCHITECT_MANIFEST'), 'export principal não encontrado');
});

test('Manifesto deve exportar BIGTECH_ARCHITECT_MANIFEST_STRING', () => {
  assert.ok(manifestContent.includes('export const BIGTECH_ARCHITECT_MANIFEST_STRING'), 'export string não encontrado');
});

test('Manifesto deve exportar helper functions', () => {
  assert.ok(manifestContent.includes('export function getBigTechByName'), 'getBigTechByName não encontrado');
  assert.ok(manifestContent.includes('export function getArchitecturePattern'), 'getArchitecturePattern não encontrado');
  assert.ok(manifestContent.includes('export function getFundamentalPapers'), 'getFundamentalPapers não encontrado');
  assert.ok(manifestContent.includes('export function getScaleNumbers'), 'getScaleNumbers não encontrado');
  assert.ok(manifestContent.includes('export function getChecklist'), 'getChecklist não encontrado');
});

test('Manifesto deve ter export default', () => {
  assert.ok(manifestContent.includes('export default BIGTECH_ARCHITECT_MANIFEST'), 'export default não encontrado');
});

// ============================================================
// TESTES DE CONTEÚDO ESPECÍFICO
// ============================================================
console.log('\n🔍 TESTES DE CONTEÚDO ESPECÍFICO');
console.log('─'.repeat(50));

test('Google deve ter segredos de engenharia', () => {
  assert.ok(manifestContent.includes('mapReduce:'), 'mapReduce não encontrado');
  assert.ok(manifestContent.includes('bigtable:'), 'bigtable não encontrado');
  assert.ok(manifestContent.includes('spanner:'), 'spanner não encontrado');
  assert.ok(manifestContent.includes('borg:'), 'borg não encontrado');
  assert.ok(manifestContent.includes('tensorflow:'), 'tensorflow não encontrado');
  assert.ok(manifestContent.includes('sre:'), 'sre não encontrado');
});

test('Meta deve ter segredos de engenharia', () => {
  assert.ok(manifestContent.includes('tao:'), 'tao não encontrado');
  assert.ok(manifestContent.includes('react:'), 'react não encontrado');
  assert.ok(manifestContent.includes('graphql:'), 'graphql não encontrado');
  assert.ok(manifestContent.includes('pytorch:'), 'pytorch não encontrado');
});

test('Amazon deve ter segredos de engenharia', () => {
  assert.ok(manifestContent.includes('dynamo:'), 'dynamo não encontrado');
  assert.ok(manifestContent.includes('twoTeamPizza:'), 'twoTeamPizza não encontrado');
  assert.ok(manifestContent.includes('aws:'), 'aws não encontrado');
});

test('Netflix deve ter segredos de engenharia', () => {
  assert.ok(manifestContent.includes('chaosEngineering:'), 'chaosEngineering não encontrado');
  assert.ok(manifestContent.includes('Chaos Monkey'), 'Chaos Monkey não encontrado');
  assert.ok(manifestContent.includes('openConnect:'), 'openConnect não encontrado');
});

test('Papers devem ter URLs', () => {
  assert.ok(manifestContent.includes('url:'), 'URLs de papers não encontrados');
  assert.ok(manifestContent.includes('https://'), 'Links https não encontrados');
});

// ============================================================
// TESTES DE INTEGRAÇÃO COM ALEXANDRIA
// ============================================================
console.log('\n🌉 TESTES DE INTEGRAÇÃO COM ALEXANDRIA');
console.log('─'.repeat(50));

const bridgePath = path.join(__dirname, '../services/AlexandriaManifestBridge.ts');
let bridgeContent = '';

try {
  bridgeContent = fs.readFileSync(bridgePath, 'utf-8');
  console.log('✅ Arquivo AlexandriaManifestBridge encontrado');
} catch (error) {
  console.log('⚠️  AlexandriaManifestBridge não encontrado (opcional)');
}

if (bridgeContent) {
  test('Alexandria deve importar BIGTECH_ARCHITECT_MANIFEST', () => {
    assert.ok(
      bridgeContent.includes("import { BIGTECH_ARCHITECT_MANIFEST }"),
      'Import não encontrado no Alexandria'
    );
  });

  test('Alexandria deve ter entrada no catálogo para BigTech', () => {
    assert.ok(
      bridgeContent.includes("name: 'BIGTECH_ARCHITECT'"),
      'Entrada no catálogo não encontrada'
    );
  });

  test('Alexandria deve ter keywords para BigTech', () => {
    assert.ok(
      bridgeContent.includes('bigtech') || bridgeContent.includes('google') || bridgeContent.includes('escala'),
      'Keywords não encontradas'
    );
  });
}

// ============================================================
// TESTES DE STEERING FILE
// ============================================================
console.log('\n📄 TESTES DE STEERING FILE');
console.log('─'.repeat(50));

const steeringPath = path.join(__dirname, '../.kiro/steering/bigtech-architect.md');
let steeringContent = '';

try {
  steeringContent = fs.readFileSync(steeringPath, 'utf-8');
  console.log('✅ Arquivo steering encontrado');
} catch (error) {
  console.log('⚠️  Steering file não encontrado (opcional)');
}

if (steeringContent) {
  test('Steering deve ter seção de ativação', () => {
    assert.ok(
      steeringContent.includes('ATIVAÇÃO') || steeringContent.includes('ativação'),
      'Seção de ativação não encontrada'
    );
  });

  test('Steering deve mencionar BigTech keywords', () => {
    assert.ok(
      steeringContent.includes('BigTech') || steeringContent.includes('Google') || steeringContent.includes('escala'),
      'Keywords BigTech não encontradas'
    );
  });
}

// ============================================================
// RESULTADO FINAL
// ============================================================
console.log('\n');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('📊 RESULTADO FINAL');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`   ✅ Passou: ${passed}`);
console.log(`   ❌ Falhou: ${failed}`);
console.log(`   📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════════════════');

if (failed > 0) {
  console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
  process.exit(1);
} else {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  console.log('   O manifesto BigTech Architect está completo e funcional.');
  process.exit(0);
}
