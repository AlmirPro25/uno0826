/**
 * REDIS CACHING MANIFEST
 * In-Memory Data Store Architect
 */

export const REDIS_CACHING_MANIFEST = {
  id: 'redis-caching',
  name: 'Redis Caching Manifest',
  version: '1.0.0',
  category: 'infrastructure',

  activation: {
    keywords: [
      'redis', 'cache', 'caching', 'in-memory',
      'session store', 'pub sub', 'rate limiting',
      'leaderboard', 'queue'
    ]
  },

  philosophy: {
    core: 'Velocidade e simplicidade em memoria.',
    principles: ['Cache first', 'TTL sempre', 'Eviction policies', 'Persistence opcional']
  },

  dataStructures: {
    STRING: 'Key-value simples, counters',
    HASH: 'Objetos, user sessions',
    LIST: 'Queues, recent items',
    SET: 'Tags, unique items',
    SORTED_SET: 'Leaderboards, rankings',
    STREAM: 'Event sourcing, logs'
  },

  patterns: {
    CACHE_ASIDE: 'App gerencia cache',
    WRITE_THROUGH: 'Escreve cache e DB',
    WRITE_BEHIND: 'Escreve cache, DB async',
    READ_THROUGH: 'Cache busca do DB'
  },

  useCases: [
    'Session storage',
    'API response caching',
    'Rate limiting',
    'Real-time leaderboards',
    'Pub/Sub messaging',
    'Job queues'
  ],

  bestPractices: [
    'Sempre defina TTL',
    'Use namespaces em keys',
    'Monitore memoria',
    'Configure maxmemory-policy',
    'Use connection pooling'
  ],

  checklist: {
    setup: ['Conexao configurada?', 'Senha definida?', 'TLS habilitado?'],
    performance: ['TTL definido?', 'Eviction policy?', 'Memory limits?'],
    monitoring: ['Metricas expostas?', 'Alertas configurados?']
  },

  antiPatterns: [
    'NUNCA use como banco principal',
    'NUNCA ignore TTL',
    'NUNCA armazene dados sensiveis sem criptografia'
  ],

  goldenRule: 'Redis e rapido, mas memoria e finita. Use com sabedoria.'
};

export default REDIS_CACHING_MANIFEST;
