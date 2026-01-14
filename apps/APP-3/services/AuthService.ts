// src/services/AuthService.ts
import { apiService } from './ApiService';

interface AuthResponse {
    id: string;
    email: string;
    token: string;
}

export const register = (email: string, password: string): Promise<AuthResponse> => {
    return apiService.post('/auth/register', { email, password });
};

export const login = (email: string, password: string): Promise<AuthResponse> => {
    return apiService.post('/auth/login', { email, password });
};

export const loginWithGoogle = (credential: string): Promise<AuthResponse> => {
    return apiService.post('/auth/google', { credential });
};

export const getProfile = (): Promise<{ id: string; email: string; createdAt: string; }> => {
    return apiService.get('/auth/profile');
}