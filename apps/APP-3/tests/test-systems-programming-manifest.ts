/**
 * 🧪 TESTE DO SYSTEMS PROGRAMMING MANIFEST
 * 
 * Valida as regras anti-fallback e detecção de requisitos de sistemas
 */

import {
  AntiFallbackValidator,
  SystemsRequirementDetector,
  SystemsProjectGenerator,
  LANGUAGE_CLASSIFICATIONS,
  VALID_POLYGLOT_COMBINATIONS,
  PROJECT_TEMPLATES,
  shouldEnableSystemsProgramming
} from '../services/manifestos/SYSTEMS_PROGRAMMING_MANIFEST.js';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     🧪 TESTE: SYSTEMS PROGRAMMING MANIFEST                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// TESTE 1: Validação de Fallback Proibido
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 1: Validação de Fallback Proibido');
console.log('═══════════════════════════════════════════════════════════════\n');

const fallbackTests = [
  { from: 'rust', to: 'typescript', shouldProhibit: true },
  { from: 'rust', to: 'javascript', shouldProhibit: true },
  { from: 'rust', to: 'python', shouldProhibit: true },
  { from: 'rust', to: 'c', shouldProhibit: false },
  { from: 'rust', to: 'cpp', shouldProhibit: false },
  { from: 'cpp', to: 'typescript', shouldProhibit: true },
  { from: 'cpp', to: 'rust', shouldProhibit: false },
  { from: 'c', to: 'python', shouldProhibit: true },
  { from: 'go', to: 'javascript', shouldProhibit: true },
  { from: 'assembly', to: 'python', shouldProhibit: true },
  { from: 'typescript', to: 'javascript', shouldProhibit: false },
  { from: 'python', to: 'ruby', shouldProhibit: false },
] as const;

let passedFallback = 0;
let failedFallback = 0;

for (const test of fallbackTests) {
  const result = AntiFallbackValidator.isFallbackProhibited(test.from, test.to);
  const passed = result.prohibited === test.shouldProhibit;
  
  if (passed) {
    passedFallback++;
    console.log(`✅ ${test.from} → ${test.to}: ${result.prohibited ? 'PROIBIDO' : 'PERMITIDO'}`);
  } else {
    failedFallback++;
    console.log(`❌ ${test.from} → ${test.to}: Esperado ${test.shouldProhibit ? 'PROIBIDO' : 'PERMITIDO'}, ` +
                `obteve ${result.prohibited ? 'PROIBIDO' : 'PERMITIDO'}`);
  }
}

console.log(`\nResultado: ${passedFallback}/${fallbackTests.length} testes passaram\n`);


// ============================================================================
// TESTE 2: Detecção de Linguagens de Sistemas
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 2: Detecção de Linguagens de Sistemas');
console.log('═══════════════════════════════════════════════════════════════\n');

const detectionTests = [
  {
    prompt: 'Crie um sistema de controle de voo em Rust',
    expectedLanguages: ['rust'],
    expectedHard: true
  },
  {
    prompt: 'Faça um kernel em C com scheduler',
    expectedLanguages: ['c'],
    expectedHard: true
  },
  {
    prompt: 'Quero uma API em Go com gRPC',
    expectedLanguages: ['go'],
    expectedHard: true
  },
  {
    prompt: 'Crie um site em React com TypeScript',
    expectedLanguages: ['typescript'],
    expectedHard: false
  },
  {
    prompt: 'Sistema embarcado com latência de 1ms em C++',
    expectedLanguages: ['cpp'],
    expectedHard: true
  },
  {
    prompt: 'Driver UART em Assembly x86_64',
    expectedLanguages: ['assembly'],
    expectedHard: true
  },
  {
    prompt: 'Microservices: Go para API, Rust para worker',
    expectedLanguages: ['go', 'rust'],
    expectedHard: true
  }
];

let passedDetection = 0;
let failedDetection = 0;

for (const test of detectionTests) {
  const result = AntiFallbackValidator.detectSystemsLanguageRequest(test.prompt);
  
  const languagesMatch = test.expectedLanguages.every(l => result.languages.includes(l as any));
  const hardMatch = result.isHardRequirement === test.expectedHard;
  const passed = languagesMatch && hardMatch;
  
  if (passed) {
    passedDetection++;
    console.log(`✅ "${test.prompt.substring(0, 50)}..."`);
    console.log(`   Linguagens: [${result.languages.join(', ')}], Hard: ${result.isHardRequirement}`);
  } else {
    failedDetection++;
    console.log(`❌ "${test.prompt.substring(0, 50)}..."`);
    console.log(`   Esperado: [${test.expectedLanguages.join(', ')}], Hard: ${test.expectedHard}`);
    console.log(`   Obtido: [${result.languages.join(', ')}], Hard: ${result.isHardRequirement}`);
  }
  console.log('');
}

console.log(`Resultado: ${passedDetection}/${detectionTests.length} testes passaram\n`);

// ============================================================================
// TESTE 3: Análise Completa de Requisitos
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 3: Análise Completa de Requisitos');
console.log('═══════════════════════════════════════════════════════════════\n');

const analysisTests = [
  'Crie um sistema de controle de voo em Rust com RTOS e latência < 1ms',
  'Kernel Linux module em C para driver de sensor',
  'Game engine em C++ com SIMD/AVX para física',
  'API REST em TypeScript com Express',
  'Sistema embarcado para ESP32 em Rust'
];

for (const prompt of analysisTests) {
  console.log(`📝 Prompt: "${prompt}"`);
  const analysis = SystemsRequirementDetector.analyze(prompt);
  
  console.log(`   Requer Sistemas: ${analysis.requiresSystemsLanguage ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Linguagens: [${analysis.detectedLanguages.join(', ')}]`);
  console.log(`   Performance: [${analysis.performanceRequirements.join(', ')}]`);
  console.log(`   Hardware: [${analysis.hardwareRequirements.join(', ')}]`);
  console.log(`   Fallback Permitido: ${analysis.fallbackAllowed ? '✅' : '🚫'}`);
  
  if (analysis.suggestedStack) {
    console.log(`   Stack Sugerida: ${analysis.suggestedStack.primary} + [${analysis.suggestedStack.secondary.join(', ')}]`);
    console.log(`   Razão: ${analysis.suggestedStack.reasoning}`);
  }
  
  if (analysis.warnings.length > 0) {
    console.log(`   ⚠️ Warnings: ${analysis.warnings.join(', ')}`);
  }
  
  console.log('');
}

// ============================================================================
// TESTE 4: Geração de Estrutura de Projeto
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 4: Geração de Estrutura de Projeto');
console.log('═══════════════════════════════════════════════════════════════\n');

const templates = ['rust-cli', 'cpp-systems', 'c-embedded', 'go-microservice'];

for (const templateKey of templates) {
  const project = SystemsProjectGenerator.generateStructure(templateKey);
  
  if (project) {
    console.log(`📦 Template: ${templateKey}`);
    console.log(`   Nome: ${project.name}`);
    console.log(`   Linguagens: [${project.languages.join(', ')}]`);
    console.log(`   Build: ${project.buildCommand}`);
    console.log(`   Arquivos gerados: ${Object.keys(project.files).length}`);
    console.log('');
  }
}

// ============================================================================
// TESTE 5: Função shouldEnableSystemsProgramming
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 5: Função shouldEnableSystemsProgramming');
console.log('═══════════════════════════════════════════════════════════════\n');

const enableTests = [
  { prompt: 'Crie um app em React', expected: false },
  { prompt: 'Sistema de controle de voo em Rust', expected: true },
  { prompt: 'Kernel module em C', expected: true },
  { prompt: 'API REST em Node.js', expected: false },
  { prompt: 'Driver UART para STM32', expected: true },
  { prompt: 'Game engine com SIMD', expected: true },
  { prompt: 'Site com Tailwind CSS', expected: false },
  { prompt: 'Sistema embarcado com FreeRTOS', expected: true },
  { prompt: 'Latência de 100 microsegundos', expected: true },
  { prompt: 'Zero-copy buffer management', expected: true }
];

let passedEnable = 0;

for (const test of enableTests) {
  const result = shouldEnableSystemsProgramming(test.prompt);
  const passed = result === test.expected;
  
  if (passed) {
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

const totalTests = fallbackTests.length + detectionTests.length + enableTests.length;
const totalPassed = passedFallback + passedDetection + passedEnable;

console.log(`Total de Testes: ${totalTests}`);
console.log(`Passaram: ${totalPassed}`);
console.log(`Falharam: ${totalTests - totalPassed}`);
console.log(`Taxa de Sucesso: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('✅ SYSTEMS PROGRAMMING MANIFEST VALIDADO');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📋 Classificações de Linguagens:', Object.keys(LANGUAGE_CLASSIFICATIONS).length);
console.log('🔗 Combinações Polyglot Válidas:', VALID_POLYGLOT_COMBINATIONS.length);
console.log('📦 Templates de Projeto:', Object.keys(PROJECT_TEMPLATES).length);

console.log('\n🚀 O manifesto está pronto para impedir fallbacks indevidos!');