
import api from '@/lib/axios';
import { AuthResponse } from '../../../../shared/types';

// IDENTITY VERIFICATION MODULE
export const AuthService = {
  
  establishLink: async (accessCode: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/link', { access_code: accessCode });
    return data;
  },

  terminateLink: async (): Promise<void> => {
    // Optional server-side logout to invalidate tokens
    try {
      await api.post('/auth/unlink');
    } catch (e) {
      // Ignore network errors on logout, client side cleanup is priority
    }
  }
};
