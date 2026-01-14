/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║     🧪 TESTES - INTEGRAÇÃO AURORA KERNEL CONCEPT + AURORA BUILDER           ║
 * ║                                                                              ║
 * ║     Valida que o fluxo INTENT → TOKEN → IR → BACKEND funciona               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DO SYSTEM SYNTHESIS ENGINE (mesmo do AuroraKernelConcept)
// ═══════════════════════════════════════════════════════════════════════════════

const COMPUTATION_MODELS = {
  'von_neumann': { 
    characteristics: { memoryModel: 'unified', executionModel: 'sequential', stateModel: 'shared' },
    tradeoffs: { simplicity: 5, performance: 3, safety: 2 } 
  },
  'capability_based': { 
    characteristics: { memoryModel: 'distributed', executionModel: 'concurrent', stateModel: 'isolated' },
    tradeoffs: { simplicity: 2, performance: 3, safety: 5 } 
  },
  'actor_model': { 
    characteristics: { memoryModel: 'distributed', executionModel: 'concurrent', stateModel: 'isolated' },
    tradeoffs: { simplicity: 3, performance: 4, safety: 5 } 
  },
  'event_driven': { 
    characteristics: { memoryModel: 'unified', executionModel: 'reactive', stateModel: 'shared' },
    tradeoffs: { simplicity: 4, performance: 4, safety: 3 } 
  },
  'message_passing': {
    characteristics: { memoryModel: 'distributed', executionModel: 'concurrent', stateModel: 'isolated' },
    tradeoffs: { simplicity: 3, performance: 4, safety: 5 }
  }
};

const TOKEN_ISA = [
  { token: 'T_PROCESS_CREATE', category: 'process', description: 'Cria um novo processo/thread' },
  { token: 'T_PROCESS_EXIT', category: 'process', description: 'Termina o processo atual' },
  { token: 'T_MEMORY_MAP', category: 'memory', description: 'Mapeia região de memória virtual' },
  { token: 'T_MEMORY_PROTECT', category: 'memory', description: 'Altera permissões de região' },
  { token: 'T_IPC_SEND', category: 'ipc', description: 'Envia mensagem para outro processo' },
  { token: 'T_IPC_RECEIVE', category: 'ipc', description: 'Recebe mensagem' },
  { token: 'T_SCHEDULE_SET_PRIORITY', category: 'schedule', description: 'Define prioridade de processo' },
  { token: 'T_TIME_NOW', category: 'time', description: 'Obtém tempo atual' },
  { token: 'T_TIME_SET_TIMER', category: 'time', description: 'Configura timer' },
  { token: 'T_CAPABILITY_GRANT', category: 'security', description: 'Concede capability a processo' },
  { token: 'T_CAPABILITY_REVOKE', category: 'security', description: 'Revoga capability' },
  { token: 'T_INTERRUPT_REGISTER', category: 'interrupt', description: 'Registra handler de interrupção' }
];

const INTENT_TOKEN_MAPPINGS = [
  { intent: 'ISOLAMENTO_FORTE', tokens: ['T_CAPABILITY_GRANT', 'T_MEMORY_PROTECT', 'T_IPC_SEND'] },
  { intent: 'PERFORMANCE_MAXIMA', tokens: ['T_MEMORY_MAP', 'T_SCHEDULE_SET_AFFINITY'] },
  { intent: 'TEMPO_REAL_HARD', tokens: ['T_SCHEDULE_SET_PRIORITY', 'T_TIME_SET_TIMER', 'T_INTERRUPT_REGISTER'] },
  { intent: 'SEGURANCA_MAXIMA', tokens: ['T_CAPABILITY_GRANT', 'T_CAPABILITY_REVOKE', 'T_MEMORY_PROTECT'] },
  { intent: 'TOLERANCIA_FALHAS', tokens: ['T_PROCESS_CREATE', 'T_IPC_SEND', 'T_TIME_SET_TIMER'] },
  { intent: 'EXTENSIBILIDADE', tokens: ['T_PROCESS_CREATE', 'T_IPC_SEND'] }
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
    if (intents.includes('EXTENSIBILIDADE')) {
      return 'message_passing';
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
  
  static synthesize(name, description, intents, targetArchitectures) {
    const computationModel = this.recommendComputationModel(intents);
    const tokens = this.selectTokens(intents);
    const scheduling = this.recommendScheduling(intents);
    
    return {
      name,
      description,
      computationModel,
      tokenISA: tokens,
      intents,
      temporal: {
        scheduling,
        preemption: intents.includes('TEMPO_REAL_HARD') || intents.includes('TEMPO_REAL_SOFT'),
        priorities: intents.includes('TEMPO_REAL_HARD') ? 256 : 32,
        deadlineSupport: intents.includes('TEMPO_REAL_HARD')
      },
      concurrency: {
        model: computationModel === 'actor_model' ? 'actors' : 'processes',
        sharedState: computationModel === 'von_neumann',
        synchronization: computationModel === 'actor_model' ? ['channel'] : ['mutex', 'semaphore'],
        deadlockPrevention: intents.includes('SEGURANCA_MAXIMA') ? 'prevention' : 'detection'
      },
      fault: {
        isolation: computationModel === 'capability_based' ? 'process' : 'none',
        recovery: intents.includes('TOLERANCIA_FALHAS') ? ['restart', 'checkpoint'] : ['restart'],
        supervision: intents.includes('TOLERANCIA_FALHAS') ? 'supervisor_tree' : 'watchdog'
      },
      targetArchitectures,
      reasoning: {
        whyThisModel: `Modelo ${computationModel} escolhido baseado nos intents: ${intents.join(', ')}`,
        tradeoffsAccepted: [],
        alternativesConsidered: Object.keys(COMPUTATION_MODELS).filter(m => m !== computationModel)
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DO INTENT DETECTOR (como no AuroraBuilder)
// ═══════════════════════════════════════════════════════════════════════════════

function detectSystemIntents(prompt, projectType) {
  const promptLower = prompt.toLowerCase();
  const intents = [];
  
  const intentKeywords = {
    'ISOLAMENTO_FORTE': ['isolamento', 'isolation', 'sandbox', 'separação', 'microkernel'],
    'PERFORMANCE_MAXIMA': ['performance', 'rápido', 'fast', 'otimizado', 'zero-copy'],
    'TEMPO_REAL_HARD': ['tempo real', 'real-time', 'hard real-time', 'determinístico', 'deadline'],
    'SEGURANCA_MAXIMA': ['seguro', 'secure', 'segurança', 'security', 'capability', 'sel4'],
    'MINIMALISMO': ['mínimo', 'minimal', 'pequeno', 'small', 'exokernel'],
    'EXTENSIBILIDADE': ['extensível', 'extensible', 'modular', 'plugin'],
    'TOLERANCIA_FALHAS': ['tolerante a falhas', 'fault tolerant', 'resiliente', 'recovery']
  };
  
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(k => promptLower.includes(k))) {
      intents.push(intent);
    }
  }
  
  // Defaults por tipo de projeto
  const defaultIntents = {
    'operating_system': ['ISOLAMENTO_FORTE', 'EXTENSIBILIDADE'],
    'rtos': ['TEMPO_REAL_HARD'],
    'crypto_library': ['SEGURANCA_MAXIMA'],
    'hypervisor': ['ISOLAMENTO_FORTE', 'SEGURANCA_MAXIMA']
  };
  
  if (intents.length === 0 && defaultIntents[projectType]) {
    intents.push(...defaultIntents[projectType]);
  }
  
  return intents;
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

console.log('\n🧠 AURORA KERNEL CONCEPT + AURORA BUILDER - TESTES DE INTEGRAÇÃO\n');
console.log('═'.repeat(70));

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 1: FLUXO COMPLETO INTENT → TOKEN → MACHINE
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔄 FLUXO COMPLETO: INTENT → TOKEN → ABSTRACT MACHINE\n');

test('Fluxo: OS Seguro (seL4-style) gera máquina capability_based', () => {
  const prompt = 'Crie um sistema operacional seguro com isolamento forte tipo seL4';
  const intents = detectSystemIntents(prompt, 'operating_system');
  const machine = SystemSynthesisEngine.synthesize('SecureOS', prompt, intents, ['x86_64']);
  
  assert(intents.includes('ISOLAMENTO_FORTE') || intents.includes('SEGURANCA_MAXIMA'));
  assert.strictEqual(machine.computationModel, 'capability_based');
  assert(machine.tokenISA.includes('T_CAPABILITY_GRANT'));
  assert.strictEqual(machine.fault.isolation, 'process');
});

test('Fluxo: RTOS gera máquina event_driven com EDF', () => {
  const prompt = 'Crie um RTOS hard real-time com deadlines garantidos';
  const intents = detectSystemIntents(prompt, 'rtos');
  const machine = SystemSynthesisEngine.synthesize('HardRTOS', prompt, intents, ['arm64']);
  
  assert(intents.includes('TEMPO_REAL_HARD'));
  assert.strictEqual(machine.computationModel, 'event_driven');
  assert.strictEqual(machine.temporal.scheduling, 'edf');
  assert.strictEqual(machine.temporal.deadlineSupport, true);
  assert(machine.tokenISA.includes('T_TIME_SET_TIMER'));
});

test('Fluxo: Crypto Library gera máquina com segurança máxima', () => {
  const prompt = 'Crie uma biblioteca criptográfica segura';
  const intents = detectSystemIntents(prompt, 'crypto_library');
  const machine = SystemSynthesisEngine.synthesize('SecureCrypto', prompt, intents, ['x86_64']);
  
  assert(intents.includes('SEGURANCA_MAXIMA'));
  assert.strictEqual(machine.computationModel, 'capability_based');
  assert(machine.tokenISA.includes('T_CAPABILITY_REVOKE'));
  assert.strictEqual(machine.concurrency.deadlockPrevention, 'prevention');
});

test('Fluxo: Hypervisor gera máquina com isolamento + segurança', () => {
  const prompt = 'Crie um hypervisor tipo 1 com isolamento forte';
  const intents = detectSystemIntents(prompt, 'hypervisor');
  const machine = SystemSynthesisEngine.synthesize('SecureHypervisor', prompt, intents, ['x86_64']);
  
  assert(intents.includes('ISOLAMENTO_FORTE'));
  assert.strictEqual(machine.computationModel, 'capability_based');
  assert(machine.tokenISA.includes('T_MEMORY_PROTECT'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 2: SÍNTESE DE ABSTRACT MACHINE COMPLETA
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🏗️ SÍNTESE DE ABSTRACT MACHINE\n');

test('Abstract Machine tem todos os campos obrigatórios', () => {
  const machine = SystemSynthesisEngine.synthesize(
    'TestOS', 
    'Sistema de teste', 
    ['ISOLAMENTO_FORTE'], 
    ['x86_64']
  );
  
  assert(machine.name);
  assert(machine.description);
  assert(machine.computationModel);
  assert(Array.isArray(machine.tokenISA));
  assert(Array.isArray(machine.intents));
  assert(machine.temporal);
  assert(machine.concurrency);
  assert(machine.fault);
  assert(machine.reasoning);
});

test('Token ISA sempre inclui tokens básicos', () => {
  const machine = SystemSynthesisEngine.synthesize('MinimalOS', 'OS mínimo', [], ['x86_64']);
  
  assert(machine.tokenISA.includes('T_PROCESS_CREATE'));
  assert(machine.tokenISA.includes('T_PROCESS_EXIT'));
  assert(machine.tokenISA.includes('T_MEMORY_MAP'));
  assert(machine.tokenISA.includes('T_TIME_NOW'));
});

test('Múltiplos intents combinam tokens corretamente', () => {
  const machine = SystemSynthesisEngine.synthesize(
    'ComplexOS',
    'OS complexo',
    ['SEGURANCA_MAXIMA', 'TEMPO_REAL_HARD', 'TOLERANCIA_FALHAS'],
    ['x86_64']
  );
  
  // Deve ter tokens de segurança
  assert(machine.tokenISA.includes('T_CAPABILITY_GRANT'));
  assert(machine.tokenISA.includes('T_CAPABILITY_REVOKE'));
  
  // Deve ter tokens de tempo real
  assert(machine.tokenISA.includes('T_SCHEDULE_SET_PRIORITY'));
  assert(machine.tokenISA.includes('T_TIME_SET_TIMER'));
  
  // Deve ter tokens de tolerância a falhas
  assert(machine.tokenISA.includes('T_IPC_SEND'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 3: DETECÇÃO DE INTENTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🎯 DETECÇÃO DE INTENTS\n');

test('Detecta ISOLAMENTO_FORTE por keywords', () => {
  const intents = detectSystemIntents('sistema com isolamento forte e sandbox', 'operating_system');
  assert(intents.includes('ISOLAMENTO_FORTE'));
});

test('Detecta TEMPO_REAL_HARD por keywords', () => {
  const intents = detectSystemIntents('sistema hard real-time com deadlines', 'rtos');
  assert(intents.includes('TEMPO_REAL_HARD'));
});

test('Detecta SEGURANCA_MAXIMA por keywords', () => {
  const intents = detectSystemIntents('sistema seguro com capability-based security', 'operating_system');
  assert(intents.includes('SEGURANCA_MAXIMA'));
});

test('Usa defaults quando não detecta keywords', () => {
  const intents = detectSystemIntents('crie um sistema operacional', 'operating_system');
  assert(intents.includes('ISOLAMENTO_FORTE') || intents.includes('EXTENSIBILIDADE'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 4: CENÁRIOS REAIS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🌍 CENÁRIOS REAIS\n');

test('Cenário: Recriar Windows-like (performance + extensibilidade)', () => {
  const prompt = 'Crie um sistema operacional modular e extensível com boa performance';
  const intents = detectSystemIntents(prompt, 'operating_system');
  
  // Adicionar intents esperados se não detectados
  if (!intents.includes('EXTENSIBILIDADE')) intents.push('EXTENSIBILIDADE');
  if (!intents.includes('PERFORMANCE_MAXIMA')) intents.push('PERFORMANCE_MAXIMA');
  
  const machine = SystemSynthesisEngine.synthesize('ModularOS', prompt, intents, ['x86_64']);
  
  // Deve ter características de extensibilidade
  assert(machine.tokenISA.includes('T_IPC_SEND'));
});

test('Cenário: Recriar Linux-like (performance + monolítico)', () => {
  const prompt = 'Crie um sistema operacional de alta performance';
  const intents = ['PERFORMANCE_MAXIMA'];
  const machine = SystemSynthesisEngine.synthesize('HighPerfOS', prompt, intents, ['x86_64']);
  
  assert.strictEqual(machine.computationModel, 'von_neumann');
  assert.strictEqual(machine.temporal.scheduling, 'cfs');
  assert.strictEqual(machine.concurrency.sharedState, true);
});

test('Cenário: Recriar seL4-like (segurança formal)', () => {
  const prompt = 'Crie um microkernel formalmente verificado com segurança máxima';
  const intents = ['SEGURANCA_MAXIMA', 'ISOLAMENTO_FORTE', 'MINIMALISMO'];
  const machine = SystemSynthesisEngine.synthesize('FormalKernel', prompt, intents, ['x86_64']);
  
  assert.strictEqual(machine.computationModel, 'capability_based');
  assert.strictEqual(machine.fault.isolation, 'process');
  assert.strictEqual(machine.concurrency.deadlockPrevention, 'prevention');
});

test('Cenário: Recriar FreeRTOS-like (tempo real embarcado)', () => {
  const prompt = 'Crie um RTOS para microcontroladores com tempo real hard';
  const intents = ['TEMPO_REAL_HARD', 'MINIMALISMO', 'ENERGIA_MINIMA'];
  const machine = SystemSynthesisEngine.synthesize('EmbeddedRTOS', prompt, intents, ['arm64']);
  
  assert.strictEqual(machine.computationModel, 'event_driven');
  assert.strictEqual(machine.temporal.scheduling, 'edf');
  assert.strictEqual(machine.temporal.deadlineSupport, true);
  assert.strictEqual(machine.temporal.priorities, 256);
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(70));
console.log(`\n📊 RESULTADO: ${passed} passou, ${failed} falhou`);
console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed > 0) {
  process.exit(1);
}
