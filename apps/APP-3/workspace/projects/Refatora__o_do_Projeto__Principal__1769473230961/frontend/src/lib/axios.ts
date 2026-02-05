
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * SENTINEL NEXUS - SECURE UPLINK CONFIGURATION
 * Configuração do Cliente HTTP para comunicação API REST
 */

const API_URL = '/api'; // Proxy handle in Vite config handles the localhost:3000 mapping

export const uplink = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Sentinel-Client': 'WEB-C2-TERMINAL-V1'
  },
  timeout: 10000, // 10s timeout for strict latency control
});

// REQUEST INTERCEPTOR: Inject Authorization Token
uplink.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('sentinel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[UPLINK FAILURE] Request Interception Failed:', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Global Error Handling & Auth Rotation
uplink.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const { response } = error;
    
    // Unauthorized / Token Expired
    if (response?.status === 401) {
      console.warn('[SECURITY ALERT] Session Invalidated. Initiating logout protocol.');
      localStorage.removeItem('sentinel_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Server Errors
    if (response && response.status >= 500) {
      console.error('[CORE SYSTEM ERROR] Backend Systems Unstable.');
    }

    return Promise.reject(error);
  }
);
