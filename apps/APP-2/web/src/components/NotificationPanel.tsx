import { useState, useEffect } from 'react';
import { 
  BellIcon, CheckIcon, TrashIcon, MessageSquareIcon, HeartIcon,
  UserPlusIcon, FileIcon, PhoneIcon, UsersIcon, WifiIcon, XIcon
} from 'lucide-react';
import { Notification, NotificationType } from '@/types/p2p';
import { getNotifications, markNotificationRead, clearNotifications } from '@/services/api';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  new_message: <MessageSquareIcon size={16} />,
  new_post: <MessageSquareIcon size={16} />,
  post_liked: <HeartIcon size={16} />,
  new_follower: <UserPlusIcon size={16} />,
  mention: <MessageSquareIcon size={16} />,
  file_received: <FileIcon size={16} />,
  download_complete: <FileIcon size={16} />,
  call_incoming: <PhoneIcon size={16} />,
  call_missed: <PhoneIcon size={16} />,
  community_invite: <UsersIcon size={16} />,
  community_message: <UsersIcon size={16} />,
  peer_connected: <WifiIcon size={16} />,
  peer_disconnected: <WifiIcon size={16} />,
};

const notificationColors: Record<NotificationType, string> = {
  new_message: 'text-blue-400',
  new_post: 'text-emerald-400',
  post_liked: 'text-red-400',
  new_follower: 'text-purple-400',
  mention: 'text-amber-400',
  file_received: 'text-cyan-400',
  download_complete: 'text-green-400',
  call_incoming: 'text-emerald-400',
  call_missed: 'text-red-400',
  community_invite: 'text-indigo-400',
  community_message: 'text-indigo-400',
  peer_connected: 'text-emerald-400',
  peer_disconnected: 'text-gray-400',
};

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('[NEXUS] Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (notifId: string) => {
    try {
      await markNotificationRead(notifId);
      setNotifications(notifications.map(n => 
        n.id === notifId ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('[NEXUS] Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationRead(undefined, true);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[NEXUS] Erro ao marcar todas como lidas:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('[NEXUS] Erro ao limpar notificações:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className="absolute right-4 top-16 w-96 bg-[#111] border border-[#222] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon size={18} className="text-emerald-400" />
            <h3 className="text-white font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                <button 
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                  title="Marcar todas como lidas"
                >
                  <CheckIcon size={16} />
                </button>
                <button 
                  onClick={handleClearAll}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Limpar todas"
                >
                  <TrashIcon size={16} />
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-all"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                className={cn(
                  "px-4 py-3 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all cursor-pointer",
                  !notif.read && "bg-emerald-500/5"
                )}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    notif.read ? "bg-[#1a1a1a]" : "bg-emerald-500/20"
                  )}>
                    <span className={notificationColors[notif.type]}>
                      {notificationIcons[notif.type]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      notif.read ? "text-gray-400" : "text-white font-medium"
                    )}>
                      {notif.title}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{notif.body}</p>
                    <p className="text-gray-600 text-xs mt-1">{formatTime(notif.timestamp)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
