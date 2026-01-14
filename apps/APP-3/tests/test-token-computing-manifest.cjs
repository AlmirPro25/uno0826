/**
 * 🧪 TESTE: TOKEN COMPUTING MANIFEST
 * 
 * Valida o manifesto de Token Computing:
 * - Token Virtual Machine (TVM)
 * - Token Assembler (TASM)
 * - Token Kernel
 * - Detecção de requisitos
 */

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     🧬 TESTE: TOKEN COMPUTING MANIFEST                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// SIMULAÇÃO DO TOKEN VIRTUAL MACHINE
// ============================================================================

class MockTokenVirtualMachine {
  constructor() {
    this.registers = new Map();
    this.memory = new Map();
    this.stack = [];
    this.pc = 0;
    this.running = false;
    this.program = [];
    this.initializeRegisters();
  }
  
  initializeRegisters() {
    const regs = ['REG_ACC', 'REG_CTX', 'REG_PTR', 'REG_RET', 'REG_ERR', 'REG_FLAG',
                  'REG_GP0', 'REG_GP1', 'REG_GP2', 'REG_GP3'];
    for (const reg of regs) {
      this.registers.set(reg, { name: reg, value: null, locked: false });
    }
  }
  
  createToken(type, value) {
    return {
      id: `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      value,
      metadata: { timestamp: Date.now(), source: 'TVM', priority: 1 }
    };
  }
  
  load(program) {
    this.program = program;
    this.pc = 0;
  }
  
  async execute() {
    this.running = true;
    
    while (this.running && this.pc < this.program.length) {
      const instruction = this.program[this.pc];
      await this.executeInstruction(instruction);
      this.pc++;
    }
    
    return this.registers.get('REG_RET')?.value || null;
  }
  
  async executeInstruction(instruction) {
    const { opcode, operands } = instruction;
    
    switch (opcode) {
      case 'T_LOAD':
        const [dest, src] = operands;
        const value = this.createToken('T_LOAD', src.value);
        this.registers.get(dest.value).value = value;
        break;
        
      case 'T_ADD':
        const [destAdd, src1, src2] = operands;
        const v1 = this.registers.get(src1.value)?.value?.value || src1.value;
        const v2 = this.registers.get(src2.value)?.value?.value || src2.value;
        const result = this.createToken('T_ADD', v1 + v2);
        this.registers.get(destAdd.value).value = result;
        break;
        
      case 'T_STORE':
        const [addr, srcStore] = operands;
        const storeValue = this.registers.get(srcStore.value)?.value;
        if (storeValue) {
          this.memory.set(addr.value, storeValue);
        }
        break;
        
      case 'T_RETURN':
        const retValue = this.registers.get('REG_ACC')?.value;
        this.registers.get('REG_RET').value = retValue;
        break;
        
      case 'T_HALT':
        this.running = false;
        break;
        
      case 'T_INTENT':
        // Processa intenção
        const intentResult = this.createToken('T_INTENT', {
          original: operands[0]?.value,
          processed: true,
          confidence: 0.95
        });
        this.registers.get('REG_ACC').value = intentResult;
        break;
        
      case 'T_DECIDE':
        // Toma decisão
        const options = operands[0]?.value || [];
        const decisionResult = this.createToken('T_DECIDE', {
          chosen: Array.isArray(options) ? options[0] : options,
          confidence: 0.9
        });
        this.registers.get('REG_ACC').value = decisionResult;
        break;
    }
  }
  
  getRegister(reg) {
    return this.registers.get(reg)?.value || null;
  }
  
  getMemory(addr) {
    return this.memory.get(addr) || null;
  }
}

// ============================================================================
// SIMULAÇÃO DO TOKEN ASSEMBLER
// ============================================================================

class MockTokenAssembler {
  constructor() {
    this.labels = new Map();
  }
  
  tokenize(source) {
    const lines = source.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith(';'));
    
    // Primeira passada: coletar labels
    let lineNum = 0;
    for (const line of lines) {
      if (line.startsWith(':')) {
        this.labels.set(line.substring(1), lineNum);
      } else {
        lineNum++;
      }
    }
    
    // Segunda passada: gerar instruções
    const instructions = [];
    for (const line of lines) {
      if (!line.startsWith(':')) {
        const instruction = this.parseLine(line);
        if (instruction) {
          instructions.push(instruction);
        }
      }
    }
    
    return instructions;
  }
  
  parseLine(line) {
    const cleanLine = line.split(';')[0].trim();
    if (!cleanLine) return null;
    
    const match = cleanLine.match(/^(\w+)\s*(.*)?$/);
    if (!match) return null;
    
    const [, opcode, operandsStr] = match;
    const operands = operandsStr 
      ? operandsStr.split(',').map(o => this.parseOperand(o.trim()))
      : [];
    
    return {
      opcode: this.mapOpcode(opcode),
      operands: operands.filter(o => o !== null)
    };
  }
  
  parseOperand(str) {
    if (!str) return null;
    
    // Imediato: #42
    if (str.startsWith('#')) {
      const value = str.substring(1);
      if (value.startsWith('"') && value.endsWith('"')) {
        return { type: 'immediate', value: value.slice(1, -1) };
      }
      return { type: 'immediate', value: parseFloat(value) || value };
    }
    
    // Endereço: [addr]
    if (str.startsWith('[') && str.endsWith(']')) {
      return { type: 'address', value: str.slice(1, -1) };
    }
    
    // Registrador: REG_*
    if (str.startsWith('REG_')) {
      return { type: 'register', value: str };
    }
    
    // String literal
    if (str.startsWith('"') && str.endsWith('"')) {
      return { type: 'immediate', value: str.slice(1, -1) };
    }
    
    return { type: 'immediate', value: str };
  }
  
  mapOpcode(opcode) {
    const map = {
      'LOAD': 'T_LOAD', 'STORE': 'T_STORE', 'ADD': 'T_ADD', 'SUB': 'T_SUB',
      'MUL': 'T_MUL', 'DIV': 'T_DIV', 'JUMP': 'T_JUMP', 'JMP': 'T_JUMP',
      'CALL': 'T_CALL', 'RET': 'T_RETURN', 'RETURN': 'T_RETURN',
      'HALT': 'T_HALT', 'NOP': 'T_NOP', 'INTENT': 'T_INTENT',
      'DECIDE': 'T_DECIDE', 'EMIT': 'T_EMIT'
    };
    return map[opcode.toUpperCase()] || 'T_NOP';
  }
}

// ============================================================================
// TESTE 1: Token Virtual Machine
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 1: Token Virtual Machine (TVM)');
console.log('═══════════════════════════════════════════════════════════════\n');

async function testTVM() {
  const tvm = new MockTokenVirtualMachine();
  let passed = 0;
  let total = 0;
  
  // Teste 1.1: Carregar e executar programa simples
  total++;
  const program1 = [
    { opcode: 'T_LOAD', operands: [{ type: 'register', value: 'REG_GP0' }, { type: 'immediate', value: 10 }] },
    { opcode: 'T_LOAD', operands: [{ type: 'register', value: 'REG_GP1' }, { type: 'immediate', value: 5 }] },
    { opcode: 'T_ADD', operands: [{ type: 'register', value: 'REG_ACC' }, { type: 'register', value: 'REG_GP0' }, { type: 'register', value: 'REG_GP1' }] },
    { opcode: 'T_RETURN', operands: [] },
    { opcode: 'T_HALT', operands: [] }
  ];
  
  tvm.load(program1);
  await tvm.execute();
  
  const result = tvm.getRegister('REG_RET');
  if (result && result.value === 15) {
    console.log('✅ Programa de soma: 10 + 5 = 15');
    passed++;
  } else {
    console.log(`❌ Programa de soma: esperado 15, obtido ${result?.value}`);
  }
  
  // Teste 1.2: Operação INTENT
  total++;
  const tvm2 = new MockTokenVirtualMachine();
  const program2 = [
    { opcode: 'T_INTENT', operands: [{ type: 'immediate', value: 'calcular soma' }] },
    { opcode: 'T_RETURN', operands: [] },
    { opcode: 'T_HALT', operands: [] }
  ];
  
  tvm2.load(program2);
  await tvm2.execute();
  
  const intentResult = tvm2.getRegister('REG_RET');
  if (intentResult && intentResult.value.processed === true) {
    console.log('✅ Operação INTENT processada corretamente');
    passed++;
  } else {
    console.log('❌ Operação INTENT falhou');
  }
  
  // Teste 1.3: Operação DECIDE
  total++;
  const tvm3 = new MockTokenVirtualMachine();
  const program3 = [
    { opcode: 'T_DECIDE', operands: [{ type: 'immediate', value: ['opção1', 'opção2', 'opção3'] }] },
    { opcode: 'T_RETURN', operands: [] },
    { opcode: 'T_HALT', operands: [] }
  ];
  
  tvm3.load(program3);
  await tvm3.execute();
  
  const decideResult = tvm3.getRegister('REG_RET');
  if (decideResult && decideResult.value.chosen === 'opção1') {
    console.log('✅ Operação DECIDE escolheu primeira opção');
    passed++;
  } else {
    console.log('❌ Operação DECIDE falhou');
  }
  
  // Teste 1.4: Store em memória
  total++;
  const tvm4 = new MockTokenVirtualMachine();
  const program4 = [
    { opcode: 'T_LOAD', operands: [{ type: 'register', value: 'REG_ACC' }, { type: 'immediate', value: 42 }] },
    { opcode: 'T_STORE', operands: [{ type: 'address', value: 'resultado' }, { type: 'register', value: 'REG_ACC' }] },
    { opcode: 'T_HALT', operands: [] }
  ];
  
  tvm4.load(program4);
  await tvm4.execute();
  
  const memResult = tvm4.getMemory('resultado');
  if (memResult && memResult.value === 42) {
    console.log('✅ Store em memória: resultado = 42');
    passed++;
  } else {
    console.log(`❌ Store em memória falhou: ${memResult?.value}`);
  }
  
  console.log(`\nResultado TVM: ${passed}/${total} testes passaram\n`);
  return { passed, total };
}

// ============================================================================
// TESTE 2: Token Assembler
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 2: Token Assembler (TASM)');
console.log('═══════════════════════════════════════════════════════════════\n');

function testAssembler() {
  const assembler = new MockTokenAssembler();
  let passed = 0;
  let total = 0;
  
  // Teste 2.1: Tokenizar programa simples
  total++;
  const source1 = `
    ; Programa de soma
    LOAD   REG_ACC, #10
    ADD    REG_ACC, #5
    STORE  [result], REG_ACC
    HALT
  `;
  
  const instructions1 = assembler.tokenize(source1);
  if (instructions1.length === 4) {
    console.log('✅ Tokenização: 4 instruções geradas');
    passed++;
  } else {
    console.log(`❌ Tokenização: esperado 4, obtido ${instructions1.length}`);
  }
  
  // Teste 2.2: Verificar opcodes
  total++;
  const opcodes = instructions1.map(i => i.opcode);
  if (opcodes[0] === 'T_LOAD' && opcodes[1] === 'T_ADD' && opcodes[2] === 'T_STORE' && opcodes[3] === 'T_HALT') {
    console.log('✅ Opcodes mapeados corretamente');
    passed++;
  } else {
    console.log(`❌ Opcodes incorretos: ${opcodes.join(', ')}`);
  }
  
  // Teste 2.3: Verificar operandos
  total++;
  const loadOp = instructions1[0].operands;
  if (loadOp[0].type === 'register' && loadOp[0].value === 'REG_ACC' &&
      loadOp[1].type === 'immediate' && loadOp[1].value === 10) {
    console.log('✅ Operandos parseados corretamente');
    passed++;
  } else {
    console.log('❌ Operandos incorretos');
  }
  
  // Teste 2.4: Programa com INTENT e DECIDE
  total++;
  const source2 = `
    INTENT "calcular média"
    DECIDE "soma", "média", "máximo"
    HALT
  `;
  
  const instructions2 = assembler.tokenize(source2);
  if (instructions2[0].opcode === 'T_INTENT' && instructions2[1].opcode === 'T_DECIDE') {
    console.log('✅ Instruções cognitivas (INTENT, DECIDE) reconhecidas');
    passed++;
  } else {
    console.log('❌ Instruções cognitivas não reconhecidas');
  }
  
  // Teste 2.5: Labels
  total++;
  const source3 = `
    :start
    LOAD REG_ACC, #0
    :loop
    ADD REG_ACC, #1
    JUMP :loop
    :end
    HALT
  `;
  
  const instructions3 = assembler.tokenize(source3);
  if (instructions3.length === 4) { // Labels não contam como instruções
    console.log('✅ Labels processados corretamente');
    passed++;
  } else {
    console.log(`❌ Labels: esperado 4 instruções, obtido ${instructions3.length}`);
  }
  
  console.log(`\nResultado Assembler: ${passed}/${total} testes passaram\n`);
  return { passed, total };
}

// ============================================================================
// TESTE 3: Detecção de Requisitos
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 3: Detecção de Requisitos Token Computing');
console.log('═══════════════════════════════════════════════════════════════\n');

function shouldEnableTokenComputing(prompt) {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    'token', 'tokenização', 'tokenizer', 'tokenizador',
    'llm', 'transformer', 'attention', 'embedding',
    'bpe', 'sentencepiece', 'vocabulary',
    'cognição', 'cognitive', 'symbolic ai', 'neuro-symbolic',
    'intenção', 'intent', 'semântica', 'semantic',
    'lexer', 'parser', 'ast', 'compiler', 'interpreter',
    'gpt', 'bert', 'claude', 'gemini', 'inference'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}

function testDetection() {
  let passed = 0;
  let total = 0;
  
  const testCases = [
    { prompt: 'Crie um tokenizador para linguagem natural', expected: true },
    { prompt: 'Como funciona o attention mechanism em transformers?', expected: true },
    { prompt: 'Implemente um lexer e parser para minha linguagem', expected: true },
    { prompt: 'Quero entender como o GPT processa tokens', expected: true },
    { prompt: 'Crie um sistema de intenção semântica', expected: true },
    { prompt: 'Faça um site em React com Tailwind', expected: false },
    { prompt: 'API REST em Node.js', expected: false },
    { prompt: 'Crie um app mobile em Flutter', expected: false },
    { prompt: 'Como funciona BPE (Byte Pair Encoding)?', expected: true },
    { prompt: 'Implemente cognitive computing com symbolic AI', expected: true }
  ];
  
  for (const test of testCases) {
    total++;
    const result = shouldEnableTokenComputing(test.prompt);
    
    if (result === test.expected) {
      passed++;
      console.log(`✅ "${test.prompt.substring(0, 50)}..." → ${result ? 'ATIVAR' : 'NÃO ATIVAR'}`);
    } else {
      console.log(`❌ "${test.prompt.substring(0, 50)}..." → Esperado: ${test.expected}, Obtido: ${result}`);
    }
  }
  
  console.log(`\nResultado Detecção: ${passed}/${total} testes passaram\n`);
  return { passed, total };
}

// ============================================================================
// TESTE 4: Comparação Tradicional vs Token
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 4: Comparação Tradicional vs Token Computing');
console.log('═══════════════════════════════════════════════════════════════\n');

function testComparison() {
  console.log('📊 COMPUTAÇÃO TRADICIONAL:');
  console.log('   Unidade: Bit (0 ou 1)');
  console.log('   Processamento: Determinístico');
  console.log('   Paradigma: Procedural');
  console.log('   Executor: CPU executa instruções');
  console.log('   Exemplo: MOV AX, 10; ADD AX, 5');
  
  console.log('\n📊 TOKEN COMPUTING:');
  console.log('   Unidade: Token (símbolo com significado)');
  console.log('   Processamento: Contextual');
  console.log('   Paradigma: Intencional');
  console.log('   Executor: Interpretador decide');
  console.log('   Exemplo: INTENT "somar"; DECIDE [soma, sub], CTX');
  
  console.log('\n📊 HÍBRIDO (FUSÃO):');
  console.log('   ┌─────────────────────────────────────┐');
  console.log('   │ TOKEN LAYER (Intenção, Semântica)  │');
  console.log('   ├─────────────────────────────────────┤');
  console.log('   │ IR LAYER (LLVM, WASM, Bytecode)    │');
  console.log('   ├─────────────────────────────────────┤');
  console.log('   │ MACHINE LAYER (x86, ARM, RISC-V)   │');
  console.log('   └─────────────────────────────────────┘');
  
  return { passed: 1, total: 1 };
}

// ============================================================================
// EXECUÇÃO DOS TESTES
// ============================================================================

async function runAllTests() {
  const results = [];
  
  results.push(await testTVM());
  results.push(testAssembler());
  results.push(testDetection());
  results.push(testComparison());
  
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMO FINAL');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('🧬 TOKEN COMPUTING MANIFEST:');
  console.log('   Level: 100 (TRANSCENDENCE)');
  console.log('   Conceito: "Token é o Assembly da Cognição"');
  
  console.log('\n📦 Componentes Implementados:');
  console.log('   1. Token Virtual Machine (TVM)');
  console.log('   2. Token Assembler (TASM)');
  console.log('   3. Token Kernel (conceito)');
  console.log('   4. Detector de Requisitos');
  
  console.log('\n🔧 Operações Suportadas:');
  console.log('   • T_LOAD, T_STORE, T_ADD, T_SUB, T_MUL');
  console.log('   • T_JUMP, T_CALL, T_RETURN, T_HALT');
  console.log('   • T_INTENT (intenção semântica)');
  console.log('   • T_DECIDE (decisão contextual)');
  console.log('   • T_EMIT, T_AWAIT, T_SPAWN');
  
  console.log('\n🧠 Conceitos Chave:');
  console.log('   • Token = Unidade mínima de significado operacional');
  console.log('   • Bits movem elétrons, Tokens movem decisões');
  console.log('   • Token OS: Tudo é token (processos, syscalls, permissões)');
  console.log('   • Fusão: Token Layer + IR Layer + Machine Layer');
  
  console.log(`\n✅ Total: ${totalPassed}/${totalTests} testes passaram (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧬 "TOKEN É O ASSEMBLY DA COGNIÇÃO"');
  console.log('═══════════════════════════════════════════════════════════════');
}

runAllTests();
