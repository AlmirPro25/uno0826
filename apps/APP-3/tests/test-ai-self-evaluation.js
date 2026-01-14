/**
 * Teste do Sistema de Auto-Avaliação da IA
 * Verifica se o fluxo completo está funcionando
 */

import { executeAISelfImprovement } from './services/AISelfevaluationSystem.js';

// Código de exemplo com problemas intencionais para testar a auto-avaliação
const testCode = `
<!DOCTYPE html>
<html>
<head>
    <title>App de Teste</title>
</head>
<body>
    <h1>Meu App</h1>
    <button onclick="alert('TODO: Implementar funcionalidade')">Clique Aqui</button>
    
    <script>
        // Simular login
        function login() {
            // Aqui você implementaria a autenticação real
            console.log("Login simulado");
            return true;
        }
        
        // Dados mockados
        const userData = {
            name: "Lorem Ipsum",
            email: "test@example.com"
        };
        
        // Base64 de uma imagem (problema crítico)
        const logoImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    </script>
</body>
</html>
`;

const originalPrompt = "Crie um sistema de login simples com HTML e JavaScript";

async function testAISelfEvaluation() {
    console.log('🧪 Iniciando teste do sistema de auto-avaliação da IA');
    console.log('=' .repeat(60));
    
    try {
        // Executar o ciclo completo de auto-melhoria
        const result = await executeAISelfImprovement(testCode, originalPrompt, 85);
        
        console.log('\n📊 RESULTADOS DO TESTE:');
        console.log('=' .repeat(40));
        console.log(`Score Original: ${result.originalScore}/100`);
        console.log(`Score Final: ${result.finalScore}/100`);
        console.log(`Ciclo Bem-sucedido: ${result.cycleSuccessful ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`Iterações Usadas: ${result.correctionDetails.iterationsUsed}`);
        
        console.log('\n🔍 ANÁLISE DA IA:');
        console.log('-'.repeat(30));
        console.log(result.evaluationDetails.selfAnalysis);
        
        console.log('\n⚠️ PROBLEMAS DETECTADOS:');
        console.log('-'.repeat(30));
        result.evaluationDetails.detectedIssues.forEach((issue, index) => {
            console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
            console.log(`   Descrição: ${issue.description}`);
            console.log(`   Sugestão: ${issue.suggestion}\n`);
        });
        
        console.log('📋 PLANO DE MELHORIA:');
        console.log('-'.repeat(30));
        result.evaluationDetails.improvementPlan.forEach((plan, index) => {
            console.log(`${index + 1}. ${plan}`);
        });
        
        console.log('\n🔧 MUDANÇAS APLICADAS:');
        console.log('-'.repeat(30));
        result.correctionDetails.changesApplied.forEach((change, index) => {
            console.log(`${index + 1}. ${change}`);
        });
        
        console.log('\n💻 CÓDIGO FINAL (primeiras 500 chars):');
        console.log('-'.repeat(50));
        console.log(result.finalCode.substring(0, 500) + '...');
        
        // Verificar se melhorou significativamente
        const improvement = result.finalScore - result.originalScore;
        
        console.log('\n🎯 AVALIAÇÃO DO TESTE:');
        console.log('=' .repeat(40));
        
        if (improvement > 10) {
            console.log('✅ TESTE PASSOU: Melhoria significativa detectada!');
            console.log(`   Melhoria: +${improvement} pontos`);
        } else if (improvement > 0) {
            console.log('⚠️ TESTE PARCIAL: Pequena melhoria detectada');
            console.log(`   Melhoria: +${improvement} pontos`);
        } else {
            console.log('❌ TESTE FALHOU: Nenhuma melhoria detectada');
            console.log(`   Mudança: ${improvement} pontos`);
        }
        
        // Verificar se problemas críticos foram detectados
        const criticalIssues = result.evaluationDetails.detectedIssues.filter(
            issue => issue.severity === 'critical'
        );
        
        if (criticalIssues.length > 0) {
            console.log(`✅ Problemas críticos detectados: ${criticalIssues.length}`);
        } else {
            console.log('⚠️ Nenhum problema crítico detectado (pode ser um problema)');
        }
        
        console.log('\n🏁 TESTE CONCLUÍDO');
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
        console.error('Stack:', error.stack);
    }
}

// Executar o teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testAISelfEvaluation();
}

export { testAISelfEvaluation };
