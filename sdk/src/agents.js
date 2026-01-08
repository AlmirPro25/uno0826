/**
 * PROST-QS Kernel SDK - Agents Module
 * Governança de agentes autônomos
 */

export class AgentsModule {
  constructor(client) {
    this.client = client;
  }

  // ========================================
  // AGENTS
  // ========================================

  /**
   * Lista agentes
   */
  async listAgents() {
    return this.client.get('/agents');
  }

  /**
   * Cria um agente
   * @param {string} name - Nome do agente
   * @param {string} description - Descrição
   * @param {string} type - 'observer', 'operator', 'executor'
   */
  async createAgent(name, description, type = 'observer') {
    return this.client.post('/agents', { name, description, type });
  }

  /**
   * Busca um agente
   * @param {string} agentId 
   */
  async getAgent(agentId) {
    return this.client.get(`/agents/${agentId}`);
  }

  /**
   * Suspende um agente
   * @param {string} agentId 
   */
  async suspendAgent(agentId) {
    return this.client.post(`/agents/${agentId}/suspend`, {});
  }

  /**
   * Ativa um agente
   * @param {string} agentId 
   */
  async activateAgent(agentId) {
    return this.client.post(`/agents/${agentId}/activate`, {});
  }

  /**
   * Busca estatísticas de um agente
   * @param {string} agentId 
   */
  async getAgentStats(agentId) {
    return this.client.get(`/agents/${agentId}/stats`);
  }

  // ========================================
  // POLICIES
  // ========================================

  /**
   * Lista políticas de um agente
   * @param {string} agentId 
   */
  async listPolicies(agentId) {
    return this.client.get(`/agents/${agentId}/policies`);
  }

  /**
   * Cria uma política
   * @param {string} agentId 
   * @param {string} domain - 'ads', 'billing', 'subscriptions', etc
   * @param {string[]} allowedActions - Lista de ações permitidas
   * @param {number} maxAmount - Limite financeiro
   * @param {boolean} requiresApproval - Requer aprovação humana
   */
  async createPolicy(agentId, domain, allowedActions, maxAmount = 0, requiresApproval = true) {
    return this.client.post('/agents/policies', {
      agent_id: agentId,
      domain,
      allowed_actions: allowedActions,
      max_amount: maxAmount,
      requires_approval: requiresApproval,
    });
  }

  // ========================================
  // DECISIONS
  // ========================================

  /**
   * Lista decisões pendentes de aprovação
   */
  async listPendingDecisions() {
    return this.client.get('/agents/decisions/pending');
  }

  /**
   * Lista todas as decisões
   * @param {string} status - Filtro por status (opcional)
   */
  async listDecisions(status = null) {
    const query = status ? `?status=${status}` : '';
    return this.client.get(`/agents/decisions${query}`);
  }

  /**
   * Busca uma decisão
   * @param {string} decisionId 
   */
  async getDecision(decisionId) {
    return this.client.get(`/agents/decisions/${decisionId}`);
  }

  /**
   * Aprova uma decisão
   * @param {string} decisionId 
   * @param {string} note - Nota de aprovação (opcional)
   */
  async approveDecision(decisionId, note = '') {
    return this.client.post(`/agents/decisions/${decisionId}/approve`, { note });
  }

  /**
   * Rejeita uma decisão
   * @param {string} decisionId 
   * @param {string} note - Motivo da rejeição
   */
  async rejectDecision(decisionId, note = '') {
    return this.client.post(`/agents/decisions/${decisionId}/reject`, { note });
  }

  /**
   * Propõe uma decisão (usado por agentes)
   * @param {string} agentId 
   * @param {string} domain 
   * @param {string} action 
   * @param {string} targetEntity - Ex: 'campaign:uuid'
   * @param {object} payload - Dados adicionais
   * @param {string} reason - Justificativa
   * @param {number} amount - Valor envolvido (para cálculo de risco)
   */
  async proposeDecision(agentId, domain, action, targetEntity, payload = {}, reason = '', amount = 0) {
    return this.client.post('/agents/decisions', {
      agent_id: agentId,
      domain,
      action,
      target_entity: targetEntity,
      payload,
      reason,
      amount,
    });
  }

  // ========================================
  // AUDIT
  // ========================================

  /**
   * Busca logs de execução
   */
  async getExecutionLogs() {
    return this.client.get('/agents/audit/logs');
  }
}
