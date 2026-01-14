/**
 * Hook para usar contexto dinâmico do Gemini Maestro
 * Injeta inteligência no System Prompt do Gemini Live
 */

import { useState, useEffect, useCallback } from 'react';
import { backendService } from '../services/backendService';

export interface DynamicContextConfig {
  enabled: boolean;
  refreshInterval?: number; // ms para atualizar o contexto
  userId?: number;
}

export function useDynamicContext(config: DynamicContextConfig = { enabled: true }) {
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega o System Instruction do backend
  const loadSystemInstruction = useCallback(async () => {
    if (!config.enabled) {
      setSystemInstruction('You are a helpful AI assistant.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const instruction = await backendService.getSystemInstruction(config.userId || 1);
      setSystemInstruction(instruction);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar contexto:', err);
      setError(err.message);
      // Fallback para instrução básica
      setSystemInstruction('You are a helpful AI assistant who sees the user\'s screen.');
    } finally {
      setIsLoading(false);
    }
  }, [config.enabled, config.userId]);

  // Carrega na montagem
  useEffect(() => {
    loadSystemInstruction();
  }, [loadSystemInstruction]);

  // Atualiza periodicamente se configurado
  useEffect(() => {
    if (!config.refreshInterval || !config.enabled) return;

    const interval = setInterval(() => {
      loadSystemInstruction();
    }, config.refreshInterval);

    return () => clearInterval(interval);
  }, [config.refreshInterval, config.enabled, loadSystemInstruction]);

  // Adiciona ao contexto de curto prazo
  const addToContext = useCallback(async (content: string, relevanceScore: number = 1.0) => {
    if (!config.enabled) return;
    
    try {
      await backendService.addToShortTermContext(content, relevanceScore);
    } catch (err) {
      console.error('Erro ao adicionar contexto:', err);
    }
  }, [config.enabled]);

  // Atualiza perfil baseado em conversa
  const updateProfile = useCallback(async (conversation: string) => {
    if (!config.enabled) return;
    
    try {
      await backendService.updateProfileFromConversation(conversation);
      // Recarrega o system instruction após atualizar o perfil
      await loadSystemInstruction();
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
    }
  }, [config.enabled, loadSystemInstruction]);

  // Busca contexto relevante para uma query
  const getRelevantContext = useCallback(async (query: string, limit: number = 3): Promise<string> => {
    if (!config.enabled) return '';
    
    try {
      return await backendService.getRelevantContext(query, limit);
    } catch (err) {
      console.error('Erro ao buscar contexto relevante:', err);
      return '';
    }
  }, [config.enabled]);

  // Força reload do contexto
  const refresh = useCallback(() => {
    loadSystemInstruction();
  }, [loadSystemInstruction]);

  return {
    systemInstruction,
    isLoading,
    error,
    addToContext,
    updateProfile,
    getRelevantContext,
    refresh
  };
}
