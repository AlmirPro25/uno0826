/**
 * Exemplo de Integração Server-to-Server com PROST-QS
 * 
 * Este exemplo mostra como integrar seu backend com o PROST-QS
 * usando API Keys para enviar eventos de audit.
 */

import { AppClient } from '../src/index.js';

// ========================================
// CONFIGURAÇÃO
// ========================================

const app = new AppClient({
  publicKey: process.env.PROST_QS_PUBLIC_KEY || 'pq_pk_xxx',
  secretKey: process.env.PROST_QS_SECRET_KEY || 'pq_sk_xxx',
  baseURL: process.env.PROST_QS_URL || 'http://localhost:8080/api/v1',
  debug: true
});

// ========================================
// EXEMPLOS DE USO
// ========================================

async function main() {
  try {
    console.log('🚀 Testando integração com PROST-QS...\n');

    // 1. Rastrear login de usuário
    console.log('1. Rastreando login...');
    await app.trackLogin('user_123', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0)');
    console.log('   ✅ Login rastreado\n');

    // 2. Rastrear signup
    console.log('2. Rastreando signup...');
    await app.trackSignup('user_456', {
      source: 'google_ads',
      campaign: 'black_friday_2024'
    });
    console.log('   ✅ Signup rastreado\n');

    // 3. Rastrear pagamento
    console.log('3. Rastreando pagamento...');
    await app.trackPayment('user_123', 'pay_abc123', 'completed', {
      amount: 9990,
      currency: 'brl',
      method: 'credit_card'
    });
    console.log('   ✅ Pagamento rastreado\n');

    // 4. Evento customizado
    console.log('4. Enviando evento customizado...');
    await app.captureEvent('order.shipped', 'user_123', {
      targetId: 'order_xyz789',
      targetType: 'order',
      action: 'ship',
      metadata: {
        tracking_code: 'BR123456789',
        carrier: 'correios'
      }
    });
    console.log('   ✅ Evento customizado enviado\n');

    // 5. Evento de segurança
    console.log('5. Rastreando evento de segurança...');
    await app.trackSecurityEvent('suspicious', 'user_bad', '1.2.3.4', {
      reason: 'multiple_failed_logins',
      attempts: 5
    });
    console.log('   ✅ Evento de segurança rastreado\n');

    // 6. Listar eventos
    console.log('6. Listando eventos...');
    const result = await app.listEvents(10);
    console.log(`   ✅ ${result.total} eventos encontrados`);
    console.log('   📊 Stats:', result.stats);

    console.log('\n✨ Integração funcionando corretamente!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    if (err.status === 401) {
      console.error('   Verifique suas API Keys');
    }
    process.exit(1);
  }
}

main();
