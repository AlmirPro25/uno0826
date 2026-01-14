import React, { useState, useEffect, createContext, useContext } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove após duração especificada
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-500 bg-green-900/20';
      case 'error':
        return 'border-red-500 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'info':
        return 'border-blue-500 bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getColors()}
        border rounded-lg p-4 backdrop-blur-sm shadow-lg
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm">{notification.title}</h4>
          <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-purple-400 hover:text-purple-300 text-sm mt-2 underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Hook para notificações comuns
export const useCommonNotifications = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message: string) => 
      addNotification({ type: 'success', title, message }),
    
    error: (title: string, message: string) => 
      addNotification({ type: 'error', title, message, duration: 8000 }),
    
    warning: (title: string, message: string) => 
      addNotification({ type: 'warning', title, message }),
    
    info: (title: string, message: string) => 
      addNotification({ type: 'info', title, message }),
    
    projectGenerated: (projectName: string) => 
      addNotification({
        type: 'success',
        title: 'Projeto Gerado!',
        message: `${projectName} foi criado com sucesso.`,
        action: {
          label: 'Ver Código',
          onClick: () => {
            // Scroll para o código ou mudar tab
            const codeTab = document.querySelector('[data-tab="code"]') as HTMLElement;
            codeTab?.click();
          }
        }
      }),
    
    exportCompleted: (format: string) => 
      addNotification({
        type: 'success',
        title: 'Exportação Concluída!',
        message: `Projeto exportado como ${format}.`,
        duration: 3000
      }),
    
    templateApplied: (templateName: string) => 
      addNotification({
        type: 'info',
        title: 'Template Aplicado',
        message: `Configurações do template "${templateName}" foram carregadas.`,
        duration: 3000
      }),
    
    settingsSaved: () => 
      addNotification({
        type: 'success',
        title: 'Configurações Salvas',
        message: 'Suas preferências foram atualizadas.',
        duration: 2000
      }),
    
    projectShared: (url: string) => 
      addNotification({
        type: 'success',
        title: 'Projeto Compartilhado!',
        message: 'Link copiado para a área de transferência.',
        action: {
          label: 'Abrir Link',
          onClick: () => window.open(url, '_blank')
        }
      })
  };
};