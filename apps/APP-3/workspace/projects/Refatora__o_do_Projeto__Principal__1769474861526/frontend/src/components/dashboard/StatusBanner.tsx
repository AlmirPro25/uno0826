
import { AlertTriangle, WifiOff } from 'lucide-react';
import { useTacticalStore } from '@/stores/tacticalStore';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * COMPONENT: STATUS BANNER
 * Displays critical system errors or connectivity issues.
 * Place this at the top of the App layout.
 */
export const StatusBanner = () => {
  const { error, clearError } = useTacticalStore();

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-aegis-alert/20 border-b border-aegis-alert text-aegis-alert overflow-hidden"
        >
          <div className="container mx-auto px-4 py-2 flex items-center justify-between text-xs font-bold tracking-widest">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              <span>SYSTEM ALERT: {error}</span>
            </div>
            <button 
              onClick={clearError}
              className="hover:bg-aegis-alert hover:text-black px-2 py-1 rounded"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
