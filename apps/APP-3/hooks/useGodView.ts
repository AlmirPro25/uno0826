/**
 * 👁️ useGodView - Hook para conectar a God View ao sistema real
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getAgentCommunicationHub,
  CollaborationSession,
  CollaborativeAgent,
  AgentMessage,
  AgentArtifact
} from '../services/AgentCommunicationHub';

interface GodViewState {
  isOpen: boolean;
  sessionId: string | null;
  agents: CollaborativeAgent[];
  messages: AgentMessage[];
  artifacts: AgentArtifact[];
  phase: CollaborationSession['phase'];
  isLoading: boolean;
}

interface UseGodViewReturn extends GodViewState {
  openGodView: (sessionId?: string) => void;
  closeGodView: () => void;
  refreshSession: () => void;
  subscribeToSession: (sessionId: string) => void;
}

export function useGodView(): UseGodViewReturn {
  const [state, setState] = useState<GodViewState>({
    isOpen: false,
    sessionId: null,
    agents: [],
    messages: [],
    artifacts: [],
    phase: 'planning',
    isLoading: false
  });

  const hub = getAgentCommunicationHub();

  // Refresh session data
  const refreshSession = useCallback(() => {
    if (!state.sessionId) return;

    const session = hub.getSession(state.sessionId);
    if (!session) return;

    const agents = Array.from(session.agents.values());
    const allArtifacts: AgentArtifact[] = [];
    agents.forEach(agent => {
      allArtifacts.push(...agent.artifacts);
    });

    setState(prev => ({
      ...prev,
      agents,
      messages: session.messageHistory,
      artifacts: allArtifacts,
      phase: session.phase
    }));
  }, [state.sessionId, hub]);

  // Subscribe to session updates (polling for now)
  const subscribeToSession = useCallback((sessionId: string) => {
    setState(prev => ({ ...prev, sessionId, isLoading: true }));
    
    // Initial load
    const session = hub.getSession(sessionId);
    if (session) {
      const agents = Array.from(session.agents.values());
      const allArtifacts: AgentArtifact[] = [];
      agents.forEach(agent => {
        allArtifacts.push(...agent.artifacts);
      });

      setState(prev => ({
        ...prev,
        agents,
        messages: session.messageHistory,
        artifacts: allArtifacts,
        phase: session.phase,
        isLoading: false
      }));
    }
  }, [hub]);

  // Open God View
  const openGodView = useCallback((sessionId?: string) => {
    setState(prev => ({ ...prev, isOpen: true }));
    if (sessionId) {
      subscribeToSession(sessionId);
    }
  }, [subscribeToSession]);

  // Close God View
  const closeGodView = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      sessionId: null,
      agents: [],
      messages: [],
      artifacts: [],
      phase: 'planning'
    }));
  }, []);

  // Auto-refresh when session is active
  useEffect(() => {
    if (!state.isOpen || !state.sessionId) return;

    const interval = setInterval(refreshSession, 1000);
    return () => clearInterval(interval);
  }, [state.isOpen, state.sessionId, refreshSession]);

  return {
    ...state,
    openGodView,
    closeGodView,
    refreshSession,
    subscribeToSession
  };
}

export default useGodView;
