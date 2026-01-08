/**
 * Exemplo de governança de agentes com PROST-QS Kernel SDK
 * 
 * Demonstra:
 * - Criar agente
 * - Definir política
 * - Propor decisão
 * - Aprovar/Rejeitar
 */

import { KernelClient } from '../src/index.js';

async function main() {
  const kernel = new KernelClient({
    baseURL: 'http://localhost:8080/api/v1',
    debug: true
  });

  console.log('=== Agent Governance Demo ===\n');

  try {
    // 1. Autenticar
    console.log('🔐 Autenticando...');
    const login = await kernel.auth.login('+5511888887777');
    await login.verify(login.devOTP);
    console.log('✅ Autenticado\n');

    // 2. Criar agente
    console.log('🤖 Criando agente...');
    const agent = await kernel.agents.createAgent(
      'AdOptimizer',
      'Agente que otimiza campanhas de ads',
      'operator'
    );
    console.log('✅ Agente criado:', agent.id);
    console.log('   Nome:', agent.name);
    console.log('   Tipo:', agent.type);

    // 3. Criar política
    console.log('\n📜 Criando política...');
    const policy = await kernel.agents.createPolicy(
      agent.id,
      'ads',
      ['pause_campaign', 'resume_campaign', 'adjust_bid'],
      10000, // Max R$100
      true   // Requer aprovação
    );
    console.log('✅ Política criada:', policy.id);
    console.log('   Domínio:', policy.domain);
    console.log('   Ações permitidas:', policy.allowed_actions);

    // 4. Propor decisão
    console.log('\n💡 Propondo decisão...');
    const decision = await kernel.agents.proposeDecision(
      agent.id,
      'ads',
      'pause_campaign',
      'campaign:demo-campaign-123',
      { reason: 'CTR abaixo de 1%', current_ctr: 0.5 },
      'Campanha com performance ruim, sugerindo pausa',
      0
    );
    console.log('✅ Decisão proposta:', decision.id);
    console.log('   Status:', decision.status);
    console.log('   Risk Score:', decision.risk_score);

    // 5. Listar pendentes
    console.log('\n📋 Decisões pendentes...');
    const pending = await kernel.agents.listPendingDecisions();
    console.log('✅ Total pendentes:', pending.length);

    // 6. Aprovar decisão
    if (pending.length > 0) {
      console.log('\n✅ Aprovando decisão...');
      const approved = await kernel.agents.approveDecision(
        pending[0].id,
        'Aprovado após análise manual'
      );
      console.log('✅ Decisão aprovada:', approved.status);
    }

    // 7. Ver estatísticas
    console.log('\n📊 Estatísticas do agente...');
    const stats = await kernel.agents.getAgentStats(agent.id);
    console.log('✅ Stats:', JSON.stringify(stats, null, 2));

    // 8. Ver logs
    console.log('\n📝 Logs de execução...');
    const logs = await kernel.agents.getExecutionLogs();
    console.log('✅ Total logs:', logs.length);

    console.log('\n=== Demo concluída! ===');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    if (err.code) console.error('   Código:', err.code);
  }
}

main();
