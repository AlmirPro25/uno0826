import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGhostStore } from '@/stores/useGhostStore';
import { Message } from 'shared/types/schema';

/**
 * SOCKET HOOK
 * Gerencia a conexão WebSocket persistente e despacha eventos para a Store.
 */

let socket: Socket;

export const useSocket = () => {
  const {
    setConnectionStatus,
    handleNewMessage,
    fetchContacts,
    setAgentTyping,
    addLog,
    updateContactDirective,
    setContacts
  } = useGhostStore();

  useEffect(() => {
    // Inicializar conexão
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '').replace('/api', '') || 'http://localhost:3001';

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    // Eventos de Conexão
    socket.on('connect', () => {
      console.log('⚡ [GHOST_LINK]: Connected');
      setConnectionStatus(true);
      fetchContacts(); // Atualiza lista ao reconectar
    });

    socket.on('disconnect', () => {
      console.log('🔌 [GHOST_LINK]: Disconnected');
      setConnectionStatus(false);
    });

    // Eventos de Autenticação WhatsApp
    socket.on('qr_code', (data: { url: string }) => {
      setConnectionStatus(false, data.url);
    });

    socket.on('ready', () => {
      setConnectionStatus(true, null);
    });

    // Eventos de Dados em Tempo Real
    socket.on('message_new', (msg: Message) => {
      handleNewMessage(msg);
    });

    // NEW events
    socket.on('agent_typing', (data: { contactId: string, status: boolean }) => {
      setAgentTyping(data.contactId, data.status);
    });

    socket.on('log_entry', (log) => { // If we were streaming logs via socket
      addLog(log);
    });

    socket.on('contact_update', (updatedContacts) => {
      // Here we could merge or replace. For simplicity, we re-fetch or merge.
      // If it's a list, we might want to update specific ones.
      // Assuming updatedContacts is Contact[]
      fetchContacts(); // Safest bet for now or use setContacts to merge
    });

    // Cleanup
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return socket;
};
