/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     ⚙️ LOW-LEVEL ARCHITECT - ARQUITETO DE SISTEMAS DE BAIXO NÍVEL ⚙️        ║
 * ║                                                                              ║
 * ║     "DO KERNEL AO SILÍCIO, CADA INSTRUÇÃO CONTA."                           ║
 * ║                                                                              ║
 * ║     NÍVEL: TRANSCENDENCE (100+)                                             ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo estende o AuroraBuilder para suportar:
 * - Sistemas Operacionais (do zero)
 * - Kernels e Drivers
 * - Firmware e RTOS
 * - Compiladores e Interpreters
 * - Networking de baixo nível
 * - Criptografia hardcore
 * - Memory Management
 * 
 * LINGUAGENS SUPORTADAS (TIER 1 - NUNCA FALLBACK):
 * - Rust, C, C++, Assembly (x86_64, ARM64, RISC-V), Zig, Go
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type LowLevelProjectType = 
  | 'operating_system'      // Sistema operacional do zero
  | 'kernel_module'         // Módulo de kernel Linux/Windows
  | 'device_driver'         // Driver de dispositivo
  | 'bootloader'            // Bootloader (UEFI/BIOS)
  | 'firmware'              // Firmware embarcado
  | 'rtos'                  // Sistema real-time
  | 'compiler'              // Compilador/Transpiler
  | 'interpreter'           // Interpretador/VM
  | 'network_stack'         // Stack de rede customizado
  | 'crypto_library'        // Biblioteca criptográfica
  | 'memory_allocator'      // Alocador de memória
  | 'file_system'           // Sistema de arquivos
  | 'hypervisor'            // Hypervisor/VMM
  | 'debugger'              // Debugger/Profiler
  | 'emulator';             // Emulador de hardware

export type TargetArchitecture = 
  | 'x86_64'
  | 'arm64'
  | 'riscv64'
  | 'wasm'
  | 'custom';

export type PrimaryLanguage = 
  | 'rust'
  | 'c'
  | 'cpp'
  | 'assembly'
  | 'zig'
  | 'go';

export interface LowLevelRequest {
  userPrompt: string;
  projectType: LowLevelProjectType;
  targetArchitecture?: TargetArchitecture;
  primaryLanguage?: PrimaryLanguage;
  features?: string[];
  constraints?: {
    maxMemory?: string;      // "64KB", "1MB", etc.
    maxBinary?: string;      // Tamanho máximo do binário
    realtime?: boolean;      // Requisitos de tempo real
    noStdLib?: boolean;      // Sem biblioteca padrão
    freestanding?: boolean;  // Ambiente freestanding
  };
}

export interface LowLevelBlueprint {
  projectName: string;
  projectType: LowLevelProjectType;
  description: string;
  architecture: {
    target: TargetArchitecture;
    primaryLanguage: PrimaryLanguage;
    secondaryLanguages?: PrimaryLanguage[];
    buildSystem: 'make' | 'cmake' | 'cargo' | 'meson' | 'custom';
    toolchain: string[];
  };
  components: LowLevelComponent[];
  memoryLayout?: MemoryLayout;
  bootSequence?: string[];
  interruptTable?: InterruptEntry[];
  syscalls?: SyscallDefinition[];
  fileStructure: Record<string, string>;
  buildInstructions: string[];
  testStrategy: string;
}

export interface LowLevelComponent {
  name: string;
  type: 'core' | 'driver' | 'library' | 'tool' | 'test';
  language: PrimaryLanguage;
  files: string[];
  dependencies: string[];
  description: string;
}

export interface MemoryLayout {
  regions: Array<{
    name: string;
    start: string;    // "0x0000"
    end: string;      // "0xFFFF"
    permissions: 'rwx' | 'rw-' | 'r-x' | 'r--';
    description: string;
  }>;
  stackSize: string;
  heapSize: string;
}

export interface InterruptEntry {
  vector: number;
  name: string;
  handler: string;
  description: string;
}

export interface SyscallDefinition {
  number: number;
  name: string;
  parameters: Array<{ name: string; type: string }>;
  returnType: string;
  description: string;
}

// ============================================================================
// DETECTOR DE PROJETO LOW-LEVEL
// ============================================================================

export function detectLowLevelProject(prompt: string): LowLevelProjectType | null {
  const promptLower = prompt.toLowerCase();
  
  const detectors: Array<{ type: LowLevelProjectType; keywords: string[] }> = [
    {
      type: 'operating_system',
      keywords: [
        'sistema operacional', 'operating system', 'os do zero',
        'criar um os', 'build an os', 'kernel + userspace',
        'bootável', 'bootable', 'multiboot', 'uefi boot'
      ]
    },
    {
      type: 'kernel_module',
      keywords: [
        'kernel module', 'módulo de kernel', 'linux module',
        'loadable kernel', 'lkm', 'kmod', 'insmod', 'modprobe'
      ]
    },
    {
      type: 'device_driver',
      keywords: [
        'device driver', 'driver de dispositivo', 'driver usb',
        'driver pci', 'driver gpu', 'driver de rede', 'char device',
        'block device', 'network driver'
      ]
    },
    {
      type: 'bootloader',
      keywords: [
        'bootloader', 'boot loader', 'uefi', 'bios boot',
        'mbr', 'grub', 'stage1', 'stage2', 'boot sector'
      ]
    },
    {
      type: 'firmware',
      keywords: [
        'firmware', 'embedded', 'microcontroller', 'mcu',
        'bare metal', 'stm32', 'esp32', 'arduino', 'pic',
        'avr', 'cortex-m', 'arm embedded'
      ]
    },
    {
      type: 'rtos',
      keywords: [
        'rtos', 'real-time', 'tempo real', 'freertos',
        'zephyr', 'nuttx', 'scheduler', 'preemptive',
        'deterministic', 'hard real-time', 'soft real-time'
      ]
    },
    {
      type: 'compiler',
      keywords: [
        'compiler', 'compilador', 'transpiler', 'llvm',
        'code generation', 'geração de código', 'backend compiler',
        'frontend compiler', 'lexer', 'parser', 'ast',
        'criar linguagem', 'create language', 'programming language'
      ]
    },
    {
      type: 'interpreter',
      keywords: [
        'interpreter', 'interpretador', 'virtual machine', 'vm',
        'bytecode', 'jit', 'just in time', 'repl',
        'scripting language', 'linguagem de script'
      ]
    },
    {
      type: 'network_stack',
      keywords: [
        'network stack', 'tcp/ip stack', 'pilha de rede',
        'custom protocol', 'protocolo customizado', 'dpdk',
        'zero-copy', 'io_uring', 'raw socket', 'packet processing'
      ]
    },
    {
      type: 'crypto_library',
      keywords: [
        'crypto library', 'biblioteca criptográfica', 'encryption library',
        'implementar aes', 'implementar rsa', 'implementar sha',
        'constant-time', 'side-channel', 'secure implementation'
      ]
    },
    {
      type: 'memory_allocator',
      keywords: [
        'memory allocator', 'alocador de memória', 'malloc implementation',
        'arena allocator', 'pool allocator', 'slab allocator',
        'buddy allocator', 'garbage collector', 'gc implementation'
      ]
    },
    {
      type: 'file_system',
      keywords: [
        'file system', 'sistema de arquivos', 'filesystem',
        'ext4', 'fat32', 'ntfs', 'custom fs', 'fuse',
        'vfs', 'inode', 'block device'
      ]
    },
    {
      type: 'hypervisor',
      keywords: [
        'hypervisor', 'vmm', 'virtual machine monitor',
        'kvm', 'xen', 'vmx', 'svm', 'virtualization',
        'type 1 hypervisor', 'type 2 hypervisor'
      ]
    },
    {
      type: 'debugger',
      keywords: [
        'debugger', 'depurador', 'profiler', 'tracer',
        'ptrace', 'breakpoint', 'watchpoint', 'gdb-like',
        'lldb-like', 'debug symbols', 'dwarf'
      ]
    },
    {
      type: 'emulator',
      keywords: [
        'emulator', 'emulador', 'cpu emulator', 'system emulator',
        'nes emulator', 'gameboy emulator', 'x86 emulator',
        'arm emulator', 'instruction decoder', 'cycle accurate'
      ]
    }
  ];
  
  for (const detector of detectors) {
    if (detector.keywords.some(k => promptLower.includes(k))) {
      return detector.type;
    }
  }
  
  return null;
}

// ============================================================================
// DETECTOR DE LINGUAGEM PRIMÁRIA
// ============================================================================

export function detectPrimaryLanguage(prompt: string, projectType: LowLevelProjectType): PrimaryLanguage {
  const promptLower = prompt.toLowerCase();
  
  // Detecção explícita
  if (promptLower.includes('rust') || promptLower.includes('cargo')) return 'rust';
  if (promptLower.includes('c++') || promptLower.includes('cpp')) return 'cpp';
  if (promptLower.includes('assembly') || promptLower.includes('asm')) return 'assembly';
  if (promptLower.includes('zig')) return 'zig';
  if (promptLower.includes(' go ') || promptLower.includes('golang')) return 'go';
  
  // Recomendação por tipo de projeto
  const recommendations: Record<LowLevelProjectType, PrimaryLanguage> = {
    'operating_system': 'rust',      // Rust para OS modernos
    'kernel_module': 'c',            // C para módulos Linux
    'device_driver': 'c',            // C para drivers
    'bootloader': 'assembly',        // Assembly para boot
    'firmware': 'c',                 // C para firmware
    'rtos': 'c',                     // C para RTOS
    'compiler': 'rust',              // Rust para compiladores
    'interpreter': 'rust',           // Rust para interpreters
    'network_stack': 'rust',         // Rust para networking
    'crypto_library': 'rust',        // Rust para crypto (safety)
    'memory_allocator': 'c',         // C para allocators
    'file_system': 'rust',           // Rust para FS
    'hypervisor': 'rust',            // Rust para hypervisors
    'debugger': 'rust',              // Rust para debuggers
    'emulator': 'rust'               // Rust para emulators
  };
  
  return recommendations[projectType] || 'rust';
}

// ============================================================================
// DETECTOR DE ARQUITETURA ALVO
// ============================================================================

export function detectTargetArchitecture(prompt: string): TargetArchitecture {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('arm64') || promptLower.includes('aarch64')) return 'arm64';
  if (promptLower.includes('riscv') || promptLower.includes('risc-v')) return 'riscv64';
  if (promptLower.includes('wasm') || promptLower.includes('webassembly')) return 'wasm';
  if (promptLower.includes('x86') || promptLower.includes('amd64') || promptLower.includes('intel')) return 'x86_64';
  
  // Default para x86_64 (mais comum para desenvolvimento)
  return 'x86_64';
}

// ============================================================================
// MANIFESTOS POR TIPO DE PROJETO
// ============================================================================

export const LOW_LEVEL_MANIFESTS: Record<LowLevelProjectType, string> = {
  'operating_system': `
═══════════════════════════════════════════════════════════════════════════════
🖥️ MANIFESTO: SISTEMA OPERACIONAL DO ZERO
═══════════════════════════════════════════════════════════════════════════════

COMPONENTES OBRIGATÓRIOS:
1. Bootloader (Stage 1 + Stage 2)
2. Kernel Core (GDT, IDT, Paging)
3. Memory Manager (Physical + Virtual)
4. Process Scheduler
5. Interrupt Handlers
6. System Calls
7. Device Drivers (básicos)
8. File System (básico)
9. Shell (básico)

ESTRUTURA DE ARQUIVOS:
\`\`\`
os/
├── boot/
│   ├── stage1.asm          # MBR/UEFI entry
│   └── stage2.asm          # Kernel loader
├── kernel/
│   ├── main.rs             # Kernel entry
│   ├── gdt.rs              # Global Descriptor Table
│   ├── idt.rs              # Interrupt Descriptor Table
│   ├── memory/
│   │   ├── pmm.rs          # Physical Memory Manager
│   │   └── vmm.rs          # Virtual Memory Manager
│   ├── process/
│   │   ├── scheduler.rs    # Process Scheduler
│   │   └── context.rs      # Context Switching
│   ├── syscall/
│   │   └── handler.rs      # System Call Handler
│   └── drivers/
│       ├── vga.rs          # VGA Text Mode
│       ├── keyboard.rs     # PS/2 Keyboard
│       └── serial.rs       # Serial Port
├── userspace/
│   └── shell/
│       └── main.rs         # Basic Shell
├── Cargo.toml
├── Makefile
├── linker.ld               # Linker Script
└── README.md
\`\`\`

TOOLCHAIN NECESSÁRIA:
- Rust nightly + rust-src
- NASM (assembler)
- QEMU (emulador)
- xorriso (ISO creation)
- grub-mkrescue (bootable ISO)
`,

  'kernel_module': `
═══════════════════════════════════════════════════════════════════════════════
🐧 MANIFESTO: MÓDULO DE KERNEL LINUX
═══════════════════════════════════════════════════════════════════════════════

ESTRUTURA:
\`\`\`
module/
├── src/
│   ├── main.c              # Module entry/exit
│   ├── device.c            # Device operations
│   ├── ioctl.c             # IOCTL handlers
│   └── proc.c              # /proc interface
├── include/
│   └── module.h            # Headers
├── Kbuild                  # Kernel build config
├── Makefile                # Build system
└── README.md
\`\`\`

FUNÇÕES OBRIGATÓRIAS:
- module_init() / module_exit()
- file_operations struct
- Proper error handling
- Mutex/spinlock protection
- Memory allocation (kmalloc/kfree)
`,

  'device_driver': `
═══════════════════════════════════════════════════════════════════════════════
🔌 MANIFESTO: DEVICE DRIVER
═══════════════════════════════════════════════════════════════════════════════

TIPOS DE DRIVER:
- Char Device: /dev/mydevice
- Block Device: /dev/sda
- Network Device: eth0

ESTRUTURA CHAR DEVICE:
\`\`\`c
static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
    .unlocked_ioctl = device_ioctl,
};
\`\`\`
`,

  'bootloader': `
═══════════════════════════════════════════════════════════════════════════════
🚀 MANIFESTO: BOOTLOADER
═══════════════════════════════════════════════════════════════════════════════

FASES:
1. Stage 1 (512 bytes): MBR, carrega Stage 2
2. Stage 2: Modo protegido, carrega kernel
3. Kernel handoff: Passa controle ao kernel

REQUISITOS:
- Real Mode → Protected Mode → Long Mode
- A20 Line enable
- GDT setup
- Paging setup (se 64-bit)
`,

  'firmware': `
═══════════════════════════════════════════════════════════════════════════════
📟 MANIFESTO: FIRMWARE EMBARCADO
═══════════════════════════════════════════════════════════════════════════════

ESTRUTURA:
\`\`\`
firmware/
├── src/
│   ├── main.c              # Entry point
│   ├── hal/                # Hardware Abstraction
│   │   ├── gpio.c
│   │   ├── uart.c
│   │   ├── spi.c
│   │   └── i2c.c
│   ├── drivers/            # Peripheral drivers
│   └── app/                # Application logic
├── include/
├── linker.ld
├── Makefile
└── README.md
\`\`\`

CONSIDERAÇÕES:
- Sem heap (ou heap estático)
- Interrupt-driven
- Low power modes
- Watchdog timer
`,

  'rtos': `
═══════════════════════════════════════════════════════════════════════════════
⏱️ MANIFESTO: SISTEMA REAL-TIME (RTOS)
═══════════════════════════════════════════════════════════════════════════════

COMPONENTES:
1. Scheduler (preemptive, priority-based)
2. Task Management
3. Inter-task Communication (queues, semaphores)
4. Memory Management
5. Timer Services
6. Interrupt Management

GARANTIAS:
- Deterministic response time
- Priority inversion prevention
- Bounded latency
`,

  'compiler': `
═══════════════════════════════════════════════════════════════════════════════
🔨 MANIFESTO: COMPILADOR
═══════════════════════════════════════════════════════════════════════════════

FASES:
1. Lexer → Tokens
2. Parser → AST
3. Semantic Analysis → Typed AST
4. IR Generation → Intermediate Representation
5. Optimization → Optimized IR
6. Code Generation → Target Code

ESTRUTURA:
\`\`\`
compiler/
├── src/
│   ├── lexer/
│   ├── parser/
│   ├── semantic/
│   ├── ir/
│   ├── optimizer/
│   └── codegen/
├── tests/
├── examples/
└── README.md
\`\`\`
`,

  'interpreter': `
═══════════════════════════════════════════════════════════════════════════════
⚡ MANIFESTO: INTERPRETADOR / VM
═══════════════════════════════════════════════════════════════════════════════

COMPONENTES:
1. Lexer + Parser
2. Bytecode Compiler
3. Virtual Machine
4. Garbage Collector (opcional)
5. Standard Library

ESTRUTURA VM:
- Stack-based ou Register-based
- Instruction set design
- Memory model
`,

  'network_stack': `
═══════════════════════════════════════════════════════════════════════════════
🌐 MANIFESTO: NETWORK STACK
═══════════════════════════════════════════════════════════════════════════════

CAMADAS:
1. Link Layer (Ethernet)
2. Network Layer (IP)
3. Transport Layer (TCP/UDP)
4. Application Layer

OTIMIZAÇÕES:
- Zero-copy
- Kernel bypass (DPDK)
- io_uring
- Lock-free structures
`,

  'crypto_library': `
═══════════════════════════════════════════════════════════════════════════════
🔐 MANIFESTO: BIBLIOTECA CRIPTOGRÁFICA
═══════════════════════════════════════════════════════════════════════════════

REQUISITOS:
- Constant-time operations
- No secret-dependent branches
- Memory zeroization
- Side-channel resistance

ALGORITMOS:
- Symmetric: AES-GCM, ChaCha20-Poly1305
- Asymmetric: Ed25519, X25519
- Hash: SHA-256, SHA-3, BLAKE3
- KDF: Argon2id, HKDF
`,

  'memory_allocator': `
═══════════════════════════════════════════════════════════════════════════════
🧠 MANIFESTO: ALOCADOR DE MEMÓRIA
═══════════════════════════════════════════════════════════════════════════════

TIPOS:
- Bump Allocator (simples)
- Free List Allocator
- Buddy Allocator
- Slab Allocator
- Arena Allocator

CONSIDERAÇÕES:
- Fragmentação
- Thread safety
- Cache locality
- Alignment
`,

  'file_system': `
═══════════════════════════════════════════════════════════════════════════════
📁 MANIFESTO: SISTEMA DE ARQUIVOS
═══════════════════════════════════════════════════════════════════════════════

COMPONENTES:
1. Superblock
2. Inode Table
3. Data Blocks
4. Directory Structure
5. Journal (opcional)

OPERAÇÕES:
- create, open, close, read, write
- mkdir, rmdir, readdir
- link, unlink, rename
- stat, chmod, chown
`,

  'hypervisor': `
═══════════════════════════════════════════════════════════════════════════════
🖥️ MANIFESTO: HYPERVISOR
═══════════════════════════════════════════════════════════════════════════════

TIPOS:
- Type 1 (bare-metal): Xen, VMware ESXi
- Type 2 (hosted): VirtualBox, QEMU

COMPONENTES:
1. VMX/SVM initialization
2. VMCS/VMCB management
3. Memory virtualization (EPT/NPT)
4. I/O virtualization
5. Interrupt virtualization
`,

  'debugger': `
═══════════════════════════════════════════════════════════════════════════════
🔍 MANIFESTO: DEBUGGER
═══════════════════════════════════════════════════════════════════════════════

FUNCIONALIDADES:
1. Breakpoints (software/hardware)
2. Watchpoints
3. Single-stepping
4. Register inspection
5. Memory inspection
6. Stack unwinding
7. Symbol resolution

INTERFACE:
- ptrace (Linux)
- Debug API (Windows)
- Mach (macOS)
`,

  'emulator': `
═══════════════════════════════════════════════════════════════════════════════
🎮 MANIFESTO: EMULADOR
═══════════════════════════════════════════════════════════════════════════════

COMPONENTES:
1. CPU Emulation (interpreter/JIT)
2. Memory System
3. I/O Devices
4. Timing/Synchronization
5. Graphics (se aplicável)
6. Audio (se aplicável)

TÉCNICAS:
- Interpretation (simples, lento)
- Dynamic Recompilation (JIT)
- Cached Interpretation
`
};

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class LowLevelArchitect {
  /**
   * Detecta se o prompt é para um projeto de baixo nível
   */
  static isLowLevelProject(prompt: string): boolean {
    return detectLowLevelProject(prompt) !== null;
  }
  
  /**
   * Analisa o prompt e retorna informações do projeto
   */
  static analyzeRequest(prompt: string): LowLevelRequest | null {
    const projectType = detectLowLevelProject(prompt);
    if (!projectType) return null;
    
    return {
      userPrompt: prompt,
      projectType,
      targetArchitecture: detectTargetArchitecture(prompt),
      primaryLanguage: detectPrimaryLanguage(prompt, projectType)
    };
  }
  
  /**
   * Retorna o manifesto apropriado para o tipo de projeto
   */
  static getManifest(projectType: LowLevelProjectType): string {
    return LOW_LEVEL_MANIFESTS[projectType] || '';
  }
  
  /**
   * Gera o prompt enriquecido para o modelo
   */
  static enrichPrompt(request: LowLevelRequest): string {
    const manifest = this.getManifest(request.projectType);
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ⚙️ LOW-LEVEL ARCHITECT MODE ATIVADO ⚙️                                  ║
║                                                                              ║
║     TIPO: ${request.projectType.toUpperCase().replace('_', ' ')}
║     LINGUAGEM: ${request.primaryLanguage.toUpperCase()}
║     ARQUITETURA: ${request.targetArchitecture}
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

${manifest}

═══════════════════════════════════════════════════════════════════════════════
🚨 REGRAS ABSOLUTAS - ANTI-FALLBACK
═══════════════════════════════════════════════════════════════════════════════

1. LINGUAGEM OBRIGATÓRIA: ${request.primaryLanguage.toUpperCase()}
   - NUNCA substitua por JavaScript, TypeScript, Python ou Node.js
   - Se não conseguir gerar em ${request.primaryLanguage}, DIGA EXPLICITAMENTE

2. CÓDIGO REAL:
   - Gere código que COMPILA e FUNCIONA
   - Inclua Makefile/Cargo.toml/build.zig
   - Inclua instruções de compilação

3. ARQUITETURA ${request.targetArchitecture}:
   - Use instruções e convenções corretas
   - Considere endianness, alignment, calling conventions

═══════════════════════════════════════════════════════════════════════════════
📋 PEDIDO DO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════════

${request.userPrompt}

═══════════════════════════════════════════════════════════════════════════════
🚀 GERE O PROJETO COMPLETO AGORA!
═══════════════════════════════════════════════════════════════════════════════
`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LowLevelArchitect;
