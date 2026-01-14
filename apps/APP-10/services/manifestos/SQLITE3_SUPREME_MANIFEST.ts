/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║          🗄️ SQLITE3 SUPREME MASTER - LEVEL 12: GUARDIÃO DOS DADOS 🗄️       ║
 * ║                                                                              ║
 * ║     "SQLite não é um substituto para Oracle. É um substituto para fopen()." ║
 * ║                              — D. Richard Hipp                               ║
 * ║                                                                              ║
 * ║              O BANCO DE DADOS MAIS IMPLANTADO DO PLANETA                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// TIPOS E INTERFACES FUNDAMENTAIS
// ============================================================================

export interface SQLiteVersion {
  version: string;
  releaseDate: string;
  majorFeatures: string[];
  breakingChanges?: string[];
  cvesFixes?: string[];
}

export interface JournalMode {
  name: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'WAL' | 'MEMORY' | 'OFF';
  description: string;
  durability: 'high' | 'medium' | 'low' | 'none';
  performance: 'low' | 'medium' | 'high' | 'maximum';
  concurrency: 'poor' | 'fair' | 'good' | 'excellent';
  recommendation: string;
  risks: string[];
}

export interface SynchronousLevel {
  level: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
  durability: string;
  performance: string;
  useCase: string;
  warning?: string;
}

export interface PragmaConfig {
  name: string;
  category: 'performance' | 'integrity' | 'info' | 'security';
  syntax: string;
  description: string;
  defaultValue: string;
  recommendedValue: string;
  impact: string;
}

export interface GoDriverProfile {
  name: string;
  importPath: string;
  driverName: string;
  requiresCGO: boolean;
  performanceScore: number; // 1-10
  crossCompileEase: number; // 1-10
  extensionSupport: string[];
  dsnFormat: string;
  pros: string[];
  cons: string[];
}

export interface SQLiteExtension {
  name: string;
  purpose: string;
  enableFlag: string;
  exampleSQL: string[];
  useCases: string[];
}

export interface LockLevel {
  name: string;
  description: string;
  allowsReaders: boolean;
  allowsWriters: boolean;
}

export interface UseCaseAnalysis {
  scenario: string;
  recommended: boolean;
  reasoning: string;
  alternatives?: string[];
  configuration?: string[];
}

// ============================================================================
// HISTÓRICO COMPLETO DE VERSÕES
// ============================================================================

export const SQLITE_VERSION_HISTORY: SQLiteVersion[] = [
  {
    version: '3.0.0',
    releaseDate: '2004-06-18',
    majorFeatures: ['Reescrita completa do SQLite 2.x', 'Novo formato de arquivo', 'UTF-8/UTF-16 nativo'],
  },
  {
    version: '3.3.0',
    releaseDate: '2006-01-10',
    majorFeatures: ['CHECK constraints', 'IF EXISTS/IF NOT EXISTS'],
  },
  {
    version: '3.6.0',
    releaseDate: '2008-07-16',
    majorFeatures: ['Recursive triggers', 'Foreign key enforcement'],
  },
  {
    version: '3.7.0',
    releaseDate: '2010-07-21',
    majorFeatures: ['WAL (Write-Ahead Logging)', 'Shared cache improvements'],
  },
  {
    version: '3.7.11',
    releaseDate: '2012-03-20',
    majorFeatures: ['FTS4 (Full-Text Search 4)'],
  },
  {
    version: '3.8.0',
    releaseDate: '2013-08-26',
    majorFeatures: ['Partial indexes', 'Common Table Expressions (CTE)'],
  },
  {
    version: '3.8.3',
    releaseDate: '2014-02-03',
    majorFeatures: ['WITH clause (CTEs)', 'Improved query planner'],
  },
  {
    version: '3.9.0',
    releaseDate: '2015-10-14',
    majorFeatures: ['JSON1 extension', 'FTS5 (Full-Text Search 5)'],
  },
  {
    version: '3.15.0',
    releaseDate: '2016-10-14',
    majorFeatures: ['Row values', 'UPDATE FROM'],
  },
  {
    version: '3.24.0',
    releaseDate: '2018-06-04',
    majorFeatures: ['UPSERT (ON CONFLICT)', 'Improved window functions'],
  },
  {
    version: '3.25.0',
    releaseDate: '2018-09-15',
    majorFeatures: ['Window functions completas', 'RENAME COLUMN'],
  },
  {
    version: '3.30.0',
    releaseDate: '2019-10-04',
    majorFeatures: ['NULLS FIRST/LAST', 'Aggregate window functions'],
  },
  {
    version: '3.31.0',
    releaseDate: '2020-01-22',
    majorFeatures: ['Generated columns (STORED/VIRTUAL)'],
  },
  {
    version: '3.33.0',
    releaseDate: '2020-08-14',
    majorFeatures: ['UPDATE FROM', 'Decimal extension'],
  },
  {
    version: '3.35.0',
    releaseDate: '2021-03-12',
    majorFeatures: ['Built-in math functions', 'ALTER TABLE DROP COLUMN'],
  },
  {
    version: '3.37.0',
    releaseDate: '2021-11-27',
    majorFeatures: ['STRICT tables', 'ANY type'],
  },
  {
    version: '3.38.0',
    releaseDate: '2022-02-22',
    majorFeatures: ['JSON operators (-> e ->>)', 'Bloob I/O improvements'],
  },
  {
    version: '3.39.0',
    releaseDate: '2022-06-25',
    majorFeatures: ['RIGHT JOIN', 'FULL OUTER JOIN'],
  },
  {
    version: '3.40.0',
    releaseDate: '2022-11-16',
    majorFeatures: ['Recovery extension', 'WASM improvements'],
  },
  {
    version: '3.41.0',
    releaseDate: '2023-02-21',
    majorFeatures: ['JSON improvements', 'Query planner enhancements'],
  },
  {
    version: '3.42.0',
    releaseDate: '2023-05-16',
    majorFeatures: ['JSON5 support', 'FTS5 improvements'],
  },
  {
    version: '3.43.0',
    releaseDate: '2023-08-24',
    majorFeatures: ['Built-in JSON functions', 'Performance improvements'],
  },
  {
    version: '3.44.0',
    releaseDate: '2023-11-01',
    majorFeatures: ['Aggregate functions improvements', 'ORDER BY in aggregates'],
  },
  {
    version: '3.45.0',
    releaseDate: '2024-01-15',
    majorFeatures: ['JSONB (binary JSON)', 'JSON performance boost'],
  },
  {
    version: '3.46.0',
    releaseDate: '2024-05-23',
    majorFeatures: ['Incremental BLOB I/O', 'Query planner improvements'],
  },
  {
    version: '3.47.0',
    releaseDate: '2024-10-21',
    majorFeatures: ['Vec extension', 'Performance optimizations'],
  },
  {
    version: '3.48.0',
    releaseDate: '2025-01-14',
    majorFeatures: ['Improved ANALYZE', 'Query optimizer enhancements'],
  },
  {
    version: '3.49.0',
    releaseDate: '2025-02-06',
    majorFeatures: ['CONCAT function', 'CONCAT_WS function'],
  },
  {
    version: '3.50.0',
    releaseDate: '2025-05-29',
    majorFeatures: ['Improved JSON handling', 'Security fixes'],
    cvesFixes: ['CVE-2025-29087'],
  },
  {
    version: '3.50.1',
    releaseDate: '2025-06-06',
    majorFeatures: ['Bug fixes', 'Stability improvements'],
  },
];

// ============================================================================
// JOURNAL MODES DETALHADOS
// ============================================================================

export const JOURNAL_MODES: Record<string, JournalMode> = {
  DELETE: {
    name: 'DELETE',
    description: 'Journal file é deletado após cada commit',
    durability: 'high',
    performance: 'low',
    concurrency: 'poor',
    recommendation: 'Padrão seguro, mas WAL é geralmente melhor',
    risks: ['Performance de I/O em cada commit'],
  },
  TRUNCATE: {
    name: 'TRUNCATE',
    description: 'Journal é truncado (não deletado) após commit',
    durability: 'high',
    performance: 'medium',
    concurrency: 'poor',
    recommendation: 'Melhor que DELETE em alguns filesystems',
    risks: ['Ainda bloqueia leitores durante escrita'],
  },
  PERSIST: {
    name: 'PERSIST',
    description: 'Journal mantido, apenas header zerado',
    durability: 'high',
    performance: 'medium',
    concurrency: 'poor',
    recommendation: 'Evita overhead de criar/deletar arquivo',
    risks: ['Arquivo journal sempre presente'],
  },
  WAL: {
    name: 'WAL',
    description: 'Write-Ahead Logging - mudanças vão para arquivo separado',
    durability: 'high',
    performance: 'high',
    concurrency: 'excellent',
    recommendation: '✅ RECOMENDADO para maioria dos casos',
    risks: ['Gera arquivos -wal e -shm', 'Checkpoint necessário'],
  },
  MEMORY: {
    name: 'MEMORY',
    description: 'Journal mantido apenas em memória',
    durability: 'low',
    performance: 'maximum',
    concurrency: 'poor',
    recommendation: 'Apenas para dados temporários/descartáveis',
    risks: ['Perda de dados em crash', 'Corrupção possível'],
  },
  OFF: {
    name: 'OFF',
    description: 'Sem journaling - rollback impossível',
    durability: 'none',
    performance: 'maximum',
    concurrency: 'poor',
    recommendation: '⚠️ NUNCA em produção com dados importantes',
    risks: ['Corrupção garantida em crash', 'Sem rollback', 'Perda de dados'],
  },
};

// ============================================================================
// SYNCHRONOUS LEVELS
// ============================================================================

export const SYNCHRONOUS_LEVELS: SynchronousLevel[] = [
  {
    level: 'OFF',
    durability: 'Nenhuma - corrupção possível em crash',
    performance: 'Máxima',
    useCase: 'NUNCA em produção',
    warning: '⚠️ EXTREMAMENTE PERIGOSO - dados podem corromper',
  },
  {
    level: 'NORMAL',
    durability: 'Boa - seguro com WAL mode',
    performance: 'Boa',
    useCase: '✅ Recomendado com WAL mode',
  },
  {
    level: 'FULL',
    durability: 'Máxima - sync em cada commit',
    performance: 'Menor',
    useCase: 'Dados críticos, transações financeiras',
  },
  {
    level: 'EXTRA',
    durability: 'Paranóica - sync extra no journal',
    performance: 'Mínima',
    useCase: 'Raramente necessário',
  },
];

// ============================================================================
// PRAGMAS ESSENCIAIS
// ============================================================================

export const ESSENTIAL_PRAGMAS: PragmaConfig[] = [
  // Performance
  {
    name: 'journal_mode',
    category: 'performance',
    syntax: "PRAGMA journal_mode=WAL;",
    description: 'Define o modo de journaling',
    defaultValue: 'DELETE',
    recommendedValue: 'WAL',
    impact: 'Melhora concorrência de leitura/escrita significativamente',
  },
  {
    name: 'synchronous',
    category: 'performance',
    syntax: "PRAGMA synchronous=NORMAL;",
    description: 'Controla quando dados são sincronizados com disco',
    defaultValue: 'FULL',
    recommendedValue: 'NORMAL (com WAL)',
    impact: 'Balance entre durabilidade e performance',
  },
  {
    name: 'cache_size',
    category: 'performance',
    syntax: "PRAGMA cache_size=-64000;",
    description: 'Tamanho do cache de páginas (negativo = KB)',
    defaultValue: '-2000 (2MB)',
    recommendedValue: '-64000 (64MB) ou mais',
    impact: 'Mais cache = menos I/O, mais memória',
  },
  {
    name: 'temp_store',
    category: 'performance',
    syntax: "PRAGMA temp_store=MEMORY;",
    description: 'Onde armazenar tabelas temporárias',
    defaultValue: 'DEFAULT (arquivo)',
    recommendedValue: 'MEMORY',
    impact: 'Operações temporárias mais rápidas',
  },
  {
    name: 'mmap_size',
    category: 'performance',
    syntax: "PRAGMA mmap_size=268435456;",
    description: 'Tamanho do memory-mapped I/O',
    defaultValue: '0 (desabilitado)',
    recommendedValue: '268435456 (256MB)',
    impact: 'Pode melhorar leitura em bancos grandes',
  },
  {
    name: 'page_size',
    category: 'performance',
    syntax: "PRAGMA page_size=4096;",
    description: 'Tamanho da página do banco (deve ser definido antes de criar tabelas)',
    defaultValue: '4096',
    recommendedValue: '4096 ou 8192',
    impact: 'Afeta fragmentação e performance de I/O',
  },
  // Integridade
  {
    name: 'foreign_keys',
    category: 'integrity',
    syntax: "PRAGMA foreign_keys=ON;",
    description: 'Habilita enforcement de foreign keys',
    defaultValue: 'OFF (!)',
    recommendedValue: 'ON (SEMPRE!)',
    impact: 'Garante integridade referencial',
  },
  {
    name: 'busy_timeout',
    category: 'integrity',
    syntax: "PRAGMA busy_timeout=5000;",
    description: 'Tempo de espera quando banco está bloqueado (ms)',
    defaultValue: '0 (erro imediato)',
    recommendedValue: '5000 ou mais',
    impact: 'Evita SQLITE_BUSY em concorrência',
  },
  {
    name: 'integrity_check',
    category: 'integrity',
    syntax: "PRAGMA integrity_check;",
    description: 'Verifica integridade completa do banco',
    defaultValue: 'N/A',
    recommendedValue: 'Executar periodicamente',
    impact: 'Detecta corrupção',
  },
  {
    name: 'quick_check',
    category: 'integrity',
    syntax: "PRAGMA quick_check;",
    description: 'Verificação rápida de integridade',
    defaultValue: 'N/A',
    recommendedValue: 'Executar antes de operações críticas',
    impact: 'Detecta corrupção básica rapidamente',
  },
  // Informação
  {
    name: 'table_info',
    category: 'info',
    syntax: "PRAGMA table_info(nome_tabela);",
    description: 'Retorna schema de uma tabela',
    defaultValue: 'N/A',
    recommendedValue: 'N/A',
    impact: 'Útil para introspecção',
  },
  {
    name: 'index_list',
    category: 'info',
    syntax: "PRAGMA index_list(nome_tabela);",
    description: 'Lista índices de uma tabela',
    defaultValue: 'N/A',
    recommendedValue: 'N/A',
    impact: 'Útil para otimização',
  },
  {
    name: 'database_list',
    category: 'info',
    syntax: "PRAGMA database_list;",
    description: 'Lista databases attached',
    defaultValue: 'N/A',
    recommendedValue: 'N/A',
    impact: 'Útil para debug',
  },
];


// ============================================================================
// DRIVERS GO DETALHADOS
// ============================================================================

export const GO_DRIVERS: GoDriverProfile[] = [
  {
    name: 'mattn/go-sqlite3',
    importPath: 'github.com/mattn/go-sqlite3',
    driverName: 'sqlite3',
    requiresCGO: true,
    performanceScore: 10,
    crossCompileEase: 3,
    extensionSupport: ['FTS3', 'FTS4', 'FTS5', 'JSON1', 'RTREE', 'ICU', 'Math'],
    dsnFormat: 'file:path.db?_journal_mode=WAL&_foreign_keys=ON&_busy_timeout=5000',
    pros: [
      'Performance máxima (wrapper C nativo)',
      'Suporte completo a todas extensões',
      'Mais maduro e testado',
      'Documentação extensa',
      'Suporte a hooks e callbacks',
      'Backup API disponível',
    ],
    cons: [
      'Requer CGO (GCC/Clang)',
      'Cross-compile complexo',
      'Build mais lento',
      'Binário maior',
    ],
  },
  {
    name: 'modernc.org/sqlite',
    importPath: 'modernc.org/sqlite',
    driverName: 'sqlite',
    requiresCGO: false,
    performanceScore: 8,
    crossCompileEase: 10,
    extensionSupport: ['FTS5', 'JSON1', 'RTREE'],
    dsnFormat: 'file:path.db?_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)',
    pros: [
      'Pure Go - sem CGO',
      'Cross-compile trivial',
      'Build rápido',
      'Funciona em qualquer plataforma Go',
      'Binário menor',
    ],
    cons: [
      '10-20% mais lento que CGO',
      'Algumas extensões não disponíveis',
      'Menos hooks/callbacks',
      'Comunidade menor',
    ],
  },
  {
    name: 'crawshaw/sqlite',
    importPath: 'crawshaw.io/sqlite',
    driverName: 'sqlite',
    requiresCGO: true,
    performanceScore: 9,
    crossCompileEase: 3,
    extensionSupport: ['FTS5', 'JSON1', 'RTREE'],
    dsnFormat: 'file:path.db',
    pros: [
      'API mais idiomática para Go',
      'Melhor gerenciamento de conexões',
      'Pool de conexões built-in',
    ],
    cons: [
      'Requer CGO',
      'Menos popular que mattn',
      'Documentação limitada',
    ],
  },
  {
    name: 'zombiezen/go-sqlite',
    importPath: 'zombiezen.com/go/sqlite',
    driverName: 'sqlite',
    requiresCGO: false,
    performanceScore: 8,
    crossCompileEase: 10,
    extensionSupport: ['FTS5', 'JSON1'],
    dsnFormat: 'file:path.db',
    pros: [
      'Pure Go (usa modernc internamente)',
      'API moderna e limpa',
      'Bom para aplicações simples',
    ],
    cons: [
      'Wrapper sobre modernc',
      'Menos features que mattn',
    ],
  },
];

// ============================================================================
// EXTENSÕES SQLITE
// ============================================================================

export const SQLITE_EXTENSIONS: SQLiteExtension[] = [
  {
    name: 'FTS5',
    purpose: 'Full-Text Search - busca textual avançada',
    enableFlag: 'SQLITE_ENABLE_FTS5',
    exampleSQL: [
      `CREATE VIRTUAL TABLE docs USING fts5(title, content, tokenize='porter unicode61');`,
      `INSERT INTO docs VALUES ('SQLite Guide', 'SQLite is a lightweight database...');`,
      `SELECT * FROM docs WHERE docs MATCH 'sqlite AND database';`,
      `SELECT *, rank FROM docs WHERE docs MATCH 'query' ORDER BY rank;`,
      `SELECT highlight(docs, 0, '<b>', '</b>') FROM docs WHERE docs MATCH 'sqlite';`,
    ],
    useCases: [
      'Busca em documentos',
      'Autocomplete',
      'Indexação de logs',
      'Search engines locais',
    ],
  },
  {
    name: 'JSON1',
    purpose: 'Manipulação de dados JSON',
    enableFlag: 'SQLITE_ENABLE_JSON1',
    exampleSQL: [
      `SELECT json_extract(data, '$.user.name') FROM events;`,
      `SELECT json_extract(data, '$.items[0].price') FROM orders;`,
      `UPDATE events SET data = json_set(data, '$.status', 'completed');`,
      `SELECT * FROM events WHERE json_extract(data, '$.type') = 'purchase';`,
      `SELECT json_group_array(name) FROM users;`,
      `SELECT data->>'$.user.email' FROM events; -- SQLite 3.38+`,
    ],
    useCases: [
      'Dados semi-estruturados',
      'Configurações flexíveis',
      'Event sourcing',
      'Logs estruturados',
    ],
  },
  {
    name: 'R*Tree',
    purpose: 'Índices espaciais/geográficos',
    enableFlag: 'SQLITE_ENABLE_RTREE',
    exampleSQL: [
      `CREATE VIRTUAL TABLE locations USING rtree(id, minLat, maxLat, minLon, maxLon);`,
      `INSERT INTO locations VALUES (1, -23.55, -23.54, -46.64, -46.63);`,
      `SELECT * FROM locations WHERE minLat >= -24 AND maxLat <= -23 AND minLon >= -47 AND maxLon <= -46;`,
    ],
    useCases: [
      'Busca geoespacial',
      'Detecção de colisão',
      'Range queries multidimensionais',
    ],
  },
  {
    name: 'Math',
    purpose: 'Funções matemáticas avançadas',
    enableFlag: 'SQLITE_ENABLE_MATH_FUNCTIONS (built-in desde 3.35)',
    exampleSQL: [
      `SELECT sqrt(144), pow(2, 10), log(100);`,
      `SELECT sin(radians(45)), cos(radians(60));`,
      `SELECT ceil(3.2), floor(3.8), round(3.567, 2);`,
    ],
    useCases: [
      'Cálculos científicos',
      'Estatísticas',
      'Geometria',
    ],
  },
  {
    name: 'ICU',
    purpose: 'Collation e comparação Unicode avançada',
    enableFlag: 'SQLITE_ENABLE_ICU',
    exampleSQL: [
      `SELECT icu_load_collation('pt_BR', 'portuguese');`,
      `CREATE TABLE words (word TEXT COLLATE portuguese);`,
      `SELECT * FROM words ORDER BY word COLLATE portuguese;`,
    ],
    useCases: [
      'Ordenação correta em português',
      'Comparação case-insensitive Unicode',
      'Internacionalização',
    ],
  },
];

// ============================================================================
// NÍVEIS DE LOCK
// ============================================================================

export const LOCK_LEVELS: LockLevel[] = [
  {
    name: 'UNLOCKED',
    description: 'Nenhum lock - conexão não está acessando o banco',
    allowsReaders: true,
    allowsWriters: true,
  },
  {
    name: 'SHARED',
    description: 'Lock de leitura - múltiplos readers permitidos',
    allowsReaders: true,
    allowsWriters: false,
  },
  {
    name: 'RESERVED',
    description: 'Preparando para escrever - ainda permite readers',
    allowsReaders: true,
    allowsWriters: false,
  },
  {
    name: 'PENDING',
    description: 'Esperando readers terminarem para obter EXCLUSIVE',
    allowsReaders: false, // Novos readers bloqueados
    allowsWriters: false,
  },
  {
    name: 'EXCLUSIVE',
    description: 'Lock exclusivo - apenas um writer, nenhum reader',
    allowsReaders: false,
    allowsWriters: false,
  },
];

// ============================================================================
// ANÁLISE DE CASOS DE USO
// ============================================================================

export const USE_CASE_ANALYSIS: UseCaseAnalysis[] = [
  // RECOMENDADOS
  {
    scenario: 'Aplicação desktop/mobile',
    recommended: true,
    reasoning: 'SQLite é perfeito: zero config, arquivo único, ACID, funciona offline',
    configuration: ['WAL mode', 'foreign_keys=ON', 'busy_timeout=5000'],
  },
  {
    scenario: 'Ferramenta CLI',
    recommended: true,
    reasoning: 'Binário único com banco embutido, sem dependências externas',
    configuration: ['WAL mode', 'Considerar :memory: para dados temporários'],
  },
  {
    scenario: 'Cache local persistente',
    recommended: true,
    reasoning: 'Mais estruturado que arquivos, queries SQL, TTL fácil de implementar',
    configuration: ['synchronous=NORMAL', 'cache_size grande'],
  },
  {
    scenario: 'Testes automatizados',
    recommended: true,
    reasoning: 'In-memory (:memory:) é instantâneo, isolado, descartável',
    configuration: [':memory:', 'shared cache para múltiplas conexões'],
  },
  {
    scenario: 'Edge computing / IoT',
    recommended: true,
    reasoning: 'Baixo footprint, funciona em dispositivos limitados',
    configuration: ['page_size menor', 'cache_size ajustado'],
  },
  {
    scenario: 'Banco por tenant/usuário',
    recommended: true,
    reasoning: 'Isolamento total, backup simples (copiar arquivo), GDPR-friendly',
    configuration: ['Um arquivo .db por tenant', 'WAL mode'],
  },
  {
    scenario: 'Prototipagem rápida',
    recommended: true,
    reasoning: 'Zero setup, migrar para PostgreSQL depois é fácil',
    configuration: ['Usar SQL padrão para facilitar migração'],
  },
  {
    scenario: 'Logs estruturados locais',
    recommended: true,
    reasoning: 'Queries SQL em logs, rotação fácil, compressão',
    configuration: ['WAL mode', 'VACUUM periódico'],
  },
  // NÃO RECOMENDADOS
  {
    scenario: 'Alta concorrência de escrita (>100 writes/s simultâneos)',
    recommended: false,
    reasoning: 'SQLite tem apenas UM writer por vez, mesmo com WAL',
    alternatives: ['PostgreSQL', 'MySQL', 'CockroachDB'],
  },
  {
    scenario: 'Múltiplos servidores acessando mesmo arquivo',
    recommended: false,
    reasoning: 'Locking via filesystem é problemático em rede (NFS, SMB)',
    alternatives: ['PostgreSQL', 'MySQL', 'SQLite com Litestream'],
  },
  {
    scenario: 'Replicação multi-master',
    recommended: false,
    reasoning: 'SQLite não tem replicação nativa',
    alternatives: ['CockroachDB', 'TiDB', 'Vitess'],
  },
  {
    scenario: 'Dados > 1TB com heavy-write',
    recommended: false,
    reasoning: 'Performance degrada, VACUUM problemático',
    alternatives: ['PostgreSQL', 'ClickHouse (analytics)'],
  },
  {
    scenario: 'Aplicação web com muitos usuários escrevendo',
    recommended: false,
    reasoning: 'Contenção de escrita, SQLITE_BUSY frequente',
    alternatives: ['PostgreSQL', 'MySQL', 'PlanetScale'],
  },
];


// ============================================================================
// MOTOR DE DIAGNÓSTICO E OTIMIZAÇÃO
// ============================================================================

export interface DiagnosticResult {
  category: 'performance' | 'integrity' | 'security' | 'configuration';
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  explanation: string;
  solution: string;
  sqlFix?: string;
  goFix?: string;
}

export interface QueryAnalysis {
  query: string;
  hasIndex: boolean;
  estimatedCost: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
  suggestions: string[];
  explainPlan?: string;
}

export class SQLiteDiagnosticEngine {
  
  /**
   * Analisa configuração e retorna diagnósticos
   */
  static analyzeConfiguration(config: {
    journalMode?: string;
    synchronous?: string;
    foreignKeys?: boolean;
    busyTimeout?: number;
    maxOpenConns?: number;
    walMode?: boolean;
  }): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // Journal Mode
    if (!config.journalMode || config.journalMode.toUpperCase() !== 'WAL') {
      results.push({
        category: 'performance',
        severity: 'warning',
        issue: 'Journal mode não é WAL',
        explanation: 'WAL mode melhora significativamente a concorrência de leitura/escrita',
        solution: 'Ativar WAL mode',
        sqlFix: "PRAGMA journal_mode=WAL;",
        goFix: `db, _ := sql.Open("sqlite3", "file:app.db?_journal_mode=WAL")`,
      });
    }

    // Foreign Keys
    if (config.foreignKeys === false || config.foreignKeys === undefined) {
      results.push({
        category: 'integrity',
        severity: 'critical',
        issue: 'Foreign keys desabilitadas',
        explanation: 'SQLite NÃO enforce foreign keys por padrão! Isso pode causar dados órfãos.',
        solution: 'SEMPRE habilitar foreign keys',
        sqlFix: "PRAGMA foreign_keys=ON;",
        goFix: `db, _ := sql.Open("sqlite3", "file:app.db?_foreign_keys=ON")`,
      });
    }

    // Busy Timeout
    if (!config.busyTimeout || config.busyTimeout < 1000) {
      results.push({
        category: 'configuration',
        severity: 'warning',
        issue: 'Busy timeout muito baixo ou não configurado',
        explanation: 'Sem busy timeout, operações falham imediatamente com SQLITE_BUSY em concorrência',
        solution: 'Configurar busy timeout de pelo menos 5000ms',
        sqlFix: "PRAGMA busy_timeout=5000;",
        goFix: `db, _ := sql.Open("sqlite3", "file:app.db?_busy_timeout=5000")`,
      });
    }

    // MaxOpenConns para Go
    if (config.maxOpenConns && config.maxOpenConns > 1 && !config.walMode) {
      results.push({
        category: 'configuration',
        severity: 'critical',
        issue: 'Múltiplas conexões sem WAL mode',
        explanation: 'Sem WAL, múltiplas conexões causam contenção severa e SQLITE_BUSY',
        solution: 'Usar WAL mode OU limitar MaxOpenConns a 1',
        goFix: `db.SetMaxOpenConns(1) // OU usar WAL mode`,
      });
    }

    // Synchronous com WAL
    if (config.walMode && config.synchronous?.toUpperCase() === 'FULL') {
      results.push({
        category: 'performance',
        severity: 'info',
        issue: 'synchronous=FULL com WAL mode',
        explanation: 'Com WAL, synchronous=NORMAL é seguro e mais rápido',
        solution: 'Considerar synchronous=NORMAL para melhor performance',
        sqlFix: "PRAGMA synchronous=NORMAL;",
      });
    }

    // Synchronous OFF
    if (config.synchronous?.toUpperCase() === 'OFF') {
      results.push({
        category: 'integrity',
        severity: 'critical',
        issue: 'synchronous=OFF - PERIGO!',
        explanation: 'Dados podem corromper em caso de crash ou queda de energia',
        solution: 'NUNCA usar synchronous=OFF em produção',
        sqlFix: "PRAGMA synchronous=NORMAL; -- ou FULL",
      });
    }

    return results;
  }

  /**
   * Analisa uma query SQL
   */
  static analyzeQuery(query: string): QueryAnalysis {
    const queryUpper = query.toUpperCase();
    const issues: string[] = [];
    const suggestions: string[] = [];
    let estimatedCost: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // LIKE com wildcard no início
    if (/LIKE\s+['"]%/.test(queryUpper)) {
      issues.push('LIKE com % no início não usa índice');
      suggestions.push('Considerar FTS5 para busca textual');
      estimatedCost = 'high';
    }

    // SELECT *
    if (/SELECT\s+\*/.test(queryUpper)) {
      issues.push('SELECT * pode trazer colunas desnecessárias');
      suggestions.push('Especificar apenas colunas necessárias');
    }

    // Sem WHERE em UPDATE/DELETE
    if (/(UPDATE|DELETE)\s+\w+\s*(?!WHERE)/i.test(query) && !queryUpper.includes('WHERE')) {
      issues.push('UPDATE/DELETE sem WHERE afeta todas as linhas!');
      suggestions.push('Adicionar cláusula WHERE');
      estimatedCost = 'critical';
    }

    // Subquery correlacionada
    if (/WHERE.*\(\s*SELECT.*WHERE.*=.*\.\w+\)/i.test(query)) {
      issues.push('Subquery correlacionada pode ser lenta');
      suggestions.push('Considerar JOIN ou CTE');
      estimatedCost = 'high';
    }

    // OR em WHERE (pode não usar índice)
    if (/WHERE.*\sOR\s/i.test(query)) {
      issues.push('OR em WHERE pode não usar índices eficientemente');
      suggestions.push('Considerar UNION ou índice composto');
    }

    // Função em coluna indexada
    if (/WHERE\s+\w+\s*\(\s*\w+\s*\)\s*=/i.test(query)) {
      issues.push('Função aplicada em coluna impede uso de índice');
      suggestions.push('Criar índice em expressão ou reestruturar query');
      estimatedCost = 'high';
    }

    // ORDER BY sem índice potencial
    if (/ORDER\s+BY/i.test(query) && !/LIMIT/i.test(query)) {
      suggestions.push('ORDER BY sem LIMIT pode ser custoso em tabelas grandes');
    }

    // Determinar se provavelmente tem índice
    const hasIndex = !issues.some(i => 
      i.includes('não usa índice') || 
      i.includes('impede uso de índice')
    );

    return {
      query,
      hasIndex,
      estimatedCost,
      issues,
      suggestions,
      explainPlan: `-- Execute para ver plano real:\nEXPLAIN QUERY PLAN ${query}`,
    };
  }

  /**
   * Gera configuração otimizada para um caso de uso
   */
  static generateOptimalConfig(useCase: {
    type: 'desktop' | 'cli' | 'server' | 'embedded' | 'test';
    readHeavy: boolean;
    writeHeavy: boolean;
    dataCritical: boolean;
    concurrentReaders: number;
  }): {
    pragmas: string[];
    goConfig: string;
    dsn: string;
    warnings: string[];
  } {
    const pragmas: string[] = [];
    const warnings: string[] = [];
    let goConfig = '';
    let dsnParams: string[] = [];

    // Base: sempre WAL e foreign keys
    pragmas.push("PRAGMA journal_mode=WAL;");
    dsnParams.push('_journal_mode=WAL', '_foreign_keys=ON');

    // Synchronous baseado em criticidade
    if (useCase.dataCritical) {
      pragmas.push("PRAGMA synchronous=FULL;");
      dsnParams.push('_synchronous=FULL');
    } else {
      pragmas.push("PRAGMA synchronous=NORMAL;");
      dsnParams.push('_synchronous=NORMAL');
    }

    // Busy timeout
    pragmas.push("PRAGMA busy_timeout=5000;");
    dsnParams.push('_busy_timeout=5000');

    // Cache size baseado em tipo
    if (useCase.type === 'server' || useCase.readHeavy) {
      pragmas.push("PRAGMA cache_size=-128000; -- 128MB");
    } else if (useCase.type === 'embedded') {
      pragmas.push("PRAGMA cache_size=-8000; -- 8MB");
    } else {
      pragmas.push("PRAGMA cache_size=-64000; -- 64MB");
    }

    // Temp store
    if (useCase.type !== 'embedded') {
      pragmas.push("PRAGMA temp_store=MEMORY;");
    }

    // Go config
    if (useCase.writeHeavy && useCase.concurrentReaders <= 1) {
      goConfig = `
db.SetMaxOpenConns(1)  // Single writer
db.SetMaxIdleConns(1)
db.SetConnMaxLifetime(0)`;
    } else if (useCase.concurrentReaders > 1) {
      goConfig = `
db.SetMaxOpenConns(${Math.min(useCase.concurrentReaders + 2, 25)})  // Readers + margin
db.SetMaxIdleConns(${Math.min(useCase.concurrentReaders, 10)})
db.SetConnMaxLifetime(time.Hour)`;
      warnings.push('Com múltiplas conexões, escritas ainda são serializadas');
    } else {
      goConfig = `
db.SetMaxOpenConns(10)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(time.Hour)`;
    }

    // Test mode
    if (useCase.type === 'test') {
      warnings.push('Para testes, considere :memory: para velocidade máxima');
    }

    const dsn = `file:app.db?${dsnParams.join('&')}`;

    return { pragmas, goConfig, dsn, warnings };
  }
}

// ============================================================================
// GERADOR DE CÓDIGO GO
// ============================================================================

export class SQLiteGoCodeGenerator {

  /**
   * Gera código de inicialização completo
   */
  static generateInitCode(options: {
    driver: 'mattn' | 'modernc';
    dbPath: string;
    walMode: boolean;
    migrations: boolean;
  }): string {
    const importPath = options.driver === 'mattn' 
      ? 'github.com/mattn/go-sqlite3'
      : 'modernc.org/sqlite';
    
    const driverName = options.driver === 'mattn' ? 'sqlite3' : 'sqlite';
    
    const pragmaFormat = options.driver === 'mattn'
      ? '_journal_mode=WAL&_foreign_keys=ON&_busy_timeout=5000'
      : '_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)';

    return `package database

import (
    "context"
    "database/sql"
    "fmt"
    "time"
    
    _ "${importPath}"
)

// DB é a conexão global do banco de dados
var DB *sql.DB

// Config contém configurações do banco
type Config struct {
    Path            string
    MaxOpenConns    int
    MaxIdleConns    int
    ConnMaxLifetime time.Duration
}

// DefaultConfig retorna configuração padrão otimizada
func DefaultConfig(dbPath string) Config {
    return Config{
        Path:            dbPath,
        MaxOpenConns:    10,  // WAL permite múltiplos readers
        MaxIdleConns:    5,
        ConnMaxLifetime: time.Hour,
    }
}

// Initialize inicializa a conexão com o banco
func Initialize(cfg Config) error {
    dsn := fmt.Sprintf("file:%s?${pragmaFormat}", cfg.Path)
    
    db, err := sql.Open("${driverName}", dsn)
    if err != nil {
        return fmt.Errorf("failed to open database: %w", err)
    }
    
    // Configurar pool de conexões
    db.SetMaxOpenConns(cfg.MaxOpenConns)
    db.SetMaxIdleConns(cfg.MaxIdleConns)
    db.SetConnMaxLifetime(cfg.ConnMaxLifetime)
    
    // Verificar conexão
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := db.PingContext(ctx); err != nil {
        return fmt.Errorf("failed to ping database: %w", err)
    }
    
    // Executar pragmas adicionais
    pragmas := []string{
        "PRAGMA cache_size=-64000;",      // 64MB cache
        "PRAGMA temp_store=MEMORY;",       // Temp tables em RAM
        "PRAGMA mmap_size=268435456;",     // 256MB mmap
    }
    
    for _, pragma := range pragmas {
        if _, err := db.ExecContext(ctx, pragma); err != nil {
            return fmt.Errorf("failed to execute pragma: %w", err)
        }
    }
    
    DB = db
    return nil
}

// Close fecha a conexão com o banco
func Close() error {
    if DB != nil {
        return DB.Close()
    }
    return nil
}

// WithTransaction executa função dentro de uma transação
func WithTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error {
    tx, err := DB.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }
    
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p)
        }
    }()
    
    if err := fn(tx); err != nil {
        if rbErr := tx.Rollback(); rbErr != nil {
            return fmt.Errorf("tx error: %v, rollback error: %v", err, rbErr)
        }
        return err
    }
    
    return tx.Commit()
}

// HealthCheck verifica saúde do banco
func HealthCheck(ctx context.Context) error {
    if DB == nil {
        return fmt.Errorf("database not initialized")
    }
    
    // Ping
    if err := DB.PingContext(ctx); err != nil {
        return fmt.Errorf("ping failed: %w", err)
    }
    
    // Quick check
    var result string
    err := DB.QueryRowContext(ctx, "PRAGMA quick_check;").Scan(&result)
    if err != nil {
        return fmt.Errorf("quick_check failed: %w", err)
    }
    
    if result != "ok" {
        return fmt.Errorf("integrity check failed: %s", result)
    }
    
    return nil
}
`;
  }

  /**
   * Gera código de migração
   */
  static generateMigrationCode(): string {
    return `package database

import (
    "context"
    "database/sql"
    "fmt"
    "sort"
)

// Migration representa uma migração de banco
type Migration struct {
    Version     int
    Description string
    Up          string
    Down        string
}

// Migrations contém todas as migrações
var Migrations = []Migration{
    {
        Version:     1,
        Description: "Create users table",
        Up: \`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        \`,
        Down: \`DROP TABLE IF EXISTS users;\`,
    },
    // Adicione mais migrações aqui
}

// RunMigrations executa todas as migrações pendentes
func RunMigrations(ctx context.Context, db *sql.DB) error {
    // Criar tabela de controle de migrações
    _, err := db.ExecContext(ctx, \`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    \`)
    if err != nil {
        return fmt.Errorf("failed to create migrations table: %w", err)
    }
    
    // Obter versão atual
    var currentVersion int
    err = db.QueryRowContext(ctx, 
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    ).Scan(&currentVersion)
    if err != nil {
        return fmt.Errorf("failed to get current version: %w", err)
    }
    
    // Ordenar migrações
    sort.Slice(Migrations, func(i, j int) bool {
        return Migrations[i].Version < Migrations[j].Version
    })
    
    // Executar migrações pendentes
    for _, m := range Migrations {
        if m.Version <= currentVersion {
            continue
        }
        
        // Executar em transação
        tx, err := db.BeginTx(ctx, nil)
        if err != nil {
            return fmt.Errorf("failed to begin tx for migration %d: %w", m.Version, err)
        }
        
        if _, err := tx.ExecContext(ctx, m.Up); err != nil {
            tx.Rollback()
            return fmt.Errorf("failed to run migration %d: %w", m.Version, err)
        }
        
        if _, err := tx.ExecContext(ctx, 
            "INSERT INTO schema_migrations (version) VALUES (?)", 
            m.Version,
        ); err != nil {
            tx.Rollback()
            return fmt.Errorf("failed to record migration %d: %w", m.Version, err)
        }
        
        if err := tx.Commit(); err != nil {
            return fmt.Errorf("failed to commit migration %d: %w", m.Version, err)
        }
        
        fmt.Printf("Applied migration %d: %s\\n", m.Version, m.Description)
    }
    
    return nil
}
`;
  }

  /**
   * Gera código de repository pattern
   */
  static generateRepositoryCode(entityName: string, fields: { name: string; type: string; }[]): string {
    const entityLower = entityName.toLowerCase();
    const entityPlural = entityLower + 's';
    
    const fieldList = fields.map(f => f.name).join(', ');
    const placeholders = fields.map(() => '?').join(', ');
    const scanFields = fields.map(f => `&${entityLower}.${f.name}`).join(', ');
    
    return `package repository

import (
    "context"
    "database/sql"
    "fmt"
    "time"
)

// ${entityName} representa a entidade ${entityName}
type ${entityName} struct {
${fields.map(f => `    ${f.name} ${f.type}`).join('\n')}
    CreatedAt time.Time
    UpdatedAt time.Time
}

// ${entityName}Repository gerencia operações de ${entityName}
type ${entityName}Repository struct {
    db *sql.DB
}

// New${entityName}Repository cria novo repository
func New${entityName}Repository(db *sql.DB) *${entityName}Repository {
    return &${entityName}Repository{db: db}
}

// Create insere novo ${entityName}
func (r *${entityName}Repository) Create(ctx context.Context, ${entityLower} *${entityName}) error {
    query := \`
        INSERT INTO ${entityPlural} (${fieldList}, created_at, updated_at)
        VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    \`
    
    result, err := r.db.ExecContext(ctx, query, ${fields.map(f => `${entityLower}.${f.name}`).join(', ')})
    if err != nil {
        return fmt.Errorf("failed to create ${entityLower}: %w", err)
    }
    
    id, err := result.LastInsertId()
    if err != nil {
        return fmt.Errorf("failed to get last insert id: %w", err)
    }
    
    ${entityLower}.ID = id
    return nil
}

// GetByID busca ${entityName} por ID
func (r *${entityName}Repository) GetByID(ctx context.Context, id int64) (*${entityName}, error) {
    query := \`SELECT id, ${fieldList}, created_at, updated_at FROM ${entityPlural} WHERE id = ?\`
    
    ${entityLower} := &${entityName}{}
    err := r.db.QueryRowContext(ctx, query, id).Scan(
        &${entityLower}.ID, ${scanFields}, &${entityLower}.CreatedAt, &${entityLower}.UpdatedAt,
    )
    
    if err == sql.ErrNoRows {
        return nil, nil
    }
    if err != nil {
        return nil, fmt.Errorf("failed to get ${entityLower}: %w", err)
    }
    
    return ${entityLower}, nil
}

// Update atualiza ${entityName}
func (r *${entityName}Repository) Update(ctx context.Context, ${entityLower} *${entityName}) error {
    query := \`
        UPDATE ${entityPlural} 
        SET ${fields.map(f => `${f.name} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    \`
    
    _, err := r.db.ExecContext(ctx, query, ${fields.map(f => `${entityLower}.${f.name}`).join(', ')}, ${entityLower}.ID)
    if err != nil {
        return fmt.Errorf("failed to update ${entityLower}: %w", err)
    }
    
    return nil
}

// Delete remove ${entityName} por ID
func (r *${entityName}Repository) Delete(ctx context.Context, id int64) error {
    query := \`DELETE FROM ${entityPlural} WHERE id = ?\`
    
    _, err := r.db.ExecContext(ctx, query, id)
    if err != nil {
        return fmt.Errorf("failed to delete ${entityLower}: %w", err)
    }
    
    return nil
}

// List retorna todos os ${entityPlural} com paginação
func (r *${entityName}Repository) List(ctx context.Context, limit, offset int) ([]*${entityName}, error) {
    query := \`
        SELECT id, ${fieldList}, created_at, updated_at 
        FROM ${entityPlural} 
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    \`
    
    rows, err := r.db.QueryContext(ctx, query, limit, offset)
    if err != nil {
        return nil, fmt.Errorf("failed to list ${entityPlural}: %w", err)
    }
    defer rows.Close()
    
    var ${entityPlural}List []*${entityName}
    for rows.Next() {
        ${entityLower} := &${entityName}{}
        err := rows.Scan(
            &${entityLower}.ID, ${scanFields}, &${entityLower}.CreatedAt, &${entityLower}.UpdatedAt,
        )
        if err != nil {
            return nil, fmt.Errorf("failed to scan ${entityLower}: %w", err)
        }
        ${entityPlural}List = append(${entityPlural}List, ${entityLower})
    }
    
    return ${entityPlural}List, nil
}
`;
  }
}


// ============================================================================
// MANIFESTO TEXTUAL COMPLETO
// ============================================================================

export const SQLITE3_SUPREME_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║          🗄️ SQLITE3 SUPREME MASTER - LEVEL 12: GUARDIÃO DOS DADOS 🗄️       ║
║                                                                              ║
║     "SQLite não é um substituto para Oracle. É um substituto para fopen()." ║
║                              — D. Richard Hipp                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
📜 VERDADES FUNDAMENTAIS
═══════════════════════════════════════════════════════════════════════════════

O QUE SQLITE É:
✅ Uma biblioteca C que implementa SQL (não um servidor)
✅ Um único arquivo = banco completo
✅ ACID compliant com transações atômicas
✅ Zero configuração - funciona out-of-the-box
✅ Public domain - uso livre sem restrições
✅ O banco de dados mais implantado do mundo (bilhões de dispositivos)

O QUE SQLITE NÃO É:
❌ Não é um servidor de banco de dados
❌ Não é para alta concorrência de escrita
❌ Não é para replicação multi-master
❌ Não é para centenas de conexões simultâneas

═══════════════════════════════════════════════════════════════════════════════
🏗️ ARQUITETURA INTERNA
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                        SQLITE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│  SQL Interface (Parser, Tokenizer)                              │
│       ↓                                                         │
│  Virtual Machine (VDBE - bytecode executor)                     │
│       ↓                                                         │
│  B-Tree (índices e tabelas)                                     │
│       ↓                                                         │
│  Pager (cache de páginas, journaling)                           │
│       ↓                                                         │
│  OS Interface (VFS - Virtual File System)                       │
│       ↓                                                         │
│  [ARQUIVO .db / .sqlite]                                        │
└─────────────────────────────────────────────────────────────────┘

COMPONENTES CHAVE:
• Parser: Converte SQL em árvore sintática
• VDBE: Executa bytecode (como uma VM)
• B-Tree: Estrutura de dados para tabelas e índices
• Pager: Gerencia páginas de 4KB, cache, journaling
• VFS: Abstração do sistema de arquivos

═══════════════════════════════════════════════════════════════════════════════
📝 JOURNAL MODES (CRÍTICO ENTENDER)
═══════════════════════════════════════════════════════════════════════════════

┌──────────┬─────────────────────────────────────┬─────────────┬─────────────┐
│ Mode     │ Descrição                           │ Performance │ Concorrência│
├──────────┼─────────────────────────────────────┼─────────────┼─────────────┤
│ DELETE   │ Journal deletado após commit        │ Baixa       │ Ruim        │
│ TRUNCATE │ Journal truncado (mais rápido)      │ Média       │ Ruim        │
│ PERSIST  │ Journal mantido, header zerado      │ Média       │ Ruim        │
│ WAL ✅   │ Write-Ahead Logging                 │ Alta        │ Excelente   │
│ MEMORY   │ Journal em RAM                      │ Máxima      │ Ruim        │
│ OFF ⚠️   │ Sem journal - PERIGOSO!             │ Máxima      │ Ruim        │
└──────────┴─────────────────────────────────────┴─────────────┴─────────────┘

WAL MODE (Write-Ahead Logging) - RECOMENDADO:
• Leitores NÃO bloqueiam escritores
• Escritores NÃO bloqueiam leitores
• Melhor performance em reads concorrentes
• ⚠️ Ainda há apenas UM escritor por vez
• ⚠️ Gera arquivos auxiliares (-wal, -shm)

PRAGMA journal_mode=WAL;

═══════════════════════════════════════════════════════════════════════════════
⚙️ PRAGMAS ESSENCIAIS
═══════════════════════════════════════════════════════════════════════════════

-- PERFORMANCE
PRAGMA journal_mode=WAL;           -- Concorrência melhorada
PRAGMA synchronous=NORMAL;         -- Balance durabilidade/performance
PRAGMA cache_size=-64000;          -- 64MB de cache
PRAGMA temp_store=MEMORY;          -- Temp tables em RAM
PRAGMA mmap_size=268435456;        -- 256MB memory-mapped I/O

-- INTEGRIDADE (OBRIGATÓRIO!)
PRAGMA foreign_keys=ON;            -- SEMPRE ativar!
PRAGMA busy_timeout=5000;          -- Espera 5s antes de SQLITE_BUSY

-- VERIFICAÇÃO
PRAGMA integrity_check;            -- Verificar corrupção
PRAGMA quick_check;                -- Verificação rápida

═══════════════════════════════════════════════════════════════════════════════
🔒 NÍVEIS DE LOCK
═══════════════════════════════════════════════════════════════════════════════

1. UNLOCKED   → Nenhum lock
2. SHARED     → Leitura (múltiplos permitidos)
3. RESERVED   → Preparando para escrever
4. PENDING    → Esperando readers terminarem
5. EXCLUSIVE  → Escrita (apenas um)

Com WAL mode:
• Readers obtêm SHARED lock no arquivo principal
• Writer obtém EXCLUSIVE lock no arquivo -wal
• Readers e writers podem coexistir!

═══════════════════════════════════════════════════════════════════════════════
🐹 INTEGRAÇÃO COM GO
═══════════════════════════════════════════════════════════════════════════════

DRIVER CGO (mattn/go-sqlite3):
┌────────────────────────────────────────────────────────────────────────────┐
│ import _ "github.com/mattn/go-sqlite3"                                     │
│                                                                            │
│ db, _ := sql.Open("sqlite3",                                               │
│     "file:app.db?_journal_mode=WAL&_foreign_keys=ON&_busy_timeout=5000")  │
├────────────────────────────────────────────────────────────────────────────┤
│ ✅ Performance máxima (wrapper C nativo)                                   │
│ ✅ Suporte completo a todas extensões                                      │
│ ❌ Requer CGO (GCC/Clang)                                                  │
│ ❌ Cross-compile complexo                                                  │
└────────────────────────────────────────────────────────────────────────────┘

DRIVER PURE-GO (modernc.org/sqlite):
┌────────────────────────────────────────────────────────────────────────────┐
│ import _ "modernc.org/sqlite"                                              │
│                                                                            │
│ db, _ := sql.Open("sqlite",                                                │
│     "file:app.db?_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)")      │
├────────────────────────────────────────────────────────────────────────────┤
│ ✅ Pure Go - sem CGO                                                       │
│ ✅ Cross-compile trivial                                                   │
│ ❌ 10-20% mais lento que CGO                                               │
│ ❌ Algumas extensões não disponíveis                                       │
└────────────────────────────────────────────────────────────────────────────┘

CONFIGURAÇÃO CRÍTICA:
┌────────────────────────────────────────────────────────────────────────────┐
│ // Para single-writer (mais seguro):                                       │
│ db.SetMaxOpenConns(1)                                                      │
│ db.SetMaxIdleConns(1)                                                      │
│ db.SetConnMaxLifetime(0)                                                   │
│                                                                            │
│ // Para WAL mode com múltiplos readers:                                    │
│ db.SetMaxOpenConns(10)  // Múltiplos readers OK                            │
│ db.SetMaxIdleConns(5)                                                      │
│ db.SetConnMaxLifetime(time.Hour)                                           │
│ // ⚠️ Escritas ainda são serializadas!                                     │
└────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
💰 TRANSAÇÕES ATÔMICAS (OBRIGATÓRIO!)
═══════════════════════════════════════════════════════════════════════════════

❌ ERRADO - Operações separadas:
db.Exec("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
db.Exec("UPDATE accounts SET balance = balance + 100 WHERE id = 2")
// Se falhar no meio, dinheiro some!

✅ CERTO - Transação atômica:
tx, err := db.Begin()
if err != nil {
    return err
}
defer tx.Rollback()

_, err = tx.Exec("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
if err != nil {
    return err
}

_, err = tx.Exec("UPDATE accounts SET balance = balance + 100 WHERE id = 2")
if err != nil {
    return err
}

return tx.Commit()  // Tudo ou nada!

═══════════════════════════════════════════════════════════════════════════════
🔌 EXTENSÕES PODEROSAS
═══════════════════════════════════════════════════════════════════════════════

FTS5 (Full-Text Search):
┌────────────────────────────────────────────────────────────────────────────┐
│ CREATE VIRTUAL TABLE docs USING fts5(title, content);                      │
│ SELECT * FROM docs WHERE docs MATCH 'sqlite AND database';                 │
│ SELECT highlight(docs, 0, '<b>', '</b>') FROM docs WHERE docs MATCH 'x';  │
└────────────────────────────────────────────────────────────────────────────┘

JSON1:
┌────────────────────────────────────────────────────────────────────────────┐
│ SELECT json_extract(data, '$.user.name') FROM events;                      │
│ UPDATE events SET data = json_set(data, '$.status', 'done');              │
│ SELECT data->>'$.email' FROM events;  -- SQLite 3.38+                      │
└────────────────────────────────────────────────────────────────────────────┘

R*Tree (Geoespacial):
┌────────────────────────────────────────────────────────────────────────────┐
│ CREATE VIRTUAL TABLE geo USING rtree(id, minLat, maxLat, minLon, maxLon); │
│ SELECT * FROM geo WHERE minLat >= -24 AND maxLat <= -23;                   │
└────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
✅ QUANDO USAR SQLITE
═══════════════════════════════════════════════════════════════════════════════

USE SQLITE PARA:
• Aplicações desktop/mobile
• Ferramentas CLI
• Caches locais persistentes
• Prototipagem rápida
• Testes (in-memory)
• Edge computing / IoT
• Aplicações offline-first
• Bancos por usuário/tenant
• Configurações de aplicação
• Logs estruturados locais

NÃO USE SQLITE PARA:
• Alta concorrência de escrita (>100 writes/s simultâneos)
• Múltiplos servidores acessando mesmo arquivo
• Replicação multi-master
• Dados > 1TB com heavy-write
• Aplicações web com muitos usuários escrevendo

═══════════════════════════════════════════════════════════════════════════════
📋 CHECKLIST DO ESPECIALISTA
═══════════════════════════════════════════════════════════════════════════════

[ ] PRAGMA journal_mode=WAL ativado?
[ ] PRAGMA foreign_keys=ON?
[ ] Busy timeout configurado?
[ ] MaxOpenConns limitado apropriadamente?
[ ] Transações para operações múltiplas?
[ ] Prepared statements (nunca concatenar SQL)?
[ ] Índices para queries frequentes?
[ ] EXPLAIN QUERY PLAN verificado?
[ ] Backup automatizado?
[ ] Versão do SQLite atualizada?
[ ] CVEs monitorados?

═══════════════════════════════════════════════════════════════════════════════
🔐 SEGURANÇA
═══════════════════════════════════════════════════════════════════════════════

• Monitore CVEs: https://sqlite.org/cves.html
• Atualize regularmente
• Nunca exponha arquivo .db diretamente
• Use prepared statements SEMPRE (SQL injection)
• Valide inputs antes de queries
• Considere SQLCipher para criptografia

═══════════════════════════════════════════════════════════════════════════════
💾 BACKUP SEGURO
═══════════════════════════════════════════════════════════════════════════════

Via SQL:
VACUUM INTO 'backup.db';

Via API (Go com mattn):
backup, _ := destConn.Backup("main", srcConn, "main")
for {
    done, _ := backup.Step(100)
    if done { break }
}
backup.Close()

⚠️ NUNCA copie o arquivo .db diretamente enquanto em uso!

═══════════════════════════════════════════════════════════════════════════════

"SQLite é a ferramenta certa quando você precisa de persistência estruturada,
queries SQL, transações ACID, e zero administração.
Não force SQLite onde ele não pertence. Use-o onde ele brilha."

                    — SQLite3 Supreme Master, Level 12
`;

// ============================================================================
// FUNÇÃO DE DETECÇÃO (para o Orchestrator)
// ============================================================================

/**
 * Detecta se o prompt precisa do SQLite3 Supreme Master
 */
export function shouldEnableSQLite3(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const sqliteKeywords = [
    // SQLite direto
    'sqlite', 'sqlite3', 'sqlite 3',
    
    // Conceitos SQLite
    'banco embutido', 'embedded database', 'single-file database',
    'database file', 'arquivo de banco',
    
    // Drivers Go
    'mattn/go-sqlite3', 'mattn go-sqlite', 'go-sqlite3',
    'modernc.org/sqlite', 'modernc sqlite', 'pure-go sqlite',
    'crawshaw/sqlite', 'zombiezen',
    
    // Pragmas e configurações
    'pragma', 'journal_mode', 'journal mode',
    'wal mode', 'write-ahead log', 'write ahead log',
    'synchronous', 'foreign_keys', 'busy_timeout',
    
    // Extensões
    'fts5', 'fts4', 'fts3', 'full-text search sqlite',
    'json1', 'rtree', 'r-tree',
    
    // Conceitos técnicos
    'sqlite locking', 'sqlite_busy', 'database is locked',
    'sqlite concurrency', 'sqlite transaction',
    
    // Casos de uso
    'offline-first', 'offline first',
    'banco local', 'local database',
    'banco por tenant', 'database per tenant',
    'edge database', 'iot database',
    
    // CGO relacionado
    'cgo sqlite', 'pure go database', 'no-cgo database',
  ];
  
  // Verifica keywords diretas
  if (sqliteKeywords.some(keyword => promptLower.includes(keyword))) {
    return true;
  }
  
  // Verifica padrões compostos
  const compositePatterns = [
    /banco\s+(de\s+)?dados?\s+(embutido|local|arquivo)/i,
    /embedded\s+database/i,
    /single.?file\s+database/i,
    /\.db\s+file/i,
    /\.sqlite\s+file/i,
    /go\s+(e|and|com|with)\s+sqlite/i,
    /sqlite\s+(e|and|com|with)\s+go/i,
    /database\s+sem\s+servidor/i,
    /serverless\s+database/i,
    /banco\s+offline/i,
  ];
  
  return compositePatterns.some(pattern => pattern.test(prompt));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SQLITE3_SUPREME_MANIFEST,
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
};
