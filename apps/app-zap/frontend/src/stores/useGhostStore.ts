import { create } from 'zustand';
import { contactsApi } from '@/services/api/contacts';
import { Contact, Message, SystemLog, DirectiveStatus } from 'shared/types/schema';
import { systemApi } from '@/services/api/system';

/**
 * GHOST STORE - ZUSTAND
 * O Cérebro do Frontend. Gerencia estado global, cache e optimistic updates.
 */

interface GhostState {
  // Dados
  contacts: Contact[];
  activeContactId: string | null;
  messages: Message[];
  logs: SystemLog[];

  // UI States
  isConnected: boolean;
  qrCode: string | null;
  isLoadingMessages: boolean;
  isAgentTyping: { [contactId: string]: boolean }; // Track typing status for each contact

  // Actions
  setConnectionStatus: (status: boolean, qr?: string | null) => void;
  setContacts: (contacts: Contact[]) => void;
  setActiveContact: (id: string) => void;
  handleNewMessage: (msg: Message) => void;
  updateContactStatus: (id: string, isPaused: boolean) => void;
  updateContactDirective: (id: string, directive: string | null, status: DirectiveStatus) => void;
  setAgentTyping: (contactId: string, status: boolean) => void;
  addLog: (log: SystemLog) => void;

  // Async Actions
  fetchContacts: () => Promise<void>;
  fetchHistory: (id: string) => Promise<void>;
  togglePause: (id: string, currentStatus: boolean) => Promise<void>;
  injectDirective: (id: string, instruction: string) => Promise<void>;
  sendMessage: (id: string, message: string) => Promise<void>;
  fetchSystemLogs: () => Promise<void>;
}

export const useGhostStore = create<GhostState>((set, get) => ({
  contacts: [],
  activeContactId: null,
  messages: [],
  logs: [],
  isConnected: false,
  qrCode: null,
  isLoadingMessages: false,
  isAgentTyping: {},

  // --- SETTERS ---
  setConnectionStatus: (status, qr = null) => set({ isConnected: status, qrCode: qr }),
  setContacts: (contacts) => set({ contacts }),

  setActiveContact: (id) => {
    set({ activeContactId: id });
    get().fetchHistory(id);
  },

  handleNewMessage: (msg) => {
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

  updateContactStatus: (id, isPaused) => {
    const contacts = get().contacts.map(c => c.id === id ? { ...c, isPaused } : c);
    set({ contacts });
  },

  updateContactDirective: (id, directive, status) => {
    const contacts = get().contacts.map(c => c.id === id ? {
      ...c,
      activeDirective: directive || c.activeDirective,
      directiveStatus: status
    } : c);
    set({ contacts });
  },

  setAgentTyping: (contactId, status) => {
    set((state) => ({
      isAgentTyping: { ...state.isAgentTyping, [contactId]: status }
    }));
  },

  addLog: (log) => {
    set((state) => ({ logs: [log, ...state.logs].slice(0, 100) })); // Keep last 100 logs
  },

  // --- ASYNC ACTIONS ---

  fetchContacts: async () => {
    try {
      const contacts = await contactsApi.getAll();
      set({ contacts });
    } catch (error) {
      console.error('Failed to fetch contacts', error);
    }
  },

  fetchHistory: async (id) => {
    set({ isLoadingMessages: true, messages: [] });
    try {
      const messages = await contactsApi.getHistory(id);
      set({ messages });
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

      await contactsApi.toggleControl(id, {
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
      await contactsApi.injectDirective(id, { instruction });

      // Optimistic update
      get().updateContactDirective(id, instruction, 'EXECUTING');
    } catch (error) {
      console.error('Failed to inject directive', error);
    }
  },

  sendMessage: async (id, message) => {
    try {
      await contactsApi.sendMessage(id, message);
      // Optimistic update handled by socket or we can do it here
      // Logic for optimistic update (optional since socket will broadcast it back)
    } catch (error) {
      console.error('Failed to send message', error);
    }
  },

  fetchSystemLogs: async () => {
    try {
      const logs = await systemApi.getLogs();
      set({ logs });
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  }
}));
