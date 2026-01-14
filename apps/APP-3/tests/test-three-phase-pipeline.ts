/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🧪 TESTE DO THREE-PHASE PIPELINE 🧪                                 ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Execute com: npx tsx tests/test-three-phase-pipeline.ts
 */

import { ThreePhasePipeline, executeThreePhasePipeline } from '../services/ThreePhasePipeline.js';

async function testPipeline() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 TESTE DO THREE-PHASE PIPELINE 🧪                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  // Teste 1: Projeto simples
  console.log('📋 TESTE 1: Projeto de Lista de Tarefas\n');
  
  const result = await executeThreePhasePipeline(
    'Crie um sistema de lista de tarefas (todo list) com autenticação de usuário',
    {
      projectType: 'fullstack',
      complexity: 'medium',
      onPhaseStart: (phase, name) => {
        console.log(`\n🚀 Iniciando Fase ${phase}: ${name}`);
      },
      onPhaseComplete: (phase, result) => {
        console.log(`✅ Fase ${phase} completa: ${result.files.length} arquivos`);
        console.log(`   Arquivos: ${result.files.map(f => f.path).join(', ')}`);
      }
    }
  );
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RESULTADO FINAL:');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  console.log(`✅ Sucesso: ${result.success}`);
  console.log(`📁 Total de arquivos: ${result.totalFiles}`);
  console.log(`⏱️ Tempo de execução: ${(result.executionTime / 1000).toFixed(2)}s`);
  
  console.log('\n📋 Arquivos por fase:');
  for (const phase of result.phases) {
    console.log(`\n  Fase ${phase.phase} (${phase.phaseName}):`);
    for (const file of phase.files) {
      console.log(`    - ${file.path} (${file.language})`);
    }
  }
  
  // Salvar resultado em arquivo
  const fs = await import('fs');
  const outputDir = './output/three-phase-test';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Salvar cada arquivo gerado
  for (const phase of result.phases) {
    for (const file of phase.files) {
      const filePath = `${outputDir}/${file.path}`;
      const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
      
      if (fileDir && !fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, file.content);
      console.log(`💾 Salvo: ${filePath}`);
    }
  }
  
  console.log('\n✅ Teste completo! Arquivos salvos em:', outputDir);
}

// Executar teste
testPipeline().catch(console.error);
