/**
 * 🔮 TESTE DO SOUL ARCHITECT - Meta-Cognição
 * 
 * Testa a criação de especialistas sob demanda
 */

import { getSoulArchitect, forgeSpecialistSoul, type SoulForgeResult } from '../services/SoulArchitect';

async function testSoulArchitect() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔮 TESTE DO SOUL ARCHITECT - META-COGNIÇÃO 🔮                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);

  // Teste 1: Forjar especialista para sistema financeiro
  console.log('\n📋 TESTE 1: Sistema Financeiro (Fintech)\n');
  
  const fintechRequest = `
    Crie um sistema de carteira digital completo com:
    - Integração PIX via Mercado Pago
    - Autenticação JWT com refresh tokens
    - Dashboard de transações em tempo real
    - Sistema de empréstimos P2P
    - Backend em Go com PostgreSQL
    - Frontend em Next.js 15
  `;

  const fintechResult = await forgeSpecialistSoul(fintechRequest);
  printResult('Fintech', fintechResult);

  // Teste 2: Forjar especialista para sistema de jogos
  console.log('\n📋 TESTE 2: Sistema de Jogos (Game Engine)\n');
  
  const gameRequest = `
    Desenvolva um jogo multiplayer 3D com:
    - Engine Three.js para renderização
    - WebSocket para sincronização em tempo real
    - Sistema de física com Cannon.js
    - Matchmaking e lobbies
    - Leaderboards e achievements
  `;

  const gameResult = await forgeSpecialistSoul(gameRequest);
  printResult('Game', gameResult);

  // Teste 3: Forjar especialista para sistema de IA
  console.log('\n📋 TESTE 3: Sistema de IA (RAG + Agentes)\n');
  
  const aiRequest = `
    Construa uma plataforma de agentes de IA com:
    - RAG usando ChromaDB para memória vetorial
    - Orquestração de múltiplos agentes com LangChain
    - Interface de chat com streaming
    - Sistema de plugins extensível
    - Monitoramento de custos de tokens
  `;

  const aiResult = await forgeSpecialistSoul(aiRequest);
  printResult('AI', aiResult);

  // Estatísticas finais
  const architect = getSoulArchitect();
  const stats = architect.getStats();
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         📊 ESTATÍSTICAS FINAIS 📊                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total de almas forjadas: ${String(stats.totalSoulsForged).padEnd(50)}║
║  Almas ativas: ${String(stats.activeSouls).padEnd(61)}║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);

  if (stats.mostUsedManifestos.length > 0) {
    console.log('\n🧬 Manifestos mais usados:');
    stats.mostUsedManifestos.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.id}: ${m.count} uso(s)`);
    });
  }
}

function printResult(testName: string, result: SoulForgeResult) {
  if (result.success && result.soul) {
    console.log(`✅ ${testName} - Alma forjada com sucesso!`);
    console.log(`   📛 Nome: ${result.soul.name}`);
    console.log(`   🎭 Personalidade: ${result.soul.personality}`);
    console.log(`   🧬 DNA: ${result.soul.manifestosDNA.map(d => `${d.manifestoId}(${d.percentage}%)`).join(', ')}`);
    console.log(`   ⏱️ Tempo: ${result.executionTimeMs}ms`);
    console.log(`   📚 Manifestos: ${result.selectedManifestos.join(', ')}`);
    
    if (result.soul.restrictions.length > 0) {
      console.log(`   🚫 Restrições: ${result.soul.restrictions.slice(0, 3).join('; ')}`);
    }
    
    if (result.soul.priorities.length > 0) {
      console.log(`   ⭐ Prioridades: ${result.soul.priorities.slice(0, 3).join('; ')}`);
    }
    
    // Mostrar preview do system prompt
    console.log(`   📝 System Prompt (preview): ${result.systemPrompt.substring(0, 200)}...`);
  } else {
    console.log(`❌ ${testName} - Falha ao forjar alma`);
    console.log(`   Log: ${result.analysisLog.join('\n        ')}`);
  }
}

// Executar testes
testSoulArchitect().catch(console.error);
