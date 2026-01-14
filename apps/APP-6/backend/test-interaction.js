/**
 * 🧪 TESTE: SISTEMA DE INTERAÇÃO
 * Testa o sistema completo de interação autônoma
 */

import { navigateAndInteract } from './services/interactionService.js';

console.log(`
╔════════════════════════════════════════════════════════╗
║  🧪 TESTE: SISTEMA DE INTERAÇÃO AUTÔNOMA              ║
╚════════════════════════════════════════════════════════╝
`);

async function runTest() {
    const tests = [
        {
            name: 'Busca no Mercado Livre',
            url: 'https://www.mercadolivre.com.br',
            objective: 'Buscar "iPhone 15" no campo de busca e pressionar Enter',
            maxSteps: 5
        },
        {
            name: 'Busca no Google',
            url: 'https://www.google.com',
            objective: 'Buscar "Playwright tutorial" e extrair os primeiros resultados',
            maxSteps: 5
        },
        {
            name: 'Navegação no GitHub',
            url: 'https://github.com',
            objective: 'Clicar no campo de busca e buscar "react"',
            maxSteps: 5
        }
    ];

    for (const test of tests) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 TESTE: ${test.name}`);
        console.log(`🌐 URL: ${test.url}`);
        console.log(`🎯 Objetivo: ${test.objective}`);
        console.log(`📍 Máximo de passos: ${test.maxSteps}`);
        console.log(`${'='.repeat(60)}\n`);

        try {
            const startTime = Date.now();

            // Executar interação
            const result = await navigateAndInteract(test.url, test.objective, {
                maxSteps: test.maxSteps,
                onProgress: (progress) => {
                    if (progress.phase) {
                        console.log(`📍 [${progress.phase}] ${progress.message}`);
                    } else if (progress.step) {
                        console.log(`   [${progress.step}/${progress.maxSteps}] ${progress.status}: ${progress.message}`);
                        if (progress.decision) {
                            console.log(`      Ação: ${progress.decision.action}`);
                            console.log(`      Confiança: ${progress.decision.confidence}/10`);
                        }
                    }
                }
            });

            const duration = Date.now() - startTime;

            // Exibir resultados
            console.log(`\n✅ RESULTADO DO TESTE:`);
            console.log(`   ⏱️  Duração: ${Math.round(duration / 1000)}s`);
            console.log(`   📊 Total de passos: ${result.interactionResult.totalSteps}`);
            console.log(`   ✅ Objetivo alcançado: ${result.interactionResult.completed ? 'SIM' : 'NÃO'}`);
            console.log(`   🎯 Sucesso: ${result.success ? 'SIM' : 'NÃO'}`);

            // Mostrar ações executadas
            if (result.interactionResult.actions.length > 0) {
                console.log(`\n   📋 Ações Executadas:`);
                result.interactionResult.actions.forEach((action, i) => {
                    const status = action.executionResult.success ? '✅' : '❌';
                    console.log(`\n      ${i + 1}. ${status} ${action.decision.action}`);
                    console.log(`         Descrição: ${action.decision.description}`);
                    console.log(`         Raciocínio: ${action.decision.reasoning}`);
                    if (action.decision.selector) {
                        console.log(`         Seletor: ${action.decision.selector}`);
                    }
                    if (action.decision.value) {
                        console.log(`         Valor: ${action.decision.value}`);
                    }
                });
            }

            // Mostrar conteúdo final
            if (result.finalContent) {
                console.log(`\n   📝 Conteúdo Final:`);
                console.log(`      Texto: ${result.finalContent.text?.substring(0, 200) || 'N/A'}...`);
                console.log(`      Links: ${result.finalContent.links?.length || 0}`);
            }

            console.log(`\n   ${result.success ? '✅ TESTE PASSOU!' : '❌ TESTE FALHOU!'}`);

        } catch (error) {
            console.error(`\n   ❌ TESTE FALHOU:`, error.message);
            console.error(error.stack);
        }

        // Aguardar entre testes
        if (tests.indexOf(test) < tests.length - 1) {
            console.log('\n⏳ Aguardando 5 segundos...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ TODOS OS TESTES CONCLUÍDOS!`);
    console.log(`${'='.repeat(60)}\n`);

    process.exit(0);
}

// Executar testes
runTest().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
