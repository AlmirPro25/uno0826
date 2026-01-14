/**
 * 🧪 TESTE DA ALEXANDRIA MANIFEST BRIDGE
 * 
 * Este arquivo testa a integração entre:
 * - KnowledgeBase (Biblioteca de Alexandria)
 * - ManifestOrchestrator
 * - AuroraBuilder
 */

import { 
  alexandriaBridge, 
  listAllManifests, 
  searchManifests, 
  visualizeManifests,
  getAuroraManifestContext 
} from '../services/AlexandriaManifestBridge';

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧪 TESTE: ALEXANDRIA MANIFEST BRIDGE 🧪                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 1: Listar todos os manifestos
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 TESTE 1: Listando todos os manifestos...\n');

const allManifests = listAllManifests();
console.log(`Total de manifestos: ${allManifests.length}`);
console.log('\nManifestos por nível:');

for (const m of allManifests) {
  console.log(`  Level ${m.level.toString().padStart(2, '0')}: ${m.name.padEnd(15)} - ${m.description}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 2: Buscar manifestos por prompt
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n📋 TESTE 2: Buscando manifestos por prompt...\n');

const testPrompts = [
  'Criar um banco digital com PIX e transferências',
  'Desenvolver um jogo 3D com Unity',
  'Criar um sistema de machine learning com PyTorch',
  'Desenvolver um app mobile com Flutter',
  'Criar uma DAO com smart contracts em Solidity',
  'Desenvolver um sistema de IoT com ESP32',
  'Criar uma API realtime com WebSocket'
];

for (const prompt of testPrompts) {
  console.log(`\n🔍 Prompt: "${prompt}"`);
  const results = searchManifests(prompt);
  
  if (results.length > 0) {
    console.log(`   ✅ Manifestos encontrados: ${results.length}`);
    for (const r of results.slice(0, 3)) {
      console.log(`      - ${r.manifest.name} (${(r.relevance * 100).toFixed(0)}%) - Keywords: ${r.matchedKeywords.join(', ')}`);
    }
  } else {
    console.log('   ❌ Nenhum manifesto específico encontrado');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 3: Obter contexto para Aurora Builder
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n📋 TESTE 3: Contexto para Aurora Builder...\n');

const auroraPrompt = 'Criar um sistema de pagamentos com PIX usando Go e PostgreSQL';
const context = getAuroraManifestContext(auroraPrompt);

console.log(`🔍 Prompt: "${auroraPrompt}"`);
console.log('\n📄 Contexto gerado (primeiros 500 chars):');
console.log(context.substring(0, 500) + '...');

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 4: Estatísticas
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n📋 TESTE 4: Estatísticas dos manifestos...\n');

const stats = alexandriaBridge.getStats();
console.log(JSON.stringify(stats, null, 2));

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 5: Visualização completa
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n\n📋 TESTE 5: Visualização completa...\n');
console.log(visualizeManifests());

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    ✅ TODOS OS TESTES CONCLUÍDOS ✅                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
