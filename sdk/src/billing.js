/**
 * PROST-QS Kernel SDK - Billing Module
 * Economia soberana: Ledger, Payments, Subscriptions
 */

export class BillingModule {
  constructor(client) {
    this.client = client;
  }

  // ========================================
  // ACCOUNT
  // ========================================

  /**
   * Busca conta de billing do usuário
   * @returns {Promise<{account_id: string, balance: number, currency: string}>}
   */
  async getAccount() {
    return this.client.get('/billing/account');
  }

  /**
   * Cria conta de billing
   * @param {string} email 
   * @param {string} phone 
   */
  async createAccount(email, phone) {
    return this.client.post('/billing/account', { email, phone });
  }

  // ========================================
  // LEDGER
  // ========================================

  /**
   * Busca ledger com saldo e entradas
   * @returns {Promise<{balance: number, currency: string, entries: Array}>}
   */
  async getLedger() {
    return this.client.get('/billing/ledger');
  }

  /**
   * Busca apenas o saldo
   * @returns {Promise<number>}
   */
  async getBalance() {
    const ledger = await this.getLedger();
    return ledger.balance;
  }

  // ========================================
  // PAYMENT INTENTS
  // ========================================

  /**
   * Cria uma intenção de pagamento
   * @param {number} amount - Valor em centavos
   * @param {string} currency - Moeda (brl, usd)
   * @param {string} description - Descrição
   * @param {string} idempotencyKey - Chave de idempotência (opcional)
   */
  async createPaymentIntent(amount, currency = 'brl', description = '', idempotencyKey = null) {
    return this.client.post('/billing/intents', {
      amount,
      currency,
      description,
      idempotency_key: idempotencyKey,
    });
  }

  /**
   * Lista payment intents
   */
  async listPaymentIntents() {
    return this.client.get('/billing/intents');
  }

  /**
   * Busca um payment intent específico
   * @param {string} intentId 
   */
  async getPaymentIntent(intentId) {
    return this.client.get(`/billing/intents/${intentId}`);
  }

  // ========================================
  // SUBSCRIPTIONS
  // ========================================

  /**
   * Cria uma assinatura
   * @param {string} planId - ID do plano
   * @param {number} amount - Valor em centavos
   * @param {string} currency - Moeda
   * @param {string} interval - 'month' ou 'year'
   */
  async createSubscription(planId, amount, currency = 'brl', interval = 'month') {
    return this.client.post('/billing/subscriptions', {
      plan_id: planId,
      amount,
      currency,
      interval,
    });
  }

  /**
   * Busca assinatura ativa
   */
  async getActiveSubscription() {
    return this.client.get('/billing/subscriptions/active');
  }

  /**
   * Cancela uma assinatura
   * @param {string} subscriptionId 
   */
  async cancelSubscription(subscriptionId) {
    return this.client.delete(`/billing/subscriptions/${subscriptionId}`);
  }

  // ========================================
  // PAYOUTS
  // ========================================

  /**
   * Solicita um saque
   * @param {number} amount - Valor em centavos
   * @param {string} currency - Moeda
   * @param {string} destination - Destino (conta bancária, etc)
   */
  async requestPayout(amount, currency = 'brl', destination) {
    return this.client.post('/billing/payouts', {
      amount,
      currency,
      destination,
    });
  }
}
