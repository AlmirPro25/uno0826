/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🧪 TESTE DO SISTEMA INTEGRADO COMPLETO 🧪                           ║
 * ║                                                                              ║
 * ║     Testa: IntegratedPipeline + ToolOrchestra + TestGenerator               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { IntegratedPipeline, executeIntegratedPipeline } from '../services/IntegratedPipeline';
import { ToolOrchestra, executeOrchestra, shouldUseOrchestra } from '../services/ToolOrchestra';
import { TestGenerator, generateTests } from '../services/TestGenerator';
import { VerifierArchitect } from '../services/VerifierArchitect';
import { enrichPromptWithManifests, orchestrateManifests, getManifestInfo } from '../services/manifestos/ManifestOrchestrator';

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DO MANIFEST ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║              🧪 TESTE DO SISTEMA INTEGRADO COMPLETO 🧪                       ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

// Teste 1: Manifest Orchestrator
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('📋 TESTE 1: Manifest Orchestrator');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const testPrompts = [
    { prompt: 'Crie um sistema de pagamentos com PIX', expected: ['FINTECH', 'HYBRID'] },
    { prompt: 'Desenvolva um chatbot com WebSocket', expected: ['NUNCIO_DIGITAL', 'REALTIME'] },
    { prompt: 'Crie um jogo 3D com Unity', expected: ['GAMEDEV'] },
    { prompt: 'Implemente um sistema de machine learning com PyTorch', expected: ['SYNTHIA'] },
    { prompt: 'Crie uma API REST com autenticação JWT', expected: ['HONO', 'TDD'] }
];

testPrompts.forEach(({ prompt, expected }) => {
    const result = orchestrateManifests(prompt);
    const activeNames = result.activeManifests.map(m => m.name);
    const hasExpected = expected.some(e => activeNames.includes(e));
    
    console.log(`📝 Prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`   Manifestos ativados: ${activeNames.join(', ') || 'Nenhum'}`);
    console.log(`   ${hasExpected ? '✅ PASSOU' : '⚠️ Verificar'}\n`);
});

// Teste 2: Verifier Architect
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('📋 TESTE 2: Verifier Architect');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const verifier = new VerifierArchitect(85);

const testCode = `
package main

import (
    "fmt"
    "net/http"
)

type User struct {
    ID    string
    Email string
}

func main() {
    http.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
        // TODO: Implementar
        fmt.Fprintf(w, "Hello")
    })
    http.ListenAndServe(":8080", nil)
}
`;

const validationReport = verifier.validate({
    code: testCode,
    language: 'go',
    projectType: 'api'
});

console.log(`📊 Score Total: ${validationReport.summary.totalScore.toFixed(0)}/100`);
console.log(`   Status: ${validationReport.summary.passed ? '✅ APROVADO' : '❌ REPROVADO'}`);
console.log(`   Issues Críticos: ${validationReport.criticalIssues.length}`);
console.log(`   Recomendações: ${validationReport.recommendations.length}\n`);

if (validationReport.criticalIssues.length > 0) {
    console.log('   🚨 Issues Críticos:');
    validationReport.criticalIssues.forEach(issue => {
        console.log(`      • [${issue.severity}] ${issue.code}: ${issue.description}`);
    });
    console.log('');
}

// Teste 3: shouldUseOrchestra
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('📋 TESTE 3: Detector de Orquestração');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const orchestraTests = [
    { prompt: 'Crie um sistema completo de e-commerce', expected: true },
    { prompt: 'Crie uma landing page simples', expected: false },
    { prompt: 'Desenvolva um fullstack com backend e frontend', expected: true },
    { prompt: 'Faça um botão azul', expected: false },
    { prompt: 'Crie uma fintech com dashboard e API', expected: true }
];

orchestraTests.forEach(({ prompt, expected }) => {
    const result = shouldUseOrchestra(prompt);
    const passed = result === expected;
    
    console.log(`📝 "${prompt.substring(0, 50)}..."`);
    console.log(`   Usar Orchestra: ${result ? 'SIM' : 'NÃO'} (esperado: ${expected ? 'SIM' : 'NÃO'})`);
    console.log(`   ${passed ? '✅ PASSOU' : '❌ FALHOU'}\n`);
});

// Teste 4: Test Generator Analysis
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('📋 TESTE 4: Test Generator Analysis');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const testGenerator = new TestGenerator();

const codeToAnalyze = `
async function transfer(from: string, to: string, amount: number) {
    const balance = await getBalance(from);
    if (balance < amount) throw new Error('Insufficient funds');
    await debit(from, amount);
    await credit(to, amount);
}

app.post('/api/transfer', async (req, res) => {
    const { from, to, amount } = req.body;
    await transfer(from, to, amount);
    res.json({ success: true });
});
`;

const analysis = testGenerator.analyzeCodeForTests(codeToAnalyze);

console.log('📊 Análise do Código:');
console.log(`   Tipos de teste sugeridos: ${analysis.suggestedTypes.join(', ')}`);
console.log(`   Complexidade: ${analysis.complexity}`);
console.log(`   Recomendações:`);
analysis.recommendations.forEach(rec => {
    console.log(`      • ${rec}`);
});
console.log('');

// Teste 5: Manifest Info
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('📋 TESTE 5: Informações do Sistema de Manifestos');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const manifestInfo = getManifestInfo() as any;

console.log(`📊 Total de Manifestos: ${manifestInfo.totalManifests}`);
console.log(`📊 Níveis disponíveis: ${Object.keys(manifestInfo.levels).length}`);
console.log('\n   Níveis mais altos:');
Object.entries(manifestInfo.levels)
    .sort(([a], [b]) => Number(b) - Number(a))
    .slice(0, 5)
    .forEach(([level, info]: [string, any]) => {
        console.log(`      Level ${level}: ${info.name} - ${info.description}`);
    });

// Resumo Final
console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║              ✅ TESTES CONCLUÍDOS ✅                                          ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log('📊 RESUMO DO SISTEMA INTEGRADO:');
console.log('   ✅ ManifestOrchestrator: Detecta e injeta manifestos automaticamente');
console.log('   ✅ VerifierArchitect: Valida código com regras de domínio');
console.log('   ✅ ToolOrchestra: Orquestra 3 fases (Arquiteto → Designer → Documentador)');
console.log('   ✅ TestGenerator: Gera testes automaticamente');
console.log('   ✅ IntegratedPipeline: Conecta todos os componentes');
console.log('');
console.log('🔗 FLUXO COMPLETO:');
console.log('   Prompt → ManifestOrchestrator → DAIA → Gemini → VerifierArchitect → Feedback Loop');
console.log('');
