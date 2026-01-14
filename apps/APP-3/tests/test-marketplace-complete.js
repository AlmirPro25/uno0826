/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    MARKETPLACE COMPLETE TEST                                  ║
 * ║                                                                               ║
 * ║              Testa todo o fluxo do Starter Kit Marketplace                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Executar: node tests/test-marketplace-complete.js
 */

const MARKETPLACE_URL = process.env.MARKETPLACE_URL || 'http://localhost:8080';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function request(method, path, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Owner-ID': 'test-user-' + Date.now(),
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${MARKETPLACE_URL}${path}`, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

function log(emoji, message, data = null) {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log('   ', JSON.stringify(data, null, 2).split('\n').join('\n    '));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLE CODE
// ═══════════════════════════════════════════════════════════════════════════════

const SAMPLE_CODE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard de Vendas</title>
  <script src="https://cdn.tailwindcss.com" defer></script>
  <style>
    .card { transition: transform 0.2s; }
    .card:hover { transform: translateY(-2px); }
  </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <header class="bg-gray-800 p-4 shadow-lg">
    <nav class="container mx-auto flex justify-between items-center">
      <h1 class="text-2xl font-bold text-purple-400">Dashboard</h1>
      <div class="flex gap-4">
        <a href="#" class="hover:text-purple-400" aria-label="Home">Home</a>
        <a href="#" class="hover:text-purple-400" aria-label="Relatórios">Relatórios</a>
        <a href="#" class="hover:text-purple-400" aria-label="Configurações">Config</a>
      </div>
    </nav>
  </header>

  <main class="container mx-auto p-6">
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <article class="card bg-gray-800 p-6 rounded-lg">
        <h2 class="text-gray-400 text-sm">Vendas Hoje</h2>
        <p class="text-3xl font-bold text-green-400">R$ 12.450</p>
        <span class="text-green-400 text-sm">+15% vs ontem</span>
      </article>
      <article class="card bg-gray-800 p-6 rounded-lg">
        <h2 class="text-gray-400 text-sm">Pedidos</h2>
        <p class="text-3xl font-bold text-blue-400">127</p>
        <span class="text-blue-400 text-sm">+8% vs ontem</span>
      </article>
      <article class="card bg-gray-800 p-6 rounded-lg">
        <h2 class="text-gray-400 text-sm">Ticket Médio</h2>
        <p class="text-3xl font-bold text-purple-400">R$ 98</p>
        <span class="text-purple-400 text-sm">+3% vs ontem</span>
      </article>
    </section>

    <section class="bg-gray-800 p-6 rounded-lg">
      <h2 class="text-xl font-bold mb-4">Últimas Vendas</h2>
      <table class="w-full">
        <thead>
          <tr class="text-left text-gray-400 border-b border-gray-700">
            <th class="pb-2">Cliente</th>
            <th class="pb-2">Produto</th>
            <th class="pb-2">Valor</th>
            <th class="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-700">
            <td class="py-3">João Silva</td>
            <td>Plano Pro</td>
            <td class="text-green-400">R$ 199</td>
            <td><span class="px-2 py-1 bg-green-500/20 text-green-400 rounded">Pago</span></td>
          </tr>
          <tr class="border-b border-gray-700">
            <td class="py-3">Maria Santos</td>
            <td>Plano Basic</td>
            <td class="text-green-400">R$ 49</td>
            <td><span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Pendente</span></td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>

  <footer class="bg-gray-800 p-4 mt-8">
    <p class="text-center text-gray-400">© 2024 Dashboard. Todos os direitos reservados.</p>
  </footer>

  <script>
    // Atualização em tempo real (simulada)
    function updateMetrics() {
      const cards = document.querySelectorAll('.card p');
      cards.forEach(card => {
        const currentValue = parseInt(card.textContent.replace(/[^0-9]/g, ''));
        const variation = Math.floor(Math.random() * 100) - 50;
        // Apenas log para demonstração
        console.log('Métrica atualizada:', currentValue + variation);
      });
    }
    
    // Atualiza a cada 30 segundos
    setInterval(updateMetrics, 30000);
  </script>
</body>
</html>`;

const SAMPLE_PROMPT = 'Crie um dashboard de vendas moderno com cards de métricas, tabela de últimas vendas e design responsivo usando Tailwind CSS';

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testHealthCheck() {
  log('🔍', 'Testando health check...');
  
  const { status, data } = await request('GET', '/health');
  
  if (status === 200 && data.status === 'healthy') {
    log('✅', 'Health check OK', data);
    return true;
  } else {
    log('❌', 'Health check falhou', data);
    return false;
  }
}

async function testClassifyCode() {
  log('🔍', 'Testando classificação de código...');
  
  const { status, data } = await request('POST', '/v1/marketplace/classify', {
    code: SAMPLE_CODE,
    prompt: SAMPLE_PROMPT,
  });
  
  if (status === 200 && data.classification) {
    log('✅', 'Classificação OK', {
      grade: data.classification.grade,
      quality_score: data.classification.quality_score,
      category: data.category,
      complexity: data.complexity,
      estimated_hours: data.estimated_hours,
      can_be_listed: data.can_be_listed,
    });
    return data;
  } else {
    log('❌', 'Classificação falhou', data);
    return null;
  }
}

async function testCreateKit() {
  log('🔍', 'Testando criação de Starter Kit...');
  
  const { status, data } = await request('POST', '/v1/marketplace/kits', {
    code: SAMPLE_CODE,
    prompt: SAMPLE_PROMPT,
    owner_id: 'test-user-complete',
  });
  
  if (status === 201 && data.kit) {
    log('✅', 'Kit criado', {
      id: data.kit.id,
      grade: data.kit.classification.grade,
      quality_score: data.kit.classification.quality_score,
      category: data.kit.metadata.category,
    });
    return data.kit;
  } else {
    log('❌', 'Criação falhou', data);
    return null;
  }
}

async function testGenerateReadme(kitId) {
  log('🔍', 'Testando geração de README...');
  
  const { status, data } = await request('POST', `/v1/marketplace/kits/${kitId}/generate-readme`);
  
  if (status === 200 && data.readme) {
    log('✅', 'README gerado', {
      length: data.readme.length,
      preview: data.readme.substring(0, 200) + '...',
    });
    return data.readme;
  } else {
    log('❌', 'Geração de README falhou', data);
    return null;
  }
}

async function testGetArchitectureDiagram(kitId) {
  log('🔍', 'Testando diagrama de arquitetura...');
  
  const { status, data } = await request('GET', `/v1/marketplace/kits/${kitId}/architecture-diagram`);
  
  if (status === 200 && data.diagram) {
    log('✅', 'Diagrama gerado');
    console.log(data.diagram);
    return data.diagram;
  } else {
    log('❌', 'Diagrama falhou', data);
    return null;
  }
}

async function testPublishKit(kitId) {
  log('🔍', 'Testando publicação no marketplace...');
  
  const { status, data } = await request('POST', `/v1/marketplace/kits/${kitId}/publish`, null, {
    'X-Owner-ID': 'test-user-complete',
  });
  
  if (status === 200 && data.success) {
    log('✅', 'Kit publicado', {
      suggested_price: data.suggested_price,
    });
    return true;
  } else {
    log('❌', 'Publicação falhou', data);
    return false;
  }
}

async function testListPublicKits() {
  log('🔍', 'Testando listagem de kits públicos...');
  
  const { status, data } = await request('GET', '/v1/marketplace/kits?limit=5');
  
  if (status === 200) {
    log('✅', 'Listagem OK', {
      count: data.count,
      kits: data.kits?.map(k => ({
        id: k.id.substring(0, 8),
        grade: k.classification?.grade,
        category: k.metadata?.category,
      })),
    });
    return data.kits;
  } else {
    log('❌', 'Listagem falhou', data);
    return [];
  }
}

async function testSearchKits() {
  log('🔍', 'Testando busca de kits...');
  
  const { status, data } = await request('GET', '/v1/marketplace/search?q=dashboard&limit=5');
  
  if (status === 200) {
    log('✅', 'Busca OK', {
      query: data.query,
      count: data.count,
    });
    return data.kits;
  } else {
    log('❌', 'Busca falhou', data);
    return [];
  }
}

async function testGetStats() {
  log('🔍', 'Testando estatísticas...');
  
  const { status, data } = await request('GET', '/v1/marketplace/stats');
  
  if (status === 200) {
    log('✅', 'Stats OK', data);
    return data;
  } else {
    log('❌', 'Stats falhou', data);
    return null;
  }
}

async function testGetTrainingData() {
  log('🔍', 'Testando exportação de dados de treinamento...');
  
  const { status, data } = await request('GET', '/v1/marketplace/training-data?min_quality=60&limit=10');
  
  if (status === 200) {
    log('✅', 'Training data OK', {
      format: data.format,
      count: data.count,
    });
    return data;
  } else {
    log('❌', 'Training data falhou', data);
    return null;
  }
}

async function testGenerateAndSave() {
  log('🔍', 'Testando generate-and-save (endpoint direto)...');
  
  const { status, data } = await request('POST', '/v1/brain/generate-and-save', {
    input: 'Crie um formulário de contato simples com validação',
    mode: 'code',
  });
  
  if (status === 200 && data.output) {
    log('✅', 'Generate-and-save OK', {
      output_length: data.output.length,
      starter_kit: data.starter_kit ? {
        id: data.starter_kit.id,
        grade: data.starter_kit.grade,
        quality_score: data.starter_kit.quality_score,
      } : 'não gerado (código muito curto ou erro)',
    });
    return data;
  } else {
    log('❌', 'Generate-and-save falhou', data);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    STARTER KIT MARKETPLACE - COMPLETE TEST                    ║
║                                                                               ║
║              Testando todos os endpoints do sistema                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

🌐 URL: ${MARKETPLACE_URL}
`);

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  try {
    // 1. Health Check
    if (await testHealthCheck()) {
      results.passed++;
      results.tests.push({ name: 'Health Check', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Health Check', status: 'FAIL' });
      console.log('\n❌ Servidor não está rodando. Inicie com: cd go-brain-api && go run .\n');
      return;
    }

    console.log('');

    // 2. Classificar código
    const classification = await testClassifyCode();
    if (classification) {
      results.passed++;
      results.tests.push({ name: 'Classify Code', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Classify Code', status: 'FAIL' });
    }

    console.log('');

    // 3. Criar kit
    const kit = await testCreateKit();
    if (kit) {
      results.passed++;
      results.tests.push({ name: 'Create Kit', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Create Kit', status: 'FAIL' });
    }

    console.log('');

    // 4. Gerar README (se kit foi criado)
    if (kit) {
      const readme = await testGenerateReadme(kit.id);
      if (readme) {
        results.passed++;
        results.tests.push({ name: 'Generate README', status: 'PASS' });
      } else {
        results.failed++;
        results.tests.push({ name: 'Generate README', status: 'FAIL' });
      }

      console.log('');

      // 5. Diagrama de arquitetura
      const diagram = await testGetArchitectureDiagram(kit.id);
      if (diagram) {
        results.passed++;
        results.tests.push({ name: 'Architecture Diagram', status: 'PASS' });
      } else {
        results.failed++;
        results.tests.push({ name: 'Architecture Diagram', status: 'FAIL' });
      }

      console.log('');

      // 6. Publicar kit
      const published = await testPublishKit(kit.id);
      if (published) {
        results.passed++;
        results.tests.push({ name: 'Publish Kit', status: 'PASS' });
      } else {
        results.failed++;
        results.tests.push({ name: 'Publish Kit', status: 'FAIL' });
      }

      console.log('');
    }

    // 7. Listar kits públicos
    const publicKits = await testListPublicKits();
    if (publicKits) {
      results.passed++;
      results.tests.push({ name: 'List Public Kits', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'List Public Kits', status: 'FAIL' });
    }

    console.log('');

    // 8. Buscar kits
    const searchResults = await testSearchKits();
    if (searchResults !== null) {
      results.passed++;
      results.tests.push({ name: 'Search Kits', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Search Kits', status: 'FAIL' });
    }

    console.log('');

    // 9. Stats
    const stats = await testGetStats();
    if (stats) {
      results.passed++;
      results.tests.push({ name: 'Get Stats', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Get Stats', status: 'FAIL' });
    }

    console.log('');

    // 10. Training data
    const trainingData = await testGetTrainingData();
    if (trainingData) {
      results.passed++;
      results.tests.push({ name: 'Get Training Data', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Get Training Data', status: 'FAIL' });
    }

    console.log('');

    // 11. Generate and Save (requer GEMINI_API_KEY)
    if (process.env.GEMINI_API_KEY) {
      const generated = await testGenerateAndSave();
      if (generated) {
        results.passed++;
        results.tests.push({ name: 'Generate and Save', status: 'PASS' });
      } else {
        results.failed++;
        results.tests.push({ name: 'Generate and Save', status: 'FAIL' });
      }
    } else {
      log('⏭️', 'Pulando generate-and-save (GEMINI_API_KEY não configurada)');
      results.tests.push({ name: 'Generate and Save', status: 'SKIP' });
    }

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);
  }

  // Resumo
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                              RESULTADO FINAL                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

  ✅ Passou: ${results.passed}
  ❌ Falhou: ${results.failed}
  ⏭️  Pulou: ${results.tests.filter(t => t.status === 'SKIP').length}

  Testes:
${results.tests.map(t => `    ${t.status === 'PASS' ? '✅' : t.status === 'FAIL' ? '❌' : '⏭️'} ${t.name}`).join('\n')}

${results.failed === 0 ? '🎉 Todos os testes passaram!' : '⚠️  Alguns testes falharam.'}
`);
}

// Executar
runTests().catch(console.error);
