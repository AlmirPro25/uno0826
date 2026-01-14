/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    USE STARTER KIT - React Hook                               ║
 * ║                                                                               ║
 * ║              Integração do Marketplace com o fluxo de geração                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useCallback, useEffect } from 'react';
import {
  starterKitService,
  autoSaveGeneration,
  type StarterKit,
  type ClassifyResult,
  type MarketplaceStats,
} from '@/services/StarterKitService';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface UseStarterKitReturn {
  // Estado
  isAvailable: boolean;
  isLoading: boolean;
  lastSavedKit: StarterKit | null;
  lastSavedKitInfo: SavedKitInfo | null;
  stats: MarketplaceStats | null;
  
  // Ações
  saveGeneration: (code: string, prompt: string, options?: SaveOptions) => Promise<StarterKit | null>;
  classifyCode: (code: string, prompt?: string) => Promise<ClassifyResult | null>;
  publishKit: (kitId: string) => Promise<boolean>;
  getMyKits: () => Promise<StarterKit[]>;
  searchKits: (query: string, options?: SearchOptions) => Promise<StarterKit[]>;
  generateReadme: (kitId: string) => Promise<string | null>;
  clearLastSaved: () => void;
  
  // Helpers
  getGradeColor: (grade: string) => string;
  getComplexityLabel: (complexity: string) => string;
  formatPrice: (priceUsd: number) => string;
}

interface SearchOptions {
  limit?: number;
  category?: string;
  minQuality?: number;
}

// Info simplificada do kit salvo (para mostrar no UI)
export interface SavedKitInfo {
  id: string;
  grade: string;
  quality_score: number;
  category: string;
  complexity: string;
  estimated_hours: number;
}

interface SaveOptions {
  readme?: string;
  category?: string;
  modelUsed?: string;
  manifestUsed?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useStarterKit(): UseStarterKitReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedKit, setLastSavedKit] = useState<StarterKit | null>(null);
  const [lastSavedKitInfo, setLastSavedKitInfo] = useState<SavedKitInfo | null>(null);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICAR DISPONIBILIDADE
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const statsData = await starterKitService.getStats();
        setIsAvailable(statsData !== null);
        setStats(statsData);
      } catch {
        setIsAvailable(false);
      }
    };

    checkAvailability();
    
    // Verificar periodicamente
    const interval = setInterval(checkAvailability, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SALVAR GERAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  const saveGeneration = useCallback(async (
    code: string,
    prompt: string,
    options?: SaveOptions
  ): Promise<StarterKit | null> => {
    if (!isAvailable) {
      console.log('[StarterKit] Marketplace não disponível');
      return null;
    }

    setIsLoading(true);
    try {
      const kit = await autoSaveGeneration(code, prompt, options);
      
      if (kit) {
        setLastSavedKit(kit);
        setLastSavedKitInfo({
          id: kit.id,
          grade: kit.classification.grade,
          quality_score: kit.classification.quality_score,
          category: kit.metadata.category,
          complexity: kit.metadata.complexity,
          estimated_hours: kit.metadata.estimated_hours,
        });
        console.log(`[StarterKit] ✅ Salvo: ${kit.id} (Grade: ${kit.classification.grade})`);
        
        // Atualizar stats
        const newStats = await starterKitService.getStats();
        setStats(newStats);
      }
      
      return kit;
    } catch (error) {
      console.error('[StarterKit] Erro ao salvar:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSIFICAR CÓDIGO
  // ═══════════════════════════════════════════════════════════════════════════

  const classifyCode = useCallback(async (
    code: string,
    prompt?: string
  ): Promise<ClassifyResult | null> => {
    if (!isAvailable) return null;

    setIsLoading(true);
    try {
      return await starterKitService.classifyCode(code, prompt);
    } catch (error) {
      console.error('[StarterKit] Erro ao classificar:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLICAR KIT
  // ═══════════════════════════════════════════════════════════════════════════

  const publishKit = useCallback(async (kitId: string): Promise<boolean> => {
    if (!isAvailable) return false;

    setIsLoading(true);
    try {
      const result = await starterKitService.publishKit(kitId);
      
      if (result.success) {
        console.log(`[StarterKit] ✅ Publicado! Preço sugerido: $${result.suggested_price}`);
      } else {
        console.warn('[StarterKit] Não pode ser publicado:', result.reasons);
      }
      
      return result.success;
    } catch (error) {
      console.error('[StarterKit] Erro ao publicar:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LISTAR MEUS KITS
  // ═══════════════════════════════════════════════════════════════════════════

  const getMyKits = useCallback(async (): Promise<StarterKit[]> => {
    if (!isAvailable) return [];

    try {
      return await starterKitService.listMyKits();
    } catch (error) {
      console.error('[StarterKit] Erro ao listar kits:', error);
      return [];
    }
  }, [isAvailable]);

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSCAR KITS
  // ═══════════════════════════════════════════════════════════════════════════

  const searchKits = useCallback(async (
    query: string,
    options?: SearchOptions
  ): Promise<StarterKit[]> => {
    if (!isAvailable) return [];

    setIsLoading(true);
    try {
      return await starterKitService.searchKits({
        query,
        limit: options?.limit,
        category: options?.category,
        minQuality: options?.minQuality,
      });
    } catch (error) {
      console.error('[StarterKit] Erro ao buscar:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GERAR README
  // ═══════════════════════════════════════════════════════════════════════════

  const generateReadme = useCallback(async (kitId: string): Promise<string | null> => {
    if (!isAvailable) return null;

    try {
      return await starterKitService.generateReadme(kitId);
    } catch (error) {
      console.error('[StarterKit] Erro ao gerar README:', error);
      return null;
    }
  }, [isAvailable]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIMPAR ÚLTIMO SALVO
  // ═══════════════════════════════════════════════════════════════════════════

  const clearLastSaved = useCallback(() => {
    setLastSavedKit(null);
    setLastSavedKitInfo(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getGradeColor = useCallback((grade: string): string => {
    const colors: Record<string, string> = {
      A: 'text-green-400 bg-green-400/20',
      B: 'text-blue-400 bg-blue-400/20',
      C: 'text-yellow-400 bg-yellow-400/20',
      D: 'text-orange-400 bg-orange-400/20',
      F: 'text-red-400 bg-red-400/20',
    };
    return colors[grade] || 'text-gray-400 bg-gray-400/20';
  }, []);

  const getComplexityLabel = useCallback((complexity: string): string => {
    const labels: Record<string, string> = {
      low: '🟢 Baixa',
      medium: '🟡 Média',
      high: '🟠 Alta',
      enterprise: '🔴 Enterprise',
    };
    return labels[complexity] || complexity;
  }, []);

  const formatPrice = useCallback((priceUsd: number): string => {
    if (priceUsd === 0) return 'Grátis';
    return `$${priceUsd.toFixed(0)}`;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    isAvailable,
    isLoading,
    lastSavedKit,
    lastSavedKitInfo,
    stats,
    saveGeneration,
    classifyCode,
    publishKit,
    getMyKits,
    searchKits,
    generateReadme,
    clearLastSaved,
    getGradeColor,
    getComplexityLabel,
    formatPrice,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PARA AUTO-SAVE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook que automaticamente salva gerações como Starter Kits.
 * Use em componentes que geram código.
 */
export function useAutoSaveStarterKit(
  code: string | null,
  prompt: string | null,
  options?: SaveOptions
) {
  const { saveGeneration, lastSavedKit, isLoading } = useStarterKit();
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    // Só salva se tiver código novo e substancial
    if (code && prompt && code.length > 100 && !hasSaved) {
      saveGeneration(code, prompt, options).then(kit => {
        if (kit) {
          setHasSaved(true);
        }
      });
    }
  }, [code, prompt, options, saveGeneration, hasSaved]);

  // Reset quando código mudar
  useEffect(() => {
    setHasSaved(false);
  }, [code]);

  return {
    savedKit: lastSavedKit,
    isSaving: isLoading,
    hasSaved,
  };
}

export default useStarterKit;
