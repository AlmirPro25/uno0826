/**
 * 🧪 TESTE DA API DE PESQUISA
 * 
 * Execute: node test-research-api.js
 * (Certifique-se de que o backend está rodando: npm run dev)
 */

const BASE_URL = 'http://localhost:3001/api/research';

async function testAPI(name, url, options = {}) {
  console.log(`\n🔍 Testando: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (data.success) {
      console.log(`   ✅ Sucesso!`);
      if (data.data.packets) {
        console.log(`   📦 ${data.data.packets.length} resultados`);
        data.data.packets.slice(0, 2).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.title} (${p.source})`);
        });
      } else if (Array.isArray(data.data)) {
        console.log(`   📦 ${data.data.length} resultados`);
        data.data.slice(0, 2).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.title} (${p.source})`);
        });
      } else {
        console.log(`   📊 Status:`, data.data);
      }
    } else {
      console.log(`   ❌ Erro: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Falha: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 TESTANDO API DE PESQUISA DO BACKEND');
  console.log('=====================================');

  // 1. Status
  await testAPI('Status do Serviço', `${BASE_URL}/status`);

  // 2. Wikipedia
  await testAPI('Wikipedia', `${BASE_URL}/wikipedia/TypeScript?lang=en`);

  // 3. ArXiv (papers)
  await testAPI('ArXiv (Papers)', `${BASE_URL}/arxiv/transformer%20attention?max=3`);

  // 4. GitHub
  await testAPI('GitHub', `${BASE_URL}/github/react?max=3`);

  // 5. Stack Overflow
  await testAPI('Stack Overflow', `${BASE_URL}/stackoverflow/react%20hooks?max=3`);

  // 6. Hacker News
  await testAPI('Hacker News', `${BASE_URL}/hackernews/AI`);

  // 7. Pesquisa completa
  await testAPI('Pesquisa Completa', `${BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Liquid Neural Networks',
      maxResults: 5,
      includeCode: true,
      includePapers: true,
      includeNews: true
    })
  });

  console.log('\n=====================================');
  console.log('✅ TESTES CONCLUÍDOS');
}

runTests();
