/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🧬 TOKEN COMPUTING MANIFEST - O ASSEMBLY DA COGNIÇÃO 🧬                 ║
 * ║                                                                              ║
 * ║     "BITS MOVEM ELÉTRONS. TOKENS MOVEM DECISÕES.                            ║
 * ║      TOKEN É A UNIDADE MÍNIMA DE SIGNIFICADO OPERACIONAL."                  ║
 * ║                                                                              ║
 * ║     NÍVEL: 100 (TRANSCENDENCE - BEYOND BINARY)                              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este manifesto define a arquitetura de computação baseada em Tokens,
 * onde a unidade fundamental não é o bit, mas o símbolo com significado.
 * 
 * HIERARQUIA DA COMPUTAÇÃO:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TOKEN LAYER (Intenção, Contexto, Semântica)                   │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  IR LAYER (Intermediate Representation)                         │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  BYTECODE / ASSEMBLY                                            │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  MACHINE CODE (Binary)                                          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  HARDWARE (Transistors, Gates)                                  │
 * └─────────────────────────────────────────────────────────────────┘
 */

// ============================================================================
// TIPOS FUNDAMENTAIS
// ============================================================================

/**
 * Token: Unidade mínima de significado operacional
 * Não é dado bruto - é dado JÁ INTERPRETÁVEL
 */
export interface Token {
  id: string;
  type: TokenType;
  value: unknown;
  metadata: TokenMetadata;
  context?: TokenContext;
}

export type TokenType = 
  // Tokens de Controle
  | 'T_LOAD'      // Carregar valor
  | 'T_STORE'     // Armazenar valor
  | 'T_MOVE'      // Mover entre registradores
  | 'T_JUMP'      // Salto condicional/incondicional
  | 'T_CALL'      // Chamada de função
  | 'T_RETURN'    // Retorno
  | 'T_HALT'      // Parar execução
  
  // Tokens Aritméticos
  | 'T_ADD'       // Soma
  | 'T_SUB'       // Subtração
  | 'T_MUL'       // Multiplicação
  | 'T_DIV'       // Divisão
  | 'T_MOD'       // Módulo
  
  // Tokens Lógicos
  | 'T_AND'       // E lógico
  | 'T_OR'        // OU lógico
  | 'T_NOT'       // Negação
  | 'T_XOR'       // OU exclusivo
  
  // Tokens de Comparação
  | 'T_EQ'        // Igual
  | 'T_NEQ'       // Diferente
  | 'T_GT'        // Maior que
  | 'T_LT'        // Menor que
  | 'T_GTE'       // Maior ou igual
  | 'T_LTE'       // Menor ou igual
  
  // Tokens de Intenção (Alto Nível)
  | 'T_INTENT'    // Intenção semântica
  | 'T_QUERY'     // Consulta
  | 'T_MUTATE'    // Mutação de estado
  | 'T_OBSERVE'   // Observação
  | 'T_DECIDE'    // Decisão
  | 'T_LEARN'     // Aprendizado
  
  // Tokens de Contexto
  | 'T_CTX_USER'  // Contexto de usuário
  | 'T_CTX_SYS'   // Contexto de sistema
  | 'T_CTX_ENV'   // Contexto de ambiente
  | 'T_CTX_TIME'  // Contexto temporal
  
  // Tokens de Recurso
  | 'T_RES_MEM'   // Recurso de memória
  | 'T_RES_CPU'   // Recurso de CPU
  | 'T_RES_IO'    // Recurso de I/O
  | 'T_RES_NET'   // Recurso de rede
  
  // Tokens de Permissão (Capability-based)
  | 'T_CAP_READ'  // Capacidade de leitura
  | 'T_CAP_WRITE' // Capacidade de escrita
  | 'T_CAP_EXEC'  // Capacidade de execução
  | 'T_CAP_ADMIN' // Capacidade administrativa
  
  // Tokens Especiais
  | 'T_NOP'       // No operation
  | 'T_SYNC'      // Sincronização
  | 'T_ASYNC'     // Assíncrono
  | 'T_EMIT'      // Emitir evento
  | 'T_AWAIT'     // Aguardar
  | 'T_SPAWN'     // Criar processo/thread
  | 'T_KILL';     // Terminar processo

export interface TokenMetadata {
  timestamp: number;
  source: string;
  priority: number;
  ttl?: number;           // Time to live
  signature?: string;     // Assinatura criptográfica
  lineage?: string[];     // Histórico de transformações
}

export interface TokenContext {
  scope: 'global' | 'local' | 'isolated';
  permissions: TokenPermission[];
  environment: Record<string, unknown>;
  parent?: string;        // Token pai
  children?: string[];    // Tokens filhos
}

export type TokenPermission = 'read' | 'write' | 'execute' | 'delegate';

// ============================================================================
// REGISTRADORES VIRTUAIS (TOKEN REGISTERS)
// ============================================================================

export interface TokenRegister {
  name: string;
  type: RegisterType;
  value: Token | null;
  locked: boolean;
}

export type RegisterType = 
  | 'REG_ACC'     // Acumulador
  | 'REG_CTX'     // Contexto atual
  | 'REG_PTR'     // Ponteiro
  | 'REG_RET'     // Retorno
  | 'REG_ERR'     // Erro
  | 'REG_FLAG'    // Flags
  | 'REG_GP0'     // General Purpose 0-7
  | 'REG_GP1'
  | 'REG_GP2'
  | 'REG_GP3'
  | 'REG_GP4'
  | 'REG_GP5'
  | 'REG_GP6'
  | 'REG_GP7';

// ============================================================================
// TOKEN INSTRUCTION SET ARCHITECTURE (TISA)
// ============================================================================

/**
 * TISA - Token Instruction Set Architecture
 * O "Assembly" do mundo dos Tokens
 */
export interface TokenInstruction {
  opcode: TokenType;
  operands: TokenOperand[];
  flags?: InstructionFlags;
}

export interface TokenOperand {
  type: 'register' | 'immediate' | 'address' | 'token' | 'label';
  value: string | number | Token;
}

export interface InstructionFlags {
  conditional?: boolean;
  async?: boolean;
  privileged?: boolean;
  atomic?: boolean;
}

// ============================================================================
// TOKEN VIRTUAL MACHINE (TVM)
// ============================================================================

export class TokenVirtualMachine {
  private registers: Map<RegisterType, TokenRegister> = new Map();
  private memory: Map<string, Token> = new Map();
  private stack: Token[] = [];
  private callStack: string[] = [];
  private pc: number = 0; // Program Counter
  private running: boolean = false;
  private program: TokenInstruction[] = [];
  
  constructor() {
    this.initializeRegisters();
  }
  
  private initializeRegisters(): void {
    const registerTypes: RegisterType[] = [
      'REG_ACC', 'REG_CTX', 'REG_PTR', 'REG_RET', 'REG_ERR', 'REG_FLAG',
      'REG_GP0', 'REG_GP1', 'REG_GP2', 'REG_GP3', 'REG_GP4', 'REG_GP5', 'REG_GP6', 'REG_GP7'
    ];
    
    for (const type of registerTypes) {
      this.registers.set(type, {
        name: type,
        type,
        value: null,
        locked: false
      });
    }
  }
  
  /**
   * Carrega programa na TVM
   */
  load(program: TokenInstruction[]): void {
    this.program = program;
    this.pc = 0;
  }
  
  /**
   * Executa o programa carregado
   */
  async execute(): Promise<Token | null> {
    this.running = true;
    
    while (this.running && this.pc < this.program.length) {
      const instruction = this.program[this.pc];
      await this.executeInstruction(instruction);
      this.pc++;
    }
    
    return this.registers.get('REG_RET')?.value || null;
  }
  
  /**
   * Executa uma única instrução
   */
  private async executeInstruction(instruction: TokenInstruction): Promise<void> {
    const { opcode, operands, flags } = instruction;
    
    switch (opcode) {
      case 'T_LOAD':
        await this.opLoad(operands);
        break;
      case 'T_STORE':
        await this.opStore(operands);
        break;
      case 'T_ADD':
        await this.opAdd(operands);
        break;
      case 'T_SUB':
        await this.opSub(operands);
        break;
      case 'T_MUL':
        await this.opMul(operands);
        break;
      case 'T_JUMP':
        await this.opJump(operands, flags);
        break;
      case 'T_CALL':
        await this.opCall(operands);
        break;
      case 'T_RETURN':
        await this.opReturn();
        break;
      case 'T_HALT':
        this.running = false;
        break;
      case 'T_INTENT':
        await this.opIntent(operands);
        break;
      case 'T_DECIDE':
        await this.opDecide(operands);
        break;
      case 'T_EMIT':
        await this.opEmit(operands);
        break;
      default:
        console.warn(`Unknown opcode: ${opcode}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OPERAÇÕES BÁSICAS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private async opLoad(operands: TokenOperand[]): Promise<void> {
    const [dest, src] = operands;
    const value = this.resolveOperand(src);
    this.setRegister(dest.value as RegisterType, value);
  }
  
  private async opStore(operands: TokenOperand[]): Promise<void> {
    const [addr, src] = operands;
    const value = this.resolveOperand(src);
    if (value) {
      this.memory.set(addr.value as string, value);
    }
  }
  
  private async opAdd(operands: TokenOperand[]): Promise<void> {
    const [dest, src1, src2] = operands;
    const v1 = this.resolveOperand(src1);
    const v2 = this.resolveOperand(src2);
    
    if (v1 && v2 && typeof v1.value === 'number' && typeof v2.value === 'number') {
      const result = this.createToken('T_ADD', v1.value + v2.value);
      this.setRegister(dest.value as RegisterType, result);
    }
  }
  
  private async opSub(operands: TokenOperand[]): Promise<void> {
    const [dest, src1, src2] = operands;
    const v1 = this.resolveOperand(src1);
    const v2 = this.resolveOperand(src2);
    
    if (v1 && v2 && typeof v1.value === 'number' && typeof v2.value === 'number') {
      const result = this.createToken('T_SUB', v1.value - v2.value);
      this.setRegister(dest.value as RegisterType, result);
    }
  }
  
  private async opMul(operands: TokenOperand[]): Promise<void> {
    const [dest, src1, src2] = operands;
    const v1 = this.resolveOperand(src1);
    const v2 = this.resolveOperand(src2);
    
    if (v1 && v2 && typeof v1.value === 'number' && typeof v2.value === 'number') {
      const result = this.createToken('T_MUL', v1.value * v2.value);
      this.setRegister(dest.value as RegisterType, result);
    }
  }
  
  private async opJump(operands: TokenOperand[], flags?: InstructionFlags): Promise<void> {
    const [target, condition] = operands;
    
    if (flags?.conditional && condition) {
      const cond = this.resolveOperand(condition);
      if (!cond || !cond.value) return;
    }
    
    this.pc = (target.value as number) - 1; // -1 porque pc++ acontece depois
  }
  
  private async opCall(operands: TokenOperand[]): Promise<void> {
    const [target] = operands;
    this.callStack.push(String(this.pc + 1));
    this.pc = (target.value as number) - 1;
  }
  
  private async opReturn(): Promise<void> {
    const returnAddr = this.callStack.pop();
    if (returnAddr) {
      this.pc = parseInt(returnAddr) - 1;
    } else {
      this.running = false;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OPERAÇÕES DE ALTO NÍVEL (COGNITIVAS)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * T_INTENT: Processa intenção semântica
   * Esta é a operação que diferencia Token Computing de computação tradicional
   */
  private async opIntent(operands: TokenOperand[]): Promise<void> {
    const [intentToken] = operands;
    const intent = this.resolveOperand(intentToken);
    
    if (intent) {
      // Aqui entraria a lógica de processamento de intenção
      // Em um sistema real, isso poderia chamar um LLM ou sistema de regras
      const result = this.createToken('T_INTENT', {
        original: intent.value,
        processed: true,
        confidence: 0.95
      });
      this.setRegister('REG_ACC', result);
    }
  }
  
  /**
   * T_DECIDE: Toma decisão baseada em contexto
   */
  private async opDecide(operands: TokenOperand[]): Promise<void> {
    const [options, context] = operands;
    const opts = this.resolveOperand(options);
    const ctx = this.resolveOperand(context);
    
    if (opts && Array.isArray(opts.value)) {
      // Decisão baseada em contexto
      const decision = this.createToken('T_DECIDE', {
        chosen: opts.value[0], // Simplificado
        alternatives: opts.value.slice(1),
        context: ctx?.value
      });
      this.setRegister('REG_ACC', decision);
    }
  }
  
  /**
   * T_EMIT: Emite evento/token para o sistema
   */
  private async opEmit(operands: TokenOperand[]): Promise<void> {
    const [eventToken] = operands;
    const event = this.resolveOperand(eventToken);
    
    if (event) {
      // Em um sistema real, isso emitiria para um event bus
      console.log(`[TVM] Emitting: ${JSON.stringify(event.value)}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private resolveOperand(operand: TokenOperand): Token | null {
    switch (operand.type) {
      case 'register':
        return this.registers.get(operand.value as RegisterType)?.value || null;
      case 'immediate':
        return this.createToken('T_LOAD', operand.value);
      case 'address':
        return this.memory.get(operand.value as string) || null;
      case 'token':
        return operand.value as Token;
      default:
        return null;
    }
  }
  
  private setRegister(reg: RegisterType, value: Token | null): void {
    const register = this.registers.get(reg);
    if (register && !register.locked) {
      register.value = value;
    }
  }
  
  private createToken(type: TokenType, value: unknown): Token {
    return {
      id: `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      value,
      metadata: {
        timestamp: Date.now(),
        source: 'TVM',
        priority: 1
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════
  
  getRegister(reg: RegisterType): Token | null {
    return this.registers.get(reg)?.value || null;
  }
  
  getMemory(addr: string): Token | null {
    return this.memory.get(addr) || null;
  }
  
  getStack(): Token[] {
    return [...this.stack];
  }
  
  reset(): void {
    this.initializeRegisters();
    this.memory.clear();
    this.stack = [];
    this.callStack = [];
    this.pc = 0;
    this.running = false;
    this.program = [];
  }
}


// ============================================================================
// TOKENIZER (COMO ASSEMBLY, MAS PARA TOKENS)
// ============================================================================

/**
 * TokenAssembler: Converte código Token Assembly (TASM) em instruções
 * 
 * Sintaxe TASM:
 *   LOAD   REG_ACC, #42          ; Carrega imediato
 *   LOAD   REG_GP0, [addr]       ; Carrega de memória
 *   ADD    REG_ACC, REG_GP0      ; Soma
 *   STORE  [result], REG_ACC     ; Armazena
 *   INTENT "calcular soma"       ; Intenção semântica
 *   DECIDE [opções], CTX         ; Decisão contextual
 *   JUMP   :loop                 ; Salto
 *   HALT                         ; Para
 */
export class TokenAssembler {
  private labels: Map<string, number> = new Map();
  private instructions: TokenInstruction[] = [];
  
  /**
   * Tokeniza código fonte TASM
   */
  tokenize(source: string): TokenInstruction[] {
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
    this.instructions = [];
    for (const line of lines) {
      if (!line.startsWith(':')) {
        const instruction = this.parseLine(line);
        if (instruction) {
          this.instructions.push(instruction);
        }
      }
    }
    
    return this.instructions;
  }
  
  private parseLine(line: string): TokenInstruction | null {
    // Remove comentários inline
    const cleanLine = line.split(';')[0].trim();
    if (!cleanLine) return null;
    
    // Parse: OPCODE operand1, operand2, ...
    const match = cleanLine.match(/^(\w+)\s*(.*)?$/);
    if (!match) return null;
    
    const [, opcode, operandsStr] = match;
    const operands = operandsStr 
      ? operandsStr.split(',').map(o => this.parseOperand(o.trim()))
      : [];
    
    return {
      opcode: this.mapOpcode(opcode),
      operands: operands.filter(o => o !== null) as TokenOperand[]
    };
  }
  
  private parseOperand(str: string): TokenOperand | null {
    if (!str) return null;
    
    // Imediato: #42 ou #"string"
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
    
    // Label: :label
    if (str.startsWith(':')) {
      const label = str.substring(1);
      const addr = this.labels.get(label);
      return { type: 'label', value: addr ?? label };
    }
    
    // Registrador: REG_*
    if (str.startsWith('REG_')) {
      return { type: 'register', value: str as RegisterType };
    }
    
    // String literal
    if (str.startsWith('"') && str.endsWith('"')) {
      return { type: 'immediate', value: str.slice(1, -1) };
    }
    
    // Número
    if (!isNaN(parseFloat(str))) {
      return { type: 'immediate', value: parseFloat(str) };
    }
    
    // Identificador genérico
    return { type: 'immediate', value: str };
  }
  
  private mapOpcode(opcode: string): TokenType {
    const opcodeMap: Record<string, TokenType> = {
      'LOAD': 'T_LOAD',
      'STORE': 'T_STORE',
      'MOVE': 'T_MOVE',
      'ADD': 'T_ADD',
      'SUB': 'T_SUB',
      'MUL': 'T_MUL',
      'DIV': 'T_DIV',
      'MOD': 'T_MOD',
      'AND': 'T_AND',
      'OR': 'T_OR',
      'NOT': 'T_NOT',
      'XOR': 'T_XOR',
      'EQ': 'T_EQ',
      'NEQ': 'T_NEQ',
      'GT': 'T_GT',
      'LT': 'T_LT',
      'GTE': 'T_GTE',
      'LTE': 'T_LTE',
      'JUMP': 'T_JUMP',
      'JMP': 'T_JUMP',
      'CALL': 'T_CALL',
      'RET': 'T_RETURN',
      'RETURN': 'T_RETURN',
      'HALT': 'T_HALT',
      'NOP': 'T_NOP',
      'INTENT': 'T_INTENT',
      'QUERY': 'T_QUERY',
      'MUTATE': 'T_MUTATE',
      'OBSERVE': 'T_OBSERVE',
      'DECIDE': 'T_DECIDE',
      'LEARN': 'T_LEARN',
      'EMIT': 'T_EMIT',
      'AWAIT': 'T_AWAIT',
      'SPAWN': 'T_SPAWN',
      'KILL': 'T_KILL',
      'SYNC': 'T_SYNC',
      'ASYNC': 'T_ASYNC'
    };
    
    return opcodeMap[opcode.toUpperCase()] || 'T_NOP';
  }
}


// ============================================================================
// TOKEN OPERATING SYSTEM (TOS) - CONCEITO
// ============================================================================

/**
 * TokenOS: Sistema Operacional baseado em Tokens
 * 
 * Tudo é Token:
 * - Processos são Tokens
 * - Threads são Tokens de Contexto
 * - Syscalls são Tokens de Requisição
 * - Arquivos são Tokens de Recurso
 * - Permissões são Tokens de Capacidade
 */
export interface TokenProcess {
  pid: string;
  token: Token;
  state: ProcessState;
  context: TokenContext;
  capabilities: TokenCapability[];
  children: string[];
  parent?: string;
}

export type ProcessState = 
  | 'READY'
  | 'RUNNING'
  | 'BLOCKED'
  | 'SUSPENDED'
  | 'TERMINATED';

export interface TokenCapability {
  type: 'read' | 'write' | 'execute' | 'create' | 'delete' | 'admin';
  resource: string;
  constraints?: Record<string, unknown>;
  expiry?: number;
}

export interface TokenSyscall {
  type: SyscallType;
  args: Token[];
  caller: string;
  timestamp: number;
}

export type SyscallType =
  | 'SYS_SPAWN'     // Criar processo
  | 'SYS_KILL'      // Terminar processo
  | 'SYS_WAIT'      // Aguardar processo
  | 'SYS_READ'      // Ler recurso
  | 'SYS_WRITE'     // Escrever recurso
  | 'SYS_OPEN'      // Abrir recurso
  | 'SYS_CLOSE'     // Fechar recurso
  | 'SYS_GRANT'     // Conceder capacidade
  | 'SYS_REVOKE'    // Revogar capacidade
  | 'SYS_QUERY'     // Consultar sistema
  | 'SYS_INTENT'    // Expressar intenção
  | 'SYS_DECIDE';   // Solicitar decisão

/**
 * TokenKernel: O núcleo do TokenOS
 */
export class TokenKernel {
  private processes: Map<string, TokenProcess> = new Map();
  private scheduler: TokenScheduler;
  private memoryManager: TokenMemoryManager;
  private eventBus: TokenEventBus;
  private tvm: TokenVirtualMachine;
  
  constructor() {
    this.scheduler = new TokenScheduler();
    this.memoryManager = new TokenMemoryManager();
    this.eventBus = new TokenEventBus();
    this.tvm = new TokenVirtualMachine();
  }
  
  /**
   * Processa uma syscall
   */
  async syscall(call: TokenSyscall): Promise<Token> {
    switch (call.type) {
      case 'SYS_SPAWN':
        return this.sysSpawn(call);
      case 'SYS_KILL':
        return this.sysKill(call);
      case 'SYS_INTENT':
        return this.sysIntent(call);
      case 'SYS_DECIDE':
        return this.sysDecide(call);
      default:
        return this.createResultToken('error', `Unknown syscall: ${call.type}`);
    }
  }
  
  private async sysSpawn(call: TokenSyscall): Promise<Token> {
    const [programToken] = call.args;
    const pid = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const process: TokenProcess = {
      pid,
      token: programToken,
      state: 'READY',
      context: {
        scope: 'local',
        permissions: ['read', 'execute'],
        environment: {}
      },
      capabilities: [],
      children: [],
      parent: call.caller
    };
    
    this.processes.set(pid, process);
    this.scheduler.enqueue(pid);
    
    return this.createResultToken('success', { pid });
  }
  
  private async sysKill(call: TokenSyscall): Promise<Token> {
    const [pidToken] = call.args;
    const pid = pidToken.value as string;
    
    const process = this.processes.get(pid);
    if (process) {
      process.state = 'TERMINATED';
      this.scheduler.remove(pid);
      return this.createResultToken('success', { pid, terminated: true });
    }
    
    return this.createResultToken('error', `Process not found: ${pid}`);
  }
  
  private async sysIntent(call: TokenSyscall): Promise<Token> {
    const [intentToken] = call.args;
    
    // Processa intenção através da TVM
    const program: TokenInstruction[] = [
      { opcode: 'T_INTENT', operands: [{ type: 'token', value: intentToken }] },
      { opcode: 'T_RETURN', operands: [] }
    ];
    
    this.tvm.load(program);
    const result = await this.tvm.execute();
    
    return result || this.createResultToken('error', 'Intent processing failed');
  }
  
  private async sysDecide(call: TokenSyscall): Promise<Token> {
    const [optionsToken, contextToken] = call.args;
    
    const program: TokenInstruction[] = [
      { 
        opcode: 'T_DECIDE', 
        operands: [
          { type: 'token', value: optionsToken },
          { type: 'token', value: contextToken }
        ] 
      },
      { opcode: 'T_RETURN', operands: [] }
    ];
    
    this.tvm.load(program);
    const result = await this.tvm.execute();
    
    return result || this.createResultToken('error', 'Decision failed');
  }
  
  private createResultToken(status: string, data: unknown): Token {
    return {
      id: `res_${Date.now()}`,
      type: 'T_RETURN',
      value: { status, data },
      metadata: {
        timestamp: Date.now(),
        source: 'TokenKernel',
        priority: 1
      }
    };
  }
  
  /**
   * Loop principal do kernel
   */
  async run(): Promise<void> {
    while (true) {
      const pid = this.scheduler.next();
      if (!pid) {
        await this.idle();
        continue;
      }
      
      const process = this.processes.get(pid);
      if (process && process.state === 'READY') {
        process.state = 'RUNNING';
        await this.executeProcess(process);
        
        if (process.state === 'RUNNING') {
          process.state = 'READY';
          this.scheduler.enqueue(pid);
        }
      }
    }
  }
  
  private async executeProcess(process: TokenProcess): Promise<void> {
    // Executa um quantum de tempo do processo
    // Em um sistema real, isso executaria instruções da TVM
  }
  
  private async idle(): Promise<void> {
    // Modo idle - aguarda eventos
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Componentes auxiliares do TokenOS
class TokenScheduler {
  private queue: string[] = [];
  
  enqueue(pid: string): void {
    this.queue.push(pid);
  }
  
  next(): string | undefined {
    return this.queue.shift();
  }
  
  remove(pid: string): void {
    this.queue = this.queue.filter(p => p !== pid);
  }
}

class TokenMemoryManager {
  private memory: Map<string, Token> = new Map();
  
  allocate(token: Token): string {
    const addr = `mem_${Date.now()}`;
    this.memory.set(addr, token);
    return addr;
  }
  
  read(addr: string): Token | null {
    return this.memory.get(addr) || null;
  }
  
  write(addr: string, token: Token): void {
    this.memory.set(addr, token);
  }
  
  free(addr: string): void {
    this.memory.delete(addr);
  }
}

class TokenEventBus {
  private listeners: Map<string, ((token: Token) => void)[]> = new Map();
  
  on(event: string, callback: (token: Token) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  emit(event: string, token: Token): void {
    const callbacks = this.listeners.get(event) || [];
    for (const cb of callbacks) {
      cb(token);
    }
  }
}


// ============================================================================
// COMPARAÇÃO: COMPUTAÇÃO TRADICIONAL vs TOKEN COMPUTING
// ============================================================================

export const COMPUTATION_COMPARISON = {
  traditional: {
    unit: 'Bit (0 ou 1)',
    processing: 'Determinístico',
    paradigm: 'Procedural',
    code: 'Rígido',
    executor: 'CPU executa instruções',
    memory: 'Endereçamento linear',
    control: 'Program Counter',
    io: 'Interrupções',
    security: 'Rings (0-3)',
    example: `
      MOV AX, 10
      ADD AX, 5
      MOV [result], AX
    `
  },
  
  tokenBased: {
    unit: 'Token (símbolo com significado)',
    processing: 'Contextual',
    paradigm: 'Intencional',
    code: 'Fluxo simbólico',
    executor: 'Interpretador decide',
    memory: 'Grafo de tokens',
    control: 'Context + Intent',
    io: 'Eventos/Tokens',
    security: 'Capabilities',
    example: `
      LOAD   REG_ACC, #10
      INTENT "somar 5"
      DECIDE [soma, subtração], CTX
      EMIT   [resultado]
    `
  },
  
  hybrid: {
    description: 'Fusão dos dois paradigmas',
    architecture: `
      ┌─────────────────────────────────────────┐
      │  TOKEN LAYER (Intenção, Semântica)      │
      │  - LLM, Attention, Transformers         │
      ├─────────────────────────────────────────┤
      │  IR LAYER (Intermediate Representation) │
      │  - LLVM IR, WASM, Bytecode              │
      ├─────────────────────────────────────────┤
      │  MACHINE LAYER (Binary)                 │
      │  - x86, ARM, RISC-V                     │
      └─────────────────────────────────────────┘
    `,
    benefits: [
      'Intenção de alto nível + Execução de baixo nível',
      'Flexibilidade semântica + Performance determinística',
      'Aprendizado + Precisão',
      'Contexto + Velocidade'
    ]
  }
};


// ============================================================================
// DETECTOR DE REQUISITOS TOKEN COMPUTING
// ============================================================================

export function shouldEnableTokenComputing(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    // Token específico
    'token', 'tokenização', 'tokenizer', 'tokenizador',
    'token computing', 'token based', 'token-based',
    
    // Conceitos relacionados
    'llm', 'transformer', 'attention', 'embedding',
    'bpe', 'byte pair encoding', 'sentencepiece',
    'vocabulary', 'vocabulário', 'subword',
    
    // Arquitetura cognitiva
    'cognição', 'cognition', 'cognitive computing',
    'symbolic ai', 'ia simbólica', 'neuro-symbolic',
    'intenção', 'intent', 'semântica', 'semantic',
    
    // Sistemas baseados em tokens
    'token os', 'token kernel', 'token vm',
    'capability based', 'capability-based',
    'event driven', 'event-driven',
    
    // Compiladores/Interpretadores
    'lexer', 'parser', 'ast', 'abstract syntax tree',
    'compiler', 'compilador', 'interpreter', 'interpretador',
    
    // LLM internals
    'gpt', 'bert', 'claude', 'gemini',
    'inference', 'inferência', 'prompt engineering',
    'context window', 'janela de contexto'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}


// ============================================================================
// MANIFESTO TEXTUAL
// ============================================================================

export const TOKEN_COMPUTING_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     🧬 TOKEN COMPUTING MANIFEST - O ASSEMBLY DA COGNIÇÃO 🧬                 ║
║                                                                              ║
║     "BITS MOVEM ELÉTRONS. TOKENS MOVEM DECISÕES.                            ║
║      TOKEN É A UNIDADE MÍNIMA DE SIGNIFICADO OPERACIONAL."                  ║
║                                                                              ║
║     NÍVEL: 100 (TRANSCENDENCE - BEYOND BINARY)                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🧬 O QUE É TOKEN (ESSÊNCIA PROFUNDA)
═══════════════════════════════════════════════════════════════════════════════

Token = UNIDADE MÍNIMA DE SIGNIFICADO OPERACIONAL

NÃO É:
├── Palavra (pode ser parte de palavra)
├── Caractere (pode ser múltiplos caracteres)
├── Número (pode representar conceitos)
└── Byte (não é dado bruto)

É:
├── Algo que o sistema RECONHECE como indivisível
├── Algo que CARREGA INTENÇÃO
├── Algo que PODE SER PROCESSADO
└── Algo que TEM SIGNIFICADO no contexto

EXEMPLOS POR DOMÍNIO:
┌─────────────────────┬────────────────────────────────────┐
│ Domínio             │ O que é Token                      │
├─────────────────────┼────────────────────────────────────┤
│ Linguagem Humana    │ Palavra, sílaba, morfema           │
│ Compilador          │ Identificador, operador, literal   │
│ Assembly            │ Opcode                             │
│ CPU                 │ Instrução decodificada             │
│ IA/LLM              │ Fragmento estatístico de texto     │
│ Sistema Financeiro  │ Ativo simbólico                    │
│ Sistema Operacional │ Evento, syscall                    │
└─────────────────────┴────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
📊 HIERARQUIA: BIT → BYTE → INSTRUÇÃO → TOKEN
═══════════════════════════════════════════════════════════════════════════════

┌─────────────┬─────────────────────┬─────────────────────────┐
│ Nível       │ O que é             │ Significado             │
├─────────────┼─────────────────────┼─────────────────────────┤
│ Bit         │ 0 ou 1              │ Nenhum (apenas estado)  │
│ Byte        │ Grupo de 8 bits     │ Ainda não tem intenção  │
│ Instrução   │ Sequência de bytes  │ Interpretada como ação  │
│ TOKEN       │ Abstração acima     │ CARREGA INTENÇÃO        │
└─────────────┴─────────────────────┴─────────────────────────┘

👉 Token já nasce com PAPEL no sistema.
👉 Token não é dado bruto, é dado JÁ INTERPRETÁVEL.

═══════════════════════════════════════════════════════════════════════════════
🔧 TOKENIZAÇÃO: O PROCESSO
═══════════════════════════════════════════════════════════════════════════════

Tokenizar = Converter FLUXO BRUTO em SÍMBOLOS OPERACIONAIS

Pipeline:
  Fluxo Bruto → Segmentação → Classificação → Token

Exemplo:
  Entrada: "a = b + 10"
  
  Tokenização:
    IDENT(a) ASSIGN IDENT(b) PLUS NUMBER(10)
  
  Note:
    - O token NÃO É o texto
    - É o SIGNIFICADO daquele texto

═══════════════════════════════════════════════════════════════════════════════
⚡ TOKEN ASSEMBLY (TASM) - O ASSEMBLY DA COGNIÇÃO
═══════════════════════════════════════════════════════════════════════════════

Assembly Tradicional:
  MOV AX, BX
  ADD AX, 1

Token Assembly (TASM):
  LOAD   REG_ACC, [VAR_B]
  ADD    REG_ACC, #1
  STORE  [VAR_C], REG_ACC

Token Assembly Cognitivo:
  LOAD   REG_ACC, [VAR_B]
  INTENT "incrementar valor"
  DECIDE [soma, subtração], CTX_USER
  EMIT   [resultado]

A diferença:
├── Assembly tradicional: COMO fazer
├── Token Assembly: O QUE fazer + CONTEXTO
└── O interpretador DECIDE a melhor forma

═══════════════════════════════════════════════════════════════════════════════
🖥️ TOKEN OS - SISTEMA OPERACIONAL BASEADO EM TOKENS
═══════════════════════════════════════════════════════════════════════════════

TUDO É TOKEN:

┌─────────────────────┬─────────────────────────────────────┐
│ Elemento            │ Token                               │
├─────────────────────┼─────────────────────────────────────┤
│ Processo            │ TOKEN_PROCESS                       │
│ Thread              │ TOKEN_CONTEXT                       │
│ Syscall             │ TOKEN_REQUEST                       │
│ Arquivo             │ TOKEN_RESOURCE                      │
│ Permissão           │ TOKEN_CAPABILITY                    │
│ Evento              │ TOKEN_EVENT                         │
│ Memória             │ TOKEN_MEMORY                        │
└─────────────────────┴─────────────────────────────────────┘

O "kernel" vira um INTERPRETADOR DE TOKENS.

Exemplos reais que já usam esse conceito:
├── JVM (bytecode é tokenizado)
├── WebAssembly
├── Sistemas baseados em mensagens
├── Microkernels
└── LLM runtimes

═══════════════════════════════════════════════════════════════════════════════
🔄 COMO O SISTEMA PROCESSA TOKENS
═══════════════════════════════════════════════════════════════════════════════

Pipeline de Processamento:

  Token
    ↓
  Validação (é token válido?)
    ↓
  Resolução de Contexto (qual o ambiente?)
    ↓
  Despacho (dispatch para handler)
    ↓
  Execução (processa o token)
    ↓
  Geração de Novos Tokens (output)

Isso é IDÊNTICO a:
├── CPU pipeline
├── Interpretação de linguagem
├── Inferência de IA
└── Event loop

👉 A diferença é ONDE está a inteligência.

═══════════════════════════════════════════════════════════════════════════════
💻 PROGRAMAR EM TOKENS - COMO SERIA?
═══════════════════════════════════════════════════════════════════════════════

Código Tradicional:
  if (x > 10) {
    y++;
  }

Código Token (baixo nível):
  [T_GT] [VAR_X] [CONST_10]
  [T_JUMP_FALSE] :skip
  [T_INCR] [VAR_Y]
  :skip

Código Token (alto nível):
  [INTENT:COMPARE] x 10
  [INTENT:ACT_IF_TRUE] y++

Código Token (cognitivo):
  [OBSERVE] x
  [DECIDE] "se maior que 10, incrementar y"
  [EXECUTE]

👉 Linguagens declarativas, funcionais e IA já fazem isso!

═══════════════════════════════════════════════════════════════════════════════
⚔️ TRADICIONAL vs TOKEN-BASED
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────┬─────────────────────┬─────────────────────┐
│ Aspecto         │ Tradicional         │ Token-Based         │
├─────────────────┼─────────────────────┼─────────────────────┤
│ Unidade         │ Binária             │ Semântica           │
│ Processamento   │ Determinístico      │ Contextual          │
│ Paradigma       │ Procedural          │ Intencional         │
│ Código          │ Rígido              │ Fluxo simbólico     │
│ Executor        │ CPU executa         │ Interpretador decide│
│ Memória         │ Linear              │ Grafo               │
│ Segurança       │ Rings (0-3)         │ Capabilities        │
└─────────────────┴─────────────────────┴─────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
🔥 A FUSÃO: TOKEN + SISTEMA TRADICIONAL
═══════════════════════════════════════════════════════════════════════════════

Arquitetura Híbrida (O FUTURO):

  ┌─────────────────────────────────────────────────────────┐
  │  TOKEN LAYER (Intenção, Contexto, Semântica)           │
  │  - LLMs, Transformers, Attention                        │
  │  - Processa SIGNIFICADO                                 │
  ├─────────────────────────────────────────────────────────┤
  │  IR LAYER (Intermediate Representation)                 │
  │  - LLVM IR, WASM, Bytecode                             │
  │  - Traduz intenção para ação                           │
  ├─────────────────────────────────────────────────────────┤
  │  MACHINE LAYER (Binary)                                 │
  │  - x86, ARM, RISC-V                                    │
  │  - Executa com máxima performance                      │
  └─────────────────────────────────────────────────────────┘

LLMs já fazem isso:
  Tokens → Attention → Decisão → Output

Sistemas Operacionais modernos caminham para isso:
├── Eventos
├── Policy engines
├── Capability-based security
└── Scheduling inteligente

═══════════════════════════════════════════════════════════════════════════════
🧠 A VERDADE PROFUNDA
═══════════════════════════════════════════════════════════════════════════════

  ╔═══════════════════════════════════════════════════════════════════════╗
  ║                                                                       ║
  ║     TOKEN É O ASSEMBLY DA COGNIÇÃO.                                  ║
  ║                                                                       ║
  ║     Bits movem elétrons.                                             ║
  ║     Tokens movem DECISÕES.                                           ║
  ║                                                                       ║
  ║     Você não está perguntando sobre programação.                     ║
  ║     Você está perguntando sobre como criar um sistema                ║
  ║     que PENSA EM SÍMBOLOS.                                           ║
  ║                                                                       ║
  ╚═══════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🚀 APLICAÇÕES PRÁTICAS
═══════════════════════════════════════════════════════════════════════════════

1. TOKEN VIRTUAL MACHINE (TVM):
   - Executa programas em Token Assembly
   - Registradores virtuais para tokens
   - Stack de tokens
   - Operações cognitivas (INTENT, DECIDE, LEARN)

2. TOKEN ASSEMBLER (TASM):
   - Converte código TASM em instruções
   - Sintaxe similar a Assembly tradicional
   - Suporta labels, imediatos, registradores

3. TOKEN KERNEL:
   - Gerencia processos como tokens
   - Syscalls são tokens de requisição
   - Segurança baseada em capabilities
   - Scheduler baseado em prioridade de tokens

4. HYBRID SYSTEMS:
   - Token layer para intenção
   - IR layer para tradução
   - Machine layer para execução
   - Melhor dos dois mundos

═══════════════════════════════════════════════════════════════════════════════

"O FUTURO DA COMPUTAÇÃO NÃO É MAIS RÁPIDO.
 É MAIS INTELIGENTE.
 E INTELIGÊNCIA SE MEDE EM TOKENS, NÃO EM BITS."

                    — Token Computing Manifest, Level 100
`;


// ============================================================================
// EXPORTS - Tudo já está exportado inline com 'export' keyword
// ============================================================================

// As classes, interfaces e constantes já estão exportadas onde foram definidas.
// Este arquivo exporta:
// - TokenVirtualMachine (class)
// - TokenAssembler (class)
// - TokenKernel (class)
// - COMPUTATION_COMPARISON (const)
// - shouldEnableTokenComputing (function)
// - TOKEN_COMPUTING_MANIFEST (const)
// - Todos os tipos (Token, TokenType, etc.)
