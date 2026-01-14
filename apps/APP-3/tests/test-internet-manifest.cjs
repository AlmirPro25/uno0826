/**
 * Teste do INTERNET_SUPREME_MANIFEST
 * Verifica a integração com AlexandriaManifestBridge
 */

const assert = require('assert');

console.log('🌐 Testando INTERNET_SUPREME_MANIFEST...\n');

// ============================================================
// TESTE 1: Verificar se o arquivo do manifesto existe
// ============================================================
console.log('📁 Teste 1: Verificando arquivo do manifesto...');
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../services/manifestos/INTERNET_SUPREME_MANIFEST.ts');
assert(fs.existsSync(manifestPath), 'Arquivo INTERNET_SUPREME_MANIFEST.ts não encontrado!');
console.log('   ✅ Arquivo existe\n');

// ============================================================
// TESTE 2: Verificar conteúdo do manifesto
// ============================================================
console.log('📄 Teste 2: Verificando conteúdo do manifesto...');
const manifestContent = fs.readFileSync(manifestPath, 'utf-8');

// Verificar estrutura básica
assert(manifestContent.includes('export const INTERNET_SUPREME_MANIFEST'), 'Export não encontrado');
assert(manifestContent.includes('metadata'), 'Metadata não encontrada');
assert(manifestContent.includes('activationKeywords'), 'Keywords não encontradas');
assert(manifestContent.includes('protocols'), 'Protocolos não encontrados');
assert(manifestContent.includes('infrastructure'), 'Infraestrutura não encontrada');
console.log('   ✅ Estrutura básica OK\n');

// ============================================================
// TESTE 3: Verificar integração no AlexandriaManifestBridge
// ============================================================
console.log('🌉 Teste 3: Verificando integração no Alexandria...');
const bridgePath = path.join(__dirname, '../services/AlexandriaManifestBridge.ts');
const bridgeContent = fs.readFileSync(bridgePath, 'utf-8');

// Verificar import
assert(
  bridgeContent.includes("import { INTERNET_SUPREME_MANIFEST } from './manifestos/INTERNET_SUPREME_MANIFEST'"),
  'Import do INTERNET_SUPREME_MANIFEST não encontrado no Alexandria!'
);
console.log('   ✅ Import encontrado');

// Verificar entrada no catálogo
assert(
  bridgeContent.includes("name: 'INTERNET_SUPREME'"),
  'Entrada INTERNET_SUPREME não encontrada no catálogo!'
);
console.log('   ✅ Entrada no catálogo encontrada');

// Verificar keywords
assert(
  bridgeContent.includes("'tcp/ip'") || bridgeContent.includes("'internet'"),
  'Keywords de internet não encontradas!'
);
console.log('   ✅ Keywords configuradas\n');

// ============================================================
// TESTE 4: Verificar protocolos no manifesto
// ============================================================
console.log('🔌 Teste 4: Verificando protocolos...');
const protocolos = ['TCP', 'UDP', 'HTTP', 'DNS', 'TLS', 'BGP', 'WebSocket', 'QUIC'];
protocolos.forEach(proto => {
  assert(manifestContent.includes(proto), `Protocolo ${proto} não encontrado!`);
});
console.log('   ✅ Todos os protocolos principais presentes\n');

// ============================================================
// TESTE 5: Verificar infraestrutura
// ============================================================
console.log('🏗️ Teste 5: Verificando infraestrutura...');
const infraItems = ['submarineCables', 'dataCenters', 'ixps', 'cdn:'];
infraItems.forEach(item => {
  assert(manifestContent.includes(item), `Item de infraestrutura ${item} não encontrado!`);
});
console.log('   ✅ Infraestrutura completa\n');

// ============================================================
// TESTE 6: Verificar história da internet
// ============================================================
console.log('📜 Teste 6: Verificando história...');
const historiaItems = ['ARPANET', 'Tim Berners-Lee', 'Web 1.0', 'Web 2.0'];
historiaItems.forEach(item => {
  assert(manifestContent.includes(item), `Item histórico ${item} não encontrado!`);
});
console.log('   ✅ História documentada\n');

// ============================================================
// TESTE 7: Verificar funções helper
// ============================================================
console.log('🔧 Teste 7: Verificando funções helper...');
const helpers = [
  'shouldActivateInternetManifest',
  'getProtocolInfo',
  'getDiagnosticCommands',
  'getExpertChecklist'
];
helpers.forEach(fn => {
  assert(manifestContent.includes(`export function ${fn}`), `Função ${fn} não encontrada!`);
});
console.log('   ✅ Funções helper presentes\n');

// ============================================================
// RESULTADO FINAL
// ============================================================
console.log('═'.repeat(60));
console.log('🎉 TODOS OS TESTES PASSARAM!');
console.log('═'.repeat(60));
console.log('\n📊 Resumo:');
console.log('   • Manifesto: INTERNET_SUPREME_MANIFEST.ts ✅');
console.log('   • Integração Alexandria: OK ✅');
console.log('   • Protocolos: 8+ documentados ✅');
console.log('   • Infraestrutura: Completa ✅');
console.log('   • História: Documentada ✅');
console.log('   • Funções Helper: 4+ disponíveis ✅');
console.log('\n🌐 Internet Supreme Master está pronto para uso!');
