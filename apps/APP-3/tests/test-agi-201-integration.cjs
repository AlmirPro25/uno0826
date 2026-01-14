/**
 * Teste de Integração: AGI Self & Identity com AlexandriaManifestBridge
 */

const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║    TESTE: INTEGRAÇÃO AGI 201 COM ALEXANDRIA BRIDGE               ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

// Ler o arquivo do bridge
const bridgePath = path.join(__dirname, '../services/AlexandriaManifestBridge.ts');
const content = fs.readFileSync(bridgePath, 'utf-8');

console.log('📋 VERIFICANDO INTEGRAÇÃO:\n');

// 1. Verificar import
const hasImport = content.includes("import { AGI_SELF_IDENTITY_MANIFEST } from './manifestos/AGI_SELF_IDENTITY_MANIFEST'");
console.log(`  ${hasImport ? '✅' : '❌'} Import do AGI_SELF_IDENTITY_MANIFEST`);

// 2. Verificar entrada no catálogo
const hasCatalogEntry = content.includes("name: 'AGI_SELF_IDENTITY'");
console.log(`  ${hasCatalogEntry ? '✅' : '❌'} Entrada no catálogo`);

// 3. Verificar level 201
const hasLevel201 = content.includes("level: 201");
console.log(`  ${hasLevel201 ? '✅' : '❌'} Level 201 definido`);

// 4. Verificar keywords
const keywords = [
  'narrative self',
  'innate priors',
  'cognitive governance',
  'kill switch',
  'ethical invariants',
  'autobiographical memory',
  'value conflict'
];

console.log('\n📋 VERIFICANDO KEYWORDS:\n');
let keywordsFound = 0;
for (const kw of keywords) {
  const found = content.includes(kw);
  console.log(`  ${found ? '✅' : '❌'} "${kw}"`);
  if (found) keywordsFound++;
}

// 5. Verificar JSON.stringify
const hasStringify = content.includes("JSON.stringify(AGI_SELF_IDENTITY_MANIFEST)");
console.log(`\n  ${hasStringify ? '✅' : '❌'} JSON.stringify do manifesto`);

// Resultado
console.log('\n' + '═'.repeat(70));
const allPassed = hasImport && hasCatalogEntry && hasLevel201 && hasStringify && keywordsFound === keywords.length;
if (allPassed) {
  console.log('✅ INTEGRAÇÃO COMPLETA!');
  console.log('   Manifesto 201 está corretamente integrado ao Alexandria Bridge.');
} else {
  console.log('⚠️ INTEGRAÇÃO PARCIAL');
  console.log('   Verifique os itens marcados com ❌');
}
console.log('═'.repeat(70));

// Contar manifestos no catálogo
const manifestCount = (content.match(/name: '/g) || []).length;
console.log(`\n📊 Total de manifestos no catálogo: ${manifestCount}`);
