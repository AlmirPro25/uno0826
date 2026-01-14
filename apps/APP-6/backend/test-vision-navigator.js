/**
 * 🧪 TESTE: NAVEGAÇÃO COM VISÃO
 * Testa o sistema de navegação com análise visual do Gemini
 */

import { intelligentSearchAndNavigate, synthesizeResults } from './services/visionNavigatorService.js';

console.log(`
╔════════════════════════════════════════════════════════╗
║  🧪 TESTE: NAVEGAÇÃO COM VISÃO                        ║
╚════════════════════════════════════════════════════════╝
`);

async function runTest() {
    const tests = [
        {
            name: 'Notícias',
            query: 'notícias Rio de Janeiro hoje',
            maxLinks: 3
        },
        {
            name: 'Produtos',
            query: 'iPhone 15 preço',
            maxLinks: 3
        },
        {
            name: 'Informação',
            query: 'Python tutorial',
            maxLinks: 2
        }
    ];

    for (const test of tests) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 TESTE: ${test.name}`);
        console.log(`📝 Query: "${test.query}"`);
        console.log(`🔗 Links: ${test.maxLinks}`);
        console.log(`${'='.repeat(60)}\n`);

        try {
            const startTime = Date.now();

            // Executar busca com visão
            const results = await intelligentSearchAndNavigate(test.query, {
                searchEngine: 'bing',
                maxLinksToVisit: test.maxLinks,
                onProgress: (progress) => {
                    if (progress.phase) {
                        console.log(`📍 [${progress.phase}] ${progress.message}`);
                    } else if (progress.current) {
                        console.log(`   [${progress.current}/${progress.total}] ${progress.url} - ${progress.status}`);
                    }
                }
            });

            const duration = Date.now() - startTime;

            // Sintetizar resultados
            console.log('\n🧠 Sintetizando resultados...');
            const synthesis = await synthesizeResults(test.query, results.successfulResults);

            // Exibir resultados
            console.log(`\n✅ RESULTADO DO TESTE:`);
            console.log(`   ⏱️  Duração: ${Math.round(duration / 1000)}s`);
            console.log(`   🌐 Sites visitados: ${results.totalVisited}`);
            console.log(`   ✅ Sucessos: ${results.successCount}`);
            console.log(`   ❌ Falhas: ${results.totalVisited - results.successCount}`);

            // Mostrar análise da busca
            if (results.searchResult?.analysis) {
                console.log(`\n   📊 Análise da Busca:`);
                console.log(`      Resumo: ${results.searchResult.analysis.summary}`);
                console.log(`      Resultados: ${results.searchResult.analysis.results?.length || 0}`);
            }

            // Mostrar primeiros resultados de navegação
            if (results.successfulResults.length > 0) {
                console.log(`\n   📋 Primeiros Resultados:`);
                results.successfulResults.slice(0, 2).forEach((r, i) => {
                    console.log(`\n      ${i + 1}. ${r.url}`);
                    console.log(`         Resumo: ${r.analysis?.summary?.substring(0, 100) || 'N/A'}...`);
                    console.log(`         Elementos: ${JSON.stringify(r.analysis?.visual_elements || {})}`);
                });
            }

            // Mostrar síntese
            console.log(`\n   📝 Síntese (primeiras 500 chars):`);
            console.log(`      ${synthesis.substring(0, 500)}...`);

            console.log(`\n   ✅ TESTE PASSOU!`);

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
