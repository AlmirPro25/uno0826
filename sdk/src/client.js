/**
 * PROST-QS Kernel SDK - HTTP Client Base
 * Todas as chamadas passam por aqui
 */

export class KernelHttpClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:8080/api/v1';
    this.token = config.token || null;
    this.onTokenExpired = config.onTokenExpired || null;
    this.debug = config.debug || false;
  }

  /**
   * Define o token de autenticação
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Remove o token
   */
  clearToken() {
    this.token = null;
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Faz requisição HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    if (this.debug) {
      console.log(`[Kernel SDK] ${options.method || 'GET'} ${endpoint}`);
    }

    try {
      const response = await fetch(url, config);
      
      // Token expirado
      if (response.status === 401) {
        this.clearToken();
        if (this.onTokenExpired) {
          this.onTokenExpired();
        }
        throw new KernelError('Token expirado ou inválido', 'AUTH_EXPIRED', 401);
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new KernelError(
          data.error || 'Erro desconhecido',
          data.code || 'UNKNOWN_ERROR',
          response.status,
          data
        );
      }

      return data;
    } catch (err) {
      if (err instanceof KernelError) throw err;
      throw new KernelError(err.message, 'NETWORK_ERROR', 0);
    }
  }

  // Métodos de conveniência
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Erro customizado do Kernel
 */
export class KernelError extends Error {
  constructor(message, code, status, data = null) {
    super(message);
    this.name = 'KernelError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}
