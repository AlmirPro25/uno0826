
import axios, { AxiosInstance, AxiosError } from 'axios';

// NEURAL LINK CONFIGURATION
// Optimized for high-latency planetary networks.

const NEURAL_LINK: AxiosInstance = axios.create({
  baseURL: '/api/v1', // Proxy defined in Vite config handles the routing
  timeout: 15000, // 15s timeout for deep space communication lags
  headers: {
    'Content-Type': 'application/json',
    'X-Cydonia-Version': '0.9.4-BETA',
  },
});

// REQUEST INTERCEPTOR: IDENTITY INJECTION
NEURAL_LINK.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cydonia_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: ERROR TRIAGE
NEURAL_LINK.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // 401: NEURAL LINK SEVERED (Unauthorized)
    if (status === 401) {
      console.warn('[CYDONIA] Neural Link Severed. Initiating logout sequence.');
      localStorage.removeItem('cydonia_token');
      window.location.href = '/login';
    }

    // 500: CORE MELTDOWN (Server Error)
    if (status && status >= 500) {
      console.error('[CYDONIA] CRITICAL: Core Systems Unresponsive.');
    }

    return Promise.reject(error);
  }
);

export default NEURAL_LINK;
