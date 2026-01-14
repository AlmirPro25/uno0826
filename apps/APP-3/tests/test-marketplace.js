/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    TEST MARKETPLACE - Verificação do Sistema                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Execute: node tests/test-marketplace.js
 */

const MARKETPLACE_URL = process.env.MARKETPLACE_URL || 'http://localhost:8080';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════════════════════

async function testHealthCheck() {
  log('blue', '\n[TEST] Health Check...');
  
  try {
    const response = await fetch(`${MARKETPLACE_URL}/health`);
    const data = await response.json();
    
    if (data.status === 'healthy') {
      log('green', '✅ Health check OK');
      return true;
    } else {
      log('red', '❌ Health check falhou');
      return false;
    }
  } catch (error) {
    log('red', `❌ Erro: ${error.message}`);
    return false;
  }
}

async function testClassifyCode() {
  log('blue', '\n[TEST] Classificar Código...');
  
  const testCode = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard de Vendas</title>
  <script src="https://cdn.tailwindcss.com" defer></script>
</head>
<body class="bg-gray-900 text-white">
  <header class="p-4 border-b border-gray-800">
    <h1 class="text-2xl font-bold">Dashboard de Vendas</h1>
  </header>
  <main class="p-4">
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <article class="bg-gray-800 p-4 rounded-lg">
        <h2 class="text-lg font-medium">Total de Vendas</h2>
        <p class="text-3xl font-bold text-green-400">R$ 125.430</p>
      </article>
    </section>
  </main>
  <footer class="p-4 text-center text-gray-500">
    © 2024 Dashboard
  </footer>
</body>
</html>
  `.trim();

  try {
    const response = await fetch(`${MARKETPLACE_URL}/v1/marketplace/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testCode,
        prompt: 'Dashboard de vendas moderno',
      }),
    });

    const data = await response.json();
    
    log('green', `✅ Classificação OK`);
    log('yellow', `   Grade: ${data.classification.grade}`);
    log('yellow', `   Qualidade: ${data.classification.quality_score}%`);
    log('yellow', `   Segurança: ${data.classification.security_score}%`);
    log('yellow', `   Categoria: ${data.category}`);
    log('yellow', `   Complexidade: ${data.complexity}`);
    log('yellow', `   Horas estimadas: ${data.estimated_hours}h`);
    log('yellow', `   Pode ser listado: ${data.can_be_listed ? 'Sim' : 'Não'}`);
    
    return data;
  } catch (error) {
    log('red', `❌ Erro: ${error.message}`);
    return null;
  }
}

async function testCreateKit() {
  log('blue', '\n[TEST] Criar Starter Kit...');
  
  const testCode = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
</head>
<body>
  <header>
    <nav aria-label="Navegação principal">
      <a href="#home">Home</a>
      <a href="#about">Sobre</a>
    </nav>
  </header>
  <main>
    <section id="hero">
      <h1>Bem-vindo</h1>
      <p>Sua solução completa</p>
      <button>Começar agora</button>
    </section>
  </main>
  <footer>
    <p>© 2024</p>
  </footer>
</body>
</html>
  `.trim();

  try {
    const response = await fetch(`${MARKETPLACE_URL}/v1/marketplace/kits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-ID': 'test_user_123',
      },
      body: JSON.stringify({
        code: testCode,
        prompt: 'Landing page moderna e responsiva',
        owner_id: 'test_user_123',
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      log('green', `✅ Kit criado: ${data.kit.id}`);
      log('yellow', `   Grade: ${data.kit.classification.grade}`);
      log('yellow', `   Qualidade: ${data.kit.classification.quality_score}%`);
      return data.kit;
    } else {
      log('red', `❌ Erro ao criar kit`);
      return null;
    }
  } catch (error) {
    log('red', `❌ Erro: ${error.message}`);
    return null;
  }
}

async function testListKits() {
  log('blue', '\n[TEST] Listar Meus Kits...');
  
  try {
    const response = await fetch(`${MARKETPLACE_URL}/v1/marketplace/my-kits`, {
      headers: { 'X-Owner-ID': 'test_user_123' },
    });

    const data = await response.json();
    
    log('green', `✅ Listagem OK`);
    log('yellow', `   Total: ${data.count} kits`);
    
    if (data.kits && data.kits.length > 0) {
      data.kits.slice(0, 3).forEach((kit, i) => {
        log('yellow', `   [${i + 1}] ${kit.id} - Grade ${kit.classification.grade}`);
      });
    }
    
    return data;
  } catch (error) {
    log('red', `❌ Erro: ${error.message}`);
    return null;
  }
}

async function testStats() {
  log('blue', '\n[TEST] Estatísticas...');
  
  try {
    const response = await fetch(`${MARKETPLACE_URL}/v1/marketplace/stats`);
    const data = await response.json();
    
    log('green', `✅ Stats OK`);
    log('yellow', `   Total de kits: ${data.total_kits}`);
    log('yellow', `   Kits públicos: ${data.public_kits}`);
    log('yellow', `   Qualidade média: ${data.avg_quality?.toFixed(1)}%`);
    log('yellow', `   Amostras training: ${data.training_samples}`);
    
    if (data.by_category) {
      log('yellow', `   Categorias: ${Object.keys(data.by_category).join(', ')}`);
    }
    
    return data;
  } catch (error) {
    log('red', `❌ Erro: ${error.message}`);
    return null;
  }
}

async function testClassifierStats() {
  log('blue', '\n[TEST] Stats do Classificador...');
  
  try {
    const response = await fetch(`${MARKETPLACE_URL}/v1/marketplace/classifier/stats`);
    const data = await response.json();
    
    log('green', `✅ Classifier Stats OK`);
    log('yellow', `   Total classificados: ${data.total_classified}`);
    log('yellow', `   Qualidade média: ${data.avg_quality?.toFixed(1)}%`);
    log('yellow', `   Regras ativas: ${data.rules_count}`);
    
    return data;
  } catch (error) {
    log('red', `❌ Erro: ${error.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    STARTER KIT MARKETPLACE - TESTES                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\nURL: ${MARKETPLACE_URL}`);

  const results = {
    health: false,
    classify: false,
    create: false,
    list: false,
    stats: false,
    classifier: false,
  };

  // Executar testes
  results.health = await testHealthCheck();
  
  if (results.health) {
    results.classify = (await testClassifyCode()) !== null;
    results.create = (await testCreateKit()) !== null;
    results.list = (await testListKits()) !== null;
    results.stats = (await testStats()) !== null;
    results.classifier = (await testClassifierStats()) !== null;
  }

  // Resumo
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              RESUMO DOS TESTES                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(color, `${icon} ${test}`);
  });

  console.log('');
  const allPassed = passed === total;
  log(allPassed ? 'green' : 'yellow', `Resultado: ${passed}/${total} testes passaram`);
  
  if (allPassed) {
    log('green', '\n🎉 Marketplace funcionando corretamente!');
  } else {
    log('yellow', '\n⚠️ Alguns testes falharam. Verifique se o servidor está rodando.');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
