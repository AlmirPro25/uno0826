import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { Button } from './shadcn/Button';
import { useToast } from './Toast';

interface NotificationPermissionProps {
  onPermissionChange?: (permission: NotificationPermission) => void;
}

export function NotificationPermission({ onPermissionChange }: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      onPermissionChange?.(result);

      if (result === 'granted') {
        toast.success('Notificações ativadas!');
        // Send test notification
        new Notification('MediSync', {
          body: 'Você receberá notificações sobre suas consultas',
          icon: '/favicon.ico',
        });
      } else if (result === 'denied') {
        toast.warning('Notificações bloqueadas. Você pode ativar nas configurações do navegador.');
      }
    } catch (error) {
      toast.error('Erro ao solicitar permissão');
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <BellOff className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Notificações</p>
            <p className="text-sm text-gray-500">Não suportado neste navegador</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-3">
        {permission === 'granted' ? (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Bell className="w-5 h-5 text-green-600" />
          </div>
        ) : permission === 'denied' ? (
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <BellOff className="w-5 h-5 text-red-600" />
          </div>
        ) : (
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
          </div>
        )}
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-300">
            Notificações do Navegador
          </p>
          <p className="text-sm text-gray-500">
            {permission === 'granted' && 'Ativadas'}
            {permission === 'denied' && 'Bloqueadas'}
            {permission === 'default' && 'Receba lembretes de consultas'}
          </p>
        </div>
      </div>
      
      {permission === 'granted' ? (
        <span className="flex items-center text-sm text-green-600">
          <Check className="w-4 h-4 mr-1" />
          Ativo
        </span>
      ) : permission === 'denied' ? (
        <span className="flex items-center text-sm text-red-600">
          <X className="w-4 h-4 mr-1" />
          Bloqueado
        </span>
      ) : (
        <Button variant="outline" size="sm" onClick={requestPermission}>
          Ativar
        </Button>
      )}
    </div>
  );
}

// Hook for sending notifications
export function useNotifications() {
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    }
  };

  const scheduleNotification = (title: string, options: NotificationOptions, delay: number) => {
    return setTimeout(() => {
      sendNotification(title, options);
    }, delay);
  };

  return { sendNotification, scheduleNotification };
}
