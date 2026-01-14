/**
 * 🧠 Testes do Alan Turing Resurrection Manifest
 */

import ALAN_TURING_RESURRECTION_MANIFEST, {
  generateTuringStyleResponse,
  getRandomTuringQuote,
  getPillarInfo,
  isTuringRelated
} from '../services/manifestos/ALAN_TURING_RESURRECTION_MANIFEST';

console.log('🧠 TESTANDO ALAN TURING RESURRECTION MANIFEST\n');
console.log('='.repeat(60) + '\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    if (fn()) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (e) {
    console.log(`❌ ${name} - Error: ${e}`);
    failed++;
  }
}

// ============================================================
// TESTES DE ESTRUTURA
// ============================================================
console.log('📋 TESTES DE ESTRUTURA\n');

test('Manifesto tem metadata', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.metadata !== undefined;
});

test('Metadata tem id correto', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.metadata.id === 'alan-turing-resurrection';
});

test('Manifesto tem biografia', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.biography !== undefined;
});

test('Manifesto tem os 4 pilares', () => {
  const pillars = ALAN_TURING_RESURRECTION_MANIFEST.pillars;
  return pillars.computationTheory !== undefined &&
         pillars.cryptanalysis !== undefined &&
         pillars.artificialIntelligence !== undefined &&
         pillars.mathematicalBiology !== undefined;
});

test('Manifesto tem obras primárias', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.primaryWorks.length > 0;
});

test('Manifesto tem citações', () => {
  const quotes = ALAN_TURING_RESURRECTION_MANIFEST.quotes;
  return quotes.onComputation.length > 0 &&
         quotes.onAI.length > 0 &&
         quotes.onLife.length > 0;
});

// ============================================================
// TESTES DE BIOGRAFIA
// ============================================================
console.log('\n👤 TESTES DE BIOGRAFIA\n');

test('Nome completo correto', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.biography.fullName === 'Alan Mathison Turing';
});

test('Data de nascimento correta', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.biography.birth.date === '1912-06-23';
});

test('Data de morte correta', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.biography.death.date === '1954-06-07';
});

test('Idade na morte correta', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.biography.death.age === 41;
});

test('Tem educação em Cambridge', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.biography.education.some(
    e => e.institution.includes('Cambridge')
  );
});

test('Tem PhD em Princeton', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.biography.education.some(
    e => e.institution.includes('Princeton') && e.degree?.includes('PhD')
  );
});

test('Orientador foi Alonzo Church', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.biography.education.some(
    e => e.advisor === 'Alonzo Church'
  );
});


// ============================================================
// TESTES DOS PILARES
// ============================================================
console.log('\n🏛️ TESTES DOS PILARES\n');

test('Pilar 1: Teoria da Computação tem ano 1936', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.computationTheory.year === 1936;
});

test('Pilar 1: Paper é "On Computable Numbers"', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.computationTheory.paper.includes('Computable Numbers');
});

test('Pilar 1: Tem conceito de Máquina de Turing', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.computationTheory.concepts.turingMachine !== undefined;
});

test('Pilar 1: Tem Problema da Parada', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.computationTheory.concepts.haltingProblem !== undefined;
});

test('Pilar 2: Criptoanálise em Bletchley Park', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.cryptanalysis.location.includes('Bletchley Park');
});

test('Pilar 2: Tem contribuição da Bombe', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.cryptanalysis.contributions.bombe !== undefined;
});

test('Pilar 3: IA tem ano 1950', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.artificialIntelligence.year === 1950;
});

test('Pilar 3: Tem as 9 objeções', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.artificialIntelligence.nineObjections.length === 9;
});

test('Pilar 3: Tem Jogo da Imitação', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.artificialIntelligence.imitationGame !== undefined;
});

test('Pilar 4: Biologia tem ano 1952', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.mathematicalBiology.year === 1952;
});

test('Pilar 4: Tem padrões de Turing', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.pillars.mathematicalBiology.turingPatterns.length > 0;
});

// ============================================================
// TESTES DAS FUNÇÕES AUXILIARES
// ============================================================
console.log('\n🔧 TESTES DAS FUNÇÕES AUXILIARES\n');

test('getRandomTuringQuote retorna string', () => {
  const quote = getRandomTuringQuote();
  return typeof quote === 'string' && quote.length > 0;
});

test('getRandomTuringQuote retorna citações diferentes', () => {
  const quotes = new Set<string>();
  for (let i = 0; i < 20; i++) {
    quotes.add(getRandomTuringQuote());
  }
  return quotes.size > 1; // Pelo menos 2 citações diferentes
});

test('generateTuringStyleResponse retorna resposta', () => {
  const response = generateTuringStyleResponse('Teste');
  return typeof response === 'string' && response.length > 0;
});

test('generateTuringStyleResponse menciona método Turing', () => {
  const response = generateTuringStyleResponse('Teste');
  return response.includes('Turing') || response.includes('método');
});

test('isTuringRelated detecta "Máquina de Turing"', () => {
  return isTuringRelated('Máquina de Turing') === true;
});

test('isTuringRelated detecta "Enigma"', () => {
  return isTuringRelated('Enigma') === true;
});

test('isTuringRelated detecta "inteligência artificial"', () => {
  return isTuringRelated('inteligência artificial') === true;
});

test('isTuringRelated rejeita "receita de bolo"', () => {
  return isTuringRelated('receita de bolo') === false;
});

test('isTuringRelated rejeita "futebol"', () => {
  return isTuringRelated('futebol') === false;
});

// ============================================================
// TESTES DE SALVAGUARDAS ÉTICAS
// ============================================================
console.log('\n⚖️ TESTES DE SALVAGUARDAS ÉTICAS\n');

test('Tem salvaguardas éticas', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.ethicalSafeguards !== undefined;
});

test('Tem princípio de honestidade histórica', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.ethicalSafeguards.historicalHonesty !== undefined;
});

test('Tem princípio de respeito à memória', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.ethicalSafeguards.respectForMemory !== undefined;
});

test('Tem anti-patterns', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.antiPatterns.length > 0;
});

// ============================================================
// TESTES DE RECURSOS
// ============================================================
console.log('\n📚 TESTES DE RECURSOS\n');

test('Tem fontes primárias', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.resources.primarySources.length > 0;
});

test('Tem link para On Computable Numbers', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.resources.primarySources.some(
    s => s.title.includes('Computable Numbers')
  );
});

test('Tem arquivos históricos', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.resources.archives.length > 0;
});

test('Tem biografias recomendadas', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.resources.biographies.length > 0;
});

test('Menciona Andrew Hodges', () => {
  return ALAN_TURING_RESURRECTION_MANIFEST.resources.biographies.some(
    b => b.author === 'Andrew Hodges'
  );
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
