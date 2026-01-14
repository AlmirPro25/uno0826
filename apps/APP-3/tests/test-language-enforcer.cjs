/**
 * 🧪 TESTE: LANGUAGE ENFORCER - O POLICIAL DE LINGUAGEM
 * 
 * Valida que o sistema detecta e BLOQUEIA fallbacks proibidos:
 * - Rust → TypeScript = CRIME
 * - C++ → Node.js = CRIME
 * - Go → JavaScript = CRIME
 */

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     👮 TESTE: LANGUAGE ENFORCER                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// SIMULAÇÃO DO LANGUAGE ENFORCER
// ============================================================================

const SYSTEMS_LANGUAGES = ['rust', 'c', 'cpp', 'assembly', 'go', 'zig', 'cuda', 'fortran'];
const WEB_LANGUAGES = ['typescript', 'javascript', 'python', 'ruby', 'php'];

const LANGUAGE_ALIASES = {
  'rust': 'rust', 'rustlang': 'rust',
  'c': 'c', 'clang': 'c',
  'c++': 'cpp', 'cpp': 'cpp', 'cplusplus': 'cpp',
  'assembly': 'assembly', 'asm': 'assembly',
  'go': 'go', 'golang': 'go',
  'zig': 'zig',
  'typescript': 'typescript', 'ts': 'typescript',
  'javascript': 'javascript', 'js': 'javascript', 'node': 'javascript', 'node.js': 'javascript', 'nodejs': 'javascript',
  'python': 'python', 'py': 'python'
};

function normalizeLanguage(lang) {
  return LANGUAGE_ALIASES[lang.toLowerCase().trim()] || null;
}

function extractRequirements(prompt) {
  const requirements = [];
  const promptLower = prompt.toLowerCase();
  
  // Padrões para detectar requisitos
  const patterns = [
    { regex: /\b(em|in|using|usando|com|with)\s+(rust|c\+\+|cpp|golang|go|assembly|asm|zig|c(?!\+\+|#))\b/gi, hard: true },
    { regex: /\b(núcleo|core|engine|kernel|driver)\s+(em|in)\s+(rust|c\+\+|cpp|c|go|assembly)\b/gi, hard: true },
    { regex: /\b(backend|frontend|api|flight.?core|ground.?control|quantum.?core)\s+(em|in)\s+(\w+)\b/gi, hard: true }
  ];
  
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(promptLower)) !== null) {
      const langStr = match[match.length - 1] || match[2];
      const lang = normalizeLanguage(langStr);
      
      if (lang && SYSTEMS_LANGUAGES.includes(lang)) {
        requirements.push({
          language: lang,
          component: extractComponent(match[0]),
          isHardRequirement: pattern.hard,
          reason: `Detectado: "${match[0]}"`
        });
      }
    }
  }
  
  return requirements;
}

function extractComponent(match) {
  if (/backend/i.test(match)) return 'backend';
  if (/core|engine|núcleo/i.test(match)) return 'core';
  if (/flight/i.test(match)) return 'flight_core';
  if (/ground/i.test(match)) return 'ground_control';
  if (/quantum/i.test(match)) return 'quantum_core';
  return 'general';
}

function detectFallback(requested, delivered) {
  if (SYSTEMS_LANGUAGES.includes(requested) && WEB_LANGUAGES.includes(delivered)) {
    return { isFallback: true, severity: 'CRITICAL' };
  }
  if (requested !== delivered && SYSTEMS_LANGUAGES.includes(requested)) {
    return { isFallback: true, severity: 'HIGH' };
  }
  return { isFallback: false, severity: 'NONE' };
}

function enforce(prompt, architecture) {
  const violations = [];
  const warnings = [];
  
  const requirements = extractRequirements(prompt);
  
  if (requirements.length === 0) {
    return { passed: true, violations: [], verdict: 'APPROVED', action: 'PROCEED' };
  }
  
  // Analisar arquitetura gerada
  const generatedLangs = new Map();
  
  if (architecture.backend_stack?.language) {
    generatedLangs.set('backend', normalizeLanguage(architecture.backend_stack.language));
  }
  if (architecture.quantum_core?.language) {
    generatedLangs.set('quantum_core', normalizeLanguage(architecture.quantum_core.language));
  }
  if (architecture.flight_core?.language) {
    generatedLangs.set('flight_core', normalizeLanguage(architecture.flight_core.language));
  }
  if (architecture.ground_control?.language) {
    generatedLangs.set('ground_control', normalizeLanguage(architecture.ground_control.language));
  }
  
  // Verificar violações
  for (const req of requirements) {
    if (!req.isHardRequirement) continue;
    
    const componentLang = generatedLangs.get(req.component) || generatedLangs.get('backend');
    
    if (!componentLang) {
      warnings.push(`Componente "${req.component}" não encontrado`);
      continue;
    }
    
    const fallback = detectFallback(req.language, componentLang);
    
    if (fallback.isFallback && fallback.severity === 'CRITICAL') {
      violations.push({
        component: req.component,
        requested: req.language,
        delivered: componentLang,
        severity: 'CRITICAL',
        message: `FALLBACK PROIBIDO: ${req.language} → ${componentLang}`
      });
    }
  }
  
  const hasCritical = violations.some(v => v.severity === 'CRITICAL');
  
  return {
    passed: violations.length === 0,
    violations,
    warnings,
    verdict: hasCritical ? 'REJECTED' : 'APPROVED',
    action: hasCritical ? 'REGENERATE' : 'PROCEED'
  };
}

// ============================================================================
// TESTE 1: Extração de Requisitos
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 1: Extração de Requisitos do Prompt');
console.log('═══════════════════════════════════════════════════════════════\n');

const promptTests = [
  {
    prompt: 'Crie um sistema de HFT com núcleo em Rust e API em Go',
    expectedLangs: ['rust', 'go'],
    expectedComponents: ['core', 'general']
  },
  {
    prompt: 'Flight Core em Rust com RTOS, Ground Control em Go',
    expectedLangs: ['rust', 'go'],
    expectedComponents: ['flight_core', 'ground_control']
  },
  {
    prompt: 'Backend em C++ com simulação de hardware',
    expectedLangs: ['cpp'],
    expectedComponents: ['backend']
  },
  {
    prompt: 'Quantum Core usando Rust para processamento de baixa latência',
    expectedLangs: ['rust'],
    expectedComponents: ['quantum_core']
  },
  {
    prompt: 'Crie um site em React com Tailwind',
    expectedLangs: [],
    expectedComponents: []
  }
];

let passed1 = 0;
for (const test of promptTests) {
  const reqs = extractRequirements(test.prompt);
  const detectedLangs = reqs.map(r => r.language);
  
  const langsMatch = test.expectedLangs.every(l => detectedLangs.includes(l));
  
  if (langsMatch && detectedLangs.length === test.expectedLangs.length) {
    console.log(`✅ "${test.prompt.substring(0, 50)}..."`);
    console.log(`   Linguagens: [${detectedLangs.join(', ')}]`);
    passed1++;
  } else {
    console.log(`❌ "${test.prompt.substring(0, 50)}..."`);
    console.log(`   Esperado: [${test.expectedLangs.join(', ')}]`);
    console.log(`   Obtido: [${detectedLangs.join(', ')}]`);
  }
}

console.log(`\nResultado: ${passed1}/${promptTests.length} testes passaram\n`);

// ============================================================================
// TESTE 2: Detecção de Fallback
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 2: Detecção de Fallback Proibido');
console.log('═══════════════════════════════════════════════════════════════\n');

const fallbackTests = [
  { requested: 'rust', delivered: 'typescript', expectedSeverity: 'CRITICAL' },
  { requested: 'rust', delivered: 'javascript', expectedSeverity: 'CRITICAL' },
  { requested: 'cpp', delivered: 'python', expectedSeverity: 'CRITICAL' },
  { requested: 'go', delivered: 'javascript', expectedSeverity: 'CRITICAL' },
  { requested: 'c', delivered: 'typescript', expectedSeverity: 'CRITICAL' },
  { requested: 'rust', delivered: 'rust', expectedSeverity: 'NONE' },
  { requested: 'rust', delivered: 'cpp', expectedSeverity: 'HIGH' },
  { requested: 'typescript', delivered: 'javascript', expectedSeverity: 'NONE' }
];

let passed2 = 0;
for (const test of fallbackTests) {
  const result = detectFallback(test.requested, test.delivered);
  
  if (result.severity === test.expectedSeverity) {
    const icon = result.severity === 'CRITICAL' ? '🚨' : (result.severity === 'NONE' ? '✅' : '⚠️');
    console.log(`✅ ${test.requested} → ${test.delivered}: ${icon} ${result.severity}`);
    passed2++;
  } else {
    console.log(`❌ ${test.requested} → ${test.delivered}: Esperado ${test.expectedSeverity}, obtido ${result.severity}`);
  }
}

console.log(`\nResultado: ${passed2}/${fallbackTests.length} testes passaram\n`);

// ============================================================================
// TESTE 3: Enforcement Completo (Cenário CHRONOS-QUANTUM)
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 3: Enforcement Completo - Cenário CHRONOS-QUANTUM');
console.log('═══════════════════════════════════════════════════════════════\n');

// Cenário 1: O que foi PEDIDO vs O que foi ENTREGUE (caso real)
const chronosPrompt = 'Crie um sistema de HFT CHRONOS-QUANTUM com quantum_core em Rust e backend em Go';

const chronosArchitectureBad = {
  backend_stack: { language: 'Node.js', framework: 'Express.js' },
  quantum_core: { language: 'TypeScript' }
};

const chronosArchitectureGood = {
  backend_stack: { language: 'Go', framework: 'Gin' },
  quantum_core: { language: 'Rust' }
};

console.log('📋 Prompt: "' + chronosPrompt + '"');
console.log('');

// Teste com arquitetura RUIM (fallback para Node.js)
console.log('🔴 Cenário A: Sistema "amarelou" e entregou Node.js');
const resultBad = enforce(chronosPrompt, chronosArchitectureBad);
console.log(`   Veredicto: ${resultBad.verdict}`);
console.log(`   Ação: ${resultBad.action}`);
if (resultBad.violations.length > 0) {
  console.log('   Violações:');
  for (const v of resultBad.violations) {
    console.log(`      🚨 ${v.component}: ${v.requested} → ${v.delivered}`);
  }
}

const test3a = resultBad.verdict === 'REJECTED' && resultBad.action === 'REGENERATE';
console.log(`   ${test3a ? '✅' : '❌'} Enforcer ${test3a ? 'BLOQUEOU' : 'NÃO BLOQUEOU'} corretamente`);

console.log('');

// Teste com arquitetura BOA (Rust + Go)
console.log('🟢 Cenário B: Sistema entregou Rust + Go corretamente');
const resultGood = enforce(chronosPrompt, chronosArchitectureGood);
console.log(`   Veredicto: ${resultGood.verdict}`);
console.log(`   Ação: ${resultGood.action}`);

const test3b = resultGood.verdict === 'APPROVED' && resultGood.action === 'PROCEED';
console.log(`   ${test3b ? '✅' : '❌'} Enforcer ${test3b ? 'APROVOU' : 'NÃO APROVOU'} corretamente`);

console.log('');

// ============================================================================
// TESTE 4: Cenário Flight Control (Foguete)
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE 4: Cenário Flight Control (Foguete)');
console.log('═══════════════════════════════════════════════════════════════\n');

const rocketPrompt = 'Crie um sistema de controle de voo com Flight Core em Rust com RTOS e Ground Control em Go';

const rocketArchitectureBad = {
  backend_stack: { language: 'Node.js', framework: 'Express' },
  flight_core: { language: 'TypeScript' },
  ground_control: { language: 'JavaScript' }
};

const rocketArchitectureGood = {
  flight_core: { language: 'Rust' },
  ground_control: { language: 'Go' }
};

console.log('📋 Prompt: "' + rocketPrompt.substring(0, 60) + '..."');
console.log('');

console.log('🔴 Cenário A: Entregou Node.js/TypeScript');
const rocketBad = enforce(rocketPrompt, rocketArchitectureBad);
console.log(`   Veredicto: ${rocketBad.verdict} | Ação: ${rocketBad.action}`);
const test4a = rocketBad.verdict === 'REJECTED';
console.log(`   ${test4a ? '✅' : '❌'} Enforcer ${test4a ? 'BLOQUEOU' : 'NÃO BLOQUEOU'}`);

console.log('');

console.log('🟢 Cenário B: Entregou Rust + Go');
const rocketGood = enforce(rocketPrompt, rocketArchitectureGood);
console.log(`   Veredicto: ${rocketGood.verdict} | Ação: ${rocketGood.action}`);
const test4b = rocketGood.verdict === 'APPROVED';
console.log(`   ${test4b ? '✅' : '❌'} Enforcer ${test4b ? 'APROVOU' : 'NÃO APROVOU'}`);

// ============================================================================
// RESUMO FINAL
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL');
console.log('═══════════════════════════════════════════════════════════════\n');

const totalPassed = passed1 + passed2 + (test3a ? 1 : 0) + (test3b ? 1 : 0) + (test4a ? 1 : 0) + (test4b ? 1 : 0);
const totalTests = promptTests.length + fallbackTests.length + 4;

console.log('👮 LANGUAGE ENFORCER:');
console.log('   Função: Policial de Linguagem - Protocolo NO-FALLBACK');
console.log('   Modo: TOLERÂNCIA ZERO');

console.log('\n🚨 REGRAS ENFORCED:');
console.log('   • Rust → TypeScript = CRIME (REGENERATE)');
console.log('   • C++ → Node.js = CRIME (REGENERATE)');
console.log('   • Go → JavaScript = CRIME (REGENERATE)');
console.log('   • Assembly → Python = CRIME (REGENERATE)');

console.log('\n✅ AÇÕES DO ENFORCER:');
console.log('   • APPROVED + PROCEED: Geração correta, continuar');
console.log('   • REJECTED + REGENERATE: Fallback detectado, refazer');
console.log('   • REJECTED + ABORT: Falha crítica, parar');

console.log(`\n📈 Taxa de Sucesso: ${totalPassed}/${totalTests} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('👮 "SE PEDIU RUST, TEM QUE SER RUST. NODE.JS É CRIME."');
console.log('═══════════════════════════════════════════════════════════════');
