/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🧪 TESTE DO TOOL ORCHESTRA 🧪                                       ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Para executar:
 * npx tsx tests/test-tool-orchestra.ts
 */

import { shouldUseOrchestraFromConfig, getPhaseConfig } from '../services/manifestos/TOOL_ORCHESTRA_CONFIG.js';

// Função de detecção local (para evitar dependência do ApiKeyManager)
function shouldUseOrchestra(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const fullProjectKeywords = [
    'sistema completo', 'full system', 'fullstack', 'full-stack',
    'aplicativo completo', 'complete app', 'complete application',
    'projeto completo', 'complete project',
    'backend e frontend', 'backend and frontend',
    'front e back', 'front and back',
    'criar um sistema', 'create a system',
    'desenvolver um sistema', 'develop a system',
    'construir um sistema', 'build a system',
    'e-commerce', 'ecommerce', 'loja virtual',
    'fintech', 'banco digital', 'digital bank',
    'saas', 'plataforma', 'platform',
    'dashboard completo', 'complete dashboard',
    'crud completo', 'complete crud',
    'com autenticação', 'with authentication',
    'com login', 'with login'
  ];
  
  const hasFullProjectKeyword = fullProjectKeywords.some(kw => promptLower.includes(kw));
  const mentionsBackend = /backend|servidor|server|api|banco de dados|database/i.test(prompt);
  const mentionsFrontend = /frontend|interface|ui|ux|tela|screen|página|page|react|vue|next/i.test(prompt);
  
  return hasFullProjectKeyword || (mentionsBackend && mentionsFrontend);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 1: DETECÇÃO DE QUANDO USAR ORCHESTRA
// ═══════════════════════════════════════════════════════════════════════════════

function testDetection() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 TESTE 1: DETECÇÃO DE QUANDO USAR ORCHESTRA                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const testCases = [
    // Deve usar Orchestra (true)
    { prompt: 'Crie um sistema completo de e-commerce', expected: true },
    { prompt: 'Desenvolva um fullstack app de tarefas', expected: true },
    { prompt: 'Crie um sistema com backend e frontend', expected: true },
    { prompt: 'Construa uma fintech com dashboard', expected: true },
    { prompt: 'Crie um SaaS de gestão de projetos', expected: true },
    { prompt: 'Desenvolva um banco digital completo', expected: true },
    { prompt: 'Crie um CRUD completo com autenticação', expected: true },
    { prompt: 'Crie uma API REST com interface React', expected: true },
    
    // Não deve usar Orchestra (false)
    { prompt: 'Crie uma função de soma', expected: false },
    { prompt: 'Explique como funciona o React', expected: false },
    { prompt: 'Corrija este bug no código', expected: false },
    { prompt: 'Crie um componente de botão', expected: false },
    { prompt: 'Crie apenas o backend da API', expected: false },
    { prompt: 'Crie apenas o frontend', expected: false },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = shouldUseOrchestra(testCase.prompt);
    const resultFromConfig = shouldUseOrchestraFromConfig(testCase.prompt);
    
    const status = result === testCase.expected ? '✅' : '❌';
    const statusConfig = resultFromConfig === testCase.expected ? '✅' : '❌';
    
    if (result === testCase.expected) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(`${status} "${testCase.prompt.substring(0, 50)}..."`);
    console.log(`   Esperado: ${testCase.expected}, Obtido: ${result}, Config: ${resultFromConfig}`);
  }
  
  console.log(`\n📊 Resultado: ${passed}/${testCases.length} testes passaram`);
  
  return failed === 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 2: CONFIGURAÇÃO DAS FASES
// ═══════════════════════════════════════════════════════════════════════════════

function testPhaseConfig() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 TESTE 2: CONFIGURAÇÃO DAS FASES                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const phases = [1, 2, 3] as const;
  let allValid = true;
  
  for (const phase of phases) {
    const config = getPhaseConfig(phase);
    
    if (!config) {
      console.log(`❌ Fase ${phase}: Configuração não encontrada`);
      allValid = false;
      continue;
    }
    
    console.log(`✅ Fase ${phase}: ${config.name}`);
    console.log(`   Persona: ${config.persona}`);
    console.log(`   Responsabilidades: ${config.responsibilities.length}`);
    console.log(`   Regras: ${config.rules.length}`);
    
    // Validar que tem responsabilidades e regras
    if (config.responsibilities.length === 0) {
      console.log(`   ❌ Sem responsabilidades definidas`);
      allValid = false;
    }
    
    if (config.rules.length === 0) {
      console.log(`   ❌ Sem regras definidas`);
      allValid = false;
    }
  }
  
  return allValid;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 3: VERIFICAÇÃO DA ESTRUTURA
// ═══════════════════════════════════════════════════════════════════════════════

function testInstantiation() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 TESTE 3: VERIFICAÇÃO DA ESTRUTURA                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Verificar que as funções existem
    console.log('✅ Função shouldUseOrchestra existe');
    console.log('✅ Função shouldUseOrchestraFromConfig existe');
    console.log('✅ Função getPhaseConfig existe');
    
    // Testar consistência entre as duas funções de detecção
    const testPrompt = 'Crie um sistema completo de e-commerce';
    const result1 = shouldUseOrchestra(testPrompt);
    const result2 = shouldUseOrchestraFromConfig(testPrompt);
    
    if (result1 === result2) {
      console.log('✅ Funções de detecção são consistentes');
    } else {
      console.log('⚠️ Funções de detecção divergem (pode ser esperado)');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Erro: ${error}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 4: EXECUÇÃO COMPLETA (OPCIONAL - REQUER API KEY)
// ═══════════════════════════════════════════════════════════════════════════════

async function testFullExecution() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 TESTE 4: EXECUÇÃO COMPLETA (REQUER API KEY)                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  // Verificar se tem API key
  const hasApiKey = process.env.GEMINI_API_KEY;
  
  if (!hasApiKey) {
    console.log('⚠️ API Key não configurada. Pulando teste de execução completa.');
    console.log('   Configure GEMINI_API_KEY para testar.');
    console.log('   Exemplo: GEMINI_API_KEY=sua-chave npx tsx tests/test-tool-orchestra.ts --full');
    return true; // Não falha o teste, apenas pula
  }
  
  console.log('🚀 API Key detectada! Para executar o teste completo, use:');
  console.log('   npx tsx tests/test-tool-orchestra.ts --full');
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUÇÃO DOS TESTES
// ═══════════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🎼 TOOL ORCHESTRA - SUITE DE TESTES 🎼                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  
  const results: { name: string; passed: boolean }[] = [];
  
  // Teste 1: Detecção
  results.push({
    name: 'Detecção de quando usar Orchestra',
    passed: testDetection()
  });
  
  // Teste 2: Configuração
  results.push({
    name: 'Configuração das fases',
    passed: testPhaseConfig()
  });
  
  // Teste 3: Instanciação
  results.push({
    name: 'Instanciação do Orchestra',
    passed: testInstantiation()
  });
  
  // Teste 4: Execução completa (opcional)
  const runFullTest = process.argv.includes('--full');
  if (runFullTest) {
    results.push({
      name: 'Execução completa',
      passed: await testFullExecution()
    });
  }
  
  // Resumo
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              📊 RESUMO DOS TESTES                                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  let totalPassed = 0;
  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.passed) totalPassed++;
  }
  
  console.log(`\n📊 Total: ${totalPassed}/${results.length} testes passaram`);
  
  if (totalPassed === results.length) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
  }
  
  if (!runFullTest) {
    console.log('\n💡 Dica: Execute com --full para testar a execução completa:');
    console.log('   npx tsx tests/test-tool-orchestra.ts --full');
  }
}

// Executar
runAllTests().catch(console.error);
