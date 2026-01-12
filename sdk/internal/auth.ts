/**
 * PROST-QS SDK — Auth Module
 * 
 * Gerenciamento de autenticação, sessões e MFA.
 */

import { ProstQSClient } from './client';

export interface LoginRequest {
  username: string;
  password: string;
  mfa_code?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refresh_token: string;
  expires_at: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
  };
  mfa_required?: boolean;
}

export interface MFASetupResponse {
  success: boolean;
  setup_id: string;
  secret: string;
  qr_code_uri: string;
  backup_codes: string[];
  message: string;
}

export interface MFAStatus {
  enabled: boolean;
  setup_id?: string;
  verified_at?: string;
  backup_codes_remaining: number;
}

export interface Session {
  id: string;
  device_info: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  is_current: boolean;
  last_activity: string;
  expires_at: string;
  created_at: string;
}

export interface SessionStats {
  active_sessions: number;
  sessions_last_7_days: number;
  last_activity: string;
  unique_ips: number;
}

export interface RefreshTokenResponse {
  token: string;
  expires_at: string;
}

/**
 * Auth Service
 */
export class AuthService {
  constructor(private client: ProstQSClient) {}

  /**
   * Login com username e senha
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', request);
    
    if (response.token) {
      this.client.setToken(response.token);
    }
    
    return response;
  }

  /**
   * Logout da sessão atual
   */
  async logout(): Promise<void> {
    await this.client.post('/auth/logout', {});
    this.client.clearToken();
  }

  /**
   * Logout de todas as sessões
   */
  async logoutAll(): Promise<{ success: boolean; sessions_revoked: number }> {
    const response = await this.client.post<{ success: boolean; sessions_revoked: number }>(
      '/auth/logout-all',
      {}
    );
    this.client.clearToken();
    return response;
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await this.client.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    if (response.token) {
      this.client.setToken(response.token);
    }
    
    return response;
  }

  // ========================================
  // MFA (Multi-Factor Authentication)
  // ========================================

  /**
   * Iniciar setup de MFA
   */
  async setupMFA(email: string): Promise<MFASetupResponse> {
    return this.client.post<MFASetupResponse>('/auth/mfa/setup', { email });
  }

  /**
   * Verificar código e habilitar MFA
   */
  async verifyMFA(code: string): Promise<{ success: boolean; message: string }> {
    return this.client.post('/auth/mfa/verify', { code });
  }

  /**
   * Validar código MFA no login
   */
  async validateMFA(userId: string, code: string): Promise<{ success: boolean; valid: boolean }> {
    return this.client.post('/auth/mfa/validate', { user_id: userId, code });
  }

  /**
   * Desabilitar MFA
   */
  async disableMFA(code: string): Promise<{ success: boolean; message: string }> {
    return this.client.delete('/auth/mfa', { data: { code } });
  }

  /**
   * Regenerar códigos de backup
   */
  async regenerateBackupCodes(code: string): Promise<{ success: boolean; backup_codes: string[] }> {
    return this.client.post('/auth/mfa/backup-codes', { code });
  }

  /**
   * Obter status do MFA
   */
  async getMFAStatus(): Promise<MFAStatus> {
    return this.client.get<MFAStatus>('/auth/mfa/status');
  }

  // ========================================
  // Session Management
  // ========================================

  /**
   * Obter informações do usuário atual
   */
  async me(): Promise<LoginResponse['user']> {
    return this.client.get('/users/me');
  }

  /**
   * Verificar se token é válido
   */
  async verifyToken(): Promise<boolean> {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Revogar tokens de um usuário (admin only)
   */
  async revokeUserTokens(userId: string): Promise<{ success: boolean; sessions_revoked: number }> {
    return this.client.post(`/auth/revoke/${userId}`, {});
  }

  // ========================================
  // Session Management
  // ========================================

  /**
   * Listar sessões ativas
   */
  async getSessions(): Promise<{ sessions: Session[]; count: number }> {
    return this.client.get('/auth/sessions');
  }

  /**
   * Obter estatísticas de sessões
   */
  async getSessionStats(): Promise<SessionStats> {
    return this.client.get('/auth/sessions/stats');
  }

  /**
   * Revogar uma sessão específica
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    return this.client.delete(`/auth/sessions/${sessionId}`);
  }

  /**
   * Revogar todas as outras sessões (exceto a atual)
   */
  async revokeOtherSessions(): Promise<{ success: boolean; sessions_revoked: number }> {
    return this.client.delete('/auth/sessions');
  }
}

/**
 * Criar instância do AuthService
 */
export function createAuthService(client: ProstQSClient): AuthService {
  return new AuthService(client);
}
