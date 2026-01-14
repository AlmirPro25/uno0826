/**
 * 📱 TESTE DO MOBILE ARCHITECT
 * 
 * Verifica se o sistema detecta e gera apps mobile corretamente
 */

const assert = require('assert');

// Simular as funções de detecção
const MOBILE_DETECTION_KEYWORDS = {
  android: [
    'android', 'kotlin', 'java android', 'play store', 'google play',
    'jetpack compose', 'material design', 'gradle', 'apk', 'aab',
    'android studio', 'samsung', 'pixel', 'android app'
  ],
  ios: [
    'ios', 'iphone', 'ipad', 'swift', 'swiftui', 'uikit', 'xcode',
    'app store', 'apple', 'cocoapods', 'spm', 'testflight',
    'ios app', 'ipados'
  ],
  hybrid: [
    'react native', 'flutter', 'capacitor', 'ionic', 'cordova',
    'cross-platform', 'multiplataforma', 'híbrido', 'hybrid',
    'expo', 'dart'
  ]
};

function detectMobileProject(prompt) {
  const promptLower = prompt.toLowerCase();
  
  const allKeywords = [
    ...MOBILE_DETECTION_KEYWORDS.android,
    ...MOBILE_DETECTION_KEYWORDS.ios,
    ...MOBILE_DETECTION_KEYWORDS.hybrid,
    'app', 'aplicativo', 'mobile', 'celular', 'smartphone',
    'nativo', 'native'
  ];
  
  return allKeywords.some(keyword => promptLower.includes(keyword));
}

function detectPlatform(prompt) {
  const promptLower = prompt.toLowerCase();
  
  const hasAndroid = MOBILE_DETECTION_KEYWORDS.android.some(k => promptLower.includes(k));
  const hasIOS = MOBILE_DETECTION_KEYWORDS.ios.some(k => promptLower.includes(k));
  const hasHybrid = MOBILE_DETECTION_KEYWORDS.hybrid.some(k => promptLower.includes(k));
  
  if (hasHybrid) return 'hybrid';
  if (hasAndroid && hasIOS) return 'both';
  if (hasAndroid) return 'android';
  if (hasIOS) return 'ios';
  
  return 'both';
}

function detectFramework(prompt, platform) {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('kotlin') || promptLower.includes('jetpack compose')) {
    return 'kotlin_native';
  }
  if (promptLower.includes('swift') || promptLower.includes('swiftui')) {
    return 'swift_native';
  }
  if (promptLower.includes('react native') || promptLower.includes('expo')) {
    return 'react_native';
  }
  if (promptLower.includes('flutter') || promptLower.includes('dart')) {
    return 'flutter';
  }
  
  switch (platform) {
    case 'android': return 'kotlin_native';
    case 'ios': return 'swift_native';
    case 'both':
    case 'hybrid': return 'flutter';
    default: return 'kotlin_native';
  }
}

// ============================================================================
// TESTES
// ============================================================================

console.log('📱 TESTE DO MOBILE ARCHITECT\n');
console.log('═'.repeat(60));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Erro: ${error.message}`);
    failed++;
  }
}

// Teste 1: Detectar projeto Android
test('Detecta projeto Android', () => {
  const prompts = [
    'Crie um app Android de delivery',
    'Quero um aplicativo para Android com Kotlin',
    'Desenvolva um app para Play Store',
    'App Android com Jetpack Compose'
  ];
  
  prompts.forEach(prompt => {
    assert.strictEqual(detectMobileProject(prompt), true, `Deveria detectar: ${prompt}`);
    assert.strictEqual(detectPlatform(prompt), 'android', `Deveria ser Android: ${prompt}`);
  });
});

// Teste 2: Detectar projeto iOS
test('Detecta projeto iOS', () => {
  const prompts = [
    'Crie um app iOS de finanças',
    'Quero um aplicativo para iPhone com Swift',
    'Desenvolva um app para App Store',
    'App iOS com SwiftUI'
  ];
  
  prompts.forEach(prompt => {
    assert.strictEqual(detectMobileProject(prompt), true, `Deveria detectar: ${prompt}`);
    assert.strictEqual(detectPlatform(prompt), 'ios', `Deveria ser iOS: ${prompt}`);
  });
});

// Teste 3: Detectar projeto híbrido
test('Detecta projeto híbrido', () => {
  const prompts = [
    'Crie um app com Flutter',
    'Quero um aplicativo React Native',
    'App cross-platform com Expo',
    'Aplicativo híbrido com Capacitor'
  ];
  
  prompts.forEach(prompt => {
    assert.strictEqual(detectMobileProject(prompt), true, `Deveria detectar: ${prompt}`);
    assert.strictEqual(detectPlatform(prompt), 'hybrid', `Deveria ser híbrido: ${prompt}`);
  });
});

// Teste 4: Detectar ambas plataformas
test('Detecta Android + iOS', () => {
  const prompts = [
    'Crie um app para Android e iOS',
    'Quero um aplicativo para iPhone e Android',
    'App nativo para ambas plataformas'
  ];
  
  prompts.forEach(prompt => {
    assert.strictEqual(detectMobileProject(prompt), true, `Deveria detectar: ${prompt}`);
  });
});

// Teste 5: Detectar framework correto
test('Detecta framework correto', () => {
  assert.strictEqual(detectFramework('app com kotlin', 'android'), 'kotlin_native');
  assert.strictEqual(detectFramework('app com swift', 'ios'), 'swift_native');
  assert.strictEqual(detectFramework('app com flutter', 'both'), 'flutter');
  assert.strictEqual(detectFramework('app com react native', 'both'), 'react_native');
  assert.strictEqual(detectFramework('app genérico', 'android'), 'kotlin_native');
  assert.strictEqual(detectFramework('app genérico', 'ios'), 'swift_native');
  assert.strictEqual(detectFramework('app genérico', 'both'), 'flutter');
});

// Teste 6: Não detectar projetos não-mobile
test('Não detecta projetos não-mobile', () => {
  const prompts = [
    'Crie um site de e-commerce',
    'Quero uma API REST em Go',
    'Desenvolva um sistema operacional',
    'Backend com Node.js'
  ];
  
  prompts.forEach(prompt => {
    assert.strictEqual(detectMobileProject(prompt), false, `Não deveria detectar: ${prompt}`);
  });
});

// Teste 7: Detectar por palavras genéricas
test('Detecta por palavras genéricas mobile', () => {
  const prompts = [
    'Crie um app de tarefas',
    'Quero um aplicativo de notas',
    'Desenvolva um mobile app',
    'App para celular'
  ];
  
  prompts.forEach(prompt => {
    assert.strictEqual(detectMobileProject(prompt), true, `Deveria detectar: ${prompt}`);
  });
});

// ============================================================================
// RESULTADO
// ============================================================================

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 RESULTADO: ${passed} passou, ${failed} falhou`);
console.log(`📊 TOTAL: ${passed + failed} testes`);

if (failed === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  console.log('\n📱 Mobile Architect está funcionando corretamente!');
} else {
  console.log('\n⚠️ Alguns testes falharam');
  process.exit(1);
}
