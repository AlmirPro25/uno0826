import { useState } from 'react';
import { Bell, UserPlus, Heart, MessageCircle, Zap, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  avatar?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'follow',
    title: 'Novo seguidor',
    message: 'CyberNinja começou a seguir você',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isRead: false,
  },
  {
    id: '2',
    type: 'like',
    title: 'Curtida',
    message: 'NeonHacker curtiu seu post',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
  },
  {
    id: '3',
    type: 'system',
    title: 'Novo peer conectado',
    message: 'DataPhantom entrou na mesh',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    isRead: true,
  },
  {
    id: '4',
    type: 'comment',
    title: 'Comentário',
    message: 'GhostNode comentou: "Muito bom!"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isRead: true,
  },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow': return UserPlus;
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'system': return Zap;
      default: return Bell;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'follow': return 'text-cyan-400 bg-cyan-500/20';
      case 'like': return 'text-pink-400 bg-pink-500/20';
      case 'comment': return 'text-purple-400 bg-purple-500/20';
      case 'system': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} não lidas</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
          >
            <Check size={14} className="inline mr-1" />
            Marcar todas
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
            filter === 'all'
              ? "bg-white/10 text-white"
              : "text-gray-500 hover:text-gray-300"
          )}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            "flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
            filter === 'unread'
              ? "bg-white/10 text-white"
              : "text-gray-500 hover:text-gray-300"
          )}
        >
          Não lidas
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer group",
                  notification.isRead
                    ? "bg-white/5 border-white/10"
                    : "bg-cyan-500/5 border-cyan-500/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    getIconColor(notification.type)
                  )}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{notification.message}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {!notification.isRead && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-400" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Bell size={28} className="text-gray-500" />
          </div>
          <h3 className="font-semibold mb-2">Nenhuma notificação</h3>
          <p className="text-sm text-gray-500">
            {filter === 'unread' 
              ? 'Você leu todas as notificações!'
              : 'Suas notificações aparecerão aqui'}
          </p>
        </div>
      )}
    </div>
  );
}
