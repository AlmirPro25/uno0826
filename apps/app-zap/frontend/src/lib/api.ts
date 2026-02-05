import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore'; // Import auth store

/**
 * CONFIGURAÇÃO DO CLIENTE HTTP (AXIOS)
 * Singleton para comunicações REST, com interceptors para JWT e tratamento de erros.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Id': 'GHOST_COMMAND_CENTER_V1',
  },
  timeout: 10000, // 10 segundos de timeout para evitar requisições penduradas
});

// Interceptor de Requisição: Anexa o token JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Tenta pegar o token do localStorage no momento da requisição
    // Isso é importante porque o Zustand store não é acessível fora de um hook React.
    const token = localStorage.getItem('ghost-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Tratamento Global de Erros (ex: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorData = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    };

    console.error('🔴 [GHOST_NET FAILURE]:', errorData);

    // Se for 401 (Não Autorizado) ou 403 (Proibido), redireciona para o login
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Authentication expired or invalid. Redirecting to login.');
      // Usa o `getState()` do Zustand para chamar logout fora de um componente React
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'; // Redireciona para a página de login
      }
    }

    return Promise.reject(error);
  }
);
