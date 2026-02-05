import { create } from 'zustand';
import axios from 'axios';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => void;
}

const API_URL = 'http://localhost:3001/api'; // Corrected route

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    token: null,

    login: async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { username, password });
            const token = response.data.token;

            localStorage.setItem('ghost-token', token);
            set({ isAuthenticated: true, token });

            return true;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('ghost-token');
        set({ isAuthenticated: false, token: null });
    },

    checkAuth: () => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('ghost-token');
            if (token) {
                // Check token expiration if possible (decode JWT), for now just check existence
                set({ isAuthenticated: true, token });
            } else {
                set({ isAuthenticated: false, token: null });
            }
        }
    },
}));
