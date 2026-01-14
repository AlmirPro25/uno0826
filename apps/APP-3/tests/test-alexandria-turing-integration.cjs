/**
 * Teste de Integração: Alan Turing Resurrection no Alexandria Bridge
 */

const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  🧠 TESTE: Alan Turing Resurrection no Alexandria Bridge     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    failed++;
  }
}

// Ler o arquivo AlexandriaManifestBridge.ts
const bridgePath = path.join(__dirname, '..', 'services', 'AlexandriaManifestBridge.ts');
const bridgeContent = fs.readFileSync(bridgePath, 'utf-8');

// Ler o arquivo do manifesto
const manifestPath = path.join(__dirname, '..', 'services', 'manifestos', 'ALAN_TURING_RESURRECTION_MANIFEST.ts');
const manifestExists = fs.existsSync(manifestPath);

console.log('=== VERIFICAÇÃO DE ARQUIVOS ===\n');

test('Manifesto ALAN_TURING_RESURRECTION_MANIFEST.ts existe', manifestExists);

test('Import do manifesto está presente no Bridge', 
  bridgeContent.includes("import { ALAN_TURING_RESURRECTION_MANIFEST } from './manifestos/ALAN_TURING_RESURRECTION_MANIFEST'"));

console.log('\n=== VERIFICAÇÃO DO CATÁLOGO ===\n');

test('Entrada ALAN_TURING_RESURRECTION no MANIFEST_CATALOG', 
  bridgeContent.includes("name: 'ALAN_TURING_RESURRECTION'"));

test('Level 999 (máximo especial)', 
  bridgeContent.includes('level: 999'));

test('Categoria fundamental', 
  bridgeContent.includes("category: 'fundamental'") && 
  bridgeContent.includes('ALAN_TURING_RESURRECTION'));

console.log('\n=== VERIFICAÇÃO DE KEYWORDS ===\n');

const keywords = [
  'alan turing',
  'turing',
  'máquina de turing',
  'turing machine',
  'teste de turing',
  'turing test',
  'enigma',
  'bletchley park',
  'morfogênese',
  'morphogenesis',
  'computabilidade',
  'halting problem',
  'inteligência artificial',
  'pai da computação'
];

keywords.forEach(kw => {
  test(`Keyword "${kw}" presente`, bridgeContent.includes(`'${kw}'`));
});

console.log('\n=== VERIFICAÇÃO DO MANIFESTO ===\n');

if (manifestExists) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  
  test('Manifesto exporta ALAN_TURING_RESURRECTION_MANIFEST', 
    manifestContent.includes('export const ALAN_TURING_RESURRECTION_MANIFEST'));
  
  test('Contém biografia de Turing', 
    manifestContent.includes('1912') && manifestContent.includes('1954'));
  
  test('Contém os 4 pilares', 
    manifestContent.includes('COMPUTATION_THEORY') || 
    manifestContent.includes('Teoria da Computação') ||
    manifestContent.includes('pillar'));
  
  test('Contém referência a Bletchley Park', 
    manifestContent.includes('Bletchley'));
  
  test('Contém referência ao Teste de Turing', 
    manifestContent.includes('Teste de Turing') || 
    manifestContent.includes('Turing Test') ||
    manifestContent.includes('Imitation Game'));
  
  test('Contém salvaguardas éticas', 
    manifestContent.includes('ética') || 
    manifestContent.includes('ethical') ||
    manifestContent.includes('safeguard'));
}

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 RESULTADO FINAL: ${passed} passou, ${failed} falhou`);
console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('🎉 ALAN TURING ESTÁ CONECTADO AO ALEXANDRIA! 🧠\n');
  console.log('O manifesto pode ser ativado por prompts como:');
  console.log('  - "Explique a máquina de Turing"');
  console.log('  - "Como funcionava o Enigma?"');
  console.log('  - "O que é o Teste de Turing?"');
  console.log('  - "Fale sobre Alan Turing"');
  console.log('  - "Morfogênese e padrões de Turing"');
} else {
  console.log('⚠️  Alguns testes falharam. Verifique a integração.');
  process.exit(1);
}
