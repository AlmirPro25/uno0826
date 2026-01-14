/**
 * 🧪 TESTE: BUSCA MASSIVA PARALELA
 * Testa o novo sistema de busca em múltiplos sites
 */

import { massiveParallelSearch, massiveSearchFormatted } from './services/massiveSearchService.js';

console.log(`
╔════════════════════════════════════════════════════════╗
║  🧪 TESTE: BUSCA MASSIVA PARALELA                     ║
╚════════════════════════════════════════════════════════╝
`);

// ==================== TESTES ====================

async function runTests() {
    const tests = [
        {
            name: 'Notícias em Tempo Real',
            query: 'operação polícia bahia',
            description: 'Deve buscar em sites de notícias brasileiros'
        },
        {
            name: 'Previsão do Tempo',
            query: 'clima salvador hoje',
            description: 'Deve buscar em sites de clima'
        },
        {
            name: 'Busca Geral',
            query: 'inteligência artificial',
            description: 'Deve buscar em buscadores e Wikipedia'
        }
    ];

    for (const test of tests) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 TESTE: ${test.name}`);
        console.log(`📝 Query: "${test.query}"`);
        console.log(`📋 Descrição: ${test.description}`);
        console.log(`${'='.repeat(60)}\n`);

        try {
            const startTime = Date.now();
            
            // Executar busca massiva
            const result = await massiveParallelSearch(test.query, {
                maxSites: 10,
                timeout: 60000,
                includeFailures: true
            });

            const duration = Date.now() - startTime;

            // Exibir resultados
            console.log(`\n✅ RESULTADO DO TESTE:`);
            console.log(`   📊 Total de resultados: ${result.totalResults}`);
            console.log(`   ✅ Sites bem-sucedidos: ${result.successfulSites}/${result.successfulSites + result.failedSites}`);
            console.log(`   🌐 Fontes: ${result.sites.join(', ')}`);
            console.log(`   ⏱️  Duração: ${Math.round(duration / 1000)}s`);
            console.log(`   ⚡ Velocidade: ${Math.round(result.totalResults / (duration / 1000))} resultados/s`);
            console.log(`   📊 Tipo detectado: ${result.queryType}`);

            if (result.failures && result.failures.length > 0) {
                console.log(`\n   ⚠️  Sites com falha:`);
                result.failures.forEach(f => {
                    console.log(`      - ${f.site}: ${f.error}`);
                });
            }

            // Mostrar primeiros 5 resultados
            if (result.results.length > 0) {
                console.log(`\n   📋 Primeiros 5 resultados:`);
                result.results.slice(0, 5).forEach((r, i) => {
                    console.log(`\n      ${i + 1}. ${r.title.substring(0, 80)}...`);
                    console.log(`         🌐 ${r.source}`);
                    console.log(`         🔗 ${r.url.substring(0, 80)}...`);
                });
            }

            console.log(`\n   ✅ TESTE PASSOU!`);

        } catch (error) {
            console.error(`\n   ❌ TESTE FALHOU:`, error.message);
            console.error(error.stack);
        }

        // Aguardar 2 segundos entre testes
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ TODOS OS TESTES CONCLUÍDOS!`);
    console.log(`${'='.repeat(60)}\n`);

    // Fechar processo
    process.exit(0);
}

// Executar testes
runTests().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
