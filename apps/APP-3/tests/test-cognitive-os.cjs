/**
 * 🧪 Teste do AGI Cognitive OS
 * 
 * Testa o sistema operacional cognitivo completo
 * 
 * Executar com: npx tsx tests/test-cognitive-os.cjs
 */

// Import dinâmico para TypeScript
let CognitiveKernel, CognitiveOS;

async function loadModules() {
  const module = await import('../services/manifestos/AGI_COGNITIVE_OS_MANIFEST.ts');
  CognitiveKernel = module.CognitiveKernel;
  CognitiveOS = module.CognitiveOS;
}

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function success(msg) { log(colors.green, '✅', msg); }
function error(msg) { log(colors.red, '❌', msg); }
function section(msg) { log(colors.yellow, '\n📦', msg); }

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    success(name);
    passed++;
  } catch (e) {
    error(`${name}: ${e.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    success(name);
    passed++;
  } catch (e) {
    error(`${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ============================================================
// TESTES
// ============================================================

async function runTests() {
  console.log(colors.blue);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           🖥️ AGI COGNITIVE OS - TESTES                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // ============================================================
  section('KERNEL BÁSICO');
  // ============================================================

  const kernel = new CognitiveKernel();

  test('Kernel criado com sucesso', () => {
    assert(kernel !== null, 'Kernel é null');
  });

  await testAsync('Kernel boot', async () => {
    await kernel.boot();
    const info = kernel.getSystemInfo();
    assert(info.uptime >= 0, 'Uptime inválido');
    assert(info.processes >= 2, 'Deveria ter pelo menos 2 processos (idle + init)');
  });

  test('Listar processos', () => {
    const processes = kernel.listProcesses();
    assert(processes.length >= 2, 'Deveria ter pelo menos 2 processos');
    
    const init = processes.find(p => p.name === 'init');
    assert(init !== undefined, 'Processo init não encontrado');
    assert(init.pid === 1, 'Init deveria ter PID 1');
  });

  // ============================================================
  section('GERENCIAMENTO DE PROCESSOS');
  // ============================================================

  test('Criar processo', () => {
    const proc = kernel.createProcess(
      'test_process',
      'normal',
      1,
      new Set(['read', 'write'])
    );
    
    assert(proc.pid > 1, 'PID deveria ser > 1');
    assert(proc.name === 'test_process', 'Nome incorreto');
    assert(proc.state === 'ready', 'Estado deveria ser ready');
  });

  test('Obter processo por PID', () => {
    const proc = kernel.getProcess(1);
    assert(proc !== undefined, 'Processo init não encontrado');
    assert(proc.name === 'init', 'Nome incorreto');
  });

  test('Terminar processo', () => {
    const proc = kernel.createProcess('to_kill', 'low', 1, new Set(['read']));
    const pid = proc.pid;
    
    const result = kernel.terminateProcess(pid);
    assert(result === true, 'Terminação falhou');
    
    const terminated = kernel.getProcess(pid);
    assert(terminated === undefined, 'Processo ainda existe');
  });

  test('Não pode terminar processo kernel', () => {
    try {
      kernel.terminateProcess(0);
      throw new Error('Deveria ter lançado erro');
    } catch (e) {
      assert(e.message.includes('EPERM'), 'Erro incorreto');
    }
  });

  // ============================================================
  section('GERENCIAMENTO DE MEMÓRIA');
  // ============================================================

  test('Alocar memória', () => {
    const memBlock = kernel.allocateMemory('test_block', 'user', 64, 1);
    assert(memBlock.id === 'test_block', 'ID incorreto');
    assert(memBlock.size === 64, 'Tamanho incorreto');
    assert(memBlock.zone === 'user', 'Zona incorreta');
  });

  test('Estatísticas de memória', () => {
    const stats = kernel.getMemoryStats();
    assert(stats.total > 0, 'Total inválido');
    assert(stats.used > 0, 'Used inválido');
    assert(stats.free >= 0, 'Free inválido');
    assert(stats.total === stats.used + stats.free, 'Soma incorreta');
  });

  test('Liberar memória', () => {
    const block = kernel.allocateMemory('to_free', 'user', 32, 1);
    const statsBefore = kernel.getMemoryStats();
    
    const result = kernel.freeMemory('to_free');
    assert(result === true, 'Liberação falhou');
    
    const statsAfter = kernel.getMemoryStats();
    assert(statsAfter.used < statsBefore.used, 'Memória não foi liberada');
  });

  // ============================================================
  section('SYSTEM CALLS');
  // ============================================================

  await testAsync('Syscall getpid', async () => {
    const pid = await kernel.syscall('getpid');
    assert(typeof pid === 'number', 'PID deveria ser número');
  });

  await testAsync('Syscall uptime', async () => {
    const uptime = await kernel.syscall('uptime');
    assert(uptime > 0, 'Uptime deveria ser > 0');
  });

  await testAsync('Syscall fork', async () => {
    const childPid = await kernel.syscall('fork');
    assert(childPid > 1, 'Child PID deveria ser > 1');
    
    const child = kernel.getProcess(childPid);
    assert(child !== undefined, 'Processo filho não encontrado');
  });

  await testAsync('Syscall malloc/free', async () => {
    const blockId = await kernel.syscall('malloc', [128]);
    assert(typeof blockId === 'string', 'Block ID deveria ser string');
    
    const result = await kernel.syscall('free', [blockId]);
    assert(result === 0, 'Free deveria retornar 0');
  });

  await testAsync('Syscall desconhecida lança erro', async () => {
    try {
      await kernel.syscall('unknown_syscall');
      throw new Error('Deveria ter lançado erro');
    } catch (e) {
      assert(e.message.includes('ENOSYS'), 'Erro incorreto');
    }
  });

  // ============================================================
  section('SCHEDULER');
  // ============================================================

  test('Schedule seleciona processo', () => {
    const next = kernel.schedule();
    assert(next !== null, 'Schedule retornou null');
  });

  test('Tick do scheduler', () => {
    // Não deve lançar erro
    kernel.tick();
    kernel.tick();
    kernel.tick();
  });

  // ============================================================
  section('IPC - INTER-PROCESS COMMUNICATION');
  // ============================================================

  await testAsync('Enviar e receber mensagem', async () => {
    const proc1 = kernel.createProcess('sender', 'normal', 1, new Set(['read', 'write']));
    const proc2 = kernel.createProcess('receiver', 'normal', 1, new Set(['read', 'write']));
    
    // Envia mensagem
    kernel.sendMessage(proc1.pid, proc2.pid, 'message', { data: 'hello' });
    
    // Processa mensagens
    kernel.tick();
  });

  // ============================================================
  section('COGNITIVE OS COMPLETO');
  // ============================================================

  const os = new CognitiveOS();

  await testAsync('Boot do Cognitive OS', async () => {
    await os.boot();
    const status = os.getStatus();
    assert(status.booted === true, 'OS não está booted');
  });

  await testAsync('Processar input', async () => {
    const result = await os.process('Olá, como você está?');
    
    assert(result.perception !== undefined, 'Perception ausente');
    assert(result.reasoning !== undefined, 'Reasoning ausente');
    assert(result.action !== undefined, 'Action ausente');
    
    assert(result.perception.salience >= 0, 'Salience inválida');
    assert(result.perception.features instanceof Map, 'Features deveria ser Map');
  });

  test('Status do OS', () => {
    const status = os.getStatus();
    
    assert(status.booted === true, 'Deveria estar booted');
    assert(status.kernel.processes > 0, 'Deveria ter processos');
    assert(status.memory.episodic >= 0, 'Memória episódica inválida');
  });

  // ============================================================
  section('DAEMONS INDIVIDUAIS');
  // ============================================================

  test('Memory Daemon - store e recall', () => {
    os.memory.storeEpisodic('test_ep', {
      content: 'Teste de memória episódica',
      timestamp: Date.now(),
      context: {},
      emotionalValence: 0.5
    });
    
    os.memory.storeSemantic('teste', { definition: 'Uma verificação' });
    os.memory.storeProcedural('testar', { steps: ['preparar', 'executar', 'verificar'] });
    
    const recalled = os.memory.recall('teste');
    assert(recalled.episodic.length > 0 || recalled.semantic.length > 0, 'Recall falhou');
  });

  test('Reasoning Daemon - dedução', () => {
    const premises = ['Sócrates é homem', 'Todos os homens são mortais'];
    const rules = [
      { if: 'Sócrates é homem', then: 'Sócrates é mortal' }
    ];
    
    const conclusions = os.reasoning.deduce(premises, rules);
    assert(conclusions.includes('Sócrates é mortal'), 'Dedução falhou');
  });

  test('Reasoning Daemon - memória de trabalho', () => {
    os.reasoning.clearWorkingMemory();
    
    os.reasoning.addToWorkingMemory({ item: 1 });
    os.reasoning.addToWorkingMemory({ item: 2 });
    os.reasoning.addToWorkingMemory({ item: 3 });
    
    const wm = os.reasoning.getWorkingMemory();
    assert(wm.length === 3, 'Working memory deveria ter 3 itens');
  });

  test('Action Daemon - enfileirar e executar', async () => {
    const actionId = os.action.queueAction('respond', { content: 'test' }, 5);
    assert(typeof actionId === 'string', 'Action ID deveria ser string');
    
    const status = os.action.getQueueStatus();
    assert(status.pending >= 0, 'Pending inválido');
  });

  // ============================================================
  section('SHUTDOWN');
  // ============================================================

  await testAsync('Shutdown do Cognitive OS', async () => {
    await os.shutdown();
    const status = os.getStatus();
    assert(status.booted === false, 'OS ainda está booted');
  });

  await testAsync('Shutdown do Kernel', async () => {
    await kernel.shutdown();
  });

  // ============================================================
  // RESULTADO FINAL
  // ============================================================

  console.log('\n' + colors.blue);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    RESULTADO FINAL                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  console.log(`\n  ${colors.green}✅ Passou: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}❌ Falhou: ${failed}${colors.reset}`);
  console.log(`  📊 Total: ${passed + failed}\n`);

  if (failed === 0) {
    console.log(colors.green + '  🎉 TODOS OS TESTES PASSARAM!' + colors.reset);
  } else {
    console.log(colors.red + '  ⚠️ ALGUNS TESTES FALHARAM' + colors.reset);
  }

  console.log('\n');
  process.exit(failed > 0 ? 1 : 0);
}

// Executa os testes
async function main() {
  await loadModules();
  awacess.exit(1);
});
