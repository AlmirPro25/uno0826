/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🌟 EXEMPLO DE USO DO THREE-PHASE PIPELINE 🌟                        ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este arquivo demonstra como usar o pipeline de 3 chamadas.
 * 
 * Execute com: npx ts-node examples/three-phase-example.ts
 */

import { AuroraBuilder } from '../aurora-build/core/AuroraBuilder';
import { ThreePhasePipeline } from '../services/ThreePhasePipeline';

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 1: Usando AuroraBuilder (detecta automaticamente)
// ═══════════════════════════════════════════════════════════════════════════════

async function exemploAuroraBuilder() {
  console.log('\n🌟 EXEMPLO 1: AuroraBuilder com detecção automática\n');
  
  const aurora = new AuroraBuilder();
  
  // Para projetos complexos, o pipeline de 3 fases é ativado automaticamente
  const result = await aurora.build({
    userPrompt: 'Crie uma fintech completa com PIX, transferências e dashboard',
    projectType: 'fintech',
    complexity: 'enterprise'
    // useThreePhasePipeline: true  // Opcional: forçar 3 fases
  });
  
  console.log(`\n📊 Resultado:`);
  console.log(`   - Arquivos gerados: ${result.code.files.length}`);
  console.log(`   - Score de qualidade: ${result.totalScore}/100`);
  console.log(`   - Tempo: ${(result.executionTime / 1000).toFixed(2)}s`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 2: Usando ThreePhasePipeline diretamente
// ═══════════════════════════════════════════════════════════════════════════════

async function exemploThreePhasePipeline() {
  console.log('\n🌟 EXEMPLO 2: ThreePhasePipeline direto\n');
  
  const pipeline = new ThreePhasePipeline();
  
  const result = await pipeline.execute({
    userPrompt: 'Crie um sistema de e-commerce com carrinho, checkout e painel admin',
    projectType: 'fullstack',
    complexity: 'complex',
    
    // Callbacks para acompanhar o progresso
    onPhaseStart: (phase, name) => {
      console.log(`\n🚀 Iniciando Fase ${phase}: ${name}`);
    },
    
    onPhaseComplete: (phase, phaseResult) => {
      console.log(`✅ Fase ${phase} completa!`);
      console.log(`   - Arquivos: ${phaseResult.files.length}`);
      console.log(`   - Resumo: ${phaseResult.summary}`);
    }
  });
  
  console.log(`\n📊 Resultado Final:`);
  console.log(`   - Sucesso: ${result.success}`);
  console.log(`   - Total de arquivos: ${result.totalFiles}`);
  console.log(`   - Tempo: ${(result.executionTime / 1000).toFixed(2)}s`);
  
  // Listar arquivos por fase
  for (const phase of result.phases) {
    console.log(`\n📁 Fase ${phase.phase} (${phase.phaseName}):`);
    for (const file of phase.files) {
      console.log(`   - ${file.path}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 3: Projeto simples (1 chamada)
// ═══════════════════════════════════════════════════════════════════════════════

async function exemploProjetoSimples() {
  console.log('\n🌟 EXEMPLO 3: Projeto simples (1 chamada)\n');
  
  const aurora = new AuroraBuilder();
  
  // Para projetos simples, usa apenas 1 chamada (mais rápido)
  const result = await aurora.build({
    userPrompt: 'Crie uma landing page para uma startup de tecnologia',
    projectType: 'web',
    complexity: 'simple',
    useThreePhasePipeline: false  // Forçar 1 chamada
  });
  
  console.log(`\n📊 Resultado:`);
  console.log(`   - Arquivos gerados: ${result.code.files.length}`);
  console.log(`   - Tempo: ${(result.executionTime / 1000).toFixed(2)}s`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTAR EXEMPLOS
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🌟 EXEMPLOS DO THREE-PHASE PIPELINE 🌟                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  
  // Escolha qual exemplo executar
  const exemplo = process.argv[2] || '2';
  
  switch (exemplo) {
    case '1':
      await exemploAuroraBuilder();
      break;
    case '2':
      await exemploThreePhasePipeline();
      break;
    case '3':
      await exemploProjetoSimples();
      break;
    default:
      console.log('Uso: npx ts-node examples/three-phase-example.ts [1|2|3]');
      console.log('  1 = AuroraBuilder com detecção automática');
      console.log('  2 = ThreePhasePipeline direto');
      console.log('  3 = Projeto simples (1 chamada)');
  }
}

main().catch(console.error);
