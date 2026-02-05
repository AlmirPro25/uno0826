
import { useEffect, useRef } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useAuthStore } from '@/stores/useAuthStore';

// CYDONIA RHYTHM KEEPER
// Ensures the UI breathes in sync with the server data.

export const useHeartbeat = (intervalMs: number = 3000) => {
  const fetchData = useDataStore((state) => state.fetchData);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Stop pulse if link is severed
    if (!isAuthenticated) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Initial breath
    fetchData();

    // Rhythmic breathing
    timerRef.current = setInterval(() => {
      fetchData();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, intervalMs, fetchData]);
};
