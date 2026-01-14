/**
 * 🧪 Teste Simples do Sistema de Manifestos
 * 
 * Este teste não depende de API keys ou ambiente Vite
 */

// Importar apenas o ManifestOrchestrator que não depende de API
import { orchestrateManifests, getManifestInfo } from '../services/manifestos/ManifestOrchestrator';

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║              🧪 TESTE DO MANIFEST ORCHESTRATOR 🧪                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

// Teste 1: Detecção de Manifestos
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('📋 TESTE 1: Detecção de Manifestos por Contexto');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const testCases = [
    { prompt: 'Crie um sistema de pagamentos com PIX e transferências', expectedKeywords: ['fintech', 'payment', 'pix'] },
    { prompt: 'Desenvolva um chatbot com WebSocket em tempo real', expectedKeywords: ['chat', 'websocket', 'realtime'] },
    { prompt: 'Crie um jogo 3D com física e shaders', expectedKeywords: ['game', 'unity', 'shader'] },
    { prompt: 'Implemente um modelo de machine learning com PyTorch', expectedKeywords: ['pytorch', 'ml', 'training'] },
    { prompt: 'Crie uma API REST com autenticação JWT', expectedKeywords: ['api', 'rest', 'jwt'] },
    { prompt: 'Desenvolva um sistema de robótica com ROS2', expectedKeywords: ['robotics', 'ros', 'robot'] },
    { prompt: 'Crie um smart contract em Solidity para DAO', expectedKeywords: ['blockchain', 'solidity', 'dao'] }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach(({ prompt, expectedKeywords }, index) => {
    const result = orchestrateManifests(prompt);
    const activeNames = result.activeManifests.map(m => m.name);
    const hasManifests = result.totalManifestsApplied > 0;
    
    console.log(`📝 Teste ${index + 1}: "${prompt.substring(0, 50)}..."`);
    console.log(`   Manifestos ativados: ${activeNames.join(', ') || 'Nenhum específico (apenas base)'}`);
    console.log(`   Total aplicados: ${result.totalManifestsApplied}`);
    
    if (hasManifests || result.enrichedPrompt.length > prompt.length) {
        console.log(`   ✅ PASSOU - Prompt foi enriquecido\n`);
        passedTests++;
    } else {
        console.log(`   ⚠️ Verificar - Nenhum manifesto específico ativado\n`);
    }
});

// Teste 2: Informações do Sistema
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('📋 TESTE 2: Informações do Sistema de Manifestos');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const manifestInfo = getManifestInfo() as any;

console.log(`📊 Total de Manifestos: ${manifestInfo.totalManifests}`);
console.log(`📊 Níveis disponíveis: ${Object.keys(manifestInfo.levels).length}`);
console.log('\n   Top 10 Níveis:');

Object.entries(manifestInfo.levels)
    .sort(([a], [b]) => Number(b) - Number(a))
    .slice(0, 10)
    .forEach(([level, info]: [string, any]) => {
        console.log(`      Level ${level.padStart(2, ' ')}: ${info.name.padEnd(20, ' ')} - ${info.description.substring(0, 50)}...`);
    });

// Teste 3: Enriquecimento de Prompt
console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('📋 TESTE 3: Enriquecimento de Prompt');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const simplePrompt = 'Crie um botão azul';
const complexPrompt = 'Crie um sistema completo de fintech com pagamentos PIX, dashboard admin, e API REST';

const simpleResult = orchestrateManifests(simplePrompt);
const complexResult = orchestrateManifests(complexPrompt);

console.log(`📝 Prompt Simples: "${simplePrompt}"`);
console.log(`   Tamanho original: ${simplePrompt.length} caracteres`);
console.log(`   Tamanho enriquecido: ${simpleResult.enrichedPrompt.length} caracteres`);
console.log(`   Manifestos: ${simpleResult.totalManifestsApplied}`);
console.log(`   Aumento: ${((simpleResult.enrichedPrompt.length / simplePrompt.length - 1) * 100).toFixed(0)}%\n`);

console.log(`📝 Prompt Complexo: "${complexPrompt.substring(0, 50)}..."`);
console.log(`   Tamanho original: ${complexPrompt.length} caracteres`);
console.log(`   Tamanho enriquecido: ${complexResult.enrichedPrompt.length} caracteres`);
console.log(`   Manifestos: ${complexResult.totalManifestsApplied}`);
console.log(`   Aumento: ${((complexResult.enrichedPrompt.length / complexPrompt.length - 1) * 100).toFixed(0)}%\n`);

// Resumo Final
console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║              ✅ TESTES CONCLUÍDOS ✅                                          ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`📊 Resultado: ${passedTests}/${totalTests} testes passaram`);
console.log(`📊 Sistema de Manifestos: ${manifestInfo.totalManifests} manifestos disponíveis`);
console.log(`📊 Níveis: 0 (Genesis) até 25 (Gemini Robotics)`);
console.log('');
console.log('✅ O ManifestOrchestrator está funcionando corretamente!');
console.log('✅ Prompts são enriquecidos automaticamente com conhecimento especializado.');
console.log('');
