/**
 * 🧪 TESTE DO ENTERPRISE PIPELINE
 * 
 * Execute com: npx ts-node tests/test-enterprise-pipeline.ts
 */

import { executeEnterprisePipeline, type PipelineMode } from '../services/EnterprisePipeline';

async function testEnterprisePipeline() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧪 TESTE DO ENTERPRISE PIPELINE 🧪                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
  
  // Configuração do teste
  const testPrompt = `
Crie um sistema de gerenciamento de tarefas (Todo App) com as seguintes funcionalidades:

1. Autenticação de usuários (login, registro, logout)
2. CRUD de tarefas (criar, listar, editar, excluir)
3. Categorias para organizar tarefas
4. Prioridades (alta, média, baixa)
5. Data de vencimento
6. Filtros e busca
7. Dashboard com estatísticas

Stack: Go (backend) + React + PostgreSQL
  `;
  
  const mode: PipelineMode = 5; // Usar todas as 5 fases
  
  console.log(`📝 Prompt: ${testPrompt.substring(0, 100)}...`);
  console.log(`🔢 Modo: ${mode} chamadas\n`);
  
  try {
    const result = await executeEnterprisePipeline(testPrompt, mode, {
      projectType: 'saas',
      
      onPhaseStart: (phase) => {
        console.log(`\n🚀 Iniciando ${phase.emoji} ${phase.name}...`);
      },
      
      onPhaseProgress: (phaseId, message, progress) => {
        console.log(`   [${progress}%] ${message}`);
      },
      
      onPhaseComplete: (output) => {
        console.log(`   ✅ ${output.phaseName}: ${output.files.length} arquivos, ${output.linesOfCode} linhas`);
        console.log(`   📁 Arquivos: ${output.files.map(f => f.path).join(', ')}`);
      }
    });
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         📊 RESULTADO DO TESTE                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Status: ${result.success ? '✅ SUCESSO' : '❌ FALHOU'}
║  Fases completadas: ${result.phases.length}
║  Total de arquivos: ${result.totalFiles}
║  Total de linhas: ${result.totalLinesOfCode}
║  Tempo total: ${(result.executionTimeMs / 1000).toFixed(2)}s
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    // Mostrar estrutura do projeto
    console.log('\n📁 ESTRUTURA DO PROJETO:\n');
    console.log(result.projectStructure);
    
    // Mostrar resumo por fase
    console.log('\n📊 RESUMO POR FASE:\n');
    for (const phase of result.phases) {
      console.log(`${phase.phaseName}:`);
      console.log(`  - Arquivos: ${phase.files.length}`);
      console.log(`  - Linhas: ${phase.linesOfCode}`);
      console.log(`  - Tempo: ${(phase.executionTimeMs / 1000).toFixed(2)}s`);
      console.log('');
    }
    
    // Salvar resultado em arquivo
    const fs = await import('fs');
    const outputPath = `workspace/enterprise-pipeline-result-${Date.now()}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Resultado salvo em: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testEnterprisePipeline();
