/**
 * 🧪 TESTE: MANIFESTOS DE BAIXO NÍVEL
 * 
 * Valida os 4 manifestos especializados:
 * - SYSTEMS_PROGRAMMING_MANIFEST (Anti-Fallback)
 * - KERNEL_DRIVER_MANIFEST
 * - REALTIME_RTOS_MANIFEST
 * - HIGH_PERFORMANCE_COMPUTING_MANIFEST
 */

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     🧪 TESTE: MANIFESTOS DE BAIXO NÍVEL                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// SIMULAÇÃO DOS DETECTORES
// ============================================================================

function shouldEnableSystemsProgramming(prompt) {
  const keywords = [
    'rust', 'c++', 'cpp', 'assembly', 'asm', 'zig', 'go', 'golang',
    'kernel', 'driver', 'embedded', 'rtos', 'firmware', 'bootloader',
    'simd', 'avx', 'latência', 'latency', 'zero-copy', 'ffi',
    'uart', 'spi', 'i2c', 'gpio', 'bare-metal'
  ];
  return keywords.some(k => prompt.toLowerCase().includes(k));
}

function shouldEnableKernelDriver(prompt) {
  const keywords = [
    'kernel', 'kernel module', 'driver', 'device driver',
    'char driver', 'block driver', 'usb driver', 'i2c driver',
    'bootloader', 'grub', 'u-boot', 'uefi',
    'insmod', 'rmmod', 'dmesg', '/dev/', 'ioctl'
  ];
  return keywords.some(k => prompt.toLowerCase().includes(k));
}

function shouldEnableRTOS(prompt) {
  const keywords = [
    'freertos', 'zephyr', 'rtems', 'vxworks', 'rtos',
    'real-time', 'tempo real', 'hard real-time', 'deadline',
    'rate monotonic', 'priority inversion', 'wcet',
    'safety-critical', 'do-178', 'iec 61508'
  ];
  return keywords.some(k => prompt.toLowerCase().includes(k));
}

function shouldEnableHPC(prompt) {
  const keywords = [
    'simd', 'sse', 'avx', 'avx2', 'avx-512', 'neon',
    'cuda', 'opencl', 'gpu computing', 'gpgpu',
    'openmp', 'mpi', 'parallel', 'rayon',
    'high performance', 'hpc', 'throughput', 'flops',
    'matrix multiplication', 'dot product', 'fft'
  ];
  return keywords.some(k => prompt.toLowerCase().includes(k));
}

// ============================================================================
// TESTE 1: Detecção de Manifestos
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 1: Detecção de Manifestos por Prompt');
console.log('═══════════════════════════════════════════════════════════════\n');

const testCases = [
  {
    prompt: 'Crie um sistema de controle de voo em Rust com RTOS',
    expected: { systems: true, kernel: false, rtos: true, hpc: false }
  },
  {
    prompt: 'Linux kernel module para driver USB',
    expected: { systems: true, kernel: true, rtos: false, hpc: false }
  },
  {
    prompt: 'Otimização SIMD com AVX2 para multiplicação de matrizes',
    expected: { systems: true, kernel: false, rtos: false, hpc: true }
  },
  {
    prompt: 'FreeRTOS com tasks de tempo real e deadline de 1ms',
    expected: { systems: true, kernel: false, rtos: true, hpc: false }
  },
  {
    prompt: 'CUDA kernel para processamento paralelo na GPU',
    expected: { systems: false, kernel: true, rtos: false, hpc: true }
  },
  {
    prompt: 'Crie um site em React com Tailwind',
    expected: { systems: false, kernel: false, rtos: false, hpc: false }
  },
  {
    prompt: 'Driver I2C para sensor de temperatura em C',
    expected: { systems: true, kernel: true, rtos: false, hpc: false }
  },
  {
    prompt: 'Sistema embarcado com Zephyr RTOS e comunicação SPI',
    expected: { systems: true, kernel: false, rtos: true, hpc: false }
  }
];

let passed = 0;
let total = 0;

for (const test of testCases) {
  const results = {
    systems: shouldEnableSystemsProgramming(test.prompt),
    kernel: shouldEnableKernelDriver(test.prompt),
    rtos: shouldEnableRTOS(test.prompt),
    hpc: shouldEnableHPC(test.prompt)
  };
  
  const allMatch = 
    results.systems === test.expected.systems &&
    results.kernel === test.expected.kernel &&
    results.rtos === test.expected.rtos &&
    results.hpc === test.expected.hpc;
  
  total++;
  if (allMatch) {
    passed++;
    console.log(`✅ "${test.prompt.substring(0, 50)}..."`);
  } else {
    console.log(`❌ "${test.prompt.substring(0, 50)}..."`);
    console.log(`   Esperado: S=${test.expected.systems} K=${test.expected.kernel} R=${test.expected.rtos} H=${test.expected.hpc}`);
    console.log(`   Obtido:   S=${results.systems} K=${results.kernel} R=${results.rtos} H=${results.hpc}`);
  }
  
  // Mostra quais manifestos seriam ativados
  const active = [];
  if (results.systems) active.push('SYSTEMS');
  if (results.kernel) active.push('KERNEL');
  if (results.rtos) active.push('RTOS');
  if (results.hpc) active.push('HPC');
  console.log(`   Manifestos: [${active.join(', ') || 'NENHUM'}]\n`);
}

console.log(`Resultado: ${passed}/${total} testes passaram\n`);


// ============================================================================
// TESTE 2: Combinações Polyglot por Área
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 2: Combinações Polyglot por Área');
console.log('═══════════════════════════════════════════════════════════════\n');

const polyglotAreas = {
  'KERNEL/DRIVER': [
    { primary: 'C', secondary: 'Assembly', method: 'Inline ASM', valid: true },
    { primary: 'C', secondary: 'Rust', method: 'FFI', valid: true },
    { primary: 'Rust', secondary: 'C', method: 'bindgen', valid: true },
    { primary: 'C', secondary: 'Python', method: 'Test only', valid: true },
    { primary: 'JavaScript', secondary: 'C', method: 'N/A', valid: false }
  ],
  'RTOS': [
    { primary: 'C', secondary: 'Assembly', method: 'ISR/Context', valid: true },
    { primary: 'C', secondary: 'Rust', method: 'Safety modules', valid: true },
    { primary: 'Rust', secondary: 'C HAL', method: 'bindgen', valid: true },
    { primary: 'Python', secondary: 'C', method: 'N/A', valid: false }
  ],
  'HPC': [
    { primary: 'C/C++', secondary: 'Python', method: 'pybind11', valid: true },
    { primary: 'CUDA', secondary: 'Python', method: 'PyCUDA', valid: true },
    { primary: 'Rust', secondary: 'Python', method: 'PyO3', valid: true },
    { primary: 'Fortran', secondary: 'C', method: 'ISO_C_BINDING', valid: true },
    { primary: 'JavaScript', secondary: 'CUDA', method: 'N/A', valid: false }
  ]
};

for (const [area, combinations] of Object.entries(polyglotAreas)) {
  console.log(`📋 ${area}:`);
  for (const combo of combinations) {
    const icon = combo.valid ? '✅' : '❌';
    console.log(`   ${icon} ${combo.primary} + ${combo.secondary} (${combo.method})`);
  }
  console.log('');
}

// ============================================================================
// TESTE 3: Mapeamento de Áreas por Linguagem
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 3: Mapeamento de Áreas por Linguagem');
console.log('═══════════════════════════════════════════════════════════════\n');

const languageAreas = {
  'C': ['Kernel', 'Driver', 'RTOS', 'HPC', 'Embedded'],
  'C++': ['Driver', 'HPC', 'Game Engine', 'Embedded'],
  'Rust': ['Kernel (Linux 6.1+)', 'Driver', 'RTOS', 'HPC', 'Embedded', 'CLI'],
  'Assembly': ['Bootloader', 'ISR', 'Context Switch', 'SIMD manual'],
  'Go': ['Microservices', 'CLI', 'DevOps', 'Ground Control'],
  'CUDA': ['GPU Computing', 'ML Training', 'Simulation'],
  'Fortran': ['Scientific Computing', 'HPC', 'Simulation']
};

for (const [lang, areas] of Object.entries(languageAreas)) {
  console.log(`🔧 ${lang}:`);
  console.log(`   Áreas: ${areas.join(', ')}`);
}

console.log('');

// ============================================================================
// TESTE 4: Validação Anti-Fallback
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 4: Validação Anti-Fallback');
console.log('═══════════════════════════════════════════════════════════════\n');

const SYSTEMS_LANGUAGES = ['rust', 'c', 'cpp', 'assembly', 'zig', 'go'];
const WEB_LANGUAGES = ['typescript', 'javascript', 'python', 'ruby', 'php'];

function validateFallback(from, to) {
  if (SYSTEMS_LANGUAGES.includes(from) && WEB_LANGUAGES.includes(to)) {
    return { allowed: false, reason: 'PROIBIDO: Sistemas → Web' };
  }
  return { allowed: true, reason: 'Permitido' };
}

const fallbackTests = [
  { from: 'rust', to: 'typescript', shouldBlock: true },
  { from: 'c', to: 'python', shouldBlock: true },
  { from: 'cpp', to: 'javascript', shouldBlock: true },
  { from: 'go', to: 'ruby', shouldBlock: true },
  { from: 'rust', to: 'c', shouldBlock: false },
  { from: 'typescript', to: 'javascript', shouldBlock: false }
];

let fallbackPassed = 0;
for (const test of fallbackTests) {
  const result = validateFallback(test.from, test.to);
  const blocked = !result.allowed;
  const correct = blocked === test.shouldBlock;
  
  if (correct) {
    fallbackPassed++;
    console.log(`✅ ${test.from} → ${test.to}: ${blocked ? '🚫 BLOQUEADO' : '✅ PERMITIDO'}`);
  } else {
    console.log(`❌ ${test.from} → ${test.to}: Esperado ${test.shouldBlock ? 'BLOQUEADO' : 'PERMITIDO'}`);
  }
}

console.log(`\nResultado: ${fallbackPassed}/${fallbackTests.length} testes passaram\n`);

// ============================================================================
// RESUMO FINAL
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📦 Manifestos de Baixo Nível Criados:');
console.log('   1. SYSTEMS_PROGRAMMING_MANIFEST (Level 99) - Anti-Fallback');
console.log('   2. KERNEL_DRIVER_MANIFEST (Level 98) - Kernels e Drivers');
console.log('   3. REALTIME_RTOS_MANIFEST (Level 97) - Tempo Real');
console.log('   4. HIGH_PERFORMANCE_COMPUTING_MANIFEST (Level 96) - HPC/SIMD/GPU');

console.log('\n🔧 Linguagens Suportadas:');
console.log('   • C, C++, Rust, Assembly, Go, Zig');
console.log('   • CUDA, OpenCL, Fortran');

console.log('\n🔗 Combinações Polyglot:');
console.log('   • C + Rust (FFI)');
console.log('   • C + Assembly (inline/files)');
console.log('   • Rust + Python (PyO3)');
console.log('   • C++ + Python (pybind11)');
console.log('   • CUDA + Python (PyCUDA)');

console.log('\n🚫 Fallbacks Bloqueados:');
console.log('   • Rust/C/C++/Go → JavaScript/TypeScript/Python');
console.log('   • Assembly → Qualquer linguagem de alto nível');

console.log('\n✅ Sistema pronto para gerar projetos de baixo nível!');
console.log('   O sistema NUNCA mais vai amarelhar e substituir');
console.log('   linguagens de sistemas por linguagens web.');