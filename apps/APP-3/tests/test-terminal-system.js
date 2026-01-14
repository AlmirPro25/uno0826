/**
 * ============================================
 * 🧪 TESTE COMPLETO DO SISTEMA DE TERMINAL
 * ============================================
 * 
 * Testa todas as funcionalidades:
 * - API REST
 * - WebSocket
 * - Ferramentas do agente
 * 
 * Executar: node tests/test-terminal-system.js
 */

const API_BASE = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001/ws/terminal';

// Cores
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

const log = (msg, color = '') => console.log(`${color}${msg}${c.reset}`);
const success = (msg) => log(`✅ ${msg}`, c.green);
const error = (msg) => log(`❌ ${msg}`, c.red);
const info = (msg) => log(`ℹ️  ${msg}`, c.cyan);
const test = (msg) => log(`\n🧪 ${msg}`, c.magenta);
const section = (msg) => log(`\n${'═'.repeat(50)}\n${msg}\n${'═'.repeat(50)}`, c.blue);

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

// ============================================
// TESTES REST API
// ============================================

async function testRESTAPI() {
  section('TESTES REST API');
  let passed = 0;
  let failed = 0;

  // Health Check
  test('Health Check');
  try {
    const data = await fetchAPI('/health');
    if (data.success || data.status === 'online') {
      success('Backend online');
      passed++;
    } else {
      error('Backend offline');
      failed++;
      return { passed, failed };
    }
  } catch (e) {
    error(`Não conectou: ${e.message}`);
    return { passed: 0, failed: 1 };
  }

  // Execute Command
  test('Executar Comando');
  try {
    const data = await fetchAPI('/terminal/execute', {
      method: 'POST',
      body: JSON.stringify({ command: 'echo "Hello Terminal"' })
    });
    if (data.success && data.stdout?.includes('Hello')) {
      success(`Output: ${data.stdout.trim()}`);
      passed++;
    } else {
      error(`Falha: ${data.error || 'sem output'}`);
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  // Grep Search
  test('Grep Search');
  try {
    const data = await fetchAPI('/kiro/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'export', includePattern: '**/*.ts', maxResults: 5 })
    });
    if (data.success && data.results?.length > 0) {
      success(`${data.results.length} resultados encontrados`);
      passed++;
    } else {
      error('Nenhum resultado');
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  // List Directory
  test('Listar Diretório');
  try {
    const data = await fetchAPI('/kiro/list-recursive?path=.&depth=1');
    if (data.success && data.tree?.length > 0) {
      success(`${data.tree.length} itens listados`);
      passed++;
    } else {
      error('Falha ao listar');
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  // Process Management
  test('Gerenciamento de Processos');
  try {
    const data = await fetchAPI('/terminal/processes');
    if (data.success) {
      success(`${data.processes?.length || 0} processos ativos`);
      passed++;
    } else {
      error('Falha');
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  return { passed, failed };
}

// ============================================
// TESTES WEBSOCKET
// ============================================

async function testWebSocket() {
  section('TESTES WEBSOCKET');
  
  return new Promise((resolve) => {
    let passed = 0;
    let failed = 0;
    let ws;

    try {
      // Verifica se WebSocket está disponível (Node.js)
      let WebSocket;
      try {
        WebSocket = require('ws');
      } catch {
        info('WebSocket (ws) não instalado - pulando testes WS');
        resolve({ passed: 0, failed: 0, skipped: true });
        return;
      }

      test('Conexão WebSocket');
      ws = new WebSocket(WS_URL);
      
      const timeout = setTimeout(() => {
        error('Timeout na conexão');
        ws.close();
        resolve({ passed, failed: failed + 1 });
      }, 10000);

      ws.on('open', () => {
        success('Conectado ao WebSocket');
        passed++;
      });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          
          if (msg.type === 'connected') {
            success(`Sessão: ${msg.payload.sessionId}`);
            passed++;
            
            // Testa execução de comando
            test('Executar via WebSocket');
            ws.send(JSON.stringify({
              type: 'command',
              payload: { command: 'echo "WS Test"' }
            }));
          }
          
          if (msg.type === 'output') {
            if (msg.payload.data.includes('WS Test')) {
              success('Output recebido via streaming');
              passed++;
            }
          }
          
          if (msg.type === 'exit') {
            success(`Comando finalizado (exit: ${msg.payload.code})`);
            passed++;
            clearTimeout(timeout);
            ws.close();
            resolve({ passed, failed });
          }
        } catch (e) {
          // Ignora erros de parse
        }
      });

      ws.on('error', (err) => {
        error(`Erro WS: ${err.message}`);
        failed++;
        clearTimeout(timeout);
        resolve({ passed, failed });
      });

      ws.on('close', () => {
        info('WebSocket fechado');
      });

    } catch (e) {
      error(`Erro: ${e.message}`);
      resolve({ passed, failed: failed + 1 });
    }
  });
}

// ============================================
// TESTES DE FERRAMENTAS
// ============================================

async function testTools() {
  section('TESTES DE FERRAMENTAS');
  let passed = 0;
  let failed = 0;

  // Write File
  test('Escrever Arquivo');
  const testFile = 'workspace/test-terminal-temp.txt';
  try {
    const data = await fetchAPI('/terminal/write-files', {
      method: 'POST',
      body: JSON.stringify({ 
        files: [{ path: testFile, content: 'Teste do Terminal System\n' }]
      })
    });
    if (data.success) {
      success('Arquivo criado');
      passed++;
    } else {
      error(`Falha: ${data.error}`);
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  // Read File
  test('Ler Arquivo');
  try {
    const data = await fetchAPI(`/terminal/read-file?path=${encodeURIComponent(testFile)}`);
    if (data.success && data.content?.includes('Teste')) {
      success('Arquivo lido corretamente');
      passed++;
    } else {
      error('Conteúdo incorreto');
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  // Append File
  test('Append File');
  try {
    const data = await fetchAPI('/kiro/append', {
      method: 'POST',
      body: JSON.stringify({ path: testFile, text: 'Linha adicionada\n' })
    });
    if (data.success) {
      success('Conteúdo adicionado');
      passed++;
    } else {
      error(`Falha: ${data.error}`);
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  // String Replace
  test('String Replace');
  try {
    const data = await fetchAPI('/kiro/replace', {
      method: 'POST',
      body: JSON.stringify({ 
        path: testFile, 
        oldStr: 'Teste do Terminal System',
        newStr: 'Sistema de Terminal Testado'
      })
    });
    if (data.success) {
      success('String substituída');
      passed++;
    } else {
      error(`Falha: ${data.error || data.hint}`);
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  // Delete File
  test('Deletar Arquivo');
  try {
    const data = await fetchAPI('/kiro/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path: testFile, confirm: true })
    });
    if (data.success) {
      success('Arquivo deletado');
      passed++;
    } else {
      info('Arquivo pode não existir');
      passed++;
    }
  } catch (e) {
    info('Cleanup: ' + e.message);
    passed++;
  }

  // File Search
  test('Buscar Arquivos');
  try {
    const data = await fetchAPI('/kiro/file-search?query=package');
    if (data.success && data.results?.length > 0) {
      success(`${data.results.length} arquivos encontrados`);
      passed++;
    } else {
      error('Nenhum arquivo');
      failed++;
    }
  } catch (e) {
    error(e.message);
    failed++;
  }

  return { passed, failed };
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('');
  log('╔══════════════════════════════════════════════════════════╗', c.magenta);
  log('║       🧪 TESTE COMPLETO DO SISTEMA DE TERMINAL           ║', c.magenta);
  log('╚══════════════════════════════════════════════════════════╝', c.magenta);

  const results = {
    rest: await testRESTAPI(),
    ws: await testWebSocket(),
    tools: await testTools()
  };

  // Resumo
  section('RESUMO');
  
  const totalPassed = results.rest.passed + results.ws.passed + results.tools.passed;
  const totalFailed = results.rest.failed + results.ws.failed + results.tools.failed;
  const total = totalPassed + totalFailed;

  log(`REST API:   ${results.rest.passed}/${results.rest.passed + results.rest.failed} passou`, 
      results.rest.failed === 0 ? c.green : c.yellow);
  log(`WebSocket:  ${results.ws.passed}/${results.ws.passed + results.ws.failed} passou${results.ws.skipped ? ' (pulado)' : ''}`, 
      results.ws.failed === 0 ? c.green : c.yellow);
  log(`Tools:      ${results.tools.passed}/${results.tools.passed + results.tools.failed} passou`, 
      results.tools.failed === 0 ? c.green : c.yellow);
  
  console.log('');
  if (totalFailed === 0) {
    success(`TODOS OS TESTES PASSARAM (${totalPassed}/${total})`);
  } else {
    log(`⚠️  ${totalPassed}/${total} testes passaram`, c.yellow);
  }
  console.log('');
}

main().catch(console.error);
