import { Contact, Message, ControlPayload, DirectivePayload } from 'shared/types/schema';
import { api } from '@/lib/api'; // Use authenticated api client

/**
 * SERVIÇOS DE DOMÍNIO: CONTATOS
 * Responsável por manipular o estado e controle dos alvos.
 */

export const contactsApi = {
  // Obter todos os contatos monitorados
  getAll: async (): Promise<Contact[]> => {
    const { data } = await api.get<{ contacts: Contact[] }>('/contacts');
    return data.contacts || [];
  },

  // Obter histórico de mensagens (Janela deslizante)
  getHistory: async (id: string): Promise<Message[]> => {
    const { data } = await api.get<{ messages: Message[] }>(`/contacts/${id}/history`);
    return data.messages || [];
  },

  // Controle Manual (Pausar/Retomar IA)
  toggleControl: async (id: string, payload: ControlPayload): Promise<void> => {
    await api.post(`/contacts/${id}/control`, payload);
  },

  // Injeção de Diretiva (Míssil Teleguiado)
  injectDirective: async (id: string, payload: DirectivePayload): Promise<void> => {
    await api.post(`/contacts/${id}/directive`, payload);
  },

  // Enviar Mensagem Manual
  sendMessage: async (id: string, message: string): Promise<void> => {
    await api.post(`/contacts/${id}/message`, { message });
  },
};
