/**
 * 🧪 TESTE DE INTEGRAÇÃO DO ENTERPRISE PIPELINE
 * 
 * Testa a detecção automática de complexidade e o sistema de multi-chamadas.
 */

import { analyzeComplexity } from '../services/EnterprisePipelineIntegration.js';
import { pipelineEvents, PIPELINE_PHASES } from '../services/PipelineEvents.js';

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧪 TESTE DE INTEGRAÇÃO - ENTERPRISE PIPELINE                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 1: Detecção de Complexidade
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📊 TESTE 1: Detecção de Complexidade\n');

const testPrompts = [
  {
    prompt: 'Crie uma landing page simples',
    expectedMode: 1,
    description: 'Projeto simples'
  },
  {
    prompt: 'Crie um formulário de contato básico',
    expectedMode: 1,
    description: 'Projeto básico'
  },
  {
    prompt: 'Crie um e-commerce com carrinho e checkout',
    expectedMode: 3,
    description: 'E-commerce médio'
  },
  {
    prompt: 'Crie um SaaS de gestão de projetos com dashboard, assinaturas e multi-tenant',
    expectedMode: 4,
    description: 'SaaS complexo'
  },
  {
    prompt: 'Crie uma fintech completa com PIX, transferências, empréstimos, autenticação JWT, dashboard admin, deploy com Docker e CI/CD',
    expectedMode: 5,
    description: 'Fintech enterprise'
  },
  {
    prompt: 'Crie um banco digital completo com sistema de pagamentos, carteira virtual, empréstimos, investimentos, cartão de crédito virtual, PIX, TED, boletos, extrato, notificações push, autenticação biométrica, KYC, compliance BACEN, dashboard admin, relatórios, auditoria, deploy em Kubernetes com CI/CD',
    expectedMode: 5,
    description: 'Banco digital completo'
  }
];

let passedTests = 0;
let failedTests = 0;

for (const test of testPrompts) {
  const analysis = analyzeComplexity(test.prompt);
  const passed = analysis.mode === test.expectedMode;
  
  if (passed) {
    passedTests++;
    console.log(`✅ ${test.description}`);
  } else {
    failedTests++;
    console.log(`❌ ${test.description}`);
    console.log(`   Esperado: ${test.expectedMode} chamadas`);
    console.log(`   Obtido: ${analysis.mode} chamadas`);
  }
  
  console.log(`   Score: ${analysis.score}`);
  console.log(`   Razão: ${analysis.reason}`);
  console.log(`   Features: ${analysis.detectedFeatures.slice(0, 5).join(', ')}`);
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTE 2: Sistema de Eventos
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📡 TESTE 2: Sistema de Eventos\n');

// Registrar listener
const events: string[] = [];
const unsubscribe = pipelineEvents.subscribe((data) => {
  events.push(`Fase ${data.phase}: ${data.status}`);
});

// Simular execução de pipeline
console.log('Simulando pipeline de 5 fases...');
pipelineEvents.start(5);

// Simular completar fases
setTimeout(() => {
  pipelineEvents.completePhase(1, ['architecture.json', 'openapi.yaml'], 500);
}, 100);

setTimeout(() => {
  pipelineEvents.completePhase(2, ['server.ts', 'routes.ts'], 2000);
}, 200);

setTimeout(() => {
  pipelineEvents.completePhase(3, ['App.tsx', 'components/'], 3000);
}, 300);

setTimeout(() => {
  pipelineEvents.completePhase(4, ['api-client.ts', 'hooks/'], 1000);
}, 400);

setTimeout(() => {
  pipelineEvents.completePhase(5, ['Dockerfile', 'docker-compose.yml'], 500);
  
  console.log('\nEventos recebidos:');
  events.forEach(e => console.log(`  - ${e}`));
  
  unsubscribe();
  
  // Verificar se todos os eventos foram recebidos
  const expectedEvents = 11; // 5 waiting + 5 running + 5 completed (alguns sobrepostos)
  console.log(`\nTotal de eventos: ${events.length}`);
  
  if (events.length >= 10) {
    console.log('✅ Sistema de eventos funcionando corretamente');
    passedTests++;
  } else {
    console.log('❌ Sistema de eventos com problemas');
    failedTests++;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // TESTE 3: Fases por Modo
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log('\n🔢 TESTE 3: Fases por Modo\n');
  
  const mode3Phases = pipelineEvents.getPhasesForMode(3);
  const mode4Phases = pipelineEvents.getPhasesForMode(4);
  const mode5Phases = pipelineEvents.getPhasesForMode(5);
  
  console.log(`Modo 3: ${mode3Phases.join(', ')} (esperado: 1, 2, 5)`);
  console.log(`Modo 4: ${mode4Phases.join(', ')} (esperado: 1, 2, 3, 5)`);
  console.log(`Modo 5: ${mode5Phases.join(', ')} (esperado: 1, 2, 3, 4, 5)`);
  
  if (mode3Phases.length === 3 && mode4Phases.length === 4 && mode5Phases.length === 5) {
    console.log('✅ Fases por modo corretas');
    passedTests++;
  } else {
    console.log('❌ Fases por modo incorretas');
    failedTests++;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RESULTADO FINAL
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           RESULTADO FINAL                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ✅ Testes passados: ${String(passedTests).padEnd(55)}║
║  ❌ Testes falhados: ${String(failedTests).padEnd(55)}║
║  📊 Taxa de sucesso: ${String(((passedTests / (passedTests + failedTests)) * 100).toFixed(1) + '%').padEnd(55)}║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
  
  // Resetar pipeline
  pipelineEvents.reset();
  
}, 500);
