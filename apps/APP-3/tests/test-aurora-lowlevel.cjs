/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🧪 TESTES - AURORA BUILDER + LOW-LEVEL ARCHITECT                        ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DO DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

function detectLowLevelProject(prompt) {
  const promptLower = prompt.toLowerCase();
  
  const detectors = [
    { type: 'operating_system', keywords: ['sistema operacional', 'operating system', 'os do zero', 'criar um os', 'kernel + userspace'] },
    { type: 'kernel_module', keywords: ['kernel module', 'módulo de kernel', 'linux module', 'lkm'] },
    { type: 'device_driver', keywords: ['device driver', 'driver de dispositivo', 'driver usb', 'char device'] },
    { type: 'bootloader', keywords: ['bootloader', 'boot loader', 'uefi', 'bios boot', 'boot sector'] },
    { type: 'firmware', keywords: ['firmware', 'embedded', 'microcontroller', 'bare metal', 'stm32', 'esp32'] },
    { type: 'rtos', keywords: ['rtos', 'real-time', 'freertos', 'zephyr', 'tempo real'] },
    { type: 'compiler', keywords: ['compiler', 'compilador', 'criar linguagem', 'lexer', 'parser', 'ast'] },
    { type: 'interpreter', keywords: ['interpreter', 'interpretador', 'virtual machine', 'bytecode', 'jit'] },
    { type: 'network_stack', keywords: ['network stack', 'tcp/ip stack', 'custom protocol', 'dpdk'] },
    { type: 'crypto_library', keywords: ['crypto library', 'implementar aes', 'implementar sha'] },
    { type: 'memory_allocator', keywords: ['memory allocator', 'alocador de memória', 'malloc implementation'] },
    { type: 'file_system', keywords: ['file system', 'sistema de arquivos', 'filesystem', 'ext4'] },
    { type: 'hypervisor', keywords: ['hypervisor', 'vmm', 'virtual machine monitor', 'kvm'] },
    { type: 'debugger', keywords: ['debugger', 'depurador', 'ptrace', 'breakpoint'] },
    { type: 'emulator', keywords: ['emulator', 'emulador', 'cpu emulator', 'nes emulator'] }
  ];
  
  for (const detector of detectors) {
    if (detector.keywords.some(k => promptLower.includes(k))) {
      return detector.type;
    }
  }
  
  return null;
}

function detectPrimaryLanguage(prompt, projectType) {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('rust')) return 'rust';
  if (promptLower.includes('c++') || promptLower.includes('cpp')) return 'cpp';
  if (promptLower.includes('assembly') || promptLower.includes('asm')) return 'assembly';
  if (promptLower.includes('zig')) return 'zig';
  if (promptLower.includes(' go ') || promptLower.includes('golang')) return 'go';
  
  const recommendations = {
    'operating_system': 'rust',
    'kernel_module': 'c',
    'device_driver': 'c',
    'bootloader': 'assembly',
    'firmware': 'c',
    'rtos': 'c',
    'compiler': 'rust',
    'interpreter': 'rust',
    'network_stack': 'rust',
    'crypto_library': 'rust',
    'memory_allocator': 'c',
    'file_system': 'rust',
    'hypervisor': 'rust',
    'debugger': 'rust',
    'emulator': 'rust'
  };
  
  return recommendations[projectType] || 'rust';
}

function detectTargetArchitecture(prompt) {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('arm64') || promptLower.includes('aarch64')) return 'arm64';
  if (promptLower.includes('riscv') || promptLower.includes('risc-v')) return 'riscv64';
  if (promptLower.includes('wasm') || promptLower.includes('webassembly')) return 'wasm';
  
  return 'x86_64';
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

console.log('\n⚙️ AURORA BUILDER + LOW-LEVEL ARCHITECT - TESTES\n');
console.log('═'.repeat(60));

// ═══════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE TIPO DE PROJETO
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔍 DETECÇÃO DE TIPO DE PROJETO\n');

test('Detecta "sistema operacional do zero"', () => {
  assert.strictEqual(detectLowLevelProject('Criar um sistema operacional do zero'), 'operating_system');
});

test('Detecta "operating system"', () => {
  assert.strictEqual(detectLowLevelProject('Build an operating system from scratch'), 'operating_system');
});

test('Detecta "kernel module"', () => {
  assert.strictEqual(detectLowLevelProject('Criar um kernel module para Linux'), 'kernel_module');
});

test('Detecta "device driver"', () => {
  assert.strictEqual(detectLowLevelProject('Implementar device driver USB'), 'device_driver');
});

test('Detecta "bootloader"', () => {
  assert.strictEqual(detectLowLevelProject('Criar um bootloader UEFI'), 'bootloader');
});

test('Detecta "firmware"', () => {
  assert.strictEqual(detectLowLevelProject('Firmware para ESP32'), 'firmware');
});

test('Detecta "rtos"', () => {
  assert.strictEqual(detectLowLevelProject('Sistema RTOS com FreeRTOS'), 'rtos');
});

test('Detecta "compiler"', () => {
  assert.strictEqual(detectLowLevelProject('Criar um compilador com lexer e parser'), 'compiler');
});

test('Detecta "interpreter"', () => {
  assert.strictEqual(detectLowLevelProject('Implementar um interpretador com bytecode'), 'interpreter');
});

test('Detecta "network stack"', () => {
  assert.strictEqual(detectLowLevelProject('Custom TCP/IP stack'), 'network_stack');
});

test('Detecta "crypto library"', () => {
  assert.strictEqual(detectLowLevelProject('Implementar AES do zero'), 'crypto_library');
});

test('Detecta "memory allocator"', () => {
  assert.strictEqual(detectLowLevelProject('Criar um memory allocator'), 'memory_allocator');
});

test('Detecta "file system"', () => {
  assert.strictEqual(detectLowLevelProject('Implementar um file system'), 'file_system');
});

test('Detecta "hypervisor"', () => {
  assert.strictEqual(detectLowLevelProject('Criar um hypervisor tipo KVM'), 'hypervisor');
});

test('Detecta "debugger"', () => {
  assert.strictEqual(detectLowLevelProject('Implementar um debugger com ptrace'), 'debugger');
});

test('Detecta "emulator"', () => {
  assert.strictEqual(detectLowLevelProject('Criar um emulador de NES'), 'emulator');
});

test('NÃO detecta "website React"', () => {
  assert.strictEqual(detectLowLevelProject('Criar um website com React'), null);
});

test('NÃO detecta "API REST"', () => {
  assert.strictEqual(detectLowLevelProject('Fazer uma API REST em Node.js'), null);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE LINGUAGEM
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔧 DETECÇÃO DE LINGUAGEM\n');

test('Detecta Rust explícito', () => {
  assert.strictEqual(detectPrimaryLanguage('OS em Rust', 'operating_system'), 'rust');
});

test('Detecta C++ explícito', () => {
  assert.strictEqual(detectPrimaryLanguage('Driver em C++', 'device_driver'), 'cpp');
});

test('Detecta Assembly explícito', () => {
  assert.strictEqual(detectPrimaryLanguage('Bootloader em Assembly', 'bootloader'), 'assembly');
});

test('Recomenda Rust para OS', () => {
  assert.strictEqual(detectPrimaryLanguage('Criar um OS', 'operating_system'), 'rust');
});

test('Recomenda C para kernel module', () => {
  assert.strictEqual(detectPrimaryLanguage('Criar kernel module', 'kernel_module'), 'c');
});

test('Recomenda Assembly para bootloader', () => {
  assert.strictEqual(detectPrimaryLanguage('Criar bootloader', 'bootloader'), 'assembly');
});

test('Recomenda C para firmware', () => {
  assert.strictEqual(detectPrimaryLanguage('Criar firmware', 'firmware'), 'c');
});

test('Recomenda Rust para compiler', () => {
  assert.strictEqual(detectPrimaryLanguage('Criar compilador', 'compiler'), 'rust');
});

// ═══════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE ARQUITETURA
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🖥️ DETECÇÃO DE ARQUITETURA\n');

test('Detecta x86_64 por padrão', () => {
  assert.strictEqual(detectTargetArchitecture('Criar um OS'), 'x86_64');
});

test('Detecta ARM64', () => {
  assert.strictEqual(detectTargetArchitecture('OS para ARM64'), 'arm64');
});

test('Detecta RISC-V', () => {
  assert.strictEqual(detectTargetArchitecture('Firmware para RISC-V'), 'riscv64');
});

test('Detecta WebAssembly', () => {
  assert.strictEqual(detectTargetArchitecture('Compilar para WASM'), 'wasm');
});

// ═══════════════════════════════════════════════════════════════════════════════
// CENÁRIOS COMPLETOS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🎯 CENÁRIOS COMPLETOS\n');

test('Cenário: OS em Rust para x86_64', () => {
  const prompt = 'Criar um sistema operacional em Rust para x86_64';
  const type = detectLowLevelProject(prompt);
  const lang = detectPrimaryLanguage(prompt, type);
  const arch = detectTargetArchitecture(prompt);
  
  assert.strictEqual(type, 'operating_system');
  assert.strictEqual(lang, 'rust');
  assert.strictEqual(arch, 'x86_64');
});

test('Cenário: Kernel module em C', () => {
  const prompt = 'Criar um módulo de kernel Linux em C';
  const type = detectLowLevelProject(prompt);
  const lang = detectPrimaryLanguage(prompt, type);
  
  assert.strictEqual(type, 'kernel_module');
  assert.strictEqual(lang, 'c');
});

test('Cenário: Bootloader em Assembly', () => {
  const prompt = 'Criar um bootloader UEFI em Assembly';
  const type = detectLowLevelProject(prompt);
  const lang = detectPrimaryLanguage(prompt, type);
  
  assert.strictEqual(type, 'bootloader');
  assert.strictEqual(lang, 'assembly');
});

test('Cenário: Firmware para ARM64', () => {
  const prompt = 'Firmware bare metal para ARM64';
  const type = detectLowLevelProject(prompt);
  const arch = detectTargetArchitecture(prompt);
  
  assert.strictEqual(type, 'firmware');
  assert.strictEqual(arch, 'arm64');
});

test('Cenário: Compilador em Rust', () => {
  const prompt = 'Criar uma linguagem de programação com lexer e parser em Rust';
  const type = detectLowLevelProject(prompt);
  const lang = detectPrimaryLanguage(prompt, type);
  
  assert.strictEqual(type, 'compiler');
  assert.strictEqual(lang, 'rust');
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
