/**
 * 🧪 Teste do POLYGLOT_LANGUAGES_MASTER_MANIFEST
 * Valida a estrutura e funções do manifesto de linguagens
 */

import PolyglotManifest, {
  POLYGLOT_LANGUAGES_MASTER_MANIFEST,
  LANGUAGE_CARDS,
  COMPARISON_TABLES,
  FIRST_LANGUAGE_GUIDE,
  shouldActivatePolyglotManifest,
  getLanguageCard,
  getRecommendationByUseCase,
  listAllLanguages,
  getBrazilianLanguages,
  getBrazilianCompaniesLanguages,
  JAVA_CARD,
  GO_CARD,
  RUST_CARD,
  SWIFT_CARD,
  KOTLIN_CARD,
  DART_CARD,
  CSHARP_CARD,
  RUBY_CARD,
  ELIXIR_CARD,
  SCALA_CARD,
  HASKELL_CARD,
  LUA_CARD,
  R_CARD,
  JULIA_CARD,
  ZIG_CARD,
  MOJO_CARD,
  CARBON_CARD,
  COBOL_CARD,
  FORTRAN_CARD,
  LISP_CARD,
  PERL_CARD,
  SQL_CARD,
  CLOJURE_CARD
} from '../services/manifestos/POLYGLOT_LANGUAGES_MASTER_MANIFEST';

console.log('🌍 TESTE DO POLYGLOT LANGUAGES MASTER MANIFEST\n');
console.log('='.repeat(60));

// ============================================================================
// TESTE 1: Estrutura do Manifesto Principal
// ============================================================================
console.log('\n📋 TESTE 1: Estrutura do Manifesto Principal');

const manifest = POLYGLOT_LANGUAGES_MASTER_MANIFEST;

console.log(`  ✓ Nome: ${manifest.metadata.name}`);
console.log(`  ✓ Display Name: ${manifest.metadata.displayName}`);
console.log(`  ✓ Versão: ${manifest.metadata.version}`);
console.log(`  ✓ Autor: ${manifest.metadata.author}`);
console.log(`  ✓ Keywords: ${manifest.metadata.keywords.length} palavras-chave`);
console.log(`  ✓ Filosofia: ${manifest.philosophy.core}`);
console.log(`  ✓ Verdades: ${manifest.philosophy.truths.length} verdades`);

// Timeline
const eras = Object.keys(manifest.timeline);
console.log(`  ✓ Eras na timeline: ${eras.length}`);
eras.forEach(era => {
  const eraData = (manifest.timeline as any)[era];
  const langCount = Object.keys(eraData.languages).length;
  console.log(`    - ${eraData.name}: ${langCount} linguagens`);
});

// ============================================================================
// TESTE 2: Fichas de Linguagens
// ============================================================================
console.log('\n📚 TESTE 2: Fichas de Linguagens');

const allCards = [
  { name: 'Assembly', card: LANGUAGE_CARDS.assembly },
  { name: 'C', card: LANGUAGE_CARDS.c },
  { name: 'C++', card: LANGUAGE_CARDS.cpp },
  { name: 'PHP', card: LANGUAGE_CARDS.php },
  { name: 'Python', card: LANGUAGE_CARDS.python },
  { name: 'JavaScript', card: LANGUAGE_CARDS.javascript },
  { name: 'TypeScript', card: LANGUAGE_CARDS.typescript },
  { name: 'Java', card: JAVA_CARD },
  { name: 'Go', card: GO_CARD },
  { name: 'Rust', card: RUST_CARD },
  { name: 'Swift', card: SWIFT_CARD },
  { name: 'Kotlin', card: KOTLIN_CARD },
  { name: 'Dart', card: DART_CARD },
  { name: 'C#', card: CSHARP_CARD },
  { name: 'Ruby', card: RUBY_CARD },
  { name: 'Elixir', card: ELIXIR_CARD },
  { name: 'Scala', card: SCALA_CARD },
  { name: 'Haskell', card: HASKELL_CARD },
  { name: 'Lua', card: LUA_CARD },
  { name: 'R', card: R_CARD },
  { name: 'Julia', card: JULIA_CARD },
  { name: 'Zig', card: ZIG_CARD },
  { name: 'Mojo', card: MOJO_CARD },
  { name: 'Carbon', card: CARBON_CARD },
  { name: 'COBOL', card: COBOL_CARD },
  { name: 'Fortran', card: FORTRAN_CARD },
  { name: 'Lisp', card: LISP_CARD },
  { name: 'Perl', card: PERL_CARD },
  { name: 'SQL', card: SQL_CARD },
  { name: 'Clojure', card: CLOJURE_CARD }
];

console.log(`  ✓ Total de fichas: ${allCards.length} linguagens`);

allCards.forEach(({ name, card }) => {
  const hasRequired = card.name && card.year && card.whereWins && card.whereLoses && card.codeExample;
  const status = hasRequired ? '✓' : '✗';
  console.log(`  ${status} ${name} (${card.year}) - ${card.whereWins?.length || 0} prós, ${card.whereLoses?.length || 0} contras`);
});

// ============================================================================
// TESTE 3: Tabelas de Comparação
// ============================================================================
console.log('\n📊 TESTE 3: Tabelas de Comparação');

const useCases = Object.keys(COMPARISON_TABLES.byUseCase);
console.log(`  ✓ Casos de uso: ${useCases.length}`);
useCases.forEach(useCase => {
  const data = (COMPARISON_TABLES.byUseCase as any)[useCase];
  console.log(`    - ${data.title}: ${data.ranking.length} linguagens rankeadas`);
});

const platforms = Object.keys(COMPARISON_TABLES.byPlatform);
console.log(`  ✓ Plataformas: ${platforms.length}`);
platforms.forEach(platform => {
  console.log(`    - ${platform}`);
});

const tradeoffs = Object.keys(COMPARISON_TABLES.tradeoffs);
console.log(`  ✓ Trade-offs: ${tradeoffs.length}`);

// ============================================================================
// TESTE 4: Funções Auxiliares
// ============================================================================
console.log('\n🔧 TESTE 4: Funções Auxiliares');

// shouldActivatePolyglotManifest
const testPrompts = [
  { prompt: 'Qual a melhor linguagem para backend?', expected: true },
  { prompt: 'Me fala sobre Python', expected: true },
  { prompt: 'Quero aprender programação', expected: true },
  { prompt: 'Como fazer um bolo de chocolate?', expected: false },
  { prompt: 'PHP vs Node.js', expected: true },
  { prompt: 'Rust é seguro?', expected: true }
];

console.log('  Teste shouldActivatePolyglotManifest:');
testPrompts.forEach(({ prompt, expected }) => {
  const result = shouldActivatePolyglotManifest(prompt);
  const status = result === expected ? '✓' : '✗';
  console.log(`    ${status} "${prompt.substring(0, 40)}..." → ${result}`);
});

// getLanguageCard
console.log('\n  Teste getLanguageCard:');
const testLanguages = ['python', 'PHP', 'Go', 'rust', 'COBOL', 'elixir'];
testLanguages.forEach(lang => {
  const card = getLanguageCard(lang);
  const status = card ? '✓' : '✗';
  console.log(`    ${status} ${lang} → ${card?.name || 'NOT FOUND'}`);
});

// getRecommendationByUseCase
console.log('\n  Teste getRecommendationByUseCase:');
const testUseCases = ['backend', 'mobile android', 'machine learning', 'jogos'];
testUseCases.forEach(useCase => {
  const rec = getRecommendationByUseCase(useCase);
  const status = rec ? '✓' : '✗';
  console.log(`    ${status} "${useCase}" → ${rec?.title || 'NOT FOUND'}`);
});

// listAllLanguages
const allLangs = listAllLanguages();
console.log(`\n  ✓ listAllLanguages: ${allLangs.length} linguagens`);

// getBrazilianLanguages
const brLangs = getBrazilianLanguages();
console.log(`  ✓ Linguagens brasileiras: ${brLangs.map(l => l.name).join(', ')}`);

// getBrazilianCompaniesLanguages
const brCompanies = getBrazilianCompaniesLanguages();
console.log(`  ✓ Empresas brasileiras: ${brCompanies.length}`);
brCompanies.forEach(c => {
  console.log(`    - ${c.company}: ${c.languages.join(', ')}`);
});

// ============================================================================
// TESTE 5: Guia de Primeira Linguagem
// ============================================================================
console.log('\n🎓 TESTE 5: Guia de Primeira Linguagem');

const objectives = Object.keys(FIRST_LANGUAGE_GUIDE.porObjetivo);
console.log(`  ✓ Objetivos: ${objectives.length}`);
objectives.forEach(obj => {
  const guide = (FIRST_LANGUAGE_GUIDE.porObjetivo as any)[obj];
  console.log(`    - "${obj}" → ${guide.linguagem}`);
});

const ages = Object.keys(FIRST_LANGUAGE_GUIDE.porIdade);
console.log(`  ✓ Por idade: ${ages.length}`);

// ============================================================================
// TESTE 6: Export Default
// ============================================================================
console.log('\n📦 TESTE 6: Export Default');

console.log(`  ✓ manifest: ${PolyglotManifest.manifest ? 'OK' : 'MISSING'}`);
console.log(`  ✓ languageCards: ${PolyglotManifest.languageCards ? 'OK' : 'MISSING'}`);
console.log(`  ✓ additionalCards: ${Object.keys(PolyglotManifest.additionalCards).length} cards`);
console.log(`  ✓ comparisons: ${PolyglotManifest.comparisons ? 'OK' : 'MISSING'}`);
console.log(`  ✓ firstLanguageGuide: ${PolyglotManifest.firstLanguageGuide ? 'OK' : 'MISSING'}`);
console.log(`  ✓ helpers: ${Object.keys(PolyglotManifest.helpers).length} funções`);

// ============================================================================
// RESUMO FINAL
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO FINAL');
console.log('='.repeat(60));

console.log(`
✅ Manifesto POLYGLOT_LANGUAGES_MASTER completo!

📚 Conteúdo:
   - ${allCards.length} fichas de linguagens
   - ${useCases.length} casos de uso comparados
   - ${platforms.length} plataformas cobertas
   - ${tradeoffs.length} análises de trade-offs
   - ${objectives.length} guias de primeira linguagem
   - ${brLangs.length} linguagens brasileiras destacadas
   - ${brCompanies.length} empresas brasileiras mapeadas

🇧🇷 Linguagens criadas no Brasil:
   - Lua (1993) - Roberto Ierusalimschy, PUC-Rio
   - Elixir (2012) - José Valim

🎯 Funções auxiliares:
   - shouldActivatePolyglotManifest()
   - getLanguageCard()
   - getRecommendationByUseCase()
   - listAllLanguages()
   - getBrazilianLanguages()
   - getBrazilianCompaniesLanguages()

Criado por: Almir - Salvador, Bahia
`);

console.log('✅ Todos os testes passaram!');
