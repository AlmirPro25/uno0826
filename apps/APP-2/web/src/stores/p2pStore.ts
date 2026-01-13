
import { create } from 'zustand';
import { Peer, Message, P2PNodeStatus } from '@/types/p2p';

// ============================================================================
// P2P Store - Estado global para conexões P2P e chamadas
// ============================================================================

interface CallState {
  isInCall: boolean;
  callType: 'audio' | 'video' | null;
  remotePeerId: string | null;
  roomId: string | null;
  startedAt: Date | null;
}

interface P2PState {
  // Node state
  localPeerId: string | null;
  connectedPeers: Peer[];
  messages: Message[];
  apiStatus: P2PNodeStatus | null;
  
  // Call state
  call: CallState;
  
  // Node actions
  setLocalPeerId: (id: string | null) => void;
  setConnectedPeers: (peers: Peer[]) => void;
  addMessage: (message: Message) => void;
  setApiStatus: (status: P2PNodeStatus) => void;
  
  // Call actions
  startCall: (type: 'audio' | 'video', remotePeerId: string, roomId?: string) => void;
  endCall: () => void;
}

const initialCallState: CallState = {
  isInCall: false,
  callType: null,
  remotePeerId: null,
  roomId: null,
  startedAt: null,
};

export const useP2PStore = create<P2PState>((set) => ({
  // Initial state
  localPeerId: null,
  connectedPeers: [],
  messages: [],
  apiStatus: null,
  call: initialCallState,
  
  // Node actions
  setLocalPeerId: (id) => set({ localPeerId: id }),
  setConnectedPeers: (peers) => set({ connectedPeers: peers }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setApiStatus: (status) => set({ apiStatus: status }),
  
  // Call actions
  startCall: (type, remotePeerId, roomId) => set({
    call: {
      isInCall: true,
      callType: type,
      remotePeerId,
      roomId: roomId || null,
      startedAt: new Date(),
    }
  }),
  endCall: () => set({ call: initialCallState }),
}));
