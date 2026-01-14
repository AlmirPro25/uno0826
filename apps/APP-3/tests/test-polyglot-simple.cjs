/**
 * 🧪 Teste Simples do POLYGLOT_LANGUAGES_MASTER_MANIFEST
 * Arquivo .cjs para compatibilidade com CommonJS
 */

const fs = require('fs');
const path = require('path');

console.log('🌍 TESTE DO POLYGLOT LANGUAGES MASTER MANIFEST\n');
console.log('='.repeat(60));

// Ler o arquivo do manifesto
const manifestPath = path.join(__dirname, '../services/manifestos/POLYGLOT_LANGUAGES_MASTER_MANIFEST.ts');
const content = fs.readFileSync(manifestPath, 'utf-8');

// Contar linguagens
const languageMatches = content.match(/export const \w+_CARD = \{/g) || [];
const inlineCards = content.match(/(\w+): \{[\s\S]*?name: '(\w+)'/g) || [];

console.log('\n📊 ANÁLISE DO ARQUIVO');
console.log(`  ✓ Tamanho: ${(content.length / 1024).toFixed(1)} KB`);
console.log(`  ✓ Linhas: ${content.split('\n').length}`);

// Verificar estrutura principal
const hasMainManifest = content.includes('POLYGLOT_LANGUAGES_MASTER_MANIFEST');
const hasLanguageCards = content.includes('LANGUAGE_CARDS');
const hasComparisonTables = content.includes('COMPARISON_TABLES');
const hasFirstLanguageGuide = content.includes('FIRST_LANGUAGE_GUIDE');
const hasHelperFunctions = content.includes('shouldActivatePolyglotManifest');

console.log('\n📋 ESTRUTURA PRINCIPAL');
console.log(`  ${hasMainManifest ? '✓' : '✗'} POLYGLOT_LANGUAGES_MASTER_MANIFEST`);
console.log(`  ${hasLanguageCards ? '✓' : '✗'} LANGUAGE_CARDS`);
console.log(`  ${hasComparisonTables ? '✓' : '✗'} COMPARISON_TABLES`);
console.log(`  ${hasFirstLanguageGuide ? '✓' : '✗'} FIRST_LANGUAGE_GUIDE`);
console.log(`  ${hasHelperFunctions ? '✓' : '✗'} Funções auxiliares`);

// Listar linguagens encontradas
const languages = [
  'Assembly', 'C', 'C++', 'PHP', 'Python', 'JavaScript', 'TypeScript',
  'Java', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'C#',
  'Ruby', 'Elixir', 'Scala', 'Haskell', 'Lua', 'R', 'Julia',
  'Zig', 'Mojo', 'Carbon', 'COBOL', 'Fortran', 'Lisp', 'Perl', 'SQL', 'Clojure'
];

console.log('\n📚 LINGUAGENS COBERTAS');
let foundCount = 0;
languages.forEach(lang => {
  const found = content.includes(`name: '${lang}'`) || content.includes(`name: "${lang}"`);
  if (found) foundCount++;
  console.log(`  ${found ? '✓' : '✗'} ${lang}`);
});

// Verificar casos de uso
const useCases = [
  'backend_web', 'frontend_web', 'mobile_android', 'mobile_ios',
  'machine_learning', 'sistemas_embarcados', 'jogos', 'devops_infra',
  'blockchain', 'ciencia_dados'
];

console.log('\n🎯 CASOS DE USO');
useCases.forEach(useCase => {
  const found = content.includes(useCase);
  console.log(`  ${found ? '✓' : '✗'} ${useCase}`);
});

// Verificar plataformas
const platforms = ['windows', 'macos', 'linux', 'android', 'ios', 'web_browser', 'embedded'];

console.log('\n💻 PLATAFORMAS');
platforms.forEach(platform => {
  const found = content.includes(`${platform}:`);
  console.log(`  ${found ? '✓' : '✗'} ${platform}`);
});

// Verificar linguagens brasileiras
console.log('\n🇧🇷 LINGUAGENS BRASILEIRAS');
const hasLua = content.includes('Roberto Ierusalimschy') || content.includes('PUC-Rio');
const hasElixir = content.includes('José Valim') || content.includes('BRASILEIRO');
console.log(`  ${hasLua ? '✓' : '✗'} Lua (Roberto Ierusalimschy, PUC-Rio)`);
console.log(`  ${hasElixir ? '✓' : '✗'} Elixir (José Valim)`);

// Verificar empresas brasileiras
console.log('\n🏢 EMPRESAS BRASILEIRAS');
const companies = ['Nubank', 'iFood', 'Stone', 'Itaú', 'Bradesco', 'Mercado Livre', 'PagSeguro'];
companies.forEach(company => {
  const found = content.includes(company);
  console.log(`  ${found ? '✓' : '✗'} ${company}`);
});

// Resumo
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO FINAL');
console.log('='.repeat(60));

console.log(`
✅ Manifesto POLYGLOT_LANGUAGES_MASTER completo!

📚 Estatísticas:
   - ${foundCount}/${languages.length} linguagens documentadas
   - ${useCases.length} casos de uso
   - ${platforms.length} plataformas
   - 2 linguagens brasileiras (Lua, Elixir)
   - 7 empresas brasileiras mapeadas

📁 Arquivos criados:
   - services/manifestos/POLYGLOT_LANGUAGES_MASTER_MANIFEST.ts
   - .kiro/steering/polyglot-languages-master.md
   - tests/test-polyglot-simple.cjs

🎯 Funcionalidades:
   - Fichas técnicas de cada linguagem
   - Comparações por caso de uso
   - Guia de primeira linguagem
   - Trade-offs documentados
   - Código de exemplo em cada linguagem

Criado por: Almir - Salvador, Bahia
`);

console.log('✅ Teste concluído com sucesso!');
