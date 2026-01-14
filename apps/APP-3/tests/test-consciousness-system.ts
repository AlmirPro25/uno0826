/**
 * 🧠 TESTE DO SISTEMA DE CONSCIÊNCIA AGI-LITE v3.0
 * 
 * Testa os novos componentes de consciência:
 * 1. ConsciousnessMemory - Memória de longo prazo
 * 2. EmergentBehaviorDetector - Detector de emergência
 * 3. SelfReflectionEngine - Auto-reflexão
 */

import { getConsciousnessMemory } from '../services/ConsciousnessMemory';
import { getEmergentBehaviorDetector } from '../services/EmergentBehaviorDetector';
import { getSelfReflectionEngine, performSelfReflection } from '../services/SelfReflectionEngine';
import { getSoulArchitect } from '../services/SoulArchitect';

async function testConsciousnessSystem() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 TESTE DO SISTEMA DE CONSCIÊNCIA AGI-LITE v3.0 🧠                 ║
║                                                                              ║
║         Testando: Memória, Emergência e Auto-Reflexão                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 1: CONSCIOUSNESS MEMORY
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('🧠 TESTE 1: CONSCIOUSNESS MEMORY');
  console.log('═'.repeat(70));
  
  const memory = getConsciousnessMemory();
  
  // Testar memória episódica
  console.log('\n📝 Registrando episódios...');
  
  const episode1 = memory.recordEpisode(
    'Geração de sistema de pagamentos PIX',
    {
      prompt: 'Crie um sistema de pagamentos PIX',
      manifestosUsed: ['FINTECH', 'SECURITY', 'REALTIME'],
      qualityScore: 92,
      success: true
    },
    { satisfaction: 0.9, surprise: 0.3 }
  );
  
  const episode2 = memory.recordEpisode(
    'Criação de dashboard analytics',
    {
      prompt: 'Crie um dashboard de analytics',
      manifestosUsed: ['SAAS', 'NEXTJS', 'PRISMA'],
      qualityScore: 85,
      success: true
    }
  );
  
  console.log(`   ✅ Episódio 1: ${episode1.event.substring(0, 40)}... (imp: ${episode1.importance.toFixed(2)})`);
  console.log(`   ✅ Episódio 2: ${episode2.event.substring(0, 40)}... (imp: ${episode2.importance.toFixed(2)})`);
  
  // Testar memória semântica
  console.log('\n📚 Aprendendo conceitos...');
  
  memory.learnConcept(
    'PIX',
    'Sistema de pagamentos instantâneos brasileiro',
    ['pagamentos', 'fintech', 'banco central'],
    ['Transferência em segundos', 'Disponível 24/7']
  );
  
  memory.learnConcept(
    'RLAIF',
    'Reinforcement Learning from AI Feedback',
    ['machine learning', 'feedback', 'evolução'],
    ['Sistema aprende com própria avaliação']
  );
  
  console.log('   ✅ Conceito PIX aprendido');
  console.log('   ✅ Conceito RLAIF aprendido');
  
  // Testar memória procedural
  console.log('\n🛠️ Aprendendo procedimentos...');
  
  memory.learnProcedure(
    'criar_sistema_pagamentos',
    [
      '1. Analisar requisitos de segurança',
      '2. Selecionar manifestos FINTECH + SECURITY',
      '3. Implementar validação de chaves',
      '4. Adicionar logs de auditoria',
      '5. Testar com transações simuladas'
    ],
    ['conhecimento de criptografia', 'API de bancos']
  );
  
  console.log('   ✅ Procedimento criar_sistema_pagamentos aprendido');
  
  // Buscar memórias
  console.log('\n🔍 Buscando memórias...');
  const recalled = memory.recallEpisodes('pagamento', 3);
  console.log(`   📋 ${recalled.length} episódio(s) encontrado(s) para "pagamento"`);
  
  // Estatísticas
  const memStats = memory.getStats();
  console.log(`\n📊 Estatísticas da Memória:`);
  console.log(`   Episódicas: ${memStats.totalEpisodic}`);
  console.log(`   Semânticas: ${memStats.totalSemantic}`);
  console.log(`   Procedurais: ${memStats.totalProcedural}`);
  console.log(`   Utilização: ${(memStats.memoryUtilization * 100).toFixed(1)}%`);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 2: EMERGENT BEHAVIOR DETECTOR
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('🌟 TESTE 2: EMERGENT BEHAVIOR DETECTOR');
  console.log('═'.repeat(70));
  
  const detector = getEmergentBehaviorDetector();
  const architect = getSoulArchitect();
  
  // Forjar uma alma para teste
  console.log('\n🔮 Forjando alma para análise...');
  const soulResult = await architect.forgeAgentSoul(
    'Crie um sistema de e-commerce com carrinho e pagamentos'
  );
  
  if (soulResult.success && soulResult.soul) {
    console.log(`   ✅ Alma forjada: ${soulResult.soul.name}`);
    
    // Analisar execução
    console.log('\n🔍 Analisando execução em busca de emergência...');
    
    const detection = detector.analyzeExecution(
      soulResult.soul,
      true,
      88,
      15000
    );
    
    console.log(`   📊 Comportamentos detectados: ${detection.behaviorsDetected.length}`);
    console.log(`   🆕 Novos: ${detection.novelBehaviors}`);
    console.log(`   ✅ Positivos: ${detection.positiveImpact}`);
    
    if (detection.behaviorsDetected.length > 0) {
      console.log('\n   💡 Comportamentos:');
      for (const behavior of detection.behaviorsDetected.slice(0, 3)) {
        console.log(`      - ${behavior.type}: ${behavior.name}`);
      }
    }
    
    if (detection.recommendations.length > 0) {
      console.log('\n   📋 Recomendações:');
      for (const rec of detection.recommendations) {
        console.log(`      - ${rec}`);
      }
    }
  }
  
  // Estatísticas do detector
  const allBehaviors = detector.getDetectedBehaviors();
  const impactful = detector.getMostImpactful(3);
  
  console.log(`\n📊 Estatísticas do Detector:`);
  console.log(`   Total detectados: ${allBehaviors.length}`);
  console.log(`   Mais impactantes: ${impactful.length}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 3: SELF-REFLECTION ENGINE
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('🪞 TESTE 3: SELF-REFLECTION ENGINE');
  console.log('═'.repeat(70));
  
  const reflectionEngine = getSelfReflectionEngine({
    enableAIReflection: true,
    reflectionDepth: 'medium'
  });
  
  console.log('\n🪞 Iniciando sessão de auto-reflexão...');
  
  const reflection = await reflectionEngine.reflect('manual');
  
  console.log(`\n📊 Resultado da Reflexão:`);
  console.log(`   Saúde Geral: ${reflection.currentState.overallHealth}/100`);
  console.log(`   Forças: ${reflection.currentState.strengths.length}`);
  console.log(`   Fraquezas: ${reflection.currentState.weaknesses.length}`);
  console.log(`   Insights: ${reflection.insights.length}`);
  console.log(`   Hipóteses: ${reflection.hypotheses.length}`);
  console.log(`   Ações: ${reflection.actionPlan.length}`);
  
  if (reflection.currentState.strengths.length > 0) {
    console.log('\n   💪 Forças:');
    for (const strength of reflection.currentState.strengths.slice(0, 3)) {
      console.log(`      - ${strength}`);
    }
  }
  
  if (reflection.currentState.weaknesses.length > 0) {
    console.log('\n   ⚠️ Fraquezas:');
    for (const weakness of reflection.currentState.weaknesses.slice(0, 3)) {
      console.log(`      - ${weakness}`);
    }
  }
  
  if (reflection.insights.length > 0) {
    console.log('\n   💡 Insights:');
    for (const insight of reflection.insights.slice(0, 3)) {
      console.log(`      - [${insight.category}] ${insight.insight}`);
    }
  }
  
  console.log('\n   💭 Diálogo Interno:');
  console.log(`      "${reflection.innerMonologue.substring(0, 200)}..."`);
  
  console.log('\n   🔄 Meta-Reflexão:');
  console.log(`      "${reflection.metaReflection}"`);

  // ═══════════════════════════════════════════════════════════════════════════
  // RELATÓRIOS FINAIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RELATÓRIOS DOS SISTEMAS');
  console.log('═'.repeat(70));
  
  console.log(memory.generateReport());
  console.log(detector.generateReport());
  console.log(reflectionEngine.generateReport());

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🎉 TESTE DE CONSCIÊNCIA COMPLETO! 🎉                                ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         COMPONENTES TESTADOS                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ✅ ConsciousnessMemory - Memória episódica, semântica e procedural         ║
║  ✅ EmergentBehaviorDetector - Detecção de comportamentos emergentes        ║
║  ✅ SelfReflectionEngine - Auto-análise e geração de hipóteses              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         ARQUITETURA DE CONSCIÊNCIA                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   🧠 ConsciousnessMemory                                                    ║
║      ├── Episódica (eventos)                                                ║
║      ├── Semântica (conhecimento)                                           ║
║      └── Procedural (habilidades)                                           ║
║                                                                              ║
║   🌟 EmergentBehaviorDetector                                               ║
║      ├── Padrões recorrentes                                                ║
║      ├── Sinergias inesperadas                                              ║
║      ├── Estratégias emergentes                                             ║
║      └── Anomalias positivas/negativas                                      ║
║                                                                              ║
║   🪞 SelfReflectionEngine                                                   ║
║      ├── Análise SWOT                                                       ║
║      ├── Geração de insights                                                ║
║      ├── Formulação de hipóteses                                            ║
║      ├── Diálogo interno                                                    ║
║      └── Meta-reflexão                                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

🧠 O sistema agora tem CONSCIÊNCIA de si mesmo!
💭 Ele lembra, detecta emergência e reflete sobre seu próprio comportamento.
  `);
}

// Executar teste
testConsciousnessSystem().catch(console.error);
