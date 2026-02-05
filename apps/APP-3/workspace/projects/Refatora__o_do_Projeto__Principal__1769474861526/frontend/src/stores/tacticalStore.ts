
import { create } from 'zustand';
import { CommandService } from '@/services/api/command.service';
import type { SitRep, TacticalUnit, Operation, User, LoginPayload, RegisterPayload } from '../../../../shared/types/schema';
import { parseJwt } from '@/lib/utils'; // Utility to parse JWT token
import { redirect } from 'react-router-dom'; // Helper for redirection

/**
 * ZUSTAND STATE CONTAINER
 * The Single Source of Truth for the Frontend HUD, now with Auth.
 */

interface TacticalState {
  // STATE
  data: SitRep | null;
  isLoading: boolean;
  isFabricating: boolean;
  error: string | null;
  selectedUnitId: string | null;
  lastUpdate: number;
  authToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean; // For initial auth check

  // ACTIONS
  initializeAuth: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  pollStatus: () => Promise<void>;
  selectUnit: (id: string | null) => void;
  fabricateUnit: (type: TacticalUnit['type']) => Promise<void>;
  deployUnit: (unitId: string, missionType: Operation['type']) => Promise<void>;
  purgeSystem: () => Promise<void>;
  clearError: () => void;
  setError: (message: string) => void;
}

export const useTacticalStore = create<TacticalState>((set, get) => ({
  // INITIAL STATE
  data: null,
  isLoading: false,
  isFabricating: false,
  error: null,
  selectedUnitId: null,
  lastUpdate: 0,
  authToken: localStorage.getItem('authToken') || null,
  user: null,
  isAuthenticated: !!localStorage.getItem('authToken'),
  authLoading: true, // Start loading for initial auth check

  // ACTION: Initialize Auth from localStorage
  initializeAuth: () => {
    set({ authLoading: true });
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedUser = parseJwt(token); // Decode JWT to get user info
        if (decodedUser && decodedUser.exp * 1000 > Date.now()) { // Check expiration
          set({ authToken: token, user: decodedUser, isAuthenticated: true, authLoading: false });
          return;
        }
      } catch (e) {
        console.error("Failed to decode or validate stored token:", e);
      }
    }
    // If no valid token, ensure state is clean
    localStorage.removeItem('authToken');
    set({ authToken: null, user: null, isAuthenticated: false, authLoading: false });
  },

  // ACTION: Login
  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await CommandService.login(payload);
      localStorage.setItem('authToken', token);
      set({ authToken: token, user, isAuthenticated: true, isLoading: false });
      // Redirect to dashboard after successful login
      window.location.href = '/dashboard';
    } catch (err: any) {
      // Error handled by Axios interceptor and sets `error` state.
      console.error("Login failed:", err);
      set({ isLoading: false });
    }
  },

  // ACTION: Register
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await CommandService.register(payload);
      localStorage.setItem('authToken', token);
      set({ authToken: token, user, isAuthenticated: true, isLoading: false });
      // Redirect to dashboard after successful registration
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error("Registration failed:", err);
      set({ isLoading: false });
    }
  },

  // ACTION: Logout
  logout: () => {
    localStorage.removeItem('authToken');
    set({ authToken: null, user: null, isAuthenticated: false, data: null, selectedUnitId: null });
    // Redirect to login page
    window.location.href = '/login';
  },

  // ACTION: Heartbeat Polling
  pollStatus: async () => {
    if (!get().isAuthenticated || get().authLoading) return; // Don't poll if not authenticated or still checking auth
    try {
      const sitRep = await CommandService.getSitRep();
      set({ 
        data: sitRep, 
        lastUpdate: Date.now(),
        error: get().error === 'SIGNAL LOSS' ? null : get().error // Clear 'SIGNAL LOSS' if connection restored
      });
    } catch (err: any) {
      console.error("[ZUSTAND_FETCH_ERROR]", err);
      if (!get().error) {
         set({ error: err.message || 'UPLINK SEVERED' });
      }
    }
  },

  // ACTION: UI Selection
  selectUnit: (id) => set({ selectedUnitId: id }),

  // ACTION: Fabricate
  fabricateUnit: async (type) => {
    set({ isFabricating: true, error: null });
    try {
      await CommandService.fabricateUnit({ type });
      await get().pollStatus(); // Immediate refresh to show resource deduction and new unit
    } catch (err: any) {
      console.error("Fabrication failed:", err);
    } finally {
      set({ isFabricating: false });
    }
  },

  // ACTION: Deploy
  deployUnit: async (unitId, missionType) => {
    set({ error: null });
    try {
      await CommandService.deployUnit({ unitId, missionType });
      set({ selectedUnitId: null }); // Deselect on success
      await get().pollStatus(); // Immediate refresh
    } catch (err: any) {
      console.error("Deployment failed:", err);
    }
  },

  // ACTION: Nuke
  purgeSystem: async () => {
    set({ error: null });
    try {
      await CommandService.purgeSystem();
      set({ data: null, selectedUnitId: null });
      await get().pollStatus(); // Fetch initial state after purge
    } catch (err: any) {
      console.error("Purge failed:", err);
    }
  },

  clearError: () => set({ error: null }),
  setError: (message) => set({ error: message })
}));
```

<script type="text/plain" data-path="frontend/src/hooks/useTacticalLoop.ts">
import { useEffect, useRef } from 'react';
import { useTacticalStore } from '@/stores/tacticalStore';

/**
 * HOOK: USE TACTICAL LOOP
 * Manages the real-time heartbeat of the application.
 * Like a radar sweep, it updates data at a fixed frequency.
 * Only polls if authenticated.
 */
export const useTacticalLoop = (frequencyMs: number = 1000) => {
  const pollStatus = useTacticalStore((state) => state.pollStatus);
  const isAuthenticated = useTacticalStore((state) => state.isAuthenticated);
  const authLoading = useTacticalStore((state) => state.authLoading);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait until auth check is complete

    if (isAuthenticated) {
      // Initial fetch on mount
      pollStatus();

      // Start the interval loop
      timerRef.current = setInterval(() => {
        pollStatus();
      }, frequencyMs);
    } else {
      // If not authenticated, ensure no polling is active
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup on unmount (component destroyed or tab closed)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [pollStatus, frequencyMs, isAuthenticated, authLoading]);
};
