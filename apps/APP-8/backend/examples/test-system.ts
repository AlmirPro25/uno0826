/**
 * Script de teste do sistema completo
 * Demonstra todas as funcionalidades do Gemini Maestro
 */

import dotenv from 'dotenv';
dotenv.config();

import { getDatabase } from '../src/database/db.js';
import { sessionService } from '../src/services/sessionService.js';
import { memoryService } from '../src/services/memoryService.js';
import { dailySummaryService } from '../src/services/dailySummaryService.js';
import { geminiMaestro } from '../src/services/geminiMaestro.js';

async function testSystem() {
  console.log('🧪 Testando Sistema Gemini Companion Backend\n');

  // 1. Criar sessão
  console.log('1️⃣ Criando sessão...');
  const sessionId = sessionService.createSession();
  console.log(`✅ Sessão criada: ${sessionId}\n`);

  // 2. Adicionar mensagens
  console.log('2️⃣ Adicionando mensagens...');
  sessionService.addMessage(sessionId, 'user', 'Olá! Como você está?');
  sessionService.addMessage(sessionId, 'model', 'Olá! Estou bem, obrigado por perguntar. Como posso ajudar você hoje?');
  sessionService.addMessage(sessionId, 'user', 'Preciso aprender sobre Node.js e TypeScript');
  sessionService.addMessage(sessionId, 'model', 'Ótimo! Node.js e TypeScript são tecnologias poderosas. Vou te ajudar com isso.');
  console.log('✅ Mensagens adicionadas\n');

  // 3. Resumir sessão
  console.log('3️⃣ Criando resumo da sessão...');
  const summary = await sessionService.summarizeSession(sessionId);
  console.log(`✅ Resumo: ${summary}\n`);

  // 4. Extrair fatos
  console.log('4️⃣ Extraindo fatos da conversa...');
  const conversation = `
    Usuário: Preciso aprender sobre Node.js e TypeScript
    Modelo: Ótimo! Node.js e TypeScript são tecnologias poderosas.
  `;
  await memoryService.extractAndStoreFactsFromConversation(conversation);
  console.log('✅ Fatos extraídos e armazenados\n');

  // 5. Adicionar memórias manualmente
  console.log('5️⃣ Adicionando memórias...');
  await memoryService.addMemory(
    'Usuário está interessado em backend development',
    'preference',
    8,
    ['backend', 'nodejs', 'typescript']
  );
  await memoryService.addMemory(
    'Usuário prefere aprender com exemplos práticos',
    'preference',
    7,
    ['aprendizado', 'prática']
  );
  console.log('✅ Memórias adicionadas\n');

  // 6. Buscar memórias
  console.log('6️⃣ Buscando memórias relevantes...');
  const memories = await memoryService.searchMemories('Como aprender programação?', 3);
  console.log('Memórias encontradas:');
  memories.forEach((mem: any) => {
    console.log(`  - [${mem.type}] ${mem.content} (score: ${mem.score?.toFixed(2)})`);
  });
  console.log();

  // 7. Estatísticas de memória
  console.log('7️⃣ Estatísticas de memória...');
  const stats = memoryService.getMemoryStats();
  console.log(`Total de memórias: ${stats.totalMemories}`);
  console.log(`Importância média: ${stats.averageImportance.toFixed(2)}`);
  console.log('Por tipo:', stats.byType);
  console.log();

  // 8. Criar mais sessões para teste de resumo diário
  console.log('8️⃣ Criando mais sessões para teste...');
  const session2 = sessionService.createSession();
  sessionService.addMessage(session2, 'user', 'Vamos falar sobre APIs REST');
  sessionService.addMessage(session2, 'model', 'Claro! APIs REST são fundamentais para desenvolvimento web moderno.');
  await sessionService.summarizeSession(session2);
  console.log('✅ Sessões adicionais criadas\n');

  // 9. Criar resumo diário
  console.log('9️⃣ Criando resumo diário...');
  const today = new Date().toISOString().split('T')[0];
  const dailySummary = await dailySummaryService.createDailySummary(today);
  
  if (dailySummary) {
    console.log('📅 Resumo Diário:');
    console.log(`  Data: ${dailySummary.date}`);
    console.log(`  Resumo: ${dailySummary.summary}`);
    console.log(`  Tópicos: ${dailySummary.keyTopics.join(', ')}`);
    console.log(`  Humor: ${dailySummary.userMood}`);
    console.log(`  Produtividade: ${dailySummary.productivityScore}/10`);
    console.log(`  Insights: ${dailySummary.aiInsights}`);
  }
  console.log();

  // 10. Listar todas as sessões
  console.log('🔟 Listando todas as sessões...');
  const allSessions = sessionService.getAllSessions(10);
  console.log(`Total de sessões: ${allSessions.length}`);
  allSessions.forEach((s: any) => {
    console.log(`  - Sessão ${s.id}: ${s.messages.length} mensagens`);
    if (s.summary) {
      console.log(`    Resumo: ${s.summary.substring(0, 50)}...`);
    }
  });
  console.log();

  console.log('✅ Todos os testes concluídos com sucesso! 🎉');
}

// Executar testes
testSystem().catch(console.error);
