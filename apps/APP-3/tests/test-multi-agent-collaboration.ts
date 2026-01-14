/**
 * 🧪 Teste do Sistema de Colaboração Multi-Agente v4.0
 */

import { getMultiAgentCoordinator, orchestrateMultiAgent } from '../services/MultiAgentCoordinator';
import { getAgentCommunicationHub } from '../services/AgentCommunicationHub';

async function testMultiAgentCollaboration() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║      🧪 TESTE: SISTEMA DE COLABORAÇÃO MULTI-AGENTE v4.0 🧪                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 1: Colaboração para E-commerce
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n📋 TESTE 1: E-commerce com múltiplos domínios\n');
  
  const prompt = `
    Crie um marketplace com:
    - Sistema de autenticação (login, registro, OAuth)
    - Pagamentos com Stripe (checkout, split de pagamentos)
    - Dashboard administrativo (métricas, gestão de vendedores)
  `;
  
  console.log('🎯 Prompt:', prompt.trim());
  console.log('\n⏳ Iniciando colaboração...\n');
  
  try {
    const result = await orchestrateMultiAgent(prompt);
    
    console.log('\n✅ RESULTADO DA COLABORAÇÃO:\n');
    console.log(result.integrationReport);
    
    console.log('\n📊 MÉTRICAS:');
    console.log(`  • Agentes envolvidos: ${result.agents.length}`);
    console.log(`  • Mensagens trocadas: ${result.metrics.totalMessages}`);
    console.log(`  • Artefatos gerados: ${result.metrics.totalArtifacts}`);
    console.log(`  • Tempo total: ${result.metrics.collaborationTime}ms`);
    console.log(`  • Score de qualidade: ${result.metrics.qualityScore}/100`);
    
    console.log('\n🤖 AGENTES PARTICIPANTES:');
    result.agents.forEach(agent => {
      console.log(`  • ${agent.name} (${agent.domain}) - ${agent.artifactsProduced} artefatos`);
    });
    
    console.log('\n📜 CONTRATOS ESTABELECIDOS:');
    result.contracts.forEach(contract => {
      console.log(`  • ${contract.name} (${contract.type}) - ${contract.status}`);
    });
    
    console.log('\n💬 LOG DE CONVERSAÇÃO (primeiras 5 mensagens):');
    const logLines = result.conversationLog.split('\n\n').slice(0, 5);
    logLines.forEach(line => console.log(`  ${line.substring(0, 100)}...`));
    
    console.log('\n📦 CÓDIGO GERADO (preview):');
    console.log(result.finalCode.substring(0, 500) + '...\n');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTE 2: Hub de Comunicação Isolado
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n📋 TESTE 2: Hub de Comunicação (unitário)\n');
  
  const hub = getAgentCommunicationHub();
  
  // Criar sessão
  const session = hub.createSession('Teste de comunicação');
  console.log(`✅ Sessão criada: ${session.id}`);
  
  // Simular agentes
  const mockSoul1 = {
    name: 'Especialista Frontend',
    expertise: ['REACT', 'NEXTJS'],
    manifestosDNA: [],
    systemPrompt: 'Você é um especialista em frontend',
    restrictions: [],
    priorities: []
  };
  
  const mockSoul2 = {
    name: 'Especialista Backend',
    expertise: ['NODEJS', 'PRISMA'],
    manifestosDNA: [],
    systemPrompt: 'Você é um especialista em backend',
    restrictions: [],
    priorities: []
  };
  
  const agent1 = hub.registerAgent(session.id, mockSoul1 as any, 'specialist', 'frontend', ['UI', 'UX']);
  const agent2 = hub.registerAgent(session.id, mockSoul2 as any, 'specialist', 'backend', ['API', 'Database']);
  
  console.log(`✅ Agentes registrados: ${agent1.id}, ${agent2.id}`);
  
  // Testar mensagens
  hub.sendMessage(session.id, agent1.id, agent2.id, {
    type: 'request',
    subject: 'Formato da API',
    content: 'Qual será o formato dos endpoints? REST ou GraphQL?',
    metadata: { requiresResponse: true }
  });
  
  hub.sendMessage(session.id, agent2.id, agent1.id, {
    type: 'response',
    subject: 'Re: Formato da API',
    content: 'Vamos usar REST com OpenAPI spec. Vou te enviar o contrato.'
  });
  
  // Testar contrato
  hub.proposeContract(session.id, agent2.id, {
    type: 'api',
    name: 'user_api',
    specification: `
interface UserAPI {
  GET /users - Lista usuários
  POST /users - Cria usuário
  GET /users/:id - Busca usuário
}
    `
  });
  
  // Testar artefato
  hub.submitArtifact(session.id, agent1.id, {
    type: 'code',
    name: 'UserList.tsx',
    content: 'export const UserList = () => <div>Users</div>',
    dependencies: []
  });
  
  // Relatório
  console.log('\n' + hub.generateSessionReport(session.id));
  
  console.log('\n✅ Todos os testes concluídos!');
}

// Executar
testMultiAgentCollaboration().catch(console.error);
