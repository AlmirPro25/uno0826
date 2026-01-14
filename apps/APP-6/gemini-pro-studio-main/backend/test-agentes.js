/**
 * 🧪 Script de Teste - Agentes de Navegação
 * 
 * Testa se os agentes estão funcionando corretamente
 */

const API_URL = 'http://localhost:3002';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testando: ${name}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Sucesso (${response.status})`);
      console.log('📦 Resposta:', JSON.stringify(data, null, 2));
    } else {
      console.log(`⚠️ Erro (${response.status})`);
      console.log('📦 Resposta:', JSON.stringify(data, null, 2));
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log(`❌ Falha: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes dos Agentes de Navegação\n');
  console.log('=' .repeat(60));
  
  // Teste 1: Health Check
  await testEndpoint(
    'Health Check',
    `${API_URL}/health`
  );
  
  // Teste 2: Estatísticas dos Agentes
  await testEndpoint(
    'Estatísticas dos Agentes',
    `${API_URL}/api/navigator/stats`
  );
  
  // Teste 3: Estatísticas do Navegador
  await testEndpoint(
    'Estatísticas do Navegador',
    `${API_URL}/api/browser/stats`
  );
  
  // Teste 4: Gerar Plano (vai falhar se não tiver API key, mas testa a rota)
  await testEndpoint(
    'Gerar Plano de Navegação',
    `${API_URL}/api/navigator/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIntent: 'Busque por Python no Google',
        context: {}
      })
    }
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Testes concluídos!\n');
  console.log('📝 Notas:');
  console.log('- Se "Gerar Plano" retornar erro de API key, é normal');
  console.log('- Configure GEMINI_API_KEY no .env para testar completamente');
  console.log('- Se algum endpoint retornar 404, reinicie o backend\n');
}

// Executar testes
runTests().catch(console.error);
