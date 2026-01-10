
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * @description Cliente HTTP blindado com interceptores de soberania.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s para garantir resiliência em redes instáveis
});

// Interceptor de Requisição: Injeção de JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sce_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Tratamento de Erros Global e Expiração de Sessão
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sce_token');
        localStorage.removeItem('sce_user_store');
        window.location.href = '/login?reason=expired';
      }
    }
    
    const errorMessage = (error.response?.data as any)?.error || 'Falha catastrófica na infraestrutura.';
    console.error(`[SCE-INFRA-ERROR]: ${errorMessage}`);
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
