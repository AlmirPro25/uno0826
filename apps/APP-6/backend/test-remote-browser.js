/**
 * 🧪 TESTE DO NAVEGADOR REMOTO
 */

import { remoteBrowserService } from './services/remoteBrowserService.js';

async function test() {
  console.log('🧪 Testando navegador remoto...\n');

  try {
    // 1. Criar sessão
    console.log('1️⃣ Criando sessão...');
    const session = await remoteBrowserService.createSession('test-session', {
      url: 'https://www.google.com',
      viewport: { width: 1366, height: 768 },
      headless: false // Mostrar navegador
    });
    console.log('✅ Sessão criada:', session);

    // 2. Aguardar carregamento
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Simular clique
    console.log('\n2️⃣ Simulando clique...');
    await remoteBrowserService.handleInput('test-session', {
      inputType: 'mouse',
      event: 'click',
      x: 683,
      y: 384,
      button: 'left'
    });
    console.log('✅ Clique executado');

    // 4. Aguardar
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Simular digitação
    console.log('\n3️⃣ Simulando digitação...');
    await remoteBrowserService.handleInput('test-session', {
      inputType: 'keyboard',
      event: 'type',
      text: 'Prox AI Studio'
    });
    console.log('✅ Texto digitado');

    // 6. Aguardar
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. Navegar para outra URL
    console.log('\n4️⃣ Navegando para outra URL...');
    const navResult = await remoteBrowserService.navigate('test-session', 'https://www.example.com');
    console.log('✅ Navegação concluída:', navResult);

    // 8. Aguardar
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 9. Fechar sessão
    console.log('\n5️⃣ Fechando sessão...');
    await remoteBrowserService.closeSession('test-session');
    console.log('✅ Sessão fechada');

    console.log('\n🎉 Teste concluído com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }
}

test();
