// test-mobile-detection.js
// Teste do sistema de detecção automática de apps mobile

import { mobileAppDetector } from './services/MobileAppDetector.js';

console.log('🧪 Testando Sistema de Detecção de Apps Mobile\n');
console.log('='.repeat(60));

// Casos de teste
const testCases = [
  // ✅ ALTA CONFIANÇA (deve detectar)
  {
    prompt: 'Crie um app de lista de tarefas',
    expected: true,
    minConfidence: 80
  },
  {
    prompt: 'Preciso de um aplicativo para Android de vendas',
    expected: true,
    minConfidence: 90
  },
  {
    prompt: 'Fazer um app mobile de chat com notificações',
    expected: true,
    minConfidence: 85
  },
  {
    prompt: 'App de calculadora para celular',
    expected: true,
    minConfidence: 90
  },
  {
    prompt: 'Desenvolver aplicativo de fitness com GPS',
    expected: true,
    minConfidence: 85
  },
  
  // ⚠️ MÉDIA CONFIANÇA (pode detectar)
  {
    prompt: 'Interface mobile para gerenciar tarefas',
    expected: true,
    minConfidence: 50
  },
  {
    prompt: 'Tela de login com notificações push',
    expected: true,
    minConfidence: 50
  },
  
  // ❌ BAIXA CONFIANÇA (não deve detectar)
  {
    prompt: 'Crie um site de vendas',
    expected: false,
    minConfidence: 0
  },
  {
    prompt: 'Landing page moderna',
    expected: false,
    minConfidence: 0
  },
  {
    prompt: 'Dashboard administrativo',
    expected: false,
    minConfidence: 0
  }
];

let passed = 0;
let failed = 0;

console.log('\n📋 EXECUTANDO TESTES:\n');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Prompt: "${testCase.prompt}"`);
  
  const result = mobileAppDetector.detectMobileIntent(testCase.prompt);
  
  console.log(`   Detectado: ${result.isMobileApp ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Confiança: ${result.confidence}%`);
  
  if (result.isMobileApp) {
    console.log(`   Nome: ${result.suggestedName}`);
    console.log(`   Package: ${result.suggestedPackage}`);
    console.log(`   Plataforma: ${result.appType || 'Android (padrão)'}`);
    
    if (result.features.length > 0) {
      console.log(`   Features: ${result.features.join(', ')}`);
    }
    
    if (result.keywords.length > 0) {
      console.log(`   Keywords: ${result.keywords.slice(0, 5).join(', ')}...`);
    }
  }
  
  // Validar resultado
  const isCorrect = result.isMobileApp === testCase.expected &&
                    result.confidence >= testCase.minConfidence;
  
  if (isCorrect) {
    console.log(`   ✅ PASSOU`);
    passed++;
  } else {
    console.log(`   ❌ FALHOU (esperado: ${testCase.expected}, confiança >= ${testCase.minConfidence}%)`);
    failed++;
  }
});

// Resumo
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMO DOS TESTES:\n');
console.log(`   ✅ Passou: ${passed}/${testCases.length}`);
console.log(`   ❌ Falhou: ${failed}/${testCases.length}`);
console.log(`   📈 Taxa de sucesso: ${Math.round((passed / testCases.length) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
} else {
  console.log('\n⚠️ Alguns testes falharam. Ajuste a sensibilidade se necessário.\n');
}

// Teste de aprimoramento de prompt
console.log('='.repeat(60));
console.log('\n🎨 TESTE DE APRIMORAMENTO DE PROMPT:\n');

const samplePrompt = 'Crie um app de lista de tarefas';
const intent = mobileAppDetector.detectMobileIntent(samplePrompt);

if (intent.isMobileApp) {
  const enhanced = mobileAppDetector.enhancePromptForMobile(samplePrompt, intent);
  console.log('Prompt Original:');
  console.log(`"${samplePrompt}"\n`);
  console.log('Prompt Aprimorado:');
  console.log(enhanced.split('\n').slice(0, 15).join('\n'));
  console.log('...\n');
}

// Teste de detecção de features
console.log('='.repeat(60));
console.log('\n🔍 TESTE DE DETECÇÃO DE FEATURES:\n');

const featureTests = [
  'App com câmera e GPS',
  'Aplicativo de chat com notificações',
  'App de música com player de áudio',
  'Calculadora simples'
];

featureTests.forEach(prompt => {
  const features = mobileAppDetector.detectFeatures(prompt);
  console.log(`"${prompt}"`);
  console.log(`   Features: ${features.length > 0 ? features.join(', ') : 'Nenhuma'}\n`);
});

console.log('='.repeat(60));
console.log('\n✅ Testes concluídos!\n');
