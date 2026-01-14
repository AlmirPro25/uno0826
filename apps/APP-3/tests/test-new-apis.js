/**
 * 🧪 TESTE DAS NOVAS APIs - ArXiv, GitHub, Stack Overflow
 * 
 * Testa as novas integrações de pesquisa adicionadas ao WebResearchEngine
 */

const API_TESTS = {
  // ============================================================================
  // TESTE 1: ArXiv API (Papers Científicos)
  // ============================================================================
  async testArXiv() {
    console.log('\n📄 Testando ArXiv API...');
    
    const query = 'transformer attention mechanism';
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=3`;
    
    try {
      const response = await fetch(url);
      const xmlText = await response.text();
      
      // Verificar se retornou XML válido
      if (!xmlText.includes('<entry>')) {
        console.log('⚠️ ArXiv: Nenhum resultado encontrado');
        return { success: true, results: 0, note: 'Sem resultados' };
      }
      
      // Contar entradas
      const entries = xmlText.split('<entry>').length - 1;
      
      // Extrair primeiro título
      const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/);
      const firstTitle = titleMatch ? titleMatch[1].trim() : 'N/A';
      
      console.log(`✅ ArXiv: ${entries} papers encontrados`);
      console.log(`   Primeiro: "${firstTitle.slice(0, 60)}..."`);
      
      return { success: true, results: entries, sample: firstTitle };
    } catch (error) {
      console.log(`❌ ArXiv: Erro - ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // TESTE 2: GitHub API (Repositórios)
  // ============================================================================
  async testGitHub() {
    console.log('\n🐙 Testando GitHub API...');
    
    const query = 'react typescript template';
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=3`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'WebResearchEngine-Test/1.0'
        }
      });
      
      if (response.status === 403) {
        console.log('⚠️ GitHub: Rate limit atingido (60 req/hora sem auth)');
        return { success: true, results: 0, note: 'Rate limited' };
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.log('⚠️ GitHub: Nenhum resultado encontrado');
        return { success: true, results: 0, note: 'Sem resultados' };
      }
      
      const firstRepo = data.items[0];
      console.log(`✅ GitHub: ${data.items.length} repositórios encontrados`);
      console.log(`   Primeiro: ${firstRepo.full_name} (⭐ ${firstRepo.stargazers_count})`);
      
      return { 
        success: true, 
        results: data.items.length, 
        sample: firstRepo.full_name,
        stars: firstRepo.stargazers_count
      };
    } catch (error) {
      console.log(`❌ GitHub: Erro - ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // TESTE 3: Stack Overflow API (Q&A)
  // ============================================================================
  async testStackOverflow() {
    console.log('\n📝 Testando Stack Overflow API...');
    
    const query = 'react hooks useEffect';
    const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=3`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error_id) {
        console.log(`⚠️ Stack Overflow: Erro da API - ${data.error_message}`);
        return { success: false, error: data.error_message };
      }
      
      if (!data.items || data.items.length === 0) {
        console.log('⚠️ Stack Overflow: Nenhum resultado encontrado');
        return { success: true, results: 0, note: 'Sem resultados' };
      }
      
      const firstQuestion = data.items[0];
      console.log(`✅ Stack Overflow: ${data.items.length} perguntas encontradas`);
      console.log(`   Primeira: "${firstQuestion.title.slice(0, 60)}..."`);
      console.log(`   Score: ${firstQuestion.score} | Respostas: ${firstQuestion.answer_count}`);
      
      return { 
        success: true, 
        results: data.items.length, 
        sample: firstQuestion.title,
        score: firstQuestion.score
      };
    } catch (error) {
      console.log(`❌ Stack Overflow: Erro - ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // TESTE 4: APIs Existentes (Verificação)
  // ============================================================================
  async testExistingAPIs() {
    console.log('\n🔄 Verificando APIs existentes...');
    
    const results = {};
    
    // Wikipedia
    try {
      const wikiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=JavaScript&format=json&origin=*&srlimit=1';
      const wikiResponse = await fetch(wikiUrl);
      const wikiData = await wikiResponse.json();
      results.wikipedia = wikiData.query?.search?.length > 0;
      console.log(`   Wikipedia: ${results.wikipedia ? '✅' : '❌'}`);
    } catch {
      results.wikipedia = false;
      console.log('   Wikipedia: ❌');
    }
    
    // DuckDuckGo
    try {
      const ddgUrl = 'https://api.duckduckgo.com/?q=JavaScript&format=json&no_html=1';
      const ddgResponse = await fetch(ddgUrl);
      const ddgData = await ddgResponse.json();
      results.duckduckgo = ddgData.Abstract?.length > 0 || ddgData.RelatedTopics?.length > 0;
      console.log(`   DuckDuckGo: ${results.duckduckgo ? '✅' : '❌'}`);
    } catch {
      results.duckduckgo = false;
      console.log('   DuckDuckGo: ❌');
    }
    
    // Hacker News
    try {
      const hnUrl = 'https://hn.algolia.com/api/v1/search?query=JavaScript&tags=story&hitsPerPage=1';
      const hnResponse = await fetch(hnUrl);
      const hnData = await hnResponse.json();
      results.hackerNews = hnData.hits?.length > 0;
      console.log(`   Hacker News: ${results.hackerNews ? '✅' : '❌'}`);
    } catch {
      results.hackerNews = false;
      console.log('   Hacker News: ❌');
    }
    
    // DEV.to
    try {
      const devtoUrl = 'https://dev.to/api/articles?per_page=1&tag=javascript';
      const devtoResponse = await fetch(devtoUrl);
      const devtoData = await devtoResponse.json();
      results.devto = Array.isArray(devtoData) && devtoData.length > 0;
      console.log(`   DEV.to: ${results.devto ? '✅' : '❌'}`);
    } catch {
      results.devto = false;
      console.log('   DEV.to: ❌');
    }
    
    return results;
  }
};

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     🧪 TESTE DAS NOVAS APIs - WebResearchEngine v2.0 🧪         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  
  const results = {
    arxiv: await API_TESTS.testArXiv(),
    github: await API_TESTS.testGitHub(),
    stackoverflow: await API_TESTS.testStackOverflow(),
    existing: await API_TESTS.testExistingAPIs()
  };
  
  // Resumo
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        📊 RESUMO FINAL                           ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  
  const newAPIs = [
    { name: 'ArXiv', result: results.arxiv },
    { name: 'GitHub', result: results.github },
    { name: 'Stack Overflow', result: results.stackoverflow }
  ];
  
  let passedNew = 0;
  newAPIs.forEach(api => {
    const status = api.result.success ? '✅ PASS' : '❌ FAIL';
    const info = api.result.results !== undefined ? `(${api.result.results} resultados)` : '';
    console.log(`║  ${api.name.padEnd(15)} ${status} ${info.padEnd(20)}║`);
    if (api.result.success) passedNew++;
  });
  
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  
  const existingAPIs = ['wikipedia', 'duckduckgo', 'hackerNews', 'devto'];
  let passedExisting = 0;
  existingAPIs.forEach(api => {
    const status = results.existing[api] ? '✅ PASS' : '❌ FAIL';
    console.log(`║  ${api.padEnd(15)} ${status}                              ║`);
    if (results.existing[api]) passedExisting++;
  });
  
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  NOVAS APIs:      ${passedNew}/3 passaram                              ║`);
  console.log(`║  APIs EXISTENTES: ${passedExisting}/4 passaram                              ║`);
  console.log(`║  TOTAL:           ${passedNew + passedExisting}/7 APIs funcionando                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  
  return {
    newAPIs: { passed: passedNew, total: 3 },
    existingAPIs: { passed: passedExisting, total: 4 },
    total: { passed: passedNew + passedExisting, total: 7 }
  };
}

// Executar
runAllTests().then(results => {
  console.log('\n✨ Teste concluído!');
  process.exit(results.total.passed === results.total.total ? 0 : 1);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
