
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * CONFIGURAÇÃO DO CLIENTE HTTP
 * Singleton para comunicações REST
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Id': 'GHOST_COMMAND_CENTER_V1',
  },
  timeout: 10000, // 10 segundos de timeout para evitar hanging
});

// Interceptor de Requisição (Auth placeholder / Logs)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Aqui poderíamos injetar tokens JWT se necessário
    // const token = localStorage.getItem('ghost_token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta (Tratamento Global de Erros)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorData = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };

    console.error('🔴 [GHOST_NET FAILURE]:', errorData);

    // Poderíamos disparar um toast global aqui
    return Promise.reject(error);
  }
);
