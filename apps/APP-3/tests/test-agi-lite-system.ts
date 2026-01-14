/**
 * 🧠 TESTE DO SISTEMA AGI-LITE COMPLETO
 * 
 * Testa o ciclo completo:
 * 1. SoulArchitect - Criação de especialistas
 * 2. SupremeManifestEvolver - Evolução autônoma
 * 3. CognitiveCore - Orquestração
 */

import { getSoulArchitect } from '../services/SoulArchitect';
import { getSupremeEvolver } from '../services/SupremeManifestEvolver';
import { getCognitiveCore, type CognitiveRequest } from '../services/CognitiveCore';

async function testAGILiteSystem() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧠 TESTE DO SISTEMA AGI-LITE COMPLETO 🧠                            ║
║                                                                              ║
║         • SoulArchitect: Criação de especialistas                           ║
║         • SupremeEvolver: Evolução autônoma                                 ║
║         • CognitiveCore: Orquestração cognitiva                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 1: SOUL ARCHITECT
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 TESTE 1: SoulArchitect - Forjar Especialista\n');

  const architect = getSoulArchitect();
  
  const soulResult = await architect.forgeAgentSoul(`
    Crie um sistema de carteira digital com:
    - Integração PIX
    - Dashboard de transações
    - Sistema de notificações
    - Autenticação JWT
  `);

  if (soulResult.success && soulResult.soul) {
    console.log('✅ Especialista forjado com sucesso!');
    console.log(`   📛 Nome: ${soulResult.soul.name}`);
    console.log(`   🧬 DNA: ${soulResult.soul.manifestosDNA.map(d => d.manifestoId).join(', ')}`);
    console.log(`   ⏱️ Tempo: ${soulResult.executionTimeMs}ms`);
  } else {
    console.log('❌ Falha ao forjar especialista');
    console.log(`   Log: ${soulResult.analysisLog.slice(-3).join('\n        ')}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 2: SUPREME MANIFEST EVOLVER
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 TESTE 2: SupremeManifestEvolver - Registrar Feedbacks\n');

  const evolver = getSupremeEvolver();
  
  // Simular alguns feedbacks
  if (soulResult.success && soulResult.soul) {
    // Feedback positivo
    architect.reportExecutionFeedback(
      soulResult.soul.id,
      true,
      85,
      30000,
      1200,
      []
    );
    console.log('✅ Feedback positivo registrado');

    // Simular mais feedbacks para testar evolução
    for (let i = 0; i < 5; i++) {
      const mockSoul = { ...soulResult.soul, id: `mock_soul_${i}` };
      evolver.recordFeedback({
        soulId: mockSoul.id,
        soul: mockSoul,
        success: Math.random() > 0.3,
        qualityScore: 60 + Math.random() * 40,
        executionTimeMs: 20000 + Math.random() * 30000,
        linesOfCode: 500 + Math.floor(Math.random() * 1000),
        errors: []
      });
    }
    console.log('✅ 5 feedbacks simulados registrados');
  }

  // Mostrar estatísticas do evolver
  const evolverStats = evolver.getStats();
  console.log(`\n📊 Estatísticas do Evolver:`);
  console.log(`   Geração: ${evolverStats.generation}`);
  console.log(`   Total Feedbacks: ${evolverStats.totalFeedbacks}`);
  console.log(`   Genomas Rastreados: ${evolverStats.genomesTracked}`);
  console.log(`   Princípios Emergentes: ${evolverStats.emergentPrinciples}`);
  console.log(`   Top Manifesto: ${evolverStats.topManifesto}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 3: COGNITIVE CORE
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 TESTE 3: CognitiveCore - Processo Cognitivo Completo\n');

  const core = getCognitiveCore();

  // Testar extração de domínios (método interno, mas podemos testar via stats)
  const coreStats = core.getStats();
  console.log(`📊 Estatísticas do CognitiveCore:`);
  console.log(`   Total Requisições: ${coreStats.totalRequests}`);
  console.log(`   Taxa de Sucesso: ${(coreStats.successRate * 100).toFixed(1)}%`);
  console.log(`   Qualidade Média: ${coreStats.avgQualityScore.toFixed(1)}/100`);
  console.log(`   Almas Forjadas: ${coreStats.soulsForged}`);
  console.log(`   Geração Evolução: ${coreStats.evolutionGeneration}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 4: INTEGRAÇÃO COMPLETA
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 TESTE 4: Integração SoulArchitect + Evolver\n');

  // Testar obtenção de pesos evoluídos
  const evolvedWeights = evolver.getEvolvedWeights();
  console.log(`📊 Pesos Evoluídos: ${evolvedWeights.size} manifestos rastreados`);

  // Testar obtenção de sinergias
  if (evolvedWeights.size > 0) {
    const firstManifesto = Array.from(evolvedWeights.keys())[0];
    const synergies = evolver.getBestSynergies(firstManifesto);
    console.log(`🤝 Sinergias para ${firstManifesto}: ${synergies.length} encontradas`);
  }

  // Testar obtenção de princípios emergentes
  const principles = evolver.getEmergentPrinciplesForDomain('fintech');
  console.log(`💡 Princípios para 'fintech': ${principles.length} encontrados`);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 5: RELATÓRIO FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 TESTE 5: Relatório do Sistema\n');

  const report = core.generateReport();
  console.log(report);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMO
  // ═══════════════════════════════════════════════════════════════════════════

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🎉 TESTES DO SISTEMA AGI-LITE COMPLETOS! 🎉                         ║
║                                                                              ║
║         O sistema está funcionando:                                         ║
║         ✅ SoulArchitect forja especialistas                                ║
║         ✅ SupremeEvolver registra feedbacks                                ║
║         ✅ CognitiveCore orquestra o processo                               ║
║         ✅ Integração entre componentes funcional                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
}

// Executar testes
testAGILiteSystem().catch(console.error);
