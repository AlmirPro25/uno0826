/**
 * Exemplo básico de uso do PROST-QS Kernel SDK
 * 
 * Execute com: node --experimental-modules basic-usage.js
 */

import { KernelClient } from '../src/index.js';

async function main() {
  // 1. Criar cliente
  const kernel = new KernelClient({
    baseURL: 'http://localhost:8080/api/v1',
    debug: true
  });

  console.log('=== PROST-QS Kernel SDK Demo ===\n');

  try {
    // 2. Login
    console.log('📱 Solicitando OTP...');
    const login = await kernel.auth.login('+5511999998888');
    console.log('✅ OTP enviado! Código (dev):', login.devOTP);
    
    // 3. Verificar OTP
    console.log('\n🔐 Verificando código...');
    const verification = await login.verify(login.devOTP);
    console.log('✅ Autenticado!');
    console.log('   User ID:', verification.user_id);
    console.log('   Novo usuário:', verification.is_new_user);

    // 4. Buscar identidade
    console.log('\n👤 Buscando identidade...');
    const me = await kernel.identity.me();
    console.log('✅ Identidade:', me.primary_phone);

    // 5. Criar conta de billing
    console.log('\n💳 Criando conta de billing...');
    try {
      const account = await kernel.billing.createAccount('demo@kernel.io', '+5511999998888');
      console.log('✅ Conta criada:', account.account_id);
    } catch (err) {
      if (err.status === 409) {
        console.log('ℹ️  Conta já existe');
      } else {
        throw err;
      }
    }

    // 6. Ver ledger
    console.log('\n📒 Consultando ledger...');
    const ledger = await kernel.billing.getLedger();
    console.log('✅ Saldo:', ledger.balance, ledger.currency);
    console.log('   Entradas:', ledger.entries.length);

    // 7. Logout
    console.log('\n🚪 Fazendo logout...');
    kernel.auth.logout();
    console.log('✅ Desconectado');

    console.log('\n=== Demo concluída com sucesso! ===');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    if (err.code) console.error('   Código:', err.code);
    if (err.status) console.error('   Status:', err.status);
  }
}

main();
