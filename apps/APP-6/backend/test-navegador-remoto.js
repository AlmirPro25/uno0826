/**
 * 🧪 TESTE DO NAVEGADOR REMOTO
 * Verifica se o Playwright e Socket.IO estão funcionando
 */

import { remoteBrowserService } from './services/remoteBrowserService.js';
import { io } from 'socket.io-client';

console.log('🧪 Iniciando teste do navegador remoto...\n');

// Teste 1: Criar sessão
async function testeCrearSessao() {
  console.log('📝 Teste 1: Criar sessão');
  
  try {
    const sessionId = 'test_' + Date.now();
    const result = await remoteBrowserService.createSession(sessionId, {
      url: 'https://www.google.com',
      viewport: { width: 1366, height: 768 },
      headless: false // Mostrar navegador
    });
    
    console.log('✅ Sessão criada:', result);
    
    // Aguardar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fechar sessão
    await remoteBrowserService.closeSession(sessionId);
    console.log('✅ Sessão fechada\n');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar sessão:', error.message);
    return false;
  }
}

// Teste 2: Navegar
async function testeNavegar() {
  console.log('📝 Teste 2: Navegar para URL');
  
  try {
    const sessionId = 'test_nav_' + Date.now();
    
    // Criar sessão
    await remoteBrowserService.createSession(sessionId, {
      url: 'https://www.google.com',
      headless: false
    });
    
    console.log('✅ Sessão criada');
    
    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navegar para outra URL
    const result = await remoteBrowserService.navigate(sessionId, 'https://www.wikipedia.org');
    console.log('✅ Navegação:', result);
    
    // Aguardar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fechar sessão
    await remoteBrowserService.closeSession(sessionId);
    console.log('✅ Sessão fechada\n');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao navegar:', error.message);
    return false;
  }
}

// Teste 3: Socket.IO (requer servidor rodando)
async function testeSocketIO() {
  console.log('📝 Teste 3: Conexão Socket.IO');
  console.log('⚠️  Certifique-se de que o servidor está rodando na porta 3002\n');
  
  return new Promise((resolve) => {
    const socket = io('http://localhost:3002', {
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000
    });
    
    let connected = false;
    
    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor Socket.IO');
      connected = true;
      
      // Tentar criar sessão via Socket.IO
      socket.emit('browser:create', {
        url: 'https://www.google.com',
        viewport: { width: 1366, height: 768 },
        fps: 10,
        headless: true
      }, (response) => {
        if (response.success) {
          console.log('✅ Sessão criada via Socket.IO:', response);
          
          // Aguardar 2 segundos e desconectar
          setTimeout(() => {
            socket.disconnect();
            console.log('✅ Desconectado\n');
            resolve(true);
          }, 2000);
        } else {
          console.error('❌ Erro ao criar sessão:', response.error);
          socket.disconnect();
          resolve(false);
        }
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error.message);
      console.log('💡 Dica: Inicie o servidor com "npm start" em outra janela\n');
      resolve(false);
    });
    
    socket.on('browser:frame', (data) => {
      console.log('📸 Frame recebido:', data.length, 'bytes');
    });
    
    // Timeout de 5 segundos
    setTimeout(() => {
      if (!connected) {
        console.error('❌ Timeout: Não foi possível conectar ao servidor');
        console.log('💡 Dica: Verifique se o servidor está rodando na porta 3002\n');
        socket.disconnect();
        resolve(false);
      }
    }, 5000);
  });
}

// Executar testes
async function executarTestes() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTE DO NAVEGADOR REMOTO                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const resultados = {
    sessao: false,
    navegacao: false,
    socketio: false
  };
  
  // Teste 1
  resultados.sessao = await testeCrearSessao();
  
  // Teste 2
  if (resultados.sessao) {
    resultados.navegacao = await testeNavegar();
  } else {
    console.log('⏭️  Pulando Teste 2 (Teste 1 falhou)\n');
  }
  
  // Teste 3
  resultados.socketio = await testeSocketIO();
  
  // Resumo
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  📊 RESUMO DOS TESTES                                 ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Criar Sessão:     ${resultados.sessao ? '✅ PASSOU' : '❌ FALHOU'}                        ║`);
  console.log(`║  Navegação:        ${resultados.navegacao ? '✅ PASSOU' : '❌ FALHOU'}                        ║`);
  console.log(`║  Socket.IO:        ${resultados.socketio ? '✅ PASSOU' : '❌ FALHOU'}                        ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const todosPassed = Object.values(resultados).every(r => r);
  
  if (todosPassed) {
    console.log('🎉 Todos os testes passaram! O navegador remoto está funcionando.\n');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os erros acima.\n');
    
    if (!resultados.sessao) {
      console.log('💡 Dica: Instale o Playwright com:');
      console.log('   npm install playwright');
      console.log('   npx playwright install chromium\n');
    }
    
    if (!resultados.socketio) {
      console.log('💡 Dica: Inicie o servidor com:');
      console.log('   npm start\n');
    }
  }
  
  process.exit(todosPassed ? 0 : 1);
}

// Executar
executarTestes().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

