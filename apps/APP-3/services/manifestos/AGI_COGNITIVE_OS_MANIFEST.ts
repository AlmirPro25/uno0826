/**
 * 🖥️ AGI COGNITIVE OS MANIFEST (Level 202)
 * 
 * "Um sistema operacional para a mente artificial."
 * 
 * Este manifesto transforma a arquitetura teórica dos Manifestos 200 e 201
 * em um sistema executável com:
 * - Kernel Cognitivo
 * - Scheduler de Processos Mentais
 * - Memory Manager
 * - Sistema de Permissões
 * - IPC (Inter-Process Communication)
 * - System Calls
 * - Boot Sequence
 * 
 * NÍVEL: 202 (Sistema Operacional Cognitivo)
 */

// ============================================================
// TIPOS FUNDAMENTAIS DO COGNITIVE OS
// ============================================================

export type ProcessState = 'ready' | 'running' | 'blocked' | 'suspended' | 'terminated';
export type ProcessPriority = 'critical' | 'high' | 'normal' | 'low' | 'idle';
export type MemoryZone = 'kernel' | 'protected' | 'user' | 'shared';
export type Permission = 'read' | 'write' | 'execute' | 'modify_self' | 'spawn' | 'kill';

export interface CognitiveProcess {
  pid: number;
  name: string;
  state: ProcessState;
  priority: ProcessPriority;
  parentPid: number | null;
  createdAt: number;
  cpuTime: number;
  memoryUsage: number;
  permissions: Set<Permission>;
  context: ProcessContext;
}

export interface ProcessContext {
  registers: Map<string, any>;
  stack: any[];
  heap: Map<string, any>;
  instructionPointer: number;
  flags: Set<string>;
}

export interface MemoryBlock {
  id: string;
  zone: MemoryZone;
  size: number;
  owner: number; // PID
  data: any;
  permissions: Set<Permission>;
  createdAt: number;
  lastAccess: number;
}

export interface SystemCall {
  id: string;
  name: string;
  handler: (args: any[], caller: CognitiveProcess) => Promise<any>;
  requiredPermissions: Permission[];
  description: string;
}

export interface Interrupt {
  id: number;
  type: 'hardware' | 'software' | 'exception';
  priority: number;
  handler: string;
  data?: any;
}

export interface IPCMessage {
  id: string;
  from: number;
  to: number;
  type: 'signal' | 'message' | 'shared_memory' | 'pipe';
  payload: any;
  timestamp: number;
}

// ============================================================
// KERNEL COGNITIVO
// ============================================================

export class CognitiveKernel {
  private processes: Map<number, CognitiveProcess> = new Map();
  private memory: Map<string, MemoryBlock> = new Map();
  private syscalls: Map<string, SystemCall> = new Map();
  private interruptQueue: Interrupt[] = [];
  private messageQueue: IPCMessage[] = [];
  
  private nextPid: number = 1;
  private currentProcess: CognitiveProcess | null = null;
  private bootTime: number = 0;
  private isRunning: boolean = false;
  
  // Configurações do Kernel
  private readonly QUANTUM_MS = 100; // Time slice
  private readonly MAX_PROCESSES = 256;
  private readonly MAX_MEMORY_MB = 1024;
  private readonly KERNEL_RESERVED_PIDS = [0, 1]; // 0=idle, 1=init

  constructor() {
    this.registerCoreSyscalls();
  }

  // ============================================================
  // BOOT SEQUENCE
  // ============================================================

  async boot(): Promise<void> {
    console.log('🖥️ Cognitive OS Booting...');
    this.bootTime = Date.now();
    
    // Fase 1: Inicialização do Hardware (simulado)
    console.log('  [1/6] Initializing cognitive hardware...');
    await this.initializeHardware();
    
    // Fase 2: Carregamento do Kernel
    console.log('  [2/6] Loading kernel into memory...');
    await this.loadKernel();
    
    // Fase 3: Inicialização da Memória
    console.log('  [3/6] Setting up memory management...');
    await this.initializeMemory();
    
    // Fase 4: Registro de System Calls
    console.log('  [4/6] Registering system calls...');
    this.registerCoreSyscalls();
    
    // Fase 5: Criação do processo init
    console.log('  [5/6] Spawning init process...');
    await this.spawnInitProcess();
    
    // Fase 6: Início do Scheduler
    console.log('  [6/6] Starting scheduler...');
    this.isRunning = true;
    
    console.log(`✅ Cognitive OS booted in ${Date.now() - this.bootTime}ms`);
    console.log(`   PID 1 (init) running`);
    console.log(`   ${this.syscalls.size} syscalls registered`);
  }

  private async initializeHardware(): Promise<void> {
    // Simula inicialização de "hardware cognitivo"
    await this.delay(50);
  }

  private async loadKernel(): Promise<void> {
    // Aloca memória para o kernel
    this.allocateMemory('kernel_code', 'kernel', 64, 0);
    this.allocateMemory('kernel_data', 'kernel', 32, 0);
    this.allocateMemory('kernel_stack', 'kernel', 16, 0);
    await this.delay(30);
  }

  private async initializeMemory(): Promise<void> {
    // Configura zonas de memória
    this.allocateMemory('protected_zone', 'protected', 128, 0);
    this.allocateMemory('shared_zone', 'shared', 256, 0);
    await this.delay(20);
  }

  private async spawnInitProcess(): Promise<void> {
    // Processo idle (PID 0)
    this.createProcess('idle', 'idle', null, new Set(['read']));
    
    // Processo init (PID 1)
    const init = this.createProcess('init', 'critical', null, 
      new Set(['read', 'write', 'execute', 'spawn', 'kill']));
    
    this.currentProcess = init;
  }

  // ============================================================
  // PROCESS MANAGEMENT
  // ============================================================

  createProcess(
    name: string,
    priority: ProcessPriority,
    parentPid: number | null,
    permissions: Set<Permission>
  ): CognitiveProcess {
    if (this.processes.size >= this.MAX_PROCESSES) {
      throw new Error('ENOMEM: Maximum process limit reached');
    }

    const pid = this.nextPid++;
    const process: CognitiveProcess = {
      pid,
      name,
      state: 'ready',
      priority,
      parentPid,
      createdAt: Date.now(),
      cpuTime: 0,
      memoryUsage: 0,
      permissions,
      context: {
        registers: new Map(),
        stack: [],
        heap: new Map(),
        instructionPointer: 0,
        flags: new Set()
      }
    };

    this.processes.set(pid, process);
    return process;
  }

  terminateProcess(pid: number): boolean {
    const process = this.processes.get(pid);
    if (!process) return false;
    
    // Não pode matar processos do kernel
    if (this.KERNEL_RESERVED_PIDS.includes(pid)) {
      throw new Error('EPERM: Cannot terminate kernel process');
    }

    process.state = 'terminated';
    
    // Libera memória do processo
    for (const [id, block] of this.memory) {
      if (block.owner === pid) {
        this.memory.delete(id);
      }
    }

    // Termina processos filhos (cascade)
    for (const [childPid, childProcess] of this.processes) {
      if (childProcess.parentPid === pid) {
        this.terminateProcess(childPid);
      }
    }

    this.processes.delete(pid);
    return true;
  }

  getProcess(pid: number): CognitiveProcess | undefined {
    return this.processes.get(pid);
  }

  listProcesses(): CognitiveProcess[] {
    return Array.from(this.processes.values());
  }

  // ============================================================
  // SCHEDULER
  // ============================================================

  /**
   * Scheduler Round-Robin com prioridades
   */
  schedule(): CognitiveProcess | null {
    const readyProcesses = Array.from(this.processes.values())
      .filter(p => p.state === 'ready')
      .sort((a, b) => {
        // Ordena por prioridade
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3, idle: 4 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    if (readyProcesses.length === 0) {
      // Retorna processo idle
      return this.processes.get(0) || null;
    }

    return readyProcesses[0];
  }

  /**
   * Context switch
   */
  contextSwitch(newProcess: CognitiveProcess): void {
    if (this.currentProcess) {
      // Salva contexto do processo atual
      if (this.currentProcess.state === 'running') {
        this.currentProcess.state = 'ready';
      }
    }

    // Carrega novo processo
    newProcess.state = 'running';
    this.currentProcess = newProcess;
  }

  /**
   * Executa um tick do scheduler
   */
  tick(): void {
    if (!this.isRunning) return;

    // Processa interrupções pendentes
    this.processInterrupts();

    // Processa mensagens IPC
    this.processMessages();

    // Atualiza tempo de CPU do processo atual
    if (this.currentProcess && this.currentProcess.state === 'running') {
      this.currentProcess.cpuTime += this.QUANTUM_MS;
    }

    // Seleciona próximo processo
    const next = this.schedule();
    if (next && next !== this.currentProcess) {
      this.contextSwitch(next);
    }
  }

  // ============================================================
  // MEMORY MANAGEMENT
  // ============================================================

  allocateMemory(
    id: string,
    zone: MemoryZone,
    size: number,
    owner: number
  ): MemoryBlock {
    const block: MemoryBlock = {
      id,
      zone,
      size,
      owner,
      data: null,
      permissions: new Set(['read', 'write']),
      createdAt: Date.now(),
      lastAccess: Date.now()
    };

    this.memory.set(id, block);
    
    // Atualiza uso de memória do processo
    const process = this.processes.get(owner);
    if (process) {
      process.memoryUsage += size;
    }

    return block;
  }

  freeMemory(id: string): boolean {
    const block = this.memory.get(id);
    if (!block) return false;

    // Atualiza uso de memória do processo
    const process = this.processes.get(block.owner);
    if (process) {
      process.memoryUsage -= block.size;
    }

    this.memory.delete(id);
    return true;
  }

  readMemory(id: string, caller: CognitiveProcess): any {
    const block = this.memory.get(id);
    if (!block) {
      throw new Error('EFAULT: Invalid memory address');
    }

    // Verifica permissões
    if (block.zone === 'kernel' && caller.pid !== 0) {
      throw new Error('EPERM: Cannot access kernel memory');
    }

    if (!block.permissions.has('read')) {
      throw new Error('EACCES: Read permission denied');
    }

    block.lastAccess = Date.now();
    return block.data;
  }

  writeMemory(id: string, data: any, caller: CognitiveProcess): void {
    const block = this.memory.get(id);
    if (!block) {
      throw new Error('EFAULT: Invalid memory address');
    }

    // Verifica permissões
    if (block.zone === 'kernel' && caller.pid !== 0) {
      throw new Error('EPERM: Cannot write to kernel memory');
    }

    if (!block.permissions.has('write')) {
      throw new Error('EACCES: Write permission denied');
    }

    block.data = data;
    block.lastAccess = Date.now();
  }

  getMemoryStats(): { total: number; used: number; free: number } {
    const used = Array.from(this.memory.values())
      .reduce((sum, block) => sum + block.size, 0);
    
    return {
      total: this.MAX_MEMORY_MB,
      used,
      free: this.MAX_MEMORY_MB - used
    };
  }

  // ============================================================
  // SYSTEM CALLS
  // ============================================================

  private registerCoreSyscalls(): void {
    // fork - cria processo filho
    this.registerSyscall({
      id: 'fork',
      name: 'fork',
      requiredPermissions: ['spawn'],
      description: 'Create a child process',
      handler: async (args, caller) => {
        const child = this.createProcess(
          `${caller.name}_child`,
          caller.priority,
          caller.pid,
          new Set(caller.permissions)
        );
        return child.pid;
      }
    });

    // exit - termina processo
    this.registerSyscall({
      id: 'exit',
      name: 'exit',
      requiredPermissions: [],
      description: 'Terminate the calling process',
      handler: async (args, caller) => {
        this.terminateProcess(caller.pid);
        return 0;
      }
    });

    // kill - envia sinal para processo
    this.registerSyscall({
      id: 'kill',
      name: 'kill',
      requiredPermissions: ['kill'],
      description: 'Send signal to a process',
      handler: async ([pid, signal], caller) => {
        const target = this.processes.get(pid);
        if (!target) return -1;
        
        this.sendInterrupt({
          id: Date.now(),
          type: 'software',
          priority: 5,
          handler: 'signal_handler',
          data: { signal, from: caller.pid }
        });
        return 0;
      }
    });

    // malloc - aloca memória
    this.registerSyscall({
      id: 'malloc',
      name: 'malloc',
      requiredPermissions: ['write'],
      description: 'Allocate memory',
      handler: async ([size], caller) => {
        const id = `heap_${caller.pid}_${Date.now()}`;
        const block = this.allocateMemory(id, 'user', size, caller.pid);
        return block.id;
      }
    });

    // free - libera memória
    this.registerSyscall({
      id: 'free',
      name: 'free',
      requiredPermissions: ['write'],
      description: 'Free allocated memory',
      handler: async ([id], caller) => {
        const block = this.memory.get(id);
        if (!block || block.owner !== caller.pid) {
          throw new Error('EPERM: Cannot free memory owned by another process');
        }
        return this.freeMemory(id) ? 0 : -1;
      }
    });

    // read - lê memória
    this.registerSyscall({
      id: 'read',
      name: 'read',
      requiredPermissions: ['read'],
      description: 'Read from memory',
      handler: async ([id], caller) => {
        return this.readMemory(id, caller);
      }
    });

    // write - escreve memória
    this.registerSyscall({
      id: 'write',
      name: 'write',
      requiredPermissions: ['write'],
      description: 'Write to memory',
      handler: async ([id, data], caller) => {
        this.writeMemory(id, data, caller);
        return 0;
      }
    });

    // send - envia mensagem IPC
    this.registerSyscall({
      id: 'send',
      name: 'send',
      requiredPermissions: ['write'],
      description: 'Send IPC message',
      handler: async ([to, payload], caller) => {
        this.sendMessage(caller.pid, to, 'message', payload);
        return 0;
      }
    });

    // recv - recebe mensagem IPC
    this.registerSyscall({
      id: 'recv',
      name: 'recv',
      requiredPermissions: ['read'],
      description: 'Receive IPC message',
      handler: async ([], caller) => {
        const msg = this.messageQueue.find(m => m.to === caller.pid);
        if (msg) {
          this.messageQueue = this.messageQueue.filter(m => m.id !== msg.id);
          return msg;
        }
        return null;
      }
    });

    // getpid - retorna PID
    this.registerSyscall({
      id: 'getpid',
      name: 'getpid',
      requiredPermissions: [],
      description: 'Get process ID',
      handler: async ([], caller) => caller.pid
    });

    // getppid - retorna PID do pai
    this.registerSyscall({
      id: 'getppid',
      name: 'getppid',
      requiredPermissions: [],
      description: 'Get parent process ID',
      handler: async ([], caller) => caller.parentPid
    });

    // sleep - suspende processo
    this.registerSyscall({
      id: 'sleep',
      name: 'sleep',
      requiredPermissions: [],
      description: 'Suspend process for specified time',
      handler: async ([ms], caller) => {
        caller.state = 'blocked';
        setTimeout(() => {
          caller.state = 'ready';
        }, ms);
        return 0;
      }
    });

    // uptime - tempo desde boot
    this.registerSyscall({
      id: 'uptime',
      name: 'uptime',
      requiredPermissions: [],
      description: 'Get system uptime',
      handler: async () => Date.now() - this.bootTime
    });
  }

  registerSyscall(syscall: SystemCall): void {
    this.syscalls.set(syscall.id, syscall);
  }

  async syscall(name: string, args: any[] = []): Promise<any> {
    const syscall = this.syscalls.get(name);
    if (!syscall) {
      throw new Error(`ENOSYS: Unknown syscall: ${name}`);
    }

    if (!this.currentProcess) {
      throw new Error('ESRCH: No current process');
    }

    // Verifica permissões
    for (const perm of syscall.requiredPermissions) {
      if (!this.currentProcess.permissions.has(perm)) {
        throw new Error(`EPERM: Missing permission: ${perm}`);
      }
    }

    return syscall.handler(args, this.currentProcess);
  }

  // ============================================================
  // INTERRUPTS
  // ============================================================

  sendInterrupt(interrupt: Interrupt): void {
    this.interruptQueue.push(interrupt);
    // Ordena por prioridade
    this.interruptQueue.sort((a, b) => a.priority - b.priority);
  }

  private processInterrupts(): void {
    while (this.interruptQueue.length > 0) {
      const interrupt = this.interruptQueue.shift()!;
      this.handleInterrupt(interrupt);
    }
  }

  private handleInterrupt(interrupt: Interrupt): void {
    // Simula tratamento de interrupção
    console.log(`[INT] ${interrupt.type} interrupt ${interrupt.id}: ${interrupt.handler}`);
  }

  // ============================================================
  // IPC (Inter-Process Communication)
  // ============================================================

  sendMessage(from: number, to: number, type: IPCMessage['type'], payload: any): void {
    const message: IPCMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      type,
      payload,
      timestamp: Date.now()
    };

    this.messageQueue.push(message);
  }

  private processMessages(): void {
    // Processa mensagens pendentes
    for (const msg of this.messageQueue) {
      const target = this.processes.get(msg.to);
      if (target && target.state === 'blocked') {
        // Acorda processo bloqueado esperando mensagem
        target.state = 'ready';
      }
    }
  }

  // ============================================================
  // SHUTDOWN
  // ============================================================

  async shutdown(): Promise<void> {
    console.log('🖥️ Cognitive OS Shutting down...');
    
    // Termina todos os processos (exceto kernel)
    for (const [pid] of this.processes) {
      if (!this.KERNEL_RESERVED_PIDS.includes(pid)) {
        this.terminateProcess(pid);
      }
    }

    // Limpa memória
    this.memory.clear();
    
    // Para o scheduler
    this.isRunning = false;
    
    console.log('✅ Cognitive OS shutdown complete');
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSystemInfo(): {
    uptime: number;
    processes: number;
    memory: { total: number; used: number; free: number };
    syscalls: number;
  } {
    return {
      uptime: Date.now() - this.bootTime,
      processes: this.processes.size,
      memory: this.getMemoryStats(),
      syscalls: this.syscalls.size
    };
  }
}


// ============================================================
// COGNITIVE SUBSYSTEMS (Processos Especializados)
// ============================================================

/**
 * Perception Daemon - Processa inputs sensoriais
 */
export class PerceptionDaemon {
  private kernel: CognitiveKernel;
  private pid: number = -1;

  constructor(kernel: CognitiveKernel) {
    this.kernel = kernel;
  }

  async start(): Promise<void> {
    const process = this.kernel.createProcess(
      'perceptiond',
      'high',
      1, // parent = init
      new Set(['read', 'write', 'execute'] as Permission[])
    );
    this.pid = process.pid;
  }

  async processInput(input: {
    type: 'text' | 'image' | 'audio' | 'sensor';
    data: any;
    timestamp: number;
  }): Promise<{
    processed: any;
    features: Map<string, number>;
    salience: number;
  }> {
    // Simula processamento perceptual
    const features = new Map<string, number>();
    
    if (input.type === 'text') {
      features.set('length', input.data.length);
      features.set('complexity', this.estimateComplexity(input.data));
      features.set('sentiment', this.estimateSentiment(input.data));
    }

    return {
      processed: input.data,
      features,
      salience: this.calculateSalience(features)
    };
  }

  private estimateComplexity(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    return Math.min(1, (words / sentences) / 20);
  }

  private estimateSentiment(text: string): number {
    const positive = ['bom', 'ótimo', 'excelente', 'feliz', 'sucesso'];
    const negative = ['ruim', 'péssimo', 'triste', 'falha', 'erro'];
    
    const lower = text.toLowerCase();
    let score = 0;
    
    for (const word of positive) {
      if (lower.includes(word)) score += 0.2;
    }
    for (const word of negative) {
      if (lower.includes(word)) score -= 0.2;
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  private calculateSalience(features: Map<string, number>): number {
    let salience = 0.5;
    
    const complexity = features.get('complexity') || 0;
    const sentiment = Math.abs(features.get('sentiment') || 0);
    
    salience += complexity * 0.3;
    salience += sentiment * 0.2;
    
    return Math.min(1, salience);
  }
}

/**
 * Memory Daemon - Gerencia memória de longo prazo
 */
export class MemoryDaemon {
  private kernel: CognitiveKernel;
  private pid: number = -1;
  private episodicMemory: Map<string, any> = new Map();
  private semanticMemory: Map<string, any> = new Map();
  private proceduralMemory: Map<string, any> = new Map();

  constructor(kernel: CognitiveKernel) {
    this.kernel = kernel;
  }

  async start(): Promise<void> {
    const process = this.kernel.createProcess(
      'memoryd',
      'normal',
      1,
      new Set(['read', 'write'] as Permission[])
    );
    this.pid = process.pid;
  }

  storeEpisodic(id: string, episode: {
    content: any;
    timestamp: number;
    context: any;
    emotionalValence: number;
  }): void {
    this.episodicMemory.set(id, {
      ...episode,
      accessCount: 0,
      lastAccess: Date.now()
    });
  }

  storeSemantic(concept: string, knowledge: any): void {
    this.semanticMemory.set(concept, {
      knowledge,
      confidence: 0.5,
      sources: [],
      lastUpdated: Date.now()
    });
  }

  storeProcedural(skill: string, procedure: any): void {
    this.proceduralMemory.set(skill, {
      procedure,
      proficiency: 0.1,
      practiceCount: 0
    });
  }

  recall(query: string): {
    episodic: any[];
    semantic: any[];
    procedural: any[];
  } {
    const results = {
      episodic: [] as any[],
      semantic: [] as any[],
      procedural: [] as any[]
    };

    // Busca em memória episódica
    for (const [id, episode] of this.episodicMemory) {
      if (JSON.stringify(episode).toLowerCase().includes(query.toLowerCase())) {
        episode.accessCount++;
        episode.lastAccess = Date.now();
        results.episodic.push({ id, ...episode });
      }
    }

    // Busca em memória semântica
    for (const [concept, data] of this.semanticMemory) {
      if (concept.toLowerCase().includes(query.toLowerCase())) {
        results.semantic.push({ concept, ...data });
      }
    }

    // Busca em memória procedural
    for (const [skill, data] of this.proceduralMemory) {
      if (skill.toLowerCase().includes(query.toLowerCase())) {
        results.procedural.push({ skill, ...data });
      }
    }

    return results;
  }

  consolidate(): void {
    // Simula consolidação de memória (como durante o sono)
    // Remove memórias episódicas pouco acessadas
    const threshold = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
    
    for (const [id, episode] of this.episodicMemory) {
      if (episode.lastAccess < threshold && episode.accessCount < 3) {
        // Memória fraca - pode ser esquecida
        if (Math.random() < 0.3) {
          this.episodicMemory.delete(id);
        }
      }
    }
  }

  getStats(): {
    episodic: number;
    semantic: number;
    procedural: number;
  } {
    return {
      episodic: this.episodicMemory.size,
      semantic: this.semanticMemory.size,
      procedural: this.proceduralMemory.size
    };
  }
}

/**
 * Reasoning Daemon - Processa raciocínio e inferência
 */
export class ReasoningDaemon {
  private kernel: CognitiveKernel;
  private pid: number = -1;
  private workingMemory: any[] = [];
  private readonly MAX_WORKING_MEMORY = 7; // Miller's Law

  constructor(kernel: CognitiveKernel) {
    this.kernel = kernel;
  }

  async start(): Promise<void> {
    const process = this.kernel.createProcess(
      'reasoningd',
      'high',
      1,
      new Set(['read', 'write', 'execute'] as Permission[])
    );
    this.pid = process.pid;
  }

  /**
   * Raciocínio dedutivo
   */
  deduce(premises: string[], rules: Array<{ if: string; then: string }>): string[] {
    const conclusions: string[] = [];
    
    for (const rule of rules) {
      if (premises.includes(rule.if)) {
        conclusions.push(rule.then);
      }
    }
    
    return conclusions;
  }

  /**
   * Raciocínio indutivo
   */
  induce(observations: any[]): { pattern: string; confidence: number } | null {
    if (observations.length < 3) {
      return null;
    }
    
    // Busca padrões simples
    const types = observations.map(o => typeof o);
    const allSameType = types.every(t => t === types[0]);
    
    if (allSameType) {
      return {
        pattern: `All observations are of type ${types[0]}`,
        confidence: 0.7
      };
    }
    
    return null;
  }

  /**
   * Raciocínio analógico
   */
  analogize(source: { domain: string; relations: string[] }, target: { domain: string }): string[] {
    // Mapeia relações do domínio fonte para o alvo
    return source.relations.map(r => 
      r.replace(new RegExp(source.domain, 'gi'), target.domain)
    );
  }

  /**
   * Adiciona item à memória de trabalho
   */
  addToWorkingMemory(item: any): void {
    this.workingMemory.push(item);
    
    // Limita tamanho (chunking)
    if (this.workingMemory.length > this.MAX_WORKING_MEMORY) {
      this.workingMemory.shift();
    }
  }

  clearWorkingMemory(): void {
    this.workingMemory = [];
  }

  getWorkingMemory(): any[] {
    return [...this.workingMemory];
  }
}

/**
 * Action Daemon - Gerencia execução de ações
 */
export class ActionDaemon {
  private kernel: CognitiveKernel;
  private pid: number = -1;
  private actionQueue: Array<{
    id: string;
    action: string;
    params: any;
    priority: number;
    status: 'pending' | 'executing' | 'completed' | 'failed';
  }> = [];

  constructor(kernel: CognitiveKernel) {
    this.kernel = kernel;
  }

  async start(): Promise<void> {
    const process = this.kernel.createProcess(
      'actiond',
      'high',
      1,
      new Set(['read', 'write', 'execute'] as Permission[])
    );
    this.pid = process.pid;
  }

  queueAction(action: string, params: any, priority: number = 5): string {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.actionQueue.push({
      id,
      action,
      params,
      priority,
      status: 'pending'
    });
    
    // Ordena por prioridade
    this.actionQueue.sort((a, b) => a.priority - b.priority);
    
    return id;
  }

  async executeNext(): Promise<{ id: string; result: any } | null> {
    const next = this.actionQueue.find(a => a.status === 'pending');
    if (!next) return null;
    
    next.status = 'executing';
    
    try {
      // Simula execução
      const result = await this.executeAction(next.action, next.params);
      next.status = 'completed';
      return { id: next.id, result };
    } catch (error) {
      next.status = 'failed';
      throw error;
    }
  }

  private async executeAction(action: string, params: any): Promise<any> {
    // Simula diferentes tipos de ações
    switch (action) {
      case 'respond':
        return { type: 'response', content: params.content };
      case 'query':
        return { type: 'query_result', data: params.query };
      case 'store':
        return { type: 'stored', key: params.key };
      default:
        return { type: 'unknown', action };
    }
  }

  getQueueStatus(): { pending: number; executing: number; completed: number; failed: number } {
    return {
      pending: this.actionQueue.filter(a => a.status === 'pending').length,
      executing: this.actionQueue.filter(a => a.status === 'executing').length,
      completed: this.actionQueue.filter(a => a.status === 'completed').length,
      failed: this.actionQueue.filter(a => a.status === 'failed').length
    };
  }
}


// ============================================================
// COGNITIVE OS COMPLETO
// ============================================================

export class CognitiveOS {
  public kernel: CognitiveKernel;
  public perception: PerceptionDaemon;
  public memory: MemoryDaemon;
  public reasoning: ReasoningDaemon;
  public action: ActionDaemon;
  
  private isBooted: boolean = false;

  constructor() {
    this.kernel = new CognitiveKernel();
    this.perception = new PerceptionDaemon(this.kernel);
    this.memory = new MemoryDaemon(this.kernel);
    this.reasoning = new ReasoningDaemon(this.kernel);
    this.action = new ActionDaemon(this.kernel);
  }

  async boot(): Promise<void> {
    if (this.isBooted) {
      console.log('⚠️ Cognitive OS already booted');
      return;
    }

    // Boot do kernel
    await this.kernel.boot();
    
    // Inicia daemons
    console.log('🚀 Starting cognitive daemons...');
    await this.perception.start();
    await this.memory.start();
    await this.reasoning.start();
    await this.action.start();
    
    this.isBooted = true;
    console.log('✅ Cognitive OS fully operational');
  }

  async shutdown(): Promise<void> {
    if (!this.isBooted) {
      console.log('⚠️ Cognitive OS not running');
      return;
    }

    await this.kernel.shutdown();
    this.isBooted = false;
  }

  /**
   * Processa um input completo através do sistema
   */
  async process(input: string): Promise<{
    perception: any;
    reasoning: any;
    action: any;
  }> {
    // 1. Percepção
    const perceived = await this.perception.processInput({
      type: 'text',
      data: input,
      timestamp: Date.now()
    });
    
    // 2. Armazena na memória
    const episodeId = `ep_${Date.now()}`;
    this.memory.storeEpisodic(episodeId, {
      content: input,
      timestamp: Date.now(),
      context: { salience: perceived.salience },
      emotionalValence: perceived.features.get('sentiment') || 0
    });
    
    // 3. Adiciona à memória de trabalho
    this.reasoning.addToWorkingMemory({
      input,
      features: Object.fromEntries(perceived.features),
      salience: perceived.salience
    });
    
    // 4. Raciocínio básico
    const workingMemory = this.reasoning.getWorkingMemory();
    
    // 5. Enfileira ação de resposta
    const actionId = this.action.queueAction('respond', {
      content: `Processed: ${input.substring(0, 50)}...`,
      salience: perceived.salience
    });
    
    // 6. Executa ação
    const actionResult = await this.action.executeNext();
    
    return {
      perception: perceived,
      reasoning: { workingMemory },
      action: actionResult
    };
  }

  getStatus(): {
    booted: boolean;
    kernel: any;
    memory: any;
    actionQueue: any;
  } {
    return {
      booted: this.isBooted,
      kernel: this.kernel.getSystemInfo(),
      memory: this.memory.getStats(),
      actionQueue: this.action.getQueueStatus()
    };
  }
}


// ============================================================
// MANIFESTO METADATA
// ============================================================

export const AGI_COGNITIVE_OS_MANIFEST = {
  metadata: {
    id: 'agi-cognitive-os',
    name: 'AGI Cognitive OS',
    version: '1.0.0',
    description: 'Sistema operacional para mente artificial com kernel, scheduler, memory manager e daemons cognitivos',
    category: 'agi',
    level: 202,
    extends: ['agi-cognitive-architecture', 'agi-self-identity'],
    tags: [
      'cognitive-os', 'kernel', 'scheduler', 'memory-management',
      'processes', 'syscalls', 'ipc', 'daemons', 'perception',
      'reasoning', 'action', 'executable'
    ]
  },

  philosophy: `
O Cognitive OS é uma metáfora operacional para a mente artificial.

Assim como um sistema operacional gerencia recursos de hardware,
o Cognitive OS gerencia recursos cognitivos:
- Processos = Threads de pensamento
- Memória = Diferentes tipos de memória (episódica, semântica, procedural)
- Scheduler = Atenção e priorização
- IPC = Comunicação entre subsistemas
- Syscalls = Interface entre níveis de abstração

Não é consciência. É uma arquitetura executável para cognição artificial.
  `,

  components: {
    kernel: 'Núcleo do sistema com gerenciamento de processos e memória',
    scheduler: 'Round-robin com prioridades para processos cognitivos',
    memoryManager: 'Zonas de memória (kernel, protected, user, shared)',
    syscalls: 'Interface padronizada para operações do sistema',
    ipc: 'Comunicação entre processos via mensagens',
    interrupts: 'Sistema de interrupções para eventos',
    daemons: {
      perception: 'Processamento de inputs sensoriais',
      memory: 'Gerenciamento de memória de longo prazo',
      reasoning: 'Raciocínio e inferência',
      action: 'Execução de ações'
    }
  },

  syscallList: [
    'fork - Cria processo filho',
    'exit - Termina processo',
    'kill - Envia sinal para processo',
    'malloc - Aloca memória',
    'free - Libera memória',
    'read - Lê memória',
    'write - Escreve memória',
    'send - Envia mensagem IPC',
    'recv - Recebe mensagem IPC',
    'getpid - Retorna PID',
    'getppid - Retorna PID do pai',
    'sleep - Suspende processo',
    'uptime - Tempo desde boot'
  ],

  usage: `
// Criar e iniciar o Cognitive OS
const os = new CognitiveOS();
await os.boot();

// Processar input
const result = await os.process('Olá, como você está?');
console.log(result);

// Verificar status
console.log(os.getStatus());

// Usar syscalls diretamente
const pid = await os.kernel.syscall('fork');
const uptime = await os.kernel.syscall('uptime');

// Shutdown
await os.shutdown();
  `,

  limitations: [
    'Simulação, não hardware real',
    'Scheduler simplificado',
    'Sem proteção de memória real',
    'Daemons são heurísticos',
    'Não há aprendizado online'
  ],

  nextSteps: [
    'Adicionar mais syscalls',
    'Implementar virtual memory com paging',
    'Adicionar file system cognitivo',
    'Implementar networking entre instâncias',
    'Adicionar shell interativo'
  ]
};

export default AGI_COGNITIVE_OS_MANIFEST;