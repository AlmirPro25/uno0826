
import { create } from 'zustand';
import { Contact, Message, SystemLog } from '@/types';
import { api } from './api';

interface State {
  // Dados
  contacts: Contact[];
  activeContactId: string | null;
  messages: Message[];
  logs: SystemLog[];
  
  // UI States
  isConnected: boolean;
  qrCode: string | null;
  isLoadingMessages: boolean;
  
  // Actions
  setContacts: (contacts: Contact[]) => void;
  setActiveContact: (id: string) => void;
  addMessage: (msg: Message) => void;
  updateContactStatus: (id: string, isPaused: boolean) => void;
  setQrCode: (url: string | null) => void;
  setIsConnected: (status: boolean) => void;
  
  // Async Actions
  fetchContacts: () => Promise<void>;
  fetchHistory: (id: string) => Promise<void>;
  togglePause: (id: string, currentStatus: boolean) => Promise<void>;
  injectDirective: (id: string, instruction: string) => Promise<void>;
}

export const useStore = create<State>((set, get) => ({
  contacts: [],
  activeContactId: null,
  messages: [],
  logs: [],
  isConnected: false,
  qrCode: null,
  isLoadingMessages: false,

  setContacts: (contacts) => set({ contacts }),
  setActiveContact: (id) => {
    set({ activeContactId: id });
    get().fetchHistory(id);
  },
  addMessage: (msg) => {
    const { activeContactId, messages, contacts } = get();
    
    // Atualiza lista de mensagens se for o chat ativo
    if (activeContactId === msg.contactId) {
        set({ messages: [...messages, msg] });
    }

    // Atualiza a lista de contatos (reordena por última msg)
    const updatedContacts = contacts.map(c => 
        c.id === msg.contactId 
        ? { ...c, lastInteraction: msg.timestamp } 
        : c
    ).sort((a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime());
    
    set({ contacts: updatedContacts });
  },
  
  setQrCode: (url) => set({ qrCode: url }),
  setIsConnected: (status) => set({ isConnected: status }),
  updateContactStatus: (id, isPaused) => {
      const contacts = get().contacts.map(c => c.id === id ? { ...c, isPaused } : c);
      set({ contacts });
  },

  fetchContacts: async () => {
    try {
      const res = await api.get('/contacts');
      set({ contacts: res.data });
    } catch (error) {
      console.error('Failed to fetch contacts', error);
    }
  },

  fetchHistory: async (id) => {
    set({ isLoadingMessages: true, messages: [] });
    try {
      const res = await api.get(`/contacts/${id}/history`);
      set({ messages: res.data });
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  togglePause: async (id, currentStatus) => {
      try {
          const newStatus = !currentStatus;
          // Optimistic update
          get().updateContactStatus(id, newStatus);
          
          await api.post(`/contacts/${id}/control`, { 
              action: newStatus ? 'PAUSE' : 'RESUME' 
          });
      } catch (error) {
          // Revert on error
          get().updateContactStatus(id, currentStatus);
          console.error('Failed to toggle pause', error);
      }
  },

  injectDirective: async (id, instruction) => {
      try {
          await api.post(`/contacts/${id}/directive`, { instruction });
          // Optimistic update local (opcional)
      } catch (error) {
          console.error('Failed to inject directive', error);
      }
  }
}));
