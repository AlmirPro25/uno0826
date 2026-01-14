/**
 * 🧪 TESTE DO INTELLIGENT ORCHESTRATOR
 * Testa o cérebro orquestrador de navegação
 */

import orchestrator from './services/intelligentNavigatorOrchestrator.js';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY não encontrada no .env');
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  🧪 TESTE DO INTELLIGENT ORCHESTRATOR                ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function runTests() {
  try {
    // Teste 1: Inicializar
    console.log('📝 Teste 1: Inicializar Orchestrator');
    await orchestrator.initialize(API_KEY);
    const stats = orchestrator.getStats();
    console.log('✅ Inicializado com sucesso');
    console.log(`   - ${stats.knowledgeBase.totalUrls} URLs conhecidas`);
    console.log(`   - ${stats.knowledgeBase.categories} categorias`);
    console.log(`   - ${stats.knowledgeBase.searchPatterns} padrões de busca\n`);

    // Teste 2: Busca de produto
    console.log('📝 Teste 2: Buscar produto (iPhone 13)');
    const result1 = await orchestrator.processAndExecute(
      'Quero comprar um iPhone 13 usado até R$ 2000'
    );
    console.log('✅ Resposta:', result1.message);
    console.log('   - Ação:', result1.action);
    console.log('   - Raciocínio:', result1.reasoning);
    if (result1.navigationResults) {
      console.log('   - Navegou para:', result1.navigationResults.length, 'URLs');
      result1.navigationResults.forEach(r => {
        console.log(`     ${r.success ? '✅' : '❌'} ${r.url}`);
      });
    }
    console.log();

    // Teste 3: Pergunta que precisa esclarecimento
    console.log('📝 Teste 3: Pergunta ambígua');
    const result2 = await orchestrator.processAndExecute(
      'Qual o melhor notebook?'
    );
    console.log('✅ Resposta:', result2.message);
    console.log('   - Ação:', result2.action);
    if (result2.question) {
      console.log('   - Pergunta:', result2.question);
    }
    console.log();

    // Teste 4: Busca de informação
    console.log('📝 Teste 4: Buscar informação (Wikipedia)');
    const result3 = await orchestrator.processAndExecute(
      'Me explique o que é inteligência artificial'
    );
    console.log('✅ Resposta:', result3.message);
    console.log('   - Ação:', result3.action);
    console.log();

    // Teste 5: Busca em site específico
    console.log('📝 Teste 5: Buscar em site específico (YouTube)');
    const result4 = await orchestrator.processAndExecute(
      'Quero ver vídeos sobre programação em Python'
    );
    console.log('✅ Resposta:', result4.message);
    console.log('   - Ação:', result4.action);
    if (result4.navigationResults) {
      console.log('   - Navegou para:', result4.navigationResults.length, 'URLs');
    }
    console.log();

    // Estatísticas finais
    const finalStats = orchestrator.getStats();
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📊 ESTATÍSTICAS FINAIS                               ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Mensagens trocadas: ${finalStats.conversation.messages}                              ║`);
    console.log(`║  Mensagens do usuário: ${finalStats.conversation.userMessages}                          ║`);
    console.log(`║  Mensagens do assistente: ${finalStats.conversation.assistantMessages}                     ║`);
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('🎉 Todos os testes concluídos com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

// Executar testes
runTests().then(() => {
  console.log('✅ Testes finalizados');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
