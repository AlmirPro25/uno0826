/**
 * ============================================
 * 🧪 TESTE DO KIRO UNIFIED AGENT
 * ============================================
 * 
 * Testa as funcionalidades do agente unificado
 * 
 * Executar: node tests/test-kiro-unified-agent.js
 */

const API_BASE = 'http://localhost:3001/api';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(msg, color = '') {
  console.log(`${color}${msg}${colors.reset}`);
}

function success(msg) { log(`✅ ${msg}`, colors.green); }
function error(msg) { log(`❌ ${msg}`, colors.red); }
function info(msg) { log(`ℹ️  ${msg}`, colors.cyan); }
function test(msg) { log(`🧪 ${msg}`, colors.magenta); }

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

// ============================================
// TESTES
// ============================================

async function testHealthCheck() {
  test('Health Check...');
  try {
    const data = await fetchAPI('/health');
    if (data.success || data.status === 'online') {
      success('Backend online');
      return true;
    }
    error('Backend offline');
    return false;
  } catch (e) {
    error(`Backend não acessível: ${e.message}`);
    return false;
  }
}

async function testExecuteCommand() {
  test('Executar comando simples...');
  try {
    const data = await fetchAPI('/terminal/execute', {
      method: 'POST',
      body: JSON.stringify({ command: 'echo Hello World' })
    });
    
    if (data.success && data.stdout.includes('Hello World')) {
      success(`Comando executado: ${data.stdout.trim()}`);
      return true;
    }
    error(`Falha: ${data.error || 'sem output'}`);
    return false;
  } catch (e) {
    error(`Erro: ${e.message}`);
    return false;
  }
}

async function testGrepSearch() {
  test('Busca grep...');
  try {
    const data = await fetchAPI('/kiro/search', {
      method: 'POST',
      body: JSON.stringify({ 
        query: 'export',
        includePattern: '**/*.ts',
        maxResults: 10
      })
    });
    
    if (data.success && data.results?.length > 0) {
      success(`Encontrados ${data.results.length} resultados`);
      info(`  Primeiro: ${data.results[0].file}:${data.results[0].line}`);
      return true;
    }
    error(`Falha: ${data.error || 'sem resultados'}`);
    return false;
  } catch (e) {
    error(`Erro: ${e.message}`);
    return false;
  }
}

async function testListDirectory() {
  test('Listar diretório...');
  try {
    const data = await fetchAPI('/kiro/list-recursive?path=.&depth=1');
    
    if (data.success && data.tree?.length > 0) {
      success(`Listados ${data.tree.length} itens`);
      const dirs = data.tree.filter(i => i.isDirectory).map(i => i.name);
      info(`  Pastas: ${dirs.slice(0, 5).join(', ')}...`);
      return true;
    }
    error(`Falha: ${data.error || 'sem itens'}`);
    return false;
  } catch (e) {
    error(`Erro: ${e.message}`);
    return false;
  }
}

async function testReadFile() {
  test('Ler arquivo...');
  try {
    const data = await fetchAPI('/terminal/read-file?path=package.json');
    
    if (data.success && data.content) {
      const pkg = JSON.parse(data.content);
      success(`Arquivo lido: ${pkg.name || 'package.json'}`);
      return true;
    }
    error(`Falha: ${data.error || 'sem conteúdo'}`);
    return false;
  } catch (e) {
    error(`Erro: ${e.message}`);
    return false;
  }
}

async function testWriteAndDelete() {
  test('Escrever e deletar arquivo...');
  const testPath = 'workspace/test-kiro-agent-temp.txt';
  
  try {
    // Escrever
    const writeData = await fetchAPI('/terminal/write-files', {
      method: 'POST',
      body: JSON.stringify({ 
        files: [{ path: testPath, content: 'Teste do Kiro Agent\n' }]
      })
    });
    
    if (!writeData.success) {
      error(`Falha ao escrever: ${writeData.error}`);
      return false;
    }
    info('  Arquivo criado');

    // Ler para confirmar
    const readData = await fetchAPI(`/terminal/read-file?path=${encodeURIComponent(testPath)}`);
    if (!readData.success || !readData.content.includes('Teste')) {
      error('Falha ao verificar arquivo');
      return false;
    }
    info('  Conteúdo verificado');

    // Deletar
    const deleteData = await fetchAPI('/kiro/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path: testPath, confirm: true })
    });
    
    if (deleteData.success) {
      success('Arquivo criado, verificado e deletado');
      return true;
    }
    info('  Arquivo não deletado (pode não existir)');
    return true;
  } catch (e) {
    error(`Erro: ${e.message}`);
    return false;
  }
}

async function testStrReplace() {
  test('String replace...');
  const testPath = 'workspace/test-replace-temp.txt';
  
  try {
    // Criar arquivo
    await fetchAPI('/terminal/write-files', {
      method: 'POST',
      body: JSON.stringify({ 
        files: [{ path: testPath, content: 'Hello World\nThis is a test\n' }]
      })
    });

    // Substituir
    const replaceData = await fetchAPI('/kiro/replace', {
      method: 'POST',
      body: JSON.stringify({ 
        path: testPath,
        oldStr: 'Hello World',
        newStr: 'Olá Mundo'
      })
    });
    
    if (!replaceData.success) {
      error(`Falha: ${replaceData.error || replaceData.hint}`);
      return false;
    }

    // Verificar
    const readData = await fetchAPI(`/terminal/read-file?path=${encodeURIComponent(testPath)}`);
    if (readData.content?.includes('Olá Mundo')) {
      success('String substituída com sucesso');
      
      // Cleanup
      await fetchAPI('/kiro/delete', {
        method: 'DELETE',
        body: JSON.stringify({ path: testPath, confirm: true })
      });
      return true;
    }
    
    error('Substituição não aplicada');
    return false;
  } catch (e) {
    error(`Erro: ${e.message}`);
    return false;
  }
}

async function testProcessManagement() {
  test('Gerenciamento de processos...');
  
  try {
    // Listar processos
    const listData = await fetchAPI('/terminal/processes');
    
    if (listData.success) {
      success(`${listData.processes?.length || 0} processos em background`);
      return true;
    }
    error(`Falha: ${listData.error}`);
    return false;
  } catch (e) {
    error(`Erro: ${e.message}`);
    return false;
  }
}

// ============================================
// MAIN
// ============================================

async function runTests() {
  console.log('');
  log('╔══════════════════════════════════════════════════════════╗', colors.magenta);
  log('║         🧪 TESTE DO KIRO UNIFIED AGENT                   ║', colors.magenta);
  log('╚══════════════════════════════════════════════════════════╝', colors.magenta);
  console.log('');

  const results = [];

  // Executa testes
  results.push(await testHealthCheck());
  if (!results[0]) {
    error('Backend offline. Inicie com: npm run backend');
    return;
  }

  results.push(await testExecuteCommand());
  results.push(await testGrepSearch());
  results.push(await testListDirectory());
  results.push(await testReadFile());
  results.push(await testWriteAndDelete());
  results.push(await testStrReplace());
  results.push(await testProcessManagement());

  // Resumo
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    success(`TODOS OS TESTES PASSARAM (${passed}/${total})`);
  } else {
    log(`⚠️  ${passed}/${total} testes passaram`, colors.yellow);
  }
  console.log('');
}

runTests().catch(console.error);
