/**
 * 🔧 TEST RUNNER - LOW LEVEL SYSTEMS MANIFEST
 * Executa testes de validação do manifesto
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     LOW LEVEL SYSTEMS - TEST SUITE                            ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function expect(value) {
  return {
    toBeDefined: () => {
      if (value === undefined) throw new Error('Expected value to be defined');
    },
    toBe: (expected) => {
      if (value !== expected) throw new Error(`Expected ${expected}, got ${value}`);
    },
    toContain: (substring) => {
      if (!value.includes(substring)) throw new Error(`Expected to contain "${substring}"`);
    },
    toBeGreaterThan: (num) => {
      if (value <= num) throw new Error(`Expected ${value} to be greater than ${num}`);
    }
  };
}

// Load manifest
const manifestPath = path.join(__dirname, '../services/manifestos/LOW_LEVEL_SYSTEMS_MANIFEST.ts');
const manifestContent = fs.readFileSync(manifestPath, 'utf-8');

console.log('📁 Manifest loaded:', manifestPath);
console.log(`📊 Size: ${manifestContent.length} characters`);
console.log('');

// Tests
console.log('🧪 Running tests...\n');

test('Manifest file exists', () => {
  expect(fs.existsSync(manifestPath)).toBe(true);
});

test('Manifest has substantial content', () => {
  expect(manifestContent.length).toBeGreaterThan(5000);
});

test('Contains DIRETIVA PRIMÁRIA', () => {
  expect(manifestContent).toContain('DIRETIVA PRIMÁRIA');
});

test('Contains O ARSENAL DO BAIXO NÍVEL', () => {
  expect(manifestContent).toContain('O ARSENAL DO BAIXO NÍVEL');
});

test('Contains LEIS INVIOLÁVEIS', () => {
  expect(manifestContent).toContain('LEIS INVIOLÁVEIS');
});

test('Contains C language examples', () => {
  expect(manifestContent).toContain('\\`\\`\\`c');
});

test('Contains C++ examples', () => {
  expect(manifestContent).toContain('\\`\\`\\`cpp');
});

test('Contains Assembly examples', () => {
  expect(manifestContent).toContain('\\`\\`\\`asm');
});

test('Contains Rust examples', () => {
  expect(manifestContent).toContain('\\`\\`\\`rust');
});

test('Contains Makefile examples', () => {
  expect(manifestContent).toContain('\\`\\`\\`makefile');
});

test('Contains GDB references', () => {
  expect(manifestContent).toContain('GDB');
});

test('Contains Valgrind references', () => {
  expect(manifestContent).toContain('Valgrind');
});

test('Contains x86_64 architecture', () => {
  expect(manifestContent).toContain('x86_64');
});

test('Contains ARM64 architecture', () => {
  expect(manifestContent).toContain('ARM64');
});

test('Contains RISC-V architecture', () => {
  expect(manifestContent).toContain('RISC-V');
});

test('Contains Buffer Overflow protection', () => {
  expect(manifestContent).toContain('Buffer Overflow');
});

test('Contains Memory Leak detection', () => {
  expect(manifestContent).toContain('Memory Leak');
});

test('Contains Stack Canary', () => {
  expect(manifestContent).toContain('Stack Canary');
});

test('Contains ROADMAP DE APRENDIZADO', () => {
  expect(manifestContent).toContain('ROADMAP DE APRENDIZADO');
});

test('Contains Dockerfile configuration', () => {
  expect(manifestContent).toContain('Dockerfile');
});

test('Contains EXEMPLOS AVANÇADOS section', () => {
  expect(manifestContent).toContain('EXEMPLOS AVANÇADOS');
});

test('Contains SIMD references', () => {
  expect(manifestContent).toContain('SIMD');
});

test('Contains AVX references', () => {
  expect(manifestContent).toContain('AVX');
});

test('Contains FreeRTOS references', () => {
  expect(manifestContent).toContain('FreeRTOS');
});

test('Contains Linux Kernel Module references', () => {
  expect(manifestContent).toContain('Linux Kernel Module');
});

// Check advanced examples exist
console.log('\n📂 Checking advanced examples...\n');

const advancedExamples = [
  'examples/advanced/assembly_x86_64.asm',
  'examples/advanced/assembly_main.c',
  'examples/advanced/simd_avx_example.c',
  'examples/advanced/linux_kernel_module.c',
  'examples/advanced/freertos_example.c',
  'examples/advanced/Makefile'
];

advancedExamples.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  test(`Advanced example exists: ${file}`, () => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
  });
});

// Check steering file
const steeringPath = path.join(__dirname, '../.kiro/steering/low-level-systems-master.md');
test('Steering file exists', () => {
  if (!fs.existsSync(steeringPath)) {
    throw new Error('Steering file not found');
  }
});

const steeringContent = fs.readFileSync(steeringPath, 'utf-8');
test('Steering file contains SIMD keywords', () => {
  expect(steeringContent).toContain('SIMD');
});

test('Steering file contains FreeRTOS keywords', () => {
  expect(steeringContent).toContain('FreeRTOS');
});

test('Steering file contains advanced examples list', () => {
  expect(steeringContent).toContain('examples/advanced');
});

// Summary
console.log('\n════════════════════════════════════════════════════════════════');
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
console.log('════════════════════════════════════════════════════════════════');

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
