/**
 * 🧪 TESTE RÁPIDO DAS APIs DE PESQUISA
 * 
 * Execute: node tests/quick-test-research.js
 */

async function testWikipediaAPI() {
  console.log('\n📚 Testando Wikipedia API...');
  
  try {
    const response = await fetch(
      'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=TypeScript&format=json&origin=*&srlimit=3'
    );
    const data = await response.json();
    
    if (data.query?.search?.length > 0) {
      console.log('   ✅ Wikipedia API: OK');
      console.log(`   📄 Encontrados: ${data.query.search.length} resultados`);
      console.log(`   📝 Primeiro: "${data.query.search[0].title}"`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ Wikipedia API: ERRO', error.message);
  }
  return false;
}

async function testDuckDuckGoAPI() {
  console.log('\n🦆 Testando DuckDuckGo API...');
  
  try {
    const response = await fetch(
      'https://api.duckduckgo.com/?q=JavaScript&format=json&no_html=1&skip_disambig=1'
    );
    const data = await response.json();
    
    if (data.Abstract || data.RelatedTopics?.length > 0) {
      console.log('   ✅ DuckDuckGo API: OK');
      if (data.Abstract) {
        console.log(`   📝 Abstract: "${data.Abstract.slice(0, 100)}..."`);
      }
      return true;
    }
  } catch (error) {
    console.log('   ❌ DuckDuckGo API: ERRO', error.message);
  }
  return false;
}

async function testHackerNewsAPI() {
  console.log('\n📰 Testando Hacker News API...');
  
  try {
    const response = await fetch(
      'https://hn.algolia.com/api/v1/search?query=AI&tags=story&hitsPerPage=3'
    );
    const data = await response.json();
    
    if (data.hits?.length > 0) {
      console.log('   ✅ Hacker News API: OK');
      console.log(`   📄 Encontrados: ${data.hits.length} notícias`);
      console.log(`   📝 Primeira: "${data.hits[0].title}"`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ Hacker News API: ERRO', error.message);
  }
  return false;
}

async function testDevToAPI() {
  console.log('\n📖 Testando DEV.to API...');
  
  try {
    const response = await fetch(
      'https://dev.to/api/articles?per_page=3&tag=javascript'
    );
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('   ✅ DEV.to API: OK');
      console.log(`   📄 Encontrados: ${data.length} artigos`);
      console.log(`   📝 Primeiro: "${data[0].title}"`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ DEV.to API: ERRO', error.message);
  }
  return false;
}

async function main() {
  console.log('='.repeat(50));
  console.log('🌐 WEB RESEARCH ENGINE - TESTE RÁPIDO DAS APIs');
  console.log('='.repeat(50));
  
  const results = [];
  
  results.push(await testWikipediaAPI());
  results.push(await testDuckDuckGoAPI());
  results.push(await testHackerNewsAPI());
  results.push(await testDevToAPI());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESULTADO: ${passed}/${total} APIs funcionando`);
  console.log('='.repeat(50));
  
  if (passed === total) {
    console.log('\n✅ Todas as APIs estão funcionando! O sistema está pronto.');
  } else {
    console.log('\n⚠️  Algumas APIs falharam. Verifique sua conexão com a internet.');
  }
}

main().catch(console.error);
