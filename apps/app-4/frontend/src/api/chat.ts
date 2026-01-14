import { axiosInstance } from './axios';

// Types
export interface ChatMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    message_type: 'text' | 'image' | 'file' | 'audio' | 'location';
    file_url?: string;
    file_name?: string;
    file_size?: number;
    read: boolean;
    read_at?: string;
    starred: boolean;
    reply_to_id?: number;
    reply_to?: ChatMessage;
    created_at: string;
    updated_at: string;
}

export interface ChatConversation {
    id: number;
    participant_1_id: number;
    participant_2_id: number;
    participant: ChatParticipant;
    last_message?: string;
    last_message_at?: string;
    unread_count: number;
    is_muted: boolean;
    is_blocked: boolean;
    created_at: string;
    updated_at: string;
}

export interface ChatParticipant {
    id: number;
    full_name: string;
    email: string;
    role: 'ADMIN' | 'MEDICO' | 'PACIENTE';
    avatar_url?: string;
    specialty?: string;
    online?: boolean;
    last_seen?: string;
    typing?: boolean;
}

export interface ChatContact {
    id: number;
    user_id: number;
    contact_id: number;
    contact: ChatParticipant;
    nickname?: string;
    is_favorite: boolean;
    created_at: string;
}

export interface FollowedClinic {
    id: number;
    user_id: number;
    clinic_id: number;
    clinic: {
        id: number;
        name: string;
        avatar_url?: string;
        specialty?: string;
        rating?: number;
    };
    notifications_enabled: boolean;
    created_at: string;
}

// API Functions

// Conversations
export const getConversations = async (): Promise<ChatConversation[]> => {
    const response = await axiosInstance.get('/chat/conversations');
    return response.data;
};

export const getConversation = async (conversationId: number): Promise<ChatConversation> => {
    const response = await axiosInstance.get(`/chat/conversations/${conversationId}`);
    return response.data;
};

export const createConversation = async (participantId: number): Promise<ChatConversation> => {
    const response = await axiosInstance.post('/chat/conversations', { participant_id: participantId });
    return response.data;
};

export const deleteConversation = async (conversationId: number): Promise<void> => {
    await axiosInstance.delete(`/chat/conversations/${conversationId}`);
};

export const muteConversation = async (conversationId: number, muted: boolean): Promise<void> => {
    await axiosInstance.put(`/chat/conversations/${conversationId}/mute`, { muted });
};

export const blockConversation = async (conversationId: number, blocked: boolean): Promise<void> => {
    await axiosInstance.put(`/chat/conversations/${conversationId}/block`, { blocked });
};

// Messages
export const getMessages = async (conversationId: number, page = 1, limit = 50): Promise<ChatMessage[]> => {
    const response = await axiosInstance.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page, limit }
    });
    return response.data;
};

export const sendMessage = async (
    conversationId: number,
    content: string,
    type: ChatMessage['message_type'] = 'text',
    replyToId?: number
): Promise<ChatMessage> => {
    const response = await axiosInstance.post(`/chat/conversations/${conversationId}/messages`, {
        content,
        message_type: type,
        reply_to_id: replyToId
    });
    return response.data;
};

export const sendFileMessage = async (
    conversationId: number,
    file: File,
    type: 'image' | 'file' | 'audio'
): Promise<ChatMessage> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message_type', type);

    const response = await axiosInstance.post(
        `/chat/conversations/${conversationId}/messages/file`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const markAsRead = async (conversationId: number): Promise<void> => {
    await axiosInstance.put(`/chat/conversations/${conversationId}/read`);
};

export const markMessageAsRead = async (messageId: number): Promise<void> => {
    await axiosInstance.put(`/chat/messages/${messageId}/read`);
};

export const starMessage = async (messageId: number, starred: boolean): Promise<void> => {
    await axiosInstance.put(`/chat/messages/${messageId}/star`, { starred });
};

export const deleteMessage = async (messageId: number): Promise<void> => {
    await axiosInstance.delete(`/chat/messages/${messageId}`);
};

// Contacts
export const getContacts = async (): Promise<ChatContact[]> => {
    const response = await axiosInstance.get('/chat/contacts');
    return response.data;
};

export const addContact = async (contactId: number, nickname?: string): Promise<ChatContact> => {
    const response = await axiosInstance.post('/chat/contacts', { contact_id: contactId, nickname });
    return response.data;
};

export const removeContact = async (contactId: number): Promise<void> => {
    await axiosInstance.delete(`/chat/contacts/${contactId}`);
};

export const updateContact = async (contactId: number, data: { nickname?: string; is_favorite?: boolean }): Promise<ChatContact> => {
    const response = await axiosInstance.put(`/chat/contacts/${contactId}`, data);
    return response.data;
};

// Search
export const searchUsers = async (query: string, role?: string): Promise<ChatParticipant[]> => {
    const response = await axiosInstance.get('/chat/search/users', {
        params: { q: query, role }
    });
    return response.data;
};

export const searchMessages = async (query: string, conversationId?: number): Promise<ChatMessage[]> => {
    const response = await axiosInstance.get('/chat/search/messages', {
        params: { q: query, conversation_id: conversationId }
    });
    return response.data;
};

// Followed Clinics
export const getFollowedClinics = async (): Promise<FollowedClinic[]> => {
    const response = await axiosInstance.get('/chat/clinics/followed');
    return response.data;
};

export const followClinic = async (clinicId: number): Promise<FollowedClinic> => {
    const response = await axiosInstance.post(`/chat/clinics/${clinicId}/follow`);
    return response.data;
};

export const unfollowClinic = async (clinicId: number): Promise<void> => {
    await axiosInstance.delete(`/chat/clinics/${clinicId}/follow`);
};

export const toggleClinicNotifications = async (clinicId: number, enabled: boolean): Promise<void> => {
    await axiosInstance.put(`/chat/clinics/${clinicId}/notifications`, { enabled });
};

// Typing indicator
export const sendTypingIndicator = async (conversationId: number, typing: boolean): Promise<void> => {
    await axiosInstance.post(`/chat/conversations/${conversationId}/typing`, { typing });
};

// Online status
export const updateOnlineStatus = async (online: boolean): Promise<void> => {
    await axiosInstance.put('/chat/status', { online });
};

// Unread count
export const getTotalUnreadCount = async (): Promise<number> => {
    const response = await axiosInstance.get('/chat/unread-count');
    return response.data.count;
};
