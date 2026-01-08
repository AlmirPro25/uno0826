/**
 * PROST-QS Kernel SDK - Identity Module
 * Gerenciamento de identidade soberana
 */

export class IdentityModule {
  constructor(client) {
    this.client = client;
    this._cachedIdentity = null;
  }

  /**
   * Busca a identidade do usuário autenticado
   * @param {boolean} useCache - Usar cache local
   * @returns {Promise<{user_id: string, primary_phone: string, created_at: string}>}
   */
  async me(useCache = false) {
    if (useCache && this._cachedIdentity) {
      return this._cachedIdentity;
    }

    const identity = await this.client.get('/identity/me');
    this._cachedIdentity = identity;
    return identity;
  }

  /**
   * Limpa cache de identidade
   */
  clearCache() {
    this._cachedIdentity = null;
  }

  /**
   * Verifica se o token atual é válido
   * @returns {Promise<boolean>}
   */
  async verifyToken() {
    try {
      await this.me();
      return true;
    } catch (err) {
      return false;
    }
  }
}
