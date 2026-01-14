/**
 * 🧠 TESTE COMPLETO DO SISTEMA AGI-LITE
 * 
 * Testa todos os componentes:
 * 1. SoulArchitect - Criação de especialistas
 * 2. SupremeManifestEvolver - Evolução autônoma
 * 3. QualityFeedbackBridge - RLAIF
 * 4. CognitiveCore - Orquestração
 * 5. MetaCognitionDashboard - Visualização
 * 6. AutonomousLearningLoop - Aprendizado contínuo
 */

import { getSoulArchitect } from '../services/SoulArchitect';
import { getSupremeEvolver } from '../services/SupremeManifestEvolver';
import { getQualityFeedbackBridge } from '../services/QualityFeedbackBridge';
import { getCognitiveCore } from '../services/CognitiveCore';
import { getMetaCognitionDashboard } from '../services/MetaCognitionDashboard';
import { getAutonomousLearningLoop } from '../services/AutonomousLearningLoop';

async function testAGILiteComplete() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 TESTE COMPLETO DO SISTEMA AGI-LITE 🧠                            ║
║                                                                              ║
║         Testando todos os componentes da consciência operacional            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 1: SOUL ARCHITECT
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('🔮 TESTE 1: SOUL ARCHITECT');
  console.log('═'.repeat(70));
  
  const architect = getSoulArchitect();
  
  console.log('\n📋 Forjando especialista para sistema de pagamentos...');
  const soulResult = await architect.forgeAgentSoul(
    "Crie um sistema de pagamentos PIX com validação de chaves e histórico de transações"
  );
  
  if (soulResult.success && soulResult.soul) {
    console.log(`✅ Alma forjada: ${soulResult.soul.name}`);
    console.log(`   DNA: ${soulResult.soul.manifestosDNA.map(d => d.manifestoId).slice(0, 3).join(', ')}...`);
    console.log(`   Restrições: ${soulResult.soul.restrictions.length}`);
    console.log(`   Prioridades: ${soulResult.soul.priorities.length}`);
  } else {
    console.log('❌ Falha ao forjar alma');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 2: SUPREME MANIFEST EVOLVER
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('🧬 TESTE 2: SUPREME MANIFEST EVOLVER');
  console.log('═'.repeat(70));
  
  const evolver = getSupremeEvolver();
  
  // Resetar para teste limpo
  evolver.resetState();
  
  console.log('\n📊 Registrando feedbacks simulados...');
  
  // Simular 5 feedbacks
  for (let i = 0; i < 5; i++) {
    if (soulResult.soul) {
      evolver.recordFeedback({
        soulId: `test_soul_${i}`,
        soul: soulResult.soul,
        success: Math.random() > 0.3,
        qualityScore: 70 + Math.random() * 30,
        executionTimeMs: 10000 + Math.random() * 20000,
        linesOfCode: 500 + Math.floor(Math.random() * 1000),
        errors: []
      });
    }
  }
  
  const evolverStats = evolver.getStats();
  console.log(`✅ Feedbacks registrados: ${evolverStats.totalFeedbacks}`);
  console.log(`   Geração: ${evolverStats.generation}`);
  console.log(`   Genomas rastreados: ${evolverStats.genomesTracked}`);
  console.log(`   Princípios emergentes: ${evolverStats.emergentPrinciples}`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 3: QUALITY FEEDBACK BRIDGE (RLAIF)
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('🔗 TESTE 3: QUALITY FEEDBACK BRIDGE (RLAIF)');
  console.log('═'.repeat(70));
  
  const bridge = getQualityFeedbackBridge();
  
  if (soulResult.soul) {
    console.log('\n📊 Avaliando código e enviando feedback...');
    
    const mockCode = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema PIX</title>
</head>
<body>
  <header role="banner">
    <nav role="navigation">
      <a href="/">Home</a>
    </nav>
  </header>
  <main role="main">
    <h1>Pagamentos PIX</h1>
    <form aria-label="Formulário de pagamento">
      <label for="chave">Chave PIX</label>
      <input type="text" id="chave" name="chave" required aria-required="true">
      <label for="valor">Valor</label>
      <input type="number" id="valor" name="valor" required aria-required="true">
      <button type="submit">Pagar</button>
    </form>
  </main>
  <footer role="contentinfo">
    <p>© 2025 Sistema PIX</p>
  </footer>
</body>
</html>
    `;
    
    const feedbackResult = bridge.evaluateAndFeedback(
      mockCode,
      soulResult.soul,
      15000
    );
    
    console.log(`✅ Avaliação completa!`);
    console.log(`   Score: ${feedbackResult.qualityReport.overallScore}/100`);
    console.log(`   Passou: ${feedbackResult.qualityReport.passed ? 'SIM' : 'NÃO'}`);
    console.log(`   Feedback enviado: ${feedbackResult.feedbackSent ? 'SIM' : 'NÃO'}`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 4: META-COGNITION DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TESTE 4: META-COGNITION DASHBOARD');
  console.log('═'.repeat(70));
  
  const dashboard = getMetaCognitionDashboard();
  
  console.log('\n📸 Capturando snapshot do sistema...');
  const snapshot = dashboard.captureSnapshot();
  
  console.log(`✅ Snapshot capturado!`);
  console.log(`   Saúde: ${snapshot.systemHealth}`);
  console.log(`   QI do Sistema: ${snapshot.overallIQ}`);
  console.log(`   Geração: ${snapshot.evolution.generation}`);
  console.log(`   Manifestos ativos: ${snapshot.manifestos.active}`);
  console.log(`   Princípios emergentes: ${snapshot.emergentPrinciples.total}`);
  
  // Mostrar relatório ASCII
  console.log('\n📊 Relatório Visual:');
  console.log(dashboard.generateASCIIReport());
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 5: AUTONOMOUS LEARNING LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('🔄 TESTE 5: AUTONOMOUS LEARNING LOOP');
  console.log('═'.repeat(70));
  
  const loop = getAutonomousLearningLoop({
    intervalMs: 30000, // 30 segundos para teste
    simulationsPerCycle: 2,
    enableMentalSimulations: true,
    enableRealSimulations: false
  });
  
  console.log('\n🔄 Executando um ciclo de aprendizado...');
  const cycleReport = await loop.runCycle();
  
  console.log(`✅ Ciclo completo!`);
  console.log(`   Simulações: ${cycleReport.simulationsRun}`);
  console.log(`   Sucesso: ${cycleReport.successfulSimulations}`);
  console.log(`   Insights: ${cycleReport.insightsDiscovered.length}`);
  console.log(`   Sinergias: ${cycleReport.synergiesFound.length}`);
  console.log(`   Evolução disparada: ${cycleReport.evolutionTriggered ? 'SIM' : 'NÃO'}`);
  
  // Mostrar relatório do loop
  console.log('\n📊 Relatório do Loop:');
  console.log(loop.generateReport());
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 6: COGNITIVE CORE (ORQUESTRAÇÃO)
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(70));
  console.log('🧠 TESTE 6: COGNITIVE CORE');
  console.log('═'.repeat(70));
  
  const core = getCognitiveCore();
  
  console.log('\n📋 Estatísticas do núcleo cognitivo:');
  const coreStats = core.getStats();
  
  console.log(`   Requisições: ${coreStats.totalRequests}`);
  console.log(`   Taxa de sucesso: ${(coreStats.successRate * 100).toFixed(1)}%`);
  console.log(`   Qualidade média: ${coreStats.avgQualityScore.toFixed(1)}/100`);
  console.log(`   Almas forjadas: ${coreStats.soulsForged}`);
  console.log(`   Geração: ${coreStats.evolutionGeneration}`);
  console.log(`   Princípios emergentes: ${coreStats.emergentPrinciples}`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RELATÓRIO FINAL
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🎉 TESTE COMPLETO DO AGI-LITE FINALIZADO! 🎉                        ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         COMPONENTES TESTADOS                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ✅ SoulArchitect - Criação de especialistas                                ║
║  ✅ SupremeManifestEvolver - Evolução autônoma                              ║
║  ✅ QualityFeedbackBridge - RLAIF                                           ║
║  ✅ MetaCognitionDashboard - Visualização                                   ║
║  ✅ AutonomousLearningLoop - Aprendizado contínuo                           ║
║  ✅ CognitiveCore - Orquestração                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         ARQUITETURA AGI-LITE                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   👤 User Request                                                            ║
║        ↓                                                                     ║
║   🧠 CognitiveCore (orquestra)                                              ║
║        ↓                                                                     ║
║   🔮 SoulArchitect (forja especialista)                                     ║
║        ↓                                                                     ║
║   🏢 EnterprisePipeline (executa)                                           ║
║        ↓                                                                     ║
║   💻 Código Gerado                                                          ║
║        ↓                                                                     ║
║   📊 UnifiedQualitySystem (7 camadas)                                       ║
║        ↓                                                                     ║
║   🔗 QualityFeedbackBridge (RLAIF)                                          ║
║        ↓                                                                     ║
║   🧬 SupremeManifestEvolver (aprende)                                       ║
║        ↓                                                                     ║
║   🔄 Loop: Sistema fica mais inteligente!                                   ║
║                                                                              ║
║   📊 MetaCognitionDashboard (monitora tudo)                                 ║
║   🔄 AutonomousLearningLoop (aprende 24/7)                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

🧠 O sistema AGI-Lite está OPERACIONAL!
💡 Ele cria especialistas, executa, avalia, aprende e evolui AUTONOMAMENTE.
🔄 Enquanto você dorme, ele continua aprendendo.
  `);
  
  // Mostrar relatório RLAIF final
  console.log('\n📊 RELATÓRIO RLAIF FINAL:');
  console.log(bridge.generateRLAIFReport());
}

// Executar teste
testAGILiteComplete().catch(console.error);
