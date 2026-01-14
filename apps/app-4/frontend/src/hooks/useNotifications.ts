import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "@/api/axios";

// Types
export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: "appointment" | "message" | "system" | "alert" | "reminder" | "triage" | "queue_call";
    priority: "low" | "normal" | "high" | "urgent";
    read: boolean;
    data?: string;
    link?: string;
    created_at: string;
    read_at?: string;
}

interface UseNotificationsOptions {
    autoFetch?: boolean;
    pollInterval?: number; // ms
}

export function useNotifications(options: UseNotificationsOptions = { autoFetch: true, pollInterval: 30000 }) {
    const { token, isAuthenticated, _hasHydrated } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasFetchedRef = useRef(false);

    // Check auth state at call time, not at hook initialization
    const checkCanFetch = useCallback(() => {
        // Must be hydrated, authenticated, and have a token
        if (!_hasHydrated || !isAuthenticated || !token) {
            return false;
        }
        return true;
    }, [_hasHydrated, isAuthenticated, token]);

    // Fetch notifications
    const fetchNotifications = useCallback(async (page = 1, pageSize = 20, unreadOnly = false) => {
        if (!checkCanFetch()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axiosInstance.get("/notifications", {
                params: { page, page_size: pageSize, unread_only: unreadOnly }
            });
            setNotifications(response.data.notifications || response.data || []);
            return response.data;
        } catch (err: any) {
            // Don't set error for 401 - it's handled by axios interceptor
            if (err.response?.status !== 401) {
                setError(err.message || "Failed to fetch notifications");
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [checkCanFetch]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!checkCanFetch()) return;

        try {
            const response = await axiosInstance.get("/notifications/unread-count");
            setUnreadCount(response.data.unread_count || 0);
        } catch (err: any) {
            // Silently fail for 401 errors
            if (err.response?.status !== 401) {
                console.error("Failed to fetch unread count:", err);
            }
        }
    }, [checkCanFetch]);

    // Mark as read
    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            await axiosInstance.put(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await axiosInstance.put("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    }, []);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId: number) => {
        try {
            await axiosInstance.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            // Update unread count if the deleted notification was unread
            const notification = notifications.find(n => n.id === notificationId);
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    }, [notifications]);

    // Add notification from WebSocket
    const addNotification = useCallback((notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.read) {
            setUnreadCount(prev => prev + 1);
        }
    }, []);

    // Auto-fetch on mount - wait for hydration and authentication
    useEffect(() => {
        if (!options.autoFetch) return;
        if (hasFetchedRef.current) return;
        if (!_hasHydrated) return;
        if (!isAuthenticated || !token) return;
        
        hasFetchedRef.current = true;
        fetchNotifications();
        fetchUnreadCount();
    }, [options.autoFetch, _hasHydrated, isAuthenticated, token, fetchNotifications, fetchUnreadCount]);

    // Polling for updates - only when authenticated
    useEffect(() => {
        // Clear any existing interval first
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Don't set up polling if conditions aren't met
        if (!options.pollInterval || options.pollInterval === 0) return;
        if (!_hasHydrated) return;
        if (!isAuthenticated || !token) return;

        intervalRef.current = setInterval(() => {
            // Double-check auth state before each fetch
            if (isAuthenticated && token) {
                fetchUnreadCount();
            }
        }, options.pollInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [options.pollInterval, _hasHydrated, isAuthenticated, token, fetchUnreadCount]);

    // Get notification icon based on type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "appointment":
                return "📅";
            case "message":
                return "💬";
            case "system":
                return "⚙️";
            case "alert":
                return "⚠️";
            case "reminder":
                return "⏰";
            case "triage":
                return "🏥";
            case "queue_call":
                return "📢";
            default:
                return "🔔";
        }
    };

    // Get notification priority color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent":
                return "text-red-500";
            case "high":
                return "text-orange-500";
            case "normal":
                return "text-blue-500";
            case "low":
                return "text-gray-500";
            default:
                return "text-gray-500";
        }
    };

    // Format relative time
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "agora";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString("pt-BR");
    };

    return {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        getNotificationIcon,
        getPriorityColor,
        formatRelativeTime,
    };
}
