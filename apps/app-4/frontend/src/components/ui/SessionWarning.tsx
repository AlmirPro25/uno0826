import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { Button } from './shadcn/Button';

interface SessionWarningProps {
  isOpen: boolean;
  remainingTime: string;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionWarning({ isOpen, remainingTime, onExtend, onLogout }: SessionWarningProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-background rounded-lg shadow-xl p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Sessão Expirando
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sua sessão irá expirar em
              </p>
              
              <div className="text-4xl font-bold text-yellow-600 mb-6">
                {remainingTime}
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Por segurança, você será desconectado automaticamente após o tempo limite.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="flex-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair Agora
                </Button>
                <Button
                  onClick={onExtend}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Continuar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
