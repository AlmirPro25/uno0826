
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * TITAN NETWORK CLIENT
 * Configured for low-latency communication with Command Server.
 */

const API_URL = 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10s strict timeout
});

// REQUEST INTERCEPTOR: Inject Security Token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle Unauthorized Access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid -> Force logout
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Hard redirect to auth gate
    }
    return Promise.reject(error);
  }
);
