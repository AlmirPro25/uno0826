
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useFleetStore } from '../stores/useFleetStore';
import { FleetUpdatePayload } from '../../../../shared/types';

const SOCKET_URL = 'http://localhost:3000';

/**
 * HOOK: REAL-TIME UPLINK
 * Connects to the Command Center WebSocket and syncs fleet state.
 */
export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const updateTelemetry = useFleetStore((state) => state.updateAssetTelemetry);

  useEffect(() => {
    // Initialize Uplink
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    // Event: Connection Established
    socketRef.current.on('connect', () => {
      console.log('[TITAN UPLINK] Secure connection established.');
    });

    // Event: Fleet Telemetry Update
    socketRef.current.on('fleet_update', (payload: FleetUpdatePayload[]) => {
      // Process batch updates
      payload.forEach(update => {
        updateTelemetry(update);
      });
    });

    // Event: Disconnect
    socketRef.current.on('disconnect', () => {
      console.warn('[TITAN UPLINK] Signal lost. Attempting recon...');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [updateTelemetry]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false
  };
};
