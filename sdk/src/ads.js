/**
 * PROST-QS Kernel SDK - Ads Module
 * Gerenciamento de campanhas e budgets
 */

export class AdsModule {
  constructor(client) {
    this.client = client;
  }

  // ========================================
  // ACCOUNT
  // ========================================

  /**
   * Busca conta de ads
   */
  async getAccount() {
    return this.client.get('/ads/account');
  }

  /**
   * Cria conta de ads
   */
  async createAccount() {
    return this.client.post('/ads/account', {});
  }

  // ========================================
  // CAMPAIGNS
  // ========================================

  /**
   * Lista campanhas
   */
  async listCampaigns() {
    return this.client.get('/ads/campaigns');
  }

  /**
   * Cria uma campanha
   * @param {string} name - Nome da campanha
   * @param {string} budgetId - ID do budget
   * @param {number} bidAmount - Valor do bid em centavos
   */
  async createCampaign(name, budgetId, bidAmount) {
    return this.client.post('/ads/campaigns', {
      name,
      budget_id: budgetId,
      bid_amount: bidAmount,
    });
  }

  /**
   * Busca uma campanha
   * @param {string} campaignId 
   */
  async getCampaign(campaignId) {
    return this.client.get(`/ads/campaigns/${campaignId}`);
  }

  /**
   * Pausa uma campanha
   * @param {string} campaignId 
   */
  async pauseCampaign(campaignId) {
    return this.client.post(`/ads/campaigns/${campaignId}/pause`, {});
  }

  /**
   * Retoma uma campanha
   * @param {string} campaignId 
   */
  async resumeCampaign(campaignId) {
    return this.client.post(`/ads/campaigns/${campaignId}/resume`, {});
  }

  // ========================================
  // BUDGETS
  // ========================================

  /**
   * Lista budgets
   */
  async listBudgets() {
    return this.client.get('/ads/budgets');
  }

  /**
   * Cria um budget
   * @param {string} type - 'daily' ou 'total'
   * @param {number} totalAmount - Valor total em centavos
   */
  async createBudget(type, totalAmount) {
    return this.client.post('/ads/budgets', {
      type,
      total_amount: totalAmount,
    });
  }

  /**
   * Busca um budget
   * @param {string} budgetId 
   */
  async getBudget(budgetId) {
    return this.client.get(`/ads/budgets/${budgetId}`);
  }

  // ========================================
  // SPEND
  // ========================================

  /**
   * Registra um gasto (impressão, clique, etc)
   * @param {string} campaignId 
   * @param {number} amount - Valor em centavos
   * @param {string} eventType - 'impression', 'click', etc
   */
  async recordSpend(campaignId, amount, eventType = 'impression') {
    return this.client.post('/ads/spend', {
      campaign_id: campaignId,
      amount,
      event_type: eventType,
    });
  }
}
