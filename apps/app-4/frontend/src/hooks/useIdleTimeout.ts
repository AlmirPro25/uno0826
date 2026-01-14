import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleTimeoutOptions {
  timeout: number; // in milliseconds
  onIdle?: () => void;
  onActive?: () => void;
  events?: string[];
}

const DEFAULT_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
];

export function useIdleTimeout({
  timeout,
  onIdle,
  onActive,
  events = DEFAULT_EVENTS,
}: UseIdleTimeoutOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isIdleRef.current) {
      isIdleRef.current = false;
      setIsIdle(false);
      onActive?.();
    }

    setLastActivity(Date.now());

    timeoutRef.current = setTimeout(() => {
      isIdleRef.current = true;
      setIsIdle(true);
      onIdle?.();
    }, timeout);
  }, [timeout, onIdle, onActive]);

  useEffect(() => {
    // Set up event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Start the timer
    resetTimer();

    return () => {
      // Clean up
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [events, resetTimer]);

  const getIdleTime = useCallback(() => {
    return Date.now() - lastActivity;
  }, [lastActivity]);

  return {
    isIdle,
    lastActivity,
    getIdleTime,
    resetTimer,
  };
}

// Hook for auto-logout after inactivity
interface UseAutoLogoutOptions {
  timeout?: number; // default 30 minutes
  warningTime?: number; // show warning X ms before logout
  onWarning?: () => void;
  onLogout: () => void;
}

export function useAutoLogout({
  timeout = 30 * 60 * 1000, // 30 minutes
  warningTime = 5 * 60 * 1000, // 5 minutes before
  onWarning,
  onLogout,
}: UseAutoLogoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeout);
  const warningShownRef = useRef(false);

  const handleIdle = useCallback(() => {
    onLogout();
  }, [onLogout]);

  const handleActive = useCallback(() => {
    setShowWarning(false);
    warningShownRef.current = false;
    setRemainingTime(timeout);
  }, [timeout]);

  const { isIdle, lastActivity, resetTimer } = useIdleTimeout({
    timeout,
    onIdle: handleIdle,
    onActive: handleActive,
  });

  // Update remaining time and show warning
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const remaining = Math.max(0, timeout - elapsed);
      setRemainingTime(remaining);

      // Show warning when approaching timeout
      if (remaining <= warningTime && remaining > 0 && !warningShownRef.current) {
        warningShownRef.current = true;
        setShowWarning(true);
        onWarning?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, timeout, warningTime, onWarning]);

  const extendSession = useCallback(() => {
    resetTimer();
    setShowWarning(false);
    warningShownRef.current = false;
  }, [resetTimer]);

  return {
    isIdle,
    showWarning,
    remainingTime,
    extendSession,
    formatRemainingTime: () => {
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  };
}
