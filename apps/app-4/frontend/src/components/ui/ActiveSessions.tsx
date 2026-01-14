import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Globe, MapPin, Clock, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from './shadcn/Button';
import { Modal, ConfirmModal } from './Modal';
import { useToast } from './Toast';
import { Skeleton } from './Skeleton';

interface Session {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface ActiveSessionsProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoutAll: () => void;
}

export function ActiveSessions({ isOpen, onClose, onLogoutAll }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock sessions data
    setSessions([
      {
        id: '1',
        device: 'Windows 11',
        deviceType: 'desktop',
        browser: 'Chrome 120',
        location: 'São Paulo, BR',
        ip: '189.xxx.xxx.xxx',
        lastActive: 'Agora',
        isCurrent: true,
      },
      {
        id: '2',
        device: 'iPhone 15',
        deviceType: 'mobile',
        browser: 'Safari',
        location: 'São Paulo, BR',
        ip: '189.xxx.xxx.xxx',
        lastActive: 'Há 2 horas',
        isCurrent: false,
      },
      {
        id: '3',
        device: 'MacBook Pro',
        deviceType: 'desktop',
        browser: 'Firefox 121',
        location: 'Rio de Janeiro, BR',
        ip: '177.xxx.xxx.xxx',
        lastActive: 'Há 3 dias',
        isCurrent: false,
      },
    ]);
    
    setIsLoading(false);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const handleRevokeSession = async (session: Session) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSessions(sessions.filter(s => s.id !== session.id));
    toast.success('Sessão encerrada com sucesso');
    setSessionToRevoke(null);
  };

  const handleLogoutAll = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success('Todas as sessões foram encerradas');
    setShowLogoutAllConfirm(false);
    onLogoutAll();
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Sessões Ativas" size="lg">
        <div className="space-y-4">
          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Estas são as sessões ativas na sua conta. Se você não reconhecer alguma, encerre-a imediatamente.
            </p>
          </div>

          {/* Sessions List */}
          <div className="space-y-3">
            {isLoading ? (
              <>
                <SessionSkeleton />
                <SessionSkeleton />
                <SessionSkeleton />
              </>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border ${
                    session.isCurrent
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        session.isCurrent
                          ? 'bg-green-100 dark:bg-green-800 text-green-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {session.device}
                          </p>
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full">
                              Sessão atual
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {session.browser}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {session.location}
                          </span>
                          <span className="flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            {session.ip}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {session.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToRevoke(session)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          {!isLoading && sessions.length > 1 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowLogoutAllConfirm(true)}
                className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Encerrar todas as outras sessões
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Revoke Session Confirm */}
      <ConfirmModal
        isOpen={!!sessionToRevoke}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={() => sessionToRevoke && handleRevokeSession(sessionToRevoke)}
        title="Encerrar Sessão"
        message={`Deseja encerrar a sessão em ${sessionToRevoke?.device}? O dispositivo será desconectado imediatamente.`}
        confirmText="Encerrar"
        variant="destructive"
      />

      {/* Logout All Confirm */}
      <ConfirmModal
        isOpen={showLogoutAllConfirm}
        onClose={() => setShowLogoutAllConfirm(false)}
        onConfirm={handleLogoutAll}
        title="Encerrar Todas as Sessões"
        message="Isso irá desconectar todos os dispositivos, exceto este. Você precisará fazer login novamente em cada dispositivo."
        confirmText="Encerrar Todas"
        variant="destructive"
      />
    </>
  );
}

function SessionSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start space-x-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="flex space-x-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for profile page
export function ActiveSessionsCompact() {
  const [sessionCount, setSessionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setSessionCount(3);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return <Skeleton className="h-4 w-20" />;
  }

  return (
    <span className="text-sm text-gray-600 dark:text-gray-400">
      {sessionCount} {sessionCount === 1 ? 'dispositivo ativo' : 'dispositivos ativos'}
    </span>
  );
}
