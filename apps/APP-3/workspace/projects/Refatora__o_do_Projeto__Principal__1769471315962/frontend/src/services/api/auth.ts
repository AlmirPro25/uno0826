
import { api } from '../../lib/axios';
import { LoginRequest, LoginResponse } from '../../../../shared/types';

export const AuthService = {
  /**
   * Authenticate Commander credentials.
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * Validate current session token.
   */
  verifySession: async (): Promise<boolean> => {
    try {
      await api.get('/auth/me'); // Assuming /me endpoint exists for validation
      return true;
    } catch {
      return false;
    }
  }
};
