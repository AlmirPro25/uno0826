
import { uplink } from '@/lib/axios';
import { LoginCredentials, AuthResponse } from '../../../../shared/types';

/**
 * AUTHENTICATION MODULE
 * Gerencia credenciais e tokens de acesso.
 */
export const authService = {
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await uplink.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async verifySession(): Promise<boolean> {
    try {
      await uplink.get('/auth/me');
      return true;
    } catch {
      return false;
    }
  },

  logout(): void {
    // Client-side cleanup only, stateless JWT
    localStorage.removeItem('sentinel_token');
    window.location.reload();
  }
};
