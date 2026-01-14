/**
 * 🧪 TESTE DOS KIRO TOOLS
 * 
 * Testa todos os endpoints do Kiro Tools
 */

const API_BASE = 'http://localhost:3001/api/kiro';

async function testEndpoint(name, method, url, body = null) {
  console.log(`\n🔧 Testando: ${name}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (data.success) {
      console.log(`   ✅ SUCESSO`);
      if (data.results) console.log(`   📊 ${data.results?.length || 0} resultados`);
      if (data.tree) console.log(`   📁 ${data.tree?.length || 0} itens`);
      if (data.files) console.log(`   📚 ${data.files?.length || 0} arquivos`);
    } else {
      console.log(`   ❌ FALHOU: ${data.error}`);
    }
    
    return data;
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     🚀 TESTE DOS KIRO TOOLS           ║');
  console.log('╚════════════════════════════════════════╝');
  
  // 1. Grep Search
  await testEndpoint(
    'Grep Search',
    'POST',
    `${API_BASE}/search`,
    { query: 'export', path: 'services', includePattern: '**/*.ts', maxResults: 5 }
  );
  
  // 2. File Search
  await testEndpoint(
    'File Search',
    'GET',
    `${API_BASE}/file-search?query=Service`
  );
  
  // 3. List Recursive
  await testEndpoint(
    'List Recursive',
    'GET',
    `${API_BASE}/list-recursive?path=services&depth=1`
  );
  
  // 4. Read Multiple Files
  await testEndpoint(
    'Read Multiple Files',
    'POST',
    `${API_BASE}/read-multiple`,
    { paths: ['package.json', 'README.md'] }
  );
  
  // 5. Diagnostics
  await testEndpoint(
    'Get Diagnostics',
    'POST',
    `${API_BASE}/diagnostics`,
    { paths: ['services/GeminiService.ts'] }
  );
  
  console.log('\n════════════════════════════════════════');
  console.log('✅ Testes concluídos!');
  console.log('════════════════════════════════════════\n');
}

runTests().catch(console.error);
