/**
 * PROST-QS Kernel SDK
 * 
 * SDK oficial para o Kernel Soberano PROST-QS
 * Identity + Billing + Ads + Agents
 * 
 * @example
 * ```js
 * import { KernelClient } from '@prost-qs/kernel-sdk';
 * 
 * const kernel = new KernelClient({
 *   baseURL: 'https://api.seudominio.com/api/v1'
 * });
 * 
 * // Login
 * const login = await kernel.auth.login('+5511999999999');
 * console.log('OTP (dev):', login.devOTP);
 * await login.verify('123456');
 * 
 * // Identidade
 * const me = await kernel.identity.me();
 * console.log('User ID:', me.user_id);
 * 
 * // Billing
 * const ledger = await kernel.billing.getLedger();
 * console.log('Saldo:', ledger.balance);
 * ```
 */

import { KernelHttpClient, KernelError } from './client.js';
import { AuthModule } from './auth.js';
import { IdentityModule } from './identity.js';
import { BillingModule } from './billing.js';
import { AdsModule } from './ads.js';
import { AgentsModule } from './agents.js';
import { AppClient, AppClientError } from './app-client.js';

/**
 * Cliente principal do Kernel SDK
 */
export class KernelClient {
  /**
   * @param {Object} config - Configuração
   * @param {string} config.baseURL - URL base da API (ex: http://localhost:8080/api/v1)
   * @param {string} config.token - Token JWT (opcional)
   * @param {Function} config.onTokenExpired - Callback quando token expira
   * @param {boolean} config.debug - Modo debug
   */
  constructor(config = {}) {
    this._client = new KernelHttpClient(config);
    
    // Módulos
    this.auth = new AuthModule(this._client);
    this.identity = new IdentityModule(this._client);
    this.billing = new BillingModule(this._client);
    this.ads = new AdsModule(this._client);
    this.agents = new AgentsModule(this._client);
  }

  /**
   * Define o token manualmente
   * @param {string} token 
   */
  setToken(token) {
    this._client.setToken(token);
  }

  /**
   * Busca o token atual
   * @returns {string|null}
   */
  getToken() {
    return this._client.token;
  }

  /**
   * Verifica se está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return this._client.isAuthenticated();
  }

  /**
   * Acesso direto ao HTTP client (para chamadas customizadas)
   */
  get http() {
    return this._client;
  }
}

// Exports
export { KernelHttpClient, KernelError };
export { AuthModule } from './auth.js';
export { IdentityModule } from './identity.js';
export { BillingModule } from './billing.js';
export { AdsModule } from './ads.js';
export { AgentsModule } from './agents.js';
export { AppClient, AppClientError } from './app-client.js';

// Default export
export default KernelClient;
