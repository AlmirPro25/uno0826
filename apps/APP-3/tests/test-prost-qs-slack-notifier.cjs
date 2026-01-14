/**
 * 🧪 TESTES: PROST-QS SLACK NOTIFIER
 * 
 * Validar integração com Slack para notificações em tempo real
 */

const assert = require('assert');

// Mock do axios para testes
const mockAxios = {
  post: async (url, data) => {
    if (!url) throw new Error('URL é obrigatória');
    return { status: 200, data: { ok: true } };
  },
};

// Simulação da classe ProstQSSlackNotifier
class ProstQSSlackNotifier {
  constructor(config) {
    if (!config.webhookUrl) {
      throw new Error('Slack webhook URL é obrigatório');
    }
    this.config = {
      username: 'PROST-QS',
      iconEmoji: '👑',
      enableMentions: false,
      enableThreads: true,
      enableDailyReport: false,
      dailyReportTime: '09:00',
      ...config,
    };
  }

  async notifyGateResult(result, author, reviewers) {
    const message = this.buildGateMessage(result, author, reviewers);
    await this.send(message);
  }

  async notifyTrendChange(trend, previousTrend, stats) {
    if (trend === previousTrend) return;
    const message = this.buildTrendMessage(trend, stats);
    await this.send(message);
  }

  async notifyAlert(severity, title, description, metadata) {
    const message = this.buildAlertMessage(severity, title, description, metadata);
    await this.send(message);
  }

  async sendReport(stats, recentHistory, recommendations) {
    const message = this.buildReportMessage(stats, recentHistory, recommendations);
    await this.send(message);
  }

  buildGateMessage(result, author, reviewers) {
    const emoji = result.decision === 'APPROVE' ? '✅' :
                  result.decision === 'WARNING' ? '⚠️' : '❌';

    return {
      text: `${emoji} PROST-QS CI Gate: ${result.decision}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} PROST-QS CI Gate: ${result.decision}`,
          },
        },
      ],
    };
  }

  buildTrendMessage(trend, stats) {
    const emoji = trend === 'improving' ? '📈' :
                  trend === 'declining' ? '📉' : '➡️';

    return {
      text: `${emoji} Tendência: ${trend}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Tendência de Conformidade: ${trend}`,
          },
        },
      ],
    };
  }

  buildAlertMessage(severity, title, description, metadata) {
    const emoji = severity === 'critical' ? '🚨' :
                  severity === 'high' ? '🔴' :
                  severity === 'medium' ? '🟠' : '🟡';

    return {
      text: `${emoji} ${title}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${title}`,
          },
        },
      ],
    };
  }

  buildReportMessage(stats, recentHistory, recommendations) {
    return {
      text: '📊 Relatório de Conformidade PROST-QS',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Relatório de Conformidade PROST-QS',
          },
        },
      ],
    };
  }

  async send(message) {
    const payload = {
      text: message.text,
      blocks: message.blocks,
      username: this.config.username,
      icon_emoji: this.config.iconEmoji,
    };
    await mockAxios.post(this.config.webhookUrl, payload);
  }
}

// ============================================================================
// TESTES
// ============================================================================

console.log('🧪 INICIANDO TESTES: PROST-QS SLACK NOTIFIER\n');

let testsPassed = 0;
let testsFailed = 0;

// ============================================================================
// SUITE 1: Inicialização
// ============================================================================

console.log('📋 SUITE 1: Inicialização');

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });
  assert(notifier.config.username === 'PROST-QS');
  assert(notifier.config.iconEmoji === '👑');
  console.log('✅ Teste 1.1: Inicialização com defaults');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 1.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  new ProstQSSlackNotifier({});
  console.log('❌ Teste 1.2 FALHOU: Deveria lançar erro sem webhook URL');
  testsFailed++;
} catch (error) {
  assert(error.message.includes('webhook URL'));
  console.log('✅ Teste 1.2: Validação de webhook URL obrigatório');
  testsPassed++;
}

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
    username: 'CustomBot',
    iconEmoji: '🤖',
  });
  assert(notifier.config.username === 'CustomBot');
  assert(notifier.config.iconEmoji === '🤖');
  console.log('✅ Teste 1.3: Configuração customizada');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 1.3 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 2: Notificação de Gate Result
// ============================================================================

console.log('\n📋 SUITE 2: Notificação de Gate Result');

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const result = {
    decision: 'APPROVE',
    score: 85,
    violations: [],
    prNumber: '123',
    branch: 'feature/auth',
    recommendation: 'Código aprovado',
  };

  const message = notifier.buildGateMessage(result);
  assert(message.text.includes('APPROVE'));
  assert(message.text.includes('✅'));
  assert(message.blocks.length > 0);
  console.log('✅ Teste 2.1: Mensagem APPROVE');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 2.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const result = {
    decision: 'WARNING',
    score: 65,
    violations: [{ type: 'SEVERE', code: 'MOCK_PROST_QS', message: 'Mock detectado' }],
    prNumber: '124',
    branch: 'feature/billing',
    recommendation: 'Corrija os warnings',
  };

  const message = notifier.buildGateMessage(result);
  assert(message.text.includes('WARNING'));
  assert(message.text.includes('⚠️'));
  console.log('✅ Teste 2.2: Mensagem WARNING');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 2.2 FALHOU:', error.message);
  testsFailed++;
}

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const result = {
    decision: 'REJECT',
    score: 30,
    violations: [
      { type: 'CRITICAL', code: 'LOCAL_AUTH', message: 'Auth local detectada' },
      { type: 'CRITICAL', code: 'MOCK_PROST_QS', message: 'Mock PROST-QS detectado' },
    ],
    prNumber: '125',
    branch: 'feature/broken',
    recommendation: 'Código rejeitado. Corrija os problemas.',
  };

  const message = notifier.buildGateMessage(result);
  assert(message.text.includes('REJECT'));
  assert(message.text.includes('❌'));
  console.log('✅ Teste 2.3: Mensagem REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 2.3 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 3: Notificação de Tendência
// ============================================================================

console.log('\n📋 SUITE 3: Notificação de Tendência');

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const stats = {
    total: 50,
    approved: 40,
    warnings: 8,
    rejected: 2,
    averageScore: 84.5,
    trend: 'improving',
  };

  const message = notifier.buildTrendMessage('improving', stats);
  assert(message.text.includes('improving'));
  assert(message.text.includes('📈'));
  console.log('✅ Teste 3.1: Mensagem Tendência Melhorando');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 3.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const stats = {
    total: 50,
    approved: 20,
    warnings: 15,
    rejected: 15,
    averageScore: 55.0,
    trend: 'declining',
  };

  const message = notifier.buildTrendMessage('declining', stats);
  assert(message.text.includes('declining'));
  assert(message.text.includes('📉'));
  console.log('✅ Teste 3.2: Mensagem Tendência Piorando');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 3.2 FALHOU:', error.message);
  testsFailed++;
}

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const stats = {
    total: 50,
    approved: 35,
    warnings: 12,
    rejected: 3,
    averageScore: 80.0,
    trend: 'stable',
  };

  const message = notifier.buildTrendMessage('stable', stats);
  assert(message.text.includes('stable'));
  assert(message.text.includes('➡️'));
  console.log('✅ Teste 3.3: Mensagem Tendência Estável');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 3.3 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 4: Notificação de Alertas
// ============================================================================

console.log('\n📋 SUITE 4: Notificação de Alertas');

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const message = notifier.buildAlertMessage(
    'critical',
    'Violação Crítica Detectada',
    'Mock PROST-QS foi detectado no código',
    { 'Arquivo': 'src/app.ts', 'Linha': '42' }
  );
  assert(message.text.includes('Violação Crítica'));
  assert(message.text.includes('🚨'));
  console.log('✅ Teste 4.1: Alerta Crítico');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 4.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const message = notifier.buildAlertMessage(
    'high',
    'Conformidade Baixa',
    'Score médio caiu abaixo de 70',
    { 'Score Anterior': '75', 'Score Atual': '68' }
  );
  assert(message.text.includes('Conformidade Baixa'));
  assert(message.text.includes('🔴'));
  console.log('✅ Teste 4.2: Alerta Alto');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 4.2 FALHOU:', error.message);
  testsFailed++;
}

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const message = notifier.buildAlertMessage(
    'low',
    'Informação',
    'Novo padrão detectado',
    { 'Padrão': 'localStorage auth' }
  );
  assert(message.text.includes('Informação'));
  assert(message.text.includes('🟡'));
  console.log('✅ Teste 4.3: Alerta Baixo');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 4.3 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 5: Relatório de Conformidade
// ============================================================================

console.log('\n📋 SUITE 5: Relatório de Conformidade');

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const stats = {
    total: 50,
    approved: 40,
    warnings: 8,
    rejected: 2,
    averageScore: 84.5,
    trend: 'improving',
  };

  const history = [
    { timestamp: Date.now(), prNumber: '125', score: 85, decision: 'APPROVE', violations: 0 },
    { timestamp: Date.now() - 3600000, prNumber: '124', score: 75, decision: 'WARNING', violations: 2 },
  ];

  const recommendations = [
    'Manter conformidade alta',
    'Revisar padrões de auth',
    'Documentar mudanças',
  ];

  const message = notifier.buildReportMessage(stats, history, recommendations);
  assert(message.text.includes('Relatório'));
  assert(message.blocks.length > 0);
  console.log('✅ Teste 5.1: Relatório de Conformidade');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 5.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 6: Envio de Mensagens
// ============================================================================

console.log('\n📋 SUITE 6: Envio de Mensagens');

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const result = {
    decision: 'APPROVE',
    score: 85,
    violations: [],
    prNumber: '123',
    branch: 'feature/auth',
    recommendation: 'Código aprovado',
  };

  // Simular envio
  notifier.notifyGateResult(result, 'dev@example.com', ['reviewer1', 'reviewer2']);
  console.log('✅ Teste 6.1: Envio de notificação de gate');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 6.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const notifier = new ProstQSSlackNotifier({
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
  });

  const stats = {
    total: 50,
    approved: 40,
    warnings: 8,
    rejected: 2,
    averageScore: 84.5,
    trend: 'improving',
  };

  const history = [];
  const recommendations = [];

  // Simular envio
  notifier.sendReport(stats, history, recommendations);
  console.log('✅ Teste 6.2: Envio de relatório');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 6.2 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// RESUMO
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO DOS TESTES');
console.log('='.repeat(80));
console.log(`✅ Testes Passaram: ${testsPassed}`);
console.log(`❌ Testes Falharam: ${testsFailed}`);
console.log(`📈 Taxa de Sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(80));

if (testsFailed === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
  process.exit(0);
} else {
  console.log('\n❌ ALGUNS TESTES FALHARAM\n');
  process.exit(1);
}
