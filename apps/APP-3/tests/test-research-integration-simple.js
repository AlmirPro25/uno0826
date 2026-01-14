/**
 * 🧪 TESTE SIMPLES DE INTEGRAÇÃO - Web Research
 * 
 * Este script testa se o backend de pesquisa está funcionando corretamente.
 * 
 * Para executar:
 * 1. Inicie o backend: cd backend && npm run dev
 * 2. Execute: node tests/test-research-integration-simple.js
 */

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3001';

async function testResearchIntegration() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧪 TESTE DE INTEGRAÇÃO - WEB RESEARCH SERVICE            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Testar status do serviço
  console.log('📡 1. Testando status do serviço...');
  try {
    const statusResponse = await fetch(`${BACKEND_URL}/api/research/status`);
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      console.log('   ✅ Serviço online!');
      console.log(`   📊 Playwright: ${statusData.data.playwrightAvailable ? 'Disponível' : 'Não disponível'}`);
      console.log(`   📚 APIs: ${statusData.data.apis.map(a => a.name).join(', ')}`);
    } else {
      console.log('   ❌ Serviço offline');
      return;
    }
  } catch (error) {
    console.log(`   ❌ Erro ao conectar: ${error.message}`);
    console.log('\n   ⚠️ Certifique-se de que o backend está rodando:');
    console.log('      cd backend && npm run dev');
    return;
  }

  // 2. Testar pesquisa completa
  console.log('\n📡 2. Testando pesquisa completa (Liquid Neural Networks)...');
  try {
    const searchResponse = await fetch(`${BACKEND_URL}/api/research/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Liquid Neural Networks',
        maxResults: 5,
        includePapers: true,
        includeCode: true,
        includeNews: true
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('   ✅ Pesquisa concluída!');
      console.log(`   📊 Resultados: ${searchData.data.packets.length}`);
      console.log(`   📚 Fontes: ${searchData.data.sources.join(', ')}`);
      console.log(`   ⏱️ Tempo: ${searchData.data.searchTime}ms`);
      
      console.log('\n   📖 Primeiros resultados:');
      searchData.data.packets.slice(0, 3).forEach((p, i) => {
        console.log(`      ${i + 1}. [${p.source}] ${p.title.slice(0, 60)}...`);
      });
    } else {
      console.log(`   ❌ Erro: ${searchData.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro na pesquisa: ${error.message}`);
  }

  // 3. Testar ArXiv especificamente
  console.log('\n📡 3. Testando ArXiv (papers científicos)...');
  try {
    const arxivResponse = await fetch(`${BACKEND_URL}/api/research/arxiv/Liquid%20Neural%20Networks?max=3`);
    const arxivData = await arxivResponse.json();
    
    if (arxivData.success && arxivData.data.length > 0) {
      console.log('   ✅ ArXiv funcionando!');
      console.log(`   📚 Papers encontrados: ${arxivData.data.length}`);
      
      arxivData.data.forEach((paper, i) => {
        console.log(`      ${i + 1}. ${paper.title.slice(0, 70)}...`);
        console.log(`         Autores: ${paper.metadata.author?.slice(0, 50) || 'N/A'}...`);
      });
    } else {
      console.log('   ⚠️ Nenhum paper encontrado');
    }
  } catch (error) {
    console.log(`   ❌ Erro ArXiv: ${error.message}`);
  }

  // 4. Testar GitHub
  console.log('\n📡 4. Testando GitHub (repositórios)...');
  try {
    const githubResponse = await fetch(`${BACKEND_URL}/api/research/github/liquid%20neural%20network?max=3`);
    const githubData = await githubResponse.json();
    
    if (githubData.success && githubData.data.length > 0) {
      console.log('   ✅ GitHub funcionando!');
      console.log(`   🐙 Repositórios encontrados: ${githubData.data.length}`);
      
      githubData.data.forEach((repo, i) => {
        console.log(`      ${i + 1}. ${repo.title}`);
        console.log(`         ${repo.summary.slice(0, 60)}...`);
      });
    } else {
      console.log('   ⚠️ Nenhum repositório encontrado');
    }
  } catch (error) {
    console.log(`   ❌ Erro GitHub: ${error.message}`);
  }

  // 5. Testar Wikipedia
  console.log('\n📡 5. Testando Wikipedia...');
  try {
    const wikiResponse = await fetch(`${BACKEND_URL}/api/research/wikipedia/neural%20network?lang=en`);
    const wikiData = await wikiResponse.json();
    
    if (wikiData.success && wikiData.data.length > 0) {
      console.log('   ✅ Wikipedia funcionando!');
      console.log(`   📖 Artigos encontrados: ${wikiData.data.length}`);
      
      wikiData.data.forEach((article, i) => {
        console.log(`      ${i + 1}. ${article.title}`);
      });
    } else {
      console.log('   ⚠️ Nenhum artigo encontrado');
    }
  } catch (error) {
    console.log(`   ❌ Erro Wikipedia: ${error.message}`);
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    🎉 TESTE CONCLUÍDO!                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Se todos os testes passaram, o sistema está pronto!');
  console.log('   2. Teste no chat: "Pesquise sobre Liquid Neural Networks"');
  console.log('   3. A IA deve usar o backend para pesquisar sem erros de CORS');
}

// Executar
testResearchIntegration().catch(console.error);
