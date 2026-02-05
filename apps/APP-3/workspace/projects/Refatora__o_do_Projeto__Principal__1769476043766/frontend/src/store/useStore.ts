
import { create } from 'zustand';
import { TelemetryFrame, SystemLog } from '../types';
import axios from 'axios';

// AXIOS INTERCEPTOR FOR NEURAL LINK (AUTH)
const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cydonia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AppState {
  // Authentication
  isAuthenticated: boolean;
  token: string | null;
  login: (code: string) => Promise<boolean>;
  logout: () => void;

  // Telemetry
  telemetry: TelemetryFrame | null;
  logs: SystemLog[];
  fetchTelemetry: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  
  // Actions
  modulateSystem: (target: string, value: number) => Promise<void>;
  triggerFailSafe: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  isAuthenticated: !!localStorage.getItem('cydonia_token'),
  token: localStorage.getItem('cydonia_token'),
  telemetry: null,
  logs: [],

  login: async (access_code: string) => {
    try {
      const res = await api.post('/auth/link', { access_code });
      const token = res.data.token;
      localStorage.setItem('cydonia_token', token);
      set({ isAuthenticated: true, token });
      return true;
    } catch (e) {
      console.error("NEURAL HANDSHAKE FAILED");
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('cydonia_token');
    set({ isAuthenticated: false, token: null });
  },

  fetchTelemetry: async () => {
    try {
      const res = await api.get('/telemetry');
      set({ telemetry: res.data });
    } catch (e) {
      // Silent fail in UI, handled by logs
    }
  },

  fetchLogs: async () => {
    try {
      const res = await api.get('/logs/audit');
      set({ logs: res.data });
    } catch (e) {
      // console.error(e);
    }
  },

  modulateSystem: async (target, value) => {
    await api.post('/modulate', { 
      target_system: target, 
      value: Number(value),
      authorization_hash: 'SYS-OVERRIDE' // Simulated for now
    });
  },

  triggerFailSafe: async () => {
    await api.post('/emergency/fail-safe', {});
  }
}));
