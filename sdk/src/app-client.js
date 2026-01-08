/**
 * PROST-QS App Client - Server-to-Server Integration
 * 
 * Use este cliente para integração backend-to-backend via API Keys.
 * Para autenticação de usuários finais, use KernelClient.
 */

export class AppClient {
  constructor(config = {}) {
    if (!config.publicKey || !config.secretKey) {
      throw new Error('AppClient requer publicKey e secretKey');
    }
    
    this.baseURL = config.baseURL || 'http://localhost:8080/api/v1';
    this.publicKey = config.publicKey;
    this.secretKey = config.secretKey;
    this.debug = config.debug || false;
  }

  /**
   * Faz requisição HTTP com API Key
   * Headers padrão: X-Prost-App-Key e X-Prost-App-Secret
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Prost-App-Key': this.publicKey,
      'X-Prost-App-Secret': this.secretKey,
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    if (this.debug) {
      console.log(`[PROST-QS App] ${options.method || 'GET'} ${endpoint}`);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new AppClientError(
          data.error || 'Erro desconhecido',
          response.status,
          data
        );
      }

      return data;
    } catch (err) {
      if (err instanceof AppClientError) throw err;
      throw new AppClientError(err.message, 0);
    }
  }

  // ========================================
  // EVENTS API
  // ========================================

  /**
   * Envia evento de audit
   */
  async captureEvent(type, actorId, options = {}) {
    return this.request('/apps/events', {
      method: 'POST',
      body: {
        type,
        actor_id: actorId,
        actor_type: options.actorType || 'user',
        target_id: options.targetId,
        target_type: options.targetType,
        action: options.action,
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
        ip: options.ip,
        user_agent: options.userAgent,
      }
    });
  }

  /**
   * Lista eventos do app
   */
  async listEvents(limit = 100) {
    return this.request(`/apps/events?limit=${limit}`, { method: 'GET' });
  }

  // ========================================
  // CONVENIENCE METHODS
  // ========================================

  /**
   * Registra login de usuário
   */
  async trackLogin(userId, ip, userAgent) {
    return this.captureEvent('user.login', userId, {
      action: 'login',
      ip,
      userAgent
    });
  }

  /**
   * Registra logout de usuário
   */
  async trackLogout(userId) {
    return this.captureEvent('user.logout', userId, { action: 'logout' });
  }

  /**
   * Registra signup de usuário
   */
  async trackSignup(userId, metadata = {}) {
    return this.captureEvent('user.signup', userId, {
      action: 'signup',
      metadata
    });
  }

  /**
   * Registra pagamento
   */
  async trackPayment(userId, paymentId, status, metadata = {}) {
    return this.captureEvent(`payment.${status}`, userId, {
      targetId: paymentId,
      targetType: 'payment',
      action: status,
      metadata
    });
  }

  /**
   * Registra ação administrativa
   */
  async trackAdminAction(adminId, action, targetId, targetType, metadata = {}) {
    return this.captureEvent('admin.action', adminId, {
      actorType: 'admin',
      targetId,
      targetType,
      action,
      metadata
    });
  }

  /**
   * Registra evento de segurança
   */
  async trackSecurityEvent(type, actorId, ip, metadata = {}) {
    return this.captureEvent(`security.${type}`, actorId, {
      action: type,
      ip,
      metadata
    });
  }
}

/**
 * Erro do AppClient
 */
export class AppClientError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'AppClientError';
    this.status = status;
    this.data = data;
  }
}
