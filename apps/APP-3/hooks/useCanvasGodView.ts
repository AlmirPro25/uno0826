/**
 * 👁️ USE CANVAS GOD VIEW - Hook para gerenciar o God View no Canvas
 * 
 * Conecta com o sistema real de geração para mostrar dados em tempo real
 */

import { useState, useEffect, useCallback } from 'react';
import type { CanvasAgent, CanvasMessage, CanvasArtifact } from '../components/GodView/CanvasGodView';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface GodViewState {
  isVisible: boolean;
  phase: string;
  progress: number;
  status: string;
  agents: CanvasAgent[];
  messages: CanvasMessage[];
  artifacts: CanvasArtifact[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN CONFIGS
// ═══════════════════════════════════════════════════════════════════════════════

const DOMAIN_COLORS: Record<string, string> = {
  coordinator: '#8b5cf6',
  research: '#06b6d4',
  architect: '#3b82f6',
  frontend: '#10b981',
  backend: '#84cc16',
  database: '#ef4444',
  quality: '#f59e0b',
  integration: '#ec4899'
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STATE (para ser acessado de qualquer lugar)
// ═══════════════════════════════════════════════════════════════════════════════

let globalGodViewState: GodViewState = {
  isVisible: false,
  phase: 'Idle',
  progress: 0,
  status: 'Aguardando...',
  agents: [],
  messages: [],
  artifacts: []
};

let globalListeners: Set<(state: GodViewState) => void> = new Set();

function notifyListeners() {
  globalListeners.forEach(listener => listener({ ...globalGodViewState }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API - Para ser chamada pelo GeminiService/Pipeline
// ═══════════════════════════════════════════════════════════════════════════════

export const godViewAPI = {
  // Iniciar God View
  start(prompt: string) {
    globalGodViewState = {
      isVisible: true,
      phase: 'Inicializando',
      progress: 0,
      status: 'Analisando requisitos...',
      agents: [
        { id: 'coord', name: 'Coordenador', domain: 'coordinator', status: 'working', artifacts: 0, color: DOMAIN_COLORS.coordinator }
      ],
      messages: [],
      artifacts: []
    };
    notifyListeners();
  },

  // Atualizar fase
  setPhase(phase: string, progress: number, status: string) {
    globalGodViewState.phase = phase;
    globalGodViewState.progress = progress;
    globalGodViewState.status = status;
    notifyListeners();
  },

  // Adicionar agente
  addAgent(id: string, name: string, domain: string) {
    const exists = globalGodViewState.agents.find(a => a.id === id);
    if (!exists) {
      globalGodViewState.agents.push({
        id,
        name,
        domain,
        status: 'idle',
        artifacts: 0,
        color: DOMAIN_COLORS[domain] || '#6b7280'
      });
      notifyListeners();
    }
  },

  // Atualizar status do agente
  updateAgentStatus(id: string, status: 'idle' | 'working' | 'waiting' | 'done') {
    const agent = globalGodViewState.agents.find(a => a.id === id);
    if (agent) {
      agent.status = status;
      notifyListeners();
    }
  },

  // Adicionar mensagem
  addMessage(from: string, to: string, content: string, type: 'request' | 'response' | 'artifact' | 'contract' = 'request') {
    globalGodViewState.messages.push({
      id: `msg_${Date.now()}`,
      from,
      to,
      content,
      type
    });
    // Manter apenas últimas 10 mensagens
    if (globalGodViewState.messages.length > 10) {
      globalGodViewState.messages = globalGodViewState.messages.slice(-10);
    }
    notifyListeners();
  },

  // Adicionar artefato
  addArtifact(name: string, type: string, preview: string, agentId: string) {
    const agent = globalGodViewState.agents.find(a => a.id === agentId);
    globalGodViewState.artifacts.push({
      id: `art_${Date.now()}`,
      name,
      type,
      preview: preview.substring(0, 200),
      agentName: agent?.name || 'Sistema'
    });
    if (agent) {
      agent.artifacts++;
    }
    notifyListeners();
  },

  // Finalizar
  finish(success: boolean = true) {
    globalGodViewState.phase = success ? 'Concluído' : 'Erro';
    globalGodViewState.progress = 100;
    globalGodViewState.status = success ? 'Código gerado com sucesso!' : 'Erro na geração';
    globalGodViewState.agents.forEach(a => a.status = 'done');
    notifyListeners();
    
    // Auto-hide após 2 segundos
    setTimeout(() => {
      globalGodViewState.isVisible = false;
      notifyListeners();
    }, 2000);
  },

  // Resetar
  reset() {
    globalGodViewState = {
      isVisible: false,
      phase: 'Idle',
      progress: 0,
      status: 'Aguardando...',
      agents: [],
      messages: [],
      artifacts: []
    };
    notifyListeners();
  },

  // Toggle visibilidade
  toggle() {
    globalGodViewState.isVisible = !globalGodViewState.isVisible;
    notifyListeners();
  },

  // Obter estado atual
  getState(): GodViewState {
    return { ...globalGodViewState };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useCanvasGodView() {
  const [state, setState] = useState<GodViewState>(globalGodViewState);

  useEffect(() => {
    const listener = (newState: GodViewState) => setState(newState);
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  const toggle = useCallback(() => {
    godViewAPI.toggle();
  }, []);

  return {
    ...state,
    toggle,
    api: godViewAPI
  };
}

export default useCanvasGodView;
