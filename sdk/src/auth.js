/**
 * PROST-QS Kernel SDK - Auth Module
 * Autenticação soberana via Phone + OTP
 */

export class AuthModule {
  constructor(client) {
    this.client = client;
    this.pendingVerificationId = null;
  }

  /**
   * Solicita OTP para o telefone
   * @param {string} phone - Número de telefone (+5511999999999)
   * @param {string} channel - Canal de entrega ('sms' ou 'whatsapp')
   * @returns {Promise<{verification_id: string, expires_in_seconds: number}>}
   */
  async requestOTP(phone, channel = 'sms') {
    const result = await this.client.post('/identity/verify/request', {
      phone_number: phone,
      channel,
    });
    
    this.pendingVerificationId = result.verification_id;
    return result;
  }

  /**
   * Verifica o código OTP
   * @param {string} code - Código de 6 dígitos
   * @param {string} verificationId - ID da verificação (opcional se requestOTP foi chamado antes)
   * @returns {Promise<{success: boolean, user_id: string, token: string, is_new_user: boolean}>}
   */
  async verifyOTP(code, verificationId = null) {
    const vid = verificationId || this.pendingVerificationId;
    
    if (!vid) {
      throw new Error('Nenhuma verificação pendente. Chame requestOTP primeiro.');
    }

    const result = await this.client.post('/identity/verify/confirm', {
      verification_id: vid,
      code,
    });

    // Auto-salvar token
    if (result.token) {
      this.client.setToken(result.token);
    }

    this.pendingVerificationId = null;
    return result;
  }

  /**
   * Login completo em um passo (para testes/dev)
   * @param {string} phone 
   * @param {string} channel 
   * @returns {Promise<{otp: string, verify: (code: string) => Promise}>}
   */
  async login(phone, channel = 'sms') {
    const otpResult = await this.requestOTP(phone, channel);
    
    return {
      verificationId: otpResult.verification_id,
      expiresIn: otpResult.expires_in_seconds,
      devOTP: otpResult.dev_otp, // Só em dev mode
      verify: (code) => this.verifyOTP(code, otpResult.verification_id),
    };
  }

  /**
   * Logout - limpa token
   */
  logout() {
    this.client.clearToken();
    this.pendingVerificationId = null;
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated() {
    return this.client.isAuthenticated();
  }
}
