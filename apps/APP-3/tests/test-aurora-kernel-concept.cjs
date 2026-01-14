/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║     🧪 TESTES - AURORA KERNEL CONCEPT (6 EIXOS FUNDAMENTAIS)                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DO SYSTEM SYNTHESIS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const COMPUTATION_MODELS = {
  'von_neumann': { tradeoffs: { simplicity: 5, performance: 3, safety: 2 } },
  'capability_based': { tradeoffs: { simplicity: 2, performance: 3, safety: 5 } },
  'actor_model': { tradeoffs: { simplicity: 3, performance: 4, safety: 5 } },
  'event_driven': { tradeoffs: { simplicity: 4, performance: 4, safety: 3 } }
};

const INTENT_TOKEN_MAPPINGS = [
  { intent: 'ISOLAMENTO_FORTE', tokens: ['T_CAPABILITY_GRANT', 'T_MEMORY_PROTECT'] },
  { intent: 'PERFORMANCE_MAXIMA', tokens: ['T_MEMORY_MAP', 'T_SCHEDULE_SET_AFFINITY'] },
  { intent: 'TEMPO_REAL_HARD', tokens: ['T_SCHEDULE_SET_PRIORITY', 'T_TIME_SET_TIMER'] },
  { intent: 'SEGURANCA_MAXIMA', tokens: ['T_CAPABILITY_GRANT', 'T_CAPABILITY_REVOKE'] },
  { intent: 'TOLERANCIA_FALHAS', tokens: ['T_PROCESS_CREATE', 'T_IPC_SEND'] }
];

class SystemSynthesisEngine {
  static recommendComputationModel(intents) {
    if (intents.includes('SEGURANCA_MAXIMA') || intents.includes('ISOLAMENTO_FORTE')) {
      return 'capability_based';
    }
    if (intents.includes('TEMPO_REAL_HARD')) {
      return 'event_driven';
    }
    if (intents.includes('PERFORMANCE_MAXIMA')) {
      return 'von_neumann';
    }
    if (intents.includes('TOLERANCIA_FALHAS')) {
      return 'actor_model';
    }
    return 'von_neumann';
  }
  
  static selectTokens(intents) {
    const tokens = new Set(['T_PROCESS_CREATE', 'T_PROCESS_EXIT', 'T_MEMORY_MAP', 'T_TIME_NOW']);
    for (const intent of intents) {
      const mapping = INTENT_TOKEN_MAPPINGS.find(m => m.intent === intent);
      if (mapping) mapping.tokens.forEach(t => tokens.add(t));
    }
    return Array.from(tokens);
  }
  
  static recommendScheduling(intents) {
    if (intents.includes('TEMPO_REAL_HARD')) return 'edf';
    if (intents.includes('TEMPO_REAL_SOFT')) return 'priority_preemptive';
    if (intents.includes('PERFORMANCE_MAXIMA')) return 'cfs';
    return 'round_robin';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

console.log('\n🧠 AURORA KERNEL CONCEPT - TESTES DOS 6 EIXOS\n');
console.log('═'.repeat(60));

// ═══════════════════════════════════════════════════════════════════════════════
// EIXO 1: MODELO DE COMPUTAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📐 EIXO 1: MODELO DE COMPUTAÇÃO\n');

test('Recomenda capability_based para SEGURANCA_MAXIMA', () => {
  const model = SystemSynthesisEngine.recommendComputationModel(['SEGURANCA_MAXIMA']);
  assert.strictEqual(model, 'capability_based');
});

test('Recomenda capability_based para ISOLAMENTO_FORTE', () => {
  const model = SystemSynthesisEngine.recommendComputationModel(['ISOLAMENTO_FORTE']);
  assert.strictEqual(model, 'capability_based');
});

test('Recomenda event_driven para TEMPO_REAL_HARD', () => {
  const model = SystemSynthesisEngine.recommendComputationModel(['TEMPO_REAL_HARD']);
  assert.strictEqual(model, 'event_driven');
});

test('Recomenda von_neumann para PERFORMANCE_MAXIMA', () => {
  const model = SystemSynthesisEngine.recommendComputationModel(['PERFORMANCE_MAXIMA']);
  assert.strictEqual(model, 'von_neumann');
});

test('Recomenda actor_model para TOLERANCIA_FALHAS', () => {
  const model = SystemSynthesisEngine.recommendComputationModel(['TOLERANCIA_FALHAS']);
  assert.strictEqual(model, 'actor_model');
});

test('Default é von_neumann', () => {
  const model = SystemSynthesisEngine.recommendComputationModel([]);
  assert.strictEqual(model, 'von_neumann');
});


// ═══════════════════════════════════════════════════════════════════════════════
// EIXO 2: TOKEN ISA
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📜 EIXO 2: TOKEN ISA\n');

test('Tokens básicos sempre incluídos', () => {
  const tokens = SystemSynthesisEngine.selectTokens([]);
  assert(tokens.includes('T_PROCESS_CREATE'));
  assert(tokens.includes('T_PROCESS_EXIT'));
  assert(tokens.includes('T_MEMORY_MAP'));
  assert(tokens.includes('T_TIME_NOW'));
});

test('SEGURANCA_MAXIMA adiciona tokens de capability', () => {
  const tokens = SystemSynthesisEngine.selectTokens(['SEGURANCA_MAXIMA']);
  assert(tokens.includes('T_CAPABILITY_GRANT'));
  assert(tokens.includes('T_CAPABILITY_REVOKE'));
});

test('ISOLAMENTO_FORTE adiciona T_MEMORY_PROTECT', () => {
  const tokens = SystemSynthesisEngine.selectTokens(['ISOLAMENTO_FORTE']);
  assert(tokens.includes('T_MEMORY_PROTECT'));
});

test('TEMPO_REAL_HARD adiciona tokens de scheduling e timer', () => {
  const tokens = SystemSynthesisEngine.selectTokens(['TEMPO_REAL_HARD']);
  assert(tokens.includes('T_SCHEDULE_SET_PRIORITY'));
  assert(tokens.includes('T_TIME_SET_TIMER'));
});

test('Múltiplos intents combinam tokens', () => {
  const tokens = SystemSynthesisEngine.selectTokens(['SEGURANCA_MAXIMA', 'TEMPO_REAL_HARD']);
  assert(tokens.includes('T_CAPABILITY_GRANT'));
  assert(tokens.includes('T_SCHEDULE_SET_PRIORITY'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// EIXO 4: SCHEDULING
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n⏱️ EIXO 4: SCHEDULING\n');

test('TEMPO_REAL_HARD usa EDF', () => {
  const sched = SystemSynthesisEngine.recommendScheduling(['TEMPO_REAL_HARD']);
  assert.strictEqual(sched, 'edf');
});

test('TEMPO_REAL_SOFT usa priority_preemptive', () => {
  const sched = SystemSynthesisEngine.recommendScheduling(['TEMPO_REAL_SOFT']);
  assert.strictEqual(sched, 'priority_preemptive');
});

test('PERFORMANCE_MAXIMA usa CFS', () => {
  const sched = SystemSynthesisEngine.recommendScheduling(['PERFORMANCE_MAXIMA']);
  assert.strictEqual(sched, 'cfs');
});

test('Default é round_robin', () => {
  const sched = SystemSynthesisEngine.recommendScheduling([]);
  assert.strictEqual(sched, 'round_robin');
});

// ═══════════════════════════════════════════════════════════════════════════════
// CENÁRIOS COMPLETOS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🎯 CENÁRIOS COMPLETOS\n');

test('Cenário: OS Seguro (seL4-style)', () => {
  const intents = ['SEGURANCA_MAXIMA', 'ISOLAMENTO_FORTE', 'MINIMALISMO'];
  const model = SystemSynthesisEngine.recommendComputationModel(intents);
  const tokens = SystemSynthesisEngine.selectTokens(intents);
  
  assert.strictEqual(model, 'capability_based');
  assert(tokens.includes('T_CAPABILITY_GRANT'));
  assert(tokens.includes('T_MEMORY_PROTECT'));
});

test('Cenário: RTOS Hard Real-Time', () => {
  const intents = ['TEMPO_REAL_HARD', 'PERFORMANCE_MAXIMA'];
  const model = SystemSynthesisEngine.recommendComputationModel(intents);
  const sched = SystemSynthesisEngine.recommendScheduling(intents);
  
  assert.strictEqual(model, 'event_driven');
  assert.strictEqual(sched, 'edf');
});

test('Cenário: Sistema Distribuído Tolerante a Falhas', () => {
  const intents = ['TOLERANCIA_FALHAS', 'EXTENSIBILIDADE'];
  const model = SystemSynthesisEngine.recommendComputationModel(intents);
  const tokens = SystemSynthesisEngine.selectTokens(intents);
  
  assert.strictEqual(model, 'actor_model');
  assert(tokens.includes('T_IPC_SEND'));
});

test('Cenário: OS de Alta Performance (Linux-style)', () => {
  const intents = ['PERFORMANCE_MAXIMA'];
  const model = SystemSynthesisEngine.recommendComputationModel(intents);
  const sched = SystemSynthesisEngine.recommendScheduling(intents);
  
  assert.strictEqual(model, 'von_neumann');
  assert.strictEqual(sched, 'cfs');
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 RESULTADO: ${passed} passou, ${failed} falhou`);
console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed > 0) {
  process.exit(1);
}
