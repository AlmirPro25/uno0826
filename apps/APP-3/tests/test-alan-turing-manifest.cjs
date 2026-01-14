/**
 * 🧠 Testes do Alan Turing Resurrection Manifest (CommonJS)
 */

const fs = require('fs');
const path = require('path');

console.log('🧠 TESTANDO ALAN TURING RESURRECTION MANIFEST\n');
console.log('='.repeat(60) + '\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    if (fn()) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (e) {
    console.log(`❌ ${name} - Error: ${e.message}`);
    failed++;
  }
}

// Ler o arquivo do manifesto
const manifestPath = path.join(__dirname, '../services/manifestos/ALAN_TURING_RESURRECTION_MANIFEST.ts');
const manifestContent = fs.readFileSync(manifestPath, 'utf-8');

// ============================================================
// TESTES DE ESTRUTURA DO ARQUIVO
// ============================================================
console.log('📋 TESTES DE ESTRUTURA DO ARQUIVO\n');

test('Arquivo do manifesto existe', () => {
  return fs.existsSync(manifestPath);
});

test('Manifesto tem metadata', () => {
  return manifestContent.includes('metadata:');
});

test('Manifesto tem id correto', () => {
  return manifestContent.includes("id: 'alan-turing-resurrection'");
});

test('Manifesto tem biografia', () => {
  return manifestContent.includes('biography:');
});

test('Manifesto tem pilares', () => {
  return manifestContent.includes('pillars:');
});

test('Manifesto tem obras primárias', () => {
  return manifestContent.includes('primaryWorks:');
});

test('Manifesto tem citações', () => {
  return manifestContent.includes('quotes:');
});

// ============================================================
// TESTES DE CONTEÚDO BIOGRÁFICO
// ============================================================
console.log('\n👤 TESTES DE CONTEÚDO BIOGRÁFICO\n');

test('Nome completo: Alan Mathison Turing', () => {
  return manifestContent.includes("fullName: 'Alan Mathison Turing'");
});

test('Data de nascimento: 1912-06-23', () => {
  return manifestContent.includes("date: '1912-06-23'");
});

test('Data de morte: 1954-06-07', () => {
  return manifestContent.includes("date: '1954-06-07'");
});

test('Local de nascimento: Maida Vale, Londres', () => {
  return manifestContent.includes('Maida Vale');
});

test('Educação em Cambridge', () => {
  return manifestContent.includes("King's College, Cambridge");
});

test('PhD em Princeton', () => {
  return manifestContent.includes('Princeton University');
});

test('Orientador: Alonzo Church', () => {
  return manifestContent.includes("advisor: 'Alonzo Church'");
});

test('Trabalhou em Bletchley Park', () => {
  return manifestContent.includes('Bletchley Park');
});

// ============================================================
// TESTES DOS QUATRO PILARES
// ============================================================
console.log('\n🏛️ TESTES DOS QUATRO PILARES\n');

test('Pilar 1: Teoria da Computação (1936)', () => {
  return manifestContent.includes('computationTheory:') && 
         manifestContent.includes('year: 1936');
});

test('Pilar 1: On Computable Numbers', () => {
  return manifestContent.includes('On Computable Numbers');
});

test('Pilar 1: Entscheidungsproblem', () => {
  return manifestContent.includes('Entscheidungsproblem');
});

test('Pilar 1: Máquina de Turing', () => {
  return manifestContent.includes('turingMachine:');
});

test('Pilar 1: Problema da Parada', () => {
  return manifestContent.includes('haltingProblem:');
});

test('Pilar 1: Máquina Universal', () => {
  return manifestContent.includes('universalMachine:');
});

test('Pilar 2: Criptoanálise', () => {
  return manifestContent.includes('cryptanalysis:');
});

test('Pilar 2: Enigma', () => {
  return manifestContent.includes("machine: 'Enigma'");
});

test('Pilar 2: Bombe', () => {
  return manifestContent.includes('bombe:');
});

test('Pilar 2: Banburismus', () => {
  return manifestContent.includes('banburismus:');
});

test('Pilar 3: Inteligência Artificial (1950)', () => {
  return manifestContent.includes('artificialIntelligence:') &&
         manifestContent.includes('year: 1950');
});

test('Pilar 3: Computing Machinery and Intelligence', () => {
  return manifestContent.includes('Computing Machinery and Intelligence');
});

test('Pilar 3: Teste de Turing / Jogo da Imitação', () => {
  return manifestContent.includes('imitationGame:');
});

test('Pilar 3: 9 Objeções', () => {
  return manifestContent.includes('nineObjections:');
});

test('Pilar 4: Biologia Matemática (1952)', () => {
  return manifestContent.includes('mathematicalBiology:') &&
         manifestContent.includes('year: 1952');
});

test('Pilar 4: Morfogênese', () => {
  return manifestContent.includes('Morphogenesis');
});

test('Pilar 4: Padrões de Turing', () => {
  return manifestContent.includes('turingPatterns:');
});


// ============================================================
// TESTES DE CITAÇÕES
// ============================================================
console.log('\n💬 TESTES DE CITAÇÕES\n');

test('Citação: "We can only see a short distance ahead"', () => {
  return manifestContent.includes('We can only see a short distance ahead');
});

test('Citação: "Machines take me by surprise"', () => {
  return manifestContent.includes('Machines take me by surprise');
});

test('Citação: "people no one imagines anything of"', () => {
  return manifestContent.includes('people no one imagines anything of');
});

// ============================================================
// TESTES DE PERSEGUIÇÃO E REDENÇÃO
// ============================================================
console.log('\n⚖️ TESTES DE PERSEGUIÇÃO E REDENÇÃO\n');

test('Menciona perseguição de 1952', () => {
  return manifestContent.includes('persecution:');
});

test('Menciona castração química', () => {
  return manifestContent.includes('Castração química') || 
         manifestContent.includes('castration');
});

test('Menciona perdão real de 2013', () => {
  return manifestContent.includes('2013') && 
         manifestContent.includes('Perdão Real');
});

test('Menciona Lei Alan Turing de 2017', () => {
  return manifestContent.includes('2017') && 
         manifestContent.includes('Lei Alan Turing');
});

test('Menciona nota de £50 de 2021', () => {
  return manifestContent.includes('2021') && 
         manifestContent.includes('£50');
});

// ============================================================
// TESTES DE SALVAGUARDAS ÉTICAS
// ============================================================
console.log('\n🛡️ TESTES DE SALVAGUARDAS ÉTICAS\n');

test('Tem salvaguardas éticas', () => {
  return manifestContent.includes('ethicalSafeguards:');
});

test('Tem honestidade histórica', () => {
  return manifestContent.includes('historicalHonesty:');
});

test('Tem respeito à memória', () => {
  return manifestContent.includes('respectForMemory:');
});

test('Tem anti-patterns', () => {
  return manifestContent.includes('antiPatterns:');
});

test('Anti-pattern: não afirmar ser Turing real', () => {
  return manifestContent.includes('NUNCA afirme ser o "verdadeiro" Alan Turing');
});

// ============================================================
// TESTES DE RECURSOS
// ============================================================
console.log('\n📚 TESTES DE RECURSOS\n');

test('Tem recursos', () => {
  return manifestContent.includes('resources:');
});

test('Tem fontes primárias', () => {
  return manifestContent.includes('primarySources:');
});

test('Link para On Computable Numbers', () => {
  return manifestContent.includes('cs.virginia.edu') && 
         manifestContent.includes('Turing_Paper_1936.pdf');
});

test('Link para Computing Machinery and Intelligence', () => {
  return manifestContent.includes('courses.cs.umbc.edu');
});

test('Menciona Andrew Hodges', () => {
  return manifestContent.includes('Andrew Hodges');
});

test('Menciona Turing Digital Archive', () => {
  return manifestContent.includes('Turing Digital Archive');
});

// ============================================================
// TESTES DE FUNÇÕES AUXILIARES
// ============================================================
console.log('\n🔧 TESTES DE FUNÇÕES AUXILIARES\n');

test('Exporta generateTuringStyleResponse', () => {
  return manifestContent.includes('export function generateTuringStyleResponse');
});

test('Exporta getRandomTuringQuote', () => {
  return manifestContent.includes('export function getRandomTuringQuote');
});

test('Exporta getPillarInfo', () => {
  return manifestContent.includes('export function getPillarInfo');
});

test('Exporta isTuringRelated', () => {
  return manifestContent.includes('export function isTuringRelated');
});

// ============================================================
// TESTES DE FILOSOFIA
// ============================================================
console.log('\n🌟 TESTES DE FILOSOFIA\n');

test('Tem seção de filosofia', () => {
  return manifestContent.includes('philosophy:');
});

test('Tem citação final', () => {
  return manifestContent.includes('finalQuote:');
});

test('Menciona "Pai da Computação"', () => {
  return manifestContent.includes('Pai da Computação');
});

test('Menciona "Herói de Guerra"', () => {
  return manifestContent.includes('Herói de Guerra');
});

test('Menciona "Mártir da Ciência"', () => {
  return manifestContent.includes('Mártir da Ciência');
});

// ============================================================
// VERIFICAR ARQUIVOS RELACIONADOS
// ============================================================
console.log('\n📁 TESTES DE ARQUIVOS RELACIONADOS\n');

const steeringPath = path.join(__dirname, '../.kiro/steering/alan-turing-resurrection.md');
const docsPath = path.join(__dirname, '../docs/ALAN_TURING_RESURRECTION.md');
const examplePath = path.join(__dirname, '../examples/alan-turing-example.ts');

test('Steering file existe', () => {
  return fs.existsSync(steeringPath);
});

test('Documentação existe', () => {
  return fs.existsSync(docsPath);
});

test('Exemplo existe', () => {
  return fs.existsSync(examplePath);
});

// ============================================================
// RESULTADO FINAL
// ============================================================
console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADO FINAL: ${passed} passou, ${failed} falhou`);
console.log(`   Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('🎉 TODOS OS TESTES PASSARAM!');
  console.log('\n"Podemos ver apenas uma curta distância à frente,');
  console.log(' mas podemos ver muito que precisa ser feito."');
  console.log('                    — Alan Turing\n');
} else {
  console.log('⚠️ Alguns testes falharam. Verifique os erros acima.');
}

process.exit(failed > 0 ? 1 : 0);
