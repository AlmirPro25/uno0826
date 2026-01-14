import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" message briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Conexão restaurada</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Você está offline. Algumas funcionalidades podem não estar disponíveis.</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for checking connection status
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Compact indicator for header/footer
export function ConnectionIndicator() {
  const isOnline = useConnectionStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center space-x-1 text-red-500 text-xs">
      <WifiOff className="w-3 h-3" />
      <span>Offline</span>
    </div>
  );
}

// Retry button for failed requests
interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function RetryButton({ onRetry, isRetrying }: RetryButtonProps) {
  return (
    <button
      onClick={onRetry}
      disabled={isRetrying}
      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
      <span>{isRetrying ? 'Tentando...' : 'Tentar novamente'}</span>
    </button>
  );
}
