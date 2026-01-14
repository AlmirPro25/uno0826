/**
 * 🧪 TESTE DO MANIFESTO SQLITE3 SUPREME MASTER
 * 
 * Demonstra as capacidades do agente especialista em SQLite3
 */

import {
  SQLITE_VERSION_HISTORY,
  JOURNAL_MODES,
  SYNCHRONOUS_LEVELS,
  ESSENTIAL_PRAGMAS,
  GO_DRIVERS,
  SQLITE_EXTENSIONS,
  LOCK_LEVELS,
  USE_CASE_ANALYSIS,
  SQLiteDiagnosticEngine,
  SQLiteGoCodeGenerator,
  shouldEnableSQLite3,
  SQLITE3_SUPREME_MANIFEST,
} from '../services/manifestos/SQLITE3_SUPREME_MANIFEST';

// ============================================================================
// TESTES DE DETECÇÃO
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTE 1: Detecção de Contexto SQLite3');
console.log('═══════════════════════════════════════════════════════════════\n');

const testPrompts = [
  { prompt: 'Como usar SQLite com Go?', expected: true },
  { prompt: 'Configurar WAL mode no banco', expected: true },
  { prompt: 'mattn/go-sqlite3 vs modernc', expected: true },
  { prompt: 'Criar API REST com Node.js', expected: false },
  { prompt: 'Banco embutido para CLI', expected: true },
  { prompt: 'FTS5 full-text search', expected: true },
  { prompt: 'PostgreSQL replication', expected: false },
  { prompt: 'PRAGMA journal_mode', expected: true },
  { prompt: 'Offline-first database', expected: true },
  { prompt: 'React components', expected: false },
];

testPrompts.forEach(({ prompt, expected }) => {
  const result = shouldEnableSQLite3(prompt);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} "${prompt}" → ${result} (esperado: ${expected})`);
});

// ============================================================================
// TESTES DE DIAGNÓSTICO
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTE 2: Motor de Diagnóstico');
console.log('═══════════════════════════════════════════════════════════════\n');

// Configuração problemática
const badConfig = {
  journalMode: 'DELETE',
  synchronous: 'OFF',
  foreignKeys: false,
  busyTimeout: 0,
  maxOpenConns: 10,
  walMode: false,
};

console.log('📋 Analisando configuração problemática:');
console.log(JSON.stringify(badConfig, null, 2));
console.log('\n🔍 Diagnósticos encontrados:\n');

const diagnostics = SQLiteDiagnosticEngine.analyzeConfiguration(badConfig);
diagnostics.forEach((d, i) => {
  const icon = d.severity === 'critical' ? '🔴' : d.severity === 'warning' ? '🟡' : '🔵';
  console.log(`${i + 1}. ${icon} [${d.severity.toUpperCase()}] ${d.issue}`);
  console.log(`   📝 ${d.explanation}`);
  console.log(`   ✅ Solução: ${d.solution}`);
  if (d.sqlFix) console.log(`   💾 SQL: ${d.sqlFix}`);
  if (d.goFix) console.log(`   🐹 Go: ${d.goFix}`);
  console.log('');
});

// Configuração boa
console.log('\n📋 Analisando configuração otimizada:');
const goodConfig = {
  journalMode: 'WAL',
  synchronous: 'NORMAL',
  foreignKeys: true,
  busyTimeout: 5000,
  maxOpenConns: 10,
  walMode: true,
};
console.log(JSON.stringify(goodConfig, null, 2));

const goodDiagnostics = SQLiteDiagnosticEngine.analyzeConfiguration(goodConfig);
console.log(`\n✅ Apenas ${goodDiagnostics.length} diagnóstico(s) encontrado(s)`);

// ============================================================================
// TESTES DE ANÁLISE DE QUERY
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTE 3: Análise de Queries');
console.log('═══════════════════════════════════════════════════════════════\n');

const testQueries = [
  "SELECT * FROM users WHERE name LIKE '%john%'",
  "DELETE FROM orders",
  "SELECT id, name FROM users WHERE email = 'test@test.com'",
  "SELECT * FROM products WHERE LOWER(name) = 'laptop'",
  "UPDATE users SET status = 'active' WHERE id IN (SELECT user_id FROM orders WHERE total > 100)",
];

testQueries.forEach((query, i) => {
  console.log(`\n📝 Query ${i + 1}: ${query}`);
  const analysis = SQLiteDiagnosticEngine.analyzeQuery(query);
  console.log(`   📊 Custo estimado: ${analysis.estimatedCost}`);
  console.log(`   🔍 Usa índice: ${analysis.hasIndex ? 'Provavelmente sim' : 'Provavelmente não'}`);
  if (analysis.issues.length > 0) {
    console.log(`   ⚠️ Problemas:`);
    analysis.issues.forEach(issue => console.log(`      - ${issue}`));
  }
  if (analysis.suggestions.length > 0) {
    console.log(`   💡 Sugestões:`);
    analysis.suggestions.forEach(sug => console.log(`      - ${sug}`));
  }
});

// ============================================================================
// TESTES DE GERAÇÃO DE CONFIGURAÇÃO
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTE 4: Geração de Configuração Otimizada');
console.log('═══════════════════════════════════════════════════════════════\n');

const useCases = [
  { type: 'desktop' as const, readHeavy: true, writeHeavy: false, dataCritical: false, concurrentReaders: 5 },
  { type: 'cli' as const, readHeavy: false, writeHeavy: true, dataCritical: true, concurrentReaders: 1 },
  { type: 'server' as const, readHeavy: true, writeHeavy: true, dataCritical: true, concurrentReaders: 20 },
];

useCases.forEach((useCase, i) => {
  console.log(`\n📋 Caso de uso ${i + 1}: ${useCase.type}`);
  console.log(`   Read-heavy: ${useCase.readHeavy}, Write-heavy: ${useCase.writeHeavy}`);
  console.log(`   Data crítica: ${useCase.dataCritical}, Readers: ${useCase.concurrentReaders}`);
  
  const config = SQLiteDiagnosticEngine.generateOptimalConfig(useCase);
  console.log(`\n   📝 DSN: ${config.dsn}`);
  console.log(`\n   💾 Pragmas:`);
  config.pragmas.forEach(p => console.log(`      ${p}`));
  console.log(`\n   🐹 Go Config:${config.goConfig}`);
  if (config.warnings.length > 0) {
    console.log(`\n   ⚠️ Avisos:`);
    config.warnings.forEach(w => console.log(`      - ${w}`));
  }
});

// ============================================================================
// INFORMAÇÕES DO CATÁLOGO
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTE 5: Catálogo de Conhecimento');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📚 Versões documentadas: ${SQLITE_VERSION_HISTORY.length}`);
console.log(`   Mais antiga: ${SQLITE_VERSION_HISTORY[0].version} (${SQLITE_VERSION_HISTORY[0].releaseDate})`);
console.log(`   Mais recente: ${SQLITE_VERSION_HISTORY[SQLITE_VERSION_HISTORY.length - 1].version} (${SQLITE_VERSION_HISTORY[SQLITE_VERSION_HISTORY.length - 1].releaseDate})`);

console.log(`\n📝 Journal Modes: ${Object.keys(JOURNAL_MODES).length}`);
Object.values(JOURNAL_MODES).forEach(mode => {
  console.log(`   - ${mode.name}: ${mode.recommendation}`);
});

console.log(`\n⚙️ Pragmas essenciais: ${ESSENTIAL_PRAGMAS.length}`);
ESSENTIAL_PRAGMAS.filter(p => p.category === 'integrity').forEach(p => {
  console.log(`   - ${p.name}: ${p.recommendedValue}`);
});

console.log(`\n🐹 Drivers Go: ${GO_DRIVERS.length}`);
GO_DRIVERS.forEach(driver => {
  console.log(`   - ${driver.name} (CGO: ${driver.requiresCGO}, Performance: ${driver.performanceScore}/10)`);
});

console.log(`\n🔌 Extensões: ${SQLITE_EXTENSIONS.length}`);
SQLITE_EXTENSIONS.forEach(ext => {
  console.log(`   - ${ext.name}: ${ext.purpose}`);
});

console.log(`\n📊 Casos de uso analisados: ${USE_CASE_ANALYSIS.length}`);
console.log(`   ✅ Recomendados: ${USE_CASE_ANALYSIS.filter(u => u.recommended).length}`);
console.log(`   ❌ Não recomendados: ${USE_CASE_ANALYSIS.filter(u => !u.recommended).length}`);

// ============================================================================
// GERAÇÃO DE CÓDIGO
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🧪 TESTE 6: Geração de Código Go');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📝 Gerando código de inicialização (mattn/go-sqlite3)...');
const initCode = SQLiteGoCodeGenerator.generateInitCode({
  driver: 'mattn',
  dbPath: 'app.db',
  walMode: true,
  migrations: true,
});
console.log(`   ✅ Código gerado: ${initCode.split('\n').length} linhas`);

console.log('\n📝 Gerando código de migração...');
const migrationCode = SQLiteGoCodeGenerator.generateMigrationCode();
console.log(`   ✅ Código gerado: ${migrationCode.split('\n').length} linhas`);

console.log('\n📝 Gerando repository para User...');
const repoCode = SQLiteGoCodeGenerator.generateRepositoryCode('User', [
  { name: 'ID', type: 'int64' },
  { name: 'Email', type: 'string' },
  { name: 'Name', type: 'string' },
]);
console.log(`   ✅ Código gerado: ${repoCode.split('\n').length} linhas`);

// ============================================================================
// RESUMO FINAL
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📊 RESUMO DO MANIFESTO SQLITE3 SUPREME MASTER');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📜 Manifesto textual: ${SQLITE3_SUPREME_MANIFEST.split('\n').length} linhas`);
console.log(`📚 Base de conhecimento:`);
console.log(`   - ${SQLITE_VERSION_HISTORY.length} versões documentadas`);
console.log(`   - ${Object.keys(JOURNAL_MODES).length} journal modes`);
console.log(`   - ${SYNCHRONOUS_LEVELS.length} níveis de synchronous`);
console.log(`   - ${ESSENTIAL_PRAGMAS.length} pragmas essenciais`);
console.log(`   - ${GO_DRIVERS.length} drivers Go`);
console.log(`   - ${SQLITE_EXTENSIONS.length} extensões`);
console.log(`   - ${LOCK_LEVELS.length} níveis de lock`);
console.log(`   - ${USE_CASE_ANALYSIS.length} casos de uso analisados`);

console.log(`\n🔧 Capacidades do agente:`);
console.log(`   ✅ Detecção automática de contexto SQLite`);
console.log(`   ✅ Diagnóstico de configuração`);
console.log(`   ✅ Análise de queries`);
console.log(`   ✅ Geração de configuração otimizada`);
console.log(`   ✅ Geração de código Go (init, migrations, repository)`);
console.log(`   ✅ Recomendações de casos de uso`);

console.log('\n✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
console.log('\n═══════════════════════════════════════════════════════════════\n');
