/**
 * Script para verificar manifestos não conectados no Alexandria Bridge
 */

const fs = require('fs');
const path = require('path');

// Ler todos os manifestos existentes
const manifestosDir = path.join(__dirname, '..', 'services', 'manifestos');
const allFiles = fs.readdirSync(manifestosDir).filter(f => f.endsWith('_MANIFEST.ts'));
const allManifests = allFiles.map(f => f.replace('.ts', ''));

// Ler o Alexandria Bridge
const bridgePath = path.join(__dirname, '..', 'services', 'AlexandriaManifestBridge.ts');
const bridgeContent = fs.readFileSync(bridgePath, 'utf-8');

// Encontrar imports
const importRegex = /import.*from.*'\.\/manifestos\/([^']+)'/g;
const connected = [];
let match;
while ((match = importRegex.exec(bridgeContent)) !== null) {
  connected.push(match[1].replace('.ts', '').replace(/'/g, ''));
}

// Encontrar não conectados
// THREE_PHASE_PIPELINE é importado via PHASE_1, PHASE_2, PHASE_3
const specialCases = {
  'THREE_PHASE_PIPELINE_MANIFEST': ['PHASE_1_ARCHITECT', 'PHASE_2_DESIGNER', 'PHASE_3_FINALIZER']
};

const notConnected = allManifests.filter(m => {
  // Verificar casos especiais
  if (specialCases[m]) {
    return !specialCases[m].some(sc => bridgeContent.includes(sc));
  }
  return !connected.some(c => m.includes(c) || c.includes(m));
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('📊 ANÁLISE DE MANIFESTOS - ALEXANDRIA BRIDGE');
console.log('═══════════════════════════════════════════════════════════════════\n');

console.log(`✅ Total de manifestos: ${allManifests.length}`);
console.log(`✅ Conectados no Alexandria: ${connected.length}`);
console.log(`❌ NÃO conectados: ${notConnected.length}\n`);

if (notConnected.length > 0) {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('❌ MANIFESTOS NÃO CONECTADOS NO ALEXANDRIA BRIDGE:');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  notConnected.forEach((m, i) => {
    console.log(`${i + 1}. ${m}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('📝 IMPORTS PARA ADICIONAR:');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  notConnected.forEach(m => {
    const exportName = m.replace('_MANIFEST', '_MANIFEST');
    console.log(`import { ${exportName} } from './manifestos/${m}';`);
  });
}

console.log('\n');
