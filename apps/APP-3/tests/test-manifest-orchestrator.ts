/**
 * Teste do Manifest Orchestrator
 * Execute com: npx ts-node tests/test-manifest-orchestrator.ts
 */

import { 
    orchestrateManifests, 
    detectActiveManifests, 
    getManifestInfo 
} from '../services/manifestos/ManifestOrchestrator';

// Cores para console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(msg: string, color: string = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

function testCase(name: string, prompt: string) {
    log(`\n${'═'.repeat(70)}`, colors.cyan);
    log(`📋 TESTE: ${name}`, colors.yellow);
    log(`${'═'.repeat(70)}`, colors.cyan);
    log(`Prompt: "${prompt.substring(0, 50)}..."`, colors.reset);
    
    const manifests = detectActiveManifests(prompt);
    
    if (manifests.length > 0) {
        log(`\n✅ Manifestos Detectados:`, colors.green);
        manifests.forEach(m => {
            log(`   - ${m.name} (Level ${m.level}) - Confiança: ${m.confidence.toFixed(1)}%`);
        });
    } else {
        log(`\n⚠️ Nenhum manifesto de alto nível detectado`, colors.yellow);
    }
    
    const result = orchestrateManifests(prompt);
    log(`\n📊 Total de manifestos aplicados: ${result.totalManifestsApplied}`, colors.cyan);
    
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🧬 MANIFEST ORCHESTRATOR - TESTES 🧬                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// Info do sistema
log('📚 Informações do Sistema:', colors.cyan);
console.log(JSON.stringify(getManifestInfo(), null, 2));

// Teste 1: SYNTHIA (MLOps)
testCase('SYNTHIA - MLOps', 
    'Crie um modelo de machine learning com PyTorch para classificação de imagens, com MLflow tracking');

// Teste 2: AURA (Voice)
testCase('AURA - Voice Interface', 
    'Crie um assistente de voz tipo Jarvis para controlar minha smart home com IoT');

// Teste 3: OMNIS (Quantum)
testCase('OMNIS - Quantum Computing', 
    'Implemente o protocolo BB84 de criptografia quântica usando Qiskit com visualização da esfera de Bloch');

// Teste 4: HELIX (Evolution)
testCase('HELIX - Evolutionary', 
    'Crie uma simulação de carros que aprendem a dirigir usando algoritmo genético e neuroevolução NEAT');

// Teste 5: AION (Web3)
testCase('AION - Web3/DAO', 
    'Crie uma DAO com smart contracts em Solidity para governança descentralizada na Ethereum');

// Teste 6: OMEGA (Singularity)
testCase('OMEGA - Singularidade', 
    'Crie um sistema de auto-modificação que analisa seu próprio código via AST e se melhora recursivamente');

// Teste 7: POLYGLOT (Multi-linguagem)
testCase('POLYGLOT - Arquitetura Multi-linguagem', 
    'Crie um sistema com backend em Rust para performance, API em Go, scripts de automação em PowerShell e frontend em TypeScript');

// Teste 8: POLYGLOT (Decisão de Stack)
testCase('POLYGLOT - Escolha de Linguagem', 
    'Qual a melhor linguagem para criar um CLI tool de alta performance? Rust vs Go vs C++');

// Teste 9: Prompt simples (só TDD/Hono)
testCase('Prompt Simples - API', 
    'Crie uma API REST para gerenciar usuários');

// Teste 10: Fintech (Hybrid)
testCase('Fintech - Sistema Completo', 
    'Crie um sistema de pagamentos PIX com banco digital completo');

// Teste 11: POLYGLOT (FFI/Interop)
testCase('POLYGLOT - FFI e Interoperabilidade', 
    'Preciso integrar uma lib em C++ com Python usando bindings e expor via gRPC para Node.js');

log(`\n${'═'.repeat(70)}`, colors.green);
log('✅ TODOS OS TESTES CONCLUÍDOS', colors.green);
log(`${'═'.repeat(70)}`, colors.green);
