/**
 * 🤖 TESTE DO MANIFESTO GEMINI ROBOTICS-ER
 * 
 * Verifica se o manifesto de robótica está corretamente integrado no sistema.
 */

import { shouldEnableGeminiRobotics, GEMINI_ROBOTICS_MANIFEST } from '../services/manifestos/GEMINI_ROBOTICS_MANIFEST';
import { detectActiveManifests, getManifestInfo } from '../services/manifestos/ManifestOrchestrator';
import { alexandriaBridge } from '../services/AlexandriaManifestBridge';
import { knowledgeBase } from '../services/KnowledgeBase';

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║              🤖 TESTE DO MANIFESTO GEMINI ROBOTICS-ER 🤖                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 1: Verificar se o manifesto existe
// ═══════════════════════════════════════════════════════════════════════════════

console.log('📋 TESTE 1: Verificar se o manifesto existe');
console.log('─'.repeat(60));

if (GEMINI_ROBOTICS_MANIFEST && GEMINI_ROBOTICS_MANIFEST.length > 1000) {
  console.log('✅ Manifesto GEMINI_ROBOTICS_MANIFEST existe e tem conteúdo');
  console.log(`   Tamanho: ${GEMINI_ROBOTICS_MANIFEST.length} caracteres`);
} else {
  console.log('❌ Manifesto não encontrado ou vazio');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 2: Verificar detecção de keywords
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 2: Verificar detecção de keywords');
console.log('─'.repeat(60));

const testPrompts = [
  'Crie um sistema de robótica com ROS2',
  'Quero um braço robótico para pick and place',
  'Desenvolva um robô com navegação autônoma usando SLAM',
  'Crie um sistema de manipulação com MuJoCo',
  'Quero um robô com Gazebo e motion planning',
  'Desenvolva um sistema de embodied AI',
  'Crie um gripper controller com inverse kinematics',
  'Quero integrar com Universal Robots UR5',
];

for (const prompt of testPrompts) {
  const detected = shouldEnableGeminiRobotics(prompt);
  console.log(`${detected ? '✅' : '❌'} "${prompt.substring(0, 50)}..."`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 3: Verificar integração com ManifestOrchestrator
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 3: Verificar integração com ManifestOrchestrator');
console.log('─'.repeat(60));

const roboticsPrompt = 'Crie um sistema de robótica com ROS2 e MuJoCo para manipulação';
const activeManifests = detectActiveManifests(roboticsPrompt);

console.log(`Prompt: "${roboticsPrompt}"`);
console.log(`Manifestos detectados: ${activeManifests.length}`);

for (const manifest of activeManifests) {
  console.log(`  - ${manifest.name} (Level ${manifest.level}) - Confiança: ${manifest.confidence.toFixed(1)}%`);
}

const hasRobotics = activeManifests.some(m => m.name === 'GEMINI_ROBOTICS');
console.log(`\n${hasRobotics ? '✅' : '❌'} GEMINI_ROBOTICS ${hasRobotics ? 'detectado' : 'NÃO detectado'}`);

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 4: Verificar getManifestInfo
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 4: Verificar getManifestInfo');
console.log('─'.repeat(60));

const manifestInfo = getManifestInfo() as any;
console.log(`Total de manifestos: ${manifestInfo.totalManifests}`);

if (manifestInfo.levels[25]) {
  console.log(`✅ Level 25 registrado: ${manifestInfo.levels[25].name}`);
  console.log(`   Descrição: ${manifestInfo.levels[25].description}`);
} else {
  console.log('❌ Level 25 não encontrado');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 5: Verificar integração com AlexandriaManifestBridge
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 5: Verificar integração com AlexandriaManifestBridge');
console.log('─'.repeat(60));

const searchResults = alexandriaBridge.searchByPrompt('robótica ros2 manipulação');
console.log(`Resultados da busca: ${searchResults.length}`);

for (const result of searchResults.slice(0, 3)) {
  console.log(`  - ${result.manifest.name} (Level ${result.manifest.level}) - Relevância: ${(result.relevance * 100).toFixed(1)}%`);
}

const hasRoboticsInBridge = searchResults.some(r => r.manifest.name === 'GEMINI_ROBOTICS');
console.log(`\n${hasRoboticsInBridge ? '✅' : '❌'} GEMINI_ROBOTICS ${hasRoboticsInBridge ? 'encontrado' : 'NÃO encontrado'} no Alexandria Bridge`);

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 6: Verificar integração com KnowledgeBase
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 6: Verificar integração com KnowledgeBase');
console.log('─'.repeat(60));

const kbResults = knowledgeBase.query('robótica ros2 manipulação braço robótico');
console.log(`Resultados da KnowledgeBase: ${kbResults.length}`);

for (const result of kbResults) {
  console.log(`  - ${result.domain} - Relevância: ${(result.relevance * 100).toFixed(1)}%`);
}

const hasRoboticsInKB = kbResults.some(r => r.domain === 'robotics');
console.log(`\n${hasRoboticsInKB ? '✅' : '❌'} Domínio 'robotics' ${hasRoboticsInKB ? 'encontrado' : 'NÃO encontrado'} na KnowledgeBase`);

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMO
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                              📊 RESUMO                                       ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

const tests = [
  { name: 'Manifesto existe', passed: GEMINI_ROBOTICS_MANIFEST.length > 1000 },
  { name: 'Detecção de keywords', passed: shouldEnableGeminiRobotics('robótica ros2') },
  { name: 'ManifestOrchestrator', passed: hasRobotics },
  { name: 'getManifestInfo Level 25', passed: !!manifestInfo.levels[25] },
  { name: 'AlexandriaManifestBridge', passed: hasRoboticsInBridge },
  { name: 'KnowledgeBase', passed: hasRoboticsInKB },
];

let passedCount = 0;
for (const test of tests) {
  console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  if (test.passed) passedCount++;
}

console.log(`\n📊 Resultado: ${passedCount}/${tests.length} testes passaram`);

if (passedCount === tests.length) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM! O manifesto de robótica está integrado corretamente.');
} else {
  console.log('\n⚠️ Alguns testes falharam. Verifique a integração.');
}
