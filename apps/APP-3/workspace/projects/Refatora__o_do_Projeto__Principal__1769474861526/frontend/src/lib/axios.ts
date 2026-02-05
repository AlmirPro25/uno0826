
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useTacticalStore } from '@/stores/tacticalStore'; // Import store to dispatch errors

/**
 * AEGIS-VII SECURE HTTP CLIENT
 * Configured for intercepting telemetry and handling signal loss.
 */

const BASE_URL = '/api'; // Vite proxy handles this in dev

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Command-Source': 'AEGIS_HUD_V1',
  },
  timeout: 5000, // 5s timeout for tactical urgency
});

// INTERCEPTOR: OUTGOING COMMANDS
apiClient.interceptors.request.use(
  (config) => {
    const token = useTacticalStore.getState().authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INTERCEPTOR: INCOMING TELEMETRY
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string, errors?: {msg: string}[] };
    let tactMessage = 'SIGNAL LOSS';

    if (status === 400) {
      tactMessage = data.message || (data.errors && data.errors.length > 0 ? data.errors[0].msg : 'INVALID COMMAND PARAMETERS');
    }
    if (status === 401) {
      tactMessage = data.message || 'UNAUTHORIZED ACCESS. PLEASE LOGIN.';
      useTacticalStore.getState().logout(); // Force logout on 401
    }
    if (status === 402) tactMessage = data.message || 'INSUFFICIENT RESOURCES';
    if (status === 403) tactMessage = data.message || 'FORBIDDEN ACCESS'; // e.g., for non-admin purge
    if (status === 404) tactMessage = data.message || 'RESOURCE NOT FOUND';
    if (status === 409) tactMessage = data.message || 'CONFLICT'; // e.g., username exists
    if (status === 500) tactMessage = data.message || 'CORE SYSTEM FAILURE';

    console.error(`[AEGIS_CRITICAL] ${tactMessage}`, error);
    
    useTacticalStore.getState().setError(tactMessage);

    return Promise.reject({
      message: tactMessage,
      original: error
    });
  }
);
