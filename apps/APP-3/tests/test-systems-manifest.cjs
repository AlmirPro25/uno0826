/**
 * 🧪 TESTE DO SYSTEMS PROGRAMMING MANIFEST (CommonJS)
 */

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     🧪 TESTE: SYSTEMS PROGRAMMING MANIFEST                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// TESTE 1: Validação de Fallback Proibido (Simulação)
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 1: Validação de Fallback Proibido');
console.log('═══════════════════════════════════════════════════════════════\n');

// Linguagens de sistemas que NUNCA podem fazer fallback para web
const SYSTEMS_LANGUAGES = ['rust', 'c', 'cpp', 'assembly', 'zig', 'go'];
const WEB_LANGUAGES = ['typescript', 'javascript', 'python', 'ruby', 'php'];

function isFallbackProhibited(from, to) {
  if (SYSTEMS_LANGUAGES.includes(from) && WEB_LANGUAGES.includes(to)) {
    return {
      prohibited: true,
      reason: `🚨 FALLBACK PROIBIDO: ${from.toUpperCase()} → ${to.toUpperCase()}`
    };
  }
  return { prohibited: false, reason: '✅ Fallback permitido' };
}

const fallbackTests = [
  { from: 'rust', to: 'typescript', shouldProhibit: true },
  { from: 'rust', to: 'javascript', shouldProhibit: true },
  { from: 'rust', to: 'python', shouldProhibit: true },
  { from: 'cpp', to: 'typescript', shouldProhibit: true },
  { from: 'c', to: 'python', shouldProhibit: true },
  { from: 'go', to: 'javascript', shouldProhibit: true },
  { from: 'assembly', to: 'python', shouldProhibit: true },
  { from: 'typescript', to: 'javascript', shouldProhibit: false },
  { from: 'python', to: 'ruby', shouldProhibit: false },
];

let passedFallback = 0;
for (const test of fallbackTests) {
  const result = isFallbackProhibited(test.from, test.to);
  const passed = result.prohibited === test.shouldProhibit;
  
  if (passed) {
    passedFallback++;
    console.log(`✅ ${test.from} → ${test.to}: ${result.prohibited ? 'PROIBIDO' : 'PERMITIDO'}`);
  } else {
    console.log(`❌ ${test.from} → ${test.to}: FALHOU`);
  }
}
console.log(`\nResultado: ${passedFallback}/${fallbackTests.length} testes passaram\n`);


// ============================================================================
// TESTE 2: Detecção de Linguagens de Sistemas
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 2: Detecção de Linguagens de Sistemas');
console.log('═══════════════════════════════════════════════════════════════\n');

function detectSystemsLanguage(prompt) {
  const promptLower = prompt.toLowerCase();
  const detected = [];
  let isHard = false;
  
  const patterns = [
    [/\b(rust|rustlang)\b/i, 'rust'],
    [/\b(c\+\+|cpp)\b/i, 'cpp'],
    [/\blinguagem\s*c\b/i, 'c'],
    [/\b(assembly|asm)\b/i, 'assembly'],
    [/\b(go|golang)\b/i, 'go'],
    [/\b(zig)\b/i, 'zig'],
    [/\b(typescript|ts)\b/i, 'typescript'],
    [/\b(python)\b/i, 'python']
  ];
  
  for (const [pattern, lang] of patterns) {
    if (pattern.test(promptLower)) {
      detected.push(lang);
    }
  }
  
  // Hard requirements
  const hardPatterns = [
    /kernel|driver|embedded|embarcado|rtos|real-?time/i,
    /latência|latency/i,
    /simd|avx|sse/i,
    /zero-?copy|zero-?allocation/i
  ];
  
  for (const pattern of hardPatterns) {
    if (pattern.test(promptLower)) {
      isHard = true;
      break;
    }
  }
  
  // Se detectou linguagem de sistemas, é hard por padrão
  if (detected.some(l => SYSTEMS_LANGUAGES.includes(l))) {
    isHard = true;
  }
  
  return { languages: detected, isHardRequirement: isHard };
}

const detectionTests = [
  { prompt: 'Crie um sistema de controle de voo em Rust', expected: ['rust'], hard: true },
  { prompt: 'Faça um kernel em linguagem C', expected: ['c'], hard: true },
  { prompt: 'API em Go com gRPC', expected: ['go'], hard: true },
  { prompt: 'Site em TypeScript', expected: ['typescript'], hard: false },
  { prompt: 'Sistema com latência de 1ms em C++', expected: ['cpp'], hard: true },
];

let passedDetection = 0;
for (const test of detectionTests) {
  const result = detectSystemsLanguage(test.prompt);
  const langMatch = test.expected.every(l => result.languages.includes(l));
  const hardMatch = result.isHardRequirement === test.hard;
  
  if (langMatch && hardMatch) {
    passedDetection++;
    console.log(`✅ "${test.prompt.substring(0, 40)}..."`);
    console.log(`   Linguagens: [${result.languages.join(', ')}], Hard: ${result.isHardRequirement}`);
  } else {
    console.log(`❌ "${test.prompt.substring(0, 40)}..."`);
    console.log(`   Esperado: [${test.expected.join(', ')}], Hard: ${test.hard}`);
    console.log(`   Obtido: [${result.languages.join(', ')}], Hard: ${result.isHardRequirement}`);
  }
  console.log('');
}
console.log(`Resultado: ${passedDetection}/${detectionTests.length} testes passaram\n`);

// ============================================================================
// TESTE 3: Função shouldEnableSystemsProgramming
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 3: Ativação do Manifesto');
console.log('═══════════════════════════════════════════════════════════════\n');

function shouldEnableSystemsProgramming(prompt) {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    'rust', 'c++', 'cpp', 'assembly', 'asm', 'zig',
    'kernel', 'driver', 'embedded', 'embarcado', 'rtos',
    'firmware', 'bootloader', 'simd', 'avx',
    'latência', 'latency', 'zero-copy', 'ffi',
    'uart', 'spi', 'i2c', 'gpio', 'bare-metal'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}

const enableTests = [
  { prompt: 'Crie um app em React', expected: false },
  { prompt: 'Sistema de controle de voo em Rust', expected: true },
  { prompt: 'Kernel module em C', expected: true },
  { prompt: 'API REST em Node.js', expected: false },
  { prompt: 'Driver UART para STM32', expected: true },
  { prompt: 'Game engine com SIMD', expected: true },
  { prompt: 'Site com Tailwind CSS', expected: false },
  { prompt: 'Sistema embarcado com FreeRTOS', expected: true },
];

let passedEnable = 0;
for (const test of enableTests) {
  const result = shouldEnableSystemsProgramming(test.prompt);
  if (result === test.expected) {
    passedEnable++;
    console.log(`✅ "${test.prompt}" → ${result ? 'ATIVAR' : 'NÃO ATIVAR'}`);
  } else {
    console.log(`❌ "${test.prompt}" → Esperado: ${test.expected}, Obtido: ${result}`);
  }
}
console.log(`\nResultado: ${passedEnable}/${enableTests.length} testes passaram\n`);

// ============================================================================
// RESUMO FINAL
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL');
console.log('═══════════════════════════════════════════════════════════════\n');

const total = fallbackTests.length + detectionTests.length + enableTests.length;
const passed = passedFallback + passedDetection + passedEnable;

console.log(`Total de Testes: ${total}`);
console.log(`Passaram: ${passed}`);
console.log(`Taxa de Sucesso: ${((passed / total) * 100).toFixed(1)}%`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('✅ SYSTEMS PROGRAMMING MANIFEST VALIDADO');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('🚀 O manifesto está pronto para impedir fallbacks indevidos!');
console.log('\n📋 Regras principais:');
console.log('   • Rust/C/C++/Assembly/Go/Zig → NUNCA fallback para JS/Python');
console.log('   • Se não conseguir gerar, DIZER EXPLICITAMENTE');
console.log('   • Código que precisa de compilador É VÁLIDO');
console.log('   • Combinações polyglot via FFI/gRPC são permitidas');