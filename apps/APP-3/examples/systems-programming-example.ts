/**
 * 🚀 EXEMPLO: SYSTEMS PROGRAMMING MANIFEST EM AÇÃO
 * 
 * Este exemplo demonstra como o manifesto anti-fallback funciona
 * para garantir que linguagens de sistemas sejam respeitadas.
 */

import {
  AntiFallbackValidator,
  SystemsRequirementDetector,
  SystemsProjectGenerator,
  LANGUAGE_CLASSIFICATIONS,
  VALID_POLYGLOT_COMBINATIONS,
  PROJECT_TEMPLATES,
  shouldEnableSystemsProgramming,
  type SystemLanguage,
  type SystemsAnalysis
} from '../services/manifestos/SYSTEMS_PROGRAMMING_MANIFEST.js';

// ============================================================================
// EXEMPLO 1: Validação de Fallback
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('EXEMPLO 1: Validação de Fallback');
console.log('═══════════════════════════════════════════════════════════════\n');

// Cenário: Usuário pede Rust, sistema tenta entregar TypeScript
const fallbackCheck = AntiFallbackValidator.isFallbackProhibited('rust', 'typescript');
console.log('Tentativa: Rust → TypeScript');
console.log(`Resultado: ${fallbackCheck.prohibited ? '🚫 BLOQUEADO' : '✅ PERMITIDO'}`);
console.log(`Razão: ${fallbackCheck.reason}\n`);

// Cenário: Rust → C (permitido, mesmo tier)
const validFallback = AntiFallbackValidator.isFallbackProhibited('rust', 'c');
console.log('Tentativa: Rust → C');
console.log(`Resultado: ${validFallback.prohibited ? '🚫 BLOQUEADO' : '✅ PERMITIDO'}`);
console.log(`Razão: ${validFallback.reason}\n`);

// ============================================================================
// EXEMPLO 2: Análise de Requisitos de Sistemas
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('EXEMPLO 2: Análise de Requisitos de Sistemas');
console.log('═══════════════════════════════════════════════════════════════\n');

const prompts = [
  'Crie um sistema de controle de voo em Rust com RTOS e latência < 1ms',
  'Kernel Linux module em C para driver de sensor UART',
  'API REST em TypeScript com Express',
  'Game engine em C++ com física SIMD/AVX'
];

for (const prompt of prompts) {
  console.log(`📝 Prompt: "${prompt}"`);
  const analysis = SystemsRequirementDetector.analyze(prompt);
  
  console.log(`   Requer Sistemas: ${analysis.requiresSystemsLanguage ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Linguagens: [${analysis.detectedLanguages.join(', ')}]`);
  console.log(`   Performance: [${analysis.performanceRequirements.join(', ')}]`);
  console.log(`   Hardware: [${analysis.hardwareRequirements.join(', ')}]`);
  console.log(`   Fallback Permitido: ${analysis.fallbackAllowed ? '✅' : '🚫'}`);
  
  if (analysis.suggestedStack) {
    console.log(`   Stack: ${analysis.suggestedStack.primary}`);
  }
  console.log('');
}


// ============================================================================
// EXEMPLO 3: Geração de Estrutura de Projeto
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('EXEMPLO 3: Geração de Estrutura de Projeto');
console.log('═══════════════════════════════════════════════════════════════\n');

const templates = ['rust-cli', 'cpp-systems', 'c-embedded', 'go-microservice'];

for (const templateKey of templates) {
  const project = SystemsProjectGenerator.generateStructure(templateKey);
  
  if (project) {
    console.log(`📦 Template: ${templateKey}`);
    console.log(`   Nome: ${project.name}`);
    console.log(`   Linguagens: [${project.languages.join(', ')}]`);
    console.log(`   Build: ${project.buildCommand}`);
    console.log(`   Arquivos: ${Object.keys(project.files).length}`);
    console.log('');
  }
}

// ============================================================================
// EXEMPLO 4: Combinações Polyglot Válidas
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('EXEMPLO 4: Combinações Polyglot Válidas');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Combinações que SÃO integração (não fallback):');
for (const combo of VALID_POLYGLOT_COMBINATIONS.slice(0, 6)) {
  console.log(`   ✅ ${combo.primary} + [${combo.secondary.join(', ')}]`);
  console.log(`      Método: ${combo.interopMethod}`);
  console.log(`      Casos: ${combo.useCases.slice(0, 2).join(', ')}`);
  console.log('');
}

// ============================================================================
// EXEMPLO 5: Uso Prático - Validação de Stack Polyglot
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('EXEMPLO 5: Validação de Stack Polyglot');
console.log('═══════════════════════════════════════════════════════════════\n');

// Stack válida: Rust + Python via PyO3
const validStack = AntiFallbackValidator.validatePolyglotStack('rust', ['python']);
console.log('Stack: Rust + Python');
console.log(`   Válida: ${validStack.valid ? '✅ SIM' : '❌ NÃO'}`);
if (validStack.warnings.length > 0) {
  console.log(`   Warnings: ${validStack.warnings.join(', ')}`);
}
console.log('');

// Stack com problema: Rust substituído por TypeScript
const invalidStack = AntiFallbackValidator.validatePolyglotStack('typescript', ['rust']);
console.log('Stack: TypeScript + Rust (invertida)');
console.log(`   Válida: ${invalidStack.valid ? '✅ SIM' : '❌ NÃO'}`);
if (invalidStack.errors.length > 0) {
  console.log(`   Erros: ${invalidStack.errors.length}`);
}

// ============================================================================
// EXEMPLO 6: Detecção Automática para Orchestrator
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('EXEMPLO 6: Detecção Automática para Orchestrator');
console.log('═══════════════════════════════════════════════════════════════\n');

const testPrompts = [
  'Crie um app em React',
  'Sistema de controle de voo em Rust',
  'Kernel module em C',
  'API REST em Node.js',
  'Driver UART para STM32',
  'Game engine com SIMD',
  'Site com Tailwind CSS',
  'Sistema embarcado com FreeRTOS'
];

for (const prompt of testPrompts) {
  const shouldActivate = shouldEnableSystemsProgramming(prompt);
  console.log(`${shouldActivate ? '🚀' : '🌐'} "${prompt}"`);
  console.log(`   → ${shouldActivate ? 'SYSTEMS_PROGRAMMING_MANIFEST ativado' : 'Manifesto padrão'}`);
}

// ============================================================================
// RESUMO
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📋 RESUMO DO SYSTEMS PROGRAMMING MANIFEST');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('🔥 Regras Anti-Fallback:');
console.log('   • Rust/C/C++/Go/Zig → NUNCA fallback para JS/Python');
console.log('   • Se não conseguir gerar, DIZER EXPLICITAMENTE');
console.log('   • Código que precisa de compilador É VÁLIDO');
console.log('');

console.log('🔗 Combinações Polyglot Permitidas:');
console.log('   • Rust + Python (PyO3)');
console.log('   • Rust + TypeScript (napi-rs/WASM)');
console.log('   • C++ + Python (pybind11)');
console.log('   • Go + Rust (gRPC)');
console.log('');

console.log('📦 Templates Disponíveis:');
console.log(`   • ${Object.keys(PROJECT_TEMPLATES).length} templates prontos`);
console.log('   • Cada um com Dockerfile e build system');
console.log('');

console.log('✅ O sistema agora NUNCA mais vai amarelhar!');
console.log('   Quando pedir Rust, recebe Rust.');
console.log('   Quando pedir C++, recebe C++.');
console.log('   Sem substituições silenciosas.');