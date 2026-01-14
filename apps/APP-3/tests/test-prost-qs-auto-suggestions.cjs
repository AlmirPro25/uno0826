/**
 * 🧪 TESTES: PROST-QS AUTO-SUGGESTIONS
 * 
 * Validar sistema de sugestões automáticas
 */

const assert = require('assert');

// Simulação da classe ProstQSAutoSuggestions
class ProstQSAutoSuggestions {
  static generateSuggestions(auditResult) {
    const suggestions = [];
    const seenCodes = new Set();

    for (const violation of auditResult.violations) {
      if (!seenCodes.has(violation.code)) {
        const suggestion = this.getSuggestion(violation.code);
        if (suggestion) {
          suggestions.push(suggestion);
          seenCodes.add(violation.code);
        }
      }
    }

    suggestions.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return suggestions;
  }

  static generateContextualSuggestions(context) {
    const suggestions = [];

    if (context.score < 30) {
      suggestions.push({
        id: 'COMPLETE_REVIEW',
        severity: 'critical',
        title: 'Revisão Completa Necessária',
      });
    }

    if (context.trend === 'declining') {
      suggestions.push({
        id: 'TREND_ALERT',
        severity: 'high',
        title: 'Tendência de Conformidade Piorando',
      });
    }

    return suggestions;
  }

  static generateSuggestionsReport(suggestions) {
    if (suggestions.length === 0) {
      return '✅ Nenhuma sugestão. Código está conforme!';
    }

    return `
💡 PROST-QS AUTO-SUGGESTIONS REPORT

📊 RESUMO
├─ Total de Sugestões: ${suggestions.length}
├─ Críticas: ${suggestions.filter(s => s.severity === 'critical').length}
├─ Altas: ${suggestions.filter(s => s.severity === 'high').length}
└─ Médias: ${suggestions.filter(s => s.severity === 'medium').length}
`;
  }

  static prioritizeSuggestions(suggestions, maxCount = 5) {
    return suggestions.slice(0, maxCount);
  }

  static calculateImpact(suggestion, currentScore) {
    const severityImpact = {
      critical: 20,
      high: 15,
      medium: 10,
      low: 5,
    };
    return severityImpact[suggestion.severity];
  }

  static getSuggestion(code) {
    const db = {
      'LOCAL_AUTH': {
        id: 'LOCAL_AUTH',
        severity: 'critical',
        title: 'Autenticação Local Detectada',
        estimatedTime: 15,
      },
      'MOCK_PROST_QS': {
        id: 'MOCK_PROST_QS',
        severity: 'critical',
        title: 'Mock PROST-QS Detectado',
        estimatedTime: 20,
      },
      'LOCAL_BILLING': {
        id: 'LOCAL_BILLING',
        severity: 'critical',
        title: 'Billing Local Detectado',
        estimatedTime: 20,
      },
      'MISSING_SDK_IMPORT': {
        id: 'MISSING_SDK_IMPORT',
        severity: 'high',
        title: 'SDK PROST-QS Não Importado',
        estimatedTime: 5,
      },
      'MISSING_SDK_INIT': {
        id: 'MISSING_SDK_INIT',
        severity: 'high',
        title: 'SDK PROST-QS Não Inicializado',
        estimatedTime: 5,
      },
      'MISSING_OFFLINE_HANDLING': {
        id: 'MISSING_OFFLINE_HANDLING',
        severity: 'medium',
        title: 'Tratamento de Kernel Offline Ausente',
        estimatedTime: 10,
      },
    };
    return db[code];
  }
}

// ============================================================================
// TESTES
// ============================================================================

console.log('🧪 INICIANDO TESTES: PROST-QS AUTO-SUGGESTIONS\n');

let testsPassed = 0;
let testsFailed = 0;

// ============================================================================
// SUITE 1: Geração de Sugestões
// ============================================================================

console.log('📋 SUITE 1: Geração de Sugestões');

try {
  const auditResult = {
    violations: [
      { type: 'CRITICAL', code: 'LOCAL_AUTH', message: 'Auth local' },
      { type: 'CRITICAL', code: 'MOCK_PROST_QS', message: 'Mock detectado' },
    ],
    score: 30,
  };

  const suggestions = ProstQSAutoSuggestions.generateSuggestions(auditResult);
  assert(suggestions.length === 2);
  assert(suggestions[0].severity === 'critical');
  console.log('✅ Teste 1.1: Gerar sugestões para violações');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 1.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const auditResult = {
    violations: [
      { type: 'CRITICAL', code: 'LOCAL_AUTH', message: 'Auth local' },
      { type: 'CRITICAL', code: 'LOCAL_AUTH', message: 'Auth local duplicada' },
    ],
    score: 30,
  };

  const suggestions = ProstQSAutoSuggestions.generateSuggestions(auditResult);
  assert(suggestions.length === 1); // Sem duplicatas
  console.log('✅ Teste 1.2: Remover sugestões duplicadas');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 1.2 FALHOU:', error.message);
  testsFailed++;
}

try {
  const auditResult = {
    violations: [
      { type: 'CRITICAL', code: 'LOCAL_AUTH', message: 'Auth local' },
      { type: 'HIGH', code: 'MISSING_SDK_IMPORT', message: 'SDK não importado' },
      { type: 'MEDIUM', code: 'MISSING_OFFLINE_HANDLING', message: 'Sem tratamento offline' },
    ],
    score: 40,
  };

  const suggestions = ProstQSAutoSuggestions.generateSuggestions(auditResult);
  assert(suggestions[0].severity === 'critical');
  assert(suggestions[1].severity === 'high');
  assert(suggestions[2].severity === 'medium');
  console.log('✅ Teste 1.3: Ordenar sugestões por severidade');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 1.3 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 2: Sugestões Contextuais
// ============================================================================

console.log('\n📋 SUITE 2: Sugestões Contextuais');

try {
  const context = {
    violations: [],
    score: 20,
    trend: 'stable',
    recentViolations: [],
    teamPatterns: {},
  };

  const suggestions = ProstQSAutoSuggestions.generateContextualSuggestions(context);
  assert(suggestions.length > 0);
  assert(suggestions.some(s => s.id === 'COMPLETE_REVIEW'));
  console.log('✅ Teste 2.1: Sugerir revisão completa para score baixo');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 2.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const context = {
    violations: [],
    score: 85,
    trend: 'declining',
    recentViolations: [],
    teamPatterns: {},
  };

  const suggestions = ProstQSAutoSuggestions.generateContextualSuggestions(context);
  assert(suggestions.some(s => s.id === 'TREND_ALERT'));
  console.log('✅ Teste 2.2: Alertar sobre tendência piorando');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 2.2 FALHOU:', error.message);
  testsFailed++;
}

try {
  const context = {
    violations: [],
    score: 85,
    trend: 'improving',
    recentViolations: [],
    teamPatterns: {},
  };

  const suggestions = ProstQSAutoSuggestions.generateContextualSuggestions(context);
  assert(suggestions.length === 0);
  console.log('✅ Teste 2.3: Sem sugestões para score alto e tendência boa');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 2.3 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 3: Relatório de Sugestões
// ============================================================================

console.log('\n📋 SUITE 3: Relatório de Sugestões');

try {
  const suggestions = [];
  const report = ProstQSAutoSuggestions.generateSuggestionsReport(suggestions);
  assert(report.includes('Nenhuma sugestão'));
  console.log('✅ Teste 3.1: Relatório para sem sugestões');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 3.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const suggestions = [
    { id: 'LOCAL_AUTH', severity: 'critical', title: 'Auth Local', estimatedTime: 15 },
    { id: 'MISSING_SDK_IMPORT', severity: 'high', title: 'SDK Não Importado', estimatedTime: 5 },
  ];

  const report = ProstQSAutoSuggestions.generateSuggestionsReport(suggestions);
  assert(report.includes('Total de Sugestões: 2'));
  assert(report.includes('Críticas: 1'));
  assert(report.includes('Altas: 1'));
  console.log('✅ Teste 3.2: Relatório com sugestões');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 3.2 FALHOU:', error.message);
  testsFailed++;
}

try {
  const suggestions = [
    { id: 'LOCAL_AUTH', severity: 'critical', title: 'Auth Local', estimatedTime: 15 },
    { id: 'MOCK_PROST_QS', severity: 'critical', title: 'Mock PROST-QS', estimatedTime: 20 },
    { id: 'MISSING_SDK_IMPORT', severity: 'high', title: 'SDK Não Importado', estimatedTime: 5 },
  ];

  const report = ProstQSAutoSuggestions.generateSuggestionsReport(suggestions);
  assert(report.includes('Total de Sugestões: 3'));
  assert(report.includes('Críticas: 2'));
  console.log('✅ Teste 3.3: Relatório com múltiplas sugestões');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 3.3 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 4: Priorização
// ============================================================================

console.log('\n📋 SUITE 4: Priorização de Sugestões');

try {
  const suggestions = [
    { id: 'S1', severity: 'critical' },
    { id: 'S2', severity: 'high' },
    { id: 'S3', severity: 'medium' },
    { id: 'S4', severity: 'low' },
    { id: 'S5', severity: 'low' },
  ];

  const prioritized = ProstQSAutoSuggestions.prioritizeSuggestions(suggestions, 3);
  assert(prioritized.length === 3);
  assert(prioritized[0].id === 'S1');
  console.log('✅ Teste 4.1: Priorizar top 3 sugestões');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 4.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const suggestions = [
    { id: 'S1', severity: 'critical' },
    { id: 'S2', severity: 'high' },
  ];

  const prioritized = ProstQSAutoSuggestions.prioritizeSuggestions(suggestions, 5);
  assert(prioritized.length === 2);
  console.log('✅ Teste 4.2: Priorizar com limite maior que total');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 4.2 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 5: Cálculo de Impacto
// ============================================================================

console.log('\n📋 SUITE 5: Cálculo de Impacto');

try {
  const suggestion = { severity: 'critical' };
  const impact = ProstQSAutoSuggestions.calculateImpact(suggestion, 50);
  assert(impact === 20);
  console.log('✅ Teste 5.1: Impacto crítico = 20');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 5.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const impacts = {
    critical: ProstQSAutoSuggestions.calculateImpact({ severity: 'critical' }, 50),
    high: ProstQSAutoSuggestions.calculateImpact({ severity: 'high' }, 50),
    medium: ProstQSAutoSuggestions.calculateImpact({ severity: 'medium' }, 50),
    low: ProstQSAutoSuggestions.calculateImpact({ severity: 'low' }, 50),
  };

  assert(impacts.critical > impacts.high);
  assert(impacts.high > impacts.medium);
  assert(impacts.medium > impacts.low);
  console.log('✅ Teste 5.2: Impacto ordenado por severidade');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 5.2 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 6: Casos Reais
// ============================================================================

console.log('\n📋 SUITE 6: Casos Reais');

try {
  // Caso: Código com múltiplas violações críticas
  const auditResult = {
    violations: [
      { type: 'CRITICAL', code: 'LOCAL_AUTH', message: 'Auth local' },
      { type: 'CRITICAL', code: 'MOCK_PROST_QS', message: 'Mock detectado' },
      { type: 'CRITICAL', code: 'LOCAL_BILLING', message: 'Billing local' },
      { type: 'HIGH', code: 'MISSING_SDK_IMPORT', message: 'SDK não importado' },
    ],
    score: 20,
  };

  const suggestions = ProstQSAutoSuggestions.generateSuggestions(auditResult);
  const prioritized = ProstQSAutoSuggestions.prioritizeSuggestions(suggestions, 3);

  assert(prioritized.length === 3);
  assert(prioritized.every(s => s.severity === 'critical'));
  console.log('✅ Teste 6.1: Priorizar violações críticas');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 6.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  // Caso: Código conforme
  const auditResult = {
    violations: [],
    score: 95,
  };

  const suggestions = ProstQSAutoSuggestions.generateSuggestions(auditResult);
  assert(suggestions.length === 0);
  console.log('✅ Teste 6.2: Sem sugestões para código conforme');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 6.2 FALHOU:', error.message);
  testsFailed++;
}

try {
  // Caso: Tendência piorando
  const context = {
    violations: [
      { type: 'HIGH', code: 'MISSING_SDK_IMPORT', message: 'SDK não importado' },
    ],
    score: 60,
    trend: 'declining',
    recentViolations: ['LOCAL_AUTH', 'MOCK_PROST_QS'],
    teamPatterns: {},
  };

  const suggestions = ProstQSAutoSuggestions.generateContextualSuggestions(context);
  assert(suggestions.some(s => s.id === 'TREND_ALERT'));
  console.log('✅ Teste 6.3: Alertar sobre tendência piorando');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 6.3 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// RESUMO
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO DOS TESTES');
console.log('='.repeat(80));
console.log(`✅ Testes Passaram: ${testsPassed}`);
console.log(`❌ Testes Falharam: ${testsFailed}`);
console.log(`📈 Taxa de Sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(80));

if (testsFailed === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
  process.exit(0);
} else {
  console.log('\n❌ ALGUNS TESTES FALHARAM\n');
  process.exit(1);
}
