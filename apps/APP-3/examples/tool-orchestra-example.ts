/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🎼 EXEMPLO DE USO DO TOOL ORCHESTRA 🎼                              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este arquivo demonstra como usar o Tool Orchestra para criar projetos completos.
 * 
 * Para executar:
 * npx tsx examples/tool-orchestra-example.ts
 */

import { executeOrchestra, shouldUseOrchestra } from '../services/ToolOrchestra.js';

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 1: VERIFICAR SE DEVE USAR ORCHESTRA
// ═══════════════════════════════════════════════════════════════════════════════

function exemplo1_verificacao() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              EXEMPLO 1: VERIFICAÇÃO AUTOMÁTICA                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const prompts = [
    'Crie um sistema completo de e-commerce',
    'Crie uma função de soma',
    'Desenvolva uma fintech com dashboard',
    'Explique como funciona o React',
    'Crie um CRUD completo com autenticação'
  ];
  
  for (const prompt of prompts) {
    const shouldUse = shouldUseOrchestra(prompt);
    const icon = shouldUse ? '✅' : '❌';
    console.log(`${icon} "${prompt.substring(0, 50)}..."`);
    console.log(`   → Usar Orchestra: ${shouldUse ? 'SIM (3 fases)' : 'NÃO (chamada única)'}\n`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 2: EXECUÇÃO SIMPLES
// ═══════════════════════════════════════════════════════════════════════════════

async function exemplo2_execucaoSimples() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              EXEMPLO 2: EXECUÇÃO SIMPLES                                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('🚀 Iniciando execução simples...');
  console.log('   Prompt: "Crie um sistema de lista de tarefas com login"\n');
  
  const result = await executeOrchestra(
    'Crie um sistema de lista de tarefas (todo list) com login de usuário'
  );
  
  console.log('\n📊 RESULTADO:');
  console.log(`   Sucesso: ${result.success}`);
  console.log(`   Total de arquivos: ${result.totalFiles}`);
  console.log(`   Tempo: ${(result.executionTime / 1000).toFixed(2)}s`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 3: EXECUÇÃO COM CALLBACKS
// ═══════════════════════════════════════════════════════════════════════════════

async function exemplo3_execucaoComCallbacks() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              EXEMPLO 3: EXECUÇÃO COM CALLBACKS                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('🚀 Iniciando execução com callbacks...\n');
  
  const result = await executeOrchestra(
    'Crie uma fintech simples com dashboard de saldo e transferências PIX',
    {
      projectType: 'fintech',
      complexity: 'medium',
      
      onPhaseStart: (phase) => {
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`🎬 FASE ${phase.phase} INICIADA: ${phase.name}`);
        console.log(`   Persona: ${phase.persona}`);
        console.log(`${'═'.repeat(70)}`);
      },
      
      onPhaseComplete: (phase) => {
        console.log(`\n✅ FASE ${phase.phase} COMPLETA`);
        console.log(`   Arquivos gerados: ${phase.output?.files.length || 0}`);
        
        if (phase.output?.memo) {
          console.log(`   Memorando: ${phase.output.memo.substring(0, 100)}...`);
        }
        
        // Listar alguns arquivos
        if (phase.output?.files) {
          console.log(`   Arquivos:`);
          phase.output.files.slice(0, 5).forEach(f => {
            console.log(`     - ${f.path}`);
          });
          if (phase.output.files.length > 5) {
            console.log(`     ... e mais ${phase.output.files.length - 5} arquivos`);
          }
        }
      },
      
      onProgress: (message) => {
        console.log(`   📝 ${message}`);
      }
    }
  );
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESULTADO FINAL');
  console.log('═'.repeat(70));
  console.log(`   Sucesso: ${result.success}`);
  console.log(`   Total de arquivos: ${result.totalFiles}`);
  console.log(`   Tempo total: ${(result.executionTime / 1000).toFixed(2)}s`);
  console.log(`\n   Arquivos por categoria:`);
  console.log(`     Backend: ${result.finalProduct.backend.length}`);
  console.log(`     Frontend: ${result.finalProduct.frontend.length}`);
  console.log(`     Docs: ${result.finalProduct.docs.length}`);
  console.log(`     Config: ${result.finalProduct.config.length}`);
  console.log(`     Tests: ${result.finalProduct.tests.length}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO 4: ESTRUTURA JSON DO PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

function exemplo4_estruturaJSON() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              EXEMPLO 4: ESTRUTURA JSON DO PIPELINE                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const pipelineStructure = {
    name: "Tool Orchestra",
    description: "Sistema de orquestração de 3 fases para criação de projetos completos",
    
    phases: [
      {
        phase: 1,
        name: "BACKEND",
        persona: "Arquiteto + Engenheiro Backend Senior",
        input: ["userPrompt"],
        output: {
          code: "Backend completo",
          memo: "Memorando para Fase 2"
        },
        responsibilities: [
          "Arquitetura do sistema",
          "Servidor principal",
          "Rotas/Controllers",
          "Services",
          "Repositories",
          "Middleware",
          "Schema de banco",
          "Validação",
          "Testes unitários"
        ]
      },
      {
        phase: 2,
        name: "FRONTEND",
        persona: "Designer Figma + Engenheiro React + Motion Designer",
        input: ["userPrompt", "backendCode", "memoPhase1"],
        output: {
          code: "Frontend completo",
          memo: "Memorando para Fase 3"
        },
        responsibilities: [
          "Design System",
          "Componentes UI/UX",
          "Páginas",
          "Integração com backend",
          "Autenticação",
          "Estado global",
          "Animações",
          "Responsividade",
          "Acessibilidade"
        ]
      },
      {
        phase: 3,
        name: "DOCS_TESTS",
        persona: "Tech Writer + QA Automation Engineer",
        input: ["userPrompt", "backendCode", "frontendCode", "memoPhase1", "memoPhase2"],
        output: {
          code: "Documentação e configurações",
          memo: null
        },
        responsibilities: [
          "README.md",
          "Documentação da API",
          "ARCHITECTURE.md",
          "Testes E2E",
          "Testes de integração",
          "Dockerfile",
          "docker-compose.yml",
          "CI/CD",
          ".env.example",
          "DEPLOYMENT.md"
        ]
      }
    ]
  };
  
  console.log(JSON.stringify(pipelineStructure, null, 2));
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🎼 TOOL ORCHESTRA - EXEMPLOS DE USO 🎼                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  
  // Exemplo 1: Verificação (sempre executa)
  exemplo1_verificacao();
  
  // Exemplo 4: Estrutura JSON (sempre executa)
  exemplo4_estruturaJSON();
  
  // Exemplos 2 e 3 requerem API key
  const hasApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!hasApiKey) {
    console.log('\n⚠️ API Key não configurada.');
    console.log('   Configure GEMINI_API_KEY para executar os exemplos 2 e 3.');
    console.log('   Exemplo: GEMINI_API_KEY=sua-chave npx tsx examples/tool-orchestra-example.ts');
    return;
  }
  
  // Verificar argumentos
  const args = process.argv.slice(2);
  
  if (args.includes('--simple')) {
    await exemplo2_execucaoSimples();
  } else if (args.includes('--full')) {
    await exemplo3_execucaoComCallbacks();
  } else {
    console.log('\n💡 Para executar os exemplos com API:');
    console.log('   --simple  : Execução simples (Exemplo 2)');
    console.log('   --full    : Execução com callbacks (Exemplo 3)');
    console.log('\n   Exemplo: npx tsx examples/tool-orchestra-example.ts --full');
  }
}

main().catch(console.error);
